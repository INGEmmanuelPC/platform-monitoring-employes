import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { useTrabajos } from "@/src/data/use-trabajos";

// Sirve para una sola cosa: cuando un cliente reclama, el técnico busca aquí
// la evidencia de lo que hizo y cuándo.
export default function HistorialScreen() {
  const { trabajos, loading } = useTrabajos();

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-3 p-4">
        <Text className="text-sm text-neutral-500">Trabajos anteriores</Text>
        {loading ? <ActivityIndicator color="#0a7ea4" /> : null}

        {!loading && trabajos.length === 0 ? (
          <Text className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            Todavía no tienes trabajos anteriores.
          </Text>
        ) : null}

        {trabajos.map((trabajo) => (
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
