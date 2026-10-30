# Postman · Técnicos de campo

La colección cubre las rutas reales que implementa `backend/src/server.ts`: `GET /health`, `POST /auth/login`, `GET /ordenes`, `GET/PATCH /ordenes/:id` y `POST /sync`. No incluye un dominio o endpoint inventado.

## Importar

1. En Postman, importa `TecnicosCampo.postman_collection.json` y `TecnicosCampo.local.postman_environment.json`.
2. Selecciona el entorno `Cuadrilla Técnicos de campo · local (plantilla)`.
3. Configura `baseUrl` con la URL del backend que el equipo usará en la demo. La URL móvil encontrada en el entorno local de este checkout es una dirección LAN de desarrollo y no sirve como URL pública de Render. No hay una URL pública de demo versionada en el repositorio; confírmala en el dashboard de Render antes de la demostración.
4. Escribe `email` y `password` en las variables locales/secretas del entorno. No guardes valores reales en los archivos JSON ni exportes el entorno con credenciales.
5. Ejecuta **Iniciar sesión y guardar token local**. El script guarda `session.access_token` en `accessToken` en el entorno local.
6. Configura los UUID de los trabajos de prueba indicados abajo. Usa solo una instancia de desarrollo o demo autorizada.
7. Ejecuta las solicitudes en orden dentro de cada grupo. Las pruebas leen el estado antes y después; un HTTP `409` aislado no se considera suficiente.

## Datos de prueba controlados

Los UUID no están incluidos porque dependen del proyecto Supabase que se autorice para la demo. Primero confirma que el dashboard corresponde al proyecto de prueba, no a producción. En **SQL Editor** del proyecto de prueba, crea registros identificables para el técnico y conserva los UUID devueltos. Ajusta las columnas si el esquema de ese proyecto tiene cambios posteriores:

```sql
insert into public.trabajos (tecnico_id, cliente, direccion, descripcion, estado, reporte)
select p.id, 'POSTMAN · fixture', 'Sin dirección', fixture.descripcion, fixture.estado, 'SIN_AUDIO'
from public.profiles p
cross join (values
  ('POSTMAN · salto inválido', 'ASIGNADO'),
  ('POSTMAN · sin firma', 'EN_SITIO'),
  ('POSTMAN · transición válida', 'ASIGNADO'),
  ('POSTMAN · cancelación', 'ASIGNADO'),
  ('POSTMAN · lote válido', 'ASIGNADO'),
  ('POSTMAN · lote inválido', 'ASIGNADO'),
  ('POSTMAN · sync válida', 'ASIGNADO')
) as fixture(descripcion, estado)
where p.id = (select id from auth.users where email = 'CORREO_DEL_TECNICO_DE_PRUEBA');

select id, descripcion, estado
from public.trabajos
where descripcion like 'POSTMAN · %'
order by created_at desc;
```

Asigna los resultados del SELECT a `ordenIdInvalid`, `ordenIdSinFirma`, `ordenIdValida`, `ordenIdCancelar`, `ordenIdLoteValido`, `ordenIdLoteInvalido` y `ordenIdSyncValida`. La fixture `EN_SITIO` debe permanecer sin evidencia de firma; la regla de completado se prueba contra ese estado. Esta preparación directa es solo para datos descartables de una base de pruebas. No borres datos de la base remota como parte de esta colección.

## Qué demuestra

- `ASIGNADO → EN_SITIO` mediante PATCH se rechaza con `409`; una lectura posterior comprueba que sigue `ASIGNADO`.
- Completar desde `EN_SITIO` sin una evidencia `FIRMA` SVG sincronizada se rechaza con `409`; la lectura posterior comprueba que sigue `EN_SITIO`.
- `ASIGNADO → EN_CAMINO` se acepta y la lectura posterior confirma la persistencia.
- El estado desconocido se rechaza en validación (`400`).
- Cancelar requiere motivo y deja el estado terminal `CANCELADO`.
- `/sync` rechaza un lote que contiene un salto inválido. Las dos lecturas posteriores demuestran que la operación válida que venía primero tampoco se aplicó.
- Una operación válida de `/sync` persiste `EN_CAMINO`. Reenviar el mismo estado es idempotente.

La colección no puede acreditar por sí sola que la migración `006_sync_atomico_y_cancelacion.sql` esté instalada ni que el backend apunte al proyecto correcto. Antes de ejecutar `POST /sync` en una demo, el backend y Supabase de pruebas deben incluir esa migración. Las solicitudes modifican únicamente las órdenes de prueba que se indiquen en el entorno, pero el fixture de cancelación y las transiciones válidas son cambios persistentes.

## Ejecución automatizada

Si Newman está instalado:

```powershell
npx newman run postman/TecnicosCampo.postman_collection.json `
  --environment postman/TecnicosCampo.local.postman_environment.json
```

El entorno versionado no trae credenciales ni UUID. Newman solo es ejecutable después de crear un entorno privado con las variables reales y disponer de acceso a la demo. No se ha ejecutado la colección contra Supabase desde esta auditoría.

La API exige que la evidencia sincronizada sea un SVG con un trazo que tenga inicio y movimiento; la UI obtiene esos puntos de eventos táctiles. El contrato actual no incluye atestación criptográfica del dispositivo: una petición HTTP fabricada podría imitar el formato. Postman demuestra el rechazo cuando falta evidencia, y la captura táctil real se debe verificar en teléfono.
