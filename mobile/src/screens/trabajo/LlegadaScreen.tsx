import { ActivityIndicator, ScrollView, Text } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";

import { useWorkArrival } from "./hooks/useWorkArrival";

export default function LlegadaScreen() {
  const { error, markArrival, saving } = useWorkArrival();

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }} contentContainerClassName="min-h-full items-center justify-center gap-6 p-6">
      <IconSymbol size={72} name="mappin.and.ellipse" color={DESIGN.colors.brand} />
      <Text className="text-center text-lg" style={{ color: DESIGN.colors.text }}>Se guardará la hora de llegada y el estado del trabajo en el dispositivo.</Text>
      {error ? <Text className="text-center text-sm" style={{ color: DESIGN.colors.error }}>{error}</Text> : null}
      <Button text={saving ? "Guardando..." : "Ya llegué"} onPress={markArrival} disabled={saving} className="w-full" />
      {saving ? <ActivityIndicator color={DESIGN.colors.brand} /> : null}
    </ScrollView>
  );
}
