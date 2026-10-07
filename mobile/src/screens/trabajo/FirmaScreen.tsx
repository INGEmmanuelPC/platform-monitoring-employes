import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

import { Button } from "@/components/Button";
import { finalizarTrabajo, guardarFirma } from "@/src/data/trabajos";
import { useAuth } from "@/src/session/AuthProvider";

import { FirmaPad, type FirmaTouchEvent } from "./components/FirmaPad";

export default function FirmaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useSQLiteContext();
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signaturePath, setSignaturePath] = useState("");

  const startStroke = (event: FirmaTouchEvent) => { const { locationX, locationY } = event.nativeEvent; setSignaturePath(`M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`); };
  const continueStroke = (event: FirmaTouchEvent) => { const { locationX, locationY } = event.nativeEvent; setSignaturePath((current) => `${current} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`); };
  const finish = async () => {
    if (!id || !session?.user.id) { setError("No se pudo identificar el trabajo."); return; }
    if (!signaturePath) { setError("El cliente debe firmar antes de terminar."); return; }
    setSaving(true); setError(null);
    try { await guardarFirma(database, id, signaturePath); await finalizarTrabajo(database, session.user.id, id); router.replace("/"); }
    catch { setError("No se pudo finalizar el trabajo en el dispositivo."); }
    finally { setSaving(false); }
  };

  return (
    <View className="flex-1 gap-6 bg-neutral-50 p-6">
      <Text className="text-center text-lg text-neutral-700">Pásale el celular al cliente para que firme.</Text>
      <FirmaPad path={signaturePath} onStart={startStroke} onMove={continueStroke} onClear={() => setSignaturePath("")} />
      {error ? <Text className="text-center text-sm text-red-600">{error}</Text> : null}
      <Button text={saving ? "Guardando..." : "Confirmar y terminar"} disabled={saving} onPress={() => void finish()} className="w-full" />
      {saving ? <ActivityIndicator color="#0a7ea4" /> : null}
      <Text className="text-center text-xs text-neutral-400">Al firmar, el cliente acepta el tratamiento de sus datos.</Text>
    </View>
  );
}
