export type EstadoTrabajoServidor =
  | "ASIGNADO"
  | "EN_CAMINO"
  | "EN_SITIO"
  | "COMPLETADO"
  | "CERRADO"
  | "CANCELADO";

const TRANSICIONES_VALIDAS: Record<EstadoTrabajoServidor, readonly EstadoTrabajoServidor[]> = {
  ASIGNADO: ["EN_CAMINO", "CANCELADO"],
  EN_CAMINO: ["EN_SITIO", "CANCELADO"],
  EN_SITIO: ["COMPLETADO", "CANCELADO"],
  COMPLETADO: ["CERRADO"],
  CERRADO: [],
  CANCELADO: [],
};

export function esTransicionTrabajoValida(
  actual: string,
  siguiente: string,
): boolean {
  if (!Object.hasOwn(TRANSICIONES_VALIDAS, actual)) return false;
  if (!Object.hasOwn(TRANSICIONES_VALIDAS, siguiente)) return false;
  return actual === siguiente || TRANSICIONES_VALIDAS[actual as EstadoTrabajoServidor].includes(siguiente as EstadoTrabajoServidor);
}

// El técnico solo avanza el flujo de campo. Cancelar y cerrar son del
// administrador, que además puede hacer todo lo del técnico (migración 008:
// ejecuta trabajos desde Hoy). La misma regla vive en Postgres (migración 011).
const TRANSICIONES_TECNICO: Record<string, readonly string[]> = {
  ASIGNADO: ["EN_CAMINO"],
  EN_CAMINO: ["EN_SITIO"],
  EN_SITIO: ["COMPLETADO"],
};

export const MENSAJE_SOLO_ADMIN = "Solo un administrador puede cancelar o cerrar un trabajo.";

// Responde si ESTE rol puede hacer ESTA transición. Quedarse en el mismo estado
// no es una transición. Una transición inválida para todos devuelve false: esa
// la rechaza esTransicionTrabajoValida con su propio mensaje.
export function puedeTransicionarPorRol(rol: string, actual: string, siguiente: string): boolean {
  if (actual === siguiente) return true;
  if (!esTransicionTrabajoValida(actual, siguiente)) return false;
  if (rol === "admin") return true;
  if (rol !== "tecnico") return false;
  return Object.hasOwn(TRANSICIONES_TECNICO, actual) && TRANSICIONES_TECNICO[actual].includes(siguiente);
}

export function esFirmaSvgValida(value: unknown): value is string {
  return typeof value === "string" && value.length <= 100_000 &&
    /<svg\b[^>]*>[\s\S]*<path\b[^>]*\bd="\s*M\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?[\s\S]*L\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/i.test(value);
}
