import { Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import { TEXTOS_CANCELACION as T } from "@/constants/cancelacion";
import { MAX_MOTIVO_CANCELACION } from "@/src/domain/estadoTrabajo";

import { useWorkCancellation } from "../hooks/useWorkCancellation";

// Dos pasos a propósito: cancelar es terminal y no se puede deshacer.
export function CancelarTrabajoPanel({ trabajoId, onCancelled }: { trabajoId: string; onCancelled: () => void }) {
  const c = useWorkCancellation(trabajoId, onCancelled);

  if (!c.abierto) {
    return <Button text={T.abrir} variant="secondary" onPress={c.abrir} />;
  }

  return (
    <View
      className="gap-3 rounded-2xl border p-4"
      style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.error, borderBottomWidth: 3, borderRadius: DESIGN.radius.card, ...RAISED_SURFACE }}
    >
      <Text accessibilityRole="header" className="text-base font-semibold" style={{ color: DESIGN.colors.text }}>{T.titulo}</Text>
      <Text className="text-sm font-semibold" style={{ color: DESIGN.colors.text }}>{T.campo}</Text>
      <TextInput
        accessibilityLabel={T.campo}
        className="min-h-24 rounded-2xl border p-3"
        style={{ color: DESIGN.colors.text, backgroundColor: DESIGN.colors.inset, borderColor: DESIGN.colors.border, borderRadius: DESIGN.radius.card, textAlignVertical: "top" }}
        placeholder={T.placeholder}
        placeholderTextColor={DESIGN.colors.textSecondary}
        multiline
        maxLength={MAX_MOTIVO_CANCELACION}
        editable={!c.saving}
        value={c.motivo}
        onChangeText={c.setMotivo}
      />
      <Text className="text-xs" style={{ color: DESIGN.colors.textSecondary }}>{T.ayuda}</Text>
      {c.error ? <ErrorBanner message={c.error} /> : null}
      <Button
        text={c.saving ? T.cancelando : T.confirmar}
        variant="danger"
        onPress={() => void c.cancelar()}
        disabled={c.saving || !c.motivo.trim()}
        loading={c.saving}
      />
      <Button text={T.volver} variant="secondary" onPress={c.cerrar} disabled={c.saving} />
      <Text className="text-center text-xs" style={{ color: DESIGN.colors.textSecondary }}>{T.requiereConexion}</Text>
    </View>
  );
}
