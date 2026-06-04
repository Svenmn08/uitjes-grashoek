import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = (crc >>> 8) ^ t[(crc ^ b) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(d.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, crcBuf]);
}

// Solid color PNG with a white tree emoji-style shape painted in pixels
function makePNG(size, bgR, bgG, bgB, fgR, fgG, fgB) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const pad = size * 0.12;
  const cx = size / 2;
  const cy = size / 2;

  // Simple design: big circle (crown) + small rect (trunk)
  const crownR = size * 0.36;
  const trunkW = size * 0.1;
  const trunkH = size * 0.22;
  const trunkTop = cy + crownR * 0.5;

  const rowLen = 1 + size * 3;
  const raw = Buffer.allocUnsafe(size * rowLen);

  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const inCrown = dx * dx + dy * dy <= crownR * crownR;
      const inTrunk =
        x >= cx - trunkW / 2 &&
        x <= cx + trunkW / 2 &&
        y >= trunkTop &&
        y <= trunkTop + trunkH;
      const fg = inCrown || inTrunk;
      const i = y * rowLen + 1 + x * 3;
      raw[i] = fg ? fgR : bgR;
      raw[i + 1] = fg ? fgG : bgG;
      raw[i + 2] = fg ? fgB : bgB;
    }
  }

  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const outDir = join(__dirname, "../public/icons");
mkdirSync(outDir, { recursive: true });

// Green background (#3d5228), white tree
const BG = [61, 82, 40];
const FG = [255, 255, 255];

for (const size of [180, 192, 512]) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  writeFileSync(join(outDir, name), makePNG(size, ...BG, ...FG));
  console.log(`${name} (${size}x${size})`);
}

console.log("\nKlaar!");
