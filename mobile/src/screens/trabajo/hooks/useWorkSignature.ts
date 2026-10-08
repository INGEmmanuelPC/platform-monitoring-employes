import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { finalizarTrabajo, guardarFirma } from "@/src/data/trabajos";
import { useAuth } from "@/src/session/AuthProvider";

import type { FirmaTouchEvent } from "../components/FirmaPad";

export function useWorkSignature() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useSQLiteContext();
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signaturePath, setSignaturePath] = useState("");

  const startStroke = (event: FirmaTouchEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setSignaturePath(`M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
  };

  const continueStroke = (event: FirmaTouchEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    setSignaturePath((current) => `${current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
  };

  const finishWork = async () => {
    if (!id || !session?.user.id) {
      setError("No se pudo identificar el trabajo.");
      return;
    }
    if (!signaturePath) {
      setError("El cliente debe firmar antes de terminar.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await guardarFirma(database, id, signaturePath);
      await finalizarTrabajo(database, session.user.id, id);
      router.replace("/");
    } catch {
      setError("No se pudo finalizar el trabajo en el dispositivo.");
    } finally {
      setSaving(false);
    }
  };

  return {
    continueStroke,
    error,
    finishWork,
    saving,
    signaturePath,
    startStroke,
    clearSignature: () => setSignaturePath(""),
  };
}