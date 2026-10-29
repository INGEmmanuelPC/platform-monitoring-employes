import { ScrollView, Text, View } from "react-native";

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
  const { trabajos, refresh } = useTrabajos();
  const { syncMessage, syncing, syncNow } = useSyncQueue();
  const isTechnician = profile?.role === "tecnico";
  const pendientes = trabajos.filter(
    (trabajo) => trabajo.sync === "SOLO_LOCAL" || trabajo.sync === "EN_COLA" || trabajo.sync === "CONFLICTO",
  );
  // El nombre viene primero del perfil (fuente de verdad), luego de user_metadata
  // (lo que Supabase trae en el JWT) y, si no hay ninguno, cae al email.
  const displayName =
    profile?.full_name ||
    session?.user.user_metadata.full_name ||
    session?.user.email ||
    "Sin nombre";
  const syncAndRefresh = async () => {
    if (await syncNow()) refresh();
  };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: DESIGN.colors.canvas }}>
      <View className="gap-4 p-4">
        <AccountProfileCard name={displayName} email={session?.user.email} role={profile?.role ?? null} />
        {isTechnician ? (
          <PendingSyncCard
            pendientes={pendientes}
            syncing={syncing}
            message={syncMessage}
            onSync={() => void syncAndRefresh()}
          />
        ) : pendientes.length > 0 ? (
          <View className="rounded-xl border p-4" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border }}>
            <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>
              Hay cambios locales pendientes en este dispositivo. Administración sincroniza solo sus propios cambios; los pendientes creados por un técnico requieren la cuenta de ese técnico.
            </Text>
            {profile?.role === "admin" ? (
              <View className="mt-3">
                <Button text={syncing ? "Sincronizando..." : "Sincronizar mis cambios"} onPress={() => void syncAndRefresh()} disabled={syncing} />
                {syncMessage ? <Text className="mt-2 text-sm" style={{ color: DESIGN.colors.textSecondary }}>{syncMessage}</Text> : null}
              </View>
            ) : null}
          </View>
        ) : null}
        <ManagementMenu />
        <Button text="Cerrar sesión" onPress={signOut} />
      </View>
    </ScrollView>
  );
}
