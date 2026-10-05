import { Stack } from "expo-router";
import { AppProviders } from "@/src/components/app/AppProviders";

export const unstable_settings = {
  anchor: "(tecnico)",
};

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tecnico)" options={{ headerShown: false }} />
        <Stack.Screen name="trabajo/[id]" options={{ headerShown: false }} />
      </Stack>
    </AppProviders>
  );
}
