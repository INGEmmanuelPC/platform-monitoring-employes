import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { IconSymbol } from "@/components/ui/icon-symbol";

// Acta de conformidad, no reporte redactado. El cliente firma sobre la
// evidencia que SÍ existe sin señal: horas, fotos, notas y materiales.
// El reporte llega después por correo, y solo tras la aprobación del admin.
export default function FirmaScreen() {
  return (
    <View className="flex-1 gap-6 bg-neutral-50 p-6">
      <Text className="text-center text-lg text-neutral-700">
        Pásale el celular al cliente para que firme.
      </Text>

      <View className="flex-1 items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white">
        <IconSymbol size={56} name="signature" color="#A3A3A3" />
        <Text className="mt-2 text-sm text-neutral-400">Firmar aquí</Text>
      </View>

      <Button text="Confirmar y terminar" onPress={() => {}} className="w-full" />
      <Text className="text-center text-xs text-neutral-400">
        Al firmar, el cliente acepta el tratamiento de sus datos.
      </Text>
    </View>
  );
}
