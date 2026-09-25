#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const DEFAULT_ROUTE = "/a11oy/";
export const EXPECTED_PNPM_VERSION = "10.26.1";
export const EXPECTED_PLAYWRIGHT_VERSION = "1.60.0";
export const VIEWPORTS = Object.freeze([
  { name: "phone-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 1100 },
  { name: "fullhd-1920", width: 1920, height: 1080 },
  { name: "ultrawide-2560", width: 2560, height: 1440 },
]);

const EVIDENCE_DIRECTORY = "docs/assets/screenshots/current";
const EVIDENCE_PATH = "audit/series-a-exact-head-capture.json";
const CATALOG_PATH = "audit/screenshot-catalog.md";
const ARTIFACT_DIRECTORY = "exact-head-evidence-artifact";
const APPLICATION_PORT = 4110;
const DEVICE_SCALE_FACTOR = 1;
const TIMEOUT_MS = 180_000;
const APPLICATION_EXECUTABLE = "pnpm";
const APPLICATION_ARGUMENTS = Object.freeze([
  "--filter",
  "@workspace/a11oy",
  "exec",
  "vite",
  "--config",
  "vite.config.ts",
  "--host",
  "127.0.0.1",
  "--port",
  String(APPLICATION_PORT),
  "--strictPort",
]);
const START_COMMAND = [APPLICATION_EXECUTABLE, ...APPLICATION_ARGUMENTS].join(" ");
const REQUIRED_CANDIDATE_USER = "szl-capture-candidate";
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const TRANSIENT_PATTERN = /\b(CHECKING|CONNECTING|LOADING|OBSERVING)\b/i;
const CAPTURED_BY = "GitHub Actions";
const CAPTURE_ENVIRONMENT = "github-actions";
const SCREENSHOT_PROOF_LEVEL = "3 — Evidence Proof";
const SCREENSHOT_STATUS = "current";
const SCREENSHOT_NOTES =
  "Exact-head source-presentation capture after readiness checks; not deployment evidence.";
const CATALOG_HEADER = `| Filename | Route | Surface | Capture date | Captured by | Capture environment | Source revision | Workflow run or command | Viewport | Artifact SHA-256 | Workcell ID | Proof level | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |`;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function requiredPositiveInteger(value, name) {
  const normalized = String(value || "").trim();
  if (!/^[1-9][0-9]*$/.test(normalized)) {
    throw new Error(`${name} must be a positive integer`);
  }
  return normalized;
}

export function validateRoute(value) {
  const route = String(value || "").trim();
  if (!/^\/a11oy(?:\/[A-Za-z0-9._~/-]*)?$/.test(route)) {
    throw new Error("SZL_ROUTE must be an origin-relative A11oy path without a query or fragment");
  }
  if (route.includes("..") || route.includes("//") || route.includes("\\")) {
    throw new Error("SZL_ROUTE must not contain traversal or ambiguous path segments");
  }
  return route;
}

export function validateRuntimeInputs(environment = process.env) {
  const candidateSha = String(environment.SZL_CANDIDATE_SHA || "").trim();
  if (!/^[0-9a-f]{40}$/.test(candidateSha)) {
    throw new Error("SZL_CANDIDATE_SHA must be a lowercase 40-character Git SHA");
  }
  const sourcePr = requiredPositiveInteger(environment.SZL_SOURCE_PR, "SZL_SOURCE_PR");
  const route = validateRoute(environment.SZL_ROUTE || DEFAULT_ROUTE);
  const repository = String(environment.GITHUB_REPOSITORY || "").trim();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("GITHUB_REPOSITORY must identify the captured owner/repository");
  }
  const workflowRunId = requiredPositiveInteger(environment.GITHUB_RUN_ID, "GITHUB_RUN_ID");
  const workflowRunAttempt = requiredPositiveInteger(
    environment.GITHUB_RUN_ATTEMPT,
    "GITHUB_RUN_ATTEMPT",
  );
  const serverUrl = String(environment.GITHUB_SERVER_URL || "https://github.com")
    .trim()
    .replace(/\/+$/, "");
  let parsedServerUrl;
  try {
    parsedServerUrl = new URL(serverUrl);
  } catch {
    throw new Error("GITHUB_SERVER_URL must be an absolute HTTPS origin");
  }
  if (
    parsedServerUrl.protocol !== "https:" ||
    parsedServerUrl.username ||
    parsedServerUrl.password ||
    parsedServerUrl.pathname !== "/" ||
    parsedServerUrl.search ||
    parsedServerUrl.hash
  ) {
    throw new Error("GITHUB_SERVER_URL must be an absolute HTTPS origin");
  }
  return {
    candidateSha,
    sourcePr,
    route,
    repository,
    workflowRunId,
    workflowRunAttempt,
    serverUrl,
  };
}

export function assertCheckoutRevision(candidateSha, observedSha) {
  if (observedSha !== candidateSha) {
    throw new Error(`checked-out revision ${observedSha || "<empty>"} does not match ${candidateSha}`);
  }
}

export function assertCleanTrackedTree(statusOutput) {
  const dirtyEntries = String(statusOutput || "").trim();
  if (dirtyEntries) {
    throw new Error(`tracked candidate files changed before capture: ${dirtyEntries}`);
  }
}

function pathContains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

export function validateCaptureIsolation(environment = process.env) {
  const candidateRootValue = String(environment.SZL_CANDIDATE_ROOT || "").trim();
  const evidenceRootValue = String(environment.SZL_EVIDENCE_ROOT || "").trim();
  const candidateHomeValue = String(environment.SZL_CANDIDATE_HOME || "").trim();
  const pnpmRootValue = String(environment.SZL_PNPM_ROOT || "").trim();
  const candidateUser = String(environment.SZL_CANDIDATE_USER || "").trim();
  for (const [name, value] of [
    ["SZL_CANDIDATE_ROOT", candidateRootValue],
    ["SZL_EVIDENCE_ROOT", evidenceRootValue],
    ["SZL_CANDIDATE_HOME", candidateHomeValue],
    ["SZL_PNPM_ROOT", pnpmRootValue],
  ]) {
    if (!value || !path.isAbsolute(value)) throw new Error(`${name} must be an absolute path`);
  }
  if (candidateUser !== REQUIRED_CANDIDATE_USER) {
    throw new Error(`SZL_CANDIDATE_USER must equal ${REQUIRED_CANDIDATE_USER}`);
  }

  const candidateRoot = path.resolve(candidateRootValue);
  const evidenceRoot = path.resolve(evidenceRootValue);
  const candidateHome = path.resolve(candidateHomeValue);
  const pnpmRoot = path.resolve(pnpmRootValue);
  if (pathContains(candidateRoot, evidenceRoot) || pathContains(evidenceRoot, candidateRoot)) {
    throw new Error("candidate and evidence roots must be disjoint");
  }
  if (
    pathContains(candidateRoot, candidateHome) ||
    pathContains(candidateHome, candidateRoot) ||
    pathContains(evidenceRoot, candidateHome) ||
    pathContains(candidateHome, evidenceRoot)
  ) {
    throw new Error("candidate home must be disjoint from source and evidence roots");
  }
  for (const protectedRoot of [candidateRoot, evidenceRoot, candidateHome]) {
    if (pathContains(pnpmRoot, protectedRoot) || pathContains(protectedRoot, pnpmRoot)) {
      throw new Error("pnpm runtime root must be disjoint from source, evidence, and candidate home");
    }
  }
  return { candidateRoot, evidenceRoot, candidateHome, candidateUser, pnpmRoot };
}

export function validatePnpmRuntimePaths(environment = process.env) {
  const rootValue = String(environment.SZL_PNPM_ROOT || "").trim();
  const executableValue = String(environment.SZL_PNPM_EXECUTABLE || "").trim();
  if (!rootValue || !path.isAbsolute(rootValue)) {
    throw new Error("SZL_PNPM_ROOT must be an absolute path");
  }
  if (!executableValue || !path.isAbsolute(executableValue)) {
    throw new Error("SZL_PNPM_EXECUTABLE must be an absolute path");
  }
  const pnpmRoot = path.resolve(rootValue);
  const pnpmExecutable = path.resolve(executableValue);
  if (pnpmExecutable === pnpmRoot || !pathContains(pnpmRoot, pnpmExecutable)) {
    throw new Error("pnpm executable must remain inside SZL_PNPM_ROOT");
  }
  return { pnpmRoot, pnpmExecutable };
}

export async function validatePnpmRuntime(environment = process.env) {
  const configured = validatePnpmRuntimePaths(environment);
  const rootEntry = await lstat(configured.pnpmRoot);
  if (!rootEntry.isDirectory() || rootEntry.isSymbolicLink()) {
    throw new Error("pnpm runtime root must be a real directory");
  }
  const [resolvedRoot, resolvedExecutable] = await Promise.all([
    realpath(configured.pnpmRoot),
    realpath(configured.pnpmExecutable),
  ]);
  if (!pathContains(resolvedRoot, resolvedExecutable) || resolvedRoot === resolvedExecutable) {
    throw new Error("pnpm executable resolves outside SZL_PNPM_ROOT");
  }
  const [rootMetadata, executableMetadata] = await Promise.all([
    stat(resolvedRoot),
    stat(resolvedExecutable),
  ]);
  if (!executableMetadata.isFile()) {
    throw new Error("pnpm executable must resolve to a regular file");
  }
  if ((rootMetadata.mode & 0o005) !== 0o005 || (executableMetadata.mode & 0o005) !== 0o005) {
    throw new Error("pnpm runtime must be readable and executable by the candidate identity");
  }
  if ((rootMetadata.mode & 0o022) !== 0 || (executableMetadata.mode & 0o022) !== 0) {
    throw new Error("pnpm runtime must not be group- or world-writable");
  }
  return {
    pnpmRoot: configured.pnpmRoot,
    pnpmExecutable: configured.pnpmExecutable,
    resolvedExecutable,
  };
}

export function surfaceFromRoute(route) {
  const validated = validateRoute(route);
  const suffix = validated.replace(/^\/a11oy\/?/, "").replace(/\/$/, "");
  const slug = suffix.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `a11oy-${slug || "home"}`;
}

export function surfaceLabelFromRoute(route) {
  const surface = surfaceFromRoute(route).replace(/^a11oy-/, "");
  const label = surface
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
  return `A11oy ${label || "Home"}`;
}

export function workflowRunUrlForCapture(inputs) {
  return `${inputs.serverUrl}/${inputs.repository}/actions/runs/${inputs.workflowRunId}/attempts/${inputs.workflowRunAttempt}`;
}

export function workcellIdForCapture(inputs) {
  return `exact-head-screenshot-pr-${inputs.sourcePr}-run-${inputs.workflowRunId}-attempt-${inputs.workflowRunAttempt}`;
}

export function catalogEntryMarkdown(row) {
  return `| \`${row.filename}\` | \`${row.route}\` | ${row.surface} | ${row.capture_date} | ${row.captured_by} | \`${row.capture_environment}\` | \`${row.source_revision}\` | [run](${row.workflow_run_or_command}) | ${row.viewport} | \`${row.artifact_sha256}\` | \`${row.workcell_id}\` | ${row.proof_level} | \`${row.status}\` | ${row.notes} |`;
}

export function screenshotFilename(surface, captureDate, viewportName) {
  if (!/^a11oy-[A-Za-z0-9._-]+$/.test(surface)) throw new Error("invalid capture surface");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(captureDate)) throw new Error("invalid capture date");
  if (!/^[A-Za-z0-9._-]+$/.test(viewportName)) throw new Error("invalid viewport name");
  return `${surface}-${captureDate}-${viewportName}.png`;
}

function sanitizeDiagnostic(value) {
  let text = String(value).replace(/\s+/g, " ").trim().slice(0, 2_000);
  text = text.replace(/(authorization|bearer|token|secret|password)=?\s*[^\s]+/gi, "$1=[REDACTED]");
  return text.replace(/https?:\/\/[^\s]+/g, raw => {
    try {
      const parsed = new URL(raw);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return "[REDACTED_URL]";
    }
  });
}

export function assertPageAdmissible({
  viewportName,
  targetUrl,
  responseStatus,
  metrics,
  consoleErrors,
  pageErrors,
}) {
  if (!Number.isInteger(responseStatus) || responseStatus < 200 || responseStatus >= 400) {
    throw new Error(`${viewportName}: route returned ${responseStatus ?? "no response"}`);
  }
  const expected = new URL(targetUrl);
  const observed = new URL(metrics.finalUrl);
  if (
    observed.origin !== expected.origin ||
    observed.pathname !== expected.pathname ||
    observed.search !== expected.search ||
    observed.hash
  ) {
    throw new Error(`${viewportName}: final URL escaped or changed the requested route`);
  }
  if (metrics.readyState !== "complete") {
    throw new Error(`${viewportName}: document did not reach complete`);
  }
  if (!metrics.screenshotReady) {
    throw new Error(`${viewportName}: application readiness marker was not observed`);
  }
  if (metrics.mainContentCount !== 1) {
    throw new Error(`${viewportName}: expected one #main-content element, observed ${metrics.mainContentCount}`);
  }
  if (metrics.h1Count < 1) {
    throw new Error(`${viewportName}: no H1 rendered`);
  }
  if (metrics.notFound) {
    throw new Error(`${viewportName}: rendered a not-found surface despite a successful HTTP status`);
  }
  if (metrics.bodyTextLength < 32) {
    throw new Error(`${viewportName}: rendered body content is unexpectedly empty`);
  }
  if (metrics.blockedPlaceholder) {
    throw new Error(`${viewportName}: blocked placeholder ${metrics.blockedPlaceholder} remained visible`);
  }
  if (metrics.busy > 0) {
    throw new Error(`${viewportName}: ${metrics.busy} visible aria-busy regions remained`);
  }
  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    throw new Error(
      `${viewportName}: horizontal overflow ${metrics.scrollWidth} > ${metrics.clientWidth}`,
    );
  }
  if (metrics.transient.length) {
    throw new Error(
      `${viewportName}: nonterminal public state remained visible: ${metrics.transient.join(", ")}`,
    );
  }
  if (consoleErrors.length || pageErrors.length) {
    throw new Error(
      `${viewportName}: browser errors: ${JSON.stringify({ consoleErrors, pageErrors })}`,
    );
  }
}

export function assertPngBytes(bytes, viewport) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 128 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`${viewport.name}: screenshot is not a non-empty PNG`);
  }
  if (bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error(`${viewport.name}: PNG is missing its IHDR header`);
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width !== viewport.width * DEVICE_SCALE_FACTOR || height < viewport.height) {
    throw new Error(
      `${viewport.name}: PNG dimensions ${width}x${height} do not cover ${viewport.width}x${viewport.height}`,
    );
  }
  return { width, height };
}

export async function assertSafeRepositoryPath(root, target) {
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative === "" || relative === ".") return;
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`evidence path escapes the candidate checkout: ${target}`);
  }
  let cursor = resolvedRoot;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    try {
      const entry = await lstat(cursor);
      if (entry.isSymbolicLink()) {
        throw new Error(`evidence path contains a symbolic link: ${cursor}`);
      }
    } catch (error) {
      if (error?.code === "ENOENT") return;
      throw error;
    }
  }
}

async function listFilesRecursively(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await listFilesRecursively(root, absolute)));
    else if (entry.isFile()) files.push(path.relative(root, absolute).replaceAll(path.sep, "/"));
    else throw new Error(`artifact contains a non-regular entry: ${absolute}`);
  }
  return files.sort();
}

export async function verifyEvidencePacketOnDisk({
  root = process.cwd(),
  environment = process.env,
} = {}) {
  const inputs = validateRuntimeInputs(environment);
  const evidencePath = path.join(root, EVIDENCE_PATH);
  const catalogPath = path.join(root, CATALOG_PATH);
  const artifactRoot = path.join(root, ARTIFACT_DIRECTORY);
  for (const target of [evidencePath, catalogPath, artifactRoot]) {
    await assertSafeRepositoryPath(root, target);
  }
  const packetBytes = await readFile(evidencePath);
  const packet = JSON.parse(packetBytes.toString("utf8"));

  if (packet.schema !== "szl.exact-head-screenshot-evidence/v1" || packet.state !== "VERIFIED") {
    throw new Error("capture packet does not declare the admitted schema and VERIFIED state");
  }
  if (packet.repository !== inputs.repository) throw new Error("repository mismatch");
  if (packet.source_pr !== inputs.sourcePr) throw new Error("source PR mismatch");
  if (packet.source_sha !== inputs.candidateSha) throw new Error("source SHA mismatch");
  if (packet.checkout_sha !== inputs.candidateSha) throw new Error("checkout SHA mismatch");
  if (packet.workflow_run_id !== inputs.workflowRunId) throw new Error("workflow run mismatch");
  if (packet.workflow_run_attempt !== inputs.workflowRunAttempt) {
    throw new Error("workflow run attempt mismatch");
  }
  const expectedWorkflowRunUrl = workflowRunUrlForCapture(inputs);
  const expectedWorkcellId = workcellIdForCapture(inputs);
  if (packet.workflow_run_url !== expectedWorkflowRunUrl) {
    throw new Error("workflow run URL mismatch");
  }
  if (packet.workcell_id !== expectedWorkcellId) throw new Error("workcell mismatch");
  if (packet.route !== inputs.route) throw new Error("capture route mismatch");
  if (packet.pnpm_version !== EXPECTED_PNPM_VERSION) throw new Error("pnpm version mismatch");
  if (packet.base_url !== `http://127.0.0.1:${APPLICATION_PORT}`) {
    throw new Error("capture base URL mismatch");
  }
  if (packet.start_command !== START_COMMAND) throw new Error("application start command mismatch");
  if (packet.catalog_path !== CATALOG_PATH) throw new Error("catalog path mismatch");
  if (!packet.runner_image || !packet.node_version || !packet.playwright_version || !packet.browser_version) {
    throw new Error("capture toolchain identity is incomplete");
  }
  if (!packet.node_version.startsWith("v24.")) throw new Error("Node major version mismatch");
  if (packet.playwright_version !== EXPECTED_PLAYWRIGHT_VERSION) {
    throw new Error("Playwright version mismatch");
  }

  const startedAt = Date.parse(packet.started_at);
  const capturedAt = Date.parse(packet.captured_at);
  if (!Number.isFinite(startedAt) || !Number.isFinite(capturedAt) || capturedAt < startedAt) {
    throw new Error("capture timestamps are invalid or reversed");
  }
  if (capturedAt > Date.now() + 60_000 || capturedAt - startedAt > TIMEOUT_MS + 120_000) {
    throw new Error("capture timestamps fall outside the admitted run window");
  }

  const expectedSurface = surfaceFromRoute(inputs.route);
  const expectedSurfaceLabel = surfaceLabelFromRoute(inputs.route);
  if (packet.surface !== expectedSurface) throw new Error("capture surface mismatch");
  if (!Array.isArray(packet.results) || packet.results.length !== VIEWPORTS.length) {
    throw new Error("viewport matrix incomplete");
  }

  const catalogBytes = await readFile(catalogPath);
  if (sha256(catalogBytes) !== packet.catalog_sha256) throw new Error("catalog digest mismatch");
  const catalog = catalogBytes.toString("utf8");
  if (!catalog.includes(CATALOG_HEADER)) throw new Error("catalog manifest header is incomplete");
  const seenNames = new Set();
  const seenScreenshots = new Set();
  const observedCaptureDates = new Set();
  const expectedArtifactFiles = [CATALOG_PATH, EVIDENCE_PATH];

  for (let index = 0; index < VIEWPORTS.length; index += 1) {
    const viewport = VIEWPORTS[index];
    const row = packet.results[index];
    if (
      row.name !== viewport.name ||
      row.width !== viewport.width ||
      row.height !== viewport.height ||
      row.device_scale_factor !== DEVICE_SCALE_FACTOR
    ) {
      throw new Error(`viewport mismatch at result ${index}`);
    }
    if (row.horizontal_overflow !== false || !String(row.title || "").trim()) {
      throw new Error(`page admission fields are incomplete: ${row.name}`);
    }
    if (seenNames.has(row.name) || seenScreenshots.has(row.screenshot)) {
      throw new Error(`duplicate result identity: ${row.name}`);
    }
    seenNames.add(row.name);
    seenScreenshots.add(row.screenshot);
    const rowCapturedAt = Date.parse(row.captured_at);
    if (
      !Number.isFinite(rowCapturedAt) ||
      rowCapturedAt < startedAt ||
      rowCapturedAt > capturedAt
    ) {
      throw new Error(`capture timestamp mismatch: ${row.name}`);
    }
    const expectedDate = new Date(rowCapturedAt).toISOString().slice(0, 10);
    if (row.capture_date !== expectedDate) throw new Error(`capture date mismatch: ${row.name}`);
    observedCaptureDates.add(expectedDate);
    const expectedScreenshot = `${EVIDENCE_DIRECTORY}/${screenshotFilename(
      expectedSurface,
      expectedDate,
      viewport.name,
    )}`;
    if (row.screenshot !== expectedScreenshot) throw new Error(`unexpected screenshot path: ${row.screenshot}`);
    if (row.filename !== expectedScreenshot) throw new Error(`catalog filename mismatch: ${row.name}`);
    if (row.route !== inputs.route || row.capture_date !== expectedDate) {
      throw new Error(`route or date mismatch: ${row.name}`);
    }
    if (
      row.surface !== expectedSurfaceLabel ||
      row.captured_by !== CAPTURED_BY ||
      row.capture_environment !== CAPTURE_ENVIRONMENT ||
      row.source_revision !== inputs.candidateSha ||
      row.workflow_run_or_command !== expectedWorkflowRunUrl ||
      row.viewport !== `${viewport.width} x ${viewport.height}` ||
      row.workcell_id !== expectedWorkcellId ||
      row.proof_level !== SCREENSHOT_PROOF_LEVEL ||
      row.status !== SCREENSHOT_STATUS ||
      row.notes !== SCREENSHOT_NOTES
    ) {
      throw new Error(`screenshot catalog metadata mismatch: ${row.name}`);
    }
    assertPageAdmissible({
      viewportName: row.name,
      targetUrl: `${packet.base_url}${inputs.route}`,
      responseStatus: row.http_status,
      metrics: {
        finalUrl: row.final_url,
        readyState: row.ready_state,
        screenshotReady: row.screenshot_ready,
        mainContentCount: row.main_content_count,
        h1Count: row.h1_count,
        notFound: row.not_found,
        bodyTextLength: row.body_text_length,
        blockedPlaceholder: row.blocked_placeholder,
        busy: row.visible_busy_regions,
        scrollWidth: row.scroll_width,
        clientWidth: row.client_width,
        transient: row.transient_states,
      },
      consoleErrors: row.console_errors,
      pageErrors: row.page_errors,
    });
    const screenshotPath = path.join(root, row.screenshot);
    await assertSafeRepositoryPath(root, screenshotPath);
    const screenshotBytes = await readFile(screenshotPath);
    const dimensions = assertPngBytes(screenshotBytes, viewport);
    if (row.png_width !== dimensions.width || row.png_height !== dimensions.height) {
      throw new Error(`PNG dimension binding mismatch: ${row.name}`);
    }
    if (screenshotBytes.length !== row.bytes || sha256(screenshotBytes) !== row.sha256) {
      throw new Error(`screenshot byte binding mismatch: ${row.name}`);
    }
    if (row.artifact_sha256 !== row.sha256) {
      throw new Error(`catalog digest binding mismatch: ${row.name}`);
    }
    const expectedCatalogRow = catalogEntryMarkdown(row);
    if (!catalog.includes(expectedCatalogRow)) throw new Error(`catalog row mismatch: ${row.name}`);

    const artifactScreenshot = path.join(artifactRoot, row.screenshot);
    await assertSafeRepositoryPath(root, artifactScreenshot);
    const artifactBytes = await readFile(artifactScreenshot);
    if (!artifactBytes.equals(screenshotBytes)) throw new Error(`artifact image mismatch: ${row.name}`);
    expectedArtifactFiles.push(row.screenshot);
  }

  if (
    !Array.isArray(packet.capture_dates) ||
    JSON.stringify(packet.capture_dates) !== JSON.stringify([...observedCaptureDates].sort())
  ) {
    throw new Error("packet capture dates do not match result timestamps");
  }

  const artifactPacket = await readFile(path.join(artifactRoot, EVIDENCE_PATH));
  const artifactCatalog = await readFile(path.join(artifactRoot, CATALOG_PATH));
  if (!artifactPacket.equals(packetBytes)) throw new Error("artifact packet differs from verified packet");
  if (!artifactCatalog.equals(catalogBytes)) throw new Error("artifact catalog differs from verified catalog");
  const artifactFiles = await listFilesRecursively(artifactRoot);
  if (JSON.stringify(artifactFiles) !== JSON.stringify(expectedArtifactFiles.sort())) {
    throw new Error(`artifact file set is not isolated: ${JSON.stringify(artifactFiles)}`);
  }
  return packet;
}

function signalServer(child, signal) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (process.platform === "win32") child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

async function terminateServer(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  signalServer(child, "SIGTERM");
  await Promise.race([once(child, "exit"), new Promise(resolve => setTimeout(resolve, 5_000))]);
  if (child.exitCode === null && child.signalCode === null) {
    signalServer(child, "SIGKILL");
    await Promise.race([once(child, "exit"), new Promise(resolve => setTimeout(resolve, 2_000))]);
  }
}

function verifyCurrentCheckout(candidateSha, candidateRoot) {
  const observedSha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: candidateRoot,
    encoding: "utf8",
    timeout: 8_000,
  }).trim();
  assertCheckoutRevision(candidateSha, observedSha);
  const trackedStatus = execFileSync(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=no"],
    { cwd: candidateRoot, encoding: "utf8", timeout: 8_000 },
  );
  assertCleanTrackedTree(trackedStatus);
  return observedSha;
}

async function capture() {
  const startedAt = new Date();
  const inputs = validateRuntimeInputs();
  const { candidateRoot, evidenceRoot, candidateHome, candidateUser, pnpmRoot } =
    validateCaptureIsolation();
  const pnpmRuntime = await validatePnpmRuntime();
  if (pnpmRuntime.pnpmRoot !== pnpmRoot) {
    throw new Error("capture isolation and pnpm runtime roots disagree");
  }
  verifyCurrentCheckout(inputs.candidateSha, candidateRoot);

  const pnpmVersion = execFileSync(pnpmRuntime.pnpmExecutable, ["--version"], {
    encoding: "utf8",
  }).trim();
  if (pnpmVersion !== EXPECTED_PNPM_VERSION) {
    throw new Error(`pnpm ${pnpmVersion} does not match the admitted ${EXPECTED_PNPM_VERSION}`);
  }
  const { chromium } = await import("@playwright/test");
  const playwrightPackage = (
    await import("@playwright/test/package.json", { with: { type: "json" } })
  ).default;
  if (playwrightPackage.version !== EXPECTED_PLAYWRIGHT_VERSION) {
    throw new Error(
      `Playwright ${playwrightPackage.version} does not match ${EXPECTED_PLAYWRIGHT_VERSION}`,
    );
  }

  const root = evidenceRoot;
  const evidenceDir = path.resolve(root, EVIDENCE_DIRECTORY);
  const evidencePath = path.resolve(root, EVIDENCE_PATH);
  const catalogPath = path.resolve(root, CATALOG_PATH);
  const artifactRoot = path.resolve(root, ARTIFACT_DIRECTORY);
  const surface = surfaceFromRoute(inputs.route);
  const surfaceLabel = surfaceLabelFromRoute(inputs.route);
  const workflowRunUrl = workflowRunUrlForCapture(inputs);
  const workcellId = workcellIdForCapture(inputs);
  for (const target of [evidenceDir, evidencePath, catalogPath, artifactRoot]) {
    await assertSafeRepositoryPath(root, target);
  }
  await mkdir(evidenceDir, { recursive: true });
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await rm(artifactRoot, { recursive: true, force: true });

  const trustedPath = [
    path.dirname(process.execPath),
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
  ].join(path.delimiter);
  const candidateEnvironment = [
    `PATH=${trustedPath}`,
    `HOME=${candidateHome}`,
    `TMPDIR=${path.join(candidateHome, "tmp")}`,
    `XDG_CACHE_HOME=${path.join(candidateHome, "cache")}`,
    "CI=1",
    "BROWSER=none",
    "BASE_PATH=/a11oy/",
    `VITE_PORT=${APPLICATION_PORT}`,
  ];
  const child = spawn("sudo", [
    "--non-interactive",
    "--user",
    candidateUser,
    "--",
    "/usr/bin/env",
    "-i",
    ...candidateEnvironment,
    pnpmRuntime.pnpmExecutable,
    ...APPLICATION_ARGUMENTS,
  ], {
    cwd: candidateRoot,
    env: { PATH: trustedPath, LANG: "C.UTF-8" },
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  let serverLog = "";
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", chunk => {
      serverLog += chunk;
      if (serverLog.length > 256_000) serverLog = serverLog.slice(-256_000);
    });
  }
  process.on("exit", () => signalServer(child, "SIGTERM"));
  process.on("SIGINT", () => {
    signalServer(child, "SIGTERM");
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    signalServer(child, "SIGTERM");
    process.exit(143);
  });

  async function probe(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_000);
    try {
      const response = await fetch(url, { signal: controller.signal, redirect: "follow" });
      return response.status >= 200 && response.status < 400 ? response : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  const baseUrl = `http://127.0.0.1:${APPLICATION_PORT}`;
  const targetUrl = `${baseUrl}${inputs.route}`;
  const deadline = Date.now() + TIMEOUT_MS;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    if (child.exitCode !== null) {
      throw new Error(
        `application command exited before readiness: ${child.exitCode}\n${sanitizeDiagnostic(serverLog.slice(-8_000))}`,
      );
    }
    ready = Boolean(await probe(targetUrl));
    if (!ready) await new Promise(resolve => setTimeout(resolve, 1_500));
  }
  if (!ready) {
    throw new Error(
      `application route did not become ready within ${TIMEOUT_MS}ms\n${sanitizeDiagnostic(serverLog.slice(-8_000))}`,
    );
  }

  // Candidate application code runs as a separate OS identity against read-only source.
  // Re-read the exact checkout at the last common point before any viewport is captured.
  const preCaptureSha = verifyCurrentCheckout(inputs.candidateSha, candidateRoot);

  let browser;
  const results = [];
  let browserVersion = "";
  try {
    browser = await chromium.launch({ headless: true });
    browserVersion = browser.version();
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: DEVICE_SCALE_FACTOR,
        reducedMotion: "reduce",
      });
      try {
        const page = await context.newPage();
        const consoleErrors = [];
        const pageErrors = [];
        page.on("console", message => {
          if (message.type() === "error" && consoleErrors.length < 20) {
            consoleErrors.push(sanitizeDiagnostic(message.text()));
          }
        });
        page.on("pageerror", error => {
          if (pageErrors.length < 20) pageErrors.push(sanitizeDiagnostic(error));
        });

        const response = await page.goto(targetUrl, {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        });
        await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
        await page.waitForFunction(
          () => document.body?.dataset.screenshotReady === "true",
          undefined,
          { timeout: 30_000 },
        );
        await page.waitForTimeout(500);

        const metrics = await page.evaluate(patternSource => {
          const pattern = new RegExp(patternSource, "i");
          const visible = node => {
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0;
          };
          const bodyText = (document.body?.innerText || "").trim();
          const normalizedText = bodyText.toUpperCase();
          const statusNodes = Array.from(
            document.querySelectorAll('[data-state], [data-status], [role="status"], .status'),
          );
          const transient = statusNodes
            .filter(node => visible(node) && pattern.test((node.textContent || "").trim()))
            .map(node => (node.textContent || "").trim().slice(0, 200));
          const bodyTransient = bodyText
            .split(/\n+/)
            .map(text => text.trim())
            .filter(text => text && pattern.test(text))
            .map(text => text.slice(0, 200));
          const busy = Array.from(document.querySelectorAll('[aria-busy="true"]')).filter(visible).length;
          return {
            title: document.title,
            finalUrl: location.href,
            readyState: document.readyState,
            screenshotReady: document.body?.dataset.screenshotReady === "true",
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            mainContentCount: document.querySelectorAll('[id="main-content"]').length,
            h1Count: document.querySelectorAll("h1").length,
            bodyTextLength: bodyText.length,
            notFound: /\b404\b/.test(normalizedText) && /\b(PAGE )?NOT FOUND\b/.test(normalizedText),
            blockedPlaceholder:
              ["LOREM", "PLACEHOLDER", "YOUR TEXT HERE"].find(token => normalizedText.includes(token)) ||
              null,
            busy,
            transient: [...new Set([...transient, ...bodyTransient])],
          };
        }, TRANSIENT_PATTERN.source);

        assertPageAdmissible({
          viewportName: viewport.name,
          targetUrl,
          responseStatus: response?.status() ?? null,
          metrics,
          consoleErrors,
          pageErrors,
        });

        const capturedAt = new Date();
        const captureDate = capturedAt.toISOString().slice(0, 10);
        const fileName = screenshotFilename(surface, captureDate, viewport.name);
        const filePath = path.join(evidenceDir, fileName);
        await assertSafeRepositoryPath(root, filePath);
        await rm(filePath, { force: true });
        await page.screenshot({
          path: filePath,
          fullPage: true,
          animations: "disabled",
        });
        const bytes = await readFile(filePath);
        const dimensions = assertPngBytes(bytes, viewport);
        const screenshotDigest = sha256(bytes);
        const fileStat = await stat(filePath);
        if (fileStat.mtimeMs < startedAt.getTime() - 1_000) {
          throw new Error(`${viewport.name}: screenshot predates this capture run`);
        }
        results.push({
          name: viewport.name,
          width: viewport.width,
          height: viewport.height,
          device_scale_factor: DEVICE_SCALE_FACTOR,
          route: inputs.route,
          final_url: metrics.finalUrl,
          http_status: response.status(),
          title: metrics.title,
          ready_state: metrics.readyState,
          screenshot_ready: metrics.screenshotReady,
          main_content_count: metrics.mainContentCount,
          h1_count: metrics.h1Count,
          body_text_length: metrics.bodyTextLength,
          not_found: metrics.notFound,
          blocked_placeholder: metrics.blockedPlaceholder,
          visible_busy_regions: metrics.busy,
          transient_states: metrics.transient,
          console_errors: consoleErrors,
          page_errors: pageErrors,
          scroll_width: metrics.scrollWidth,
          client_width: metrics.clientWidth,
          horizontal_overflow: false,
          capture_date: captureDate,
          captured_at: capturedAt.toISOString(),
          screenshot: path.relative(root, filePath).replaceAll(path.sep, "/"),
          filename: path.relative(root, filePath).replaceAll(path.sep, "/"),
          surface: surfaceLabel,
          captured_by: CAPTURED_BY,
          capture_environment: CAPTURE_ENVIRONMENT,
          source_revision: inputs.candidateSha,
          workflow_run_or_command: workflowRunUrl,
          viewport: `${viewport.width} x ${viewport.height}`,
          artifact_sha256: screenshotDigest,
          workcell_id: workcellId,
          proof_level: SCREENSHOT_PROOF_LEVEL,
          status: SCREENSHOT_STATUS,
          notes: SCREENSHOT_NOTES,
          png_width: dimensions.width,
          png_height: dimensions.height,
          bytes: bytes.length,
          sha256: screenshotDigest,
        });
      } finally {
        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    await terminateServer(child);
  }

  // Close the provenance boundary after the untrusted process is gone. Evidence lives in
  // a runner-only root that the candidate identity cannot traverse or mutate.
  const postTeardownSha = verifyCurrentCheckout(inputs.candidateSha, candidateRoot);
  assertCheckoutRevision(preCaptureSha, postTeardownSha);

  const capturedAt = new Date();
  let catalog = "";
  try {
    catalog = await readFile(catalogPath, "utf8");
  } catch {
    catalog = "# Screenshot catalog\n";
  }
  const startMarker = "<!-- szl-exact-head-capture:start -->";
  const endMarker = "<!-- szl-exact-head-capture:end -->";
  const rows = results
    .map(item => catalogEntryMarkdown(item))
    .join("\n");
  const block = `${startMarker}\n\n## Exact-head Series A capture\n\n- Source SHA: \`${inputs.candidateSha}\`\n- Source PR: \`#${inputs.sourcePr}\`\n- Workflow run: [\`${inputs.workflowRunId}\` attempt \`${inputs.workflowRunAttempt}\`](${workflowRunUrl})\n- Workcell: \`${workcellId}\`\n- Runner: \`${process.env.ImageOS || process.env.RUNNER_OS || os.platform()}\` / \`${process.env.RUNNER_ARCH || os.arch()}\`\n- Node: \`${process.version}\`\n- pnpm: \`${pnpmVersion}\`\n- Playwright: \`${playwrightPackage.version}\`\n- Chromium: \`${browserVersion}\`\n- Route: \`${targetUrl}\`\n- Captured: \`${capturedAt.toISOString()}\`\n- Evidence: \`${EVIDENCE_PATH}\`\n\n${CATALOG_HEADER}\n${rows}\n\n${endMarker}`;
  const markerPattern = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, "m");
  const updatedCatalog = markerPattern.test(catalog)
    ? catalog.replace(markerPattern, block)
    : `${catalog.trimEnd()}\n\n${block}\n`;
  const catalogBytes = Buffer.from(updatedCatalog, "utf8");

  const evidence = {
    schema: "szl.exact-head-screenshot-evidence/v1",
    state: "VERIFIED",
    repository: inputs.repository,
    source_pr: inputs.sourcePr,
    source_sha: inputs.candidateSha,
    checkout_sha: postTeardownSha,
    workflow_run_id: inputs.workflowRunId,
    workflow_run_attempt: inputs.workflowRunAttempt,
    workflow_run_url: workflowRunUrl,
    workcell_id: workcellId,
    runner_image: [process.env.ImageOS, process.env.ImageVersion].filter(Boolean).join("@") || process.env.RUNNER_OS || os.platform(),
    runner_arch: process.env.RUNNER_ARCH || os.arch(),
    node_version: process.version,
    pnpm_version: pnpmVersion,
    playwright_version: playwrightPackage.version,
    browser_version: browserVersion,
    start_command: START_COMMAND,
    base_url: baseUrl,
    route: inputs.route,
    surface,
    capture_dates: [...new Set(results.map(result => result.capture_date))].sort(),
    started_at: startedAt.toISOString(),
    captured_at: capturedAt.toISOString(),
    catalog_path: CATALOG_PATH,
    catalog_sha256: sha256(catalogBytes),
    results,
    claim_boundary:
      "Source-presentation evidence only; not deployment, traffic, uptime, business, or authorization evidence.",
  };
  await writeFile(catalogPath, catalogBytes);
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

  await mkdir(path.join(artifactRoot, path.dirname(EVIDENCE_PATH)), { recursive: true });
  await mkdir(path.join(artifactRoot, EVIDENCE_DIRECTORY), { recursive: true });
  await copyFile(evidencePath, path.join(artifactRoot, EVIDENCE_PATH));
  await copyFile(catalogPath, path.join(artifactRoot, CATALOG_PATH));
  for (const row of results) {
    await copyFile(path.join(root, row.screenshot), path.join(artifactRoot, row.screenshot));
  }

  await verifyEvidencePacketOnDisk({ root, environment: process.env });
  console.log(
    JSON.stringify(
      {
        state: evidence.state,
        source_sha: evidence.source_sha,
        source_pr: evidence.source_pr,
        captures: evidence.results.length,
        artifact_directory: ARTIFACT_DIRECTORY,
      },
      null,
      2,
    ),
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  if (process.argv[2] === "--verify") {
    const { evidenceRoot } = validateCaptureIsolation();
    const packet = await verifyEvidencePacketOnDisk({ root: evidenceRoot });
    console.log(
      JSON.stringify({ state: packet.state, source_sha: packet.source_sha, captures: packet.results.length }),
    );
  } else if (process.argv.length === 2) {
    await capture();
  } else {
    throw new Error("usage: capture-series-a-exact-head.mjs [--verify]");
  }
}
