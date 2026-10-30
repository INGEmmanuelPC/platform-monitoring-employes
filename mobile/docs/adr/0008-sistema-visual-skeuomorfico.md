# 0008 - Sistema visual skeuomórfico

- **Estado:** aceptada
- **Fecha:** 2026-10-19 · **Revisada:** 2026-10-22

## Contexto

La interfaz se usa en campo, a menudo de pie, con guantes y bajo el sol. Se
necesita que las acciones principales, los campos y los estados sean fáciles
de distinguir sin añadir pasos al flujo.

## Decisión

Se adopta un skeuomorfismo ligero: bordes inferiores, superficies elevadas y
estados presionados evocan controles físicos, manteniendo la paleta de marca
navy y evitando adornos que reduzcan legibilidad.

**Justificación para la visión:** La elevación y los bordes táctiles hacen que
las acciones importantes se distingan al usar el celular de pie, con guantes o
bajo el sol.

Los colores, radios, sombras y tonos para los tres ejes viven en
`src/constants/design.ts`. Los componentes compartidos usan esos tokens:
`Button`, `Field`, `Select`, `TrabajoCard` y `EstadoTrabajoIndicator`.

## Contraste y accesibilidad táctil (revisión 2026-10-22)

Dos criterios del checklist del documento de visión se formalizan como tokens
para que ningún componente tenga que decidirlos por su cuenta:

- **Contraste a pleno sol.** El archivo `design.ts` lleva una tabla de
  contrastes verificados contra WCAG 2.1 AA. Los pares de texto críticos
  (`text/surface`, `textSecondary/surface`, `textSecondary/canvas`,
  `disabledText/disabled`, `brand/surface`) quedan por encima de **5 : 1**, con
  el texto principal y la marca en AAA. Si se cambia un color, hay que
  re-verificar el ratio antes de mergear.
- **Área táctil mínima.** `MIN_TOUCH_TARGET = 48` y
  `MIN_HIT_SLOP = { 8, 8, 8, 8 }` (en `design.ts`) definen el piso que debe
  cumplir todo `Pressable`. Donde el ícono o el texto sean más pequeños, se
  expande con `hitSlop` sin alterar la maquetación visible. Los componentes
  base (`Button`, `Field`, `Select`) referencian la constante en vez de
  números literales.

## Elevación cross-platform (iOS vs Android)

`RAISED_SURFACE` usa `Platform.select`: iOS respeta `shadow*` nativo y Android
usa `elevation` (más `shadowColor`, respetado desde API 28). El renderer de
Material produce una sombra más tenue que la de iOS, así que cada superficie
elevada mantiene un `borderBottomWidth: 3` o `4` que actúa como "canto físico"
y refuerza la percepción de volumen en ambas plataformas.

El criterio para probar en los dos sistemas:

1. En iOS, la sombra debe quedar bajo la superficie con un offset vertical
   visible y suavidad; nunca "fantasma" alrededor del elemento.
2. En Android, el borde inferior debe seguir leyéndose aunque la sombra sea
   más plana; el `backgroundColor` sólido es requisito para que `elevation`
   dibuje.

Si una variante requiere más o menos profundidad, se añade otra constante en
`design.ts` (`RAISED_SURFACE_SOFT`, por ejemplo) en vez de definir sombras
locales en el componente.

## Consecuencias

- Las variantes primaria y secundaria de botón tienen estados táctiles y
  deshabilitados visibles; las tarjetas y los campos comparten bordes y
  elevación.
- El indicador de cada trabajo siempre muestra por separado trabajo,
  sincronización y reporte; no mezcla sus estados.
- Nuevos componentes reutilizan los tokens (colores, radios, sombras,
  `MIN_TOUCH_TARGET`, `MIN_HIT_SLOP`) en vez de definir valores locales.
- El contraste y el tamaño táctil dejan de ser una decisión por pantalla: se
  heredan del archivo de tokens y se revisan en el PR al modificar `design.ts`.
