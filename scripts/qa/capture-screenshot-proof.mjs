import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';
import { collectLayoutEvidence } from './screenshot-layout-helpers.mjs';

const execFile = promisify(execFileCallback);
const planPath = process.env.SCREENSHOT_PLAN || 'audit/screenshot-capture-plan.json';
const baseUrl = process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:4110';
const sourceRevision = process.env.SOURCE_REVISION || process.env.GITHUB_SHA || '';
const runIdentity = process.env.RUN_IDENTITY || '';
const captureEnvironment = process.env.CAPTURE_ENVIRONMENT || '';
const capturedBy = process.env.CAPTURED_BY || '';
const sourceIdentityUrl = process.env.SOURCE_IDENTITY_URL || '';
const outputDir = process.env.SCREENSHOT_OUTPUT_DIR || 'screenshot-proof';
const allowedEnvironments = new Set([
  'github-actions',
  'protected-preview',
  'codespace',
  'cursor-cloud',
  'local-exact-head',
  'other-admitted',
]);
const checkoutBoundEnvironments = new Set([
  'github-actions',
  'codespace',
  'cursor-cloud',
  'local-exact-head',
]);

if (!/^[0-9a-f]{40}$/.test(sourceRevision)) {
  throw new Error(
    `SOURCE_REVISION must be an exact 40-character lowercase SHA, got ${sourceRevision}`,
  );
}
if (!runIdentity.trim() || runIdentity.length > 1_024 || runIdentity === 'local-command') {
  throw new Error('RUN_IDENTITY must record an exact workflow run or command');
}
if (!allowedEnvironments.has(captureEnvironment)) {
  throw new Error(`CAPTURE_ENVIRONMENT must be one of ${[...allowedEnvironments].join(', ')}`);
}
if (!capturedBy.trim() || capturedBy.length > 200) {
  throw new Error('CAPTURED_BY must name the actual capturing agent or contributor');
}

const parsedBaseUrl = new URL(baseUrl);
if (!['http:', 'https:'].includes(parsedBaseUrl.protocol)) {
  throw new Error('SCREENSHOT_BASE_URL must use http or https');
}
if (
  parsedBaseUrl.username ||
  parsedBaseUrl.password ||
  parsedBaseUrl.search ||
  parsedBaseUrl.hash
) {
  throw new Error(
    'SCREENSHOT_BASE_URL cannot contain credentials, query parameters, or a fragment',
  );
}

const localHosts = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const localBase = localHosts.has(parsedBaseUrl.hostname);
let sourceIdentityEvidence = null;

if (checkoutBoundEnvironments.has(captureEnvironment)) {
  const { stdout } = await execFile('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
    timeout: 8_000,
    maxBuffer: 64 * 1_024,
  });
  const checkoutRevision = stdout.trim();
  if (checkoutRevision !== sourceRevision) {
    throw new Error(
      `checked-out revision ${checkoutRevision} does not match SOURCE_REVISION ${sourceRevision}`,
    );
  }
  sourceIdentityEvidence = {
    kind: 'git-checkout',
    revision: checkoutRevision,
  };
}

if (!localBase) {
  if (!sourceIdentityUrl.trim()) {
    throw new Error(
      'SOURCE_IDENTITY_URL is required when SCREENSHOT_BASE_URL is not loopback-local',
    );
  }
  const parsedIdentityUrl = new URL(sourceIdentityUrl);
  if (parsedIdentityUrl.protocol !== 'https:') {
    throw new Error('SOURCE_IDENTITY_URL must use https');
  }
  if (
    parsedIdentityUrl.username ||
    parsedIdentityUrl.password ||
    parsedIdentityUrl.search ||
    parsedIdentityUrl.hash
  ) {
    throw new Error(
      'SOURCE_IDENTITY_URL cannot contain credentials, query parameters, or a fragment',
    );
  }
  if (parsedIdentityUrl.origin !== parsedBaseUrl.origin) {
    throw new Error("SOURCE_IDENTITY_URL must share the captured application's origin");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let identityResponse;
  try {
    identityResponse = await fetch(parsedIdentityUrl, {
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
      headers: { accept: 'application/json, text/plain;q=0.5' },
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!identityResponse.ok) {
    throw new Error(`source identity endpoint returned HTTP ${identityResponse.status}`);
  }
  const identityBytes = Buffer.from(await identityResponse.arrayBuffer());
  if (identityBytes.length === 0 || identityBytes.length > 65_536) {
    throw new Error('source identity response must be between 1 and 65536 bytes');
  }
  const identityText = identityBytes.toString('utf8');
  const observedRevisions = identityText.match(/[0-9a-f]{40}/g) || [];
  if (!observedRevisions.includes(sourceRevision)) {
    throw new Error('source identity response does not contain the exact SOURCE_REVISION');
  }
  sourceIdentityEvidence = {
    kind: 'served-identity',
    url: parsedIdentityUrl.toString(),
    response_sha256: createHash('sha256').update(identityBytes).digest('hex'),
    revision: sourceRevision,
  };
}

if (!sourceIdentityEvidence) {
  throw new Error('no exact source-identity evidence was established');
}

const normalizedOutputDir = path.normalize(outputDir);
if (
  path.isAbsolute(normalizedOutputDir) ||
  normalizedOutputDir === '..' ||
  normalizedOutputDir.startsWith(`..${path.sep}`)
) {
  throw new Error('SCREENSHOT_OUTPUT_DIR must remain inside the repository checkout');
}

function sanitizeConsoleMessage(value) {
  let text = String(value).replace(/\s+/g, ' ').trim().slice(0, 1_000);
  text = text.replace(/(authorization|bearer|token|secret|password)=?\s*[^\s]+/gi, '$1=[REDACTED]');
  text = text.replace(/https?:\/\/[^\s]+/g, (raw) => {
    try {
      const parsed = new URL(raw);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return '[REDACTED_URL]';
    }
  });
  return text;
}

const SCROLL_REVEAL_TIMEOUT_MS = 10_000;
const SCROLL_REVEAL_TOTAL_TIMEOUT_MS = 30_000;
const SCROLL_REVEAL_RESTORATION_RESERVE_MS = 5_000;
const MAX_SCROLL_REVEAL_STEPS = 256;

async function withDeadline(operation, label, timeoutMs = SCROLL_REVEAL_TIMEOUT_MS) {
  let timeout;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} exceeded ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function revealScrollTriggeredContent(page, minimumMarkedElements) {
  if (!Number.isSafeInteger(minimumMarkedElements) || minimumMarkedElements < 0) {
    throw new Error('minimum screenshot reveal elements must be a non-negative integer');
  }

  const totalDeadline = Date.now() + SCROLL_REVEAL_TOTAL_TIMEOUT_MS;
  const sweepDeadline = totalDeadline - SCROLL_REVEAL_RESTORATION_RESERVE_MS;
  const createBoundedOperation = (deadline, createOperation, label) => {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new Error(`scroll reveal exceeded ${SCROLL_REVEAL_TOTAL_TIMEOUT_MS}ms`);
    }
    return withDeadline(createOperation(), label, Math.min(SCROLL_REVEAL_TIMEOUT_MS, remainingMs));
  };
  const bounded = (createOperation, label) =>
    createBoundedOperation(sweepDeadline, createOperation, label);
  const restorationBounded = (createOperation, label) =>
    createBoundedOperation(totalDeadline, createOperation, label);

  const initial = await bounded(
    () =>
      page.evaluate(() => {
        const scrollingElement = document.scrollingElement;
        if (!scrollingElement) throw new Error('document has no scrolling element');
        const originalScrollBehavior = scrollingElement.style.scrollBehavior;
        scrollingElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0);
        return {
          originalScrollBehavior,
          maximumScrollTop: Math.max(0, scrollingElement.scrollHeight - window.innerHeight),
          step: Math.max(1, Math.floor(window.innerHeight * 0.8)),
        };
      }),
    'scroll reveal initialization',
  );

  let revealState;
  let reachedBottomScrollTop = null;
  let maximumScrollTop = initial.maximumScrollTop;
  let sweepSteps = 0;
  let revealFailure = null;
  try {
    const sweepToStableBottom = async (phase) => {
      let targetScrollTop = 0;
      let stableBottomPasses = 0;
      let previouslyObservedMaximum = null;
      let phaseMaximumScrollTop = null;
      let phaseReachedBottomScrollTop = null;

      while (stableBottomPasses < 2) {
        if (sweepSteps >= MAX_SCROLL_REVEAL_STEPS) {
          throw new Error(`scroll reveal exceeded ${MAX_SCROLL_REVEAL_STEPS} steps`);
        }
        sweepSteps += 1;
        const positioned = await bounded(
          () =>
            page.evaluate((target) => {
              const scrollingElement = document.scrollingElement;
              if (!scrollingElement) throw new Error('document has no scrolling element');
              window.scrollTo(0, target);
              return {
                scrollTop: scrollingElement.scrollTop,
                maximumScrollTop: Math.max(0, scrollingElement.scrollHeight - window.innerHeight),
              };
            }, targetScrollTop),
          `${phase} scroll reveal position ${targetScrollTop}`,
        );
        const expectedScrollTop = Math.min(targetScrollTop, positioned.maximumScrollTop);
        if (
          typeof positioned.scrollTop !== 'number' ||
          Math.abs(positioned.scrollTop - expectedScrollTop) > 1
        ) {
          throw new Error(
            `scroll reveal failed to reach ${expectedScrollTop}; observed ${String(positioned.scrollTop)}`,
          );
        }
        await bounded(
          () =>
            page.evaluate(
              () =>
                new Promise((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(resolve)),
                ),
            ),
          `${phase} scroll reveal paint at ${targetScrollTop}`,
        );
        const observed = await bounded(
          () =>
            page.evaluate(() => {
              const scrollingElement = document.scrollingElement;
              if (!scrollingElement) throw new Error('document has no scrolling element');
              return {
                scrollTop: scrollingElement.scrollTop,
                maximumScrollTop: Math.max(0, scrollingElement.scrollHeight - window.innerHeight),
              };
            }),
          `${phase} scroll reveal geometry readback`,
        );
        phaseMaximumScrollTop = observed.maximumScrollTop;
        if (Math.abs(observed.scrollTop - observed.maximumScrollTop) <= 1) {
          stableBottomPasses =
            previouslyObservedMaximum !== null &&
            Math.abs(previouslyObservedMaximum - observed.maximumScrollTop) <= 1
              ? stableBottomPasses + 1
              : 1;
          previouslyObservedMaximum = observed.maximumScrollTop;
          phaseReachedBottomScrollTop = observed.scrollTop;
          targetScrollTop = observed.maximumScrollTop;
        } else {
          stableBottomPasses = 0;
          previouslyObservedMaximum = null;
          targetScrollTop = Math.min(observed.maximumScrollTop, observed.scrollTop + initial.step);
        }
      }

      return {
        maximumScrollTop: phaseMaximumScrollTop,
        reachedBottomScrollTop: phaseReachedBottomScrollTop,
      };
    };

    ({ maximumScrollTop, reachedBottomScrollTop } = await sweepToStableBottom('initial'));

    const markerWaitTimeout = Math.min(SCROLL_REVEAL_TIMEOUT_MS, sweepDeadline - Date.now());
    if (markerWaitTimeout <= 0) {
      throw new Error(`scroll reveal exceeded ${SCROLL_REVEAL_TOTAL_TIMEOUT_MS}ms`);
    }
    await page.waitForFunction(
      (minimum) => {
        const marked = [...document.querySelectorAll('[data-screenshot-reveal]')];
        const isEffectivelyVisible = (element) => {
          const rect = element.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return false;
          let left = rect.left;
          let right = rect.right;
          let top = rect.top;
          let bottom = rect.bottom;
          for (let current = element; current; current = current.parentElement) {
            const style = getComputedStyle(current);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              style.visibility === 'collapse' ||
              Number.parseFloat(style.opacity || '1') <= 0
            ) {
              return false;
            }
            if (current === element) continue;
            const ancestorRect = current.getBoundingClientRect();
            if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)) {
              left = Math.max(left, ancestorRect.left);
              right = Math.min(right, ancestorRect.right);
            }
            if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY)) {
              top = Math.max(top, ancestorRect.top);
              bottom = Math.min(bottom, ancestorRect.bottom);
            }
            if (right - left <= 0 || bottom - top <= 0) return false;
          }
          return Number.parseFloat(getComputedStyle(element).opacity) >= 0.99;
        };
        return marked.length >= minimum && marked.every((element) => isEffectivelyVisible(element));
      },
      minimumMarkedElements,
      { polling: 50, timeout: markerWaitTimeout },
    );
    ({ maximumScrollTop, reachedBottomScrollTop } = await sweepToStableBottom('post-reveal'));
    const readback = await bounded(
      () =>
        page.evaluate(() => {
          const scrollingElement = document.scrollingElement;
          if (!scrollingElement) throw new Error('document has no scrolling element');
          const marked = [...document.querySelectorAll('[data-screenshot-reveal]')];
          const isEffectivelyVisible = (element) => {
            const rect = element.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return false;
            let left = rect.left;
            let right = rect.right;
            let top = rect.top;
            let bottom = rect.bottom;
            for (let current = element; current; current = current.parentElement) {
              const style = getComputedStyle(current);
              if (
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                style.visibility === 'collapse' ||
                Number.parseFloat(style.opacity || '1') <= 0
              ) {
                return false;
              }
              if (current === element) continue;
              const ancestorRect = current.getBoundingClientRect();
              if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)) {
                left = Math.max(left, ancestorRect.left);
                right = Math.min(right, ancestorRect.right);
              }
              if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowY)) {
                top = Math.max(top, ancestorRect.top);
                bottom = Math.min(bottom, ancestorRect.bottom);
              }
              if (right - left <= 0 || bottom - top <= 0) return false;
            }
            return Number.parseFloat(getComputedStyle(element).opacity) >= 0.99;
          };
          return {
            marked_elements: marked.length,
            unrevealed_elements: marked.filter((element) => !isEffectivelyVisible(element)).length,
            maximumScrollTop: Math.max(0, scrollingElement.scrollHeight - window.innerHeight),
            scrollTop: scrollingElement.scrollTop,
          };
        }),
      'scroll reveal state readback',
    );
    revealState = {
      marked_elements: readback.marked_elements,
      unrevealed_elements: readback.unrevealed_elements,
    };
    if (
      revealState.marked_elements < minimumMarkedElements ||
      revealState.unrevealed_elements !== 0 ||
      typeof reachedBottomScrollTop !== 'number' ||
      typeof maximumScrollTop !== 'number' ||
      Math.abs(reachedBottomScrollTop - maximumScrollTop) > 1 ||
      Math.abs(readback.scrollTop - readback.maximumScrollTop) > 1 ||
      Math.abs(readback.maximumScrollTop - maximumScrollTop) > 1
    ) {
      throw new Error('scroll-triggered content did not reach its required visible state');
    }
    maximumScrollTop = readback.maximumScrollTop;
    reachedBottomScrollTop = readback.scrollTop;
  } catch (error) {
    revealFailure = error;
  }

  let finalScrollTop = null;
  let restorationFailure = null;
  try {
    await restorationBounded(
      () =>
        page.evaluate((originalScrollBehavior) => {
          const scrollingElement = document.scrollingElement;
          if (!scrollingElement) throw new Error('document has no scrolling element');
          window.scrollTo(0, 0);
          scrollingElement.style.scrollBehavior = originalScrollBehavior;
        }, initial.originalScrollBehavior),
      'scroll reveal restoration',
    );
    await restorationBounded(
      () =>
        page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        ),
      'scroll reveal restoration paint',
    );
    finalScrollTop = await restorationBounded(
      () => page.evaluate(() => document.scrollingElement?.scrollTop ?? null),
      'scroll reveal restoration readback',
    );
    if (typeof finalScrollTop !== 'number') {
      restorationFailure = new Error('scroll reveal restoration produced no numeric readback');
    }
    if (Math.abs(finalScrollTop) > 1) {
      restorationFailure = new Error(
        `scroll reveal failed to return to the top; observed ${finalScrollTop}`,
      );
    }
  } catch (error) {
    restorationFailure = error;
  }

  if (revealFailure && restorationFailure) {
    throw new AggregateError(
      [revealFailure, restorationFailure],
      'scroll reveal and restoration both failed',
    );
  }
  if (revealFailure) throw revealFailure;
  if (restorationFailure) throw restorationFailure;

  return {
    ...revealState,
    maximum_scroll_top: maximumScrollTop,
    reached_bottom_scroll_top: reachedBottomScrollTop,
    final_scroll_top: finalScrollTop,
    sweep_steps: sweepSteps,
  };
}

const plan = JSON.parse(await readFile(planPath, 'utf8'));
if (plan.schema !== 'szl.screenshot-capture-plan/v1') {
  throw new Error('capture plan must use schema szl.screenshot-capture-plan/v1');
}
if (!Array.isArray(plan.targets) || plan.targets.length === 0) {
  throw new Error('capture plan must contain a non-empty targets array');
}
const allowedOrigins = new Set([parsedBaseUrl.origin]);
if (plan.allowed_origins !== undefined && !Array.isArray(plan.allowed_origins)) {
  throw new Error('capture plan allowed_origins must be an array when declared');
}
for (const rawOrigin of plan.allowed_origins || []) {
  const parsedOrigin = new URL(String(rawOrigin));
  if (
    !['http:', 'https:'].includes(parsedOrigin.protocol) ||
    parsedOrigin.username ||
    parsedOrigin.password ||
    parsedOrigin.pathname !== '/' ||
    parsedOrigin.search ||
    parsedOrigin.hash
  ) {
    throw new Error(`capture plan contains an invalid allowed origin: ${rawOrigin}`);
  }
  allowedOrigins.add(parsedOrigin.origin);
}
await mkdir(normalizedOutputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const browserVersion = browser.version();
const evidence = [];
const failures = [];
const seenOutputKeys = new Set();
try {
  for (const target of plan.targets) {
    const rawSurface = String(target.surface || '').trim();
    if (!rawSurface) {
      throw new Error('every capture target must declare a non-empty surface');
    }
    const surface = rawSurface.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const route = String(target.route || '').trim();
    if (!route.startsWith('/') || route.startsWith('//') || route.includes('\\')) {
      throw new Error(`route for ${surface} must be an origin-relative path`);
    }
    const expectedHeading =
      target.expected_heading === undefined
        ? null
        : String(target.expected_heading).replace(/\s+/g, ' ').trim();
    if (
      target.expected_heading !== undefined &&
      (!expectedHeading || expectedHeading.length > 300)
    ) {
      throw new Error(`expected_heading for ${surface} must be 1-300 characters`);
    }
    const minimumScreenshotRevealElements =
      target.minimum_screenshot_reveal_elements === undefined
        ? 0
        : Number(target.minimum_screenshot_reveal_elements);
    if (
      !Number.isSafeInteger(minimumScreenshotRevealElements) ||
      minimumScreenshotRevealElements < 0
    ) {
      throw new Error(
        `minimum_screenshot_reveal_elements for ${surface} must be a non-negative integer`,
      );
    }
    const viewports =
      Array.isArray(target.viewports) && target.viewports.length
        ? target.viewports
        : [
            { width: 390, height: 844 },
            { width: 1_440, height: 1_100 },
          ];

    for (const viewport of viewports) {
      const width = Number(viewport.width);
      const height = Number(viewport.height);
      if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 320 ||
        width > 3_840 ||
        height < 568 ||
        height > 2_560
      ) {
        throw new Error(`invalid viewport for ${surface}: ${JSON.stringify(viewport)}`);
      }
      const outputKey = `${surface}:${route}:${width}x${height}`;
      if (seenOutputKeys.has(outputKey)) {
        throw new Error(`duplicate capture target: ${outputKey}`);
      }
      seenOutputKeys.add(outputKey);

      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
        serviceWorkers: 'block',
      });
      const url = new URL(route, parsedBaseUrl).toString();
      if (new URL(url).origin !== parsedBaseUrl.origin) {
        throw new Error(`capture route escaped the declared origin: ${url}`);
      }
      const consoleErrors = [];
      const pageErrors = [];
      const requestFailures = [];
      const badResponses = [];
      const undeclaredRequests = [];
      // Capture plans declare HTTP origins only; no presentation surface has
      // declared a live WebSocket channel. Block sockets before connection.
      await page.context().routeWebSocket('**/*', async (socket) => {
        if (undeclaredRequests.length < 20) {
          undeclaredRequests.push(
            sanitizeConsoleMessage(`WEBSOCKET ${socket.url()} undeclared channel`),
          );
        }
        await socket.close({ code: 1008, reason: 'Screenshot proof forbids WebSocket channels' });
      });
      page.on('console', (message) => {
        if (message.type() === 'error' && consoleErrors.length < 20) {
          consoleErrors.push(sanitizeConsoleMessage(message.text()));
        }
      });
      page.on('pageerror', (error) => {
        if (pageErrors.length < 20) pageErrors.push(sanitizeConsoleMessage(error.message));
      });
      page.on('requestfailed', (request) => {
        if (requestFailures.length < 20) {
          const failure = request.failure();
          requestFailures.push(
            sanitizeConsoleMessage(
              `${request.method()} ${request.url()}${failure?.errorText ? ` ${failure.errorText}` : ''}`,
            ),
          );
        }
      });
      page.on('response', (response) => {
        if (response.status() >= 400 && badResponses.length < 20) {
          badResponses.push(
            sanitizeConsoleMessage(
              `${response.request().method()} ${response.url()} HTTP ${response.status()}`,
            ),
          );
        }
      });
      await page.route('**/*', async (intercepted) => {
        const request = intercepted.request();
        const requestUrl = new URL(request.url());
        if (['data:', 'blob:'].includes(requestUrl.protocol)) {
          await intercepted.continue();
          return;
        }
        if (!allowedOrigins.has(requestUrl.origin)) {
          if (undeclaredRequests.length < 20) {
            undeclaredRequests.push(
              sanitizeConsoleMessage(`${request.method()} ${request.url()} undeclared origin`),
            );
          }
          await intercepted.abort('blockedbyclient');
          return;
        }
        await intercepted.continue();
      });

      let responseStatus = null;
      try {
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 30_000,
        });
        responseStatus = response?.status() ?? null;
        if (!response || response.status() >= 400) {
          throw new Error(`${surface} returned ${response?.status() ?? 'no response'} at ${url}`);
        }
        await page.waitForLoadState('networkidle', { timeout: 10_000 });
        await page.waitForFunction(
          () => document.body?.dataset.screenshotReady === 'true',
          undefined,
          { timeout: 10_000 },
        );
        // The boot marker does not establish lazy-route readiness. Require the
        // planned page identity before sampling layout, links or screenshot bytes.
        if (expectedHeading) {
          await page.waitForFunction(
            (heading) => {
              const mains = document.querySelectorAll('main');
              return (
                mains.length === 1 &&
                Array.from(mains[0].querySelectorAll('h1')).some(
                  (element) => element.textContent?.replace(/\s+/g, ' ').trim() === heading,
                )
              );
            },
            expectedHeading,
            { timeout: 10_000 },
          );
        }
        await page.evaluate(async () => {
          if (document.fonts) await document.fonts.ready;
          window.scrollTo(0, 0);
        });
        const scrollReveal = await revealScrollTriggeredContent(
          page,
          minimumScreenshotRevealElements,
        );

        const layoutEvidence = await page.evaluate(collectLayoutEvidence);
        const state = await page.evaluate(async (layout) => {
          const root = document.documentElement;
          const text = (document.body?.innerText || '').toUpperCase();
          const interactiveSelector = [
            'a[href]',
            'button',
            'input:not([type="hidden"])',
            'select',
            'textarea',
            'summary',
            '[role="button"]',
            '[role="link"]',
            '[role="tab"]',
            '[role="switch"]',
            '[role="checkbox"]',
            '[role="radio"]',
            '[role="combobox"]',
            '[role="menuitem"]',
            '[tabindex]:not([tabindex="-1"])',
          ].join(',');
          const normalizeText = (value) =>
            String(value || '')
              .replace(/\s+/g, ' ')
              .trim();
          const describeElement = (element) => {
            const className =
              typeof element.className === 'string'
                ? normalizeText(element.className).slice(0, 240)
                : null;
            const tag = element.tagName.toLowerCase();
            const rect = element.getBoundingClientRect();
            return {
              tag,
              id: element.id || null,
              role: element.getAttribute('role'),
              className,
              href: element instanceof HTMLAnchorElement ? element.href : null,
              text: normalizeText(element.textContent).slice(0, 160),
              left: Math.round(rect.left * 100) / 100,
              right: Math.round(rect.right * 100) / 100,
              top: Math.round(rect.top * 100) / 100,
              bottom: Math.round(rect.bottom * 100) / 100,
              width: Math.round(rect.width * 100) / 100,
              height: Math.round(rect.height * 100) / 100,
            };
          };
          const isVisible = (element) => {
            if (!(element instanceof Element)) return false;
            const rect = element.getBoundingClientRect();
            if (
              element.closest('[hidden],[aria-hidden="true"]') ||
              rect.width <= 0 ||
              rect.height <= 0
            ) {
              return false;
            }
            for (let current = element; current; current = current.parentElement) {
              const style = getComputedStyle(current);
              if (
                style.visibility === 'hidden' ||
                style.visibility === 'collapse' ||
                style.display === 'none' ||
                Number.parseFloat(style.opacity || '1') <= 0
              ) {
                return false;
              }
            }
            return true;
          };
          const busy = [...document.querySelectorAll('[aria-busy="true"]')].filter(
            isVisible,
          ).length;

          const accessibleName = (element) => {
            const ariaLabel = normalizeText(element.getAttribute('aria-label'));
            if (ariaLabel) return ariaLabel;
            const labelledBy = normalizeText(element.getAttribute('aria-labelledby'));
            if (labelledBy) {
              const label = labelledBy
                .split(/\s+/)
                .map((id) => normalizeText(document.getElementById(id)?.textContent))
                .filter(Boolean)
                .join(' ');
              if (label) return label;
            }
            if ('labels' in element && element.labels?.length) {
              const label = [...element.labels]
                .map((item) => normalizeText(item.textContent))
                .filter(Boolean)
                .join(' ');
              if (label) return label;
            }
            if (element instanceof HTMLInputElement) {
              if (element.type === 'image') {
                const alt = normalizeText(element.alt);
                if (alt) return alt;
              }
              if (['button', 'submit', 'reset'].includes(element.type)) {
                const value = normalizeText(element.value);
                if (value) return value;
              }
            }
            const descendantAlt = normalizeText(
              element.querySelector('img[alt]')?.getAttribute('alt'),
            );
            if (descendantAlt) return descendantAlt;
            const visibleText = normalizeText(element.textContent);
            if (visibleText) return visibleText;
            return normalizeText(element.getAttribute('title'));
          };
          const interactiveElements = [...document.querySelectorAll(interactiveSelector)].filter(
            (element) =>
              isVisible(element) &&
              !element.matches(':disabled,[aria-disabled="true"]') &&
              getComputedStyle(element).pointerEvents !== 'none',
          );
          const unnamedInteractiveElements = interactiveElements
            .filter((element) => !accessibleName(element))
            .map(describeElement)
            .slice(0, 30);
          const inlineTextLinkExemptions = [];
          const undersizedInteractiveElements = [];
          for (const element of interactiveElements) {
            const style = getComputedStyle(element);
            const isInlineProseLink =
              element instanceof HTMLAnchorElement &&
              style.display === 'inline' &&
              Boolean(element.closest('p,li,dd,dt,figcaption,blockquote')) &&
              !element.closest(
                'nav,menu,header,[role="navigation"],[role="menu"],[data-cta],[data-action]',
              );
            if (isInlineProseLink) {
              inlineTextLinkExemptions.push(describeElement(element));
              continue;
            }
            const targetRects = [element.getBoundingClientRect()];
            if ('labels' in element && element.labels?.length) {
              targetRects.push(
                ...[...element.labels].map((label) => label.getBoundingClientRect()),
              );
            }
            const targetRect = targetRects.reduce((largest, candidate) =>
              candidate.width * candidate.height > largest.width * largest.height
                ? candidate
                : largest,
            );
            if (targetRect.width < 44 || targetRect.height < 44) {
              undersizedInteractiveElements.push({
                ...describeElement(element),
                target_width: Math.round(targetRect.width * 100) / 100,
                target_height: Math.round(targetRect.height * 100) / 100,
              });
            }
          }

          const localLinkDeclarations = [...document.querySelectorAll('a[href]')]
            .filter((element) => !element.hasAttribute('download'))
            .map((element) => ({
              raw: normalizeText(element.getAttribute('href')),
              resolved: element.href,
            }));
          const invalidLocalLinkChecks = [
            ...new Set(
              localLinkDeclarations
                .filter(
                  ({ raw }) => !raw || raw === '#' || raw.toLowerCase().startsWith('javascript:'),
                )
                .map(({ raw }) => raw || '[empty href]'),
            ),
          ]
            .sort()
            .map((href) => ({
              href,
              ok: false,
              status: null,
              error: 'empty, fragment-only, or script-backed navigation target',
            }));
          const localLinkCandidates = localLinkDeclarations
            .filter(({ raw }) => raw && raw !== '#' && !raw.toLowerCase().startsWith('javascript:'))
            .map(({ resolved }) => resolved)
            .filter((href) => {
              try {
                const parsed = new URL(href, window.location.href);
                return (
                  ['http:', 'https:'].includes(parsed.protocol) &&
                  parsed.origin === window.location.origin
                );
              } catch {
                return false;
              }
            });
          const localLinks = [...new Set(localLinkCandidates)].sort();
          const localLinkChecks = await Promise.all(
            localLinks.map(async (href) => {
              const parsed = new URL(href);
              if (
                parsed.pathname === location.pathname &&
                parsed.search === window.location.search &&
                parsed.hash
              ) {
                let fragment = '';
                try {
                  fragment = decodeURIComponent(parsed.hash.slice(1));
                } catch {
                  return { href, ok: false, status: null, error: 'invalid fragment encoding' };
                }
                const fragmentTarget =
                  fragment &&
                  (document.getElementById(fragment) || document.getElementsByName(fragment)[0]);
                return {
                  href,
                  ok: Boolean(fragmentTarget),
                  status: null,
                  error: fragmentTarget ? null : 'same-document fragment target not found',
                };
              }
              parsed.hash = '';
              const controller = new AbortController();
              const timeout = window.setTimeout(() => controller.abort(), 8_000);
              try {
                const response = await fetch(parsed.toString(), {
                  method: 'GET',
                  cache: 'no-store',
                  credentials: 'same-origin',
                  redirect: 'follow',
                  headers: { accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1' },
                  signal: controller.signal,
                });
                const finalUrl = new URL(response.url || parsed.toString());
                return {
                  href,
                  final_url: finalUrl.toString(),
                  ok:
                    response.status >= 200 &&
                    response.status < 400 &&
                    finalUrl.origin === window.location.origin,
                  status: response.status,
                  error:
                    finalUrl.origin === window.location.origin
                      ? null
                      : 'same-origin link redirected to a different origin',
                };
              } catch (error) {
                return {
                  href,
                  ok: false,
                  status: null,
                  error: normalizeText(error instanceof Error ? error.message : error).slice(
                    0,
                    300,
                  ),
                };
              } finally {
                window.clearTimeout(timeout);
              }
            }),
          );
          localLinkChecks.unshift(...invalidLocalLinkChecks);
          const localLinkFailures = localLinkChecks.filter((check) => !check.ok);
          return {
            title: document.title,
            readyState: document.readyState,
            screenshotReady: document.body?.dataset.screenshotReady === 'true',
            clientWidth: root.clientWidth,
            scrollWidth: root.scrollWidth,
            horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
            overflowingElements: layout.viewportOverflowingElements,
            ...layout,
            interactiveCount: interactiveElements.length,
            unnamedInteractiveElements,
            undersizedInteractiveElements: undersizedInteractiveElements.slice(0, 30),
            inlineTextLinkExemptions: inlineTextLinkExemptions.slice(0, 30),
            localLinkChecks,
            localLinkFailures,
            mainCount: document.querySelectorAll('main').length,
            h1Count: document.querySelectorAll('h1').length,
            headings: [...document.querySelectorAll('h1')].map((heading) =>
              (heading.textContent || '').replace(/\s+/g, ' ').trim(),
            ),
            blockedPlaceholder:
              ['LOREM', 'PLACEHOLDER', 'YOUR TEXT HERE'].find((token) => text.includes(token)) ||
              null,
            busy,
          };
        }, layoutEvidence);

        const capturedAt = new Date();
        const date = capturedAt.toISOString().slice(0, 10);
        const filename = `${surface}-${date}-${width}x${height}.png`;
        const filePath = path.join(normalizedOutputDir, filename);
        await page.screenshot({ path: filePath, fullPage: true, timeout: 60_000 });
        const bytes = await readFile(filePath);
        const record = {
          filename,
          route,
          url,
          surface,
          response_status: responseStatus,
          capture_date: date,
          captured_at: capturedAt.toISOString(),
          captured_by: capturedBy,
          capture_environment: captureEnvironment,
          source_revision: sourceRevision,
          source_identity: sourceIdentityEvidence,
          workflow_run_or_command: runIdentity,
          viewport: { width, height },
          expected_heading: expectedHeading,
          minimum_screenshot_reveal_elements: minimumScreenshotRevealElements,
          scroll_reveal: scrollReveal,
          artifact_sha256: createHash('sha256').update(bytes).digest('hex'),
          console_errors: consoleErrors,
          page_errors: pageErrors,
          request_failures: requestFailures,
          bad_responses: badResponses,
          undeclared_requests: undeclaredRequests,
          state,
        };
        evidence.push(record);

        const recordFailures = [];
        if (state.readyState !== 'complete') {
          recordFailures.push('document did not reach complete');
        }
        if (!state.screenshotReady) {
          recordFailures.push('application did not retain data-screenshot-ready="true"');
        }
        if (state.horizontalOverflow) {
          recordFailures.push(
            `page-level horizontal overflow: ${state.scrollWidth}px > ${state.clientWidth}px`,
          );
        }
        if (state.viewportOverflowingElements.length) {
          recordFailures.push(
            `${state.viewportOverflowingElements.length} visible content elements escaped the viewport`,
          );
        }
        if (state.clippedElements.length) {
          recordFailures.push(
            `${state.clippedElements.length} visible content elements were clipped by horizontal overflow`,
          );
        }
        if (state.horizontallyOverflowingContainers.length) {
          recordFailures.push(
            `${state.horizontallyOverflowingContainers.length} containers had undeclared horizontal overflow`,
          );
        }
        if (state.textOverflowingElements.length) {
          recordFailures.push(
            `${state.textOverflowingElements.length} text ranges exceeded their formatting containers`,
          );
        }
        if (state.unnamedInteractiveElements.length) {
          recordFailures.push(
            `${state.unnamedInteractiveElements.length} visible interactive controls lacked accessible names`,
          );
        }
        if (state.undersizedInteractiveElements.length) {
          recordFailures.push(
            `${state.undersizedInteractiveElements.length} visible interactive controls were smaller than 44x44px`,
          );
        }
        if (state.localLinkFailures.length) {
          recordFailures.push(
            `local link failures: ${state.localLinkFailures
              .map(
                (check) =>
                  `${check.href} ${check.status === null ? check.error : `HTTP ${check.status}`}`,
              )
              .join(' | ')}`,
          );
        }
        if (state.mainCount !== 1) {
          recordFailures.push(`expected one main landmark, observed ${state.mainCount}`);
        }
        if (state.h1Count < 1) recordFailures.push('no H1 rendered');
        if (expectedHeading && !state.headings.includes(expectedHeading)) {
          recordFailures.push(
            `expected H1 ${JSON.stringify(expectedHeading)}, observed ${JSON.stringify(state.headings)}`,
          );
        }
        if (state.blockedPlaceholder) {
          recordFailures.push(`blocked placeholder ${state.blockedPlaceholder}`);
        }
        if (state.busy > 0) {
          recordFailures.push(`${state.busy} visible aria-busy regions remained`);
        }
        if (consoleErrors.length) {
          recordFailures.push(`console errors: ${consoleErrors.join(' | ')}`);
        }
        if (pageErrors.length) {
          recordFailures.push(`page errors: ${pageErrors.join(' | ')}`);
        }
        if (requestFailures.length) {
          recordFailures.push(`request failures: ${requestFailures.join(' | ')}`);
        }
        if (badResponses.length) {
          recordFailures.push(`bad HTTP responses: ${badResponses.join(' | ')}`);
        }
        if (undeclaredRequests.length) {
          recordFailures.push(`undeclared network requests: ${undeclaredRequests.join(' | ')}`);
        }
        if (recordFailures.length) {
          failures.push({
            surface,
            route,
            viewport: { width, height },
            failures: recordFailures,
            overflowing_elements: state.overflowingElements,
            clipped_elements: state.clippedElements,
            horizontally_overflowing_containers: state.horizontallyOverflowingContainers,
            text_overflowing_elements: state.textOverflowingElements,
            unnamed_interactive_elements: state.unnamedInteractiveElements,
            undersized_interactive_elements: state.undersizedInteractiveElements,
            local_link_failures: state.localLinkFailures,
          });
        }
      } catch (error) {
        failures.push({
          surface,
          route,
          viewport: { width, height },
          failures: [sanitizeConsoleMessage(error)],
          response_status: responseStatus,
        });
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

const report = {
  schema: 'szl.screenshot-proof/v1',
  state: failures.length ? 'FAILED' : 'VERIFIED',
  source_revision: sourceRevision,
  source_identity: sourceIdentityEvidence,
  capture_environment: captureEnvironment,
  captured_by: capturedBy,
  workflow_run_or_command: runIdentity,
  browser: { engine: 'chromium', version: browserVersion },
  allowed_origins: [...allowedOrigins].sort(),
  network_policy: {
    http: 'declared-origins-only',
    service_workers: 'blocked',
    web_sockets: 'blocked',
  },
  evidence,
  failures,
};
await writeFile(
  path.join(normalizedOutputDir, 'metadata.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
process.stdout.write(
  `${JSON.stringify(
    {
      state: report.state,
      captures: evidence.length,
      failures: failures.length,
      source_revision: sourceRevision,
    },
    null,
    2,
  )}\n`,
);
if (failures.length) process.exitCode = 1;
