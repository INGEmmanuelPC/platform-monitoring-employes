import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

import "@/global.css";

// Punto de entrada de toda la app. Aquí van los proveedores globales (tema,
// estilos) y el Stack de más afuera.
//
// Deep linking: expo-router arma los enlaces solos a partir de esta carpeta.
// Con "scheme": "introductionmovilsubject" en app.json, un enlace como
// introductionmovilsubject://trabajo/2 abre directo ese trabajo.
export const unstable_settings = {
  anchor: "(tecnico)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Las pestañas del técnico. Sin encabezado propio: cada pestaña pone el suyo. */}
        <Stack.Screen name="(tecnico)" options={{ headerShown: false }} />
        {/* El flujo de un trabajo se apila encima de las pestañas. */}
        <Stack.Screen name="trabajo/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
