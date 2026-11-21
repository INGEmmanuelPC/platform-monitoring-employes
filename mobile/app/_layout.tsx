import { Stack } from "expo-router";
import { AppProviders } from "@/src/providers/AppProviders";
import { PushNotificationsBridge } from "@/src/providers/PushNotificationsBridge";
import { SCREEN_TITLES } from "@/src/navigation/screenTitles";

export const unstable_settings = {
  anchor: "(tecnico)",
};

export default function RootLayout() {
  return (
    <AppProviders>
      <PushNotificationsBridge />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tecnico)" options={{ headerShown: false }} />
        <Stack.Screen name="trabajo/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="crud/tecnicos/index" options={{ title: SCREEN_TITLES["crud/tecnicos/index"], headerShown: false }} />
        <Stack.Screen name="crud/tecnicos/nuevo" options={{ title: SCREEN_TITLES["crud/tecnicos/nuevo"], headerShown: false }} />
        <Stack.Screen name="crud/tecnicos/[id]" options={{ title: SCREEN_TITLES["crud/tecnicos/[id]"], headerShown: false }} />
        <Stack.Screen name="crud/clientes/index" options={{ title: SCREEN_TITLES["crud/clientes/index"], headerShown: false }} />
        <Stack.Screen name="crud/clientes/nuevo" options={{ title: SCREEN_TITLES["crud/clientes/nuevo"], headerShown: false }} />
        <Stack.Screen name="crud/clientes/[id]" options={{ title: SCREEN_TITLES["crud/clientes/[id]"], headerShown: false }} />
        <Stack.Screen name="crud/ordenes/index" options={{ title: SCREEN_TITLES["crud/ordenes/index"], headerShown: false }} />
        <Stack.Screen name="crud/ordenes/nuevo" options={{ title: SCREEN_TITLES["crud/ordenes/nuevo"], headerShown: false }} />
        <Stack.Screen name="crud/ordenes/[id]" options={{ title: SCREEN_TITLES["crud/ordenes/[id]"], headerShown: false }} />
      </Stack>
    </AppProviders>
  );
}
