/**
 * Haalt rij- en fietstijden op via OpenRouteService (gratis, geen creditcard).
 *
 * Stap 1: Maak een gratis account op https://openrouteservice.org/dev/#/signup
 * Stap 2: Kopieer je API-token (dashboard → Tokens)
 * Stap 3: Draai in PowerShell:
 *   $env:ORS_KEY="jouw-token"; node scripts/fetch-travel-times.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const GRASHOEK_LAT = 51.3917;
const GRASHOEK_LNG = 5.9417;

const API_KEY = process.env.ORS_KEY;
if (!API_KEY) {
  console.error("Fout: ORS_KEY omgevingsvariabele niet ingesteld.");
  console.error(
    'Gebruik in PowerShell: $env:ORS_KEY="jouw-token"; node scripts/fetch-travel-times.mjs'
  );
  process.exit(1);
}

async function fetchRoute(toLat, toLng, profile) {
  const url = `https://api.openrouteservice.org/v2/directions/${profile}/json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [GRASHOEK_LNG, GRASHOEK_LAT],
        [toLng, toLat],
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text.slice(0, 120)}`);
  }
  const data = await res.json();
  const segment = data.routes?.[0]?.segments?.[0];
  if (!segment) return null;
  return { minutes: Math.round(segment.duration / 60) };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const locationsPath = join(__dirname, "../src/data/locations.json");
const locations = JSON.parse(readFileSync(locationsPath, "utf8"));

console.log(
  `Reistijden ophalen voor ${locations.length} locaties via OpenRouteService…\n`
);

let updated = 0;
let failed = 0;

for (let i = 0; i < locations.length; i++) {
  const loc = locations[i];
  process.stdout.write(
    `[${String(i + 1).padStart(2)}/${locations.length}] ${loc.name.padEnd(40)} `
  );

  try {
    // Sequentieel (niet parallel) om rate limit te respecteren
    const drive = await fetchRoute(loc.lat, loc.lng, "driving-car");
    await sleep(1600);
    const bike = await fetchRoute(loc.lat, loc.lng, "cycling-regular");

    if (drive && bike) {
      loc.reistijdAutoMin = drive.minutes;
      loc.reistijdFietsMin = bike.minutes;
      console.log(
        `🚗 ${String(drive.minutes).padStart(3)} min   🚲 ${String(bike.minutes).padStart(3)} min`
      );
      updated++;
    } else {
      console.log(`⚠️  Geen route gevonden`);
      failed++;
    }
  } catch (err) {
    console.log(`❌ Fout: ${err.message}`);
    failed++;
  }

  if (i < locations.length - 1) await sleep(1600);
}

writeFileSync(locationsPath, JSON.stringify(locations, null, 2) + "\n");

console.log(`\nKlaar! ${updated} locaties bijgewerkt, ${failed} mislukt.`);
console.log(`Bestand: src/data/locations.json`);
