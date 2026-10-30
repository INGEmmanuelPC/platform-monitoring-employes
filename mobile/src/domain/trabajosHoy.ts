type TrabajoHoy = {
  estado: string;
  hora_programada: string | null;
};

const ESTADOS_TERMINALES = new Set(["COMPLETADO", "CERRADO", "CANCELADO"]);

export function filtrarTrabajosPendientes<T extends TrabajoHoy>(trabajos: T[]) {
  return trabajos.filter((trabajo) => !ESTADOS_TERMINALES.has(trabajo.estado));
}
