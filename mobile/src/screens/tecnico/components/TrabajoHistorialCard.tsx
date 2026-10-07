import { Text, View } from "react-native";

import type { TrabajoLocal } from "@/src/data/types";

export function TrabajoHistorialCard({ trabajo }: { trabajo: TrabajoLocal }) {
  return (
    <View className="gap-1 rounded-xl border border-neutral-200 bg-white p-4">
      <Text className="text-base font-semibold text-neutral-900">{trabajo.cliente}</Text>
      <Text className="text-sm text-neutral-600">{trabajo.descripcion}</Text>
      <Text className="mt-1 text-xs text-neutral-400">Reporte: {trabajo.reporte}</Text>
    </View>
  );
}
