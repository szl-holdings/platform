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
const failures = [];
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

      let responseStatus = null;
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
        responseStatus = response?.status() ?? null;
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
          const overflowingElements = [...document.querySelectorAll("body *")]
            .map(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return {
                tag: element.tagName.toLowerCase(),
                id: element.id || null,
                className: typeof element.className === "string" ? element.className.slice(0, 240) : null,
                left: Math.round(rect.left * 100) / 100,
                right: Math.round(rect.right * 100) / 100,
                width: Math.round(rect.width * 100) / 100,
                overflowX: style.overflowX,
                position: style.position,
                text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 160),
              };
            })
            .filter(item => item.width > 0 && (item.left < -1 || item.right > root.clientWidth + 1))
            .sort((a, b) => Math.max(b.right - root.clientWidth, -b.left) - Math.max(a.right - root.clientWidth, -a.left))
            .slice(0, 30);
          return {
            title: document.title,
            readyState: document.readyState,
            clientWidth: root.clientWidth,
            scrollWidth: root.scrollWidth,
            horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
            overflowingElements,
            mainCount: document.querySelectorAll("main").length,
            h1Count: document.querySelectorAll("h1").length,
            blockedPlaceholder: ["LOREM", "PLACEHOLDER", "YOUR TEXT HERE"].find(token => text.includes(token)) || null,
            busy,
          };
        });

        const date = new Date().toISOString().slice(0, 10);
        const filename = `${surface}-${date}-${width}x${height}.png`;
        const filePath = path.join(outputDir, filename);
        await page.screenshot({ path: filePath, fullPage: true });
        const bytes = await readFile(filePath);
        const record = {
          filename,
          route,
          url,
          surface,
          response_status: responseStatus,
          capture_date: date,
          captured_at: new Date().toISOString(),
          captured_by: "GitHub Actions / PixelProof",
          capture_environment: process.env.CAPTURE_ENVIRONMENT || "github-actions",
          source_revision: sourceRevision,
          workflow_run_or_command: runIdentity,
          viewport: { width, height },
          artifact_sha256: createHash("sha256").update(bytes).digest("hex"),
          console_errors: consoleErrors,
          state,
        };
        evidence.push(record);

        const recordFailures = [];
        if (state.readyState !== "complete") recordFailures.push("document did not reach complete");
        if (state.horizontalOverflow) recordFailures.push(`page-level horizontal overflow: ${state.scrollWidth}px > ${state.clientWidth}px`);
        if (state.mainCount !== 1) recordFailures.push(`expected one main landmark, observed ${state.mainCount}`);
        if (state.h1Count < 1) recordFailures.push("no H1 rendered");
        if (state.blockedPlaceholder) recordFailures.push(`blocked placeholder ${state.blockedPlaceholder}`);
        if (state.busy > 0) recordFailures.push(`${state.busy} visible aria-busy regions remained`);
        if (consoleErrors.length) recordFailures.push(`console errors: ${consoleErrors.join(" | ")}`);
        if (recordFailures.length) {
          failures.push({ surface, route, viewport: { width, height }, failures: recordFailures, overflowing_elements: state.overflowingElements });
        }
      } catch (error) {
        failures.push({
          surface,
          route,
          viewport: { width, height },
          failures: [String(error)],
          response_status: responseStatus,
        });
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

const report = {
  schema: "szl.screenshot-proof/v1",
  state: failures.length ? "FAILED" : "VERIFIED",
  source_revision: sourceRevision,
  evidence,
  failures,
};
await writeFile(path.join(outputDir, "metadata.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ state: report.state, captures: evidence.length, failures: failures.length, source_revision: sourceRevision }, null, 2));
if (failures.length) process.exitCode = 1;
