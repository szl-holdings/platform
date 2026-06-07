/**
 * Regression guard for the environment-variable contract.
 *
 * Background: docs/ENVIRONMENT_MATRIX.md audits every variable across three
 * sources — the Zod schema (packages/env/src/index.ts), the .env.example
 * template, and process.env.* usage in code. The audit found dead "CONTINUUM_*"
 * entries in .env.example that no code reads and that the schema had renamed to
 * "ALLOY_*". This test fails if that class of drift returns: every ACTIVE key in
 * .env.example must either be validated by the schema or appear on an explicit,
 * reviewed allowlist of service-local / externally-deployed variables.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

function readSchemaKeys(): Set<string> {
  const src = readFileSync(resolve(repoRoot, 'packages/env/src/index.ts'), 'utf8');
  const start = src.indexOf('export const envSchema = z.object({');
  const end = src.indexOf('\n});', start);
  const body = src.slice(start, end);
  const keys = new Set<string>();
  for (const line of body.split('\n')) {
    const m = /^ {2}([A-Z_][A-Z0-9_]*):/.exec(line);
    if (m) keys.add(m[1]);
  }
  return keys;
}

/** Active (uncommented) KEY= assignments in .env.example. */
function readExampleActiveKeys(): string[] {
  const src = readFileSync(resolve(repoRoot, '.env.example'), 'utf8');
  const keys: string[] = [];
  for (const raw of src.split('\n')) {
    const m = /^([A-Z_][A-Z0-9_]*)=/.exec(raw);
    if (m) keys.push(m[1]);
  }
  return keys;
}

/**
 * Variables that legitimately appear in .env.example but are NOT in the central
 * Zod schema because they are consumed by a specific service / external process
 * (documented in docs/ENVIRONMENT_MATRIX.md sections B and D). Adding to this
 * list is a deliberate, reviewable act — it cannot happen by accident.
 */
const SERVICE_LOCAL_ALLOWLIST = new Set<string>([
  // Externally-deployed embedding/ingestion service (docs/aef/*).
  'AEF_API_PORT', 'AEF_EMBED_API_KEY', 'AEF_EMBED_BACKEND', 'AEF_EMBED_BATCH_SIZE',
  'AEF_EMBED_ENDPOINT', 'AEF_EMBED_FLUSH_MS', 'AEF_EMBED_OVERSIZE_TOKENS',
  'AEF_EMBED_QUEUE_DEPTH', 'AEF_INGEST_CONTROL_PORT', 'AEF_PG_CONNECTION_STRING',
  'AEF_RANK_MODE', 'AEF_RANK_WORKER_PORT', 'AEF_RATE_LIMIT_RPM', 'AEF_S2S_SECRET',
  'AEF_STORAGE_ADAPTER', 'AEF_VECTOR_WORKER_PORT',
  // Bootstrap / seed (scripts, not the running server).
  'BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PASSWORD', 'BOOTSTRAP_ADMIN_USERNAME',
  // Provider keys read directly by optional adapters.
  'AMPLITUDE_API_KEY', 'POSTHOG_API_KEY', 'FAL_KEY', 'GOOGLE_AI_API_KEY',
  'DEEPSEEK_API_KEY', 'MOONSHOT_API_KEY', 'ZHIPU_API_KEY', 'DASHSCOPE_API_KEY',
  'BAIDU_API_KEY', 'LINEAR_API_KEY', 'NOTION_TOKEN', 'SENTRY_MCP_TOKEN',
  'VITE_CF_API_KEY', 'VITE_CF_GATEWAY_URL', 'VITE_CF_TENANT_ID',
  'CF_API_KEY', 'CF_GATEWAY_URL', 'CF_TENANT_ID',
  'AZURE_STORAGE_ACCOUNT', 'AZURE_STORAGE_CONTAINER', 'AZURE_STORAGE_PREFIX',
  'AZURE_STORAGE_SAS_TOKEN',
  // Backup harness.
  'BACKUP_REMOTE_BACKEND', 'BACKUP_REMOTE_DAILY_RETENTION_DAYS',
  'BACKUP_REMOTE_LOCAL_DIR', 'BACKUP_REMOTE_WEEKLY_RETENTION_DAYS',
  // Operational audit harness (ops/audit/*.mjs) and eval/drift tooling.
  'TARGET_URL', 'EXPECTED_TEXT', 'MAX_PAGES', 'STRESS_REQUESTS',
  'STRESS_CONCURRENCY', 'MAX_P95_MS', 'REPORT_DIR',
  'CALIBRATION_MODE', 'DRIFT_GUARD', 'EVOLUTION_MODE', 'PROMOTION_MODE',
]);

/** Legacy product alias that was renamed to ALLOY_* in the schema. Must stay dead. */
const FORBIDDEN_PREFIXES = ['CONTINUUM_', 'FEATURE_CONTINUUM_'];

describe('.env.example ↔ schema consistency', () => {
  const schemaKeys = readSchemaKeys();
  const activeKeys = readExampleActiveKeys();

  it('parses a non-trivial schema and template', () => {
    expect(schemaKeys.size).toBeGreaterThan(150);
    expect(activeKeys.length).toBeGreaterThan(50);
  });

  it('contains no legacy CONTINUUM_* aliases (renamed to ALLOY_*)', () => {
    const offenders = activeKeys.filter((k) =>
      FORBIDDEN_PREFIXES.some((p) => k.startsWith(p)),
    );
    expect(offenders).toEqual([]);
  });

  it('every active key is schema-validated or on the service-local allowlist', () => {
    const orphans = activeKeys.filter(
      (k) => !schemaKeys.has(k) && !SERVICE_LOCAL_ALLOWLIST.has(k),
    );
    expect(orphans).toEqual([]);
  });

  it('declares the ALLOY_* replacements that superseded the CONTINUUM_* aliases', () => {
    for (const k of [
      'ALLOY_MAX_BATCH_SIZE',
      'ALLOY_WORKFLOW_AUTO_RUN',
      'ALLOY_REQUIRE_APPROVAL_CRITICAL',
      'ALLOY_EMAIL_INGEST_SECRET',
      'ALLOY_DIGEST_SLACK_CHANNEL',
      'ALLOY_INTERNAL_TOKEN',
      'FEATURE_ALLOY_GOVERNANCE',
      'FEATURE_ALLOY_ORCHESTRATION',
      'FEATURE_ALLOY_WEBHOOKS',
    ]) {
      expect(schemaKeys.has(k), `${k} missing from schema`).toBe(true);
      expect(activeKeys, `${k} missing from .env.example`).toContain(k);
    }
  });
});
