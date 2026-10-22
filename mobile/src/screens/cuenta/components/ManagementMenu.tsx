import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DESIGN, MIN_TOUCH_TARGET } from "@/constants/design";

import { ManagementLinks } from "./ManagementLinks";

export function ManagementMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, { duration: 300 });
  }, [isOpen, progress]);

  const gestionMenuStyle = useAnimatedStyle(() => ({
    height: progress.value * contentHeight,
    opacity: progress.value,
    overflow: "hidden",
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 180}deg` }],
  }));

  return (
    <View className="gap-2 rounded-xl border border-neutral-200 bg-white p-4">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((open) => !open)}
        className="rounded-xl px-3"
        style={({ pressed }) => [
          { minHeight: MIN_TOUCH_TARGET, justifyContent: "center" },
          pressed ? { backgroundColor: DESIGN.colors.borderSubtle, opacity: 0.8 } : undefined,
        ]}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>Gestión</Text>
          <Animated.View style={chevronStyle}>
            <Text className="text-xl" style={{ color: DESIGN.colors.textSecondary }}>▼</Text>
          </Animated.View>
        </View>
      </Pressable>

      <Animated.View style={gestionMenuStyle}>
        <ManagementLinks />
      </Animated.View>

      <View
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={{ position: "absolute", top: 44, left: 16, right: 16, opacity: 0 }}
        onLayout={(event) => {
          const measuredHeight = event.nativeEvent.layout.height;
          if (measuredHeight > 0 && measuredHeight !== contentHeight) {
            setContentHeight(measuredHeight);
          }
        }}
      >
        <ManagementLinks />
      </View>
    </View>
  );
}
