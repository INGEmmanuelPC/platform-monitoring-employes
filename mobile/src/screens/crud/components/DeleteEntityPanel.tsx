import { Text, View } from "react-native";

import { Button } from "@/components/Button";
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
      {error ? <Text className="mb-2 text-center text-sm text-red-600">{error}</Text> : null}
      {confirming ? (
        <View className="gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-800">
            {entity === "tecnicos"
              ? "El técnico quedará desactivado y no podrá usar rutas protegidas."
              : "Esta acción no se puede deshacer."}
          </Text>
          <View className="flex-row gap-2">
            <Button text="Cancelar" onPress={onCancel} className="flex-1 bg-neutral-500" />
            <Button
              text={deleting ? "Desactivando..." : "Confirmar desactivación"}
              disabled={deleting}
              onPress={onConfirm}
              className="flex-1 bg-red-600"
            />
          </View>
        </View>
      ) : (
        <Button text={entity === "tecnicos" ? "Desactivar" : "Eliminar"} onPress={onRequest} className="bg-red-600" />
      )}
    </>
  );
}
