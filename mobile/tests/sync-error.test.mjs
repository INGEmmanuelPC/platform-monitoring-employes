import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sourcePath = fileURLToPath(new URL("../src/domain/syncError.ts", import.meta.url));
const source = readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const compiledUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { describeSyncFailure } = await import(compiledUrl);

test("explica cuando la API no encuentra el RPC requerido para sincronizar", () => {
  const error = Object.assign(new Error("Could not find function public.sync_trabajos in schema cache"), { status: 500 });
  assert.match(describeSyncFailure(error), /mismo Supabase/);
});

test("conserva el mensaje del backend para permisos o reglas de negocio", () => {
  const error = Object.assign(new Error("Supabase bloqueó la operación por RLS."), { status: 403 });
  assert.equal(describeSyncFailure(error), error.message);
});

test("explica al administrador que necesita la migración para ejecutar órdenes asignadas a técnicos", () => {
  const error = Object.assign(new Error("La orden no existe o no pertenece al técnico autenticado."), { status: 409 });
  assert.match(describeSyncFailure(error, "admin"), /008_admin_ejecuta_trabajos\.sql/);
});

test("explica al administrador cuando RLS rechaza sus evidencias o cambios", () => {
  const error = Object.assign(new Error("Supabase bloqueó la operación por RLS."), { status: 403 });
  assert.match(describeSyncFailure(error, "admin"), /005_admin_gestiona_trabajos\.sql/);
  assert.match(describeSyncFailure(error, "tecnico"), /Supabase bloqueó/);
});

test("muestra el error de conexión disponible", () => {
  assert.equal(describeSyncFailure(new Error("Network request failed")), "Network request failed");
});
