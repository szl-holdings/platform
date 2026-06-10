# WAVE23 FRONTIER STATEMENT — what "the conjecture to pass" and "the last formula" mean now
# Audited live 2026-06-08 by CTO subagent. main @ da013be5. ALL CI GREEN. Wave22 (PR #212) MERGED.

## ONE-PAGE HONEST FRONTIER

### 1. "The last formula" (CUT-1 / Λ side) = DONE. No unconditional progress is honest.
- **Wave22 (PR #212) is MERGED on `main` @ `da013be5`** (commit `ba1050b`). Files live:
  `Lutar/Wave22/{GapShiftOrdering,CorderClosure,Cut1Corder,LambdaConditional}.lean` — 15 decls, axiom-clean.
- CUT-1 (Aczél quasi-arithmetic representation) is **FULLY CLOSED on its stated, checkable hypotheses**:
  the BKS Fourth-step (C-order) gap-shift ordering `R s ≤ L t` is now DERIVED, not assumed
  (`corder_gapshift` / `corder_data` → `continuous_of_corder_fully_derived`).
- Conditional Λ uniqueness is at its **sharpest reachable form**: `cut1_sharp_conditional_lambda`
  proves `{A1–A5} + separability + slice-multiplicativity + slice-monotonicity ⟹ Φ = Λ`, with
  bisymmetry (`bisymmetry_is_redundant`) and unit-normalization (`slice_one_eq_one_of_sep`) shown REDUNDANT.
- **Λ UNCONDITIONAL uniqueness stays Conjecture 1** — machine-checked FALSE (`maxAgg`/`min` satisfy
  A1–A5 but ≠ Λ). Slice-multiplicativity is the irreducible Cauchy-type input the false statement lacks;
  dropping it re-admits the counterexamples. **This is the sharp boundary inside the separable family.**
  Per mandate: forward motion here is exhausted. NO new unconditional progress claimed. We do NOT attack it.

### 2. "The conjecture to pass" = Khipu BFT SAFETY (Conjecture 2). This is the REAL open frontier.
- Declared (unproven, honest `sorry`) in TWO places, both correctly labeled NEVER-a-theorem:
  - `Lutar/KhipuConsensus.lean :: khipu_consensus_safety` — maps a threshold-reaching quorum with
    `faultyCount ≤ 1` into the **opaque** `canonicalHistory`. This statement is UNPROVABLE as written:
    `canonicalHistory : ActionHash → Prop` is `opaque`, so nothing constrains it. (Genuine obstruction:
    no model of the adaptive adversary vs. an abstract opaque predicate. Leave as-is — not the target.)
  - `Lutar/Innovations/round12/Identity_Ayni_Quorum.lean :: ubuntu_quorum_safety` — the named
    **Conjecture 2**. Its `sorry` residual is precisely: **non-faulty-witness extraction**
    (`|Q₁ ∩ Q₂| > f ≥ |faulty|` ⇒ ∃ honest organ in the intersection) **+ honest single-valuedness**
    (an honest organ does not equivocate). The combinatorial core
    `quorum_intersection_honest` (any two quorums of size ≥ n−f intersect in > f organs under
    `n ≥ 3f+1`) is ALREADY proven sorry-free.

### THE OBSTRUCTION, NAMED PRECISELY
`ubuntu_quorum_safety` currently takes `voteOf : Fin n → Verdict` — a TOTAL FUNCTION. With a total
function, an organ literally cannot equivocate (it has one value), so the only missing step is the
witness extraction — yet it was left `sorry`. Meanwhile `Wave13/Sweep.lean ::
quorum_agreement_single_valued_vote` ALREADY proves agreement for the total-function shadow, and
explicitly states it is **strictly weaker than Conjecture 2** because the real Byzantine model must
let faulty organs equivocate — which a single total `voteOf` cannot represent.

### THE WAVE23 TARGET (the honest BFT analog of slice-multiplicativity)
Model votes as a **RELATION** `votes : Fin n → Verdict → Prop` (so a Byzantine organ CAN equivocate:
`votes o a ∧ votes o b` with `a ≠ b`). The WEAKEST CHECKABLE HYPOTHESIS that turns
`ubuntu_quorum_safety` into a THEOREM (conditionally) is the BFT-standard **non-equivocation of
honest organs under signed votes**:

> H_NE:  ∀ o, o ∉ faulty → ∀ a b, votes o a → votes o b → a = b      (honest single-valuedness)

Then under `n ≥ 3f+1`, `|faulty| ≤ f`, two quorums Q₁,Q₂ of size ≥ n−f each certifying v₁,v₂
(every organ in Qᵢ votes vᵢ), quorum intersection gives `|Q₁∩Q₂| > f ≥ |faulty|`, so SOME organ in
the intersection is honest; H_NE forces v₁ = v₂. **CONDITIONAL agreement (no split-brain) under
Byzantine equivocation, axiom-clean.** This is exactly analogous to "slice-multiplicativity ⟹ Λ":
H_NE is the irreducible cryptographic input (signatures enforce one signed vote per honest organ
per round) that the bare conjecture lacks.

### WHAT STAYS RESIDUAL (honest, will be labeled in Wave23)
- The `opaque canonicalHistory` form (`khipu_consensus_safety`) stays a conjecture — not provable
  against an opaque predicate; we do NOT touch the locked kernel file.
- Liveness (Conjecture 3) is untouched.
- Unconditional BFT safety WITHOUT H_NE is impossible (a Byzantine majority within the honest budget
  could equivocate) — that's why it's a conjecture. H_NE is the minimal checkable hypothesis,
  realized at runtime by ECDSA-P256 cosignatures (one signed allow-vote per honest organ per action).

### VERDICT
- CUT-1 last formula: **DONE (merged).** No further honest unconditional motion.
- Open conjecture to attack: **Conjecture 2 (Khipu BFT safety).** Provable CONDITIONALLY under H_NE
  (honest non-equivocation) + n≥3f+1 + quorum-intersection, mirroring the conditional-Λ result.
- Doctrine: locked-proven STAYS EXACTLY 5; Λ STAYS Conjecture 1; Wave23 result will be labeled
  CONDITIONAL with hypotheses {n≥3f+1, |faulty|≤f, quorum size ≥ n−f, honest non-equivocation H_NE}.
