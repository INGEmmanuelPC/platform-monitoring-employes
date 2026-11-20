# ADR 0010: Headers operativos y preferencias de apariencia

## Contexto

Las pantallas CRUD no tenían un encabezado visual propio porque el stack raíz
oculta los headers de Expo Router. El stack de trabajo usaba títulos genéricos
que no expresaban el contexto de una orden de servicio. Además, la aplicación
seguía únicamente el tema del sistema y no permitía conservar una preferencia
del usuario.

## Decisión

- Se crea `ScreenHeader`, un encabezado reutilizable con regreso accesible,
  etiqueta técnica, título y subtítulo truncable.
- Las pantallas CRUD usan el encabezado dentro de su composición para evitar
  breadcrumbs largos y conservar el control de regreso.
- `TrabajoStack` mantiene el header nativo, pero usa títulos operativos,
  superficie del sistema visual y el texto de regreso `Atrás`.
- `AppearanceProvider` centraliza los modos `light` y `dark`.
- La preferencia se guarda en `localStorage` para web y `expo-secure-store`
  para Android/iOS. Si no existe preferencia, se usa el tema del sistema.
- `AppearanceControl` expone el selector en Cuenta y actualiza tokens de
  superficies, texto, estados y barra de estado.

## Consecuencias

Los headers mantienen la navegación existente, pero eliminan rutas visuales
redundantes. La preferencia se conserva entre sesiones. El tema se aplica a
los tokens compartidos; las pantallas que incorporen colores literales en el
futuro deben migrarlos a `DESIGN`.
