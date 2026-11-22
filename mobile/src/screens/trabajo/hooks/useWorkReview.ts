import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import { TEXTOS_REVISION as T } from "@/constants/revision";
import { cerrarTrabajoRemoto, getRevision, guardarReporte, type RevisionTrabajo } from "@/src/api/revision";
import { vistaRevision } from "@/src/domain/estadoReporte";

type Accion = "borrador" | "aprobar" | "cerrar";

export function useWorkReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [revision, setRevision] = useState<RevisionTrabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [texto, setTexto] = useState("");
  const [working, setWorking] = useState<Accion | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingClose, setConfirmingClose] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getRevision(id);
      setRevision(data);
      // Punto de partida: lo ya redactado o, si no hay nada, las notas del técnico.
      setTexto(data.trabajo.reporte_texto?.trim() ? data.trabajo.reporte_texto : data.notas.join("\n\n"));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (accion: Accion, tarea: () => Promise<unknown>) => {
    setWorking(accion);
    setActionError(null);
    try {
      await tarea();
      setConfirmingClose(false);
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : T.errorAccion);
    } finally {
      setWorking(null);
    }
  };

  const vista = revision ? vistaRevision(revision.trabajo.reporte, revision.trabajo.estado) : null;

  return {
    actionError,
    confirmingClose,
    guardarBorrador: async () => { if (id) await run("borrador", () => guardarReporte(id, "redactar", texto)); },
    aprobar: async () => { if (id) await run("aprobar", () => guardarReporte(id, "aprobar", texto)); },
    cerrar: async () => { if (id) await run("cerrar", () => cerrarTrabajoRemoto(id)); },
    load,
    loadError,
    loading,
    revision,
    setConfirmingClose,
    setTexto,
    texto,
    vista,
    working,
  };
}
