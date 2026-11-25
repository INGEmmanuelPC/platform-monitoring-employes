import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sourcePath = fileURLToPath(new URL("../src/trabajo-state.ts", import.meta.url));
const source = readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { esFirmaSvgValida, esTransicionTrabajoValida } = await import(compiledUrl);

test("el servidor permite transiciones válidas del flujo de campo", () => {
  assert.equal(esTransicionTrabajoValida("ASIGNADO", "EN_CAMINO"), true);
  assert.equal(esTransicionTrabajoValida("EN_CAMINO", "EN_SITIO"), true);
  assert.equal(esTransicionTrabajoValida("EN_SITIO", "COMPLETADO"), true);
  assert.equal(esTransicionTrabajoValida("COMPLETADO", "CERRADO"), true);
});

test("el servidor rechaza saltos de estado inválidos", () => {
  assert.equal(esTransicionTrabajoValida("ASIGNADO", "EN_SITIO"), false);
  assert.equal(esTransicionTrabajoValida("ASIGNADO", "COMPLETADO"), false);
  assert.equal(esTransicionTrabajoValida("CANCELADO", "EN_CAMINO"), false);
  assert.equal(esTransicionTrabajoValida("CERRADO", "CANCELADO"), false);
});

test("el servidor acepta reintentos idempotentes del mismo estado", () => {
  assert.equal(esTransicionTrabajoValida("EN_CAMINO", "EN_CAMINO"), true);
});

test("el servidor rechaza estados actuales y destino que no reconoce", () => {
  assert.equal(esTransicionTrabajoValida("DESCONOCIDO", "EN_CAMINO"), false);
  assert.equal(esTransicionTrabajoValida("ASIGNADO", "DESCONOCIDO"), false);
});

test("la validación de firma del servidor exige un trazo con inicio y movimiento", () => {
  assert.equal(esFirmaSvgValida(null), false);
  assert.equal(esFirmaSvgValida('<svg><path d="M 4 8"/></svg>'), false);
  assert.equal(esFirmaSvgValida('<svg><path d="M 4 8 L 12 16"/></svg>'), true);
});

test("el técnico solo puede avanzar el flujo de campo", async () => {
  const { puedeTransicionarPorRol } = await import(compiledUrl);
  assert.equal(puedeTransicionarPorRol("tecnico", "ASIGNADO", "EN_CAMINO"), true);
  assert.equal(puedeTransicionarPorRol("tecnico", "EN_CAMINO", "EN_SITIO"), true);
  assert.equal(puedeTransicionarPorRol("tecnico", "EN_SITIO", "COMPLETADO"), true);
});

test("el técnico NO puede cancelar ni cerrar", async () => {
  const { puedeTransicionarPorRol } = await import(compiledUrl);
  for (const desde of ["ASIGNADO", "EN_CAMINO", "EN_SITIO"]) {
    assert.equal(puedeTransicionarPorRol("tecnico", desde, "CANCELADO"), false);
  }
  assert.equal(puedeTransicionarPorRol("tecnico", "COMPLETADO", "CERRADO"), false);
});

test("el administrador puede todo lo válido, también lo del técnico", async () => {
  const { puedeTransicionarPorRol } = await import(compiledUrl);
  assert.equal(puedeTransicionarPorRol("admin", "ASIGNADO", "EN_CAMINO"), true);
  assert.equal(puedeTransicionarPorRol("admin", "EN_SITIO", "COMPLETADO"), true);
  assert.equal(puedeTransicionarPorRol("admin", "EN_SITIO", "CANCELADO"), true);
  assert.equal(puedeTransicionarPorRol("admin", "COMPLETADO", "CERRADO"), true);
});

test("el rol no vuelve válida una transición inválida", async () => {
  const { puedeTransicionarPorRol } = await import(compiledUrl);
  assert.equal(puedeTransicionarPorRol("admin", "ASIGNADO", "EN_SITIO"), false);
  assert.equal(puedeTransicionarPorRol("admin", "CANCELADO", "EN_CAMINO"), false);
  assert.equal(puedeTransicionarPorRol("tecnico", "ASIGNADO", "COMPLETADO"), false);
  assert.equal(puedeTransicionarPorRol("admin", "CERRADO", "CANCELADO"), false);
});

test("quedarse en el mismo estado no es una transición y cualquier rol puede", async () => {
  const { puedeTransicionarPorRol } = await import(compiledUrl);
  assert.equal(puedeTransicionarPorRol("tecnico", "EN_SITIO", "EN_SITIO"), true);
});

test("un rol desconocido no puede transicionar", async () => {
  const { puedeTransicionarPorRol } = await import(compiledUrl);
  assert.equal(puedeTransicionarPorRol("cliente", "ASIGNADO", "EN_CAMINO"), false);
  assert.equal(puedeTransicionarPorRol("", "ASIGNADO", "EN_CAMINO"), false);
  assert.equal(puedeTransicionarPorRol("tecnico", "toString", "EN_CAMINO"), false);
});
