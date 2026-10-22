import { Image, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";

type Props = {
  title: string;
  uri: string | null;
  buttonText: string;
  disabled: boolean;
  onPress: () => void;
};

export function FotoEvidenciaCard({ title, uri, buttonText, disabled, onPress }: Props) {
  return (
    <View className="gap-3 rounded-2xl border p-5" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.card, borderBottomWidth: 3, borderBottomColor: DESIGN.colors.borderSubtle, ...RAISED_SURFACE }}>
      <IconSymbol size={48} name="camera.fill" color={DESIGN.colors.brand} />
      <Text className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>{title}</Text>
      {uri ? <Image source={{ uri }} className="h-44 w-full rounded-xl" resizeMode="cover" /> : null}
      <Button text={buttonText} onPress={onPress} disabled={disabled} className="w-full" />
    </View>
  );
}
