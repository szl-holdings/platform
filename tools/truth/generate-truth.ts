import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

import { type PublicSurfaceManifest, validatePublicSurfaceManifest } from './public-surfaces.js';
import { LOCAL_METRIC_NAMES, REMOTE_METRIC_NAMES, TRUTH_GENERATOR_ID } from './truth-schema.js';

type EvidenceLabel = 'MEASURED' | 'REPORTED' | 'MODELED' | 'CONJECTURE' | 'UNKNOWN' | 'UNAVAILABLE';
type Metric = {
  value: number | null;
  label: EvidenceLabel;
  source: string;
};
type TestMetric = {
  passed: number | null;
  total: number | null;
  label: EvidenceLabel;
  source: string;
};

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const OUTPUT = path.join(ROOT, 'artifacts', 'SOURCE_OF_TRUTH.json');
export const TRUTH_SCHEMA = 'szl.truth/v1';
export const TRUTH_DOI = {
  concept: '10.5281/zenodo.19944926',
  latest: '10.5281/zenodo.20195368',
} as const;
const VERIFY_LOCAL_MODE =
  process.argv.includes('--verify-local') || process.argv.includes('--check');
const VERIFY_REMOTE_MODE = process.argv.includes('--verify-remote');
const REFRESH_REMOTE_METRICS = !VERIFY_LOCAL_MODE || VERIFY_REMOTE_MODE;
function metric(value: number | null, label: EvidenceLabel, source: string): Metric {
  return { value, label, source };
}

function unavailable(source: string): Metric {
  return metric(null, 'UNAVAILABLE', source);
}

function unavailableTests(source: string): TestMetric {
  return { passed: null, total: null, label: 'UNAVAILABLE', source };
}

export function metricDrift(
  existing: Record<string, unknown>,
  recomputed: Record<string, unknown>,
  names: readonly string[],
): string[] {
  return names.filter(
    (name) => JSON.stringify(existing[name]) !== JSON.stringify(recomputed[name]),
  );
}

export function metadataDrift(existing: Record<string, unknown>): string[] {
  const expected: Record<string, unknown> = {
    schema: TRUTH_SCHEMA,
    generated_by: TRUTH_GENERATOR_ID,
    doi: TRUTH_DOI,
  };
  return Object.keys(expected).filter(
    (name) => JSON.stringify(existing[name]) !== JSON.stringify(expected[name]),
  );
}

async function readExisting(): Promise<Record<string, unknown> | null> {
  if (!existsSync(OUTPUT)) return null;
  try {
    return JSON.parse(await readFile(OUTPUT, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function countSurfaces(): Promise<Metric> {
  const source = 'artifacts/PUBLIC_SURFACES.json#summary.customer_facing_products';
  const file = path.join(ROOT, 'artifacts', 'PUBLIC_SURFACES.json');
  if (!existsSync(file)) return unavailable(source);
  try {
    const manifest = JSON.parse(await readFile(file, 'utf8')) as PublicSurfaceManifest;
    if (validatePublicSurfaceManifest(manifest).length > 0) return unavailable(source);
    const value = Number(manifest.summary.customer_facing_products);
    return Number.isInteger(value) && value >= 0
      ? metric(value, 'MEASURED', source)
      : unavailable(source);
  } catch {
    return unavailable(source);
  }
}

async function readVitestResult(file: string): Promise<TestMetric> {
  if (!existsSync(file)) return unavailableTests(path.relative(ROOT, file).replaceAll('\\', '/'));
  try {
    const data = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
    const passed = Number(data.numPassedTests);
    const total = Number(data.numTotalTests);
    if (Number.isFinite(passed) && Number.isFinite(total)) {
      return {
        passed,
        total,
        label: 'MEASURED',
        source: path.relative(ROOT, file).replaceAll('\\', '/'),
      };
    }
  } catch {
    // Fall through to an explicit unavailable result.
  }
  return unavailableTests(path.relative(ROOT, file).replaceAll('\\', '/'));
}

function packageCount(): Metric {
  try {
    const pnpmCli = process.env.npm_execpath;
    if (!pnpmCli) return unavailable('pnpm -r list --depth -1 --json');
    const raw = execFileSync(process.execPath, [pnpmCli, '-r', 'list', '--depth', '-1', '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const packages = JSON.parse(raw) as unknown[];
    return metric(packages.length, 'MEASURED', 'pnpm -r list --depth -1 --json');
  } catch {
    return unavailable('pnpm -r list --depth -1 --json');
  }
}

async function countApiEndpoints(): Promise<Metric> {
  const file = path.join(ROOT, 'lib', 'api-spec', 'openapi.yaml');
  const source = 'OpenAPI 3.1 operations in lib/api-spec/openapi.yaml';
  if (!existsSync(file)) return unavailable(source);

  try {
    const document = parse(await readFile(file, 'utf8')) as {
      paths?: Record<string, Record<string, unknown>>;
    };
    const methods = new Set(['delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace']);
    const count = Object.values(document.paths ?? {}).reduce(
      (total, item) =>
        total + Object.keys(item ?? {}).filter((key) => methods.has(key.toLowerCase())).length,
      0,
    );
    return metric(count, 'MEASURED', source);
  } catch {
    return unavailable(source);
  }
}

function dbTableCount(): Metric {
  if (!process.env.DATABASE_URL) return unavailable('drizzle introspect against DATABASE_URL');
  try {
    const raw = execFileSync(
      'psql',
      [
        process.env.DATABASE_URL,
        '-Atc',
        "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';",
      ],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    const value = Number(raw);
    return Number.isFinite(value)
      ? metric(value, 'MEASURED', 'drizzle introspect against DATABASE_URL')
      : unavailable('drizzle introspect against DATABASE_URL');
  } catch {
    return unavailable('drizzle introspect against DATABASE_URL');
  }
}

async function workflowCount(): Promise<Metric> {
  const directory = path.join(ROOT, '.github', 'workflows');
  if (!existsSync(directory)) return metric(0, 'MEASURED', 'ls .github/workflows');
  const files = await readdir(directory, { withFileTypes: true });
  return metric(
    files.filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name)).length,
    'MEASURED',
    'ls .github/workflows',
  );
}

async function leanSorryCount(): Promise<Metric> {
  const file = path.join(ROOT, 'artifacts', 'lean-build.log');
  if (!existsSync(file)) return unavailable('artifacts/lean-build.log');
  const text = await readFile(file, 'utf8');
  const matches = text.match(/\b(?:declaration uses ['"]sorry['"]|sorryAx)\b/gi) ?? [];
  return metric(matches.length, 'MEASURED', 'artifacts/lean-build.log');
}

async function lambdaMedian(): Promise<Metric> {
  const file = path.join(ROOT, 'benchmarks', 'lambda', 'summary.json');
  if (!existsSync(file)) return unavailable('benchmarks/lambda/summary.json');
  try {
    const data = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
    const value = Number(data.median_ms ?? data.medianMs ?? data.lambda_overhead_ms_median);
    return Number.isFinite(value)
      ? metric(value, 'MEASURED', 'benchmarks/lambda/summary.json')
      : unavailable('benchmarks/lambda/summary.json');
  } catch {
    return unavailable('benchmarks/lambda/summary.json');
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (process.env.HF_TOKEN) headers.authorization = `Bearer ${process.env.HF_TOKEN}`;
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function hubCount(kind: 'models' | 'datasets' | 'spaces' | 'collections'): Promise<Metric> {
  const org = process.env.HF_ORG ?? 'SZLHOLDINGS';
  const url =
    kind === 'collections'
      ? `https://huggingface.co/api/collections?owner=${encodeURIComponent(org)}&limit=1000`
      : `https://huggingface.co/api/${kind}?author=${encodeURIComponent(org)}&limit=1000&full=true`;
  try {
    const data = await fetchJson(url);
    const list = Array.isArray(data)
      ? data
      : typeof data === 'object' && data
        ? ((data as Record<string, unknown>)[kind] ??
          (data as Record<string, unknown>).items ??
          (data as Record<string, unknown>).collections)
        : null;
    return Array.isArray(list)
      ? metric(list.length, 'MEASURED', `Hugging Face Hub API: ${url}`)
      : unavailable(`Hugging Face Hub API: ${url}`);
  } catch {
    return unavailable(`Hugging Face Hub API: ${url}`);
  }
}

async function receiptDepth(): Promise<Metric> {
  const url = process.env.RECEIPT_HEAD_URL ?? 'https://a-11-oy.com/api/a11oy/v1/receipts/head';
  try {
    const data = (await fetchJson(url)) as Record<string, unknown>;
    const value = Number(data.depth ?? data.chain_depth ?? data.chainDepth);
    return Number.isFinite(value)
      ? metric(value, 'MEASURED', `GET ${url}`)
      : unavailable(`GET ${url}`);
  } catch {
    return unavailable(`GET ${url}`);
  }
}

async function main(): Promise<void> {
  const existing = await readExisting();

  const [
    surfaces,
    platformTests,
    ouroborosTests,
    mcpTests,
    endpoints,
    workflows,
    leanSorry,
    lambda,
    hfModels,
    hfDatasets,
    hfSpaces,
    hfCollections,
    chainDepth,
  ] = await Promise.all([
    countSurfaces(),
    readVitestResult(path.join(ROOT, 'artifacts', 'test-results.json')),
    readVitestResult(path.join(ROOT, 'artifacts', 'ouroboros-test-results.json')),
    readVitestResult(path.join(ROOT, 'artifacts', 'mcp-e2e-test-results.json')),
    countApiEndpoints(),
    workflowCount(),
    leanSorryCount(),
    lambdaMedian(),
    REFRESH_REMOTE_METRICS
      ? hubCount('models')
      : Promise.resolve(unavailable('live refresh not run in local verification')),
    REFRESH_REMOTE_METRICS
      ? hubCount('datasets')
      : Promise.resolve(unavailable('live refresh not run in local verification')),
    REFRESH_REMOTE_METRICS
      ? hubCount('spaces')
      : Promise.resolve(unavailable('live refresh not run in local verification')),
    REFRESH_REMOTE_METRICS
      ? hubCount('collections')
      : Promise.resolve(unavailable('live refresh not run in local verification')),
    REFRESH_REMOTE_METRICS
      ? receiptDepth()
      : Promise.resolve(unavailable('live refresh not run in local verification')),
  ]);

  const localMetrics = {
    surfaces_customer_facing: surfaces,
    ouroboros_tests: ouroborosTests,
    platform_tests: platformTests,
    mcp_e2e_tests: mcpTests,
    monorepo_packages: packageCount(),
    api_endpoints: endpoints,
    ci_workflows: workflows,
    lean_theorems_locked: {
      value: 8,
      label: 'REPORTED' as const,
      source: 'lutar-lean/Locked8.lean',
    },
    lean_sorry_count: leanSorry,
    lambda_overhead_ms_median: lambda,
  };
  const remoteMetrics = {
    db_tables: dbTableCount(),
    hf_models: hfModels,
    hf_datasets: hfDatasets,
    hf_spaces: hfSpaces,
    hf_collections: hfCollections,
    receipt_chain_depth: chainDepth,
  };

  if (VERIFY_LOCAL_MODE) {
    if (!existing) throw new Error('artifacts/SOURCE_OF_TRUTH.json is missing or invalid');
    const metadata = metadataDrift(existing);
    if (metadata.length > 0) {
      throw new Error(`truth metadata drift: ${metadata.join(', ')}`);
    }
    const existingMetrics = existing.metrics as Record<string, unknown> | undefined;
    if (!existingMetrics) throw new Error('artifacts/SOURCE_OF_TRUTH.json lacks metrics');
    const drift = metricDrift(existingMetrics, localMetrics, LOCAL_METRIC_NAMES);
    if (drift.length > 0) {
      throw new Error(`local truth drift: ${drift.join(', ')}`);
    }
    if (VERIFY_REMOTE_MODE) {
      const remoteDrift = metricDrift(existingMetrics, remoteMetrics, REMOTE_METRIC_NAMES);
      if (remoteDrift.length > 0) {
        throw new Error(`remote truth drift: ${remoteDrift.join(', ')}`);
      }
    }
    process.stdout.write('local truth verification: PASS\n');
    return;
  }

  const truth = {
    schema: TRUTH_SCHEMA,
    generated_at: new Date().toISOString(),
    generated_by: TRUTH_GENERATOR_ID,
    metrics: {
      ...localMetrics,
      ...remoteMetrics,
    },
    doi: TRUTH_DOI,
  };

  await writeFile(OUTPUT, `${JSON.stringify(truth, null, 2)}\n`, 'utf8');
  process.stdout.write(`${path.relative(ROOT, OUTPUT).replaceAll('\\', '/')} generated\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]).toLowerCase() : '';
if (invokedPath === fileURLToPath(import.meta.url).toLowerCase()) {
  void main().catch((error: unknown) => {
    process.stderr.write(`truth generation failed: ${String(error)}\n`);
    process.exit(1);
  });
}
