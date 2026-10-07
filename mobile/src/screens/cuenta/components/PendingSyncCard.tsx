import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import type { TrabajoLocal } from "@/src/data/types";

type Props = {
  pendientes: TrabajoLocal[];
  syncing: boolean;
  message: string | null;
  onSync: () => void;
};

export function PendingSyncCard({ pendientes, syncing, message, onSync }: Props) {
  return (
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
      {message ? <Text className="text-sm text-neutral-700">{message}</Text> : null}
      <Button text={syncing ? "Sincronizando..." : "Sincronizar ahora"} onPress={onSync} disabled={syncing} />
    </View>
  );
}
