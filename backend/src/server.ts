import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { z, type ZodError } from "zod";

import { config } from "./config.js";
import { avisoPorCambioDeEstado, NotificadorExpoPush, type CambioDeEstado } from "./notificaciones.js";
import { AlmacenTokensPushSupabase } from "./push-tokens.js";
import { createAdminClient, createRequestClient } from "./supabase.js";
import { transicionarReporte } from "./reporte-state.js";
import {
  esFirmaSvgValida,
  esTransicionTrabajoValida,
  MENSAJE_SOLO_ADMIN,
  puedeTransicionarPorRol,
  type EstadoTrabajoServidor,
} from "./trabajo-state.js";
import {
  clienteSchema,
  credentialsSchema,
  ordenSchema,
  patchSchema,
  registerSchema,
  reporteAccionSchema,
  syncOperationSchema,
  tecnicoCreateSchema,
  tokenPushSchema,
  tecnicoUpdateSchema,
} from "./validation.js";

const tokensPush = new AlmacenTokensPushSupabase();
const notificador = new NotificadorExpoPush(tokensPush, process.env.EXPO_ACCESS_TOKEN);

// Avisa según el cambio de estado. Nunca lanza: el cambio ya se guardó y un
// aviso fallido no debe convertir la respuesta en un error.
async function avisarCambioDeEstado(cambio: CambioDeEstado) {
  try {
    const decision = avisoPorCambioDeEstado(cambio);
    if (!decision) return;
    const destinatarios = decision.destinatario === "tecnico"
      ? [cambio.tecnicoId]
      : (await tokensPush.idsDeAdministradores()).filter((id) => id !== cambio.actorId);
    await Promise.all(destinatarios.map((id) => notificador.avisar(id, decision.aviso)));
  } catch (error) {
    console.error("No se pudo preparar el aviso push:", error instanceof Error ? error.message : error);
  }
}

const app = express();
const apiRevision = "tecnicos-admin-r1";
const startedAt = new Date().toISOString();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use((_request, response, next) => {
  response.setHeader("X-Backend-Revision", apiRevision);
  next();
});

const accessToken = (request: Request) => {
  const value = request.header("authorization");
  return value?.startsWith("Bearer ") ? value.slice(7) : undefined;
};

async function requireUser(request: Request, response: Response, next: NextFunction) {
  const token = accessToken(request);
  if (!token) {
    response.status(401).json({ error: "Debes iniciar sesión." });
    return;
  }

  const client = createRequestClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    response.status(401).json({ error: "La sesión no es válida." });
    return;
  }

  // El perfil lo crea exclusivamente el trigger handle_new_user. No hacemos
  // upsert con el JWT del usuario: permitiría escribir directamente profiles.
  const profileClient = createRequestClient(token);

  response.locals.user = data.user;
  response.locals.supabase = profileClient;
  const { data: profile, error: profileLookupError } = await profileClient
    .from("profiles")
    .select("id, role, estado")
    .eq("id", data.user.id)
    .single();
  if (profileLookupError || !profile) {
    response.status(403).json({ error: "No se pudo validar el perfil de la sesión." });
    return;
  }
  if (profile.estado === "INACTIVO") {
    response.status(403).json({ error: "Tu cuenta está desactivada." });
    return;
  }
  response.locals.profile = profile;
  next();
}

function requireAdmin(_request: Request, response: Response, next: NextFunction) {
  if (response.locals.profile?.role !== "admin") {
    response.status(403).json({ error: "Esta acción requiere permisos de administrador." });
    return;
  }
  next();
}

const parse = <T>(schema: z.ZodType<T>, value: unknown) => schema.parse(value);

async function tieneEvidenciaValida(
  supabase: ReturnType<typeof createRequestClient>,
  trabajoId: string,
  tipo: "FIRMA" | "FOTO_ANTES" | "FOTO_DESPUES",
) {
  const { data, error } = await supabase.from("evidencias")
    .select("id, contenido, storage_path")
    .eq("trabajo_id", trabajoId)
    .eq("tipo", tipo)
    .limit(20);
  if (error) throw error;
  if (tipo !== "FIRMA") return data.some((item) => Boolean(item.storage_path?.trim()));
  return data.some((item) => esFirmaSvgValida(item.contenido));
}

app.get("/health", (_request, response) => {
  response.json({ status: "ok", revision: apiRevision, startedAt });
});

app.post("/auth/register", async (request, response, next) => {
  try {
    const input = parse(registerSchema, request.body);
    const client = createRequestClient();
    const { data, error } = await client.auth.signUp({
      email: input.email.toLowerCase(),
      password: input.password,
      options: { data: { full_name: input.name } },
    });
    if (error) throw error;
    response.status(201).json({ user: data.user, session: data.session });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/login", async (request, response, next) => {
  try {
    const input = parse(credentialsSchema, request.body);
    const client = createRequestClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: input.email.toLowerCase(),
      password: input.password,
    });
    if (error) throw error;
    response.json({ user: data.user, session: data.session });
  } catch (error) {
    next(error);
  }
});

app.post("/auth/logout", requireUser, async (_request, response) => {
  response.status(204).send();
});

app.use(requireUser);

// El id sale de la SESIÓN, nunca del cuerpo: si viniera del cuerpo, cualquiera
// podría registrar su teléfono a nombre de otra persona y leer sus avisos.
app.put("/auth/token-push", async (request, response, next) => {
  try {
    const { token } = parse(tokenPushSchema, request.body);
    const userId = response.locals.user.id as string;
    if (token) await tokensPush.guardarTokenPush(userId, token);
    else await tokensPush.borrarTokenPush(userId);
    response.status(204).end();
  } catch (error) { next(error); }
});

app.post("/evidencias/upload", upload.single("file"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: "No se recibió ninguna imagen." });
      return;
    }
    const requestedType = request.header("x-evidence-type");
    const evidenceId = request.header("x-evidence-id");
    if (!evidenceId || !/^[A-Za-z0-9_-]{1,120}$/.test(evidenceId)) {
      response.status(400).json({ error: "La evidencia no tiene un identificador válido." });
      return;
    }
    if (requestedType !== "FOTO_ANTES" && requestedType !== "FOTO_DESPUES") {
      response.status(400).json({ error: "El tipo de fotografía no es válido." });
      return;
    }
    const type = requestedType;
    // La ruta estable hace idempotentes los reintentos de una carga offline.
    const path = `${response.locals.user.id}/${evidenceId}-${type}.jpg`;
    const { error } = await response.locals.supabase.storage
      .from("evidencias")
      .upload(path, request.file.buffer, { contentType: request.file.mimetype, upsert: true });
    if (error) throw error;
    response.status(201).json({ path });
  } catch (error) { next(error); }
});

app.post("/sync", async (request, response, next) => {
  try {
    const operations = z.array(syncOperationSchema).max(50).parse(request.body);
    // Se lee el estado ANTES del RPC para poder comparar y avisar solo si cambió.
    const idsTrabajos = [...new Set(operations.flatMap((op) => (op.entity === "trabajos" ? [op.entity_id] : [])))];
    const antes = new Map<string, { estado: string; tecnico_id: string; cliente: string }>();
    if (idsTrabajos.length > 0) {
      const { data: previos } = await response.locals.supabase
        .from("trabajos").select("id, estado, tecnico_id, cliente").in("id", idsTrabajos);
      for (const fila of previos ?? []) antes.set(fila.id, fila);
    }
    // Regla de rol: el técnico no cancela ni cierra. Se simula el avance de cada
    // trabajo dentro del lote (varias operaciones pueden encadenarse) y, si alguna
    // transición válida no le corresponde a su rol, se rechaza TODO el lote.
    const estadoSimulado = new Map([...antes].map(([id, fila]) => [id, fila.estado]));
    for (const op of operations) {
      if (op.entity !== "trabajos") continue;
      const actual = estadoSimulado.get(op.entity_id);
      if (actual === undefined) continue;
      const siguiente = op.payload.estado;
      if (actual !== siguiente && esTransicionTrabajoValida(actual, siguiente) &&
          !puedeTransicionarPorRol(response.locals.profile.role, actual, siguiente)) {
        response.status(403).json({ error: MENSAJE_SOLO_ADMIN });
        return;
      }
      estadoSimulado.set(op.entity_id, siguiente);
    }
    const { data, error } = await response.locals.supabase.rpc("sync_trabajos", {
      p_operations: operations,
    });
    if (error) {
      if (error.code === "P0001" || error.code === "23514") {
        response.status(409).json({ error: error.message });
        return;
      }
      throw error;
    }
    for (const op of operations) {
      if (op.entity !== "trabajos") continue;
      const previo = antes.get(op.entity_id);
      if (!previo) continue;
      await avisarCambioDeEstado({
        trabajoId: op.entity_id,
        cliente: previo.cliente,
        tecnicoId: previo.tecnico_id,
        estadoAnterior: previo.estado,
        estadoNuevo: op.payload.estado,
        actorId: response.locals.user.id,
        actorRol: response.locals.profile.role,
        motivoCancelacion: op.payload.motivo_cancelacion,
      });
    }
    response.json(data);
  } catch (error) { next(error); }
});

const tecnicoFields = "id, full_name, telefono, especialidad, estado, created_at, updated_at";

app.get("/tecnicos", requireAdmin, async (request, response, next) => {
  try {
    const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
    let query = response.locals.supabase
      .from("profiles")
      .select(tecnicoFields)
      .eq("role", "tecnico")
      .eq("estado", "ACTIVO")
      .order("created_at", { ascending: false });
    if (search) query = query.ilike("full_name", `%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    response.json(data);
  } catch (error) { next(error); }
});

app.post("/tecnicos", requireAdmin, async (request, response, next) => {
  try {
    const input = parse(tecnicoCreateSchema, request.body);
    const adminClient = createAdminClient();
    const { data: invitation, error: invitationError } = await adminClient.auth.admin.inviteUserByEmail(
      input.email.toLowerCase(),
      { data: { full_name: input.nombre } },
    );
    if (invitationError) throw invitationError;
    if (!invitation.user) throw new Error("Supabase no devolvió el técnico invitado.");

    const { data, error } = await response.locals.supabase
      .from("profiles")
      // handle_new_user crea el perfil con role = 'tecnico'; este flujo nunca
      // recibe ni modifica roles.
      .update({ telefono: input.telefono ?? "", especialidad: input.especialidad ?? "" })
      .eq("id", invitation.user.id)
      .select(tecnicoFields)
      .single();
    if (error) throw error;
    response.status(201).json(data);
  } catch (error) { next(error); }
});

app.get("/tecnicos/:id", requireAdmin, async (request, response, next) => {
  try {
    const { data, error } = await response.locals.supabase
      .from("profiles")
      .select(tecnicoFields)
      .eq("id", request.params.id)
      .eq("role", "tecnico")
      .single();
    if (error) throw error;
    response.json(data);
  } catch (error) { next(error); }
});

app.patch("/tecnicos/:id", requireAdmin, async (request, response, next) => {
  try {
    const input = parse(patchSchema(tecnicoUpdateSchema), request.body);
    const values = { ...input, ...(input.nombre ? { full_name: input.nombre } : {}) };
    delete (values as Record<string, unknown>).nombre;
    const { data, error } = await response.locals.supabase
      .from("profiles")
      .update(values)
      .eq("id", request.params.id)
      .eq("role", "tecnico")
      .select(tecnicoFields)
      .single();
    if (error) throw error;
    response.json(data);
  } catch (error) { next(error); }
});

app.delete("/tecnicos/:id", requireAdmin, async (request, response, next) => {
  try {
    const { data, error } = await response.locals.supabase
      .from("profiles")
      .update({ estado: "INACTIVO" })
      .eq("id", request.params.id)
      .eq("role", "tecnico")
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      response.status(404).json({ error: "El técnico no existe." });
      return;
    }

    const { error: banError } = await createAdminClient().auth.admin.updateUserById(data.id, {
      ban_duration: "876000h",
    });
    if (banError) throw banError;
    response.json({ deleted: true, id: data.id });
  } catch (error) { next(error); }
});

// --- Eje 3: el reporte, sin IA. Solo el administrador, y solo en línea. ---

// Todo lo que el admin necesita ver para redactar y aprobar el reporte.
app.get("/ordenes/:id/revision", requireAdmin, async (request, response, next) => {
  try {
    const id = z.string().uuid().parse(request.params.id);
    const { data: trabajo, error } = await response.locals.supabase
      .from("trabajos")
      .select("id, cliente, direccion, descripcion, estado, reporte, reporte_texto, reporte_aprobado_at, llegada_at, hora_salida, observaciones")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!trabajo) {
      response.status(404).json({ error: "La orden no existe." });
      return;
    }
    const { data: evidencias, error: evidenciasError } = await response.locals.supabase
      .from("evidencias")
      .select("tipo, storage_path, contenido, captured_at")
      .eq("trabajo_id", id)
      .order("captured_at", { ascending: true });
    if (evidenciasError) throw evidenciasError;
    type FilaEvidencia = { tipo: string; storage_path: string | null; contenido: string | null };
    const lista: FilaEvidencia[] = evidencias ?? [];
    const conRuta = (tipo: string) =>
      lista.filter((item) => item.tipo === tipo && Boolean(item.storage_path?.trim())).length;
    response.json({
      trabajo,
      notas: lista.filter((item) => item.tipo === "NOTA" && item.contenido?.trim()).map((item) => item.contenido as string),
      tiene_firma: lista.some((item) => item.tipo === "FIRMA" && esFirmaSvgValida(item.contenido)),
      fotos_antes: conRuta("FOTO_ANTES"),
      fotos_despues: conRuta("FOTO_DESPUES"),
    });
  } catch (error) { next(error); }
});

// Redactar (o editar el borrador) y aprobar. Cerrar el trabajo sigue siendo
// PATCH /ordenes/:id con estado CERRADO; al cerrarse, Postgres deja el reporte
// ENTREGADO en la misma operación.
app.patch("/ordenes/:id/reporte", requireAdmin, async (request, response, next) => {
  try {
    const id = z.string().uuid().parse(request.params.id);
    const input = parse(reporteAccionSchema, request.body);
    const { data: trabajo, error } = await response.locals.supabase
      .from("trabajos")
      .select("id, estado, reporte, reporte_texto")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!trabajo) {
      response.status(404).json({ error: "La orden no existe." });
      return;
    }
    const texto = (input.texto ?? trabajo.reporte_texto ?? "").trim();
    const resultado = transicionarReporte(trabajo.reporte, input.accion, {
      rol: response.locals.profile.role,
      estadoTrabajo: trabajo.estado,
      texto,
    });
    if (!resultado.ok) {
      response.status(409).json({ error: resultado.motivo });
      return;
    }
    const { data, error: updateError } = await response.locals.supabase
      .from("trabajos")
      .update({ reporte: resultado.estado, reporte_texto: texto })
      .eq("id", id)
      .eq("reporte", trabajo.reporte)
      .select("id, estado, reporte, reporte_texto, reporte_aprobado_at")
      .maybeSingle();
    if (updateError) throw updateError;
    if (!data) {
      response.status(409).json({ error: "El reporte cambió mientras se actualizaba. Actualízalo e inténtalo de nuevo." });
      return;
    }
    response.json(data);
  } catch (error) { next(error); }
});

function crudRoutes(path: string, table: "clientes" | "trabajos", schema: z.ZodObject<Record<string, z.ZodTypeAny>>) {
  app.get(path, async (request, response, next) => {
    try {
      const search = typeof request.query.search === "string" ? request.query.search : "";
      let query = response.locals.supabase.from(table).select("*").order("created_at", { ascending: false });
      // Los clientes INACTIVO (soft delete) no se muestran en el listado: siguen
      // en la base para no perder el historial de órdenes que los referencian.
      if (table === "clientes") query = query.eq("estado", "ACTIVO");
      if (search) query = query.ilike(table === "clientes" ? "nombre" : "descripcion", `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      response.json(data);
    } catch (error) { next(error); }
  });

  app.post(path, async (request, response, next) => {
    try {
      const input = parse(schema, request.body);
      let values: Record<string, unknown>;
      if (table === "trabajos") {
        const { data: client, error: clientError } = await response.locals.supabase
          .from("clientes")
          .select("nombre")
          .eq("id", input.cliente_id)
          .single();
        if (clientError || !client) {
          response.status(400).json({ error: "El cliente seleccionado no existe o no está disponible." });
          return;
        }
        values = {
          ...input,
          estado: "ASIGNADO",
          cliente: client.nombre,
          tecnico_id: input.tecnico_id ?? response.locals.user.id,
        };
      } else {
        values = { ...input, propietario_id: response.locals.user.id };
      }
      const { data, error } = await response.locals.supabase.from(table).insert(values).select().single();
      if (error) throw error;
      if (table === "trabajos") {
        await avisarCambioDeEstado({
          trabajoId: data.id,
          cliente: data.cliente,
          tecnicoId: data.tecnico_id,
          estadoAnterior: null,
          estadoNuevo: data.estado,
          actorId: response.locals.user.id,
          actorRol: response.locals.profile.role,
        });
      }
      response.status(201).json(data);
    } catch (error) { next(error); }
  });

  app.get(`${path}/:id`, async (request, response, next) => {
    try {
      const { data, error } = await response.locals.supabase.from(table).select("*").eq("id", request.params.id).single();
      if (error) throw error;
      response.json(data);
    } catch (error) { next(error); }
  });

  app.patch(`${path}/:id`, async (request, response, next) => {
    try {
      const input = parse(patchSchema(schema), request.body);
      if (table === "trabajos" && typeof input.estado === "string") {
        const { data: trabajo, error: lookupError } = await response.locals.supabase
          .from("trabajos")
          .select("id, estado, reporte")
          .eq("id", request.params.id)
          .maybeSingle();
        if (lookupError) throw lookupError;
        if (!trabajo) {
          response.status(404).json({ error: "La orden no existe." });
          return;
        }
        if (!esTransicionTrabajoValida(trabajo.estado, input.estado as EstadoTrabajoServidor)) {
          response.status(409).json({ error: `El servidor rechazó la transición de ${trabajo.estado} a ${input.estado}.` });
          return;
        }
        if (!puedeTransicionarPorRol(response.locals.profile.role, trabajo.estado, input.estado)) {
          response.status(403).json({ error: MENSAJE_SOLO_ADMIN });
          return;
        }
        if (input.estado === "COMPLETADO") {
          const [firma, fotoDespues] = await Promise.all([
            tieneEvidenciaValida(response.locals.supabase, request.params.id, "FIRMA"),
            tieneEvidenciaValida(response.locals.supabase, request.params.id, "FOTO_DESPUES"),
          ]);
          if (!firma) {
            response.status(409).json({ error: "No se puede completar el trabajo sin una firma capturada y sincronizada." });
            return;
          }
          if (!fotoDespues) {
            response.status(409).json({ error: "No se puede completar el trabajo sin una foto «después» sincronizada." });
            return;
          }
        }
        if (input.estado === "CERRADO" && trabajo.reporte !== "APROBADO") {
          response.status(409).json({ error: "Solo se puede cerrar un trabajo con el reporte aprobado." });
          return;
        }
        if (input.estado === "CANCELADO" && !(typeof input.motivo_cancelacion === "string" && input.motivo_cancelacion.trim())) {
          response.status(400).json({ error: "Indica el motivo de cancelación del trabajo." });
          return;
        }
        let query = response.locals.supabase
          .from("trabajos")
          .update(input)
          .eq("id", request.params.id)
          .eq("estado", trabajo.estado)
          .select();
        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        if (!data) {
          response.status(409).json({ error: "La orden cambió mientras se actualizaba. Actualízala e inténtalo de nuevo." });
          return;
        }
        await avisarCambioDeEstado({
          trabajoId: data.id,
          cliente: data.cliente,
          tecnicoId: data.tecnico_id,
          estadoAnterior: trabajo.estado,
          estadoNuevo: data.estado,
          actorId: response.locals.user.id,
          actorRol: response.locals.profile.role,
          motivoCancelacion: data.motivo_cancelacion,
        });
        response.json(data);
        return;
      }
      const { data, error } = await response.locals.supabase.from(table).update(input).eq("id", request.params.id).select().single();
      if (error) throw error;
      response.json(data);
    } catch (error) { next(error); }
  });

  app.delete(`${path}/:id`, async (request, response, next) => {
    try {
      // Clientes: soft delete (estado = INACTIVO). No se borran para preservar
      // la integridad referencial con las órdenes históricas.
      // Órdenes (trabajos): hard delete; el admin elimina una orden mal creada
      // y queda fuera del historial.
      if (table === "clientes") {
        const { data, error } = await response.locals.supabase
          .from("clientes")
          .update({ estado: "INACTIVO" })
          .eq("id", request.params.id)
          .eq("estado", "ACTIVO")
          .select("id")
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          response.status(404).json({ error: "El cliente no existe o ya estaba desactivado." });
          return;
        }
        response.json({ deleted: true, id: data.id });
        return;
      }
      const { data, error } = await response.locals.supabase
        .from(table)
        .delete()
        .eq("id", request.params.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        response.status(404).json({ error: "El registro no existe o no tienes permisos para eliminarlo." });
        return;
      }
      response.json({ deleted: true, id: data.id });
    } catch (error) { next(error); }
  });
}

crudRoutes("/clientes", "clientes", clienteSchema);
crudRoutes("/ordenes", "trabajos", ordenSchema);

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ error: "Revisa los datos enviados.", details: error.issues });
    return;
  }
  const candidate = error as {
    message?: unknown;
    code?: unknown;
    details?: unknown;
    name?: unknown;
    status?: unknown;
  };
  const rawMessage = typeof candidate.message === "string" ? candidate.message : "Error interno del servidor.";
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const errorName = typeof candidate.name === "string" ? candidate.name : "";
  console.error("API error", { code, message: rawMessage, details: candidate.details });

  if (
    errorName === "AuthApiError" &&
    (code === "invalid_credentials" || rawMessage.toLowerCase().includes("invalid login credentials"))
  ) {
    response.status(401).json({ error: "El correo o la contraseña no son correctos." });
    return;
  }
  if (errorName === "AuthApiError" && rawMessage.toLowerCase().includes("email not confirmed")) {
    response.status(403).json({ error: "Confirma tu correo electrónico antes de iniciar sesión." });
    return;
  }
  if (code === "23505") {
    response.status(409).json({ error: "Ya existe un registro con esos datos." });
    return;
  }
  if (code === "23514") {
    response.status(409).json({ error: rawMessage });
    return;
  }
  if (code === "23503" || rawMessage.includes("violates foreign key constraint")) {
    response.status(409).json({ error: "No se puede eliminar este registro porque tiene datos relacionados." });
    return;
  }
  if (code === "42501" && rawMessage.includes("administrador")) {
    response.status(403).json({ error: rawMessage });
    return;
  }
  if (code === "42501" || rawMessage.toLowerCase().includes("row-level security")) {
    response.status(403).json({ error: "Supabase bloqueó la operación por RLS. Verifica que la orden pertenezca al usuario autenticado y que aplicaste las políticas de evidencias." });
    return;
  }
  if (code === "PGRST205" || rawMessage.includes("Could not find the table")) {
    response.status(503).json({ error: "La tabla de clientes aún no está disponible. Ejecuta la migración de Supabase." });
    return;
  }
  if (code === "PGRST204") {
    response.status(503).json({ error: "La base de datos no tiene todas las columnas actualizadas. Ejecuta nuevamente la migración de Supabase y reinicia el backend." });
    return;
  }
  response.status(500).json({ error: rawMessage });
});

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Backend escuchando en http://0.0.0.0:${config.port}`);
});
