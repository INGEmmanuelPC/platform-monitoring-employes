# 0008 - Sistema visual skeuomórfico

- **Estado:** aceptada
- **Fecha:** 2026-10-19

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

## Consecuencias

- Las variantes primaria y secundaria de botón tienen estados táctiles y
  deshabilitados visibles; las tarjetas y los campos comparten bordes y
  elevación.
- El indicador de cada trabajo siempre muestra por separado trabajo,
  sincronización y reporte; no mezcla sus estados.
- Nuevos componentes reutilizan los tokens en vez de definir colores, radios o
  sombras locales.
