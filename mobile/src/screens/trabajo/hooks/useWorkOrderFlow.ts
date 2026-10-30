import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getEvidencias, getTrabajo } from "@/src/data/trabajos";
import type { TrabajoLocal } from "@/src/data/types";
import { useAuth } from "@/src/session/AuthProvider";

import type { Paso } from "../components/PasoLink";

export function useWorkOrderFlow() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const database = useSQLiteContext();
  const { session, profile } = useAuth();
  const [trabajo, setTrabajo] = useState<TrabajoLocal | null>(null);
  const [evidenceTypes, setEvidenceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (isActive: () => boolean = () => true) => {
    const technicianId = session?.user.id;
    if (!id || !technicianId) {
      if (isActive()) {
        setTrabajo(null);
        setLoading(false);
      }
      return;
    }

    if (isActive()) {
      setLoading(true);
      setError(null);
    }
    try {
      const [trabajoLocal, evidencias] = await Promise.all([
        getTrabajo(database, technicianId, id, profile?.role ?? "tecnico"),
        getEvidencias(database, id),
      ]);
      if (isActive()) {
        setTrabajo(trabajoLocal);
        setEvidenceTypes(evidencias.map((evidencia) => evidencia.tipo));
      }
    } catch {
      if (isActive()) setError("No se pudo cargar el trabajo guardado en el dispositivo.");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [database, id, profile?.role, session?.user.id]);

  useEffect(() => {
    let active = true;
    void refresh(() => active);
    return () => { active = false; };
  }, [refresh]);

  const pasos: Paso[] = [
    { ruta: "llegada", titulo: "Marcar llegada", icono: "mappin.and.ellipse", hecho: trabajo?.llegada_at !== null && trabajo?.llegada_at !== undefined },
    { ruta: "evidencia", titulo: "Fotos antes y después", icono: "camera.fill", hecho: evidenceTypes.includes("FOTO_ANTES") && evidenceTypes.includes("FOTO_DESPUES") },
    { ruta: "dictado", titulo: "Contar qué hiciste", icono: "mic.fill", hecho: evidenceTypes.includes("NOTA"), opcional: true },
    { ruta: "firma", titulo: "Firma del cliente", icono: "signature", hecho: evidenceTypes.includes("FIRMA") },
  ];

  return { error, loading, pasos, refresh, trabajo };
}
