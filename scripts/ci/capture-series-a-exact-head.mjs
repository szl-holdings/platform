#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";

const startedAt = new Date();
const candidateSha = String(process.env.SZL_CANDIDATE_SHA || "").trim();
const sourcePr = String(process.env.SZL_SOURCE_PR || "").trim();
const route = String(process.env.SZL_ROUTE || "/a11oy/").trim();
const startCommand = String(process.env.SZL_START_COMMAND || "pnpm run dev").trim();
const evidenceDir = path.resolve("docs/assets/screenshots/current");
const evidencePath = path.resolve("audit/series-a-exact-head-capture.json");
const catalogPath = path.resolve("audit/screenshot-catalog.md");
const timeoutMs = 180_000;

if (!/^[0-9a-f]{40}$/.test(candidateSha)) {
  throw new Error("SZL_CANDIDATE_SHA must be a lowercase 40-character Git SHA");
}
if (!route.startsWith("/") || route.includes("..")) {
  throw new Error("SZL_ROUTE must be an absolute safe path");
}

const viewports = [
  { name: "phone-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 1100 },
  { name: "fullhd-1920", width: 1920, height: 1080 },
  { name: "ultrawide-2560", width: 2560, height: 1440 },
];
const candidatePorts = [4110];
const deviceScaleFactor = 1;
const pnpmVersion = execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim();
const transientPattern = /^(CHECKING|CONNECTING|LOADING|OBSERVING)$/i;
const captureDate = startedAt.toISOString().slice(0, 10);
const routeSlug = route.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "root";

await mkdir(evidenceDir, { recursive: true });
for (const viewport of viewports) {
  await rm(path.join(evidenceDir, `${captureDate}-${routeSlug}-${viewport.name}.png`), { force: true });
}

const child = spawn(startCommand, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    CI: "1",
    HOST: "127.0.0.1",
    PORT: process.env.PORT || "5000",
    BROWSER: "none",
  },
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
  detached: process.platform !== "win32",
});
let serverLog = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    serverLog += chunk;
    if (serverLog.length > 256_000) serverLog = serverLog.slice(-256_000);
    process.stdout.write(chunk);
  });
}

function stopServer() {
  if (child.exitCode !== null) return;
  try {
    if (process.platform === "win32") child.kill("SIGTERM");
    else process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}
process.on("exit", stopServer);
process.on("SIGINT", () => { stopServer(); process.exit(130); });
process.on("SIGTERM", () => { stopServer(); process.exit(143); });

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2_000);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: "follow" });
    return response.status < 500 ? response : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

let baseUrl = "";
const deadline = Date.now() + timeoutMs;
while (Date.now() < deadline && !baseUrl) {
  if (child.exitCode !== null) {
    throw new Error(`application command exited before readiness: ${child.exitCode}\n${serverLog.slice(-8000)}`);
  }
  for (const port of candidatePorts) {
    const candidate = `http://127.0.0.1:${port}${route}`;
    const response = await probe(candidate);
    if (response) {
      baseUrl = `http://127.0.0.1:${port}`;
      break;
    }
  }
  if (!baseUrl) await new Promise((resolve) => setTimeout(resolve, 1_500));
}
if (!baseUrl) {
  throw new Error(`application route did not become ready within ${timeoutMs}ms\n${serverLog.slice(-8000)}`);
}

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));

    const targetUrl = `${baseUrl}${route}`;
    const response = await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (!response || response.status() >= 400) {
      throw new Error(`${viewport.name}: route returned ${response?.status() ?? "no response"}`);
    }
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
    await page.waitForTimeout(8_000);

    const metrics = await page.evaluate((patternSource) => {
      const pattern = new RegExp(patternSource, "i");
      const statusNodes = Array.from(document.querySelectorAll('[data-state], [data-status], [role="status"], .status'));
      const transient = statusNodes
        .filter((node) => {
          const style = getComputedStyle(node);
          const visible = style.visibility !== "hidden" && style.display !== "none" && node.getBoundingClientRect().width > 0;
          return visible && pattern.test((node.textContent || "").trim());
        })
        .map((node) => (node.textContent || "").trim());
      return {
        title: document.title,
        finalUrl: location.href,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        transient,
        notFound:
          document.body.innerText.includes("404") &&
          document.body.innerText.includes("Page not found"),
      };
    }, transientPattern.source);

    if (metrics.scrollWidth > metrics.clientWidth + 1) {
      throw new Error(`${viewport.name}: horizontal overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`);
    }
    if (metrics.transient.length) {
      throw new Error(`${viewport.name}: nonterminal public state remained visible: ${metrics.transient.join(", ")}`);
    }
    if (metrics.notFound) {
      throw new Error(`${viewport.name}: application rendered the not-found surface for ${route}`);
    }
    if (consoleErrors.length || pageErrors.length) {
      throw new Error(`${viewport.name}: browser errors: ${JSON.stringify({ consoleErrors, pageErrors })}`);
    }

    const fileName = `${captureDate}-${routeSlug}-${viewport.name}.png`;
    const filePath = path.join(evidenceDir, fileName);
    await page.screenshot({ path: filePath, fullPage: true, animations: "disabled" });
    const bytes = await readFile(filePath);
    const fileStat = await stat(filePath);
    if (fileStat.mtimeMs < startedAt.getTime()) {
      throw new Error(`${viewport.name}: screenshot predates this capture run`);
    }
    results.push({
      name: viewport.name,
      width: viewport.width,
      height: viewport.height,
      device_scale_factor: deviceScaleFactor,
      route,
      final_url: metrics.finalUrl,
      http_status: response.status(),
      title: metrics.title,
      console_errors: consoleErrors,
      page_errors: pageErrors,
      horizontal_overflow: false,
      screenshot: path.relative(process.cwd(), filePath).replaceAll(path.sep, "/"),
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
    await context.close();
  }
} finally {
  await browser.close();
  stopServer();
}

const evidence = {
  schema: "szl.exact-head-screenshot-evidence/v1",
  state: "VERIFIED",
  repository: process.env.GITHUB_REPOSITORY || "szl-holdings/platform",
  source_pr: sourcePr || null,
  source_sha: candidateSha,
  workflow_run_id: process.env.GITHUB_RUN_ID || null,
  workflow_run_attempt: process.env.GITHUB_RUN_ATTEMPT || null,
  runner_image: process.env.ImageOS || process.env.RUNNER_OS || os.platform(),
  runner_arch: process.env.RUNNER_ARCH || os.arch(),
  node_version: process.version,
  pnpm_version: pnpmVersion,
  playwright_version: (await import("@playwright/test/package.json", { with: { type: "json" } })).default.version,
  browser_version: await chromium.launch({ headless: true }).then(async (instance) => {
    const version = instance.version();
    await instance.close();
    return version;
  }),
  start_command: startCommand,
  base_url: baseUrl,
  route,
  captured_at: new Date().toISOString(),
  results,
  claim_boundary: "Source-presentation evidence only; not deployment, traffic, uptime, business, or authorization evidence.",
};
await mkdir(path.dirname(evidencePath), { recursive: true });
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

let catalog = "";
try { catalog = await readFile(catalogPath, "utf8"); } catch { catalog = "# Screenshot catalog\n"; }
const startMarker = "<!-- szl-exact-head-capture:start -->";
const endMarker = "<!-- szl-exact-head-capture:end -->";
const rows = results.map((item) => `| ${item.name} | ${item.width} x ${item.height} | \`${item.screenshot}\` | \`${item.sha256}\` |`).join("\n");
const block = `${startMarker}\n\n## Exact-head Series A capture\n\n- Source SHA: \`${candidateSha}\`\n- Source PR: \`${sourcePr || "N/A"}\`\n- Workflow run: \`${process.env.GITHUB_RUN_ID || "N/A"}\` attempt \`${process.env.GITHUB_RUN_ATTEMPT || "N/A"}\`\n- Runner: \`${evidence.runner_image}\` / \`${evidence.runner_arch}\`\n- Node: \`${evidence.node_version}\`\n- Playwright: \`${evidence.playwright_version}\`\n- Chromium: \`${evidence.browser_version}\`\n- Route: \`${baseUrl}${route}\`\n- Captured: \`${evidence.captured_at}\`\n- Evidence: \`audit/series-a-exact-head-capture.json\`\n\n| Viewport | Size | Screenshot | SHA-256 |\n| --- | ---: | --- | --- |\n${rows}\n\n${endMarker}`;
const markerPattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "m");
const updatedCatalog = markerPattern.test(catalog)
  ? catalog.replace(markerPattern, block)
  : `${catalog.trimEnd()}\n\n${block}\n`;
await writeFile(catalogPath, updatedCatalog, "utf8");

console.log(JSON.stringify(evidence, null, 2));
