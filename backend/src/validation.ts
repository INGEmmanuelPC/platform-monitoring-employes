import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(6).max(128),
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(120),
});

export const clienteSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  telefono: z.string().trim().max(40).optional().or(z.literal("")),
  direccion: z.string().trim().max(240).default(""),
  estado: z.enum(["ACTIVO", "INACTIVO"]).default("ACTIVO"),
});

const tecnicoFieldsSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  telefono: z.string().trim().max(40).optional().or(z.literal("")),
  especialidad: z.string().trim().max(120).optional().or(z.literal("")),
}).strict();

export const tecnicoCreateSchema = tecnicoFieldsSchema.extend({
  email: z.string().trim().email().max(160),
}).strict();

export const tecnicoUpdateSchema = tecnicoFieldsSchema;

export const ordenSchema = z.object({
  cliente_id: z.string().uuid(),
  tecnico_id: z.string().uuid().optional(),
  descripcion: z.string().trim().min(2).max(1000),
  direccion: z.string().trim().max(240).default(""),
  estado: z.enum(["ASIGNADO", "EN_CAMINO", "EN_SITIO", "COMPLETADO", "CERRADO", "CANCELADO"]).default("ASIGNADO"),
  motivo_cancelacion: z.string().trim().min(1).max(1000).optional(),
  hora_programada: z.string().datetime().nullable().optional(),
  observaciones: z.string().trim().max(2000).default(""),
});

const estadoTrabajoSchema = z.enum([
  "ASIGNADO", "EN_CAMINO", "EN_SITIO", "COMPLETADO", "CERRADO", "CANCELADO",
]);

const syncTrabajoPayloadSchema = z.object({
  estado: estadoTrabajoSchema,
  llegada_at: z.string().datetime().optional(),
  hora_salida: z.string().datetime().optional(),
  observaciones: z.string().max(2000).optional(),
  motivo_cancelacion: z.string().trim().min(1).max(1000).optional(),
}).strict();

const syncEvidenciaPayloadSchema = z.discriminatedUnion("tipo", [
  z.object({
    trabajo_id: z.string().uuid(),
    tipo: z.enum(["FOTO_ANTES", "FOTO_DESPUES"]),
    storage_path: z.string().trim().min(1).max(1000),
  }).strict(),
  z.object({
    trabajo_id: z.string().uuid(),
    tipo: z.literal("FIRMA"),
    contenido: z.string().max(100_000).regex(
      /<svg\b[^>]*>[\s\S]*<path\b[^>]*\bd="\s*M\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?[\s\S]*L\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/i,
      "La firma debe ser un SVG con un trazo dibujado.",
    ),
  }).strict(),
  z.object({
    trabajo_id: z.string().uuid(),
    tipo: z.literal("NOTA"),
    contenido: z.string().max(2000),
  }).strict(),
]);

export const syncOperationSchema = z.discriminatedUnion("entity", [
  z.object({
    id: z.number().int().positive(),
    entity: z.literal("trabajos"),
    entity_id: z.string().uuid(),
    operation: z.literal("UPDATE"),
    payload: syncTrabajoPayloadSchema,
  }).strict(),
  z.object({
    id: z.number().int().positive(),
    entity: z.literal("evidencias"),
    entity_id: z.string().regex(/^[A-Za-z0-9_-]{1,160}$/),
    operation: z.literal("INSERT"),
    payload: syncEvidenciaPayloadSchema,
  }).strict(),
]);

export const patchSchema = <T extends z.ZodObject<Record<string, z.ZodTypeAny>>>(schema: T) =>
  schema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "Envía al menos un cambio.",
  });
