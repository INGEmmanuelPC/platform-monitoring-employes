import { Tabs } from "expo-router";

import { HapticTab } from "@/components/haptic-tab";
import { IndicadorSync } from "@/components/indicador-sync";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Tres pestañas y no más. Cada una es un LUGAR al que el técnico vuelve.
// El flujo de un trabajo no vive aquí: es un proceso con principio y fin,
// así que va en un Stack encima (app/trabajo/[id]).
export default function TecnicoLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarButton: HapticTab,
        headerRight: () => <IndicadorSync />,
        // Objetivo blanco grande: el técnico usa la app cansado, de pie y
        // muchas veces con guantes.
        tabBarLabelStyle: { fontSize: 13 },
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 8 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoy",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={30} name="list.bullet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={30} name="clock.arrow.circlepath" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: "Cuenta",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={30} name="person.crop.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
