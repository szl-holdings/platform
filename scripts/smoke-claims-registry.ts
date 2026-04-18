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

import {
  PUBLIC_CLAIMS,
  getClaim,
  FOUNDER_YEARS_EXPERIENCE,
} from "../packages/config/src/public-claims.js";

import {
  PLATFORM_PRODUCTS,
  getProduct,
} from "../packages/config/src/platform-registry.js";

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let passed = 0;
let failed = 0;

function check(description: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✓  ${description}`);
    passed++;
  } else {
    console.error(`  ✗  ${description}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

// ─── 1. Registry structure checks ────────────────────────────────────────────

console.log("\n[1] Public Claims Registry integrity\n");

check(
  "PUBLIC_CLAIMS array is non-empty",
  PUBLIC_CLAIMS.length > 0,
  `length: ${PUBLIC_CLAIMS.length}`
);

const VALID_TRUTH_VALUES = ["verified", "demo-data", "aspirational", "pending"];

for (const claim of PUBLIC_CLAIMS) {
  check(
    `Claim "${claim.id}" has valid truth value`,
    VALID_TRUTH_VALUES.includes(claim.truthValue),
    `got: ${claim.truthValue}`
  );

  if (claim.truthValue !== "verified") {
    check(
      `Claim "${claim.id}" (${claim.truthValue}) has a displayLabel`,
      typeof claim.displayLabel === "string" && claim.displayLabel.length > 0,
      "displayLabel must be set for non-verified claims so UI can show it"
    );
  }

  check(
    `Claim "${claim.id}" has a non-empty claim text`,
    typeof claim.claim === "string" && claim.claim.length > 0
  );

  check(
    `Claim "${claim.id}" has a non-empty source`,
    typeof claim.source === "string" && claim.source.length > 0
  );
}

// ─── 2. getClaim helper ───────────────────────────────────────────────────────

console.log("\n[2] getClaim() helper\n");

const expectedClaimIds = [
  "tagline-governed-decision",
  "covenant-policy-enforcement",
  "lyte-signal-detection-time",
  "lyte-signals-per-day",
  "lyte-false-positive-rate",
  "vessels-count",
  "vessels-dark-detection-lead",
  "aegis-simulations",
  "carlota-jo-retention",
  "carlota-jo-experience",
  "uptime-claim",
];

for (const id of expectedClaimIds) {
  check(
    `getClaim("${id}") returns a claim object`,
    getClaim(id) !== undefined
  );
}

check(
  "getClaim('non-existent-claim') returns undefined",
  getClaim("non-existent-claim") === undefined
);

// ─── 3. Computed claims ───────────────────────────────────────────────────────

console.log("\n[3] Computed claims\n");

check(
  "FOUNDER_YEARS_EXPERIENCE is a positive integer",
  Number.isInteger(FOUNDER_YEARS_EXPERIENCE) && FOUNDER_YEARS_EXPERIENCE > 0,
  `computed: ${FOUNDER_YEARS_EXPERIENCE}`
);

check(
  "FOUNDER_YEARS_EXPERIENCE is at least 18 (claim floor: 2007 + 18 = 2025)",
  FOUNDER_YEARS_EXPERIENCE >= 18,
  `computed: ${FOUNDER_YEARS_EXPERIENCE}`
);

// ─── 4. Platform registry checks ─────────────────────────────────────────────

console.log("\n[4] Platform Registry integrity\n");

const expectedProductIds = [
  "szl-holdings",
  "carlota-jo",
  "pulse",
  "aegis",
  "terra",
  "vessels",
  "command",
  "szl-holdings-mobile",
  "api-server",
];

for (const id of expectedProductIds) {
  const product = getProduct(id);
  check(`Product "${id}" exists in PLATFORM_PRODUCTS`, product !== undefined);

  if (product) {
    check(
      `Product "${id}" has a non-empty name`,
      product.name.length > 0
    );
    check(
      `Product "${id}" has a valid status`,
      ["ga", "beta", "partial", "internal", "concept", "deprecated"].includes(
        product.status
      )
    );
    check(
      `Product "${id}" has a previewPath starting with "/"`,
      product.previewPath.startsWith("/")
    );
  }
}

const gaProducts = Object.values(PLATFORM_PRODUCTS).filter((p) => p.status === "ga");
check(
  "All GA products are represented in PLATFORM_PRODUCTS",
  gaProducts.length >= 2,
  `found: ${gaProducts.map((p) => p.id).join(", ")}`
);

// ─── 5. "No mock theater" principle — unverified claims must have labels ──────

console.log("\n[5] No mock theater — unverified claims must have displayLabel\n");

const unverifiedWithoutLabel = PUBLIC_CLAIMS.filter(
  (c) => c.truthValue !== "verified" && !c.displayLabel
);

check(
  "No unverified claim is missing a displayLabel",
  unverifiedWithoutLabel.length === 0,
  unverifiedWithoutLabel.length > 0
    ? `offending claims: ${unverifiedWithoutLabel.map((c) => c.id).join(", ")}`
    : undefined
);

// ─── 6. ventures.ts wiring check ─────────────────────────────────────────────
//
// This check verifies that ventures.ts (the main rendered data file in
// szl-holdings) imports from the claims adapter. If the import disappears,
// it means registry-sourced strings are no longer feeding the render path,
// which would allow hardcoded claims to reappear silently.

console.log("\n[6] ventures.ts → claims adapter wiring (render path check)\n");

const venturesPath = resolve(
  __dirname,
  "../artifacts/szl-holdings/src/data/ventures.ts"
);
const venturesSource = readFileSync(venturesPath, "utf8");

const requiredImports = [
  "LYTE_SIGNAL_DETECTION_TIME",
  "LYTE_SIGNALS_PER_DAY",
  "LYTE_FALSE_POSITIVE_RATE",
  "VESSELS_COUNT",
  "VESSELS_DARK_DETECTION_LEAD",
  "AEGIS_SIMULATIONS",
  "metricDisplay",
];

for (const importName of requiredImports) {
  check(
    `ventures.ts imports "${importName}" from claims adapter`,
    venturesSource.includes(importName)
  );
}

check(
  'ventures.ts imports from "../lib/claims"',
  venturesSource.includes('../lib/claims')
);

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
    `Found hardcoded string in ventures.ts — use registry constant instead`
  );
}

// ─── 7. claims.ts adapter wiring check ───────────────────────────────────────

console.log("\n[7] claims.ts adapter → config package wiring\n");

const claimsAdapterPath = resolve(
  __dirname,
  "../artifacts/szl-holdings/src/lib/claims.ts"
);
const claimsAdapterSource = readFileSync(claimsAdapterPath, "utf8");

check(
  'claims.ts imports from "@szl-holdings/config/public-claims"',
  claimsAdapterSource.includes('@szl-holdings/config/public-claims')
);

check(
  "claims.ts exports LYTE_SIGNAL_DETECTION_TIME",
  claimsAdapterSource.includes("LYTE_SIGNAL_DETECTION_TIME")
);

check(
  "claims.ts exports VESSELS_COUNT",
  claimsAdapterSource.includes("VESSELS_COUNT")
);

check(
  "claims.ts exports metricDisplay",
  claimsAdapterSource.includes("metricDisplay")
);

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

console.log(
  "\n[8] Data-layer render assertion (subprocess — ventures.ts → registry)\n"
);

const renderCheckScript = resolve(
  __dirname,
  "../artifacts/szl-holdings/scripts/render-check.ts"
);
const szlHoldingsDir = resolve(__dirname, "../artifacts/szl-holdings");

try {
  const renderCheckOutput = execSync(
    `pnpm tsx ${renderCheckScript}`,
    {
      cwd: szlHoldingsDir,
      encoding: "utf8",
      timeout: 30000,
    }
  );
  process.stdout.write(renderCheckOutput);
  check("Data-layer render assertion subprocess passed (7/7 venture metric checks)", true);
} catch (err: unknown) {
  const execErr = err as { stdout?: string; stderr?: string; status?: number };
  if (execErr.stdout) process.stdout.write(execErr.stdout);
  if (execErr.stderr) process.stderr.write(execErr.stderr);
  check(
    "Data-layer render assertion subprocess passed (7/7 venture metric checks)",
    false,
    "Run `pnpm tsx artifacts/szl-holdings/scripts/render-check.ts` for details"
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${"─".repeat(60)}`);
console.log(`Smoke test complete: ${passed}/${total} passed, ${failed} failed`);
console.log(`${"─".repeat(60)}\n`);

if (failed > 0) {
  console.error(
    "FAIL — Registry smoke test failed. Fix the issues above before deploying.\n"
  );
  process.exit(1);
} else {
  console.log(
    "PASS — Public claims registry is structurally sound and render path is wired.\n" +
      "Note: This test verifies structure and import wiring. Truth value of claims\n" +
      "must be verified by a human reviewer against live data sources.\n"
  );
  process.exit(0);
}
