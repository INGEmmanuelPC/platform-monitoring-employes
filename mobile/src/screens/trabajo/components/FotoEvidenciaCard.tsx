import { Image, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";

type Props = {
  title: string;
  uri: string | null;
  buttonText: string;
  disabled: boolean;
  onPress: () => void;
};

export function FotoEvidenciaCard({ title, uri, buttonText, disabled, onPress }: Props) {
  return (
    <View className="gap-3 rounded-xl border border-neutral-200 bg-white p-5">
      <IconSymbol size={48} name="camera.fill" color="#1B4965" />
      <Text className="text-base font-semibold text-neutral-900">{title}</Text>
      {uri ? <Image source={{ uri }} className="h-44 w-full rounded-lg" resizeMode="cover" /> : null}
      <Button text={buttonText} onPress={onPress} disabled={disabled} className="w-full" />
    </View>
  );
}
