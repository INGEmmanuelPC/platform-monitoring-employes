import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(fileURLToPath(new URL("../src/domain/estadoReporte.ts", import.meta.url)), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { transicionarReporte, vistaRevision, TRANSICIONES_REPORTE } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

const admin = { rol: "admin", estadoTrabajo: "COMPLETADO", texto: "Reporte." };
const tecnico = { rol: "tecnico" };

test("guardar la nota (sin red) lleva el reporte de SIN_AUDIO a AUDIO_LISTO", () => {
  assert.deepEqual(transicionarReporte("SIN_AUDIO", "registrarInsumo", tecnico), { ok: true, estado: "AUDIO_LISTO" });
});

test("una segunda nota no hace retroceder el reporte", () => {
  for (const estado of ["AUDIO_LISTO", "BORRADOR", "APROBADO", "ENTREGADO"]) {
    assert.equal(transicionarReporte(estado, "registrarInsumo", tecnico).ok, false);
  }
});

test("flujo del administrador: redactar, aprobar, entregar", () => {
  assert.equal(transicionarReporte("AUDIO_LISTO", "redactar", admin).estado, "BORRADOR");
  assert.equal(transicionarReporte("BORRADOR", "aprobar", admin).estado, "APROBADO");
  assert.equal(transicionarReporte("APROBADO", "entregar", admin).estado, "ENTREGADO");
});

test("el técnico no puede redactar, aprobar ni entregar", () => {
  const ctx = { rol: "tecnico", estadoTrabajo: "COMPLETADO", texto: "x" };
  assert.equal(transicionarReporte("AUDIO_LISTO", "redactar", ctx).ok, false);
  assert.equal(transicionarReporte("BORRADOR", "aprobar", ctx).ok, false);
  assert.equal(transicionarReporte("APROBADO", "entregar", ctx).ok, false);
});

test("sin IA no hay TRANSCRIBIENDO en ninguna transición", () => {
  for (const regla of Object.values(TRANSICIONES_REPORTE)) {
    assert.notEqual(regla.hacia, "TRANSCRIBIENDO");
    assert.ok(!regla.desde.includes("TRANSCRIBIENDO"));
  }
});

test("redactar y aprobar exigen trabajo terminado y texto", () => {
  assert.equal(transicionarReporte("AUDIO_LISTO", "redactar", { ...admin, estadoTrabajo: "EN_SITIO" }).ok, false);
  assert.equal(transicionarReporte("BORRADOR", "aprobar", { ...admin, texto: "  " }).ok, false);
});

test("acciones desconocidas se rechazan sin lanzar", () => {
  const r = transicionarReporte("AUDIO_LISTO", "toString", admin);
  assert.equal(r.ok, false);
  assert.match(r.motivo, /no existe/);
});

test("la vista del administrador sigue los dos ejes", () => {
  assert.equal(vistaRevision("AUDIO_LISTO", "CANCELADO"), "cancelado");
  assert.equal(vistaRevision("ENTREGADO", "CERRADO"), "entregado");
  assert.equal(vistaRevision("APROBADO", "CERRADO"), "entregado");
  assert.equal(vistaRevision("AUDIO_LISTO", "EN_SITIO"), "esperando_trabajo");
  assert.equal(vistaRevision("SIN_AUDIO", "COMPLETADO"), "sin_nota");
  assert.equal(vistaRevision("AUDIO_LISTO", "COMPLETADO"), "redactar");
  assert.equal(vistaRevision("BORRADOR", "COMPLETADO"), "editar_y_aprobar");
  assert.equal(vistaRevision("APROBADO", "COMPLETADO"), "cerrar");
  assert.equal(vistaRevision("TRANSCRIBIENDO", "COMPLETADO"), "solo_lectura");
});
