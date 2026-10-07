import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { useTrabajos } from "@/src/data/use-trabajos";

import { PasoLink, type Paso } from "./components/PasoLink";
import { TrabajoResumenCard } from "./components/TrabajoResumenCard";

export default function TrabajoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trabajos, loading } = useTrabajos();
  const trabajo = trabajos.find((item) => item.id === id);

  if (loading) return <ActivityIndicator className="flex-1" color="#0a7ea4" />;
  if (!trabajo) return <View className="flex-1 items-center justify-center bg-neutral-50 p-6"><Text className="text-center text-base text-neutral-600">No se encontró este trabajo.</Text></View>;

  const pasos: Paso[] = [
    { ruta: "llegada", titulo: "Marcar llegada", icono: "mappin.and.ellipse", hecho: trabajo.llegada_at !== null },
    { ruta: "evidencia", titulo: "Fotos antes y después", icono: "camera.fill", hecho: false },
    { ruta: "dictado", titulo: "Contar qué hiciste", icono: "mic.fill", hecho: false, opcional: true },
    { ruta: "firma", titulo: "Firma del cliente", icono: "signature", hecho: false },
  ];

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
