import { Stack } from "expo-router";

import { DESIGN } from "@/constants/design";
import { Fonts } from "@/constants/fonts";

export default function TrabajoStack() {
  return (
    <Stack screenOptions={{
      headerBackTitle: "Atrás",
      headerTitleAlign: "left",
      headerStyle: { backgroundColor: DESIGN.colors.surface },
      headerTintColor: DESIGN.colors.brand,
      headerShadowVisible: false,
      headerTitleStyle: { fontFamily: Fonts.display, color: DESIGN.colors.text },
    }}>
      <Stack.Screen name="index" options={{ title: "Orden de trabajo" }} />
      <Stack.Screen name="llegada" options={{ title: "Registro de llegada" }} />
      <Stack.Screen name="evidencia" options={{ title: "Evidencia de campo" }} />
      <Stack.Screen name="dictado" options={{ title: "Nota de trabajo" }} />
      <Stack.Screen name="firma" options={{ title: "Conformidad del cliente", presentation: "modal" }} />
    </Stack>
  );
}
