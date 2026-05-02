# GitHub Audit Report — szl-holdings + stephenlutar2-hash

**Date:** 2026-05-01
**Auditor:** automated sweep on behalf of Stephen Lutar
**Scope:** Full sweep of org `szl-holdings` (11 public repos) + personal `stephenlutar2-hash` (5 repos, 2 active public, 2 archived private, 1 private profile)
**Decision recorded:** "full sweep so aggressive" — loose branch protection + maximum security enablement

---

## 1. Executive summary

Eleven public org repos and the personal profile were audited against six gates: license, README, security configuration, branch protection, PR hygiene, and release/DOI mint chain. Pre-audit, only the platform monorepo had security enabled; nothing had branch protection. Four clean dependabot PRs were merged, all 10 active repos now have full secret scanning, push protection, dependabot alerts, dependabot security updates, and loose branch protection (no force-push, no deletion). The org defaults are now set to apply these to any new repo automatically. The `inquiries@szlholdings.com` legacy address was replaced with `stephen@szlholdings.com` across 30 live files (1 in `.github`, 29 via PR #66 in the platform repo) and 22 workspace files. The thesis proof bundle is captured at `evolution/proof/THESIS_PROOF_BUNDLE.{md,json}`.

---

## 2. Before / after matrix — security & governance

| Gate | Repo | Before | After |
| --- | --- | --- | --- |
| Secret scanning | ouroboros | disabled | **enabled** |
| Secret scanning | ouroboros-thesis | disabled | **enabled** |
| Secret scanning | szl-holdings-platform | enabled | enabled |
| Secret scanning | a11oy | disabled | **enabled** |
| Secret scanning | sentra | disabled | **enabled** |
| Secret scanning | amaru | disabled | **enabled** |
| Secret scanning | counsel | disabled | **enabled** |
| Secret scanning | terra | disabled | **enabled** |
| Secret scanning | vessels | disabled | **enabled** |
| Secret scanning | carlota-jo | disabled | **enabled** |
| Push protection | all 10 repos | disabled (1 enabled) | **enabled (10/10)** |
| Dependabot alerts | all 10 repos | disabled (1 enabled) | **enabled (10/10)** |
| Dependabot security updates | all 10 repos | disabled (1 enabled) | **enabled (10/10)** |
| Branch protection (no force-push, no delete) | all 10 repos | none | **enabled (10/10)** |
| Org default for new repos: secret scanning | szl-holdings | off | **on** |
| Org default for new repos: push protection | szl-holdings | off | **on** |
| Org default for new repos: dependabot alerts | szl-holdings | off | **on** |
| Org default for new repos: dependabot security | szl-holdings | off | **on** |
| Personal account 2FA | stephenlutar2-hash | enabled | enabled |
| Org-level required 2FA | szl-holdings | off | off (UI-only flip — see §6) |

---

## 3. PR hygiene

| Repo | PR # | Author | Status before | Status after |
| --- | --- | --- | --- | --- |
| ouroboros | #1 | dependabot[bot] | open, mergeable | **merged (squash)** |
| ouroboros-thesis | #2 | dependabot[bot] | open, mergeable | **merged (squash)** |
| ouroboros-thesis | #3 | dependabot[bot] | open, mergeable | **merged (squash)** |
| ouroboros-thesis | #4 | dependabot[bot] | open, mergeable | **merged (squash)** |
| szl-holdings-platform | #38 | stephenlutar2-hash | DRAFT, conflicting (+2599/-833) | left open — needs human resolution |
| szl-holdings-platform | #60 | dependabot[bot] | conflicting | left open — needs human resolution |
| szl-holdings-platform | **#66** | this audit | — | **merged (squash)** — contact email sweep |

Net: 5 of 7 open PRs cleared. 2 remaining are conflicted and require Replit-side rebase.

---

## 4. README + profile

| Surface | Action |
| --- | --- |
| Personal profile README (`stephenlutar2-hash/stephenlutar2-hash`) | Test count badge updated `133/133` → `1,372/1,372` (subsequently corrected to **`150/150`** on 2026-05-02 — the 1,372 figure was an aggregate that did not reflect the actual single-package test count); **DOI v1 + DOI v2 badges added** below ORCID |
| Org `.github` README | Contact email updated to `stephen@szlholdings.com` |
| `ouroboros-thesis` repo description | Updated to include both DOIs: `v1 10.5281/zenodo.19867281 (position paper, Apr 28 2026)` + `v2 10.5281/zenodo.19934129 (empirical companion, Apr 30 2026)` |
| Pinned repos on personal profile | Not changed — GitHub's pinned-items GraphQL mutation (`replacePinnedItems`) is not exposed through the audit token. The personal profile README already serves as the canonical featured-repo surface. |

---

## 5. Releases + Zenodo DOI mint chain

| Repo | Latest tag | Commit SHA | Date | DOI |
| --- | --- | --- | --- | --- |
| ouroboros | `v6.1.0` | `e9fc4b86eae18bb7401b14cb0e53900ba8e47ad8` | 2026-04-30 | (runtime — paper anchor in thesis repo) |
| ouroboros | `v6.0.0` | (parent) | 2026-04-30 | — |
| ouroboros-thesis | `paper-v2-empirical-1.0.0` | `598c7aff03564f3f238d5db1a0029bb3f330a491` | 2026-05-01 | **`10.5281/zenodo.19934129`** |
| ouroboros-thesis | `v3.0.0` | (mirrors v6.1.0) | 2026-04-30 | — |
| ouroboros-thesis | `v2.0.0` | (mirrors v6.0.0) | 2026-04-30 | **`10.5281/zenodo.19867281`** (v1 paper anchor) |
| szl-holdings-platform | `codex-kernel v1.0.2` | — | 2026-04-30 | — |
| 7 satellite repos | `v1.0.0-alpha` | — | various | — |

DOI mint chain verified: both DOIs resolve, both tags match expected commit SHAs.

---

## 6. Email contact normalization

| Surface | Files touched |
| --- | --- |
| Local workspace | 22 files, 29 occurrences |
| GitHub `szl-holdings/.github` | 1 file (org profile README) — direct push |
| GitHub `szl-holdings/szl-holdings-platform` | 29 files — bundled into PR #66, squash-merged |

All `inquiries@szlholdings.com` references replaced with `stephen@szlholdings.com`. Cached search index will catch up within hours.

---

## 7. Open items — operator action required

1. **Org-level 2FA enforcement.** The API call to flip `two_factor_requirement_enabled=true` returned the org object unchanged. This typically requires the owner to flip it from the [organization security settings UI](https://github.com/organizations/szl-holdings/settings/security). One click. Stephen is solo + already has 2FA on personally, so the practical risk is low.
2. **PR #38 (Governed Python efficiency migration, 2599/833).** Codex draft PR is conflicting against master. Needs a rebase from the Replit side or a fresh PR.
3. **Dependabot PR #60 (`ui-components` group).** Conflicting against the codex-kernel changes. Easiest path: close it and let Dependabot reopen on the next dependency cycle.
4. **CI failures on `szl-holdings-platform`.** Multiple workflows red: `e2e`, `deploy-staging`, `a11y`, `runtime audit`, `nightly smoke`. Out of scope for this hygiene sweep — handle in the next operational pass.
5. **Pinned repos on personal profile.** GitHub's GraphQL pinning mutation isn't exposed through the audit token. Stephen can pin manually from his [profile page](https://github.com/stephenlutar2-hash) — recommend pinning: `szl-holdings/ouroboros`, `szl-holdings/ouroboros-thesis`, `szl-holdings/szl-holdings-platform`, `szl-holdings/a11oy`, `szl-holdings/sentra`, `szl-holdings/amaru`.

---

## 8. Net scorecard

| Dimension | Score |
| --- | --- |
| License coverage | 11/11 (100%) |
| README coverage | 11/11 (100%) |
| SECURITY.md coverage | 11/11 (100%) |
| CODEOWNERS coverage | 11/11 (100%) |
| CITATION.cff coverage | 11/11 (100%) |
| Dependabot config | 11/11 (100%) |
| Secret scanning enabled (active repos) | **10/10** (was 1/10) |
| Push protection enabled (active repos) | **10/10** (was 1/10) |
| Dependabot alerts (active repos) | **10/10** (was 1/10) |
| Branch protection (active repos) | **10/10** (was 0/10) |
| Open clean PRs | **0** (4 merged + 1 audit PR merged) |
| Open security alerts | 0 |
| DOI mint chain integrity | verified end-to-end |

Security posture moved from `1/10` to `10/10` across every active repo in a single sweep. Branch protection moved from `0/10` to `10/10`. Org defaults are now set so the next repo Stephen creates inherits the correct posture automatically.

---

## 9. Proof bundle — RETRACTED

A thesis proof bundle was previously checked in at `docs/ouroboros-v6/proof/THESIS_PROOF_BUNDLE.{md,json}` capturing test counts of "925 TypeScript + 447 Python = 1,372" across "24 packages" with "91 primitives." Those figures were not accurate. The actual test surface at the v6.1.0 release is **150 declared Vitest tests in the single `@szl-holdings/ouroboros` package**, verified by running `pnpm exec vitest run` against the release commit. There is no `packages/ouroboros-py` directory at this release and no Python test surface. The proof bundle files were removed on 2026-05-02 in the same self-audit cleanup that retracted Ouroboros Thesis v3 (Zenodo 19951520). The DOIs and annotated-tag commit SHAs in the rest of this document remain accurate.

---

**Audit complete.**
