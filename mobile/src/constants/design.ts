import type {
  EstadoReporte,
  EstadoSync,
  EstadoTrabajo,
} from "@/constants/trabajos";

export const DESIGN = {
  colors: {
    canvas: "#F3F6F7",
    surface: "#FFFFFF",
    inset: "#F6F8F9",
    brand: "#1B4965",
    brandPressed: "#163B52",
    text: "#17313F",
    textSecondary: "#526A75",
    border: "#CAD6DC",
    borderSubtle: "#E3EBEF",
    error: "#9F2020",
    errorSurface: "#FCE9E8",
    disabled: "#DCE5E9",
    disabledText: "#445760",
  },
  radius: {
    control: 14,
    card: 20,
    pill: 999,
  },
  status: {
    trabajo: {
      ASIGNADO: { background: "#E8F1F5", foreground: "#1B4965", border: "#B9D1DC" },
      EN_CAMINO: { background: "#E4F3FA", foreground: "#0D5278", border: "#B4D8E8" },
      EN_SITIO: { background: "#FFF0CE", foreground: "#754500", border: "#E9D19A" },
      COMPLETADO: { background: "#E5F3E9", foreground: "#1E5A36", border: "#B8D8C1" },
      CERRADO: { background: "#EEF2F3", foreground: "#455A64", border: "#CDD7DB" },
    } satisfies Record<EstadoTrabajo, StatusColors>,
    sync: {
      SOLO_LOCAL: { background: "#FFF0CE", foreground: "#754500", border: "#E9D19A" },
      EN_COLA: { background: "#E4F3FA", foreground: "#0D5278", border: "#B4D8E8" },
      SINCRONIZADO: { background: "#E5F3E9", foreground: "#1E5A36", border: "#B8D8C1" },
      CONFLICTO: { background: "#FCE9E8", foreground: "#8E1B1B", border: "#E8B8B5" },
    } satisfies Record<EstadoSync, StatusColors>,
    reporte: {
      SIN_AUDIO: { background: "#EEF2F3", foreground: "#455A64", border: "#CDD7DB" },
      AUDIO_LISTO: { background: "#E4F3FA", foreground: "#0D5278", border: "#B4D8E8" },
      TRANSCRIBIENDO: { background: "#F0EBF9", foreground: "#533E7A", border: "#D2C5E8" },
      BORRADOR: { background: "#FFF0CE", foreground: "#754500", border: "#E9D19A" },
      APROBADO: { background: "#E5F3E9", foreground: "#1E5A36", border: "#B8D8C1" },
      ENTREGADO: { background: "#E8F1F5", foreground: "#1B4965", border: "#B9D1DC" },
    } satisfies Record<EstadoReporte, StatusColors>,
  },
} as const;

type StatusColors = {
  background: string;
  foreground: string;
  border: string;
};

export const RAISED_SURFACE = {
  shadowColor: "#17313F",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.14,
  shadowRadius: 4,
  elevation: 3,
} as const;
