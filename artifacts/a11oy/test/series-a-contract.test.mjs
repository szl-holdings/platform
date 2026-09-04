import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const page = readFileSync(new URL('../src/pages/SeriesAView.tsx', import.meta.url), 'utf8');
const journey = readFileSync(new URL('../src/pages/ProductJourney.tsx', import.meta.url), 'utf8');
const workcellsPage = readFileSync(new URL('../src/pages/Workcells.tsx', import.meta.url), 'utf8');
const workcellDetail = readFileSync(
  new URL('../src/pages/WorkcellDetail.tsx', import.meta.url),
  'utf8',
);
const workcellReplayDetail = readFileSync(
  new URL('../src/pages/WorkcellReplayDetail.tsx', import.meta.url),
  'utf8',
);
const workcellReplay = readFileSync(
  new URL('../src/pages/WorkcellReplay.tsx', import.meta.url),
  'utf8',
);
const demoPage = readFileSync(new URL('../src/pages/Demo.tsx', import.meta.url), 'utf8');
const fabricPage = readFileSync(
  new URL('../src/pages/fabric/FabricCockpit.tsx', import.meta.url),
  'utf8',
);
const governancePage = readFileSync(
  new URL('../src/pages/Governance.tsx', import.meta.url),
  'utf8',
);
const proofPage = readFileSync(new URL('../src/pages/ProofLedger.tsx', import.meta.url), 'utf8');
const trustPage = readFileSync(new URL('../src/pages/TrustCenter.tsx', import.meta.url), 'utf8');
const architecturePage = readFileSync(
  new URL('../src/pages/ArchitectureOverview.tsx', import.meta.url),
  'utf8',
);
const resourcesPage = readFileSync(
  new URL('../src/pages/ResourcesHub.tsx', import.meta.url),
  'utf8',
);
const homePage = readFileSync(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../src/components/ui.tsx', import.meta.url), 'utf8');
const data = readFileSync(new URL('../src/data/seriesASolutions.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/components/layout.tsx', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const rootPackageJson = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
);
const fabricTypes = readFileSync(
  new URL('../../../lib/a11oy-fabric/src/types.ts', import.meta.url),
  'utf8',
);
const fabricSchema = readFileSync(
  new URL('../../../lib/a11oy-fabric/src/schema.ts', import.meta.url),
  'utf8',
);
const fabricSeeds = readFileSync(
  new URL('../../../lib/a11oy-fabric/src/seed/workcells.ts', import.meta.url),
  'utf8',
);
const captureScript = readFileSync(
  new URL('../../../scripts/qa/capture-series-a-proof.mjs', import.meta.url),
  'utf8',
);
const canonicalCapture = readFileSync(
  new URL('../../../scripts/qa/capture-screenshot-proof.mjs', import.meta.url),
  'utf8',
);
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const capturePlan = JSON.parse(
  readFileSync(
    new URL('../../../audit/series-a-screenshot-capture-plan.json', import.meta.url),
    'utf8',
  ),
);
const rootStylesheet = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const omniaProvider = readFileSync(
  new URL('../../../packages/omnia-shell/src/OmniaShellProvider.tsx', import.meta.url),
  'utf8',
);

const solutionIds = [
  'cyber-security',
  'finance',
  'data-governance',
  'enterprise',
  'real-estate',
  'legal',
];

test('declares exactly the six Series A solution views', () => {
  const declared = [...data.matchAll(/^\s{4}id: '([^']+)'/gm)].map((match) => match[1]);
  assert.deepEqual(declared, solutionIds);
  for (const label of [
    'Cyber security',
    'Finance',
    'Data governance',
    'Enterprise operations',
    'Real estate',
    'Legal',
  ]) {
    assert.match(data, new RegExp(`title: '${label}'`));
  }
});

test('keeps Observe, Gate, Act, Prove and operational truth states explicit', () => {
  for (const phase of ['Observe', 'Gate', 'Act', 'Prove']) {
    assert.match(data, new RegExp(`phase: '${phase}'`));
  }
  for (const state of ['AVAILABLE', 'DEMO', 'BLOCKED', 'UNAVAILABLE']) {
    assert.match(page, new RegExp(`state=\\"${state}\\"|state: '${state}'|${state}`));
  }
  assert.match(page, /No server resolver route for the declared GraphQL client contract was found/);
  assert.doesNotMatch(page, /production[- ]ready|SOC 2 certified|enterprise customers|proven ROI/i);
});

test('registers distinct start, Series A, and deterministic investor-demo routes', () => {
  assert.match(app, /path=\{`\$\{base\}\/start`\} component=\{ProductJourney\}/);
  assert.match(app, /path=\{`\$\{base\}\/series-a`\} component=\{SeriesAView\}/);
  assert.match(app, /path=\{`\$\{base\}\/investor-demo`\} component=\{Demo\}/);
  assert.doesNotMatch(app, /import\('\.\/pages\/InvestorDemo'\)/);
  assert.match(layout, /href=\{b\('\/start'\)\}/);
  assert.match(layout, />\s*Start here\s*</);
});

test('provides complete investor and developer journeys with one route-owned main landmark', () => {
  for (const destination of [
    '/series-a',
    '/investor-demo',
    '/proof',
    '/trust',
    '/architecture',
    '/fabric',
    '/workcells',
    '/governance',
    '/resources',
  ]) {
    assert.match(journey, new RegExp(`\\$\\{BASE\\}${destination.replaceAll('/', '\\/')}`));
    assert.match(app, new RegExp(`\\$\\{base\\}${destination.replaceAll('/', '\\/')}`));
  }
  assert.match(journey, /active prototype and investor demo platform/);
  assert.match(journey, /do not represent authenticated\s+production operations/);
  assert.doesNotMatch(journey, /\$\{BASE\}\/sdk/);
  assert.doesNotMatch(journey, /<main\b/);
  assert.doesNotMatch(journey, /id="main-content"/);
  assert.match(page, /<main className="sa-main"/);
  assert.match(layout, /<main\s+id="main-content"\s+tabIndex=\{-1\}/);
});

test('provides keyboard-operable tabs and narrow-screen layouts', () => {
  assert.match(page, /role="tablist"/);
  assert.match(page, /aria-selected=/);
  assert.match(page, /ArrowLeft/);
  assert.match(page, /ArrowRight/);
  assert.match(page, /@media \(max-width: 520px\)/);
  assert.match(page, /\.sa-header nav \{ display: grid; grid-template-columns: repeat\(2,/);
  assert.match(page, /\.sa-truth-grid, \.sa-loop, \.sa-tabs \{ grid-template-columns: 1fr; \}/);
  assert.match(page, /min-height: 46px/);
  assert.doesNotMatch(page, /Live Enterprise Execution Fabric/);
});

test('links every solution to an existing registered source route', () => {
  const hrefs = [...data.matchAll(/^\s{4}demoHref: '([^']+)'/gm)].map((match) => match[1]);
  assert.equal(hrefs.length, solutionIds.length);
  for (const href of hrefs) {
    assert.match(app, new RegExp(`\\$\\{base\\}${href.replaceAll('/', '\\/')}`));
  }
  for (const legacyUnsafeRoute of [
    '/cyber-resilience',
    '/counterfactuals',
    '/approval-queue',
    '/fabric/verticals',
    '/right-to-audit',
    '/sdk',
  ]) {
    assert.ok(!hrefs.includes(legacyUnsafeRoute));
  }
});

test('resolves the local FlexCache source entrypoints used by the production bundle', () => {
  assert.match(viteConfig, /@szl-holdings\\\/flexcache\\\/react/);
  assert.match(viteConfig, /lib\/flexcache\/src\/react\.tsx/);
  assert.match(viteConfig, /lib\/flexcache\/src\/index\.ts/);
});

test('fails closed when the Omnia network endpoints are absent', () => {
  assert.match(main, /networkState: 'UNAVAILABLE'/);
  assert.match(omniaProvider, /config\.networkState === 'UNAVAILABLE'/);
});

test('separates workflow status from typed operational availability for every seed', () => {
  for (const state of ['REAL', 'DEMO', 'UNAVAILABLE', 'DEGRADED', 'BLOCKED', 'ROADMAP']) {
    assert.match(fabricTypes, new RegExp(`'${state}'`));
  }
  assert.equal(
    [...fabricSchema.matchAll(/operationalAvailability: OperationalAvailability;/g)].length,
    2,
  );
  assert.equal([...fabricSchema.matchAll(/operationalEvidence: string;/g)].length, 2);

  const seedCount = [...fabricSeeds.matchAll(/^ {4}id: 'wc-/gm)].length;
  assert.equal(seedCount, 20);
  assert.equal(
    [...fabricSeeds.matchAll(/^ {4}operationalAvailability: 'DEMO',/gm)].length,
    seedCount,
  );
  assert.equal(
    [...fabricSeeds.matchAll(/^ {4}operationalEvidence: DEMO_EVIDENCE,/gm)].length,
    seedCount,
  );
  assert.match(fabricSeeds, /no authenticated production operation is represented/);
  assert.match(fabricSeeds, /const now = \(\) => '2026-04-26T12:00:00\.000Z'/);
  assert.doesNotMatch(fabricSeeds, /new Date\(\)/);
  assert.match(workcellsPage, /status="DEMO"/);
  assert.match(workcellsPage, /wc\.operationalAvailability/);
  assert.match(workcellsPage, /wc\.operationalEvidence/);
});

test('keeps Workcell detail and replay routes inside the deterministic DEMO boundary', () => {
  for (const source of [workcellDetail, workcellReplayDetail, workcellReplay]) {
    assert.match(source, /status="DEMO"/);
    assert.match(source, /operationalAvailability/);
    assert.match(source, /operationalEvidence/);
    assert.match(source, /WORKFLOW/);
    assert.match(source, /OPERATIONAL/);
    assert.match(source, /min-h-11/);
    assert.doesNotMatch(source, /status="LIVE"/);
  }

  assert.match(workcellReplay, /workflowOutcome/);
  assert.match(workcellReplay, /completedAt: wc\.updatedAt/);
  assert.doesNotMatch(workcellReplay, /Date\.now|Math\.random/);
  assert.doesNotMatch(workcellReplay, /reconstructed from the immutable Proof Ledger/);
  assert.match(workcellDetail, /no execution authorized/);
  assert.match(workcellDetail, /Object\.entries\(wc\.mockExecutionResult\)/);
  assert.doesNotMatch(workcellDetail, /durationMs|outputSummary/);
  assert.doesNotMatch(workcellDetail, /✓ Approved — execution authorized|Contract verified/);
  assert.match(workcellReplayDetail, /No authenticated production execution/);
  assert.match(workcellReplay, /workcells\/\$\{replay\.workcellId\}\/replay/);
  assert.doesNotMatch(workcellReplay, /replay\/\$\{replay\.id\}/);
  assert.match(workcellsPage, /min-h-11 min-w-11 text-xs/);
  assert.equal([...workcellReplay.matchAll(/min-h-11 min-w-11 px-3 rounded text-xs/g)].length, 2);
});

test('uses explicit DEMO labels on linked prototype surfaces', () => {
  for (const source of [demoPage, fabricPage, governancePage, proofPage, trustPage]) {
    assert.match(source, /status="DEMO"/);
    assert.doesNotMatch(source, /status="LIVE"/);
  }
  assert.match(governancePage, /This page makes no approval API or subscription request/);
  assert.doesNotMatch(
    governancePage,
    /useAlloyApprovals|useAlloyWorkflows|useApprovalSubscription/,
  );
  assert.doesNotMatch(app, /<GraphQLProvider>/);
  assert.equal([...main.matchAll(/<GraphQLProvider>/g)].length, 1);
});

test('keeps architecture and resource destinations source-bound and safely linked', () => {
  assert.doesNotMatch(architecturePage, /id="main-content"/);
  assert.match(architecturePage, /aria-expanded=/);
  assert.match(architecturePage, /unavailable without authenticated deployed evidence/i);
  assert.match(resourcesPage, /type Availability = 'source' \| 'internal' \| 'draft'/);
  for (const safeRoute of ['/architecture', '/governance', '/fabric']) {
    assert.match(resourcesPage, new RegExp(`href: '/a11oy${safeRoute}'`));
  }
  for (const unsafeRoute of ['/about', '/applications', '/pce']) {
    assert.doesNotMatch(resourcesPage, new RegExp(`href: '/a11oy${unsafeRoute}'`));
  }
  assert.doesNotMatch(resourcesPage, /availability: 'public'/);
  assert.doesNotMatch(resourcesPage, /<main\b/);
  assert.match(resourcesPage, /minmax\(min\(300px, 100%\), 1fr\)/);
});

test('gives DEMO an explicit non-LIVE visual treatment', () => {
  assert.match(ui, /\| 'DEMO'/);
  assert.match(ui, /DEMO: \{ bg: '[^']+', color: '[^']+' \}/);
  assert.match(ui, /status === 'LIVE'/);
  assert.doesNotMatch(ui, /status === 'DEMO'.*animate-pulse/s);
});

test('exposes the Series A contract suite through the normal package test task', () => {
  assert.equal(packageJson.scripts.test, packageJson.scripts['test:series-a']);
  assert.equal(
    rootPackageJson.scripts['screenshots:series-a:proof'],
    'node scripts/qa/capture-series-a-proof.mjs',
  );
});

test('owns a clean build and loopback server before source-bound capture', () => {
  assert.match(captureScript, /mkdtemp/);
  assert.match(captureScript, /vite\/bin\/vite\.js/);
  assert.match(captureScript, /createServer/);
  assert.match(captureScript, /served_asset_manifest_sha256/);
  assert.match(captureScript, /post_capture_manifest_sha256/);
  assert.match(captureScript, /capture-screenshot-proof\.mjs/);
  assert.match(captureScript, /tracked source changed/);
  assert.match(captureScript, /untracked source input exists/);
  assert.match(captureScript, /LOCAL_NON_AUTHORITATIVE/);
  assert.match(captureScript, /readTrackedFile/);
  assert.match(captureScript, /rejectSymlinkComponents/);
  assert.match(captureScript, /expectedCaptures\.size \* CANONICAL_CAPTURE_TIMEOUT_PER_CASE_MS/);
  assert.match(captureScript, /timeout: canonicalCaptureTimeoutMs/);
  assert.match(captureScript, /await runChild\(process\.execPath, \[canonicalCapture\]/);
  assert.match(captureScript, /const child = spawn\(command, args,/);
  assert.doesNotMatch(captureScript, /execFileSync\(process\.execPath, \[canonicalCapture\]/);
  assert.doesNotMatch(captureScript, /PLAYWRIGHT_BASE_URL/);
  assert.match(
    canonicalCapture,
    /async function revealScrollTriggeredContent\(page, minimumMarkedElements\)/,
  );
  assert.match(canonicalCapture, /const scrollReveal = await revealScrollTriggeredContent\(/);
  assert.match(canonicalCapture, /MAX_SCROLL_REVEAL_STEPS/);
  assert.match(canonicalCapture, /SCROLL_REVEAL_TIMEOUT_MS/);
  assert.match(canonicalCapture, /SCROLL_REVEAL_TOTAL_TIMEOUT_MS/);
  assert.match(canonicalCapture, /SCROLL_REVEAL_RESTORATION_RESERVE_MS/);
  assert.match(canonicalCapture, /stableBottomPasses < 2/);
  assert.match(canonicalCapture, /sweepToStableBottom\('post-reveal'\)/);
  assert.match(canonicalCapture, /\[data-screenshot-reveal\]/);
  assert.match(canonicalCapture, /isEffectivelyVisible/);
  assert.match(canonicalCapture, /unrevealed_elements/);
  assert.match(canonicalCapture, /scroll reveal restoration paint/);
  assert.match(canonicalCapture, /restorationBounded/);
  assert.ok(
    canonicalCapture.indexOf('await page.waitForFunction(') <
      canonicalCapture.indexOf("sweepToStableBottom('post-reveal')"),
  );
  assert.match(captureScript, /captured surface has invalid scroll-reveal evidence/);
  assert.ok(
    canonicalCapture.indexOf('const scrollReveal = await revealScrollTriggeredContent(') <
      canonicalCapture.indexOf('const state = await page.evaluate'),
  );
  assert.match(canonicalCapture, /fullPage: true, timeout: 60_000/);
  assert.ok(
    captureScript.indexOf("verifyCheckout('after teardown'") <
      captureScript.indexOf("path.join(absoluteOutputDirectory, 'source-bound-metadata.json')"),
  );
});

test('uses deterministic local font stacks with no runtime font provider', () => {
  assert.doesNotMatch(rootStylesheet, /fonts\.googleapis\.com|fonts\.gstatic\.com|@import\s+url/i);
  assert.match(rootStylesheet, /--font-sans: system-ui/);
  assert.match(rootStylesheet, /--font-mono: ui-monospace/);
});

test('keeps the shared navigation responsive and its skip target verifiable', () => {
  assert.match(layout, /window\.matchMedia\('\(min-width: 768px\)'\)\.matches/);
  assert.match(layout, /aria-expanded=\{sidebarOpen\}/);
  assert.match(layout, /id="primary-navigation"/);
  assert.match(indexHtml, /min-height: 44px/);
  assert.match(indexHtml, /opacity: 0/);
  assert.match(indexHtml, /\.skip-to-content:focus \{[\s\S]*opacity: 1/);
  assert.match(trustPage, /flex min-w-0 items-center gap-3/);
});

test('binds every planned route to its expected heading', () => {
  assert.equal(capturePlan.schema, 'szl.screenshot-capture-plan/v1');
  assert.equal(capturePlan.workcell_id, 'P0-SERIES-A-PRODUCT-WIRING-20260811');
  const expectedRoutes = new Map([
    ['/a11oy/start', 'One fabric. Two clear ways in.'],
    ['/a11oy/series-a', 'See the governed decision loop. Inspect the proof boundary.'],
    ['/a11oy/investor-demo', 'Interactive Demo Scenarios'],
    ['/a11oy/workcells', 'Execution Workcell Engine'],
    ['/a11oy/workcells/wc-001', 'Revenue Friction Remediation'],
    ['/a11oy/workcells/wc-001/replay', '↩ Revenue Friction Remediation'],
    ['/a11oy/replay', 'Demo Flight Recorder & Execution Audit'],
    ['/a11oy/demo', 'Interactive Demo Scenarios'],
    ['/a11oy/architecture', 'Eleven architecture components. One governed system.'],
    ['/a11oy/fabric', 'Universal Intelligence Layer'],
    ['/a11oy/governance', 'Policy Gates & Approvals'],
    ['/a11oy/proof', 'Proof Chain & Reasoning Trace Demonstration'],
    ['/a11oy/resources', 'Architecture, Guides & References'],
    ['/a11oy/trust', 'Human-Gated Autonomy & Security Posture'],
  ]);
  assert.equal(capturePlan.targets.length, expectedRoutes.size);
  for (const target of capturePlan.targets) {
    assert.equal(target.expected_heading, expectedRoutes.get(target.route));
    assert.equal(
      target.minimum_screenshot_reveal_elements ?? 0,
      ['/a11oy/architecture', '/a11oy/resources'].includes(target.route) ? 1 : 0,
    );
    assert.deepEqual(
      target.viewports.map(({ width }) => width),
      [320, 390, 768, 1366, 1728],
    );
  }
  assert.equal(
    capturePlan.targets.reduce((total, target) => total + target.viewports.length, 0),
    70,
  );
});

test('marks every captured viewport-triggered motion group for fail-closed screenshots', () => {
  for (const [filename, source, expectedCount] of [
    ['ArchitectureOverview.tsx', architecturePage, 3],
    ['ResourcesHub.tsx', resourcesPage, 1],
    ['HomePage.tsx', homePage, 1],
  ]) {
    const whileInViewCount = source.match(/\bwhileInView=/g)?.length ?? 0;
    const revealMarkerCount = source.match(/\bdata-screenshot-reveal=/g)?.length ?? 0;
    assert.equal(revealMarkerCount, whileInViewCount, filename);
    assert.equal(revealMarkerCount, expectedCount, filename);
  }
});

test('fails screenshot evidence closed on wrong headings and browser/network errors', () => {
  assert.match(canonicalCapture, /expected_heading/);
  assert.match(canonicalCapture, /data-screenshot-ready="true"/);
  assert.match(canonicalCapture, /page\.on\(['"]pageerror['"]/);
  assert.match(canonicalCapture, /page\.on\(['"]requestfailed['"]/);
  assert.match(canonicalCapture, /bad HTTP responses/);
  assert.match(canonicalCapture, /undeclared network requests/);
  assert.match(canonicalCapture, /allowedOrigins/);
  assert.match(canonicalCapture, /clippedElements/);
  assert.match(canonicalCapture, /unnamedInteractiveElements/);
  assert.match(canonicalCapture, /undersizedInteractiveElements/);
  assert.match(canonicalCapture, /smaller than 44x44px/);
  assert.match(canonicalCapture, /localLinkFailures/);
});
