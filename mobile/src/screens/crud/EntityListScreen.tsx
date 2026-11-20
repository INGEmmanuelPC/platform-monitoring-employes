import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListSkeleton } from "@/components/Skeleton";
import { ScreenHeader } from "@/components/ScreenHeader";
import { DESIGN } from "@/constants/design";
import { type EntityName } from "@/src/api/entities";

import { EntityListItem } from "./components/EntityListItem";
import { createPaths, definitions, detailPath } from "./entityDefinitions";
import { useEntityList } from "./hooks/useEntityList";

export function EntityListScreen({ entity }: { entity: EntityName }) {
  const definition = definitions[entity];
  const router = useRouter();
  const { items, search, setSearch, loading, error, reload } = useEntityList(entity);

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: DESIGN.colors.canvas }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => { reload(); }} />}
    >
      <View className="gap-4 p-4">
        <ScreenHeader eyebrow="Módulo de administración / 02" title={definition.title} subtitle="Registros operativos y seguimiento" showBack />
        <View className="flex-row items-center justify-between">
          <Text className="font-mono text-[10px] uppercase" style={{ color: DESIGN.colors.textSecondary }}>{items.length} registros en sistema</Text>
          <Button text="Nuevo" onPress={() => router.push(createPaths[entity] as never)} />
        </View>
        <View className="border-b-2" style={{ borderBottomColor: DESIGN.colors.brand }}>
          <TextInput accessibilityLabel="Buscar registros" placeholderTextColor={DESIGN.colors.textSecondary} className="min-h-12 px-1 text-base" style={{ minHeight: 48, color: DESIGN.colors.text, backgroundColor: DESIGN.colors.inset }} placeholder="Buscar en registros..." value={search} onChangeText={setSearch} />
        </View>
        {loading ? <ListSkeleton count={3} /> : null}
        {error ? <ErrorBanner message={error} onRetry={reload} /> : null}
        {!loading && !error && items.length === 0 ? <EmptyState message="No hay registros que mostrar con los filtros actuales." /> : null}
        {!loading && !error ? items.map((item) => (
          <EntityListItem
            key={item.id}
            summary={definition.summary(item)}
            estado={String(item.estado ?? "")}
            onPress={() => router.push(detailPath(entity, item.id) as never)}
          />
        )) : null}
      </View>
    </ScrollView>
  );
}
