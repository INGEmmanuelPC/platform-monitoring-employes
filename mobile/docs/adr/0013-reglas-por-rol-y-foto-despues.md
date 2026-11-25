# 0013 - Reglas del servidor por rol y foto «después» obligatoria

- **Estado:** aceptada
- **Fecha:** 2026-11-24

## Contexto

El documento de visión dice que el técnico no puede enviar `CERRADO`, `CANCELADO`
ni `APROBADO`, y que completar un trabajo exige al menos una foto «después».
El servidor no lo cumplía:

- `/sync`, `PATCH /ordenes/:id` y el RPC `sync_trabajos` aplicaban la tabla de
  transiciones pero **no distinguían roles**: un técnico dueño de una orden podía
  cancelarla y, con el reporte aprobado, cerrarla.
- La guarda de completar aceptaba **cualquier** foto (`FOTO_ANTES` o
  `FOTO_DESPUES`) en el dominio móvil, el backend y el SQL.
- La política RLS de `trabajos` deja al técnico actualizar sus órdenes
  directamente desde PostgREST con su JWT, así que una regla solo en Express no
  alcanza.

## Decisión

La misma regla en **tres capas**, igual que el eje del reporte (ADR 0011):

| Rol | Transiciones permitidas |
|---|---|
| Técnico | `ASIGNADO → EN_CAMINO → EN_SITIO → COMPLETADO` |
| Administrador | Todo lo válido, incluido cancelar, cerrar y el flujo de campo (migración 008) |

- **Móvil** (`src/domain/estadoTrabajo.ts`): `transicionarTrabajo` recibe `rol`;
  cancelar y cerrar lanzan error para el técnico. `tieneFoto` pasa a
  `tieneFotoDespues` y `finalizarTrabajo` consulta solo `FOTO_DESPUES`.
- **Backend** (`backend/src/trabajo-state.ts`): `puedeTransicionarPorRol`, función
  pura. `/sync` simula el avance de cada trabajo dentro del lote (varias
  operaciones pueden encadenarse, por ejemplo `EN_CAMINO` y `EN_SITIO`) y, si
  alguna transición válida no le corresponde al rol, **rechaza todo el lote con
  403** antes de llamar al RPC. `PATCH /ordenes/:id` aplica la misma regla.
  Completar exige `FOTO_DESPUES`.
- **Postgres** (`011_reglas_servidor.sql`), como defensa final para quien se salte
  Express:
  - `validar_rol_transicion_trabajo`: errcode `42501`.
  - `exigir_foto_despues_al_completar`: errcode `23514`.
  - Sin JWT (SQL Editor o `service_role`) no se aplica la regla de rol, porque no
    hay un usuario al que aplicarla; la foto «después» sí se exige siempre.
- Una transición **inválida para todos** (por ejemplo `ASIGNADO → EN_SITIO`) sigue
  rechazándose con 409 por su propia regla; el rol no la vuelve válida.

## Por qué 403 y no 409

409 significa «conflicto con el estado actual» y la app lo marca como `CONFLICTO`.
Un técnico que intenta cancelar no tiene un conflicto: no está autorizado. La app
legítima nunca envía esa operación (no hay botón de cancelar para el técnico), así
que un 403 solo lo provoca alguien manipulando las peticiones.

## Consecuencias

- Se cumple lo que decía el documento de visión; el administrador conserva la
  capacidad de ejecutar trabajos desde Hoy.
- Si un técnico lograra encolar una operación no permitida, la cola la reintentaría
  con backoff (ADR 0012) sin resolverse. Es un caso de manipulación, no del flujo
  normal.
- Sigue pendiente restringir **qué columnas** puede editar el técnico desde
  PostgREST (cliente, dirección, descripción), y la pantalla de admin para
  cancelar con motivo.
