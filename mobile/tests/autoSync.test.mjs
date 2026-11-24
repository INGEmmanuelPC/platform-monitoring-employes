import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const load = async (ruta) => {
  const source = readFileSync(fileURLToPath(new URL(ruta, import.meta.url)), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
};
const { hayRed, esReconexion, esVueltaAPrimerPlano, esperaTrasFallo, debeSincronizar, ESPERA_TOPE_MS } =
  await load("../src/domain/autoSync.ts");
const { crearSincronizadorUnico } = await load("../src/domain/sincronizadorUnico.ts");

const base = { hayRed: true, sesionLista: true, pendientes: 2, motivo: "periodico", ahora: 1000, noAntesDe: 0 };

test("hay red solo si está conectado y con salida a internet", () => {
  assert.equal(hayRed({ isConnected: true, isInternetReachable: true }), true);
  assert.equal(hayRed({ isConnected: true }), true);
  assert.equal(hayRed({ isConnected: true, isInternetReachable: false }), false);
  assert.equal(hayRed({ isConnected: false, isInternetReachable: true }), false);
});

test("un estado de red desconocido no cuenta como conectado", () => {
  assert.equal(hayRed({}), false);
  assert.equal(hayRed(undefined), false);
  assert.equal(hayRed(null), false);
});

test("se detecta la reconexión y la vuelta a primer plano", () => {
  assert.equal(esReconexion(false, true), true);
  assert.equal(esReconexion(true, true), false);
  assert.equal(esReconexion(true, false), false);
  assert.equal(esVueltaAPrimerPlano("background", "active"), true);
  assert.equal(esVueltaAPrimerPlano("inactive", "active"), true);
  assert.equal(esVueltaAPrimerPlano("active", "background"), false);
  assert.equal(esVueltaAPrimerPlano("active", "active"), false);
});

test("la espera tras fallar crece al doble y tiene tope", () => {
  assert.equal(esperaTrasFallo(0), 0);
  assert.equal(esperaTrasFallo(-3), 0);
  assert.equal(esperaTrasFallo(NaN), 0);
  assert.equal(esperaTrasFallo(1), 15_000);
  assert.equal(esperaTrasFallo(2), 30_000);
  assert.equal(esperaTrasFallo(3), 60_000);
  assert.equal(esperaTrasFallo(4), 120_000);
  assert.equal(esperaTrasFallo(5), 240_000);
  assert.equal(esperaTrasFallo(6), ESPERA_TOPE_MS);
  assert.equal(esperaTrasFallo(50), ESPERA_TOPE_MS);
});

test("no se sincroniza sin red, sin sesión o sin nada pendiente", () => {
  assert.equal(debeSincronizar({ ...base, hayRed: false }), false);
  assert.equal(debeSincronizar({ ...base, sesionLista: false }), false);
  assert.equal(debeSincronizar({ ...base, pendientes: 0 }), false);
  assert.equal(debeSincronizar({ ...base, motivo: "reconexion", pendientes: 0 }), false);
});

test("el intento periódico respeta la espera, los eventos no", () => {
  assert.equal(debeSincronizar({ ...base, noAntesDe: 5000 }), false);
  assert.equal(debeSincronizar({ ...base, noAntesDe: 1000 }), true);
  for (const motivo of ["reconexion", "primer_plano", "inicio"]) {
    assert.equal(debeSincronizar({ ...base, motivo, noAntesDe: 999_999 }), true);
  }
});

const pausa = () => {
  let resolver, rechazar;
  const promesa = new Promise((res, rej) => { resolver = res; rechazar = rej; });
  return { promesa, resolver, rechazar };
};

test("dos llamadas simultáneas de la misma cuenta ejecutan UNA sola sincronización", async () => {
  let llamadas = 0;
  const espera = pausa();
  const s = crearSincronizadorUnico(async () => { llamadas += 1; return espera.promesa; });
  const a = s.sincronizar({}, "u1", "tecnico");
  const b = s.sincronizar({}, "u1", "tecnico");
  assert.equal(s.enCurso(), true);
  espera.resolver(3);
  assert.deepEqual(await Promise.all([a, b]), [3, 3]);
  assert.equal(llamadas, 1);
  assert.equal(s.enCurso(), false);
});

test("después de terminar se puede volver a sincronizar", async () => {
  let llamadas = 0;
  const s = crearSincronizadorUnico(async () => ++llamadas);
  assert.equal(await s.sincronizar({}, "u1", "tecnico"), 1);
  assert.equal(await s.sincronizar({}, "u1", "tecnico"), 2);
});

test("otra cuenta espera su turno y no recibe el resultado de la anterior", async () => {
  const orden = [];
  const espera = pausa();
  const s = crearSincronizadorUnico(async (_db, actor) => {
    orden.push(`inicio:${actor}`);
    if (actor === "u1") await espera.promesa;
    orden.push(`fin:${actor}`);
    return actor === "u1" ? 1 : 2;
  });
  const a = s.sincronizar({}, "u1", "tecnico");
  const b = s.sincronizar({}, "u2", "tecnico");
  await Promise.resolve();
  assert.deepEqual(orden, ["inicio:u1"]);
  espera.resolver();
  assert.deepEqual(await Promise.all([a, b]), [1, 2]);
  assert.deepEqual(orden, ["inicio:u1", "fin:u1", "inicio:u2", "fin:u2"]);
});

test("si falla, libera el candado y todos los que esperaban reciben el error", async () => {
  let llamadas = 0;
  const espera = pausa();
  const s = crearSincronizadorUnico(async () => { llamadas += 1; if (llamadas === 1) return espera.promesa; return 7; });
  const a = s.sincronizar({}, "u1", "tecnico");
  const b = s.sincronizar({}, "u1", "tecnico");
  espera.rechazar(new Error("sin red"));
  await assert.rejects(a, /sin red/);
  await assert.rejects(b, /sin red/);
  assert.equal(s.enCurso(), false);
  assert.equal(await s.sincronizar({}, "u1", "tecnico"), 7);
});

test("las pantallas suscritas se enteran, y dejan de enterarse al cancelar", () => {
  const s = crearSincronizadorUnico(async () => 0);
  let avisos = 0;
  const cancelar = s.suscribir(() => { avisos += 1; });
  s.notificar();
  s.notificar();
  assert.equal(avisos, 2);
  cancelar();
  s.notificar();
  assert.equal(avisos, 2);
});
