import { Platform } from "react-native";

import type {
  EstadoReporte,
  EstadoSync,
  EstadoTrabajo,
} from "@/constants/trabajos";

// Industrial dark palette: graphite surfaces preserve hierarchy in the field,
// while blue and amber accents make actions and operational states scannable.
// Keep text and status pairs high-contrast when changing these tokens.
export const DESIGN = {
  colors: {
    canvas: "#0B1117",
    surface: "#131D27",
    inset: "#0F1821",
    brand: "#4BA3FF",
    brandPressed: "#2F80D1",
    dangerPressed: "#B53A3A",
    selected: "#17324B",
    text: "#F2F6F8",
    textSecondary: "#A7B4BF",
    border: "#2A3A48",
    borderSubtle: "#20303D",
    error: "#FF7B72",
    errorSurface: "#3A1F22",
    disabled: "#2A343D",
    disabledText: "#8D9AA4",
    backdrop: "rgba(3, 8, 13, 0.72)",
  },
  radius: {
    control: 10,
    card: 14,
    pill: 999,
  },
  status: {
    trabajo: {
      ASIGNADO: { background: "#17324B", foreground: "#8BC5FF", border: "#2B5B82" },
      EN_CAMINO: { background: "#12384A", foreground: "#7DD3FC", border: "#26627A" },
      EN_SITIO: { background: "#46351A", foreground: "#FFD166", border: "#80652A" },
      COMPLETADO: { background: "#163B2A", foreground: "#7EE2A8", border: "#2C6B4A" },
      CERRADO: { background: "#26313A", foreground: "#C6D0D8", border: "#465661" },
      CANCELADO: { background: "#3A1F22", foreground: "#FF918A", border: "#74403E" },
    } satisfies Record<EstadoTrabajo, StatusColors>,
    sync: {
      SOLO_LOCAL: { background: "#46351A", foreground: "#FFD166", border: "#80652A" },
      EN_COLA: { background: "#12384A", foreground: "#7DD3FC", border: "#26627A" },
      SINCRONIZADO: { background: "#163B2A", foreground: "#7EE2A8", border: "#2C6B4A" },
      CONFLICTO: { background: "#3A1F22", foreground: "#FF918A", border: "#74403E" },
    } satisfies Record<EstadoSync, StatusColors>,
    reporte: {
      SIN_AUDIO: { background: "#26313A", foreground: "#C6D0D8", border: "#465661" },
      AUDIO_LISTO: { background: "#12384A", foreground: "#7DD3FC", border: "#26627A" },
      TRANSCRIBIENDO: { background: "#302844", foreground: "#C7B4FF", border: "#5B4B7D" },
      BORRADOR: { background: "#46351A", foreground: "#FFD166", border: "#80652A" },
      APROBADO: { background: "#163B2A", foreground: "#7EE2A8", border: "#2C6B4A" },
      ENTREGADO: { background: "#17324B", foreground: "#8BC5FF", border: "#2B5B82" },
    } satisfies Record<EstadoReporte, StatusColors>,
  },
} as const;

export const LIGHT_COLORS = {
  canvas: "#E9EEF1",
  surface: "#F8FAFB",
  inset: "#DDE6EB",
  brand: "#1B4965",
  brandPressed: "#12364B",
  dangerPressed: "#741717",
  selected: "#DCEAF3",
  text: "#152630",
  textSecondary: "#526A75",
  border: "#B5C5CE",
  borderSubtle: "#D1DDE2",
  error: "#9F2020",
  errorSurface: "#FCE9E8",
  disabled: "#D4DEE3",
  disabledText: "#445760",
  backdrop: "rgba(15, 32, 42, 0.55)",
} as const;

const LIGHT_STATUS = {
  trabajo: {
    ASIGNADO: { background: "#DCEAF3", foreground: "#1B4965", border: "#AFC7D5" },
    EN_CAMINO: { background: "#D9EEF7", foreground: "#14516E", border: "#A8CFDF" },
    EN_SITIO: { background: "#FFF0CE", foreground: "#754500", border: "#E9D19A" },
    COMPLETADO: { background: "#DCEFE2", foreground: "#1E5A36", border: "#B5D6BF" },
    CERRADO: { background: "#E4EAED", foreground: "#455A64", border: "#C5D0D5" },
    CANCELADO: { background: "#FCE9E8", foreground: "#8E1B1B", border: "#E8B8B5" },
  },
  sync: {
    SOLO_LOCAL: { background: "#FFF0CE", foreground: "#754500", border: "#E9D19A" },
    EN_COLA: { background: "#D9EEF7", foreground: "#14516E", border: "#A8CFDF" },
    SINCRONIZADO: { background: "#DCEFE2", foreground: "#1E5A36", border: "#B5D6BF" },
    CONFLICTO: { background: "#FCE9E8", foreground: "#8E1B1B", border: "#E8B8B5" },
  },
  reporte: {
    SIN_AUDIO: { background: "#E4EAED", foreground: "#455A64", border: "#C5D0D5" },
    AUDIO_LISTO: { background: "#D9EEF7", foreground: "#14516E", border: "#A8CFDF" },
    TRANSCRIBIENDO: { background: "#EEE8F8", foreground: "#533E7A", border: "#D2C5E8" },
    BORRADOR: { background: "#FFF0CE", foreground: "#754500", border: "#E9D19A" },
    APROBADO: { background: "#DCEFE2", foreground: "#1E5A36", border: "#B5D6BF" },
    ENTREGADO: { background: "#DCEAF3", foreground: "#1B4965", border: "#AFC7D5" },
  },
} as const;

const DARK_STATUS = {
  trabajo: {
    ASIGNADO: { background: "#17324B", foreground: "#8BC5FF", border: "#2B5B82" },
    EN_CAMINO: { background: "#12384A", foreground: "#7DD3FC", border: "#26627A" },
    EN_SITIO: { background: "#46351A", foreground: "#FFD166", border: "#80652A" },
    COMPLETADO: { background: "#163B2A", foreground: "#7EE2A8", border: "#2C6B4A" },
    CERRADO: { background: "#26313A", foreground: "#C6D0D8", border: "#465661" },
    CANCELADO: { background: "#3A1F22", foreground: "#FF918A", border: "#74403E" },
  },
  sync: {
    SOLO_LOCAL: { background: "#46351A", foreground: "#FFD166", border: "#80652A" },
    EN_COLA: { background: "#12384A", foreground: "#7DD3FC", border: "#26627A" },
    SINCRONIZADO: { background: "#163B2A", foreground: "#7EE2A8", border: "#2C6B4A" },
    CONFLICTO: { background: "#3A1F22", foreground: "#FF918A", border: "#74403E" },
  },
  reporte: {
    SIN_AUDIO: { background: "#26313A", foreground: "#C6D0D8", border: "#465661" },
    AUDIO_LISTO: { background: "#12384A", foreground: "#7DD3FC", border: "#26627A" },
    TRANSCRIBIENDO: { background: "#302844", foreground: "#C7B4FF", border: "#5B4B7D" },
    BORRADOR: { background: "#46351A", foreground: "#FFD166", border: "#80652A" },
    APROBADO: { background: "#163B2A", foreground: "#7EE2A8", border: "#2C6B4A" },
    ENTREGADO: { background: "#17324B", foreground: "#8BC5FF", border: "#2B5B82" },
  },
} as const;

export function applyAppearance(mode: "light" | "dark") {
  const colors = mode === "dark" ? {
    canvas: "#0B1117", surface: "#131D27", inset: "#0F1821", brand: "#4BA3FF",
    brandPressed: "#2F80D1", dangerPressed: "#B53A3A", selected: "#17324B",
    text: "#F2F6F8", textSecondary: "#A7B4BF", border: "#2A3A48",
    borderSubtle: "#20303D", error: "#FF7B72", errorSurface: "#3A1F22",
    disabled: "#2A343D", disabledText: "#8D9AA4", backdrop: "rgba(3, 8, 13, 0.72)",
  } : LIGHT_COLORS;
  Object.assign(DESIGN.colors, colors);
  const status = mode === "light" ? LIGHT_STATUS : DARK_STATUS;
  Object.assign(DESIGN.status.trabajo, status.trabajo);
  Object.assign(DESIGN.status.sync, status.sync);
  Object.assign(DESIGN.status.reporte, status.reporte);
}

type StatusColors = {
  background: string;
  foreground: string;
  border: string;
};

// Área táctil mínima (WCAG 2.5.5 AAA · Material Design · HIG de Apple).
// Toda zona pulsable debe medir al menos 48 × 48 pt. Donde el ícono o el
// contenido sea más pequeño, se expande el área con `hitSlop` sin tocar la
// maquetación visible.
export const MIN_TOUCH_TARGET = 48;
export const MIN_HIT_SLOP = { top: 8, right: 8, bottom: 8, left: 8 } as const;

// Elevación skeumórfica igualada entre iOS y Android.
//
// iOS usa `shadow*` nativamente; Android usa `elevation` (Material drop
// shadow) y, desde API 28, también respeta `shadowColor`. Mantener los dos
// bloques en el mismo archivo evita que cada componente adivine qué prop
// aplica en cada plataforma y asegura que el "canto" físico se vea igual en
// una Samsung que en un iPhone.
//
// En Android, `elevation` solo se dibuja si el componente tiene
// `backgroundColor` sólido (todos los componentes elevados ya lo tienen) y la
// percepción visual puede ser más tenue; por eso cada tarjeta refuerza la
// elevación con `borderBottomWidth: 3` o `4` como borde inferior "pulido".
export const RAISED_SURFACE =
  Platform.OS === "ios"
    ? ({
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.34,
        shadowRadius: 4,
      } as const)
    : ({
        elevation: 3,
        shadowColor: "#000000",
      } as const);
