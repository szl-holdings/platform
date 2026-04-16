import { defineConfig, devices } from "@playwright/test";
import { execSync } from "child_process";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:80";

function resolveChromiumPath(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  }
  try {
    const p = execSync("which chromium 2>/dev/null", { encoding: "utf8" }).trim();
    if (p) return p;
  } catch {}
  return undefined;
}

const chromiumPath = resolveChromiumPath();

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "playwright-report/results.xml" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
      },
    },
  ],
  timeout: 60000,
});
