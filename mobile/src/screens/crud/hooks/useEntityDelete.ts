import { useRouter } from "expo-router";
import { useState } from "react";

import { deleteEntity, type EntityName } from "@/src/api/entities";

export function useEntityDelete(entity: EntityName, id: string | undefined) {
  const router = useRouter();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const remove = async () => {
    if (!id) {
      setDeleteError("No se encontró el registro que se quiere eliminar.");
      return;
    }

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

  return {
    confirmingDelete,
    deleteError,
    deleting,
    remove,
    setConfirmingDelete,
  };
}
