#!/usr/bin/env node
/**
 * audit:deps — SZL Holdings Platform
 * Checks for duplicate dependency declarations across workspace packages.
 *
 * Usage:
 *   node scripts/qa/audit-deps.js
 */

import { readdirSync, readFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

function findPackageJsonFiles(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist', 'build', '.cache'].includes(entry.name)) continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findPackageJsonFiles(fullPath));
      } else if (entry.name === 'package.json') {
        results.push(fullPath);
      }
    }
  } catch {
    // skip
  }
  return results;
}

function loadPackageJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  console.log('\nSZL Holdings — Dependency Audit');
  console.log('Checking for duplicate and conflicting package versions across workspace...\n');

  const pkgFiles = findPackageJsonFiles(ROOT);
  const packages = [];

  for (const filePath of pkgFiles) {
    const pkg = loadPackageJson(filePath);
    if (!pkg || pkg.name === 'workspace') continue;

    const rel = relative(ROOT, filePath);
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };

    packages.push({ name: pkg.name ?? rel, path: rel, deps: allDeps });
  }

  // Find packages that appear in multiple locations with different versions
  const depVersionMap = new Map(); // depName -> [{pkgName, version}]

  for (const pkg of packages) {
    for (const [dep, version] of Object.entries(pkg.deps)) {
      if (!depVersionMap.has(dep)) {
        depVersionMap.set(dep, []);
      }
      depVersionMap.get(dep).push({ pkgName: pkg.name, version });
    }
  }

  const conflicts = [];
  for (const [dep, entries] of depVersionMap) {
    const versions = new Set(entries.map((e) => e.version));
    if (versions.size > 1) {
      // Ignore catalog: entries — they're resolved centrally
      const nonCatalog = [...versions].filter(
        (v) => !v.startsWith('catalog:') && !v.startsWith('workspace:'),
      );
      if (nonCatalog.length > 1) {
        conflicts.push({ dep, entries, versions: [...versions] });
      }
    }
  }

  // Check for packages that should use catalog: but don't
  const SHOULD_USE_CATALOG = [
    'react',
    'react-dom',
    '@types/react',
    '@types/react-dom',
    'typescript',
    'tsx',
  ];
  const catalogViolations = [];

  for (const pkg of packages) {
    for (const [dep, version] of Object.entries(pkg.deps)) {
      if (
        SHOULD_USE_CATALOG.includes(dep) &&
        !version.startsWith('catalog:') &&
        !version.startsWith('workspace:')
      ) {
        catalogViolations.push({ pkgName: pkg.name, dep, version });
      }
    }
  }

  console.log(`Scanned ${packages.length} package.json files`);
  console.log(`Found ${depVersionMap.size} unique dependencies`);
  console.log(`Found ${conflicts.length} version conflict(s)`);
  console.log(`Found ${catalogViolations.length} catalog: violation(s)\n`);

  if (conflicts.length > 0) {
    console.log('VERSION CONFLICTS:');
    for (const { dep, entries, versions } of conflicts) {
      console.warn(`  [CONFLICT] ${dep}: ${versions.join(' vs ')}`);
      for (const { pkgName, version } of entries) {
        console.warn(`    → ${pkgName}: ${version}`);
      }
    }
    console.log('');
  }

  if (catalogViolations.length > 0) {
    console.log('CATALOG: VIOLATIONS (should use catalog: for shared deps):');
    for (const { pkgName, dep, version } of catalogViolations) {
      console.warn(`  [CATALOG] ${pkgName}: "${dep}": "${version}" — use catalog:`);
    }
    console.log('');
  }

  const totalIssues = conflicts.length + catalogViolations.length;
  if (totalIssues === 0) {
    console.log('PASS — No dependency conflicts found.');
    process.exit(0);
  } else {
    console.log(
      `WARN — ${totalIssues} issue(s) found. Review above and harmonize via pnpm-workspace catalog.`,
    );
    process.exit(0); // advisory — doesn't block deployment
  }
}

main();
