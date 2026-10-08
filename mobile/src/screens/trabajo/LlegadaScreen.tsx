import { ActivityIndicator, ScrollView, Text } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";

import { useWorkArrival } from "./hooks/useWorkArrival";

export default function LlegadaScreen() {
  const { error, markArrival, saving } = useWorkArrival();

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="min-h-full items-center justify-center gap-6 p-6">
      <IconSymbol size={72} name="mappin.and.ellipse" color="#1B4965" />
      <Text className="text-center text-lg text-neutral-700">Se guardará la hora de llegada y el estado del trabajo en el dispositivo.</Text>
      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
      <Button text={saving ? "Guardando..." : "Ya llegué"} onPress={markArrival} disabled={saving} className="w-full" />
      {saving ? <ActivityIndicator color="#0a7ea4" /> : null}
    </ScrollView>
  );
}
