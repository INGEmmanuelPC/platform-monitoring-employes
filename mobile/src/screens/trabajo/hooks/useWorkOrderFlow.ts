import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getEvidencias, getTrabajo } from "@/src/data/trabajos";
import type { TrabajoLocal } from "@/src/data/types";
import { useAuth } from "@/src/session/AuthProvider";

import type { Paso } from "../components/PasoLink";

export function useWorkOrderFlow() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const database = useSQLiteContext();
  const { session } = useAuth();
  const [trabajo, setTrabajo] = useState<TrabajoLocal | null>(null);
  const [evidenceTypes, setEvidenceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const tecnicoId = session?.user.id;

    if (!id || !tecnicoId) {
      setTrabajo(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    Promise.all([getTrabajo(database, tecnicoId, id), getEvidencias(database, id)])
      .then(([trabajoLocal, evidencias]) => {
        if (active) {
          setTrabajo(trabajoLocal);
          setEvidenceTypes(evidencias.map((evidencia) => evidencia.tipo));
        }
      })
      .catch(() => {
        if (active) setError("No se pudo cargar el trabajo guardado en el dispositivo.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [database, id, session?.user.id]);

  const pasos: Paso[] = [
    { ruta: "llegada", titulo: "Marcar llegada", icono: "mappin.and.ellipse", hecho: trabajo?.llegada_at !== null && trabajo?.llegada_at !== undefined },
    { ruta: "evidencia", titulo: "Fotos antes y después", icono: "camera.fill", hecho: evidenceTypes.includes("FOTO_ANTES") && evidenceTypes.includes("FOTO_DESPUES") },
    { ruta: "dictado", titulo: "Contar qué hiciste", icono: "mic.fill", hecho: evidenceTypes.includes("NOTA"), opcional: true },
    { ruta: "firma", titulo: "Firma del cliente", icono: "signature", hecho: evidenceTypes.includes("FIRMA") },
  ];

  return { error, loading, pasos, trabajo };
}