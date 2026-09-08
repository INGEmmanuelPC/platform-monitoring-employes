import type {
  EstadoReporte,
  EstadoSync,
  EstadoTrabajo,
} from "@/constants/trabajos";

export type TrabajoLocal = {
  id: string;
  tecnico_id: string;
  cliente: string;
  direccion: string;
  descripcion: string;
  hora_programada: string | null;
  llegada_at: string | null;
  estado: EstadoTrabajo;
  sync: EstadoSync;
  reporte: EstadoReporte;
  created_at: string;
  updated_at: string;
};

export type EvidenciaLocal = {
  id: string;
  trabajo_id: string;
  tipo: "FOTO_ANTES" | "FOTO_DESPUES" | "NOTA" | "AUDIO" | "FIRMA";
  storage_path: string | null;
  contenido: string | null;
  captured_at: string;
  created_at: string;
};
