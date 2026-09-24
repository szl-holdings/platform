import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from '@playwright/test';
import { collectLayoutEvidence } from './screenshot-layout-helpers.mjs';

let browser;
before(async () => {
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
});

async function fixture(context, markup) {
  const page = await browser.newPage({ viewport: { width: 320, height: 600 } });
  context.after(() => page.close());
  await page.setContent(
    `<style>*{box-sizing:border-box}html,body{margin:0;width:100%;font:16px Arial}main{width:100%;padding:24px}</style>${markup}`,
  );
  return { page, evidence: await page.evaluate(collectLayoutEvidence) };
}

test('detects wide content inside a main with implicit horizontal auto overflow', async (context) => {
  const { page, evidence } = await fixture(
    context,
    '<main id="main" style="height:300px;overflow-y:auto"><p id="wide" style="width:420px">Timeline card that is clipped offscreen</p></main>',
  );
  assert.equal(
    await page.locator('main').evaluate((element) => getComputedStyle(element).overflowX),
    'auto',
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth === document.documentElement.clientWidth,
    ),
    true,
  );
  assert.ok(evidence.viewportOverflowingElements.some((item) => item.id === 'wide'));
  assert.ok(evidence.clippedElements.some((item) => item.clipped_by.id === 'main'));
  assert.ok(evidence.horizontallyOverflowingContainers.some((item) => item.id === 'main'));
});

test('passes genuinely wrapping content at 320 pixels', async (context) => {
  const { evidence } = await fixture(
    context,
    '<main style="height:300px;overflow-y:auto"><h1>Proof Ledger</h1><div style="display:flex;flex-wrap:wrap;gap:8px"><p style="overflow-wrap:anywhere;min-width:0">fixture-digest:01234567890123456789012345678901234567890123456789</p><button>View record</button></div></main>',
  );
  for (const findings of Object.values(evidence)) assert.deepEqual(findings, []);
});

test('measures text Range overrun even when element rectangles fit', async (context) => {
  const { evidence } = await fixture(
    context,
    '<main><div id="field" style="width:90px"><span id="token" style="display:block">unbrokenfixtureidentifier012345678901234567890</span></div></main>',
  );
  assert.ok(
    evidence.textOverflowingElements.some(
      (item) => item.id === 'token' && item.text_right > item.right,
    ),
  );
});

test('records clipping by hidden overflow', async (context) => {
  const { evidence } = await fixture(
    context,
    '<main><div id="clipper" style="width:100px;overflow:hidden"><p id="clipped" style="width:180px">Clipped proof packet content</p></div></main>',
  );
  assert.ok(
    evidence.clippedElements.some(
      (item) => item.id === 'clipped' && item.clipped_by.id === 'clipper',
    ),
  );
  assert.ok(evidence.horizontallyOverflowingContainers.some((item) => item.id === 'clipper'));
});

test('allows only explicitly named keyboard-accessible nested scroll regions', async (context) => {
  const { page, evidence } = await fixture(
    context,
    '<main style="overflow-y:auto"><section id="scroll-region" role="region" aria-label="Wide results table" tabindex="0" data-screenshot-horizontal-scroll="true" style="overflow-x:auto"><div style="width:600px"><p>Wide results table intentionally supports keyboard scrolling.</p></div></section></main>',
  );
  for (const findings of Object.values(evidence)) assert.deepEqual(findings, []);
  await page.locator('#scroll-region').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => document.getElementById('scroll-region').scrollLeft > 0);
  await page.locator('#scroll-region').evaluate((element) => element.removeAttribute('aria-label'));
  assert.ok(
    (await page.evaluate(collectLayoutEvidence)).horizontallyOverflowingContainers.length > 0,
  );
  await page.locator('#scroll-region').evaluate((element) => {
    element.setAttribute('aria-label', 'Wide results table');
    element.removeAttribute('tabindex');
  });
  assert.ok(
    (await page.evaluate(collectLayoutEvidence)).horizontallyOverflowingContainers.length > 0,
  );
});

test('main cannot use the scroll-region opt-out', async (context) => {
  const { evidence } = await fixture(
    context,
    '<main id="main" role="region" aria-label="Main" tabindex="0" data-screenshot-horizontal-scroll="true" style="overflow-x:auto"><p style="width:600px">Still broken main content</p></main>',
  );
  assert.ok(evidence.horizontallyOverflowingContainers.some((item) => item.id === 'main'));
});

test('body cannot use the scroll-region opt-out', async (context) => {
  const { page } = await fixture(context, '<p style="width:600px">Still broken body content</p>');
  await page.locator('body').evaluate((element) => {
    element.id = 'body';
    element.setAttribute('role', 'region');
    element.setAttribute('aria-label', 'Body');
    element.setAttribute('tabindex', '0');
    element.setAttribute('data-screenshot-horizontal-scroll', 'true');
    element.style.overflowX = 'auto';
  });
  const evidence = await page.evaluate(collectLayoutEvidence);
  assert.ok(evidence.horizontallyOverflowingContainers.some((item) => item.id === 'body'));
});

test('an explicit region cannot hide clipping by an outer container', async (context) => {
  const { evidence } = await fixture(
    context,
    '<main><div id="outer" style="width:160px;overflow:hidden"><section id="region" role="region" aria-label="Results" tabindex="0" data-screenshot-horizontal-scroll="true" style="width:220px;overflow-x:auto"><p style="width:600px">Wide results</p></section></div></main>',
  );
  assert.ok(evidence.clippedElements.some((item) => item.clipped_by.id === 'outer'));
  assert.ok(evidence.horizontallyOverflowingContainers.some((item) => item.id === 'outer'));
});

test('excludes truly visually clipped accessible labels by geometry, not class name', async (context) => {
  const { page, evidence } = await fixture(
    context,
    '<main><label for="filter" style="position:absolute;width:1px;height:1px;overflow:hidden;white-space:nowrap;clip:rect(0,0,0,0)">Search all Workcells</label><label for="filter" style="position:absolute;width:1px;height:1px;overflow:hidden;white-space:nowrap;clip-path:inset(50%)">Filter the Workcell registry</label><input id="filter" style="width:100%"></main>',
  );
  for (const findings of Object.values(evidence)) assert.deepEqual(findings, []);
  assert.equal(
    await page
      .getByRole('textbox', { name: 'Search all Workcells Filter the Workcell registry' })
      .count(),
    1,
  );
  await page
    .locator('label')
    .first()
    .evaluate((element) => {
      element.className = 'sr-only';
      element.style.clip = 'auto';
    });
  const visible = await page.evaluate(collectLayoutEvidence);
  assert.ok(visible.horizontallyOverflowingContainers.length > 0);
  assert.ok(visible.textOverflowingElements.length > 0);
});
