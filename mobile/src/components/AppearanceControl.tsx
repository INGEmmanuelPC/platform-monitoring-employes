import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import { useAppearance, type AppearanceMode } from "@/src/theme/AppearanceProvider";

const OPTIONS: { value: AppearanceMode; label: string; icon: string }[] = [
  { value: "dark", label: "Oscuro", icon: "◐" },
  { value: "light", label: "Claro", icon: "○" },
];

export function AppearanceControl() {
  const { mode, setMode } = useAppearance();
  const [pressedMode, setPressedMode] = useState<AppearanceMode>(mode);

  useEffect(() => setPressedMode(mode), [mode]);

  return (
    <View className="gap-3 border p-3" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.control, ...RAISED_SURFACE }}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-display text-base" style={{ color: DESIGN.colors.text }}>Apariencia</Text>
          <Text className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>Preferencia de lectura</Text>
        </View>
        <Text className="font-mono text-[10px] uppercase" style={{ color: DESIGN.colors.brand }}>{mode}</Text>
      </View>
      <View className="flex-row gap-2">
        {OPTIONS.map((option) => {
          const selected = pressedMode === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Usar modo ${option.label}`}
              onPressIn={() => {
                setPressedMode(option.value);
                setMode(option.value);
              }}
              onPress={() => {
                setPressedMode(option.value);
                setMode(option.value);
              }}
              android_ripple={{ color: DESIGN.colors.border }}
              className="flex-1 flex-row items-center justify-center gap-2 border px-3 py-2.5"
              style={{ backgroundColor: selected ? DESIGN.colors.selected : DESIGN.colors.inset, borderColor: selected ? DESIGN.colors.brand : DESIGN.colors.border, borderRadius: DESIGN.radius.control }}
            >
              <Text style={{ color: selected ? DESIGN.colors.brand : DESIGN.colors.textSecondary }}>{option.icon}</Text>
              <Text className="text-xs font-semibold" style={{ color: selected ? DESIGN.colors.brand : DESIGN.colors.textSecondary }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
