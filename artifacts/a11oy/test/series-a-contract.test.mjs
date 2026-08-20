import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const page = readFileSync(new URL('../src/pages/SeriesAView.tsx', import.meta.url), 'utf8');
const data = readFileSync(new URL('../src/data/seriesASolutions.ts', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../src/components/layout.tsx', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const viteConfig = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
const omniaProvider = readFileSync(
  new URL('../../../packages/omnia-shell/src/OmniaShellProvider.tsx', import.meta.url),
  'utf8',
);
const fabricTypes = readFileSync(
  new URL('../../../lib/a11oy-fabric/src/types.ts', import.meta.url),
  'utf8',
);
const fabricSchema = readFileSync(
  new URL('../../../lib/a11oy-fabric/src/schema.ts', import.meta.url),
  'utf8',
);
const workcellFixtures = readFileSync(
  new URL('../../../lib/a11oy-fabric/src/seed/workcells.ts', import.meta.url),
  'utf8',
);
const workcellsPage = readFileSync(new URL('../src/pages/Workcells.tsx', import.meta.url), 'utf8');
const replayIndex = readFileSync(
  new URL('../src/pages/WorkcellReplay.tsx', import.meta.url),
  'utf8',
);
const workcellDetail = readFileSync(
  new URL('../src/pages/WorkcellDetail.tsx', import.meta.url),
  'utf8',
);
const workcellReplayDetail = readFileSync(
  new URL('../src/pages/WorkcellReplayDetail.tsx', import.meta.url),
  'utf8',
);
const replayDetail = readFileSync(
  new URL('../src/pages/SovereignReplayDetail.tsx', import.meta.url),
  'utf8',
);
const workcellProjection = readFileSync(
  new URL('../src/data/workcellProjection.ts', import.meta.url),
  'utf8',
);
const demo = readFileSync(new URL('../src/pages/Demo.tsx', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../src/components/ui.tsx', import.meta.url), 'utf8');
const sovereignReplay = readFileSync(
  new URL('../src/pages/SovereignReplayDetail.tsx', import.meta.url),
  'utf8',
);
const captureScript = readFileSync(
  new URL('../../../scripts/capture-proof-screenshots.mjs', import.meta.url),
  'utf8',
);
const screenshotTargets = JSON.parse(
  readFileSync(new URL('../../../scripts/screenshot-targets.json', import.meta.url), 'utf8'),
);
const rootPackage = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'),
);
const screenshotRefresh = readFileSync(
  new URL('../../../scripts/screenshots/refresh.sh', import.meta.url),
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
  assert.match(page, /Schema and resolvers exist in packages\/szl-graphql/);
  assert.match(page, /no mounted authenticated \/api\/graphql or \/api\/graphql\/ws route/);
  assert.doesNotMatch(page, /production[- ]ready|SOC 2 certified|enterprise customers|proven ROI/i);
});

test('registers the canonical and backward-compatible investor routes', () => {
  assert.match(app, /path=\{`\$\{base\}\/start`\} component=\{SeriesAView\}/);
  assert.match(app, /path=\{`\$\{base\}\/investor-demo`\} component=\{SeriesAView\}/);
  assert.match(layout, /href=\{b\('\/start'\)\}/);
  assert.match(layout, />\s*Series A view\s*</);
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

test('keeps the deterministic walkthrough inside the truth-qualified surface', () => {
  assert.doesNotMatch(data, /demoHref/);
  assert.doesNotMatch(page, /route\(solution\.demoHref\)/);
  assert.match(page, /Deterministic fixture walkthrough/);
  assert.match(page, /No external mutation ran and no deployed receipt was produced/);
  assert.match(page, /href="#proof-boundary"/);
  assert.match(page, /href="#governance-boundary"/);
  for (const unsafeRoute of [
    '/demo',
    '/proof',
    '/governance',
    '/cyber-resilience',
    '/counterfactuals',
    '/approval-queue',
    '/fabric/verticals',
    '/right-to-audit',
  ]) {
    assert.doesNotMatch(page, new RegExp(`route\\('${unsafeRoute.replaceAll('/', '\\/')}'\\)`));
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

test('provides the complete architecture-to-verification developer path', () => {
  for (const step of [
    '01 · ARCHITECTURE',
    '02 · APIs',
    '03 · WORKCELLS',
    '04 · GOVERNANCE',
    '05 · RECEIPTS',
    '06 · LOCAL RUN',
    '07 · VERIFICATION',
  ]) {
    assert.match(page, new RegExp(step));
  }
  assert.match(page, /WORKCELL_DEMO_SOURCE/);
  assert.match(page, /pnpm --filter @workspace\/a11oy test/);
});

test('separates deterministic Workcell workflow status from evidence state', () => {
  for (const state of ['REAL', 'DEMO', 'UNAVAILABLE', 'DEGRADED', 'BLOCKED', 'ROADMAP']) {
    assert.match(fabricTypes, new RegExp(`'${state}'`));
  }
  assert.match(fabricSchema, /evidenceState: OperationalEvidenceState/);
  assert.match(fabricSchema, /evidenceReason: string/);
  assert.match(workcellFixtures, /WORKCELL_DEMO_SOURCE/);
  assert.match(workcellFixtures, /state: 'DEMO'/);
  assert.match(workcellFixtures, /SEED_WORKCELL_OBSERVED_AT = '2026-08-11T00:00:00\.000Z'/);
  assert.doesNotMatch(workcellFixtures, /new Date\(|Date\.now\(|Math\.random\(/);
  assert.match(workcellsPage, /WORKCELL_DEMO_SOURCE/);
  assert.match(workcellsPage, /status="DEMO"/);
});

test('does not fabricate completed replay outcomes or wall-clock evidence', () => {
  for (const source of [replayIndex, replayDetail]) {
    assert.doesNotMatch(source, /Date\.now\(|Math\.random\(/);
    assert.match(source, /projectWorkcellState/);
    assert.match(source, /status="DEMO"/);
  }
  assert.match(workcellProjection, /actionStatus === 'pending_approval'/);
  assert.match(workcellProjection, /actionStatus === 'executing'/);
  assert.match(workcellProjection, /workcell\.status === 'completed'/);
  assert.match(workcellProjection, /showProofShape: outcome === 'success'/);
});

test('qualifies completed Workcell proof labels as fixture-source fields', () => {
  const fixtureProofSection = workcellDetail.match(
    /{\/\* PCE Contract \*\/}[\s\S]*?{\/\* Replay link \*\/}/,
  )?.[0];

  assert.ok(fixtureProofSection);
  assert.match(fixtureProofSection, />\s*Fixture isVerified field\s*</);
  assert.match(
    fixtureProofSection,
    /\? 'Fixture verification status: passed'\s*: 'Fixture verification status: failed'/,
  );
  assert.match(fixtureProofSection, /<SectionTitle>Fixture Proof Packet shape<\/SectionTitle>/);
  assert.doesNotMatch(fixtureProofSection, />\s*Verified\s*</);
  assert.doesNotMatch(fixtureProofSection, /Contract verified/);
  assert.doesNotMatch(fixtureProofSection, /<SectionTitle>Proof Packet<\/SectionTitle>/);
});

test('limits non-dry-run proof capture to reviewed safe groups', () => {
  assert.match(captureScript, /SAFE_CAPTURE_GROUPS = new Set\(\['p0-series-a'\]\)/);
  assert.match(captureScript, /!DRY_RUN && !SAFE_CAPTURE_GROUPS\.has\(FILTER\)/);
  assert.match(captureScript, /: Array\.isArray\(t\.groups\) && t\.groups\.includes\(FILTER\)/);
  assert.doesNotMatch(captureScript, /--filter a11oy/);
});

test('keeps local QA output separate from Replit proof candidates', () => {
  assert.match(captureScript, /CAPTURE_MODES = new Set\(\['local-qa', 'replit-proof'\]\)/);
  assert.match(captureScript, /NON_QUALIFYING_LOCAL_QA/);
  assert.match(captureScript, /REPLIT_WORKSPACE_CAPTURE_PENDING_REVIEW/);
  assert.match(captureScript, /proofLevel: null/);
  assert.match(captureScript, /LOCAL_QA_OUTPUT_ROOT/);
  assert.match(captureScript, /isStrictDescendant\(LOCAL_QA_OUTPUT_ROOT, resolvedOutput\)/);
  assert.match(captureScript, /replit-proof requires non-empty REPL_ID and REPLIT_DEV_DOMAIN/);
  assert.match(captureScript, /writeManifestFiles\(manifest, OUTPUT_DIR\)/);
  assert.doesNotMatch(captureScript, /Source-local target cannot be captured/);

  const dryRunStart = captureScript.indexOf('if (DRY_RUN) {');
  const ensureOutput = captureScript.indexOf('ensureDir(OUTPUT_DIR);');
  assert.ok(dryRunStart >= 0 && ensureOutput > dryRunStart);
  const dryRunBlock = captureScript.slice(dryRunStart, ensureOutput);
  assert.match(dryRunBlock, /console\.log\(JSON\.stringify\(manifest, null, 2\)\)/);
  assert.doesNotMatch(dryRunBlock, /writeManifestFiles/);

  const p0Targets = screenshotTargets.filter((target) => target.groups?.includes('p0-series-a'));
  assert.equal(p0Targets.length, 7);
  assert.ok(
    p0Targets.every(
      (target) =>
        target.recommendedUsage?.length === 1 && target.recommendedUsage[0] === 'local source QA',
    ),
  );
  assert.doesNotMatch(JSON.stringify(p0Targets), /local source proof/);
  assert.match(rootPackage.scripts['screenshots:proof'], /--filter=p0-series-a/);
  assert.match(screenshotRefresh, /set -euo pipefail/);
  assert.match(screenshotRefresh, /capture-proof-screenshots\.mjs --filter=p0-series-a/);
});

test('preserves blocked Workcell state in the deterministic demo trace', () => {
  assert.match(demo, /outcome === 'blocked'[\s\S]*?\? 'blocked'/);
  assert.match(ui, /status === 'blocked'/);
});

test('derives replay dimension counts and requires DEMO proof markers', () => {
  assert.match(sovereignReplay, /wc\.mirrorEvalResult\.dimensions\.length/);
  assert.doesNotMatch(sovereignReplay, /14 dimensions scored/);
  for (const source of [demo, workcellsPage, replayIndex, replayDetail, sovereignReplay]) {
    assert.match(source, /data-proof-state="DEMO"/);
  }
});

test('mounts one GraphQL provider while retaining fail-closed client state', () => {
  assert.doesNotMatch(main, /<GraphQLProvider>/);
  assert.equal((app.match(/<GraphQLProvider>/g) ?? []).length, 1);
  assert.match(main, /networkState: 'UNAVAILABLE'/);
});

test('keeps compact proof controls and navigation targets at least 44px', () => {
  for (const [source, targetCount] of [
    [workcellsPage, 1],
    [replayIndex, 2],
    [workcellDetail, 4],
    [workcellReplayDetail, 5],
    [sovereignReplay, 7],
  ]) {
    assert.equal((source.match(/min-h-11 min-w-11/g) ?? []).length, targetCount);
  }

  for (const source of [workcellReplayDetail, sovereignReplay]) {
    assert.match(source, /\[2000, 1000, 600, 300\][\s\S]*?min-h-11 min-w-11/);
  }

  assert.equal(
    (workcellDetail.match(/min-h-11 min-w-11 inline-flex items-center/g) ?? []).length,
    4,
  );
  assert.equal(
    (workcellReplayDetail.match(/min-h-11 min-w-11 inline-flex items-center/g) ?? []).length,
    4,
  );
  assert.equal(
    (sovereignReplay.match(/min-h-11 min-w-11 inline-flex items-center/g) ?? []).length,
    6,
  );
});
