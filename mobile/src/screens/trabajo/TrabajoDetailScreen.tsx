import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { useWorkOrderFlow } from "./hooks/useWorkOrderFlow";
import { PasoLink } from "./components/PasoLink";
import { TrabajoResumenCard } from "./components/TrabajoResumenCard";

export default function TrabajoDetailScreen() {
  const { error, loading, pasos, trabajo } = useWorkOrderFlow();

  if (loading) return <ActivityIndicator className="flex-1" color="#0a7ea4" />;
  if (error) return <View className="flex-1 items-center justify-center bg-neutral-50 p-6"><Text className="text-center text-base text-red-600">{error}</Text></View>;
  if (!trabajo) return <View className="flex-1 items-center justify-center bg-neutral-50 p-6"><Text className="text-center text-base text-neutral-600">No se encontró este trabajo.</Text></View>;

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-4 p-4">
        <TrabajoResumenCard trabajo={trabajo} />
        <View className="gap-2">
          {pasos.map((paso) => (
            <PasoLink key={paso.ruta} paso={paso} trabajoId={trabajo.id} />
          ))}
        </View>
        <Text className="px-1 text-xs text-neutral-400">Todo esto funciona sin señal. Se sube solo cuando vuelva la conexión.</Text>
      </View>
    </ScrollView>
  );
}
