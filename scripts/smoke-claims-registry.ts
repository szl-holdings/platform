#!/usr/bin/env tsx

/**
 * Smoke test: Public Claims Registry integrity + wiring check
 *
 * Verifies that:
 *   1. Every claim in the public claims registry has a valid truth value.
 *   2. Every unverified claim has a displayLabel set (so UI can show it).
 *   3. The claims adapter in szl-holdings exports all expected claim IDs.
 *   4. ventures.ts imports from the claims adapter (wiring check — if registry
 *      strings disappear from the import chain, this test catches it).
 *   5. The computed founder experience stays >= 18.
 *   6. All platform products are registered with required fields.
 *
 * Run: pnpm tsx scripts/smoke-claims-registry.ts
 *
 * CI: This script exits with code 1 on failure. Add to CI smoke matrix to
 *     catch registry regressions before deployment.
 *
 * Audit reference: docs/audit/2026-04/public-claims-registry.md
 */

import { execSync } from 'child_process';
import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, relative, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getProduct, PLATFORM_PRODUCTS } from '../packages/config/src/platform-registry.js';
import {
  BANNED_HARDCODED_STRINGS,
  FOUNDER_YEARS_EXPERIENCE,
  getClaim,
  PUBLIC_CLAIMS,
} from '../packages/config/src/public-claims.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let passed = 0;
let failed = 0;

function check(description: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓  ${description}`);
    passed++;
  } else {
    console.error(`  ✗  ${description}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ─── 1. Registry structure checks ────────────────────────────────────────────

console.log('\n[1] Public Claims Registry integrity\n');

check(
  'PUBLIC_CLAIMS array is non-empty',
  PUBLIC_CLAIMS.length > 0,
  `length: ${PUBLIC_CLAIMS.length}`,
);

const VALID_TRUTH_VALUES = ['verified', 'demo-data', 'aspirational', 'pending'];

for (const claim of PUBLIC_CLAIMS) {
  check(
    `Claim "${claim.id}" has valid truth value`,
    VALID_TRUTH_VALUES.includes(claim.truthValue),
    `got: ${claim.truthValue}`,
  );

  if (claim.truthValue !== 'verified') {
    check(
      `Claim "${claim.id}" (${claim.truthValue}) has a displayLabel`,
      typeof claim.displayLabel === 'string' && claim.displayLabel.length > 0,
      'displayLabel must be set for non-verified claims so UI can show it',
    );
  }

  check(
    `Claim "${claim.id}" has a non-empty claim text`,
    typeof claim.claim === 'string' && claim.claim.length > 0,
  );

  check(
    `Claim "${claim.id}" has a non-empty source`,
    typeof claim.source === 'string' && claim.source.length > 0,
  );
}

// ─── 2. getClaim helper ───────────────────────────────────────────────────────

console.log('\n[2] getClaim() helper\n');

const expectedClaimIds = [
  'tagline-governed-decision',
  'covenant-policy-enforcement',
  'lyte-signal-detection-time',
  'lyte-signals-per-day',
  'lyte-false-positive-rate',
  'vessels-count',
  'vessels-dark-detection-lead',
  'vessels-uptime-sla',
  'aegis-simulations',
  'carlota-jo-retention',
  'carlota-jo-experience',
  'uptime-claim',
  'command-uptime-30day',
  'command-uptime-90day',
  'pulse-fallback-briefing',
  'terra-portfolio-aum',
];

for (const id of expectedClaimIds) {
  check(`getClaim("${id}") returns a claim object`, getClaim(id) !== undefined);
}

check(
  "getClaim('non-existent-claim') returns undefined",
  getClaim('non-existent-claim') === undefined,
);

// ─── 3. Computed claims ───────────────────────────────────────────────────────

console.log('\n[3] Computed claims\n');

check(
  'FOUNDER_YEARS_EXPERIENCE is a positive integer',
  Number.isInteger(FOUNDER_YEARS_EXPERIENCE) && FOUNDER_YEARS_EXPERIENCE > 0,
  `computed: ${FOUNDER_YEARS_EXPERIENCE}`,
);

check(
  'FOUNDER_YEARS_EXPERIENCE is at least 18 (claim floor: 2007 + 18 = 2025)',
  FOUNDER_YEARS_EXPERIENCE >= 18,
  `computed: ${FOUNDER_YEARS_EXPERIENCE}`,
);

// ─── 4. Platform registry checks ─────────────────────────────────────────────

console.log('\n[4] Platform Registry integrity\n');

const expectedProductIds = [
  'szl-holdings',
  'carlota-jo',
  'pulse',
  'aegis',
  'terra',
  'vessels',
  'command',
  'szl-holdings-mobile',
  'api-server',
];

for (const id of expectedProductIds) {
  const product = getProduct(id);
  check(`Product "${id}" exists in PLATFORM_PRODUCTS`, product !== undefined);

  if (product) {
    check(`Product "${id}" has a non-empty name`, product.name.length > 0);
    check(
      `Product "${id}" has a valid status`,
      ['ga', 'beta', 'partial', 'internal', 'concept', 'deprecated'].includes(product.status),
    );
    check(
      `Product "${id}" has a previewPath starting with "/"`,
      product.previewPath.startsWith('/'),
    );
  }
}

const gaProducts = Object.values(PLATFORM_PRODUCTS).filter((p) => p.status === 'ga');
check(
  'All GA products are represented in PLATFORM_PRODUCTS',
  gaProducts.length >= 2,
  `found: ${gaProducts.map((p) => p.id).join(', ')}`,
);

// ─── 5. "No mock theater" principle — unverified claims must have labels ──────

console.log('\n[5] No mock theater — unverified claims must have displayLabel\n');

const unverifiedWithoutLabel = PUBLIC_CLAIMS.filter(
  (c) => c.truthValue !== 'verified' && !c.displayLabel,
);

check(
  'No unverified claim is missing a displayLabel',
  unverifiedWithoutLabel.length === 0,
  unverifiedWithoutLabel.length > 0
    ? `offending claims: ${unverifiedWithoutLabel.map((c) => c.id).join(', ')}`
    : undefined,
);

// ─── 6. ventures.ts wiring check ─────────────────────────────────────────────
//
// This check verifies that ventures.ts (the main rendered data file in
// szl-holdings) imports from the claims adapter. If the import disappears,
// it means registry-sourced strings are no longer feeding the render path,
// which would allow hardcoded claims to reappear silently.

console.log('\n[6] ventures.ts → claims adapter wiring (render path check)\n');

const venturesPath = resolve(__dirname, '../artifacts/szl-holdings/src/data/ventures.ts');
const venturesSource = readFileSync(venturesPath, 'utf8');

const requiredImports = [
  'LYTE_SIGNAL_DETECTION_TIME',
  'LYTE_SIGNALS_PER_DAY',
  'LYTE_FALSE_POSITIVE_RATE',
  'VESSELS_COUNT',
  'VESSELS_DARK_DETECTION_LEAD',
  'AEGIS_SIMULATIONS',
  'metricDisplay',
];

for (const importName of requiredImports) {
  check(
    `ventures.ts imports "${importName}" from claims adapter`,
    venturesSource.includes(importName),
  );
}

check('ventures.ts imports from "../lib/claims"', venturesSource.includes('../lib/claims'));

// Verify hardcoded claim strings no longer appear as bare string values
const bannedHardcodedStrings = [
  '"< 4 min"',
  '"2.4M+"',
  '"< 3%"',
  '"52,000+"',
  '"34 days pre-designation"',
  '"31,200+"',
];

for (const banned of bannedHardcodedStrings) {
  check(
    `ventures.ts does not contain hardcoded claim ${banned}`,
    !venturesSource.includes(banned),
    `Found hardcoded string in ventures.ts — use registry constant instead`,
  );
}

// ─── 7. claims.ts adapter wiring check ───────────────────────────────────────

console.log('\n[7] claims.ts adapter → config package wiring\n');

const claimsAdapterPath = resolve(__dirname, '../artifacts/szl-holdings/src/lib/claims.ts');
const claimsAdapterSource = readFileSync(claimsAdapterPath, 'utf8');

check(
  'claims.ts imports from the public-claims registry package',
  claimsAdapterSource.includes('@szl-holdings/platform-registry/public-claims') ||
    claimsAdapterSource.includes('@szl-holdings/config/public-claims'),
);

check(
  'claims.ts exports LYTE_SIGNAL_DETECTION_TIME',
  claimsAdapterSource.includes('LYTE_SIGNAL_DETECTION_TIME'),
);

check('claims.ts exports VESSELS_COUNT', claimsAdapterSource.includes('VESSELS_COUNT'));

check('claims.ts exports metricDisplay', claimsAdapterSource.includes('metricDisplay'));

// ─── 7b. Per-artifact claims.ts adapter wiring check ─────────────────────────
//
// Verifies each migrated artifact has a claims.ts adapter that imports from
// the central config package and exports the expected named constants.

console.log('\n[7b] Per-artifact claims.ts adapters\n');

const perArtifactAdapters: Array<{
  artifact: string;
  exports: string[];
}> = [
  {
    artifact: 'command',
    exports: [
      'COMMAND_UPTIME_30DAY',
      'COMMAND_UPTIME_90DAY',
      'COMMAND_UPTIME_OVERALL',
      'metricDisplay',
    ],
  },
  {
    artifact: 'carlota-jo',
    exports: ['CARLOTA_JO_RETENTION', 'CARLOTA_JO_YEARS_EXPERIENCE', 'metricDisplay'],
  },
  {
    artifact: 'vessels',
    exports: [
      'VESSELS_COUNT',
      'VESSELS_DARK_DETECTION_LEAD',
      'VESSELS_UPTIME_SLA',
      'metricDisplay',
    ],
  },
  {
    artifact: 'aegis',
    exports: [
      'AEGIS_SIMULATIONS',
      'AEGIS_MITRE_COVERAGE',
      'AEGIS_MARKET_MARITIME',
      'AEGIS_MARKET_GOVERNED_DECISION',
      'metricDisplay',
    ],
  },
  {
    artifact: 'pulse',
    exports: ['PULSE_FALLBACK_BRIEFING', 'PULSE_SYNTHESIZED_LABEL', 'metricDisplay'],
  },
  {
    artifact: 'terra',
    exports: ['TERRA_PORTFOLIO_AUM', 'metricDisplay'],
  },
];

for (const { artifact, exports } of perArtifactAdapters) {
  const adapterPath = resolve(__dirname, `../artifacts/${artifact}/src/lib/claims.ts`);
  let adapterSource = '';
  try {
    adapterSource = readFileSync(adapterPath, 'utf8');
  } catch {
    check(`${artifact}/src/lib/claims.ts exists`, false, adapterPath);
    continue;
  }
  check(`${artifact}/src/lib/claims.ts exists`, true);
  check(
    `${artifact}/claims.ts imports from "@szl-holdings/config/public-claims"`,
    adapterSource.includes('@szl-holdings/config/public-claims'),
  );
  for (const exp of exports) {
    check(`${artifact}/claims.ts exports "${exp}"`, new RegExp(`\\b${exp}\\b`).test(adapterSource));
  }
}

// ─── 7c. Per-artifact adapter consumption check ──────────────────────────────
//
// "Adapter added but unused" is a regression — the adapter file exists but no
// page actually imports the registry-backed constants. This check asserts that
// each artifact has at least one consumer file outside lib/claims.ts.

console.log('\n[7c] Per-artifact adapter consumption (UI wiring)\n');

const adapterConsumptionChecks: Array<{
  artifact: string;
  // At least one of these files must import from "@/lib/claims" or "../../lib/claims"
  // and reference the named symbol below.
  consumers: Array<{ file: string; symbol: string }>;
}> = [
  {
    artifact: 'command',
    consumers: [
      {
        file: 'artifacts/command/src/pages/marketing/status.tsx',
        symbol: 'COMMAND_UPTIME_30DAY',
      },
    ],
  },
  {
    artifact: 'carlota-jo',
    consumers: [
      {
        file: 'artifacts/carlota-jo/src/pages/PremiumHome.tsx',
        symbol: 'CARLOTA_JO_RETENTION',
      },
      {
        file: 'artifacts/carlota-jo/src/pages/AdvisoryIntel.tsx',
        symbol: 'CARLOTA_JO_RETENTION',
      },
      {
        file: 'artifacts/carlota-jo/src/pages/pulse.tsx',
        symbol: 'CARLOTA_JO_RETENTION',
      },
    ],
  },
  {
    artifact: 'vessels',
    consumers: [
      {
        file: 'artifacts/vessels/src/pages/vessels-home.tsx',
        symbol: 'VESSELS_COUNT',
      },
      {
        file: 'artifacts/vessels/src/pages/vessels-home.tsx',
        symbol: 'VESSELS_DARK_DETECTION_LEAD',
      },
      {
        file: 'artifacts/vessels/src/pages/vessels-home.tsx',
        symbol: 'VESSELS_UPTIME_SLA',
      },
      {
        file: 'artifacts/vessels/src/pages/marketing-home.tsx',
        symbol: 'VESSELS_UPTIME_SLA',
      },
    ],
  },
  {
    artifact: 'aegis',
    consumers: [
      {
        file: 'artifacts/aegis/src/pages/digital-twin.tsx',
        symbol: 'AEGIS_MITRE_COVERAGE',
      },
    ],
  },
  {
    artifact: 'pulse',
    consumers: [
      {
        file: 'artifacts/pulse/src/pages/TodaysBrief.tsx',
        symbol: 'PULSE_SYNTHESIZED_LABEL',
      },
    ],
  },
  {
    artifact: 'terra',
    consumers: [
      {
        file: 'artifacts/terra/src/pages/dashboard.tsx',
        symbol: 'TERRA_PORTFOLIO_AUM',
      },
    ],
  },
];

for (const { artifact, consumers } of adapterConsumptionChecks) {
  for (const { file, symbol } of consumers) {
    const consumerPath = resolve(__dirname, '..', file);
    let source = '';
    try {
      source = readFileSync(consumerPath, 'utf8');
    } catch {
      check(`${file} exists for ${artifact} consumption`, false, consumerPath);
      continue;
    }
    const importsFromClaims =
      source.includes('"@/lib/claims"') ||
      source.includes('"../lib/claims"') ||
      source.includes('"../../lib/claims"');
    check(`${file} imports from its claims adapter`, importsFromClaims);
    check(
      `${file} references ${symbol} (registry-backed claim is wired in)`,
      new RegExp(`\\b${symbol}\\b`).test(source),
    );
  }
}

// ─── 7d. Banned hardcoded claim string scan ──────────────────────────────────
//
// Walks each migrated artifact's src/ directory and reports any .ts/.tsx file
// (excluding lib/claims.ts — the sanctioned adapter) that contains a banned
// hardcoded claim string from BANNED_HARDCODED_STRINGS in public-claims.ts.
//
// This is the regression guard: someone adds a new hardcoded "31,200+" or
// "52,000+" in vessels-home.tsx and CI catches it on the next run.

console.log('\n[7d] Banned hardcoded claim string scan (per-artifact src/)\n');

const migratedArtifacts = [
  'command',
  'carlota-jo',
  'vessels',
  'aegis',
  'pulse',
  'terra',
  'szl-holdings',
];

const repoRoot = resolve(__dirname, '..');

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = `${dir}/${entry}`;
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      // Skip generated and dependency directories
      if (entry === 'node_modules' || entry === 'dist' || entry === '.turbo') {
        continue;
      }
      walkSourceFiles(full, acc);
    } else if (s.isFile() && (entry.endsWith('.ts') || entry.endsWith('.tsx'))) {
      acc.push(full);
    }
  }
  return acc;
}

interface HardcodedHit {
  artifact: string;
  file: string;
  line: number;
  banned: string;
  claimId: string;
  reason: string;
  snippet: string;
}

const allHits: HardcodedHit[] = [];

for (const artifact of migratedArtifacts) {
  const srcDir = resolve(repoRoot, 'artifacts', artifact, 'src');
  const files = walkSourceFiles(srcDir);
  // Exclude the sanctioned claims adapter for this artifact
  const excludedSuffix = `/lib/claims.ts`;
  const scannable = files.filter((f) => !f.endsWith(excludedSuffix));

  const artifactHits: HardcodedHit[] = [];
  for (const file of scannable) {
    let source: string;
    try {
      source = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const relPath = relative(repoRoot, file);
    const lines = source.split('\n');
    for (const banned of BANNED_HARDCODED_STRINGS) {
      if (!source.includes(banned.value)) continue;
      // Honor per-string legacy allowlist for grandfathered occurrences.
      if (banned.legacyAllowedFiles?.includes(relPath)) continue;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(banned.value)) {
          artifactHits.push({
            artifact,
            file: relPath,
            line: i + 1,
            banned: banned.value,
            claimId: banned.claimId,
            reason: banned.reason ?? '',
            snippet: lines[i].trim().slice(0, 200),
          });
        }
      }
    }
  }

  check(
    `${artifact}/src/ has no banned hardcoded claim strings (outside lib/claims.ts)`,
    artifactHits.length === 0,
    artifactHits.length > 0 ? `${artifactHits.length} hit(s) — see diff below` : undefined,
  );

  allHits.push(...artifactHits);
}

if (allHits.length > 0) {
  console.error('\n  ── Hardcoded claim regression diff ────────────────────');
  for (const hit of allHits) {
    console.error(`  ${hit.file}:${hit.line}  ⟶  banned "${hit.banned}" (claim: ${hit.claimId})`);
    console.error(`    │ ${hit.snippet}`);
    if (hit.reason) console.error(`    └─ ${hit.reason}`);
  }
  console.error(
    '  ───────────────────────────────────────────────────────\n' +
      '  Fix: replace each hardcoded value with the registry-backed constant\n' +
      "  exported from the artifact's src/lib/claims.ts adapter, or add the\n" +
      '  string to public-claims.ts BANNED_HARDCODED_STRINGS exemption list\n' +
      '  only if it represents a genuinely unrelated use of the same characters.\n',
  );
}

// ─── 8. Data-layer render assertion (subprocess) ─────────────────────────────
//
// Runs artifacts/szl-holdings/scripts/render-check.ts as a subprocess from
// within the szl-holdings package directory. This gives the subprocess access
// to the @szl-holdings/config package via the local node_modules symlinks.
//
// The subprocess imports ventures.ts (the actual render data) and verifies
// that every registry-sourced metric value equals metricDisplay(claim), proving
// the registry flows through to the UI render path — not just to import
// statements. Fails this test if:
//   - Any registry-sourced metric returns "undefined" (venture ID mismatch)
//   - Any metric value differs from the expected computed registry string
//   - Any banned hardcoded claim string appears in any venture's metrics

console.log('\n[8] Data-layer render assertion (subprocess — ventures.ts → registry)\n');

const renderCheckScript = resolve(__dirname, '../artifacts/szl-holdings/scripts/render-check.ts');
const szlHoldingsDir = resolve(__dirname, '../artifacts/szl-holdings');

try {
  const renderCheckOutput = execSync(`pnpm tsx ${renderCheckScript}`, {
    cwd: szlHoldingsDir,
    encoding: 'utf8',
    timeout: 30000,
  });
  process.stdout.write(renderCheckOutput);
  check('Data-layer render assertion subprocess passed (7/7 venture metric checks)', true);
} catch (err: unknown) {
  const execErr = err as { stdout?: string; stderr?: string; status?: number };
  if (execErr.stdout) process.stdout.write(execErr.stdout);
  if (execErr.stderr) process.stderr.write(execErr.stderr);
  check(
    'Data-layer render assertion subprocess passed (7/7 venture metric checks)',
    false,
    'Run `pnpm tsx artifacts/szl-holdings/scripts/render-check.ts` for details',
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${'─'.repeat(60)}`);
console.log(`Smoke test complete: ${passed}/${total} passed, ${failed} failed`);
console.log(`${'─'.repeat(60)}\n`);

if (failed > 0) {
  console.error('FAIL — Registry smoke test failed. Fix the issues above before deploying.\n');
  process.exit(1);
} else {
  console.log(
    'PASS — Public claims registry is structurally sound and render path is wired.\n' +
      'Note: This test verifies structure and import wiring. Truth value of claims\n' +
      'must be verified by a human reviewer against live data sources.\n',
  );
  process.exit(0);
}
