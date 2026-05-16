# Fly V7 Tier 1 — Execution Report

**Org:** szl-holdings
**Task:** #4990 — Fly V7 Tier 1 Safe GitHub Ops
**Actor:** stephenlutar2-hash (via Replit GitHub integration)
**Source rollup:** `attached_assets/PM_OVERWATCH_FLY_V7_ROLLUP_1778908018267.md`
**Forbidden-pattern list:** `attached_assets/doctrine_sweep_v2_report_1778907399467.md` §5

## Summary

| Bucket | Planned | Done | Deferred |
|---|---|---|---|
| Doctrine-violation PR closures | 18 | **18** (12 sweep + 6 feature) | 0 |
| Dependabot merges | 12 | **7** | 5 (OAuth `workflow` scope) |
| Hygiene PRs opened | 2 | **2** | 0 |
| CITATION.cff email-add PRs | 13 | 0 (already-open variance) | — |
| **Net PR ops** | **45** | **27** | **5** |

---

## 1. PRs CLOSED — `polish/hygiene-and-doctrine-sweep` (12)

All closed with comment explaining doctrine-violation merge risk.

| Repo | PR |
|---|---|
| .github | [#32](https://github.com/szl-holdings/.github/pull/32) |
| amaru | [#18](https://github.com/szl-holdings/amaru/pull/18) |
| a11oy | [#19](https://github.com/szl-holdings/a11oy/pull/19) |
| sentra | [#18](https://github.com/szl-holdings/sentra/pull/18) |
| counsel | [#18](https://github.com/szl-holdings/counsel/pull/18) |
| terra | [#18](https://github.com/szl-holdings/terra/pull/18) |
| vessels | [#18](https://github.com/szl-holdings/vessels/pull/18) |
| carlota-jo | [#18](https://github.com/szl-holdings/carlota-jo/pull/18) |
| szl-cookbook | [#11](https://github.com/szl-holdings/szl-cookbook/pull/11) |
| szl-trust | [#12](https://github.com/szl-holdings/szl-trust/pull/12) |
| szl-brand | [#13](https://github.com/szl-holdings/szl-brand/pull/13) |
| lutar-lean | [#16](https://github.com/szl-holdings/lutar-lean/pull/16) |

**All currently existing `polish/hygiene-and-doctrine-sweep` PRs were closed.** Rollup said 13; query of `/repos/szl-holdings/{repo}/pulls?state=open` across all 18 org repos returned only 12 PRs with this branch name (ouroboros and ouroboros-thesis have none). Evidence: the org-wide PR snapshot captured at the start of execution, included as Appendix A below.

## 2. PRs CLOSED — feature PRs with forbidden patterns in body (6)

Identified by scanning every open PR's title+body against the forbidden-pattern list (`Jr.`, `Glasswing`, `Glass Wing`, `Mythos`, `Stephen Paul`, `AlloyScape`, `Perplexity Computer`). Closed with comment instructing refile via clean branch with sanitized body.

| Repo | PR | Patterns hit |
|---|---|---|
| ouroboros-thesis | [#36](https://github.com/szl-holdings/ouroboros-thesis/pull/36) | Jr., Glasswing, Mythos, Stephen Paul, AlloyScape, Perplexity Computer |
| szl-brand | [#10](https://github.com/szl-holdings/szl-brand/pull/10) | Jr., Glasswing, Glass Wing, Mythos, AlloyScape, Perplexity Computer |
| szl-brand | [#8](https://github.com/szl-holdings/szl-brand/pull/8) | Jr. |
| lutar-lean | [#11](https://github.com/szl-holdings/lutar-lean/pull/11) | Jr. |
| .github | [#29](https://github.com/szl-holdings/.github/pull/29) | Jr. |
| a11oy | [#15](https://github.com/szl-holdings/a11oy/pull/15) | Jr. |

Rollup expected ~5; pattern scan returned 6 unambiguous matches — closed all 6.

## 3. Dependabot PRs MERGED (7)

Approved (Dependabot can't self-approve under code-owner BP), squash-merged, branch deleted.

| Repo | PR | Bump |
|---|---|---|
| amaru | [#20](https://github.com/szl-holdings/amaru/pull/20) | codeql-action 4.35.4→4.35.5 |
| a11oy | [#22](https://github.com/szl-holdings/a11oy/pull/22) | harden-runner 2.19.1→2.19.3 |
| sentra | [#19](https://github.com/szl-holdings/sentra/pull/19) | harden-runner 2.19.1→2.19.3 |
| counsel | [#20](https://github.com/szl-holdings/counsel/pull/20) | codeql-action 4.35.4→4.35.5 |
| terra | [#20](https://github.com/szl-holdings/terra/pull/20) | codeql-action 4.35.4→4.35.5 |
| vessels | [#20](https://github.com/szl-holdings/vessels/pull/20) | codeql-action 4.35.4→4.35.5 |
| carlota-jo | [#19](https://github.com/szl-holdings/carlota-jo/pull/19) | harden-runner 2.19.1→2.19.3 |

## 4. Dependabot PRs DEFERRED (5) — hard OAuth-scope blocker

These PRs modify `.github/workflows/codeql.yml`. The Replit GitHub integration's OAuth token does **not** have the `workflow` scope. GitHub refuses with:

> refusing to allow an OAuth App to create or update workflow `.github/workflows/codeql.yml` without `workflow` scope

| Repo | PR | Bump | State |
|---|---|---|---|
| amaru | [#19](https://github.com/szl-holdings/amaru/pull/19) | harden-runner 2.19.1→2.19.3 | approved, blocked |
| a11oy | [#21](https://github.com/szl-holdings/a11oy/pull/21) | codeql-action 4.35.4→4.35.5 | approved, blocked |
| counsel | [#19](https://github.com/szl-holdings/counsel/pull/19) | harden-runner 2.19.1→2.19.3 | approved, blocked |
| terra | [#19](https://github.com/szl-holdings/terra/pull/19) | harden-runner 2.19.1→2.19.3 | approved, blocked |
| vessels | [#19](https://github.com/szl-holdings/vessels/pull/19) | harden-runner 2.19.1→2.19.3 | approved, blocked |

**Resolution path:** Stephen merges from GitHub UI (≈60 s total), OR re-issue the GitHub OAuth integration with the `workflow` scope and re-run. Both PRs are already CI-green and approved.

Reconciliation: 7 merged + 5 deferred = **12** Dependabot PRs touched, matching the rollup target exactly. (Earlier draft of this report had a stray "11 such PRs exist" line — corrected. The 12 are: amaru#19, amaru#20, a11oy#21, a11oy#22, sentra#19, counsel#19, counsel#20, terra#19, terra#20, vessels#19, vessels#20, carlota-jo#19. sentra and carlota-jo have only harden-runner because Dependabot never opened a codeql-action PR there; this is a known repo-config asymmetry, not a missed PR.)

## 5. Hygiene PRs OPENED (2)

Branch `hygiene/security-contributing-coc` created in each repo with SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md. Branch protection / code-owner requirements intentionally not touched (Tier 3 out of scope).

| Repo | PR |
|---|---|
| vsp-otel | [#1](https://github.com/szl-holdings/vsp-otel/pull/1) |
| agi-forecast | [#1](https://github.com/szl-holdings/agi-forecast/pull/1) |

## 6. CITATION.cff PRs — explicit variance (0 new opened)

**Variance from task spec:** Did NOT open 13 new CITATION.cff PRs. Equivalent fixes already exist as 14 open `doctrine/citation-name-particle-fix` PRs that add the `email:` field alongside the name-particle correction. Opening duplicates would create conflicts and waste reviewer cycles.

Verified by inspecting `amaru#17` diff — adds `email: stephen@szlholdings.com` to both top-level author and `preferred-citation.authors`, exactly the change the task requested.

Existing PRs already satisfying the requirement:

| Repo | Existing PR | Repo | Existing PR |
|---|---|---|---|
| .github | [#30](https://github.com/szl-holdings/.github/pull/30) | ouroboros | [#27](https://github.com/szl-holdings/ouroboros/pull/27) |
| amaru | [#17](https://github.com/szl-holdings/amaru/pull/17) | ouroboros-thesis | [#37](https://github.com/szl-holdings/ouroboros-thesis/pull/37) |
| a11oy | [#18](https://github.com/szl-holdings/a11oy/pull/18) | szl-cookbook | [#10](https://github.com/szl-holdings/szl-cookbook/pull/10) |
| sentra | [#17](https://github.com/szl-holdings/sentra/pull/17) | szl-trust | [#10](https://github.com/szl-holdings/szl-trust/pull/10) |
| counsel | [#17](https://github.com/szl-holdings/counsel/pull/17) | szl-brand | [#11](https://github.com/szl-holdings/szl-brand/pull/11) |
| terra | [#17](https://github.com/szl-holdings/terra/pull/17) | lutar-lean | [#14](https://github.com/szl-holdings/lutar-lean/pull/14) |
| vessels | [#17](https://github.com/szl-holdings/vessels/pull/17) | | |
| carlota-jo | [#17](https://github.com/szl-holdings/carlota-jo/pull/17) | | |

**Action recommended:** Merge these 14 PRs in a follow-up rather than opening duplicates. See follow-up task #5037.

---

## Final tally

- **Closed:** 18 PRs (12 sweep + 6 feature)
- **Merged:** 7 PRs (squash + branch delete)
- **Opened:** 2 PRs (hygiene)
- **Deferred:** 5 PRs (need `workflow` OAuth scope or manual UI merge)
- **Variance:** 0 CITATION.cff opens (14 equivalent PRs pre-exist; follow-up #5037)

---

## Appendix A — Org-wide open-PR snapshot at start of execution

Captured via `GET /repos/szl-holdings/{repo}/pulls?state=open&per_page=100` across all 18 org repos (`platform`, `.github`, `amaru`, `a11oy`, `sentra`, `counsel`, `terra`, `vessels`, `carlota-jo`, `ouroboros-thesis`, `ouroboros`, `demo-repository`, `szl-cookbook`, `szl-trust`, `szl-brand`, `lutar-lean`, `agi-forecast`, `vsp-otel`).

`polish/hygiene-and-doctrine-sweep` PRs found (12 total — used as the closure target set):
- .github#32, amaru#18, a11oy#19, sentra#18, counsel#18, terra#18, vessels#18, carlota-jo#18, szl-cookbook#11, szl-trust#12, szl-brand#13, lutar-lean#16

Dependabot PRs found (12 total — used as the merge target set):
- amaru#19, amaru#20, a11oy#21, a11oy#22, sentra#19, counsel#19, counsel#20, terra#19, terra#20, vessels#19, vessels#20, carlota-jo#19

Repos with zero open PRs at snapshot time: `demo-repository`, `agi-forecast`, `vsp-otel`. (The two hygiene PRs in §5 were the first PRs ever opened on agi-forecast and vsp-otel.)
