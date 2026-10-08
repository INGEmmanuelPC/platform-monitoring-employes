import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

import { type EntityName } from "@/src/api/entities";

import { DeleteEntityPanel } from "./components/DeleteEntityPanel";
import { EntityFormScreen } from "./EntityFormScreen";
import { useEntityDelete } from "./hooks/useEntityDelete";

export function EntityDetailScreen({ entity }: { entity: EntityName }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    confirmingDelete,
    deleteError,
    deleting,
    remove,
    setConfirmingDelete,
  } = useEntityDelete(entity, id);
  if (!id) return null;
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
