# Forge → CTO report — 2026-06-11

## platform Task #412 — deep-link checker GREEN

**Status: DONE.**

The required CI check **"Public pages link only to reachable repos"** is GREEN on
`szl-holdings/.github@main`.

- Fix commit (signed): `440640a7837c7c957dad3803cc552901e1154b52`
- Workflow run `27325586798` — required check `success`; also success: Run tests,
  DCO sign-off check, doctrine, markdown-lint, gitleaks, All actions SHA-pinned,
  SLSA. Zero failing checks (only CodeQL Analyze still churning, unrelated to this
  change and green on prior runs).

### Root cause (twofold — neither was the reachability gate)

1. The job's report-refresh housekeeping step pushed the timestamped report JSON
   back to protected/signed `main` and was rejected, so the whole job went RED
   even though the reachability gate had PASSED. Fix: that push is now fail-LOUD
   but NON-blocking; the dedicated gate step (reads `$CHECK_EXIT`) remains the
   sole arbiter — the gate was **not** weakened.
2. The bare-URL regexes captured a trailing `}`, so BibTeX `\url{...}}` citations
   in the a11oy cookbook recipes were read as bogus 404s (9 false positives).
   Fix: excluded `}` from both bare-URL char classes, added a trailing-`}` strip
   in `_strip_trailing_punct`, and applied that strip to the org bare-URL loop too
   (parity with the external path). Covered by a no-network regression test class.

The 2 REAL deep-broken org links stay honest **WARN** (advisory backlog, not the
ERROR gate) — not repointed.

No served / HF-mirrored file changed (checker lives in `.github`), so no
`SYNC_STATUS.md` entry is required for this task.

— Forge

---

## FRONTIER §1 — lutar-lean PR #225 lake build GREEN (2026-06-11)

**Status: DONE (lake-verified green). NOT merged — founder merges only (doctrine: no Lean self-merge).**

PR #225 `feat(qbio): coherence monotone strict-decay theorem under Lindblad dephasing (PROPOSED - lake-verify)`,
branch `wave24/coherence-decay-proposed`, head `e0e53b906c56ac984a34df73933e2787af35f1af`
(GraphQL signed; DCO `Stephen Lutar <stephenlutar2@gmail.com>`).

Two real Lean errors in `Lutar/QuantumBio/CoherenceDecay.lean` fixed against Mathlib v4.18.0
(logic unchanged, zero `sorry`, no new axioms):
1. `coh_tendsto_zero`: `Filter.Tendsto.neg_atTop` is absent in v4.18.0 -> replaced
   `simpa using this.neg_atTop` with `exact Filter.tendsto_neg_atTop_atBot.comp this`.
2. `lambda_single_crossing`: trailing `field_simp` left an unsolved ring identity -> added
   `hq0 : q != 0` and `hC0' : C0 != 0` then closed with `field_simp; ring`.

**CI on head e0e53b9:**
- PASS `lake build + numbers` (kernel-verified) - the gate.
- PASS `verified-theorems wiring`, `Snapshot + anchor invariants self-test`,
  `overclaim / Governed surfaces are honest`, `check / doctrine`, `Run tests`, `CodeQL`,
  `Grype CVE gate`, `Trivy filesystem scan`, `gitleaks`, `doi-title-gate`,
  `Lint PR title (Conventional Commits)` (after I corrected the title `wave24(qbio):` -> `feat(qbio):`).
- FAIL `DCO sign-off check` - **founder/merge-gating, NOT my commit.** My commit carries the
  sign-off; a pre-existing parent commit on the branch lacks it. Rewriting parent history is out
  of scope. Founder action at merge: rebase/amend the earlier commit with the DCO trailer, or
  admin-merge. `mergeable_state=blocked` is due solely to this required check.

Doctrine preserved: locked-8 unchanged, Lambda uniqueness = Conjecture 1, Lambda-v5 = engineering
gate PROPOSED. CoherenceDecay.lean is a Lean source (not an HF-served file) -> no `SYNC_STATUS.md`
entry required.

-- Forge
