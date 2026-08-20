import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const execFile = promisify(execFileCallback);
const planPath = process.env.SCREENSHOT_PLAN || "audit/screenshot-capture-plan.json";
const baseUrl = process.env.SCREENSHOT_BASE_URL || "http://127.0.0.1:4110";
const sourceRevision = process.env.SOURCE_REVISION || process.env.GITHUB_SHA || "";
const runIdentity = process.env.RUN_IDENTITY || "";
const captureEnvironment = process.env.CAPTURE_ENVIRONMENT || "";
const capturedBy = process.env.CAPTURED_BY || "";
const sourceIdentityUrl = process.env.SOURCE_IDENTITY_URL || "";
const outputDir = process.env.SCREENSHOT_OUTPUT_DIR || "screenshot-proof";
const allowedEnvironments = new Set([
  "github-actions",
  "protected-preview",
  "codespace",
  "cursor-cloud",
  "local-exact-head",
  "other-admitted",
]);
const checkoutBoundEnvironments = new Set([
  "github-actions",
  "codespace",
  "cursor-cloud",
  "local-exact-head",
]);

if (!/^[0-9a-f]{40}$/.test(sourceRevision)) {
  throw new Error(
    `SOURCE_REVISION must be an exact 40-character lowercase SHA, got ${sourceRevision}`,
  );
}
if (!runIdentity.trim() || runIdentity.length > 1_024 || runIdentity === "local-command") {
  throw new Error("RUN_IDENTITY must record an exact workflow run or command");
}
if (!allowedEnvironments.has(captureEnvironment)) {
  throw new Error(
    `CAPTURE_ENVIRONMENT must be one of ${[...allowedEnvironments].join(", ")}`,
  );
}
if (!capturedBy.trim() || capturedBy.length > 200) {
  throw new Error("CAPTURED_BY must name the actual capturing agent or contributor");
}

const parsedBaseUrl = new URL(baseUrl);
if (!["http:", "https:"].includes(parsedBaseUrl.protocol)) {
  throw new Error("SCREENSHOT_BASE_URL must use http or https");
}
if (parsedBaseUrl.username || parsedBaseUrl.password || parsedBaseUrl.search || parsedBaseUrl.hash) {
  throw new Error("SCREENSHOT_BASE_URL cannot contain credentials, query parameters, or a fragment");
}

const localHosts = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);
const localBase = localHosts.has(parsedBaseUrl.hostname);
let sourceIdentityEvidence = null;

if (checkoutBoundEnvironments.has(captureEnvironment)) {
  const { stdout } = await execFile("git", ["rev-parse", "HEAD"], {
    encoding: "utf8",
    timeout: 8_000,
    maxBuffer: 64 * 1_024,
  });
  const checkoutRevision = stdout.trim();
  if (checkoutRevision !== sourceRevision) {
    throw new Error(
      `checked-out revision ${checkoutRevision} does not match SOURCE_REVISION ${sourceRevision}`,
    );
  }
  sourceIdentityEvidence = {
    kind: "git-checkout",
    revision: checkoutRevision,
  };
}

if (!localBase) {
  if (!sourceIdentityUrl.trim()) {
    throw new Error(
      "SOURCE_IDENTITY_URL is required when SCREENSHOT_BASE_URL is not loopback-local",
    );
  }
  const parsedIdentityUrl = new URL(sourceIdentityUrl);
  if (parsedIdentityUrl.protocol !== "https:") {
    throw new Error("SOURCE_IDENTITY_URL must use https");
  }
  if (
    parsedIdentityUrl.username ||
    parsedIdentityUrl.password ||
    parsedIdentityUrl.search ||
    parsedIdentityUrl.hash
  ) {
    throw new Error(
      "SOURCE_IDENTITY_URL cannot contain credentials, query parameters, or a fragment",
    );
  }
  if (parsedIdentityUrl.origin !== parsedBaseUrl.origin) {
    throw new Error("SOURCE_IDENTITY_URL must share the captured application's origin");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let identityResponse;
  try {
    identityResponse = await fetch(parsedIdentityUrl, {
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      headers: { accept: "application/json, text/plain;q=0.5" },
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!identityResponse.ok) {
    throw new Error(`source identity endpoint returned HTTP ${identityResponse.status}`);
  }
  const identityBytes = Buffer.from(await identityResponse.arrayBuffer());
  if (identityBytes.length === 0 || identityBytes.length > 65_536) {
    throw new Error("source identity response must be between 1 and 65536 bytes");
  }
  const identityText = identityBytes.toString("utf8");
  const observedRevisions = identityText.match(/[0-9a-f]{40}/g) || [];
  if (!observedRevisions.includes(sourceRevision)) {
    throw new Error("source identity response does not contain the exact SOURCE_REVISION");
  }
  sourceIdentityEvidence = {
    kind: "served-identity",
    url: parsedIdentityUrl.toString(),
    response_sha256: createHash("sha256").update(identityBytes).digest("hex"),
    revision: sourceRevision,
  };
}

if (!sourceIdentityEvidence) {
  throw new Error("no exact source-identity evidence was established");
}

const normalizedOutputDir = path.normalize(outputDir);
if (
  path.isAbsolute(normalizedOutputDir) ||
  normalizedOutputDir === ".." ||
  normalizedOutputDir.startsWith(`..${path.sep}`)
) {
  throw new Error("SCREENSHOT_OUTPUT_DIR must remain inside the repository checkout");
}

function sanitizeConsoleMessage(value) {
  let text = String(value).replace(/\s+/g, " ").trim().slice(0, 1_000);
  text = text.replace(/(authorization|bearer|token|secret|password)=?\s*[^\s]+/gi, "$1=[REDACTED]");
  text = text.replace(/https?:\/\/[^\s]+/g, raw => {
    try {
      const parsed = new URL(raw);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return "[REDACTED_URL]";
    }
  });
  return text;
}

const plan = JSON.parse(await readFile(planPath, "utf8"));
if (!Array.isArray(plan.targets) || plan.targets.length === 0) {
  throw new Error("capture plan must contain a non-empty targets array");
}
await mkdir(normalizedOutputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const evidence = [];
const failures = [];
const seenOutputKeys = new Set();
try {
  for (const target of plan.targets) {
    const rawSurface = String(target.surface || "").trim();
    if (!rawSurface) {
      throw new Error("every capture target must declare a non-empty surface");
    }
    const surface = rawSurface.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const route = String(target.route || "").trim();
    if (!route.startsWith("/") || route.startsWith("//") || route.includes("\\")) {
      throw new Error(`route for ${surface} must be an origin-relative path`);
    }
    const viewports =
      Array.isArray(target.viewports) && target.viewports.length
        ? target.viewports
        : [
            { width: 390, height: 844 },
            { width: 1_440, height: 1_100 },
          ];

    for (const viewport of viewports) {
      const width = Number(viewport.width);
      const height = Number(viewport.height);
      if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 320 ||
        width > 3_840 ||
        height < 568 ||
        height > 2_560
      ) {
        throw new Error(`invalid viewport for ${surface}: ${JSON.stringify(viewport)}`);
      }
      const outputKey = `${surface}:${route}:${width}x${height}`;
      if (seenOutputKeys.has(outputKey)) {
        throw new Error(`duplicate capture target: ${outputKey}`);
      }
      seenOutputKeys.add(outputKey);

      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      const url = new URL(route, parsedBaseUrl).toString();
      if (new URL(url).origin !== parsedBaseUrl.origin) {
        throw new Error(`capture route escaped the declared origin: ${url}`);
      }
      const consoleErrors = [];
      page.on("console", message => {
        if (message.type() === "error" && consoleErrors.length < 20) {
          consoleErrors.push(sanitizeConsoleMessage(message.text()));
        }
      });

      let responseStatus = null;
      try {
        const response = await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        responseStatus = response?.status() ?? null;
        if (!response || response.status() >= 400) {
          throw new Error(
            `${surface} returned ${response?.status() ?? "no response"} at ${url}`,
          );
        }
        await page
          .waitForLoadState("networkidle", { timeout: 10_000 })
          .catch(() => undefined);
        await page.waitForTimeout(500);

        const state = await page.evaluate(() => {
          const root = document.documentElement;
          const text = (document.body?.innerText || "").toUpperCase();
          const busy = [...document.querySelectorAll('[aria-busy="true"]')].filter(
            element => {
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return (
                style.visibility !== "hidden" &&
                style.display !== "none" &&
                rect.width > 0 &&
                rect.height > 0
              );
            },
          ).length;
          const overflowingElements = [...document.querySelectorAll("body *")]
            .map(element => {
              const rect = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return {
                tag: element.tagName.toLowerCase(),
                id: element.id || null,
                className:
                  typeof element.className === "string"
                    ? element.className.slice(0, 240)
                    : null,
                left: Math.round(rect.left * 100) / 100,
                right: Math.round(rect.right * 100) / 100,
                width: Math.round(rect.width * 100) / 100,
                overflowX: style.overflowX,
                position: style.position,
                text: (element.textContent || "")
                  .trim()
                  .replace(/\s+/g, " ")
                  .slice(0, 160),
              };
            })
            .filter(
              item => item.width > 0 && (item.left < -1 || item.right > root.clientWidth + 1),
            )
            .sort(
              (a, b) =>
                Math.max(b.right - root.clientWidth, -b.left) -
                Math.max(a.right - root.clientWidth, -a.left),
            )
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
            blockedPlaceholder:
              ["LOREM", "PLACEHOLDER", "YOUR TEXT HERE"].find(token =>
                text.includes(token),
              ) || null,
            busy,
          };
        });

        const capturedAt = new Date();
        const date = capturedAt.toISOString().slice(0, 10);
        const filename = `${surface}-${date}-${width}x${height}.png`;
        const filePath = path.join(normalizedOutputDir, filename);
        await page.screenshot({ path: filePath, fullPage: true });
        const bytes = await readFile(filePath);
        const record = {
          filename,
          route,
          url,
          surface,
          response_status: responseStatus,
          capture_date: date,
          captured_at: capturedAt.toISOString(),
          captured_by: capturedBy,
          capture_environment: captureEnvironment,
          source_revision: sourceRevision,
          source_identity: sourceIdentityEvidence,
          workflow_run_or_command: runIdentity,
          viewport: { width, height },
          artifact_sha256: createHash("sha256").update(bytes).digest("hex"),
          console_errors: consoleErrors,
          state,
        };
        evidence.push(record);

        const recordFailures = [];
        if (state.readyState !== "complete") {
          recordFailures.push("document did not reach complete");
        }
        if (state.horizontalOverflow) {
          recordFailures.push(
            `page-level horizontal overflow: ${state.scrollWidth}px > ${state.clientWidth}px`,
          );
        }
        if (state.mainCount !== 1) {
          recordFailures.push(`expected one main landmark, observed ${state.mainCount}`);
        }
        if (state.h1Count < 1) recordFailures.push("no H1 rendered");
        if (state.blockedPlaceholder) {
          recordFailures.push(`blocked placeholder ${state.blockedPlaceholder}`);
        }
        if (state.busy > 0) {
          recordFailures.push(`${state.busy} visible aria-busy regions remained`);
        }
        if (consoleErrors.length) {
          recordFailures.push(`console errors: ${consoleErrors.join(" | ")}`);
        }
        if (recordFailures.length) {
          failures.push({
            surface,
            route,
            viewport: { width, height },
            failures: recordFailures,
            overflowing_elements: state.overflowingElements,
          });
        }
      } catch (error) {
        failures.push({
          surface,
          route,
          viewport: { width, height },
          failures: [sanitizeConsoleMessage(error)],
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
  source_identity: sourceIdentityEvidence,
  capture_environment: captureEnvironment,
  captured_by: capturedBy,
  workflow_run_or_command: runIdentity,
  evidence,
  failures,
};
await writeFile(
  path.join(normalizedOutputDir, "metadata.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    {
      state: report.state,
      captures: evidence.length,
      failures: failures.length,
      source_revision: sourceRevision,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
