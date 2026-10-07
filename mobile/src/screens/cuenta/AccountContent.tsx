import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

import { Button } from "@/components/Button";
import { useTrabajos } from "@/src/data/use-trabajos";
import { processSyncQueue } from "@/src/data/trabajos";
import { useAuth } from "@/src/session/AuthProvider";

import { AccountProfileCard } from "./components/AccountProfileCard";
import { ManagementMenu } from "./components/ManagementMenu";
import { PendingSyncCard } from "./components/PendingSyncCard";

export function AccountContent() {
  const database = useSQLiteContext();
  const { session, signOut } = useAuth();
  const { trabajos } = useTrabajos();
  const pendientes = trabajos.filter(
    (trabajo) => trabajo.sync === "SOLO_LOCAL" || trabajo.sync === "EN_COLA",
  );
  const displayName = session?.user.user_metadata.full_name ?? "Técnico";
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const syncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const count = await processSyncQueue(database);
      setSyncMessage(count ? `${count} cambios sincronizados.` : "No hay cambios pendientes.");
    } catch {
      setSyncMessage("No se pudo sincronizar. Revisa la conexión y vuelve a intentarlo.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      <View className="gap-4 p-4">
        <AccountProfileCard name={displayName} email={session?.user.email} />
        <PendingSyncCard
          pendientes={pendientes}
          syncing={syncing}
          message={syncMessage}
          onSync={() => void syncNow()}
        />
        <ManagementMenu />
        <Button text="Cerrar sesión" onPress={signOut} />
      </View>
    </ScrollView>
  );
}
