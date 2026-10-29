import { useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { marcarEnCamino } from "@/src/data/trabajos";
import { useAuth } from "@/src/session/AuthProvider";

export function useWorkDeparture(workId: string, onMarked: () => Promise<void>) {
  const database = useSQLiteContext();
  const { session, profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsDeparted = async () => {
    const technicianId = session?.user.id;
    if (!workId || !technicianId) {
      setError("No se pudo identificar el trabajo.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await marcarEnCamino(database, technicianId, workId, profile?.role ?? "tecnico");
      await onMarked();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo actualizar el trabajo en este dispositivo.");
    } finally {
      setSaving(false);
    }
  };

  return { error, markAsDeparted, saving };
}
