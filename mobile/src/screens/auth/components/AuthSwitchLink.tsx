import { Link, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { DESIGN, MIN_TOUCH_TARGET } from "@/constants/design";

type Props = {
  prompt: string;
  linkText: string;
  href: Href;
};

export function AuthSwitchLink({ prompt, linkText, href }: Props) {
  return (
    <View className="flex-row justify-center gap-1">
      <Text className="text-sm text-neutral-600">{prompt}</Text>
      <Link href={href} asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={linkText}
          className="items-center justify-center rounded-lg px-2"
          style={({ pressed }) => [
            { minHeight: MIN_TOUCH_TARGET },
            pressed ? { backgroundColor: DESIGN.colors.borderSubtle, opacity: 0.8 } : undefined,
          ]}
        >
          <Text className="text-sm font-semibold" style={{ color: DESIGN.colors.brand }}>{linkText}</Text>
        </Pressable>
      </Link>
    </View>
  );
}
