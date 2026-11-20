import { Pressable, Text, View } from "react-native";

import { EstadoTrabajoIndicator } from "@/components/EstadoTrabajoIndicator";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import { formatHora } from "@/constants/trabajos";
import type { TrabajoLocal } from "@/src/data/types";

type Props = {
  trabajo: TrabajoLocal;
  onPress?: () => void;
};

export function TrabajoCard({ trabajo, onPress }: Props) {
  const isUrgent = trabajo.estado === "EN_SITIO" || trabajo.sync === "CONFLICTO";

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { disabled: false } : undefined}
      disabled={!onPress}
      onPress={onPress}
      className="gap-3 rounded-2xl border px-4 py-4"
      style={({ pressed }) => [
        {
          backgroundColor: DESIGN.colors.surface,
          borderColor: DESIGN.colors.border,
          borderRadius: DESIGN.radius.card,
          borderLeftWidth: 4,
          borderLeftColor: isUrgent ? DESIGN.status.trabajo.EN_SITIO.foreground : DESIGN.colors.brand,
          borderBottomWidth: 3,
          borderBottomColor: DESIGN.colors.borderSubtle,
          ...RAISED_SURFACE,
        },
        pressed && onPress ? { opacity: 0.88, elevation: 1 } : undefined,
      ]}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="font-mono text-[11px] font-semibold" style={{ color: DESIGN.colors.textSecondary }}>
            OT-{trabajo.id.slice(0, 6).toUpperCase()}
          </Text>
          <View className="h-1 w-1 rounded-full" style={{ backgroundColor: isUrgent ? DESIGN.status.trabajo.EN_SITIO.foreground : DESIGN.colors.brand }} />
          <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: isUrgent ? DESIGN.status.trabajo.EN_SITIO.foreground : DESIGN.colors.brand }}>
            {formatHora(trabajo.hora_programada)}
          </Text>
        </View>
        {onPress ? (
          <IconSymbol size={18} name="chevron.right" color={DESIGN.colors.textSecondary} />
        ) : null}
      </View>
      <View className="gap-1">
        <Text className="font-display text-xl" style={{ color: DESIGN.colors.text }}>
          {trabajo.cliente}
        </Text>
        <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
          {trabajo.descripcion}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <IconSymbol size={16} name="mappin.and.ellipse" color={DESIGN.colors.brand} />
        <Text className="flex-1 text-xs" style={{ color: DESIGN.colors.textSecondary }}>
          {trabajo.direccion}
        </Text>
      </View>
      <View className="h-px" style={{ backgroundColor: DESIGN.colors.borderSubtle }} />
      <View className="flex-row items-center justify-between">
        <Text className="font-mono text-[10px] uppercase tracking-wider" style={{ color: DESIGN.colors.textSecondary }}>
          Ficha de operación
        </Text>
        <Text className="text-[10px] font-semibold uppercase" style={{ color: isUrgent ? DESIGN.status.trabajo.EN_SITIO.foreground : DESIGN.colors.textSecondary }}>
          {isUrgent ? "Atención prioritaria" : "Seguimiento activo"}
        </Text>
      </View>
      <EstadoTrabajoIndicator
        estado={trabajo.estado}
        sync={trabajo.sync}
        reporte={trabajo.reporte}
      />
    </Pressable>
  );
}
