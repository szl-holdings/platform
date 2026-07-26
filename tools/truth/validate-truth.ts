import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CANONICAL_METRIC_NAMES, TRUTH_GENERATOR_ID } from './truth-schema.js';

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

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export function validateTruth(truth: Record<string, unknown>, nowMs = Date.now()): string[] {
  const failures: string[] = [];

  if (truth.schema !== 'szl.truth/v1') failures.push('schema must equal szl.truth/v1');
  if (typeof truth.generated_at !== 'string')
    failures.push('generated_at must be an ISO-8601 string');
  if (truth.generated_by !== TRUTH_GENERATOR_ID) {
    failures.push(`generated_by must equal ${TRUTH_GENERATOR_ID}`);
  }

  const generated = Date.parse(String(truth.generated_at));
  if (!Number.isFinite(generated)) failures.push('generated_at is not parseable');
  else {
    const ageMs = nowMs - generated;
    if (ageMs > MAX_AGE_MS) failures.push('generated_at is older than seven days');
    if (ageMs < -MAX_FUTURE_SKEW_MS) {
      failures.push('generated_at is more than five minutes in the future');
    }
  }

  const metrics = truth.metrics as Record<string, Record<string, unknown>> | undefined;
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    failures.push('metrics must be an object');
  } else {
    const canonicalNames = new Set<string>(CANONICAL_METRIC_NAMES);
    for (const name of CANONICAL_METRIC_NAMES) {
      if (!(name in metrics)) {
        failures.push(`${name} is missing; use an explicit UNAVAILABLE evidence object`);
      }
    }
    for (const name of Object.keys(metrics)) {
      if (!canonicalNames.has(name)) failures.push(`${name} is not a canonical metric`);
    }
    for (const [name, value] of Object.entries(metrics)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        failures.push(`${name} must be an evidence object`);
        continue;
      }
      if (!allowedLabels.has(String(value.label))) failures.push(`${name} has an invalid label`);
      if (typeof value.source !== 'string' || value.source.length === 0) {
        failures.push(`${name} must name its source`);
      }
      const scalarShape = 'value' in value && !('passed' in value) && !('total' in value);
      const testShape = !('value' in value) && 'passed' in value && 'total' in value;
      if (value.label === 'UNAVAILABLE') {
        const scalarUnavailable = scalarShape && value.value === null;
        const testUnavailable = testShape && value.passed === null && value.total === null;
        if (!scalarUnavailable && !testUnavailable) {
          failures.push(`${name} must use one null scalar or test evidence shape when UNAVAILABLE`);
        }
      } else {
        const scalarAvailable =
          scalarShape && typeof value.value === 'number' && Number.isFinite(value.value);
        const testAvailable =
          testShape &&
          typeof value.passed === 'number' &&
          Number.isFinite(value.passed) &&
          typeof value.total === 'number' &&
          Number.isFinite(value.total);
        if (!scalarAvailable && !testAvailable) {
          failures.push(`${name} must use one finite numeric scalar or test evidence shape`);
        }
      }
    }
  }

  return failures;
}

async function main(): Promise<void> {
  const truth = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
  const failures = validateTruth(truth);

  if (failures.length > 0) {
    for (const failure of failures) process.stderr.write(`truth validation: ${failure}\n`);
    process.exit(1);
  }

  process.stdout.write('truth validation: PASS\n');
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]).toLowerCase() : '';
if (invokedPath === fileURLToPath(import.meta.url).toLowerCase()) {
  void main().catch((error: unknown) => {
    process.stderr.write(`truth validation failed: ${String(error)}\n`);
    process.exit(1);
  });
}
