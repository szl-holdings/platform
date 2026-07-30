#!/usr/bin/env node
/**
 * SZL Holdings — Secret Scanner
 *
 * Scans all tracked source files for committed secrets (API keys, tokens,
 * credentials). This is a focused CI gate — it ONLY checks for secrets,
 * not mirror policy compliance or required document presence.
 *
 * Usage:
 *   node scripts/qa/scan-secrets.js [target-dir]
 *
 * Exit codes:
 *   0 = CLEAN — no secrets found
 *   1 = FAILED — one or more secrets detected or the scan was incomplete
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../..');

const ALLOW_VALUES = new Set([
  // Exact public example values from AWS documentation. Future values remain blocking.
  'AKIAIOSFODNN7EXAMPLE',
  'AKIA0000000000EXAMPLE',
]);

const SECRET_PATTERNS = [
  { pattern: /sk-[a-zA-Z0-9]{20,}/, label: 'OpenAI API key' },
  { pattern: /AKIA[A-Z0-9]{16}/, label: 'AWS access key' },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, label: 'GitHub personal token' },
  { pattern: /ghs_[a-zA-Z0-9]{36}/, label: 'GitHub Actions secret token' },
  { pattern: /sk_live_[a-zA-Z0-9]{20,}/, label: 'Stripe live secret key' },
  { pattern: /rk_live_[a-zA-Z0-9]{20,}/, label: 'Stripe live restricted key' },
  // Resend keys start with re_ followed by mixed-case alphanumeric (not all-same-char placeholders)
  { pattern: /re_(?=[a-zA-Z0-9]*[A-Z])[a-zA-Z0-9]{24,}/, label: 'Resend API key' },
  { pattern: /eyJ[a-zA-Z0-9_-]{20,}\.eyJ[a-zA-Z0-9_-]{20,}/, label: 'JWT token (live)' },
  {
    pattern:
      /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED(?: SIGSTORE)? )?PRIVATE KEY-----\r?\n(?:(?:Proc-Type|DEK-Info):[^\r\n]*\r?\n)*(?:\r?\n)?[A-Za-z0-9+/=\r\n]{64,}/,
    label: 'Private key (PEM)',
  },
];

// Block committed .env files, but exclude *.example files in any form:
// .env, .env.local, .env.production, .env.substrate — blocked
// .env.example, .env.substrate.example, .env.local.example — safe templates
const ENV_FILE_BLOCK = /^\.env(?!(?:\..+)?\.example$)(?:\..+)?$/;

const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.jsonc',
  '.md',
  '.mdx',
  '.yaml',
  '.yml',
  '.sh',
  '.bash',
  '.toml',
  '.ini',
  '.env',
  '.key',
  '.pem',
]);
const MAX_FILES = 20_000;

const SKIP_DIRECTORY_NAMES = new Set([
  // Repository metadata and installed dependencies are external to tracked source.
  '.git',
  'node_modules',
]);
// .env.example is intentionally IN scope so accidental real secrets are caught.
// Placeholder patterns in templates (re_xxxx, sk_test_*) are excluded via pattern design.
const SKIP_PATHS = new Set([
  // Only the repository-root generated lockfile is excluded.
  'pnpm-lock.yaml',
]);

function relativePath(target, candidate) {
  return path.relative(target, candidate).split(path.sep).join('/');
}

function containsNonAllowlistedMatch(pattern, content) {
  let candidate = content;
  for (const value of ALLOW_VALUES) candidate = candidate.replaceAll(value, '');
  return pattern.test(candidate);
}

export function scanTarget(
  target,
  { maxFiles = MAX_FILES, readFileSync = fs.readFileSync, readdirSync = fs.readdirSync } = {},
) {
  const hits = [];
  const coverageIssues = [];
  const count = { n: 0 };

  function addCoverageIssue(rel, label) {
    if (!coverageIssues.some((issue) => issue.rel === rel && issue.label === label)) {
      coverageIssues.push({ rel, label });
    }
  }

  function checkFile(fullPath, name) {
    const rel = relativePath(target, fullPath);
    const lowerName = name.toLowerCase();
    const ext = path.extname(lowerName);

    if (SKIP_PATHS.has(rel)) return;

    if (ENV_FILE_BLOCK.test(lowerName)) {
      hits.push({ rel, label: 'Committed .env file (may contain secrets)' });
      return;
    }

    if (/\.(sql\.gz|dump|pgdump)$/.test(lowerName)) {
      hits.push({ rel, label: 'Database dump file' });
      return;
    }

    if (!SCAN_EXTENSIONS.has(ext)) return;

    let content;
    try {
      content = readFileSync(fullPath, 'utf-8');
    } catch {
      addCoverageIssue(rel, 'File could not be read');
      return;
    }

    for (const { pattern, label } of SECRET_PATTERNS) {
      if (containsNonAllowlistedMatch(pattern, content)) {
        hits.push({ rel, label });
        break;
      }
    }
  }

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      addCoverageIssue(relativePath(target, dir) || '.', 'Directory could not be read');
      return false;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const rel = relativePath(target, fullPath);
      if (entry.isDirectory() && SKIP_DIRECTORY_NAMES.has(entry.name)) continue;
      if (count.n >= maxFiles) {
        addCoverageIssue(rel, `File scan limit of ${maxFiles} was exceeded`);
        return false;
      }
      if (entry.isDirectory()) {
        if (!walk(fullPath)) return false;
      } else if (entry.isFile()) {
        count.n++;
        checkFile(fullPath, entry.name);
      } else {
        count.n++;
        addCoverageIssue(rel, 'Unsupported filesystem entry could not be scanned');
      }
    }
    return true;
  }

  let targetStats;
  try {
    targetStats = fs.statSync(target);
  } catch {
    addCoverageIssue('.', 'Scan target does not exist or cannot be inspected');
    return { hits, coverageIssues, scannedFiles: count.n };
  }
  if (!targetStats.isDirectory()) {
    addCoverageIssue('.', 'Scan target is not a directory');
    return { hits, coverageIssues, scannedFiles: count.n };
  }

  walk(target);
  return { hits, coverageIssues, scannedFiles: count.n };
}

function main() {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : WORKSPACE_ROOT;
  const { hits, coverageIssues } = scanTarget(target);

  if (hits.length > 0) {
    console.error(`\nFAILED — ${hits.length} secret(s) detected:\n`);
    for (const hit of hits) {
      console.error(`  ❌  ${hit.rel}: ${hit.label}`);
    }
    console.error('');
  }

  if (coverageIssues.length > 0) {
    console.error(`\nFAILED — secret scan incomplete (${coverageIssues.length} issue(s)):\n`);
    for (const issue of coverageIssues) {
      console.error(`  ❌  ${issue.rel}: ${issue.label}`);
    }
    console.error('');
  }

  if (hits.length > 0 || coverageIssues.length > 0) {
    process.exit(1);
  }

  console.log('CLEAN — no secrets found.');
  process.exit(0);
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entrypoint.toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) {
  main();
}
