import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { useTrabajos } from "@/src/data/use-trabajos";

import { TrabajoHoyCard } from "./components/TrabajoHoyCard";

export default function HoyScreen() {
  const { trabajos, loading, error } = useTrabajos();
  const pendientes = trabajos.filter((trabajo) => trabajo.estado !== "COMPLETADO" && trabajo.estado !== "CERRADO");

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-3 p-4">
        <Text className="text-sm text-neutral-500">{pendientes.length} trabajos para hoy</Text>
        {loading ? <ActivityIndicator color="#0a7ea4" /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {!loading && pendientes.length === 0 ? <EmptyState message="No tienes trabajos asignados." /> : null}
        {pendientes.map((trabajo) => (
          <TrabajoHoyCard key={trabajo.id} trabajo={trabajo} />
        ))}
      </View>
    </ScrollView>
  );
}
