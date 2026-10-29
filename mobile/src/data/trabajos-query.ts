export type TrabajoListRole = "admin" | "tecnico";

export const TRABAJO_COLUMNS = `
  id,
  tecnico_id,
  cliente,
  direccion,
  descripcion,
  hora_programada,
  llegada_at,
  hora_salida,
  observaciones,
  motivo_cancelacion,
  estado,
  sync,
  reporte,
  created_at,
  updated_at
`;

export function buildTrabajosListQuery(role: TrabajoListRole) {
  const technicianFilter = role === "admin" ? "" : "WHERE tecnico_id = ?";
  const sql = `SELECT ${TRABAJO_COLUMNS}
     FROM trabajos
     ${technicianFilter}
     ORDER BY hora_programada IS NULL, hora_programada, created_at`;

  return { sql };
}

export function uniquePendingTrabajoMissingFromSnapshot(
  cachedTrabajos: { id: string; sync: string }[],
  remoteIds: ReadonlySet<string>,
): string | null {
  const missingIds = cachedTrabajos
    .filter((trabajo) =>
      (trabajo.sync === "SOLO_LOCAL" || trabajo.sync === "EN_COLA") &&
      !remoteIds.has(trabajo.id),
    )
    .map((trabajo) => trabajo.id);
  return missingIds.length === 1 ? missingIds[0] : null;
}
