#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import playwrightPackage from '@playwright/test/package.json' with { type: 'json' };

const url = process.argv[2] ?? 'http://127.0.0.1:4111/preview/platform-a11oy/';
const outputPath = path.resolve(
  process.argv[3] ?? 'docs/assets/screenshots/current/a11oy-candidate-home-2026-10-11.png',
);
const metadataPath = outputPath.replace(/\.png$/i, '.metadata.json');
const origin = new URL(url).origin;
const requestedPath = new URL(url).pathname;
const candidateBasePath = process.env.A11OY_CANDIDATE_BASE_PATH ?? '/preview/platform-a11oy/';
if (!candidateBasePath.startsWith('/') || !candidateBasePath.endsWith('/')) {
  throw new Error('A11OY_CANDIDATE_BASE_PATH must be an absolute path ending in /');
}
const blockedRequests = [];
const unexpectedSameOriginRequests = [];
const observedRequests = [];
const observedResponses = [];

function command(command, args) {
  return execFileSync(command, args, { encoding: 'utf8' }).trim();
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || command('which', ['chromium']);
const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    locale: 'en-US',
    serviceWorkers: 'block',
  });
  await context.route('**/*', async (route) => {
    const request = route.request();
    const requestUrl = request.url();
    const parsed = new URL(requestUrl);
    const protocol = parsed.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') {
      await route.continue();
      return;
    }
    observedRequests.push({
      method: request.method(),
      resource_type: request.resourceType(),
      url: requestUrl,
    });
    if (parsed.origin !== origin) {
      blockedRequests.push(requestUrl);
      await route.abort('blockedbyclient');
      return;
    }
    const allowedPath =
      parsed.pathname === requestedPath ||
      parsed.pathname.startsWith(`${candidateBasePath}assets/`);
    if (request.method() !== 'GET' || !allowedPath) {
      unexpectedSameOriginRequests.push({ method: request.method(), url: requestUrl });
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });

  const page = await context.newPage();
  page.on('response', (response) => {
    const responseUrl = response.url();
    if (new URL(responseUrl).origin === origin) {
      observedResponses.push({ status: response.status(), url: responseUrl });
    }
  });
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  if (!response || response.status() >= 400) {
    throw new Error(`candidate route returned ${response?.status() ?? 'no response'}`);
  }
  await page.locator("[data-testid='candidate-boundary']").waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.body.dataset.screenshotReady === 'true');
  await page.evaluate(async () => document.fonts.ready);

  // Exercise every viewport long enough for once-only reveal transitions to
  // settle. A fast scroll followed by disabling animations can freeze
  // Framer Motion nodes at opacity 0 and create misleading blank evidence.
  for (
    let y = 0;
    y < (await page.evaluate(() => document.documentElement.scrollHeight));
    y += 600
  ) {
    await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), y);
    await page.waitForTimeout(900);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1_200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1_200);

  const hiddenContent = await page.evaluate(() =>
    [...document.querySelectorAll('section')]
      .map((section, index) => {
        const text = section.textContent?.replace(/\s+/g, ' ').trim() ?? '';
        let node = section;
        while (node && node !== document.body) {
          if (Number.parseFloat(getComputedStyle(node).opacity) < 0.99) {
            return { index, text: text.slice(0, 120), opacity: getComputedStyle(node).opacity };
          }
          node = node.parentElement;
        }
        return null;
      })
      .filter(Boolean),
  );
  if (hiddenContent.length > 0) {
    throw new Error(`candidate capture contains hidden sections: ${JSON.stringify(hiddenContent)}`);
  }
  if (blockedRequests.length > 0) {
    throw new Error(
      `candidate attempted foreign requests: ${JSON.stringify([...new Set(blockedRequests)].sort())}`,
    );
  }
  if (unexpectedSameOriginRequests.length > 0) {
    throw new Error(
      `candidate attempted an undeclared same-origin request: ${JSON.stringify(unexpectedSameOriginRequests)}`,
    );
  }
  const failedResponses = observedResponses.filter(({ status }) => status >= 400);
  if (failedResponses.length > 0) {
    throw new Error(`candidate received failed responses: ${JSON.stringify(failedResponses)}`);
  }
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });

  await mkdir(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });

  const imageBytes = await readFile(outputPath);
  const indexBytes = await readFile(path.resolve('artifacts/a11oy/dist/public/index.html'));
  const imageStat = await stat(outputPath);
  const metadata = {
    schema: 'szl.a11oy-candidate-screenshot/v1',
    evidence_status: 'LOCAL_NON_AUTHORITATIVE',
    claim_boundary:
      'Candidate UI fixture only; this capture is not production, deployment, certification, or signed-proof evidence.',
    captured_at: new Date().toISOString(),
    route: url,
    viewport: { width: 1440, height: 900, full_page: true },
    screenshot: {
      path: path.relative(process.cwd(), outputPath),
      bytes: imageStat.size,
      sha256: sha256(imageBytes),
    },
    build: {
      index_html_sha256: sha256(indexBytes),
      source_head: command('git', ['rev-parse', 'HEAD']),
      working_tree_clean:
        command('git', ['status', '--porcelain', '--untracked-files=no']).length === 0,
    },
    runtime: {
      node: process.version,
      playwright: playwrightPackage.version,
      chromium: browser.version(),
      executable_path: executablePath,
    },
    network: {
      policy: 'GET requested route plus same-origin candidate assets only',
      observed_requests: observedRequests,
      observed_responses: observedResponses,
      foreign_requests: [],
      undeclared_same_origin_requests: [],
    },
  };
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(metadata)}\n`);
  await context.close();
} finally {
  await browser.close();
}
