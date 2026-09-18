import { apiRequest, apiUrl } from "./http";
import { supabase } from "./client";

export type EntityName = "tecnicos" | "clientes" | "ordenes";

export type EntityRecord = {
  id: string;
  [key: string]: unknown;
};

export function listEntities(entity: EntityName, search: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiRequest<EntityRecord[]>(`/${entity}${query}`);
}

export function getEntity(entity: EntityName, id: string) {
  return apiRequest<EntityRecord>(`/${entity}/${id}`);
}

export function createEntity(entity: EntityName, values: Record<string, unknown>) {
  return apiRequest<EntityRecord>(`/${entity}`, {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateEntity(entity: EntityName, id: string, values: Record<string, unknown>) {
  return apiRequest<EntityRecord>(`/${entity}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export function deleteEntity(entity: EntityName, id: string) {
  return apiRequest<{ deleted: boolean; id: string }>(`/${entity}/${id}`, { method: "DELETE" });
}

export type SyncOperation = {
  id: number;
  entity: "trabajos" | "evidencias";
  entity_id: string;
  operation: "UPDATE" | "INSERT";
  payload: Record<string, unknown>;
};

export function syncOperations(operations: SyncOperation[]) {
  return apiRequest<{ results: { id: number; synced: boolean }[] }>("/sync", {
    method: "POST",
    body: JSON.stringify(operations),
  });
}

export async function uploadEvidence(uri: string, type: "FOTO_ANTES" | "FOTO_DESPUES") {
  const { data } = await supabase.auth.getSession();
  const form = new FormData();
  form.append("file", { uri, name: "evidencia.jpg", type: "image/jpeg" } as unknown as Blob);
  const response = await fetch(`${apiUrl}/evidencias/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
      "x-evidence-type": type,
    },
    body: form,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error ?? "No se pudo subir la evidencia.");
  return body.path as string;
}
