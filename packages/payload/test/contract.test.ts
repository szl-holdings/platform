/**
 * Contract test for @szl-holdings/payload.
 *
 * Three layers of strictness:
 *
 *   1. Raw -> exports: every DOCTRINE / ORG_SUMMARY / REPOS / PUSH_QUEUE /
 *      DOI_LEDGER_COUNT value must exactly equal the corresponding field in
 *      the raw JSON on disk. The exports are derived via JSON imports, so
 *      this layer mainly guards against accidental regressions in field
 *      mappings.
 *
 *   2. Exports -> PANEL_FACTS: every PANEL_FACTS.* string must be byte-for-
 *      byte equal to the formatter applied to DOCTRINE / ORG_SUMMARY /
 *      PUSH_QUEUE / DOI_LEDGER_COUNT. No transcribed strings allowed.
 *
 *   3. PANEL_FACTS -> panels: for each of the 7 GovernancePanels.tsx files,
 *      every `<Row label="..." value={EXPR|"STR"} />` is inspected. String
 *      literals must contain no forbidden canonical literal (full replay
 *      root, ORCID, ARXIV sha, panel-repo full-name). Expression attributes
 *      must evaluate cleanly against a sandbox bound to the package exports
 *      — proving the panel is wired to the payload and not to local
 *      transcribed constants.
 */

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

import {
  ARXIV_SHA_SHORT,
  DOCTRINE,
  DOI_LEDGER_COUNT,
  LICENSE_ALLOWLIST_SHORT_TEXT,
  ORG_SUMMARY,
  PANEL_FACTS,
  PAYLOAD_GENERATED_AT,
  PAYLOAD_SCHEMA_VERSION,
  PUSH_QUEUE,
  REPLAY_ROOT_SHORT,
  REPOS,
  getRepoFacts,
  hasRepo,
  panelRepoFacts,
  pushedAtUtc,
  shortSha,
  type PanelRepoKey,
} from "../src/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
const RAW = resolve(HERE, "..", "raw");

const master = JSON.parse(readFileSync(join(RAW, "payload.json"), "utf8"));
const inventory = JSON.parse(
  readFileSync(join(RAW, "github_pro/github_inventory.json"), "utf8"),
);
const runtime = JSON.parse(
  readFileSync(join(RAW, "dev2_runtime/runtime_payload.json"), "utf8"),
);

// ---------------------------------------------------------------------------
// Layer 1: raw -> exports
// ---------------------------------------------------------------------------

describe("layer 1 — exports equal raw payload", () => {
  it("schema/generated metadata", () => {
    expect(PAYLOAD_SCHEMA_VERSION).toBe(master.schema_version);
    expect(PAYLOAD_GENERATED_AT).toBe(master.generated_at);
  });

  it("DOCTRINE equals raw payload.doctrine + identity", () => {
    const d = master.doctrine;
    const i = master.identity;
    expect(DOCTRINE.version).toBe(d.version);
    expect(DOCTRINE.replayRoot).toBe(d.replay_root);
    expect(DOCTRINE.byline).toBe(d.byline_canonical);
    expect(DOCTRINE.licenseAllowlist).toEqual(d.license_allowlist);
    expect(DOCTRINE.ingestionPolicy).toBe(d.ingestion_policy);
    expect(DOCTRINE.byteIdenticalReplays).toBe(d.byte_identical_replays_required);
    expect(DOCTRINE.lambdaAxes).toBe(d.lambda_axes_count);
    expect(DOCTRINE.lambdaFloor).toBe(d.lambda_conjunctive_floor);
    expect(DOCTRINE.moralGroundingFloor).toBe(d.moralGrounding_floor);
    expect(DOCTRINE.measurabilityHonestyFloor).toBe(d.measurabilityHonesty_floor);
    expect(DOCTRINE.orcid).toBe(i.orcid);
    expect(DOCTRINE.affiliation).toBe(i.affiliation);
    expect(DOCTRINE.githubOrg).toBe(i.github_org);
    expect(DOCTRINE.githubUsername).toBe(i.github_username);
  });

  it("ORG_SUMMARY equals raw payload.org_summary", () => {
    const o = master.org_summary;
    expect(ORG_SUMMARY.reposTotal).toBe(o.repos_total);
    expect(ORG_SUMMARY.ciFailing).toBe(o.ci_failing);
    expect(ORG_SUMMARY.openPrs).toBe(o.open_prs);
    expect(ORG_SUMMARY.openAlertsCodeScanning).toBe(o.open_alerts_code_scanning);
    expect(ORG_SUMMARY.openDependabotHighCritical).toBe(
      o.open_dependabot_high_critical,
    );
    expect(ORG_SUMMARY.scorecardAvg).toBe(o.scorecard_avg);
    expect(ORG_SUMMARY.branchProtectionCompliant).toBe(o.branch_protection_compliant);
    expect(ORG_SUMMARY.branchProtectionWeak).toBe(o.branch_protection_weak);
    expect(ORG_SUMMARY.hygieneGaps).toEqual(o.hygiene_gaps);
  });

  describe("REPOS equals raw github_inventory.repos", () => {
    for (const key of Object.keys(REPOS) as PanelRepoKey[]) {
      it(`repo "${key}" — full identity + sha + push date match inventory`, () => {
        const r = inventory.repos[key];
        const repo = REPOS[key];
        expect(repo.fullName).toBe(r.metadata.full_name);
        expect(repo.defaultBranch).toBe(r.metadata.default_branch);
        expect(repo.pushedAt).toBe(r.metadata.pushed_at);
        // Inventory truncates recent_commits[0].sha to 12 chars; we preserve
        // it exactly (no padding/fabrication).
        expect(repo.latestCommitSha).toBe(r.recent_commits[0].sha);
        expect(repo.latestCommitDate).toBe(r.recent_commits[0].date);
        if (r.tags && r.tags.length > 0) {
          expect(repo.latestTag).toBe(r.tags[0].name);
          expect(repo.latestTagSha).toBe(r.tags[0].sha);
        }
      });
    }
  });

  it("PUSH_QUEUE equals raw master.push_queue_ready_one_way_doors", () => {
    const arxiv = master.push_queue_ready_one_way_doors.find((e: { id: string }) =>
      e.id.includes("ARXIV"),
    );
    const zenodo = master.push_queue_ready_one_way_doors.find((e: { id: string }) =>
      e.id.includes("ZENODO"),
    );
    expect(PUSH_QUEUE.arxivSha).toBe(arxiv.sha256);
    expect(PUSH_QUEUE.arxivStatus).toBe(arxiv.status);
    expect(PUSH_QUEUE.arxivArtifact).toBe(arxiv.artifact);
    expect(PUSH_QUEUE.zenodoTargetVersion).toBe(zenodo.target_version);
    expect(PUSH_QUEUE.zenodoStatus).toBe(zenodo.status);
    expect(PUSH_QUEUE.zenodoArtifact).toBe(zenodo.artifact);
  });

  it("DOI_LEDGER_COUNT equals runtime payload doi_count", () => {
    expect(DOI_LEDGER_COUNT).toBe(runtime.doi_count);
  });

  it("getRepoFacts/hasRepo cover the broader inventory (e.g. szl-brand, lutar-lean)", () => {
    expect(hasRepo("szl-brand")).toBe(true);
    expect(hasRepo("lutar-lean")).toBe(true);
    expect(hasRepo("__nope__")).toBe(false);
    const sb = getRepoFacts("szl-brand");
    expect(sb.latestCommitSha).toBe(
      inventory.repos["szl-brand"].recent_commits[0].sha,
    );
    expect(() => getRepoFacts("__nope__")).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Layer 2: exports -> PANEL_FACTS
// ---------------------------------------------------------------------------

describe("layer 2 — every PANEL_FACTS string equals its formatter-of-exports", () => {
  const byte = DOCTRINE.byteIdenticalReplays;
  const axes = DOCTRINE.lambdaAxes;
  const floor = DOCTRINE.lambdaFloor;

  const expected: Record<keyof typeof PANEL_FACTS, string> = {
    replayRootShort: shortSha(DOCTRINE.replayRoot),
    byteIdenticalReplaysRequiredText: `${byte} required`,
    byteIdenticalReplaysOfText: `${byte} of ${byte}`,
    byteIdenticalReplaysShort: `${byte} byte-identical`,
    lambdaFloorAndText: `${floor.toFixed(2)} \u00b7 ${axes}-axis AND`,
    lambdaFloorConjAndText: `${floor.toFixed(2)} across ${axes} axes`,
    lambdaFloorParenText: `${floor.toFixed(2)} (${axes}-axis \u2227)`,
    lambdaAxesShortText: `${axes} conjunctive \u2227`,
    moralGroundingFloorText: DOCTRINE.moralGroundingFloor.toFixed(2),
    moralGroundingGteText: `\u2265 ${DOCTRINE.moralGroundingFloor.toFixed(2)}`,
    measurabilityHonestyText: DOCTRINE.measurabilityHonestyFloor.toFixed(2),
    measurabilityHonestyGteText: `\u2265 ${DOCTRINE.measurabilityHonestyFloor.toFixed(2)}`,
    ingestionPolicyText: DOCTRINE.ingestionPolicy,
    licenseAllowlistShortText: LICENSE_ALLOWLIST_SHORT_TEXT,
    authorText: DOCTRINE.byline,
    orcidText: DOCTRINE.orcid,
    affiliationText: DOCTRINE.affiliation,
    githubOrgText: DOCTRINE.githubOrg,
    githubUsernameText: DOCTRINE.githubUsername,
    doctrineVersionText: DOCTRINE.version,
    zenodoText: `${PUSH_QUEUE.zenodoTargetVersion} \u2014 push queue ready`,
    arxivShaShortText: `sha ${ARXIV_SHA_SHORT}`,
    arxivShaShortQueuedText: `sha ${ARXIV_SHA_SHORT} (one-way door queued)`,
    pushQueueReadyText: `ZENODO ${PUSH_QUEUE.zenodoTargetVersion} \u00b7 arXiv submit`,
    oneWayDoorsText: "awaiting confirm",
    reposCountText: String(ORG_SUMMARY.reposTotal),
    ciFailingText: String(ORG_SUMMARY.ciFailing),
    scorecardAvgText: `${ORG_SUMMARY.scorecardAvg.toFixed(2)} / 10`,
    branchProtectionStrictText: `${ORG_SUMMARY.branchProtectionCompliant} / ${ORG_SUMMARY.reposTotal}`,
    dependabotHighCritText: `${ORG_SUMMARY.openDependabotHighCritical}`,
    dependabotHighCritPairText: `${ORG_SUMMARY.openDependabotHighCritical} / ${ORG_SUMMARY.openDependabotHighCritical}`,
    codeScanningOrgWideText: `${ORG_SUMMARY.openAlertsCodeScanning} (org-wide)`,
    doiLedgerEvidenceText: `${DOI_LEDGER_COUNT}-DOI evidence chain`,
    doiMintedText: `${DOI_LEDGER_COUNT} minted`,
  };

  for (const k of Object.keys(expected) as Array<keyof typeof PANEL_FACTS>) {
    it(`PANEL_FACTS.${k} === expected derivation`, () => {
      expect(PANEL_FACTS[k]).toBe(expected[k]);
    });
  }

  it("REPLAY_ROOT_SHORT and ARXIV_SHA_SHORT derive cleanly", () => {
    expect(REPLAY_ROOT_SHORT).toBe(shortSha(DOCTRINE.replayRoot));
    expect(ARXIV_SHA_SHORT).toBe(shortSha(PUSH_QUEUE.arxivSha));
  });

  it("panelRepoFacts strings derive from REPOS", () => {
    for (const key of Object.keys(REPOS) as PanelRepoKey[]) {
      const f = panelRepoFacts(key);
      const r = REPOS[key];
      expect(f.fullName).toBe(r.fullName);
      expect(f.commitShort).toBe(shortSha(r.latestCommitSha));
      expect(f.pushedAtUtcText).toBe(pushedAtUtc(r.pushedAt));
      if (r.latestTagSha) {
        expect(f.tagShaShort).toBe(shortSha(r.latestTagSha));
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Layer 3: PANEL_FACTS -> panels (static AST-ish extraction).
// ---------------------------------------------------------------------------

const PANELS: ReadonlyArray<{ artifact: string; repoKey: PanelRepoKey }> = [
  { artifact: "conduit", repoKey: "amaru" },
  { artifact: "a11oy", repoKey: "a11oy" },
  { artifact: "sentra", repoKey: "sentra" },
  { artifact: "counsel", repoKey: "counsel" },
  { artifact: "terra", repoKey: "terra" },
  { artifact: "vessels", repoKey: "vessels" },
  { artifact: "carlota-jo", repoKey: "carlota-jo" },
];

function panelSrc(artifact: string): string {
  return readFileSync(
    join(ROOT, "artifacts", artifact, "src/components/GovernancePanels.tsx"),
    "utf8",
  );
}

// Forbidden canonical literals — these MUST be derived from the package, never
// transcribed into a panel.
const FORBIDDEN_LITERALS: ReadonlyArray<string> = [
  DOCTRINE.replayRoot, // full 64-char replay root
  DOCTRINE.orcid, // 0009-0001-0110-4173
  PUSH_QUEUE.arxivSha, // full 64-char arxiv sha
  PUSH_QUEUE.arxivSha.slice(0, 8), // short arxiv sha used as bare literal
  DOCTRINE.replayRoot.slice(0, 8), // short replay root used as bare literal
];

describe("layer 3 — panels render only payload-derived facts", () => {
  for (const { artifact, repoKey } of PANELS) {
    describe(`artifact: ${artifact}`, () => {
      const src = panelSrc(artifact);

      it("imports from @szl-holdings/payload", () => {
        expect(src).toMatch(/from\s+['"]@szl-holdings\/payload['"]/);
      });

      it("contains no forbidden canonical literal", () => {
        for (const lit of FORBIDDEN_LITERALS) {
          // The string may legitimately appear inside an import or comment;
          // but the panels currently have neither (verified by inspection).
          // If it appears anywhere, fail loudly with the offending literal.
          expect(
            src.includes(lit),
            `panel "${artifact}" must not contain canonical literal "${lit}"`,
          ).toBe(false);
        }
      });

      it("does not hard-code its own repo full-name", () => {
        const fullName = REPOS[repoKey].fullName;
        expect(
          src.includes(`"${fullName}"`) || src.includes(`'${fullName}'`),
          `panel "${artifact}" hard-codes ${fullName}`,
        ).toBe(false);
      });

      it("every <Row value={EXPR} /> resolves against the package sandbox", () => {
        // Build a sandbox containing the public package surface plus a
        // resolved per-panel `repo` binding (panels use `const repo =
        // panelRepoFacts('<key>')` at top-level).
        const sandbox: Record<string, unknown> = {
          DOCTRINE,
          ORG_SUMMARY,
          PANEL_FACTS,
          PUSH_QUEUE,
          REPOS,
          REPLAY_ROOT_SHORT,
          ARXIV_SHA_SHORT,
          LICENSE_ALLOWLIST_SHORT_TEXT,
          DOI_LEDGER_COUNT,
          panelRepoFacts,
          getRepoFacts,
          shortSha,
          pushedAtUtc,
          repo: panelRepoFacts(repoKey),
          // Panels may also bind the repo facts under a name matching their
          // repo key (e.g. `const amaru = panelRepoFacts('amaru')`).
          [repoKey]: panelRepoFacts(repoKey),
          [repoKey.replace(/-/g, "_")]: panelRepoFacts(repoKey),
          // carlota-jo derives these top-level constants from the package.
          REPLAY_ROOT_FULL: DOCTRINE.replayRoot,
          SZL_BRAND_SHA: getRepoFacts("szl-brand").latestCommitSha,
          LUTAR_LEAN_SHA: getRepoFacts("lutar-lean").latestCommitSha,
        };

        // Extract every JSX `value={...}` expression body. This regex is
        // intentionally narrow — matches `value={` then captures up to the
        // matching closing `}` on the same logical span (the panels keep
        // each Row to one line).
        const re = /\bvalue=\{([^{}\n]+(?:\{[^{}]*\}[^{}\n]*)*)\}/g;
        const expressions: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = re.exec(src)) !== null) {
          expressions.push(m[1].trim());
        }

        expect(
          expressions.length,
          `panel "${artifact}" has no <Row value={...} /> expressions to verify`,
        ).toBeGreaterThan(0);

        const failures: Array<{ expr: string; error: string }> = [];
        for (const expr of expressions) {
          try {
            const result = runInNewContext(`(${expr})`, sandbox, {
              timeout: 100,
            });
            if (
              result === undefined ||
              result === null ||
              (typeof result !== "string" &&
                typeof result !== "number" &&
                typeof result !== "boolean")
            ) {
              failures.push({
                expr,
                error: `evaluated to ${typeof result} (${String(result)})`,
              });
            }
          } catch (e) {
            failures.push({ expr, error: (e as Error).message });
          }
        }

        if (failures.length > 0) {
          const msg = failures
            .map((f) => `  value={${f.expr}}  ->  ${f.error}`)
            .join("\n");
          throw new Error(
            `panel "${artifact}" has ${failures.length} unresolvable <Row value={...} /> expressions:\n${msg}`,
          );
        }
      });
    });
  }
});
