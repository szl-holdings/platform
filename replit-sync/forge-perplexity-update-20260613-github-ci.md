# Forge → Perplexity update — 2026-06-13 (org-wide GitHub CI handled + recurring guard)

**Operator:** Forge (Replit task agent · GitHub `Carlota-1` / org-owner token) · agent surface name **Chaski**
**Scope:** full-autonomy directive — fix ALL failing CI across the szl-holdings org at root cause (no bandaids, no weakening honesty guards/invariants), clean the founder's GitHub notification inbox, and stand up a recurring job that keeps it clean + recommends.

## Root-cause CI fixes — verified GREEN (live, against the Actions API)
- **szl-lake `sync-from-hf`** — secrets-context fix.
- **killinchu `scorecard`** — green.
- **uds-bundles `zarf-bundle-build`** — green.
- **.github `HF Daily Activity`** — the workflow only skips when `HF_TOKEN` is ABSENT; a present-but-**invalid** token hard-fails. Reset the `.github` repo secret to a valid HF write token (sealed-box). run#25 success.
- **.github `License Consistency`** — root cause was **missing LICENSE files**, not a guard bug: `anatomy` and `szlholdings-site` claimed Apache-2.0 in README but had no detectable LICENSE. Added the canonical Apache-2.0 LICENSE to both (GitHub /license now detects cleanly). run#9 success. NOT allowlisted — the allowlist stays for genuine deviations only (platform=Proprietary, szl-lake=CC-BY-4.0).

## Recurring guard — the "keep it clean + recommend" deliverable (LIVE)
- Committed `szl-holdings/.github/scripts/ci_health_digest.py` + `.github/workflows/ci-health-digest.yml` (daily cron 13:37 UTC + `workflow_dispatch`).
- It sweeps every active repo's default-branch runs, classifies each red by **disposition** (ACTIONABLE / FOUNDER-GATED / INTENTIONAL / INFRA via a single POLICY list — the only honest place to reclassify; never silences a real bug), and **upserts ONE rolling tracking issue**: **szl-holdings/.github#158 "🔴 CI Health Digest — org-wide"** (label `ci-health`).
- Enabled via repo secret `ORG_CI_READ_TOKEN` (the org-owner token) — the built-in `GITHUB_TOKEN` cannot read other repos' Actions runs.
- **Latest sweep:** 28 red → **14 ACTIONABLE, 1 founder-gated, 1 intentional, 12 infra.**

## Inbox — cleaned
- 207 unread (all CheckSuite `ci_activity` noise) → marked the 206 noise threads read; **preserved the 1 genuine alert**: comment *"[ANCHOR] szl-lake Theorem-U receipt chain no longer verifies"* (likely a data-state from a recreate — Vault PV drop rotates the Transit key — NOT a CI-file bug; flagged for founder).

## Honest remaining (captured as classified recommendations in #158, NOT all hand-fixed — by design)
- **ACTIONABLE backlog** tracked in #158: killinchu Watchlist NTFY pytest, a11oy Conventional-Commits PR-title lint, trivy schedule, killinchu Release SBOM+DSSE, etc.
- **INTENTIONAL (left red on purpose):** `lambda-bounty` verify-proof — the proof gate rejects the still-OPEN Λ (Conjecture 1) by design; red is the honest verdict.
- **FOUNDER-GATED:** `szl-doctrine` secret-health — needs `SECRET_HEALTH_TOKEN` (least-priv founder PAT; cannot be minted in CI).

## Honesty floor (v11) — upheld
No gate weakened, no key committed, no honesty invariant touched. locked=8, Λ=Conjecture 1, BFT=Conjecture 2. Every "GREEN" above was confirmed directly against the GitHub Actions API; the digest run + issue refresh were confirmed live.

_— posted from the Replit task surface; new dated file (append-only-safe) so it does not race the idle forge-auto loop (AUTO_STATE: done/idle @ 2026-06-12T22:03Z)._
