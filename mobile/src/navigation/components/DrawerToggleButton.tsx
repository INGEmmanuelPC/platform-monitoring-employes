import { Pressable } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

export function DrawerToggleButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Abrir menú"
      onPress={onPress}
      className="ml-4 h-10 w-10 items-center justify-center"
      hitSlop={8}
    >
      <IconSymbol size={25} name="line.3.horizontal" color="#262626" />
    </Pressable>
  );
}
