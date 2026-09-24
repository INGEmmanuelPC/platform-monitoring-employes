import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type RegisterOptions } from "react-hook-form";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "./Button";
import FieldInput from "./Field";
import Select from "./Select";
import {
  createEntity,
  deleteEntity,
  getEntity,
  listEntities,
  updateEntity,
  type EntityName,
  type EntityRecord,
} from "@/src/api/entities";

// FieldDef describe el campo (metadata para armar el formulario). No
// confundir con el componente `FieldInput`, que es el que de verdad se
// dibuja: uno es dato, el otro es UI.
type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mismas reglas que login/register: requerido + patrón de correo con el
// mismo mensaje. Si el campo no es obligatorio (email de un cliente), el
// patrón solo se exige cuando el usuario escribió algo.
function fieldRules(field: FieldDef): RegisterOptions<Record<string, string>> {
  const rules: RegisterOptions<Record<string, string>> = {};
  if (field.required) {
    rules.required = `Ingresa ${field.label.toLowerCase()}.`;
  }
  if (field.key === "email") {
    if (field.required) {
      rules.pattern = { value: EMAIL_PATTERN, message: "Ingresa un correo válido." };
    } else {
      rules.validate = (value) =>
        !value || EMAIL_PATTERN.test(value) || "Ingresa un correo válido.";
    }
  }
  return rules;
}

const definitions: Record<EntityName, { title: string; fields: FieldDef[]; summary: (item: EntityRecord) => string }> = {
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
          <Text className="font-display text-2xl text-neutral-900">{definition.title}</Text>
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
  // Solo al crear un técnico se pide el correo: es lo que dispara la
  // invitación de Supabase Auth. Al editar, el correo ya quedó fijado por
  // esa invitación y no se toca desde aquí.
  const fields = useMemo(
    () =>
      entity === "tecnicos" && !edit
        ? [
            definition.fields[0],
            { key: "email", label: "Correo", required: true, maxLength: 160 },
            ...definition.fields.slice(1),
          ]
        : definition.fields,
    [definition.fields, edit, entity],
  );
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<EntityRecord[]>([]);

  const defaultValues = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.key, ""])),
    [fields],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, dirtyFields },
  } = useForm<Record<string, string>>({ defaultValues });

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
      // reset rellena el formulario con lo que hay hoy en el servidor y fija
      // el punto de comparación: a partir de aquí, dirtyFields solo marca lo
      // que el usuario realmente toque, no lo que ya venía así.
      reset(next);
    }).catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el registro."));
  }, [edit, entity, fields, id, reset]);

  const onSubmit = async (values: Record<string, string>) => {
    setError(null);
    try {
      if (edit && id) {
        // Solo viaja lo que el usuario cambió: un PATCH con todo reescribiría
        // campos que nadie tocó y ensuciaría el historial de auditoría.
        const changes = Object.fromEntries(
          Object.keys(dirtyFields).map((key) => [key, values[key]]),
        );
        if (Object.keys(changes).length === 0) {
          router.back();
          return;
        }
        await updateEntity(entity, id, changes);
      } else {
        await createEntity(entity, values);
      }
      const message = entity === "tecnicos" && !edit
        ? "Invitación enviada. El técnico debe revisar su correo para configurar su cuenta."
        : "Los cambios se guardaron correctamente.";
      Alert.alert("Guardado", message, [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el registro.");
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      contentContainerClassName="gap-4 p-4"
      keyboardShouldPersistTaps="handled"
    >
      <Text className="font-display text-2xl text-neutral-900">
        {edit ? "Editar" : "Nuevo"} {definition.title.slice(0, -1)}
      </Text>

      {fields.map((field) =>
        entity === "ordenes" && field.key === "cliente_id" ? (
          <Select
            key={field.key}
            control={control}
            name="cliente_id"
            label="Cliente"
            options={clients.map((client) => ({
              value: client.id,
              label: String(client.nombre ?? "Sin nombre"),
            }))}
            empty="Crea primero un cliente."
            rules={field.required ? { required: "Selecciona un cliente." } : undefined}
          />
        ) : (
          <FieldInput
            key={field.key}
            control={control}
            name={field.key}
            label={field.label}
            multiline={field.multiline}
            numberOfLines={field.multiline ? 5 : undefined}
            textAlignVertical={field.multiline ? "top" : undefined}
            className={field.multiline ? "h-32" : undefined}
            maxLength={field.maxLength}
            autoCapitalize={field.key === "nombre" ? "words" : "none"}
            keyboardType={field.key === "email" ? "email-address" : "default"}
            autoComplete={field.key === "email" ? "email" : undefined}
            rules={fieldRules(field)}
          />
        ),
      )}

      {error ? <Text className="text-red-600">{error}</Text> : null}
      <Button
        text={isSubmitting ? "Guardando..." : "Guardar"}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      />
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
          <Text className="text-sm text-red-800">
            {entity === "tecnicos"
              ? "El técnico quedará desactivado y no podrá usar rutas protegidas."
              : "Esta acción no se puede deshacer."}
          </Text>
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
