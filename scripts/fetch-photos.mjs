/**
 * Haalt og:image foto's op van de website van elke locatie.
 * Slaat op in public/fotos/{id}.jpg en werkt locations.json bij.
 * Draaien: node scripts/fetch-photos.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const locPath = join(__dirname, "../src/data/locations.json");
const fotosDir = join(__dirname, "../public/fotos");

if (!existsSync(fotosDir)) mkdirSync(fotosDir, { recursive: true });

const locs = JSON.parse(readFileSync(locPath, "utf8"));

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,*/*",
};

async function fetchOgImage(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, { signal: ctrl.signal, headers: HEADERS, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();

    // Probeer verschillende og:image varianten
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+property=["']og:image:url["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ];

    for (const pat of patterns) {
      const m = html.match(pat);
      if (m?.[1]) {
        let imgUrl = m[1].trim();
        if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
        else if (imgUrl.startsWith("/")) {
          const base = new URL(url);
          imgUrl = base.origin + imgUrl;
        }
        // Skip SVG en data URLs
        if (imgUrl.startsWith("data:") || imgUrl.endsWith(".svg")) continue;
        return imgUrl;
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function downloadImage(url, dest) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, { signal: ctrl.signal, headers: HEADERS, redirect: "follow" });
    clearTimeout(t);
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image")) return false;
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 5000) return false; // te klein = waarschijnlijk fout
    writeFileSync(dest, Buffer.from(buf));
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let updated = 0;
let skipped = 0;
let failed = 0;

for (const loc of locs) {
  if (loc.photo) {
    console.log(`[${loc.id}] ${loc.name}: al foto aanwezig, overgeslagen`);
    skipped++;
    continue;
  }
  if (!loc.website) {
    console.log(`[${loc.id}] ${loc.name}: geen website`);
    skipped++;
    continue;
  }

  process.stdout.write(`[${loc.id}] ${loc.name}: `);

  const imgUrl = await fetchOgImage(loc.website);
  if (!imgUrl) {
    console.log("geen og:image gevonden");
    failed++;
    await sleep(300);
    continue;
  }

  const dest = join(fotosDir, `${loc.id}.jpg`);
  const ok = await downloadImage(imgUrl, dest);

  if (ok) {
    loc.photo = `/fotos/${loc.id}.jpg`;
    console.log(`✓  ${imgUrl.slice(0, 80)}`);
    updated++;
  } else {
    console.log(`✗  downloaden mislukt: ${imgUrl.slice(0, 60)}`);
    failed++;
  }

  await sleep(400);
}

writeFileSync(locPath, JSON.stringify(locs, null, 2) + "\n");
console.log(`\nKlaar: ${updated} foto's opgeslagen, ${skipped} overgeslagen, ${failed} mislukt.`);
