import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Solo graba y guarda el audio. La transcripción y la redacción ocurren en el
// servidor cuando haya señal, por eso este paso funciona sin conexión.
// Siempre hay salida manual: si prefiere escribir, escribe.
export default function DictadoScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-neutral-50 p-6">
      <IconSymbol size={72} name="mic.fill" color="#1B4965" />
      <Text className="text-center text-lg text-neutral-700">
        Cuenta con tus palabras qué encontraste y qué hiciste.
      </Text>
      <Button text="Grabar" onPress={() => {}} className="w-full" />
      <Text className="text-center text-xs text-neutral-400">
        El reporte lo redacta el sistema después. Nadie lo escribe a mano.
      </Text>
    </View>
  );
}
