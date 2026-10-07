import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";

export type FirmaTouchEvent = { nativeEvent: { locationX: number; locationY: number } };

type Props = {
  path: string;
  onStart: (event: FirmaTouchEvent) => void;
  onMove: (event: FirmaTouchEvent) => void;
  onClear: () => void;
};

export function FirmaPad({ path, onStart, onMove, onClear }: Props) {
  return (
    <View className="gap-2 rounded-xl border-2 border-dashed border-neutral-300 bg-white p-2">
      <Svg height={260} viewBox="0 0 360 260" onTouchStart={onStart} onTouchMove={onMove} className="w-full">
        {path ? <Path d={path} stroke="#111827" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
      </Svg>
      {!path ? (
        <View className="absolute inset-0 items-center justify-center">
          <IconSymbol size={42} name="signature" color="#A3A3A3" />
          <Text className="mt-2 text-sm text-neutral-400">Firmar aquí</Text>
        </View>
      ) : null}
      <Button text="Limpiar firma" onPress={onClear} className="bg-neutral-500" />
    </View>
  );
}
