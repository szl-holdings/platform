#!/usr/bin/env node
/**
 * Headless renderer for the SZL Holdings — Governed Autonomy demo video.
 *
 * Pipeline:
 *   1. Optionally install Playwright's Chromium (--install-browsers flag, for CI).
 *   2. Build the artifact with vite (BASE_PATH=/).
 *   3. Serve dist/public on a local HTTP port.
 *   4. Launch Chromium via Playwright at 1920x1080, record video, navigate
 *      to the page with ?capture=full so the on-screen UI controls are hidden.
 *   5. Wait for the in-app `window.startRecording` and `window.stopRecording`
 *      lifecycle hooks to fire (these bracket exactly one full pass of the
 *      ~77s "full" cut).
 *   6. Use ffmpeg to trim the raw .webm to the recorded window and re-encode:
 *        deliverables/linkedin-4-17.mp4              — 1920x1080 H.264 (16:9, full)
 *        deliverables/linkedin-4-17-square.mp4       — 1080x1080 H.264 (1:1, center crop, full)
 *        deliverables/social-30s-vertical.mp4        — 1080x1920 H.264 (9:16, first 30s)
 *        deliverables/social-60s-vertical.mp4        — 1080x1920 H.264 (9:16, first 60s)
 *   7. Write a WebVTT caption track: deliverables/captions.vtt
 *   8. Re-zip all deliverables/szl-demo-video.zip.
 *
 * Usage:
 *   node scripts/render-video.mjs                   # normal render
 *   node scripts/render-video.mjs --install-browsers # CI: installs Playwright Chromium first
 *
 * Or via pnpm:
 *   pnpm --filter @workspace/szl-demo-video render
 *   pnpm --filter @workspace/szl-demo-video render:ci
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ARTIFACT_DIR, 'dist', 'public');
const DELIVERABLES_DIR = path.join(ARTIFACT_DIR, 'deliverables');
const RAW_DIR = path.join(DELIVERABLES_DIR, '.raw');

const INSTALL_BROWSERS = process.argv.includes('--install-browsers');

// ── Chromium discovery ─────────────────────────────────────────────────────
//
// Search order:
//   1. PLAYWRIGHT_CHROMIUM_EXECUTABLE env var (explicit override)
//   2. Playwright's own installed binary  (`npx playwright install chromium`)
//   3. Known Nix store paths (scanned by glob pattern)
//   4. System-level chromium / google-chrome
//   5. `which chromium` fallback

const EXPLICIT_PATHS = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
].filter(Boolean);

function findChromiumInNixStore() {
  const nixStore = '/nix/store';
  if (!existsSync(nixStore)) return null;
  let entries;
  try {
    entries = readdirSync(nixStore);
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.includes('chromium')) continue;
    const candidate = path.join(nixStore, entry, 'bin', 'chromium');
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function findPlaywrightChromium() {
  // Scan the Playwright browser cache directory for an installed Chromium binary.
  // Avoids require() (not available in ESM) and internal Playwright registry APIs.
  const HOME = process.env.HOME ?? '/root';
  const cacheRoot = path.join(HOME, '.cache', 'ms-playwright');
  if (!existsSync(cacheRoot)) return null;

  let versions;
  try {
    versions = readdirSync(cacheRoot);
  } catch {
    return null;
  }

  const binaryRelPaths = [
    path.join('chrome-linux', 'chrome'),
    path.join('chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
  ];

  for (const version of versions) {
    if (!version.startsWith('chromium')) continue;
    for (const rel of binaryRelPaths) {
      const candidate = path.join(cacheRoot, version, rel);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function findChromium() {
  for (const p of EXPLICIT_PATHS) {
    if (existsSync(p)) {
      return p;
    }
  }
  const nixPath = findChromiumInNixStore();
  if (nixPath) {
    return nixPath;
  }
  const pwPath = findPlaywrightChromium();
  if (pwPath) {
    return pwPath;
  }
  const out = spawnSync('which', ['chromium'], { encoding: 'utf8' });
  if (out.status === 0 && out.stdout.trim()) {
    return out.stdout.trim();
  }
  throw new Error(
    'No Chromium executable found.\n' +
    'Install one of:\n' +
    '  • npx playwright install chromium   (recommended for CI)\n' +
    '  • apt-get install chromium-browser\n' +
    '  • set PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium\n'
  );
}

// ── Mime types ────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.map': 'application/json',
};

function staticServer(root) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let filePath = path.join(root, decodeURIComponent(url.pathname));
      if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
      }
      let st;
      try {
        st = await stat(filePath);
      } catch {
        st = null;
      }
      if (st?.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      try {
        const data = await readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': MIME[ext] ?? 'application/octet-stream',
          'Cache-Control': 'no-store',
        });
        res.end(data);
      } catch {
        const data = await readFile(path.join(root, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      }
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
    child.on('error', reject);
  });
}

// ── CI setup ──────────────────────────────────────────────────────────────
async function installBrowsers() {
  // Try --with-deps first (installs OS-level shared libraries).
  // Some minimal/non-root CI images don't support --with-deps (requires sudo/apt);
  // in those cases fall back to the plain install which relies on pre-installed libs.
  try {
    await run('npx', ['playwright', 'install', 'chromium', '--with-deps'], {
      cwd: ARTIFACT_DIR,
      env: { ...process.env },
    });
  } catch {
    await run('npx', ['playwright', 'install', 'chromium'], {
      cwd: ARTIFACT_DIR,
      env: { ...process.env },
    });
  }
}

async function buildArtifact() {
  await run('npx', ['vite', 'build', '--config', 'vite.config.ts'], {
    cwd: ARTIFACT_DIR,
    env: { ...process.env, BASE_PATH: '/', PORT: '3000', NODE_ENV: 'production' },
  });
}

// ── Browser recording ─────────────────────────────────────────────────────
async function recordVideo({ port }) {
  await rm(RAW_DIR, { recursive: true, force: true });
  await mkdir(RAW_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: findChromium(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--mute-audio',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: { dir: RAW_DIR, size: { width: 1920, height: 1080 } },
  });

  const page = await context.newPage();

  let startMs = 0;
  let stopMs = 0;
  const stopped = new Promise((resolve) => {
    page.exposeFunction('__captureStart', () => {
      startMs = Date.now();
    });
    page.exposeFunction('__captureStop', () => {
      stopMs = Date.now();
      resolve();
    });
  });

  await page.addInitScript(() => {
    let started = false;
    let stoppedFlag = false;
    Object.defineProperty(window, 'startRecording', {
      configurable: true,
      value: async () => {
        if (started) return;
        started = true;
        // @ts-expect-error
        await window.__captureStart?.();
      },
    });
    Object.defineProperty(window, 'stopRecording', {
      configurable: true,
      value: async () => {
        if (stoppedFlag) return;
        stoppedFlag = true;
        // @ts-expect-error
        await window.__captureStop?.();
      },
    });
  });
  await page.goto(`http://127.0.0.1:${port}/?capture=full`, { waitUntil: 'load' });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timed out waiting for stopRecording (>120s)')), 120_000),
  );

  await Promise.race([stopped, timeout]);
  await page.waitForTimeout(800);

  await context.close();
  await browser.close();

  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) throw new Error('Playwright did not produce a video file.');
  const rawPath = path.join(RAW_DIR, files[0]);
  return { rawPath, startMs, stopMs };
}

// ── Encoding helpers ──────────────────────────────────────────────────────

function h264Args(vf, outputPath) {
  return [
    '-vf', vf,
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-level', '4.2',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    outputPath,
  ];
}

async function encode(rawPath, { startMs, stopMs }) {
  const recordedSec = Math.max(1, (stopMs - startMs) / 1000);
  const totalSec = recordedSec + 0.8;

  const mp4Wide = path.join(DELIVERABLES_DIR, 'linkedin-4-17.mp4');
  const mp4Square = path.join(DELIVERABLES_DIR, 'linkedin-4-17-square.mp4');

  await rm(mp4Wide, { force: true });
  await rm(mp4Square, { force: true });
  await run('ffmpeg', [
    '-y', '-ss', '0.4', '-i', rawPath, '-t', String(totalSec),
    ...h264Args('scale=1920:1080:flags=lanczos,fps=30,format=yuv420p', mp4Wide),
  ]);
  await run('ffmpeg', [
    '-y', '-ss', '0.4', '-i', rawPath, '-t', String(totalSec),
    ...h264Args(
      'crop=1080:1080:(in_w-1080)/2:(in_h-1080)/2,scale=1080:1080:flags=lanczos,fps=30,format=yuv420p',
      mp4Square,
    ),
  ]);

  return { mp4Wide, mp4Square };
}

/**
 * Produce 9:16 vertical social cuts from the full 16:9 recording.
 *
 * Strategy: pillarbox the 1920x1080 source to fit 1080px wide (→ 1080x607),
 * then pad vertically to 1920px with black bars (top/bottom).
 * This preserves all horizontal content at the expense of top/bottom black bars —
 * appropriate for product-UI demos where the important content is centered.
 */
async function encodeVerticalSocialCuts(rawPath) {
  const VERTICAL_FILTER =
    'scale=1080:607:flags=lanczos,pad=1080:1920:0:656:black,fps=30,format=yuv420p';

  const out30s = path.join(DELIVERABLES_DIR, 'social-30s-vertical.mp4');
  const out60s = path.join(DELIVERABLES_DIR, 'social-60s-vertical.mp4');

  await rm(out30s, { force: true });
  await rm(out60s, { force: true });
  await run('ffmpeg', [
    '-y', '-ss', '0.4', '-i', rawPath, '-t', '30',
    ...h264Args(VERTICAL_FILTER, out30s),
  ]);
  await run('ffmpeg', [
    '-y', '-ss', '0.4', '-i', rawPath, '-t', '60',
    ...h264Args(VERTICAL_FILTER, out60s),
  ]);

  return { out30s, out60s };
}

// ── WebVTT caption track ──────────────────────────────────────────────────
//
// Caption data is duplicated from src/components/video/CaptionTrack.tsx.
// Scene offsets match FULL_SCENE_DURATIONS in VideoTemplate.tsx:
//   open: 0–12s, reel: 12–37s, fabric: 37–55s, cortex: 55–65s, close: 65–77s

const SCENE_OFFSETS_MS = {
  open: 0,
  reel: 12_000,
  fabric: 37_000,
  cortex: 55_000,
  close: 65_000,
};

const SCENE_CAPTIONS = {
  open: [
    { startMs: 1000,  endMs: 4500,  text: 'The era of AI without receipts is ending.' },
    { startMs: 4500,  endMs: 9000,  text: 'Every action carries a trace ID, source, freshness, and citation.' },
    { startMs: 9000,  endMs: 12000, text: 'Provenance is not optional.' },
  ],
  reel: [
    { startMs: 0,     endMs: 2500,  text: 'Pulse — executive briefing, principal eyes only.' },
    { startMs: 2500,  endMs: 5000,  text: 'Vessels — maritime intelligence with human approval.' },
    { startMs: 5000,  endMs: 7500,  text: 'Terra — real estate intelligence across $4.2B+ AUM.' },
    { startMs: 7500,  endMs: 10000, text: 'Aegis — defense and intel, blocked by policy until cleared.' },
    { startMs: 10000, endMs: 12500, text: 'Carlota Jo — private advisory, judgment-led.' },
    { startMs: 12500, endMs: 15000, text: 'Sentra — cyber posture under guardian approval.' },
    { startMs: 15000, endMs: 17500, text: 'Lyte — decision intelligence with confidence scores.' },
    { startMs: 17500, endMs: 20000, text: 'Counsel — legal exposure surfaced before crisis.' },
    { startMs: 20000, endMs: 22500, text: 'Counsel — every obligation tracked, every deadline locked.' },
    { startMs: 22500, endMs: 25000, text: 'Unified Command — ten surfaces, one governed fabric.' },
  ],
  fabric: [
    { startMs: 500,   endMs: 4000,  text: 'The Decision Fabric — a governed substrate beneath every surface.' },
    { startMs: 4000,  endMs: 10000, text: 'Constellation, Trace, Guardian, Eval, Memory, Tools.' },
    { startMs: 10000, endMs: 18000, text: 'Six systems. One explainable runtime.' },
  ],
  cortex: [
    { startMs: 500,   endMs: 2000,  text: 'APEX Mobile — the pocket-cockpit.' },
    { startMs: 2000,  endMs: 3500,  text: 'Maritime risk surfaces in real time.' },
    { startMs: 3500,  endMs: 5000,  text: 'Cross-domain correlation links exposure across the portfolio.' },
    { startMs: 5000,  endMs: 10000, text: 'Human approval mandatory before consequential action.' },
  ],
  close: [
    { startMs: 1000,  endMs: 3000,  text: 'SZL Holdings — the Governed Decision Operating System.' },
    { startMs: 3000,  endMs: 5000,  text: '"The era of AI-without-receipts is ending."' },
    { startMs: 5000,  endMs: 6500,  text: 'Ten surfaces. One governed fabric.' },
    { startMs: 6500,  endMs: 12000, text: 'Stephen Lutar, Founder & CEO — szl.com', speaker: 'SZL Holdings' },
  ],
};

function msToVttTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const msPart = ms % 1000;
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${[
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':')}.${String(msPart).padStart(3, '0')}`;
}

async function generateWebVTT() {
  const cues = [];
  for (const [sceneKey, captions] of Object.entries(SCENE_CAPTIONS)) {
    const offset = SCENE_OFFSETS_MS[sceneKey] ?? 0;
    for (const caption of captions) {
      cues.push({
        start: offset + caption.startMs,
        end: offset + caption.endMs,
        speaker: caption.speaker,
        text: caption.text,
      });
    }
  }
  cues.sort((a, b) => a.start - b.start);

  let vtt = 'WEBVTT\nKind: captions\nLanguage: en\n\n';
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    vtt += `${i + 1}\n`;
    vtt += `${msToVttTime(c.start)} --> ${msToVttTime(c.end)}`;
    if (c.speaker) vtt += ` align:center line:80%`;
    vtt += '\n';
    if (c.speaker) vtt += `<v ${c.speaker}>`;
    vtt += `${c.text}\n\n`;
  }

  const vttPath = path.join(DELIVERABLES_DIR, 'captions.vtt');
  await writeFile(vttPath, vtt, 'utf8');
  return vttPath;
}

// ── Deliverables packaging ────────────────────────────────────────────────

async function rezipDeliverables() {
  const zipPath = path.join(DELIVERABLES_DIR, 'szl-demo-video.zip');
  await rm(zipPath, { force: true });
  // The `zip` CLI is not installed in this environment, so use python3's
  // built-in zipfile module (always present).
  await run('python3', [
    '-m', 'zipfile', '-c', 'szl-demo-video.zip',
    'linkedin-4-17.mp4',
    'linkedin-4-17-square.mp4',
    'social-30s-vertical.mp4',
    'social-60s-vertical.mp4',
    'captions.vtt',
    'README.md',
  ], { cwd: DELIVERABLES_DIR });
  return zipPath;
}

async function writeReadme() {
  const readme = `# SZL Demo Video — Deliverables

Generated by \`scripts/render-video.mjs\` on ${new Date().toISOString().slice(0, 10)}.

## Files

| File | Format | Dimensions | Duration | Use |
|------|--------|------------|----------|-----|
| linkedin-4-17.mp4 | H.264, 30fps | 1920×1080 | ~77s | LinkedIn feed (16:9), investor email |
| linkedin-4-17-square.mp4 | H.264, 30fps | 1080×1080 | ~77s | LinkedIn mobile (1:1) |
| social-30s-vertical.mp4 | H.264, 30fps | 1080×1920 | 30s | Stories / Reels / TikTok (9:16) |
| social-60s-vertical.mp4 | H.264, 30fps | 1080×1920 | 60s | Long-form Reels / LinkedIn Stories (9:16) |
| captions.vtt | WebVTT | — | full | Accessibility captions (English) |
| szl-demo-video.zip | zip | — | — | Bundle for upload / distribution |

## Re-render

\`\`\`bash
# Standard (requires Chromium installed on system)
pnpm --filter @workspace/szl-demo-video render

# CI / fresh environment (installs Playwright Chromium first)
pnpm --filter @workspace/szl-demo-video render:ci
\`\`\`

## Notes

- No audio track. Silence is intentional — designed for auto-play LinkedIn contexts.
- Captions are burned into the in-browser preview (CC button). The \`captions.vtt\` file
  is for external players / social upload caption import.
- Vertical (9:16) cuts are pillarboxed from the 16:9 master with black bars top/bottom.
`;
  await writeFile(path.join(DELIVERABLES_DIR, 'README.md'), readme);
}

// ── Entry point ───────────────────────────────────────────────────────────
async function main() {
  await mkdir(DELIVERABLES_DIR, { recursive: true });

  if (INSTALL_BROWSERS) {
    await installBrowsers();
  }

  await buildArtifact();

  const server = staticServer(DIST_DIR);
  const port = await listen(server);

  try {
    const { rawPath, startMs, stopMs } = await recordVideo({ port });
    const { mp4Wide, mp4Square } = await encode(rawPath, { startMs, stopMs });
    const { out30s, out60s } = await encodeVerticalSocialCuts(rawPath);
    const _vttPath = await generateWebVTT();
    await writeReadme();
    const _zipPath = await rezipDeliverables();
    await rm(RAW_DIR, { recursive: true, force: true });
  } finally {
    server.close();
  }
}

main().catch((_err) => {
  process.exit(1);
});
