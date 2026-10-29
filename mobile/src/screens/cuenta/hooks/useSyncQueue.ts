import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";

import { processSyncQueue } from "@/src/data/trabajos";
import { describeSyncFailure } from "@/src/domain/syncError";
import { useAuth } from "@/src/session/AuthProvider";

export function useSyncQueue() {
  const database = useSQLiteContext();
  const { profile, session } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const syncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      if (!profile || !session?.user.id) throw new Error("No se pudo verificar la cuenta activa.");
      const count = await processSyncQueue(database, session.user.id, profile.role);
      setSyncMessage(count ? `${count} cambios sincronizados.` : "No hay cambios pendientes.");
      return true;
    } catch (cause) {
      setSyncMessage(describeSyncFailure(cause, profile?.role));
      return false;
    } finally {
      setSyncing(false);
    }
  };

  return { syncMessage, syncing, syncNow };
}
