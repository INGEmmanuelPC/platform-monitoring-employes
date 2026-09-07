import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { ETIQUETA_TRABAJO, TRABAJOS_EJEMPLO } from "@/constants/trabajos";

type Paso = {
  ruta: "llegada" | "evidencia" | "dictado" | "firma";
  titulo: string;
  icono: "mappin.and.ellipse" | "camera.fill" | "mic.fill" | "signature";
  hecho: boolean;
  opcional?: boolean;
};

// El corazón de la app. Cinco toques de arriba a abajo, en el orden en que
// ocurren en la vida real. Nada de menús ni pestañas dentro de un trabajo.
export default function DetalleTrabajoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trabajo = TRABAJOS_EJEMPLO.find((t) => t.id === id) ?? TRABAJOS_EJEMPLO[0];

  const pasos: Paso[] = [
    { ruta: "llegada", titulo: "Marcar llegada", icono: "mappin.and.ellipse", hecho: true },
    { ruta: "evidencia", titulo: "Fotos antes y después", icono: "camera.fill", hecho: false },
    { ruta: "dictado", titulo: "Contar qué hiciste", icono: "mic.fill", hecho: false, opcional: true },
    { ruta: "firma", titulo: "Firma del cliente", icono: "signature", hecho: false },
  ];

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-4 p-4">
        <View className="gap-1 rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="text-xs font-semibold text-neutral-500">
            {ETIQUETA_TRABAJO[trabajo.estado]}
          </Text>
          <Text className="text-xl font-semibold text-neutral-900">
            {trabajo.cliente}
          </Text>
          <Text className="text-sm text-neutral-600">{trabajo.descripcion}</Text>
          <Text className="mt-1 text-xs text-neutral-500">{trabajo.direccion}</Text>
        </View>

        <View className="gap-2">
          {pasos.map((paso) => (
            <Link
              key={paso.ruta}
              href={{
                pathname: `/trabajo/[id]/${paso.ruta}`,
                params: { id: trabajo.id },
              }}
              className="rounded-xl border border-neutral-200 bg-white p-4"
            >
              <View className="w-full flex-row items-center gap-3">
                <IconSymbol
                  size={26}
                  name={paso.hecho ? "checkmark.circle.fill" : paso.icono}
                  color={paso.hecho ? "#15703D" : "#404040"}
                />
                <View className="flex-1">
                  <Text className="text-base font-semibold text-neutral-900">
                    {paso.titulo}
                  </Text>
                  {paso.opcional ? (
                    <Text className="text-xs text-neutral-500">Opcional</Text>
                  ) : null}
                </View>
                <IconSymbol size={18} name="chevron.right" color="#A3A3A3" />
              </View>
            </Link>
          ))}
        </View>

        <Text className="px-1 text-xs text-neutral-400">
          Todo esto funciona sin señal. Se sube solo cuando vuelva la conexión.
        </Text>
      </View>
    </ScrollView>
  );
}
