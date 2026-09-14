import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTrabajos } from "@/src/data/use-trabajos";
import { processSyncQueue } from "@/src/data/trabajos";
import { useAuth } from "@/src/session/AuthProvider";

// Además del perfil, aquí vive el detalle de la cola de sincronización: es
// donde el técnico confirma que no perdió trabajo cuando estuvo sin señal.
export default function CuentaScreen() {
  const router = useRouter();
  const database = useSQLiteContext();
  const { session, signOut } = useAuth();
  const { trabajos } = useTrabajos();
  const pendientes = trabajos.filter(
    (trabajo) => trabajo.sync === "SOLO_LOCAL" || trabajo.sync === "EN_COLA",
  );
  const displayName = session?.user.user_metadata.full_name ?? "Técnico";
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const syncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const count = await processSyncQueue(database);
      setSyncMessage(count ? `${count} cambios sincronizados.` : "No hay cambios pendientes.");
    } catch {
      setSyncMessage("No se pudo sincronizar. Revisa la conexión y vuelve a intentarlo.");
    } finally {
      setSyncing(false);
    }
  };

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
          {syncMessage ? <Text className="text-sm text-neutral-700">{syncMessage}</Text> : null}
          <Button text={syncing ? "Sincronizando..." : "Sincronizar ahora"} onPress={() => void syncNow()} disabled={syncing} />
        </View>

        <View className="gap-2 rounded-xl border border-neutral-200 bg-white p-4">
          <Text className="text-base font-semibold text-neutral-900">Gestión</Text>
          <Button text="Técnicos" onPress={() => router.push("/crud/tecnicos" as never)} />
          <Button text="Clientes" onPress={() => router.push("/crud/clientes" as never)} />
          <Button text="Órdenes de trabajo" onPress={() => router.push("/crud/ordenes" as never)} />
        </View>

        <Button text="Cerrar sesión" onPress={signOut} />
      </View>
    </ScrollView>
  );
}
