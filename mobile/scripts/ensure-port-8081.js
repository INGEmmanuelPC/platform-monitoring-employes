#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..").toLowerCase();
const port = 8081;

function runPowerShell(command) {
  return execFileSync("powershell.exe", ["-NoProfile", "-Command", command], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function main() {
  if (process.platform !== "win32") {
    console.log(`Expo se iniciará en el puerto ${port}.`);
    return;
  }

  const output = runPowerShell(
    `$connections = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; ` +
      `$connections | ForEach-Object { ` +
      `$p = Get-CimInstance Win32_Process -Filter "ProcessId = $($_.OwningProcess)"; ` +
      "[pscustomobject]@{Pid=$_.OwningProcess; CommandLine=$p.CommandLine; Path=$p.ExecutablePath} } | ConvertTo-Json -Compress",
  );

  if (!output) {
    console.log(`El puerto ${port} está libre.`);
    return;
  }

  const processes = JSON.parse(output);
  const entries = Array.isArray(processes) ? processes : [processes];
  const ownProcesses = entries.filter((entry) =>
    `${entry.CommandLine ?? ""} ${entry.Path ?? ""}`.toLowerCase().includes(projectRoot),
  );

  if (ownProcesses.length !== entries.length) {
    const details = entries
      .map((entry) => `PID ${entry.Pid}: ${entry.CommandLine || entry.Path || "proceso desconocido"}`)
      .join("\n");
    throw new Error(`El puerto ${port} está ocupado por otro proceso. No se finalizará automáticamente:\n${details}`);
  }

  for (const entry of ownProcesses) {
    runPowerShell(`Stop-Process -Id ${entry.Pid} -Force`);
    console.log(`Se finalizó la instancia anterior de Expo/Metro (PID ${entry.Pid}).`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
