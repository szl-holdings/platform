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
