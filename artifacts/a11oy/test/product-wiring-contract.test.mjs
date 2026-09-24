import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const app = read('../src/App.tsx');
const layout = read('../src/components/layout.tsx');
const ui = read('../src/components/ui.tsx');
const indexHtml = read('../index.html');
const productJourney = read('../src/pages/ProductJourney.tsx');
const architecture = read('../src/pages/ArchitectureOverview.tsx');
const resources = read('../src/pages/ResourcesHub.tsx');
const demo = read('../src/pages/Demo.tsx');
const governance = read('../src/pages/Governance.tsx');
const proof = read('../src/pages/ProofLedger.tsx');
const trust = read('../src/pages/TrustCenter.tsx');
const workcells = read('../src/pages/Workcells.tsx');
const workcellDetail = read('../src/pages/WorkcellDetail.tsx');
const workcellReplay = read('../src/pages/WorkcellReplay.tsx');
const workcellReplayDetail = read('../src/pages/WorkcellReplayDetail.tsx');
const fabric = read('../src/pages/fabric/FabricCockpit.tsx');
const fabricTypes = read('../../../lib/a11oy-fabric/src/types.ts');
const fabricSchema = read('../../../lib/a11oy-fabric/src/schema.ts');
const fabricSeeds = read('../../../lib/a11oy-fabric/src/seed/workcells.ts');
const captureController = read('../../../scripts/qa/capture-screenshot-proof.mjs');
const matrixWrapper = read('../../../scripts/qa/capture-series-a-product-matrix-proof.mjs');
const canonicalSeriesAWrapper = read('../../../scripts/qa/capture-series-a-proof.mjs');
const smokeRoutes = read('../../../scripts/qa/smoke-routes.js');
const rootPackage = JSON.parse(read('../../../package.json'));
const capturePlan = JSON.parse(read('../../../audit/series-a-screenshot-capture-plan.json'));

test('preserves the protected Series A and Atelier contracts while adding product navigation', () => {
  assert.match(app, /<GraphQLProvider>/);
  assert.match(app, /path=\{`\$\{base\}\/atelier`\} component=\{A11oyAtelier\}/);
  assert.match(app, /path=\{`\$\{base\}\/start`\} component=\{SeriesAView\}/);
  assert.match(app, /path=\{`\$\{base\}\/investor-demo`\} component=\{SeriesAView\}/);
  assert.match(app, /path=\{`\$\{base\}\/series-a`\} component=\{SeriesAView\}/);
  assert.match(app, /path=\{`\$\{base\}\/product-journey`\} component=\{ProductJourney\}/);
  for (const route of ['/a11oy/start', '/a11oy/investor-demo', '/a11oy/atelier']) {
    assert.match(smokeRoutes, new RegExp(route.replaceAll('/', '\\/')));
  }
  assert.match(smokeRoutes, /\/a11oy\/series-a/);
  assert.match(smokeRoutes, /\/a11oy\/product-journey/);
});

test('provides explicit investor and developer paths without operational overclaims', () => {
  assert.match(productJourney, /INVESTOR PATH/);
  assert.match(productJourney, /DEVELOPER PATH/);
  for (const route of [
    '/series-a',
    '/demo',
    '/proof',
    '/trust',
    '/architecture',
    '/fabric',
    '/workcells',
    '/governance',
    '/resources',
  ]) {
    assert.match(productJourney, new RegExp(`\\$\\{BASE\\}${route.replaceAll('/', '\\/')}`));
  }
  assert.match(productJourney, /deterministic repository data/);
  assert.match(productJourney, /do not represent authenticated\s+production operations/);
  assert.doesNotMatch(productJourney, /production[- ]ready|verified production|customer adoption/i);
});

test('separates Workcell workflow progress from six-state operational availability', () => {
  for (const state of ['REAL', 'DEMO', 'UNAVAILABLE', 'DEGRADED', 'BLOCKED', 'ROADMAP']) {
    assert.match(fabricTypes, new RegExp(`'${state}'`));
  }
  assert.match(fabricSchema, /operationalAvailability: OperationalAvailability/);
  assert.match(fabricSchema, /operationalEvidence: string/);
  assert.equal((fabricSeeds.match(/operationalAvailability: 'DEMO'/g) ?? []).length, 20);
  assert.equal((fabricSeeds.match(/operationalEvidence: DEMO_EVIDENCE/g) ?? []).length, 20);
  assert.match(fabricSeeds, /const now = \(\) => '2026-04-26T12:00:00\.000Z'/);
  assert.match(workcells, /wc\.operationalAvailability/);
  assert.match(workcells, /wc\.operationalEvidence/);
  assert.match(workcellDetail, /no execution authorized/);
  assert.match(workcellReplay, /replay\.operationalAvailability/);
  assert.match(workcellReplayDetail, /No authenticated production execution/);
  assert.match(workcellReplayDetail, /if \(replayState === 'done'\) setStepIdx\(-1\)/);
  assert.match(workcellReplayDetail, /Resume Replay/);
  assert.match(workcellReplayDetail, /\[2000, 1000, 667, 500\]/);
  assert.match(workcellReplayDetail, /aria-pressed=\{speed === s\}/);
});

test('labels deterministic linked surfaces as DEMO and exposes their evidence boundaries', () => {
  for (const [name, source] of [
    ['Demo', demo],
    ['Governance', governance],
    ['ProofLedger', proof],
    ['TrustCenter', trust],
    ['Workcells', workcells],
    ['WorkcellDetail', workcellDetail],
    ['WorkcellReplay', workcellReplay],
    ['WorkcellReplayDetail', workcellReplayDetail],
    ['FabricCockpit', fabric],
  ]) {
    assert.match(source, /status="DEMO"/, name);
    assert.doesNotMatch(source, /status="LIVE"/, name);
  }
  assert.match(governance, /deterministic local\s+fixtures/);
  assert.match(proof, /not external receipts or customer records/);
  assert.match(demo, /no policy evaluation, execution, receipt, hash, or signature is produced/i);
  assert.doesNotMatch(demo, /All executions cryptographically proven|proof-recorded/);
  assert.match(proof, /DEMO · UNVALIDATED CHAIN SHAPE/);
  assert.match(proof, /Fixture terminal identifier/);
  assert.doesNotMatch(proof, /sha256:|✓ Chain Intact/);
  assert.match(trust, /No authenticated connector exchange/);
  assert.match(fabric, /not authenticated production telemetry/);
  assert.match(ui, /\| 'DEMO'/);
  assert.match(ui, /\| 'UNAVAILABLE'/);
});

test('keeps shared navigation usable on narrow screens and owns one skip target', () => {
  assert.match(layout, /window\.matchMedia\('\(min-width: 768px\)'\)\.matches/);
  assert.match(layout, /addEventListener\('change', syncSidebarToViewport\)/);
  assert.match(layout, /aria-expanded=\{sidebarOpen\}/);
  assert.match(layout, /aria-controls="primary-navigation"/);
  assert.match(layout, /position: isDesktop \? 'sticky' : 'fixed'/);
  assert.match(layout, /if \(!isDesktop\) setSidebarOpen\(false\)/);
  assert.match(layout, /id="primary-navigation"/);
  assert.equal((layout.match(/id="main-content"/g) ?? []).length, 1);
  assert.match(layout, /tabIndex=\{-1\}/);
  assert.match(layout, /minHeight: 44/);
  assert.match(indexHtml, /min-height: 44px/);
  assert.match(indexHtml, /\.skip-to-content:focus \{[\s\S]*opacity: 1/);
});

test('binds architecture and resources to source truth and screenshot reveal markers', () => {
  assert.equal((architecture.match(/data-screenshot-reveal="true"/g) ?? []).length, 3);
  assert.equal((resources.match(/data-screenshot-reveal="true"/g) ?? []).length, 1);
  assert.match(architecture, /unavailable without authenticated deployed evidence/i);
  assert.match(architecture, /minmax\(min\(280px, 100%\), 1fr\)/);
  assert.doesNotMatch(architecture, /all: 'unset'/);
  assert.match(resources, /type Availability = 'source' \| 'internal' \| 'draft'/);
  assert.doesNotMatch(resources, /availability: 'public'/);
  assert.match(resources, /minmax\(min\(300px, 100%\), 1fr\)/);
});

test('keeps canonical Series A proof intact and adds a bounded 75-view local matrix', () => {
  assert.match(canonicalSeriesAWrapper, /VERIFIED_GITHUB_RUNTIME/);
  assert.match(canonicalSeriesAWrapper, /series-a-proof-helpers\.mjs/);
  assert.equal(capturePlan.schema, 'szl.screenshot-capture-plan/v1');
  assert.equal(capturePlan.targets.length, 15);
  assert.equal(
    capturePlan.targets.reduce((total, target) => total + target.viewports.length, 0),
    75,
  );
  const byRoute = new Map(capturePlan.targets.map((target) => [target.route, target]));
  assert.equal(
    byRoute.get('/a11oy/product-journey')?.expected_heading,
    'One fabric. Two clear ways in.',
  );
  for (const route of ['/a11oy/start', '/a11oy/series-a', '/a11oy/investor-demo']) {
    assert.equal(
      byRoute.get(route)?.expected_heading,
      'See the governed decision loop. Inspect the proof boundary.',
    );
  }
  assert.equal(byRoute.get('/a11oy/architecture')?.minimum_screenshot_reveal_elements, 1);
  assert.equal(byRoute.get('/a11oy/resources')?.minimum_screenshot_reveal_elements, 1);
  assert.match(captureController, /SCROLL_REVEAL_TOTAL_TIMEOUT_MS/);
  assert.match(captureController, /SCROLL_REVEAL_RESTORATION_RESERVE_MS/);
  assert.match(captureController, /sweepToStableBottom\('post-reveal'\)/);
  assert.match(captureController, /unrevealed_elements/);
  assert.match(captureController, /maximum_scroll_top/);
  assert.match(captureController, /final_scroll_top/);
  assert.match(matrixWrapper, /scripts\/qa\/capture-series-a-product-matrix-proof\.mjs/);
  assert.match(matrixWrapper, /LOCAL_NON_AUTHORITATIVE/);
  assert.match(matrixWrapper, /verifyProductInteractions\(preview.origin\)/);
  assert.match(matrixWrapper, /sha256\(interactionBytes\)/);
  assert.match(matrixWrapper, /captured surface has invalid scroll-reveal evidence/);
  assert.equal(
    rootPackage.scripts['screenshots:a11oy:product-proof'],
    'node scripts/qa/capture-series-a-product-matrix-proof.mjs',
  );
});
