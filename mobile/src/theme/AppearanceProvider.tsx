import * as SecureStore from "expo-secure-store";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { applyAppearance } from "@/constants/design";

export type AppearanceMode = "light" | "dark";

type AppearanceContextValue = {
  mode: AppearanceMode;
  setMode: (mode: AppearanceMode) => void;
};

const STORAGE_KEY = "cuadrilla.appearance";
const AppearanceContext = createContext<AppearanceContextValue | null>(null);

async function readMode(): Promise<AppearanceMode | null> {
  try {
    const stored = Platform.OS === "web"
      ? globalThis.localStorage?.getItem(STORAGE_KEY)
      : await SecureStore.getItemAsync(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

async function writeMode(mode: AppearanceMode): Promise<void> {
  try {
    if (Platform.OS === "web") {
      globalThis.localStorage?.setItem(STORAGE_KEY, mode);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, mode);
    }
  } catch {
    // The visual preference is best effort; the current session still updates.
  }
}

export function AppearanceProvider({ children }: PropsWithChildren) {
  const systemMode = useColorScheme();
  const [mode, setModeState] = useState<AppearanceMode>(systemMode === "dark" ? "dark" : "light");

  useEffect(() => {
    void readMode().then((stored) => {
      if (stored) setModeState(stored);
    });
  }, []);

  const value = useMemo<AppearanceContextValue>(() => ({
    mode,
    setMode: (nextMode) => {
      applyAppearance(nextMode);
      setModeState(nextMode);
      void writeMode(nextMode);
    },
  }), [mode]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error("useAppearance debe usarse dentro de AppearanceProvider");
  return context;
}
