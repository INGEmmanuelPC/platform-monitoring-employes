import { ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListSkeleton } from "@/components/Skeleton";
import { DESIGN } from "@/constants/design";
import { useTrabajos } from "@/src/data/use-trabajos";

import { TrabajoHoyCard } from "./components/TrabajoHoyCard";

export default function HoyScreen() {
  const { trabajos, loading, error } = useTrabajos();
  const pendientes = trabajos.filter((trabajo) => trabajo.estado !== "COMPLETADO" && trabajo.estado !== "CERRADO");

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }}>
      <View className="gap-3 p-4">
        <Text className="text-sm font-semibold" style={{ color: DESIGN.colors.textSecondary }}>
          {pendientes.length} trabajos para hoy
        </Text>
        {loading ? <ListSkeleton count={3} /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {!loading && pendientes.length === 0 ? <EmptyState message="No tienes trabajos asignados." /> : null}
        {!loading && pendientes.map((trabajo) => (
          <TrabajoHoyCard key={trabajo.id} trabajo={trabajo} />
        ))}
      </View>
    </ScrollView>
  );
}
