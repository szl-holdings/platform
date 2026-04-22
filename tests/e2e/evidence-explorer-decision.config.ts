/**
 * Standalone Playwright config used to verify
 * tests/e2e/evidence-explorer-decision.spec.ts in isolation.
 *
 * It boots the Command web app via Vite as a managed `webServer` so the spec
 * can be exercised end-to-end without depending on the global workflow set or
 * on a healthy api-server (the spec mocks every `/api/evidence-graph/**`
 * endpoint via Playwright route interception).
 *
 * Usage (manual / CI):
 *   pnpm exec playwright test --config tests/e2e/evidence-explorer-decision.config.ts
 */

import { execSync } from 'node:child_process';
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.EVIDENCE_E2E_PORT) || 5050;

function resolveChromiumPath(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  try {
    const p = execSync('which chromium 2>/dev/null', { encoding: 'utf8' }).trim();
    if (p) return p;
  } catch {
    /* ignore */
  }
  return undefined;
}

export default defineConfig({
  testDir: '.',
  testMatch: /evidence-explorer-decision\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(resolveChromiumPath() ? { launchOptions: { executablePath: resolveChromiumPath() } } : {}),
      },
    },
  ],
  webServer: {
    command: `node_modules/.bin/vite --config vite.config.ts --host 0.0.0.0 --port ${PORT}`,
    cwd: './artifacts/command',
    url: `http://localhost:${PORT}/command/`,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
