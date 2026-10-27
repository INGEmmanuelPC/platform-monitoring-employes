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
  actual: EstadoTrabajoServidor,
  siguiente: EstadoTrabajoServidor,
): boolean {
  return actual === siguiente || TRANSICIONES_VALIDAS[actual].includes(siguiente);
}
