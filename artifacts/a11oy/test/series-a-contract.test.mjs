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

test('registers the Series A route without replacing the guided investor demo', () => {
  assert.match(app, /path=\{`\$\{base\}\/start`\} component=\{SeriesAView\}/);
  assert.match(app, /path=\{`\$\{base\}\/investor-demo`\} component=\{InvestorDemo\}/);
  assert.match(app, /import\('\.\/pages\/InvestorDemo'\)/);
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

test('links every solution to an existing registered source route', () => {
  const hrefs = [...data.matchAll(/^\s{4}demoHref: '([^']+)'/gm)].map((match) => match[1]);
  assert.equal(hrefs.length, solutionIds.length);
  for (const href of hrefs) {
    assert.match(app, new RegExp(`\\$\\{base\\}${href.replaceAll('/', '\\/')}`));
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

test('binds capture metadata to the checked-out tree and actual workflow', () => {
  assert.match(captureScript, /GITHUB_WORKFLOW_REF/);
  assert.match(captureScript, /rev-parse', 'HEAD\^\{tree\}'/);
  assert.match(captureScript, /tracked source changed before capture/);
  assert.match(captureScript, /PLAYWRIGHT_BASE_URL must be an uncredentialed HTTP loopback URL/);
  assert.doesNotMatch(captureScript, /series-a-screenshot-proof\.yml/);
});
