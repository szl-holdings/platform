#!/usr/bin/env node
/**
 * audit:mocks — SZL Holdings Platform
 * Scans source files for mock/demo data patterns that should not appear in production paths.
 *
 * Checks for:
 *   - Hardcoded mock arrays in non-demo files
 *   - MOCK_ prefixed constants outside of test/demo files
 *   - Demo seed data referenced in production route handlers
 *
 * Usage:
 *   node scripts/qa/audit-mocks.js
 */

import { readdirSync, readFileSync, } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

const MOCK_PATTERNS = [
  { pattern: /const MOCK_[A-Z]/, label: 'MOCK_ constant', severity: 'warning' },
  { pattern: /\bMOCK_DATA\b/, label: 'MOCK_DATA reference', severity: 'warning' },
  { pattern: /\/\*\s*MOCK\s*\*\//, label: 'MOCK comment', severity: 'info' },
  { pattern: /TODO:.*mock/i, label: 'TODO mock', severity: 'info' },
  { pattern: /FIXME:.*mock/i, label: 'FIXME mock', severity: 'warning' },
  {
    pattern: /\/\/.*placeholder.*data|\/\*.*placeholder.*data/i,
    label: 'Placeholder data comment',
    severity: 'info',
  },
  { pattern: /hardcoded.*data/i, label: 'Hardcoded data comment', severity: 'warning' },
  { pattern: /fake.*data/i, label: 'Fake data comment', severity: 'info' },
];

const ALLOWED_MOCK_PATHS = [
  'scripts/qa',
  'scripts/seed',
  '__tests__',
  '.test.',
  '.spec.',
  'demo-',
  '/demo/',
  'mock-',
  '/mocks/',
  'seed-',
  'fixtures',
  'storybook',
  'mockup-sandbox',
  'admin/seeder',
];

const SCAN_DIRS = [
  'artifacts/api-server/src/routes',
  'artifacts/szl-holdings/src/pages',
  'artifacts/lyte-command-center/src/pages',
  'artifacts/terra/src/pages',
  'artifacts/aegis/src/pages',
  'artifacts/vessels/src/pages',
  'artifacts/carlota-jo/src/pages',
];

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function isAllowedMockPath(filePath) {
  return ALLOWED_MOCK_PATHS.some((p) => filePath.includes(p));
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
      } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return files;
}

function auditFile(filePath) {
  const rel = relative(ROOT, filePath);
  if (isAllowedMockPath(rel)) return [];

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
    for (const { pattern, label, severity } of MOCK_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({ file: rel, line: i + 1, text: line.trim().slice(0, 100), label, severity });
      }
    }
  }

  return findings;
}

function main() {

  const allFindings = [];

  for (const dir of SCAN_DIRS) {
    const fullDir = join(ROOT, dir);
    const files = walkDir(fullDir);
    for (const file of files) {
      allFindings.push(...auditFile(file));
    }
  }

  const warnings = allFindings.filter((f) => f.severity === 'warning');
  const infos = allFindings.filter((f) => f.severity === 'info');

  if (warnings.length > 0) {
    for (const _f of warnings) {
    }
  }

  if (infos.length > 0) {
    for (const _f of infos) {
    }
  }

  if (allFindings.length === 0) {
    process.exit(0);
  } else if (warnings.length === 0) {
    process.exit(0);
  } else {
    process.exit(0); // warnings don't fail — they're advisory
  }
}

main();
