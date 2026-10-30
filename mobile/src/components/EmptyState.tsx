import { Text, View } from "react-native";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";

export function EmptyState({ message, title = "Sin registros" }: { message: string; title?: string }) {
  return (
    <View className="gap-1 rounded-xl border p-5" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, ...RAISED_SURFACE }}>
      <Text className="font-semibold" style={{ color: DESIGN.colors.text }}>{title}</Text>
      <Text className="text-sm leading-5" style={{ color: DESIGN.colors.textSecondary }}>{message}</Text>
    </View>
  );
}
