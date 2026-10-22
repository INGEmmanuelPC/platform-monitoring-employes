import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { DESIGN } from "@/constants/design";

import { useWorkOrderFlow } from "./hooks/useWorkOrderFlow";
import { PasoLink } from "./components/PasoLink";
import { TrabajoResumenCard } from "./components/TrabajoResumenCard";

export default function TrabajoDetailScreen() {
  const { error, loading, pasos, trabajo } = useWorkOrderFlow();

  if (loading) return <ActivityIndicator className="flex-1" color={DESIGN.colors.brand} />;
  if (error) return <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: DESIGN.colors.canvas }}><Text className="text-center text-base" style={{ color: DESIGN.colors.error }}>{error}</Text></View>;
  if (!trabajo) return <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: DESIGN.colors.canvas }}><Text className="text-center text-base" style={{ color: DESIGN.colors.textSecondary }}>No se encontró este trabajo.</Text></View>;

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }}>
      <View className="gap-4 p-4">
        <TrabajoResumenCard trabajo={trabajo} />
        <View className="gap-2">
          {pasos.map((paso) => (
            <PasoLink key={paso.ruta} paso={paso} trabajoId={trabajo.id} />
          ))}
        </View>
        <Text className="px-1 text-xs" style={{ color: DESIGN.colors.textSecondary }}>Todo esto funciona sin señal. Se sube solo cuando vuelva la conexión.</Text>
      </View>
    </ScrollView>
  );
}
