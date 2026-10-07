import { KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";

import { Button } from "@/components/Button";
import { type EntityName } from "@/src/api/entities";

import { EntityFormFields } from "./components/EntityFormFields";
import { definitions } from "./entityDefinitions";
import { useEntityForm } from "./hooks/useEntityForm";

export function EntityFormScreen({ entity, edit }: { entity: EntityName; edit: boolean }) {
  const definition = definitions[entity];
  const { fields, control, clients, error, isSubmitting, submit } = useEntityForm(entity, edit);

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        className="flex-1 bg-neutral-50"
        contentContainerClassName="gap-4 p-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-display text-2xl text-neutral-900">
          {edit ? "Editar" : "Nuevo"} {definition.title.slice(0, -1)}
        </Text>

        <EntityFormFields entity={entity} fields={fields} control={control} clients={clients} />

        {error ? <Text className="text-red-600">{error}</Text> : null}
        <Button
          text={isSubmitting ? "Guardando..." : "Guardar"}
          onPress={submit}
          disabled={isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
