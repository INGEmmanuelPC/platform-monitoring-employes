import { Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { PENDIENTES_POR_SUBIR } from "@/constants/trabajos";

// Eje 2 del contrato de estados. Va en el encabezado y se ve desde cualquier
// pestaña: el técnico necesita saber en todo momento que nada se perdió.
// Por ahora lee un dato de ejemplo; en V0 leerá la cola de salida de SQLite.
export function IndicadorSync() {
  const pendientes = PENDIENTES_POR_SUBIR;
  const todoSubido = pendientes === 0;

  return (
    <View className="mr-4 flex-row items-center gap-1.5">
      <IconSymbol
        size={20}
        name={todoSubido ? "checkmark.icloud.fill" : "icloud.slash.fill"}
        color={todoSubido ? "#15703D" : "#90520A"}
      />
      <Text className={todoSubido ? "text-xs text-green-800" : "text-xs text-amber-700"}>
        {todoSubido ? "Todo subido" : `${pendientes} sin subir`}
      </Text>
    </View>
  );
}
