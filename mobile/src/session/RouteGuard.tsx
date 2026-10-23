import { useRouter, useSegments } from "expo-router";
import { useEffect, type PropsWithChildren } from "react";
import { ActivityIndicator, View } from "react-native";
import { DESIGN } from "@/constants/design";

import { useAuth } from "./AuthProvider";

export function RouteGuard({ children }: PropsWithChildren) {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      router.replace("/");
    }
  }, [loading, router, segments, session]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color={DESIGN.colors.brand} />
      </View>
    );
  }

  return children;
}
