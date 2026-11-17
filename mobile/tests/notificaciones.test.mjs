import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(fileURLToPath(new URL("../src/domain/notificaciones.ts", import.meta.url)), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { destinoDeAviso } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);

const ID = "0b6c1d52-3c1f-4e0a-9d77-6a2f4f2b9c11";

test("un cambio de estado abre el detalle del trabajo", () => {
  assert.deepEqual(destinoDeAviso({ trabajoId: ID, tipo: "estado" }), { tipo: "trabajo", id: ID });
});
test("un trabajo recién asignado abre Hoy para que se descargue", () => {
  assert.deepEqual(destinoDeAviso({ trabajoId: ID, tipo: "asignado" }), { tipo: "hoy" });
});
test("datos ausentes o malformados no navegan a ningún lado", () => {
  assert.equal(destinoDeAviso(undefined), null);
  assert.equal(destinoDeAviso({}), null);
  assert.equal(destinoDeAviso({ trabajoId: "../../cuenta" }), null);
  assert.equal(destinoDeAviso({ trabajoId: 42 }), null);
});
