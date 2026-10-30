import { Pressable } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, MIN_HIT_SLOP, MIN_TOUCH_TARGET } from "@/constants/design";

export function DrawerToggleButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
      onPress={onPress}
      className="ml-4 items-center justify-center rounded-xl"
      hitSlop={MIN_HIT_SLOP}
      style={({ pressed }) => [
        { minHeight: MIN_TOUCH_TARGET, minWidth: MIN_TOUCH_TARGET },
        pressed ? { backgroundColor: DESIGN.colors.borderSubtle, opacity: 0.8 } : undefined,
      ]}
    >
      <IconSymbol size={25} name="line.3.horizontal" color={DESIGN.colors.brand} />
    </Pressable>
  );
}
