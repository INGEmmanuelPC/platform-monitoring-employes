import { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, Text } from "react-native";

interface ButtonProps {
  text: string;
  className?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ text, className, onPress, disabled, loading = false }: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 24, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        disabled={disabled || loading}
        className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-blue-700 p-3 active:opacity-80 disabled:opacity-50 ${className ?? ""}`}
      >
        {loading ? <ActivityIndicator color="#ffffff" /> : null}
        <Text className="font-button text-center text-white">{text}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default Button;
