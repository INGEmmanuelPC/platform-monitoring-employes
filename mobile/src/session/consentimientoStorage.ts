import * as SecureStore from "expo-secure-store";

import { PREFIJO_CLAVE_CONSENTIMIENTO, VERSION_CONSENTIMIENTO } from "@/constants/consentimiento";
import {
  claveConsentimiento,
  estadoDesdeAlmacen,
  serializarConsentimiento,
  type EstadoConsentimiento,
  type RespuestaConsentimiento,
} from "@/src/domain/consentimiento";

export async function leerConsentimiento(userId: string): Promise<EstadoConsentimiento> {
  try {
    const valor = await SecureStore.getItemAsync(claveConsentimiento(PREFIJO_CLAVE_CONSENTIMIENTO, userId));
    return estadoDesdeAlmacen(valor, VERSION_CONSENTIMIENTO);
  } catch {
    // Si el almacén seguro falla, se vuelve a preguntar. Nunca se asume un sí.
    return "pendiente";
  }
}

export async function guardarConsentimiento(userId: string, respuesta: RespuestaConsentimiento): Promise<void> {
  await SecureStore.setItemAsync(
    claveConsentimiento(PREFIJO_CLAVE_CONSENTIMIENTO, userId),
    serializarConsentimiento({ respuesta, version: VERSION_CONSENTIMIENTO, fecha: new Date().toISOString() }),
  );
}
