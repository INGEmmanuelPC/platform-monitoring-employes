import { ScrollView, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTrabajos } from "@/src/data/use-trabajos";
import { useAuth } from "@/src/session/AuthProvider";

// Además del perfil, aquí vive el detalle de la cola de sincronización: es
// donde el técnico confirma que no perdió trabajo cuando estuvo sin señal.
export default function CuentaScreen() {
  const { session, signOut } = useAuth();
  const { trabajos } = useTrabajos();
  const pendientes = trabajos.filter(
    (trabajo) => trabajo.sync === "SOLO_LOCAL" || trabajo.sync === "EN_COLA",
  );
  const displayName = session?.user.user_metadata.full_name ?? "Técnico";

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-4 p-4">
        <View className="gap-1 rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="text-lg font-semibold text-neutral-900">
            {displayName}
          </Text>
          <Text className="text-sm text-neutral-600">{session?.user.email}</Text>
        </View>

        <View className="gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          <View className="flex-row items-center gap-2">
            <IconSymbol size={20} name="arrow.triangle.2.circlepath" color="#404040" />
            <Text className="text-base font-semibold text-neutral-900">
              Pendientes por subir
            </Text>
          </View>

          {pendientes.length === 0 ? (
            <Text className="text-sm text-neutral-600">
              Todo está guardado en el servidor.
            </Text>
          ) : (
            pendientes.map((trabajo) => (
              <Text key={trabajo.id} className="text-sm text-neutral-600">
                · {trabajo.cliente}
              </Text>
            ))
          )}

          <Text className="text-xs text-neutral-400">
            Sube solo cuando vuelva la señal. No hay que hacer nada.
          </Text>
        </View>

        <Button text="Cerrar sesión" onPress={signOut} />
      </View>
    </ScrollView>
  );
}
