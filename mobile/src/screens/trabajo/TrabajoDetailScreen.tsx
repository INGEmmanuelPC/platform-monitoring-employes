import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { DetailSkeleton } from "@/components/Skeleton";
import { DESIGN } from "@/constants/design";
import { TEXTOS_REVISION } from "@/constants/revision";
import { puedeCancelarse } from "@/src/domain/estadoTrabajo";
import { useAuth } from "@/src/session/AuthProvider";

import { useWorkOrderFlow } from "./hooks/useWorkOrderFlow";
import { useWorkDeparture } from "./hooks/useWorkDeparture";
import { CancelarTrabajoPanel } from "./components/CancelarTrabajoPanel";
import { PasoLink } from "./components/PasoLink";
import { TrabajoResumenCard } from "./components/TrabajoResumenCard";

export default function TrabajoDetailScreen() {
  const { error, loading, pasos, refresh, trabajo } = useWorkOrderFlow();
  const departure = useWorkDeparture(trabajo?.id ?? "", refresh);
  const router = useRouter();
  const { profile } = useAuth();

  if (loading) return <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }} contentContainerClassName="gap-4 p-4"><DetailSkeleton /></ScrollView>;
  if (error) return <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: DESIGN.colors.canvas }}><Text className="text-center text-base" style={{ color: DESIGN.colors.error }}>{error}</Text></View>;
  if (!trabajo) return <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: DESIGN.colors.canvas }}><Text className="text-center text-base" style={{ color: DESIGN.colors.textSecondary }}>No se encontró este trabajo.</Text></View>;

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }}>
      <View className="gap-4 p-4">
        <TrabajoResumenCard trabajo={trabajo} />
        {profile?.role === "admin" && (trabajo.estado === "COMPLETADO" || trabajo.estado === "CERRADO") ? (
          <Button
            text={TEXTOS_REVISION.abrir}
            variant="secondary"
            onPress={() => router.push({ pathname: "/trabajo/[id]/revision", params: { id: trabajo.id } })}
          />
        ) : null}
        {trabajo.estado === "ASIGNADO" ? (
          <View className="gap-2">
            <Button
              text="Voy en camino"
              onPress={() => void departure.markAsDeparted()}
              disabled={departure.saving}
              loading={departure.saving}
              accessibilityHint="Marca que vas en camino al trabajo."
            />
            {departure.error ? (
              <Text className="text-center text-sm" style={{ color: DESIGN.colors.error }}>
                {departure.error}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View className="gap-2">
          {pasos.map((paso) => (
            <PasoLink key={paso.ruta} paso={paso} trabajoId={trabajo.id} />
          ))}
        </View>
        {profile?.role === "admin" && puedeCancelarse(trabajo.estado) ? (
          <CancelarTrabajoPanel trabajoId={trabajo.id} onCancelled={() => void refresh()} />
        ) : null}
        <Text className="px-1 text-xs" style={{ color: DESIGN.colors.textSecondary }}>Todo esto funciona sin señal. Se sube solo cuando vuelva la conexión.</Text>
      </View>
    </ScrollView>
  );
}
