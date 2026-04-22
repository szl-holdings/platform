#!/usr/bin/env tsx
/**
 * AIS Disclosure Validation
 *
 * Vessels (SEXTANT) markets AIS tracking, but the in-product demos are
 * backed by simulated AIS data. To prevent investor-facing copy from
 * regressing to plain "Live AIS" / "Real-time AIS" claims, this check
 * asserts that each public marketing surface that mentions AIS also
 * carries a clear "simulated" qualifier.
 *
 * Exit codes:
 *   0  — every required file contains the disclosure qualifier
 *   1  — one or more files missing disclosure (printed below)
 *
 * Usage:
 *   pnpm tsx scripts/check-ais-disclosure.ts
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname ?? process.cwd(), '..');

const REQUIRED_DISCLOSURES: Array<{ file: string; mustMatch: RegExp }> = [
  {
    file: 'artifacts/vessels/src/pages/vessels-home.tsx',
    mustMatch: /SIMULATED|simulated/,
  },
  {
    file: 'artifacts/vessels/src/pages/marketing-home.tsx',
    mustMatch: /simulated/i,
  },
  {
    file: 'artifacts/vessels/src/pages/marketing-platform.tsx',
    mustMatch: /simulated/i,
  },
  {
    file: 'artifacts/vessels/src/pages/marketing-capabilities.tsx',
    mustMatch: /simulated/i,
  },
  {
    file: 'artifacts/vessels/src/pages/marketing-pricing.tsx',
    mustMatch: /simulated/i,
  },
  {
    file: 'artifacts/vessels/src/pages/fleet-dashboard.tsx',
    mustMatch: /simulated/i,
  },
  {
    file: 'artifacts/szl-holdings/src/pages/solutions-vessels.tsx',
    mustMatch: /simulated/i,
  },
  {
    file: 'artifacts/szl-holdings/src/pages/landing.tsx',
    mustMatch: /simulated/i,
  },
];

const failures: string[] = [];

for (const { file, mustMatch } of REQUIRED_DISCLOSURES) {
  const path = resolve(ROOT, file);
  let contents: string;
  try {
    contents = readFileSync(path, 'utf8');
  } catch (err) {
    failures.push(`  ${file} — file not readable (${(err as Error).message})`);
    continue;
  }
  if (!/AIS/.test(contents)) {
    failures.push(`  ${file} — file no longer mentions AIS; remove from check or restore copy`);
    continue;
  }
  if (!mustMatch.test(contents)) {
    failures.push(`  ${file} — mentions AIS but missing required "simulated" disclosure qualifier`);
  }
}

if (failures.length > 0) {
  console.error(
    `\n❌  AIS disclosure check FAILED — ${failures.length} file(s) missing the "simulated" qualifier:\n`,
  );
  for (const f of failures) console.error(f);
  console.error(
    '\nFix by adding a "simulated" qualifier to the AIS-tracking copy in the listed file(s).',
  );
  console.error('See docs/screenshots/manifest.md (Task #2892) for context.\n');
  process.exit(1);
}

console.log(
  `✅  AIS disclosure check passed — ${REQUIRED_DISCLOSURES.length} surfaces carry the simulated-AIS qualifier.`,
);
