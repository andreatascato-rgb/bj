import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

function iconSvg(size) {
  const rx = Math.round(size * 0.22);
  const inner = Math.round(size * 0.14);
  const innerSize = Math.round(size * 0.72);
  const irx = Math.round(size * 0.14);
  const font = Math.round(size * 0.34);
  const ty = Math.round(size * 0.62);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${rx}" fill="#041611"/>
      <rect x="${inner}" y="${inner}" width="${innerSize}" height="${innerSize}" rx="${irx}" fill="#0C3D2F"/>
      <text x="${size / 2}" y="${ty}" text-anchor="middle" font-family="Georgia, serif" font-size="${font}" font-weight="600" fill="#E0B86A">M</text>
    </svg>`,
  );
}

function maskableSvg(size) {
  const font = Math.round(size * 0.28);
  const ty = Math.round(size * 0.58);
  const pad = Math.round(size * 0.18);
  const box = Math.round(size * 0.64);
  const rx = Math.round(size * 0.12);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#041611"/>
      <rect x="${pad}" y="${pad}" width="${box}" height="${box}" rx="${rx}" fill="#0C3D2F"/>
      <text x="${size / 2}" y="${ty}" text-anchor="middle" font-family="Georgia, serif" font-size="${font}" font-weight="600" fill="#E0B86A">M</text>
    </svg>`,
  );
}

await sharp(iconSvg(192)).png().toFile(path.join(dir, "icon-192.png"));
await sharp(iconSvg(512)).png().toFile(path.join(dir, "icon-512.png"));
await sharp(iconSvg(180)).png().toFile(path.join(dir, "apple-touch-icon.png"));
await sharp(maskableSvg(512)).png().toFile(path.join(dir, "icon-512-maskable.png"));
console.log("icons ok");
