#!/usr/bin/env node
/**
 * Fail closed if the workspace can resolve a vulnerable fflate release.
 *
 * GHSA ranges fixed by the current estate policy:
 *   0.4.x >= 0.4.9
 *   0.5.x >= 0.5.4
 *   0.6.x >= 0.6.11
 *   0.7.x >= 0.7.5
 *   0.8.x >= 0.8.3
 *
 * The monorepo deliberately converges every edge on 0.8.3 so the assertion is
 * deterministic and Dependabot can reason from one lockfile authority.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../..');
const WORKSPACE = readFileSync(join(ROOT, 'pnpm-workspace.yaml'), 'utf8');
const LOCKFILE = readFileSync(join(ROOT, 'pnpm-lock.yaml'), 'utf8');

function fail(message) {
  console.error(`[fflate-resolution] BLOCKED: ${message}`);
  process.exit(1);
}

if (!/^\s{2}fflate:\s+0\.8\.3\s*$/m.test(WORKSPACE)) {
  fail('pnpm-workspace.yaml must pin the central fflate override to 0.8.3');
}

const packageVersions = [
  ...LOCKFILE.matchAll(/^\s{2}fflate@([^:]+):/gm),
].map((match) => match[1]);

if (packageVersions.length === 0) {
  fail('pnpm-lock.yaml contains no fflate package resolution');
}

const uniqueVersions = [...new Set(packageVersions)].sort();
if (uniqueVersions.length !== 1 || uniqueVersions[0] !== '0.8.3') {
  fail(`expected exactly fflate@0.8.3, observed ${uniqueVersions.join(', ')}`);
}

const dependencyEdges = [
  ...LOCKFILE.matchAll(/^\s{6}fflate:\s+([^\s]+)\s*$/gm),
].map((match) => match[1]);

if (dependencyEdges.length === 0) {
  fail('pnpm-lock.yaml contains no dependency edge to fflate');
}

const badEdges = dependencyEdges.filter((version) => version !== '0.8.3');
if (badEdges.length > 0) {
  fail(`non-converged dependency edges remain: ${[...new Set(badEdges)].join(', ')}`);
}

for (const forbidden of [
  'fflate@0.4.8',
  'fflate@0.5.3',
  'fflate@0.6.10',
  'fflate@0.7.4',
  'fflate@0.8.2',
]) {
  if (LOCKFILE.includes(forbidden)) {
    fail(`vulnerable lock entry remains: ${forbidden}`);
  }
}

console.log(
  `[fflate-resolution] PASS: ${dependencyEdges.length} dependency edge(s) converge on fflate@0.8.3`,
);
