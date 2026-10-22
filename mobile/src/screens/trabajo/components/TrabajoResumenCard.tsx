import { Text, View } from "react-native";

import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import { ETIQUETA_TRABAJO } from "@/constants/trabajos";
import type { TrabajoLocal } from "@/src/data/types";

export function TrabajoResumenCard({ trabajo }: { trabajo: TrabajoLocal }) {
  return (
    <View className="gap-2 rounded-2xl border p-4" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.card, borderBottomWidth: 3, borderBottomColor: DESIGN.colors.borderSubtle, ...RAISED_SURFACE }}>
      <Text className="text-xs font-semibold" style={{ color: DESIGN.colors.brand }}>{ETIQUETA_TRABAJO[trabajo.estado]}</Text>
      <Text className="text-xl font-semibold" style={{ color: DESIGN.colors.text }}>{trabajo.cliente}</Text>
      <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{trabajo.descripcion}</Text>
      <Text className="mt-1 text-xs" style={{ color: DESIGN.colors.textSecondary }}>{trabajo.direccion}</Text>
    </View>
  );
}
