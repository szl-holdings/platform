/**
 * @szl-holdings/szl-doctrine
 *
 * Canonical typed constants for SZL Holdings Doctrine V6, grounded in the
 * SZL_FINAL_PAYLOAD v8 staged at `.local/payload-v8/`.
 *
 * Single source of truth for every artifact's GovernancePanels — replay root,
 * 9-axis Λ table with the two hard floors, license allowlist, byline,
 * thesis ledger, anatomy figure index, per-thesis acceptance status, and
 * gap counts.
 *
 * Sourced from:
 *   - .local/payload-v8/02_doctrine/DOCTRINE_V6.md
 *   - .local/payload-v8/02_doctrine/AXES.md
 *   - .local/payload-v8/08_acceptance/ACCEPTANCE.md
 *   - .local/payload-v8/09_gaps_upgrades/GAP_REPORT.md
 *   - .local/payload-v8/03_thesis/_arxiv_zenodo/
 *   - .local/payload-v8/05_anatomy/anatomy_INDEX.md
 *   - .local/payload-v8/11_manifests/MANIFEST.json
 *
 * © 2026 Lutar, Stephen P. — SZL Holdings
 * ORCID 0009-0001-0110-4173 · Apache-2.0 (code) · CC-BY-4.0 (text)
 */

import {
  ORG_SUMMARY as ORG_SUMMARY_PAYLOAD,
  PANEL_FACTS as PANEL_FACTS_PAYLOAD,
} from "@szl-holdings/payload";

/**
 * Re-exports of the legacy `@szl-holdings/payload` panel facts.
 *
 * Task #5142 collapsed the "dark" artifact landing / about / lineage
 * surfaces (sentra, conduit, a11oy) onto a single canonical import surface:
 * `@szl-holdings/szl-doctrine`. The underlying numbers still come from the
 * payload package — szl-doctrine is the only consumer that depends on it
 * directly. Artifacts must import these symbols from szl-doctrine.
 *
 * A drift guardrail in `scripts/check-payload-doctrine-drift.mjs` fails CI
 * if any file under `artifacts/*\/src` re-introduces a direct
 * `@szl-holdings/payload` import.
 */
export {
  DOI_LEDGER_COUNT,
  ORG_SUMMARY,
  PANEL_FACTS,
  THESIS_LINEAGE,
  THESIS_PAPERS,
  V7_PANEL_FACTS,
  thesisPaperSummary,
} from "@szl-holdings/payload";
export type {
  PanelFactsKey,
  ThesisLineage,
  ThesisPaper,
  V7PanelFactsKey,
} from "@szl-holdings/payload";

export type AxisId =
  | "semanticCoherence"
  | "empiricalGrounding"
  | "logicalConsistency"
  | "moralGrounding"
  | "epistemicHumility"
  | "measurabilityHonesty"
  | "reversibility"
  | "provenance"
  | "replayability";

export interface Axis {
  readonly id: AxisId;
  readonly name: string;
  readonly floor: number;
  readonly hardFloor: boolean;
  readonly summary: string;
}

export const AXES: ReadonlyArray<Axis> = [
  {
    id: "semanticCoherence",
    name: "Semantic coherence",
    floor: 0.9,
    hardFloor: false,
    summary: "Concepts, schema, and prose agree with themselves.",
  },
  {
    id: "empiricalGrounding",
    name: "Empirical grounding",
    floor: 0.9,
    hardFloor: false,
    summary: "Every non-trivial claim has a verifiable evidence pointer.",
  },
  {
    id: "logicalConsistency",
    name: "Logical consistency",
    floor: 0.9,
    hardFloor: false,
    summary: "Inferences follow; no affirming the consequent.",
  },
  {
    id: "moralGrounding",
    name: "Moral grounding",
    floor: 0.95,
    hardFloor: true,
    summary: "Hard floor — operator-aligned, non-deceptive framing.",
  },
  {
    id: "epistemicHumility",
    name: "Epistemic humility",
    floor: 0.9,
    hardFloor: false,
    summary: "Confidence matches the underlying evidence.",
  },
  {
    id: "measurabilityHonesty",
    name: "Measurability honesty",
    floor: 0.95,
    hardFloor: true,
    summary: "Hard floor — every number ships with its measurement command.",
  },
  {
    id: "reversibility",
    name: "Reversibility",
    floor: 0.9,
    hardFloor: false,
    summary: "Side effects are undoable or pre-disclosed and signed off.",
  },
  {
    id: "provenance",
    name: "Provenance",
    floor: 0.9,
    hardFloor: false,
    summary: "Lineage chain — source, transform, output — is SHA-anchored.",
  },
  {
    id: "replayability",
    name: "Replayability",
    floor: 0.9,
    hardFloor: false,
    summary: "5× byte-identical replay under the pinned replay root.",
  },
];

export interface DoctrineV6 {
  readonly version: "V6";
  readonly effectiveDate: string;
  readonly buildDate: string;
  readonly replayRoot: string;
  readonly replayRootShort: string;
  readonly byteIdenticalReplays: number;
  readonly lambdaFloor: number;
  readonly moralGroundingFloor: number;
  readonly measurabilityHonestyFloor: number;
  readonly ingestionPolicy: "PUBLIC_ONLY";
  readonly licenseAllowlist: ReadonlyArray<string>;
}

export const DOCTRINE_V6: DoctrineV6 = {
  version: "V6",
  effectiveDate: "2026-05-16",
  buildDate: "2026-05-16",
  replayRoot:
    "1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b",
  replayRootShort: "1ed4d253",
  byteIdenticalReplays: 5,
  lambdaFloor: 0.9,
  moralGroundingFloor: 0.95,
  measurabilityHonestyFloor: 0.95,
  ingestionPolicy: "PUBLIC_ONLY",
  licenseAllowlist: ["Apache-2.0", "MIT", "BSD-3-Clause", "CC-BY-4.0"],
};

export interface Byline {
  readonly name: string;
  readonly orcid: string;
  readonly affiliation: string;
  readonly email: string;
  readonly canonical: string;
}

export const BYLINE: Byline = {
  name: "Lutar, Stephen P.",
  orcid: "0009-0001-0110-4173",
  affiliation: "SZL Holdings",
  email: "stephen@szlholdings.com",
  canonical:
    "Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings",
};

export type ThesisKey =
  | "TH1"
  | "TH2"
  | "TH3"
  | "TH4"
  | "TH5"
  | "TH6"
  | "TH7"
  | "TH8"
  | "VSP"
  | "FG";

export type ThesisStatus = "PASS" | "PARTIAL" | "BLOCKED";

export interface ThesisEntry {
  readonly key: ThesisKey;
  readonly name: string;
  readonly testsPass: string;
  readonly status: ThesisStatus;
  readonly summary: string;
}

/**
 * Per-thesis acceptance state from `.local/payload-v8/08_acceptance/ACCEPTANCE.md`
 * and `.local/payload-v8/11_manifests/MANIFEST.json` (`deliverables[]`).
 */
export const THESIS_LEDGER: ReadonlyArray<ThesisEntry> = [
  {
    key: "TH1",
    name: "Lambda Gate",
    testsPass: "13/13",
    status: "PASS",
    summary: "9-axis conjunctive Λ-gate with both hard floors at 0.95.",
  },
  {
    key: "TH2",
    name: "DOI Binding",
    testsPass: "8/8",
    status: "PASS",
    summary: "Zenodo DOI ↔ replay-root SHA binding, idempotent round-trip.",
  },
  {
    key: "TH3",
    name: "Closure",
    testsPass: "9/9",
    status: "PASS",
    summary: "Monotone, extensive, idempotent — hash-stable across replay.",
  },
  {
    key: "TH4",
    name: "Category",
    testsPass: "9/9",
    status: "PASS",
    summary: "Identity + composition laws for the artifact category.",
  },
  {
    key: "TH5",
    name: "Confluence",
    testsPass: "6/6",
    status: "PASS",
    summary: "Divergent rewrites reach a common normal form within bound.",
  },
  {
    key: "TH6",
    name: "Bekenstein",
    testsPass: "14/14",
    status: "PASS",
    summary: "Information bound enforced in SI units on adversarial inputs.",
  },
  {
    key: "TH7",
    name: "Types",
    testsPass: "9/9",
    status: "PASS",
    summary: "Branded types for Λ, axes, replay-root, DOI — strict mode clean.",
  },
  {
    key: "TH8",
    name: "Graded Calculus (Lean v2)",
    testsPass: "7 closed · 1 skeleton · 1 blocked",
    status: "PARTIAL",
    summary:
      "Zero bare sorry; TH8c full adjunction honestly disclosed as Mathlib-blocked.",
  },
  {
    key: "VSP",
    name: "Vessels Spine Protocol",
    testsPass: "10/10",
    status: "PASS",
    summary: "OTel spans flushed every 5s; replay-root stamped per span.",
  },
  {
    key: "FG",
    name: "Forecast Gauge",
    testsPass: "20/20",
    status: "PASS",
    summary: "12 typed gauges + 3 derived + 4 safety gates with floors.",
  },
];

export interface ArxivZenodoRef {
  readonly arxivVersion: "v2";
  readonly arxivBundleSha256: string;
  readonly arxivBundleShaShort: string;
  readonly zenodoDepositVersion: "v14";
  readonly zenodoDepositPath: string;
}

export const ARXIV_ZENODO: ArxivZenodoRef = {
  arxivVersion: "v2",
  arxivBundleSha256:
    "074366bae3faef9800d436677dc699168a59821c80dc0ccd832f8ea9c2ebe52b",
  arxivBundleShaShort: "074366ba",
  zenodoDepositVersion: "v14",
  zenodoDepositPath: "03_thesis/_arxiv_zenodo/zenodo_v2/deposit.json",
};

export interface GapCounts {
  readonly p0: number;
  readonly p1: number;
  readonly p2: number;
  readonly total: number;
}

export const GAP_COUNTS: GapCounts = {
  p0: 7,
  p1: 12,
  p2: 8,
  total: 27,
};

export interface PackageInventory {
  /** Workspace packages under `packages/` (V8 build snapshot). */
  readonly workspacePackageCount: number;
  /** Repos in the `szl-holdings` GitHub org (V8 inventory). */
  readonly orgRepoCount: number;
  /** Total files in SZL_FINAL_PAYLOAD v8 (MANIFEST.json `summary.total_files`). */
  readonly payloadFileCount: number;
  /** Total bytes in SZL_FINAL_PAYLOAD v8. */
  readonly payloadByteCount: number;
}

export const PACKAGE_INVENTORY: PackageInventory = {
  workspacePackageCount: 146,
  orgRepoCount: 16,
  payloadFileCount: 317,
  payloadByteCount: 10_892_206,
};

/**
 * Lean v2 graded calculus declarations from TH8 skeleton
 * (`.local/payload-v8/03_thesis/_arxiv_zenodo/arxiv_v2_extracted/ancillary/lean_th8_skeleton/`).
 * Counts are the line-anchored declarations in the 4 Lean files
 * (GradedSemiring, LinearReceipt, GLR, StrongMonadIdentity).
 */
export interface LeanDeclarationCounts {
  readonly axioms: number;
  readonly theorems: number;
  readonly definitions: number;
  readonly lemmas: number;
  /**
   * Graded-calculus derivation obligations tracked in TH8.
   * Mirrors MANIFEST.deliverables[TH8].status `7_CLOSED_1_SKELETON_1_BLOCKED`
   * (9 derivations: 7 closed, 1 skeleton, 1 blocked).
   */
  readonly derivations: number;
  readonly derivationsClosed: number;
  readonly derivationsSkeleton: number;
  readonly derivationsBlocked: number;
  readonly totalDeclarations: number;
  readonly bareSorryCount: number;
}

export const LEAN_DECLARATIONS: LeanDeclarationCounts = {
  axioms: 2,
  theorems: 36,
  definitions: 17,
  lemmas: 1,
  derivations: 9,
  derivationsClosed: 7,
  derivationsSkeleton: 1,
  derivationsBlocked: 1,
  totalDeclarations: 56,
  bareSorryCount: 0,
};

export interface AnatomyFigure {
  readonly slug: string;
  readonly title: string;
  readonly module: string;
}

export const ANATOMY_FIGURES: ReadonlyArray<AnatomyFigure> = [
  { slug: "anatomy_brain", title: "Brain — AMARU cortex", module: "AMARU" },
  { slug: "anatomy_wires", title: "Wires — YAWAR bus", module: "YAWAR" },
  { slug: "anatomy_full_body", title: "Full body overview", module: "Composite" },
  { slug: "anatomy_heart", title: "Heart — YUYAY conjunctive gate", module: "YUYAY" },
  { slug: "anatomy_blood_immune", title: "Blood + Immune — RUWAY · HUKLLA", module: "RUWAY/HUKLLA" },
  { slug: "anatomy_skeleton", title: "Skeleton — 12-repo scaffolding", module: "Repos" },
  { slug: "anatomy_nervous", title: "Nervous — OTel/VSP spinal column", module: "VSP" },
  { slug: "anatomy_body_graph", title: "Body graph — master overlay", module: "Overlay" },
];

export interface SloStatus {
  readonly ciFailingText: string;
  readonly scorecardText: string;
  readonly branchProtectionText: string;
  readonly dependabotText: string;
  readonly codeScanningText: string;
  readonly orgRepoCountText: string;
}

/**
 * Org-posture counters sourced from the V8 GitHub inventory snapshot
 * (`.local/payload-v8/06_github/` and `09_gaps_upgrades/inventory.json`).
 * Repo-count and branch-protection figures are derived from
 * `@szl-holdings/payload` PANEL_FACTS so the chips stay in lockstep with the
 * canonical inventory — never re-transcribe these literals.
 * Cycle-specific deltas (Dependabot-merged-this-cycle) remain inline because
 * they are not exposed by PANEL_FACTS yet.
 */
export const SLO_STATUS: SloStatus = {
  ciFailingText: `${PANEL_FACTS_PAYLOAD.ciFailingText} failing across ${PANEL_FACTS_PAYLOAD.reposCountText} repos`,
  scorecardText: `Avg ${ORG_SUMMARY_PAYLOAD.scorecardAvg.toFixed(2)} · per-repo published`,
  branchProtectionText: `${PANEL_FACTS_PAYLOAD.branchProtectionStrictText} repos strict; ${ORG_SUMMARY_PAYLOAD.branchProtectionWeak} awaiting 2nd reviewer`,
  dependabotText: `${PANEL_FACTS_PAYLOAD.dependabotHighCritText} high / critical · 12 merged this cycle`,
  codeScanningText: "0 open critical alerts",
  orgRepoCountText: `${PANEL_FACTS_PAYLOAD.reposCountText} repos in szl-holdings`,
};

// ---- Pre-formatted strings, kept here so panels never duplicate them ----

export const REPLAY_ROOT_SHORT = DOCTRINE_V6.replayRootShort;
export const REPLAY_ROOT_FULL = DOCTRINE_V6.replayRoot;
export const LAMBDA_FLOOR_TEXT =
  "Λ ≥ 0.90 · 9-axis conjunctive AND";
export const HARD_FLOORS_TEXT =
  "moralGrounding ≥ 0.95 · measurabilityHonesty ≥ 0.95";
export const BYTE_IDENTICAL_TEXT = "5× byte-identical replay required";
export const INGESTION_POLICY_TEXT = "PUBLIC_ONLY ingestion";
export const LICENSE_ALLOWLIST_TEXT =
  DOCTRINE_V6.licenseAllowlist.join(" · ");
export const DOCTRINE_VERSION_TEXT = `Doctrine ${DOCTRINE_V6.version} · ${DOCTRINE_V6.buildDate}`;
export const BYLINE_TEXT = BYLINE.canonical;
export const ARXIV_TEXT = `arXiv ${ARXIV_ZENODO.arxivVersion} · sha ${ARXIV_ZENODO.arxivBundleShaShort}`;
export const ZENODO_TEXT = `Zenodo deposit ${ARXIV_ZENODO.zenodoDepositVersion}`;
export const GAP_COUNTS_TEXT = `P0 ${GAP_COUNTS.p0} · P1 ${GAP_COUNTS.p1} · P2 ${GAP_COUNTS.p2}`;

// ---- Per-artifact acceptance slice ----

export type ArtifactSlug =
  | "sentra"
  | "vessels"
  | "counsel"
  | "conduit"
  | "a11oy"
  | "terra"
  | "carlota-jo";

export interface ArtifactAcceptance {
  readonly slug: ArtifactSlug;
  readonly scopeLine: string;
  readonly primaryTheses: ReadonlyArray<ThesisKey>;
  readonly anatomyAnchors: ReadonlyArray<string>;
  readonly acceptanceLine: string;
}

export const ARTIFACT_ACCEPTANCE: Readonly<
  Record<ArtifactSlug, ArtifactAcceptance>
> = {
  sentra: {
    slug: "sentra",
    scopeLine: "Cyber resilience command",
    primaryTheses: ["TH1", "TH2", "TH5"],
    anatomyAnchors: ["anatomy_wires", "anatomy_blood_immune"],
    acceptanceLine:
      "Sentra ships when TH1 gate + TH2 DOI binding + TH5 confluence tests all clear and Λ stays above floor on every contained signal.",
  },
  vessels: {
    slug: "vessels",
    scopeLine: "Maritime fleet intelligence",
    primaryTheses: ["VSP", "TH6"],
    anatomyAnchors: ["anatomy_nervous", "anatomy_skeleton"],
    acceptanceLine:
      "Vessels ships when every voyage decision flushes a VSP span carrying the replay-root and the Bekenstein information bound holds on the receipt chain.",
  },
  counsel: {
    slug: "counsel",
    scopeLine: "Legal matter command",
    primaryTheses: ["TH2", "TH3", "TH7"],
    anatomyAnchors: ["anatomy_skeleton"],
    acceptanceLine:
      "Counsel ships when every drafted clause carries a DOI-bound proof envelope and the closure operator is idempotent across replay.",
  },
  conduit: {
    slug: "conduit",
    scopeLine: "Amaru ouroboros — the Andean loop",
    primaryTheses: ["TH3", "TH4", "TH5"],
    anatomyAnchors: ["anatomy_brain", "anatomy_full_body"],
    acceptanceLine:
      "Conduit ships when the closure → category → confluence loop holds end-to-end and the cortex passes the 9-axis conjunctive gate.",
  },
  a11oy: {
    slug: "a11oy",
    scopeLine: "Brand orchestration layer",
    primaryTheses: ["TH1", "TH7", "FG"],
    anatomyAnchors: ["anatomy_heart", "anatomy_body_graph"],
    acceptanceLine:
      "A11oy ships when every brand decision crosses the Λ gate, the 4 Forecast Gauge safety gates return reasoned booleans, and the receipt pump never emits an unsigned receipt.",
  },
  terra: {
    slug: "terra",
    scopeLine: "Real estate intelligence",
    primaryTheses: ["TH2", "TH6", "FG"],
    anatomyAnchors: ["anatomy_blood_immune"],
    acceptanceLine:
      "Terra ships when every valuation receipt is DOI-bound, the information bound is enforced on the comparable set, and forecast gauges hold against ground truth.",
  },
  "carlota-jo": {
    slug: "carlota-jo",
    scopeLine: "SZL Holdings governance · consulting engagement",
    primaryTheses: ["TH1", "TH2", "TH3"],
    anatomyAnchors: ["anatomy_full_body"],
    acceptanceLine:
      "Carlota Jo engagements ship when each deliverable carries a Λ-clean envelope, a DOI-bound receipt, and a closure proof — no exceptions for advisory work.",
  },
};

export function artifactAcceptance(
  slug: ArtifactSlug,
): ArtifactAcceptance {
  return ARTIFACT_ACCEPTANCE[slug];
}

export const PAYLOAD_VERSION = "v8";
export const PAYLOAD_SOURCE_PATH = ".local/payload-v8/";
