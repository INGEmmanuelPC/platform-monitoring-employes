import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getTrabajo } from "@/src/data/trabajos";
import type { TrabajoLocal } from "@/src/data/types";
import { useAuth } from "@/src/session/AuthProvider";

import type { Paso } from "../components/PasoLink";

export function useWorkOrderFlow() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const database = useSQLiteContext();
  const { session } = useAuth();
  const [trabajo, setTrabajo] = useState<TrabajoLocal | null>(null);
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
    getTrabajo(database, tecnicoId, id)
      .then((trabajoLocal) => {
        if (active) setTrabajo(trabajoLocal);
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
    { ruta: "evidencia", titulo: "Fotos antes y después", icono: "camera.fill", hecho: false },
    { ruta: "dictado", titulo: "Contar qué hiciste", icono: "mic.fill", hecho: false, opcional: true },
    { ruta: "firma", titulo: "Firma del cliente", icono: "signature", hecho: false },
  ];

  return { error, loading, pasos, trabajo };
}