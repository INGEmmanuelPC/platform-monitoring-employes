import { Text } from "react-native";

export function ErrorBanner({ message }: { message: string }) {
  return (
    <Text className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{message}</Text>
  );
}
