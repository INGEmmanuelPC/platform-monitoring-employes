import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/Button";

import { FirmaPad } from "./components/FirmaPad";
import { useWorkSignature } from "./hooks/useWorkSignature";

export default function FirmaScreen() {
  const { clearSignature, continueStroke, error, finishWork, saving, signaturePath, startStroke } = useWorkSignature();

  return (
    <View className="flex-1 gap-6 bg-neutral-50 p-6">
      <Text className="text-center text-lg text-neutral-700">Pásale el celular al cliente para que firme.</Text>
      <FirmaPad path={signaturePath} onStart={startStroke} onMove={continueStroke} onClear={clearSignature} />
      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
      <Button text={saving ? "Guardando..." : "Confirmar y terminar"} disabled={saving} onPress={() => void finishWork()} className="w-full" />
      {saving ? <ActivityIndicator color="#0a7ea4" /> : null}
      <Text className="text-center text-xs text-neutral-400">Al firmar, el cliente acepta el tratamiento de sus datos.</Text>
    </View>
  );
}
