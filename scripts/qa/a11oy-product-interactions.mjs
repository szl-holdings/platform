import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium, expect as playwrightExpect } from '@playwright/test';
import { collectLayoutEvidence } from './screenshot-layout-helpers.mjs';

// Browser action and assertion readiness share one deadline. Playwright's
// implicit five-second assertion default otherwise expires before the declared
// ten-second lazy-route readiness budget on a cold local build.
const READINESS_TIMEOUT_MS = 10_000;
const expect = playwrightExpect.configure({ timeout: READINESS_TIMEOUT_MS });
const SOURCE_IDENTITY_PATH = '/a11oy/__source-identity.json';
const SHA_256 = /^[0-9a-f]{64}$/;
const GIT_SHA = /^[0-9a-f]{40}$/;
const PROOF_COVERAGE_BASELINE_STATUSES = Object.freeze({
  'signal-records': 'UNAVAILABLE',
  'contract-record': 'SATISFIED',
  'action-context': 'SATISFIED',
  'evaluation-lineage': 'SATISFIED',
  'contract-integrity': 'SATISFIED',
  'origin-signal': 'SATISFIED',
  'action-binding': 'SATISFIED',
  'trace-binding': 'UNAVAILABLE',
  'policy-evaluation': 'UNAVAILABLE',
  'approval-binding': 'UNAVAILABLE',
  'proof-reference': 'SATISFIED',
  'proof-subject': 'MISMATCH',
  'proof-context': 'MISMATCH',
  'proof-policy-binding': 'UNAVAILABLE',
  'proof-approval-binding': 'UNAVAILABLE',
  'proof-integrity': 'SATISFIED',
  'terminal-state': 'MISMATCH',
});
const PROOF_COVERAGE_SCENARIOS = Object.freeze({
  baseline: {
    state: 'INCOMPLETE',
    satisfied: 8,
    total: 17,
    activeChallenges: [],
    statuses: PROOF_COVERAGE_BASELINE_STATUSES,
    details: {
      'trace-binding':
        'The trace IDs agree, but no ExecutionTrace record resolves in the supplied registry.',
      'proof-integrity':
        'The packet has a SHA-256-shaped reference, payload, unique witnesses, and parseable issue time. This is not signature verification.',
      'terminal-state':
        'The Workcell terminal status or verification checksum is missing or malformed.',
    },
  },
  'remove-proof-reference': {
    state: 'INCOMPLETE',
    satisfied: 6,
    total: 17,
    activeChallenges: ['Remove proof reference'],
    statuses: {
      ...PROOF_COVERAGE_BASELINE_STATUSES,
      'proof-reference': 'UNAVAILABLE',
      'proof-subject': 'UNAVAILABLE',
      'proof-context': 'UNAVAILABLE',
      'proof-integrity': 'UNAVAILABLE',
      'terminal-state': 'UNAVAILABLE',
    },
    details: {
      'proof-reference': 'The inspected contract has no Proof Packet reference.',
    },
  },
  'substitute-action-id': {
    state: 'INCOMPLETE',
    satisfied: 7,
    total: 17,
    activeChallenges: ['Substitute action ID'],
    statuses: {
      ...PROOF_COVERAGE_BASELINE_STATUSES,
      'action-binding': 'MISMATCH',
    },
    details: {
      'action-binding': 'The contract action does not match the Workcell ActionBrief.',
    },
  },
  'omit-approval-reference': {
    state: 'INCOMPLETE',
    satisfied: 8,
    total: 17,
    activeChallenges: ['Omit approval reference'],
    statuses: PROOF_COVERAGE_BASELINE_STATUSES,
    details: {
      'approval-binding':
        'This approval-required Workcell has no approval-record reference in the inspected contract.',
      'proof-approval-binding':
        'The inspected contract has no approval-record reference to compare with the Proof Packet.',
    },
  },
  combined: {
    state: 'INCOMPLETE',
    satisfied: 5,
    total: 17,
    activeChallenges: ['Remove proof reference', 'Substitute action ID', 'Omit approval reference'],
    statuses: {
      ...PROOF_COVERAGE_BASELINE_STATUSES,
      'action-binding': 'MISMATCH',
      'proof-reference': 'UNAVAILABLE',
      'proof-subject': 'UNAVAILABLE',
      'proof-context': 'UNAVAILABLE',
      'proof-integrity': 'UNAVAILABLE',
      'terminal-state': 'UNAVAILABLE',
    },
    details: {
      'action-binding': 'The contract action does not match the Workcell ActionBrief.',
      'approval-binding':
        'This approval-required Workcell has no approval-record reference in the inspected contract.',
      'proof-reference': 'The inspected contract has no Proof Packet reference.',
      'proof-approval-binding':
        'The inspected contract has no approval-record reference to compare with the Proof Packet.',
    },
  },
});

async function observeProofCoverage(inspector) {
  const aggregateState =
    (await inspector.locator('[role="status"] [data-status-pill]').textContent())?.trim() ?? '';
  const aggregateSummary =
    (await inspector.getByText(/^\d+\/\d+ obligations satisfied$/).textContent())?.trim() ?? '';
  const liveMessage =
    (await inspector.locator('[data-proof-live-message]').textContent())?.trim() ?? '';
  const obligations = await inspector.locator('[data-proof-obligation]').evaluateAll((items) =>
    items.map((item) => ({
      id: item.getAttribute('data-proof-obligation') ?? '',
      status: item.querySelector('[data-status-pill]')?.textContent?.trim() ?? '',
      detail:
        item.querySelector('[data-proof-detail]')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
    })),
  );
  return { aggregateState, aggregateSummary, liveMessage, obligations };
}

function assertProofCoverage(observed, expected, label) {
  assert.equal(observed.aggregateState, expected.state, `${label} aggregate state`);
  assert.equal(
    observed.aggregateSummary,
    `${expected.satisfied}/${expected.total} obligations satisfied`,
    `${label} aggregate count`,
  );
  const challengeText =
    expected.activeChallenges.length > 0
      ? `Active challenges: ${expected.activeChallenges.join(', ')}.`
      : 'No active challenges.';
  assert.equal(
    observed.liveMessage,
    `${expected.state}. ${expected.satisfied} of ${expected.total} obligations satisfied. ${challengeText}`,
    `${label} live-region summary`,
  );
  assert.equal(observed.obligations.length, expected.total, `${label} obligation row count`);
  const observedStatuses = Object.fromEntries(
    observed.obligations.map((item) => [item.id, item.status]),
  );
  assert.equal(
    Object.keys(observedStatuses).length,
    observed.obligations.length,
    `${label} obligation IDs must be unique`,
  );
  assert.deepEqual(observedStatuses, expected.statuses, `${label} obligation statuses`);
  for (const [id, detail] of Object.entries(expected.details)) {
    assert.equal(
      observed.obligations.find((item) => item.id === id)?.detail,
      detail,
      `${label}/${id} detail`,
    );
  }
}

function validateExpectedServedIdentity(identity) {
  if (!identity) return null;
  const expected = {
    sourceRevision: String(identity.sourceRevision ?? '')
      .trim()
      .toLowerCase(),
    sourceTreeSha: String(identity.sourceTreeSha ?? '')
      .trim()
      .toLowerCase(),
    buildManifestSha256: String(identity.buildManifestSha256 ?? '')
      .trim()
      .toLowerCase(),
    indexHtmlSha256: String(identity.indexHtmlSha256 ?? '')
      .trim()
      .toLowerCase(),
    proofNonce: String(identity.proofNonce ?? '')
      .trim()
      .toLowerCase(),
  };
  assert.match(expected.sourceRevision, GIT_SHA, 'served source revision');
  assert.match(expected.sourceTreeSha, GIT_SHA, 'served source tree');
  assert.match(expected.buildManifestSha256, SHA_256, 'served build manifest');
  assert.match(expected.indexHtmlSha256, SHA_256, 'served index asset');
  assert.match(expected.proofNonce, SHA_256, 'served proof nonce');
  return expected;
}

async function verifyServedIdentity(origin, expected) {
  if (!expected) {
    return {
      state: 'UNBOUND',
      non_claim:
        'No source/build identity was supplied; this receipt is browser regression evidence only.',
    };
  }

  const response = await fetch(`${origin}${SOURCE_IDENTITY_PATH}`, {
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(READINESS_TIMEOUT_MS),
  });
  assert.equal(response.status, 200, 'source identity endpoint');
  const expectedHeaders = {
    'x-szl-source-sha': expected.sourceRevision,
    'x-szl-source-tree-sha': expected.sourceTreeSha,
    'x-szl-build-manifest-sha256': expected.buildManifestSha256,
    'x-szl-proof-nonce': expected.proofNonce,
  };
  for (const [name, value] of Object.entries(expectedHeaders)) {
    assert.equal(response.headers.get(name), value, `source identity header ${name}`);
  }
  const document = await response.json();
  assert.deepEqual(document, {
    schema: 'szl.a11oy-served-build-identity/v1',
    source_revision: expected.sourceRevision,
    source_tree_sha: expected.sourceTreeSha,
    build_manifest_sha256: expected.buildManifestSha256,
    index_html_sha256: expected.indexHtmlSha256,
    base_path: '/a11oy/',
    proof_nonce: expected.proofNonce,
  });
  return {
    state: 'VERIFIED',
    identity_path: SOURCE_IDENTITY_PATH,
    source_revision: expected.sourceRevision,
    source_tree_sha: expected.sourceTreeSha,
    build_manifest_sha256: expected.buildManifestSha256,
    index_html_sha256: expected.indexHtmlSha256,
    proof_nonce: expected.proofNonce,
  };
}

async function verifyNavigationIdentity(response, expected, route) {
  if (!expected) return;
  const expectedHeaders = {
    'x-szl-source-sha': expected.sourceRevision,
    'x-szl-source-tree-sha': expected.sourceTreeSha,
    'x-szl-build-manifest-sha256': expected.buildManifestSha256,
    'x-szl-proof-nonce': expected.proofNonce,
    'x-szl-served-asset-sha256': expected.indexHtmlSha256,
  };
  for (const [name, value] of Object.entries(expectedHeaders)) {
    assert.equal(await response.headerValue(name), value, `${route} response header ${name}`);
  }
}

// Read-only, loopback-only browser checks. These exercise fixture interfaces;
// they never approve a Workcell, authenticate a provider, or execute an action.
export async function verifyProductInteractions(origin, options = {}) {
  const target = new URL(origin);
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname));
  assert.equal(target.protocol, 'http:');
  assert.equal(target.username + target.password + target.search + target.hash, '');
  const expectedServedIdentity = validateExpectedServedIdentity(options.expectedServedIdentity);
  const servedIdentity = await verifyServedIdentity(target.origin, expectedServedIdentity);
  const capturePlan = JSON.parse(
    await readFile(
      new URL('../../audit/series-a-screenshot-capture-plan.json', import.meta.url),
      'utf8',
    ),
  );
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH?.trim() || undefined;
  const browser = await chromium.launch({ headless: true, executablePath });
  let timedOut = false;
  // Locator timeouts do not cover evaluate()/font readiness. Close the owned
  // browser at the suite deadline so a stalled renderer cannot strand capture.
  const deadline = setTimeout(
    () => {
      timedOut = true;
      void browser.close().catch(() => {});
    },
    10 * 60 * 1000,
  );
  deadline.unref();
  const records = [];
  const proofCoverageObservations = [];
  try {
    for (const width of [320, 390, 768, 1366, 1728]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: 'block',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(READINESS_TIMEOUT_MS);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.name));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push('console.error');
      });
      await context.routeWebSocket('**/*', (socket) => {
        errors.push('WebSocket connection is not admitted for fixture verification');
        socket.close();
      });
      await context.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin === target.origin || ['data:', 'blob:'].includes(url.protocol)) {
          await route.continue();
        } else {
          errors.push(`undeclared origin: ${url.origin}`);
          await route.abort();
        }
      });
      const check = async (name) => {
        const layout = await page.evaluate(collectLayoutEvidence);
        for (const [key, value] of Object.entries(layout)) {
          if (Array.isArray(value) && !key.startsWith('allowed')) {
            assert.equal(
              value.length,
              0,
              `${width}/${name}/${key}: ${JSON.stringify(value.slice(0, 3))}`,
            );
          }
        }
        const smallButtons = await page
          .locator('main button, dialog button')
          .evaluateAll((buttons) =>
            buttons
              .filter((button) => {
                const rect = button.getBoundingClientRect();
                return (
                  !button.closest('[inert]') &&
                  rect.width > 0 &&
                  rect.height > 0 &&
                  (rect.width < 43 || rect.height < 43)
                );
              })
              .map((button) => button.getAttribute('aria-label') || button.textContent),
          );
        assert.deepEqual(smallButtons, [], `${width}/${name}: undersized buttons`);
        const wrappedStatusPills = await page
          .locator('main [data-status-pill]')
          .evaluateAll((pills) =>
            pills
              .filter((pill) => getComputedStyle(pill).whiteSpace !== 'nowrap')
              .map((pill) => pill.textContent),
          );
        assert.deepEqual(wrappedStatusPills, [], `${width}/${name}: split operational status`);
        assert.deepEqual(errors, [], `${width}/${name} browser errors`);
        records.push({ width, state: name, result: 'PASS', layout });
      };
      const go = async (route) => {
        try {
          const response = await page.goto(`${target.origin}/a11oy/${route}`);
          assert.equal(response?.status(), 200, route);
          assert.ok(response, `${route} returned no main-resource response`);
          await verifyNavigationIdentity(response, expectedServedIdentity, route);
          await page.waitForFunction(() => document.body.dataset.screenshotReady === 'true');
          await page.evaluate(async () => document.fonts.ready);
          await expect(page.locator('main h1')).toBeVisible();
        } catch (cause) {
          // Preserve failure context without more browser calls: an unresponsive
          // renderer must not strand reporting or extend the readiness deadline.
          throw new Error(
            `Product navigation failed: ${JSON.stringify({
              width,
              route,
              lastPassingState: records.at(-1)?.state ?? null,
              browserErrors: errors.slice(-10),
            })}`,
            { cause },
          );
        }
      };

      for (const entry of capturePlan.targets) {
        await go(entry.route.replace('/a11oy/', ''));
        await expect(page.locator('main h1')).toHaveText(entry.expected_heading);
        await check(`initial-route:${entry.route}`);
      }

      await go('workcells');
      const toggle = page.getByRole('button', { name: 'Toggle sidebar', exact: true });
      if (width < 768) {
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await toggle.click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(page.locator('main')).toHaveAttribute('inert', '');
        const first = dialog.getByRole('button', { name: 'Close navigation', exact: true });
        await expect(first).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        assert.ok(await dialog.evaluate((element) => element.contains(document.activeElement)));
        await page.keyboard.press('Tab');
        await expect(first).toBeFocused();
        await check('mobile-drawer-open');
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await expect(toggle).toBeFocused();
        await expect(page.locator('main')).not.toHaveAttribute('inert', '');
        await toggle.click();
        await first.click();
        await expect(dialog).not.toBeVisible();
        await expect(toggle).toBeFocused();
        await check('mobile-drawer-close-button');
        await toggle.click();
        await expect(dialog).toBeVisible();
        await page.mouse.click(width - 5, 450);
        await expect(dialog).not.toBeVisible();
        await expect(toggle).toBeFocused();
        await check('mobile-drawer-backdrop-close');
        await toggle.click();
        await expect(dialog).toBeVisible();
        await page.setViewportSize({ width: 1366, height: 900 });
        await expect(dialog).not.toBeVisible();
        await expect(page.locator('aside#primary-navigation')).toBeVisible();
        await expect(page.locator('main')).not.toHaveAttribute('inert', '');
        assert.notEqual(
          await page.locator('body').evaluate((body) => body.style.overflow),
          'hidden',
        );
        await page.setViewportSize({ width, height: 900 });
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await expect(page.locator('#primary-navigation')).toHaveCount(0);
        await check('mobile-drawer-resize-restoration');
        await toggle.click();
        await expect(first).toBeFocused();
        await dialog.getByRole('link', { name: 'Product Journey', exact: true }).click();
        await expect(page).toHaveURL(/\/a11oy\/product-journey$/);
        await expect(dialog).not.toBeVisible();
        await expect(page.locator('main h1')).toHaveText('One fabric. Two clear ways in.');
        await check('mobile-drawer-navigation');
        await go('workcells');
      }
      const detailLinks = page
        .locator('main')
        .getByRole('link', { name: 'View Detail', exact: true });
      await expect(detailLinks).toHaveCount(20);
      let count = 0;
      for (const status of ['running', 'completed', 'idle', 'paused', 'error']) {
        const button = page.getByRole('button', { name: status, exact: true });
        await button.click();
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        const observed = await detailLinks.count();
        count += observed;
        await expect(page.getByText(`${observed} workcells`, { exact: true })).toBeVisible();
        if (!observed) {
          await expect(page.getByText('No workcells match the current filter.')).toBeVisible();
        }
        await check(`workcells-filter-${status}`);
      }
      assert.equal(count, 20, 'status filters must partition the full registry');
      await page.getByRole('button', { name: 'all', exact: true }).click();
      await page.getByLabel('Filter workcells by vertical').selectOption('lyte-revenue');
      assert.ok((await detailLinks.count()) > 0 && (await detailLinks.count()) < 20);
      await check('workcells-filter-vertical');
      await detailLinks.first().click();
      await expect(page.locator('main')).toContainText(
        'no authenticated production operation is represented',
      );
      await check('workcell-detail-navigation');

      await go('workcells/wc-001/replay');
      await page.clock.install();
      const progress = page.getByText(/^\d+ \/ \d+ steps$/);
      await expect(progress).toHaveText(/^0 \/ \d+ steps$/);
      await page.getByRole('button', { name: '2×', exact: true }).click();
      await page.getByRole('button', { name: '▶ Play Replay', exact: true }).click();
      await page.clock.runFor(500);
      await expect(progress).toHaveText(/^1 \/ \d+ steps$/);
      await page.getByRole('button', { name: '⏸ Pause', exact: true }).click();
      const paused = await progress.textContent();
      await page.clock.runFor(2000);
      await expect(progress).toHaveText(paused);
      await page.getByRole('button', { name: '▶ Resume Replay', exact: true }).click();
      await page.clock.runFor(500);
      await expect(progress).toHaveText(/^2 \/ \d+ steps$/);
      await page.clock.runFor(15_000);
      await expect(page.getByRole('button', { name: '↩ Restart', exact: true })).toBeVisible();
      await check('replay-complete-after-pause-resume');
      await page.getByRole('button', { name: '↺ Reset', exact: true }).click();
      await expect(progress).toHaveText(/^0 \/ \d+ steps$/);
      await check('replay-reset');

      const proofCoverageInspector = page.locator(
        'section[aria-labelledby="proof-coverage-heading"]',
      );
      await expect(
        proofCoverageInspector.getByRole('heading', {
          name: 'Does the declared run resolve to the evidence it names?',
        }),
      ).toBeVisible();
      const verifyProofCoverage = async (scenario, expectedScenario = scenario) => {
        const observed = await observeProofCoverage(proofCoverageInspector);
        assertProofCoverage(
          observed,
          PROOF_COVERAGE_SCENARIOS[expectedScenario],
          `${width}/${scenario}`,
        );
        if (Object.hasOwn(PROOF_COVERAGE_SCENARIOS, scenario)) {
          proofCoverageObservations.push({
            width,
            scenario,
            aggregate_state: observed.aggregateState,
            aggregate_summary: observed.aggregateSummary,
            live_message: observed.liveMessage,
            obligation_statuses: Object.fromEntries(
              observed.obligations.map((item) => [item.id, item.status]),
            ),
          });
        }
      };
      await verifyProofCoverage('baseline');
      const proofChallenges = [
        {
          label: 'Remove proof reference',
          scenario: 'remove-proof-reference',
          obligation: 'Proof Packet resolves',
          expected: 'has no Proof Packet reference',
        },
        {
          label: 'Substitute action ID',
          scenario: 'substitute-action-id',
          obligation: 'Action identity is bound',
          expected: 'does not match the Workcell ActionBrief',
        },
        {
          label: 'Omit approval reference',
          scenario: 'omit-approval-reference',
          obligation: 'Approval reference resolves',
          expected: 'has no approval-record reference',
        },
      ];
      for (const { label, scenario, obligation, expected } of proofChallenges) {
        const challenge = page.getByRole('button', { name: new RegExp(label) });
        const liveMessage = page.locator('[data-proof-live-message]');
        await challenge.click();
        await expect(challenge).toHaveAttribute('aria-pressed', 'true');
        await expect(liveMessage).toContainText(`Active challenges: ${label}`);
        await verifyProofCoverage(scenario);
        const result = page
          .getByRole('listitem')
          .filter({ has: page.getByRole('heading', { name: obligation, exact: true }) });
        await expect(result).toHaveCount(1);
        const challengedResult = await result.textContent();
        await expect(result).toContainText(expected);
        await check(`proof-coverage:${label.toLowerCase().replaceAll(' ', '-')}`);
        await challenge.click();
        await expect(challenge).toHaveAttribute('aria-pressed', 'false');
        await expect(liveMessage).toContainText('No active challenges');
        await verifyProofCoverage(`${scenario}-restored`, 'baseline');
        await expect(result).not.toHaveText(challengedResult ?? '');
        await expect(result).not.toContainText(expected);
      }
      for (const { label } of proofChallenges) {
        await page.getByRole('button', { name: new RegExp(label) }).click();
      }
      await verifyProofCoverage('combined');
      await check('proof-coverage:combined');
      await page.getByRole('button', { name: 'Reset challenges', exact: true }).click();
      for (const { label } of proofChallenges) {
        await expect(page.getByRole('button', { name: new RegExp(label) })).toHaveAttribute(
          'aria-pressed',
          'false',
        );
      }
      await verifyProofCoverage('reset-restored', 'baseline');
      await expect(page.locator('[data-proof-live-message]')).toContainText('No active challenges');
      await expect(page.locator('[data-proof-obligation="proof-reference"]')).not.toContainText(
        'has no Proof Packet reference',
      );
      await expect(page.locator('[data-proof-obligation="action-binding"]')).not.toContainText(
        'does not match the Workcell ActionBrief',
      );
      await expect(page.locator('[data-proof-obligation="approval-binding"]')).not.toContainText(
        'has no approval-record reference',
      );
      await check('proof-coverage-reset');

      await go('proof');
      await page.getByRole('button', { name: 'Reasoning Replay', exact: true }).click();
      const prev = page.getByRole('button', { name: '← Prev', exact: true });
      const next = page.getByRole('button', { name: 'Next →', exact: true });
      await expect(prev).toBeDisabled();
      let iterations = 0;
      while (await next.isEnabled()) {
        assert.ok(iterations++ < 30, 'bounded fixture replay');
        await next.click();
      }
      await check('proof-replay-final');
      await prev.click();
      await expect(next).toBeEnabled();
      await page.getByRole('button', { name: 'Proof Diff', exact: true }).click();
      await check('proof-diff');
      await page.getByRole('button', { name: 'Proof Chain', exact: true }).click();
      await check('proof-chain');

      await go('demo');
      await page.locator('main button').first().click();
      await page.getByRole('button', { name: '▶ Start', exact: true }).click();
      iterations = 0;
      const advance = page.getByRole('button', { name: '→ Next Step', exact: true });
      while (await advance.count()) {
        assert.ok(iterations++ < 30, 'bounded demo walkthrough');
        await advance.click();
      }
      await expect(page.getByRole('button', { name: '↩ Reset', exact: true })).toBeVisible();
      await expect(page.locator('main')).toContainText(
        'No hashes, signatures, or external executions',
      );
      await check('demo-complete');
      await page.getByRole('button', { name: '↩ Reset', exact: true }).click();
      await expect(page.getByRole('button', { name: '▶ Start', exact: true })).toBeVisible();
      await check('demo-reset');
      await context.close();
      process.stderr.write(
        `Product interactions verified at ${width}px (${records.length} cumulative states).\n`,
      );
    }
    assert.equal(timedOut, false, 'product interaction suite exceeded its ten-minute deadline');
    return {
      schema: 'szl.a11oy-product-interactions/v2',
      state: 'PASS',
      browser: browser.version(),
      served_identity: servedIdentity,
      proof_coverage: {
        route: '/a11oy/workcells/wc-001/replay',
        workcell_id: 'wc-001',
        expectations: PROOF_COVERAGE_SCENARIOS,
        observations: proofCoverageObservations,
      },
      records,
      non_claim:
        'Local deterministic fixture interactions only; no external execution or hosted authority.',
    };
  } finally {
    clearTimeout(deadline);
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const receipt = await verifyProductInteractions(process.env.A11OY_URL || 'http://127.0.0.1:4110');
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}
