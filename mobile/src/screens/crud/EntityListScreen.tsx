import { useRouter } from "expo-router";
import { ScrollView, Text, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { type EntityName } from "@/src/api/entities";

import { EntityListItem } from "./components/EntityListItem";
import { createPaths, definitions, detailPath } from "./entityDefinitions";
import { useEntityList } from "./hooks/useEntityList";

export function EntityListScreen({ entity }: { entity: EntityName }) {
  const definition = definitions[entity];
  const router = useRouter();
  const { items, search, setSearch, loading, error } = useEntityList(entity);

  return (
    <ScrollView className="flex-1 bg-neutral-50" keyboardShouldPersistTaps="handled">
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
          <EntityListItem
            key={item.id}
            summary={definition.summary(item)}
            estado={String(item.estado ?? "")}
            onPress={() => router.push(detailPath(entity, item.id) as never)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
