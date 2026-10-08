import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { getEvidencias, guardarEvidencia } from "@/src/data/trabajos";

type TipoEvidencia = "FOTO_ANTES" | "FOTO_DESPUES";

export function useWorkEvidence() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useSQLiteContext();
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);
  const [taking, setTaking] = useState<TipoEvidencia | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let active = true;
    getEvidencias(database, id)
      .then((evidencias) => {
        if (!active) return;
        setBeforeUri(evidencias.find((item) => item.tipo === "FOTO_ANTES")?.storage_path ?? null);
        setAfterUri(evidencias.find((item) => item.tipo === "FOTO_DESPUES")?.storage_path ?? null);
      })
      .catch(() => {
        if (active) setError("No se pudieron cargar las fotos guardadas.");
      });

    return () => {
      active = false;
    };
  }, [database, id]);

  const takePhoto = async (tipo: TipoEvidencia) => {
    setTaking(tipo);
    setError(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError("Necesitas permitir el uso de la cámara para tomar la foto.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      const uri = result.assets?.[0]?.uri;
      if (!result.canceled && uri && id) {
        await guardarEvidencia(database, id, tipo, uri);
        if (tipo === "FOTO_ANTES") setBeforeUri(uri);
        else setAfterUri(uri);
      }
    } catch {
      setError("No se pudo tomar o guardar la foto en el dispositivo.");
    } finally {
      setTaking(null);
    }
  };

  const continueToNote = () => {
    router.replace({ pathname: "/trabajo/[id]/dictado", params: { id } });
  };

  return {
    afterUri,
    beforeUri,
    continueToNote,
    error,
    takePhoto,
    taking,
  };
}