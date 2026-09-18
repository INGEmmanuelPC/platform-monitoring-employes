import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "./Button";
import {
  createEntity,
  deleteEntity,
  getEntity,
  listEntities,
  updateEntity,
  type EntityName,
  type EntityRecord,
} from "@/src/api/entities";

type Field = { key: string; label: string; required?: boolean; multiline?: boolean; maxLength?: number };

const definitions: Record<EntityName, { title: string; fields: Field[]; summary: (item: EntityRecord) => string }> = {
  tecnicos: {
    title: "Técnicos",
    fields: [
      { key: "nombre", label: "Nombre", required: true, maxLength: 120 },
      { key: "telefono", label: "Teléfono", maxLength: 40 },
      { key: "especialidad", label: "Especialidad", maxLength: 120 },
    ],
    summary: (item) => String(item.nombre ?? item.full_name ?? "Sin nombre"),
  },
  clientes: {
    title: "Clientes",
    fields: [
      { key: "nombre", label: "Nombre", required: true, maxLength: 120 },
      { key: "email", label: "Correo", maxLength: 160 },
      { key: "telefono", label: "Teléfono", maxLength: 40 },
      { key: "direccion", label: "Dirección", maxLength: 240 },
    ],
    summary: (item) => String(item.nombre ?? "Sin nombre"),
  },
  ordenes: {
    title: "Órdenes de trabajo",
    fields: [
      { key: "cliente_id", label: "ID del cliente", required: true },
      { key: "descripcion", label: "Descripción", required: true, multiline: true, maxLength: 1000 },
      { key: "direccion", label: "Dirección", maxLength: 240 },
      { key: "observaciones", label: "Observaciones", multiline: true, maxLength: 2000 },
    ],
    summary: (item) => String(item.descripcion ?? "Sin descripción"),
  },
};

const createPaths = {
  tecnicos: "/crud/tecnicos/nuevo",
  clientes: "/crud/clientes/nuevo",
  ordenes: "/crud/ordenes/nuevo",
} as const;

function detailPath(entity: EntityName, id: string) {
  if (entity === "tecnicos") return { pathname: "/crud/tecnicos/[id]" as const, params: { id } };
  if (entity === "clientes") return { pathname: "/crud/clientes/[id]" as const, params: { id } };
  return { pathname: "/crud/ordenes/[id]" as const, params: { id } };
}

export function EntityListScreen({ entity }: { entity: EntityName }) {
  const definition = definitions[entity];
  const router = useRouter();
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

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-neutral-900">{definition.title}</Text>
          <Button text="Nuevo" onPress={() => router.push(createPaths[entity] as never)} />
        </View>
        <TextInput className="rounded-lg border border-neutral-300 bg-white p-3" placeholder="Buscar" value={search} onChangeText={setSearch} />
        {loading ? <Text className="text-neutral-600">Cargando...</Text> : null}
        {error ? <Text className="text-red-600">{error}</Text> : null}
        {!loading && !error && items.length === 0 ? <Text className="rounded-lg bg-white p-4 text-neutral-600">No hay registros.</Text> : null}
        {items.map((item) => (
          <Pressable key={item.id} className="gap-1 rounded-xl border border-neutral-200 bg-white p-4" onPress={() => router.push(detailPath(entity, item.id) as never)}>
            <Text className="text-base font-semibold text-neutral-900">{definition.summary(item)}</Text>
            <Text className="text-xs text-neutral-500">{String(item.estado ?? "")}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

export function EntityFormScreen({ entity, edit }: { entity: EntityName; edit: boolean }) {
  const definition = definitions[entity];
  const fields = useMemo(() => entity === "tecnicos" && !edit
    ? [
        definition.fields[0],
        { key: "email", label: "Correo", required: true, maxLength: 160 },
        ...definition.fields.slice(1),
      ]
    : definition.fields, [definition.fields, edit, entity]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<EntityRecord[]>([]);

  useEffect(() => {
    if (entity !== "ordenes") return;
    listEntities("clientes", "")
      .then(setClients)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los clientes."));
  }, [entity]);

  useEffect(() => {
    if (!edit || !id) return;
    getEntity(entity, id).then((item) => {
      const next: Record<string, string> = {};
      fields.forEach((field) => {
        const value = entity === "tecnicos" && field.key === "nombre"
          ? item.full_name
          : item[field.key];
        next[field.key] = String(value ?? "");
      });
      setValues(next);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el registro."));
  }, [edit, entity, fields, id]);

  const save = async () => {
    const missing = fields.find((field) => field.required && !values[field.key]?.trim());
    if (missing) { setError(`Ingresa ${missing.label.toLowerCase()}.`); return; }
    const email = values.email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo válido.");
      return;
    }
    setSaving(true); setError(null);
    try {
      if (edit && id) await updateEntity(entity, id, values);
      else await createEntity(entity, values);
      const message = entity === "tecnicos" && !edit
        ? "Invitación enviada. El técnico debe revisar su correo para configurar su cuenta."
        : "Los cambios se guardaron correctamente.";
      Alert.alert("Guardado", message, [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el registro.");
    } finally { setSaving(false); }
  };

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-4 p-4">
        <Text className="text-2xl font-bold text-neutral-900">{edit ? "Editar" : "Nuevo"} {definition.title.slice(0, -1)}</Text>
        {fields.map((field) => (
          <View key={field.key} className="gap-1">
            {entity === "ordenes" && field.key === "cliente_id" ? (
              <>
                <Text className="font-semibold text-neutral-800">Cliente</Text>
                {clients.length === 0 ? (
                  <Text className="rounded-lg bg-amber-50 p-3 text-amber-800">Crea primero un cliente.</Text>
                ) : (
                  <View className="gap-2">
                    {clients.map((client) => {
                      const selected = values.cliente_id === client.id;
                      return (
                        <Button
                          key={client.id}
                          text={`${String(client.nombre ?? "Sin nombre")}${selected ? " (seleccionado)" : ""}`}
                          onPress={() => setValues((current) => ({ ...current, cliente_id: client.id }))}
                          className={selected ? "bg-green-700" : "bg-neutral-600"}
                        />
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <>
            <Text className="font-semibold text-neutral-800">{field.label}</Text>
            <TextInput className="rounded-lg border border-neutral-300 bg-white p-3" multiline={field.multiline} maxLength={field.maxLength} value={values[field.key] ?? ""} onChangeText={(value) => setValues((current) => ({ ...current, [field.key]: value }))} />
              </>
            )}
          </View>
        ))}
        {error ? <Text className="text-red-600">{error}</Text> : null}
        <Button text={saving ? "Guardando..." : "Guardar"} onPress={() => void save()} disabled={saving} />
      </View>
    </ScrollView>
  );
}

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
      {deleteError ? <Text className="mb-2 text-center text-sm text-red-600">{deleteError}</Text> : null}
      {confirmingDelete ? (
        <View className="gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <Text className="text-sm text-red-800">El técnico quedará desactivado y no podrá usar rutas protegidas.</Text>
          <View className="flex-row gap-2">
            <Button text="Cancelar" onPress={() => setConfirmingDelete(false)} className="flex-1 bg-neutral-500" />
            <Button
              text={deleting ? "Desactivando..." : "Confirmar desactivación"}
              disabled={deleting}
              onPress={() => void remove()}
              className="flex-1 bg-red-600"
            />
          </View>
        </View>
      ) : (
        <Button text={entity === "tecnicos" ? "Desactivar" : "Eliminar"} onPress={() => setConfirmingDelete(true)} className="bg-red-600" />
      )}
    </View>
  );
}
