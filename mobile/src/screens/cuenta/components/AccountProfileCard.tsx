import { Text, View } from "react-native";

type Props = {
  name: string;
  email: string | undefined;
};

export function AccountProfileCard({ name, email }: Props) {
  return (
    <View className="gap-1 rounded-xl border border-neutral-200 bg-white p-4">
      <Text className="text-lg font-semibold text-neutral-900">{name}</Text>
      <Text className="text-sm text-neutral-600">{email}</Text>
    </View>
  );
}
