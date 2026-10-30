import type { EstadoReporte, EstadoTrabajo } from "@/constants/trabajos";

export type AccionTrabajo =
  | "marcarEnCamino"
  | "marcarLlegada"
  | "completar"
  | "cerrar"
  | "cancelar";

export type ContextoTransicionTrabajo = {
  tieneFirma?: boolean;
  tieneFoto?: boolean;
  estadoReporte?: EstadoReporte;
  motivoCancelacion?: string;
};

export function firmaSvgTieneTrazo(firmaSvg: string | null | undefined): boolean {
  if (!firmaSvg || firmaSvg.length > 100_000) return false;
  return /<svg\b[^>]*>[\s\S]*<path\b[^>]*\bd="\s*M\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?[\s\S]*L\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/i.test(firmaSvg);
}

const TRANSICIONES: Record<EstadoTrabajo, Partial<Record<AccionTrabajo, EstadoTrabajo>>> = {
  ASIGNADO: { marcarEnCamino: "EN_CAMINO", cancelar: "CANCELADO" },
  EN_CAMINO: { marcarLlegada: "EN_SITIO", cancelar: "CANCELADO" },
  EN_SITIO: { completar: "COMPLETADO", cancelar: "CANCELADO" },
  COMPLETADO: { cerrar: "CERRADO" },
  CERRADO: {},
  CANCELADO: {},
};

const ETIQUETA_ACCION: Record<AccionTrabajo, string> = {
  marcarEnCamino: "marcar el inicio del viaje",
  marcarLlegada: "marcar la llegada",
  completar: "completar el trabajo",
  cerrar: "cerrar el trabajo",
  cancelar: "cancelar el trabajo",
};

const ORDEN_ESTADOS_ACTIVOS: Partial<Record<EstadoTrabajo, number>> = {
  ASIGNADO: 0,
  EN_CAMINO: 1,
  EN_SITIO: 2,
  COMPLETADO: 3,
  CERRADO: 4,
};

export function transicionTrabajoYaSuperada(estadoServidor: string, estadoEnCola: string) {
  if (estadoServidor === "CANCELADO") {
    return ["ASIGNADO", "EN_CAMINO", "EN_SITIO"].includes(estadoEnCola);
  }
  const actual = ORDEN_ESTADOS_ACTIVOS[estadoServidor as EstadoTrabajo];
  const pendiente = ORDEN_ESTADOS_ACTIVOS[estadoEnCola as EstadoTrabajo];
  return actual !== undefined && pendiente !== undefined && pendiente < actual;
}

export function transicionarTrabajo(
  estado: EstadoTrabajo,
  accion: AccionTrabajo,
  contexto: ContextoTransicionTrabajo = {},
): EstadoTrabajo {
  const transiciones = TRANSICIONES as Partial<Record<string, Partial<Record<string, EstadoTrabajo>>>>;
  const siguiente = transiciones[estado]?.[accion];
  if (!siguiente) {
    const nombreAccion = Object.hasOwn(ETIQUETA_ACCION, accion)
      ? ETIQUETA_ACCION[accion]
      : `ejecutar la acción desconocida ${String(accion)}`;
    throw new Error(`No se puede ${nombreAccion} desde el estado ${String(estado)}.`);
  }

  if (accion === "completar" && !contexto.tieneFirma) {
    throw new Error("El cliente debe firmar antes de terminar el trabajo.");
  }
  if (accion === "completar" && !contexto.tieneFoto) {
    throw new Error("El trabajo debe incluir al menos una foto antes de terminar.");
  }
  if (accion === "cerrar" && contexto.estadoReporte !== "APROBADO") {
    throw new Error("Solo se puede cerrar un trabajo con el reporte aprobado.");
  }
  if (accion === "cancelar" && !contexto.motivoCancelacion?.trim()) {
    throw new Error("Indica el motivo de cancelación del trabajo.");
  }

  return siguiente;
}
