#!/usr/bin/env node
/**
 * Validate the canonical platform metrics without depending on POSIX shell
 * utilities. Counts come from Git's tracked-file index so the check also works
 * in a sparse checkout.
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

function trackedPaths() {
  return git(['ls-files', '-z']).split('\0').filter(Boolean);
}

function trackedText(path) {
  const diskPath = resolve(ROOT, path);
  if (existsSync(diskPath)) return readFileSync(diskPath, 'utf8');
  return git(['show', `:${path}`]);
}

function topLevelDirectories(paths, prefix) {
  const directories = new Set();
  const marker = `${prefix}/`;
  for (const path of paths) {
    if (!path.startsWith(marker)) continue;
    const remainder = path.slice(marker.length);
    const separator = remainder.indexOf('/');
    if (separator <= 0) continue;
    directories.add(remainder.slice(0, separator));
  }
  return directories;
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function parseCountTable(path, valueHeading) {
  const rows = new Map();
  const lines = trackedText(path).split('\n');
  let metricIndex = -1;
  let valueIndex = -1;
  let inTable = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('|')) {
      inTable = false;
      continue;
    }

    const cells = line
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim());

    if (cells.includes('Metric') && cells.includes(valueHeading)) {
      metricIndex = cells.indexOf('Metric');
      valueIndex = cells.indexOf(valueHeading);
      inTable = true;
      continue;
    }

    if (!inTable || cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
    const metric = cells[metricIndex]?.replaceAll('`', '');
    const rawValue = cells[valueIndex]?.replaceAll('*', '').replaceAll(',', '');
    const numeric = rawValue?.match(/\d+/);
    if (metric && numeric) rows.set(metric, Number.parseInt(numeric[0], 10));
  }

  return rows;
}

const truth = JSON.parse(trackedText('audit/source-of-truth.json'));
const paths = trackedPaths();

const artifactManifests = paths.filter((path) =>
  /^artifacts\/[^/]+\/(?:\.replit-artifact\/)?artifact\.toml$/.test(path),
);
const registeredArtifactNames = artifactManifests.map((path) => path.split('/')[1]);
const registeredProductVerticals = registeredArtifactNames.filter((name) => name !== 'a11oy');

const sourceExtensions = /\.(?:ts|tsx|js|mjs)$/;
const testPath = /(?:^|\/)(?:__tests__|test|tests)(?:\/|$)|\.(?:test|spec)\./;
const runtimeSourcePaths = paths.filter(
  (path) =>
    /^(?:apps|services|artifacts\/api-server)\//.test(path) &&
    sourceExtensions.test(path) &&
    !testPath.test(path),
);
const routeSourcePaths = runtimeSourcePaths.filter((path) => /\/routes\//.test(path));
const dbSchemaPaths = paths.filter((path) => /^lib\/db\/src\/schema\/.*\.ts$/.test(path));

const actual = {
  registeredArtifacts: artifactManifests.length,
  artifactDirectories: topLevelDirectories(paths, 'artifacts').size,
  productVerticals: registeredProductVerticals.length,
  packages: topLevelDirectories(paths, 'packages').size,
  sharedLibs: topLevelDirectories(paths, 'lib').size,
  apps: topLevelDirectories(paths, 'apps').size,
  services: topLevelDirectories(paths, 'services').size,
  workers: topLevelDirectories(paths, 'workers').size,
  dbSchemaFiles: dbSchemaPaths.length,
  dbTableCallSites: dbSchemaPaths.reduce(
    (sum, path) => sum + countMatches(trackedText(path), /\bpgTable\s*\(/g),
    0,
  ),
  dbMigrations: paths.filter((path) => /^lib\/db\/drizzle\/[^/]+\.sql$/.test(path)).length,
  apiRouteSourceFiles: routeSourcePaths.length,
  apiHandlerDeclarations: runtimeSourcePaths.reduce(
    (sum, path) =>
      sum +
      countMatches(trackedText(path), /\b(?:router|app)\.(?:get|post|put|patch|delete|use)\s*\(/g),
    0,
  ),
  workflows: paths.filter((path) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(path)).length,
  envVars: trackedText('.env.example')
    .split('\n')
    .filter((line) => /^[A-Z_]+=/.test(line)).length,
};

const filesystemChecks = [
  {
    name: 'Registered artifacts',
    expected: truth.artifacts.registered.count,
    actual: actual.registeredArtifacts,
  },
  {
    name: 'Artifact directories',
    expected: truth.artifacts.total_on_disk.count,
    actual: actual.artifactDirectories,
  },
  {
    name: 'Registered product verticals',
    expected: truth.product_verticals.registered.count,
    actual: actual.productVerticals,
  },
  {
    name: 'Domain packages',
    expected: truth.packages.domain_packages_dir.count,
    actual: actual.packages,
  },
  {
    name: 'Shared library packages',
    expected: truth.packages.shared_lib_packages.count,
    actual: actual.sharedLibs,
  },
  {
    name: 'Total packages',
    expected: truth.packages.total_packages.count,
    actual: actual.packages + actual.sharedLibs,
  },
  {
    name: 'Apps',
    expected: truth.packages.apps.count,
    actual: actual.apps,
  },
  {
    name: 'Services',
    expected: truth.packages.services.count,
    actual: actual.services,
  },
  {
    name: 'Workers',
    expected: truth.packages.workers.count,
    actual: actual.workers,
  },
  {
    name: 'DB schema files',
    expected: truth.database.schema_files.count,
    actual: actual.dbSchemaFiles,
  },
  {
    name: 'DB pgTable call sites',
    expected: truth.database.pg_table_call_sites.count,
    actual: actual.dbTableCallSites,
  },
  {
    name: 'DB migrations',
    expected: truth.database.migration_files.count,
    actual: actual.dbMigrations,
  },
  {
    name: 'API route source files',
    expected: truth.api.route_source_files.count,
    actual: actual.apiRouteSourceFiles,
  },
  {
    name: 'API handler declarations',
    expected: truth.api.handler_declarations.count,
    actual: actual.apiHandlerDeclarations,
  },
  {
    name: 'CI workflows',
    expected: truth.ci.workflows.count,
    actual: actual.workflows,
  },
  {
    name: 'Environment variables',
    expected: truth.env.declared_vars.count,
    actual: actual.envVars,
  },
];

const auditReadmeText = trackedText('audit/README.md');
const auditReadme = parseCountTable('audit/README.md', 'Verified Count');
const humanTruth = parseCountTable('SOURCE_OF_TRUTH.md', 'Canonical Value');

const documentationChecks = [
  ['Registered artifacts', truth.artifacts.registered.count],
  ['Artifact directories', truth.artifacts.total_on_disk.count],
  ['Registered product verticals', truth.product_verticals.registered.count],
  ['Domain packages (packages/)', truth.packages.domain_packages_dir.count],
  ['Shared library packages (lib/)', truth.packages.shared_lib_packages.count],
  ['Total packages (packages/ + lib/)', truth.packages.total_packages.count],
  ['Apps (apps/)', truth.packages.apps.count],
  ['Services (services/)', truth.packages.services.count],
  ['Workers (workers/)', truth.packages.workers.count],
  ['DB schema files', truth.database.schema_files.count],
  ['DB pgTable call sites', truth.database.pg_table_call_sites.count],
  ['DB migrations (SQL files)', truth.database.migration_files.count],
  ['API route source files', truth.api.route_source_files.count],
  ['API handler declarations', truth.api.handler_declarations.count],
  ['CI workflows', truth.ci.workflows.count],
  ['Environment variables (in .env.example)', truth.env.declared_vars.count],
];

const crossDocumentChecks = [];
for (const [name, expected] of documentationChecks) {
  crossDocumentChecks.push({
    name: `audit/README.md: ${name}`,
    expected,
    actual: auditReadme.get(name) ?? -1,
  });
  crossDocumentChecks.push({
    name: `SOURCE_OF_TRUTH.md: ${name}`,
    expected,
    actual: humanTruth.get(name) ?? -1,
  });
}

const doctrineChecks = [
  ['Doctrine declarations', truth.doctrine_v11.declarations.count, 749],
  ['Doctrine unique axioms', truth.doctrine_v11.unique_axioms.count, 14],
  ['Doctrine tracked sorries', truth.doctrine_v11.tracked_sorries.count, 163],
  ['Doctrine locked formulas', truth.doctrine_v11.locked_formulas.count, 8],
  ['Doctrine kernel commit', truth.doctrine_v11.kernel_commit, 'c7c0ba17'],
];

const glossary = trackedText('docs/GLOSSARY.md');
const canonicalTruth = trackedText('SOURCE_OF_TRUTH.md');
const overclaimLedger = JSON.parse(
  readFileSync(resolve(ROOT, 'docs/overclaim-ledger.json'), 'utf8'),
);
const vocabularyChecks = [
  'Holographic state',
  'Product vertical',
  'Runtime organ',
  'Policy gate module',
].map((term) => ({
  name: `Glossary defines "${term}"`,
  expected: true,
  actual: glossary.includes(`**${term}**`),
}));
vocabularyChecks.push({
  name: 'Canonical truth avoids governed ambiguous-surface phrases',
  expected: false,
  actual: /\b(?:holographic|customer-facing|organ|policy gate) surfaces?\b/i.test(canonicalTruth),
});

const observedGovernanceChecks = [
  {
    name: 'SOURCE_OF_TRUTH.md registry version',
    expected: true,
    actual: canonicalTruth.includes(`**Registry version:** ${truth.meta.version}`),
  },
  {
    name: 'audit/README.md registry version',
    expected: true,
    actual: auditReadmeText.includes(`audit/source-of-truth.json\` v${truth.meta.version}`),
  },
  {
    name: 'Overclaim incident count',
    expected: truth.overclaim_governance.ci_detected_incidents,
    actual: overclaimLedger.metrics.ci_detected_incidents,
  },
  {
    name: 'Overclaim mean correction seconds',
    expected: truth.overclaim_governance.mean_time_to_correction_seconds,
    actual: overclaimLedger.metrics.mean_time_to_correction_seconds,
  },
  {
    name: 'Overclaim mean correction display',
    expected: truth.overclaim_governance.mean_time_to_correction_display,
    actual: overclaimLedger.metrics.mean_time_to_correction_display,
  },
];

let failures = 0;

function printChecks(title, checks) {
  console.log(`\n-- ${title} --`);
  for (const { name, expected, actual } of checks) {
    const ok = expected === actual;
    if (!ok) failures += 1;
    const status = ok ? 'PASS' : 'FAIL';
    const detail = ok ? `${actual}` : `expected=${expected} actual=${actual}`;
    console.log(`  ${status}  ${name}: ${detail}`);
  }
}

console.log(`Source-of-truth validation — ${new Date().toISOString()}`);
console.log(`SOT version: ${truth.meta.version}  generated: ${truth.meta.generated}`);

printChecks('Tracked tree vs source-of-truth.json', filesystemChecks);
printChecks('Canonical documents vs source-of-truth.json', crossDocumentChecks);
printChecks(
  'Locked Doctrine v11 contract',
  doctrineChecks.map(([name, actualValue, expectedValue]) => ({
    name,
    expected: expectedValue,
    actual: actualValue,
  })),
);
printChecks('Canonical vocabulary', vocabularyChecks);
printChecks('Observed governance metrics', observedGovernanceChecks);

console.log('\n-- Result --');
if (failures > 0) {
  console.log(`  FAILED — ${failures} check(s) failed`);
  process.exit(1);
}

console.log(
  `  ALL PASS — ${
    filesystemChecks.length +
    crossDocumentChecks.length +
    doctrineChecks.length +
    vocabularyChecks.length +
    observedGovernanceChecks.length
  } checks passed`,
);

await import('./validate-overclaim-ledger.js');
