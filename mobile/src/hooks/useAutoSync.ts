import { useNetworkState } from "expo-network";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";

import { notificarSincronizacion, sincronizarCola } from "@/src/data/sync-runner";
import { getPendingSync } from "@/src/data/trabajos";
import {
  debeSincronizar,
  esperaTrasFallo,
  esReconexion,
  esVueltaAPrimerPlano,
  hayRed,
  INTERVALO_REVISION_MS,
  type MotivoSync,
} from "@/src/domain/autoSync";
import { useAuth } from "@/src/session/AuthProvider";

/**
 * Sincroniza la cola sola, sin que el técnico tenga que acordarse:
 *  - al volver la red,
 *  - al volver a abrir la app (primer plano),
 *  - al iniciar sesión o cargar el perfil,
 *  - cada 30 s mientras haya algo pendiente (con espera creciente si falla).
 * Nunca bloquea nada: si falla, se calla y reintenta más tarde (regla 1).
 */
export function useAutoSync(): void {
  const database = useSQLiteContext();
  const { session, profile } = useAuth();
  const conRed = hayRed(useNetworkState());
  const userId = session?.user.id ?? null;
  const role = profile?.role ?? null;

  // Lo último que vieron los efectos, sin volver a crear los manejadores.
  const ultimo = useRef({ conRed, userId, role, fallos: 0, noAntesDe: 0 });
  const redAnterior = useRef(false);

  useEffect(() => {
    ultimo.current = { ...ultimo.current, conRed, userId, role };
  }, [conRed, userId, role]);

  const intentar = useCallback(async (motivo: MotivoSync) => {
    const estado = ultimo.current;
    if (!estado.userId || !estado.role) return;
    try {
      const pendientes = (await getPendingSync(database, estado.userId, estado.role)).length;
      const debe = debeSincronizar({
        hayRed: estado.conRed,
        sesionLista: true,
        pendientes,
        motivo,
        ahora: Date.now(),
        noAntesDe: estado.noAntesDe,
      });
      if (!debe) return;
      const procesados = await sincronizarCola(database, estado.userId, estado.role);
      ultimo.current.fallos = 0;
      ultimo.current.noAntesDe = 0;
      if (procesados > 0) notificarSincronizacion();
    } catch {
      ultimo.current.fallos += 1;
      ultimo.current.noAntesDe = Date.now() + esperaTrasFallo(ultimo.current.fallos);
    }
  }, [database]);

  // Volvió la red.
  useEffect(() => {
    if (esReconexion(redAnterior.current, conRed)) void intentar("reconexion");
    redAnterior.current = conRed;
  }, [conRed, intentar]);

  // Hay cuenta y rol conocidos (inicio de sesión o perfil recién cargado).
  useEffect(() => {
    if (userId && role) void intentar("inicio");
  }, [userId, role, intentar]);

  // Volvió a primer plano.
  useEffect(() => {
    let anterior = AppState.currentState;
    const suscripcion = AppState.addEventListener("change", (siguiente) => {
      if (esVueltaAPrimerPlano(anterior, siguiente)) void intentar("primer_plano");
      anterior = siguiente;
    });
    return () => suscripcion.remove();
  }, [intentar]);

  // Mientras la app está abierta, revisa cada tanto.
  useEffect(() => {
    const temporizador = setInterval(() => {
      if (AppState.currentState === "active") void intentar("periodico");
    }, INTERVALO_REVISION_MS);
    return () => clearInterval(temporizador);
  }, [intentar]);
}
