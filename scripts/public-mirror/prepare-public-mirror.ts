#!/usr/bin/env tsx
/**
 * SZL Holdings — Public Mirror Preparation Script (TypeScript)
 *
 * Scans the workspace, applies the inclusion/exclusion policy, stages
 * a clean public-mirror directory, and produces an exclusion report.
 *
 * Usage:
 *   tsx scripts/public-mirror/prepare-public-mirror.ts [target-dir]
 *
 * Defaults:
 *   target-dir: .mirror-staging
 */

import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const MIRROR_DIR = process.argv[2] ?? path.join(WORKSPACE_ROOT, '.mirror-staging');

// ─── Inclusion Policy ────────────────────────────────────────────────────────

const INCLUDE_DIRS = [
  'artifacts',
  'lib',
  'packages',
  'docs',
  'infra',
  'scripts',
  'profile-readme',
  'ops',
  '.github',
  'tests',
] as const;

const INCLUDE_ROOT_FILES = [
  'README.md',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'LICENSE.md',
  'SECURITY.md',
  'CODEOWNERS',
  'package.json',
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
  'tsconfig.json',
  'tsconfig.base.json',
  '.gitignore',
  '.env.example',
  'eslint.config.js',
  '.prettierrc.cjs',
  'playwright.config.ts',
  'vitest.config.ts',
  'vitest.components.config.ts',
  '.lighthouserc.json',
] as const;

// ─── Exclusion Policy ────────────────────────────────────────────────────────

const EXCLUDE_DIR_NAMES = new Set([
  '.archive',
  '.git-rewrite',
  'backups',
  'exports',
  'scratch',
  'temp',
  'tmp',
  'test-results',
  'attached_assets',
  'social-content',
  '.local',
  '.cache',
  '.canvas',
  '.cursor',
  '.upm',
  '.config',
  'node_modules',
  'dist',
  '.expo',
  '.expo-shared',
  'coverage',
]);

// .env.example is explicitly allowed (sanitized public template).
// All other .env variants are excluded.
const EXCLUDE_FILE_PATTERNS: { re: RegExp; allow?: RegExp }[] = [
  { re: /^\.env$/ },
  { re: /^\.env\./, allow: /^\.env\.example$/ },
  { re: /\.env$/, allow: /^\.env\.example$/ },
  { re: /\.env\.local$/ },
  { re: /\.sql\.gz$/ },
  { re: /\.dump$/ },
  { re: /\.pgdump$/ },
  { re: /\.bak$/ },
  { re: /\.backup$/ },
  { re: /\.tsbuildinfo$/ },
  { re: /\.log$/ },
];

const EXCLUDE_ROOT_FILES = new Set([
  'PUBLIC_RELEASE_NOTES.md',
  'PUBLIC_REPO_AUDIT_REPORT.md',
  'ECOSYSTEM_ROADMAP.md',
  'ROADMAP.md',
  'LICENSE',
  '.replit',
  '.replitignore',
  'replit.nix',
  '.watchmanconfig',
  '.npmrc',
]);

// Relative path segments that should be excluded wherever they appear in the tree.
// Matched against the full relative path from workspace root.
const EXCLUDE_PATH_SEGMENTS: RegExp[] = [
  // Any docs/internal directory at any depth
  /(?:^|\/)docs\/internal(?:\/|$)/,
  // Any .github/instructions directory (Replit agent config)
  /(?:^|\/)\.github\/instructions(?:\/|$)/,
];

// ─── State ───────────────────────────────────────────────────────────────────

interface StagingReport {
  includedDirs: string[];
  includedFiles: string[];
  excludedPaths: string[];
  warnings: string[];
  totalFiles: number;
  totalSizeBytes: number;
}

const report: StagingReport = {
  includedDirs: [],
  includedFiles: [],
  excludedPaths: [],
  warnings: [],
  totalFiles: 0,
  totalSizeBytes: 0,
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function log(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

function isFileExcluded(filePath: string): boolean {
  const name = path.basename(filePath);
  return EXCLUDE_FILE_PATTERNS.some(({ re, allow }) => {
    if (!re.test(name)) return false;
    if (allow?.test(name)) return false;
    return true;
  });
}

function isDirExcluded(dirName: string): boolean {
  return EXCLUDE_DIR_NAMES.has(dirName);
}

function isPathSegmentExcluded(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/');
  return EXCLUDE_PATH_SEGMENTS.some((re) => re.test(normalized));
}

function copyDirRecursive(src: string, dest: string, relativeBase: string): void {
  if (!fs.existsSync(src)) return;

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const relPath = path.join(relativeBase, entry.name);

    if (entry.isDirectory()) {
      if (isDirExcluded(entry.name)) {
        report.excludedPaths.push(`${relPath}/`);
        continue;
      }
      if (isPathSegmentExcluded(relPath)) {
        report.excludedPaths.push(`${relPath}/`);
        continue;
      }
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath, relPath);
    } else if (entry.isFile()) {
      if (isFileExcluded(entry.name)) {
        report.excludedPaths.push(relPath);
        continue;
      }
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
      report.totalFiles++;
      report.totalSizeBytes += fs.statSync(srcPath).size;
    }
  }
}

function verifyNoLeaks(stagingDir: string): void {
  for (const excludedDir of EXCLUDE_DIR_NAMES) {
    const leakPath = path.join(stagingDir, excludedDir);
    if (fs.existsSync(leakPath)) {
      report.warnings.push(`Leaked excluded directory detected and removed: ${excludedDir}/`);
      fs.rmSync(leakPath, { recursive: true, force: true });
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function writeExclusionReport(stagingDir: string): void {
  const reportPath = path.join(WORKSPACE_ROOT, 'docs/audit/public-mirror-exclusion-list.md');
  const date = new Date().toISOString().split('T')[0];

  const lines: string[] = [
    '# Public Mirror Exclusion List',
    '',
    `**Generated:** ${date}`,
    `**Staging Directory:** ${stagingDir}`,
    '',
    '## Excluded Paths',
    '',
    '| Path | Reason |',
    '|------|--------|',
  ];

  for (const excluded of report.excludedPaths) {
    let reason = 'Policy exclusion';
    if (excluded.includes('backups')) reason = 'Database backups — security risk';
    else if (excluded.includes('social-content'))
      reason = 'Draft social content — not public-ready';
    else if (excluded.includes('attached_assets')) reason = 'Unsorted user uploads';
    else if (excluded.includes('.local')) reason = 'Replit agent workspace';
    else if (excluded.includes('test-results')) reason = 'CI/test output';
    else if (excluded.includes('exports')) reason = 'Internal export artifacts';
    else if (excluded.includes('.archive')) reason = 'Historical cleanup artifacts';
    else if (excluded.includes('.git-rewrite')) reason = 'Git history rewrite artifacts';
    else if (excluded.includes('node_modules')) reason = 'Install via pnpm install';
    else if (excluded.includes('dist')) reason = 'Build output';
    else if (excluded.includes('docs/internal')) reason = 'Internal strategy documentation';
    else if (/\.(env|sql\.gz|dump|pgdump|bak|backup)$/.test(excluded))
      reason = 'Secret or sensitive data';
    lines.push(`| \`${excluded}\` | ${reason} |`);
  }

  if (report.warnings.length > 0) {
    lines.push('', '## Warnings', '');
    for (const w of report.warnings) {
      lines.push(`- ${w}`);
    }
  }

  lines.push(
    '',
    '## Summary',
    '',
    `- Excluded paths: ${report.excludedPaths.length}`,
    `- Warnings: ${report.warnings.length}`,
    `- Staged files: ${report.totalFiles}`,
    `- Staged size: ${formatBytes(report.totalSizeBytes)}`,
    '',
    '*Generated by `scripts/public-mirror/prepare-public-mirror.ts`*',
  );

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf-8');
  log(`\nExclusion report saved to: ${path.relative(WORKSPACE_ROOT, reportPath)}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main(): void {
  log('=== SZL Holdings — Public Mirror Preparation (TypeScript) ===');
  log(`Source: ${WORKSPACE_ROOT}`);
  log(`Target: ${MIRROR_DIR}`);
  log('');

  // Clean staging directory
  if (fs.existsSync(MIRROR_DIR)) {
    fs.rmSync(MIRROR_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(MIRROR_DIR, { recursive: true });

  // Copy included directories
  log('--- Copying included directories ---');
  for (const dir of INCLUDE_DIRS) {
    const srcPath = path.join(WORKSPACE_ROOT, dir);
    if (fs.existsSync(srcPath)) {
      log(`  + ${dir}/`);
      const destPath = path.join(MIRROR_DIR, dir);
      fs.mkdirSync(destPath, { recursive: true });
      copyDirRecursive(srcPath, destPath, dir);
      report.includedDirs.push(dir);
    } else {
      log(`  - ${dir}/ (not found — skipping)`);
    }
  }

  // Copy root files
  log('');
  log('--- Copying root files ---');
  for (const file of INCLUDE_ROOT_FILES) {
    if (EXCLUDE_ROOT_FILES.has(file)) {
      report.excludedPaths.push(file);
      continue;
    }
    const srcPath = path.join(WORKSPACE_ROOT, file);
    if (fs.existsSync(srcPath)) {
      log(`  + ${file}`);
      fs.copyFileSync(srcPath, path.join(MIRROR_DIR, file));
      report.includedFiles.push(file);
      report.totalFiles++;
      report.totalSizeBytes += fs.statSync(srcPath).size;
    } else {
      log(`  - ${file} (not found — skipping)`);
    }
  }

  // Verify no leaks
  log('');
  log('--- Verifying exclusions (removing leaked directories) ---');
  verifyNoLeaks(MIRROR_DIR);
  if (report.warnings.length === 0) {
    log('  No leaks detected.');
  } else {
    for (const w of report.warnings) {
      log(`  ! ${w}`);
    }
  }

  // Summary
  log('');
  log('=== Mirror Staging Complete ===');
  log(`Files staged: ${report.totalFiles}`);
  log(`Total size: ${formatBytes(report.totalSizeBytes)}`);
  log(`Excluded paths: ${report.excludedPaths.length}`);
  log(`Location: ${MIRROR_DIR}`);

  // Write exclusion report
  writeExclusionReport(MIRROR_DIR);

  log('');
  log('Next steps:');
  log(`  1. Review: ls ${MIRROR_DIR}`);
  log(`  2. Validate: tsx scripts/public-mirror/validate-public-surface.ts ${MIRROR_DIR}`);
  log('     → Writes docs/audit/public-mirror-report.md (pass/fail validation)');
  log('  3. Inventory: tsx scripts/public-mirror/report-public-surface.ts (no arg = workspace)');
  log('     → Writes docs/audit/public-surface-inventory.md (content classification)');
  log('  4. Push to GitHub (requires gh auth): see ops/github/commands.sh');
}

main();
