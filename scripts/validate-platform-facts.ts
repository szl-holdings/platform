#!/usr/bin/env tsx
/**
 * validate-platform-facts.ts
 *
 * Validates the platform-metrics-registry against current filesystem state.
 * Exits with code 0 if within tolerance, 1 if errors detected.
 *
 * Usage:
 *   tsx scripts/validate-platform-facts.ts
 *   tsx scripts/validate-platform-facts.ts --strict   # treat warnings as errors
 *
 * Run in CI to catch platform fact drift before merge.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PLATFORM_FACTS } from '../packages/platform-metrics-registry/src/registry.js';
import { validateFacts } from '../packages/platform-metrics-registry/src/validate.js';

const ROOT = resolve(import.meta.dirname ?? process.cwd(), '..');
const STRICT = process.argv.includes('--strict');

function countDir(path: string): number {
  if (!existsSync(path)) return 0;
  try {
    return readdirSync(path).filter((entry) => statSync(join(path, entry)).isDirectory()).length;
  } catch {
    return 0;
  }
}

function countRegisteredArtifacts(): number {
  const replitPath = join(ROOT, '.replit');
  if (!existsSync(replitPath)) return 0;
  const content = readFileSync(replitPath, 'utf-8');
  const matches = content.match(/\[\[artifacts\]\]/g);
  return matches ? matches.length : 0;
}

const observed = {
  artifactCount: countDir(join(ROOT, 'artifacts')),
  activeArtifactCount: countRegisteredArtifacts(),
  packageCount: countDir(join(ROOT, 'packages')),
  libCount: countDir(join(ROOT, 'lib')),
  workerCount: countDir(join(ROOT, 'workers')),
  serviceCount: countDir(join(ROOT, 'services')),
  appCount: countDir(join(ROOT, 'apps')),
};

const report = validateFacts(observed, PLATFORM_FACTS);

if (report.driftItems.length === 0) {
} else {
  for (const item of report.driftItems) {
    const _icon = item.severity === 'error' ? '✗' : '⚠';
  }
}

const hasErrors = report.driftItems.some((i) => i.severity === 'error');
const hasWarnings = report.driftItems.some((i) => i.severity === 'warning');

if (hasErrors || (STRICT && hasWarnings)) {
  process.exit(1);
}
process.exit(0);
