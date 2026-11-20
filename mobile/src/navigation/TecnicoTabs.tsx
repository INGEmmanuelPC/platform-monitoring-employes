import { usePathname, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IndicadorSync } from "@/components/indicador-sync";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/fonts";
import { DESIGN } from "@/constants/design";
import { AccountDrawer } from "@/src/screens/cuenta/AccountDrawer";

import { DrawerToggleButton } from "./components/DrawerToggleButton";

export default function TecnicoTabs() {
  const pathname = usePathname();
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => setDrawerVisible(false), [pathname]);

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: DESIGN.colors.brand,
          tabBarInactiveTintColor: DESIGN.colors.textSecondary,
          tabBarButton: HapticTab,
          headerLeft: () => <DrawerToggleButton onPress={() => setDrawerVisible(true)} />,
          headerRight: () => <IndicadorSync />,
          tabBarLabelStyle: { fontSize: 13, fontFamily: Fonts.button },
          headerStyle: { backgroundColor: DESIGN.colors.surface },
          headerTintColor: DESIGN.colors.text,
          headerTitleStyle: { fontFamily: Fonts.display, fontSize: 19 },
          tabBarStyle: {
            height: 72,
            paddingTop: 8,
            paddingBottom: 10,
            backgroundColor: DESIGN.colors.surface,
            borderTopColor: DESIGN.colors.border,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Hoy", tabBarIcon: ({ color }) => <IconSymbol size={30} name="list.bullet" color={color} /> }}
        />
        <Tabs.Screen
          name="historial"
          options={{ title: "Historial", tabBarIcon: ({ color }) => <IconSymbol size={30} name="clock.arrow.circlepath" color={color} /> }}
        />
        <Tabs.Screen name="cuenta" options={{ href: null }} />
      </Tabs>
      <AccountDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}
