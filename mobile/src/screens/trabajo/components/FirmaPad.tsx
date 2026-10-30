import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";

export type FirmaTouchEvent = { nativeEvent: { locationX: number; locationY: number } };

type Props = {
  path: string;
  onStart: (event: FirmaTouchEvent) => void;
  onMove: (event: FirmaTouchEvent) => void;
  onClear: () => void;
};

export function FirmaPad({ path, onStart, onMove, onClear }: Props) {
  return (
    <View className="gap-2 rounded-2xl border-2 border-dashed p-2" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.card, ...RAISED_SURFACE }}>
      <Svg height={260} viewBox="0 0 360 260" onTouchStart={onStart} onTouchMove={onMove} className="w-full">
        {path ? <Path d={path} stroke={DESIGN.colors.text} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </Svg>
      {!path ? (
        <View className="absolute inset-0 items-center justify-center">
          <IconSymbol size={42} name="signature" color={DESIGN.colors.textSecondary} />
          <Text className="mt-2 text-sm" style={{ color: DESIGN.colors.textSecondary }}>Firmar aquí</Text>
        </View>
      ) : null}
      <Button text="Limpiar firma" onPress={onClear} variant="secondary" />
    </View>
  );
}
