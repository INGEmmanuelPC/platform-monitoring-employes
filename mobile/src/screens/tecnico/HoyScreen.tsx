import { ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListSkeleton } from "@/components/Skeleton";
import { DESIGN } from "@/constants/design";
import { useTrabajos } from "@/src/data/use-trabajos";
import { filtrarTrabajosPendientes } from "@/src/domain/trabajosHoy";
import { useAuth } from "@/src/session/AuthProvider";

import { TrabajoHoyCard } from "./components/TrabajoHoyCard";

export default function HoyScreen() {
  const { trabajos, loading, error } = useTrabajos();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const pendientes = filtrarTrabajosPendientes(trabajos);

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }}>
      <View className="gap-3 p-4">
        <Text className="text-sm font-semibold" style={{ color: DESIGN.colors.textSecondary }}>
          {pendientes.length} trabajos pendientes
        </Text>
        {loading ? <ListSkeleton count={3} /> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {!loading && pendientes.length === 0 ? (
          <EmptyState message={isAdmin ? "No hay trabajos pendientes." : "No tienes trabajos asignados."} />
        ) : null}
        {!loading && pendientes.map((trabajo) => (
          <TrabajoHoyCard key={trabajo.id} trabajo={trabajo} />
        ))}
      </View>
    </ScrollView>
  );
}
