import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';

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
        await page.evaluate(async () => {
          if (document.fonts) await document.fonts.ready;
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(500);

        const state = await page.evaluate(async () => {
          const root = document.documentElement;
          const text = (document.body?.innerText || '').toUpperCase();
          const tolerance = 1;
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
          const hasDirectText = (element) =>
            [...element.childNodes].some(
              (node) => node.nodeType === Node.TEXT_NODE && normalizeText(node.textContent),
            );
          const isMeaningful = (element) =>
            element.matches(
              `${interactiveSelector},img,video,canvas,table,pre,code,p,h1,h2,h3,h4,h5,h6,li,dt,dd`,
            ) || hasDirectText(element);
          const hasHorizontalContainment = (element) => {
            for (
              let ancestor = element.parentElement;
              ancestor;
              ancestor = ancestor.parentElement
            ) {
              if (
                ['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(ancestor).overflowX)
              ) {
                return true;
              }
            }
            return false;
          };
          const busy = [...document.querySelectorAll('[aria-busy="true"]')].filter(
            isVisible,
          ).length;
          const meaningfulVisibleElements = [...document.querySelectorAll('body *')].filter(
            (element) => isVisible(element) && isMeaningful(element),
          );
          const viewportOverflowingElements = meaningfulVisibleElements
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return (
                (rect.left < -tolerance || rect.right > root.clientWidth + tolerance) &&
                !hasHorizontalContainment(element)
              );
            })
            .map(describeElement)
            .sort(
              (a, b) =>
                Math.max(b.right - root.clientWidth, -b.left) -
                Math.max(a.right - root.clientWidth, -a.left),
            )
            .slice(0, 30);
          const clippedElements = meaningfulVisibleElements
            .map((element) => {
              const rect = element.getBoundingClientRect();
              for (
                let ancestor = element.parentElement;
                ancestor && ancestor !== document.body;
                ancestor = ancestor.parentElement
              ) {
                const overflowX = getComputedStyle(ancestor).overflowX;
                if (!['hidden', 'clip'].includes(overflowX)) continue;
                const ancestorRect = ancestor.getBoundingClientRect();
                const clippedLeft = Math.max(0, ancestorRect.left - rect.left);
                const clippedRight = Math.max(0, rect.right - ancestorRect.right);
                if (clippedLeft > tolerance || clippedRight > tolerance) {
                  return {
                    ...describeElement(element),
                    clipped_by: describeElement(ancestor),
                    clipped_left_px: Math.round(clippedLeft * 100) / 100,
                    clipped_right_px: Math.round(clippedRight * 100) / 100,
                  };
                }
              }
              return null;
            })
            .filter(Boolean)
            .sort(
              (a, b) =>
                b.clipped_left_px + b.clipped_right_px - (a.clipped_left_px + a.clipped_right_px),
            )
            .slice(0, 30);

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
            overflowingElements: viewportOverflowingElements,
            viewportOverflowingElements,
            clippedElements,
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
        });

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
            `${state.clippedElements.length} visible content elements were clipped by hidden overflow`,
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
