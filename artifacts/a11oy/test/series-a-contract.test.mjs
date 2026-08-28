import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const page = readFileSync(new URL('../src/pages/SeriesAView.tsx', import.meta.url), 'utf8');
const data = readFileSync(new URL('../src/data/seriesASolutions.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/components/layout.tsx', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const captureScript = readFileSync(
  new URL('../../../scripts/qa/capture-series-a-proof.mjs', import.meta.url),
  'utf8',
);
const proofHelpers = readFileSync(
  new URL('../../../scripts/qa/series-a-proof-helpers.mjs', import.meta.url),
  'utf8',
);
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

const solutionsBlock = data.slice(
  data.indexOf('export const SERIES_A_SOLUTIONS'),
  data.indexOf('export type SeriesADeveloperStep'),
);

test('declares exactly the six Series A solution views', () => {
  const declared = [...solutionsBlock.matchAll(/^\s{4}id: '([^']+)'/gm)].map((match) => match[1]);
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

test('keeps Observe, Gate, Act, Prove and the exact six-state vocabulary explicit', () => {
  for (const phase of ['Observe', 'Gate', 'Act', 'Prove']) {
    assert.match(data, new RegExp(`phase: '${phase}'`));
  }
  const declaredStates = data
    .match(/SERIES_A_EVIDENCE_STATES = \[([\s\S]*?)\] as const/)?.[1]
    ?.match(/'[^']+'/g)
    ?.map((state) => state.slice(1, -1));
  assert.deepEqual(declaredStates, [
    'REAL',
    'DEMO',
    'UNAVAILABLE',
    'DEGRADED',
    'BLOCKED',
    'ROADMAP',
  ]);
  for (const state of declaredStates) {
    assert.match(page, new RegExp(`${state}:|state=\\"${state}\\"|SERIES_A_EVIDENCE_STATES`));
  }
  assert.match(data, /REAL: 'Authenticated or independently observed operational evidence/);
  assert.doesNotMatch(data, /['"]AVAILABLE['"]/);
  assert.doesNotMatch(solutionsBlock, /sourceState: 'REAL'/);
  assert.match(page, /No server resolver route for the declared GraphQL client contract was found/);
  assert.doesNotMatch(page, /production[- ]ready|SOC 2 certified|enterprise customers|proven ROI/i);
});

test('maps both Series A entry points to the same truth-qualified view', () => {
  assert.match(app, /path=\{`\$\{base\}\/start`\} component=\{SeriesAView\}/);
  assert.match(app, /path=\{`\$\{base\}\/investor-demo`\} component=\{SeriesAView\}/);
  assert.doesNotMatch(app, /component=\{InvestorDemo\}|import\('\.\/pages\/InvestorDemo'\)/);
  assert.match(layout, /href=\{b\('\/start'\)\}/);
  assert.match(layout, />\s*Series A view\s*</);
});

test('provides keyboard-operable tabs and narrow-screen layouts', () => {
  assert.match(page, /role="tablist"/);
  assert.match(page, /aria-selected=/);
  assert.match(page, /hidden=\{!active\}/);
  assert.match(page, /ArrowLeft/);
  assert.match(page, /ArrowRight/);
  assert.match(page, /@media \(max-width: 520px\)/);
  assert.match(page, /\.sa-header nav \{ display: grid; grid-template-columns: repeat\(2,/);
  assert.match(
    page,
    /\.sa-truth-grid, \.sa-vocabulary-grid, \.sa-loop, \.sa-tabs \{ grid-template-columns: 1fr; \}/,
  );
  assert.match(page, /min-height: 46px/);
  assert.doesNotMatch(page, /Live Enterprise Execution Fabric/);
});

test('keeps every Series A action inside the truth-qualified start surface', () => {
  assert.doesNotMatch(data, /demoHref/);
  assert.doesNotMatch(page, /from 'wouter'|href=\{route\(|const route =/);

  const fragmentHrefs = [...page.matchAll(/href="(#[^"]+)"/g)].map((match) => match[1]);
  assert.ok(fragmentHrefs.length > 0);
  for (const href of new Set(fragmentHrefs)) {
    assert.match(page, new RegExp(`id="${href.slice(1)}"`));
  }

  for (const bannedPath of [
    '/architecture',
    '/demo',
    '/proof',
    '/governance',
    '/sdk',
    '/workcells',
    '/right-to-audit',
    '/cyber-resilience',
    '/counterfactuals',
    '/approval-queue',
    '/fabric/verticals',
  ]) {
    assert.doesNotMatch(page, new RegExp(`href=.*${bannedPath.replaceAll('/', '\\/')}`));
  }
  assert.doesNotMatch(page, /\bLIVE\b|cryptographically proven|contractual customer/);
});

test('provides the complete inline developer and receipt-verification path', () => {
  const developerBlock = data.slice(
    data.indexOf('export const SERIES_A_DEVELOPER_PATH'),
    data.indexOf('export const SERIES_A_RECEIPT_FIELDS'),
  );
  const developerIds = [...developerBlock.matchAll(/^\s{4}id: '([^']+)'/gm)].map(
    (match) => match[1],
  );
  assert.deepEqual(developerIds, [
    'architecture',
    'interfaces',
    'workcells',
    'governance',
    'receipts',
    'local-run',
    'verification',
  ]);
  for (const field of [
    'scenario_id',
    'source_state',
    'policy_version',
    'approval_state',
    'proposed_action',
    'evidence_refs',
    'generated_at',
  ]) {
    assert.match(data, new RegExp(`field: '${field}'`));
  }
  assert.match(page, /Receipt shape, not a fabricated receipt/);
  assert.match(data, /pnpm --filter @workspace\/a11oy test:series-a/);
  assert.match(data, /pnpm --filter @workspace\/a11oy typecheck/);
  assert.match(data, /pnpm --filter @workspace\/a11oy build/);
  assert.ok(packageJson.scripts['test:series-a']);
  assert.ok(packageJson.scripts.typecheck);
  assert.ok(packageJson.scripts.build);
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

test('exposes the Series A contract suite through the normal package test task', () => {
  assert.equal(packageJson.scripts.test, packageJson.scripts['test:series-a']);
});

test('resets and verifies scroll origin after tab exercise before full-page capture', () => {
  const finalTabClickIndex = captureScript.indexOf('await tabs.first().click()');
  const resetIndex = captureScript.indexOf('window.scrollTo(0, 0)');
  const screenshotIndex = captureScript.indexOf('page.screenshot({');

  assert.notEqual(finalTabClickIndex, -1);
  assert.notEqual(resetIndex, -1);
  assert.ok(finalTabClickIndex < resetIndex);
  assert.ok(resetIndex < screenshotIndex);
  assert.match(captureScript, /window\.scrollX === 0 && window\.scrollY === 0/);
  assert.match(captureScript, /requestAnimationFrame\(\(\) => requestAnimationFrame\(resolve\)\)/);
  assert.match(captureScript, /layout\.scrollX !== 0 \|\| layout\.scrollY !== 0/);
  assert.match(captureScript, /scroll_origin: true/);
});

test('binds hosted provenance and labels local capture as non-authoritative', () => {
  assert.match(captureScript, /GITHUB_ACTIONS/);
  assert.match(captureScript, /GITHUB_REPOSITORY/);
  assert.match(captureScript, /GITHUB_RUN_ID/);
  assert.match(captureScript, /GITHUB_RUN_ATTEMPT/);
  assert.match(captureScript, /GITHUB_WORKFLOW_REF/);
  assert.match(captureScript, /GITHUB_WORKFLOW_SHA/);
  assert.match(captureScript, /LOCAL_NON_AUTHORITATIVE/);
  assert.match(captureScript, /VERIFIED_GITHUB_RUNTIME/);
  assert.match(captureScript, /rev-parse', 'HEAD\^\{tree\}'/);
  assert.match(captureScript, /tracked source changed \$\{phase\}/);
  assert.match(captureScript, /untracked or ignored source input exists \$\{phase\}/);
  assert.match(captureScript, /PLAYWRIGHT_BASE_URL is not accepted/);
  assert.doesNotMatch(captureScript, /requiredEnvironment\('PLAYWRIGHT_BASE_URL'\)/);
  assert.doesNotMatch(captureScript, /requiredEnvironment\('WORKFLOW_RUN_ID'\)/);
  assert.doesNotMatch(captureScript, /series-a-screenshot-proof\.yml/);
});

test('builds and serves immutable exact-source bytes inside the capture rail', () => {
  assert.match(captureScript, /mkdtemp\(path\.join\(tmpdir\(\), 'a11oy-series-a-proof-'\)\)/);
  assert.match(captureScript, /pnpm --filter @workspace\/a11oy exec vite build/);
  assert.match(captureScript, /pnpm .*does not match repository pin/);
  assert.match(captureScript, /!name\.startsWith\('VITE_'\)/);
  assert.match(captureScript, /lockfile_sha256/);
  assert.match(captureScript, /vite_version/);
  assert.match(captureScript, /manifest_sha256: sha256\(manifestBytes\)/);
  assert.match(captureScript, /index_html_sha256/);
  assert.match(captureScript, /createServer/);
  assert.match(captureScript, /server\.listen\(0, '127\.0\.0\.1'\)/);
  assert.match(captureScript, /X-SZL-Build-Manifest-SHA256/);
  assert.match(captureScript, /X-SZL-Source-Tree-SHA/);
  assert.match(captureScript, /X-SZL-Proof-Nonce/);
  assert.match(captureScript, /served document bytes did not match/);
  assert.match(captureScript, /foreign_loopback_allowed: false/);
  assert.match(captureScript, /serviceWorkers: 'block'/);
  assert.match(proofHelpers, /blockedNetworkRequests/);
  assert.match(proofHelpers, /webSocketRequests/);
  assert.match(proofHelpers, /routeWebSocket/);
  assert.doesNotMatch(proofHelpers, /connectToServer\(/);
  assert.match(captureScript, /publishCaptureDirectory/);
  assert.match(proofHelpers, /copyFile/);
  assert.match(captureScript, /await evidenceServer\?\.close\(\)/);
  assert.match(captureScript, /await rm\(build\.temporaryRoot/);
  assert.doesNotMatch(viteConfig, /A11OY_EVIDENCE_BUILD_DIR/);
  assert.match(captureScript, /--outDir/);
});

test('captures the complete self-contained page contract in the browser rail', () => {
  assert.match(captureScript, /EVIDENCE_STATES/);
  assert.match(captureScript, /expected 7 developer steps/);
  assert.match(captureScript, /expected 7 receipt fields/);
  assert.match(captureScript, /outbound Series A navigation/);
  assert.match(captureScript, /missing fragment targets/);
  assert.match(captureScript, /served_build_identity: true/);
  assert.match(captureScript, /document_digest_verified: true/);
  assert.match(captureScript, /every tab aria-controls target to exist/);
  assert.match(captureScript, /keyboard_navigation: true/);
  assert.match(captureScript, /foreign_network_requests: 0/);
});
