#!/usr/bin/env node
/**
 * audit:deps — SZL Holdings Platform
 * Checks for duplicate dependency declarations across workspace packages.
 *
 * Usage:
 *   node scripts/qa/audit-deps.js
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

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

  if (conflicts.length > 0) {
    for (const { dep, entries, versions } of conflicts) {
      for (const { pkgName, version } of entries) {
      }
    }
  }

  if (catalogViolations.length > 0) {
    for (const { pkgName, dep, version } of catalogViolations) {
    }
  }

  const totalIssues = conflicts.length + catalogViolations.length;
  if (totalIssues === 0) {
    process.exit(0);
  } else {
    process.exit(0); // advisory — doesn't block deployment
  }
}

main();
