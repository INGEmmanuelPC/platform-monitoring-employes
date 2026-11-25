import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";

import { TEXTOS_CANCELACION as T } from "@/constants/cancelacion";
import { updateEntity } from "@/src/api/entities";
import { aplicarCancelacionRemota } from "@/src/data/trabajos";
import { problemaMotivoCancelacion } from "@/src/domain/estadoTrabajo";

// Cancelar es del administrador y requiere red: va directo al servidor, que
// valida el rol y el motivo y avisa al técnico por push.
export function useWorkCancellation(trabajoId: string, onCancelled: () => void) {
  const database = useSQLiteContext();
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelar = async () => {
    const problema = problemaMotivoCancelacion(motivo);
    if (problema) {
      setError(problema === "vacio" ? T.motivoVacio : T.motivoLargo);
      return;
    }
    const limpio = motivo.trim();
    setSaving(true);
    setError(null);
    try {
      await updateEntity("ordenes", trabajoId, { estado: "CANCELADO", motivo_cancelacion: limpio });
      await aplicarCancelacionRemota(database, trabajoId, limpio);
      setAbierto(false);
      setMotivo("");
      onCancelled();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : T.error);
    } finally {
      setSaving(false);
    }
  };

  const cerrar = () => {
    setAbierto(false);
    setError(null);
  };

  return { abierto, abrir: () => setAbierto(true), cancelar, cerrar, error, motivo, saving, setMotivo };
}
