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
