import { Text, View } from "react-native";

import { ETIQUETA_TRABAJO } from "@/constants/trabajos";
import type { TrabajoLocal } from "@/src/data/types";

export function TrabajoResumenCard({ trabajo }: { trabajo: TrabajoLocal }) {
  return (
    <View className="gap-1 rounded-xl border border-neutral-200 bg-white p-4">
      <Text className="text-xs font-semibold text-neutral-500">{ETIQUETA_TRABAJO[trabajo.estado]}</Text>
      <Text className="text-xl font-semibold text-neutral-900">{trabajo.cliente}</Text>
      <Text className="text-sm text-neutral-600">{trabajo.descripcion}</Text>
      <Text className="mt-1 text-xs text-neutral-500">{trabajo.direccion}</Text>
    </View>
  );
}
