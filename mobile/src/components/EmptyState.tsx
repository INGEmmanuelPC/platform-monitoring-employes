import { Text } from "react-native";

export function EmptyState({ message }: { message: string }) {
  return (
    <Text className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
      {message}
    </Text>
  );
}
