#!/usr/bin/env node
// Detecta la IP de red local de esta maquina y actualiza EXPO_PUBLIC_API_URL
// en .env.local para que apunte ahi. Sin esto, cada vez que cambias de red
// (WiFi de casa, eduroam, hotspot del celular...) el celular sigue llamando
// a una IP vieja y el login falla con "no se pudo conectar con el servicio".
//
// Se corre solo antes de "npm start" (ver "prestart" en package.json), o a
// mano con "npm run sync-ip" si solo quieres revisar sin arrancar Metro.

const fs = require("fs");
const os = require("os");
const path = require("path");

const ENV_PATH = path.join(__dirname, "..", ".env.local");
const BACKEND_PORT = 3000;

// docker0 y br-* son las redes virtuales de Docker (172.17-19.x en esta
// maquina); lo es loopback. Ninguna de las dos es la IP que el celular puede
// alcanzar, así que se descartan por nombre de interfaz, no por rango de IP
// -- Docker puede elegir otro rango en otra maquina, pero el nombre de la
// interfaz es estable.
const IGNORED_INTERFACE_PATTERN = /^(lo|docker|br-|veth)/i;

function findLanCandidates() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (IGNORED_INTERFACE_PATTERN.test(name)) continue;
    for (const addr of addresses ?? []) {
      if (addr.family !== "IPv4" || addr.internal) continue;
      candidates.push({ name, address: addr.address });
    }
  }

  return candidates;
}

function updateEnvFile(newUrl) {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(`No existe ${ENV_PATH}. Copia .env.example a .env.local primero.`);
    process.exit(1);
  }

  const lines = fs.readFileSync(ENV_PATH, "utf8").split("\n");
  let found = false;
  let previousUrl = null;

  const updated = lines.map((line) => {
    if (line.startsWith("EXPO_PUBLIC_API_URL=")) {
      found = true;
      previousUrl = line.slice("EXPO_PUBLIC_API_URL=".length);
      return `EXPO_PUBLIC_API_URL=${newUrl}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`EXPO_PUBLIC_API_URL=${newUrl}`);
  }

  fs.writeFileSync(ENV_PATH, updated.join("\n"));
  return previousUrl;
}

function main() {
  const candidates = findLanCandidates();

  if (candidates.length === 0) {
    console.error(
      "No se encontro ninguna IP de red local. ¿Esta maquina esta conectada a una red?",
    );
    process.exit(1);
  }

  if (candidates.length > 1) {
    console.warn("Se encontro mas de una IP candidata, se usara la primera:");
    candidates.forEach((c) => console.warn(`  - ${c.name}: ${c.address}`));
    console.warn("Si es la incorrecta, ajusta EXPO_PUBLIC_API_URL en .env.local a mano.");
  }

  const ip = candidates[0].address;
  const newUrl = `http://${ip}:${BACKEND_PORT}`;
  const previousUrl = updateEnvFile(newUrl);

  if (previousUrl === newUrl) {
    console.log(`EXPO_PUBLIC_API_URL ya estaba correcto (${newUrl}).`);
  } else {
    console.log(`EXPO_PUBLIC_API_URL actualizado: ${previousUrl ?? "(no existia)"} -> ${newUrl}`);
  }
}

main();
