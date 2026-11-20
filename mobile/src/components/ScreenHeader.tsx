import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, MIN_HIT_SLOP, MIN_TOUCH_TARGET } from "@/constants/design";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showBack?: boolean;
};

export function ScreenHeader({ eyebrow, title, subtitle, showBack = false }: Props) {
  const router = useRouter();

  return (
    <View className="flex-row items-center gap-3 border-b pb-3" style={{ borderBottomColor: DESIGN.colors.borderSubtle }}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          hitSlop={MIN_HIT_SLOP}
          className="items-center justify-center border"
          style={{ minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET, borderColor: DESIGN.colors.border, backgroundColor: DESIGN.colors.surface, borderRadius: DESIGN.radius.control }}
        >
          <IconSymbol size={20} name="chevron.left" color={DESIGN.colors.brand} />
        </Pressable>
      ) : null}
      <View className="min-w-0 flex-1 gap-0.5">
        {eyebrow ? <Text className="font-mono text-[10px] uppercase tracking-widest" style={{ color: DESIGN.colors.brand }}>{eyebrow}</Text> : null}
        <Text className="font-display text-2xl" numberOfLines={1} adjustsFontSizeToFit style={{ color: DESIGN.colors.text }}>{title}</Text>
        {subtitle ? <Text className="text-xs" numberOfLines={1} style={{ color: DESIGN.colors.textSecondary }}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}
