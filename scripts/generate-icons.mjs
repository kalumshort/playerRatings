// Regenerate the app icons from the brand master.
//
// Run from the repo root:  node <this file>
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const MASTER = "public/assets/logo/11Votes_Icon_Blue.png";

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Trim the transparent margin off the master, then letterbox back to a square.
 *
 * The master is 1024x1008 — not square — so resizing it straight into a square
 * favicon would squash the mark. `fit: "contain"` keeps the aspect and pads.
 */
async function square(size, { background } = {}) {
  const trimmed = await sharp(MASTER).trim().toBuffer();

  // A little breathing room stops a browser's own rounded-corner masking from
  // clipping the mark's white outline — but only where there are pixels to
  // spare. At 16px a 1px border is 12% of the icon, so those go full bleed.
  const scale = size >= 64 ? 0.92 : 1;
  const inner = Math.round(size * scale);
  const pad = Math.floor((size - inner) / 2);

  const squared = await sharp(trimmed)
    .resize(inner, inner, { fit: "contain", background: TRANSPARENT })
    .extend({
      top: pad,
      bottom: size - inner - pad,
      left: pad,
      right: size - inner - pad,
      background: TRANSPARENT,
    })
    .png()
    .toBuffer();

  // A second pass, because sharp applies `flatten` earlier in its pipeline
  // than `extend` — flattening in the chain above would be undone by the
  // transparent extend that follows it.
  const out = background
    ? sharp(squared).flatten({ background })
    : sharp(squared);

  return out.png({ compressionLevel: 9 }).toBuffer();
}

/**
 * Assemble a real .ico. Sharp cannot write the container, but ICO has allowed
 * PNG-compressed entries since Vista and every browser in use reads them.
 */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;

  entries.forEach(({ size, buf }, i) => {
    const e = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, e + 0); // width (0 == 256)
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1); // height
    dir.writeUInt8(0, e + 2); // palette size
    dir.writeUInt8(0, e + 3); // reserved
    dir.writeUInt16LE(1, e + 4); // colour planes
    dir.writeUInt16LE(32, e + 6); // bits per pixel
    dir.writeUInt32LE(buf.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.buf)]);
}

const ico = buildIco(
  await Promise.all(
    [16, 32, 48].map(async (size) => ({ size, buf: await square(size, {}) })),
  ),
);
writeFileSync("src/app/favicon.ico", ico);

// Transparent: tab strips are light in one theme and dark in the other.
writeFileSync("src/app/icon.png", await square(192, {}));

// Opaque white: iOS composites an alpha touch icon onto black, which would
// put the mark's white outline on a black tile.
writeFileSync(
  "src/app/apple-icon.png",
  await square(180, { background: "#ffffff" }),
);

console.log("favicon.ico  ", ico.length, "bytes (16, 32, 48)");
for (const f of ["src/app/icon.png", "src/app/apple-icon.png"]) {
  const m = await sharp(f).metadata();
  console.log(f.padEnd(22), `${m.width}x${m.height}`, m.hasAlpha ? "RGBA" : "RGB");
}
