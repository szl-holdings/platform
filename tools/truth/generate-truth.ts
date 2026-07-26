#!/usr/bin/env node
/**
 * Generate the Series A truth-lock artifact.
 *
 * Design constraints:
 * - every metric has an evidence label and a reproducible source;
 * - missing or unreachable sources become UNAVAILABLE, never stale carry-forward;
 * - --check ignores only generation metadata and fails on metric drift;
 * - no private credentials or response bodies are written to the artifact.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type EvidenceLabel =
  | 'MEASURED'
  | 'REPORTED'
  | 'MODELED'
  | 'CONJECTURE'
  | 'UNKNOWN'
  | 'UNAVAILABLE';

export type TruthMetric<T = number | string | boolean> = {
  value: T | null;
  label: EvidenceLabel;
  source: string;
  definition: string;
  reason?: string;
};

type TestSummary = { passed: number; total: number };
export type TruthTestMetric = {
  passed: number | null;
  total: number | null;
  label: EvidenceLabel;
  source: string;
  definition: string;
  reason?: string;
};

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT = join(ROOT, 'artifacts', 'SOURCE_OF_TRUTH.json');
const SKIP_DIRS = new Set([
  '.git',
  '.lake',
  'archive',
  'attached_assets',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
]);

function writeOut(message: string): void {
  process.stdout.write(`${message}\n`);
}

function writeError(message: string): void {
  process.stderr.write(`${message}\n`);
}

function metric<T extends number | string | boolean>(
  value: T,
  label: EvidenceLabel,
  source: string,
  definition: string,
): TruthMetric<T> {
  return { value, label, source, definition };
}

function unavailable(source: string, definition: string, reason: string): TruthMetric {
  return {
    value: null,
    label: 'UNAVAILABLE',
    source,
    definition,
    reason,
  };
}

function unavailableTest(source: string, reason: string): TruthTestMetric {
  return {
    passed: null,
    total: null,
    label: 'UNAVAILABLE',
    source,
    definition: 'Passed and total tests from a fresh machine-readable test run.',
    reason,
  };
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function listFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push(join(current, entry.name));
      } else if (entry.isFile()) {
        files.push(join(current, entry.name));
      }
    }
  }
  return files;
}

function countImmediatePackageManifests(parent: string, found: Set<string>): void {
  if (!existsSync(parent)) return;
  for (const entry of readdirSync(parent, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const packageJson = join(parent, entry.name, 'package.json');
    if (existsSync(packageJson)) found.add(packageJson);
  }
}

export function countWorkspacePackages(root = ROOT): number {
  const manifests = new Set<string>();
  for (const parent of [
    'apps',
    'artifacts',
    'lib',
    'lib/integrations',
    'packages',
    'services',
    'workers',
  ]) {
    countImmediatePackageManifests(join(root, parent), manifests);
  }
  for (const exact of [
    'scripts/package.json',
    'platform/temporal/package.json',
    'platform/agent-gateway/package.json',
  ]) {
    const path = join(root, exact);
    if (existsSync(path)) manifests.add(path);
  }
  manifests.delete(join(root, 'artifacts', 'imperium', 'package.json'));
  manifests.delete(join(root, 'artifacts', 'stephen-site', 'package.json'));
  return manifests.size;
}

function countRouteRegistrations(root = ROOT): number {
  const roots = [
    join(root, 'apps'),
    join(root, 'artifacts', 'api-server', 'src', 'routes'),
    join(root, 'services'),
  ];
  const routeCall =
    /\b(?:app|router|server)\s*\.\s*(?:get|post|put|patch|delete|options|head|all)\s*\(/g;
  let count = 0;
  for (const scanRoot of roots) {
    for (const path of listFiles(scanRoot)) {
      if (!/\.(?:ts|tsx|js|jsx)$/.test(path)) continue;
      if (/\.(?:test|spec)\.[cm]?[jt]sx?$/.test(path)) continue;
      const normalized = path.replaceAll('\\', '/');
      if (
        !normalized.includes('/routes/') &&
        !/(?:route|router|server)\.[cm]?[jt]sx?$/.test(normalized)
      ) {
        continue;
      }
      count += readFileSync(path, 'utf8').match(routeCall)?.length ?? 0;
    }
  }
  return count;
}

function countDrizzleDefinitions(root = ROOT): number {
  const schemaRoot = join(root, 'lib', 'db', 'src', 'schema');
  const tableCall = /\b(?:pgTable|mysqlTable|sqliteTable)\s*\(/g;
  let count = 0;
  for (const path of listFiles(schemaRoot)) {
    if (!/\.[cm]?[jt]s$/.test(path)) continue;
    count += readFileSync(path, 'utf8').match(tableCall)?.length ?? 0;
  }
  return count;
}

function countCiWorkflows(root = ROOT): number {
  const workflows = join(root, '.github', 'workflows');
  if (!existsSync(workflows)) return 0;
  return readdirSync(workflows).filter((name) => /\.ya?ml$/.test(name)).length;
}

function countSurfaceManifests(root = ROOT): number {
  const apps = join(root, 'apps');
  if (!existsSync(apps)) return 0;
  return readdirSync(apps, { withFileTypes: true }).filter(
    (entry) => entry.isDirectory() && existsSync(join(apps, entry.name, 'product.manifest.json')),
  ).length;
}

export function parseTestSummary(input: unknown): TestSummary | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  if (typeof value.numPassedTests === 'number' && typeof value.numTotalTests === 'number') {
    return { passed: value.numPassedTests, total: value.numTotalTests };
  }
  if (!Array.isArray(value.testResults)) return null;
  let passed = 0;
  let total = 0;
  for (const suite of value.testResults) {
    if (!suite || typeof suite !== 'object') continue;
    const assertions = (suite as Record<string, unknown>).assertionResults;
    if (!Array.isArray(assertions)) continue;
    for (const assertion of assertions) {
      if (!assertion || typeof assertion !== 'object') continue;
      total += 1;
      if ((assertion as Record<string, unknown>).status === 'passed') passed += 1;
    }
  }
  return total > 0 ? { passed, total } : null;
}

function testMetric(path: string, source: string): TruthTestMetric {
  if (!existsSync(path)) {
    return unavailableTest(source, 'SOURCE_MISSING');
  }
  try {
    const summary = parseTestSummary(readJson(path));
    if (!summary) throw new Error('unsupported test result schema');
    return {
      passed: summary.passed,
      total: summary.total,
      label: 'MEASURED',
      source,
      definition: 'Passed and total tests from a fresh machine-readable test run.',
    };
  } catch {
    return unavailableTest(source, 'SOURCE_INVALID');
  }
}

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const requestUrl = new URL(url);
  const githubToken = process.env.GITHUB_TOKEN?.trim();
  const authenticatedHeaders =
    requestUrl.hostname === 'api.github.com' && githubToken
      ? { Authorization: `Bearer ${githubToken}` }
      : {};
  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...authenticatedHeaders, ...headers },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return response.json();
}

async function remoteCount(
  url: string,
  source: string,
  definition: string,
): Promise<TruthMetric<number>> {
  try {
    const payload = await fetchJson(url);
    if (!Array.isArray(payload)) throw new Error('SOURCE_INVALID');
    return metric(payload.length, 'MEASURED', source, definition);
  } catch {
    return unavailable(source, definition, 'FETCH_FAILED') as TruthMetric<number>;
  }
}

async function countPublicGithubRepos(): Promise<TruthMetric<number>> {
  const source = 'GitHub REST /orgs/szl-holdings/repos?type=public';
  const definition =
    'Current public repositories returned by GitHub; archived repositories remain included.';
  try {
    let page = 1;
    let total = 0;
    while (true) {
      const payload = await fetchJson(
        `https://api.github.com/orgs/szl-holdings/repos?type=public&per_page=100&page=${page}`,
      );
      if (!Array.isArray(payload)) throw new Error('SOURCE_INVALID');
      total += payload.length;
      if (payload.length < 100) break;
      page += 1;
    }
    return metric(total, 'MEASURED', source, definition);
  } catch {
    return unavailable(source, definition, 'FETCH_FAILED') as TruthMetric<number>;
  }
}

async function probeGhcrA11oy(): Promise<TruthMetric<boolean>> {
  const source = 'GHCR v2 tags probe for ghcr.io/szl-holdings/a11oy';
  const definition =
    'True only when the public registry grants pull scope and returns at least one tag; this is not a total package count.';
  try {
    const auth = (await fetchJson(
      'https://ghcr.io/token?service=ghcr.io&scope=repository:szl-holdings/a11oy:pull',
    )) as Record<string, unknown>;
    if (typeof auth.token !== 'string') throw new Error('AUTH_FAILED');
    const tags = (await fetchJson('https://ghcr.io/v2/szl-holdings/a11oy/tags/list', {
      Authorization: `Bearer ${auth.token}`,
    })) as Record<string, unknown>;
    return metric(Array.isArray(tags.tags) && tags.tags.length > 0, 'MEASURED', source, definition);
  } catch {
    return unavailable(source, definition, 'FETCH_FAILED') as TruthMetric<boolean>;
  }
}

async function latestZenodoDoi(): Promise<TruthMetric<string>> {
  const source = 'Zenodo REST /api/records/19944926';
  const definition = 'Latest version DOI resolved from the stable SZL Holdings concept record.';
  try {
    const payload = (await fetchJson('https://zenodo.org/api/records/19944926')) as Record<
      string,
      unknown
    >;
    if (typeof payload.doi !== 'string') throw new Error('SOURCE_INVALID');
    return metric(payload.doi, 'MEASURED', source, definition);
  } catch {
    return unavailable(source, definition, 'FETCH_FAILED') as TruthMetric<string>;
  }
}

async function receiptChainDepth(): Promise<TruthMetric<number>> {
  const url = process.env.RECEIPT_HEAD_URL ?? 'https://a11oy.net/api/a11oy/v1/receipts/head';
  const source = 'GET /api/a11oy/v1/receipts/head';
  const definition = 'Depth reported by the canonical live receipt-chain head endpoint.';
  try {
    const payload = (await fetchJson(url)) as Record<string, unknown>;
    const candidate = payload.depth ?? payload.chain_depth ?? payload.height;
    if (typeof candidate !== 'number') throw new Error('SOURCE_INVALID');
    return metric(candidate, 'MEASURED', source, definition);
  } catch {
    return unavailable(source, definition, 'ENDPOINT_UNAVAILABLE') as TruthMetric<number>;
  }
}

function lambdaMedian(): TruthMetric<number> {
  const source = 'artifacts/lambda-benchmark.json';
  const definition = 'Median measured Lambda overhead in milliseconds.';
  const path = join(ROOT, source);
  if (!existsSync(path)) {
    return unavailable(source, definition, 'SOURCE_MISSING') as TruthMetric<number>;
  }
  try {
    const payload = readJson(path) as Record<string, unknown>;
    const value = payload.median_ms ?? payload.lambda_overhead_ms_median;
    if (typeof value !== 'number') throw new Error('SOURCE_INVALID');
    return metric(value, 'MEASURED', source, definition);
  } catch {
    return unavailable(source, definition, 'SOURCE_INVALID') as TruthMetric<number>;
  }
}

function gitHead(): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 10_000,
    }).trim();
  } catch {
    return 'UNAVAILABLE';
  }
}

export async function buildTruth(now = new Date()): Promise<Record<string, unknown>> {
  const surfaceManifests = countSurfaceManifests();
  const hfBase = 'https://huggingface.co/api';
  const [hfModels, hfDatasets, hfSpaces, githubRepos, ghcrA11oy, zenodoLatest, chainDepth] =
    await Promise.all([
      remoteCount(
        `${hfBase}/models?author=SZLHOLDINGS&limit=1000`,
        'Hugging Face API /api/models?author=SZLHOLDINGS',
        'Current public models attributed to the SZLHOLDINGS account.',
      ),
      remoteCount(
        `${hfBase}/datasets?author=SZLHOLDINGS&limit=1000`,
        'Hugging Face API /api/datasets?author=SZLHOLDINGS',
        'Current public datasets attributed to the SZLHOLDINGS account.',
      ),
      remoteCount(
        `${hfBase}/spaces?author=SZLHOLDINGS&limit=1000`,
        'Hugging Face API /api/spaces?author=SZLHOLDINGS',
        'Current public Spaces attributed to the SZLHOLDINGS account.',
      ),
      countPublicGithubRepos(),
      probeGhcrA11oy(),
      latestZenodoDoi(),
      receiptChainDepth(),
    ]);

  return {
    schema: 'szl.truth/v1',
    generated_at: now.toISOString(),
    generated_by: gitHead(),
    metrics: {
      surfaces_customer_facing: metric(
        surfaceManifests,
        'MEASURED',
        'apps/*/product.manifest.json',
        'Customer-facing verticals satisfying the mandatory manifest condition. A non-zero count also requires live health and receipt conformance before publication.',
      ),
      platform_tests: testMetric(
        join(ROOT, 'artifacts', 'test-results.json'),
        'artifacts/test-results.json',
      ),
      ouroboros_tests: testMetric(
        process.env.OUROBOROS_TEST_RESULTS ??
          resolve(ROOT, '../ouroboros/artifacts/test-results.json'),
        'fresh Ouroboros Vitest JSON',
      ),
      mcp_e2e_tests: testMetric(
        process.env.MCP_E2E_TEST_RESULTS ?? join(ROOT, 'artifacts', 'mcp-e2e-test-results.json'),
        'artifacts/mcp-e2e-test-results.json',
      ),
      monorepo_packages: metric(
        countWorkspacePackages(),
        'MEASURED',
        'pnpm-workspace.yaml package manifests',
        'Workspace package manifests included by the canonical pnpm workspace, excluding explicit workspace exclusions.',
      ),
      api_endpoints: metric(
        countRouteRegistrations(),
        'MEASURED',
        'static router verb-registration scan',
        'Express-style app/router/server HTTP verb call sites in route-bearing source files; this is a source count, not reachability.',
      ),
      db_tables: unavailable(
        'Drizzle live introspection',
        'Tables present in the live canonical database after Drizzle introspection.',
        'DATABASE_NOT_CONNECTED',
      ),
      db_table_definitions_static: metric(
        countDrizzleDefinitions(),
        'MEASURED',
        'lib/db/src/schema static Drizzle scan',
        'Static pgTable/mysqlTable/sqliteTable call sites; this is not a live provisioned-table count.',
      ),
      ci_workflows: metric(
        countCiWorkflows(),
        'MEASURED',
        '.github/workflows/*.{yml,yaml}',
        'Workflow definition files in the platform repository.',
      ),
      github_public_repositories: githubRepos,
      hf_models: hfModels,
      hf_datasets: hfDatasets,
      hf_spaces: hfSpaces,
      ghcr_a11oy_package_live: ghcrA11oy,
      lean_theorems_locked: metric(
        8,
        'REPORTED',
        'szl-holdings/lutar-lean locked theorem roster',
        'Theorems reported as locked and axiom-free; requires a fresh external Lean build for MEASURED status.',
      ),
      lean_sorry_count: unavailable(
        'fresh lutar-lean lake build log',
        'Sorry declarations observed in a fresh Lean build.',
        'SOURCE_MISSING',
      ),
      doctrine_v11_declarations: metric(
        749,
        'REPORTED',
        'Doctrine v11 lock metadata (docs/architecture/chakras.md)',
        'Lean declarations in the locked Doctrine v11 corpus.',
      ),
      doctrine_v11_unique_axioms: metric(
        14,
        'REPORTED',
        'Doctrine v11 lock metadata (docs/architecture/chakras.md)',
        'Unique axioms tracked across the locked Doctrine v11 corpus; not an axiom-free theorem count.',
      ),
      doctrine_v11_tracked_sorries: metric(
        163,
        'REPORTED',
        'Doctrine v11 lock metadata (docs/architecture/chakras.md)',
        'Tracked sorry obligations across the locked Doctrine v11 corpus.',
      ),
      lambda_overhead_ms_median: lambdaMedian(),
      receipt_chain_depth: chainDepth,
    },
    doi: {
      concept: '10.5281/zenodo.19944926',
      latest: zenodoLatest,
    },
  };
}

export function comparableTruth(truth: Record<string, unknown>): Record<string, unknown> {
  const { generated_at: _generatedAt, generated_by: _generatedBy, ...rest } = truth;
  return rest;
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check');
  const truth = await buildTruth();

  if (check) {
    if (!existsSync(OUTPUT)) {
      writeError('SOURCE_OF_TRUTH missing; run pnpm truth:generate.');
      process.exit(1);
    }
    const committed = readJson(OUTPUT) as Record<string, unknown>;
    const actual = JSON.stringify(comparableTruth(truth));
    const expected = JSON.stringify(comparableTruth(committed));
    if (actual !== expected) {
      writeError(
        'SOURCE_OF_TRUTH drift detected; run pnpm truth:generate and review every changed label/value.',
      );
      process.exit(1);
    }
    writeOut('SOURCE_OF_TRUTH metrics match current sources.');
    return;
  }

  writeFileSync(OUTPUT, `${JSON.stringify(truth, null, 2)}\n`, 'utf8');
  writeOut(`Wrote ${relative(ROOT, OUTPUT)}.`);
}

const entry = process.argv[1] ? resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) {
  await main();
}
