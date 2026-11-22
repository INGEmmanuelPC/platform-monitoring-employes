import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import { TEXTOS_CONSENTIMIENTO as T, TEXTOS_CONSENTIMIENTO_CUENTA as TC } from "@/constants/consentimiento";

import { useConsentimientoScreen } from "./hooks/useConsentimientoScreen";

export default function ConsentimientoScreen() {
  const { error, responder, saving } = useConsentimientoScreen();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: DESIGN.colors.canvas }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24, gap: 16 }}
    >
      <View className="items-center gap-3">
        <IconSymbol size={56} name="mappin.and.ellipse" color={DESIGN.colors.brand} />
        <Text accessibilityRole="header" className="text-center font-display text-2xl" style={{ color: DESIGN.colors.text }}>
          {T.titulo}
        </Text>
        <Text className="text-center text-base" style={{ color: DESIGN.colors.textSecondary }}>{T.introduccion}</Text>
      </View>

      <View className="gap-3">
        {T.puntos.map((punto) => (
          <View
            key={punto.titulo}
            accessible
            className="gap-1 rounded-2xl border p-4"
            style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, borderBottomWidth: 3, borderRadius: DESIGN.radius.card, ...RAISED_SURFACE }}
          >
            <Text className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>{punto.titulo}</Text>
            <Text className="text-base" style={{ color: DESIGN.colors.textSecondary }}>{punto.detalle}</Text>
          </View>
        ))}
      </View>

      <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{T.derechos}</Text>
      <Text className="text-sm font-semibold" style={{ color: DESIGN.colors.text }}>{T.noBloquea}</Text>

      {error ? <ErrorBanner message={TC.error} /> : null}

      <View className="gap-3">
        <Button
          text={T.aceptar}
          onPress={() => void responder("aceptado")}
          disabled={saving}
          loading={saving}
          accessibilityLabel={T.accesibilidadAceptar}
        />
        <Button
          text={T.rechazar}
          variant="secondary"
          onPress={() => void responder("rechazado")}
          disabled={saving}
          accessibilityLabel={T.accesibilidadRechazar}
        />
      </View>
    </ScrollView>
  );
}
