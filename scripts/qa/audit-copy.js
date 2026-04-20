#!/usr/bin/env node
/**
 * audit:copy — SZL Holdings Platform
 * Scans for stale, placeholder, or lorem ipsum copy in production-facing pages.
 *
 * Usage:
 *   node scripts/qa/audit-copy.js
 */

import { readdirSync, readFileSync } from 'fs';
import { dirname, extname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

const STALE_PATTERNS = [
  { pattern: /lorem ipsum/i, label: 'Lorem ipsum placeholder text', severity: 'error' },
  { pattern: /placeholder text/i, label: "Literal 'placeholder text'", severity: 'error' },
  { pattern: /coming soon\.{3}/i, label: 'Coming soon... (ellipsis)', severity: 'warning' },
  { pattern: /\[TBD\]/i, label: '[TBD] placeholder', severity: 'warning' },
  { pattern: /\[TODO\]/i, label: '[TODO] placeholder', severity: 'warning' },
  { pattern: /\[PLACEHOLDER\]/i, label: '[PLACEHOLDER] text', severity: 'error' },
  { pattern: /\[INSERT\]/i, label: '[INSERT] placeholder', severity: 'warning' },
  { pattern: /\[COMPANY NAME\]/i, label: '[COMPANY NAME] placeholder', severity: 'error' },
  { pattern: /your company/i, label: "'your company' placeholder text", severity: 'warning' },
  { pattern: /example\.com/i, label: 'example.com domain', severity: 'warning' },
  { pattern: /foo@bar\.com/i, label: 'Fake email address', severity: 'warning' },
  { pattern: /test@test\.com/i, label: 'Test email address', severity: 'warning' },
  { pattern: /Jane Doe|John Doe/i, label: 'Placeholder name (Jane/John Doe)', severity: 'warning' },
  { pattern: /Acme Corp/i, label: 'Acme Corp placeholder', severity: 'warning' },
  {
    pattern: /\.\.\.(more|content|text) coming/i,
    label: 'Pending content placeholder',
    severity: 'warning',
  },
];

const SCAN_DIRS = [
  'artifacts/szl-holdings/src/pages',
  'artifacts/szl-holdings/src/components',
  'artifacts/carlota-jo/src',
  'artifacts/stephen-site/src',
];

const ALLOWED_PATHS = ['.test.', '.spec.', '__tests__', 'node_modules', 'dist', 'build'];

function isAllowedPath(filePath) {
  return ALLOWED_PATHS.some((p) => filePath.includes(p));
}

function walkDir(dir) {
  const files = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', '.cache'].includes(entry.name)) {
          files.push(...walkDir(fullPath));
        }
      } else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch {
    // skip
  }
  return files;
}

function auditFile(filePath) {
  const rel = relative(ROOT, filePath);
  if (isAllowedPath(rel)) return [];

  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const findings = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { pattern, label, severity } of STALE_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({ file: rel, line: i + 1, text: line.trim().slice(0, 120), label, severity });
      }
    }
  }

  return findings;
}

function main() {
  console.log('\nSZL Holdings — Copy Freshness Audit');
  console.log('Scanning for stale, placeholder, or lorem ipsum copy...\n');

  const allFindings = [];

  for (const dir of SCAN_DIRS) {
    const fullDir = join(ROOT, dir);
    const files = walkDir(fullDir);
    for (const file of files) {
      allFindings.push(...auditFile(file));
    }
  }

  const errors = allFindings.filter((f) => f.severity === 'error');
  const warnings = allFindings.filter((f) => f.severity === 'warning');

  if (errors.length > 0) {
    console.error(`ERRORS (${errors.length}):`);
    for (const f of errors) {
      console.error(`  [ERROR] ${f.file}:${f.line} — ${f.label}`);
      console.error(`          ${f.text}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log(`WARNINGS (${warnings.length}):`);
    for (const f of warnings) {
      console.warn(`  [WARN]  ${f.file}:${f.line} — ${f.label}`);
    }
    console.log('');
  }

  if (errors.length > 0) {
    console.error(
      `\nFAIL — ${errors.length} error(s), ${warnings.length} warning(s). Fix errors before deploying.`,
    );
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log(`PASS (with warnings) — ${warnings.length} advisory note(s). No blocking errors.`);
    process.exit(0);
  } else {
    console.log('PASS — No stale or placeholder copy found.');
    process.exit(0);
  }
}

main();
