/**
 * SZL Holdings — LinkedIn Investor Carousel Generator
 * Produces 10 slides (1080×1080px JPG) + a single PDF
 * Uses Playwright + system Chromium for headless rendering
 *
 * Images are embedded as base64 data URLs to avoid file:// URL restrictions
 * in headless Chromium contexts.
 */
// Resolve Playwright: try standard import first, then known pnpm store locations
let chromium;
const PLAYWRIGHT_CANDIDATES = [
  'playwright',
  // Replit pnpm store (version may vary; glob the store if needed)
  '/home/runner/workspace/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs',
  '/home/runner/workspace/node_modules/playwright/index.mjs',
];
for (const candidate of PLAYWRIGHT_CANDIDATES) {
  try {
    ({ chromium } = await import(candidate));
    break;
  } catch {
    /* try next */
  }
}
if (!chromium) {
  throw new Error(
    'Could not resolve Playwright. Run: pnpm add -D playwright && npx playwright install chromium',
  );
}

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const OUTPUT_DIR = path.join(__dirname, 'carousel-slides');
const PDF_OUT = path.join(__dirname, 'szl-holdings-investor-carousel.pdf');

const W = 1080;
const H = 1080;

// ─── IMAGE LOADING ────────────────────────────────────────────────────────────

async function loadDataUrl(filename) {
  const fullPath = path.join(SCREENSHOTS_DIR, filename);
  const data = await fs.readFile(fullPath);
  const ext = path.extname(filename).replace('.', '');
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  return `data:${mime};base64,${data.toString('base64')}`;
}

// ─── FONT FALLBACK (no Google Fonts in headless) ─────────────────────────────
// We embed Inter-like styles using system fonts as fallback

const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${W}px;
    height: ${H}px;
    overflow: hidden;
    background: #080a10;
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    color: #ffffff;
  }
  .slide {
    width: ${W}px;
    height: ${H}px;
    position: relative;
    overflow: hidden;
  }
  .serif { font-family: Georgia, 'Times New Roman', serif; }
`;

// ─── SLIDE BUILDERS ───────────────────────────────────────────────────────────

function slide01Cover() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 120% 80% at 50% 60%, #0d111e 0%, #080a10 100%);
    }
    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .glow {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 640px; height: 640px;
      background: radial-gradient(ellipse, rgba(34,211,238,0.09) 0%, transparent 70%);
    }
    .content {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 80px;
      text-align: center;
    }
    .monogram {
      font-size: 52px; font-weight: 900;
      letter-spacing: 14px;
      color: #22d3ee;
      margin-bottom: 48px;
      text-transform: uppercase;
    }
    .accent-line {
      width: 48px; height: 3px;
      background: #22d3ee;
      margin: 0 auto 36px;
    }
    h1 {
      font-size: 62px; line-height: 1.1;
      letter-spacing: -1.5px; font-weight: 800;
      color: #fff;
      max-width: 860px;
      margin-bottom: 36px;
    }
    .sub {
      font-size: 16px; font-weight: 400;
      letter-spacing: 5px; text-transform: uppercase;
      color: rgba(255,255,255,0.35);
    }
    .cta {
      font-size: 15px; font-weight: 500;
      color: rgba(255,255,255,0.28);
      letter-spacing: 1px;
      position: absolute;
      bottom: 50px; right: 64px;
    }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="grid"></div>
    <div class="glow"></div>
    <div class="content">
      <div class="monogram">SZL</div>
      <div class="accent-line"></div>
      <h1>One Founder. Eleven Systems. One Compounding Architecture.</h1>
      <div class="sub">SZL Holdings &nbsp;&middot;&nbsp; 2026</div>
    </div>
    <div class="cta">Swipe to see the full ecosystem &rarr;</div>
  </div></body></html>`;
}

function slide02Thesis() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #080c18 0%, #080a10 60%);
    }
    .left-bar {
      position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
      background: linear-gradient(180deg, #c9a227 0%, transparent 100%);
    }
    .content {
      position: absolute; inset: 0;
      display: grid; grid-template-columns: 1fr 260px; gap: 0;
      padding: 100px 80px 100px 100px;
      align-items: center;
    }
    h1 {
      font-size: 50px; line-height: 1.18; font-weight: 800;
      color: #fff; margin-bottom: 32px;
    }
    h1 em { font-style: normal; color: #c9a227; }
    p { font-size: 18px; line-height: 1.7; color: rgba(255,255,255,0.5); max-width: 520px; }
    p em { font-style: normal; color: #c9a227; }
    .industries {
      display: flex; flex-direction: column; gap: 24px;
      padding-left: 48px;
      border-left: 1px solid rgba(255,255,255,0.08);
    }
    .ind { display: flex; align-items: center; gap: 16px; }
    .ind-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .ind-label {
      font-size: 13px; font-weight: 700;
      letter-spacing: 2.5px; text-transform: uppercase;
      color: rgba(255,255,255,0.7);
    }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="left-bar"></div>
    <div class="content">
      <div>
        <h1>Most founders build one product. We built the operating system for <em>five industries.</em></h1>
        <p>Each platform is production-grade. Each shares a single intelligence layer. Every signal flows back to the center.<br><br>This is what <em>compounding</em> looks like at the architecture level.</p>
      </div>
      <div class="industries">
        <div class="ind"><div class="ind-dot" style="background:#ef4444"></div><div class="ind-label">Defense</div></div>
        <div class="ind"><div class="ind-dot" style="background:#0ea5e9"></div><div class="ind-label">Maritime</div></div>
        <div class="ind"><div class="ind-dot" style="background:#10b981"></div><div class="ind-label">Real Estate</div></div>
        <div class="ind"><div class="ind-dot" style="background:#8b5cf6"></div><div class="ind-label">Legal</div></div>
        <div class="ind"><div class="ind-dot" style="background:#c9a227"></div><div class="ind-label">Advisory</div></div>
      </div>
    </div>
  </div></body></html>`;
}

function slide03SzlDashboard(imgData) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg { position: absolute; inset: 0; background: #080a10; }
    .screenshot-wrapper {
      position: absolute;
      right: -24px; top: 50%; transform: translateY(-50%);
      width: 580px; height: 580px;
      border-radius: 14px; overflow: hidden;
      box-shadow: -60px 0 140px rgba(34,211,238,0.12);
      border: 1px solid rgba(34,211,238,0.18);
    }
    .screenshot-wrapper img {
      width: 100%; height: 100%;
      object-fit: cover; object-position: top left;
    }
    .overlay-fade {
      position: absolute; right: 556px; top: 0; bottom: 0; width: 200px;
      background: linear-gradient(90deg, #080a10 30%, transparent 100%);
    }
    .content {
      position: absolute; top: 0; left: 0; bottom: 0; width: 560px;
      display: flex; flex-direction: column; justify-content: center;
      padding: 80px 48px 80px 84px;
    }
    .app-tag { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #22d3ee; margin-bottom: 22px; }
    h1 { font-size: 40px; line-height: 1.18; font-weight: 800; color: #fff; margin-bottom: 20px; }
    .flow { font-size: 12px; font-weight: 700; letter-spacing: 3px; color: #22d3ee; margin-bottom: 28px; }
    p { font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.5); margin-bottom: 36px; }
    .metrics { display: flex; flex-direction: column; gap: 13px; }
    .metric { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(255,255,255,0.65); }
    .metric::before { content: ''; display: block; width: 6px; height: 6px; border-radius: 50%; background: #22d3ee; flex-shrink: 0; }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="screenshot-wrapper"><img src="${imgData}" alt="SZL Holdings Dashboard"></div>
    <div class="overlay-fade"></div>
    <div class="content">
      <div class="app-tag">SZL Holdings</div>
      <h1>Business Observability with Explainable Execution.</h1>
      <div class="flow">OBSERVE &rarr; UNDERSTAND &rarr; DECIDE &rarr; EXECUTE</div>
      <p>The parent command layer. Every subsidiary surfaces signals here. Every decision gets an audit trail. Nothing moves without explainable cause.</p>
      <div class="metrics">
        <div class="metric">Cross-platform signal aggregation</div>
        <div class="metric">Real-time anomaly detection</div>
        <div class="metric">Full decision audit log</div>
      </div>
    </div>
  </div></body></html>`;
}

function slide04Lyte(imgData) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg { position: absolute; inset: 0; background: linear-gradient(160deg, #0c0a07 0%, #080a10 60%); }
    .screenshot-wrapper {
      position: absolute; right: -24px; top: 50%; transform: translateY(-50%);
      width: 580px; height: 580px; border-radius: 14px; overflow: hidden;
      box-shadow: -60px 0 140px rgba(217,119,6,0.12);
      border: 1px solid rgba(217,119,6,0.22);
    }
    .screenshot-wrapper img { width: 100%; height: 100%; object-fit: cover; object-position: top left; }
    .overlay-fade { position: absolute; right: 556px; top: 0; bottom: 0; width: 200px; background: linear-gradient(90deg, #080a10 30%, transparent 100%); }
    .content { position: absolute; top: 0; left: 0; bottom: 0; width: 560px; display: flex; flex-direction: column; justify-content: center; padding: 80px 48px 80px 84px; }
    .app-tag { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #d97706; margin-bottom: 22px; }
    h1 { font-size: 38px; line-height: 1.2; font-weight: 800; font-style: italic; color: #fff; margin-bottom: 16px; }
    .tagline { font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(217,119,6,0.7); margin-bottom: 24px; }
    p { font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.5); margin-bottom: 36px; }
    .metrics { display: flex; flex-direction: column; gap: 13px; }
    .metric { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(255,255,255,0.65); }
    .metric::before { content: ''; display: block; width: 6px; height: 6px; border-radius: 50%; background: #d97706; flex-shrink: 0; }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="screenshot-wrapper"><img src="${imgData}" alt="Lyte Dashboard"></div>
    <div class="overlay-fade"></div>
    <div class="content">
      <div class="app-tag">Lyte &mdash; Business Observability Engine</div>
      <h1>"In the dark, let Lyte guide you."</h1>
      <div class="tagline">Revenue stalling. Approvals aging. Ownership gaps widening.</div>
      <p>By the time these surface as problems, the damage has already compounded. Lyte makes the invisible visible — before it costs you.</p>
      <div class="metrics">
        <div class="metric">Real-time pipeline health monitoring</div>
        <div class="metric">Approval workflow bottleneck detection</div>
        <div class="metric">Revenue risk scoring with explainable causality</div>
      </div>
    </div>
  </div></body></html>`;
}

function slide05Vessels(imgData) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg { position: absolute; inset: 0; background: linear-gradient(160deg, #05090f 0%, #080a10 60%); }
    .screenshot-wrapper {
      position: absolute; right: -24px; top: 50%; transform: translateY(-50%);
      width: 580px; height: 580px; border-radius: 14px; overflow: hidden;
      box-shadow: -60px 0 140px rgba(14,165,233,0.12);
      border: 1px solid rgba(14,165,233,0.18);
    }
    .screenshot-wrapper img { width: 100%; height: 100%; object-fit: cover; object-position: top left; }
    .overlay-fade { position: absolute; right: 556px; top: 0; bottom: 0; width: 200px; background: linear-gradient(90deg, #080a10 30%, transparent 100%); }
    .content { position: absolute; top: 0; left: 0; bottom: 0; width: 540px; display: flex; flex-direction: column; justify-content: center; padding: 80px 40px 80px 84px; }
    .app-tag { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #0ea5e9; margin-bottom: 20px; }
    .big-stat { font-size: 80px; font-weight: 900; color: #0ea5e9; line-height: 1; margin-bottom: 4px; }
    .stat-label { font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: rgba(14,165,233,0.6); margin-bottom: 24px; }
    h1 { font-size: 36px; line-height: 1.2; font-weight: 800; color: #fff; margin-bottom: 18px; }
    p { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.48); margin-bottom: 28px; }
    .metrics { display: flex; flex-direction: column; gap: 11px; }
    .metric { display: flex; align-items: center; gap: 12px; font-size: 13.5px; color: rgba(255,255,255,0.6); }
    .metric::before { content: ''; display: block; width: 6px; height: 6px; border-radius: 50%; background: #0ea5e9; flex-shrink: 0; }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="screenshot-wrapper"><img src="${imgData}" alt="Vessels Platform"></div>
    <div class="overlay-fade"></div>
    <div class="content">
      <div class="app-tag">Vessels &mdash; Maritime Intelligence Platform</div>
      <div class="big-stat">214</div>
      <div class="stat-label">Vessels Tracked. One Command Surface.</div>
      <h1>Fleet Operations. Decided Faster.</h1>
      <p>Positions, voyage economics, compliance, and exception management — unified for maritime operators who need answers, not dashboards.</p>
      <div class="metrics">
        <div class="metric">Live AIS position tracking across global fleets</div>
        <div class="metric">Voyage P&amp;L with port cost modeling</div>
        <div class="metric">Sanctions screening and compliance monitoring</div>
      </div>
    </div>
  </div></body></html>`;
}

function slide06Terra(imgData) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg { position: absolute; inset: 0; background: linear-gradient(160deg, #060e09 0%, #080a10 60%); }
    .screenshot-wrapper {
      position: absolute; right: -24px; top: 50%; transform: translateY(-50%);
      width: 580px; height: 580px; border-radius: 14px; overflow: hidden;
      box-shadow: -60px 0 140px rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.15);
    }
    .screenshot-wrapper img { width: 100%; height: 100%; object-fit: cover; object-position: top left; }
    .overlay-fade { position: absolute; right: 556px; top: 0; bottom: 0; width: 200px; background: linear-gradient(90deg, #080a10 30%, transparent 100%); }
    .content { position: absolute; top: 0; left: 0; bottom: 0; width: 540px; display: flex; flex-direction: column; justify-content: center; padding: 80px 40px 80px 84px; }
    .app-tag { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #10b981; margin-bottom: 22px; }
    h1 { font-size: 44px; line-height: 1.15; font-weight: 800; color: #fff; margin-bottom: 14px; }
    .tagline { font-size: 13px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(16,185,129,0.65); margin-bottom: 24px; }
    p { font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.48); margin-bottom: 32px; }
    .metrics { display: flex; flex-direction: column; gap: 13px; }
    .metric { display: flex; align-items: center; gap: 12px; font-size: 14px; color: rgba(255,255,255,0.6); }
    .metric::before { content: ''; display: block; width: 6px; height: 6px; border-radius: 50%; background: #10b981; flex-shrink: 0; }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="screenshot-wrapper"><img src="${imgData}" alt="Terra Platform"></div>
    <div class="overlay-fade"></div>
    <div class="content">
      <div class="app-tag">Terra &mdash; Property Intelligence</div>
      <h1>The Operating Surface for Serious Real Estate.</h1>
      <div class="tagline">From discovery through deal execution — one surface.</div>
      <p>For investors, brokers, and portfolio teams who treat real estate like an operating business.</p>
      <div class="metrics">
        <div class="metric">Off-market property discovery with ownership graph</div>
        <div class="metric">Deal pipeline management with probability scoring</div>
        <div class="metric">Portfolio performance and exit modeling</div>
      </div>
    </div>
  </div></body></html>`;
}

function slide07Aegis(imgData) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 100% 80% at 50% 30%, #0d0812 0%, #080a10 100%);
    }
    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(239,68,68,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(239,68,68,0.04) 1px, transparent 1px);
      background-size: 48px 48px;
    }
    .screenshot-wrapper {
      position: absolute; right: -24px; top: 50%; transform: translateY(-50%);
      width: 580px; height: 580px; border-radius: 14px; overflow: hidden;
      box-shadow: -60px 0 140px rgba(239,68,68,0.12);
      border: 1px solid rgba(239,68,68,0.22);
    }
    .screenshot-wrapper img { width: 100%; height: 100%; object-fit: cover; object-position: top left; }
    .overlay-fade { position: absolute; right: 556px; top: 0; bottom: 0; width: 200px; background: linear-gradient(90deg, #080a10 30%, transparent 100%); }
    .content { position: absolute; top: 0; left: 0; bottom: 0; width: 560px; display: flex; flex-direction: column; justify-content: center; padding: 80px 48px 80px 84px; }
    .app-tag { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #ef4444; margin-bottom: 22px; }
    h1 { font-size: 40px; line-height: 1.1; font-weight: 900; color: #fff; margin-bottom: 10px; }
    .tagline { font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.38); margin-bottom: 36px; letter-spacing: 0.5px; }
    .cards { display: flex; flex-direction: column; gap: 14px; margin-bottom: 36px; }
    .card { border-radius: 8px; padding: 16px 18px; border: 1px solid; display: flex; align-items: flex-start; gap: 14px; }
    .card-defense { background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.22); }
    .card-command { background: rgba(59,130,246,0.07); border-color: rgba(59,130,246,0.22); }
    .card-labs    { background: rgba(139,92,246,0.07); border-color: rgba(139,92,246,0.22); }
    .card-title { font-size: 11px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; margin-bottom: 4px; }
    .card-defense .card-title { color: #ef4444; }
    .card-command .card-title { color: #3b82f6; }
    .card-labs .card-title    { color: #8b5cf6; }
    .card-desc { font-size: 12.5px; line-height: 1.55; color: rgba(255,255,255,0.48); }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat { text-align: left; }
    .stat-val { font-size: 18px; font-weight: 800; color: #fff; display: block; }
    .stat-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.3); letter-spacing: 1.2px; text-transform: uppercase; }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="grid"></div>
    <div class="screenshot-wrapper"><img src="${imgData}" alt="Aegis Platform"></div>
    <div class="overlay-fade"></div>
    <div class="content">
      <div class="app-tag">Aegis &mdash; Unified Defense &amp; Intelligence Command</div>
      <h1>Four Workspaces. One Shared Intelligence Layer.</h1>
      <div class="tagline">Defense. Command. Labs. Legal. All sharing one data context.</div>
      <div class="cards">
        <div class="card card-defense">
          <div><div class="card-title">Defense</div><div class="card-desc">XDR &amp; threat detection. Continuous monitoring across every endpoint and perimeter.</div></div>
        </div>
        <div class="card card-command">
          <div><div class="card-title">Command</div><div class="card-desc">SOC automation &amp; managed operations. From detection to remediation in minutes.</div></div>
        </div>
        <div class="card card-labs">
          <div><div class="card-title">Labs</div><div class="card-desc">AI inference &amp; threat reasoning. Context that closes the loop on every incident.</div></div>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><span class="stat-val">&lt;4 min</span><span class="stat-lbl">MTTD</span></div>
        <div class="stat"><span class="stat-val">94%</span><span class="stat-lbl">AI Confidence</span></div>
        <div class="stat"><span class="stat-val">99.7%</span><span class="stat-lbl">ATT&amp;CK Coverage</span></div>
        <div class="stat"><span class="stat-val">2.1M/day</span><span class="stat-lbl">Events</span></div>
      </div>
    </div>
  </div></body></html>`;
}

function slide08PrismImperium(prismImg) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg { position: absolute; inset: 0; background: #080a10; }
    .divider { position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: rgba(255,255,255,0.07); }
    .half { position: absolute; top: 0; bottom: 0; width: 50%; display: flex; flex-direction: column; justify-content: center; padding: 64px 56px; }
    .half-left { left: 0; }
    .half-right { right: 0; background: rgba(6,8,16,0.5); }
    .screenshot-thumb { width: 100%; height: 200px; border-radius: 8px; overflow: hidden; margin-bottom: 24px; border: 1px solid rgba(59,130,246,0.18); }
    .screenshot-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
    .app-tag { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 12px; }
    .prism-tag { color: #3b82f6; }
    .imp-tag { color: #c9a227; }
    h2 { font-size: 24px; line-height: 1.25; font-weight: 800; color: #fff; margin-bottom: 8px; }
    .sub { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.38); margin-bottom: 20px; font-style: italic; }
    .bullets { display: flex; flex-direction: column; gap: 9px; }
    .bullet { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.6); }
    .bullet::before { content: ''; display: block; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .prism-bullet::before { background: #3b82f6; }
    .imp-bullet::before { background: #c9a227; }
    .badges { display: flex; gap: 6px; margin-top: 20px; flex-wrap: wrap; }
    .badge { font-size: 9px; font-weight: 800; letter-spacing: 1.5px; padding: 4px 8px; border-radius: 3px; text-transform: uppercase; }
    .b-open { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.28); }
    .b-rest { background: rgba(234,179,8,0.1); color: #ca8a04; border: 1px solid rgba(234,179,8,0.25); }
    .b-conf { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.22); }
    .b-sov  { background: rgba(139,92,246,0.1); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.22); }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="divider"></div>
    <div class="half half-left">
      <div class="screenshot-thumb"><img src="${prismImg}" alt="PRISM Counsel"></div>
      <div class="app-tag prism-tag">PRISM Counsel</div>
      <h2>Matter Observability &amp; Governed Legal Execution.</h2>
      <div class="sub">"Where intelligence meets legal precision."</div>
      <div class="bullets">
        <div class="bullet prism-bullet">Active matter tracking</div>
        <div class="bullet prism-bullet">Deadline risk queue</div>
        <div class="bullet prism-bullet">AI settlement forecasting</div>
        <div class="bullet prism-bullet">Full discovery &amp; playbook management</div>
      </div>
    </div>
    <div class="half half-right">
      <div class="app-tag imp-tag">IMPERIUM</div>
      <h2>Cloud Sovereignty at Scale.</h2>
      <div class="sub">"The empire doesn't ask permission — it governs."</div>
      <div class="bullets">
        <div class="bullet imp-bullet">Aquila Score: infrastructure health (0&ndash;100)</div>
        <div class="bullet imp-bullet">Legion / Cohort / Sentinel Azure hierarchy</div>
        <div class="bullet imp-bullet">Threat levels: PAX &rarr; VIGILIA &rarr; BELLUM &rarr; FUROR</div>
        <div class="bullet imp-bullet">Praetorian Guard zero-trust perimeter</div>
      </div>
      <div class="badges">
        <span class="badge b-open">OPEN</span>
        <span class="badge b-rest">RESTRICTED</span>
        <span class="badge b-conf">CONFIDENTIAL</span>
        <span class="badge b-sov">SOVEREIGN</span>
      </div>
    </div>
  </div></body></html>`;
}

function slide09CarlotaStephen(carlotaImg, stephenImg) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg { position: absolute; inset: 0; background: #080a10; }
    .divider { position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: rgba(255,255,255,0.07); }
    .half { position: absolute; top: 0; bottom: 0; width: 50%; display: flex; flex-direction: column; justify-content: center; padding: 60px 52px; }
    .half-left { left: 0; }
    .half-right { right: 0; }
    .screenshot-thumb { width: 100%; height: 210px; border-radius: 8px; overflow: hidden; margin-bottom: 22px; }
    .screenshot-thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
    .carlota-thumb { border: 1px solid rgba(201,162,39,0.22); }
    .stephen-thumb { border: 1px solid rgba(255,255,255,0.1); }
    .app-tag { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
    .cj-tag { color: #c9a227; }
    .sl-tag { color: rgba(255,255,255,0.45); }
    h2 { font-size: 22px; line-height: 1.3; font-weight: 800; color: #fff; margin-bottom: 10px; }
    .sub { font-size: 13px; line-height: 1.65; color: rgba(255,255,255,0.4); margin-bottom: 18px; font-style: italic; }
    .bullets { display: flex; flex-direction: column; gap: 8px; }
    .bullet { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.58); }
    .bullet::before { content: ''; display: block; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
    .cj-bullet::before { background: #c9a227; }
    .sl-bullet::before { background: rgba(255,255,255,0.3); }
    .roles { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 16px; }
    .role-tag { font-size: 10px; font-weight: 600; letter-spacing: 1px; padding: 3px 9px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.4); text-transform: uppercase; }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="divider"></div>
    <div class="half half-left">
      <div class="screenshot-thumb carlota-thumb"><img src="${carlotaImg}" alt="Carlota Jo Consulting"></div>
      <div class="app-tag cj-tag">Carlota Jo Consulting</div>
      <h2>Where Life's Complexity Finds Quiet Clarity.</h2>
      <div class="sub">Private advisory for individuals who demand precision, discretion, and a trusted presence.</div>
      <div class="bullets">
        <div class="bullet cj-bullet">Residence Operations</div>
        <div class="bullet cj-bullet">Household Systems</div>
        <div class="bullet cj-bullet">Special Projects &amp; Lifestyle Administration</div>
        <div class="bullet cj-bullet">Advisory Continuity</div>
      </div>
    </div>
    <div class="half half-right">
      <div class="screenshot-thumb stephen-thumb"><img src="${stephenImg}" alt="Stephen Lutar"></div>
      <div class="app-tag sl-tag">Stephen Lutar &mdash; Founder &amp; Architect</div>
      <h2>"I build command systems that close the loop from signal to decision to auditable action."</h2>
      <div class="sub">Across five distinct industries under one compounding architecture.</div>
      <div class="roles">
        <span class="role-tag">Founder</span>
        <span class="role-tag">CEO</span>
        <span class="role-tag">Architect</span>
        <span class="role-tag">Cybersecurity</span>
        <span class="role-tag">Maritime</span>
        <span class="role-tag">AI Orchestration</span>
      </div>
    </div>
  </div></body></html>`;
}

function slide10Thesis() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${BASE_CSS}
    .bg {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 100% 80% at 50% 30%, #0d0e18 0%, #080a10 100%);
    }
    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .content {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 80px; text-align: center;
    }
    .top-line { width: 48px; height: 3px; background: #c9a227; margin: 0 auto 44px; }
    h1 { font-size: 52px; line-height: 1.12; font-weight: 900; color: #fff; margin-bottom: 32px; max-width: 780px; }
    h1 em { font-style: normal; color: #c9a227; }
    p { font-size: 17px; line-height: 1.8; color: rgba(255,255,255,0.48); max-width: 680px; margin-bottom: 48px; }
    .bullets { display: flex; flex-direction: column; gap: 18px; text-align: left; max-width: 600px; width: 100%; margin-bottom: 52px; }
    .bullet { display: flex; align-items: flex-start; gap: 16px; font-size: 16px; color: rgba(255,255,255,0.72); line-height: 1.5; }
    .bullet-arrow { color: #c9a227; font-weight: 800; font-size: 19px; flex-shrink: 0; margin-top: 1px; }
    .footer { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .monogram { font-size: 28px; font-weight: 900; letter-spacing: 8px; text-transform: uppercase; color: rgba(255,255,255,0.18); }
    .contact { font-size: 14px; color: rgba(255,255,255,0.28); letter-spacing: 0.5px; }
    .back { font-size: 13px; color: rgba(255,255,255,0.2); position: absolute; bottom: 48px; left: 64px; }
  </style></head><body><div class="slide">
    <div class="bg"></div>
    <div class="grid"></div>
    <div class="content">
      <div class="top-line"></div>
      <h1>This is not a product company.<br>This is a <em>platform holding company.</em></h1>
      <p>Each system is production-grade and generates its own revenue signal. Each shares infrastructure, design language, and intelligence with every other system. The marginal cost of adding the eleventh product is a fraction of the first.</p>
      <div class="bullets">
        <div class="bullet"><span class="bullet-arrow">&rarr;</span><span>Accelerate go-to-market across three flagship verticals</span></div>
        <div class="bullet"><span class="bullet-arrow">&rarr;</span><span>Deepen the shared AI intelligence layer (CORTEX)</span></div>
        <div class="bullet"><span class="bullet-arrow">&rarr;</span><span>Expand the Aegis defense platform into enterprise accounts</span></div>
      </div>
      <div class="footer">
        <div class="monogram">SZL</div>
        <div class="contact">contact@szlholdings.com</div>
      </div>
    </div>
    <div class="back">&larr; swipe back to explore each system</div>
  </div></body></html>`;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function run() {
  const [szlImg, lyteImg, vesselsImg, terraImg, aegisImg, prismImg, carlotaImg, stephenImg] =
    await Promise.all([
      loadDataUrl('szl-holdings-hero.jpg'),
      loadDataUrl('lyte-hero.jpg'),
      loadDataUrl('vessels-hero.jpg'),
      loadDataUrl('terra-hero.jpg'),
      loadDataUrl('aegis-hero.jpg'),
      loadDataUrl('prism-counsel-hero.jpg'),
      loadDataUrl('carlota-jo-hero.jpg'),
      loadDataUrl('stephen-site-hero.jpg'),
    ]);

  const slides = [
    { id: 'slide-01-cover', html: slide01Cover() },
    { id: 'slide-02-thesis', html: slide02Thesis() },
    { id: 'slide-03-szl-dashboard', html: slide03SzlDashboard(szlImg) },
    { id: 'slide-04-lyte', html: slide04Lyte(lyteImg) },
    { id: 'slide-05-vessels', html: slide05Vessels(vesselsImg) },
    { id: 'slide-06-terra', html: slide06Terra(terraImg) },
    { id: 'slide-07-aegis', html: slide07Aegis(aegisImg) },
    { id: 'slide-08-prism-imperium', html: slide08PrismImperium(prismImg) },
    { id: 'slide-09-carlota-stephen', html: slide09CarlotaStephen(carlotaImg, stephenImg) },
    { id: 'slide-10-thesis', html: slide10Thesis() },
  ];

  // Resolve Chromium: use PLAYWRIGHT_CHROMIUM_EXECUTABLE env var first,
  // then fall back to the system-installed Nix Chromium on Replit.
  const { execSync } = await import('node:child_process');
  let executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (!executablePath) {
    try {
      executablePath = execSync(
        'which chromium-browser 2>/dev/null || which chromium 2>/dev/null || which google-chrome 2>/dev/null',
        { encoding: 'utf8' },
      )
        .trim()
        .split('\n')[0];
    } catch {
      /* will let playwright use its own bundled binary */
    }
  }

  const browser = await chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  });

  const jpgPaths = [];

  for (const slide of slides) {
    const page = await context.newPage();
    await page.setContent(slide.html, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const outPath = path.join(OUTPUT_DIR, `${slide.id}.jpg`);
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 96, fullPage: false });
    jpgPaths.push(outPath);
    await page.close();
  }
  for (let i = 0; i < slides.length; i++) {
    const page = await context.newPage();
    await page.setContent(slides[i].html, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    const pageOut = path.join(OUTPUT_DIR, `pdf-page-${String(i + 1).padStart(2, '0')}.pdf`);
    await page.pdf({
      path: pageOut,
      width: `${W}px`,
      height: `${H}px`,
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    await page.close();
  }

  // Merge per-page PDFs with a simple concatenation approach:
  // Use playwright's multi-page PDF by generating a combined HTML
  const combinedPage = await context.newPage();
  const combinedHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: ${W}px ${H}px; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .page { page-break-after: always; width: ${W}px; height: ${H}px; overflow: hidden; }
    .page:last-child { page-break-after: auto; }
  </style></head><body>
    ${slides
      .map((s) => {
        // Strip the outer html wrapper from each slide HTML, keep just inner body content
        const bodyMatch = s.html.match(/<body>([\s\S]*?)<\/body>/);
        const styleMatch = s.html.match(/<style>([\s\S]*?)<\/style>/);
        const style = styleMatch ? `<style>${styleMatch[1]}</style>` : '';
        const body = bodyMatch ? bodyMatch[1] : '';
        return `<div class="page">${style}${body}</div>`;
      })
      .join('\n')}
  </body></html>`;

  await combinedPage.setContent(combinedHtml, { waitUntil: 'domcontentloaded' });
  await combinedPage.waitForTimeout(600);
  await combinedPage.pdf({
    path: PDF_OUT,
    width: `${W}px`,
    height: `${H}px`,
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });
  await combinedPage.close();

  // Clean up per-page PDFs
  for (let i = 1; i <= slides.length; i++) {
    const f = path.join(OUTPUT_DIR, `pdf-page-${String(i).padStart(2, '0')}.pdf`);
    await fs.unlink(f).catch(() => {});
  }

  await browser.close();
  jpgPaths.forEach((_p) => {});
}

run().catch((_err) => {
  process.exit(1);
});
