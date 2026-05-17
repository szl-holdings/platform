/**
 * @szl-holdings/payload — browser-safe entry.
 *
 * Every constant exported here is DERIVED at module-load time from the raw
 * JSON bundle under packages/payload/raw/ via `resolveJsonModule` imports.
 * There are no transcribed literals for the canonical payload fields — the
 * raw files (verified by scripts/verify-integrity.mjs against
 * payload.json.file_integrity) are the single source of truth.
 *
 * For the full raw payload (Node-only, fs-backed), import from
 * "@szl-holdings/payload/server".
 */

import masterRaw from "../raw/payload.json" with { type: "json" };
import inventoryRaw from "../raw/github_pro/github_inventory.json" with { type: "json" };
import runtimeRaw from "../raw/dev2_runtime/runtime_payload.json" with { type: "json" };
import thesisRaw from "../raw/dev1_thesis/thesis_payload.json" with { type: "json" };
import th8StatusRaw from "../proofs/lean_th8/status.json" with { type: "json" };

const master = masterRaw as unknown as {
  schema_version: string;
  generated_at: string;
  identity: {
    name: string;
    orcid: string;
    affiliation: string;
    email: string;
    github_username: string;
    github_org: string;
  };
  doctrine: {
    version: string;
    replay_root: string;
    byline_canonical: string;
    license_allowlist: ReadonlyArray<string>;
    ingestion_policy: string;
    byte_identical_replays_required: number;
    lambda_axes_count: number;
    lambda_conjunctive_floor: number;
    moralGrounding_floor: number;
    measurabilityHonesty_floor: number;
  };
  org_summary: {
    repos_total: number;
    ci_failing: number;
    open_prs: number;
    open_alerts_code_scanning: number;
    open_dependabot_high_critical: number;
    scorecard_avg: number;
    branch_protection_compliant: number;
    branch_protection_weak: number;
    hygiene_gaps: ReadonlyArray<string>;
  };
  push_queue_ready_one_way_doors: ReadonlyArray<{
    id: string;
    artifact: string;
    target_version?: string;
    sha256?: string;
    status: string;
    blocker: string;
  }>;
};

const inventory = inventoryRaw as unknown as {
  org: string;
  repo_count: number;
  repos: Record<
    string,
    {
      metadata: {
        full_name: string;
        default_branch: string;
        pushed_at: string;
      };
      tags?: ReadonlyArray<{ name: string; sha: string }>;
      recent_commits?: ReadonlyArray<{ sha: string; date: string }>;
    }
  >;
};

const runtime = runtimeRaw as unknown as { doi_count: number };

// ---------------------------------------------------------------------------
// Schema metadata (derived).
// ---------------------------------------------------------------------------

export const PAYLOAD_SCHEMA_VERSION: string = master.schema_version;
export const PAYLOAD_GENERATED_AT: string = master.generated_at;

// ---------------------------------------------------------------------------
// Doctrine V6 (derived).
// ---------------------------------------------------------------------------

export interface DoctrineV6 {
  readonly version: string;
  readonly replayRoot: string;
  readonly byline: string;
  readonly orcid: string;
  readonly affiliation: string;
  readonly githubOrg: string;
  readonly githubUsername: string;
  readonly lambdaFloor: number;
  readonly lambdaAxes: number;
  readonly moralGroundingFloor: number;
  readonly measurabilityHonestyFloor: number;
  readonly byteIdenticalReplays: number;
  readonly ingestionPolicy: string;
  readonly licenseAllowlist: ReadonlyArray<string>;
}

export const DOCTRINE: DoctrineV6 = Object.freeze({
  version: master.doctrine.version,
  replayRoot: master.doctrine.replay_root,
  byline: master.doctrine.byline_canonical,
  orcid: master.identity.orcid,
  affiliation: master.identity.affiliation,
  githubOrg: master.identity.github_org,
  githubUsername: master.identity.github_username,
  lambdaFloor: master.doctrine.lambda_conjunctive_floor,
  lambdaAxes: master.doctrine.lambda_axes_count,
  moralGroundingFloor: master.doctrine.moralGrounding_floor,
  measurabilityHonestyFloor: master.doctrine.measurabilityHonesty_floor,
  byteIdenticalReplays: master.doctrine.byte_identical_replays_required,
  ingestionPolicy: master.doctrine.ingestion_policy,
  licenseAllowlist: Object.freeze([...master.doctrine.license_allowlist]),
});

// ---------------------------------------------------------------------------
// Org-wide GitHub summary (derived).
// ---------------------------------------------------------------------------

export interface OrgSummary {
  readonly reposTotal: number;
  readonly ciFailing: number;
  readonly openPrs: number;
  readonly openAlertsCodeScanning: number;
  readonly openDependabotHighCritical: number;
  readonly scorecardAvg: number;
  readonly branchProtectionCompliant: number;
  readonly branchProtectionWeak: number;
  readonly hygieneGaps: ReadonlyArray<string>;
}

export const ORG_SUMMARY: OrgSummary = Object.freeze({
  reposTotal: master.org_summary.repos_total,
  ciFailing: master.org_summary.ci_failing,
  openPrs: master.org_summary.open_prs,
  openAlertsCodeScanning: master.org_summary.open_alerts_code_scanning,
  openDependabotHighCritical: master.org_summary.open_dependabot_high_critical,
  scorecardAvg: master.org_summary.scorecard_avg,
  branchProtectionCompliant: master.org_summary.branch_protection_compliant,
  branchProtectionWeak: master.org_summary.branch_protection_weak,
  hygieneGaps: Object.freeze([...master.org_summary.hygiene_gaps]),
});

// ---------------------------------------------------------------------------
// Per-repo facts (derived from github_inventory.json). The inventory truncates
// recent_commits[].sha to 12 chars, so latestCommitSha is the 12-char prefix
// exactly as the inventory records it. Consumers requiring full SHAs must
// fetch from the GitHub API; this package preserves what the bundle preserves.
// ---------------------------------------------------------------------------

export interface RepoFacts {
  readonly key: string;
  readonly fullName: string;
  readonly defaultBranch: string;
  readonly latestCommitSha: string; // 12-char prefix as recorded in inventory
  readonly latestCommitDate: string;
  readonly latestTag: string | null;
  readonly latestTagSha: string | null;
  readonly pushedAt: string;
}

const PANEL_REPO_KEYS = [
  "amaru",
  "a11oy",
  "sentra",
  "terra",
  "vessels",
  "counsel",
  "carlota-jo",
] as const;

export type PanelRepoKey = (typeof PANEL_REPO_KEYS)[number];

function deriveRepoFacts(key: string): RepoFacts {
  const r = inventory.repos[key];
  if (!r) {
    throw new Error(
      `@szl-holdings/payload: repo "${key}" not found in github_inventory.json`,
    );
  }
  const tag = r.tags?.[0] ?? null;
  const commit = r.recent_commits?.[0];
  if (!commit) {
    throw new Error(
      `@szl-holdings/payload: repo "${key}" has no recent_commits in inventory`,
    );
  }
  return Object.freeze({
    key,
    fullName: r.metadata.full_name,
    defaultBranch: r.metadata.default_branch,
    latestCommitSha: commit.sha,
    latestCommitDate: commit.date,
    latestTag: tag?.name ?? null,
    latestTagSha: tag?.sha ?? null,
    pushedAt: r.metadata.pushed_at,
  });
}

export const REPOS: Readonly<Record<PanelRepoKey, RepoFacts>> = Object.freeze(
  Object.fromEntries(
    PANEL_REPO_KEYS.map((k) => [k, deriveRepoFacts(k)]),
  ) as Record<PanelRepoKey, RepoFacts>,
);

/** Look up any repo present in the github_inventory.json bundle. */
export function getRepoFacts(key: string): RepoFacts {
  return deriveRepoFacts(key);
}

/** Returns true if a repo with this key exists in the inventory. */
export function hasRepo(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(inventory.repos, key);
}

// ---------------------------------------------------------------------------
// Push queue (derived from master.push_queue_ready_one_way_doors).
// ---------------------------------------------------------------------------

function findPushQueueEntry(idSubstring: string) {
  const e = master.push_queue_ready_one_way_doors.find((x) =>
    x.id.includes(idSubstring),
  );
  if (!e) {
    throw new Error(
      `@szl-holdings/payload: push_queue entry matching "${idSubstring}" not found`,
    );
  }
  return e;
}

const arxivEntry = findPushQueueEntry("ARXIV");
const zenodoEntry = findPushQueueEntry("ZENODO");

if (!arxivEntry.sha256) {
  throw new Error("@szl-holdings/payload: arxiv push_queue entry missing sha256");
}
if (!zenodoEntry.target_version) {
  throw new Error(
    "@szl-holdings/payload: zenodo push_queue entry missing target_version",
  );
}

export const PUSH_QUEUE = Object.freeze({
  arxivSha: arxivEntry.sha256,
  arxivStatus: arxivEntry.status,
  arxivArtifact: arxivEntry.artifact,
  zenodoTargetVersion: zenodoEntry.target_version,
  zenodoStatus: zenodoEntry.status,
  zenodoArtifact: zenodoEntry.artifact,
});

// ---------------------------------------------------------------------------
// DOI ledger (derived from runtime payload).
// ---------------------------------------------------------------------------

export const DOI_LEDGER_COUNT: number = runtime.doi_count;

// ---------------------------------------------------------------------------
// Display formatters — pure derivations.
// ---------------------------------------------------------------------------

export function shortSha(sha: string): string {
  return `${sha.slice(0, 8)}\u2026`;
}

/** "2026-05-15T12:58:31Z" -> "2026-05-15 12:58" (UTC, no seconds). */
export function pushedAtUtc(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

function shortLicense(spdx: string): string {
  if (spdx === "BSD-3-Clause") return "BSD-3";
  return spdx;
}

export const LICENSE_ALLOWLIST_SHORT_TEXT: string = DOCTRINE.licenseAllowlist
  .map(shortLicense)
  .join(" \u00b7 ");

export const REPLAY_ROOT_SHORT: string = shortSha(DOCTRINE.replayRoot);
export const ARXIV_SHA_SHORT: string = shortSha(PUSH_QUEUE.arxivSha);

// ---------------------------------------------------------------------------
// Canonical fact strings rendered by GovernancePanels.
// Several panels format the same underlying number differently (e.g.
// "5 of 5" vs "5 required"); each variant is exposed as a separately-named
// constant so the contract test can pin every literal to the payload.
// ---------------------------------------------------------------------------

export const PANEL_FACTS = Object.freeze({
  // Replay / Λ
  replayRootShort: REPLAY_ROOT_SHORT,
  byteIdenticalReplaysRequiredText: `${DOCTRINE.byteIdenticalReplays} required`,
  byteIdenticalReplaysOfText: `${DOCTRINE.byteIdenticalReplays} of ${DOCTRINE.byteIdenticalReplays}`,
  byteIdenticalReplaysShort: `${DOCTRINE.byteIdenticalReplays} byte-identical`,
  lambdaFloorAndText: `${DOCTRINE.lambdaFloor.toFixed(2)} \u00b7 ${DOCTRINE.lambdaAxes}-axis AND`,
  lambdaFloorConjAndText: `${DOCTRINE.lambdaFloor.toFixed(2)} across ${DOCTRINE.lambdaAxes} axes`,
  lambdaFloorParenText: `${DOCTRINE.lambdaFloor.toFixed(2)} (${DOCTRINE.lambdaAxes}-axis \u2227)`,
  lambdaAxesShortText: `${DOCTRINE.lambdaAxes} conjunctive \u2227`,
  moralGroundingFloorText: DOCTRINE.moralGroundingFloor.toFixed(2),
  moralGroundingGteText: `\u2265 ${DOCTRINE.moralGroundingFloor.toFixed(2)}`,
  measurabilityHonestyText: DOCTRINE.measurabilityHonestyFloor.toFixed(2),
  measurabilityHonestyGteText: `\u2265 ${DOCTRINE.measurabilityHonestyFloor.toFixed(2)}`,
  ingestionPolicyText: DOCTRINE.ingestionPolicy,
  licenseAllowlistShortText: LICENSE_ALLOWLIST_SHORT_TEXT,

  // Identity
  authorText: DOCTRINE.byline,
  orcidText: DOCTRINE.orcid,
  affiliationText: DOCTRINE.affiliation,
  githubOrgText: DOCTRINE.githubOrg,
  githubUsernameText: DOCTRINE.githubUsername,
  doctrineVersionText: DOCTRINE.version,

  // Push queue
  zenodoText: `${PUSH_QUEUE.zenodoTargetVersion} \u2014 push queue ready`,
  arxivShaShortText: `sha ${ARXIV_SHA_SHORT}`,
  arxivShaShortQueuedText: `sha ${ARXIV_SHA_SHORT} (one-way door queued)`,
  pushQueueReadyText: `ZENODO ${PUSH_QUEUE.zenodoTargetVersion} \u00b7 arXiv submit`,
  oneWayDoorsText: "awaiting confirm",

  // Org / SLO
  reposCountText: String(ORG_SUMMARY.reposTotal),
  ciFailingText: String(ORG_SUMMARY.ciFailing),
  scorecardAvgText: `${ORG_SUMMARY.scorecardAvg.toFixed(2)} / 10`,
  branchProtectionStrictText: `${ORG_SUMMARY.branchProtectionCompliant} / ${ORG_SUMMARY.reposTotal}`,
  dependabotHighCritText: `${ORG_SUMMARY.openDependabotHighCritical}`,
  dependabotHighCritPairText: `${ORG_SUMMARY.openDependabotHighCritical} / ${ORG_SUMMARY.openDependabotHighCritical}`,
  codeScanningOrgWideText: `${ORG_SUMMARY.openAlertsCodeScanning} (org-wide)`,

  // DOI
  doiLedgerEvidenceText: `${DOI_LEDGER_COUNT}-DOI evidence chain`,
  doiMintedText: `${DOI_LEDGER_COUNT} minted`,
});

export type PanelFactsKey = keyof typeof PANEL_FACTS;

// ---------------------------------------------------------------------------
// Thesis lineage TH1..TH8 (derived from raw/dev1_thesis/thesis_payload.json).
// Mirrors the canonical Zenodo lineage. The TH8 status field is read from
// packages/payload/proofs/lean_th8/status.json — that mirror is the only place
// where the lean_skeleton → lean_skeleton_complete transition is recorded
// (raw/ is byte-locked per the doctrine integrity manifest).
// ---------------------------------------------------------------------------

const thesisLineage = thesisRaw as unknown as {
  thesis_lineage: Record<
    string,
    {
      title: string;
      doi: string;
      concept_doi?: string;
      status: string;
      theorems: ReadonlyArray<{
        id: string;
        name: string;
        proof_status: string;
        depends_on: ReadonlyArray<string>;
      }>;
      target_venue?: string;
    }
  >;
  fly_high_v6_audit: {
    doctrine_v6: string;
    gap_fill_p0_fixes: number;
    beautify_avg_score: number;
    lean_th8_theorems: number;
    lean_th8_sorries: number;
    citation_hardening: string;
  };
  arxiv_package: { submission_status: string; target_venue: string; submission_one_way_door: boolean };
  zenodo_deposit: { submission_status: string; target_version: string; mint_one_way_door: boolean };
  doctrine: { forbidden_patterns: ReadonlyArray<string> };
};

const th8Status = th8StatusRaw as unknown as {
  status: string;
  sorries_open: number;
  sorries_closed: ReadonlyArray<string>;
  sorries_remaining: ReadonlyArray<{ id: string; reason: string }>;
  proofs_dir: string;
  updated_at: string;
};

const ZENODO_BASE = "https://doi.org/";
const ARXIV_SEARCH_BASE = "https://arxiv.org/a/";

export interface ThesisTheorem {
  readonly id: string;
  readonly name: string;
  readonly proofStatus: string;
  readonly dependsOn: ReadonlyArray<string>;
}

export interface ThesisPaper {
  readonly key: "TH1-TH3" | "TH4-TH7" | "TH8-GLR";
  readonly title: string;
  readonly version: string;
  readonly status: string;
  readonly doi: string;
  readonly doiUrl: string;
  readonly conceptDoi: string | null;
  readonly conceptDoiUrl: string | null;
  readonly theorems: ReadonlyArray<ThesisTheorem>;
  readonly targetVenue: string | null;
}

function parseVersion(status: string): string {
  // "published v11" -> "v11"; "proposal + lean_skeleton" -> "proposal"
  const m = status.match(/v\d+/);
  if (m) return m[0];
  if (status.startsWith("proposal")) return "proposal";
  return status;
}

function buildPaper(
  key: ThesisPaper["key"],
  raw: (typeof thesisLineage.thesis_lineage)[string],
  overrideStatus?: string,
): ThesisPaper {
  const status = overrideStatus ?? raw.status;
  return Object.freeze({
    key,
    title: raw.title,
    version: parseVersion(status),
    status,
    doi: raw.doi,
    doiUrl: `${ZENODO_BASE}${raw.doi}`,
    conceptDoi: raw.concept_doi ?? null,
    conceptDoiUrl: raw.concept_doi ? `${ZENODO_BASE}${raw.concept_doi}` : null,
    theorems: Object.freeze(
      raw.theorems.map((t) =>
        Object.freeze({
          id: t.id,
          name: t.name,
          proofStatus: t.proof_status,
          dependsOn: Object.freeze([...t.depends_on]),
        }),
      ),
    ),
    targetVenue: raw.target_venue ?? null,
  });
}

export const THESIS_PAPERS: ReadonlyArray<ThesisPaper> = Object.freeze([
  buildPaper("TH1-TH3", thesisLineage.thesis_lineage["TH1-TH3"]),
  buildPaper("TH4-TH7", thesisLineage.thesis_lineage["TH4-TH7"]),
  buildPaper(
    "TH8-GLR",
    thesisLineage.thesis_lineage["TH8-GLR"],
    th8Status.status === "lean_skeleton_complete"
      ? "lean_skeleton_complete"
      : thesisLineage.thesis_lineage["TH8-GLR"].status,
  ),
]);

export const THESIS_TIMELINE: ReadonlyArray<ThesisTheorem> = Object.freeze(
  THESIS_PAPERS.flatMap((p) => p.theorems.filter((t) => /^TH\d+$/.test(t.id))),
);

export interface ThesisLineage {
  readonly papers: ReadonlyArray<ThesisPaper>;
  readonly arxiv: {
    readonly status: string;
    readonly targetVenue: string;
    readonly oneWayDoor: boolean;
    readonly searchUrl: string;
  };
  readonly zenodo: {
    readonly status: string;
    readonly targetVersion: string;
    readonly oneWayDoor: boolean;
    readonly doiUrl: string;
  };
  readonly audit: {
    readonly doctrine: string;
    readonly p0Fixes: number;
    readonly beautifyAvg: number;
    readonly leanTheorems: number;
    readonly leanSorriesOpen: number;
    readonly leanSorriesClosed: ReadonlyArray<string>;
    readonly citationHardening: string;
    readonly updatedAt: string;
  };
  readonly forbiddenPatterns: ReadonlyArray<string>;
}

export const THESIS_LINEAGE: ThesisLineage = Object.freeze({
  papers: THESIS_PAPERS,
  arxiv: Object.freeze({
    status: thesisLineage.arxiv_package.submission_status,
    targetVenue: thesisLineage.arxiv_package.target_venue,
    oneWayDoor: thesisLineage.arxiv_package.submission_one_way_door,
    searchUrl: `${ARXIV_SEARCH_BASE}lutar_s_1`,
  }),
  zenodo: Object.freeze({
    status: thesisLineage.zenodo_deposit.submission_status,
    targetVersion: thesisLineage.zenodo_deposit.target_version,
    oneWayDoor: thesisLineage.zenodo_deposit.mint_one_way_door,
    doiUrl: `${ZENODO_BASE}${THESIS_PAPERS[1].doi}`,
  }),
  audit: Object.freeze({
    doctrine: thesisLineage.fly_high_v6_audit.doctrine_v6,
    p0Fixes: thesisLineage.fly_high_v6_audit.gap_fill_p0_fixes,
    beautifyAvg: thesisLineage.fly_high_v6_audit.beautify_avg_score,
    leanTheorems: thesisLineage.fly_high_v6_audit.lean_th8_theorems,
    // Live sorry count reflects the mirrored proofs/ directory (NOT raw/).
    leanSorriesOpen: th8Status.sorries_open,
    leanSorriesClosed: Object.freeze([...th8Status.sorries_closed]),
    citationHardening: thesisLineage.fly_high_v6_audit.citation_hardening,
    updatedAt: th8Status.updated_at,
  }),
  forbiddenPatterns: Object.freeze([...thesisLineage.doctrine.forbidden_patterns]),
});

/** Render-ready summary for a single paper row in a thesis surface. */
export function thesisPaperSummary(p: ThesisPaper): {
  paperKey: string;
  versionText: string;
  statusText: string;
  doiText: string;
  doiHref: string;
  theoremCountText: string;
} {
  return {
    paperKey: p.key,
    versionText: p.version,
    statusText: p.status,
    doiText: p.doi,
    doiHref: p.doiUrl,
    theoremCountText: `${p.theorems.length} theorem${p.theorems.length === 1 ? "" : "s"}`,
  };
}

/** Per-repo display facts derived from REPOS[name]. */
export function panelRepoFacts(repoKey: PanelRepoKey) {
  const r = REPOS[repoKey];
  return {
    key: r.key,
    fullName: r.fullName,
    latestTag: r.latestTag,
    commitShort: shortSha(r.latestCommitSha),
    tagShaShort: r.latestTagSha ? shortSha(r.latestTagSha) : null,
    pushedAtUtcText: pushedAtUtc(r.pushedAt),
    defaultBranch: r.defaultBranch,
  };
}

// ===========================================================================
// V7 namespace — Fly-High V7 audit pack.
//
// V6 stays canonical for replay-root, 13-DOI ledger, 5 byte-identical replays,
// and the doctrine floor. V7 adds: doctrine refinements (Mythos exception,
// git-author override), five specialist deliverables (doctrine sweep, hygiene
// fix, BP fix, citation fix, PR triage), an org-wide baseline snapshot, and
// the pending PM-decision register.
//
// All V7 constants are derived at module-load time from the raw V7 bundle
// under packages/payload/raw_v7/ via resolveJsonModule imports — there are
// no transcribed canonical values.
// ===========================================================================

import v7ManifestRaw from "../raw_v7/03_manifests/MANIFEST.json" with { type: "json" };
import v7PrsRaw from "../raw_v7/02_specialists/pr_triage/all_prs_final.json" with { type: "json" };

interface V7ManifestRaw {
  schema: string;
  generated_at_utc: string;
  mission: string;
  operator: {
    byline: string;
    orcid: string;
    affiliation: string;
    email: string;
    github: string;
  };
  doctrine: {
    version: string;
    replay_root: string;
    lambda_threshold: number;
    critical_axes: { moralGrounding: number; measurabilityHonesty: number };
    forbidden_patterns: ReadonlyArray<string>;
    mythos_exception: string;
    license_allowlist: ReadonlyArray<string>;
    git_author_override: string;
  };
  specialists: {
    doctrine_sweep: {
      report: string;
      files_scanned: number;
      auto_fixes_applied_local: number;
      live_repo_escalations: number;
      status: string;
    };
    hygiene_fix: {
      report: string;
      repos_targeted: ReadonlyArray<string>;
      files_drafted: number;
      prs_proposed: number;
      status: string;
    };
    bp_fix: {
      report: string;
      repos_targeted: ReadonlyArray<string>;
      put_payloads_ready: number;
      risk: string;
      status: string;
    };
    citation_fix: {
      report: string;
      repos_drafted: number;
      field_change: string;
      status: string;
    };
    pr_triage: {
      report: string;
      total_open_prs: number;
      categories: { MERGE: number; CLOSE: number; STALE: number; NEEDS_REVIEW: number };
      merge_candidates: string;
      close_urgency: string;
      status: string;
    };
  };
  github_org_baseline: {
    repos_audited: number;
    ci_failing: number;
    code_scanning_alerts: number;
    dependabot_high_critical: number;
    scorecard_avg: number;
    bp_compliant: number;
    bp_weak: number;
  };
  active_crons: ReadonlyArray<{ id: string; cron: string; name: string }>;
  pending_pm_decisions: ReadonlyArray<string>;
  execution_order_recommendation: ReadonlyArray<string>;
  files: ReadonlyArray<{ path: string; size_bytes: number; sha256: string }>;
  file_count: number;
  total_bytes: number;
}

interface V7PrRaw {
  repo: string;
  number: number;
  title: string;
  author: string;
  branch: string;
  base: string;
  age_days: number;
  last_update_days: number;
  ci: string;
  mergeable: string;
  is_draft: boolean;
  review_decision: string;
  additions: number;
  deletions: number;
  doctrine_hits: ReadonlyArray<string>;
  scorecard_cat: string | null;
  category: "MERGE" | "CLOSE" | "STALE" | "NEEDS-REVIEW";
  reason: string;
  priority: number;
  gh_cmd: string;
  created: string;
  updated: string;
}

const v7Manifest = v7ManifestRaw as unknown as V7ManifestRaw;
const v7Prs = v7PrsRaw as unknown as ReadonlyArray<V7PrRaw>;

export interface V7Pr {
  readonly repo: string;
  readonly number: number;
  readonly title: string;
  readonly author: string;
  readonly category: "MERGE" | "CLOSE" | "STALE" | "NEEDS-REVIEW";
  readonly reason: string;
  readonly priority: number;
  readonly ci: string;
  readonly mergeable: string;
  readonly isDraft: boolean;
  readonly doctrineHits: ReadonlyArray<string>;
  readonly ghCmd: string;
  readonly url: string;
  readonly created: string;
  readonly updated: string;
}

function buildV7Pr(p: V7PrRaw): V7Pr {
  return Object.freeze({
    repo: p.repo,
    number: p.number,
    title: p.title,
    author: p.author,
    category: p.category,
    reason: p.reason,
    priority: p.priority,
    ci: p.ci,
    mergeable: p.mergeable,
    isDraft: p.is_draft,
    doctrineHits: Object.freeze([...p.doctrine_hits]),
    ghCmd: p.gh_cmd,
    url: `https://github.com/szl-holdings/${p.repo}/pull/${p.number}`,
    created: p.created,
    updated: p.updated,
  });
}

export const V7_PRS: ReadonlyArray<V7Pr> = Object.freeze(v7Prs.map(buildV7Pr));

export interface V7Doctrine {
  readonly version: string;
  readonly replayRoot: string;
  readonly lambdaThreshold: number;
  readonly moralGroundingFloor: number;
  readonly measurabilityHonestyFloor: number;
  readonly forbiddenPatterns: ReadonlyArray<string>;
  readonly licenseAllowlist: ReadonlyArray<string>;
  readonly mythosException: string;
  readonly gitAuthorOverride: string;
}

export const V7_DOCTRINE: V7Doctrine = Object.freeze({
  version: v7Manifest.doctrine.version,
  replayRoot: v7Manifest.doctrine.replay_root,
  lambdaThreshold: v7Manifest.doctrine.lambda_threshold,
  moralGroundingFloor: v7Manifest.doctrine.critical_axes.moralGrounding,
  measurabilityHonestyFloor: v7Manifest.doctrine.critical_axes.measurabilityHonesty,
  forbiddenPatterns: Object.freeze([...v7Manifest.doctrine.forbidden_patterns]),
  licenseAllowlist: Object.freeze([...v7Manifest.doctrine.license_allowlist]),
  mythosException: v7Manifest.doctrine.mythos_exception,
  gitAuthorOverride: v7Manifest.doctrine.git_author_override,
});

/** Canonical Mythos-exception phrase: extracted from the exception clause as
 *  the substring inside single quotes. Used by the forbidden-pattern guard. */
function extractMythosExceptionPhrase(clause: string): string {
  // Pick the quoted substring that actually contains "Mythos" so we don't
  // accidentally match an apostrophe-`s` pair such as `Anthropic's`.
  const m = clause.match(/'([^']*Mythos[^']*)'/);
  if (!m) {
    throw new Error(
      "@szl-holdings/payload: V7 mythos_exception clause missing quoted Mythos phrase",
    );
  }
  return m[1];
}

export const V7_MYTHOS_EXCEPTION_PHRASE: string = extractMythosExceptionPhrase(
  V7_DOCTRINE.mythosException,
);

/** Narrow, path-anchored name exceptions recorded by PM Decision 1 in
 *  docs/audit/v7-pm-decisions.md (2026-05-17). Each entry exempts the literal
 *  `pattern` from the V7 forbidden-pattern sweep when the candidate text's
 *  repo-relative path starts with `pathPrefix`. This is NOT a blanket
 *  allowance: outside the listed prefix, the pattern remains forbidden. */
export interface V7PlatformNameException {
  readonly pattern: string;
  readonly pathPrefix: string;
  readonly note: string;
}

export const V7_PLATFORM_NAME_EXCEPTIONS: ReadonlyArray<V7PlatformNameException> =
  Object.freeze([
    Object.freeze({
      pattern: "Glasswing",
      pathPrefix: "platform/",
      note: "PM Decision 1 (2026-05-17): live customer-facing feature name in platform/.",
    }),
    Object.freeze({
      pattern: "Mythos",
      pathPrefix: "platform/",
      note: "PM Decision 1 (2026-05-17): live customer-facing feature name in platform/.",
    }),
  ]);

/** Context in which a candidate string is being checked against the V7
 *  doctrine. The git_author / git_committer / commit_metadata contexts honor
 *  the historical-override clause and do NOT block forbidden patterns. */
export type V7CheckContext =
  | "doc"
  | "code"
  | "ui"
  | "git_author"
  | "git_committer"
  | "commit_metadata";

export interface V7ForbiddenHit {
  readonly pattern: string;
  readonly index: number;
}

/** Returns the list of forbidden-pattern hits in `text` under the V7
 *  doctrine, honoring (a) the Mythos exception for the literal Anthropic
 *  third-party model name, (b) the git-author override for git
 *  author/committer/commit-metadata contexts, and (c) the path-anchored
 *  platform-name exceptions recorded by PM Decision 1. The optional `path`
 *  argument is the repo-relative path of the file containing `text`; when it
 *  starts with an exception's `pathPrefix`, that exception's pattern is
 *  masked before scanning. */
export function v7ForbiddenHits(
  text: string,
  context: V7CheckContext = "doc",
  path?: string,
): ReadonlyArray<V7ForbiddenHit> {
  if (
    context === "git_author" ||
    context === "git_committer" ||
    context === "commit_metadata"
  ) {
    return Object.freeze([]);
  }
  // Mask out every occurrence of the Mythos exception phrase, plus any
  // path-anchored platform-name exceptions that apply, so their literal
  // substrings do not register as forbidden-pattern hits.
  let scan = text;
  const mythosException = V7_MYTHOS_EXCEPTION_PHRASE;
  if (mythosException.length > 0) {
    scan = scan
      .split(mythosException)
      .join("\u0000".repeat(mythosException.length));
  }
  if (path !== undefined) {
    for (const exc of V7_PLATFORM_NAME_EXCEPTIONS) {
      if (exc.pattern.length === 0) continue;
      if (!path.startsWith(exc.pathPrefix)) continue;
      scan = scan.split(exc.pattern).join("\u0000".repeat(exc.pattern.length));
    }
  }
  const hits: V7ForbiddenHit[] = [];
  const lower = scan.toLowerCase();
  for (const pattern of V7_DOCTRINE.forbiddenPatterns) {
    const needle = pattern.toLowerCase();
    let from = 0;
    while (true) {
      const i = lower.indexOf(needle, from);
      if (i < 0) break;
      hits.push(Object.freeze({ pattern, index: i }));
      from = i + needle.length;
    }
  }
  return Object.freeze(hits);
}

/** Convenience predicate. */
export function v7IsForbidden(
  text: string,
  context: V7CheckContext = "doc",
  path?: string,
): boolean {
  return v7ForbiddenHits(text, context, path).length > 0;
}

export interface V7SpecialistSummary {
  readonly doctrineSweep: {
    readonly filesScanned: number;
    readonly autoFixesAppliedLocal: number;
    readonly liveRepoEscalations: number;
    readonly status: string;
  };
  readonly hygieneFix: {
    readonly reposTargeted: ReadonlyArray<string>;
    readonly filesDrafted: number;
    readonly prsProposed: number;
    readonly status: string;
  };
  readonly bpFix: {
    readonly reposTargeted: ReadonlyArray<string>;
    readonly putPayloadsReady: number;
    readonly risk: string;
    readonly status: string;
  };
  readonly citationFix: {
    readonly reposDrafted: number;
    readonly fieldChange: string;
    readonly status: string;
  };
  readonly prTriage: {
    readonly totalOpenPrs: number;
    readonly merge: number;
    readonly close: number;
    readonly stale: number;
    readonly needsReview: number;
    readonly mergeCandidates: string;
    readonly closeUrgency: string;
    readonly status: string;
  };
}

export const V7_SPECIALISTS: V7SpecialistSummary = Object.freeze({
  doctrineSweep: Object.freeze({
    filesScanned: v7Manifest.specialists.doctrine_sweep.files_scanned,
    autoFixesAppliedLocal: v7Manifest.specialists.doctrine_sweep.auto_fixes_applied_local,
    liveRepoEscalations: v7Manifest.specialists.doctrine_sweep.live_repo_escalations,
    status: v7Manifest.specialists.doctrine_sweep.status,
  }),
  hygieneFix: Object.freeze({
    reposTargeted: Object.freeze([...v7Manifest.specialists.hygiene_fix.repos_targeted]),
    filesDrafted: v7Manifest.specialists.hygiene_fix.files_drafted,
    prsProposed: v7Manifest.specialists.hygiene_fix.prs_proposed,
    status: v7Manifest.specialists.hygiene_fix.status,
  }),
  bpFix: Object.freeze({
    reposTargeted: Object.freeze([...v7Manifest.specialists.bp_fix.repos_targeted]),
    putPayloadsReady: v7Manifest.specialists.bp_fix.put_payloads_ready,
    risk: v7Manifest.specialists.bp_fix.risk,
    status: v7Manifest.specialists.bp_fix.status,
  }),
  citationFix: Object.freeze({
    reposDrafted: v7Manifest.specialists.citation_fix.repos_drafted,
    fieldChange: v7Manifest.specialists.citation_fix.field_change,
    status: v7Manifest.specialists.citation_fix.status,
  }),
  prTriage: Object.freeze({
    totalOpenPrs: v7Manifest.specialists.pr_triage.total_open_prs,
    merge: v7Manifest.specialists.pr_triage.categories.MERGE,
    close: v7Manifest.specialists.pr_triage.categories.CLOSE,
    stale: v7Manifest.specialists.pr_triage.categories.STALE,
    needsReview: v7Manifest.specialists.pr_triage.categories.NEEDS_REVIEW,
    mergeCandidates: v7Manifest.specialists.pr_triage.merge_candidates,
    closeUrgency: v7Manifest.specialists.pr_triage.close_urgency,
    status: v7Manifest.specialists.pr_triage.status,
  }),
});

export interface V7GithubOrgBaseline {
  readonly reposAudited: number;
  readonly ciFailing: number;
  readonly codeScanningAlerts: number;
  readonly dependabotHighCritical: number;
  readonly scorecardAvg: number;
  readonly bpCompliant: number;
  readonly bpWeak: number;
}

export const V7_ORG_BASELINE: V7GithubOrgBaseline = Object.freeze({
  reposAudited: v7Manifest.github_org_baseline.repos_audited,
  ciFailing: v7Manifest.github_org_baseline.ci_failing,
  codeScanningAlerts: v7Manifest.github_org_baseline.code_scanning_alerts,
  dependabotHighCritical: v7Manifest.github_org_baseline.dependabot_high_critical,
  scorecardAvg: v7Manifest.github_org_baseline.scorecard_avg,
  bpCompliant: v7Manifest.github_org_baseline.bp_compliant,
  bpWeak: v7Manifest.github_org_baseline.bp_weak,
});

export interface V7Manifest {
  readonly schema: string;
  readonly generatedAtUtc: string;
  readonly mission: string;
  readonly fileCount: number;
  readonly totalBytes: number;
  readonly pendingPmDecisions: ReadonlyArray<string>;
  readonly executionOrder: ReadonlyArray<string>;
}

export const V7: {
  readonly manifest: V7Manifest;
  readonly doctrine: V7Doctrine;
  readonly specialists: V7SpecialistSummary;
  readonly orgBaseline: V7GithubOrgBaseline;
  readonly prs: ReadonlyArray<V7Pr>;
} = Object.freeze({
  manifest: Object.freeze({
    schema: v7Manifest.schema,
    generatedAtUtc: v7Manifest.generated_at_utc,
    mission: v7Manifest.mission,
    fileCount: v7Manifest.file_count,
    totalBytes: v7Manifest.total_bytes,
    pendingPmDecisions: Object.freeze([...v7Manifest.pending_pm_decisions]),
    executionOrder: Object.freeze([...v7Manifest.execution_order_recommendation]),
  }),
  doctrine: V7_DOCTRINE,
  specialists: V7_SPECIALISTS,
  orgBaseline: V7_ORG_BASELINE,
  prs: V7_PRS,
});

// ---------------------------------------------------------------------------
// V7 panel facts — derived display strings rendered by the "Latest audit"
// row in every GovernancePanel and by the Amaru V7 ribbon.
// ---------------------------------------------------------------------------

const V7_FILES_TEXT = `${V7_SPECIALISTS.doctrineSweep.filesScanned} files`;
const V7_PRS_TEXT = `${V7_SPECIALISTS.prTriage.totalOpenPrs} PRs`;
const V7_CLOSE_TEXT = `${V7_SPECIALISTS.prTriage.close} close`;
const V7_BP_TEXT = `${V7_SPECIALISTS.bpFix.putPayloadsReady} BP`;
const V7_CFF_TEXT = `${V7_SPECIALISTS.citationFix.reposDrafted} CFF`;

export const V7_PANEL_FACTS = Object.freeze({
  latestAuditLabel: "Fly-High V7",
  latestAuditText: `Fly-High V7 \u00b7 ${V7_FILES_TEXT} \u00b7 ${V7_PRS_TEXT} \u00b7 ${V7_CLOSE_TEXT} \u00b7 ${V7_BP_TEXT} \u00b7 ${V7_CFF_TEXT}`,
  filesScannedText: V7_FILES_TEXT,
  prsTriagedText: V7_PRS_TEXT,
  mergeProposedText: `${V7_SPECIALISTS.prTriage.merge} merge`,
  closeProposedText: V7_CLOSE_TEXT,
  needsReviewText: `${V7_SPECIALISTS.prTriage.needsReview} review`,
  bpPayloadsText: `${V7_SPECIALISTS.bpFix.putPayloadsReady} ready`,
  citationDraftsText: `${V7_SPECIALISTS.citationFix.reposDrafted} drafts`,
  hygieneDraftsText: `${V7_SPECIALISTS.hygieneFix.filesDrafted} files \u00b7 ${V7_SPECIALISTS.hygieneFix.prsProposed} PRs`,
  pendingDecisionsText: `${V7.manifest.pendingPmDecisions.length} pending`,
  v7AuditRibbonText: `Latest audit: Fly-High V7 \u2014 ${V7_FILES_TEXT} scanned, ${V7_PRS_TEXT} triaged (${V7_SPECIALISTS.prTriage.merge} merge / ${V7_SPECIALISTS.prTriage.close} close)`,
  // Canonical repo-relative paths for the V7 audit doc set. These point at
  // the human-readable register (all open PRs categorised MERGE/CLOSE/STALE/
  // NEEDS_REVIEW) and the pending PM-decision worksheet derived from
  // MANIFEST.pending_pm_decisions[]. The GovernancePanels "Latest audit" row
  // and the Amaru ribbon V7 chip link to these so operators can jump from a
  // panel fact straight to the underlying triage source.
  prTriageDocPath: "docs/audit/v7-pr-triage.md",
  prTriageDocHref: "/docs/audit/v7-pr-triage.md",
  prTriageDocTitle: "Fly-High V7 — PR Triage Register",
  pmDecisionsDocPath: "docs/audit/v7-pm-decisions.md",
  pmDecisionsDocHref: "/docs/audit/v7-pm-decisions.md",
  pmDecisionsDocTitle: `Fly-High V7 — ${V7.manifest.pendingPmDecisions.length} Pending PM Decisions`,
});

export type V7PanelFactsKey = keyof typeof V7_PANEL_FACTS;

// ---------------------------------------------------------------------------
// V7 per-repo specialist materializations
//
// The V7 specialists produced concrete per-repo artifacts: 6 branch-protection
// PUT payloads (ready for the BP-apply script), 13 CITATION.cff drafts +
// 13 matching PR-body markdowns, and 2 hygiene-file drafts (SECURITY.md,
// CONTRIBUTING.md, CODE_OF_CONDUCT.md, PR_BODY.md per repo). These are the
// "blast radius" of the V7 pack — every byte that would be pushed live by an
// apply script. They are surfaced here as typed exports so downstream tooling
// can render, diff, or verify them without deep-importing from raw_v7/.
//
// BP payloads are full JSON content (static imports). CFF + hygiene drafts
// are surfaced as { path, sha256, sizeBytes } records anchored to
// MANIFEST.files[] — the raw bytes are verified by `verify:v7` and can be
// read via the server entry (which has fs access).
// ---------------------------------------------------------------------------

import v7BpLutarLean from "../raw_v7/02_specialists/bp_fix/lutar-lean_bp_payload.json" with { type: "json" };
import v7BpSzlTrust from "../raw_v7/02_specialists/bp_fix/szl-trust_bp_payload.json" with { type: "json" };
import v7BpSzlCookbook from "../raw_v7/02_specialists/bp_fix/szl-cookbook_bp_payload.json" with { type: "json" };
import v7BpSzlBrand from "../raw_v7/02_specialists/bp_fix/szl-brand_bp_payload.json" with { type: "json" };
import v7BpVspOtel from "../raw_v7/02_specialists/bp_fix/vsp-otel_bp_payload.json" with { type: "json" };
import v7BpAgiForecast from "../raw_v7/02_specialists/bp_fix/agi-forecast_bp_payload.json" with { type: "json" };

export interface V7BpPayload {
  readonly required_status_checks: {
    readonly strict: boolean;
    readonly checks: ReadonlyArray<{ readonly context: string; readonly app_id: number }>;
  };
  readonly enforce_admins: boolean;
  readonly required_pull_request_reviews: {
    readonly required_approving_review_count: number;
    readonly dismiss_stale_reviews: boolean;
    readonly require_code_owner_reviews: boolean;
  };
  readonly restrictions: unknown;
  readonly allow_force_pushes: boolean;
  readonly allow_deletions: boolean;
  readonly required_conversation_resolution: boolean;
  readonly required_linear_history: boolean;
}

export interface V7BpEntry {
  readonly repo: string;
  readonly path: string;
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly payload: V7BpPayload;
}

function manifestEntry(p: string): { sha256: string; sizeBytes: number } {
  const e = v7Manifest.files.find((f) => f.path === p);
  if (!e) {
    throw new Error(`@szl-holdings/payload: V7 manifest missing file ${p}`);
  }
  return { sha256: e.sha256, sizeBytes: e.size_bytes };
}

function buildBpEntry(repo: string, payload: unknown): V7BpEntry {
  const path = `02_specialists/bp_fix/${repo}_bp_payload.json`;
  const m = manifestEntry(path);
  return Object.freeze({
    repo,
    path,
    sha256: m.sha256,
    sizeBytes: m.sizeBytes,
    payload: payload as V7BpPayload,
  });
}

export const V7_BP_PAYLOADS: ReadonlyArray<V7BpEntry> = Object.freeze([
  buildBpEntry("agi-forecast", v7BpAgiForecast),
  buildBpEntry("lutar-lean", v7BpLutarLean),
  buildBpEntry("szl-brand", v7BpSzlBrand),
  buildBpEntry("szl-cookbook", v7BpSzlCookbook),
  buildBpEntry("szl-trust", v7BpSzlTrust),
  buildBpEntry("vsp-otel", v7BpVspOtel),
]);

export const V7_BP_BY_REPO: Readonly<Record<string, V7BpEntry>> = Object.freeze(
  Object.fromEntries(V7_BP_PAYLOADS.map((e) => [e.repo, e])),
);

export interface V7DraftFile {
  readonly path: string;
  readonly sha256: string;
  readonly sizeBytes: number;
}

export interface V7CitationDraft {
  readonly repo: string;
  readonly cff: V7DraftFile;
  readonly prBody: V7DraftFile;
}

function draftFile(p: string): V7DraftFile {
  const m = manifestEntry(p);
  return Object.freeze({ path: p, sha256: m.sha256, sizeBytes: m.sizeBytes });
}

const V7_CITATION_REPOS: ReadonlyArray<string> = Object.freeze(
  v7Manifest.files
    .map((f) => {
      const m = f.path.match(/^02_specialists\/citation_fix\/(.+)_CITATION\.cff$/);
      return m ? m[1] : null;
    })
    .filter((r): r is string => r !== null)
    .sort(),
);

export const V7_CITATION_DRAFTS: ReadonlyArray<V7CitationDraft> = Object.freeze(
  V7_CITATION_REPOS.map((repo) =>
    Object.freeze({
      repo,
      cff: draftFile(`02_specialists/citation_fix/${repo}_CITATION.cff`),
      prBody: draftFile(`02_specialists/citation_fix/${repo}_PR_BODY.md`),
    }),
  ),
);

export const V7_CITATION_BY_REPO: Readonly<Record<string, V7CitationDraft>> =
  Object.freeze(
    Object.fromEntries(V7_CITATION_DRAFTS.map((d) => [d.repo, d])),
  );

export interface V7HygieneDraft {
  readonly repo: string;
  readonly security: V7DraftFile;
  readonly contributing: V7DraftFile;
  readonly codeOfConduct: V7DraftFile;
  readonly prBody: V7DraftFile;
}

export const V7_HYGIENE_DRAFTS: ReadonlyArray<V7HygieneDraft> = Object.freeze(
  V7_SPECIALISTS.hygieneFix.reposTargeted.map((repo) =>
    Object.freeze({
      repo,
      security: draftFile(`02_specialists/hygiene/${repo}/SECURITY.md`),
      contributing: draftFile(`02_specialists/hygiene/${repo}/CONTRIBUTING.md`),
      codeOfConduct: draftFile(`02_specialists/hygiene/${repo}/CODE_OF_CONDUCT.md`),
      prBody: draftFile(`02_specialists/hygiene/${repo}/PR_BODY.md`),
    }),
  ),
);

export const V7_HYGIENE_BY_REPO: Readonly<Record<string, V7HygieneDraft>> =
  Object.freeze(
    Object.fromEntries(V7_HYGIENE_DRAFTS.map((d) => [d.repo, d])),
  );
