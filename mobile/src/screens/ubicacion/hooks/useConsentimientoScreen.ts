import { useRouter } from "expo-router";
import { useState } from "react";

import type { RespuestaConsentimiento } from "@/src/domain/consentimiento";
import { useConsentimiento } from "@/src/session/ConsentimientoProvider";

export function useConsentimientoScreen() {
  const router = useRouter();
  const { responder: guardarRespuesta } = useConsentimiento();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const responder = async (respuesta: RespuestaConsentimiento) => {
    setSaving(true);
    setError(false);
    try {
      await guardarRespuesta(respuesta);
    } catch {
      // No se pudo guardar en el almacén seguro: se avisa, pero el técnico
      // sigue (regla 1). La próxima vez se le volverá a preguntar.
      setError(true);
    } finally {
      setSaving(false);
    }
    router.replace("/");
  };

  return { error, responder, saving };
}
