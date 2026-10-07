import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/Button";

export function ManagementLinks() {
  const router = useRouter();

  return (
    <View className="gap-2">
      <Button text="Técnicos" onPress={() => router.push("/crud/tecnicos" as never)} />
      <Button text="Clientes" onPress={() => router.push("/crud/clientes" as never)} />
      <Button text="Órdenes de trabajo" onPress={() => router.push("/crud/ordenes" as never)} />
    </View>
  );
}
