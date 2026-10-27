import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sourcePath = fileURLToPath(new URL("../src/domain/estadoTrabajo.ts", import.meta.url));
const source = readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const compiledUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { transicionarTrabajo } = await import(compiledUrl);

test("ASIGNADO puede iniciar el viaje", () => {
  assert.equal(transicionarTrabajo("ASIGNADO", "marcarEnCamino"), "EN_CAMINO");
});

test("EN_CAMINO puede marcar llegada", () => {
  assert.equal(transicionarTrabajo("EN_CAMINO", "marcarLlegada"), "EN_SITIO");
});

test("no permite marcar llegada antes de iniciar el viaje", () => {
  assert.throws(() => transicionarTrabajo("ASIGNADO", "marcarLlegada"), /marcar la llegada/);
});

test("completar requiere firma y fotografía", () => {
  assert.throws(
    () => transicionarTrabajo("EN_SITIO", "completar", { tieneFoto: true }),
    /debe firmar/,
  );
  assert.throws(
    () => transicionarTrabajo("EN_SITIO", "completar", { tieneFirma: true }),
    /al menos una foto/,
  );
  assert.equal(
    transicionarTrabajo("EN_SITIO", "completar", { tieneFirma: true, tieneFoto: true }),
    "COMPLETADO",
  );
});

test("cerrar requiere un reporte aprobado", () => {
  assert.throws(() => transicionarTrabajo("COMPLETADO", "cerrar"), /reporte aprobado/);
  assert.equal(
    transicionarTrabajo("COMPLETADO", "cerrar", { estadoReporte: "APROBADO" }),
    "CERRADO",
  );
});

test("cancelar requiere motivo y deja el estado terminal", () => {
  assert.throws(() => transicionarTrabajo("ASIGNADO", "cancelar"), /motivo de cancelación/);
  assert.equal(
    transicionarTrabajo("ASIGNADO", "cancelar", { motivoCancelacion: "Cliente no disponible" }),
    "CANCELADO",
  );
  assert.throws(() => transicionarTrabajo("CANCELADO", "marcarEnCamino"), /inicio del viaje/);
});
