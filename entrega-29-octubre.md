# Entrega práctica · Jueves 29 de octubre de 2026

**Contexto:** la Fase 1 de todos los checklists va del 20 oct al 2 nov. El jueves 29 es el último día de clase de esa fase, así que la entrega es **el núcleo de la Fase 1 funcionando + la decisión de diseño aplicada a los componentes base**. Lo que quede de la Fase 1 se cierra el lunes 2 de noviembre.

**Formato común para todos los grupos (máx. 7 min por grupo):**

1. **Demo en vivo** en un celular (APK), contra el backend real, del flujo indicado abajo.
2. **Diseño:** estilo elegido + una línea de justificación en el documento de visión, tokens centralizados (`tailwind.config.js` o archivo de constantes) y al menos 3 componentes base ya en ese estilo.
3. **Evidencia en el repositorio:** commits de la semana y la sección de "fuera del alcance" escrita en el documento.
4. **Una regla de negocio demostrada en el servidor** (no en la app): mostrar el error que devuelve el backend cuando se intenta algo inválido.

---

## Resumen

| # | Grupo | Lo que tiene que funcionar el jueves 29 | Regla de servidor que deben mostrar |
|---|-------|------------------------------------------|-------------------------------------|
| 1 | Técnicos de campo | Máquina de estados + "Voy en camino" + firma real | Transición inválida rechazada (pruebas) |
| 2 | NFHunter | Development build con lectura NFC (o QR) → escaneo | Escaneo a más de 50 m rechazado |
| 3 | Hibirio | Inventario real + ropero con filtros + crear atuendo | Atuendo privado no visible para otro usuario |
| 4 | Parche Viajero | Negocio pendiente → admin lo aprueba → aparece en el mapa | Solo los aprobados salen en el mapa |
| 5 | Agro Physis | Validación de dueño en cultivos y plagas | Cuenta B no puede ver ni borrar lo de A |
| 6 | MedAgenda | Navegación por rol (paciente, médico, admin) | Un rol no accede a rutas/endpoints de otro |
| 7 | Percha | Sesión persistente + foto de prenda en Cloudinary | La URL (no la imagen) se guarda en MongoDB |
| 8 | Presteza | "Llevar a la mesa" crea el pedido real | El total lo recalcula el backend |
| 9 | TamaGit | Migración de slots + equipar/desequipar | Solo una prenda por slot |
| 10 | ZoneUp | Control de cupos atómico + job de vencimiento | Dos celulares, último cupo: solo uno gana |
| 11 | OFICIAR | Backend en la nube + `SolicitudServicio` creada desde la app | Cliente no puede marcar `EN_CURSO` |

---

## 1. App para técnicos de campo

**Equipo:** Santiago Acosta, Emmanuel Peñuela, Jerónimo López

### Avance de implementación · 26 de octubre de 2026

- [x] Máquina pura de transiciones con guardas para viaje, llegada, firma, aprobación y cancelación.
- [x] Los cambios locales de estado validan la transición y escriben el estado y la cola dentro de una transacción SQLite.
- [x] `CANCELADO` está en el tipo móvil, el CHECK inicial y la migración incremental de Supabase, y el enum Zod del backend.
- [x] Se añadió «Voy en camino» como dependencia necesaria para que la llegada solo ocurra desde `EN_CAMINO`.
- [x] Runner `node:test` configurado; `npm test` pasa transiciones y guardas de la máquina.
- [ ] Pendiente: prueba del flujo offline y de estados en un dispositivo.
- [ ] Pendiente: aplicar `004_estado_cancelado.sql` en el proyecto Supabase de demostración.
- [x] El backend rechaza saltos de estado inválidos en `/sync` y `PATCH /ordenes/:id`; hay pruebas automatizadas de la regla del servidor.
- [ ] Pendiente: demostrar el rechazo con una petición al backend conectado a Supabase durante la demo.

Los tres primeros puntos del checklist técnico se eligieron por ser la base del flujo. El botón de salida y la guarda de llegada se añadieron para que la máquina no bloqueara el flujo que ya existía. La revisión de código no sustituye una prueba en Expo Go.

**Entregable del jueves 29**
- [x] `src/domain/estadoTrabajo.ts` con `transicionarTrabajo(estado, accion, contexto)` y sus guardas.
- [x] `src/data/trabajos.ts` llama a la máquina **antes** de escribir, dentro de la misma `withTransactionAsync`.
- [x] Estado `CANCELADO` agregado al tipo, al CHECK de Supabase y al enum de Zod.
- [x] Botón "Voy en camino"; `marcarLlegada()` falla si el trabajo no está `EN_CAMINO`.
- [x] Lienzo de firma real guardado en SQLite (deja de ser placeholder); falta la verificación en dispositivo.
- [x] Runner de pruebas configurado y corriendo las transiciones válidas e inválidas (`npm test`).
- [x] Diseño: Skeuomorfismo aplicado en botón, tarjeta de trabajo e indicador de estado.

**Demo:** trabajo `ASIGNADO` → voy en camino → llegada → foto → firma con el dedo → `COMPLETADO`. Luego intentar completar sin firma y que falle.

**Puede quedar para el 2 nov:** estilo aplicado a todas las pantallas del flujo.

---



---

# Conceptos prácticos para explicar en clase

Estos son los conceptos que se repiten en varias entregas del jueves. Si los entienden, la Fase 1 sale sola.

## 1. La regla vive en el servidor, la app solo la refleja

Aparece en **todos** los grupos. La app se puede modificar, reempaquetar o saltar con Postman: cualquier validación que solo esté en la app no existe.

- La app **envía la intención** ("quiero aceptar esta solicitud").
- El servidor **decide** y responde el nuevo estado o un error.
- La app **muestra** lo que el servidor dijo.

```ts
// App: no calcula, no decide
const res = await api.post(`/pedidos`, { items });   // sin "total"
if (!res.ok) return mostrarError(res.data.message);  // mensaje del servidor
```

Ejercicio rápido en clase: abrir Postman y mandar `total: 1` o `role: "admin"` a sus APIs. Si pasa, hay un bug.

**Grupos:** Presteza (total), Parche Viajero (registro admin), ZoneUp (cupos), OFICIAR (transiciones), MedAgenda (roles).

## 2. Autenticación vs. autorización (y el IDOR)

- **Autenticación:** ¿quién eres? (el JWT es válido).
- **Autorización:** ¿puedes hacer **esto** sobre **este** recurso?

El error más común: validar el token y olvidar el dueño. Eso se llama **IDOR** (Insecure Direct Object Reference): cambio el id en la URL y veo datos de otro.

```ts
// Mal: cualquiera autenticado borra cualquier cultivo
await repo.delete(id);

// Bien: el filtro incluye al dueño; si no es suyo, 404
const cultivo = await repo.findOne({ where: { id, finca: { usuario: { id: userId } } } });
if (!cultivo) throw new NotFoundException();
```

Por qué 404 y no 403: no revelar que el recurso existe.

**Grupos:** Agro Physis (directo), Hibirio (privacidad), OFICIAR (chat solo de cliente y officer), MedAgenda.

## 3. Máquina de estados

Cuando una entidad tiene un ciclo de vida (trabajo, cita, pedido, solicitud, reserva), se modela como **estados + transiciones permitidas + guardas**. Ventajas: un solo lugar con las reglas, imposible saltarse pasos, fácil de probar.

```ts
const TRANSICIONES = {
  PENDIENTE: { aceptar: 'ACEPTADA', cancelar: 'CANCELADA' },
  ACEPTADA:  { iniciar: 'EN_CURSO', cancelar: 'CANCELADA' },
  EN_CURSO:  { finalizar: 'FINALIZADA' },
} as const;

export function transicionar(estado, accion, ctx) {
  const siguiente = TRANSICIONES[estado]?.[accion];
  if (!siguiente) throw new Error(`No se puede ${accion} desde ${estado}`);
  if (accion === 'iniciar' && ctx.rol !== 'OFFICER') throw new Error('Solo el officer inicia');
  return siguiente;
}
```

Es una **función pura**: no toca BD ni red, recibe datos y devuelve datos. Por eso se prueba con 10 líneas.

**Grupos:** Técnicos de campo, OFICIAR, MedAgenda (Fase 2), ZoneUp (estados de reserva).

## 4. Probar funciones puras

No hace falta probar pantallas para empezar. Lo que más vale probar es la lógica de negocio pura.

```ts
test('no se puede llegar sin estar en camino', () => {
  expect(() => transicionar('ASIGNADO', 'llegar', {})).toThrow();
});
test('flujo feliz', () => {
  expect(transicionar('EN_CAMINO', 'llegar', {})).toBe('EN_SITIO');
});
```

Setup mínimo en Expo: `npx expo install jest-expo jest @types/jest` y en `package.json` `"jest": { "preset": "jest-expo" }`. En el backend: Jest (Nest) o JUnit (Spring).

Regla práctica: por cada transición válida, una prueba; por cada regla de rechazo, una prueba.

**Grupos:** Técnicos de campo (obligatorio el 29), Percha (`sugerirOutfit` en Fase 2), OFICIAR y ZoneUp (Fase 3).

## 5. Concurrencia: "leer y luego escribir" está mal

Dos peticiones llegan al mismo tiempo, ambas leen `cupos = 1`, ambas escriben `cupos = 0` y ambas crean reserva. Sobreventa.

```sql
-- Mal (dos pasos, hay una ventana entre ellos)
SELECT cupos FROM zonas WHERE id = 7;   -- 1
UPDATE zonas SET cupos = 0 WHERE id = 7;

-- Bien (un paso atómico; la BD serializa)
UPDATE zonas SET cupos = cupos - 1 WHERE id = 7 AND cupos > 0;
-- si filas afectadas = 0 → "sin cupo"
```

Alternativas: transacción con `SELECT ... FOR UPDATE`, o `findOneAndUpdate` con condición en MongoDB. Cómo demostrarlo: `Promise.all` con 20 peticiones.

**Grupos:** ZoneUp (directo), TamaGit (una prenda por slot: restricción única parcial), Técnicos de campo (`event_id` UNIQUE para idempotencia, Fase 2).

## 6. Jobs periódicos

Algunas reglas dependen del tiempo, no de una petición del usuario (reserva vencida, hambre de la mascota). Eso no lo puede hacer la app: si nadie la abre, nunca pasa.

```ts
import cron from 'node-cron';
cron.schedule('* * * * *', async () => {
  await db.query(`UPDATE reservas SET estado='CANCELADA'
                  WHERE estado='PENDIENTE' AND creada_en < now() - interval '15 minutes'`);
});
```

Que el job sea **idempotente**: si corre dos veces, el resultado es el mismo. Ojo con Render gratis: si el servidor se duerme, el cron no corre; para la demo, mantenerlo despierto.

**Grupos:** ZoneUp (el 29), TamaGit (Fase 3).

## 7. Manejo central del 401 y sesión persistente

- **Persistir la sesión:** el token va en `expo-secure-store` (cifrado por el sistema), **no** en `AsyncStorage`.
- **Cerrar sesión ante 401:** un solo interceptor en el cliente HTTP, no un `if` en cada pantalla.

```ts
api.interceptors.response.use(r => r, async (err) => {
  if (err.response?.status === 401) {
    await SecureStore.deleteItemAsync('token');
    router.replace('/login');
  }
  return Promise.reject(err);
});
```

Complemento en backend (OFICIAR): el token solo prueba que **alguna vez** iniciaste sesión. Si se desactiva al usuario, el filtro JWT debe consultar su estado en cada petición.

**Grupos:** Percha, Agro Physis, MedAgenda, OFICIAR, NFHunter, Parche Viajero.

## 8. Navegación por rol con Expo Router

`Stack.Protected` muestra u oculta grupos de rutas según una condición. Si la condición es falsa, la ruta **no existe** para ese usuario.

```tsx
<Stack>
  <Stack.Protected guard={!user}><Stack.Screen name="login" /></Stack.Protected>
  <Stack.Protected guard={user?.rol === 'PACIENTE'}><Stack.Screen name="(paciente)" /></Stack.Protected>
  <Stack.Protected guard={user?.rol === 'MEDICO'}><Stack.Screen name="(medico)" /></Stack.Protected>
</Stack>
```

Recordar: ocultar la pantalla **no** es seguridad. El endpoint igual debe rechazar al rol equivocado (concepto 2).

**Grupos:** MedAgenda (directo), OFICIAR, Parche Viajero (admin), Técnicos de campo (acciones de admin).

## 9. Subir imágenes: la BD guarda la URL, no la imagen

Flujo estándar:

1. `expo-image-picker` → URI local.
2. Subir a Cloudinary (desde el backend o con *upload preset* firmado).
3. Guardar en la BD solo `url` y `public_id` (el `public_id` sirve para borrarla después).
4. Mostrar con `expo-image` (cachea en disco).

Errores típicos: guardar base64 en Mongo/MySQL (documentos gigantes), exponer el `api_secret` de Cloudinary en la app, no borrar en Cloudinary cuando se borra en la BD.

**Grupos:** Percha (el 29), OFICIAR, Hibirio, Parche Viajero, Agro Physis (Fase 2–3).

## 10. Listas: `FlatList` vs `ScrollView` + `map`

`ScrollView` renderiza **todos** los elementos aunque no se vean. `FlatList` solo renderiza los visibles (virtualización). Con 200 prendas la diferencia se siente.

```tsx
<FlatList
  data={prendas}
  keyExtractor={(p) => p.id}
  numColumns={2}
  renderItem={({ item }) => <TarjetaPrenda prenda={item} />}
  ListEmptyComponent={<Vacio />}
  refreshing={cargando}
  onRefresh={recargar}
/>
```

`SectionList` cuando hay agrupación (agenda por hora, carta por categoría). Siempre los tres estados: cargando, vacío, error.

**Grupos:** todos; el 29 especialmente Hibirio, Percha, OFICIAR, Parche Viajero.

## 11. Expo Go vs. development build

- **Expo Go:** app genérica con un set fijo de módulos nativos. Rápido para empezar.
- **Development build:** tu propia app de desarrollo con los módulos nativos que necesites. Obligatorio para NFC (`react-native-nfc-manager`), push en Android y Google Maps con API key propia.

```bash
npx expo install expo-dev-client
eas build --profile development --platform android   # gratis, en la nube
# o local: npx expo run:android
```

Regla: si una librería tiene código nativo y no está en Expo Go, se necesita development build. Hay que descubrirlo en la semana 1, no en la 7.

**Grupos:** NFHunter (el 29), OFICIAR (push), cualquiera con mapas en APK.

## 12. Migraciones vs. `synchronize: true`

`synchronize: true` hace que el ORM altere la BD para que coincida con las entidades cada vez que arranca. En desarrollo es cómodo; en un servidor con datos reales puede **borrar columnas con datos** al renombrar un campo.

Las migraciones son archivos versionados con el cambio exacto (`up` y `down`), que se revisan en el PR y se aplican en orden.

```bash
npx typeorm migration:generate src/migrations/AgregarEstadoNegocio -d src/data-source.ts
npx typeorm migration:run -d src/data-source.ts
```

**Grupos:** Agro Physis (el 29), TamaGit (migración de slots), Parche Viajero (estado del negocio), Técnicos de campo (`CANCELADO` en el CHECK).

## 13. Design tokens

Un token es una decisión de diseño con nombre (`color-primario`, `radio-tarjeta`, `sombra-elevada`). Se definen **una vez** y las pantallas solo los usan. Si mañana cambia el color, se cambia en un archivo.

```js
// tailwind.config.js
theme: { extend: {
  colors: { tinta: '#0F2A38', crema: '#F5F2EA', verde: '#5FB548' },
  borderRadius: { tarjeta: '20px' },
}}
```

```tsx
<View className="bg-crema rounded-tarjeta"> {/* no: style={{ backgroundColor: '#F5F2EA' }} */}
```

Prueba rápida en clase: `grep -rn "#[0-9A-Fa-f]\{6\}" app/ src/components/` — cada hex suelto en una pantalla es un token que falta.

Bonus: los temas (alto contraste en Agro Physis, modo oscuro) son solo **otro juego de valores** para los mismos tokens.

## 14. Accesibilidad mínima no negociable

- Contraste de texto ≥ **4.5:1** (verificar con cualquier *contrast checker*). Glassmorphism y Neumorphism son los estilos que más fallan aquí.
- Áreas de toque ≥ **48 × 48** (`min-h-12 min-w-12`).
- El estado no se comunica **solo con color**: chip verde + texto "Con cupo" o ícono.
- `accessibilityLabel` y `accessibilityRole` en botones que solo tienen ícono.
- Estados presionado y deshabilitado visibles.

**Grupos:** todos, en la parte obligatoria de diseño; crítico en Agro Physis, ZoneUp y OFICIAR (chips de estado).

## 15. Recortar alcance es una decisión de ingeniería

Varios documentos tienen más trabajo del que cabe en 7 semanas (Hibirio con 60+ ítems, TamaGit con Blender, Técnicos de campo con IA y panel web, NFHunter con cuatro mecánicas). Un MVP no es "todo pero a medias", es **un flujo completo de punta a punta** que demuestra la propuesta de valor.

Pregunta para cada equipo: *"¿Cuál es la frase de 'Definición de terminado' de su checklist y qué de lo que hicieron esta semana la acerca?"* Si la respuesta es "nada", el trabajo de la semana fue en lo que no importaba.

---

## Matriz rápida: conceptos por grupo para el jueves 29

| Concepto | 1 Téc | 2 NFH | 3 Hib | 4 PV | 5 Agro | 6 Med | 7 Per | 8 Pre | 9 Tam | 10 Zone | 11 Ofi |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Regla en el servidor | ● | ● | ● | ● | ● | ● |  | ● | ● | ● | ● |
| Autorización / IDOR |  |  | ● | ● | ● | ● |  |  |  |  | ● |
| Máquina de estados | ● |  |  | ● |  |  |  |  |  | ● | ● |
| Pruebas de funciones puras | ● |  |  |  |  |  |  |  |  |  |  |
| Concurrencia / atomicidad |  |  |  |  |  |  |  |  | ● | ● |  |
| Jobs periódicos |  |  |  |  |  |  |  |  |  | ● |  |
| 401 + sesión persistente |  |  |  |  | ● | ● | ● |  |  |  | ● |
| Navegación por rol |  |  |  | ● |  | ● |  |  |  |  | ● |
| Subida de imágenes | ● |  |  |  |  |  | ● |  |  |  |  |
| `FlatList` |  |  | ● | ● |  |  | ● |  |  |  | ● |
| Development build |  | ● |  |  |  |  |  |  |  |  |  |
| Migraciones | ● |  |  | ● | ● |  |  |  | ● |  |  |
| Tokens + accesibilidad | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| Recorte de alcance | ● | ● | ● |  |  |  |  |  | ● |  |  |
