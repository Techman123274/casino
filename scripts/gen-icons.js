const fs = require("fs");
const path = require("path");

function createIcon(size) {
  const half = size / 2;
  const r = Math.round(size * 0.12);
  const fontSize = Math.round(size * 0.45);
  const textY = Math.round(half + fontSize * 0.35);
  const inner = size - 8;
  const innerR = r - 2;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `  <rect width="${size}" height="${size}" rx="${r}" fill="#020202"/>`,
    `  <rect x="4" y="4" width="${inner}" height="${inner}" rx="${innerR}" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.3"/>`,
    `  <text x="${half}" y="${textY}" text-anchor="middle" fill="#FFD700" font-family="Inter,system-ui,sans-serif" font-weight="900" font-size="${fontSize}">R</text>`,
    `</svg>`,
  ].join("\n");
}

const pubDir = path.join(__dirname, "..", "public");

fs.writeFileSync(path.join(pubDir, "icons", "icon-192.svg"), createIcon(192));
fs.writeFileSync(path.join(pubDir, "icons", "icon-512.svg"), createIcon(512));
fs.writeFileSync(path.join(pubDir, "apple-touch-icon.svg"), createIcon(180));

console.log("PWA icons generated.");
