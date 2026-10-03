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
const workcellProofCoverage = read('../src/components/WorkcellProofCoverage.tsx');
const workcellProofCoverageEvaluator = read('../src/lib/workcell-proof-coverage.ts');
const fabric = read('../src/pages/fabric/FabricCockpit.tsx');
const fabricTypes = read('../../../lib/a11oy-fabric/src/types.ts');
const fabricSchema = read('../../../lib/a11oy-fabric/src/schema.ts');
const fabricSeeds = read('../../../lib/a11oy-fabric/src/seed/workcells.ts');
const pceSeeds = read('../../../lib/a11oy-fabric/src/seed/pceContracts.ts');
const proofPacketSeeds = read('../../../lib/a11oy-fabric/src/seed/proofPackets.ts');
const captureController = read('../../../scripts/qa/capture-screenshot-proof.mjs');
const matrixWrapper = read('../../../scripts/qa/capture-series-a-product-matrix-proof.mjs');
const productInteractions = read('../../../scripts/qa/a11oy-product-interactions.mjs');
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

test('fails closed when Workcell proof references are missing or mismatched', () => {
  assert.match(workcellReplayDetail, /<WorkcellProofCoverage workcell=\{wc\}/);
  for (const status of ['SATISFIED', 'MISMATCH', 'UNAVAILABLE']) {
    assert.match(workcellProofCoverageEvaluator, new RegExp(`'${status}'`));
  }
  for (const obligation of [
    'contract-record',
    'contract-integrity',
    'action-context',
    'evaluation-lineage',
    'trace-binding',
    'proof-context',
    'proof-policy-binding',
    'proof-approval-binding',
    'proof-integrity',
  ]) {
    assert.match(workcellProofCoverageEvaluator, new RegExp(`'${obligation}'`));
  }
  assert.match(workcellProofCoverageEvaluator, /satisfied === obligations\.length/);
  assert.match(workcellProofCoverageEvaluator, /policyEvaluationIds\.filter/);
  assert.match(workcellProofCoverageEvaluator, /policyEvaluationMatches\.length > 1/);
  assert.match(workcellProofCoverageEvaluator, /approvalRecordIds\.filter/);
  assert.match(workcellProofCoverageEvaluator, /approvalRecordMatches\.length > 1/);
  assert.match(workcellProofCoverageEvaluator, /executionTraces\.filter/);
  assert.match(workcellProofCoverageEvaluator, /traceMatches\.length > 1/);
  assert.match(workcellProofCoverageEvaluator, /contractMatches\.length === 1/);
  assert.match(workcellProofCoverageEvaluator, /proofPacketMatches\.length === 1/);
  assert.match(workcellProofCoverageEvaluator, /proofPacket\.kind !== 'action_execution'/);
  assert.match(
    workcellProofCoverageEvaluator,
    /proofPacket\.policyEvaluationId !== storedContract\.policyEvaluationId/,
  );
  assert.match(
    workcellProofCoverageEvaluator,
    /proofPacket\.approvalRecordId !== approvalRecordId/,
  );
  assert.match(workcellProofCoverageEvaluator, /no ExecutionTrace record resolves/);
  assert.match(workcellProofCoverageEvaluator, /Scope and actor are not verified/);
  assert.match(workcellProofCoverage, /DEMO · CONTRACT-TO-EVIDENCE JOIN/);
  assert.match(
    workcellProofCoverage,
    /Any\s+absent, ambiguous, or mismatched obligation\s+keeps the result\s+incomplete/,
  );
  assert.match(
    workcellProofCoverage,
    /Even COMPLETE would not verify signatures,\s+durable storage, operator identity/,
  );
  assert.doesNotMatch(
    workcellProofCoverage,
    /status="LIVE"|cryptographically verified|production[- ]ready/i,
  );
  assert.match(
    pceSeeds,
    /id: 'pce-001'[\s\S]*policyEvaluationId: 'pe-001'[\s\S]*approvalRecordId: 'ar-001'[\s\S]*proofPacketId: 'proof-001'/,
  );
  assert.match(
    proofPacketSeeds,
    /id: 'proof-001'[\s\S]*kind: 'signal_ingestion'[\s\S]*entityId: 'sig-lyte-002'[\s\S]*entityType: 'signal'/,
  );
  for (const control of [
    'Remove proof reference',
    'Substitute action ID',
    'Omit approval reference',
    'Reset challenges',
  ]) {
    assert.match(workcellProofCoverage, new RegExp(control));
  }
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
  assert.match(captureController, /The boot marker does not establish lazy-route readiness/);
  assert.match(captureController, /mains\.length === 1/);
  assert.match(matrixWrapper, /scripts\/qa\/capture-series-a-product-matrix-proof\.mjs/);
  assert.match(matrixWrapper, /LOCAL_NON_AUTHORITATIVE/);
  assert.match(matrixWrapper, /SOURCE_IDENTITY_PATH = '\/a11oy\/__source-identity\.json'/);
  assert.match(matrixWrapper, /X-SZL-Served-Asset-SHA256/);
  assert.match(matrixWrapper, /served asset no longer matches the verified build manifest/);
  assert.match(matrixWrapper, /expectedServedIdentity: servedIdentity/);
  assert.match(matrixWrapper, /interactions\.served_identity\?\.state !== 'VERIFIED'/);
  assert.match(matrixWrapper, /sha256\(interactionBytes\)/);
  assert.match(matrixWrapper, /captured surface has invalid scroll-reveal evidence/);
  assert.match(productInteractions, /schema: 'szl\.a11oy-product-interactions\/v2'/);
  assert.match(productInteractions, /source identity endpoint/);
  assert.match(productInteractions, /verifyNavigationIdentity/);
  assert.match(productInteractions, /x-szl-served-asset-sha256/);
  assert.equal(
    rootPackage.scripts['screenshots:a11oy:product-proof'],
    'node scripts/qa/capture-series-a-product-matrix-proof.mjs',
  );
});

test('locks the browser rail to exact proof coverage and served-build identity', () => {
  for (const [scenario, satisfied] of [
    ['baseline', 8],
    ["'remove-proof-reference'", 6],
    ["'substitute-action-id'", 7],
    ["'omit-approval-reference'", 8],
    ['combined', 5],
  ]) {
    assert.match(
      productInteractions,
      new RegExp(`${scenario}: \\{[\\s\\S]*?satisfied: ${satisfied},[\\s\\S]*?total: 17`),
      scenario,
    );
  }
  for (const [obligation, status] of [
    ['trace-binding', 'UNAVAILABLE'],
    ['proof-integrity', 'SATISFIED'],
    ['terminal-state', 'MISMATCH'],
  ]) {
    assert.match(productInteractions, new RegExp(`'${obligation}': '${status}'`), obligation);
  }
  assert.match(productInteractions, /obligation IDs must be unique/);
  assert.match(productInteractions, /assert\.deepEqual\(observedStatuses, expected\.statuses/);
  assert.match(productInteractions, /await verifyProofCoverage\('combined'\)/);
  assert.match(productInteractions, /No source\/build identity was supplied/);
  assert.match(productInteractions, /state: 'UNBOUND'/);
  assert.match(productInteractions, /state: 'VERIFIED'/);
  assert.match(productInteractions, /signal: AbortSignal\.timeout\(READINESS_TIMEOUT_MS\)/);
});

test('retains navigation failure context and cause without relaxing browser readiness', () => {
  assert.match(productInteractions, /const READINESS_TIMEOUT_MS = 10_000;/);
  assert.match(
    productInteractions,
    /playwrightExpect\.configure\(\{ timeout: READINESS_TIMEOUT_MS \}\)/,
  );
  assert.match(productInteractions, /page\.setDefaultTimeout\(READINESS_TIMEOUT_MS\)/);
  const go = productInteractions.match(/const go = async \(route\) => \{[\s\S]*?\n {6}\};/)?.[0];
  assert.ok(go, 'navigation helper remains explicit and bounded');
  assert.match(go, /assert\.equal\(response\?\.status\(\), 200, route\)/);
  assert.match(
    go,
    /await page\.waitForFunction\(\(\) => document\.body\.dataset\.screenshotReady === 'true'\)/,
  );
  assert.match(go, /await page\.evaluate\(async \(\) => document\.fonts\.ready\)/);
  assert.match(go, /await expect\(page\.locator\('main h1'\)\)\.toBeVisible\(\)/);
  const failure = go.slice(go.indexOf('catch (cause)'));
  assert.match(failure, /catch \(cause\)/);
  assert.match(failure, /throw new Error\(/);
  assert.match(failure, /Product navigation failed: \$\{JSON\.stringify\(\{\s*width,\s*route,/);
  assert.match(failure, /lastPassingState: records\.at\(-1\)\?\.state \?\? null/);
  assert.match(failure, /browserErrors: errors\.slice\(-10\)/);
  assert.match(failure, /\{ cause \}/);
  assert.doesNotMatch(failure, /\bawait\b|\bpage\.|\bcontext\./);
  assert.doesNotMatch(go, /clock\.|setDefaultTimeout|waitForTimeout|setTimeout|\.reload\(/);
  assert.doesNotMatch(productInteractions, /page\.clock\.resume\(/);
});
