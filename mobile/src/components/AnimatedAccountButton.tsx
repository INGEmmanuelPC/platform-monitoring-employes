import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Pressable, Text } from "react-native";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";

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
        className={`items-center rounded-xl p-3 ${className ?? ""}`}
        style={({ pressed }) => [
          { backgroundColor: disabled ? DESIGN.colors.disabled : DESIGN.colors.brand, minHeight: 48, ...RAISED_SURFACE },
          disabled ? { borderColor: DESIGN.colors.border, elevation: 0, shadowOpacity: 0 } : undefined,
          pressed && !disabled ? { opacity: 0.82, elevation: 1 } : undefined,
        ]}
      >
        <Text className="font-button" style={{ color: disabled ? DESIGN.colors.disabledText : DESIGN.colors.surface }}>{text}</Text>
      </Pressable>
    </Animated.View>
  );
}
