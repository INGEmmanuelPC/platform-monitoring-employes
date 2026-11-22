// Reglas puras del consentimiento de ubicación. Sin Expo, sin red, sin reloj:
// se prueban con node:test.

export type RespuestaConsentimiento = "aceptado" | "rechazado";
export type EstadoConsentimiento = RespuestaConsentimiento | "pendiente";

export type ConsentimientoGuardado = {
  respuesta: RespuestaConsentimiento;
  version: number;
  fecha: string;
};

// La clave lleva el id de la cuenta: el consentimiento es por cuenta, no por
// teléfono. SecureStore solo admite letras, números, ".", "-" y "_".
export function claveConsentimiento(prefijo: string, userId: string): string {
  const seguro = userId.replace(/[^A-Za-z0-9._-]/g, "_");
  return `${prefijo}_${seguro}`;
}

export function serializarConsentimiento(guardado: ConsentimientoGuardado): string {
  return JSON.stringify(guardado);
}

function esConsentimiento(valor: unknown): valor is ConsentimientoGuardado {
  if (!valor || typeof valor !== "object") return false;
  const { respuesta, version, fecha } = valor as Record<string, unknown>;
  return (
    (respuesta === "aceptado" || respuesta === "rechazado") &&
    typeof version === "number" &&
    Number.isInteger(version) &&
    typeof fecha === "string" &&
    !Number.isNaN(Date.parse(fecha))
  );
}

// Cualquier valor ausente, dañado o de una versión anterior cuenta como
// "pendiente": ante la duda se pregunta de nuevo, nunca se asume un sí.
export function estadoDesdeAlmacen(valor: string | null, versionActual: number): EstadoConsentimiento {
  if (!valor) return "pendiente";
  try {
    const guardado: unknown = JSON.parse(valor);
    if (!esConsentimiento(guardado) || guardado.version !== versionActual) return "pendiente";
    return guardado.respuesta;
  } catch {
    return "pendiente";
  }
}

// Solo el técnico es rastreado, así que solo a él se le pide.
export function requiereConsentimiento(rol: string | null | undefined, estado: EstadoConsentimiento): boolean {
  return rol === "tecnico" && estado === "pendiente";
}

// El rastreo futuro debe preguntar esto antes de pedir el permiso del sistema.
export function puedeRastrearUbicacion(estado: EstadoConsentimiento): boolean {
  return estado === "aceptado";
}
