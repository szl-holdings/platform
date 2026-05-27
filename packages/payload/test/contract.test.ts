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

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

import {
  DEPENDABOT_MERGED_THIS_CYCLE_COUNT,
  OPEN_CRITICAL_CODE_SCANNING_ALERTS_COUNT,
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
  V7,
  V7_BP_BY_REPO,
  V7_BP_PAYLOADS,
  V7_CITATION_BY_REPO,
  V7_CITATION_DRAFTS,
  V7_DOCTRINE,
  V7_HYGIENE_BY_REPO,
  V7_HYGIENE_DRAFTS,
  V7_KHIPU_EXCEPTION_PHRASE,
  V7_ORG_BASELINE,
  V7_PANEL_FACTS,
  V7_PRS,
  V7_SPECIALISTS,
  THESIS_LINEAGE,
  THESIS_PAPERS,
  THESIS_TIMELINE,
  getRepoFacts,
  hasRepo,
  panelRepoFacts,
  pushedAtUtc,
  shortSha,
  v7ForbiddenHits,
  v7IsForbidden,
  type PanelRepoKey,
} from "../src/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..", "..", "..");
const RAW = resolve(HERE, "..", "raw");
const RAW_V7 = resolve(HERE, "..", "raw_v7");

const master = JSON.parse(readFileSync(join(RAW, "payload.json"), "utf8"));
const inventory = JSON.parse(
  readFileSync(join(RAW, "github_pro/github_inventory.json"), "utf8"),
);
const runtime = JSON.parse(
  readFileSync(join(RAW, "dev2_runtime/runtime_payload.json"), "utf8"),
);
const v7ManifestRaw = JSON.parse(
  readFileSync(join(RAW_V7, "03_manifests", "MANIFEST.json"), "utf8"),
);
const v7PrsRaw = JSON.parse(
  readFileSync(
    join(RAW_V7, "02_specialists", "pr_triage", "all_prs_final.json"),
    "utf8",
  ),
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
    dependabotMergedThisCycleText: `${DEPENDABOT_MERGED_THIS_CYCLE_COUNT} merged this cycle`,
    codeScanningOrgWideText: `${ORG_SUMMARY.openAlertsCodeScanning} (org-wide)`,
    openCriticalCodeScanningAlertsText: `${OPEN_CRITICAL_CODE_SCANNING_ALERTS_COUNT} open critical alerts`,
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
          V7,
          V7_DOCTRINE,
          V7_SPECIALISTS,
          V7_ORG_BASELINE,
          V7_PANEL_FACTS,
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
          // Top-level thesis exports referenced by every panel.
          THESIS_LINEAGE,
          THESIS_PAPERS,
          THESIS_TIMELINE,
        };

        // Detect `IDENT.map((NAME) => ...)` (and `?.map`, `.flatMap`) closures
        // so the closure variable name is bound dynamically from the actual
        // source array — instead of hard-coding a single loop variable (`p`).
        // If a panel refactors to `.map((paper) => ...)` or `.map((thesis) =>
        // ...)`, this still resolves correctly. The source iterable is
        // evaluated in the sandbox; the first element becomes the binding.
        type MapClosure = {
          bodyStart: number;
          bodyEnd: number;
          name: string;
          source: string;
        };
        const closures: MapClosure[] = [];
        const mapRe =
          /\.(?:flatMap|map)\s*\(\s*\(?\s*([A-Za-z_$][\w$]*)\s*(?:,\s*[A-Za-z_$][\w$]*\s*)?\)?\s*=>/g;
        let mc: RegExpExecArray | null;
        while ((mc = mapRe.exec(src)) !== null) {
          const name = mc[1];
          // Walk back from the `.` to collect the iterable identifier chain
          // (e.g. `THESIS_PAPERS`, `acc?.items`, `foo.bar.baz`).
          let i = mc.index - 1;
          while (i >= 0 && /[\w$.?]/.test(src[i])) i--;
          const source = src.slice(i + 1, mc.index).replace(/\?\./g, ".");
          if (!source) continue;
          // Find the `(` opening the `.map(` callback arglist.
          const open = src.indexOf("(", mc.index);
          if (open === -1) continue;
          // Walk forward, balancing parens (ignoring those inside string
          // literals) to find the matching `)` that closes `.map(`.
          let depth = 1;
          let j = open + 1;
          let quote: string | null = null;
          while (j < src.length && depth > 0) {
            const c = src[j];
            if (quote) {
              if (c === "\\") {
                j += 2;
                continue;
              }
              if (c === quote) quote = null;
            } else if (c === '"' || c === "'" || c === "`") {
              quote = c;
            } else if (c === "(") {
              depth++;
            } else if (c === ")") {
              depth--;
            }
            j++;
          }
          closures.push({ bodyStart: open, bodyEnd: j, name, source });
        }

        // Extract every JSX `value={...}` expression body, retaining its
        // position so we can detect which (if any) map-closure scope it sits
        // in. The regex is intentionally narrow — matches `value={` then
        // captures up to the matching closing `}` on the same logical span
        // (panels keep each Row to one line).
        const re = /\bvalue=\{([^{}\n]+(?:\{[^{}]*\}[^{}\n]*)*)\}/g;
        const expressions: { expr: string; offset: number }[] = [];
        let m: RegExpExecArray | null;
        while ((m = re.exec(src)) !== null) {
          expressions.push({ expr: m[1].trim(), offset: m.index });
        }

        expect(
          expressions.length,
          `panel "${artifact}" has no <Row value={...} /> expressions to verify`,
        ).toBeGreaterThan(0);

        const failures: Array<{ expr: string; error: string }> = [];
        for (const { expr, offset } of expressions) {
          // Build a per-expression scope, layering on bindings from every
          // enclosing map-closure. Innermost wins (later loop iterations
          // overwrite outer bindings of the same name).
          const scope: Record<string, unknown> = { ...sandbox };
          const enclosing = closures
            .filter((c) => offset > c.bodyStart && offset < c.bodyEnd)
            .sort((a, b) => a.bodyStart - b.bodyStart);
          for (const c of enclosing) {
            try {
              const arr = runInNewContext(`(${c.source})`, sandbox, {
                timeout: 100,
              }) as unknown;
              scope[c.name] = Array.isArray(arr) ? arr[0] : arr;
            } catch {
              // Leave the closure variable unbound; the expression eval
              // below will fail loudly with a real "X is not defined".
            }
          }
          try {
            const result = runInNewContext(`(${expr})`, scope, {
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

      it("renders the V7 audit row from V7_PANEL_FACTS", () => {
        expect(src).toMatch(/V7_PANEL_FACTS/);
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Layer 4: V7 raw -> V7 exports + V7 doctrine guard.
//
// Every V7 namespace export must equal its raw_v7 source byte-for-byte. The
// derived V7_PANEL_FACTS strings must equal the formatter-of-exports. The
// V7 forbidden-pattern guard must honor (a) the Khipu exception and (b)
// the git-author override.
// ---------------------------------------------------------------------------

describe("layer 4 — V7 exports equal raw_v7 sources", () => {
  it("V7 manifest header matches raw MANIFEST.json", () => {
    expect(V7.manifest.schema).toBe(v7ManifestRaw.schema);
    expect(V7.manifest.generatedAtUtc).toBe(v7ManifestRaw.generated_at_utc);
    expect(V7.manifest.mission).toBe(v7ManifestRaw.mission);
    expect(V7.manifest.fileCount).toBe(v7ManifestRaw.file_count);
    expect(V7.manifest.totalBytes).toBe(v7ManifestRaw.total_bytes);
    expect(V7.manifest.pendingPmDecisions).toEqual(
      v7ManifestRaw.pending_pm_decisions,
    );
    expect(V7.manifest.executionOrder).toEqual(
      v7ManifestRaw.execution_order_recommendation,
    );
  });

  it("V7_DOCTRINE equals raw MANIFEST.doctrine", () => {
    const d = v7ManifestRaw.doctrine;
    expect(V7_DOCTRINE.version).toBe(d.version);
    expect(V7_DOCTRINE.replayRoot).toBe(d.replay_root);
    expect(V7_DOCTRINE.lambdaThreshold).toBe(d.lambda_threshold);
    expect(V7_DOCTRINE.moralGroundingFloor).toBe(d.critical_axes.moralGrounding);
    expect(V7_DOCTRINE.measurabilityHonestyFloor).toBe(
      d.critical_axes.measurabilityHonesty,
    );
    expect(V7_DOCTRINE.forbiddenPatterns).toEqual(d.forbidden_patterns);
    expect(V7_DOCTRINE.licenseAllowlist).toEqual(d.license_allowlist);
    expect(V7_DOCTRINE.khipuException).toBe(d.khipu_exception);
    expect(V7_DOCTRINE.gitAuthorOverride).toBe(d.git_author_override);
  });

  it("V7 doctrine pins to V6 replay-root (no replay-root drift)", () => {
    expect(V7_DOCTRINE.replayRoot).toBe(DOCTRINE.replayRoot);
    expect(V7_DOCTRINE.version).toBe(DOCTRINE.version);
  });

  it("V7_SPECIALISTS equals raw MANIFEST.specialists", () => {
    const s = v7ManifestRaw.specialists;
    expect(V7_SPECIALISTS.doctrineSweep.filesScanned).toBe(
      s.doctrine_sweep.files_scanned,
    );
    expect(V7_SPECIALISTS.doctrineSweep.autoFixesAppliedLocal).toBe(
      s.doctrine_sweep.auto_fixes_applied_local,
    );
    expect(V7_SPECIALISTS.doctrineSweep.liveRepoEscalations).toBe(
      s.doctrine_sweep.live_repo_escalations,
    );
    expect(V7_SPECIALISTS.hygieneFix.reposTargeted).toEqual(
      s.hygiene_fix.repos_targeted,
    );
    expect(V7_SPECIALISTS.hygieneFix.filesDrafted).toBe(s.hygiene_fix.files_drafted);
    expect(V7_SPECIALISTS.hygieneFix.prsProposed).toBe(s.hygiene_fix.prs_proposed);
    expect(V7_SPECIALISTS.bpFix.reposTargeted).toEqual(s.bp_fix.repos_targeted);
    expect(V7_SPECIALISTS.bpFix.putPayloadsReady).toBe(s.bp_fix.put_payloads_ready);
    expect(V7_SPECIALISTS.citationFix.reposDrafted).toBe(
      s.citation_fix.repos_drafted,
    );
    expect(V7_SPECIALISTS.citationFix.fieldChange).toBe(s.citation_fix.field_change);
    expect(V7_SPECIALISTS.prTriage.totalOpenPrs).toBe(s.pr_triage.total_open_prs);
    expect(V7_SPECIALISTS.prTriage.merge).toBe(s.pr_triage.categories.MERGE);
    expect(V7_SPECIALISTS.prTriage.close).toBe(s.pr_triage.categories.CLOSE);
    expect(V7_SPECIALISTS.prTriage.stale).toBe(s.pr_triage.categories.STALE);
    expect(V7_SPECIALISTS.prTriage.needsReview).toBe(
      s.pr_triage.categories.NEEDS_REVIEW,
    );
  });

  it("V7_ORG_BASELINE equals raw MANIFEST.github_org_baseline", () => {
    const o = v7ManifestRaw.github_org_baseline;
    expect(V7_ORG_BASELINE.reposAudited).toBe(o.repos_audited);
    expect(V7_ORG_BASELINE.ciFailing).toBe(o.ci_failing);
    expect(V7_ORG_BASELINE.codeScanningAlerts).toBe(o.code_scanning_alerts);
    expect(V7_ORG_BASELINE.dependabotHighCritical).toBe(o.dependabot_high_critical);
    expect(V7_ORG_BASELINE.scorecardAvg).toBe(o.scorecard_avg);
    expect(V7_ORG_BASELINE.bpCompliant).toBe(o.bp_compliant);
    expect(V7_ORG_BASELINE.bpWeak).toBe(o.bp_weak);
  });

  it("V7_PRS equals raw all_prs_final.json (length + category tally)", () => {
    expect(V7_PRS.length).toBe(v7PrsRaw.length);
    expect(V7_PRS.length).toBe(V7_SPECIALISTS.prTriage.totalOpenPrs);
    const tally = { MERGE: 0, CLOSE: 0, STALE: 0, "NEEDS-REVIEW": 0 } as Record<
      string,
      number
    >;
    for (const p of V7_PRS) tally[p.category]++;
    expect(tally.MERGE).toBe(V7_SPECIALISTS.prTriage.merge);
    expect(tally.CLOSE).toBe(V7_SPECIALISTS.prTriage.close);
    expect(tally.STALE).toBe(V7_SPECIALISTS.prTriage.stale);
    expect(tally["NEEDS-REVIEW"]).toBe(V7_SPECIALISTS.prTriage.needsReview);
  });

  it("V7_PANEL_FACTS strings derive from V7_SPECIALISTS", () => {
    const s = V7_SPECIALISTS;
    expect(V7_PANEL_FACTS.filesScannedText).toBe(`${s.doctrineSweep.filesScanned} files`);
    expect(V7_PANEL_FACTS.prsTriagedText).toBe(`${s.prTriage.totalOpenPrs} PRs`);
    expect(V7_PANEL_FACTS.mergeProposedText).toBe(`${s.prTriage.merge} merge`);
    expect(V7_PANEL_FACTS.closeProposedText).toBe(`${s.prTriage.close} close`);
    expect(V7_PANEL_FACTS.needsReviewText).toBe(`${s.prTriage.needsReview} review`);
    expect(V7_PANEL_FACTS.bpPayloadsText).toBe(`${s.bpFix.putPayloadsReady} ready`);
    expect(V7_PANEL_FACTS.citationDraftsText).toBe(`${s.citationFix.reposDrafted} drafts`);
    expect(V7_PANEL_FACTS.latestAuditLabel).toBe("Fly-High V7");
    expect(V7_PANEL_FACTS.latestAuditText).toContain("Fly-High V7");
    expect(V7_PANEL_FACTS.latestAuditText).toContain(`${s.doctrineSweep.filesScanned} files`);
    expect(V7_PANEL_FACTS.latestAuditText).toContain(`${s.prTriage.totalOpenPrs} PRs`);
    // V7 review requirement: the "Latest audit" row must surface the
    // close-proposed metric so the 18-PR close batch is visible at a glance.
    expect(V7_PANEL_FACTS.latestAuditText).toContain(`${s.prTriage.close} close`);
    expect(V7_PANEL_FACTS.latestAuditText).toContain(`${s.bpFix.putPayloadsReady} BP`);
    expect(V7_PANEL_FACTS.latestAuditText).toContain(`${s.citationFix.reposDrafted} CFF`);
  });
});

import { createHash } from "node:crypto";
import { statSync } from "node:fs";

function rawV7Path(p: string): string {
  return join(RAW_V7, ...p.split("/"));
}

describe("layer 4 — V7 per-repo materializations", () => {
  it("V7_BP_PAYLOADS covers exactly the BP-fix-targeted repos", () => {
    const got = V7_BP_PAYLOADS.map((e) => e.repo).slice().sort();
    const want = [...V7_SPECIALISTS.bpFix.reposTargeted].sort();
    expect(got).toEqual(want);
    expect(V7_BP_PAYLOADS.length).toBe(V7_SPECIALISTS.bpFix.putPayloadsReady);
  });

  it("each V7 BP payload equals its raw JSON byte-for-byte (via SHA-256)", () => {
    for (const entry of V7_BP_PAYLOADS) {
      const raw = readFileSync(rawV7Path(entry.path));
      const sha = createHash("sha256").update(raw).digest("hex");
      expect(sha).toBe(entry.sha256);
      expect(statSync(rawV7Path(entry.path)).size).toBe(entry.sizeBytes);
      // Round-tripping the parsed payload must equal the raw file content
      // (modulo whitespace — we normalize by re-parsing the raw file).
      const parsed = JSON.parse(raw.toString("utf8"));
      expect(entry.payload).toEqual(parsed);
      // Every BP payload encodes the V7-required strict posture.
      expect(entry.payload.required_status_checks.strict).toBe(true);
      expect(entry.payload.enforce_admins).toBe(true);
      expect(entry.payload.allow_force_pushes).toBe(false);
      expect(entry.payload.allow_deletions).toBe(false);
    }
  });

  it("V7_BP_BY_REPO indexes V7_BP_PAYLOADS by repo", () => {
    for (const entry of V7_BP_PAYLOADS) {
      expect(V7_BP_BY_REPO[entry.repo]).toBe(entry);
    }
  });

  it("V7_CITATION_DRAFTS covers exactly the citation-fix-drafted repos", () => {
    expect(V7_CITATION_DRAFTS.length).toBe(V7_SPECIALISTS.citationFix.reposDrafted);
    for (const draft of V7_CITATION_DRAFTS) {
      expect(draft.cff.path).toBe(
        `02_specialists/citation_fix/${draft.repo}_CITATION.cff`,
      );
      expect(draft.prBody.path).toBe(
        `02_specialists/citation_fix/${draft.repo}_PR_BODY.md`,
      );
    }
  });

  it("each V7 citation draft file matches manifest sha + size on disk", () => {
    for (const draft of V7_CITATION_DRAFTS) {
      for (const file of [draft.cff, draft.prBody]) {
        const raw = readFileSync(rawV7Path(file.path));
        const sha = createHash("sha256").update(raw).digest("hex");
        expect(sha).toBe(file.sha256);
        expect(statSync(rawV7Path(file.path)).size).toBe(file.sizeBytes);
      }
    }
  });

  it("V7_HYGIENE_DRAFTS covers exactly the hygiene-fix-targeted repos", () => {
    const got = V7_HYGIENE_DRAFTS.map((d) => d.repo).slice().sort();
    const want = [...V7_SPECIALISTS.hygieneFix.reposTargeted].sort();
    expect(got).toEqual(want);
  });

  it("each V7 hygiene draft file matches manifest sha + size on disk", () => {
    for (const draft of V7_HYGIENE_DRAFTS) {
      for (const file of [
        draft.security,
        draft.contributing,
        draft.codeOfConduct,
        draft.prBody,
      ]) {
        const raw = readFileSync(rawV7Path(file.path));
        const sha = createHash("sha256").update(raw).digest("hex");
        expect(sha).toBe(file.sha256);
        expect(statSync(rawV7Path(file.path)).size).toBe(file.sizeBytes);
      }
    }
  });

  it("the per-repo file counts match the specialist summary", () => {
    // Hygiene specialist counts the 3 actual hygiene-policy files per repo
    // (SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md); PR_BODY.md is
    // metadata for the eventual PR and is not counted as a drafted file.
    const hygieneTotal = V7_HYGIENE_DRAFTS.length * 3;
    expect(hygieneTotal).toBe(V7_SPECIALISTS.hygieneFix.filesDrafted);
    // The aggregate of per-repo BP + citation + hygiene materializations
    // matches the count surfaced in the panel.
    expect(V7_BP_PAYLOADS.length).toBe(V7_SPECIALISTS.bpFix.putPayloadsReady);
    expect(V7_CITATION_DRAFTS.length).toBe(V7_SPECIALISTS.citationFix.reposDrafted);
  });
});

describe("layer 4 — V7 forbidden-pattern guard (Khipu + git-author refinements)", () => {
  it("extracts the Khipu exception phrase from the doctrine clause", () => {
    expect(V7_KHIPU_EXCEPTION_PHRASE).toBe("Claude Khipu Preview");
  });

  it("ALLOWS 'Claude Khipu Preview' as a third-party model citation", () => {
    const text =
      "Anthropic's Claude Khipu Preview was used as a third-party model.";
    expect(v7IsForbidden(text, "doc")).toBe(false);
    expect(v7ForbiddenHits(text, "doc")).toHaveLength(0);
  });

  it("ALLOWS the phrase multiple times in one document", () => {
    const text =
      "Compared Claude Khipu Preview vs Claude Khipu Preview snapshot.";
    expect(v7IsForbidden(text, "doc")).toBe(false);
  });

  it("BLOCKS bare 'Khipu' usage outside the exception phrase", () => {
    const text = "The Khipu service handles routing.";
    expect(v7IsForbidden(text, "doc")).toBe(true);
    const hits = v7ForbiddenHits(text, "doc");
    expect(hits.some((h) => h.pattern === "Khipu")).toBe(true);
  });

  it("BLOCKS 'Khipu' even when 'Claude' appears nearby without the exact phrase", () => {
    const text = "Claude reviewed the Khipu design.";
    expect(v7IsForbidden(text, "doc")).toBe(true);
  });

  it("ALLOWS exception phrase AND BLOCKS unrelated 'Khipu' in the same text", () => {
    const text =
      "We benchmarked Claude Khipu Preview; our internal Khipu product is unrelated.";
    const hits = v7ForbiddenHits(text, "doc");
    expect(hits.some((h) => h.pattern === "Khipu")).toBe(true);
    expect(hits.length).toBe(1);
  });

  it("git-author/committer/commit_metadata contexts exempt all forbidden patterns", () => {
    const text = "Stephen Paul Lutar Jr.";
    expect(v7IsForbidden(text, "doc")).toBe(true);
    expect(v7IsForbidden(text, "git_author")).toBe(false);
    expect(v7IsForbidden(text, "git_committer")).toBe(false);
    expect(v7IsForbidden(text, "commit_metadata")).toBe(false);
  });

  it("still blocks 'Jr.' in doc/code/ui contexts", () => {
    for (const ctx of ["doc", "code", "ui"] as const) {
      expect(v7IsForbidden("Author: Stephen P. Lutar Jr.", ctx)).toBe(true);
    }
  });

  it("clean text passes all contexts", () => {
    const text = "Author: Stephen P. Lutar — SZL Holdings.";
    for (const ctx of [
      "doc",
      "code",
      "ui",
      "git_author",
      "git_committer",
      "commit_metadata",
    ] as const) {
      expect(v7IsForbidden(text, ctx)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Layer 3 (V7 audit docs) — V7_PANEL_FACTS doc-link constants pin to real
// files on disk. If somebody renames or moves docs/audit/v7-pr-triage.md or
// docs/audit/v7-pm-decisions.md without updating the constants, every
// "↗ PR triage" / "↗ PM decisions" link in the 7 GovernancePanels (and the
// Amaru ribbon V7 chip) would silently 404. Catch it here.
// ---------------------------------------------------------------------------

describe("layer 3 — V7 audit doc links pin to real files on disk", () => {
  it("V7_PANEL_FACTS.prTriageDocPath resolves to an existing file", () => {
    const abs = join(ROOT, V7_PANEL_FACTS.prTriageDocPath);
    expect(
      existsSync(abs),
      `V7_PANEL_FACTS.prTriageDocPath "${V7_PANEL_FACTS.prTriageDocPath}" does not exist on disk at ${abs}`,
    ).toBe(true);
  });

  it("V7_PANEL_FACTS.pmDecisionsDocPath resolves to an existing file", () => {
    const abs = join(ROOT, V7_PANEL_FACTS.pmDecisionsDocPath);
    expect(
      existsSync(abs),
      `V7_PANEL_FACTS.pmDecisionsDocPath "${V7_PANEL_FACTS.pmDecisionsDocPath}" does not exist on disk at ${abs}`,
    ).toBe(true);
  });

  it("prTriageDocHref === '/' + prTriageDocPath (constants cannot drift)", () => {
    expect(V7_PANEL_FACTS.prTriageDocHref).toBe(
      "/" + V7_PANEL_FACTS.prTriageDocPath,
    );
  });

  it("pmDecisionsDocHref === '/' + pmDecisionsDocPath (constants cannot drift)", () => {
    expect(V7_PANEL_FACTS.pmDecisionsDocHref).toBe(
      "/" + V7_PANEL_FACTS.pmDecisionsDocPath,
    );
  });
});
