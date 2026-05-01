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
    // NEXUS scope: scripted-only — Run Evals simulates suites locally and
    // appends a run named after one of the EVAL_SUITES entries (e.g.
    // "PARAGON Threat Scorer v3"). No /api/pulse-evals/run mock is needed.
    await page.goto(`${PRAXIS}#eval-console`);
    const runButton = page.getByRole('button', { name: /Run Evals/ });
    await expect(runButton).toBeVisible();
    await runButton.click();
    // The simulated run loops through cases with ~200ms per case across
    // multiple suites, so allow generous time before "Recent Runs" appears.
    await expect(page.getByText('Recent Runs')).toBeVisible({ timeout: 30000 });
    // First non-red-team suite name is rendered in the run list.
    await expect(page.getByText('PARAGON Threat Scorer v3')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('PRAXIS prompt registry', () => {
  // NEXUS scope: prompts are sourced from DEMO_PROMPTS in the page module —
  // no /api/ai/prompts call. Assertions reference the canonical demo
  // entries (see artifacts/mockup-sandbox/src/pages/PromptRegistry.tsx).
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

  test('renders PROMPT REGISTRY heading', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await expect(page.getByRole('heading', { name: 'PROMPT REGISTRY' })).toBeVisible();
  });

  test('shows prompt count metric card', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    // 'Prompts' appears in the sidebar nav and on the metric card. The
    // scripted DEMO_PROMPTS list contains five entries, so pin to the
    // counter showing exactly "5".
    await expect(page.getByText('Prompts').first()).toBeVisible();
    await expect(page.locator('.text-praxis-cyan').filter({ hasText: /^5$/ }).first()).toBeVisible();
  });

  test('lists prompts with name and status', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await expect(page.getByText('PARAGON Threat Scorer')).toBeVisible();
    await expect(page.getByText('active').first()).toBeVisible();
  });

  test('search filters prompts by name', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByPlaceholder('Search prompts…').fill('PARAGON');
    await expect(page.getByText('PARAGON Threat Scorer')).toBeVisible();
    // Other prompts should be filtered out.
    await expect(page.getByText('DOMAINE Distress Scorer')).toHaveCount(0);
  });
});

test.describe('PRAXIS prompt save flow', () => {
  // NEXUS scope: scripted-only — promote and eval mutate local state and
  // surface a toast; no /api/ai/prompts/* calls. Assertions reference the
  // canonical PARAGON Threat Scorer entry from DEMO_PROMPTS, which has
  // three versions with v3 active (so v1 and v2 expose Promote).
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

  test('expanding a prompt shows its version history with active badge', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByRole('button', { name: /PARAGON Threat Scorer/ }).click();
    // Version rows render "v1"-style labels — first() is enough to confirm
    // the panel expanded.
    await expect(page.getByText(/^v1\b/).first()).toBeVisible({ timeout: 5000 });
    // ACTIVE appears as both a status chip on the prompt header and a badge
    // on the active version row — first() is enough to assert presence.
    await expect(page.getByText('ACTIVE').first()).toBeVisible();
  });

  test('inactive versions show Promote button (v3 is active)', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByRole('button', { name: /PARAGON Threat Scorer/ }).click();
    await expect(page.getByText(/^v2\b/).first()).toBeVisible({ timeout: 5000 });
    // Inactive versions render a Promote button.
    await expect(page.getByRole('button', { name: /^Promote$/ }).first()).toBeVisible();
  });

  test('clicking Promote on an inactive version mutates local state and toasts', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByRole('button', { name: /PARAGON Threat Scorer/ }).click();
    const promote = page.getByRole('button', { name: /^Promote$/ }).first();
    await expect(promote).toBeVisible({ timeout: 5000 });
    await promote.click();
    await expect(page.getByText(/promoted to active/)).toBeVisible({ timeout: 8000 });
  });

  test('clicking Eval on a version shows the scripted result toast', async ({ page }) => {
    await page.goto(`${PRAXIS}#prompt-registry`);
    await page.getByRole('button', { name: /PARAGON Threat Scorer/ }).click();
    // Scope to the per-version Eval button (exact match) so we don't pick up
    // the "Evals" sidebar nav entry which would route away from the registry.
    const evalBtn = page.getByRole('button', { name: /^Eval$/ }).first();
    await expect(evalBtn).toBeVisible({ timeout: 5000 });
    await evalBtn.click();
    await expect(page.getByText(/Eval complete/)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('PRAXIS third-party leaders registry', () => {
  const SIX_LEADERS = [
    { id: 'tpl_hyperframes', name: 'HyperFrames', license: 'MIT', mode: 'in-process' },
    { id: 'tpl_camofox', name: 'Camofox', license: 'Apache-2.0', mode: 'in-process' },
    { id: 'tpl_claude_ads', name: 'claude-ads', license: 'MIT', mode: 'in-process' },
    { id: 'tpl_toprank', name: 'Toprank', license: 'MIT', mode: 'in-process' },
    {
      id: 'tpl_fincept_terminal',
      name: 'Fincept Terminal',
      license: 'AGPL-3.0',
      mode: 'external-service',
    },
    {
      id: 'tpl_cloudflare_agents',
      name: 'Cloudflare Agents',
      license: 'Apache-2.0',
      mode: 'pattern-reference',
    },
  ];

  function mockLeaders(page: import('@playwright/test').Page, overrides?: Partial<typeof SIX_LEADERS[number]>[]) {
    const leaders = SIX_LEADERS.map((l, i) => ({
      ...l,
      licenseSpdx: l.license,
      capabilitySummary: `${l.name} capability summary for testing.`,
      capabilityTags: ['test'],
      integrationMode: l.mode,
      policyState: l.name === 'Camofox' ? 'requires-review' : 'allowed',
      policyNote: 'Test policy note',
      lastFetchedCommit: 'abc123f',
      lastFetchedAt: new Date().toISOString(),
      enabled: false,
      logicalCapability: ['video.render', 'web.stealth', 'marketing.audit', 'seo.audit', 'finance.terminal', undefined][i],
      ...(overrides?.[i] ?? {}),
    }));
    return page.route('**/api/nexus/leaders', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(leaders),
      }),
    );
  }

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
    await page.route('**/api/nexus/skills**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      }),
    );
  });

  test('Skills page shows Third-Party Leaders section heading', async ({ page }) => {
    await mockLeaders(page);
    await page.goto(`${PRAXIS}#skills`);
    await expect(page.getByText('Third-Party Leaders')).toBeVisible({ timeout: 8000 });
    await expect(
      page.getByText('Vetted external agents and skill packs', { exact: false }),
    ).toBeVisible();
  });

  test('Skills page lists exactly six leaders', async ({ page }) => {
    await mockLeaders(page);
    await page.goto(`${PRAXIS}#skills`);
    await expect(page.getByText('Third-Party Leaders')).toBeVisible({ timeout: 8000 });

    for (const leader of SIX_LEADERS) {
      await expect(page.getByText(leader.name).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test('Fincept Terminal shows external-service-only badge (AGPL)', async ({ page }) => {
    await mockLeaders(page);
    await page.goto(`${PRAXIS}#skills`);
    await expect(page.getByText('Third-Party Leaders')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('external-service only').first()).toBeVisible();
  });

  test('Camofox shows requires-review policy badge', async ({ page }) => {
    await mockLeaders(page);
    await page.goto(`${PRAXIS}#skills`);
    await expect(page.getByText('Third-Party Leaders')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('requires-review').first()).toBeVisible();
  });

  test('disabled leader toggle is visible and reflects disabled state', async ({ page }) => {
    await mockLeaders(page);
    await page.goto(`${PRAXIS}#skills`);
    await expect(page.getByText('Third-Party Leaders')).toBeVisible({ timeout: 8000 });
    // All leaders seeded as disabled; toggling one should call the API
    let toggleCalled = false;
    await page.route('**/api/nexus/leaders/tpl_hyperframes/toggle', async (route) => {
      toggleCalled = true;
      const leaders = SIX_LEADERS.map((l, i) => ({
        ...l,
        licenseSpdx: l.license,
        capabilitySummary: 'summary',
        capabilityTags: [],
        integrationMode: l.mode,
        policyState: 'allowed',
        policyNote: 'ok',
        lastFetchedCommit: 'abc',
        lastFetchedAt: new Date().toISOString(),
        enabled: i === 0 ? true : false,
        logicalCapability: undefined,
      }));
      // Re-mock leaders with HyperFrames enabled
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(leaders[0]),
      });
    });

    // The leaders list renders toggle buttons; click the first one (HyperFrames)
    const toggleButtons = page.locator('[data-testid="leaders-list"] button').filter({ hasText: '' });
    // Find the toggle for HyperFrames by looking for the ToggleLeft inside its card
    const firstLeaderCard = page.locator('[data-testid="leaders-list"] > div').first();
    const toggleBtn = firstLeaderCard.locator('button').last();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();
    await expect(async () => {
      expect(toggleCalled).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test('expanding a leader shows Third-Party Provenance panel', async ({ page }) => {
    await mockLeaders(page);
    await page.goto(`${PRAXIS}#skills`);
    await expect(page.getByText('Third-Party Leaders')).toBeVisible({ timeout: 8000 });

    // Click the first leader card's chevron to expand
    const firstCard = page.locator('[data-testid="leaders-list"] > div').first();
    await firstCard.locator('button').first().click();
    await expect(page.getByText('Third-Party Provenance')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Policy gate', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Last commit', { exact: false }).first()).toBeVisible();
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
