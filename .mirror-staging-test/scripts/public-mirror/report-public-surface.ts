#!/usr/bin/env tsx
/**
 * SZL Holdings — Public Surface Report Generator (TypeScript)
 *
 * Scans the workspace (or a staged mirror directory) and produces
 * a comprehensive public surface inventory report. Flags noisy paths,
 * classifies all content, and writes a human-readable markdown report.
 *
 * Usage:
 *   tsx scripts/public-mirror/report-public-surface.ts [target-dir]
 *
 * Defaults:
 *   target-dir: . (current workspace root)
 *
 * Output:
 *   docs/audit/public-mirror-report.md (updated)
 *   Console summary
 */

import fs from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../.."
);
const TARGET = process.argv[2] ?? WORKSPACE_ROOT;
const REPORT_PATH = path.join(WORKSPACE_ROOT, "docs/audit/public-mirror-report.md");

// ─── Classification Rules ────────────────────────────────────────────────────

interface ContentClass {
  label: string;
  category: "included" | "excluded" | "flagged" | "noisy";
  reason: string;
}

const ROOT_DIR_CLASSIFICATIONS: Record<string, ContentClass> = {
  artifacts: { label: "artifacts/", category: "included", reason: "Application source code — all 16 artifacts" },
  lib: { label: "lib/", category: "included", reason: "Shared TypeScript libraries (8 packages)" },
  packages: { label: "packages/", category: "included", reason: "Marketplace integration packages" },
  docs: { label: "docs/", category: "included", reason: "Architecture, trust, investor, buyer, release docs" },
  infra: { label: "infra/", category: "included", reason: "Azure Bicep IaC templates" },
  scripts: { label: "scripts/", category: "included", reason: "Build, mirror, and automation scripts" },
  "profile-readme": { label: "profile-readme/", category: "included", reason: "GitHub profile README content" },
  ops: { label: "ops/", category: "included", reason: "GitHub operations and automation" },
  ".github": { label: ".github/", category: "included", reason: "PR templates, issue templates, CI workflows" },
  tests: { label: "tests/", category: "included", reason: "Integration and E2E test suite" },
  ".archive": { label: ".archive/", category: "excluded", reason: "Historical/archived work — internal cleanup" },
  ".git-rewrite": { label: ".git-rewrite/", category: "excluded", reason: "Git history rewrite artifacts" },
  backups: { label: "backups/", category: "excluded", reason: "CRITICAL — database backups with SQL dumps" },
  exports: { label: "exports/", category: "excluded", reason: "Internal export artifacts" },
  "test-results": { label: "test-results/", category: "excluded", reason: "CI/test output — operational noise" },
  attached_assets: { label: "attached_assets/", category: "excluded", reason: "Raw user-uploaded files — unsorted" },
  "social-content": { label: "social-content/", category: "excluded", reason: "Draft social media content" },
  "spfx-webparts": { label: "spfx-webparts/", category: "excluded", reason: "Internal SharePoint tooling" },
  ".local": { label: ".local/", category: "excluded", reason: "Replit agent workspace state" },
  ".cache": { label: ".cache/", category: "excluded", reason: "Build cache — transient" },
  node_modules: { label: "node_modules/", category: "excluded", reason: "Dependencies — install via pnpm install" },
  ".agents": { label: ".agents/", category: "excluded", reason: "Replit agent configuration" },
  ".config": { label: ".config/", category: "excluded", reason: "Replit internal config" },
  ".upm": { label: ".upm/", category: "excluded", reason: "Replit package manager state" },
};

const ROOT_FILE_CLASSIFICATIONS: Record<string, ContentClass> = {
  "README.md": { label: "README.md", category: "included", reason: "Primary repo entry point — investor-grade" },
  "CHANGELOG.md": { label: "CHANGELOG.md", category: "included", reason: "Version history and release discipline" },
  "SECURITY.md": { label: "SECURITY.md", category: "included", reason: "Responsible disclosure policy" },
  "CONTRIBUTING.md": { label: "CONTRIBUTING.md", category: "included", reason: "Engineering standards and culture" },
  "LICENSE.md": { label: "LICENSE.md", category: "included", reason: "Proprietary license notice" },
  "CODEOWNERS": { label: "CODEOWNERS", category: "included", reason: "Code ownership and governance" },
  "package.json": { label: "package.json", category: "included", reason: "Workspace root config" },
  "pnpm-workspace.yaml": { label: "pnpm-workspace.yaml", category: "included", reason: "Monorepo package declarations" },
  "tsconfig.json": { label: "tsconfig.json", category: "included", reason: "TypeScript project config" },
  "tsconfig.base.json": { label: "tsconfig.base.json", category: "included", reason: "TypeScript shared base config" },
  "eslint.config.js": { label: "eslint.config.js", category: "included", reason: "Lint configuration" },
  ".env.example": { label: ".env.example", category: "included", reason: "Sanitized environment variable template" },
  ".gitignore": { label: ".gitignore", category: "included", reason: "Git exclusion policy" },
  "playwright.config.ts": { label: "playwright.config.ts", category: "included", reason: "E2E test config" },
  "vitest.config.ts": { label: "vitest.config.ts", category: "included", reason: "Unit test config" },
  "vitest.components.config.ts": { label: "vitest.components.config.ts", category: "included", reason: "Component test config" },
  ".prettierrc.cjs": { label: ".prettierrc.cjs", category: "included", reason: "Code formatting config" },
  ".lighthouserc.json": { label: ".lighthouserc.json", category: "included", reason: "Lighthouse CI config" },
  "ROADMAP.md": { label: "ROADMAP.md", category: "noisy", reason: "Redundant with CHANGELOG + docs/releases/ — quarantine from root" },
  "ECOSYSTEM_ROADMAP.md": { label: "ECOSYSTEM_ROADMAP.md", category: "noisy", reason: "Redundant with docs/architecture/platform-map.md — quarantine from root" },
  "PUBLIC_RELEASE_NOTES.md": { label: "PUBLIC_RELEASE_NOTES.md", category: "noisy", reason: "Superseded by docs/releases/ — quarantine from root" },
  "PUBLIC_REPO_AUDIT_REPORT.md": { label: "PUBLIC_REPO_AUDIT_REPORT.md", category: "noisy", reason: "Superseded by docs/audit/ — quarantine from root" },
  "LICENSE": { label: "LICENSE", category: "noisy", reason: "Duplicate of LICENSE.md — remove" },
  ".replit": { label: ".replit", category: "excluded", reason: "Replit internal configuration" },
  ".replitignore": { label: ".replitignore", category: "excluded", reason: "Replit internal" },
  "replit.nix": { label: "replit.nix", category: "excluded", reason: "Replit NixOS config — internal" },
  "replit.md": { label: "replit.md", category: "excluded", reason: "Replit agent memory — internal" },
  ".watchmanconfig": { label: ".watchmanconfig", category: "excluded", reason: "Watchman file watcher config — internal" },
  ".npmrc": { label: ".npmrc", category: "excluded", reason: "npm config — Replit-specific" },
  "pnpm-lock.yaml": { label: "pnpm-lock.yaml", category: "included", reason: "Lock file for reproducible installs" },
};

// ─── Counting ────────────────────────────────────────────────────────────────

interface SurfaceInventory {
  includedDirs: string[];
  excludedDirs: string[];
  noisyDirs: string[];
  flaggedDirs: string[];
  includedFiles: string[];
  excludedFiles: string[];
  noisyFiles: string[];
  unknownDirs: string[];
  unknownFiles: string[];
  totalFiles: number;
  totalDirs: number;
}

function buildInventory(): SurfaceInventory {
  const inv: SurfaceInventory = {
    includedDirs: [],
    excludedDirs: [],
    noisyDirs: [],
    flaggedDirs: [],
    includedFiles: [],
    excludedFiles: [],
    noisyFiles: [],
    unknownDirs: [],
    unknownFiles: [],
    totalFiles: 0,
    totalDirs: 0,
  };

  if (!fs.existsSync(TARGET)) {
    return inv;
  }

  const entries = fs.readdirSync(TARGET, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      inv.totalDirs++;
      const cls = ROOT_DIR_CLASSIFICATIONS[entry.name];
      if (cls) {
        switch (cls.category) {
          case "included": inv.includedDirs.push(entry.name); break;
          case "excluded": inv.excludedDirs.push(entry.name); break;
          case "noisy": inv.noisyDirs.push(entry.name); break;
          case "flagged": inv.flaggedDirs.push(entry.name); break;
        }
      } else {
        inv.unknownDirs.push(entry.name);
      }
    } else if (entry.isFile()) {
      inv.totalFiles++;
      const cls = ROOT_FILE_CLASSIFICATIONS[entry.name];
      if (cls) {
        switch (cls.category) {
          case "included": inv.includedFiles.push(entry.name); break;
          case "excluded": inv.excludedFiles.push(entry.name); break;
          case "noisy": inv.noisyFiles.push(entry.name); break;
          case "flagged": inv.flaggedDirs.push(entry.name); break;
        }
      } else {
        inv.unknownFiles.push(entry.name);
      }
    }
  }

  return inv;
}

function countDirFiles(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) count++;
    else if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".git") {
      count += countDirFiles(path.join(dirPath, entry.name));
    }
  }
  return count;
}

// ─── Report Writing ──────────────────────────────────────────────────────────

function log(msg: string): void {
  process.stdout.write(msg + "\n");
}

function writeReport(inv: SurfaceInventory): void {
  const date = new Date().toISOString().replace("T", " ").split(".")[0] + " UTC";

  const lines: string[] = [
    "# Public Mirror Surface Report",
    "",
    `**Generated:** ${date}`,
    `**Target:** ${TARGET}`,
    "",
    "## Executive Summary",
    "",
    `| Category | Count |`,
    `|----------|-------|`,
    `| Included root directories | ${inv.includedDirs.length} |`,
    `| Excluded root directories | ${inv.excludedDirs.length} |`,
    `| Noisy root items (action required) | ${inv.noisyDirs.length + inv.noisyFiles.length} |`,
    `| Unknown root items | ${inv.unknownDirs.length + inv.unknownFiles.length} |`,
    `| Total root files | ${inv.totalFiles} |`,
    `| Total root directories | ${inv.totalDirs} |`,
    "",
    "## Included Root Directories",
    "",
    "| Directory | File Count | Purpose |",
    "|-----------|------------|---------|",
  ];

  for (const dir of inv.includedDirs) {
    const cls = ROOT_DIR_CLASSIFICATIONS[dir];
    const count = countDirFiles(path.join(TARGET, dir));
    lines.push(`| \`${dir}/\` | ${count} | ${cls?.reason ?? "—"} |`);
  }

  lines.push(
    "",
    "## Excluded Root Directories",
    "",
    "| Directory | Reason |",
    "|-----------|--------|"
  );

  for (const dir of inv.excludedDirs) {
    const cls = ROOT_DIR_CLASSIFICATIONS[dir];
    const exists = fs.existsSync(path.join(TARGET, dir));
    const icon = exists ? "⚠️ Present" : "✅ Absent";
    lines.push(`| \`${dir}/\` | ${icon} — ${cls?.reason ?? "Policy exclusion"} |`);
  }

  lines.push(
    "",
    "## Noisy Items (Action Required)",
    "",
    "These items exist at root but should be quarantined or removed before mirror push:",
    "",
    "| Item | Action | Reason |",
    "|------|--------|--------|"
  );

  for (const dir of inv.noisyDirs) {
    const cls = ROOT_DIR_CLASSIFICATIONS[dir];
    lines.push(`| \`${dir}/\` | Quarantine | ${cls?.reason ?? "Noisy"} |`);
  }
  for (const file of inv.noisyFiles) {
    const cls = ROOT_FILE_CLASSIFICATIONS[file];
    lines.push(`| \`${file}\` | Quarantine | ${cls?.reason ?? "Noisy"} |`);
  }

  if (inv.unknownDirs.length > 0 || inv.unknownFiles.length > 0) {
    lines.push(
      "",
      "## Unknown Root Items (Review Required)",
      "",
      "These items are not classified in the surface policy. Review before mirror push:",
      "",
      "| Item | Type | Recommendation |",
      "|------|------|---------------|"
    );
    for (const dir of inv.unknownDirs) {
      lines.push(`| \`${dir}/\` | Directory | Classify and add to policy |`);
    }
    for (const file of inv.unknownFiles) {
      lines.push(`| \`${file}\` | File | Classify and add to policy |`);
    }
  }

  lines.push(
    "",
    "## Included Root Files",
    "",
    "| File | Purpose |",
    "|------|---------|"
  );

  for (const file of inv.includedFiles) {
    const cls = ROOT_FILE_CLASSIFICATIONS[file];
    lines.push(`| \`${file}\` | ${cls?.reason ?? "—"} |`);
  }

  lines.push(
    "",
    "## Mirror Readiness",
    "",
    `| Check | Status |`,
    `|-------|--------|`,
    `| Noisy items resolved | ${inv.noisyDirs.length + inv.noisyFiles.length === 0 ? "✅ Clean" : "⚠️ " + (inv.noisyDirs.length + inv.noisyFiles.length) + " item(s) to resolve"} |`,
    `| Unknown items reviewed | ${inv.unknownDirs.length + inv.unknownFiles.length === 0 ? "✅ All classified" : "⚠️ " + (inv.unknownDirs.length + inv.unknownFiles.length) + " to classify"} |`,
    "",
    "## Actions Required Before Mirror Push",
    ""
  );

  const actions: string[] = [];
  if (inv.noisyFiles.includes("ROADMAP.md")) actions.push("- Move `ROADMAP.md` to `.archive/root-cleanup/`");
  if (inv.noisyFiles.includes("ECOSYSTEM_ROADMAP.md")) actions.push("- Move `ECOSYSTEM_ROADMAP.md` to `.archive/root-cleanup/`");
  if (inv.noisyFiles.includes("PUBLIC_RELEASE_NOTES.md")) actions.push("- Move `PUBLIC_RELEASE_NOTES.md` to `.archive/root-cleanup/`");
  if (inv.noisyFiles.includes("PUBLIC_REPO_AUDIT_REPORT.md")) actions.push("- Move `PUBLIC_REPO_AUDIT_REPORT.md` to `.archive/root-cleanup/`");
  if (inv.noisyFiles.includes("LICENSE")) actions.push("- Remove duplicate `LICENSE` file (keep `LICENSE.md`)");

  if (actions.length === 0) {
    lines.push("No cleanup actions required. Root is clean.");
  } else {
    lines.push(...actions);
  }

  lines.push(
    "",
    "## Next Steps",
    "",
    "1. Run `tsx scripts/public-mirror/prepare-public-mirror.ts` to stage the mirror",
    "2. Run `tsx scripts/public-mirror/validate-public-surface.ts .mirror-staging` to validate",
    "3. Review validation report at `docs/audit/public-mirror-report.md`",
    "4. Push to GitHub: `ops/github/commands.sh` (requires `gh auth login`)",
    "",
    "*Generated by `scripts/public-mirror/report-public-surface.ts`*"
  );

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, lines.join("\n") + "\n", "utf-8");
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  log("=== SZL Holdings — Public Surface Report (TypeScript) ===");
  log(`Scanning: ${TARGET}`);
  log("");

  const inv = buildInventory();

  log(`Root directories: ${inv.totalDirs} (${inv.includedDirs.length} included, ${inv.excludedDirs.length} excluded, ${inv.noisyDirs.length} noisy, ${inv.unknownDirs.length} unknown)`);
  log(`Root files: ${inv.totalFiles} (${inv.includedFiles.length} included, ${inv.excludedFiles.length} excluded, ${inv.noisyFiles.length} noisy)`);

  if (inv.noisyDirs.length + inv.noisyFiles.length > 0) {
    log("");
    log("Noisy items requiring action:");
    for (const d of inv.noisyDirs) log(`  ! ${d}/`);
    for (const f of inv.noisyFiles) log(`  ! ${f}`);
  }

  if (inv.unknownDirs.length + inv.unknownFiles.length > 0) {
    log("");
    log("Unknown items requiring classification:");
    for (const d of inv.unknownDirs) log(`  ? ${d}/`);
    for (const f of inv.unknownFiles) log(`  ? ${f}`);
  }

  writeReport(inv);

  log("");
  log(`Report saved to: ${path.relative(WORKSPACE_ROOT, REPORT_PATH)}`);
  log("");
  log("Run `tsx scripts/public-mirror/prepare-public-mirror.ts` to stage the mirror.");
}

main();
