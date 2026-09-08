import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/src/session/AuthProvider";
import { RouteGuard } from "@/src/session/RouteGuard";
import { initializeDatabase } from "@/src/data/database";

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
    <AuthProvider>
      <SQLiteProvider databaseName="empleados.db" onInit={initializeDatabase}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <RouteGuard>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tecnico)" options={{ headerShown: false }} />
              <Stack.Screen name="trabajo/[id]" options={{ headerShown: false }} />
            </Stack>
          </RouteGuard>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SQLiteProvider>
    </AuthProvider>
  );
}
