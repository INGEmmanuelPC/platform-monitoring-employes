# 0003 - Limpieza de estructura del proyecto

- **Estado:** aceptada
- **Fecha:** 2026-09-07

## Contexto

El proyecto conservaba componentes, assets y un script del template inicial de
Expo que no tenían referencias en la aplicación de técnicos. Mantenerlos hacía
más difícil distinguir código activo de ejemplos descartados.

## Decisión

Se eliminan los componentes `external-link`, `hello-wave`, `parallax-scroll-view`,
`themed-text`, `themed-view`, `collapsible`, el hook `use-theme-color`, los
assets React de ejemplo y `scripts/reset-project.js`.

Se conservan las carpetas actuales porque representan límites funcionales claros:

- `app/`: rutas Expo Router.
- `src/api/`: integración remota y autenticación.
- `src/data/`: SQLite, repositorios y datos locales.
- `src/session/`: sesión y protección de rutas.
- `components/`: UI reutilizable de la app.
- `constants/`: contratos de dominio y tema compartido.
- `hooks/`: hooks globales aún utilizados.
- `docs/`: decisiones y documentación operativa.

No se introduce una capa adicional de carpetas sin una responsabilidad real.

## Consecuencias

- La estructura contiene únicamente código y assets actualmente utilizados o
  reservados por decisiones documentadas.
- Se mantiene la navegación por archivos y no se rompen los imports existentes.
- Cualquier nueva capa deberá justificar su responsabilidad en código o en un
  ADR antes de añadirse.
