import { Link } from "expo-router";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { ETIQUETA_TRABAJO, formatHora } from "@/constants/trabajos";
import { useTrabajos } from "@/src/data/use-trabajos";

// Pantalla de arranque. Es lo primero que ve el técnico al abrir la app y
// tiene que responder una sola pregunta: ¿qué me toca ahora?
export default function HoyScreen() {
  const { trabajos, loading } = useTrabajos();
  const pendientes = trabajos.filter((t) => t.estado !== "CERRADO");

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-3 p-4">
        <Text className="text-sm text-neutral-500">{pendientes.length} trabajos para hoy</Text>

        {loading ? <ActivityIndicator color="#0a7ea4" /> : null}
        {!loading && pendientes.length === 0 ? (
          <Text className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            No tienes trabajos asignados.
          </Text>
        ) : null}

        {pendientes.map((trabajo) => (
          <Link
            key={trabajo.id}
            href={{ pathname: "/trabajo/[id]", params: { id: trabajo.id } }}
            className="rounded-xl border border-neutral-200 bg-white p-4"
          >
            <View className="w-full gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-neutral-500">
                  {formatHora(trabajo.hora_programada)}
                </Text>
                <Text className="text-xs font-semibold text-neutral-600">
                  {ETIQUETA_TRABAJO[trabajo.estado]}
                </Text>
              </View>

              <Text className="text-lg font-semibold text-neutral-900">
                {trabajo.cliente}
              </Text>
              <Text className="text-sm text-neutral-600">{trabajo.descripcion}</Text>

              <View className="mt-1 flex-row items-center gap-1">
                <IconSymbol size={14} name="mappin.and.ellipse" color="#737373" />
                <Text className="flex-1 text-xs text-neutral-500">
                  {trabajo.direccion}
                </Text>
              </View>
            </View>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}
