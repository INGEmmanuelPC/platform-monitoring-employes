// Eje 3 (EstadoReporte) sin IA. Código puro: no toca red, base de datos ni reloj.
// La misma regla vive en Postgres (migración 010) como defensa final.
//
//   SIN_AUDIO ─registrarInsumo─▶ AUDIO_LISTO ─redactar─▶ BORRADOR ─aprobar─▶ APROBADO ─entregar─▶ ENTREGADO
//   (TRANSCRIBIENDO no se usa hasta que exista transcripción automática)

export type EstadoReporteServidor =
  | "SIN_AUDIO"
  | "AUDIO_LISTO"
  | "TRANSCRIBIENDO"
  | "BORRADOR"
  | "APROBADO"
  | "ENTREGADO";

export type AccionReporte = "registrarInsumo" | "redactar" | "aprobar" | "entregar";

export type ContextoReporte = {
  rol: "admin" | "tecnico";
  estadoTrabajo: string;
  texto?: string | null;
};

export type ResultadoReporte =
  | { ok: true; estado: EstadoReporteServidor }
  | { ok: false; motivo: string };

// Datos, no `if` anidados: se puede leer, probar y generar un diagrama de aquí.
export const TRANSICIONES_REPORTE: Record<
  AccionReporte,
  { desde: EstadoReporteServidor[]; hacia: EstadoReporteServidor; rol: "admin" | "tecnico" | "cualquiera" }
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

  if (!regla.desde.includes(estado as EstadoReporteServidor)) {
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
