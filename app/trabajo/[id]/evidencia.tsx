import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getEvidencias, guardarEvidencia } from "@/src/data/trabajos";

// Las fotos se comprimen al guardarse y suben por un carril aparte, de a una
// con reintento. Una foto sin comprimir llena un celular de gama baja en días.
export default function EvidenciaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useSQLiteContext();
  const [beforeUri, setBeforeUri] = useState<string | null>(null);
  const [afterUri, setAfterUri] = useState<string | null>(null);
  const [taking, setTaking] = useState<"FOTO_ANTES" | "FOTO_DESPUES" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEvidencias(database, id).then((evidencias) => {
      const before = evidencias.find((item) => item.tipo === "FOTO_ANTES")?.storage_path;
      const after = evidencias.find((item) => item.tipo === "FOTO_DESPUES")?.storage_path;
      if (before) setBeforeUri(before);
      if (after) setAfterUri(after);
    }).catch(() => setError("No se pudieron cargar las fotos guardadas."));
  }, [database, id]);

  const takePhoto = async (tipo: "FOTO_ANTES" | "FOTO_DESPUES") => {
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

      if (!result.canceled && result.assets[0]?.uri && id) {
        await guardarEvidencia(database, id, tipo, result.assets[0].uri);
        if (tipo === "FOTO_ANTES") {
          setBeforeUri(result.assets[0].uri);
        } else {
          setAfterUri(result.assets[0].uri);
        }
      }
    } catch {
      setError("No se pudo tomar o guardar la foto en el dispositivo.");
    } finally {
      setTaking(null);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerClassName="gap-5 p-5 pb-10"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-center text-base text-neutral-700">
        Registra una evidencia antes y otra después del servicio.
      </Text>

      <View className="gap-3 rounded-xl border border-neutral-200 bg-white p-5">
        <IconSymbol size={48} name="camera.fill" color="#1B4965" />
        <Text className="text-base font-semibold text-neutral-900">Antes</Text>
        {beforeUri ? <Image source={{ uri: beforeUri }} className="h-44 w-full rounded-lg" resizeMode="cover" /> : null}
        <Button
          text={taking === "FOTO_ANTES" ? "Guardando..." : "Tomar foto"}
          onPress={() => takePhoto("FOTO_ANTES")}
          disabled={taking !== null}
          className="w-full"
        />
      </View>

      <View className="gap-3 rounded-xl border border-neutral-200 bg-white p-5">
        <IconSymbol size={48} name="camera.fill" color="#1B4965" />
        <Text className="text-base font-semibold text-neutral-900">Después</Text>
        {afterUri ? <Image source={{ uri: afterUri }} className="h-44 w-full rounded-lg" resizeMode="cover" /> : null}
        <Button
          text={taking === "FOTO_DESPUES" ? "Guardando..." : "Tomar foto"}
          onPress={() => takePhoto("FOTO_DESPUES")}
          disabled={taking !== null}
          className="w-full"
        />
      </View>

      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
      <Text className="text-center text-xs text-neutral-500">
        La foto de después es necesaria para continuar. Puedes reemplazar cualquiera antes de avanzar.
      </Text>
      <Button
        text="Continuar"
        onPress={() =>
          router.replace({ pathname: "/trabajo/[id]/dictado", params: { id } })
        }
        disabled={!afterUri || taking !== null}
        className="w-full"
      />
      {taking ? <ActivityIndicator color="#0a7ea4" /> : null}
    </ScrollView>
  );
}
