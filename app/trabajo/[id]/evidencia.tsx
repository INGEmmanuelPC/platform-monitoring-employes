import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Las fotos se comprimen al guardarse y suben por un carril aparte, de a una
// con reintento. Una foto sin comprimir llena un celular de gama baja en días.
export default function EvidenciaScreen() {
  return (
    <View className="flex-1 gap-6 bg-neutral-50 p-6">
      <View className="items-center gap-3 rounded-xl border border-neutral-200 bg-white p-6">
        <IconSymbol size={48} name="camera.fill" color="#1B4965" />
        <Text className="text-base font-semibold text-neutral-900">Antes</Text>
        <Button text="Tomar foto" onPress={() => {}} className="w-full" />
      </View>

      <View className="items-center gap-3 rounded-xl border border-neutral-200 bg-white p-6">
        <IconSymbol size={48} name="camera.fill" color="#1B4965" />
        <Text className="text-base font-semibold text-neutral-900">Después</Text>
        <Button text="Tomar foto" onPress={() => {}} className="w-full" />
      </View>

      <Text className="text-center text-xs text-neutral-400">
        Se necesita al menos una foto de después para terminar el trabajo.
      </Text>
    </View>
  );
}
