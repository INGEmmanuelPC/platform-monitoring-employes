# 0010 - Consentimiento de ubicación (Ley 1581 de 2012)

- **Estado:** aceptada
- **Fecha:** 2026-11-22

## Contexto

El rastreo GPS (checklist, Fase 2) recoge la ubicación del técnico mientras un
trabajo está «en camino». La Ley 1581 de 2012 exige una autorización previa,
expresa e informada. Faltaba decidir **dónde** y **cuándo** pedirla.

## Decisión

- **Una vez por cuenta, justo después del primer inicio de sesión del técnico**,
  antes de entrar a la app. No va antes del login ni del registro: el
  consentimiento es *por cuenta* (antes de iniciar sesión no se sabe de quién
  es) y solo aplica al técnico, que es a quien se rastrea. Mezclarlo con el
  registro tampoco lo haría «específico».
- El `RouteGuard` redirige a `/ubicacion/consentimiento` mientras la respuesta
  esté pendiente (`src/domain/consentimiento.ts`, función pura con pruebas).
- La respuesta (`aceptado` o `rechazado`, con fecha y versión del texto) se
  guarda en `expo-secure-store` con una clave por cuenta.
- **Responder «Ahora no» nunca bloquea al técnico** (regla 1 y checklist: «si
  niega el permiso, el trabajo avanza igual»). Solo no habrá recorrido.
- **Revocar es tan fácil como aceptar:** la pestaña Cuenta muestra el estado y
  permite revocar o volver a autorizar.
- Si cambia lo que se recoge o por cuánto tiempo, se sube
  `VERSION_CONSENTIMIENTO` y se vuelve a preguntar a todas las cuentas.
- Un valor ausente, dañado o de una versión vieja cuenta como «pendiente»:
  ante la duda se pregunta, nunca se asume un sí.
- El rastreo futuro debe llamar a `puedeRastrearUbicacion(estado)` antes de
  pedir el permiso del sistema.

## Alternativas descartadas

- **Pedirlo al tocar «Voy en camino» la primera vez:** más contextual, pero
  interrumpe el camino feliz (regla 4) justo cuando el técnico tiene prisa.
- **Pedirlo antes del login o en el registro:** no es por cuenta y no aplica al
  administrador.

## Consecuencias

- Hoy solo registra la decisión: todavía no existe el rastreo GPS.
- La prueba de la autorización queda **solo en el teléfono**. Si hace falta
  demostrarla ante terceros, habría que guardar también un registro en el
  servidor (pendiente).
- El texto del consentimiento (`src/constants/consentimiento.ts`) debería
  revisarlo alguien con criterio legal antes de un uso real.
