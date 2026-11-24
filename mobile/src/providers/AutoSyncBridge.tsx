import { useEffect } from "react";

import { desregistrarSyncSegundoPlano, registrarSyncSegundoPlano } from "@/src/data/background-sync";
import { useAutoSync } from "@/src/hooks/useAutoSync";
import { useAuth } from "@/src/session/AuthProvider";

// Componente sin interfaz: activa la sincronización automática en primer plano
// y registra (o quita) la tarea de segundo plano según haya sesión.
export function AutoSyncBridge() {
  const { session } = useAuth();
  const haySesion = Boolean(session);
  useAutoSync();

  useEffect(() => {
    if (haySesion) void registrarSyncSegundoPlano();
    else void desregistrarSyncSegundoPlano();
  }, [haySesion]);

  return null;
}
