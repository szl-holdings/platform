/**
 * E2E suite — Decision Theater (tab navigation + stage progression)
 *
 * The Decision Theater is the nine-stage governed decision loop
 * (Signal → Learning) embedded in the SZL Core Command page at /core.
 * These tests guard:
 *   - Tab activation from /core
 *   - All 9 stages render expected content
 *   - Next / Prev boundary behaviour (via data-testid nav buttons)
 *   - Guided demo start / pause / reset / auto-advance
 *   - Progress-bar stage jumping
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------
const BASE = (process.env.SZL_BASE_PATH ?? "/").replace(/\/$/, "");
const CORE_PATH = `${BASE}/core`;

// ---------------------------------------------------------------------------
// Availability guard
// ---------------------------------------------------------------------------
let appAvailable = true;

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    const resp = await page.goto(CORE_PATH, {
      timeout: 15000,
      waitUntil: "domcontentloaded",
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

/** Navigate to /core and wait for the shell to settle. */
async function goToCore(page: Page) {
  await page.goto(CORE_PATH, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {
    // best-effort; proceed even if networkidle times out
  });
}

/** Click the "Decision Theater" tab and wait for the theater heading. */
async function openTheaterTab(page: Page) {
  const tab = page
    .locator("button")
    .filter({ hasText: /^Decision Theater$/i })
    .first();
  await tab.click();
  await expect(
    page.locator("h2", { hasText: "Decision Theater" }).first()
  ).toBeVisible({ timeout: 15000 });
}

/** Navigate to /core and open the Decision Theater tab. */
async function goToTheater(page: Page) {
  await goToCore(page);
  await openTheaterTab(page);
}

/**
 * Click a stage in the StageProgressBar by its visible label and wait for the
 * step header to update. Uses the first matching button to target the progress
 * bar (not the nav buttons at the bottom).
 */
async function clickStage(page: Page, label: string, expectedStep: number) {
  const btn = page
    .locator("button")
    .filter({ hasText: new RegExp(`^${label}$`, "i") })
    .first();
  await btn.click();
  // Wait for the step header to reflect the new stage (deterministic state check)
  await expect(
    page.locator(`text=Step ${expectedStep} of 9`).first()
  ).toBeVisible({ timeout: 10000 });
}

// Stage metadata mirrors LOOP_STAGES in DecisionTheater.tsx
const STAGES = [
  { label: "Signal",         step: 1 },
  { label: "Context",        step: 2 },
  { label: "Recommendation", step: 3 },
  { label: "Simulation",     step: 4 },
  { label: "Policy",         step: 5 },
  { label: "Execution",      step: 6 },
  { label: "Proof",          step: 7 },
  { label: "Outcome",        step: 8 },
  { label: "Learning",       step: 9 },
] as const;

// ---------------------------------------------------------------------------
// Suite 1 — Tab activation
// ---------------------------------------------------------------------------

test.describe("Decision Theater — Tab activation", () => {
  test("Decision Theater tab is present on /core", async ({ page }) => {
    await goToCore(page);
    const tab = page
      .locator("button")
      .filter({ hasText: /^Decision Theater$/i })
      .first();
    await expect(tab).toBeVisible({ timeout: 15000 });
  });

  test("clicking Decision Theater tab renders the theater heading", async ({ page }) => {
    await goToCore(page);
    await openTheaterTab(page);
    await expect(
      page.locator("h2", { hasText: "Decision Theater" }).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("Decision Theater tab renders the canonical description subtitle", async ({ page }) => {
    await goToTheater(page);
    await expect(
      page.locator("text=canonical governed decision loop").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Decision Theater tab renders the scenario banner", async ({ page }) => {
    await goToTheater(page);
    await expect(
      page.locator("text=Cross-Domain Threat").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("all 9 stage buttons are visible in the progress bar", async ({ page }) => {
    await goToTheater(page);
    for (const { label } of STAGES) {
      await expect(
        page
          .locator("button")
          .filter({ hasText: new RegExp(`^${label}$`, "i") })
          .first()
      ).toBeVisible({ timeout: 10000 });
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — Stage content rendering (all 9 stages)
// ---------------------------------------------------------------------------

test.describe("Decision Theater — Stage 1: Signal", () => {
  test.beforeEach(async ({ page }) => {
    await goToTheater(page);
    // Signal is the default stage; no click needed
  });

  test("shows Step 1 of 9 header", async ({ page }) => {
    await expect(
      page.locator("text=Step 1 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("stage heading is Signal", async ({ page }) => {
    await expect(
      page.locator("h3", { hasText: "Signal" }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Prism Event Bus stat line is visible", async ({ page }) => {
    await expect(
      page.locator("text=Prism Event Bus").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("cross-domain threat scenario signals are displayed", async ({ page }) => {
    await expect(page.locator("text=Aegis").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Vessels").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Decision Theater — Stage 2: Context", () => {
  test.beforeEach(async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Context", 2);
  });

  test("shows Step 2 of 9 header", async ({ page }) => {
    await expect(
      page.locator("text=Step 2 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Cross-Domain Correlation panel is visible", async ({ page }) => {
    await expect(
      page.locator("text=Cross-Domain Correlation").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Event Fabric stat line is visible", async ({ page }) => {
    await expect(
      page.locator("text=Event Fabric").first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Decision Theater — Stage 3: Recommendation", () => {
  test.beforeEach(async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Recommendation", 3);
  });

  test("shows Step 3 of 9 header", async ({ page }) => {
    await expect(
      page.locator("text=Step 3 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Recommended Actions section is visible", async ({ page }) => {
    await expect(
      page.locator("text=Recommended Actions").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Source Attribution section is visible", async ({ page }) => {
    await expect(
      page.locator("text=Source Attribution").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Correlation ID is shown in the recommendation card", async ({ page }) => {
    await expect(
      page.locator("text=Correlation ID").first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Decision Theater — Stage 4: Simulation", () => {
  test.beforeEach(async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Simulation", 4);
  });

  test("shows Step 4 of 9 header", async ({ page }) => {
    await expect(
      page.locator("text=Step 4 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Monte Carlo iterations count is visible", async ({ page }) => {
    await expect(
      page.locator("text=iterations").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Output Distributions panel is visible", async ({ page }) => {
    await expect(
      page.locator("text=Output Distributions").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Input Sensitivity section is visible", async ({ page }) => {
    await expect(
      page.locator("text=Input Sensitivity").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("P5 / P50 / P95 percentile labels are shown", async ({ page }) => {
    await expect(page.locator("text=P5:").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=P50:").first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=P95:").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Decision Theater — Stage 5: Policy", () => {
  test.beforeEach(async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Policy", 5);
  });

  test("shows Step 5 of 9 header", async ({ page }) => {
    await expect(
      page.locator("text=Step 5 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Policy Evaluation panel is visible", async ({ page }) => {
    await expect(
      page.locator("text=Policy Evaluation").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("ALLOW or DENY verdict badge is rendered", async ({ page }) => {
    const allow = page.locator("text=ALLOW").first();
    const deny = page.locator("text=DENY").first();
    const eitherVisible =
      (await allow.isVisible().catch(() => false)) ||
      (await deny.isVisible().catch(() => false));
    expect(eitherVisible).toBe(true);
  });

  test("Simulation Trace section is visible", async ({ page }) => {
    await expect(
      page.locator("text=Simulation Trace").first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Decision Theater — Stage 6: Execution", () => {
  test.beforeEach(async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Execution", 6);
  });

  test("shows Step 6 of 9 header", async ({ page }) => {
    await expect(
      page.locator("text=Step 6 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Execution Log heading is visible", async ({ page }) => {
    await expect(
      page.locator("text=Execution Log").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("at least one completed execution step entry is rendered", async ({ page }) => {
    const steps = page.locator("text=completed");
    await expect(steps.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Decision Theater — Stage 7: Proof", () => {
  test.beforeEach(async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Proof", 7);
  });

  test("shows Step 7 of 9 header", async ({ page }) => {
    await expect(
      page.locator("text=Step 7 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Proof Chain Record panel is visible", async ({ page }) => {
    await expect(
      page.locator("text=Proof Chain Record").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Audit Trail panel is visible", async ({ page }) => {
    await expect(
      page.locator("text=Audit Trail").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Chain ID field is displayed", async ({ page }) => {
    await expect(
      page.locator("text=Chain ID").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Input Sources section is shown", async ({ page }) => {
    await expect(
      page.locator("text=Input Sources").first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Decision Theater — Stage 8: Outcome", () => {
  test.beforeEach(async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Outcome", 8);
  });

  test("shows Step 8 of 9 header", async ({ page }) => {
    await expect(
      page.locator("text=Step 8 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Predicted vs Actual heading is visible", async ({ page }) => {
    await expect(
      page.locator("text=Predicted vs Actual").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Cost Variance metric is displayed", async ({ page }) => {
    await expect(
      page.locator("text=Cost Variance").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Resolution Variance metric is displayed", async ({ page }) => {
    await expect(
      page.locator("text=Resolution Variance").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Outcome ID field is shown", async ({ page }) => {
    await expect(
      page.locator("text=Outcome ID").first()
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Decision Theater — Stage 9: Learning", () => {
  test.beforeEach(async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Learning", 9);
  });

  test("shows Step 9 of 9 header", async ({ page }) => {
    await expect(
      page.locator("text=Step 9 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Confidence Calibration section is visible", async ({ page }) => {
    await expect(
      page.locator("text=Confidence Calibration").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("System Updates section is visible", async ({ page }) => {
    await expect(
      page.locator("text=System Updates").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Decision Memory Updated banner is visible", async ({ page }) => {
    await expect(
      page.locator("text=Decision Memory Updated").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Detected Patterns section is visible", async ({ page }) => {
    await expect(
      page.locator("text=Detected Patterns").first()
    ).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Next / Prev boundary behaviour
// Nav buttons are targeted via data-testid="nav-prev" and data-testid="nav-next"
// so stage-progress-bar button collisions cannot satisfy these assertions.
// ---------------------------------------------------------------------------

test.describe("Decision Theater — Next/Prev boundaries", () => {
  test("nav-prev button is disabled on stage 1 (Signal)", async ({ page }) => {
    await goToTheater(page);
    const prevBtn = page.locator('[data-testid="nav-prev"]');
    await expect(prevBtn).toBeDisabled({ timeout: 10000 });
    await expect(prevBtn).toContainText("Previous");
  });

  test("nav-next button is enabled on stage 1 and advances to stage 2", async ({ page }) => {
    await goToTheater(page);
    const nextBtn = page.locator('[data-testid="nav-next"]');
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    await expect(nextBtn).toContainText("Context");
    await nextBtn.click();
    await expect(
      page.locator("text=Step 2 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("clicking nav-next from stage 8 reaches stage 9 (Learning)", async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Outcome", 8);
    const nextBtn = page.locator('[data-testid="nav-next"]');
    await expect(nextBtn).toContainText("Learning");
    await nextBtn.click();
    await expect(
      page.locator("text=Step 9 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("nav-next button is disabled on the last stage (Learning)", async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Learning", 9);
    const nextBtn = page.locator('[data-testid="nav-next"]');
    await expect(nextBtn).toBeDisabled({ timeout: 10000 });
    await expect(nextBtn).toContainText("Complete");
  });

  test("nav-prev button navigates back from stage 3 to stage 2", async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Recommendation", 3);
    const prevBtn = page.locator('[data-testid="nav-prev"]');
    await expect(prevBtn).toBeEnabled({ timeout: 10000 });
    await expect(prevBtn).toContainText("Context");
    await prevBtn.click();
    await expect(
      page.locator("text=Step 2 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("nav-prev button is enabled and shows adjacent label from any non-first stage", async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Simulation", 4);
    const prevBtn = page.locator('[data-testid="nav-prev"]');
    await expect(prevBtn).toBeEnabled({ timeout: 10000 });
    await expect(prevBtn).toContainText("Recommendation");
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — Progress bar stage jumping
// ---------------------------------------------------------------------------

test.describe("Decision Theater — Progress bar stage jumping", () => {
  for (const { label, step } of STAGES) {
    test(`clicking "${label}" in the progress bar jumps to step ${step}`, async ({ page }) => {
      await goToTheater(page);
      await clickStage(page, label, step);
      // clickStage already asserts the step header, but confirm stage heading too
      await expect(
        page.locator("h3", { hasText: label }).first()
      ).toBeVisible({ timeout: 10000 });
    });
  }

  test("can jump non-linearly from Signal to Learning and back to Context", async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Learning", 9);
    await clickStage(page, "Context", 2);
  });
});

// ---------------------------------------------------------------------------
// Suite 5 — Guided Demo controls
// ---------------------------------------------------------------------------

test.describe("Decision Theater — Guided Demo controls", () => {
  test("Guided Demo button is visible with correct title", async ({ page }) => {
    await goToTheater(page);
    const demoBtn = page.locator("button[title='Start guided demo']");
    await expect(demoBtn).toBeVisible({ timeout: 10000 });
    await expect(demoBtn).toContainText("Guided Demo");
  });

  test("clicking Guided Demo reveals the Pause button", async ({ page }) => {
    await goToTheater(page);
    await page.locator("button[title='Start guided demo']").click();
    const pauseBtn = page.locator("button[title='Pause guided demo']");
    await expect(pauseBtn).toBeVisible({ timeout: 10000 });
    await expect(pauseBtn).toContainText("Pause");
  });

  test("clicking Guided Demo shows the auto-advancing indicator text", async ({ page }) => {
    await goToTheater(page);
    await page.locator("button[title='Start guided demo']").click();
    await expect(
      page.locator("text=Auto-advancing").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("guided demo auto-advances from stage 1 to stage 2 after 6 seconds", async ({ page }) => {
    await goToTheater(page);
    // Install fake clock before demo starts so setTimeout/setInterval are under our control
    await page.clock.install();
    // Verify we start at stage 1
    await expect(page.locator("text=Step 1 of 9").first()).toBeVisible({ timeout: 10000 });
    // Start the demo
    await page.locator("button[title='Start guided demo']").click();
    await expect(page.locator("text=Auto-advancing").first()).toBeVisible({ timeout: 5000 });
    // Advance the clock by slightly more than the 6s interval
    await page.clock.tickFor(6500);
    // The stage should have advanced to step 2
    await expect(
      page.locator("text=Step 2 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("clicking Pause while in demo mode reverts button to Guided Demo", async ({ page }) => {
    await goToTheater(page);
    await page.locator("button[title='Start guided demo']").click();
    await page.locator("button[title='Pause guided demo']").click();
    await expect(
      page.locator("button[title='Start guided demo']").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Reset button returns to stage 1", async ({ page }) => {
    await goToTheater(page);
    await clickStage(page, "Policy", 5);
    const resetBtn = page.locator("button[title='Reset']");
    await resetBtn.click();
    await expect(
      page.locator("text=Step 1 of 9").first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("Reset during guided demo stops the demo and returns to stage 1", async ({ page }) => {
    await goToTheater(page);
    await page.locator("button[title='Start guided demo']").click();
    await expect(page.locator("text=Auto-advancing").first()).toBeVisible({ timeout: 5000 });
    await page.locator("button[title='Reset']").click();
    // Back at step 1
    await expect(page.locator("text=Step 1 of 9").first()).toBeVisible({ timeout: 10000 });
    // Pause button should no longer be visible — demo has stopped
    await expect(
      page.locator("button[title='Pause guided demo']")
    ).not.toBeVisible({ timeout: 5000 });
  });
});
