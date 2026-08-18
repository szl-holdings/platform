import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const planPath = process.env.SCREENSHOT_PLAN || "audit/screenshot-capture-plan.json";
const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:4110";
const sourceRevision = process.env.SOURCE_REVISION || process.env.GITHUB_SHA || "";
const runIdentity = process.env.RUN_IDENTITY || "local-command";
const outputDir = process.env.SCREENSHOT_OUTPUT_DIR || "screenshot-proof";

if (!/^[0-9a-f]{40}$/.test(sourceRevision)) {
  throw new Error(`SOURCE_REVISION must be an exact 40-character lowercase SHA, got ${sourceRevision}`);
}

const plan = JSON.parse(await readFile(planPath, "utf8"));
if (!Array.isArray(plan.targets) || plan.targets.length === 0) {
  throw new Error("capture plan must contain a non-empty targets array");
}
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const evidence = [];
try {
  for (const target of plan.targets) {
    const surface = String(target.surface || "surface").replace(/[^a-zA-Z0-9._-]+/g, "-");
    const route = String(target.route || "/");
    const viewports = Array.isArray(target.viewports) && target.viewports.length
      ? target.viewports
      : [{ width: 390, height: 844 }, { width: 1440, height: 1100 }];

    for (const viewport of viewports) {
      const width = Number(viewport.width);
      const height = Number(viewport.height);
      if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 568) {
        throw new Error(`invalid viewport for ${surface}: ${JSON.stringify(viewport)}`);
      }
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      const url = new URL(route, baseUrl).toString();
      const consoleErrors = [];
      page.on("console", message => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      if (!response || response.status() >= 400) {
        throw new Error(`${surface} returned ${response?.status() ?? "no response"} at ${url}`);
      }
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      const state = await page.evaluate(() => {
        const root = document.documentElement;
        const text = (document.body?.innerText || "").toUpperCase();
        const busy = [...document.querySelectorAll('[aria-busy="true"]')].filter(element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
        }).length;
        return {
          title: document.title,
          readyState: document.readyState,
          horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
          mainCount: document.querySelectorAll("main").length,
          h1Count: document.querySelectorAll("h1").length,
          blockedPlaceholder: ["LOREM", "PLACEHOLDER", "YOUR TEXT HERE"].find(token => text.includes(token)) || null,
          busy,
        };
      });
      if (state.readyState !== "complete") throw new Error(`${surface} did not reach document complete`);
      if (state.horizontalOverflow) throw new Error(`${surface} has page-level horizontal overflow at ${width}x${height}`);
      if (state.mainCount !== 1) throw new Error(`${surface} must render exactly one main landmark`);
      if (state.h1Count < 1) throw new Error(`${surface} must render at least one H1`);
      if (state.blockedPlaceholder) throw new Error(`${surface} contains blocked placeholder ${state.blockedPlaceholder}`);
      if (state.busy > 0) throw new Error(`${surface} retained ${state.busy} visible aria-busy regions`);
      if (consoleErrors.length) throw new Error(`${surface} emitted console errors: ${consoleErrors.join(" | ")}`);

      const date = new Date().toISOString().slice(0, 10);
      const filename = `${surface}-${date}-${width}x${height}.png`;
      const filePath = path.join(outputDir, filename);
      await page.screenshot({ path: filePath, fullPage: true });
      const bytes = await readFile(filePath);
      evidence.push({
        filename,
        route,
        url,
        surface,
        capture_date: date,
        captured_at: new Date().toISOString(),
        captured_by: "GitHub Actions / PixelProof",
        capture_environment: process.env.CAPTURE_ENVIRONMENT || "github-actions",
        source_revision: sourceRevision,
        workflow_run_or_command: runIdentity,
        viewport: { width, height },
        artifact_sha256: createHash("sha256").update(bytes).digest("hex"),
        state,
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(path.join(outputDir, "metadata.json"), JSON.stringify({ schema: "szl.screenshot-proof/v1", source_revision: sourceRevision, evidence }, null, 2) + "\n");
console.log(JSON.stringify({ state: "VERIFIED", captures: evidence.length, source_revision: sourceRevision }, null, 2));
