import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import { guardarNota } from "@/src/data/trabajos";
import { useAuth } from "@/src/session/AuthProvider";

export function useWorkNote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const database = useSQLiteContext();
  const { profile, session } = useAuth();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saveNote = async () => {
    const content = note.trim();
    if (!id || !content || !session?.user.id) {
      setError("Escribe una nota antes de guardar.");
      return;
    }

    setError(null);
    try {
      await guardarNota(database, id, content, session.user.id, profile?.role ?? "tecnico");
      router.replace({ pathname: "/trabajo/[id]/firma", params: { id } });
    } catch {
      setError("No se pudo guardar la nota en el dispositivo.");
    }
  };

  return { error, note, saveNote, setNote };
}
