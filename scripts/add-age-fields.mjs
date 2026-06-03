/**
 * Voeg leeftijdMin, leeftijdMax en openingHours toe aan alle locaties.
 * Eenmalig draaien: node scripts/add-age-fields.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, "../src/data/locations.json");
const locs = JSON.parse(readFileSync(path, "utf8"));

// Leeftijdsdata per locatie-id
// min: minimale leeftijd in jaren, max: maximale (null = geen max)
const ageById = {
  1:  { min: 0,    max: 12 },  // Beringerbos
  2:  { min: 0,    max: 10 },  // Kinderboerderij Hagerhof
  3:  { min: 0,    max: 10 },  // Platteland.nu
  4:  { min: 0,    max: 12 },  // Ballorig Venlo
  5:  { min: 0,    max: 12 },  // Monkey Town
  6:  { min: 0,    max: 12 },  // Roeffen Mart
  7:  { min: 0,    max: null }, // Schatberg Zwembad
  8:  { min: 0,    max: null }, // Meerdal Zwembad
  9:  { min: 0,    max: null }, // Limburgse Peel Zwembad
  10: { min: 0,    max: null }, // Beringerzand Zwembad
  11: { min: 0,    max: null }, // Waterloat Zwembad
  12: { min: 0,    max: null }, // Siemonshoek Zwembad
  13: { min: 0,    max: null }, // BreeBronne Zwembad
  14: { min: 2,    max: null }, // Toverland
  15: { min: 0,    max: 8  },  // BillyBird Park Drakenrijk (voor jonge kinderen)
  16: { min: 4,    max: null }, // Kasteeltuinen Arcen
  17: { min: 0,    max: 10 },  // Klein Zwitserland
  18: { min: 0,    max: 10 },  // Badoe Farm
  19: { min: 0,    max: 12 },  // Kidsplaza Weert
  20: { min: 4,    max: 12 },  // Avonturenpark Valdeludo
  21: { min: 0,    max: 12 },  // Aardbeienland
  22: { min: 0,    max: null }, // Blauwbessenland
  23: { min: 0,    max: 12 },  // Boegafun Venray
  24: { min: null, max: null }, // Eetcafé Van Horne Hoeve (restaurant)
  25: { min: 0,    max: 12 },  // Speeltuin Kitskensberg
  26: { min: null, max: null }, // In de 7e Hemel
  27: { min: 0,    max: 12 },  // Speeltuin Hagerweike
  28: { min: 0,    max: null }, // Leistert Zwembad
  29: { min: 3,    max: 12 },  // E-village Roggel
  30: { min: 0,    max: 10 },  // De Graasj Roermond
  31: { min: 0,    max: 12 },  // Speeltuin Os Blieriëk
  32: { min: 0,    max: null }, // Landal De Lommerbergen
  33: { min: 0,    max: 10 },  // Parkboerderij Deurne
  34: { min: 0,    max: null }, // Alpacafarm in de Puthof
  35: { min: 0,    max: 12 },  // Toon Kortoomspark
  36: { min: 4,    max: null }, // Openlucht Museum
  37: { min: 0,    max: null }, // Zooparc Overloon
  38: { min: 0,    max: null }, // Dierenrijk Nuenen
  39: { min: null, max: null }, // Beej Masch
  40: { min: null, max: null }, // Leanzo
  41: { min: null, max: null }, // Cafetaria 't Veen
  42: { min: 8,    max: null }, // Golfbaan Evertsoord
  43: { min: null, max: null }, // Cascara Gril
  44: { min: null, max: null }, // ABC Restaurant
  45: { min: null, max: null }, // Schatberg Restaurant
  46: { min: null, max: null }, // KFC
  47: { min: null, max: null }, // La Place
  48: { min: null, max: null }, // Mc Donalds
  49: { min: 6,    max: null }, // Vrouwen Gevangenis
  50: { min: null, max: null }, // Dinnertijd
  51: { min: null, max: null }, // De Pool Maasbree
  52: { min: null, max: null }, // Gemeintehoes
  53: { min: null, max: null }, // Vermaekerij
  54: { min: 0,    max: 12 },  // Peelweide
};

for (const loc of locs) {
  const age = ageById[loc.id] ?? { min: null, max: null };
  loc.leeftijdMin = age.min;
  loc.leeftijdMax = age.max;
  // Alleen toevoegen als het veld nog niet bestaat
  if (!("openingHours" in loc)) {
    loc.openingHours = null;
  }
}

writeFileSync(path, JSON.stringify(locs, null, 2) + "\n");
console.log(`Klaar! ${locs.length} locaties bijgewerkt.`);
