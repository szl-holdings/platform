import { expect, test } from '@playwright/test';

const PRAXIS = '/nexus/';

test.describe('PRAXIS auth gate', () => {
  test('shows restricted login wall when unauthenticated', async ({ page }) => {
    await page.route('**/api/nexus/status', (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) }),
    );

    await page.goto(PRAXIS);
    await expect(page.getByText('Internal Tooling — Restricted')).toBeVisible();
    await expect(page.getByText('Sign In Required')).toBeVisible();
    await expect(page.getByRole('link', { name: /Go to Platform Login/ })).toBeVisible();
  });

  test('login wall links back to platform root', async ({ page }) => {
    await page.route('**/api/nexus/status', (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) }),
    );

    await page.goto(PRAXIS);
    const link = page.getByRole('link', { name: /Go to Platform Login/ });
    await expect(link).toHaveAttribute('href', '/');
  });
});

test.describe('PRAXIS pattern atlas', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/nexus/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeSwarms: 0,
          memoryItems: 0,
          enabledSkills: 0,
          registeredTools: 0,
          orchestrationsToday: 0,
        }),
      }),
    );
  });

  test('renders component catalog with component count', async ({ page }) => {
    await page.goto(`${PRAXIS}#patterns`);
    await expect(page.getByText('Pattern Atlas')).toBeVisible();
    await expect(page.getByText(/\d+ components/)).toBeVisible();
  });

  test('shows component categories in left rail', async ({ page }) => {
    await page.goto(`${PRAXIS}#patterns`);
    // Category buttons render as "<Label> <count>" (e.g. "Auth 2").
    // Use anchored regexes so we don't collide with sidebar nav, the
    // component list (e.g. "AuthGate"), or props rows.
    await expect(page.getByRole('button', { name: /^All\s+\d+$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Auth\s+\d+$/ })).toBeVisible();
    // Categories without any registered components are filtered out, so
    // assert on Observability (a populated category) instead of Analytics.
    await expect(page.getByRole('button', { name: /^Observability\s+\d+$/ })).toBeVisible();
  });

  test('clicking a component shows its props and code snippet', async ({ page }) => {
    await page.goto(`${PRAXIS}#patterns`);
    await page.getByRole('button', { name: /AuthGate/ }).first().click();
    await expect(page.getByText('Usage')).toBeVisible();
    await expect(page.getByText('Props')).toBeVisible();
    await expect(page.getByText('lib/shared-ui/src/AuthGate.tsx')).toBeVisible();
  });

  test('filtering by category shows only matching components', async ({ page }) => {
    await page.goto(`${PRAXIS}#patterns`);
    // Click the "Auth N" category button (left rail) — the regex anchors avoid
    // colliding with sidebar nav and component-list buttons like "AuthGate".
    await page.getByRole('button', { name: /^Auth\s+\d+$/ }).click();
    const componentButtons = page.locator('button').filter({ hasText: /AuthGate|PrivateAppGuard/ });
    await expect(componentButtons.first()).toBeVisible();
  });

  test('search filters component list', async ({ page }) => {
    await page.goto(`${PRAXIS}#patterns`);
    await page.getByPlaceholder('Search components…').fill('Autonomy');
    await expect(page.getByText('AutonomyDial')).toBeVisible();
    await expect(page.getByText('AuthGate')).not.toBeVisible();
  });

  test('boolean prop control updates code snippet', async ({ page }) => {
    await page.goto(`${PRAXIS}#patterns`);
    await page.getByRole('button', { name: /AutonomyDial/ }).first().click();
    const disabledControl = page.locator('label').filter({ hasText: /false|true/ }).first();
    await expect(disabledControl).toBeVisible();
  });

  test('type-alias exports are excluded from catalog (AuthGateProps not listed as component)', async ({
    page,
  }) => {
    await page.goto(`${PRAXIS}#patterns`);
    await expect(page.getByText('Pattern Atlas')).toBeVisible();
    // Filter to the Auth category so the AuthGate button is in view (the
    // catalog has hundreds of entries; the unfiltered list virtualises).
    await page.getByRole('button', { name: /^Auth\s+\d+$/ }).click();
    // Component buttons render the component name + category badge concatenated
    // in their inner text (e.g. "AuthGateAuth●"), so match with a prefix
    // anchor only.
    await expect(page.locator('button').filter({ hasText: /^AuthGate/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^AuthGateProps\b/ })).toHaveCount(0);
  });
});

test.describe('PRAXIS eval console', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/nexus/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeSwarms: 0,
          memoryItems: 0,
          enabledSkills: 0,
          registeredTools: 0,
          orchestrationsToday: 0,
        }),
      }),
    );

    await page.route('**/api/pulse-evals/datasets', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            totalCases: 42,
            domains: [
              { domain: 'research', count: 20, redTeam: false },
              { domain: 'memory', count: 22, redTeam: true },
            ],
          },
        }),
      }),
    );

    await page.route('**/api/pulse-evals/regression-dashboard', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ dashboard: { baselines: [] } }),
      }),
    );
  });

  test('renders EVAL CONSOLE heading', async ({ page }) => {
    await page.goto(`${PRAXIS}#eval-console`);
    await expect(page.getByText('EVAL CONSOLE')).toBeVisible();
  });

  test('shows RUN EVALS section with domain chips', async ({ page }) => {
    await page.goto(`${PRAXIS}#eval-console`);
    // 'RUN EVALS' appears as both the section heading and its label badge —
    // pin to the heading to avoid a strict-mode violation.
    await expect(page.getByRole('heading', { name: 'RUN EVALS' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^research\b/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^memory\b/ })).toBeVisible();
  });

  test('Run Evals button is present and clickable', async ({ page }) => {
    await page.route('**/api/pulse-evals/run', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          report: {
            suiteId: 'test-suite',
            suiteName: 'Test Suite',
            model: 'claude-sonnet-4-6',
            totalCases: 42,
            passedCases: 38,
            failedCases: 4,
            passRate: 0.905,
            avgScore: 88.5,
            avgLatencyMs: 342,
            totalCostUsd: 0.00123,
            domains: ['research'],
            completedAt: new Date().toISOString(),
          },
        }),
      }),
    );

    await page.goto(`${PRAXIS}#eval-console`);
    const runButton = page.getByRole('button', { name: /Run Evals/ });
    await expect(runButton).toBeVisible();
    await runButton.click();
    await expect(page.getByText('Recent Runs')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Test Suite')).toBeVisible();
  });
});

test.describe('PRAXIS prompt registry', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/nexus/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeSwarms: 0,
          memoryItems: 0,
          enabledSkills: 0,
          registeredTools: 0,
          orchestrationsToday: 0,
        }),
      }),
    );

    await page.route('**/api/ai/prompts', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'p1',
            name: 'Research Summarizer',
            description: 'Summarizes research findings into executive briefs',
            domain: 'research',
            routeClass: 'generation',
            activeVersionId: 'p1@v2',
            activeVersion: 2,
            versionCount: 2,
            status: 'active',
            lastEvalScore: 91.5,
            lastEvalPassRate: 0.94,
            lastEvalAt: new Date().toISOString(),
            tags: ['research', 'summarization'],
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ]),
      }),
    );
  });

  test('renders PROMPT REGISTRY heading', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await expect(page.getByRole('heading', { name: 'PROMPT REGISTRY' })).toBeVisible();
  });

  test('shows prompt count metric card', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    // 'Prompts' appears in the sidebar nav and on the metric card. Pin to
    // the metric label by scoping to its sibling counter.
    await expect(page.getByText('Prompts').first()).toBeVisible();
    await expect(page.locator('.text-praxis-cyan').filter({ hasText: /^1$/ }).first()).toBeVisible();
  });

  test('lists prompts with name and status', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await expect(page.getByText('Research Summarizer')).toBeVisible();
    await expect(page.getByText('active').first()).toBeVisible();
  });

  test('search filters prompts by name', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByPlaceholder('Search prompts…').fill('Research');
    await expect(page.getByText('Research Summarizer')).toBeVisible();
  });
});

test.describe('PRAXIS prompt save flow', () => {
  const V1_TIMESTAMP = new Date().toISOString();
  const V2_TIMESTAMP = new Date().toISOString();

  const PROMPT_LIST = [
    {
      id: 'p1',
      name: 'Research Summarizer',
      description: 'Summarizes research findings',
      domain: 'research',
      routeClass: 'generation',
      activeVersionId: 'p1@v1',
      activeVersion: 1,
      versionCount: 2,
      status: 'active',
      lastEvalScore: 91.0,
      lastEvalPassRate: 0.95,
      lastEvalAt: V1_TIMESTAMP,
      tags: ['research'],
      updatedAt: V2_TIMESTAMP,
      createdAt: V1_TIMESTAMP,
    },
  ];

  const PROMPT_DETAIL = {
    ...PROMPT_LIST[0],
    versions: [
      {
        versionId: 'p1@v2',
        version: 2,
        template: 'Enhanced: Summarize the following research findings: {{content}}',
        changelog: 'Improved summarization prompt',
        createdBy: 'nexus-agent',
        createdAt: V2_TIMESTAMP,
        tags: ['research', 'v2'],
        evalMetadata: { score: 91.0, passRate: 0.95, avgLatencyMs: 280, sampleCount: 60 },
      },
      {
        versionId: 'p1@v1',
        version: 1,
        template: 'Summarize the following research findings: {{content}}',
        changelog: 'Initial version',
        createdBy: 'nexus-agent',
        createdAt: V1_TIMESTAMP,
        tags: ['research', 'v1'],
        evalMetadata: { score: 88.0, passRate: 0.92, avgLatencyMs: 320, sampleCount: 50 },
      },
    ],
    comparison: null,
  };

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/nexus/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeSwarms: 0,
          memoryItems: 0,
          enabledSkills: 0,
          registeredTools: 0,
          orchestrationsToday: 0,
        }),
      }),
    );

    await page.route('**/api/ai/prompts', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(PROMPT_LIST),
        });
      }
    });

    await page.route('**/api/ai/prompts/p1', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(PROMPT_DETAIL),
        });
      }
    });
  });

  test('expanding a prompt shows its version history with active badge', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByRole('button', { name: /Research Summarizer/ }).click();
    // The version rows render multiple "v1"-style strings (label + count
    // metric). First() is sufficient to confirm the panel expanded.
    await expect(page.getByText(/^v1\b/).first()).toBeVisible({ timeout: 5000 });
    // ACTIVE appears as both a status chip on the prompt header and a badge
    // on the active version row — first() is enough to assert presence.
    await expect(page.getByText('ACTIVE').first()).toBeVisible();
  });

  test('version 2 shows Promote button since it is not the active version', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByRole('button', { name: /Research Summarizer/ }).click();
    await expect(page.getByText(/^v2\b/).first()).toBeVisible({ timeout: 5000 });
    // Only inactive versions render a Promote button. .first() guards against
    // future rows also exposing one.
    await expect(page.getByRole('button', { name: /^Promote$/ }).first()).toBeVisible();
  });

  test('clicking Promote on v2 POSTs to the promote endpoint', async ({ page }) => {
    let promoteCalled = false;

    await page.route('**/api/ai/prompts/p1/promote', async (route) => {
      promoteCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByRole('button', { name: /Research Summarizer/ }).click();
    const promote = page.getByRole('button', { name: /^Promote$/ }).first();
    await expect(promote).toBeVisible({ timeout: 5000 });
    await promote.click();
    await expect(page.getByText(/promoted to active/)).toBeVisible({ timeout: 8000 });
    expect(promoteCalled).toBe(true);
  });

  test('clicking Eval on v1 POSTs to the eval endpoint and shows result toast', async ({
    page,
  }) => {
    let evalCalled = false;

    await page.route(/\/api\/ai\/prompts\/p1\/versions\/.*\/eval/, async (route) => {
      evalCalled = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ score: 91.0, passRate: 0.95, sampleCount: 60 }),
      });
    });

    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByRole('button', { name: /Research Summarizer/ }).click();
    // Scope to the per-version Eval button (exact match) so we don't pick up
    // the "Evals" sidebar nav entry which would just route away from the
    // prompt registry.
    const evalBtn = page.getByRole('button', { name: /^Eval$/ }).first();
    await expect(evalBtn).toBeVisible({ timeout: 5000 });
    await evalBtn.click();
    await expect(page.getByText(/Eval complete/)).toBeVisible({ timeout: 10000 });
    expect(evalCalled).toBe(true);
  });
});

test.describe('PRAXIS internal tooling labels', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/nexus/status', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activeSwarms: 0,
          memoryItems: 0,
          enabledSkills: 0,
          registeredTools: 0,
          orchestrationsToday: 0,
        }),
      }),
    );

    await page.route('**/api/nexus/memory**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );

    await page.route('**/api/nexus/skills**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
  });

  test('memory page shows internal tooling banner', async ({ page }) => {
    await page.goto(`${PRAXIS}#memory`);
    await expect(page.getByText('Internal Tooling — Not Production')).toBeVisible();
  });

  test('skills page shows internal tooling banner', async ({ page }) => {
    await page.goto(`${PRAXIS}#skills`);
    await expect(page.getByText('Internal Tooling — Not Production')).toBeVisible();
  });
});
