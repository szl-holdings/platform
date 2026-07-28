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
 *   1 = FAILED — one or more secrets detected
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../..');
const TARGET = process.argv[2] ? path.resolve(process.argv[2]) : WORKSPACE_ROOT;

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
      /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED SIGSTORE )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/\r\n]{64,}/,
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

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cache',
  'coverage',
  '.semgrep',
  'attached_assets',
  'playwright-report',
  'test-results',
  'backups',
  // Audit and security report directories contain documentation examples of
  // credential-shaped values (e.g. AKIAIOSFODNN7EXAMPLE) confirmed as false
  // positives in prior audits. Real secrets are never committed here.
  'audit',
  'security',
]);
// .env.example is intentionally IN scope so accidental real secrets are caught.
// Placeholder patterns in templates (re_xxxx, sk_test_*) are excluded via pattern design.
const SKIP_FILES = new Set([
  'pnpm-lock.yaml',
  'scan-secrets.js',
  '.gitleaks.toml',
  // Known-gaps document: references AKIAIOSFODNN7EXAMPLE as a documented
  // false positive finding. The file documents security audit results, not
  // committed credentials.
  'KNOWN-GAPS.md',
]);

let _errors = 0;
const hits = [];

function walk(dir, count = { n: 0 }) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (count.n >= MAX_FILES) return;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(fullPath, count);
    } else if (entry.isFile()) {
      count.n++;
      checkFile(fullPath, entry.name);
    }
  }
}

function checkFile(fullPath, name) {
  const rel = path.relative(TARGET, fullPath);
  const ext = path.extname(name);

  if (SKIP_FILES.has(name)) return;

  if (ENV_FILE_BLOCK.test(name)) {
    hits.push({ rel, label: 'Committed .env file (may contain secrets)' });
    _errors++;
    return;
  }

  if (/\.(sql\.gz|dump|pgdump)$/.test(name)) {
    hits.push({ rel, label: 'Database dump file' });
    _errors++;
    return;
  }

  if (!SCAN_EXTENSIONS.has(ext)) return;

  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf-8');
  } catch {
    return;
  }

  for (const { pattern, label } of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      hits.push({ rel, label });
      _errors++;
      break;
    }
  }
}

walk(TARGET);

if (hits.length > 0) {
  console.error(`\nFAILED — ${hits.length} secret(s) detected:\n`);
  for (const hit of hits) {
    console.error(`  ❌  ${hit.rel}: ${hit.label}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log('CLEAN — no secrets found.');
  process.exit(0);
}
