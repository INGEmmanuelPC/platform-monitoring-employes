import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { ScreenHeader } from "@/components/ScreenHeader";
import { DESIGN } from "@/constants/design";
import { type EntityName } from "@/src/api/entities";

import { EntityFormFields } from "./components/EntityFormFields";
import { definitions } from "./entityDefinitions";
import { useEntityForm } from "./hooks/useEntityForm";

export function EntityFormScreen({ entity, edit }: { entity: EntityName; edit: boolean }) {
  const definition = definitions[entity];
  const { fields, control, clients, technicians, error, loading, isSubmitting, submit } = useEntityForm(entity, edit);

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: DESIGN.colors.canvas }}
        contentContainerClassName="gap-4 p-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          eyebrow={edit ? "Edición de registro / 03" : "Nueva orden / 03"}
          title={`${edit ? "Editar" : "Nueva"} ${definition.title.slice(0, -1)}`}
          subtitle="Completa la ficha técnica y guarda los cambios"
          showBack
        />

        {loading ? (
          <View className="items-center gap-3 rounded-xl p-6" style={{ backgroundColor: DESIGN.colors.surface }}>
            <ActivityIndicator color={DESIGN.colors.brand} />
            <Text style={{ color: DESIGN.colors.textSecondary }}>Cargando registro...</Text>
          </View>
        ) : (
          <EntityFormFields entity={entity} fields={fields} control={control} clients={clients} technicians={technicians} />
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
