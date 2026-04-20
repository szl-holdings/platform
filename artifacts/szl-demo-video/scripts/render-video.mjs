#!/usr/bin/env node
/**
 * Headless renderer for the SZL Holdings — Governed Autonomy demo video.
 *
 * Pipeline:
 *   1. Build the artifact with vite (BASE_PATH=/).
 *   2. Serve dist/public on a local HTTP port.
 *   3. Launch Chromium via Playwright at 1920x1080, record video, navigate
 *      to the page with ?capture=full so the on-screen UI controls are hidden.
 *   4. Wait for the in-app `window.startRecording` and `window.stopRecording`
 *      lifecycle hooks to fire (these bracket exactly one full pass of the
 *      ~77s "full" cut).
 *   5. Use ffmpeg to trim the raw .webm to the recorded window and re-encode:
 *        deliverables/linkedin-4-17.mp4         — 1920x1080 H.264 (16:9)
 *        deliverables/linkedin-4-17-square.mp4  — 1080x1080 H.264 (1:1, center crop)
 *   6. Re-zip deliverables/szl-demo-video.zip.
 */

import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, rm, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARTIFACT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ARTIFACT_DIR, 'dist', 'public');
const DELIVERABLES_DIR = path.join(ARTIFACT_DIR, 'deliverables');
const RAW_DIR = path.join(DELIVERABLES_DIR, '.raw');

const CHROMIUM_PATHS = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean);

function findChromium() {
  for (const p of CHROMIUM_PATHS) {
    if (existsSync(p)) return p;
  }
  // Fall back to which
  const out = spawnSync('which', ['chromium']);
  if (out.status === 0) return out.stdout.toString().trim();
  throw new Error('No chromium executable found.');
}

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
        res.writeHead(403); res.end(); return;
      }
      let st;
      try { st = await stat(filePath); } catch { st = null; }
      if (st && st.isDirectory()) {
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
        // SPA fallback
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

async function buildArtifact() {
  console.log('[render] Building artifact (BASE_PATH=/)…');
  await run('npx', ['vite', 'build', '--config', 'vite.config.ts'], {
    cwd: ARTIFACT_DIR,
    env: { ...process.env, BASE_PATH: '/', PORT: '3000', NODE_ENV: 'production' },
  });
}

async function recordVideo({ port }) {
  console.log('[render] Launching headless Chromium…');
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
      console.log('[render] startRecording fired.');
    });
    page.exposeFunction('__captureStop', () => {
      stopMs = Date.now();
      console.log('[render] stopRecording fired.');
      resolve();
    });
  });

  await page.addInitScript(() => {
    // Bridge the in-page lifecycle hooks to Playwright via exposed functions.
    let started = false;
    let stoppedFlag = false;
    Object.defineProperty(window, 'startRecording', {
      configurable: true,
      value: async () => {
        if (started) return;
        started = true;
        // @ts-ignore
        await window.__captureStart?.();
      },
    });
    Object.defineProperty(window, 'stopRecording', {
      configurable: true,
      value: async () => {
        if (stoppedFlag) return;
        stoppedFlag = true;
        // @ts-ignore
        await window.__captureStop?.();
      },
    });
  });

  console.log('[render] Navigating to page (capture=full)…');
  await page.goto(`http://127.0.0.1:${port}/?capture=full`, { waitUntil: 'load' });

  // Safety timeout: full cut is 77s, allow up to 120s.
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timed out waiting for stopRecording (>120s)')), 120_000),
  );

  await Promise.race([stopped, timeout]);
  // Add a short tail so the closing scene's last frame is captured.
  await page.waitForTimeout(800);

  await context.close();
  await browser.close();

  const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) throw new Error('Playwright did not produce a video file.');
  const rawPath = path.join(RAW_DIR, files[0]);
  console.log(`[render] Raw recording: ${rawPath}`);
  return { rawPath, startMs, stopMs };
}

async function encode(rawPath, { startMs, stopMs }) {
  // Compute trim points relative to context start.
  // Playwright's video begins ~when the page is created; the in-page
  // startRecording fires on React mount. We use the elapsed window
  // (stopMs-startMs) as the canonical duration and trim the leading lag
  // by seeking to the moment startRecording fired (approx).
  // We don't know the exact context-creation time, so we keep the full
  // raw video and use ffmpeg to trim the leading 0.4s of any blank frame
  // and clamp the duration to (stopMs-startMs)+0.8s.
  const recordedSec = Math.max(1, (stopMs - startMs) / 1000);
  const totalSec = recordedSec + 0.8;

  const mp4Wide = path.join(DELIVERABLES_DIR, 'linkedin-4-17.mp4');
  const mp4Square = path.join(DELIVERABLES_DIR, 'linkedin-4-17-square.mp4');

  await rm(mp4Wide, { force: true });
  await rm(mp4Square, { force: true });

  console.log(`[render] Encoding 1920x1080 MP4 (~${totalSec.toFixed(1)}s)…`);
  await run('ffmpeg', [
    '-y',
    '-ss', '0.4',
    '-i', rawPath,
    '-t', String(totalSec),
    '-vf', 'scale=1920:1080:flags=lanczos,fps=30,format=yuv420p',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-level', '4.2',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    mp4Wide,
  ]);

  console.log('[render] Encoding 1080x1080 square MP4 (center crop)…');
  await run('ffmpeg', [
    '-y',
    '-ss', '0.4',
    '-i', rawPath,
    '-t', String(totalSec),
    '-vf', 'crop=1080:1080:(in_w-1080)/2:(in_h-1080)/2,scale=1080:1080:flags=lanczos,fps=30,format=yuv420p',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-level', '4.2',
    '-preset', 'slow',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    mp4Square,
  ]);

  return { mp4Wide, mp4Square };
}

async function rezipDeliverables() {
  const zipPath = path.join(DELIVERABLES_DIR, 'szl-demo-video.zip');
  await rm(zipPath, { force: true });
  console.log('[render] Re-zipping deliverables/szl-demo-video.zip…');
  // The `zip` CLI is not installed in this environment, so use python3's
  // built-in zipfile module (always present).
  await run('python3', [
    '-m', 'zipfile', '-c', 'szl-demo-video.zip',
    'linkedin-4-17.mp4', 'linkedin-4-17-square.mp4', 'README.md',
  ], { cwd: DELIVERABLES_DIR });
  return zipPath;
}

async function writeReadme() {
  const readme = `# SZL Demo Video — Deliverables

Generated by \`scripts/render-video.mjs\`.

| File | Format | Use |
|------|--------|-----|
| linkedin-4-17.mp4 | 1920x1080 H.264, 30fps, no audio | LinkedIn feed (16:9) |
| linkedin-4-17-square.mp4 | 1080x1080 H.264, 30fps, no audio | LinkedIn feed (1:1 mobile) |
| szl-demo-video.zip | zip of the above | bundle for upload |

Re-render with: \`pnpm --filter @workspace/szl-demo-video render\`
`;
  await writeFile(path.join(DELIVERABLES_DIR, 'README.md'), readme);
}

async function main() {
  await mkdir(DELIVERABLES_DIR, { recursive: true });
  await buildArtifact();

  const server = staticServer(DIST_DIR);
  const port = await listen(server);
  console.log(`[render] Static server on http://127.0.0.1:${port}`);

  try {
    const { rawPath, startMs, stopMs } = await recordVideo({ port });
    await encode(rawPath, { startMs, stopMs });
    await writeReadme();
    const zipPath = await rezipDeliverables();
    await rm(RAW_DIR, { recursive: true, force: true });
    console.log('[render] Done.');
    console.log('[render] Outputs:');
    console.log('   ', path.join(DELIVERABLES_DIR, 'linkedin-4-17.mp4'));
    console.log('   ', path.join(DELIVERABLES_DIR, 'linkedin-4-17-square.mp4'));
    console.log('   ', zipPath);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('[render] FAILED:', err);
  process.exit(1);
});
