import { Text, View } from "react-native";

import { Button } from "@/components/Button";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import type { EntityName } from "@/src/api/entities";

type Props = {
  entity: EntityName;
  confirming: boolean;
  deleting: boolean;
  error: string | null;
  onRequest: () => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteEntityPanel({ entity, confirming, deleting, error, onRequest, onCancel, onConfirm }: Props) {
  // Técnicos y clientes son soft delete (estado = INACTIVO) para no romper el
  // historial: un técnico puede tener trabajos y un cliente puede estar
  // referenciado por órdenes pasadas. Órdenes sí se eliminan en duro.
  const esDesactivacion = entity === "tecnicos" || entity === "clientes";
  const triggerText = esDesactivacion ? "Desactivar" : "Eliminar";
  const confirmIdleText = esDesactivacion ? "Confirmar desactivación" : "Confirmar eliminación";
  const confirmBusyText = esDesactivacion ? "Desactivando..." : "Eliminando...";
  const hint =
    entity === "tecnicos"
      ? "El técnico quedará desactivado y no podrá usar rutas protegidas."
      : entity === "clientes"
        ? "El cliente dejará de aparecer en la lista. Sus órdenes anteriores no se tocan."
        : "Esta acción no se puede deshacer.";

  return (
    <>
      {error ? <Text className="mb-2 text-center text-sm" style={{ color: DESIGN.colors.error }}>{error}</Text> : null}
      {confirming ? (
        <View className="gap-2 rounded-lg border p-3" style={{ backgroundColor: DESIGN.colors.errorSurface, borderColor: DESIGN.colors.error, ...RAISED_SURFACE }}>
          <Text className="text-sm" style={{ color: DESIGN.colors.error }}>{hint}</Text>
          <View className="flex-row gap-2">
            <Button text="Cancelar" onPress={onCancel} variant="secondary" className="flex-1" />
            <Button
              text={deleting ? confirmBusyText : confirmIdleText}
              disabled={deleting}
              onPress={onConfirm}
              variant="danger"
              className="flex-1"
            />
          </View>
        </View>
      ) : (
        <Button text={triggerText} onPress={onRequest} variant="danger" />
      )}
    </>
  );
}
