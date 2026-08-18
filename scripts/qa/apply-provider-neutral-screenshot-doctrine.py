#!/usr/bin/env python3
"""One-shot applicator for provider-neutral, source-bound screenshot proof.

The script is intentionally anchor-based and fail-closed. It patches the existing
repository doctrine, installs a reusable GitHub-native capture workflow, writes a
provider-neutral execution doctrine, then removes the one-shot applicator assets.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def replace_exact(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    if new in text:
        return
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"anchor mismatch in {path}: expected 1 occurrence, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")


def insert_before(path: Path, anchor: str, block: str) -> None:
    text = path.read_text(encoding="utf-8")
    if block.strip() in text:
        return
    count = text.count(anchor)
    if count != 1:
        raise SystemExit(f"insert anchor mismatch in {path}: expected 1, found {count}")
    path.write_text(text.replace(anchor, block.rstrip() + "\n\n" + anchor), encoding="utf-8")


agents = ROOT / "AGENTS.md"
screenshot_doctrine = ROOT / "docs" / "A11OY_SCREENSHOT_DOCTRINE.md"

replace_exact(
    agents,
    "This file is the authoritative operating contract for every AI agent, Replit task, Codex session, and human contributor working in this repository.",
    "This file is the authoritative operating contract for every AI agent, repository-controlled workspace, Codex session, and human contributor working in this repository.",
)

old_agents_block = '''Every screenshot submitted as proof must:

1. Be captured live from the running application in this Replit workspace.
2. Show a browser chrome or app frame — not a design mockup or Figma export.
3. Be stored in `docs/assets/screenshots/current/` with ISO-date filename and metadata in `audit/screenshot-catalog.md`.
4. Include the route URL visible in the address bar or be noted in the catalog.
5. Be free of placeholder data labeled "TODO", "LOREM", or "PLACEHOLDER".

Blocked screenshots: blank screens, error pages, loading spinners, Figma exports, screenshots taken outside the running app.'''

new_agents_block = '''Every screenshot submitted as proof must:

1. Be captured live from the running application at an exact 40-character source revision in a repository-controlled environment. No vendor-specific workspace is required.
2. Use GitHub Actions, a protected preview deployment, an authenticated cloud development environment, or a local exact-head checkout whose provider and command or workflow run are recorded.
3. Show a browser chrome or app frame, or carry a source-bound metadata sidecar with the exact route, viewport, capture time, and screenshot SHA-256. Design mockups and Figma exports are not proof.
4. Be stored in `docs/assets/screenshots/current/` with an ISO-date filename and metadata in `audit/screenshot-catalog.md`.
5. Be free of placeholder data labeled "TODO", "LOREM", or "PLACEHOLDER".

Blocked screenshots: blank screens, error pages, loading spinners, design-tool exports, AI-generated images, stale prior-session captures, or captures without exact source and route identity.'''
replace_exact(agents, old_agents_block, new_agents_block)

replace_exact(
    agents,
    "| `docs/A11OY_REPLIT_CODEX_DOCTRINE.md` | 11-step agent operating sequence |",
    "| `docs/A11OY_EXECUTION_ENVIRONMENT_DOCTRINE.md` | Provider-neutral, source-bound execution and proof environments |",
)

replace_exact(
    screenshot_doctrine,
    "1. **Be a live capture.** Taken from the running application in this Replit workspace using the PixelProof agent or equivalent live capture method. Not from a design tool, not from a static HTML file rendered outside the app, not from a prior session.",
    "1. **Be a live, source-bound capture.** Taken from the running application at an exact 40-character source revision in a repository-controlled environment. Accepted environments include GitHub Actions, a protected preview deployment, an authenticated cloud development environment, or a local exact-head checkout. No vendor-specific workspace is mandatory. Not from a design tool, an unrelated static export, or a prior session.",
)

replace_exact(
    screenshot_doctrine,
    "4. **Include a visible browser chrome or app frame.** The screenshot must be recognizable as a running application — not a cropped design or exported asset. The URL bar (or app route indicator for mobile) should be visible or noted in the catalog entry.",
    "4. **Bind the route and application frame.** Show browser chrome or an app frame when the capture method supports it. Headless captures are acceptable only with a metadata sidecar and catalog entry containing the exact route, viewport, source revision, capture environment, capture time, and screenshot SHA-256.",
)

replace_exact(
    screenshot_doctrine,
    "6. **Have a corresponding catalog entry.** Every screenshot used as proof must have an entry in `audit/screenshot-catalog.md` with filename, route, capture date, capturing agent, and associated Workcell ID or task number.",
    "6. **Have a corresponding catalog entry.** Every screenshot used as proof must have an entry in `audit/screenshot-catalog.md` with filename, route, capture date, capture environment, exact source revision, workflow run or command, viewport, screenshot SHA-256, capturing agent, and associated Workcell ID or task number.",
)

accepted_environments = '''## Accepted Capture Environments

A proof capture is environment-neutral but identity-strict. One of the following is acceptable:

1. **GitHub Actions** checking out the exact PR head or protected revision and uploading an immutable artifact.
2. **Protected preview deployment** whose served build identity is read back and equals the captured source revision.
3. **Authenticated cloud development environment** such as a Codespace or Cursor Cloud workspace pinned to the exact source revision.
4. **Local exact-head checkout** with the command, operating environment, source revision, and artifact digest recorded.

The provider is not the trust root. The trust root is the bound source revision, reproducible command or workflow, route, viewport, timestamp, and screenshot digest. A copied image without that identity is not current proof.
'''
insert_before(screenshot_doctrine, "## Blocked Screenshots", accepted_environments)

replace_exact(
    screenshot_doctrine,
    "| `captured_by` | Named agent (e.g., PixelProof) or human contributor |",
    "| `captured_by` | Named agent (e.g., PixelProof), GitHub Actions, or human contributor |",
)

manifest_anchor = "| `captured_by` | Named agent (e.g., PixelProof), GitHub Actions, or human contributor |\n"
manifest_extra = '''| `capture_environment` | `github-actions`, `protected-preview`, `codespace`, `cursor-cloud`, or `local-exact-head` |
| `source_revision` | Exact 40-character Git revision used for the running application |
| `workflow_run_or_command` | Immutable workflow run URL/ID or exact local capture command |
| `viewport` | Width and height used for the capture |
| `artifact_sha256` | SHA-256 of the committed screenshot bytes |
'''
text = screenshot_doctrine.read_text(encoding="utf-8")
if "| `capture_environment` |" not in text:
    if text.count(manifest_anchor) != 1:
        raise SystemExit("manifest field insertion anchor mismatch")
    screenshot_doctrine.write_text(text.replace(manifest_anchor, manifest_anchor + manifest_extra), encoding="utf-8")

execution_doctrine = ROOT / "docs" / "A11OY_EXECUTION_ENVIRONMENT_DOCTRINE.md"
execution_doctrine.write_text(
    '''# A11oy Execution Environment Doctrine

A11oy work is provider-neutral and source-bound. Replit is not required and is not an authority boundary.

## Authority

The accepted execution environment is any repository-controlled environment that can prove the exact source, commands, outputs, and limitations of the work. Accepted classes are:

- GitHub Actions;
- protected preview deployments;
- authenticated Codespaces or Cursor Cloud workspaces;
- local exact-head checkouts;
- another environment explicitly admitted by a protected doctrine change.

## Required identity

Every proof-producing run records:

1. repository and exact 40-character source revision;
2. workflow run URL/ID or exact command sequence;
3. dependency lockfile identity and runtime/toolchain versions;
4. route, viewport, and capture timestamp for UI evidence;
5. SHA-256 for every retained artifact;
6. test results and terminal failure state;
7. limitations, unavailable dependencies, and non-claims.

## GitHub-native default

GitHub Actions is the default shared execution rail because it checks out exact revisions, exposes immutable run identity, and retains artifacts. The repository workflow `.github/workflows/screenshot-proof.yml` provides the canonical UI capture path.

## Prohibited shortcuts

- treating a provider name as proof;
- copying a prior screenshot into the current directory without recapture;
- accepting a floating branch or unrecorded source revision;
- treating preview reachability as production readiness;
- silently replacing a failed capture with cached evidence;
- requiring a retired vendor workspace when an exact-source repository-controlled path exists.

## Migration note

`docs/A11OY_REPLIT_CODEX_DOCTRINE.md` is retained as historical compatibility documentation. Where it conflicts with this file, this provider-neutral doctrine and `AGENTS.md` govern.
''',
    encoding="utf-8",
)

capture_script = ROOT / "scripts" / "qa" / "capture-screenshot-proof.mjs"
capture_script.write_text(
    r'''import { createHash } from "node:crypto";
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
''',
    encoding="utf-8",
)

workflow = ROOT / ".github" / "workflows" / "screenshot-proof.yml"
workflow.write_text(
    '''name: Screenshot Proof

on:
  workflow_dispatch:
    inputs:
      source_revision:
        description: Exact 40-character revision to capture
        required: true
        type: string
      plan_path:
        description: Capture plan path at that revision
        required: false
        default: audit/screenshot-capture-plan.json
        type: string
  pull_request:
    branches: [main]
    paths:
      - 'audit/screenshot-capture-plan.json'
      - 'artifacts/a11oy/**'
      - 'packages/a11oy-runtime/**'
      - 'scripts/qa/capture-screenshot-proof.mjs'

permissions:
  contents: read

concurrency:
  group: screenshot-proof-${{ github.event.pull_request.number || inputs.source_revision || github.sha }}
  cancel-in-progress: true

env:
  NODE_OPTIONS: --max-old-space-size=6144

jobs:
  capture:
    runs-on: ubuntu-latest
    timeout-minutes: 35
    steps:
      - name: Resolve exact source revision
        id: source
        shell: bash
        run: |
          set -euo pipefail
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            sha='${{ inputs.source_revision }}'
          else
            sha='${{ github.event.pull_request.head.sha }}'
          fi
          [[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "::error::source revision must be an exact lowercase 40-character SHA"; exit 1; }
          echo "sha=$sha" >> "$GITHUB_OUTPUT"

      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: ${{ steps.source.outputs.sha }}
          persist-credentials: false

      - uses: pnpm/action-setup@0977fd99725f1db4007ccb2928dbb4e90d06cc86 # v6.0.10
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: '24'
          cache: pnpm

      - name: Install exact dependencies
        run: ONNXRUNTIME_NODE_INSTALL=skip pnpm install --frozen-lockfile

      - name: Install Chromium
        run: pnpm exec playwright install --with-deps chromium

      - name: Build A11oy
        run: pnpm --filter @workspace/a11oy run build
        env:
          BASE_PATH: /

      - name: Serve exact build
        shell: bash
        run: |
          set -euo pipefail
          pnpm exec serve artifacts/a11oy/dist/public -s -l 4110 > "$RUNNER_TEMP/a11oy-serve.log" 2>&1 &
          for attempt in {1..60}; do
            if curl --fail --silent --show-error http://127.0.0.1:4110/ >/dev/null; then
              exit 0
            fi
            sleep 1
          done
          cat "$RUNNER_TEMP/a11oy-serve.log"
          exit 1

      - name: Capture source-bound proof
        env:
          SCREENSHOT_PLAN: ${{ github.event_name == 'workflow_dispatch' && inputs.plan_path || 'audit/screenshot-capture-plan.json' }}
          SCREENSHOT_BASE_URL: http://127.0.0.1:4110
          SCREENSHOT_OUTPUT_DIR: screenshot-proof
          SOURCE_REVISION: ${{ steps.source.outputs.sha }}
          RUN_IDENTITY: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}/attempts/${{ github.run_attempt }}
          CAPTURE_ENVIRONMENT: github-actions
        run: node scripts/qa/capture-screenshot-proof.mjs

      - name: Upload immutable screenshot evidence
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: screenshot-proof-${{ steps.source.outputs.sha }}
          path: screenshot-proof/
          retention-days: 30
          if-no-files-found: error
''',
    encoding="utf-8",
)

proof = ROOT / "audit" / "PROVIDER_NEUTRAL_SCREENSHOT_PROOF_2026-08-18.md"
proof.write_text(
    '''# Provider-neutral screenshot proof migration

## Decision

Replit is no longer an available execution environment. Screenshot proof is now provider-neutral and exact-source-bound.

## Source changes

- root agent doctrine no longer requires Replit;
- screenshot doctrine requires exact source, route, viewport, environment, run/command identity, and artifact digest;
- a GitHub-native capture workflow and deterministic Playwright capture script are installed;
- the legacy Replit doctrine remains historical compatibility documentation only.

## Boundaries

This work changes doctrine and proof tooling. It does not claim that a prior screenshot was recaptured, that a deployment is production-ready, or that a screenshot alone proves backend behavior.
''',
    encoding="utf-8",
)

# Remove the one-shot applicator and its trigger workflow from the final tree.
for transient in (
    ROOT / "scripts" / "qa" / "apply-provider-neutral-screenshot-doctrine.py",
    ROOT / ".github" / "workflows" / "provider-neutral-screenshot-doctrine.yml",
):
    transient.unlink(missing_ok=True)

print("provider-neutral screenshot doctrine applied")
