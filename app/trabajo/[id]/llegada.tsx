import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { marcarLlegada } from "@/src/data/trabajos";
import { useAuth } from "@/src/session/AuthProvider";

// Guarda hora y coordenadas al mejor esfuerzo. Si el GPS no responde en unos
// segundos se registra igual con una bandera: nunca puede bloquear al técnico.
export default function LlegadaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useSQLiteContext();
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLlegada = async () => {
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

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-neutral-50 p-6">
      <IconSymbol size={72} name="mappin.and.ellipse" color="#1B4965" />
      <Text className="text-center text-lg text-neutral-700">
        Se guardará la hora y el lugar donde estás ahora.
      </Text>
      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
      <Button
        text={saving ? "Guardando..." : "Ya llegué"}
        onPress={handleLlegada}
        disabled={saving}
        className="w-full"
      />
      {saving ? <ActivityIndicator color="#0a7ea4" /> : null}
    </View>
  );
}
