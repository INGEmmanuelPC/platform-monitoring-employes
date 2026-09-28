import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { useTrabajos } from "@/src/data/use-trabajos";

// Sirve para una sola cosa: cuando un cliente reclama, el técnico busca aquí
// la evidencia de lo que hizo y cuándo.
export default function HistorialScreen() {
  const { trabajos, loading, error } = useTrabajos();
  const finalizados = trabajos.filter((trabajo) => trabajo.estado === "COMPLETADO" || trabajo.estado === "CERRADO");

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-3 p-4">
        <Text className="text-sm text-neutral-500">Trabajos anteriores</Text>
        {loading ? <ActivityIndicator color="#0a7ea4" /> : null}
        {error ? <Text className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</Text> : null}

        {!loading && !error && finalizados.length === 0 ? (
          <Text className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            Todavía no tienes trabajos anteriores.
          </Text>
        ) : null}

        {finalizados.map((trabajo) => (
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
