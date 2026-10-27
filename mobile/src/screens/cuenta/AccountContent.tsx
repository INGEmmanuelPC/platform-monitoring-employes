import { ScrollView, View } from "react-native";

import { Button } from "@/components/Button";
import { DESIGN } from "@/constants/design";
import { useTrabajos } from "@/src/data/use-trabajos";
import { useAuth } from "@/src/session/AuthProvider";

import { AccountProfileCard } from "./components/AccountProfileCard";
import { ManagementMenu } from "./components/ManagementMenu";
import { PendingSyncCard } from "./components/PendingSyncCard";
import { useSyncQueue } from "./hooks/useSyncQueue";

export function AccountContent() {
  const { session, profile, signOut } = useAuth();
  const { trabajos } = useTrabajos();
  const { syncMessage, syncing, syncNow } = useSyncQueue();
  const pendientes = trabajos.filter(
    (trabajo) => trabajo.sync === "SOLO_LOCAL" || trabajo.sync === "EN_COLA",
  );
  // El nombre viene primero del perfil (fuente de verdad), luego de user_metadata
  // (lo que Supabase trae en el JWT) y, si no hay ninguno, cae al email.
  const displayName =
    profile?.full_name ||
    session?.user.user_metadata.full_name ||
    session?.user.email ||
    "Sin nombre";

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }}>
      <View className="gap-4 p-4">
        <AccountProfileCard name={displayName} email={session?.user.email} role={profile?.role ?? null} />
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
