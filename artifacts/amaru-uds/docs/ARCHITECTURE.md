# Amaru.UDS — Architecture (Doctrine V6)

Amaru is the **Andean Ouroboros** — a convergent multi-source data
synchronization runtime. Doctrine V6 binds it to eight invariants that this
document specifies in full, with citations to the primary sources, the
operational form A11oy uses, and the runtime check that proves the invariant
holds at construction time.

## Pillar 1 — Lutar Σ canonical composition

**Formula.** `Σ = P^(1/2) · K^(1/4) · Φ^(1/8) · C^(1/8)`
where `P` = Provenance, `K` = Containment, `Φ` = Coherence, `C` = Convergence
(each in (0, 1]).

**Why these exponents.** The exponents `(1/2, 1/4, 1/8, 1/8)` form a dyadic
partition of unity (they sum to 1), making Σ a weighted geometric mean.
Provenance carries the most weight because a sync whose source-priority is
unverified is structurally untrustworthy regardless of how well it converges;
convergence is correctly the smallest weight because a high-quality merge
without provenance is worse than a slow merge with full provenance.

**Invariant.** `lutarSigma` throws on any axis outside (0, 1]. Output is in
(0, 1] by construction.

## Pillar 2 — Lutar Envelope

**Formula.** `Σ_lo = ∏ (axis_i − |axis_i − mean|)^w_i`,
`Σ_hi = ∏ (axis_i + |axis_i − mean|)^w_i`, same weights.

**Why.** When the axes drift apart from each other, the envelope widens,
making the dispersion visible in the same units as Σ itself. An auditor can
read `[lo, hi]` next to Σ and immediately see "Σ = 0.94 but with envelope
[0.81, 1.00], the convergence axis is dragging".

**Invariant.** `lo ≤ Σ ≤ hi` (numeric; clamped at 1e-12 for the lo product).

## Pillar 3 — Normalized Risk Λ

**Formula.** `Λ = clamp(severity · likelihood · valueAtRisk / cap, 0, 1)`.
**Floor.** `Λ_floor = 0.90`. Any sync operation with `Λ ≥ 0.90` is
HALT-eligible by HUKLLA (the central halt authority for the Andean-Ouroboros
loop).

**Why a clamp.** Risk that exceeds the configured cap is not "infinitely
risky" — it is "at the operational ceiling". Saturating at 1.0 lets the
floor comparison be a clean numeric check instead of a chain of conditionals.

## Pillar 4 — KL divergence (drift)

**Formula.** `D_KL(p ‖ q) = Σ_i p_i · log(p_i / q_i)`, smoothed with
`ε = 1e-12` on both sides to avoid `log(0)`.

**Why asymmetric.** Drift in a sync fabric is naturally directional —
"how much does the new mixture diverge from the prior" is not the same
question as the reverse. KL preserves that asymmetry; symmetric metrics
like total variation hide it.

**Citation.** Kullback, S. & Leibler, R. A. (1951). "On information and
sufficiency." Ann. Math. Statist. 22, 79–86.

## Pillar 5 — Bekenstein admission gate

**Formula (operational form).** `S ≤ (2π · R · E) / (ℏ · c)`, scaled.
A sync admission carrying `infoBits` bits over a handoff of radius `R` and
energy budget `E` is **ADMITTED** iff `infoBits ≤ floor(S / ln 2)`.

**Why.** Bekenstein's 1981 bound is the deepest known information-theoretic
limit on what a bounded region can carry. Adopting it as a *governance*
ceiling rather than a physical one keeps the sync fabric from accepting
admissions that would, even in principle, exceed the configured information
capacity of the handoff.

**Citation.** Bekenstein, J. D. (1981). "Universal upper bound on the
entropy-to-energy ratio for bounded systems." Phys. Rev. D 23, 287.

## Pillar 6 — Bounded-loop convergence

**Invariant.** Every reconciliation loop:
- Terminates within `maxDepth` iterations (default 64).
- Score is monotone non-increasing (any increase → `diverged`).
- Halts with `converged` when `|Δscore| < tol` (default 1e-9).

**Why.** Convergent sync without a depth bound is a euphemism for a hang.
Convergence with a depth bound but without monotonicity is a euphemism for
"we accept whatever the last iteration produced". Both invariants are
required for the loop to deserve the word "convergent".

## Pillar 7 — 9-axis AND gate

**Invariant.** Every one of the nine V6 axes (provenance, containment,
coherence, convergence, moral_grounding, lambda_risk, bekenstein_admission,
loop_boundedness, byline_canonicality) must report `pass: true` AND its
score must be ≥ its configured floor. Single-axis failure ⇒ block.

**Why AND, not OR.** Defense-grade data sync is a multi-invariant problem.
A weighted OR would let a high-scoring axis paper over a failing one; an AND
makes every axis a veto. The cost is occasional false positives, which is
the correct trade for this surface.

## Pillar 8 — Hash-chained proof receipts

**Invariant.** Every appended receipt embeds the sha256 of the previous
receipt in its body, then is itself hashed. Tampering with any historical
receipt breaks the chain at that point and is detectable by `verifyChain`.

**Why this and not a Merkle tree.** Linear chains are operationally simpler
for the append-mostly workload of sync delta-logs; the tamper-detection
guarantee is the same (O(n) re-hash on verify; verification is offline and
amortizes over reads). A Merkle tree is a v0.2.0 candidate when partial-
proof requirements appear.

## Citations index

- Kullback & Leibler 1951 — `klDivergence`
- Bekenstein 1981 — `bekensteinAdmit`
- Sha-2 / NIST FIPS 180-4 — `sha256Hex`, proof chain
- Lutar Σ family — internal doctrine, derived from the SZL Zenodo
  community (TH1–TH8 lineage)

## Composition of the pillars in a single sync cycle

1. Inbound delta-log is admitted via the Bekenstein gate (Pillar 5).
2. The reconciliation loop runs under bounded-loop discipline (Pillar 6).
3. The reconciled state is scored by Lutar Σ and bracketed by the envelope
   (Pillars 1, 2).
4. The risk Λ is computed (Pillar 3) and compared to the floor.
5. The 9-axis AND gate fires (Pillar 7); any failure → HALT.
6. A receipt is appended to the proof chain (Pillar 8) recording every
   axis score, the Σ, the Λ, the admission decision, and the delta-log.

All pillars must pass for a sync to merge. Any failure produces a
structured HALT receipt logged with the failing axis and the input that
triggered it.
