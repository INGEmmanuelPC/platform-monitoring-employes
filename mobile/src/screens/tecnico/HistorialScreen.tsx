import { ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListSkeleton } from "@/components/Skeleton";
import { DESIGN } from "@/constants/design";
import { useTrabajos } from "@/src/data/use-trabajos";

import { TrabajoHistorialCard } from "./components/TrabajoHistorialCard";

export default function HistorialScreen() {
  const { trabajos, loading, error } = useTrabajos();
  const finalizados = trabajos.filter((trabajo) => ["COMPLETADO", "CERRADO", "CANCELADO"].includes(trabajo.estado));

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }}>
      <View className="gap-3 p-4">
        <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>Trabajos anteriores</Text>
        {loading ? <ListSkeleton count={3} /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {!loading && !error && finalizados.length === 0 ? <EmptyState message="Todavía no tienes trabajos anteriores." /> : null}
        {!loading && finalizados.map((trabajo) => (
          <TrabajoHistorialCard key={trabajo.id} trabajo={trabajo} />
        ))}
      </View>
    </ScrollView>
  );
}
