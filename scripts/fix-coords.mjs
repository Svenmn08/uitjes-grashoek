import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const locPath = join(__dirname, "../src/data/locations.json");
const locs = JSON.parse(readFileSync(locPath, "utf8"));

// Gecorrigeerde coördinaten op basis van verificatie
const fixes = {
  1:  { lat: 51.347,  lng: 5.955  }, // Beringerbos Panningen — was 2km te ver noord
  4:  { lat: 51.384,  lng: 6.188  }, // Ballorig Venlo — generieke Venlo coords waren fout
  5:  { lat: 51.3848, lng: 6.1895 }, // Monkey Town Boekend — zelfde industrieterrein als Ballorig
  7:  { lat: 51.383,  lng: 5.976  }, // Schatberg Zwembad — 2.8km te ver noord
  8:  { lat: 51.457,  lng: 5.953  }, // Meerdal Zwembad Center Parcs — 4km te ver oost
  9:  { lat: 51.449,  lng: 5.963  }, // Limburgse Peel Center Parcs — 3km te ver oost
  10: { lat: 51.347,  lng: 5.955  }, // Beringerzand Zwembad — zelfde adres als id 1
  13: { lat: 51.375,  lng: 6.061  }, // BreeBronne Maasbree — licht verschoven
  14: { lat: 51.398,  lng: 5.984  }, // Toverland — 800m te ver noord
  15: { lat: 51.2687, lng: 6.0769 }, // BillyBird Park Drakenrijk — 1.6km noord, 4.4km oost fout
  16: { lat: 51.471,  lng: 6.184  }, // Kasteeltuinen Arcen — 1.3km te ver noord
  17: { lat: 51.3377, lng: 6.1641 }, // Klein Zwitserland Tegelen — 3.9km te ver noord
  23: { lat: 51.5404, lng: 5.9945 }, // Boegafun Venray — beide assen verschoven
  27: { lat: 51.357,  lng: 6.171  }, // Speeltuin Hagerweike — 1.5km te ver west
  28: { lat: 51.277,  lng: 5.930  }, // Leistert Zwembad Roggel — 1.4km te ver oost
  29: { lat: 51.2728, lng: 5.9287 }, // E-village Roggel — zelfde offset als id 28
  34: { lat: 51.120,  lng: 6.036  }, // Alpacafarm Puthof — licht verschoven
  36: { lat: 51.277,  lng: 5.777  }, // Openlucht Museum Eynderhoof — 1.9km te ver west
  37: { lat: 51.577,  lng: 5.940  }, // Zooparc Overloon — 3.3km te ver west
  43: { lat: 51.378,  lng: 5.983  }, // Cascara Gril — 3km te ver noord (was Schatberg coords)
  44: { lat: 51.381,  lng: 5.975  }, // ABC Restaurant Sevenum — zelfde fout als id 43
  45: { lat: 51.383,  lng: 5.976  }, // Schatberg Restaurant — 2.8km te ver noord
  47: { lat: 51.380,  lng: 5.985  }, // La Place Sevenum — 3km te ver noord
};

let count = 0;
for (const loc of locs) {
  const fix = fixes[loc.id];
  if (fix) {
    console.log(`[${loc.id}] ${loc.name}: (${loc.lat}, ${loc.lng}) → (${fix.lat}, ${fix.lng})`);
    loc.lat = fix.lat;
    loc.lng = fix.lng;
    count++;
  }
}

writeFileSync(locPath, JSON.stringify(locs, null, 2) + "\n");
console.log(`\nKlaar: ${count} locaties gecorrigeerd.`);
