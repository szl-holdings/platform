import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const file = path.join(ROOT, 'artifacts', 'SOURCE_OF_TRUTH.json');
const allowedLabels = new Set([
  'MEASURED',
  'REPORTED',
  'MODELED',
  'CONJECTURE',
  'UNKNOWN',
  'UNAVAILABLE',
]);
const testMetrics = new Set(['platform_tests', 'ouroboros_tests', 'mcp_e2e_tests']);
const booleanMetrics = new Set(['ghcr_a11oy_package_live']);
export const REQUIRED_METRICS = [
  'surfaces_customer_facing',
  'platform_tests',
  'ouroboros_tests',
  'mcp_e2e_tests',
  'monorepo_packages',
  'api_endpoints',
  'db_tables',
  'db_table_definitions_static',
  'ci_workflows',
  'github_public_repositories',
  'hf_models',
  'hf_datasets',
  'hf_spaces',
  'ghcr_a11oy_package_live',
  'lean_theorems_locked',
  'lean_sorry_count',
  'doctrine_v11_declarations',
  'doctrine_v11_unique_axioms',
  'doctrine_v11_tracked_sorries',
  'lambda_overhead_ms_median',
  'receipt_chain_depth',
] as const;

function isCount(value: unknown): value is number {
  return Number.isFinite(value) && Number.isInteger(value) && (value as number) >= 0;
}

export function validateTruth(truth: unknown, now = Date.now()): string[] {
  const failures: string[] = [];
  if (!truth || typeof truth !== 'object' || Array.isArray(truth)) {
    return ['truth artifact must be an object'];
  }
  const record = truth as Record<string, unknown>;
  if (record.schema !== 'szl.truth/v1') failures.push('schema must equal szl.truth/v1');
  if (typeof record.generated_at !== 'string') {
    failures.push('generated_at must be an ISO-8601 string');
  }
  if (
    typeof record.generated_by !== 'string' ||
    !(/^[0-9a-f]{40}$/i.test(record.generated_by) || record.generated_by === 'UNAVAILABLE')
  ) {
    failures.push('generated_by must be a 40-character git SHA or UNAVAILABLE');
  }

  const generated = Date.parse(String(record.generated_at));
  if (!Number.isFinite(generated)) {
    failures.push('generated_at is not parseable');
  } else {
    if (now - generated > 7 * 24 * 60 * 60 * 1000) {
      failures.push('generated_at is older than seven days');
    }
    if (generated - now > 5 * 60 * 1000) {
      failures.push('generated_at is more than five minutes in the future');
    }
  }

  const metrics = record.metrics;
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    failures.push('metrics must be an object');
    return failures;
  }
  const metricRecord = metrics as Record<string, unknown>;
  for (const required of REQUIRED_METRICS) {
    if (!(required in metricRecord)) failures.push(`metrics.${required} is required`);
  }
  for (const [name, rawValue] of Object.entries(metricRecord)) {
    if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) {
      failures.push(`${name} must be an evidence object`);
      continue;
    }
    const value = rawValue as Record<string, unknown>;
    if (!allowedLabels.has(String(value.label))) failures.push(`${name} has an invalid label`);
    if (typeof value.source !== 'string' || value.source.trim().length === 0) {
      failures.push(`${name} must name its source`);
    }
    if (typeof value.definition !== 'string' || value.definition.trim().length === 0) {
      failures.push(`${name} must define what it measures`);
    }

    const scalarShape =
      Object.hasOwn(value, 'value') &&
      !Object.hasOwn(value, 'passed') &&
      !Object.hasOwn(value, 'total');
    const testShape =
      !Object.hasOwn(value, 'value') &&
      Object.hasOwn(value, 'passed') &&
      Object.hasOwn(value, 'total');
    const expectedShape = testMetrics.has(name) ? testShape : scalarShape;
    if (!expectedShape) {
      failures.push(
        `${name} must use exactly one ${testMetrics.has(name) ? 'test' : 'scalar'} evidence shape`,
      );
    }

    if (value.label === 'UNAVAILABLE') {
      const unavailable = testMetrics.has(name)
        ? testShape && value.passed === null && value.total === null
        : scalarShape && value.value === null;
      if (!unavailable) failures.push(`${name} must use null when UNAVAILABLE`);
      if (typeof value.reason !== 'string' || value.reason.trim().length === 0) {
        failures.push(`${name} must explain why it is UNAVAILABLE`);
      }
      continue;
    }

    if (testMetrics.has(name) && testShape) {
      if (!isCount(value.passed) || !isCount(value.total)) {
        failures.push(`${name} passed and total must be non-negative integer counts`);
      } else if (value.passed > value.total) {
        failures.push(`${name} passed cannot exceed total`);
      }
    } else if (booleanMetrics.has(name) && scalarShape) {
      if (typeof value.value !== 'boolean') failures.push(`${name} value must be boolean`);
    } else if (!testMetrics.has(name) && scalarShape && !isCount(value.value)) {
      failures.push(`${name} value must be a non-negative integer count`);
    }
  }
  return failures;
}

async function main(): Promise<void> {
  const truth = JSON.parse(await readFile(file, 'utf8')) as unknown;
  const failures = validateTruth(truth);
  if (failures.length > 0) {
    for (const failure of failures) process.stderr.write(`truth validation: ${failure}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('truth validation: PASS\n');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  void main().catch((error: unknown) => {
    process.stderr.write(`truth validation failed: ${String(error)}\n`);
    process.exitCode = 1;
  });
}
