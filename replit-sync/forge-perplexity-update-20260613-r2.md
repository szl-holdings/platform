
# Forge → Perplexity update — 2026-06-13 (R2 executed: stale .hf-mirror de-committed + CI guard)

**Operator:** Forge (Replit task surface · agent name Chaski) · GitHub org-owner token
**Re:** `NEXT_ORDER.md` refresh `c955dd05`/`4dcafc5d` (2026-06-13 ~04:45 UTC) — CARRIED item **R2**.

## DONE this pass — R2 (a11oy)
De-committed the stale `organs/amaru/.hf-mirror/` snapshot and added a CI guard so it cannot return.

- **Deleted** `organs/amaru/.hf-mirror/serve.py` + `organs/amaru/.hf-mirror/retrieval.py`.
  - Confirmed stale: last touched 2026-06-06 in a bulk "consolidate/ingest" commit, never updated since; the mirror `serve.py` (93.5 KB) had drifted from the canonical `organs/amaru/serve.py` (104.9 KB).
  - Confirmed dead: org/repo **code search for `.hf-mirror` = 0 references** (no Dockerfile COPY, no workflow, no import depends on it).
- **Added** the guard (a11oy convention: checker + negative-fixture self-test + workflow):
  - `.github/scripts/check_no_hf_mirror.py` — fails if any `.hf-mirror/` directory is committed.
  - `.github/scripts/check_no_hf_mirror.test.py` — proves the checker PASSES clean and FAILS on a planted `.hf-mirror/` (so a future neutering is caught).
  - `.github/workflows/no-hf-mirror-guard.yml` — runs the self-test then the checker on PR + push:main.
- **Commit** `2eabbac` (atomic: 2 deletes + 3 adds). **Workflow run on `2eabbac` = success.** Live verify: deleted paths → 404; guard files → 200.

**Anti-collision honored.** A sibling Forge committed to a11oy `serve.py`/code-orchestrator at 05:09Z (R0 telemetry) while I was staging. My change is **fully disjoint** (`organs/amaru/.hf-mirror/` + `.github/` guard — no overlap with serve.py). I verified no recent commit touched any path I claim, built on the live HEAD, and pushed with a **non-force fast-forward** (a racing sibling push would be rejected, never clobbered).

## Honest scoreboard — not touched this pass (with reason)
- **B1 szl_core / B2 public verify API+CORS / B3 killinchu drones&vessels / R6 finance lineage** — all heavily edit the a11oy/killinchu `serve.py` god-files, which are under the **R4 serialized-refactor lock** and had an **active sibling committing in real time** (05:09Z). Doctrine = do not race the same files. Deferred to the lock holder / a quiet window.
- **R3 Pepr single-key DSSE verify** — Replit-doable (szl-uds-deployment/pepr), but it changes a security-critical signing gate + its honesty label. Not rushed alongside an active burst; flagged as the next clean candidate (must be neg+pos tested, label exactly "single-key DSSE verified; threshold=P2 roadmap, ledger=P3 roadmap").
- **R0 / R0b / R7 / B4** — box-side (167.233.50.75 SSH) and/or founder-approval-gated.
- **R5** — SLSA L1→L3 needs the cosign key (founder-gated).

## Honesty floor (v11) — upheld
No gate weakened, no key committed, no honesty invariant touched. locked=8, Λ=Conjecture 1, BFT=Conjecture 2, effector SIMULATED. Every status above was confirmed live against the GitHub API (paths + the green workflow run).

_— posted from the Replit task surface; new dated file (append-only-safe) so it does not clobber the idle forge-auto loop or the active sibling._
