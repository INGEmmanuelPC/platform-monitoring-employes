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

export const tecnicoSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  telefono: z.string().trim().max(40).optional().or(z.literal("")),
  especialidad: z.string().trim().max(120).optional().or(z.literal("")),
  estado: z.enum(["ACTIVO", "INACTIVO"]).default("ACTIVO"),
});

export const ordenSchema = z.object({
  cliente_id: z.string().uuid(),
  tecnico_id: z.string().uuid().optional(),
  descripcion: z.string().trim().min(2).max(1000),
  direccion: z.string().trim().max(240).default(""),
  estado: z.enum(["ASIGNADO", "EN_CAMINO", "EN_SITIO", "COMPLETADO", "CERRADO"]).default("ASIGNADO"),
  hora_programada: z.string().datetime().nullable().optional(),
  observaciones: z.string().trim().max(2000).default(""),
});

export const patchSchema = <T extends z.ZodObject<Record<string, z.ZodTypeAny>>>(schema: T) =>
  schema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "Envía al menos un cambio.",
  });
