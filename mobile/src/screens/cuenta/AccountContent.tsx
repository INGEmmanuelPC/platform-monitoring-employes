import { ScrollView, View } from "react-native";

import { Button } from "@/components/Button";
import { useTrabajos } from "@/src/data/use-trabajos";
import { useAuth } from "@/src/session/AuthProvider";

import { AccountProfileCard } from "./components/AccountProfileCard";
import { ManagementMenu } from "./components/ManagementMenu";
import { PendingSyncCard } from "./components/PendingSyncCard";
import { useSyncQueue } from "./hooks/useSyncQueue";

export function AccountContent() {
  const { session, signOut } = useAuth();
  const { trabajos } = useTrabajos();
  const { syncMessage, syncing, syncNow } = useSyncQueue();
  const pendientes = trabajos.filter(
    (trabajo) => trabajo.sync === "SOLO_LOCAL" || trabajo.sync === "EN_COLA",
  );
  const displayName = session?.user.user_metadata.full_name ?? "Técnico";

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
