import { Pressable } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN } from "@/constants/design";

export function DrawerToggleButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
      onPress={onPress}
      className="ml-4 h-12 w-12 items-center justify-center rounded-xl"
      hitSlop={8}
      style={({ pressed }) => [pressed ? { backgroundColor: DESIGN.colors.borderSubtle, opacity: 0.8 } : undefined]}
    >
      <IconSymbol size={25} name="line.3.horizontal" color={DESIGN.colors.brand} />
    </Pressable>
  );
}
