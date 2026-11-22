// Textos y ajustes del consentimiento de ubicación (Ley 1581 de 2012).
// Regla del proyecto: ningún texto visible vive escrito en un componente.

// Si cambia lo que se recoge, para qué o por cuánto tiempo, se sube la versión
// y a todas las cuentas se les vuelve a pedir el consentimiento.
export const VERSION_CONSENTIMIENTO = 1;

export const PREFIJO_CLAVE_CONSENTIMIENTO = "consentimiento_ubicacion";

export const TEXTOS_CONSENTIMIENTO = {
  titulo: "Tu ubicación, con tu permiso",
  introduccion:
    "Antes de usar la ubicación necesitamos tu autorización. Te explicamos en simple qué haremos con ella.",
  puntos: [
    {
      titulo: "Qué recogemos",
      detalle: "La ubicación de tu celular (latitud y longitud).",
    },
    {
      titulo: "Cuándo",
      detalle: "Solo mientras un trabajo está «en camino». Se detiene al llegar, al cancelar o al cerrar sesión. Nunca en segundo plano.",
    },
    {
      titulo: "Para qué",
      detalle: "Para que la oficina sepa por dónde vas y pueda verificar tu llegada.",
    },
    {
      titulo: "Cuánto tiempo se guarda",
      detalle: "90 días. Después se borra.",
    },
  ],
  derechos:
    "Como titular de tus datos puedes conocerlos, actualizarlos, rectificarlos, pedir que se supriman y revocar esta autorización cuando quieras (Ley 1581 de 2012). Puedes hacerlo desde la pestaña Cuenta.",
  noBloquea: "Si dices que no, puedes trabajar igual. Solo no se registrará tu recorrido.",
  aceptar: "Acepto",
  rechazar: "Ahora no",
  accesibilidadAceptar: "Aceptar que se use mi ubicación mientras voy en camino",
  accesibilidadRechazar: "No permitir el uso de mi ubicación",
} as const;

export const TEXTOS_CONSENTIMIENTO_CUENTA = {
  titulo: "Ubicación",
  estado: {
    aceptado: "Autorizada. Se usa solo mientras un trabajo está «en camino».",
    rechazado: "No autorizada. Tu recorrido no se registra.",
    pendiente: "Aún no has respondido.",
  },
  revocar: "Revocar autorización",
  activar: "Revisar y autorizar",
  error: "No se pudo guardar tu respuesta. Inténtalo de nuevo.",
} as const;
