import { useRouter } from "expo-router";
import { ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ListSkeleton } from "@/components/Skeleton";
import { type EntityName } from "@/src/api/entities";

import { EntityListItem } from "./components/EntityListItem";
import { createPaths, definitions, detailPath } from "./entityDefinitions";
import { useEntityList } from "./hooks/useEntityList";

export function EntityListScreen({ entity }: { entity: EntityName }) {
  const definition = definitions[entity];
  const router = useRouter();
  const { items, search, setSearch, loading, error, reload } = useEntityList(entity);

  return (
    <ScrollView className="flex-1 bg-neutral-50" keyboardShouldPersistTaps="handled">
      <View className="gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-2xl text-neutral-900">{definition.title}</Text>
          <Button text="Nuevo" onPress={() => router.push(createPaths[entity] as never)} />
        </View>
        <TextInput accessibilityLabel="Buscar registros" placeholderTextColor="#64748b" className="min-h-12 rounded-xl border border-neutral-300 bg-white px-3 text-base text-neutral-900" placeholder="Buscar" value={search} onChangeText={setSearch} />
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
