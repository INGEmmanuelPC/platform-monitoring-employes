import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";

import { processSyncQueue } from "@/src/data/trabajos";

export function useSyncQueue() {
  const database = useSQLiteContext();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const syncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const count = await processSyncQueue(database);
      setSyncMessage(count ? `${count} cambios sincronizados.` : "No hay cambios pendientes.");
    } catch {
      setSyncMessage("No se pudo sincronizar. Revisa la conexión y vuelve a intentarlo.");
    } finally {
      setSyncing(false);
    }
  };

  return { syncMessage, syncing, syncNow };
}
