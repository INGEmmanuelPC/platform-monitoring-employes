import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import { TEXTOS_CONSENTIMIENTO_CUENTA as T } from "@/constants/consentimiento";
import { useConsentimiento } from "@/src/session/ConsentimientoProvider";

// Permite revocar o revisar la autorización cuando el técnico quiera: la
// Ley 1581 exige que revocarla sea tan fácil como darla.
export function UbicacionConsentCard() {
  const router = useRouter();
  const { estado, responder } = useConsentimiento();
  if (estado === "cargando") return null;

  return (
    <View className="gap-3 rounded-xl border p-4" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, ...RAISED_SURFACE }}>
      <View className="flex-row items-center gap-2">
        <IconSymbol size={20} name="mappin.and.ellipse" color={DESIGN.colors.brand} />
        <Text className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>{T.titulo}</Text>
      </View>
      <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{T.estado[estado]}</Text>
      {estado === "aceptado" ? (
        <Button text={T.revocar} variant="secondary" onPress={() => void responder("rechazado").catch(() => undefined)} />
      ) : (
        <Button text={T.activar} variant="secondary" onPress={() => router.push("/ubicacion/consentimiento")} />
      )}
    </View>
  );
}
