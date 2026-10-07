import { Pressable, Text } from "react-native";

type Props = {
  summary: string;
  estado: string;
  onPress: () => void;
};

export function EntityListItem({ summary, estado, onPress }: Props) {
  return (
    <Pressable className="gap-1 rounded-xl border border-neutral-200 bg-white p-4" onPress={onPress}>
      <Text className="text-base font-semibold text-neutral-900">{summary}</Text>
      <Text className="text-xs text-neutral-500">{estado}</Text>
    </Pressable>
  );
}
