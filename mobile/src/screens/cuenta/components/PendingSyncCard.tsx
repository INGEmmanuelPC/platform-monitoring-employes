import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import type { TrabajoLocal } from "@/src/data/types";

type Props = {
  pendientes: TrabajoLocal[];
  syncing: boolean;
  message: string | null;
  onSync: () => void;
};

export function PendingSyncCard({ pendientes, syncing, message, onSync }: Props) {
  return (
    <View className="gap-3 rounded-xl border p-4" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, ...RAISED_SURFACE }}>
      <View className="flex-row items-center gap-2">
        <IconSymbol size={20} name="arrow.triangle.2.circlepath" color={DESIGN.colors.brand} />
        <Text className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>
          Pendientes por subir
        </Text>
      </View>

      {pendientes.length === 0 ? (
        <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
          Todo está guardado en el servidor.
        </Text>
      ) : (
        pendientes.map((trabajo) => (
          <Text key={trabajo.id} className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
            · {trabajo.cliente}
          </Text>
        ))
      )}

      <Text className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>
        Sube solo cuando vuelva la señal. No hay que hacer nada.
      </Text>
      {message ? <Text className="text-sm" style={{ color: DESIGN.colors.text }}>{message}</Text> : null}
      <Button text={syncing ? "Sincronizando..." : "Sincronizar ahora"} onPress={onSync} disabled={syncing} />
    </View>
  );
}
