import { Text, View } from "react-native";

import {
  ETIQUETA_EJE_ESTADO,
  ETIQUETA_REPORTE,
  ETIQUETA_SYNC,
  ETIQUETA_TRABAJO,
} from "@/constants/trabajos";
import { DESIGN } from "@/constants/design";
import type { TrabajoLocal } from "@/src/data/types";

type Props = Pick<TrabajoLocal, "estado" | "sync" | "reporte">;

export function EstadoTrabajoIndicator({ estado, sync, reporte }: Props) {
  const estados = [
    {
      label: ETIQUETA_EJE_ESTADO.trabajo,
      value: ETIQUETA_TRABAJO[estado],
      colors: DESIGN.status.trabajo[estado],
    },
    {
      label: ETIQUETA_EJE_ESTADO.sync,
      value: ETIQUETA_SYNC[sync],
      colors: DESIGN.status.sync[sync],
    },
    {
      label: ETIQUETA_EJE_ESTADO.reporte,
      value: ETIQUETA_REPORTE[reporte],
      colors: DESIGN.status.reporte[reporte],
    },
  ];

  return (
    <View className="flex-row flex-wrap gap-2">
      {estados.map(({ label, value, colors }) => (
        <View
          key={label}
          accessible
          accessibilityLabel={`${label}: ${value}`}
          className="min-w-24 flex-1 gap-0.5 rounded-xl border px-2 py-1.5"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-[10px] font-semibold uppercase"
            style={{ color: colors.foreground }}
          >
            {label}
          </Text>
          <Text
            className="text-xs font-semibold"
            style={{ color: colors.foreground }}
            numberOfLines={1}
          >
            {value}
          </Text>
        </View>
      ))}
    </View>
  );
}
