import { Link, type Href } from "expo-router";
import { Text, View } from "react-native";

type Props = {
  prompt: string;
  linkText: string;
  href: Href;
};

export function AuthSwitchLink({ prompt, linkText, href }: Props) {
  return (
    <View className="flex-row justify-center gap-1">
      <Text className="text-sm text-neutral-600">{prompt}</Text>
      <Link href={href} className="text-sm font-semibold text-blue-700">{linkText}</Link>
    </View>
  );
}
