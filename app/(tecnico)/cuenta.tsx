import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PENDIENTES_POR_SUBIR, TRABAJOS_EJEMPLO } from "@/constants/trabajos";

// Además del perfil, aquí vive el detalle de la cola de sincronización: es
// donde el técnico confirma que no perdió trabajo cuando estuvo sin señal.
export default function CuentaScreen() {
  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-4 p-4">
        <View className="gap-1 rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="text-lg font-semibold text-neutral-900">
            Juan Ramírez
          </Text>
          <Text className="text-sm text-neutral-600">Técnico · Cuadrilla norte</Text>
        </View>

        <View className="gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          <View className="flex-row items-center gap-2">
            <IconSymbol size={20} name="arrow.triangle.2.circlepath" color="#404040" />
            <Text className="text-base font-semibold text-neutral-900">
              Pendientes por subir
            </Text>
          </View>

          {PENDIENTES_POR_SUBIR === 0 ? (
            <Text className="text-sm text-neutral-600">
              Todo está guardado en el servidor.
            </Text>
          ) : (
            TRABAJOS_EJEMPLO.filter((t) => t.sync === "SOLO_LOCAL").map((t) => (
              <Text key={t.id} className="text-sm text-neutral-600">
                · {t.cliente}
              </Text>
            ))
          )}

          <Text className="text-xs text-neutral-400">
            Sube solo cuando vuelva la señal. No hay que hacer nada.
          </Text>
        </View>

        <Button text="Cerrar sesión" onPress={() => {}} />
      </View>
    </ScrollView>
  );
}
