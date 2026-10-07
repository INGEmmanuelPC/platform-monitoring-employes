import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { listEntities, type EntityName, type EntityRecord } from "@/src/api/entities";

export function useEntityList(entity: EntityName) {
  const [items, setItems] = useState<EntityRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntities = useCallback(() => {
    let active = true;
    setLoading(true);
    listEntities(entity, search).then((result) => {
      if (active) { setItems(result); setError(null); }
    }).catch((loadError) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "No se pudo cargar la información.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [entity, search]);

  useFocusEffect(loadEntities);

  return { items, search, setSearch, loading, error };
}
