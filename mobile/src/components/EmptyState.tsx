import { Text, View } from "react-native";

export function EmptyState({ message, title = "Sin registros" }: { message: string; title?: string }) {
  return (
    <View className="gap-1 rounded-xl border border-neutral-200 bg-white p-5">
      <Text className="font-semibold text-neutral-900">{title}</Text>
      <Text className="text-sm leading-5 text-neutral-600">{message}</Text>
    </View>
  );
}
