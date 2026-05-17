/**
 * Doctrine drift check.
 *
 * Verifies that key constants in `packages/szl-doctrine/src/index.ts` still
 * match the canonical values shipped in `.local/payload-v8/`. Run via
 *
 *   pnpm --filter @szl-holdings/szl-doctrine run check:drift
 *
 * Exits non-zero on the first mismatch so it can be wired into CI alongside
 * the existing `check:risk-formula-drift` workflow.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  GAP_COUNTS,
  LEAN_DECLARATIONS,
  PACKAGE_INVENTORY,
  REPLAY_ROOT_SHORT,
  DOCTRINE_V6,
} from "../src/index.js";

const PAYLOAD_ROOT = resolve(
  process.cwd(),
  "../../.local/payload-v8",
);

interface ManifestSummary {
  total_files: number;
  total_bytes: number;
}
interface Manifest {
  replay_root: string;
  doctrine: string;
  summary: ManifestSummary;
}

function fail(message: string): never {
  console.error(`[szl-doctrine] DRIFT: ${message}`);
  process.exit(1);
}

const manifestPath = resolve(PAYLOAD_ROOT, "11_manifests/MANIFEST.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;

if (!manifest.replay_root.startsWith(REPLAY_ROOT_SHORT)) {
  fail(
    `REPLAY_ROOT_SHORT (${REPLAY_ROOT_SHORT}) is not a prefix of MANIFEST.replay_root (${manifest.replay_root})`,
  );
}

if (manifest.doctrine !== DOCTRINE_V6.version) {
  fail(
    `DOCTRINE_V6.version (${DOCTRINE_V6.version}) != MANIFEST.doctrine (${manifest.doctrine})`,
  );
}

if (manifest.summary.total_files !== PACKAGE_INVENTORY.payloadFileCount) {
  fail(
    `PACKAGE_INVENTORY.payloadFileCount (${PACKAGE_INVENTORY.payloadFileCount}) != MANIFEST.summary.total_files (${manifest.summary.total_files})`,
  );
}

if (manifest.summary.total_bytes !== PACKAGE_INVENTORY.payloadByteCount) {
  fail(
    `PACKAGE_INVENTORY.payloadByteCount (${PACKAGE_INVENTORY.payloadByteCount}) != MANIFEST.summary.total_bytes (${manifest.summary.total_bytes})`,
  );
}

// Lean TH8 declarations
const leanDir = resolve(
  PAYLOAD_ROOT,
  "03_thesis/_arxiv_zenodo/arxiv_v2_extracted/ancillary/lean_th8_skeleton",
);
const leanFiles = [
  "GradedSemiring.lean",
  "LinearReceipt.lean",
  "GLR.lean",
  "StrongMonadIdentity.lean",
];
const leanText = leanFiles
  .map((f) => readFileSync(resolve(leanDir, f), "utf8"))
  .join("\n");

function countDecl(keyword: string): number {
  const re = new RegExp(`^\\s*${keyword}\\s+`, "gm");
  return (leanText.match(re) ?? []).length;
}

const observed = {
  axioms: countDecl("axiom"),
  theorems: countDecl("theorem"),
  definitions: countDecl("def"),
  lemmas: countDecl("lemma"),
};

for (const k of Object.keys(observed) as Array<keyof typeof observed>) {
  if (observed[k] !== LEAN_DECLARATIONS[k]) {
    fail(
      `LEAN_DECLARATIONS.${k} (${LEAN_DECLARATIONS[k]}) != observed ${observed[k]} in TH8 Lean skeleton`,
    );
  }
}

void GAP_COUNTS;

console.log(
  `[szl-doctrine] OK · replay=${manifest.replay_root.slice(0, 12)}…` +
    ` · doctrine=${manifest.doctrine}` +
    ` · payload=${manifest.summary.total_files} files / ${manifest.summary.total_bytes} bytes` +
    ` · TH8 Lean: ${observed.axioms} axioms / ${observed.theorems} theorems / ${observed.definitions} defs / ${observed.lemmas} lemmas`,
);
