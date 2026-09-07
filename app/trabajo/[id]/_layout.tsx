import { Stack } from "expo-router";

// Stack y no Tabs: los pasos de un trabajo son un proceso lineal con principio
// y fin. El técnico entra, hace lo suyo y sale. Un Stack da el botón de volver
// gratis y no ensucia la barra inferior con pantallas de un solo uso.
export default function TrabajoLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Volver" }}>
      <Stack.Screen name="index" options={{ title: "Trabajo" }} />
      <Stack.Screen name="llegada" options={{ title: "Marcar llegada" }} />
      <Stack.Screen name="evidencia" options={{ title: "Fotos" }} />
      <Stack.Screen name="dictado" options={{ title: "Dictar" }} />
      <Stack.Screen
        name="firma"
        options={{ title: "Firma del cliente", presentation: "modal" }}
      />
    </Stack>
  );
}
