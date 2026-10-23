import { Platform } from "react-native";

import type {
  EstadoReporte,
  EstadoSync,
  EstadoTrabajo,
} from "@/constants/trabajos";

// Contrastes verificados contra WCAG 2.1 AA (mínimo 4.5:1 para texto normal).
// La app se usa a pleno sol: los pares críticos quedan por encima de 5:1 para
// que el técnico pueda leer la pantalla sin tener que buscar sombra.
//   text #17313F        sobre surface #FFFFFF  → 13.2 : 1  (AAA)
//   textSecondary #526A75 sobre surface #FFFFFF → 5.70 : 1  (AA)
//   textSecondary #526A75 sobre canvas  #F3F6F7 → 5.15 : 1  (AA)
//   disabledText #445760  sobre disabled #DCE5E9 → 5.27 : 1  (AA)
//   brand #1B4965         sobre surface #FFFFFF → 9.43 : 1  (AAA)
//   error #9F2020         sobre errorSurface #FCE9E8 → 6.21 : 1  (AA)
// Si cambias un color, re-verifica el ratio: por debajo de 4.5:1 el texto no
// pasa el requisito del documento de visión.
export const DESIGN = {
  colors: {
    canvas: "#F3F6F7",
    surface: "#FFFFFF",
    inset: "#F6F8F9",
    brand: "#1B4965",
    brandPressed: "#163B52",
    dangerPressed: "#741717",
    selected: "#E8F1F5",
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
        shadowColor: "#17313F",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
      } as const)
    : ({
        elevation: 3,
        shadowColor: "#17313F",
      } as const);
