import { apiRequest } from "./http";
import { updateEntity } from "./entities";

export type RevisionTrabajo = {
  trabajo: {
    id: string;
    cliente: string;
    direccion: string;
    descripcion: string;
    estado: string;
    reporte: string;
    reporte_texto: string | null;
    reporte_aprobado_at: string | null;
    llegada_at: string | null;
    hora_salida: string | null;
    observaciones: string;
  };
  notas: string[];
  tiene_firma: boolean;
  fotos_antes: number;
  fotos_despues: number;
};

export function getRevision(trabajoId: string) {
  return apiRequest<RevisionTrabajo>(`/ordenes/${trabajoId}/revision`);
}

// El estado resultante lo decide el servidor; aquí solo se pide la acción.
export function guardarReporte(trabajoId: string, accion: "redactar" | "aprobar", texto: string) {
  return apiRequest<{ id: string; estado: string; reporte: string; reporte_texto: string }>(
    `/ordenes/${trabajoId}/reporte`,
    { method: "PATCH", body: JSON.stringify({ accion, texto }) },
  );
}

// Al cerrarse, Postgres deja el reporte ENTREGADO en la misma operación.
export function cerrarTrabajoRemoto(trabajoId: string) {
  return updateEntity("ordenes", trabajoId, { estado: "CERRADO" });
}
