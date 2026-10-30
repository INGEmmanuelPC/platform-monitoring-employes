import { ActivityIndicator, ScrollView, Text } from "react-native";

import { Button } from "@/components/Button";
import { DESIGN } from "@/constants/design";

import { FotoEvidenciaCard } from "./components/FotoEvidenciaCard";
import { useWorkEvidence } from "./hooks/useWorkEvidence";

export default function EvidenciaScreen() {
  const { afterUri, beforeUri, continueToNote, error, takePhoto, taking } = useWorkEvidence();

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }} contentContainerClassName="gap-5 p-5 pb-10" keyboardShouldPersistTaps="handled">
      <Text className="text-center text-base" style={{ color: DESIGN.colors.text }}>Registra una evidencia antes y otra después del servicio.</Text>
      <FotoEvidenciaCard
        title="Antes"
        uri={beforeUri}
        buttonText={taking === "FOTO_ANTES" ? "Guardando..." : "Tomar foto"}
        disabled={taking !== null}
        onPress={() => void takePhoto("FOTO_ANTES")}
      />
      <FotoEvidenciaCard
        title="Después"
        uri={afterUri}
        buttonText={taking === "FOTO_DESPUES" ? "Guardando..." : "Tomar foto"}
        disabled={taking !== null}
        onPress={() => void takePhoto("FOTO_DESPUES")}
      />
      {error ? <Text className="text-center text-sm" style={{ color: DESIGN.colors.error }}>{error}</Text> : null}
      <Text className="text-center text-xs" style={{ color: DESIGN.colors.textSecondary }}>La foto de después es necesaria para continuar. Puedes reemplazar cualquiera antes de avanzar.</Text>
      <Button text="Continuar" onPress={continueToNote} disabled={!afterUri || taking !== null} className="w-full" />
      {taking ? <ActivityIndicator color={DESIGN.colors.brand} /> : null}
    </ScrollView>
  );
}