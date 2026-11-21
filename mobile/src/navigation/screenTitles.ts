export const SCREEN_TITLES = {
  "crud/clientes/index": "Clientes",
  "crud/clientes/nuevo": "Nuevo cliente",
  "crud/clientes/[id]": "Editar cliente",
  "crud/tecnicos/index": "Técnicos",
  "crud/tecnicos/nuevo": "Nuevo técnico",
  "crud/tecnicos/[id]": "Editar técnico",
  "crud/ordenes/index": "Órdenes de trabajo",
  "crud/ordenes/nuevo": "Nueva orden de trabajo",
  "crud/ordenes/[id]": "Editar orden de trabajo",
} as const;

export type ScreenTitleRoute = keyof typeof SCREEN_TITLES;
