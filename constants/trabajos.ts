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

export type Trabajo = {
  id: string;
  cliente: string;
  direccion: string;
  descripcion: string;
  hora: string;
  estado: EstadoTrabajo;
  sync: EstadoSync;
  reporte: EstadoReporte;
};

// Datos provisionales para ver la estructura. Se reemplazan por SQLite en V0.
export const TRABAJOS_EJEMPLO: Trabajo[] = [
  {
    id: "1",
    cliente: "Finca La Esperanza",
    direccion: "Vereda El Roble, km 12 vía Piedecuesta",
    descripcion: "Mantenimiento de bomba de riego",
    hora: "8:00 a. m.",
    estado: "COMPLETADO",
    sync: "SOLO_LOCAL",
    reporte: "AUDIO_LISTO",
  },
  {
    id: "2",
    cliente: "Conjunto Altos del Prado",
    direccion: "Cra 33 #45-12, torre B",
    descripcion: "Fuga en tubería del sótano",
    hora: "10:30 a. m.",
    estado: "EN_SITIO",
    sync: "SOLO_LOCAL",
    reporte: "SIN_AUDIO",
  },
  {
    id: "3",
    cliente: "Panadería El Trigal",
    direccion: "Calle 56 #21-08",
    descripcion: "Revisión de aire acondicionado",
    hora: "2:00 p. m.",
    estado: "ASIGNADO",
    sync: "SINCRONIZADO",
    reporte: "SIN_AUDIO",
  },
];

export const PENDIENTES_POR_SUBIR = TRABAJOS_EJEMPLO.filter(
  (t) => t.sync === "SOLO_LOCAL" || t.sync === "EN_COLA",
).length;
