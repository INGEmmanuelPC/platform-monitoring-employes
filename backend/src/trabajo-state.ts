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

export function esFirmaSvgValida(value: unknown): value is string {
  return typeof value === "string" && value.length <= 100_000 &&
    /<svg\b[^>]*>[\s\S]*<path\b[^>]*\bd="\s*M\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?[\s\S]*L\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/i.test(value);
}
