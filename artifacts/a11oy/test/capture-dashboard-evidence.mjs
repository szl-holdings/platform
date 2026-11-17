import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createServer } from 'vite';

// This loopback-only harness imports the real retained pages, provider and hooks.
// Playwright supplies controlled GraphQL query responses. It is not a runtime API.
const artifactRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(artifactRoot, '../..');
const capture = process.argv.includes('--capture');
const sourceRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
assert.match(sourceRevision, /^[0-9a-f]{40}$/);
if (capture) {
  execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'artifacts/a11oy/src', 'artifacts/a11oy/test', 'artifacts/a11oy/package.json'], { cwd: repoRoot, stdio: 'pipe' });
  assert.equal(execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', 'artifacts/a11oy/src', 'artifacts/a11oy/test'], { cwd: repoRoot, encoding: 'utf8' }).trim(), '', 'Commit the exact reviewed UI and harness before capture.');
}
const entryId = path.join(artifactRoot, 'test', '__dashboard-review-entry.tsx').replaceAll('\\', '/');
const entry = `
import { createRoot } from 'react-dom/client';
import { GraphQLProvider } from '/src/graphql/provider.tsx';
import { NowBoard } from '/src/pages/NowBoard.tsx';
import { CommandSurface } from '/src/pages/CommandSurface.tsx';
import '/src/index.css';
const Page = new URLSearchParams(window.location.search).get('page') === 'command' ? CommandSurface : NowBoard;
createRoot(document.getElementById('root')!).render(<GraphQLProvider><div style={{ padding: '12px 20px', background: '#201c12', color: '#e5d29e', font: '12px monospace' }}>LOCAL UI CONTRACT REVIEW — CONTROLLED QUERY FIXTURES — DEPLOYMENT BLOCKED</div><Page /></GraphQLProvider>);
`;
const server = await createServer({
  configFile: false, root: artifactRoot, base: '/',
  plugins: [
    { name: 'dashboard-review-harness',
      resolveId(id) { if (id === '/__dashboard-review-entry.tsx') return entryId; },
      load(id) { if (id === entryId) return entry; },
      configureServer(vite) {
        vite.middlewares.use(async (req, res, next) => {
          if (new URL(req.url ?? '/', 'http://127.0.0.1').pathname !== '/__dashboard-review') return next();
          const html = await vite.transformIndexHtml(req.url, '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Local dashboard contract review</title></head><body><div id="root"></div><script type="module" src="/__dashboard-review-entry.tsx"></script></body></html>');
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        });
      },
    }, react(), tailwindcss(),
  ],
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { host: '127.0.0.1', port: 4137, strictPort: true, fs: { allow: [repoRoot], deny: ['**/.*'] } },
});
let browser;
const origin = 'http://127.0.0.1:4137';
const zero = { __typename: 'AlloyDashboardStats', totalWorkflows: 0, totalRuns: 0, runningRuns: 0, pendingApprovals: 0, failedRuns: 0, successRate: 0, avgDurationMs: 0, workflowsByStatus: [], recentActivity: [] };
const signal = { __typename: 'AlloySignal', id: 'review-signal-001', source: 'controlled-query-fixture', sourceType: 'test', domain: 'alloy-core', severity: 'critical', status: 'active', title: 'Observed query fixture: inspect a governed workflow', description: 'This is a controlled browser-test response, not an operational event.', confidence: null, ownerUserId: null, environment: 'local-review', createdAt: '2026-11-16T23:00:00Z', updatedAt: null };
const fields = { AlloyDashboard: 'alloyDashboard', AlloySignals: 'alloySignals', AlloyWorkflows: 'alloyWorkflows', AlloyApprovals: 'alloyApprovals' };
const cases = [
  { surface: 'now', scenario: 'empty', viewport: { width: 1440, height: 1000 } },
  { surface: 'now', scenario: 'mixed', viewport: { width: 390, height: 844 } },
  { surface: 'command', scenario: 'mixed', viewport: { width: 1440, height: 1000 } },
  { surface: 'command', scenario: 'demo', viewport: { width: 390, height: 844 } },
];
const records = [];
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  for (const current of cases) {
    const page = await browser.newPage({ viewport: current.viewport });
    const errors = [];
    const operations = new Set();
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname !== '/api/graphql') return route.continue();
      assert.ok(['GET', 'POST'].includes(request.method()), 'Only query transports are admitted.');
      const body = request.method() === 'GET' ? { query: url.searchParams.get('query') } : request.postDataJSON();
      const operation = body.query?.match(/\bquery\s+(AlloyDashboard|AlloySignals|AlloyWorkflows|AlloyApprovals)\b/)?.[1];
      assert.ok(operation, 'Only the four read queries are admitted in this harness.');
      operations.add(operation);
      const field = fields[operation];
      const unavailable = current.scenario === 'demo' || (current.scenario === 'mixed' && ['AlloyDashboard', 'AlloyWorkflows'].includes(operation));
      const value = operation === 'AlloyDashboard' ? zero : operation === 'AlloySignals' && current.scenario === 'mixed' ? [signal] : [];
      const response = unavailable ? { data: { [field]: null }, errors: [{ message: 'Controlled review failure' }] } : { data: { [field]: value } };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
    });
    const route = `/__dashboard-review?page=${current.surface}&scenario=${current.scenario}`;
    await page.goto(origin + route);
    const expected = current.scenario === 'empty' ? { dashboard: 'API_DATA', signals: 'EMPTY', workflows: 'EMPTY', approvals: 'EMPTY' }
      : current.scenario === 'mixed' ? { dashboard: 'ERROR', signals: 'API_DATA', workflows: 'ERROR', approvals: 'EMPTY' }
      : { dashboard: 'ERROR', signals: 'ERROR', workflows: 'ERROR', approvals: 'ERROR' };
    await page.waitForFunction(states => Object.entries(states).every(([name, state]) => document.querySelector(`[data-source-name="${name}"]`)?.getAttribute('data-source-state') === state), expected);
    assert.equal(operations.size, 4, 'Each query must be observed independently.');
    assert.equal(await page.locator('[data-status-pill="LIVE"]').count(), 0);
    if (current.scenario === 'mixed') {
      assert.equal(await page.getByText(signal.title, { exact: true }).count(), 1);
      assert.equal(await page.getByRole('button', { name: /approve|defer|reject/i }).count(), 0);
    }
    if (current.scenario === 'empty') {
      assert.match(await page.locator('main').innerText(), /No signals returned/);
      assert.equal(await page.getByText('0s', { exact: true }).count(), 1);
    }
    if (current.scenario === 'demo') {
      await page.getByRole('button', { name: 'Use DEMO fixtures' }).click();
      await page.waitForFunction(() => [...document.querySelectorAll('[data-source-state]')].every(el => el.getAttribute('data-source-state') === 'DEMO'));
      await page.getByRole('button', { name: 'Demo: approve', exact: true }).first().click();
      assert.equal(await page.getByText('Demo choice: approved', { exact: true }).count(), 1);
    }
    await page.evaluate(() => document.fonts.ready);
    assert.deepEqual(errors, [], 'The reviewed page must render without runtime errors.');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'The page must fit the viewport.');
    const capturedAt = new Date().toISOString();
    const date = capturedAt.slice(0, 10);
    if (capture) {
      const name = `a11oy-${current.surface}-evidence-${current.scenario}-${date}.png`;
      const destination = path.join(repoRoot, 'docs/assets/screenshots/current', name);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await page.screenshot({ path: destination, fullPage: true });
      const sha256 = createHash('sha256').update(await fs.readFile(destination)).digest('hex');
      const record = { filename: name, surface: current.surface, route: origin + route, source_revision: sourceRevision, capture_environment: 'local-exact-head', capture_date: capturedAt, viewport: current.viewport, artifact_sha256: sha256, captured_by: 'live_verification', workcell_id: 'dashboard-evidence-states-20261116', proof_level: 'UI_CONTRACT_TEST_ONLY', scenario: current.scenario, query_source: 'Playwright-controlled local fixtures; not runtime delivery evidence', workflow_run_or_command: 'pnpm --filter @workspace/a11oy test:dashboard-evidence:browser --capture', status: 'current' };
      await fs.writeFile(destination.replace(/\.png$/, '.json'), JSON.stringify(record, null, 2) + '\n');
      records.push(record);
    }
    console.log(`PASS ${current.surface} ${current.scenario} ${current.viewport.width}x${current.viewport.height}`);
    await page.close();
  }
  if (capture) {
    const resultPath = path.join(repoRoot, 'audit/dashboard-evidence-capture-20261116.json');
    await fs.writeFile(resultPath, JSON.stringify({ source_revision: sourceRevision, records }, null, 2) + '\n');
    console.log(`CAPTURED ${records.length} exact-source UI screenshots at ${sourceRevision}`);
  }
} finally {
  await browser?.close();
  await server.close();
}
