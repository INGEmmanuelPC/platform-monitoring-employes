import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { marcarLlegada } from "@/src/data/trabajos";
import { useAuth } from "@/src/session/AuthProvider";

export function useWorkArrival() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useSQLiteContext();
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markArrival = async () => {
    if (!session?.user.id || !id) {
      setError("No se pudo identificar el trabajo.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await marcarLlegada(database, session.user.id, id);
      router.replace({ pathname: "/trabajo/[id]/evidencia", params: { id } });
    } catch {
      setError("No se pudo guardar la llegada en el dispositivo.");
    } finally {
      setSaving(false);
    }
  };

  return { error, markArrival, saving };
}