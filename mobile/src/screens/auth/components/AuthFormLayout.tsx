import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { BrandHeader } from "@/components/BrandHeader";

type Props = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AuthFormLayout({ title, subtitle, children }: Props) {
  return (
    <KeyboardAvoidingView className="flex-1 bg-neutral-50" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerClassName="flex-grow justify-center p-6" keyboardShouldPersistTaps="handled">
        <BrandHeader />
        <View className="mt-6 gap-6 rounded-xl border border-neutral-200 bg-white p-5">
          <View className="gap-1">
            <Text className="font-display text-2xl text-neutral-900">{title}</Text>
            <Text className="text-sm text-neutral-600">{subtitle}</Text>
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
