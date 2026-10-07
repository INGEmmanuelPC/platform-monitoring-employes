import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { deleteEntity, type EntityName } from "@/src/api/entities";

import { DeleteEntityPanel } from "./components/DeleteEntityPanel";
import { EntityFormScreen } from "./EntityFormScreen";

export function EntityDetailScreen({ entity }: { entity: EntityName }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  if (!id) return null;
  const remove = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteEntity(entity, id);
      if (!result.deleted) throw new Error("El servidor no confirmó la eliminación.");
      router.back();
    } catch (removeError) {
      setDeleteError(removeError instanceof Error ? removeError.message : "No se pudo eliminar el registro.");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <View className="flex-1 bg-neutral-50 p-4">
      <EntityFormScreen entity={entity} edit />
      <DeleteEntityPanel
        entity={entity}
        confirming={confirmingDelete}
        deleting={deleting}
        error={deleteError}
        onRequest={() => setConfirmingDelete(true)}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => void remove()}
      />
    </View>
  );
}
