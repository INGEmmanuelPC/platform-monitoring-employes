import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";

export type Paso = {
  ruta: "llegada" | "evidencia" | "dictado" | "firma";
  titulo: string;
  icono: "mappin.and.ellipse" | "camera.fill" | "mic.fill" | "signature";
  hecho: boolean;
  opcional?: boolean;
};

export function PasoLink({ paso, trabajoId }: { paso: Paso; trabajoId: string }) {
  return (
    <Link href={{ pathname: `/trabajo/[id]/${paso.ruta}`, params: { id: trabajoId } }} asChild>
      <Pressable
        className="rounded-2xl border p-4"
        style={({ pressed }) => [
          {
            backgroundColor: DESIGN.colors.surface,
            borderColor: DESIGN.colors.border,
            borderRadius: DESIGN.radius.card,
            borderBottomWidth: 3,
            borderBottomColor: DESIGN.colors.borderSubtle,
            ...RAISED_SURFACE,
          },
          pressed ? { opacity: 0.88, elevation: 1 } : undefined,
        ]}
      >
      <View className="w-full flex-row items-center gap-3">
        <IconSymbol size={26} name={paso.hecho ? "checkmark.circle.fill" : paso.icono} color={paso.hecho ? DESIGN.status.trabajo.COMPLETADO.foreground : DESIGN.colors.brand} />
        <View className="flex-1">
          <Text className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>{paso.titulo}</Text>
          {paso.opcional ? <Text className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>Opcional</Text> : null}
        </View>
        <IconSymbol size={18} name="chevron.right" color={DESIGN.colors.textSecondary} />
      </View>
      </Pressable>
    </Link>
  );
}
