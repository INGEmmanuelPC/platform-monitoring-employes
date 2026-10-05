import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Archivo_700Bold } from "@expo-google-fonts/archivo/700Bold";
import { IBMPlexSans_400Regular } from "@expo-google-fonts/ibm-plex-sans/400Regular";
import { IBMPlexSans_600SemiBold } from "@expo-google-fonts/ibm-plex-sans/600SemiBold";
import { useFonts } from "expo-font";
import { SQLiteProvider } from "expo-sqlite";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { PropsWithChildren, useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { initializeDatabase } from "@/src/data/database";
import { AuthProvider } from "@/src/session/AuthProvider";
import { RouteGuard } from "@/src/session/RouteGuard";

import "@/global.css";

SplashScreen.preventAutoHideAsync();

export function AppProviders({ children }: PropsWithChildren) {
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SQLiteProvider databaseName="empleados.db" onInit={initializeDatabase}>
          <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <RouteGuard>
              {children}
            </RouteGuard>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SQLiteProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}