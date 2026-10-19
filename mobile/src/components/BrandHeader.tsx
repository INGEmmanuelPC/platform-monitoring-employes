import { Image } from "expo-image";
import { Text, View } from "react-native";

// Bloque de marca: aparece en los puntos de entrada (login, registro), no en
// las pestañas del técnico. Ver AGENTS.md: la app la usa alguien cansado y de
// pie, y un logo repetido en cada pestaña le resta espacio a lo que sí
// necesita ver ahí (sus trabajos del día).
export function BrandHeader() {
  return (
    <View className="items-center gap-2 pb-1">
      <Image
        source={require("@/assets/images/logotype-navy.png")}
        style={{ width: 72, height: 72 }}
        contentFit="contain"
      />
      <Text className="font-display text-3xl text-[#1B4965]">Cuadrilla</Text>
      <Text className="text-center font-slogan text-sm text-neutral-600">
        El trabajo lo haces tú. El reporte, solo.
      </Text>
    </View>
  );
}

export default BrandHeader;
