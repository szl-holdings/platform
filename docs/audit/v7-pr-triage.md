# Fly-High V7 — PR Triage Register

  **Source:** `packages/payload/raw_v7/02_specialists/pr_triage/all_prs_final.json`
  **Surfaced via:** `@szl-holdings/payload` → `V7_PRS`
  **Date:** 2026-05-16
  **Status:** propose-only — no live mutations executed

  This document is the row-level rendering of the V7 specialist triage of every
  open pull request across the `szl-holdings` org as captured in the V7 audit
  pack. It exists so program-management decisions are made against a stable,
  citable register rather than ad-hoc `gh` CLI queries. Every row is derived
  1:1 from `V7_PRS[i]` and the canonical link is
  `https://github.com/szl-holdings/<repo>/pull/<number>`.

  ## Tally

  | Tier             | Count | Disposition |
  | ---------------- | ----: | ----------- |
  | **MERGE**        |    12 | Dependabot security/version bumps; safe, CI-green |
  | **CLOSE**        |    18 | Doctrine violations in PR body (hygiene-sweep, identity-pattern) |
  | **STALE**        |     0 | none |
  | **NEEDS-REVIEW** |    38 | Author must mark ready, fix CI, or accept human review |
  | **TOTAL**        |    68 | |

  > The `CLOSE` tier carries the urgency flagged in the V7 rollup: the
  > `polish(hygiene+doctrine)` PRs each contain all 8 forbidden patterns and
  > are CI-green — meaning they could be merged by accident and would
  > re-introduce the very strings the doctrine forbids. They must be closed
  > before any other action.

  ## Tier-to-PM-rollup mapping

The V7 specialist emits four mechanical tiers (`MERGE` / `CLOSE` /
`NEEDS-REVIEW` / `STALE`). The PM-overwatch rollup speaks a different,
risk-oriented vocabulary. The mapping is deterministic:

| Specialist tier | PM-rollup tier      | Why                                                                                                                  |
| --------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `MERGE`         | **safe**            | Dependabot bumps, CI-green, single-file diffs from vendor actions — routine maintenance, no doctrine risk.            |
| `CLOSE`         | **doctrine-cleanup** | PR body itself contains forbidden patterns; merging would commit them to `main` and violate the doctrine guard.       |
| `NEEDS-REVIEW`  | **PM-decision**     | Cannot be machine-classified — author must mark ready, fix CI, rebase, or a human must make a policy call.            |
| `STALE`         | **PM-decision**     | None in this run; reserved for PRs with no author activity inside the rollup window.                                  |

There is no `one-way` rollup tier in the PR triage register: the only
one-way doors in V7 live in the BP-apply path (branch-protection PUTs,
documented in `v7-apply-runbook.md`), not in the PR-merge path.

## Apply-script mapping

  Each tier maps to exactly one shell script under
  `packages/payload/raw_v7/05_apply_scripts/`. Nothing in this task or in
  `packages/payload/` executes any of these scripts; they are documented here
  so a follow-up task can apply them with explicit per-batch sign-off.

  | Tier         | Apply script                       | Per-row `gh_cmd` source         |
  | ------------ | ---------------------------------- | -------------------------------- |
  | MERGE        | `02_merge_dependabot.sh`           | `V7_PRS[i].ghCmd` (`gh pr merge`) |
  | CLOSE        | `01_close_violation_prs.sh`        | `V7_PRS[i].ghCmd` (`gh pr close`) |
  | NEEDS-REVIEW | _(none — author action required)_  | _(no apply path)_                |

  ---

  ## Tier 1 — CLOSE (18)

  These PRs must be closed. The doctrine violation lives in the PR body
  itself; merging would commit a forbidden pattern into `main`'s git history
  and break the `scripts/check-forbidden-patterns.mjs` strict-zone guard.
  Grouped by `priority` (1 = hygiene-sweep "all 8 patterns", 2 = identity
  hit such as `Jr.`).

  | # | Repo | PR | Title | Author | CI | Priority | Reason |
| - | ---- | -- | ----- | ------ | -- | -------- | ------ |
| 1 | `.github` | [#32](https://github.com/szl-holdings/.github/pull/32) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | none (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 2 | `a11oy` | [#19](https://github.com/szl-holdings/a11oy/pull/19) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 3 | `amaru` | [#18](https://github.com/szl-holdings/amaru/pull/18) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 4 | `carlota-jo` | [#18](https://github.com/szl-holdings/carlota-jo/pull/18) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 5 | `counsel` | [#18](https://github.com/szl-holdings/counsel/pull/18) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 6 | `lutar-lean` | [#16](https://github.com/szl-holdings/lutar-lean/pull/16) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 7 | `sentra` | [#18](https://github.com/szl-holdings/sentra/pull/18) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 8 | `szl-brand` | [#13](https://github.com/szl-holdings/szl-brand/pull/13) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 9 | `szl-cookbook` | [#11](https://github.com/szl-holdings/szl-cookbook/pull/11) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 10 | `szl-trust` | [#12](https://github.com/szl-holdings/szl-trust/pull/12) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 11 | `terra` | [#18](https://github.com/szl-holdings/terra/pull/18) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 12 | `vessels` | [#18](https://github.com/szl-holdings/vessels/pull/18) | polish(hygiene+doctrine): hygiene file backfill + doctrine sweep | `stephenlutar2-hash` | passing (draft) | 1 | Hygiene sweep PR body contains all 8 forbidden patterns — must be scrubbed before merge |
| 13 | `.github` | [#29](https://github.com/szl-holdings/.github/pull/29) | feat(doctrine): DOCTRINE_V2 + T01/T02 STATUS | `stephenlutar2-hash` | none (draft) | 2 | PR body contains forbidden identity pattern 'Jr.' in author block — doctrine violation |
| 14 | `a11oy` | [#15](https://github.com/szl-holdings/a11oy/pull/15) | feat(lambda-ql): T6-Builder — Λ-QL parser + retriever + UI components [doctrine  | `stephenlutar2-hash` | passing (draft) | 2 | PR body contains forbidden identity pattern 'Jr.' in author block — doctrine violation |
| 15 | `lutar-lean` | [#11](https://github.com/szl-holdings/lutar-lean/pull/11) | feat(t7): GraphHop + RAGReceipt — Lean 4 kernel-verified PASS 60/60 5× | `stephenlutar2-hash` | passing (draft) | 2 | PR body contains forbidden identity pattern 'Jr.' in author block — doctrine violation |
| 16 | `ouroboros-thesis` | [#36](https://github.com/szl-holdings/ouroboros-thesis/pull/36) | doctrine(thesis): v13 latest-paper badge + v12/v13 DOI rows + CITATION.cff bump | `stephenlutar2-hash` | passing (draft) | 2 | PR body contains forbidden patterns as grep audit arguments — body itself triggers doctrine flag |
| 17 | `szl-brand` | [#8](https://github.com/szl-holdings/szl-brand/pull/8) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | passing (draft) | 2 | PR body contains forbidden identity pattern 'Jr.' in author block — doctrine violation |
| 18 | `szl-brand` | [#10](https://github.com/szl-holdings/szl-brand/pull/10) | docs(anatomy): doctrine fix — author metadata + PNG previews | `stephenlutar2-hash` | passing | 2 | PR body references forbidden patterns in 'was X' correction context — body still contains violations |


  ## Tier 2 — MERGE (12)

  Dependabot bumps — all CI-green, all single-file `package.json` /
  `workflow.yml` updates, all sourced from upstream actions vendors. Each
  merge still respects per-repo branch-protection rules.

  | # | Repo | PR | Title | Author | CI | Priority | Reason |
| - | ---- | -- | ----- | ------ | -- | -------- | ------ |
| 1 | `a11oy` | [#21](https://github.com/szl-holdings/a11oy/pull/21) | chore(ci)(deps): bump github/codeql-action from 4.35.4 to 4.35.5 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 2 | `a11oy` | [#22](https://github.com/szl-holdings/a11oy/pull/22) | chore(ci)(deps): bump step-security/harden-runner from 2.19.1 to 2.19.3 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 3 | `amaru` | [#19](https://github.com/szl-holdings/amaru/pull/19) | chore(ci)(deps): bump step-security/harden-runner from 2.19.1 to 2.19.3 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 4 | `amaru` | [#20](https://github.com/szl-holdings/amaru/pull/20) | chore(ci)(deps): bump github/codeql-action from 4.35.4 to 4.35.5 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 5 | `carlota-jo` | [#19](https://github.com/szl-holdings/carlota-jo/pull/19) | chore(ci)(deps): bump step-security/harden-runner from 2.19.1 to 2.19.3 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 6 | `counsel` | [#19](https://github.com/szl-holdings/counsel/pull/19) | chore(ci)(deps): bump step-security/harden-runner from 2.19.1 to 2.19.3 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 7 | `counsel` | [#20](https://github.com/szl-holdings/counsel/pull/20) | chore(ci)(deps): bump github/codeql-action from 4.35.4 to 4.35.5 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 8 | `sentra` | [#19](https://github.com/szl-holdings/sentra/pull/19) | chore(ci)(deps): bump step-security/harden-runner from 2.19.1 to 2.19.3 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 9 | `terra` | [#19](https://github.com/szl-holdings/terra/pull/19) | chore(ci)(deps): bump step-security/harden-runner from 2.19.1 to 2.19.3 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 10 | `terra` | [#20](https://github.com/szl-holdings/terra/pull/20) | chore(ci)(deps): bump github/codeql-action from 4.35.4 to 4.35.5 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 11 | `vessels` | [#19](https://github.com/szl-holdings/vessels/pull/19) | chore(ci)(deps): bump github/codeql-action from 4.35.4 to 4.35.5 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |
| 12 | `vessels` | [#20](https://github.com/szl-holdings/vessels/pull/20) | chore(ci)(deps): bump step-security/harden-runner from 2.19.1 to 2.19.3 | `app/dependabot` | passing | 3 | Dependabot dep-bump: CI green, mergeable — routine maintenance merge |


  ## Tier 3 — NEEDS-REVIEW (38)

  These cannot be batched. They typically fall into four sub-buckets: draft
  (author must mark ready), draft with failing CI, conflicting (rebase
  needed), and novel-change / policy decision (cannot be machine-classified).
  They do not block the V7 apply scripts; they block per-repo merge
  throughput and should be drained over the next sprint.

  | # | Repo | PR | Title | Author | CI | Priority | Reason |
| - | ---- | -- | ----- | ------ | -- | -------- | ------ |
| 1 | `ouroboros` | [#24](https://github.com/szl-holdings/ouroboros/pull/24) | docs(readme): sync version badge and status to v6.3.0 | `stephenlutar2-hash` | passing | 3 | Non-draft, CI green, MERGEABLE — non-scorecard change needs human review |
| 2 | `.github` | [#28](https://github.com/szl-holdings/.github/pull/28) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 3 | `a11oy` | [#16](https://github.com/szl-holdings/a11oy/pull/16) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 4 | `amaru` | [#15](https://github.com/szl-holdings/amaru/pull/15) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 5 | `carlota-jo` | [#15](https://github.com/szl-holdings/carlota-jo/pull/15) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 6 | `counsel` | [#15](https://github.com/szl-holdings/counsel/pull/15) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 7 | `lutar-lean` | [#10](https://github.com/szl-holdings/lutar-lean/pull/10) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 8 | `ouroboros` | [#25](https://github.com/szl-holdings/ouroboros/pull/25) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 9 | `ouroboros` | [#28](https://github.com/szl-holdings/ouroboros/pull/28) | feat(huklla T11): DOI-title CI gate (postmortem follow-up) | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 10 | `ouroboros-thesis` | [#35](https://github.com/szl-holdings/ouroboros-thesis/pull/35) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 11 | `ouroboros-thesis` | [#38](https://github.com/szl-holdings/ouroboros-thesis/pull/38) | feat(huklla T11): DOI-title CI gate (postmortem follow-up) | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 12 | `sentra` | [#15](https://github.com/szl-holdings/sentra/pull/15) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 13 | `szl-trust` | [#11](https://github.com/szl-holdings/szl-trust/pull/11) | feat(huklla T11): DOI-title CI gate (postmortem follow-up) | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 14 | `terra` | [#15](https://github.com/szl-holdings/terra/pull/15) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 15 | `vessels` | [#15](https://github.com/szl-holdings/vessels/pull/15) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | failing (draft) | 4 | Draft with failing CI — author needs to fix CI before ready |
| 16 | `.github` | [#30](https://github.com/szl-holdings/.github/pull/30) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | none (draft) | 5 | Draft PR — author must mark ready |
| 17 | `.github` | [#31](https://github.com/szl-holdings/.github/pull/31) | feat(profile): add Anatomy section linking to szl-brand PDFs | `stephenlutar2-hash` | none (draft) | 5 | Draft PR — author must mark ready |
| 18 | `a11oy` | [#18](https://github.com/szl-holdings/a11oy/pull/18) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 19 | `amaru` | [#17](https://github.com/szl-holdings/amaru/pull/17) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 20 | `carlota-jo` | [#17](https://github.com/szl-holdings/carlota-jo/pull/17) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 21 | `counsel` | [#17](https://github.com/szl-holdings/counsel/pull/17) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 22 | `lutar-lean` | [#14](https://github.com/szl-holdings/lutar-lean/pull/14) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 23 | `lutar-lean` | [#15](https://github.com/szl-holdings/lutar-lean/pull/15) | feat(huklla T11): DOI-title CI gate (postmortem follow-up) | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 24 | `ouroboros` | [#26](https://github.com/szl-holdings/ouroboros/pull/26) | doctrine(readme): Apache-2.0 license badge, v6.3.0 release, v12+v13 DOI badges | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 25 | `ouroboros` | [#27](https://github.com/szl-holdings/ouroboros/pull/27) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 26 | `ouroboros` | [#29](https://github.com/szl-holdings/ouroboros/pull/29) | docs(anatomy): publish 4 anatomy PDFs (heart/brain/wires/full_body) | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 27 | `ouroboros-thesis` | [#34](https://github.com/szl-holdings/ouroboros-thesis/pull/34) | papers/v13: Ouroboros Thesis v13 (doctrine v2 PASS, GAP-02 re-loop) | `stephenlutar2-hash` | passing | 5 | Needs human review — novel change or policy decision |
| 28 | `ouroboros-thesis` | [#37](https://github.com/szl-holdings/ouroboros-thesis/pull/37) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 29 | `ouroboros-thesis` | [#39](https://github.com/szl-holdings/ouroboros-thesis/pull/39) | docs(anatomy): publish 4 anatomy PDFs (heart/brain/wires/full_body) | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 30 | `sentra` | [#17](https://github.com/szl-holdings/sentra/pull/17) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 31 | `szl-brand` | [#11](https://github.com/szl-holdings/szl-brand/pull/11) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 32 | `szl-brand` | [#12](https://github.com/szl-holdings/szl-brand/pull/12) | feat(anatomy): publish 4 anatomy PDFs (heart/brain/wires/full_body) + originals | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 33 | `szl-cookbook` | [#8](https://github.com/szl-holdings/szl-cookbook/pull/8) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 34 | `szl-cookbook` | [#10](https://github.com/szl-holdings/szl-cookbook/pull/10) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 35 | `szl-trust` | [#8](https://github.com/szl-holdings/szl-trust/pull/8) | chore(security): 10/10 Scorecard payload | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 36 | `szl-trust` | [#10](https://github.com/szl-holdings/szl-trust/pull/10) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 37 | `terra` | [#17](https://github.com/szl-holdings/terra/pull/17) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |
| 38 | `vessels` | [#17](https://github.com/szl-holdings/vessels/pull/17) | doctrine(citation): merge P. into given-names; add email | `stephenlutar2-hash` | passing (draft) | 5 | Draft PR — author must mark ready |


  ## Tier 4 — STALE (0)

  _(none)_


  ## Provenance

  - Triage JSON: `02_specialists/pr_triage/all_prs_final.json` (anchored by
    `MANIFEST.files[]` SHA-256, verified by `pnpm -F @szl-holdings/payload
    verify:v7`).
  - Triage report: `packages/payload/raw_v7/02_specialists/pr_triage/PR_TRIAGE_REPORT.md`
  - Rollup: `packages/payload/raw_v7/00_README/PM_OVERWATCH_FLY_V7_ROLLUP.md`
  - Typed access: `import { V7_PRS } from '@szl-holdings/payload'`
  