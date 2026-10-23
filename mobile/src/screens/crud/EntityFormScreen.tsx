import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { DESIGN } from "@/constants/design";
import { type EntityName } from "@/src/api/entities";

import { EntityFormFields } from "./components/EntityFormFields";
import { definitions } from "./entityDefinitions";
import { useEntityForm } from "./hooks/useEntityForm";

export function EntityFormScreen({ entity, edit }: { entity: EntityName; edit: boolean }) {
  const definition = definitions[entity];
  const { fields, control, clients, error, loading, isSubmitting, submit } = useEntityForm(entity, edit);

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        className="flex-1 bg-neutral-50"
        style={{ backgroundColor: DESIGN.colors.canvas }}
        contentContainerClassName="gap-4 p-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="font-display text-2xl text-neutral-900">
          {edit ? "Editar" : "Nuevo"} {definition.title.slice(0, -1)}
        </Text>

        {loading ? (
          <View className="items-center gap-3 rounded-xl bg-white p-6">
            <ActivityIndicator color={DESIGN.colors.brand} />
            <Text style={{ color: DESIGN.colors.textSecondary }}>Cargando registro...</Text>
          </View>
        ) : (
          <EntityFormFields entity={entity} fields={fields} control={control} clients={clients} />
        )}

        {error ? (
          <View className="rounded-xl border p-3" style={{ backgroundColor: DESIGN.colors.errorSurface, borderColor: DESIGN.colors.error }}>
            <Text className="text-sm leading-5" style={{ color: DESIGN.colors.error }}>{error}</Text>
          </View>
        ) : null}
        <Button
          text={isSubmitting ? "Guardando..." : "Guardar"}
          onPress={submit}
          disabled={isSubmitting || loading}
          loading={isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
