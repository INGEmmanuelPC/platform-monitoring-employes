import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, View, type ViewStyle } from "react-native";

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

  return <Animated.View style={[{ backgroundColor: "#dbe4ee", borderRadius: 8, opacity }, style]} />;
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: 16, borderWidth: 1, gap: 10, padding: 16 }}>
          <Skeleton style={{ height: 18, width: "62%" }} />
          <Skeleton style={{ height: 13, width: "38%" }} />
          <Skeleton style={{ height: 13, width: "86%" }} />
        </View>
      ))}
    </View>
  );
}
