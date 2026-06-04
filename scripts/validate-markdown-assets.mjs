#!/usr/bin/env node
/**
 * SZL Holdings — Markdown Asset Validator
 *
 * Validates that every image reference and local document link in target
 * markdown files resolves to a real file on disk.
 *
 * Usage:
 *   node scripts/validate-markdown-assets.mjs
 *   node scripts/validate-markdown-assets.mjs --files README.md,.github/profile/README.md
 *   node scripts/validate-markdown-assets.mjs --strict   (exit 1 on any warning)
 *
 * npm script: pnpm validate:markdown-assets
 *
 * Output: console report + audit/LINK_IMAGE_VALIDATION_REPORT.md
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

// ── Configuration ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const FILE_ARG = args.find((a) => a.startsWith('--files='))?.split('=')[1];

const DEFAULT_FILES = [
  'README.md',
  '.github/profile/README.md',
  'org-profile/README.md',
  'profile-readme/README.md',
  'docs/INDEX.md',
];

const TARGET_FILES = FILE_ARG ? FILE_ARG.split(',') : DEFAULT_FILES;

// ── Regex patterns ────────────────────────────────────────────────────────────

// Markdown image: ![alt](path)
const IMG_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;
// Markdown link: [text](path) — local only (no http)
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;
// HTML img src
const HTML_IMG_RE = /<img[^>]+src=["']([^"']+)["']/gi;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLocal(href) {
  return (
    !href.startsWith('http://') &&
    !href.startsWith('https://') &&
    !href.startsWith('mailto:') &&
    !href.startsWith('#') &&
    !href.startsWith('ftp:')
  );
}

function stripFragment(href) {
  return href.split('#')[0];
}

function resolveLink(href, fromFile) {
  const stripped = stripFragment(href);
  if (!stripped) return null;
  const fileDir = dirname(join(REPO_ROOT, fromFile));
  return resolve(fileDir, stripped);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const report = {
  generatedAt: new Date().toISOString(),
  files: [],
  summary: { pass: 0, warn: 0, fail: 0 },
};

for (const relFile of TARGET_FILES) {
  const absFile = join(REPO_ROOT, relFile);

  if (!existsSync(absFile)) {
    report.files.push({
      file: relFile,
      status: 'missing-file',
      issues: [{ type: 'missing-file', href: relFile, status: 'fail', notes: 'File does not exist' }],
    });
    report.summary.fail++;
    continue;
  }

  const content = readFileSync(absFile, 'utf8');
  const issues = [];

  const check = (href, type) => {
    if (!isLocal(href)) return; // skip external
    const resolved = resolveLink(href, relFile);
    if (!resolved) return;
    const exists = existsSync(resolved);
    const status = exists ? 'pass' : 'fail';
    issues.push({ type, href, resolvedPath: resolved, status, notes: exists ? 'OK' : 'File not found' });
    if (exists) report.summary.pass++;
    else report.summary.fail++;
  };

  // Images
  for (const m of content.matchAll(IMG_RE)) check(m[2], 'md-image');
  for (const m of content.matchAll(HTML_IMG_RE)) check(m[1], 'html-image');
  // Links (local only)
  for (const m of content.matchAll(LINK_RE)) {
    const href = m[2];
    if (isLocal(href) && stripFragment(href)) check(href, 'md-link');
  }

  const fileStatus = issues.every((i) => i.status === 'pass')
    ? 'pass'
    : issues.some((i) => i.status === 'fail')
      ? 'fail'
      : 'warn';

  report.files.push({ file: relFile, status: fileStatus, issues });
}

// ── Console output ────────────────────────────────────────────────────────────

console.log('\n  SZL Holdings — Markdown Asset Validator');
console.log(`  Files checked: ${TARGET_FILES.length}\n`);

for (const f of report.files) {
  const icon = f.status === 'pass' ? '✅' : f.status === 'warn' ? '⚠️' : '❌';
  console.log(`  ${icon} ${f.file}`);
  for (const issue of f.issues) {
    if (issue.status !== 'pass') {
      console.log(`       ${issue.status === 'fail' ? '✗' : '!'} [${issue.type}] ${issue.href}`);
      console.log(`         → ${issue.notes}`);
    }
  }
}

console.log(`\n  Summary: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail\n`);

// ── Write validation report ───────────────────────────────────────────────────

const reportMd = buildReportMd(report);
const reportPath = join(REPO_ROOT, 'audit', 'LINK_IMAGE_VALIDATION_REPORT.md');
writeFileSync(reportPath, reportMd);
console.log(`  Report written: audit/LINK_IMAGE_VALIDATION_REPORT.md\n`);

if (STRICT && report.summary.fail > 0) {
  process.exit(1);
}

function buildReportMd(report) {
  const fileRows = report.files
    .map((f) => {
      const icon = f.status === 'pass' ? '✅' : f.status === 'warn' ? '⚠️' : '❌';
      const failCount = f.issues.filter((i) => i.status === 'fail').length;
      const passCount = f.issues.filter((i) => i.status === 'pass').length;
      return `| ${icon} | \`${f.file}\` | ${passCount} pass, ${failCount} fail |`;
    })
    .join('\n');

  const issueRows = report.files
    .flatMap((f) =>
      f.issues
        .filter((i) => i.status !== 'pass')
        .map((i) => `| \`${f.file}\` | ${i.type} | \`${i.href}\` | ${i.status} | ${i.notes} |`)
    )
    .join('\n') || '| — | — | — | — | No issues found |';

  return `# Link & Image Validation Report

**Generated:** ${report.generatedAt}  
**Summary:** ${report.summary.pass} pass · ${report.summary.warn} warn · ${report.summary.fail} fail

---

## File Summary

| Status | File | Results |
|--------|------|---------|
${fileRows}

---

## Issues

| File | Type | Href | Status | Notes |
|------|------|------|--------|-------|
${issueRows}
`;
}
