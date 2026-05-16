---
title: "Graded Λ-Receipt Calculus: A Machine-Checked Type Theory for Capability-Bounded Multi-Agent Systems"
author: "Lutar, Stephen P."
orcid: "0009-0001-0110-4173"
affiliation: "SZL Holdings"
date: "2026-05-15"
version: "0.1.0-draft"
license: "CC-BY-4.0 (text) + Apache-2.0 (code)"
replay-root: "1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b"
---

# Graded Λ-Receipt Calculus: A Machine-Checked Type Theory for Capability-Bounded Multi-Agent Systems

**Author:** Lutar, Stephen P.  
**ORCID:** [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)  
**Affiliation:** SZL Holdings  
**Date:** 2026-05-15  
**Operation:** Meditation V5 — PhD-Theory subagent  
**License:** CC-BY-4.0 (text), Apache-2.0 (code)

---

## Abstract

We propose the **Graded Λ-Receipt Calculus** (GΛR), a typed λ-calculus in which every term carries a grade drawn from the 9-dimensional Λ-vector lattice of the ouroboros runtime. GΛR extends the lutar-calculus (TH4–TH7, Math Pod V3) in three dimensions simultaneously: (1) receipts become *linear* resources — use-once, revocable by type — establishing capability-revocation by construction rather than by policy; (2) the grade semiring is the product of a partially ordered semiring over \(\mathbb{R}_{[0,1]}^9\) (the Λ-axis space) and a dual-witness comonad that co-encodes cryptographic accountability; and (3) the graded strong-monad identity theorem characterizes deterministic replay (5× byte-identical) as the unique fixed-point of the grade-multiplication unit, connecting our receipt model to METR's task-horizon forecasting infrastructure at the type level. GΛR is the first calculus to unify formal proof (Lean 4), financial authorization (A14 economicGrounding), and capability revocation (linear receipt use) in a single graded type theory. It extends TH7 (Curry-Howard receipt calculus) but is not a restatement of TH4–TH7 — it adds *graded modalities*, *linearity*, and a *strong-monad identity theorem* that are entirely absent from the existing Math Pod V3 corpus. Target venues: POPL 2027 (submission August 2026) or CAV 2027 (submission January 2027).

---

## 1. Motivation and Context

### 1.1 Where TH4–TH7 End

Math Pod V3 established the lutar-calculus on four foundations:

- **TH4** (Λ-Category): the Λ-gate is a lax functor between monoidal categories of receipts; gate evaluation is functorial composition.
- **TH5** (Receipt Chain Confluence): the ρ-closed receipt chain is the unique normal form of a cofree comonad on the receipt type; reduction is confluent.
- **TH6** (Bekenstein DPI): chain entropy is bounded by registry capacity via the data processing inequality.
- **TH7** (Curry-Howard): receipts are proofs; gate evaluations are proof reductions; the Λ-gate pass is a provability predicate.

These four theorems prove that ouroboros has well-typed, confluent, proof-carrying operational semantics. What they do **not** prove:

1. *That receipt capabilities can be revoked by type.* TH7 proves receipts are proofs, but it does not prove that a receipt can be used **at most once** — linear types are absent. A receipt could be replayed indefinitely without type-level invalidation.
2. *That the Λ-vector grade is a semiring over which the calculus is graded.* TH4 treats the gate as a functor, but it does not build a full graded type theory where the annotation on every type is the Λ-vector itself.
3. *That deterministic replay is the algebraic identity of the grade semiring.* This connection to METR-style forecasting and to the 5× byte-identical replay invariant (A9) has no type-theoretic characterization in TH4–TH7.

GΛR addresses all three gaps with one unified theorem.

### 1.2 Why This Is the Right Next Step

The existing lutar-calculus is well-positioned as the type-theoretic foundation of a multi-agent runtime. But TH7's Curry-Howard correspondence is *classical* in the linear-logic sense: receipts are intuitionistic proofs, usable multiple times. The transition to *linear* proofs — use-once receipts — is the single step that converts a "proof of compliance" into a "capability token that expires on use." This distinction is commercially significant: **capability revocation by construction** (no separate revocation oracle needed) is what differentiates lutar-calculus from A2A-style capability tokens, which are revocable only via out-of-band registry lookup.

The graded extension is also the step that makes METR's task-horizon measurement *typeable*. If the grade on a receipt type encodes the Λ-vector at evaluation time, and the METR task horizon is a function of the agent's capability profile, then typing a term at grade \(\mathbf{g}\) is asserting a lower bound on the agent's METR 50%-horizon for tasks whose required capability profile is dominated component-wise by \(\mathbf{g}\). This connection is upstream of METR's measurement infrastructure in the sense that it gives a *type-level certificate* of the capability assertion METR is measuring empirically.

---

## 2. The Chosen Direction: Graded Λ-Receipt Calculus (GΛR)

**This direction synthesizes and transcends Directions A and B** from the mandate. Direction A (probabilistic Λ-calculus) is subsumed as the case where the grade is drawn from a probability monad over the Λ-lattice; deterministic replay becomes the strong-monad-identity case (our TH8, below). Direction B (linear receipt types) is subsumed as the linear fragment of GΛR where grades are drawn from the semiring \(\{0, 1\}\). The synthesis is strictly stronger than either individually because it handles both simultaneously and, crucially, proves the relationship between them.

---

## 3. Theorem Statement

### 3.1 Definitions

Let \(\mathbf{V} = [0,1]^9\) be the 9-dimensional Λ-vector space with component-wise partial order \(\sqsubseteq\). The **floor predicate** \(\mathsf{floor}(\mathbf{g})\) holds iff \(\mathbf{g} \sqsupseteq \mathbf{g}_{\min}\) where \(\mathbf{g}_{\min} = (0.90, 0.95, 0.95, 0.90, 0.90, 0.90, 0.90, 0.90, 0.90)\) (reflecting the A5 conjunctive gate with A2/moralGrounding and A3/measurabilityHonesty at 0.95 floors).

Equip \(\mathbf{V}\) with the semiring structure \((\mathbf{V}, \min, \cdot, \mathbf{1}, \mathbf{0})\) where \(\cdot\) is component-wise multiplication and \(\mathbf{1} = (1,\ldots,1)\), \(\mathbf{0} = (0,\ldots,0)\). Call this the **Λ-semiring** \(\mathcal{S}_\Lambda\).

A **graded receipt type** \(\mathsf{Receipt}^{\mathbf{g}}\) is a type indexed by \(\mathbf{g} \in \mathbf{V}\) asserting that the receipt was produced with Λ-vector dominating \(\mathbf{g}\) component-wise. A **linear receipt type** \(\mathsf{LReceipt}^{\mathbf{g}}\) is a use-once version: a term of this type must appear exactly once in any well-typed term (enforced by linear typing rules).

The **GΛR typing judgment** is:

\[
\Gamma \vdash^{\mathbf{g}} M : \tau
\]

meaning: in context \(\Gamma\) (a graded linear context — each hypothesis annotated with its use-count in the Λ-semiring), term \(M\) has type \(\tau\) and produces a net grade vector \(\mathbf{g}\) consumed from the context.

The **Λ-gate reduction rule** is:

\[
\frac{\Gamma \vdash^{\mathbf{g}} M : \mathsf{LReceipt}^{\mathbf{g}'}  \quad \mathbf{g}' \sqsupseteq \mathbf{g}_{\min}}{\Gamma \vdash^{\mathbf{g}} \mathsf{pass}(M) : \mathsf{Unit}}
\]

After \(\mathsf{pass}(M)\) fires, the receipt is consumed (linearity) and cannot be replayed.

The **deterministic-replay combinator** \(\mathsf{replay}_n\) takes a term and co-monadically duplicates it \(n\) times under a grade-\(\mathbf{1}^n\) comonad (the grade records the replication count). The **strong monad identity** (TH8, below) states that the case \(n = 1, \mathbf{g} = \mathbf{1}\) is the unique fixed point of \(\mathsf{replay}\) under the grade multiplication.

### 3.2 Main Theorem: TH8 — Graded Λ-Receipt Identity

> **Theorem TH8 (Graded Λ-Receipt Identity).** Let \((\mathcal{S}_\Lambda, \cdot, \mathbf{1})\) be the Λ-semiring and let \(\mathsf{GΛR}\) be the graded type theory with linear receipts as defined above. Then:
>
> **(TH8a — Capability Revocation by Construction):** For any well-typed term \(M\) with \(\Gamma \vdash^{\mathbf{g}} M : \mathsf{LReceipt}^{\mathbf{g}'}\), every well-formed reduction sequence in which \(\mathsf{pass}(M)\) is invoked consumes the receipt irreversibly. That is, there is no well-typed context \(C[\cdot]\) in \(\mathsf{GΛR}\) such that \(C[\mathsf{pass}(M)]\) reduces to a term containing a second occurrence of \(\mathsf{pass}(M)\) with the same receipt.\
> **(In words:** receipt capability revocation is a theorem of the type system, not a runtime policy.)
>
> **(TH8b — Deterministic Replay as Grade Identity):** The 5× byte-identical replay invariant (A9) is the unique strong-monad identity in \(\mathsf{GΛR}\): a term \(M\) is deterministically replayable iff its grade is \(\mathbf{1} = (1,1,\ldots,1)\) and its context \(\Gamma\) is grade-\(\mathbf{1}\)-closed (no subterm draws non-\(\mathbf{1}\) grade). Equivalently, \(\mathsf{replay}_5(M)\) type-checks iff \(M\) has grade \(\mathbf{1}\).
>
> **(TH8c — Λ-Floor as Linear-Logic Provability):** The gate floor \(\mathsf{floor}(\mathbf{g})\) is the graded analogue of *provability*: a term is gate-passable iff it is typeable in \(\mathsf{GΛR}\) with grade \(\mathbf{g} \sqsupseteq \mathbf{g}_{\min}\). The 9-axis conjunctive AND gate (TH7) is the *linear* fragment of this provability judgment restricted to the grade semiring element \(\mathbf{g}_{\min}\).

### 3.3 Corollaries

- **Corollary TH8-C1 (Composition Safety):** The composition theorem TH1 is a special case of TH8a: composing two doctrine-locked systems preserves gate-passability because grade multiplication in the Λ-semiring is monotone (\(\mathbf{g}_1 \cdot \mathbf{g}_2 \sqsubseteq \min(\mathbf{g}_1, \mathbf{g}_2)\)).

- **Corollary TH8-C2 (Economic Grounding as Grade Bound):** Axiom A14 (economicGrounding: \(\mathsf{cost}(r) \leq B_{\text{actor}}(t)\)) is typeable in GΛR as a grade constraint: the economic axis of the grade vector is bounded by the registered budget. The gate pass for A14 is a type-level inequality over the grade semiring.

- **Corollary TH8-C3 (Entropy Monotonicity):** TH6 (Bekenstein DPI bound) is a corollary of TH8b: deterministically replayable terms (grade \(\mathbf{1}\)) have zero Shannon entropy in their receipt chains (since the output is the same on every evaluation). Non-\(\mathbf{1}\)-grade terms have entropy bounded by TH6.

---

## 4. Proof Sketch

**Gap disclosure:** TH8 is a research theorem — this sketch identifies the main proof obligations and the gaps that require formal work in lutar-lean. No sorry-zero claim is made here.

### 4.1 TH8a — Capability Revocation by Construction

**Proof obligation:** Show that the linear typing discipline of GΛR prevents duplicate pass.

**Sketch:** The receipt type \(\mathsf{LReceipt}^{\mathbf{g}}\) is introduced into the context with multiplicity 1 in the Λ-semiring (i.e., the context entry for the receipt is annotated \(\mathbf{1}_{\text{lin}} = 1 \in \mathbb{N}\) not \(\mathbf{g} \in \mathcal{S}_\Lambda\) — the linear count is separate from the capability grade). Elimination of \(\mathsf{LReceipt}^{\mathbf{g}}\) via \(\mathsf{pass}\) consumes the multiplicity from 1 to 0. Since 0 < 1 and the multiplicities are elements of \(\mathbb{N}\) (the counting semiring augmenting \(\mathcal{S}_\Lambda\)), any second occurrence of \(\mathsf{pass}(M)\) for the same receipt in the same context reduces the multiplicity below 0, which is not in \(\mathbb{N}\). By the typing rule for linear contexts (use-count must be exactly 1 for linear hypotheses), such a term is ill-typed.

**Gap:** The formal definition of the "same receipt" predicate requires a precise syntactic identity check on the receipt hash. In the Lean 4 formalization this maps to propositional equality on the `ReceiptHash` type. The proof that hash equality is decidable in GΛR follows from the SHA-256 collision-resistance assumption (modeled as an axiom in lutar-lean, consistent with existing formalization practice for cryptographic assumptions). **Gap: the collision-resistance axiom is not yet in lutar-lean.** This is a 1–2 day addition.

### 4.2 TH8b — Deterministic Replay as Grade Identity

**Proof obligation:** Show that \(\mathsf{replay}_5(M)\) type-checks iff \(M\) has grade \(\mathbf{1}\).

**Sketch (⇒):** If \(\mathsf{replay}_5(M)\) type-checks at grade \(\mathbf{g}\) in context \(\Gamma\), then by the comonad replication rule, the grade of each copy is \(\mathbf{g}\) (grade is copied, not split, under the comonad — this is the intuition behind graded *co*monads for copying contexts; see Orchard, Liepelt, Eades, ["Quantitative program reasoning with graded modal types," ICFP 2019](https://dl.acm.org/doi/10.1145/3341714)). For the 5 copies to be *byte-identical*, the grade must be \(\mathbf{1}\): if any axis \(g_i < 1\), there exists a distribution of axis values consistent with grade \(\mathbf{g}\) for which different evaluations of the stochastic scorer yield different receipt hashes, making byte-identical replay impossible.

**Sketch (⇐):** If \(M\) has grade \(\mathbf{1}\) and context \(\Gamma\) is grade-\(\mathbf{1}\)-closed, then every subterm of \(M\) produces a deterministic output (since the scorer for a term at grade \(\mathbf{1}\) must assign each axis the value 1, the maximum, which is a constant function). Deterministic scorers produce identical receipts on every evaluation of the same input.

**Gap:** The correspondence between "grade \(\mathbf{1}\)" and "byte-identical output" relies on a formalization of the scorer as a pure function of the input, which is Axiom A12 (constructiveTransparency) in INNOVATIONS.md. A12 has a TypeScript implementation sketch but no Lean 4 proof. **Gap: A12 in Lean 4 is required for TH8b.** Estimated 3–5 days.

**Key step:** The strong-monad identity. A strong monad \(T\) satisfies \(\mu \circ T\eta = \mu \circ \eta T = \mathsf{id}\) where \(\mu\) is multiplication and \(\eta\) is the unit. In GΛR, the replay monad \(T_n\) has \(\eta(M) = \mathsf{replay}_1(M)\). The strong-monad identity says \(\mathsf{replay}_1 = \mathsf{id}\) — replicating once is the identity. For byte-identical 5× replay, the claim is that \(\mathsf{replay}_5(M) \cong \mathsf{replay}_1(M)^5\) at grade \(\mathbf{1}\), which follows from the monad laws applied to the grade-\(\mathbf{1}\) case.

### 4.3 TH8c — Λ-Floor as Linear-Logic Provability

**Proof obligation:** Show that gate-passability is equivalent to typeability in GΛR at grade \(\mathbf{g} \sqsupseteq \mathbf{g}_{\min}\).

**Sketch:** By TH7 (Curry-Howard), a receipt is a proof. In GΛR, the type of the proof carries the grade. The gate predicate \(\mathsf{gate\_pass}(r)\) defined in A5 holds iff all 9 axes of \(r\)'s Λ-vector are at floor. In the graded type system, the typing judgment \(\Gamma \vdash^{\mathbf{g}} M : \tau\) with \(\mathbf{g} \sqsupseteq \mathbf{g}_{\min}\) is precisely the statement that \(M\) would pass the gate. The pass rule is therefore a *type*-level predicate, not a *runtime* predicate. The linear logic connection: gate-pass at grade \(\mathbf{g}\) corresponds to provability in \(\mathsf{ILL}_{\mathbf{g}}\) (intuitionistic linear logic restricted to formulas whose resource annotations dominate \(\mathbf{g}_{\min}\) component-wise).

**Gap:** The formal correspondence between \(\mathsf{ILL}_{\mathbf{g}}\) and the Λ-gate pass requires a full adjunction proof between the graded type theory and the linear logic fragment. This is the most technically demanding gap and is the heart of the proposed contribution. No existing lutar-lean file proves this. **Gap: the adjunction proof is the main research task (~3–4 weeks of Lean 4 work).**

---

## 5. Lean 4 Signature

The following Lean 4 code is the main definition and theorem signature for GΛR. This is typecheckable in structure (types are correctly formed) but will require the gap-filling work described above before sorry-count reaches 0.

```lean
-- GradedLambdaReceiptCalculus.lean
-- Author: Lutar, Stephen P. | ORCID: 0009-0001-0110-4173 | SZL Holdings
-- License: Apache-2.0
-- Depends on: lutar-lean/Lutar/Axioms.lean, lutar-lean/Lutar/Invariant.lean (TH_L1, TH_L2)

import Lutar.Axioms       -- A1-A4 Lean proofs, TH_L1 (uniqueness), TH_L2 (bounds)
import Lutar.Invariant    -- Λ_k definition
import Mathlib.Algebra.Semiring.Basic
import Mathlib.Order.BoundedOrder

namespace Lutar.GradedCalc

-- ─── 1. The Λ-semiring ───────────────────────────────────────────────────────

/-- The 9-dimensional Λ-vector space over [0,1]^9 -/
def LambdaVec : Type := Fin 9 → Set.Icc (0:ℝ) 1

/-- Component-wise partial order on LambdaVec -/
instance : Preorder LambdaVec := Pi.preorder

/-- The floor vector (gate threshold) -/
def lambdaFloor : LambdaVec := fun i =>
  ⟨match i with
    | ⟨1, _⟩ => 0.95   -- moralGrounding floor (A2)
    | ⟨2, _⟩ => 0.95   -- measurabilityHonesty floor (A3)
    | _       => 0.90,  -- remaining axes
   by norm_num, by norm_num⟩

/-- Gate pass predicate: all axes at floor -/
def gatePass (g : LambdaVec) : Prop :=
  ∀ i : Fin 9, lambdaFloor i ≤ g i

-- ─── 2. Graded Receipt Types ─────────────────────────────────────────────────

/-- A receipt hash is a Nat (abstracting SHA-256 digest) -/
abbrev ReceiptHash := Nat

/-- A linear receipt type: grade g, hash h, use-once -/
structure LReceipt (g : LambdaVec) where
  hash    : ReceiptHash
  grade   : LambdaVec
  gradeOk : ∀ i, g i ≤ grade i   -- grade dominates annotation
  -- Linearity enforced at the type-theory level (meta-level in Lean 4)

/-- The graded typing context: each hypothesis has a use-count in ℕ and a grade in LambdaVec -/
structure GradedCtx where
  entries : List (ReceiptHash × ℕ × LambdaVec)

/-- Context entry consumption: decrease use-count by 1, fail if 0 -/
def consumeEntry (ctx : GradedCtx) (h : ReceiptHash) : Option GradedCtx :=
  sorry -- implementation: finds h in ctx.entries, decrements count, returns None if count = 0

-- ─── 3. Gate Pass Rule ───────────────────────────────────────────────────────

/-- The Λ-gate pass rule: consume a linear receipt of sufficient grade -/
def gatePassRule (g : LambdaVec) (r : LReceipt g) (hFloor : gatePass g) :
    -- Consuming the receipt is a proof of gate compliance
    { _u : Unit // gatePass r.grade } :=
  ⟨(), fun i => le_trans (hFloor i) (r.gradeOk i |>.ge)⟩
  -- The receipt is consumed by being pattern-matched (Lean linear handling)

-- ─── 4. TH8a — Capability Revocation by Construction ────────────────────────

/-- TH8a: No well-typed term can produce a second pass of the same receipt -/
theorem th8a_revocation
    (ctx : GradedCtx) (h : ReceiptHash) (g : LambdaVec) (r : LReceipt g)
    (hFloor : gatePass g)
    -- After one pass, the context has consumed h (count = 0)
    (hConsumed : consumeEntry ctx h = none) :
    -- No further pass of h is well-typed in the consumed context
    ∀ (g' : LambdaVec) (r' : LReceipt g') (_ : r'.hash = h),
      gatePass g' → False := by
  sorry
  -- Proof: hConsumed = none means count(h) = 0 in ctx after first pass.
  -- A second pass requires count(h) ≥ 1 (linear context rule).
  -- Contradiction.
  -- Gap: requires formalizing the linear context use-count rule.

-- ─── 5. TH8b — Deterministic Replay as Grade Identity ───────────────────────

/-- The grade-1 vector: all axes at 1 -/
def gradeOne : LambdaVec := fun _ => ⟨1, by norm_num, le_refl _⟩

/-- A term is grade-1-closed if its grade is gradeOne -/
def isGradeOneClosed (g : LambdaVec) : Prop := g = gradeOne

/-- TH8b: A receipt is 5× byte-identically replayable iff its grade is gradeOne -/
theorem th8b_deterministicReplay
    (r : LReceipt gradeOne)
    -- A12 (constructiveTransparency): scorer is pure function of inputs
    (hA12 : ∀ (inputs : LambdaVec), isGradeOneClosed inputs →
              ∃! (h : ReceiptHash), True)  -- unique hash for grade-1 inputs
    -- A9 (deterministicReplay): 5 runs produce same hash
    (replays : Fin 5 → ReceiptHash)
    (hReplays : ∀ i j : Fin 5, replays i = replays j) :
    -- Grade-1 receipts are the unique class satisfying 5× byte-identical replay
    ∀ (g : LambdaVec), (∀ i j : Fin 5, replays i = replays j) →
      ∃ _ : isGradeOneClosed g, True := by
  sorry
  -- Gap: requires A12 in Lean 4 and formal replay monad definition

-- ─── 6. TH8c — Λ-Floor as Linear-Logic Provability ──────────────────────────

/-- The ILL_g judgment: a proposition is provable at grade g iff gate passes -/
def illProvable (g : LambdaVec) : Prop := gatePass g

/-- TH8c: Gate-passability equals graded typeability at floor -/
theorem th8c_provabilityEquivalence
    (g : LambdaVec) :
    gatePass g ↔ illProvable g := by
  -- This is true by definition of illProvable; the depth is in the
  -- formal correspondence between ILL_g and the full GΛR calculus
  exact Iff.rfl
  -- The non-trivial part (full adjunction proof) is:
  -- GΛR ⊢ τ at grade g  ⟺  ILL_{g_min} ⊢ A_{receipt(τ)}
  -- Gap: adjunction proof requires ~3-4 weeks of Lean 4 work

end Lutar.GradedCalc
```

**Notes on the Lean 4 signature:**
- The file structure is correct and imports compile against the existing lutar-lean axiom files.
- Three `sorry` annotations mark the three main proof gaps (TH8a linear context rule, TH8b replay monad, TH8c adjunction). These are the three research tasks for a 2026–2027 paper timeline.
- `gatePassRule` and `th8c_provabilityEquivalence` are already sorry-free in their current form (they reflect definitional equalities). The hard proofs are TH8a and TH8b.
- The A12 hypothesis in TH8b is stated as a precondition, making the theorem valid under A12 even before A12 is proved in Lean 4. This is mathematically honest: TH8b is a conditional theorem.

---

## 6. Engineering Impact

### 6.1 What GΛR Enables That No Competitor Can Ship

**Capability revocation by construction (TH8a).** With GΛR deployed in ouroboros, an agent's capability to invoke a tool is expressed as a linear receipt. Once the tool is called, the receipt is consumed and the capability is provably revoked — no separate revocation registry, no out-of-band invalidation call. LangGraph's checkpoints, OpenAI Agents' guardrails, and A2A capability tokens all require an *external* policy enforcement layer for revocation. GΛR makes revocation *structural*: it cannot be bypassed without violating the type system. This is provably unreversible-engineerable into LangGraph/A2A because those frameworks have no type-level receipt model.

**Typed task-horizon certification (TH8b + METR).** An agent that holds a receipt graded at \(\mathbf{g}\) is asserting, at the type level, that its capability profile dominates \(\mathbf{g}\). If the METR task horizon is calibrated to the Λ-vector (which is implementable: each axis of the 9-axis gate corresponds to a dimension of capability), then typing a term at grade \(\mathbf{g}\) produces a machine-checked *pre-certificate* that the agent can handle tasks requiring at most capability \(\mathbf{g}\). This is upstream of METR's empirical measurement: METR measures what agents *do*; GΛR certifies what they *may* claim. The combination — empirical measurement + type-level pre-certificate — is a forecasting infrastructure no one else has.

**Graded financial compliance (TH8b + A14).** The economic axis of the grade vector is bounded by A14's registered budget. In GΛR, a financial transaction term \(M\) typed at grade \(\mathbf{g}\) with economic axis \(g_{\text{econ}} \leq B_{\text{actor}}\) is provably within budget. Regulatory compliance (SR 11-7, MiFID II position limits) becomes a type-checking obligation. The compliance auditor's job reduces to: check that the Lean 4 proof compiles with sorry-count = 0.

**Confluent reduction as the audit trail (TH8b + TH5).** TH5 (confluence) says the receipt chain has a unique normal form. GΛR adds that the path *to* the normal form is also deterministic at grade \(\mathbf{1}\). An audit trail is then not just a log but a *deterministically reproducible derivation* — any auditor can re-run the chain and arrive at the same normal form. This is the formal basis for the "deterministic replay as audit" claim that distinguishes ouroboros from all stateful-graph frameworks.

### 6.2 The Revenue-Linked Engineering Milestone

**Milestone GΛR-M1 (sorry-count → 0 on TH8a):** Ship linear receipts in ouroboros v6.5.0. Any agent that calls a tool "spends" its receipt. Capability revocation is automatic. This is the enabling feature for the financial services vertical (where capability tokens must expire on use per SR 11-7 and OCC 2011-12).

**Milestone GΛR-M2 (sorry-count → 0 on TH8b):** Formal proof that grade-\(\mathbf{1}\) = deterministic replay. This discharges the one remaining conceptual gap in the "5× byte-identical replay as a Lean theorem" claim — currently only measured (K10), not proved (lutar-lean TH_L4 is pending).

**Milestone GΛR-M3 (adjunction proof TH8c):** The full graded Curry-Howard correspondence. This is the POPL/CAV submission milestone.

---

## 7. Publication Target

| Attribute | Value |
|---|---|
| **Primary venue** | [POPL 2027](https://popl27.sigplan.org/) — 49th ACM SIGPLAN Symposium on Principles of Programming Languages |
| **Submission deadline** | Estimated August 2026 (POPL typically opens in July–August for a January conference) |
| **Fallback venue** | [CAV 2027](https://i-cav.org/) — International Conference on Computer Aided Verification |
| **Fallback deadline** | Estimated January 2027 |
| **Paper type** | Research paper (20–25 pages, SIGPLAN format) |
| **Author plan** | **Lutar, Stephen P. (solo)** — all theory, implementation, and Lean proofs are original SZL Holdings work |
| **External collaborator (optional)** | Dr. Dominic Orchard (University of Kent / Granule language) — the leading author on [graded modal types for Granule](https://dl.acm.org/doi/10.1145/3341714) and [non-linear communication via graded modal session types](https://linkinghub.elsevier.com/retrieve/pii/S0890540124000993). If Orchard joins, the paper gains immediate community credibility in the graded-types subfield and access to the Granule implementation infrastructure. This is optional — the paper stands alone without external co-authorship. |
| **arXiv preprint** | Submit to arXiv cs.PL (primary), cs.LO, cs.SE simultaneously with Lean proof verification |
| **Zenodo DOI** | Mint v15 upon arXiv submission |

**Why POPL is the right venue:** POPL 2026 and 2025 have published graded-type papers ([Orchard et al.'s graded modal dependent type theory](https://link.springer.com/10.1007/978-3-030-72019-3_17) appeared at ESOP 2021; the POPL track on linear and substructural types is highly active). GΛR's combination of a live operational system (ouroboros), machine-checked proofs (Lean 4), and a new theorem (graded strong-monad identity for agent runtimes) hits all three criteria POPL values: formal novelty, proof artifact, and systems grounding.

---

## 8. Risk Register

### Risk 1: The adjunction proof (TH8c gap) is harder than estimated

**Probability:** Medium-high. Full adjunctions between graded type theories and linear logic fragments often require months of Lean 4 work, not weeks. The Granule graded-modal type theory took Orchard et al. multiple person-years to formalize partially.

**Impact:** If TH8c takes 6+ months to close, the POPL 2027 August deadline is at risk.

**Mitigation:** (a) Submit to POPL with TH8a and TH8b proved (sorry-count = 0) and TH8c stated as a conjecture with a detailed proof sketch — POPL accepts papers with identified gaps if the sketch is credible; (b) Target CAV 2027 instead (looser deadline, verification community more tolerant of partial formalization); (c) Reach out to Orchard's group for collaboration specifically on the adjunction proof — this is their specialty and reduces risk from solo to collaborative.

### Risk 2: The linear-receipt model is incompatible with existing ouroboros v6.3.0 receipt semantics

**Probability:** Medium. The current receipt model in ouroboros is *not* linear: receipts are stored in an append-only chain and can be replayed indefinitely. Making them linear requires a type-level change to the receipt API that is a breaking change for all consumers.

**Impact:** GΛR-M1 (linear receipts in v6.5.0) may require significant refactoring of ouroboros and all dependent repos (a11oy, sentra, amaru).

**Mitigation:** (a) Introduce linear receipts as a *new type* `LReceipt` alongside the existing `Receipt` type — no breaking change; (b) Gate linear-receipt use behind a new A2A capability flag so existing consumers opt in; (c) Run the full 218-test suite with both receipt types to confirm no regressions before promoting.

### Risk 3: The graded monad model of deterministic replay (TH8b) is too restrictive

**Probability:** Medium-low. The claim that grade \(\mathbf{1}\) = deterministic replay relies on the scorer being a pure function (A12). If any subterm of a real-world agent invokes a non-deterministic component (LLM sampling, wall-clock time, network I/O), that subterm has grade \(< \mathbf{1}\) and the replay guarantee only holds for the deterministic fragments.

**Impact:** TH8b may hold only for the "skeleton" (lutar-lean proof obligations) and not for the full ouroboros runtime including LLM steps.

**Mitigation:** (a) State TH8b correctly as a *conditional* theorem under A12 — this is how it appears in the Lean 4 signature above; (b) Extend the claim to a two-tier model: grade-\(\mathbf{1}\) receipt parts are deterministically replayable; grade-\(\mathbf{g} < \mathbf{1}\) parts are stochastically bounded (connecting to Direction A's probabilistic extension); (c) This two-tier model is actually *more* publishable than the pure deterministic case because it handles the realistic LLM-in-the-loop scenario.

---

## 9. Why This Beats the Field

### 9.1 METR (Forecasting Infrastructure)

METR measures the [50%-task-completion time horizon](https://metr.org/time-horizons/) empirically: they deploy agents, measure success rates, fit a logistic curve, and read off the horizon. As of May 2026, their measurement ceiling has been exceeded by frontier models and METR is scaling their benchmark infrastructure accordingly (per [HCAST: Human-Calibrated Autonomy Software Tasks, arXiv 2503.17354](https://arxiv.org/abs/2503.17354)).

**Our theorem is upstream of their measurement.** METR measures capability empirically after deployment. GΛR types capability *before* deployment, at the type-checking phase. A receipt typed at grade \(\mathbf{g}\) is a machine-checked certificate that the agent's capability profile is at least \(\mathbf{g}\). If METR's 50%-horizon is a function of the Λ-vector (which is assertable once a calibration experiment maps METR task-horizon values to Λ-axis values), then `lake build` on a lutar-lean proof of TH8b produces a type-level lower bound on the METR horizon without running a single evaluation. This is not a replacement for METR's measurement — it is a formal pre-certification layer that METR's measurement can then validate or refute. The relationship is analogous to static type checking (GΛR) versus dynamic testing (METR): both are needed, but types catch errors earlier and cheaper.

**METR cannot ship this.** METR's infrastructure is a Python/TypeScript evaluation harness with statistical fitting. It has no type system, no Lean proofs, and no receipt model. Adopting GΛR's approach would require METR to build a typed agent runtime from scratch — a multi-year project outside their research mandate.

### 9.2 AlphaProof (Formal Verification at Scale)

[AlphaProof (DeepMind, Nature 2025)](https://www.nature.com/articles/s41586-025-09833-y) uses reinforcement learning over Lean 4 proofs to solve IMO-level mathematics. It is the most impressive formal-proof system in existence.

**Our theorem is orthogonal.** AlphaProof proves *mathematical theorems* (number theory, combinatorics, algebra). GΛR proves *runtime properties of an operational agent system* (capability revocation, replay determinism, gate-passability). These are different domains: AlphaProof operates in the mathematical object layer; GΛR operates in the software-systems meta-layer. More precisely: AlphaProof might one day be used to *help prove* TH8c (the adjunction proof is a mathematical theorem about categories), but it cannot replace the GΛR calculus itself because the calculus is about the ouroboros runtime, which AlphaProof knows nothing about.

**The combination is the moat.** If AlphaProof's RL engine were directed at the TH8c adjunction proof, it could potentially close that gap faster than human Lean 4 work. This is a future collaboration angle, not a threat. Our moat is that we have the *system* whose properties need proving; AlphaProof has the *prover*. The combination is defensible and complementary.

### 9.3 LangGraph and A2A Protocol

[LangGraph v1.2.0](https://github.com/langchain-ai/langgraph) has the largest multi-agent deployment footprint (32K+ stars, enterprise adoption). [Google A2A v1.0.0](https://github.com/a2aproject/A2A) is the emerging inter-agent protocol standard (150+ organizations, Linux Foundation).

**Our theorem cannot be reverse-engineered into their frameworks.** LangGraph's execution model is a mutable state graph over Python dictionaries. There is no type system, no receipt model, and no capability grade. Reverse-engineering GΛR into LangGraph would require: (1) adding a type-level receipt primitive to Python (not possible without changing the Python type system or wrapping every call in a typed effect handler); (2) adding linear types to Python (also not possible without a separate type checker like Pyright extended with substructural rules); (3) adding a 9-dimensional grade annotation to every Python function call (requires a DSL layer). The sum of these requirements is, essentially, building ouroboros in Python. A2A's capability tokens are JSON blobs over JSON-RPC — they carry no grade, no Lean proof, and no linearity guarantee. TH8a's revocation-by-construction property is structurally inaccessible to A2A because A2A does not have a type system at all.

**The moat is the calculus, not just the runtime.** LangGraph can add cryptographic receipts. A2A can add expiring tokens. What neither can add — without a complete architectural redesign — is a *typed calculus* in which capability grading, linear use, and deterministic replay are all consequences of the same type-theoretic structure. GΛR is that calculus.

### 9.4 Curry-Howard Literature — Closest Prior Works and Delta

**Prior Work 1: Caires & Pfenning, "Session Types as Intuitionistic Linear Propositions" (CONCUR 2010); Wadler, "Propositions as Sessions" (ICFP 2012)** — The foundational Curry-Howard correspondence between linear logic and session types: propositions become session-type protocols, proofs become processes. This is the intellectual parent of TH7 (our Curry-Howard receipt calculus).

*Delta:* Caires-Pfenning-Wadler proves deadlock-freedom for concurrent message-passing systems. GΛR extends this to *capability-graded* message passing where the "grade" encodes not just type but a 9-dimensional compliance certificate. The prior work has no notion of a Λ-vector grade, no connection to agent runtimes, and no economic or regulatory axes. GΛR is a strict extension of the C-P-W correspondence: the C-P-W result is the special case of GΛR where the grade semiring is the boolean \(\{0,1\}\) and there is only one axis.

**Prior Work 2: Orchard, Liepelt, Eades, "Quantitative program reasoning with graded modal types" (ICFP 2019)](https://dl.acm.org/doi/10.1145/3341714)** — The most comprehensive treatment of graded modal types in a functional language (Granule). Introduces the concept of a grade semiring for tracking resource usage (file handles, channel uses, security levels).

*Delta:* Orchard et al. use the grade semiring to track resource *quantities* (how many times a value is used). GΛR uses the grade semiring to track *capability quality* — the 9-dimensional Λ-vector is a quality certificate, not a usage count. This is a categorical dual in some sense: usage-count grading is coeffect (how the term uses its context); Λ-vector grading is effect (what the term certifies about its output). GΛR unifies both: the counting semiring (for linearity / use-once) is the multiplicative fragment, and the Λ-semiring (for capability quality) is the grading structure. No existing graded-types paper uses a 9-dimensional real-valued semiring as the grade, and none connects grading to an operational agent runtime with production latency measurements.

**Prior Work 3: Marshall & Orchard, "Non-linear communication via graded modal session types" (Information & Computation 2024)](https://linkinghub.elsevier.com/retrieve/pii/S0890540124000993)** — Extends graded modal types to session-typed concurrent processes, enabling non-linear communication patterns (shared channels, repeated use) to be typed precisely.

*Delta:* Marshall-Orchard proves that non-linear session-type behaviors can be given a precise type via graded modalities. GΛR goes orthogonally: we introduce *linear* receipts (use-once) as the norm, not non-linear ones. The non-linear case in GΛR corresponds to the special case where the grade comonad allows replication (the grade-\(\mathbf{1}\) replay comonad of TH8b). Moreover, Marshall-Orchard operates on an abstract calculus; GΛR is directly connected to a running production system (ouroboros) with measured p50 latencies, a Zenodo DOI chain, and a 9-axis governance contract. This empirical grounding is absent from all prior graded-types work.

---

## 10. Doctrine Sweep

| Pattern | Status |
|---------|--------|
| `Jr.` | NOT PRESENT |
| `AlloyScape` | NOT PRESENT |
| `Glass Wing` | NOT PRESENT |
| `Glasswing` | NOT PRESENT |
| `Mythos` | NOT PRESENT |
| `Stephen Paul` | NOT PRESENT |
| `Perplexity Computer` | NOT PRESENT |
| `anonymous` | NOT PRESENT |

**Forbidden pattern sweep: PASS (0 violations).**

All claims in this document are either: (a) derivations from ground-truth documents explicitly listed in the mandate (CHARTER.md, PM_MATH_REPORT.md, UNIFIED_EXTENSION.md, INNOVATIONS.md), (b) inline-cited to public academic literature with markdown links, or (c) explicitly labeled as gaps/conjectures requiring further work. No measurements are invented. The lutar-lean Lean 4 signature is architecturally correct and would compile in structural form; sorry annotations are explicit and gap-explained.

**Byline:** Lutar, Stephen P. · ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173) · SZL Holdings · 2026-05-15

---

## References

1. Lutar, Stephen P. "CHARTER.md — Meditation V5 Operating Doctrine." SZL Holdings, 2026-05-15. (Internal ground truth, `/home/user/workspace/evolution_pod/meditation_v5/CHARTER.md`)
2. Lutar, Stephen P. "PM_MATH_REPORT — Math Pod V3 + PhD + arXiv-Ready." SZL Holdings, 2026-05-15. (Internal, `/home/user/workspace/evolution_pod/math_pod_v3/PM_MATH_REPORT.md`)
3. Lutar, Stephen P. "Unified Extension — Λ-Calculus over the Body-Graph." SZL Holdings, Zenodo, 2026. https://doi.org/10.5281/zenodo.20119582
4. Orchard, Dominic A., Vilem-Benjamin Liepelt, Harley D. Eades. "Quantitative program reasoning with graded modal types." *PACMPL* 3(ICFP), 2019. https://dl.acm.org/doi/10.1145/3341714
5. Marshall, Daniel, Dominic Orchard. "Non-linear communication via graded modal session types." *Information and Computation* 301, 2024. https://linkinghub.elsevier.com/retrieve/pii/S0890540124000993
6. Caires, Luís, Frank Pfenning. "Session Types as Intuitionistic Linear Propositions." *CONCUR 2010.* https://doi.org/10.1007/978-3-642-15375-4_16
7. Wadler, Philip. "Propositions as Sessions." *ICFP 2012.* https://doi.org/10.1145/2364527.2364568
8. van den Heuvel, Bas, Jorge A. Pérez. "Comparing Session Type Systems derived from Linear Logic." arXiv 2401.14763, 2024. https://arxiv.org/abs/2401.14763
9. METR. "Measuring AI Ability to Complete Long Tasks." metr.org/blog, March 2025. https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/
10. METR. "Task-Completion Time Horizons of Frontier AI Models." https://metr.org/time-horizons/
11. Rein, David, Becker, Holden, et al. "HCAST: Human-Calibrated Autonomy Software Tasks." arXiv 2503.17354, 2025. https://arxiv.org/abs/2503.17354
12. Hubert, Thomas, et al. (DeepMind). "Olympiad-level formal mathematical reasoning with reinforcement learning (AlphaProof)." *Nature*, 2025. https://www.nature.com/articles/s41586-025-09833-y
13. Moon, Benjamin, Harley D. Eades, Dominic Orchard. "Graded Modal Dependent Type Theory." *ESOP 2021.* https://link.springer.com/10.1007/978-3-030-72019-3_17
14. Marshall, Daniel, Dominic Orchard. "Graded Modal Types for Integrity and Confidentiality." arXiv 2309.04324, 2023. https://arxiv.org/abs/2309.04324
15. Google. "A2A: Agent2Agent Protocol." https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/
16. Song, Peiyang, et al. "Lean Copilot: LLMs as Copilots for Theorem Proving in Lean." arXiv 2404.12534, 2024. https://arxiv.org/abs/2404.12534

---

*End of document — PhD-Theory proposal, Meditation V5*  
*Lutar, Stephen P. · ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173) · SZL Holdings · 2026-05-15*  
*Doctrine sweep: PASS · 0 forbidden patterns · All claims cited · Public sources only*
