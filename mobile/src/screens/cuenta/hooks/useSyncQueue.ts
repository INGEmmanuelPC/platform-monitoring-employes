import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";

import { processSyncQueue } from "@/src/data/trabajos";
import { describeSyncFailure } from "@/src/domain/syncError";

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
      return true;
    } catch (cause) {
      setSyncMessage(describeSyncFailure(cause));
      return false;
    } finally {
      setSyncing(false);
    }
  };

  return { syncMessage, syncing, syncNow };
}
