import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from "react";

import type { EstadoConsentimiento, RespuestaConsentimiento } from "@/src/domain/consentimiento";

import { useAuth } from "./AuthProvider";
import { guardarConsentimiento, leerConsentimiento } from "./consentimientoStorage";

type ConsentimientoContextValue = {
  // "cargando" solo mientras se lee el almacén seguro tras iniciar sesión.
  estado: EstadoConsentimiento | "cargando";
  responder: (respuesta: RespuestaConsentimiento) => Promise<void>;
};

const ConsentimientoContext = createContext<ConsentimientoContextValue | undefined>(undefined);

export function ConsentimientoProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [estado, setEstado] = useState<EstadoConsentimiento | "cargando">("cargando");

  useEffect(() => {
    let activo = true;
    if (!userId) {
      setEstado("cargando");
      return;
    }
    setEstado("cargando");
    void leerConsentimiento(userId).then((leido) => {
      if (activo) setEstado(leido);
    });
    return () => {
      activo = false;
    };
  }, [userId]);

  const responder = useCallback(async (respuesta: RespuestaConsentimiento) => {
    if (!userId) return;
    // El estado en memoria se actualiza siempre: aunque el almacén falle, el
    // técnico no queda atrapado en la pantalla (regla 1). Si no se pudo
    // guardar, se volverá a preguntar la próxima vez.
    setEstado(respuesta);
    await guardarConsentimiento(userId, respuesta);
  }, [userId]);

  return (
    <ConsentimientoContext.Provider value={{ estado, responder }}>
      {children}
    </ConsentimientoContext.Provider>
  );
}

export function useConsentimiento() {
  const context = useContext(ConsentimientoContext);
  if (!context) throw new Error("useConsentimiento debe usarse dentro de ConsentimientoProvider");
  return context;
}
