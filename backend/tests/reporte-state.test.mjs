import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(fileURLToPath(new URL("../src/reporte-state.ts", import.meta.url)), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { transicionarReporte, TRANSICIONES_REPORTE } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const admin = { rol: "admin", estadoTrabajo: "COMPLETADO", texto: "Se cambió la válvula." };
const tecnico = { rol: "tecnico", estadoTrabajo: "COMPLETADO", texto: "x" };

test("flujo feliz sin IA: nota, borrador, aprobado, entregado", () => {
  assert.deepEqual(transicionarReporte("SIN_AUDIO", "registrarInsumo", tecnico), { ok: true, estado: "AUDIO_LISTO" });
  assert.deepEqual(transicionarReporte("AUDIO_LISTO", "redactar", admin), { ok: true, estado: "BORRADOR" });
  assert.deepEqual(transicionarReporte("BORRADOR", "redactar", admin), { ok: true, estado: "BORRADOR" });
  assert.deepEqual(transicionarReporte("BORRADOR", "aprobar", admin), { ok: true, estado: "APROBADO" });
  assert.deepEqual(transicionarReporte("APROBADO", "entregar", admin), { ok: true, estado: "ENTREGADO" });
});

test("sin IA nunca se pasa por TRANSCRIBIENDO", () => {
  for (const regla of Object.values(TRANSICIONES_REPORTE)) {
    assert.notEqual(regla.hacia, "TRANSCRIBIENDO");
    assert.ok(!regla.desde.includes("TRANSCRIBIENDO"));
  }
});

test("el técnico no puede redactar, aprobar ni entregar", () => {
  for (const [estado, accion] of [["AUDIO_LISTO", "redactar"], ["BORRADOR", "aprobar"], ["APROBADO", "entregar"]]) {
    const r = transicionarReporte(estado, accion, tecnico);
    assert.equal(r.ok, false);
    assert.match(r.motivo, /administrador/);
  }
});

test("no se redacta ni se aprueba hasta que el trabajo esté terminado", () => {
  for (const estadoTrabajo of ["ASIGNADO", "EN_CAMINO", "EN_SITIO", "CANCELADO"]) {
    assert.equal(transicionarReporte("AUDIO_LISTO", "redactar", { ...admin, estadoTrabajo }).ok, false);
    assert.equal(transicionarReporte("BORRADOR", "aprobar", { ...admin, estadoTrabajo }).ok, false);
  }
});

test("redactar y aprobar exigen texto", () => {
  for (const texto of [undefined, null, "", "   "]) {
    assert.equal(transicionarReporte("AUDIO_LISTO", "redactar", { ...admin, texto }).ok, false);
    assert.equal(transicionarReporte("BORRADOR", "aprobar", { ...admin, texto }).ok, false);
  }
});

test("no se salta ningún paso ni se vuelve atrás", () => {
  assert.equal(transicionarReporte("SIN_AUDIO", "redactar", admin).ok, false);
  assert.equal(transicionarReporte("SIN_AUDIO", "aprobar", admin).ok, false);
  assert.equal(transicionarReporte("AUDIO_LISTO", "aprobar", admin).ok, false);
  assert.equal(transicionarReporte("AUDIO_LISTO", "entregar", admin).ok, false);
  assert.equal(transicionarReporte("APROBADO", "redactar", admin).ok, false);
  assert.equal(transicionarReporte("ENTREGADO", "redactar", admin).ok, false);
  assert.equal(transicionarReporte("ENTREGADO", "aprobar", admin).ok, false);
});

test("el registro de la nota solo ocurre desde SIN_AUDIO", () => {
  assert.equal(transicionarReporte("AUDIO_LISTO", "registrarInsumo", tecnico).ok, false);
  assert.equal(transicionarReporte("APROBADO", "registrarInsumo", tecnico).ok, false);
});

test("acciones y estados desconocidos se rechazan con un motivo legible, sin lanzar", () => {
  const accion = transicionarReporte("AUDIO_LISTO", "hackear", admin);
  assert.equal(accion.ok, false);
  assert.match(accion.motivo, /no existe/);
  assert.equal(transicionarReporte("INVENTADO", "redactar", admin).ok, false);
  assert.equal(transicionarReporte("AUDIO_LISTO", "toString", admin).ok, false);
});
