import { Link } from "expo-router";
import { Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { ETIQUETA_TRABAJO, formatHora } from "@/constants/trabajos";
import type { TrabajoLocal } from "@/src/data/types";

export function TrabajoHoyCard({ trabajo }: { trabajo: TrabajoLocal }) {
  return (
    <Link accessibilityRole="button" href={{ pathname: "/trabajo/[id]", params: { id: trabajo.id } }} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm active:bg-blue-50">
      <View className="w-full gap-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-neutral-500">{formatHora(trabajo.hora_programada)}</Text>
          <Text className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">{ETIQUETA_TRABAJO[trabajo.estado]}</Text>
        </View>
        <Text className="text-lg font-semibold text-neutral-900">{trabajo.cliente}</Text>
        <Text className="text-sm text-neutral-600">{trabajo.descripcion}</Text>
        <View className="mt-1 flex-row items-center gap-1">
          <IconSymbol size={14} name="mappin.and.ellipse" color="#737373" />
          <Text className="flex-1 text-xs text-neutral-500">{trabajo.direccion}</Text>
        </View>
      </View>
    </Link>
  );
}
