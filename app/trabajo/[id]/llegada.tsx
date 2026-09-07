import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Guarda hora y coordenadas al mejor esfuerzo. Si el GPS no responde en unos
// segundos se registra igual con una bandera: nunca puede bloquear al técnico.
export default function LlegadaScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-neutral-50 p-6">
      <IconSymbol size={72} name="mappin.and.ellipse" color="#1B4965" />
      <Text className="text-center text-lg text-neutral-700">
        Se guardará la hora y el lugar donde estás ahora.
      </Text>
      <Button text="Ya llegué" onPress={() => {}} className="w-full" />
    </View>
  );
}
