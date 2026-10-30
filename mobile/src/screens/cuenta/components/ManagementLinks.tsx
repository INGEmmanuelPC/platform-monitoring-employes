import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/Button";

export function ManagementLinks() {
  const router = useRouter();

  return (
    <View className="gap-2" style={{ width: "100%", opacity: 1 }}>
      <Button text="Técnicos" variant="primary" onPress={() => router.push("/crud/tecnicos" as never)} className="w-full" />
      <Button text="Clientes" variant="primary" onPress={() => router.push("/crud/clientes" as never)} className="w-full" />
      <Button text="Órdenes de trabajo" variant="primary" onPress={() => router.push("/crud/ordenes" as never)} className="w-full" />
    </View>
  );
}
