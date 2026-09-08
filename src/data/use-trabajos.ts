import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

import { supabase } from "@/src/api/client";
import { useAuth } from "@/src/session/AuthProvider";

import { getTrabajos, upsertTrabajos } from "./trabajos";
import type { TrabajoLocal } from "./types";

export function useTrabajos() {
  const database = useSQLiteContext();
  const { session } = useAuth();
  const [trabajos, setTrabajos] = useState<TrabajoLocal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      const localTrabajos = await getTrabajos(database, authenticatedUserId);
      if (active) {
        setTrabajos(localTrabajos);
      }

      const { data, error } = await supabase
        .from("trabajos")
        .select(
          "id, tecnico_id, cliente, direccion, descripcion, hora_programada, estado, sync, reporte, created_at, updated_at",
        )
        .eq("tecnico_id", authenticatedUserId);

      if (!error && data?.length) {
        await upsertTrabajos(database, data as TrabajoLocal[]);
        const refreshedTrabajos = await getTrabajos(database, authenticatedUserId);
        if (active) {
          setTrabajos(refreshedTrabajos);
        }
      }

      if (active) {
        setLoading(false);
      }
    }

    loadTrabajos().catch(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [database, session?.user.id]);

  return { trabajos, loading };
}
