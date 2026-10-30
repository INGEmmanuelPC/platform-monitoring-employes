import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { BrandHeader } from "@/components/BrandHeader";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";

type Props = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AuthFormLayout({ title, subtitle, children }: Props) {
  return (
    <KeyboardAvoidingView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerClassName="flex-grow justify-center p-5" keyboardShouldPersistTaps="always">
        <BrandHeader />
        <View className="mt-6 gap-6 rounded-2xl border p-5" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, ...RAISED_SURFACE }}>
          <View className="gap-1">
            <Text className="font-display text-2xl" style={{ color: DESIGN.colors.text }}>{title}</Text>
            <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{subtitle}</Text>
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
