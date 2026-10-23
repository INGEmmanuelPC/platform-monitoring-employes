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
  return (
    <>
      {error ? <Text className="mb-2 text-center text-sm" style={{ color: DESIGN.colors.error }}>{error}</Text> : null}
      {confirming ? (
        <View className="gap-2 rounded-lg border p-3" style={{ backgroundColor: DESIGN.colors.errorSurface, borderColor: DESIGN.colors.error, ...RAISED_SURFACE }}>
          <Text className="text-sm" style={{ color: DESIGN.colors.error }}>
            {entity === "tecnicos"
              ? "El técnico quedará desactivado y no podrá usar rutas protegidas."
              : "Esta acción no se puede deshacer."}
          </Text>
          <View className="flex-row gap-2">
            <Button text="Cancelar" onPress={onCancel} variant="secondary" className="flex-1" />
            <Button
              text={deleting ? "Desactivando..." : "Confirmar desactivación"}
              disabled={deleting}
              onPress={onConfirm}
              variant="danger"
              className="flex-1"
            />
          </View>
        </View>
      ) : (
        <Button text={entity === "tecnicos" ? "Desactivar" : "Eliminar"} onPress={onRequest} variant="danger" />
      )}
    </>
  );
}
