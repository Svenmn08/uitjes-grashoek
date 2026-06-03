import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const locPath = join(__dirname, "../src/data/locations.json");
const locs = JSON.parse(readFileSync(locPath, "utf8"));

// IDs die duidelijk buiten zijn maar de tag missen
const addBuiten = new Set([
  2,  // Kinderboerderij Hagerhof
  3,  // Platteland.nu (buitenspeeltuin)
  6,  // Roeffen Mart (buitenspeeltuin)
  12, // Siemonshoek Zwembad (openlucht zwembad)
  14, // Toverland (grotendeels buiten)
  15, // BillyBird Park Drakenrijk (buitenspeeltuin)
  16, // Kasteeltuinen Arcen (tuinen)
  17, // Klein Zwitserland (buitenspeelplaats)
  18, // Badoe Farm (kinderboerderij)
  20, // Avonturenpark Valdeludo (buitenspeeltuin)
  21, // Aardbeienland (buiten plukken)
  22, // Blauwbessenland (buiten plukken)
  25, // Speeltuin Kitskensberg (buitenspeeltuin)
  26, // In de 7e Hemel (pluk- en theetuin)
  27, // Speeltuin Hagerweike (buitenspeeltuin)
  29, // E-village Roggel (buiten rijden)
  30, // De Graasj Roermond (stadsboerderij)
  31, // Speeltuin Os Blieriëk (buitenspeeltuin)
  33, // Parkboerderij Deurne (kinderboerderij)
  34, // Alpacafarm in de Puthof (buiten)
  35, // Toon Kortoomspark (natuur/buitenspeeltuin)
  36, // Openlucht Museum (naam zegt het al)
  37, // Zooparc Overloon (dierentuin buiten)
  38, // Dierenrijk Nuenen (dierenpark buiten)
  42, // Golfbaan Evertsoord (buiten)
  49, // Vrouwen Gevangenis (buiten bezienswaardigheid)
  54, // Peelweide (buitenspeeltuin)
]);

let count = 0;
for (const loc of locs) {
  if (addBuiten.has(loc.id) && !loc.tags.includes("buiten")) {
    loc.tags.push("buiten");
    console.log(`[${loc.id}] ${loc.name}: buiten tag toegevoegd`);
    count++;
  }
}

writeFileSync(locPath, JSON.stringify(locs, null, 2) + "\n");
console.log(`\nKlaar: ${count} locaties bijgewerkt.`);
