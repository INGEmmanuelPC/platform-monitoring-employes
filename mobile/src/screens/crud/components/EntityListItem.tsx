import { useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";

type Props = {
  summary: string;
  estado: string;
  onPress: () => void;
};

export function EntityListItem({ summary, estado, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 24, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable accessibilityRole="button" onPress={onPress} onPressIn={() => animateTo(0.985)} onPressOut={() => animateTo(1)} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm active:bg-blue-50">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-base font-semibold text-neutral-900">{summary}</Text>
            <Text className="text-xs font-medium uppercase tracking-wide text-neutral-600">{estado}</Text>
          </View>
          <Text className="text-xl text-blue-700">›</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
