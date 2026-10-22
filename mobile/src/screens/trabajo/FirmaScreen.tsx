import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { DESIGN } from "@/constants/design";

import { FirmaPad } from "./components/FirmaPad";
import { useWorkSignature } from "./hooks/useWorkSignature";

export default function FirmaScreen() {
  const { clearSignature, continueStroke, error, finishWork, saving, signaturePath, startStroke } = useWorkSignature();

  return (
    <View className="flex-1 gap-6 p-6" style={{ backgroundColor: DESIGN.colors.canvas }}>
      <Text className="text-center text-lg" style={{ color: DESIGN.colors.text }}>Pásale el celular al cliente para que firme.</Text>
      <FirmaPad path={signaturePath} onStart={startStroke} onMove={continueStroke} onClear={clearSignature} />
      {error ? <Text className="text-center text-sm" style={{ color: DESIGN.colors.error }}>{error}</Text> : null}
      <Button text={saving ? "Guardando..." : "Confirmar y terminar"} disabled={saving} onPress={() => void finishWork()} className="w-full" />
      {saving ? <ActivityIndicator color={DESIGN.colors.brand} /> : null}
      <Text className="text-center text-xs" style={{ color: DESIGN.colors.textSecondary }}>Al firmar, el cliente acepta el tratamiento de sus datos.</Text>
    </View>
  );
}
