#!/usr/bin/env tsx
/**
 * SZL Holdings — Public Mirror Validation Script (TypeScript)
 *
 * Validates a staged mirror directory against the public surface policy.
 * Produces a markdown report at docs/audit/public-mirror-report.md.
 *
 * Usage:
 *   tsx scripts/public-mirror/validate-public-surface.ts [target-dir]
 *
 * Defaults:
 *   target-dir: . (current workspace)
 *
 * Exit codes:
 *   0 = PASSED
 *   1 = FAILED (errors found)
 */

import fs from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../.."
);
const TARGET = process.argv[2] ?? WORKSPACE_ROOT;
const REPORT_PATH = path.join(WORKSPACE_ROOT, "docs/audit/public-mirror-report.md");

// ─── Policy Definitions ──────────────────────────────────────────────────────

const EXCLUDED_DIRS = [
  ".archive",
  ".git-rewrite",
  "backups",
  "exports",
  "scratch",
  "temp",
  "tmp",
  "test-results",
  "attached_assets",
  "social-content",
  "spfx-webparts",
  ".local",
  ".cache",
  ".canvas",
  ".cursor",
];

const SECRET_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/, label: "OpenAI API key" },
  { pattern: /AKIA[A-Z0-9]{16}/, label: "AWS access key" },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, label: "GitHub personal token" },
  { pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/, label: "Hardcoded password" },
  { pattern: /sk_live_[a-zA-Z0-9]{20,}/, label: "Stripe live key" },
  { pattern: /rk_live_[a-zA-Z0-9]{20,}/, label: "Stripe restricted live key" },
];

const REQUIRED_ROOT_FILES = [
  "README.md",
  "LICENSE.md",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md",
  "CODEOWNERS",
];

const REQUIRED_DOCS = [
  "docs/architecture/system-overview.md",
  "docs/architecture/platform-map.md",
  "docs/architecture/data-flow.md",
  "docs/trust/trust-center.md",
  "docs/trust/security-posture.md",
  "docs/investor/platform-thesis.md",
  "docs/investor/product-readiness.md",
  "docs/releases/v0.1.0.md",
  "docs/public/public-mirror-policy.md",
];

const REQUIRED_GITHUB_FILES = [
  ".github/CODEOWNERS",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/bug_report.md",
  ".github/ISSUE_TEMPLATE/feature_request.md",
];

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".yaml", ".yml"]);
const MAX_SECRET_SCAN_FILES = 200;

// ─── State ───────────────────────────────────────────────────────────────────

interface CheckResult {
  label: string;
  status: "OK" | "ERROR" | "WARNING";
  detail?: string;
}

const results: CheckResult[] = [];
let errors = 0;
let warnings = 0;

// ─── Utilities ───────────────────────────────────────────────────────────────

function log(msg: string): void {
  process.stdout.write(msg + "\n");
}

function addResult(label: string, status: CheckResult["status"], detail?: string): void {
  results.push({ label, status, detail });
  if (status === "ERROR") errors++;
  if (status === "WARNING") warnings++;
}

function walkFiles(dir: string, callback: (filePath: string) => void, count = { n: 0 }): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (count.n >= MAX_SECRET_SCAN_FILES) return;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walkFiles(fullPath, callback, count);
    } else if (entry.isFile()) {
      count.n++;
      callback(fullPath);
    }
  }
}

function findDirRecursive(rootDir: string, targetName: string): string[] {
  const found: string[] = [];
  if (!fs.existsSync(rootDir)) return found;

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      if (entry.name === targetName) {
        found.push(path.relative(rootDir, fullPath));
      } else {
        walk(fullPath);
      }
    }
  }

  walk(rootDir);
  return found;
}

// ─── Checks ──────────────────────────────────────────────────────────────────

function checkExcludedDirs(): void {
  log("--- Checking excluded directories ---");
  for (const dirName of EXCLUDED_DIRS) {
    // Check root level
    const rootLevel = path.join(TARGET, dirName);
    if (fs.existsSync(rootLevel)) {
      addResult(`Excluded directory: ${dirName}/`, "ERROR", `Found at root level`);
    }
    // Check nested
    const nested = findDirRecursive(TARGET, dirName);
    for (const n of nested) {
      if (n !== dirName) {
        addResult(`Nested excluded directory: ${n}`, "ERROR");
      }
    }
  }
  log("  Done.");
}

function checkEnvFiles(): void {
  log("--- Checking for .env files ---");
  const found: string[] = [];

  walkFiles(TARGET, (filePath) => {
    const name = path.basename(filePath);
    if (name === ".env" || name.startsWith(".env.") || name.endsWith(".env")) {
      found.push(path.relative(TARGET, filePath));
    }
  });

  if (found.length > 0) {
    addResult("Environment files", "ERROR", found.slice(0, 5).join(", "));
  } else {
    addResult("Environment files", "OK");
  }
  log("  Done.");
}

function checkSecretPatterns(): void {
  log("--- Scanning for secret patterns ---");
  const hits: string[] = [];

  walkFiles(TARGET, (filePath) => {
    const ext = path.extname(filePath);
    if (!SCAN_EXTENSIONS.has(ext)) return;
    if (path.basename(filePath) === ".env.example") return;

    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      return;
    }

    for (const { pattern, label } of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        hits.push(`${path.relative(TARGET, filePath)} (${label})`);
      }
    }
  });

  if (hits.length > 0) {
    addResult("Secret patterns", "ERROR", hits.slice(0, 5).join("; "));
  } else {
    addResult("Secret patterns", "OK");
  }
  log("  Done.");
}

function checkDatabaseDumps(): void {
  log("--- Checking for database dumps ---");
  const dumps: string[] = [];

  walkFiles(TARGET, (filePath) => {
    const name = path.basename(filePath);
    if (/\.(sql\.gz|dump|pgdump)$/.test(name)) {
      dumps.push(path.relative(TARGET, filePath));
    }
  });

  if (dumps.length > 0) {
    addResult("Database dumps", "ERROR", dumps.slice(0, 5).join(", "));
  } else {
    addResult("Database dumps", "OK");
  }
  log("  Done.");
}

function checkInternalDocs(): void {
  log("--- Checking for internal-only docs ---");
  const internalPath = path.join(TARGET, "docs", "internal");
  if (fs.existsSync(internalPath)) {
    addResult("Internal docs (docs/internal/)", "ERROR", "Internal documentation found in mirror");
  } else {
    addResult("Internal docs (docs/internal/)", "OK");
  }
  log("  Done.");
}

function checkRequiredRootFiles(): void {
  log("--- Checking required root files ---");
  for (const file of REQUIRED_ROOT_FILES) {
    const filePath = path.join(TARGET, file);
    if (fs.existsSync(filePath)) {
      addResult(`Root: ${file}`, "OK");
    } else {
      addResult(`Root: ${file}`, "WARNING", "Missing required root file");
    }
  }
  log("  Done.");
}

function checkRequiredDocs(): void {
  log("--- Checking required documentation ---");
  for (const doc of REQUIRED_DOCS) {
    const docPath = path.join(TARGET, doc);
    if (fs.existsSync(docPath)) {
      addResult(`Doc: ${doc}`, "OK");
    } else {
      addResult(`Doc: ${doc}`, "WARNING", "Missing expected documentation");
    }
  }
  log("  Done.");
}

function checkGitHubFiles(): void {
  log("--- Checking GitHub templates ---");
  for (const ghf of REQUIRED_GITHUB_FILES) {
    const ghfPath = path.join(TARGET, ghf);
    if (fs.existsSync(ghfPath)) {
      addResult(`GitHub: ${ghf}`, "OK");
    } else {
      addResult(`GitHub: ${ghf}`, "WARNING", "Missing GitHub template");
    }
  }
  log("  Done.");
}

function checkReadmeContent(): void {
  log("--- Checking README content ---");
  const readmePath = path.join(TARGET, "README.md");
  if (!fs.existsSync(readmePath)) {
    addResult("README.md content", "ERROR", "README.md not found");
    return;
  }

  const content = fs.readFileSync(readmePath, "utf-8");
  const checks = [
    { label: "Has product description", test: content.includes("SZL Holdings") },
    { label: "Has architecture section", test: content.includes("Architecture") || content.includes("Stack") },
    { label: "Has contact information", test: content.includes("Contact") || content.includes("szlholdings.com") },
    { label: "Has trust/license notice", test: content.includes("License") || content.includes("Proprietary") },
  ];

  for (const check of checks) {
    addResult(`README: ${check.label}`, check.test ? "OK" : "WARNING");
  }
  log("  Done.");
}

// ─── Report Generation ───────────────────────────────────────────────────────

function writeReport(): void {
  const date = new Date().toISOString().replace("T", " ").split(".")[0] + " UTC";
  const statusLabel = errors > 0 ? "FAILED" : "PASSED";

  const lines: string[] = [
    "# Public Mirror Validation Report",
    "",
    `**Date:** ${date}`,
    `**Target:** ${TARGET}`,
    `**Status:** ${statusLabel}`,
    "",
    "## Summary",
    "",
    `| Metric | Count |`,
    `|--------|-------|`,
    `| Errors | ${errors} |`,
    `| Warnings | ${warnings} |`,
    `| Passed checks | ${results.filter((r) => r.status === "OK").length} |`,
    `| Total checks | ${results.length} |`,
    "",
    "## Check Results",
    "",
    "| Check | Status | Detail |",
    "|-------|--------|--------|",
  ];

  for (const r of results) {
    const icon = r.status === "OK" ? "✅" : r.status === "ERROR" ? "❌" : "⚠️";
    lines.push(`| ${r.label} | ${icon} ${r.status} | ${r.detail ?? ""} |`);
  }

  lines.push(
    "",
    "## Checks Performed",
    "",
    "- Excluded directory scan (root + recursive)",
    "- Environment file detection",
    "- Secret pattern grep (API keys, tokens, passwords)",
    "- Database dump detection",
    "- Internal-only documentation check",
    "- Required root trust files",
    "- Documentation structure completeness",
    "- GitHub template presence",
    "- README content quality",
    "",
    `## Decision`,
    "",
    errors > 0
      ? `**STATUS: FAILED** — ${errors} error(s) must be resolved before publishing the mirror.`
      : `**STATUS: PASSED** — Mirror is clean and ready to publish.`,
    "",
    "*Generated by `scripts/public-mirror/validate-public-surface.ts`*"
  );

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n") + "\n", "utf-8");
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  log("=== SZL Holdings — Public Mirror Validation (TypeScript) ===");
  log(`Scanning: ${TARGET}`);
  log("");

  checkExcludedDirs();
  log("");
  checkEnvFiles();
  log("");
  checkSecretPatterns();
  log("");
  checkDatabaseDumps();
  log("");
  checkInternalDocs();
  log("");
  checkRequiredRootFiles();
  log("");
  checkRequiredDocs();
  log("");
  checkGitHubFiles();
  log("");
  checkReadmeContent();

  log("");
  log("=== Validation Summary ===");
  log(`Errors:   ${errors}`);
  log(`Warnings: ${warnings}`);
  log(`Passed:   ${results.filter((r) => r.status === "OK").length} / ${results.length}`);
  log(`Status:   ${errors > 0 ? "FAILED — fix errors before publishing" : "PASSED"}`);

  writeReport();
  log(`\nReport saved to: ${path.relative(WORKSPACE_ROOT, REPORT_PATH)}`);

  process.exit(errors > 0 ? 1 : 0);
}

main();
