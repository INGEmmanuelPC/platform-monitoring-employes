import { ScrollView, Text, View } from "react-native";

import { TRABAJOS_EJEMPLO } from "@/constants/trabajos";

// Sirve para una sola cosa: cuando un cliente reclama, el técnico busca aquí
// la evidencia de lo que hizo y cuándo.
export default function HistorialScreen() {
  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-3 p-4">
        <Text className="text-sm text-neutral-500">Trabajos anteriores</Text>

        {TRABAJOS_EJEMPLO.map((trabajo) => (
          <View
            key={trabajo.id}
            className="gap-1 rounded-xl border border-neutral-200 bg-white p-4"
          >
            <Text className="text-base font-semibold text-neutral-900">
              {trabajo.cliente}
            </Text>
            <Text className="text-sm text-neutral-600">{trabajo.descripcion}</Text>
            <Text className="mt-1 text-xs text-neutral-400">
              Reporte: {trabajo.reporte}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
