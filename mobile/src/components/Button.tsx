import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  type ViewStyle,
} from "react-native";

import { DESIGN, MIN_TOUCH_TARGET, RAISED_SURFACE } from "@/constants/design";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps {
  text: string;
  className?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: DESIGN.colors.brand,
    borderColor: DESIGN.colors.brandPressed,
  },
  secondary: {
    backgroundColor: DESIGN.colors.surface,
    borderColor: DESIGN.colors.border,
  },
  danger: {
    backgroundColor: DESIGN.colors.error,
    borderColor: DESIGN.colors.dangerPressed,
  },
};

export function Button({
  text,
  className,
  onPress,
  disabled,
  loading = false,
  variant = "primary",
  accessibilityLabel = text,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const unavailable = disabled || loading;
  const textColor = variant === "secondary" ? DESIGN.colors.brand : DESIGN.colors.surface;
  const loadingColor =
    unavailable && variant !== "secondary"
      ? DESIGN.colors.disabledText
      : textColor;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 24, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: unavailable, busy: loading }}
        testID={testID}
        onPress={onPress}
        onPressIn={() => {
          if (!unavailable) animateTo(0.97);
        }}
        onPressOut={() => animateTo(1)}
        disabled={unavailable}
        className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl px-4 py-3 ${className ?? ""}`}
        style={({ pressed }) => [
          {
            minHeight: MIN_TOUCH_TARGET + 4,
            borderRadius: DESIGN.radius.control,
            borderWidth: 1,
            borderBottomWidth: 4,
            paddingHorizontal: 16,
            paddingVertical: 12,
            ...RAISED_SURFACE,
          },
          VARIANT_STYLES[variant],
          unavailable
            ? {
                backgroundColor: DESIGN.colors.disabled,
                borderColor: DESIGN.colors.border,
                borderBottomColor: DESIGN.colors.border,
                elevation: 0,
                shadowOpacity: 0,
              }
            : pressed
              ? { opacity: 0.92, elevation: 1 }
              : undefined,
        ]}
      >
        {loading ? <ActivityIndicator color={loadingColor} /> : null}
        <Text
          className="font-button text-center"
          style={{
            color: unavailable ? DESIGN.colors.disabledText : textColor,
          }}
        >
          {text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default Button;
