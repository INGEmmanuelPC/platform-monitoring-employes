import { useRouter, useSegments } from "expo-router";
import { useEffect, type PropsWithChildren } from "react";
import { ActivityIndicator, View } from "react-native";
import { DESIGN } from "@/constants/design";
import { requiereConsentimiento } from "@/src/domain/consentimiento";

import { useAuth } from "./AuthProvider";
import { useConsentimiento } from "./ConsentimientoProvider";

export function RouteGuard({ children }: PropsWithChildren) {
  const { session, profile, loading } = useAuth();
  const { estado: consentimiento } = useConsentimiento();
  const segments = useSegments();
  const router = useRouter();

  // Solo al técnico con la respuesta pendiente (Ley 1581): una vez por cuenta.
  const debePedirConsentimiento = requiereConsentimiento(
    profile?.role,
    consentimiento === "cargando" ? "aceptado" : consentimiento,
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inConsentimiento = segments[0] === "ubicacion";

    if (!session && !inAuthGroup) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      router.replace("/");
    } else if (session && debePedirConsentimiento && !inConsentimiento) {
      router.replace("/ubicacion/consentimiento");
    }
  }, [debePedirConsentimiento, loading, router, segments, session]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: DESIGN.colors.canvas }}>
        <ActivityIndicator size="large" color={DESIGN.colors.brand} />
      </View>
    );
  }

  return children;
}
