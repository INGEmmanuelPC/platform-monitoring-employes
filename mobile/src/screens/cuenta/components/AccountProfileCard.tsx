import { Text, View } from "react-native";

type Props = {
  name: string;
  email: string | undefined;
};

export function AccountProfileCard({ name, email }: Props) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-blue-700">
        <Text className="text-lg font-bold text-white">{name.trim().charAt(0).toUpperCase()}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-lg font-semibold text-neutral-950">{name}</Text>
        <Text className="text-sm text-neutral-700">{email}</Text>
      </View>
    </View>
  );
}
