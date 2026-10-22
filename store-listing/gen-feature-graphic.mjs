import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const W = 1024, H = 500;
const CENTER_X = 210, CENTER_Y = 250;
const RING_R = 92;
const RING_WIDTH = 34;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;
const QUARTER = CIRCUMFERENCE / 4;
const GAP = 16;
const DASH = QUARTER - GAP;
const DASHARRAY = `${DASH.toFixed(2)} ${(CIRCUMFERENCE - DASH).toFixed(2)}`;

const PETALS = [
  { color: '#e63946', offset: 0 },
  { color: '#f1c453', offset: -QUARTER },
  { color: '#2a9d8f', offset: -QUARTER * 2 },
  { color: '#457b9d', offset: -QUARTER * 3 },
];

const petals = PETALS.map(
  ({ color, offset }) => `
    <circle
      cx="${CENTER_X}" cy="${CENTER_Y}" r="${RING_R}"
      fill="none" stroke="${color}" stroke-width="${RING_WIDTH}"
      stroke-linecap="round"
      stroke-dasharray="${DASHARRAY}"
      stroke-dashoffset="${offset.toFixed(2)}"
      transform="rotate(-45 ${CENTER_X} ${CENTER_Y})"
    />`
).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg-grad" cx="30%" cy="35%" r="90%">
      <stop offset="0%" stop-color="#201a45" />
      <stop offset="45%" stop-color="#121521" />
      <stop offset="100%" stop-color="#05060a" />
    </radialGradient>
    <radialGradient id="glow-purple" cx="18%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#6c5ce7" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#6c5ce7" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow-cyan" cx="88%" cy="80%" r="55%">
      <stop offset="0%" stop-color="#48dbfb" stop-opacity="0.28" />
      <stop offset="100%" stop-color="#48dbfb" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="center-dot" cx="38%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#dfe3ea" />
    </radialGradient>
    <filter id="soft-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
    <style>
      .title { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 800; }
      .tagline { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 400; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg-grad)" />
  <rect width="${W}" height="${H}" fill="url(#glow-purple)" />
  <rect width="${W}" height="${H}" fill="url(#glow-cyan)" />

  <g filter="url(#soft-glow)" opacity="0.9">${petals}</g>
  <g>${petals}</g>
  <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="58" fill="#ffffff" opacity="0.16" filter="url(#soft-glow)" />
  <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="48" fill="url(#center-dot)" />

  <text x="430" y="248" class="title" font-size="92" fill="#f2f3f5">Pulsit</text>
  <text x="432" y="300" class="tagline" font-size="30" fill="#9aa3b2">Memorizá. Repetí. Superá cada fase.</text>
</svg>`;

// Se rasteriza a alta densidad y luego se reduce a 1024×500 exactos (texto más nítido), sin canal
// alfa: Play Console exige el feature graphic en PNG de 24 bits o JPEG.
const png = await sharp(Buffer.from(svg), { density: 384 })
  .resize(W, H)
  .flatten({ background: '#05060a' })
  .png()
  .toBuffer();
await writeFile(new URL('./feature-graphic.png', import.meta.url), png);
console.log('Listo:', png.length, 'bytes');
