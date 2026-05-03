# Ouroboros Thesis v4 — Outline (audit-grounded, no fabrication)

**Status:** outline only. Awaits user approval before drafting.
**Source-of-truth:** `papers/v3/AUDIT.md` §5.4 + §6 (already on the repo,
written by us before v3 was published).
**Working title:** "The Lutar Invariant in Practice — Empirical Sensitivity,
Co-resident Runtime Behaviours, and Full Reproducibility"
**Target length:** 14-15 pages (v3 is 8). Growth = 6-7 audit-supported pages,
nothing speculative.
**Concept DOI (unchanged):** 10.5281/zenodo.19944926

---

## What v4 keeps from v3 verbatim

§1-§4 (Motivation, Definition, Axioms, Boundary properties) and §9
(Reproducibility/citation/licence). These are the math; they don't move.

## What v4 expands or adds

### §5 (expanded, ~2 extra pages) — "Λ inside a coherent runtime"
Walk through three additional Type A behavioural test groups that ship in
the same `ouroboros` runtime as Λ:
- **Proof-route resolver** — what the test asserts, why it matters for Λ's
  inputs.
- **Risk-tier gate** — how the gate consumes Λ output and the unit test
  that fixes its decision boundary.
- **Almanac cycle advancer** — bounded-loop convergence test that exercises
  the same invariant Λ depends on.

For each: file path, test name, assertion in plain English, last green run.
No new claims; this is a reading of code that already exists and passes.

### §6 NEW (~3 pages) — "Empirical sensitivity study"
A new Python script lives at `papers/v4/experiments/sensitivity.py`. It:
- Generates N synthetic 9-axis points (uniform, then adversarial low-axis
  configurations).
- Computes Λ vs arithmetic mean vs min for each.
- Plots: distribution comparison, "single-weak-axis" curve, weight-set
  divergence.
- Outputs SHA-256 of the input dataset and result CSV so anyone can verify.

Honest framing: this is illustrative behaviour of Λ on synthetic data, not
a claim about real-world deployments. Script is new code authored by Stephen
Lutar; ships under the same licence.

### Appendix A NEW (~1 page) — "Full reproducibility manifest"
- Pinned versions: node, pnpm, vitest, Python (for §6).
- SHA-256 of `lutar-invariant-proof.test.ts`.
- SHA-256 of `package.json`.
- Commit hash for the v4 deposit.
- Step-by-step: clone → install → run tests → run §6 script → diff
  outputs.

### §7 (strengthened) — Limitations
Add limitation #4 explicitly: "The wider SZL Holdings platform does not
import the runtime that ships with this paper. Λ is proven and runnable,
but its consumption inside operational products is platform-dependent and
out of scope for this paper." This is already in the AUDIT and should be
in the paper text.

## What v4 deliberately does NOT add

(Direct from AUDIT §6; kept here so we don't backslide.)

- No Lean mechanization — cannot verify here.
- No worked deployment case studies — no fielded deployments.
- No "industry-baseline" comparisons — no fielded comparison data.
- No claim that the SZL platform currently consumes Λ — it doesn't yet.

## Process to publish v4

1. Draft v4 markdown alongside v3 in `papers/v4/`.
2. Run `papers/v4/experiments/sensitivity.py` and commit the CSV + plots.
3. Compute SHAs, fill Appendix A.
4. Build PDF, tag `paper-v4-1.0.0`.
5. On Zenodo: open record 19983066 → "New version" → upload v4 PDF +
   source bundle → publish. New version mints a fresh DOI (e.g.
   `10.5281/zenodo.199xxxxx`); concept DOI 19944926 starts redirecting to v4
   automatically. The broken v3 DOI 19983066 stays as-is — we already lead
   with the concept everywhere, so nothing breaks.

## v5 / v6 — not scoped here

v4 is the next defensible step. v5 and v6 should not be drafted ahead of
their audit support. When the platform actually imports the runtime
(closes AUDIT §4.1), that becomes v5 territory: a paper about Λ as a
fielded operational primitive, with deployment metrics. Until then we
publish what we can prove.
