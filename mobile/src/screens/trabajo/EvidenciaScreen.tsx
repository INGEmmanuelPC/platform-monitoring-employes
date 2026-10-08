import { ActivityIndicator, ScrollView, Text } from "react-native";

import { Button } from "@/components/Button";

import { FotoEvidenciaCard } from "./components/FotoEvidenciaCard";
import { useWorkEvidence } from "./hooks/useWorkEvidence";

export default function EvidenciaScreen() {
  const { afterUri, beforeUri, continueToNote, error, takePhoto, taking } = useWorkEvidence();

  return (
    <ScrollView className="flex-1 bg-neutral-50" contentContainerClassName="gap-5 p-5 pb-10" keyboardShouldPersistTaps="handled">
      <Text className="text-center text-base text-neutral-700">Registra una evidencia antes y otra después del servicio.</Text>
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
      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
      <Text className="text-center text-xs text-neutral-500">La foto de después es necesaria para continuar. Puedes reemplazar cualquiera antes de avanzar.</Text>
      <Button text="Continuar" onPress={continueToNote} disabled={!afterUri || taking !== null} className="w-full" />
      {taking ? <ActivityIndicator color="#0a7ea4" /> : null}
    </ScrollView>
  );
}