import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(fileURLToPath(new URL("../src/notificaciones.ts", import.meta.url)), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { avisoPorCambioDeEstado, NotificadorExpoPush, FORMATO_TOKEN_EXPO } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const base = {
  trabajoId: "t1", cliente: "Finca La Esperanza", tecnicoId: "tec", estadoAnterior: "ASIGNADO",
  estadoNuevo: "EN_CAMINO", actorId: "tec", actorRol: "tecnico",
};

test("sin cambio de estado no hay aviso", () => {
  assert.equal(avisoPorCambioDeEstado({ ...base, estadoNuevo: "ASIGNADO" }), null);
});

test("el técnico avanzando por pasos intermedios no genera ruido", () => {
  assert.equal(avisoPorCambioDeEstado(base), null);
  assert.equal(avisoPorCambioDeEstado({ ...base, estadoAnterior: "EN_CAMINO", estadoNuevo: "EN_SITIO" }), null);
});

test("cuando el técnico completa, se avisa a los administradores", () => {
  const r = avisoPorCambioDeEstado({ ...base, estadoAnterior: "EN_SITIO", estadoNuevo: "COMPLETADO" });
  assert.equal(r.destinatario, "admins");
  assert.equal(r.aviso.datos.trabajoId, "t1");
  assert.equal(r.aviso.datos.tipo, "completado");
});

test("cuando el admin cancela, se avisa al técnico con el motivo", () => {
  const r = avisoPorCambioDeEstado({
    ...base, actorId: "adm", actorRol: "admin", estadoAnterior: "EN_CAMINO",
    estadoNuevo: "CANCELADO", motivoCancelacion: "Cliente no disponible",
  });
  assert.equal(r.destinatario, "tecnico");
  assert.match(r.aviso.cuerpo, /cancelado/);
  assert.match(r.aviso.cuerpo, /Cliente no disponible/);
});

test("un admin que ejecuta su propio trabajo no se avisa a sí mismo", () => {
  assert.equal(avisoPorCambioDeEstado({
    ...base, actorId: "adm", tecnicoId: "adm", actorRol: "admin", estadoNuevo: "CERRADO", estadoAnterior: "COMPLETADO",
  }), null);
});

test("una orden nueva avisa al técnico asignado, salvo que la cree él mismo", () => {
  const nueva = { ...base, estadoAnterior: null, estadoNuevo: "ASIGNADO", actorId: "adm", actorRol: "admin" };
  const r = avisoPorCambioDeEstado(nueva);
  assert.equal(r.destinatario, "tecnico");
  assert.equal(r.aviso.datos.tipo, "asignado");
  assert.equal(avisoPorCambioDeEstado({ ...nueva, actorId: "tec" }), null);
});

test("el formato del token solo acepta tokens de Expo", () => {
  assert.equal(FORMATO_TOKEN_EXPO.test("ExponentPushToken[abc123]"), true);
  assert.equal(FORMATO_TOKEN_EXPO.test("ExpoPushToken[abc123]"), true);
  assert.equal(FORMATO_TOKEN_EXPO.test("abc"), false);
  assert.equal(FORMATO_TOKEN_EXPO.test("ExponentPushToken[]"), false);
});

function almacen(token) {
  return { borrado: false, async tokenPush() { return token; }, async borrarTokenPush() { this.borrado = true; } };
}
const aviso = { titulo: "t", cuerpo: "c", datos: { trabajoId: "t1" } };

test("el adaptador envía a Expo con título, cuerpo y datos", async () => {
  let enviado;
  const n = new NotificadorExpoPush(almacen("ExponentPushToken[x]"), "secreto", async (url, init) => {
    enviado = { url, init }; return { json: async () => ({ data: { status: "ok" } }) };
  });
  await n.avisar("u1", aviso);
  assert.equal(enviado.url, "https://exp.host/--/api/v2/push/send");
  assert.equal(enviado.init.headers.Authorization, "Bearer secreto");
  const cuerpo = JSON.parse(enviado.init.body);
  assert.equal(cuerpo.to, "ExponentPushToken[x]");
  assert.deepEqual(cuerpo.data, { trabajoId: "t1" });
});

test("sin token registrado no se llama a Expo", async () => {
  let llamado = false;
  await new NotificadorExpoPush(almacen(null), undefined, async () => { llamado = true; return { json: async () => ({}) }; }).avisar("u1", aviso);
  assert.equal(llamado, false);
});

test("DeviceNotRegistered borra el token", async () => {
  const a = almacen("ExponentPushToken[x]");
  await new NotificadorExpoPush(a, undefined, async () => ({
    json: async () => ({ data: { status: "error", details: { error: "DeviceNotRegistered" } } }),
  })).avisar("u1", aviso);
  assert.equal(a.borrado, true);
});

test("si Expo falla, el aviso no relanza el error", async () => {
  const original = console.error; console.error = () => {};
  try {
    await new NotificadorExpoPush(almacen("ExponentPushToken[x]"), undefined, async () => { throw new Error("sin red"); }).avisar("u1", aviso);
  } finally { console.error = original; }
});
