import { Link } from "expo-router";
import { Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";

export type Paso = {
  ruta: "llegada" | "evidencia" | "dictado" | "firma";
  titulo: string;
  icono: "mappin.and.ellipse" | "camera.fill" | "mic.fill" | "signature";
  hecho: boolean;
  opcional?: boolean;
};

export function PasoLink({ paso, trabajoId }: { paso: Paso; trabajoId: string }) {
  return (
    <Link href={{ pathname: `/trabajo/[id]/${paso.ruta}`, params: { id: trabajoId } }} className="rounded-xl border border-neutral-200 bg-white p-4">
      <View className="w-full flex-row items-center gap-3">
        <IconSymbol size={26} name={paso.hecho ? "checkmark.circle.fill" : paso.icono} color={paso.hecho ? "#15703D" : "#404040"} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-neutral-900">{paso.titulo}</Text>
          {paso.opcional ? <Text className="text-xs text-neutral-500">Opcional</Text> : null}
        </View>
        <IconSymbol size={18} name="chevron.right" color="#A3A3A3" />
      </View>
    </Link>
  );
}
