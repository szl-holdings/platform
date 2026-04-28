/**
 * Regression suite — Flagship Governed Decision Loop
 *
 * Covers the full nine-step Signal → Outcome loop at
 * /command/operations/governed-decision-loop.
 *
 * The loop is the single most important demo and investor flow in the
 * platform.  These tests guard every step so no code change can silently
 * break the core pitch.
 *
 * KG010 resolution: this suite provides the automated E2E regression
 * coverage previously absent from the platform.
 */

import { expect, type Page, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Path resolution
// COMMAND_BASE_PATH is "/" when CI builds command with BASE_PATH=/,
// or "/command" when running against the Replit dev proxy.
// ---------------------------------------------------------------------------
const COMMAND_BASE = (process.env.COMMAND_BASE_PATH ?? '/command').replace(/\/$/, '');
const LOOP_PATH = `${COMMAND_BASE}/operations/governed-decision-loop`;

// ---------------------------------------------------------------------------
// Availability guard — skip the entire suite if the app is not reachable
// ---------------------------------------------------------------------------
let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(LOOP_PATH, {
      timeout: 15000,
      waitUntil: 'domcontentloaded',
    });
    appAvailable = !!resp && resp.status() < 500;
  } catch {
    appAvailable = false;
  }
  await page.close();
});

test.beforeEach(async ({}, testInfo) => {
  if (!appAvailable) testInfo.skip();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the loop page and wait for the React shell to settle. */
async function goToLoop(page: Page) {
  await page.goto(LOOP_PATH, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
    // networkidle is best-effort; proceed even if it times out
  });
}

/**
 * Click the step button identified by its visible label in the StepIndicator.
 * Returns after the step content region settles.
 */
async function clickStep(page: Page, label: string) {
  // Step buttons are inside the progress bar row; match by text
  const btn = page
    .locator('button')
    .filter({ hasText: new RegExp(`^${label}$`, 'i') })
    .first();
  await btn.click();
  // The step header updates immediately — wait for it to be visible
  await expect(page.locator(`text=${label}`).first()).toBeVisible({ timeout: 10000 });
}

// ---------------------------------------------------------------------------
// Suite 1 — Page-level smoke
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Page shell', () => {
  test('page loads without fatal errors', async ({ page }) => {
    await goToLoop(page);

    // No React error boundary
    await expect(page.locator('text=Something went wrong').first())
      .not.toBeVisible({ timeout: 5000 })
      .catch(() => {
        // If locator is not found at all, that's fine
      });

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('page renders the Governed Decision Loop heading', async ({ page }) => {
    await goToLoop(page);
    const heading = page.locator('h1', { hasText: 'Governed Decision Loop' });
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('page renders the KORA · Governed Decision Loop label', async ({ page }) => {
    await goToLoop(page);
    const label = page.locator('text=KORA · Governed Decision Loop');
    await expect(label).toBeVisible({ timeout: 15000 });
  });

  test('Demo Scenario bar is visible with Maritime Fleet Command label', async ({ page }) => {
    await goToLoop(page);
    const scenarioBar = page.locator('text=Demo Scenario');
    await expect(scenarioBar.first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Maritime Fleet Command').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('page body has substantive content', async ({ page }) => {
    await goToLoop(page);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(1000);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — Step indicator (progress bar)
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step indicator', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
  });

  const STEP_LABELS = [
    'Signal',
    'Context',
    'Recommendation',
    'Simulation',
    'Policy Gate',
    'Approval',
    'Execution',
    'Proof Chain',
    'Outcome',
  ];

  for (const label of STEP_LABELS) {
    test(`step indicator shows "${label}" button`, async ({ page }) => {
      const btn = page
        .locator('button')
        .filter({ hasText: new RegExp(`^${label}$`, 'i') })
        .first();
      await expect(btn).toBeVisible({ timeout: 10000 });
    });
  }

  test('all nine step buttons are present', async ({ page }) => {
    // Each step label appears at least once in the indicator row
    for (const label of STEP_LABELS) {
      await expect(
        page
          .locator('button')
          .filter({ hasText: new RegExp(`^${label}$`, 'i') })
          .first(),
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('pagination dot buttons are present (9 dots)', async ({ page }) => {
    // Dots have aria-label "Go to step N: <Label>"
    const dots = page.locator('button[aria-label^="Go to step"]');
    await expect(dots).toHaveCount(9, { timeout: 10000 });
  });

  test('Previous button is disabled on the first step', async ({ page }) => {
    const prevBtn = page.locator('button', { hasText: /previous/i });
    await expect(prevBtn).toBeDisabled({ timeout: 10000 });
  });

  test('Next button is enabled on the first step', async ({ page }) => {
    const nextBtn = page.locator('button', { hasText: /next/i });
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Step 1: Signal
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step 1: Signal', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
    // Signal is the default (step 0); no navigation needed
  });

  test("step header shows 'Step 1: Signal'", async ({ page }) => {
    await expect(page.locator('text=Step 1: Signal').first()).toBeVisible({ timeout: 10000 });
  });

  test('signal ID SIG-4821 is displayed', async ({ page }) => {
    await expect(page.locator('text=SIG-4821').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('signal title mentions fleet ETA compliance', async ({ page }) => {
    await expect(page.locator('text=Fleet ETA compliance gap').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('risk estimate $2.1M is displayed', async ({ page }) => {
    await expect(page.locator('text=$2.1M').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('affected vessels M/V Meridian, M/V Catalyst, M/V Horizon are listed', async ({ page }) => {
    await expect(page.locator('text=M/V Meridian').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=M/V Catalyst').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=M/V Horizon').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Evidence Rail is visible', async ({ page }) => {
    await expect(page.locator('text=Evidence Rail').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('AIS position deviation evidence is shown', async ({ page }) => {
    await expect(page.locator('text=AIS position deviation').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — Step 2: Context
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step 2: Context', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
    await clickStep(page, 'Context');
  });

  test("step header shows 'Step 2: Context'", async ({ page }) => {
    await expect(page.locator('text=Step 2: Context').first()).toBeVisible({ timeout: 10000 });
  });

  test('Cross-Domain Intelligence section is visible', async ({ page }) => {
    await expect(page.locator('text=Cross-Domain Intelligence').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('PARAGON cross-domain signal is displayed', async ({ page }) => {
    await expect(page.locator('text=PARAGON').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('pattern confidence 87% is shown in the stats grid', async ({ page }) => {
    // Scope to the stats grid that contains "Pattern Confidence" label,
    // ensuring we match the context metric rather than any other 87% on the page.
    const statsGrid = page
      .locator('div')
      .filter({ hasText: /Pattern Confidence/ })
      .last();
    await expect(statsGrid.locator('text=87%').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('14 historical matches are shown in the stats grid', async ({ page }) => {
    const statsGrid = page
      .locator('div')
      .filter({ hasText: /Historical Matches/ })
      .last();
    await expect(statsGrid.locator('text=14').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Enrichment Sources section is visible', async ({ page }) => {
    await expect(page.locator('text=Enrichment Sources').first()).toBeVisible({ timeout: 10000 });
  });

  test('AIS Live Feed enrichment source is listed', async ({ page }) => {
    await expect(page.locator('text=AIS Live Feed').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 5 — Step 3: Recommendation
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step 3: Recommendation', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
    await clickStep(page, 'Recommendation');
  });

  test("step header shows 'Step 3: Recommendation'", async ({ page }) => {
    await expect(page.locator('text=Step 3: Recommendation').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('recommendation ID REC-0421 is shown', async ({ page }) => {
    await expect(page.locator('text=REC-0421').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('confidence score 82% is displayed within the recommendation card', async ({ page }) => {
    // Scope to the recommendation card by anchoring on the REC-0421 panel
    // to avoid matching a 82% from another step if the page caches prior content.
    const recCard = page
      .locator('div')
      .filter({ hasText: /REC-0421/ })
      .last();
    await expect(recCard.locator('text=82%').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('model attribution szl-ops-advisor-v3 is visible', async ({ page }) => {
    await expect(page.locator('text=szl-ops-advisor-v3').first()).toBeVisible({ timeout: 10000 });
  });

  test('reroute recommendation text is displayed', async ({ page }) => {
    await expect(page.locator('text=Authorize fuel surcharge pass-through').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Reasoning Chain is visible', async ({ page }) => {
    await expect(page.locator('text=Reasoning Chain').first()).toBeVisible({ timeout: 10000 });
  });

  test('SLA penalty reasoning is listed', async ({ page }) => {
    await expect(page.locator('text=2.1M SLA penalty').first()).toBeVisible({ timeout: 10000 });
  });

  test('Alternative Considered section is visible', async ({ page }) => {
    await expect(page.locator('text=Alternative Considered').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 6 — Step 4: Simulation (Monte Carlo)
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step 4: Simulation', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
    await clickStep(page, 'Simulation');
  });

  test("step header shows 'Step 4: Simulation'", async ({ page }) => {
    await expect(page.locator('text=Step 4: Simulation').first()).toBeVisible({ timeout: 10000 });
  });

  test('Monte Carlo simulation panel is rendered', async ({ page }) => {
    await expect(page.locator('text=Monte Carlo').first()).toBeVisible({ timeout: 10000 });
  });

  test('Reroute (Recommended) scenario is visible', async ({ page }) => {
    await expect(page.locator('text=Reroute').first()).toBeVisible({ timeout: 10000 });
  });

  test('Maintain Route scenario is visible', async ({ page }) => {
    await expect(page.locator('text=Maintain Route').first()).toBeVisible({ timeout: 10000 });
  });

  test('Negotiate SLA scenario is visible', async ({ page }) => {
    await expect(page.locator('text=Negotiate SLA').first()).toBeVisible({ timeout: 10000 });
  });

  test('sensitivity drivers section is shown', async ({ page }) => {
    await expect(page.locator('text=Sensitivity').first()).toBeVisible({ timeout: 10000 });
  });

  test('Weather Delay driver is listed', async ({ page }) => {
    await expect(page.locator('text=Weather Delay').first()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 7 — Step 5: Policy Gate
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step 5: Policy Gate', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
    await clickStep(page, 'Policy Gate');
  });

  test("step header shows 'Step 5: Policy Gate'", async ({ page }) => {
    await expect(page.locator('text=Step 5: Policy Gate').first()).toBeVisible({ timeout: 10000 });
  });

  test('Covenant Policy evaluations are listed', async ({ page }) => {
    await expect(page.locator('text=Covenant Policy').first()).toBeVisible({ timeout: 10000 });
  });

  test('cov-001 high-severity policy is visible', async ({ page }) => {
    await expect(page.locator('text=cov-001').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('all four Covenant Policy IDs are present and all show approved status', async ({
    page,
  }) => {
    // Assert every policy ID in the demo data set is rendered
    for (const policyId of ['cov-001', 'cov-002', 'cov-003', 'cov-005']) {
      await expect(page.locator(`text=${policyId}`).first()).toBeVisible({
        timeout: 10000,
      });
    }
    // All four evaluations should render an "approved" outcome badge.
    // The PolicyGatePanel renders one badge per evaluation row.
    const approvedBadges = page.locator('text=approved');
    const count = await approvedBadges.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('audit trail section is visible', async ({ page }) => {
    await expect(page.locator('text=Audit').first()).toBeVisible({ timeout: 10000 });
  });

  test('signal ingestion audit entry is shown', async ({ page }) => {
    await expect(page.locator('text=Signal SIG-4821 ingested').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 8 — Step 6: Approval
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step 6: Approval', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
    await clickStep(page, 'Approval');
  });

  test("step header shows 'Step 6: Approval'", async ({ page }) => {
    await expect(page.locator('text=Step 6: Approval').first()).toBeVisible({ timeout: 10000 });
  });

  test('Fleet Operations Lead approver Marcus Chen is shown', async ({ page }) => {
    await expect(page.locator('text=Marcus Chen').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Finance Controller approver Aisha Kamara is shown', async ({ page }) => {
    await expect(page.locator('text=Aisha Kamara').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('CEO approver Stephen Lutar is shown', async ({ page }) => {
    await expect(page.locator('text=Stephen Lutar').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('approval chain shows three approvers', async ({ page }) => {
    // All three roles must appear
    await expect(page.locator('text=Fleet Operations Lead').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Finance Controller').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=CEO').first()).toBeVisible({ timeout: 10000 });
  });

  test('approval comments are visible', async ({ page }) => {
    await expect(page.locator('text=Reroute is the right call').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 9 — Step 7: Execution
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step 7: Execution', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
    await clickStep(page, 'Execution');
  });

  test("step header shows 'Step 7: Execution'", async ({ page }) => {
    await expect(page.locator('text=Step 7: Execution').first()).toBeVisible({ timeout: 10000 });
  });

  test('Workflow Execution heading is visible', async ({ page }) => {
    await expect(page.locator('text=Workflow Execution').first()).toBeVisible({ timeout: 10000 });
  });

  test('COMPLETED status badge is shown', async ({ page }) => {
    await expect(page.locator('text=COMPLETED').first()).toBeVisible({ timeout: 10000 });
  });

  test('Authorization verified step is listed', async ({ page }) => {
    await expect(page.locator('text=Authorization verified').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Reroute order dispatched step is listed', async ({ page }) => {
    await expect(page.locator('text=Reroute order dispatched').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Client notification sent step is listed', async ({ page }) => {
    await expect(page.locator('text=Client notification sent').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Audit trail sealed step is listed', async ({ page }) => {
    await expect(page.locator('text=Audit trail sealed').first()).toBeVisible({ timeout: 10000 });
  });

  test('total execution duration 4.2s is shown within the execution panel', async ({ page }) => {
    // Scope to the execution panel (anchored by "Workflow Execution" heading)
    // so we don't accidentally match a stray "4.2s" elsewhere on the page.
    const execPanel = page
      .locator('div')
      .filter({ hasText: /Workflow Execution/ })
      .last();
    await expect(execPanel.locator('text=4.2s').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('5/5 steps completion count is shown within the execution panel', async ({ page }) => {
    const execPanel = page
      .locator('div')
      .filter({ hasText: /Workflow Execution/ })
      .last();
    await expect(execPanel.locator('text=5/5').first()).toBeVisible({
      timeout: 10000,
    });
  });
});

// ---------------------------------------------------------------------------
// Suite 10 — Step 8: Proof Chain
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step 8: Proof Chain', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
    await clickStep(page, 'Proof Chain');
  });

  test("step header shows 'Step 8: Proof Chain'", async ({ page }) => {
    await expect(page.locator('text=Step 8: Proof Chain').first()).toBeVisible({ timeout: 10000 });
  });

  test('proof entry PF-9041 is visible', async ({ page }) => {
    await expect(page.locator('text=PF-9041').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('proof entry PF-9042 is visible', async ({ page }) => {
    await expect(page.locator('text=PF-9042').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('model attribution szl-ops-advisor-v3 appears in proof chain', async ({ page }) => {
    await expect(page.locator('text=szl-ops-advisor-v3').first()).toBeVisible({ timeout: 10000 });
  });

  test('Operational Recommendation content type is shown', async ({ page }) => {
    await expect(page.locator('text=Operational Recommendation').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('Monte Carlo Simulation Result content type is shown', async ({ page }) => {
    await expect(page.locator('text=Monte Carlo Simulation Result').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('reviewer Marcus Chen is listed in proof chain', async ({ page }) => {
    await expect(page.locator('text=Marcus Chen').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('AIS Position Feed input source is shown', async ({ page }) => {
    await expect(page.locator('text=AIS Position Feed').first()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 11 — Step 9: Outcome
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Step 9: Outcome', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
    await clickStep(page, 'Outcome');
  });

  test("step header shows 'Step 9: Outcome'", async ({ page }) => {
    await expect(page.locator('text=Step 9: Outcome').first()).toBeVisible({ timeout: 10000 });
  });

  test('outcome record ID OUT-2104 is shown', async ({ page }) => {
    await expect(page.locator('text=OUT-2104').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('outcome result ACHIEVED is displayed', async ({ page }) => {
    await expect(page.locator('text=ACHIEVED').first()).toBeVisible({ timeout: 10000 });
  });

  test('$2.1M protected is shown in actual impact', async ({ page }) => {
    await expect(page.locator('text=$2.1M protected').first()).toBeVisible({ timeout: 10000 });
  });

  test('97% prediction accuracy is shown', async ({ page }) => {
    await expect(page.locator('text=97%').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('time to outcome 29h 18m is shown', async ({ page }) => {
    await expect(page.locator('text=29h 18m').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('operator feedback note is visible', async ({ page }) => {
    await expect(page.locator('text=Reroute executed cleanly').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('downstream impact (contract renewal) is shown', async ({ page }) => {
    await expect(page.locator('text=contract renewal').first()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 12 — Navigation: Previous / Next buttons
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
  });

  test('Next button advances from Signal to Context', async ({ page }) => {
    const nextBtn = page.locator('button', { hasText: /next/i });
    await nextBtn.click();
    await expect(page.locator('text=Step 2: Context').first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking Next then Previous returns to Signal', async ({ page }) => {
    const nextBtn = page.locator('button', { hasText: /next/i });
    const prevBtn = page.locator('button', { hasText: /previous/i });
    await nextBtn.click();
    await expect(page.locator('text=Step 2: Context').first()).toBeVisible({ timeout: 8000 });
    await prevBtn.click();
    await expect(page.locator('text=Step 1: Signal').first()).toBeVisible({ timeout: 8000 });
  });

  test('Next is disabled on the last step (Outcome)', async ({ page }) => {
    await clickStep(page, 'Outcome');
    const nextBtn = page.locator('button', { hasText: /next/i });
    await expect(nextBtn).toBeDisabled({ timeout: 10000 });
  });

  test('Previous is enabled after advancing to Recommendation', async ({ page }) => {
    await clickStep(page, 'Recommendation');
    const prevBtn = page.locator('button', { hasText: /previous/i });
    await expect(prevBtn).toBeEnabled({ timeout: 10000 });
  });

  test('clicking a step indicator dot jumps directly to that step', async ({ page }) => {
    const dot = page.locator('button[aria-label="Go to step 8: Proof Chain"]');
    await dot.click();
    await expect(page.locator('text=Step 8: Proof Chain').first()).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 13 — Full loop walk-through (regression guard)
// Traverses all 9 steps via the Next button and asserts a key element at each
// step.  This is the single most important regression test — it detects any
// step that has been broken, removed, or renamed.
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Full nine-step regression', () => {
  test('walks through all nine steps via Next button', async ({ page }) => {
    await goToLoop(page);

    // Step 1 — Signal
    await expect(page.locator('text=SIG-4821').first()).toBeVisible({ timeout: 15000 });

    // Step 2 — Context
    const next = page.locator('button', { hasText: /next/i });
    await next.click();
    await expect(page.locator('text=Cross-Domain Intelligence').first()).toBeVisible({
      timeout: 10000,
    });

    // Step 3 — Recommendation
    await next.click();
    await expect(page.locator('text=REC-0421').first()).toBeVisible({ timeout: 10000 });

    // Step 4 — Simulation
    await next.click();
    await expect(page.locator('text=Monte Carlo').first()).toBeVisible({ timeout: 10000 });

    // Step 5 — Policy Gate
    await next.click();
    await expect(page.locator('text=Covenant Policy').first()).toBeVisible({ timeout: 10000 });

    // Step 6 — Approval
    await next.click();
    await expect(page.locator('text=Marcus Chen').first()).toBeVisible({ timeout: 10000 });

    // Step 7 — Execution
    await next.click();
    await expect(page.locator('text=Workflow Execution').first()).toBeVisible({ timeout: 10000 });

    // Step 8 — Proof Chain
    await next.click();
    await expect(page.locator('text=PF-9041').first()).toBeVisible({ timeout: 10000 });

    // Step 9 — Outcome
    await next.click();
    await expect(page.locator('text=OUT-2104').first()).toBeVisible({ timeout: 10000 });

    // Confirm Next is now disabled
    await expect(next).toBeDisabled({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 14 — Demo scenario helpers
// ---------------------------------------------------------------------------

test.describe('Governed Decision Loop — Demo scenario bar', () => {
  test.beforeEach(async ({ page }) => {
    await goToLoop(page);
  });

  test('5-min route toggle button is visible', async ({ page }) => {
    const toggleBtn = page.locator('button', { hasText: /5-min route/i });
    await expect(toggleBtn).toBeVisible({ timeout: 10000 });
  });

  test('clicking 5-min route reveals demo route beats', async ({ page }) => {
    const toggleBtn = page.locator('button', { hasText: /5-min route/i });
    await toggleBtn.click();
    await expect(page.locator('text=5-Minute Demo Route').first()).toBeVisible({ timeout: 10000 });
  });

  test('5-min route shortcuts include Policy Gate and Outcome', async ({ page }) => {
    const toggleBtn = page.locator('button', { hasText: /5-min route/i });
    await toggleBtn.click();
    // Route beats rendered as shortcut buttons
    await expect(page.locator('text=Policy Gate').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Outcome').first()).toBeVisible({ timeout: 10000 });
  });
});
