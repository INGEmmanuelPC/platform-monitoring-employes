import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
// Import por subruta de peso, no el barrel `@expo-google-fonts/archivo`: el
// índice del paquete hace `require()` de las 18 variantes en un solo módulo,
// así que importar cualquier nombre desde ahí empaqueta las 18 en el bundle.
// Cada subcarpeta de peso es su propio módulo aislado -- solo así Metro
// empaqueta únicamente los tres .ttf que la app usa.
import { Archivo_700Bold } from "@expo-google-fonts/archivo/700Bold";
import { IBMPlexSans_400Regular } from "@expo-google-fonts/ibm-plex-sans/400Regular";
import { IBMPlexSans_600SemiBold } from "@expo-google-fonts/ibm-plex-sans/600SemiBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
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

// La splash screen no se oculta sola: espera a que las fuentes de marca
// (constants/fonts.ts) terminen de cargar, para no mostrar primero el
// nombre "Cuadrilla" en la fuente del sistema y que salte a Archivo medio
// segundo después.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontsError] = useFonts({
    Archivo_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

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
