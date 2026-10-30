import { Text, View } from "react-native";
import { DESIGN, RAISED_SURFACE } from "@/constants/design";
import type { ProfileRole } from "@/src/session/AuthProvider";

type Props = {
  name: string;
  email: string | undefined;
  role: ProfileRole | null;
};

const ROLE_LABEL: Record<ProfileRole, string> = {
  admin: "Administrador",
  tecnico: "Técnico",
};

export function AccountProfileCard({ name, email, role }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "·";
  const roleLabel = role ? ROLE_LABEL[role] : null;

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border p-4" style={{ backgroundColor: DESIGN.colors.surface, borderColor: DESIGN.colors.border, ...RAISED_SURFACE }}>
      <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: DESIGN.colors.brand }}>
        <Text className="text-lg font-bold" style={{ color: DESIGN.colors.surface }}>{initial}</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-lg font-semibold" style={{ color: DESIGN.colors.text }}>{name}</Text>
        {roleLabel ? (
          <Text className="text-xs font-semibold uppercase" style={{ color: DESIGN.colors.brand }}>{roleLabel}</Text>
        ) : null}
        <Text className="text-sm" style={{ color: DESIGN.colors.textSecondary }}>{email}</Text>
      </View>
    </View>
  );
}
