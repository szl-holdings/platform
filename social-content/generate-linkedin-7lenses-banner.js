#!/usr/bin/env node
/**
 * LinkedIn Banner — 7 Lenses of Business Observability
 * =====================================================
 * Generates a 1584×396 PNG optimised for LinkedIn profile headers.
 *
 * Design: SZL Holdings identity (left) + 7 Lenses hexagonal system (right)
 *         Dark background, gold/cyan accents, node-link network texture.
 *
 * Dependency: sharp  (SVG → PNG renderer, no native canvas needed)
 *   Install:  npm install -g sharp
 *   Run:      NODE_PATH=$(npm root -g) node social-content/generate-linkedin-7lenses-banner.js
 *
 * Output: social-content/banners/linkedin-7-lenses-banner.png
 */
'use strict';

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const W = 1584;
const H = 396;

const OUTPUT_DIR = path.join(__dirname, 'banners');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const COLORS = {
  bg:       '#0a0a0f',
  bgCard:   '#12121a',
  bgBox:    '#1a1a2e',
  cyan:     '#00d4ff',
  cyanDim:  '#0099bb',
  gold:     '#c8a84e',
  goldDim:  '#9a7a2e',
  white:    '#ffffff',
  lgray:    '#cccccc',
  mgray:    '#888888',
  dgray:    '#2a2a3a',
};

const LENSES = [
  { id: 'financial_health',   label: 'Financial Health',   abbr: 'FH', color: '#4caf84' },
  { id: 'operational_risk',   label: 'Operational Risk',   abbr: 'OR', color: '#e05a4a' },
  { id: 'growth_velocity',    label: 'Growth Velocity',    abbr: 'GV', color: '#4a9fd4' },
  { id: 'customer_sentiment', label: 'Customer Sentiment', abbr: 'CS', color: '#d4a054' },
  { id: 'compliance_drift',   label: 'Compliance Drift',   abbr: 'CD', color: '#8b7ad8' },
  { id: 'talent_stability',   label: 'Talent Stability',   abbr: 'TS', color: '#5ab8c8' },
  { id: 'market_position',    label: 'Market Position',    abbr: 'MP', color: '#c8953c' },
];

const PLATFORMS = [
  { name: 'Lyte',       color: '#00d4ff' },
  { name: 'Alloy',      color: '#4a7ad8' },
  { name: 'Aegis',      color: '#e07a24' },
  { name: 'Terra',      color: '#3aba6a' },
  { name: 'Vessels',    color: '#2a5ab8' },
  { name: 'Carlota Jo', color: '#c8a84e' },
];

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildNodeLines(nodeList) {
  const lines = [];
  for (let i = 0; i < nodeList.length; i++) {
    for (let j = i + 1; j < nodeList.length; j++) {
      const dx = nodeList[i].x - nodeList[j].x;
      const dy = nodeList[i].y - nodeList[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < W * 0.22) {
        lines.push(`<line x1="${nodeList[i].x.toFixed(1)}" y1="${nodeList[i].y.toFixed(1)}" x2="${nodeList[j].x.toFixed(1)}" y2="${nodeList[j].y.toFixed(1)}" stroke="${COLORS.gold}" stroke-width="0.6" opacity="0.07"/>`);
      }
    }
  }
  return lines.join('\n');
}

function buildNodeDots(nodeList) {
  return nodeList.map(n =>
    `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="2.5" fill="${COLORS.gold}" opacity="0.22"/>`
  ).join('\n');
}

function buildGridLines() {
  const lines = [];
  for (let x = 0; x <= W; x += 48) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${COLORS.cyan}" stroke-width="0.3" opacity="0.035"/>`);
  }
  for (let y = 0; y <= H; y += 48) {
    lines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${COLORS.cyan}" stroke-width="0.3" opacity="0.035"/>`);
  }
  return lines.join('\n');
}

function buildLensHexagon(cx, cy, r, color) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return `<polygon points="${points.join(' ')}" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1" stroke-opacity="0.55"/>`;
}

function lensAbbrGlyph(cx, cy, abbr, color) {
  return `<text x="${cx}" y="${cy + 5}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="12" font-weight="700" fill="${color}" opacity="0.9">${abbr}</text>`;
}

function buildLenses() {
  const parts = [];
  const COUNT = LENSES.length;
  const panelX = 560;
  const panelW = W - panelX - 40;
  const hexR  = 34;
  const colCount = 4;
  const rowCount = 2;
  const cellW = panelW / colCount;
  const cellH = (H - 60) / rowCount;

  const positions = [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 2, row: 0 },
    { col: 3, row: 0 },
    { col: 0.5, row: 1 },
    { col: 1.5, row: 1 },
    { col: 2.5, row: 1 },
  ];

  LENSES.forEach((lens, idx) => {
    const pos = positions[idx];
    const cx = panelX + pos.col * cellW + cellW / 2;
    const cy = 48 + pos.row * cellH + cellH / 2 - 8;

    parts.push(buildLensHexagon(cx, cy, hexR, lens.color));
    parts.push(lensAbbrGlyph(cx, cy, lens.abbr, lens.color));

    const labelY = cy + hexR + 14;
    const words = lens.label.split(' ');
    if (words.length === 2) {
      parts.push(`<text x="${cx.toFixed(1)}" y="${(labelY - 5).toFixed(1)}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9.5" font-weight="500" fill="${lens.color}" opacity="0.85">${words[0]}</text>`);
      parts.push(`<text x="${cx.toFixed(1)}" y="${(labelY + 7).toFixed(1)}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9.5" font-weight="500" fill="${lens.color}" opacity="0.85">${words[1]}</text>`);
    } else {
      parts.push(`<text x="${cx.toFixed(1)}" y="${(labelY + 1).toFixed(1)}" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="9.5" font-weight="500" fill="${lens.color}" opacity="0.85">${lens.label}</text>`);
    }
  });

  return parts.join('\n');
}

function buildPlatformRow() {
  const parts = [];
  const startX = 310;
  let x = startX;
  const y = H - 22;

  PLATFORMS.forEach((p) => {
    const dotR = 4;
    parts.push(`<circle cx="${(x + dotR).toFixed(1)}" cy="${(y - 1).toFixed(1)}" r="${dotR}" fill="${p.color}" opacity="0.88"/>`);
    parts.push(`<text x="${(x + dotR * 2 + 7).toFixed(1)}" y="${(y + 4).toFixed(1)}" font-family="Helvetica,Arial,sans-serif" font-size="11" font-weight="500" fill="${COLORS.lgray}" opacity="0.72">${p.name}</text>`);
    x += p.name.length * 7.2 + 30;
  });

  return parts.join('\n');
}

function buildSvg() {
  const rng = seededRandom(42);
  const nodeCount = 28;
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: 40 + rng() * (W - 80),
      y: 20 + rng() * (H - 40),
    });
  }

  const lensPanel = {
    x: 548,
    y: 0,
    w: W - 548,
    h: H,
  };

  const dividerX = 540;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="55%" stop-color="#0d0d16"/>
      <stop offset="100%" stop-color="#0f0f1e"/>
    </linearGradient>
    <linearGradient id="goldFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${COLORS.gold}" stop-opacity="0"/>
      <stop offset="30%" stop-color="${COLORS.gold}" stop-opacity="0.18"/>
      <stop offset="70%" stop-color="${COLORS.gold}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${COLORS.gold}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="cyanFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${COLORS.cyan}" stop-opacity="0"/>
      <stop offset="30%" stop-color="${COLORS.cyan}" stop-opacity="0.18"/>
      <stop offset="70%" stop-color="${COLORS.cyan}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${COLORS.cyan}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="goldGlow" cx="25%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${COLORS.gold}" stop-opacity="0.09"/>
      <stop offset="100%" stop-color="${COLORS.gold}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="cyanGlow" cx="80%" cy="50%" r="55%">
      <stop offset="0%" stop-color="${COLORS.cyan}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${COLORS.cyan}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="dividerGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${COLORS.gold}" stop-opacity="0.5"/>
      <stop offset="50%" stop-color="${COLORS.cyan}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${COLORS.gold}" stop-opacity="0.5"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="bannerClip">
      <rect width="${W}" height="${H}" rx="0"/>
    </clipPath>
  </defs>

  <g clip-path="url(#bannerClip)">

    <!-- Background -->
    <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
    <rect width="${W}" height="${H}" fill="url(#goldGlow)"/>
    <rect width="${W}" height="${H}" fill="url(#cyanGlow)"/>

    <!-- Grid texture -->
    ${buildGridLines()}

    <!-- Node network -->
    ${buildNodeLines(nodes)}
    ${buildNodeDots(nodes)}

    <!-- Top edge bar -->
    <rect x="0" y="0" width="${W}" height="3" fill="url(#cyanFade)"/>

    <!-- Bottom edge bar -->
    <rect x="0" y="${H - 3}" width="${W}" height="3" fill="url(#goldFade)"/>

    <!-- === LEFT PANEL: SZL HOLDINGS IDENTITY === -->

    <!-- Logo mark: stylised S hexagon -->
    <polygon points="64,40 94,40 110,68 94,96 64,96 48,68" fill="none" stroke="${COLORS.gold}" stroke-width="1.5" opacity="0.9"/>
    <polygon points="69,48 89,48 99,65 89,82 69,82 59,65" fill="${COLORS.gold}" fill-opacity="0.08"/>
    <text x="79" y="73" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="22" font-weight="700" fill="${COLORS.gold}" opacity="0.95">S</text>

    <!-- SZL HOLDINGS wordmark -->
    <text x="124" y="64" font-family="Helvetica,Arial,sans-serif" font-size="26" font-weight="700" letter-spacing="3" fill="${COLORS.white}" opacity="0.97">SZL HOLDINGS</text>

    <!-- Subtitle -->
    <text x="124" y="84" font-family="Helvetica,Arial,sans-serif" font-size="11" font-weight="400" letter-spacing="2" fill="${COLORS.gold}" opacity="0.78">TECHNOLOGY HOLDING COMPANY</text>

    <!-- Domain: szlholdings.com -->
    <text x="124" y="104" font-family="Helvetica,Arial,sans-serif" font-size="10" font-weight="400" fill="${COLORS.mgray}" opacity="0.85">szlholdings.com</text>

    <!-- Thin gold separator rule under identity -->
    <line x1="48" y1="116" x2="500" y2="116" stroke="${COLORS.gold}" stroke-width="0.6" opacity="0.2"/>

    <!-- === FRAMEWORK HEADLINE === -->
    <text x="48" y="162" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="0.5" fill="${COLORS.white}" opacity="0.97">7 Lenses of Business</text>
    <text x="48" y="197" font-family="Helvetica,Arial,sans-serif" font-size="30" font-weight="700" letter-spacing="0.5" fill="${COLORS.white}" opacity="0.97">Observability</text>

    <!-- Cyan accent line next to headline -->
    <rect x="48" y="204" width="240" height="2" fill="${COLORS.cyan}" opacity="0.45" rx="1"/>

    <!-- Proprietary label -->
    <text x="48" y="230" font-family="Helvetica,Arial,sans-serif" font-size="11" font-weight="500" letter-spacing="2.5" fill="${COLORS.cyan}" opacity="0.75">PROPRIETARY FRAMEWORK</text>

    <!-- Tagline -->
    <text x="48" y="260" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="${COLORS.lgray}" opacity="0.58">See every dimension of business health.</text>
    <text x="48" y="278" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="${COLORS.lgray}" opacity="0.58">Act with precision. Compete with intelligence.</text>

    <!-- === DIVIDER LINE === -->
    <line x1="${dividerX}" y1="16" x2="${dividerX}" y2="${H - 16}" stroke="url(#dividerGrad)" stroke-width="1" opacity="0.7"/>

    <!-- === RIGHT PANEL: 7 LENSES VISUAL SYSTEM === -->

    <!-- Panel label -->
    <text x="${dividerX + 20}" y="30" font-family="Helvetica,Arial,sans-serif" font-size="9" font-weight="700" letter-spacing="3" fill="${COLORS.gold}" opacity="0.6">THE 7 LENSES</text>

    <!-- Lens hexagons + labels -->
    ${buildLenses()}

    <!-- === BOTTOM PLATFORM ROW === -->

    <!-- Thin separator above platform row -->
    <line x1="48" y1="${H - 42}" x2="${W - 40}" y2="${H - 42}" stroke="${COLORS.dgray}" stroke-width="0.5" opacity="0.6"/>

    <!-- Platform ecosystem label -->
    <text x="48" y="${H - 22}" font-family="Helvetica,Arial,sans-serif" font-size="9" letter-spacing="1.5" fill="${COLORS.mgray}" opacity="0.55">PORTFOLIO ECOSYSTEM ·</text>

    <!-- Platform dots + names -->
    ${buildPlatformRow()}

    <!-- Corner glow accent top-left -->
    <radialGradient id="tlGlow" cx="0" cy="0" r="300" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${COLORS.gold}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${COLORS.gold}" stop-opacity="0"/>
    </radialGradient>
    <rect width="${W}" height="${H}" fill="url(#tlGlow)"/>

  </g>
</svg>`;
}

async function main() {
  const svg = buildSvg();
  const svgPath  = path.join(OUTPUT_DIR, 'linkedin-7-lenses-banner.svg');
  const pngPath  = path.join(OUTPUT_DIR, 'linkedin-7-lenses-banner.png');

  fs.writeFileSync(svgPath, svg, 'utf8');
  console.log(`SVG written: ${svgPath}`);

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: false })
    .toFile(pngPath);

  const stat = fs.statSync(pngPath);
  console.log(`PNG generated: ${pngPath} (${(stat.size / 1024).toFixed(1)} KB)`);

  const meta = await sharp(pngPath).metadata();
  console.log(`Dimensions: ${meta.width}x${meta.height}px`);

  fs.unlinkSync(svgPath);
}

main().catch(err => {
  console.error('Error generating banner:', err);
  process.exit(1);
});
