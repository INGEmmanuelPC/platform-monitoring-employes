import { Stack } from "expo-router";

import { Fonts } from "@/constants/fonts";

export default function TrabajoStack() {
  return <Stack screenOptions={{ headerBackTitle: "Volver", headerTitleStyle: { fontFamily: Fonts.display } }}><Stack.Screen name="index" options={{ title: "Trabajo" }} /><Stack.Screen name="llegada" options={{ title: "Marcar llegada" }} /><Stack.Screen name="evidencia" options={{ title: "Fotos" }} /><Stack.Screen name="dictado" options={{ title: "Dictar" }} /><Stack.Screen name="firma" options={{ title: "Firma del cliente", presentation: "modal" }} /></Stack>;
}