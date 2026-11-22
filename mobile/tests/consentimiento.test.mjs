import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(fileURLToPath(new URL("../src/domain/consentimiento.ts", import.meta.url)), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const dominio = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const {
  claveConsentimiento, estadoDesdeAlmacen, puedeRastrearUbicacion, requiereConsentimiento, serializarConsentimiento,
} = dominio;

const guardado = (respuesta, version = 1) =>
  serializarConsentimiento({ respuesta, version, fecha: "2026-11-23T10:00:00.000Z" });

test("la clave es por cuenta y solo usa caracteres válidos para SecureStore", () => {
  const a = claveConsentimiento("consentimiento_ubicacion", "0b6c1d52-3c1f-4e0a-9d77-6a2f4f2b9c11");
  const b = claveConsentimiento("consentimiento_ubicacion", "otra-cuenta");
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9._-]+$/);
  assert.match(claveConsentimiento("p", "a b:c/d"), /^[A-Za-z0-9._-]+$/);
});

test("sin dato guardado, la respuesta está pendiente", () => {
  assert.equal(estadoDesdeAlmacen(null, 1), "pendiente");
});

test("se recupera lo que se guardó, aceptado o rechazado", () => {
  assert.equal(estadoDesdeAlmacen(guardado("aceptado"), 1), "aceptado");
  assert.equal(estadoDesdeAlmacen(guardado("rechazado"), 1), "rechazado");
});

test("una versión anterior del texto vuelve a pedir el consentimiento", () => {
  assert.equal(estadoDesdeAlmacen(guardado("aceptado", 1), 2), "pendiente");
});

test("valores dañados o manipulados nunca cuentan como un sí", () => {
  assert.equal(estadoDesdeAlmacen("aceptado", 1), "pendiente");
  assert.equal(estadoDesdeAlmacen("{", 1), "pendiente");
  assert.equal(estadoDesdeAlmacen(JSON.stringify({ respuesta: "si", version: 1, fecha: "2026-11-23" }), 1), "pendiente");
  assert.equal(estadoDesdeAlmacen(JSON.stringify({ respuesta: "aceptado", version: 1, fecha: "no-es-fecha" }), 1), "pendiente");
  assert.equal(estadoDesdeAlmacen(JSON.stringify({ respuesta: "aceptado" }), 1), "pendiente");
});

test("solo al técnico con respuesta pendiente se le pide el consentimiento", () => {
  assert.equal(requiereConsentimiento("tecnico", "pendiente"), true);
  assert.equal(requiereConsentimiento("tecnico", "aceptado"), false);
  assert.equal(requiereConsentimiento("tecnico", "rechazado"), false);
  assert.equal(requiereConsentimiento("admin", "pendiente"), false);
  assert.equal(requiereConsentimiento(null, "pendiente"), false);
});

test("solo se puede rastrear con consentimiento aceptado", () => {
  assert.equal(puedeRastrearUbicacion("aceptado"), true);
  assert.equal(puedeRastrearUbicacion("rechazado"), false);
  assert.equal(puedeRastrearUbicacion("pendiente"), false);
});
