import { ScrollView, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListSkeleton } from "@/components/Skeleton";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import { useTrabajos } from "@/src/data/use-trabajos";
import { filtrarTrabajosPendientes } from "@/src/domain/trabajosHoy";
import { useAuth } from "@/src/session/AuthProvider";

import { TrabajoHoyCard } from "./components/TrabajoHoyCard";

export default function HoyScreen() {
  const { trabajos, loading, error, refresh } = useTrabajos();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const pendientes = filtrarTrabajosPendientes(trabajos);
  const enRuta = pendientes.filter((trabajo) => trabajo.estado === "EN_CAMINO" || trabajo.estado === "EN_SITIO").length;
  const completados = trabajos.filter((trabajo) => trabajo.estado === "COMPLETADO" || trabajo.estado === "CERRADO").length;

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }}>
      <View className="gap-4 p-4">
        <View className="gap-1 border-l-4 pl-3" style={{ borderLeftColor: DESIGN.colors.brand }}>
          <Text className="text-xs font-semibold uppercase tracking-widest" style={{ color: DESIGN.colors.brand }}>
            Centro de operaciones / 01
          </Text>
          <Text className="font-display text-3xl" style={{ color: DESIGN.colors.text }}>
            Tu jornada
          </Text>
          <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
            {pendientes.length ? `${pendientes.length} trabajos requieren atención` : "No hay trabajos pendientes"}
          </Text>
        </View>
        <View className="overflow-hidden rounded-xl border" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, ...RAISED_SURFACE }}>
          <View className="flex-row items-center justify-between border-b px-3 py-2" style={{ borderBottomColor: DESIGN.colors.borderSubtle }}>
            <Text className="font-mono text-[10px] uppercase tracking-widest" style={{ color: DESIGN.colors.textSecondary }}>Lectura de jornada</Text>
            <Text className="font-mono text-[10px]" style={{ color: DESIGN.colors.brand }}>LIVE</Text>
          </View>
          {[
            { label: "Pendientes", value: pendientes.length, color: DESIGN.colors.brand },
            { label: "En ruta", value: enRuta, color: DESIGN.status.trabajo.EN_CAMINO.foreground },
            { label: "Cerrados", value: completados, color: DESIGN.status.trabajo.COMPLETADO.foreground },
          ].map((stat, index) => (
            <View key={stat.label} className="flex-row items-center gap-3 px-3 py-2.5" style={index < 2 ? { borderBottomWidth: 1, borderBottomColor: DESIGN.colors.borderSubtle } : undefined}>
              <Text className="w-8 font-display text-xl" style={{ color: stat.color }}>{String(stat.value).padStart(2, "0")}</Text>
              <View className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: DESIGN.colors.inset }}>
                <View style={{ width: `${Math.min(stat.value * 18, 100)}%`, height: "100%", backgroundColor: stat.color }} />
              </View>
              <Text className="w-20 text-right text-[10px] font-semibold uppercase" style={{ color: DESIGN.colors.textSecondary }}>{stat.label}</Text>
            </View>
          ))}
        </View>
        {loading ? <ListSkeleton count={3} /> : null}
        {error ? <ErrorBanner message={error} onRetry={refresh} /> : null}
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
