import { useRouter } from "expo-router";

import { TrabajoCard } from "@/components/TrabajoCard";
import type { TrabajoLocal } from "@/src/data/types";

export function TrabajoHoyCard({ trabajo }: { trabajo: TrabajoLocal }) {
  const router = useRouter();

  return (
    <TrabajoCard
      trabajo={trabajo}
      onPress={() => router.push({ pathname: "/trabajo/[id]", params: { id: trabajo.id } })}
    />
  );
}
