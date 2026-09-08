// Contrato mínimo de estados. Los tres ejes son independientes y avanzan por
// separado: un trabajo puede estar COMPLETADO, SOLO_LOCAL y con el audio sin
// transcribir al mismo tiempo — ese es el estado normal al bajar de una finca.
// Ver docs/adr/0001-estructura-de-navegacion.md

export type EstadoTrabajo =
  | "ASIGNADO"
  | "EN_CAMINO"
  | "EN_SITIO"
  | "COMPLETADO"
  | "CERRADO";

export type EstadoSync = "SOLO_LOCAL" | "EN_COLA" | "SINCRONIZADO" | "CONFLICTO";

export type EstadoReporte =
  | "SIN_AUDIO"
  | "AUDIO_LISTO"
  | "TRANSCRIBIENDO"
  | "BORRADOR"
  | "APROBADO"
  | "ENTREGADO";

export const ETIQUETA_TRABAJO: Record<EstadoTrabajo, string> = {
  ASIGNADO: "Asignado",
  EN_CAMINO: "En camino",
  EN_SITIO: "En sitio",
  COMPLETADO: "Terminado",
  CERRADO: "Cerrado",
};

export const ETIQUETA_SYNC: Record<EstadoSync, string> = {
  SOLO_LOCAL: "Sin subir",
  EN_COLA: "Subiendo",
  SINCRONIZADO: "Subido",
  CONFLICTO: "Revisar",
};

export function formatHora(horaProgramada: string | null) {
  if (!horaProgramada) {
    return "Sin hora";
  }

  const date = new Date(horaProgramada);
  if (Number.isNaN(date.getTime())) {
    return horaProgramada;
  }

  return date.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  });
}
