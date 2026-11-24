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
import { Fragment, PropsWithChildren, useEffect, useLayoutEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { initializeDatabase, NOMBRE_BASE_DATOS } from "@/src/data/database";
import { AuthProvider } from "@/src/session/AuthProvider";
import { ConsentimientoProvider } from "@/src/session/ConsentimientoProvider";
import { RouteGuard } from "@/src/session/RouteGuard";
import { AppAlertProvider } from "@/components/AppAlert";
import { AppearanceProvider, useAppearance } from "@/src/theme/AppearanceProvider";
import { applyAppearance } from "@/constants/design";

import "@/global.css";

SplashScreen.preventAutoHideAsync();

export function AppProviders({ children }: PropsWithChildren) {
  const [fontsLoaded, fontsError] = useFonts({
    Archivo_700Bold,
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
  });

  useLayoutEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  return (
    <AppearanceProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </AppearanceProvider>
  );
}

function ThemedProviders({ children }: PropsWithChildren) {
  const { mode } = useAppearance();

  useEffect(() => {
    applyAppearance(mode);
  }, [mode]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppAlertProvider>
        <AuthProvider>
          <ConsentimientoProvider>
            <SQLiteProvider databaseName={NOMBRE_BASE_DATOS} onInit={initializeDatabase}>
              <ThemeProvider key={mode} value={mode === "dark" ? DarkTheme : DefaultTheme}>
                <RouteGuard>
                  <Fragment key={mode}>{children}</Fragment>
                </RouteGuard>
                <StatusBar style={mode === "dark" ? "light" : "dark"} />
              </ThemeProvider>
            </SQLiteProvider>
          </ConsentimientoProvider>
        </AuthProvider>
      </AppAlertProvider>
    </GestureHandlerRootView>
  );
}