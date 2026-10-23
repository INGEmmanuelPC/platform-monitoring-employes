import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { DESIGN, MIN_TOUCH_TARGET } from "@/constants/design";

import { ManagementLinks } from "./ManagementLinks";

export function ManagementMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View
      className="gap-2 rounded-xl border p-4"
      style={{
        backgroundColor: DESIGN.colors.surface,
        borderColor: DESIGN.colors.border,
        borderRadius: DESIGN.radius.card,
        opacity: 1,
        overflow: "visible",
        zIndex: 2,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((open) => !open)}
        className="rounded-xl px-3"
        style={({ pressed }) => [
          { minHeight: MIN_TOUCH_TARGET, justifyContent: "center" },
          pressed ? { backgroundColor: DESIGN.colors.borderSubtle, opacity: 0.8 } : undefined,
        ]}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>Gestión</Text>
          <Text className="text-xl" style={{ color: DESIGN.colors.textSecondary }}>
            {isOpen ? "▲" : "▼"}
          </Text>
        </View>
      </Pressable>

      {isOpen ? (
        <View style={{ opacity: 1, width: "100%", zIndex: 3 }}>
          <ManagementLinks />
        </View>
      ) : null}
    </View>
  );
}
