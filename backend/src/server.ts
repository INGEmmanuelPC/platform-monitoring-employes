import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { z, type ZodError } from "zod";

import { config } from "./config.js";
import { createRequestClient } from "./supabase.js";
import {
  clienteSchema,
  credentialsSchema,
  ordenSchema,
  patchSchema,
  registerSchema,
  tecnicoSchema,
} from "./validation.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin }));
app.use(express.json({ limit: "1mb" }));

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

  const profileClient = createRequestClient(token);
  const { error: profileError } = await profileClient.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: String(data.user.user_metadata?.full_name ?? ""),
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (profileError) {
    next(profileError);
    return;
  }

  response.locals.user = data.user;
  response.locals.supabase = profileClient;
  next();
}

const parse = <T>(schema: z.ZodType<T>, value: unknown) => schema.parse(value);

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
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

app.post("/evidencias/upload", upload.single("file"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: "No se recibió ninguna imagen." });
      return;
    }
    const type = request.header("x-evidence-type") === "FOTO_DESPUES" ? "FOTO_DESPUES" : "FOTO_ANTES";
    const path = `${response.locals.user.id}/${crypto.randomUUID()}-${type}.jpg`;
    const { error } = await response.locals.supabase.storage
      .from("evidencias")
      .upload(path, request.file.buffer, { contentType: request.file.mimetype, upsert: false });
    if (error) throw error;
    response.status(201).json({ path });
  } catch (error) { next(error); }
});

app.post("/sync", async (request, response, next) => {
  try {
    const operations = z.array(z.object({
      id: z.number().int().positive(),
      entity: z.enum(["trabajos", "evidencias"]),
      entity_id: z.string().min(1),
      operation: z.enum(["UPDATE", "INSERT"]),
      payload: z.record(z.string(), z.unknown()),
    })).max(50).parse(request.body);
    const results = [];

    for (const operation of operations) {
      const table = operation.entity;
      if (table === "evidencias") {
        const trabajoId = operation.payload.trabajo_id;
        if (typeof trabajoId !== "string") {
          response.status(400).json({ error: "La evidencia no tiene una orden de trabajo válida." });
          return;
        }
        const { data: trabajo, error: trabajoError } = await response.locals.supabase
          .from("trabajos")
          .select("id, tecnico_id")
          .eq("id", trabajoId)
          .maybeSingle();
        if (trabajoError) throw trabajoError;
        if (!trabajo) {
          response.status(409).json({ error: "La orden de esta evidencia no existe o pertenece a otro técnico." });
          return;
        }
      }
      const query = operation.operation === "UPDATE"
        ? response.locals.supabase.from(table).update(operation.payload).eq("id", operation.entity_id)
        : table === "evidencias"
          ? response.locals.supabase.from(table).insert(operation.payload)
          : response.locals.supabase.from(table).insert({ id: operation.entity_id, ...operation.payload });
      const { error } = await query;
      if (error) throw error;
      results.push({ id: operation.id, synced: true });
    }

    response.json({ results });
  } catch (error) { next(error); }
});

app.get("/tecnicos", async (_request, response, next) => {
  try {
    const { data, error } = await response.locals.supabase
      .from("profiles")
      .select("*")
      .eq("estado", "ACTIVO")
      .order("created_at", { ascending: false });
    if (error) throw error;
    response.json(data);
  } catch (error) { next(error); }
});

app.post("/tecnicos", async (request, response, next) => {
  try {
    const input = parse(tecnicoSchema, request.body);
    const { data, error } = await response.locals.supabase.from("profiles").upsert({
      id: response.locals.user.id,
      full_name: input.nombre,
      telefono: input.telefono ?? "",
      especialidad: input.especialidad ?? "",
      estado: input.estado,
    }, { onConflict: "id" }).select().single();
    if (error) throw error;
    response.status(201).json(data);
  } catch (error) { next(error); }
});

app.get("/tecnicos/:id", async (request, response, next) => {
  try {
    const { data, error } = await response.locals.supabase.from("profiles").select("*").eq("id", request.params.id).single();
    if (error) throw error;
    response.json(data);
  } catch (error) { next(error); }
});

app.patch("/tecnicos/:id", async (request, response, next) => {
  try {
    const input = parse(patchSchema(tecnicoSchema), request.body);
    const values = { ...input, ...(input.nombre ? { full_name: input.nombre } : {}) };
    delete (values as Record<string, unknown>).nombre;
    const { data, error } = await response.locals.supabase.from("profiles").update(values).eq("id", request.params.id).select().single();
    if (error) throw error;
    response.json(data);
  } catch (error) { next(error); }
});

app.delete("/tecnicos/:id", async (request, response, next) => {
  try {
    const { data, error } = await response.locals.supabase
      .from("profiles")
      .update({ estado: "INACTIVO" })
      .eq("id", request.params.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      response.status(404).json({ error: "El técnico no existe o no tienes permisos para eliminarlo." });
      return;
    }
    response.json({ deleted: true, id: data.id });
  } catch (error) { next(error); }
});

function crudRoutes(path: string, table: "clientes" | "trabajos", schema: z.ZodObject<Record<string, z.ZodTypeAny>>) {
  app.get(path, async (request, response, next) => {
    try {
      const search = typeof request.query.search === "string" ? request.query.search : "";
      let query = response.locals.supabase.from(table).select("*").order("created_at", { ascending: false });
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
          cliente: client.nombre,
          tecnico_id: input.tecnico_id ?? response.locals.user.id,
        };
      } else {
        values = { ...input, propietario_id: response.locals.user.id };
      }
      const { data, error } = await response.locals.supabase.from(table).insert(values).select().single();
      if (error) throw error;
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
      const { data, error } = await response.locals.supabase.from(table).update(input).eq("id", request.params.id).select().single();
      if (error) throw error;
      response.json(data);
    } catch (error) { next(error); }
  });

  app.delete(`${path}/:id`, async (request, response, next) => {
    try {
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
  const candidate = error as { message?: unknown; code?: unknown; details?: unknown };
  const rawMessage = typeof candidate.message === "string" ? candidate.message : "Error interno del servidor.";
  const code = typeof candidate.code === "string" ? candidate.code : "";
  console.error("API error", { code, message: rawMessage, details: candidate.details });

  if (code === "23505") {
    response.status(409).json({ error: "Ya existe un registro con esos datos." });
    return;
  }
  if (code === "23503" || rawMessage.includes("violates foreign key constraint")) {
    response.status(409).json({ error: "No se puede eliminar este registro porque tiene datos relacionados." });
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

app.listen(config.port, () => {
  console.log(`Backend escuchando en http://localhost:${config.port}`);
});
