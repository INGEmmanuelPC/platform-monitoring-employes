import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { useTrabajos } from "@/src/data/use-trabajos";

import { TrabajoHistorialCard } from "./components/TrabajoHistorialCard";

export default function HistorialScreen() {
  const { trabajos, loading, error } = useTrabajos();
  const finalizados = trabajos.filter((trabajo) => trabajo.estado === "COMPLETADO" || trabajo.estado === "CERRADO");

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-3 p-4">
        <Text className="text-sm text-neutral-500">Trabajos anteriores</Text>
        {loading ? <ActivityIndicator color="#0a7ea4" /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {!loading && !error && finalizados.length === 0 ? <EmptyState message="Todavía no tienes trabajos anteriores." /> : null}
        {finalizados.map((trabajo) => (
          <TrabajoHistorialCard key={trabajo.id} trabajo={trabajo} />
        ))}
      </View>
    </ScrollView>
  );
}
