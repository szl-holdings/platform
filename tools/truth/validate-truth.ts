import { readFile } from 'node:fs/promises';
import path from 'node:path';

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

async function main(): Promise<void> {
  const truth = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
  const failures: string[] = [];

  if (truth.schema !== 'szl.truth/v1') failures.push('schema must equal szl.truth/v1');
  if (typeof truth.generated_at !== 'string')
    failures.push('generated_at must be an ISO-8601 string');
  if (typeof truth.generated_by !== 'string')
    failures.push('generated_by must be a git SHA or UNAVAILABLE');

  const generated = Date.parse(String(truth.generated_at));
  if (!Number.isFinite(generated)) failures.push('generated_at is not parseable');
  else if (Date.now() - generated > 7 * 24 * 60 * 60 * 1000) {
    failures.push('generated_at is older than seven days');
  }

  const metrics = truth.metrics as Record<string, Record<string, unknown>> | undefined;
  if (!metrics || typeof metrics !== 'object') failures.push('metrics must be an object');
  else {
    for (const [name, value] of Object.entries(metrics)) {
      if (!value || typeof value !== 'object') {
        failures.push(`${name} must be an evidence object`);
        continue;
      }
      if (!allowedLabels.has(String(value.label))) failures.push(`${name} has an invalid label`);
      if (typeof value.source !== 'string' || value.source.length === 0) {
        failures.push(`${name} must name its source`);
      }
      if (value.label === 'UNAVAILABLE') {
        const scalarUnavailable = 'value' in value && value.value === null;
        const testUnavailable =
          'passed' in value && value.passed === null && 'total' in value && value.total === null;
        if (!scalarUnavailable && !testUnavailable) {
          failures.push(`${name} must use null when UNAVAILABLE`);
        }
      }
    }
  }

  if (failures.length > 0) {
    for (const failure of failures) process.stderr.write(`truth validation: ${failure}\n`);
    process.exit(1);
  }

  process.stdout.write('truth validation: PASS\n');
}

void main().catch((error: unknown) => {
  process.stderr.write(`truth validation failed: ${String(error)}\n`);
  process.exit(1);
});
