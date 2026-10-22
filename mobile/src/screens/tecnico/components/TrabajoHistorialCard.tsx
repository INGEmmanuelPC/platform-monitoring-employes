import { TrabajoCard } from "@/components/TrabajoCard";
import type { TrabajoLocal } from "@/src/data/types";

export function TrabajoHistorialCard({ trabajo }: { trabajo: TrabajoLocal }) {
  return <TrabajoCard trabajo={trabajo} />;
}
