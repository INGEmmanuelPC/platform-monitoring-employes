import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "react-native";

import {
  createEntity,
  getEntity,
  listEntities,
  updateEntity,
  type EntityName,
  type EntityRecord,
} from "@/src/api/entities";

import { definitions } from "../entityDefinitions";

export function useEntityForm(entity: EntityName, edit: boolean) {
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

  const submit = handleSubmit(async (values) => {
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
  });

  return { fields, control, clients, error, isSubmitting, submit };
}
