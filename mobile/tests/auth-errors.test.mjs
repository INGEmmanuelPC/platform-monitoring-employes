import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const sourcePath = fileURLToPath(new URL("../src/api/auth-errors.ts", import.meta.url));
const source = readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
const { getAuthErrorMessage } = await import(compiledUrl);

const authError = (message) => ({ message });

test("muestra el mensaje de credenciales que devuelve el backend en español", () => {
  assert.equal(
    getAuthErrorMessage(authError("El correo o la contraseña no son correctos."), "login"),
    "El correo o la contraseña no son correctos.",
  );
});

test("reconoce el correo sin confirmar que devuelve el backend", () => {
  assert.equal(
    getAuthErrorMessage(authError("Confirma tu correo electrónico antes de iniciar sesión."), "login"),
    "Confirma tu correo electrónico antes de iniciar sesión.",
  );
});

test("clasifica el timeout de API como un problema de conexión", () => {
  assert.match(
    getAuthErrorMessage(authError("La conexión con el backend tardó demasiado."), "login"),
    /No se pudo conectar/,
  );
});
