import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Pressable, Text } from "react-native";

interface AnimatedAccountButtonProps {
  text: string;
  className?: string;
  onPress: () => void;
  disabled?: boolean;
}

export function AnimatedAccountButton({
  text,
  className,
  onPress,
  disabled,
}: AnimatedAccountButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: (1 - scale.value) * 1.5 }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: 100 });
          opacity.value = withTiming(0.96, { duration: 80 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 160 });
          opacity.value = withTiming(1, { duration: 160 });
        }}
        className={`items-center rounded-lg bg-blue-600 p-3 active:opacity-80 disabled:opacity-50 ${className ?? ""}`}
        style={{
          shadowColor: "#0f172a",
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        }}
      >
        <Text className="font-button text-white">{text}</Text>
      </Pressable>
    </Animated.View>
  );
}
