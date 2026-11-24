import { useSQLiteContext } from "expo-sqlite";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/src/session/AuthProvider";
import { listEntities } from "@/src/api/entities";
import { describeSyncFailure } from "@/src/domain/syncError";

import { sincronizarCola, suscribirSincronizacion } from "./sync-runner";
import { getTrabajos, refreshTrabajosFromServer } from "./trabajos";
import type { TrabajoLocal } from "./types";

export function useTrabajos() {
  const database = useSQLiteContext();
  const { session, profile, profileError } = useAuth();
  const role = profile?.role ?? "tecnico";
  const [trabajos, setTrabajos] = useState<TrabajoLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const focused = useRef(false);
  const requestVersion = useRef(0);

  // silent: refresco que no muestra el esqueleto de carga (lo usa la sync automática).
  const loadTrabajos = useCallback(async (silent = false) => {
    const currentRequest = ++requestVersion.current;
    const isActive = () => focused.current && requestVersion.current === currentRequest;
    const userId = session?.user.id;

    if (!userId) {
      if (isActive()) {
        setTrabajos([]);
        setLoading(false);
      }
      return;
    }
    const authenticatedUserId: string = userId;

    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const localTrabajos = await getTrabajos(database, authenticatedUserId, role);
      if (isActive()) {
        setTrabajos(localTrabajos);
      }

      let syncFailure: unknown;
      if (profile?.role === "tecnico" || profile?.role === "admin") {
        try {
          await sincronizarCola(database, authenticatedUserId, profile.role);
        } catch (syncError) {
          syncFailure = syncError;
        }
      }

      try {
        const remoteTrabajos = await listEntities("ordenes", "");
        await refreshTrabajosFromServer(database, remoteTrabajos as TrabajoLocal[], authenticatedUserId, role);
        const refreshedTrabajos = await getTrabajos(database, authenticatedUserId, role);
        if (isActive()) setTrabajos(refreshedTrabajos);
        if (profileError && isActive()) {
          setError("No se pudo verificar tu rol. Por seguridad solo se muestran trabajos asignados a esta cuenta.");
        } else if (syncFailure && isActive()) {
          setError(`Hay cambios pendientes que no se pudieron sincronizar. ${describeSyncFailure(syncFailure, profile?.role)}`);
        }
      } catch {
        if (isActive()) {
          setError(localTrabajos.length > 0
            ? "No se pudieron actualizar los trabajos. Se muestra la copia guardada en este dispositivo."
            : "No se pudieron consultar los trabajos. Comprueba la conexión y tus permisos.");
        }
      }
    } catch {
      if (isActive()) setError("No se pudieron cargar los trabajos desde este dispositivo.");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [database, profile?.role, profileError, role, session?.user.id]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    void loadTrabajos();
    return () => {
      focused.current = false;
      requestVersion.current += 1;
    };
  }, [loadTrabajos]));

  // Cuando la sincronización automática subió cambios, la lista visible se
  // actualiza sola, sin esqueleto y sin que el técnico tenga que hacer nada.
  useEffect(() => suscribirSincronizacion(() => {
    if (focused.current) void loadTrabajos(true);
  }), [loadTrabajos]);

  const refresh = useCallback(() => {
    if (focused.current) void loadTrabajos();
  }, [loadTrabajos]);

  return { trabajos, loading, error, refresh };
}
