import { Pressable, Text, View } from "react-native";

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <Text className="text-sm leading-5 text-red-800">{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} className="self-start rounded-lg bg-red-700 px-4 py-2 active:opacity-80">
          <Text className="font-semibold text-white">Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
