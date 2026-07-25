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

const HTTP_ROUTE_METHODS = 'get|post|put|patch|delete|use';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expressReceiverNames(text) {
  const names = new Set(['app', 'router']);
  const declarations = [
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:(?:express\s*\.\s*)?Router|express)\s*\(/g,
    /\b([A-Za-z_$][\w$]*)\s*:\s*(?:Express\s*\.\s*)?I?Router\b/g,
  ];

  for (const declaration of declarations) {
    for (const match of text.matchAll(declaration)) names.add(match[1]);
  }

  return names;
}

function countExpressHandlerDeclarations(text) {
  let count = 0;
  for (const receiver of expressReceiverNames(text)) {
    count += countMatches(
      text,
      new RegExp(`\\b${escapeRegExp(receiver)}\\s*\\.\\s*(?:${HTTP_ROUTE_METHODS})\\s*\\(`, 'g'),
    );
  }
  return count;
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
const routeHandlerCounts = new Map(
  runtimeSourcePaths.map((path) => [path, countExpressHandlerDeclarations(trackedText(path))]),
);
const routeSourcePaths = runtimeSourcePaths.filter((path) => routeHandlerCounts.get(path) > 0);
const dbSchemaPaths = paths.filter((path) => /^lib\/db\/src\/schema\/.*\.ts$/.test(path));
const workspacePackageManifests = paths.filter((path) => {
  if (
    path === 'artifacts/imperium/package.json' ||
    path === 'artifacts/stephen-site/package.json'
  ) {
    return false;
  }
  return (
    /^(?:apps|artifacts|lib|packages|services|workers)\/[^/]+\/package\.json$/.test(path) ||
    /^lib\/integrations\/[^/]+\/package\.json$/.test(path) ||
    /^(?:scripts|platform\/temporal|platform\/agent-gateway)\/package\.json$/.test(path)
  );
});

const actual = {
  registeredArtifacts: artifactManifests.length,
  artifactDirectories: topLevelDirectories(paths, 'artifacts').size,
  productVerticals: registeredProductVerticals.length,
  packages: topLevelDirectories(paths, 'packages').size,
  sharedLibs: topLevelDirectories(paths, 'lib').size,
  workspacePackages: workspacePackageManifests.length,
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
  apiHandlerDeclarations: [...routeHandlerCounts.values()].reduce((sum, count) => sum + count, 0),
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
    name: 'Top-level package directories',
    expected: truth.packages.domain_packages_dir.count,
    actual: actual.packages,
  },
  {
    name: 'Top-level library directories',
    expected: truth.packages.shared_lib_packages.count,
    actual: actual.sharedLibs,
  },
  {
    name: 'Top-level package and library directories',
    expected: truth.packages.total_packages.count,
    actual: actual.packages + actual.sharedLibs,
  },
  {
    name: 'Workspace package manifests',
    expected: truth.packages.workspace_package_manifests.count,
    actual: actual.workspacePackages,
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

const auditReadme = parseCountTable('audit/README.md', 'Verified Count');
const humanTruth = parseCountTable('SOURCE_OF_TRUTH.md', 'Canonical Value');

const documentationChecks = [
  ['Registered artifacts', truth.artifacts.registered.count],
  ['Artifact directories', truth.artifacts.total_on_disk.count],
  ['Registered product verticals', truth.product_verticals.registered.count],
  ['Top-level package directories (packages/)', truth.packages.domain_packages_dir.count],
  ['Top-level library directories (lib/)', truth.packages.shared_lib_packages.count],
  ['Top-level package and library directories', truth.packages.total_packages.count],
  ['Workspace package manifests', truth.packages.workspace_package_manifests.count],
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
const doctrineTruth = parseCountTable('SOURCE_OF_TRUTH.md', 'Locked Value');
const expectedLockedFormulas = ['F1', 'F4', 'F7', 'F11', 'F12', 'F18', 'F19', 'F22'];
const lockedFormulaRow = canonicalTruth
  .split('\n')
  .find((line) => /^\|\s*Locked-proven formulas\s*\|/.test(line));
const documentedLockedFormulas = lockedFormulaRow
  ? [...lockedFormulaRow.matchAll(/\bF\d+\b/g)].map((match) => match[0])
  : [];
const doctrineRepresentationChecks = [
  ['Declarations', truth.doctrine_v11.declarations.count],
  ['Unique axioms', truth.doctrine_v11.unique_axioms.count],
  ['Tracked sorry obligations', truth.doctrine_v11.tracked_sorries.count],
  ['Locked-proven formulas', truth.doctrine_v11.locked_formulas.count],
].map(([name, expected]) => ({
  name: `SOURCE_OF_TRUTH.md Doctrine: ${name}`,
  expected,
  actual: doctrineTruth.get(name) ?? -1,
}));
doctrineRepresentationChecks.push(
  {
    name: 'source-of-truth.json exact locked formula list',
    expected: JSON.stringify(expectedLockedFormulas),
    actual: JSON.stringify(truth.doctrine_v11.locked_formulas.list),
  },
  {
    name: 'SOURCE_OF_TRUTH.md exact locked formula list',
    expected: JSON.stringify(expectedLockedFormulas),
    actual: JSON.stringify(documentedLockedFormulas),
  },
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
printChecks('Locked Doctrine v11 representation', doctrineRepresentationChecks);
printChecks('Canonical vocabulary', vocabularyChecks);

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
    doctrineRepresentationChecks.length +
    vocabularyChecks.length
  } checks passed`,
);
