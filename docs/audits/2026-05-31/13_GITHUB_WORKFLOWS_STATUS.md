# 13_GITHUB_WORKFLOWS_STATUS.md
## GitHub Actions Workflow Status — Full Re-Audit 2026-05-31
**Source:** GitHub API `/repos/szl-holdings/{repo}/actions/runs` + local .yml files  
**Date:** 2026-05-31 (API run date)

Legend: ✅ success | ❌ FAILURE | ⏸ disabled_manually | ℹ️ active (no recent runs)

---

## REPO: a11oy

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | Docs CI | — | — | No recent runs on main (docs-only triggers) |
| codeql.yml | CodeQL | ✅ success | main | 2026-06-01 |
| dco.yml | DCO | ✅ success | main | 2026-06-01 |
| sbom.yml | SBOM (CycloneDX + SPDX + Trivy) | ✅ success | main | 2026-06-01 |
| scorecard.yml | Scorecard supply-chain security | ✅ success | main | 2026-06-01 |
| slsa.yml | SLSA Level 3 Provenance | — | — | (SLSA typically on release) |
| *(not in local)* | Doctrine Build | ✅ success | main | 2026-06-01 |
| *(not in local)* | Container build + GHCR push | ❌ **FAILURE** | main | 2026-06-01 — **BROKEN** |
| *(not in local)* | Doctrine — banned-token grep gate | ❌ **FAILURE** | main | 2026-06-01 — catching Mythos in mythosDoctrine.ts |
| *(not in local)* | Tests | ✅ success | main | 2026-06-01 |
| *(not in local)* | Operational Validation | ✅ success | main | 2026-06-01 |

**⚠️ BROKEN: 2 workflows failing on main (Container build, banned-token gate)**  
Note: a11oy has 9 workflow definitions on GitHub vs only 6 .yml files in local snapshot — 3 extra workflows (Doctrine Build, Container build, Doctrine banned-token gate, Tests, Operational Validation) exist in GitHub but are NOT in the local `/repos/a11oy/.github/workflows/` snapshot. **Local clone is incomplete.**

---

## REPO: amaru

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | Docs CI | ✅ success | main | 2026-06-01 |
| codeql.yml | CodeQL | ✅ success | main | 2026-06-01 |
| dco.yml | DCO | ✅ success | main | 2026-06-01 |
| sbom.yml | SBOM | ✅ success | main | 2026-06-01 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-06-01 |
| slsa.yml | SLSA Level 3 Provenance | — | — | |
| *(not in local)* | Tests | ✅ success | main | 2026-06-01 |

**Status: ✅ ALL PASSING**

---

## REPO: sentra

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | Docs CI | ✅ success | main | 2026-06-01 |
| codeql.yml | CodeQL | ✅ success | main | 2026-06-01 |
| dco.yml | DCO | ✅ success | main | 2026-06-01 |
| sbom.yml | SBOM | ✅ success | main | 2026-06-01 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-06-01 |
| slsa.yml | SLSA Level 3 Provenance | — | — | |
| *(on main, not in snapshot)* | hf-sync.yml | ❌ **FAILURE** | main | 2026-06-01 — triggered on merge but failed |
| *(not in local)* | Container build + GHCR push | ❌ **FAILURE** | main | 2026-06-01 — **BROKEN** |
| *(not in local)* | Tests | ✅ success | main | 2026-06-01 |

**⚠️ BROKEN: 2 workflows failing (hf-sync, Container build)**  
Note: `hf-sync.yml` is present on main but was NOT in local snapshot (snapshot taken before PR #107 merge). Container build failure likely related to workspace:* protocol issue.

---

## REPO: vessels

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | Docs CI | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-06-01 |
| dco.yml | DCO | ❌ **FAILURE** | hampichiq/p3-4-simulated-ais-label-mmsi | PR branch — missing DCO sign-off |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |
| *(not in local)* | SBOM | ✅ success | main | 2026-05-31 |
| *(not in local)* | Tests | ❌ **FAILURE** | main | 2026-06-01 — **BROKEN ON MAIN** |
| *(not in local)* | Tests | ❌ **FAILURE** | hampichiq/p3-4-simulated-ais-label-mmsi | PR branch |

**⚠️ BROKEN: Tests failing on main (regression). DCO missing on open PR branch.**  
vessels is missing `slsa.yml` and `sbom.yml` in local snapshot vs other comparable repos — but SBOM shows in API results, so likely present in GitHub.

---

## REPO: rosie

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | CI | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| hf-deploy.yml | HF Deploy — Rosie Tab 7 + Widget v2 + Sentra Embed | ✅ **success** | chore/series-a-citation-security-fix | 2026-06-01 — DEPLOYED ✅ |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | scorecard | ✅ success | main | 2026-05-31 |
| slsa.yml | SLSA Level 3 Provenance | — | — | |
| *(not in local)* | Tests | ✅ success | main | 2026-05-31 |

**Status: ✅ ALL PASSING** (including HF deploy)

---

## REPO: vsp-otel

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | CI | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| fuzz.yml | Fuzz | — | — | (no recent public runs) |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |
| tests.yml | Tests | ✅ success | main | 2026-05-31 |

**Status: ✅ ALL PASSING**

---

## REPO: uds-mesh

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | CI | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| fuzz.yml | Fuzz | — | — | |
| release-please.yml | Release Please | ❌ **FAILURE** | main | 2026-05-31 |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | scorecard | ✅ success | main | 2026-05-31 |
| tests.yml | Tests | — | — | (no recent public runs) |

**⚠️ Release Please failing on main** — likely a permissions or GitHub token scope issue; Release Please needs write access to create PRs.

---

## REPO: agi-forecast

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | CI | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |
| *(not in local)* | Tests | ❌ **FAILURE** | main | 2026-05-31 — **BROKEN** |

**⚠️ Tests failing on main.** Note: the Bekenstein→Shannon fix is on branch `phd-fix/ml/bekenstein-bound-correction`, NOT merged to main. This may be related.

---

## REPO: ouroboros

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| cflite_pr.yml | ClusterFuzzLite PR fuzzing | — | — | PR-only trigger |
| ci.yml | CI | ✅ success | main | 2026-05-31 (via "Push on main") |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| doi-title-gate.yml | huklla-t11-doi-title-gate | ❌ **FAILURE** | main | 2026-05-31 — DOI title mismatch |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |
| slsa.yml | SLSA Level 3 Provenance | — | — | |
| *(in git-repo)* | codeql.yml | ✅ success | main | |
| *(in git-repo)* | fuzz.yml | Fuzz | — | |
| *(in git-repo)* | release-please.yml | Release Please | ❌ **FAILURE** | 2026-05-31 |
| *(in git-repo)* | tests.yml | Tests | ✅ success | 2026-05-31 |

**⚠️ BROKEN: huklla-t11-doi-title-gate failing on main** (DOI/title consistency check failing).  
**⚠️ Release Please failing** (same pattern as uds-mesh — permissions).  
Note: ouroboros snapshot clone has 7 workflows vs ouroboros-git has 10 — 3 extra (codeql, fuzz, release-please, tests) are in the git-proxy clone but may not be in the exact same main commit.

---

## REPO: .github (dotgithub)

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | ci | ✅ success | main | 2026-06-01 |
| codeql.yml | CodeQL | ✅ success | main | 2026-06-01 |
| dco.yml | DCO | ✅ success | main | 2026-06-01 |
| hf-daily-activity.yml | HF Daily Activity | — | — | Scheduled daily trigger |
| pin-check.yml | Pin Check | — | — | Scheduled trigger |
| reusable-*.yml (16 files) | Reusable — various | — | — | Called by other repos |
| sbom.yml | SBOM | ✅ success | main | 2026-06-01 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-06-01 |
| slsa.yml | SLSA Level 3 Provenance | ✅ success | main | 2026-06-01 |
| tests.yml | Tests | ✅ success | main | 2026-06-01 |

**Status: ✅ ALL PASSING** (Code Quality: Push on main ✅)

---

## REPO: szl-trust

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | ci | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL (actions) | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | — | — | |
| doi-title-gate.yml | huklla-t11-doi-title-gate | ❌ **FAILURE** | main | 2026-05-31 — DOI title mismatch |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |

**⚠️ BROKEN: huklla-t11-doi-title-gate failing on main** — same DOI gate issue as ouroboros.

---

## REPO: szl-cookbook

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| anatomy-evolved-ci.yml | anatomy-evolved-ci | ✅ success | main | 2026-05-31 |
| ci.yml | ci | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |
| *(not in local)* | Tests | ✅ success | main | 2026-05-31 |

**Status: ✅ ALL PASSING**

---

## REPO: counsel

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | Docs CI | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |

**Status: ✅ ALL PASSING**

---

## REPO: terra

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | Docs CI | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |

**Status: ✅ ALL PASSING** (missing sbom.yml and slsa.yml vs comparable repos)

---

## REPO: carlota-jo

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | Docs CI | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |

**Status: ✅ ALL PASSING** (missing sbom.yml and slsa.yml vs comparable repos)

---

## REPO: lutar-lean

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| codeql.yml | CodeQL (actions) | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| doi-title-gate.yml | huklla-t11-doi-title-gate | ✅ success | main | 2026-05-31 |
| lean.yml | Lean kernel check | ✅ success | main | 2026-05-31 |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |
| slsa.yml | SLSA Level 3 Provenance | — | — | |
| *(not in local)* | Lake build (gate + numbers) | ❌ **FAILURE** | main | 2026-05-31 (SHA 679d3d80) |
| *(not in local)* | Tests | ✅ success | main | 2026-05-31 |
| *(not in local)* | CI | ✅ success | main | 2026-05-31 |

**⚠️ BROKEN: Lake build (gate + numbers) failing on main** — Lake build is separate from `lean.yml` kernel check. The Lake build compiles the full project including gates and numeric benchmarks; this may be failing due to missing Mathlib deps or a Sorry that's not in the kernel check subset.

---

## REPO: ouroboros-thesis

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | Docs CI | ✅ success | main | 2026-05-31 |
| docs-only-paths-guard.yml | Docs-only paths guard | — | — | |
| doi-backfill.yml | DOI/Zenodo backfill | — | — | Manual trigger only |
| doi-title-gate.yml | huklla-t11-doi-title-gate | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |
| *(in git-repo)* | codeql.yml | ❌ **FAILURE** | main | 2026-05-31 |
| *(in git-repo)* | dco.yml | DCO | ✅ success | main |
| *(in git-repo)* | fuzz.yml | Fuzz | — | |
| *(in git-repo)* | pages.yml | Pages | ✅ success | 2026-05-31 |
| *(in git-repo)* | sbom.yml | SBOM | ✅ success | 2026-05-31 |
| *(in git-repo)* | tests.yml | Tests | ✅ success | 2026-05-31 |

**⚠️ BROKEN: CodeQL failing on ouroboros-thesis** — `.github/workflows/codeql.yml` failure reported.

---

## REPO: szl-brand

| Workflow File | Name | Latest Status | Branch | Notes |
|---------------|------|---------------|--------|-------|
| ci.yml | ci | ✅ success | main | 2026-05-31 |
| codeql.yml | CodeQL | ✅ success | main | 2026-05-31 |
| dco.yml | DCO | ✅ success | main | 2026-05-31 |
| sbom.yml | SBOM | ✅ success | main | 2026-05-31 |
| scorecard.yml | Scorecard | ✅ success | main | 2026-05-31 |
| *(not in local)* | Tests | ✅ success | main | 2026-05-31 |

**Status: ✅ ALL PASSING**

---

## PLATFORM REPO (Not Locally Cloned)

| Workflow | State | Notes |
|----------|-------|-------|
| Accessibility Checks | ⏸ disabled_manually | |
| Runtime Audit Harness | ⏸ disabled_manually | |
| Build Check | ℹ️ active | |
| CI | ℹ️ active | |
| CodeQL | ℹ️ active | |
| codex-kernel-verify | ℹ️ active | |
| Commitlint | ⏸ disabled_manually | |
| DCO | ℹ️ active | |
| Dependabot auto-merge | ℹ️ active | |
| Dependency Review | ℹ️ active | |
| Deploy — Staging | ⏸ disabled_manually | |
| E2E Tests | ⏸ disabled_manually | |
| Lighthouse CI | ⏸ disabled_manually | |
| npm-publish | ⏸ disabled_manually | |
| Post-Deploy Smoke Tests | ⏸ disabled_manually | |
| README QA | ⏸ disabled_manually | |
| Release | ⏸ disabled_manually | |
| SBOM | ℹ️ active | |
| scorecard | ℹ️ active | |
| Secret Scan (Scheduled) | ℹ️ active | |
| Security Audit & SBOM | ℹ️ active | |
| Publish SZL Zarf packages | ℹ️ active | |
| Tests | ℹ️ active | |
| Fix Lockfile (Vite catalog) | ℹ️ active | |
| uptime-monitor | ⏸ disabled_manually | |

**NOTE:** 10 of 25 platform workflows are disabled. Cannot get run status without cloning or querying run history (API calls used up budget). Staging deploy, E2E, Lighthouse, Release, and npm-publish are all disabled — consistent with Series A pre-launch state.

---

## SZLHOLDINGS szl-uds-deployment (Not Locally Cloned)

| Workflow | State | Notes |
|----------|-------|-------|
| CodeQL | ℹ️ active | |
| SBOM | ℹ️ active | |
| Test | ℹ️ active | |
| UDS Package Release | ℹ️ active | |
| verify-signed-assets.yml | ℹ️ active | |

---

## ❌ BROKEN WORKFLOWS SUMMARY

| Repo | Workflow | Impact Level |
|------|----------|--------------|
| a11oy | Container build + GHCR push | 🔴 HIGH — GHCR image stale; HF Space deployment blocked via CI |
| a11oy | Doctrine — banned-token grep gate | 🟡 MEDIUM — CI gate false-positive on doctrine-scanner-exempt code |
| sentra | Container build + GHCR push | 🔴 HIGH — GHCR image stale |
| sentra | hf-sync.yml | 🔴 HIGH — HF Space auto-sync failing |
| vessels | Tests (main) | 🔴 HIGH — regression on default branch |
| vessels | DCO (PR branch) | 🟡 MEDIUM — PR cannot merge until signed |
| ouroboros | huklla-t11-doi-title-gate | 🟡 MEDIUM — DOI title consistency check failing |
| ouroboros | Release Please | 🟡 MEDIUM — automated release workflow failing |
| uds-mesh | Release Please | 🟡 MEDIUM — automated release workflow failing |
| agi-forecast | Tests | 🔴 HIGH — tests failing on main; fix branch not merged |
| szl-trust | huklla-t11-doi-title-gate | 🟡 MEDIUM — DOI title consistency check failing |
| lutar-lean | Lake build (gate + numbers) | 🟡 MEDIUM — Lake build failing (kernel check passes separately) |
| ouroboros-thesis | CodeQL | 🟢 LOW — code scanning failure; no executable code risk |

**Total broken:** 13 workflow instances across 8 repos  
**Critical (affecting deployment or main branch integrity):** 5 (a11oy container, sentra container+hf-sync, vessels tests, agi-forecast tests)
