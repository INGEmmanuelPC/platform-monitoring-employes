import type { EstadoReporte } from "@/constants/trabajos";

// Eje 3 (EstadoReporte) sin IA. Código puro: sin SQLite, red ni reloj.
// Duplica a propósito la regla de backend/src/reporte-state.ts (ADR 0006: no hay
// paquete compartido). El servidor y Postgres (migración 010) son los que mandan;
// aquí solo se usa para avanzar el eje sin red y para decidir qué mostrar.
//
//   SIN_AUDIO ─registrarInsumo─▶ AUDIO_LISTO ─redactar─▶ BORRADOR ─aprobar─▶ APROBADO ─entregar─▶ ENTREGADO

export type AccionReporte = "registrarInsumo" | "redactar" | "aprobar" | "entregar";

export type ContextoReporte = {
  rol: "admin" | "tecnico";
  estadoTrabajo?: string;
  texto?: string | null;
};

export type ResultadoReporte =
  | { ok: true; estado: EstadoReporte }
  | { ok: false; motivo: string };

export const TRANSICIONES_REPORTE: Record<
  AccionReporte,
  { desde: EstadoReporte[]; hacia: EstadoReporte; rol: "admin" | "cualquiera" }
> = {
  registrarInsumo: { desde: ["SIN_AUDIO"], hacia: "AUDIO_LISTO", rol: "cualquiera" },
  redactar: { desde: ["AUDIO_LISTO", "BORRADOR"], hacia: "BORRADOR", rol: "admin" },
  aprobar: { desde: ["BORRADOR"], hacia: "APROBADO", rol: "admin" },
  entregar: { desde: ["APROBADO"], hacia: "ENTREGADO", rol: "admin" },
};

const ETIQUETA_ACCION: Record<AccionReporte, string> = {
  registrarInsumo: "registrar la nota",
  redactar: "redactar el reporte",
  aprobar: "aprobar el reporte",
  entregar: "entregar el reporte",
};

export function transicionarReporte(
  estado: string,
  accion: string,
  contexto: ContextoReporte,
): ResultadoReporte {
  if (!Object.hasOwn(TRANSICIONES_REPORTE, accion)) {
    return { ok: false, motivo: `La acción «${accion}» del reporte no existe.` };
  }
  const regla = TRANSICIONES_REPORTE[accion as AccionReporte];
  const nombre = ETIQUETA_ACCION[accion as AccionReporte];

  if (!regla.desde.includes(estado as EstadoReporte)) {
    return { ok: false, motivo: `No se puede ${nombre} con el reporte en estado ${estado}.` };
  }
  if (regla.rol !== "cualquiera" && contexto.rol !== regla.rol) {
    return { ok: false, motivo: "Solo un administrador puede redactar, aprobar o entregar el reporte." };
  }
  if ((accion === "redactar" || accion === "aprobar") && contexto.estadoTrabajo !== "COMPLETADO") {
    return { ok: false, motivo: "El reporte se redacta y se aprueba cuando el trabajo está terminado." };
  }
  if ((accion === "redactar" || accion === "aprobar") && !contexto.texto?.trim()) {
    return { ok: false, motivo: "El reporte necesita texto antes de continuar." };
  }
  return { ok: true, estado: regla.hacia };
}

// Qué ve el administrador en la pantalla de revisión, según los dos ejes.
export type VistaRevision =
  | "cancelado"
  | "entregado"
  | "esperando_trabajo"
  | "sin_nota"
  | "redactar"
  | "editar_y_aprobar"
  | "cerrar"
  | "solo_lectura";

export function vistaRevision(estadoReporte: string, estadoTrabajo: string): VistaRevision {
  if (estadoTrabajo === "CANCELADO") return "cancelado";
  if (estadoTrabajo === "CERRADO" || estadoReporte === "ENTREGADO") return "entregado";
  if (estadoTrabajo !== "COMPLETADO") return "esperando_trabajo";
  switch (estadoReporte) {
    case "SIN_AUDIO": return "sin_nota";
    case "AUDIO_LISTO": return "redactar";
    case "BORRADOR": return "editar_y_aprobar";
    case "APROBADO": return "cerrar";
    default: return "solo_lectura";
  }
}
