import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sourcePath = fileURLToPath(new URL("../src/data/trabajos-query.ts", import.meta.url));
const source = readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const compiledUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { buildTrabajosListQuery, uniquePendingTrabajoMissingFromSnapshot } = await import(compiledUrl);

const todaySourcePath = fileURLToPath(new URL("../src/domain/trabajosHoy.ts", import.meta.url));
const todaySource = readFileSync(todaySourcePath, "utf8");
const todayCompiled = ts.transpileModule(todaySource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const todayCompiledUrl = `data:text/javascript;base64,${Buffer.from(todayCompiled).toString("base64")}`;
const { filtrarTrabajosPendientes } = await import(todayCompiledUrl);

test("el administrador consulta el cache completo y ordenado", () => {
  const { sql } = buildTrabajosListQuery("admin");
  assert.match(sql, /FROM trabajos/);
  assert.doesNotMatch(sql, /WHERE tecnico_id/);
  assert.match(sql, /ORDER BY hora_programada IS NULL, hora_programada, created_at/);
});

test("el técnico consulta únicamente los trabajos de su asignación", () => {
  const { sql } = buildTrabajosListQuery("tecnico");
  assert.match(sql, /WHERE tecnico_id = \?/);
  assert.match(sql, /ORDER BY hora_programada IS NULL, hora_programada, created_at/);
});

test("solo identifica un pendiente local ausente sin adivinar entre varios", () => {
  const cached = [
    { id: "remote", sync: "EN_COLA" },
    { id: "deleted-pending", sync: "EN_COLA" },
    { id: "deleted-local", sync: "SOLO_LOCAL" },
    { id: "deleted-synced", sync: "SINCRONIZADO" },
  ];

  assert.equal(
    uniquePendingTrabajoMissingFromSnapshot(cached, new Set(["remote"])),
    null,
  );
  assert.equal(
    uniquePendingTrabajoMissingFromSnapshot(
      cached.filter((job) => job.id !== "deleted-local"),
      new Set(["remote"]),
    ),
    "deleted-pending",
  );
});

test("Hoy incluye trabajos activos de cualquier fecha o sin programación y oculta estados terminales", () => {
  const jobs = [
    { id: "hoy", estado: "ASIGNADO", hora_programada: "2026-10-28T12:00:00.000Z" },
    { id: "futuro", estado: "EN_CAMINO", hora_programada: "2026-11-01T12:00:00.000Z" },
    { id: "pasado", estado: "EN_SITIO", hora_programada: "2026-10-01T12:00:00.000Z" },
    { id: "sin-fecha", estado: "ASIGNADO", hora_programada: null },
    { id: "completado", estado: "COMPLETADO", hora_programada: "2026-10-28T12:00:00.000Z" },
    { id: "cancelado", estado: "CANCELADO", hora_programada: null },
  ];

  assert.deepEqual(
    filtrarTrabajosPendientes(jobs).map((job) => job.id),
    ["hoy", "futuro", "pasado", "sin-fecha"],
  );
});
