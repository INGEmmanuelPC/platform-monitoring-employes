import { Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import { ETIQUETA_TRABAJO } from "@/constants/trabajos";
import type { TrabajoLocal } from "@/src/data/types";

export function TrabajoResumenCard({ trabajo }: { trabajo: TrabajoLocal }) {
  return (
    <View className="gap-3 rounded-2xl border p-4" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.card, borderLeftWidth: 4, borderLeftColor: DESIGN.colors.brand, borderBottomWidth: 3, borderBottomColor: DESIGN.colors.borderSubtle, ...RAISED_SURFACE }}>
      <View className="flex-row items-center justify-between border-b pb-3" style={{ borderBottomColor: DESIGN.colors.borderSubtle }}>
        <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: DESIGN.colors.brand }}>{ETIQUETA_TRABAJO[trabajo.estado]}</Text>
        <Text className="font-mono text-[10px]" style={{ color: DESIGN.colors.textSecondary }}>ORDEN / {trabajo.id.slice(0, 8).toUpperCase()}</Text>
      </View>
      <Text className="font-display text-2xl" style={{ color: DESIGN.colors.text }}>{trabajo.cliente}</Text>
      <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{trabajo.descripcion}</Text>
      <View className="flex-row items-center gap-2">
        <IconSymbol size={16} name="mappin.and.ellipse" color={DESIGN.colors.textSecondary} />
        <Text className="flex-1 text-xs" style={{ color: DESIGN.colors.textSecondary }}>{trabajo.direccion}</Text>
      </View>
    </View>
  );
}
