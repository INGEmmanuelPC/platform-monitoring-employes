import { useRouter } from "expo-router";

import { TrabajoCard } from "@/components/TrabajoCard";
import type { TrabajoLocal } from "@/src/data/types";

export function TrabajoHoyCard({ trabajo, isAdmin = false }: { trabajo: TrabajoLocal; isAdmin?: boolean }) {
  const router = useRouter();

  return (
    <TrabajoCard
      trabajo={trabajo}
      onPress={() =>
        router.push(isAdmin
          ? { pathname: "/crud/ordenes/[id]", params: { id: trabajo.id } }
          : { pathname: "/trabajo/[id]", params: { id: trabajo.id } })
      }
    />
  );
}
