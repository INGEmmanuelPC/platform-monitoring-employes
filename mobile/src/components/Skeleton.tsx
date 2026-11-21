import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, View, type ViewStyle } from "react-native";
import { DESIGN } from "@/constants/design";

export function Skeleton({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.stopAnimation();
      opacity.setValue(0.55);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, reduceMotion]);

  return <Animated.View style={[{ backgroundColor: DESIGN.colors.borderSubtle, borderRadius: 8, opacity }, style]} />;
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.borderSubtle, borderRadius: 16, borderWidth: 1, gap: 10, padding: 16 }}>
          <Skeleton style={{ height: 18, width: "62%" }} />
          <Skeleton style={{ height: 13, width: "38%" }} />
          <Skeleton style={{ height: 13, width: "86%" }} />
        </View>
      ))}
    </View>
  );
}

export function DetailSkeleton() {
  return (
    <View style={{ gap: 16 }}>
      <View style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.card, borderWidth: 1, gap: 14, padding: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Skeleton style={{ height: 12, width: "28%" }} />
          <Skeleton style={{ height: 12, width: "32%" }} />
        </View>
        <Skeleton style={{ height: 28, width: "68%" }} />
        <Skeleton style={{ height: 16, width: "88%" }} />
        <Skeleton style={{ height: 14, width: "76%" }} />
      </View>
      {[0, 1, 2].map((index) => (
        <View key={index} style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.card, borderWidth: 1, flexDirection: "row", gap: 12, padding: 16 }}>
          <Skeleton style={{ borderRadius: 999, height: 28, width: 28 }} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton style={{ height: 16, width: "54%" }} />
            <Skeleton style={{ height: 12, width: "30%" }} />
          </View>
          <Skeleton style={{ height: 18, width: 18 }} />
        </View>
      ))}
    </View>
  );
}
