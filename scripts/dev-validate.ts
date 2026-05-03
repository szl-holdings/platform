#!/usr/bin/env tsx
/**
 * Developer Environment Validator
 *
 * Validates the full local development environment and reports exactly
 * what is missing with fix instructions. Run this after cloning the repo
 * or when troubleshooting a broken dev environment.
 *
 * Usage:
 *   pnpm dev:validate
 *   tsx scripts/dev-validate.ts
 *
 * Exit codes:
 *   0  All checks passed
 *   1  One or more checks failed
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

/**
 * Parse a .env file and inject any missing keys into process.env so that
 * required-var checks reflect what the developer actually has configured
 * locally, regardless of whether they sourced the file in their shell.
 */
function loadDotEnv(envPath: string): void {
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const rawVal = trimmed.slice(eqIdx + 1).trim();
    if (!key) continue;
    if (key in process.env) continue;
    const val =
      (rawVal.startsWith('"') && rawVal.endsWith('"')) ||
      (rawVal.startsWith("'") && rawVal.endsWith("'"))
        ? rawVal.slice(1, -1)
        : rawVal;
    process.env[key] = val;
  }
}

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
  fix?: string;
}

const results: CheckResult[] = [];
let anyFailed = false;

function pass(name: string, detail: string): void {
  results.push({ name, passed: true, detail });
}

function fail(name: string, detail: string, fix: string): void {
  results.push({ name, passed: false, detail, fix });
  anyFailed = true;
}

function run(cmd: string): { stdout: string; stderr: string; code: number } {
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8' });
  return {
    stdout: (r.stdout ?? '').trim(),
    stderr: (r.stderr ?? '').trim(),
    code: r.status ?? 1,
  };
}

// ─── 1. Node.js version ───────────────────────────────────────────────────────
function checkNode(): void {
  const MIN_MAJOR = 20;
  const raw = process.version; // e.g. v20.11.0
  const match = raw.match(/^v(\d+)/);
  if (!match) {
    fail('Node.js version', `Could not parse Node version: ${raw}`, 'Install Node.js >= 20 from https://nodejs.org');
    return;
  }
  const major = parseInt(match[1], 10);
  if (major < MIN_MAJOR) {
    fail(
      'Node.js version',
      `Found Node ${raw}, need >= v${MIN_MAJOR}`,
      `Use nvm: nvm install ${MIN_MAJOR} && nvm use ${MIN_MAJOR}`,
    );
  } else {
    pass('Node.js version', `${raw} (>= v${MIN_MAJOR}) ✓`);
  }
}

// ─── 2. pnpm installation ─────────────────────────────────────────────────────
function checkPnpm(): void {
  const r = run('pnpm --version');
  if (r.code !== 0 || !r.stdout) {
    fail(
      'pnpm',
      'pnpm not found in PATH',
      'Install pnpm: npm install -g pnpm@latest  OR  corepack enable && corepack prepare pnpm@latest --activate',
    );
    return;
  }
  const version = r.stdout;
  const [major] = version.split('.').map(Number);
  if (major < 8) {
    fail('pnpm', `Found pnpm ${version}, need >= 8`, 'Run: npm install -g pnpm@latest');
  } else {
    pass('pnpm', `${version} ✓`);
  }
}

// ─── 3. Required env vars ─────────────────────────────────────────────────────
const REQUIRED_ENV_VARS: Array<{ key: string; description: string; example?: string }> = [
  {
    key: 'DATABASE_URL',
    description: 'PostgreSQL connection string for the primary database',
    example: 'postgresql://user:pass@localhost:5432/szl_dev',
  },
  {
    key: 'SESSION_SECRET',
    description: 'Secret key for signing session cookies (min 32 chars)',
    example: 'openssl rand -hex 32',
  },
];

const OPTIONAL_ENV_VARS: Array<{ key: string; description: string }> = [
  { key: 'NODE_ENV', description: 'Runtime environment (development|test|production)' },
  { key: 'PORT', description: 'Server listen port (default: 3000)' },
  { key: 'CORS_ORIGINS', description: 'Comma-separated allowed CORS origins' },
  { key: 'ALLOY_INTERNAL_TOKEN', description: 'Internal service bearer token' },
  { key: 'AI_INTEGRATIONS_OPENAI_API_KEY', description: 'OpenAI API key (enables live AI mode)' },
];

function checkEnvVars(): void {
  const envPath = join(REPO_ROOT, '.env');
  const envExists = existsSync(envPath);

  if (!envExists) {
    const envExamplePath = join(REPO_ROOT, '.env.example');
    if (existsSync(envExamplePath)) {
      fail(
        '.env file',
        '.env not found',
        'Copy the example: cp .env.example .env  then fill in required values',
      );
    } else {
      fail('.env file', '.env not found', 'Create a .env file in the repo root with required vars');
    }
  } else {
    pass('.env file', '.env exists ✓');
  }

  for (const spec of REQUIRED_ENV_VARS) {
    const val = process.env[spec.key];
    if (!val) {
      fail(
        `env: ${spec.key}`,
        `${spec.key} is not set — ${spec.description}`,
        spec.example
          ? `Set in .env: ${spec.key}=<value>  (example: ${spec.example})`
          : `Set in .env: ${spec.key}=<value>`,
      );
    } else {
      pass(`env: ${spec.key}`, `${spec.key} is configured ✓`);
    }
  }

  const unsetOptional = OPTIONAL_ENV_VARS.filter((s) => !process.env[s.key]);
  if (unsetOptional.length > 0) {
    results.push({
      name: 'optional env vars',
      passed: true,
      detail: `${unsetOptional.length} optional vars not set (non-blocking): ${unsetOptional.map((s) => s.key).join(', ')}`,
    });
  }
}

// ─── 4. Postgres connectivity ─────────────────────────────────────────────────
async function checkPostgres(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    fail('Postgres connectivity', 'DATABASE_URL not set — skipping DB check', 'Set DATABASE_URL in .env first');
    return;
  }
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: dbUrl });
    await Promise.race([
      client.connect(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);
    await client.query('SELECT 1');
    await client.end();
    pass('Postgres connectivity', 'Database reachable ✓');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    fail(
      'Postgres connectivity',
      `Cannot connect to Postgres: ${msg}`,
      'Ensure Postgres is running and DATABASE_URL is correct. Check: psql "$DATABASE_URL"',
    );
  }
}

// ─── 5. Database migrations status ────────────────────────────────────────────
async function checkMigrations(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    results.push({
      name: 'DB migrations',
      passed: true,
      detail: 'Skipped (DATABASE_URL not set)',
    });
    return;
  }
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    const { rows } = await client.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'drizzle_migrations') AS exists",
    );
    const hasMigrationsTable = rows[0]?.exists ?? false;
    await client.end();

    if (!hasMigrationsTable) {
      fail(
        'DB migrations',
        'drizzle_migrations table not found — database may not be migrated',
        'Run: pnpm --filter @szl-holdings/db migrate',
      );
    } else {
      pass('DB migrations', 'drizzle_migrations table exists ✓');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({
      name: 'DB migrations',
      passed: true,
      detail: `Could not check migrations (may be normal if DB is fresh): ${msg}`,
    });
  }
}

// ─── 6. Seed data presence ────────────────────────────────────────────────────
async function checkSeedData(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    results.push({
      name: 'Seed data',
      passed: true,
      detail: 'Skipped (DATABASE_URL not set)',
    });
    return;
  }
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    const seedChecks: Array<{ table: string; label: string }> = [
      { table: 'feature_flags', label: 'Feature flags' },
      { table: 'runtime_config', label: 'Runtime config' },
      { table: 'organizations', label: 'Organizations' },
    ];

    const missing: string[] = [];

    for (const check of seedChecks) {
      try {
        const { rows } = await client.query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM "${check.table}" LIMIT 1`,
        );
        const count = parseInt(rows[0]?.count ?? '0', 10);
        if (count === 0) missing.push(check.label);
      } catch {
        missing.push(`${check.label} (table missing)`);
      }
    }

    await client.end();

    if (missing.length > 0) {
      fail(
        'Seed data',
        `Missing seed data in: ${missing.join(', ')}`,
        'Run: pnpm seed  OR  pnpm --filter api-server seed:dev',
      );
    } else {
      pass('Seed data', 'Core tables have data ✓');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({
      name: 'Seed data',
      passed: true,
      detail: `Could not check seed data: ${msg}`,
    });
  }
}

// ─── 7. Workspace dependencies installed ──────────────────────────────────────
function checkDeps(): void {
  const nodeModulesPath = join(REPO_ROOT, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    fail(
      'Dependencies',
      'node_modules not found at repo root',
      'Run: pnpm install',
    );
    return;
  }
  const lockfilePath = join(REPO_ROOT, 'pnpm-lock.yaml');
  if (!existsSync(lockfilePath)) {
    fail(
      'Dependencies',
      'pnpm-lock.yaml not found',
      'Run: pnpm install  to generate the lockfile',
    );
    return;
  }
  pass('Dependencies', 'node_modules and pnpm-lock.yaml exist ✓');
}

// ─── 8. Git hooks installed ────────────────────────────────────────────────────
function checkGitHooks(): void {
  const hookPath = join(REPO_ROOT, '.git', 'hooks', 'pre-commit');
  if (!existsSync(hookPath)) {
    fail(
      'Git hooks',
      'pre-commit hook not installed',
      'Run: pnpm prepare  (or: sh scripts/setup-hooks.sh)',
    );
  } else {
    pass('Git hooks', 'pre-commit hook installed ✓');
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('\n  SZL Holdings — Developer Environment Validator');
  console.log('  ═══════════════════════════════════════════════\n');

  // Load .env first so required-var checks see locally-defined values even
  // when the developer has not sourced the file in their shell session.
  loadDotEnv(join(REPO_ROOT, '.env'));

  checkNode();
  checkPnpm();
  checkEnvVars();
  await checkPostgres();
  await checkMigrations();
  await checkSeedData();
  checkDeps();
  checkGitHooks();

  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  console.log('  Results:\n');
  for (const r of results) {
    const icon = r.passed ? '  ✅' : '  ❌';
    console.log(`${icon}  ${r.name}`);
    console.log(`       ${r.detail}`);
    if (!r.passed && r.fix) {
      console.log(`       Fix: ${r.fix}`);
    }
    console.log();
  }

  console.log('  ───────────────────────────────────────────────');
  console.log(`  ${passed.length} passed  |  ${failed.length} failed\n`);

  if (failed.length > 0) {
    console.log('  ⚠️  Fix the items above before starting the dev server.\n');
    process.exit(1);
  } else {
    console.log('  🚀  All checks passed! You\'re ready to develop.\n');
    console.log('  Start the API server:  pnpm --filter api-server dev');
    console.log('  Start all services:    pnpm dev\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Validator crashed:', err);
  process.exit(1);
});
