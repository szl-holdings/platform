# SZL Holdings — GitHub Alignment Report (Dev D)

**Owner:** Opus Dev D · **Identity:** stephenlutar2-hash <stephenlutar2@gmail.com>
**Org:** szl-holdings · **Scope:** 16 active repos + all open PRs
**Date of audit:** 2026-06-13 (UTC) · **Access:** `gh` API via github proxy (read/admin)

> Methodology note: the simple `gh run list --limit 1` returns only the *single most recent*
> run across *any* workflow, which can mask a failing guard that ran slightly earlier in the
> same push. This report instead takes the **latest run per workflow** on the default branch
> (push event) so no failing workflow is hidden. Schedule-/dispatch-only failures that have
> since been superseded by a green run are flagged separately from real push-event reds.

---

## 1. Active repos — main CI state

| # | Repo | Default branch | Latest push-event main CI | Notes |
|---|------|----------------|---------------------------|-------|
| 1 | platform | main | 🟢 GREEN | All push workflows green on main. PR reds are pre-merge only (see §2/§3). |
| 2 | a11oy | main | 🔴 RED | **"Shared-source drift guard"** failing on main (push). Root: `szl_evidence_research.py` diverged vs killinchu, not allow-listed. Not branch-protected; not a required check. |
| 3 | lutar-lean | main | 🟢 GREEN | Keystone. All push workflows green. **DO NOT MERGE / DO NOT --admin.** |
| 4 | anatomy | main | 🟢 GREEN | — |
| 5 | killinchu | main | 🔴 RED | **"Shared-source drift guard"** failing on main (push) — same `szl_evidence_research.py` divergence vs a11oy. Required check (`check`) is green. |
| 6 | yarqa | master | 🟢 GREEN | Default branch is `master` (not `main`); latest push runs all success. |
| 7 | szl-uds-deployment | main | 🔴 RED | **"Box Fallback Superset Guard"** failing on main (push, 09:39Z). Guard *self-test* (negative fixtures) regressed: 3 passed / 3 failed. Real on-box fix. Not a required check. |
| 8 | uds-mesh | main | 🟡 STALE-RED | "Release Please" last *push* run = failure (Jun 12 01:40), but latest runs are `workflow_dispatch` = success. Release-please push reds are a known/expected pattern; superseded. Required check (`sbom`) green. |
| 9 | uds-bundles | main | 🟢 GREEN | — |
| 10 | szl-fleet-overlay | main | 🟢 GREEN | — |
| 11 | szl-mesh | main | 🟢 GREEN | — |
| 12 | ouroboros | main | 🟢 GREEN | — |
| 13 | hatun-mcp | main | 🟢 GREEN | — |
| 14 | khipu-consensus | main | 🟢 GREEN | — |
| 15 | szl-lake | main | 🟡 STALE-RED | "Sync from HF dataset" + "Verify Anchor Receipts" had old push/schedule fails (Jun 11–12); **latest schedule/dispatch runs = success**. Effectively green now; reds are stale/superseded. Required checks (DCO, Scorecard) green. |
| 16 | szl-router | main | 🟢 GREEN | Only a "Dependency Graph" (dynamic) workflow exists — no push CI. Dynamic run = success. |

**Tally:** 11 GREEN · 3 RED (real push reds: a11oy, killinchu, szl-uds-deployment) · 2 STALE-RED (uds-mesh, szl-lake — superseded by green schedule/dispatch, treat as recovered).

---

## 2. Open PRs across the org (8 total)

All 8 open PRs are authored by **stephenlutar2-hash**; none are drafts. No open PRs exist in
any repo other than platform, a11oy, and lutar-lean.

| Repo | PR | Title (short) | Base | Mergeable | Merge state | Required checks green? | Disposition / class |
|------|----|---------------|------|-----------|-------------|------------------------|---------------------|
| a11oy | #341 | anatomy circulation loop (`/anatomy/loop`, EXPERIMENTAL) | main | MERGEABLE | BLOCKED | n/a (repo unprotected) | **NEEDS-FORGE.** Only failing check = "Shared source files in sync with killinchu" (same `szl_evidence_research.py` drift). All else green (hf-module-drift = SUCCESS). Not safe to merge until drift resolved. |
| lutar-lean | #239 | EnergyBudgetWitness (0-sorry) | main | MERGEABLE | BEHIND | DCO✓ lake-build✓ overclaim✓ | **DO NOT MERGE (keystone).** Only red = "Lint PR title (Conventional Commits)" — non-required, cosmetic. Branch is BEHIND main. Report only. |
| lutar-lean | #240 | landauer-floor witness (lower bound) | main | MERGEABLE | BEHIND | DCO✓ lake-build✓ overclaim✓ | **DO NOT MERGE (keystone).** Same single cosmetic red (PR-title lint). BEHIND main. Report only. |
| lutar-lean | #241 | agentic-body witness (0-sorry) | main | MERGEABLE | BLOCKED | DCO✓ lake-build✓ overclaim✓ | **DO NOT MERGE (keystone).** Same single cosmetic red (PR-title lint). Report only. |
| lutar-lean | #242 | harvest-budget bound (EXPERIMENTAL, 0-sorry) | main | MERGEABLE | BLOCKED | DCO✓ lake-build✓ overclaim✓ | **DO NOT MERGE (keystone).** Same single cosmetic red (PR-title lint). Report only. |
| platform | #357 | agentic-GPU resident scheduler | main | UNKNOWN | UNKNOWN | DCO✓ Scorecard✓ | **NEEDS-REVIEW / RED.** Many failing non-required checks: e2e-app (terra/vessels/carlota-jo/sentra/counsel), Lighthouse (same set + a11oy), Typecheck, E2E Gate, Runtime Audit, `check / doctrine` (FAIL on #357 only), Lint commit messages. Not safe to merge. |
| platform | #358 | swarm control-plane | main | UNKNOWN | UNKNOWN | DCO✓ Scorecard✓ | **NEEDS-REVIEW / RED.** reviewDecision=REVIEW_REQUIRED. Same e2e/Lighthouse/Typecheck/E2E-Gate/Runtime-Audit/Lint-commit reds; `check / doctrine` = SUCCESS here. Not safe to merge. |
| platform | #360 | energy-proportional proactive admission | main | UNKNOWN | UNKNOWN | DCO✓ Scorecard✓ | **NEEDS-REVIEW / RED.** Same e2e/Lighthouse/Typecheck/E2E-Gate/Runtime-Audit/Lint-commit reds; `check / doctrine` = SUCCESS. Not safe to merge. |

**platform #356** ("energy-source signal feed"): **CLOSED/merged** during the merge wave — no longer open. ✅

### Safe-to-merge candidates
**None.** Every open PR either (a) is the lutar-lean keystone (forbidden to merge), (b) has a real
failing guard tied to source drift (a11oy #341), or (c) has multiple failing e2e/Lighthouse/typecheck
gates (platform #357/#358/#360). Defaulting to **report-only** per mandate — nothing merged.

---

## 3. Recurring CI red signals — current state

- **a11oy "Shared source files in sync with killinchu"** — **STILL FAILING ON MAIN** (not just PRs).
  Failing on a11oy main (push, latest run 27462408487, 09:04Z) and on PR #341. Same guard also
  fails on **killinchu main**. Single diverged file: `szl_evidence_research.py`
  (a11oy: 37,799 bytes, blob `a37d24c8…`; killinchu: 41,936 bytes, blob `02581ec1…`), not in
  `.github/shared-file-drift-allow.txt`. The guard log also warns of allow-list entries that are
  no longer diverged (can be tightened). **Real on-box fix required.**
- **a11oy "hf-module-drift" ("HF Space module-drift guard" / "Source in sync with the live HF Space")**
  — **NOW PASSING.** Green on a11oy main and on PR #341. No longer a red signal.
- **platform #356** — **CLOSED/merged.** No longer open; not red.
- **platform #357 / #358 / #360** — **STILL RED on Lighthouse + e2e** (pre-merge checks).
  Failing across the app matrix: `e2e-app` and `Lighthouse` for terra, vessels, carlota-jo, sentra,
  counsel (+ Lighthouse/a11oy), plus `Typecheck`, `E2E Gate`, `Runtime Audit (audit:full)`, and
  `Lint commit messages`. A11y axe + Lighthouse Gate (accessibility) + security gates are GREEN.
  `check / doctrine` fails only on #357 (green on #358/#360). **platform main itself is GREEN** —
  these reds are confined to the three open feature PRs. Required checks (DCO, Scorecard) pass on all three.

---

## 4. RED / NEEDS-FORGE — items requiring on-box fixes

These cannot be cleared by re-running CI or by `--admin`; they need source-level forge work on the box:

1. **a11oy + killinchu — Shared-source drift guard (main).** Reconcile `szl_evidence_research.py`
   between the two repos (byte-match), OR add it to `.github/shared-file-drift-allow.txt` with a
   documented reason. Also prune stale allow-list entries the guard flagged as no-longer-diverged.
   Fixing this clears the failing check on a11oy main, killinchu main, **and** unblocks a11oy PR #341.
2. **szl-uds-deployment — Box Fallback Superset Guard self-test (main).** `scripts/box-fallback-superset-checks.test.sh`
   regressed: 3 passed / 3 failed ("expected pass, got fail" on pristine-repo coverage,
   re-added-sbin acceptance, and own-installer allowlist skip). The real superset job was *skipped*
   because the self-test gate failed first. Fix the guard/fixtures on-box.
3. **platform #357/#358/#360 — e2e + Lighthouse + Typecheck + Runtime Audit (PRs).** App-matrix
   e2e/Lighthouse failures and a Typecheck failure block these feature PRs. Needs dev work
   (likely build/runtime env or type errors); not an admin-mergeable situation. platform *main* is unaffected.

### Watch-list (stale/superseded — not on-box reds, monitor only)
- **uds-mesh "Release Please":** last push failed but latest dispatch runs succeed; known release-please pattern. Verify next push goes green.
- **szl-lake "Sync from HF dataset" / "Verify Anchor Receipts":** old push/schedule fails superseded by green schedule/dispatch runs. Effectively recovered.
- **lutar-lean PRs #239–#242 "Lint PR title (Conventional Commits)":** cosmetic non-required failures; keystone repo, no action (do not merge).

---

## Summary

Of **16 active repos**, **11 are fully GREEN** on main, **2 are STALE-RED** (uds-mesh, szl-lake —
old push/schedule failures already superseded by green dispatch/schedule runs, effectively recovered),
and **3 carry real push-event reds on main**: **a11oy** and **killinchu** (both failing the
**Shared-source drift guard** on the single diverged file `szl_evidence_research.py`) and
**szl-uds-deployment** (**Box Fallback Superset Guard** self-test regressed, 3/6 fixtures failing).
None of these three reds sit on *required* status checks, so they do not block merges, but all three
are genuine NEEDS-FORGE on-box fixes. Across the org there are **8 open PRs** — 4 on the lutar-lean
keystone (forbidden to merge; only a cosmetic PR-title-lint red each), 3 on platform (#357/#358/#360,
all blocked by failing e2e/Lighthouse/Typecheck PR checks), and 1 on a11oy (#341, blocked by the same
`szl_evidence_research.py` drift guard). platform #356 has been merged/closed. **Zero PRs were merged
and no `--admin` override was used** — every open PR is either the keystone or carries a real failing
check, so the audit defaults to report-only. **Estate alignment is NOT yet fully ALIGNED**: clearing
the three NEEDS-FORGE items (drift reconciliation across a11oy/killinchu, and the szl-uds-deployment
guard self-test) is required before the org can be declared aligned.
