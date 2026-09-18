import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { useAuth } from "@/src/session/AuthProvider";
import { listEntities } from "@/src/api/entities";

import { getTrabajos, processSyncQueue, upsertTrabajos } from "./trabajos";
import type { TrabajoLocal } from "./types";

export function useTrabajos() {
  const database = useSQLiteContext();
  const { session } = useAuth();
  const [trabajos, setTrabajos] = useState<TrabajoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    const userId = session?.user.id;

    if (!userId) {
      setTrabajos([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    const authenticatedUserId: string = userId;

    async function loadTrabajos() {
      setLoading(true);
      setError(null);
      await processSyncQueue(database).catch(() => undefined);
      const localTrabajos = await getTrabajos(database, authenticatedUserId);
      if (active) {
        setTrabajos(localTrabajos);
      }

      const remoteTrabajos = await listEntities("ordenes", "");
      if (remoteTrabajos.length) {
        await upsertTrabajos(database, remoteTrabajos as TrabajoLocal[]);
        const refreshedTrabajos = await getTrabajos(database, authenticatedUserId);
        if (active) setTrabajos(refreshedTrabajos);
      }

      if (active) {
        setLoading(false);
      }
    }

    loadTrabajos().catch(() => {
      if (active) {
        setError("No se pudieron cargar los trabajos. Comprueba que el backend esté activo.");
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [database, session?.user.id]));

  return { trabajos, loading, error };
}
