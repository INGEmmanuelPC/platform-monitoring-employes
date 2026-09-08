import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { guardarEvidencia } from "@/src/data/trabajos";

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

  const takePhoto = async (tipo: "FOTO_ANTES" | "FOTO_DESPUES") => {
    setTaking(tipo);
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Necesitas permitir el uso de la cámara para tomar la foto.");
      setTaking(null);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]?.uri && id) {
      try {
        await guardarEvidencia(database, id, tipo, result.assets[0].uri);
        if (tipo === "FOTO_ANTES") {
          setBeforeUri(result.assets[0].uri);
        } else {
          setAfterUri(result.assets[0].uri);
        }
      } catch {
        setError("No se pudo guardar la foto en el dispositivo.");
      }
    }
    setTaking(null);
  };

  return (
    <View className="flex-1 gap-6 bg-neutral-50 p-6">
      <View className="items-center gap-3 rounded-xl border border-neutral-200 bg-white p-6">
        <IconSymbol size={48} name="camera.fill" color="#1B4965" />
        <Text className="text-base font-semibold text-neutral-900">Antes</Text>
        {beforeUri ? <Image source={{ uri: beforeUri }} className="h-32 w-full" /> : null}
        <Button
          text={taking === "FOTO_ANTES" ? "Guardando..." : "Tomar foto"}
          onPress={() => takePhoto("FOTO_ANTES")}
          disabled={taking !== null}
          className="w-full"
        />
      </View>

      <View className="items-center gap-3 rounded-xl border border-neutral-200 bg-white p-6">
        <IconSymbol size={48} name="camera.fill" color="#1B4965" />
        <Text className="text-base font-semibold text-neutral-900">Después</Text>
        {afterUri ? <Image source={{ uri: afterUri }} className="h-32 w-full" /> : null}
        <Button
          text={taking === "FOTO_DESPUES" ? "Guardando..." : "Tomar foto"}
          onPress={() => takePhoto("FOTO_DESPUES")}
          disabled={taking !== null}
          className="w-full"
        />
      </View>

      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
      <Text className="text-center text-xs text-neutral-400">
        Se necesita al menos una foto de después para terminar el trabajo.
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
    </View>
  );
}
