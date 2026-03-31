#!/usr/bin/env node
"use strict";

/**
 * Forge App Bundle Script
 * Bundles all Forge handler source files for deployment via `forge deploy`.
 * Forge apps use their own runtime bundling; this script validates and prepares
 * the source structure expected by the Forge CLI.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const MANIFEST = path.join(ROOT, "manifest.yml");

const REQUIRED_HANDLERS = [
  "project-page.ts",
  "issue-panel.ts",
  "trigger-workflow.ts",
  "webhook-receiver.ts",
  "issue-status-sync.ts",
];

console.log("Bundling Jira Marketplace Forge app...\n");

if (!fs.existsSync(MANIFEST)) {
  console.error("ERROR: manifest.yml not found");
  process.exit(1);
}

let missing = [];
for (const handler of REQUIRED_HANDLERS) {
  const p = path.join(SRC, handler);
  if (!fs.existsSync(p)) missing.push(handler);
}
if (missing.length > 0) {
  console.error("ERROR: Missing handler files:\n" + missing.map(f => `  ✗ src/${f}`).join("\n"));
  process.exit(1);
}

console.log("All handler files present:");
for (const handler of REQUIRED_HANDLERS) {
  console.log(`  ✓ src/${handler}`);
}

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

const bundleManifest = {
  bundledAt: new Date().toISOString(),
  handlers: REQUIRED_HANDLERS,
  forgeRuntime: "nodejs18.x",
  deployCommand: "forge deploy",
  envCommand: "forge variables set --encrypt SZL_API_BASE <url>",
};
fs.writeFileSync(path.join(DIST, "bundle-manifest.json"), JSON.stringify(bundleManifest, null, 2));

const hasTsc = (() => {
  try { execSync("npx tsc --version", { stdio: "pipe" }); return true; } catch { return false; }
})();

if (hasTsc) {
  console.log("\nType-checking handler sources...");
  try {
    execSync("npx tsc --noEmit --allowJs --target esnext --moduleResolution node --skipLibCheck 2>&1 || true", {
      cwd: ROOT,
      stdio: "inherit",
    });
    console.log("Type check complete.");
  } catch {
    console.warn("Type check reported issues — review before deploying.");
  }
}

console.log(`\nBundle complete. Deploy with: forge deploy\nSet env: forge variables set --encrypt SZL_API_BASE <your-api-url>`);
