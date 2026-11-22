# 0011 - Cómo avanza el eje del reporte sin IA

- **Estado:** aceptada
- **Fecha:** 2026-11-22

## Contexto

El eje 3 (`EstadoReporte`) nacía para que un servidor transcribiera el audio y
una IA redactara el reporte. Sin IA (fuera del alcance del MVP) nada movía ese
eje: se quedaba en `SIN_AUDIO`, el reporte nunca llegaba a `APROBADO` y, como
`COMPLETADO → CERRADO` exige `APROBADO`, **ningún trabajo podía cerrarse**.

## Decisión

El reporte lo redacta el administrador a mano a partir de la nota del técnico:

| Transición | Quién | Cuándo |
|---|---|---|
| `SIN_AUDIO → AUDIO_LISTO` | Técnico (automático) | Guarda su nota. Funciona sin red |
| `AUDIO_LISTO → BORRADOR` | Administrador | Redacta el texto (trabajo `COMPLETADO`) |
| `BORRADOR → BORRADOR` | Administrador | Edita el borrador |
| `BORRADOR → APROBADO` | Administrador | Lo aprueba; queda registrado quién y cuándo |
| `APROBADO → ENTREGADO` | Automático | Al cerrar el trabajo (`CERRADO`), en la misma operación |

- `TRANSCRIBIENDO` no se usa mientras no haya transcripción automática.
- La regla vive en **tres capas** que dicen lo mismo: `transicionarReporte` en
  el móvil (`src/domain/estadoReporte.ts`) y en el backend
  (`backend/src/reporte-state.ts`), ambas puras y con pruebas, y triggers en
  Postgres (migración `010_eje_reporte.sql`), que son la defensa final.
- **Por qué triggers:** la política RLS de `trabajos` deja al técnico actualizar
  cualquier columna de sus órdenes desde PostgREST con su JWT. Sin un guardián
  en la base de datos, un técnico podría escribir `reporte = 'APROBADO'`.
- Nuevas columnas en `trabajos`: `reporte_texto`, `reporte_aprobado_por`,
  `reporte_aprobado_at`.
- Backend: `GET /ordenes/:id/revision` (notas, firma, conteo de fotos) y
  `PATCH /ordenes/:id/reporte` (`redactar` | `aprobar`), ambos solo admin.
  Cerrar sigue siendo `PATCH /ordenes/:id` con `estado: CERRADO`.
- Móvil: pantalla `trabajo/[id]/revision` para el administrador, con
  confirmación antes de cerrar.
- Las acciones del administrador sobre el reporte requieren red (regla del eje 3).

## Consecuencias

- Nada generado automáticamente llega al cliente sin pasar por `APROBADO`.
- «Entregado» significa que el reporte quedó aprobado y el trabajo cerrado; el
  envío real al cliente (correo o PDF) es una tarea aparte.
- Cuando exista IA, `AUDIO_LISTO → TRANSCRIBIENDO → BORRADOR` se enchufa sin
  cambiar el resto del eje.
- Pendiente: mostrar las **fotos** al administrador (hace falta una política de
  lectura en Storage para su rol) y la acción de cancelar con motivo.
