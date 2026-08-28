import { chromium } from '../node_modules/.pnpm/playwright@1.60.0/node_modules/playwright/index.mjs';
import { mkdir } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://127.0.0.1:9090/a11oy/atelier';
const screenshot = process.argv[3] ?? 'audit/screenshots/a11oy-atelier-live-20260826.png';
await mkdir('audit/screenshots', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 960 } });
const consoleErrors = [];
const pageErrors = [];
const responseErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('response', (response) => {
  if (response.status() >= 400)
    responseErrors.push({ status: response.status(), url: response.url() });
});

try {
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.getByRole('heading', { name: 'A11oy Atelier', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Ask Atelier' }).waitFor();
  const bodyText = (await page.locator('body').innerText()).trim();
  const overlay = await page
    .locator('[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay')
    .count();
  const health = await page.locator('body').getByText('xAI Grok Build CLI').count();
  await page.screenshot({ path: screenshot, fullPage: true });

  const result = {
    url: page.url(),
    status: response?.status() ?? null,
    title: await page.title(),
    hasContent: bodyText.length > 0,
    contentLength: bodyText.length,
    overlayCount: overlay,
    grokHealthLabelCount: health,
    consoleErrors,
    pageErrors,
    responseErrors,
    screenshot,
  };
  console.log(JSON.stringify(result, null, 2));
  if (
    result.status !== 200 ||
    !result.hasContent ||
    overlay > 0 ||
    health === 0 ||
    consoleErrors.length > 0 ||
    pageErrors.length > 0 ||
    responseErrors.length > 0
  ) {
    process.exitCode = 1;
  }
} finally {
  await browser.close();
}
