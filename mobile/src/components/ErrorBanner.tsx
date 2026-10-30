import { Pressable, Text, View } from "react-native";
import { DESIGN, MIN_TOUCH_TARGET, RAISED_SURFACE } from "@/constants/design";

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="gap-3 rounded-2xl border p-4" style={{ backgroundColor: DESIGN.colors.errorSurface, borderColor: DESIGN.colors.error, ...RAISED_SURFACE }}>
      <Text className="text-sm leading-5" style={{ color: DESIGN.colors.error }}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reintentar"
          onPress={onRetry}
          className="self-start items-center justify-center rounded-xl px-4 py-3"
          style={({ pressed }) => [
            { backgroundColor: DESIGN.colors.error, borderColor: DESIGN.colors.dangerPressed, borderBottomWidth: 3, borderRadius: DESIGN.radius.control, minHeight: MIN_TOUCH_TARGET, paddingHorizontal: 16, ...RAISED_SURFACE },
            pressed ? { opacity: 0.8 } : undefined,
          ]}
        >
          <Text className="font-semibold" style={{ color: DESIGN.colors.surface }}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
