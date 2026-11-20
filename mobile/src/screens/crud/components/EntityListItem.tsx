import { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";

type Props = {
  summary: string;
  estado: string;
  onPress: () => void;
};

export function EntityListItem({ summary, estado, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 24, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: false }}
        onPress={onPress}
        onPressIn={() => animateTo(0.985)}
        onPressOut={() => animateTo(1)}
        className="border p-4"
        style={({ pressed }) => [
          { backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderLeftWidth: 4, borderLeftColor: estado === "COMPLETADO" || estado === "CERRADO" ? DESIGN.status.trabajo.COMPLETADO.foreground : DESIGN.colors.brand, borderRadius: 4, ...RAISED_SURFACE },
          pressed ? { opacity: 0.86, elevation: 1 } : undefined,
        ]}
      >
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="font-mono text-[10px] uppercase tracking-widest" style={{ color: DESIGN.colors.textSecondary }}>REGISTRO OPERATIVO</Text>
            <Text className="font-display text-base" style={{ color: DESIGN.colors.text }}>{summary}</Text>
            <View className="self-start border px-2 py-1" style={{ borderColor: DESIGN.colors.border, backgroundColor: DESIGN.colors.inset }}>
              <Text className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: DESIGN.colors.brand }}>{estado || "SIN ESTADO"}</Text>
            </View>
          </View>
          <Text className="font-mono text-lg" style={{ color: DESIGN.colors.brand }}>→</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
