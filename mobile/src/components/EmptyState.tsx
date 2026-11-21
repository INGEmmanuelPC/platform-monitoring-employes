import { Text, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";

export function EmptyState({ message, title = "Sin registros" }: { message: string; title?: string }) {
  return (
    <View className="items-center gap-2 rounded-xl border p-5" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, ...RAISED_SURFACE }}>
      <View className="items-center justify-center rounded-full p-3" style={{ backgroundColor: DESIGN.colors.inset }}>
        <IconSymbol name="tray" size={24} color={DESIGN.colors.brand} />
      </View>
      <Text className="text-center font-semibold" style={{ color: DESIGN.colors.text }}>{title}</Text>
      <Text className="text-center text-sm leading-5" style={{ color: DESIGN.colors.textSecondary }}>{message}</Text>
    </View>
  );
}
