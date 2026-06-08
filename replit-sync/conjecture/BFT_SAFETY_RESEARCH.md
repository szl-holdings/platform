# BFT SAFETY RESEARCH — weakest checkable hypothesis for Khipu quorum safety (Conjecture 2)
# Phase B deliverable. CTO formal-methods program. main @ da013be5. 2026-06-08.
# Doctrine: this research informs a CONDITIONAL safety theorem. It does NOT claim unconditional BFT safety.

## 0. The question
What is the WEAKEST CHECKABLE HYPOTHESIS under which Khipu quorum safety (`ubuntu_quorum_safety`,
Conjecture 2) becomes a THEOREM — analogous to how slice-multiplicativity unlocked conditional Λ?

## 1. The canonical BFT safety statement = AGREEMENT (no split-brain)
Every classical BFT protocol's *safety* reduces to **agreement**:

> AGREEMENT: if one correct (honest) node decides v₁ and another decides v₂, then v₁ = v₂.

This is the formal definition used in Tendermint's correctness proof
([Buchman 2016 MSc thesis, §2](https://knowen-production.s3.amazonaws.com/uploads/attachment/file/1814/Buchman_Ethan_201606_Msater+thesis.pdf):
"agreement — if one correct process decides v1 and another decides v2, then v1 = v2") and is the
property machine-checked in the Velisarios Coq PBFT formalization
([Rahli et al., "Velisarios: Byzantine Fault-Tolerant Protocols Powered by Coq", ESOP 2018](https://vrahli.github.io/articles/velisarios.pdf):
"we proved the crux of this property, namely the agreement property"). PBFT safety "boils down to
linearizability… whose crux is agreement."

## 2. The load-bearing lemma: QUORUM INTERSECTION under n ≥ 3f+1
The single mathematical fact every PBFT-style safety proof rests on:

> QUORUM-INTERSECTION: with n replicas, ≤ f Byzantine, and n ≥ 3f+1, any two quorums of size
> ≥ n−f (= 2f+1 when n=3f+1) intersect in ≥ f+1 replicas; since ≤ f are faulty, the intersection
> contains AT LEAST ONE HONEST replica.

Confirmed verbatim across the canonical sources:
- **PBFT / Castro–Liskov (1999)**: quorums of size 2f+1; "two quorums will intersect in f+1
  replicas… guarantees the quorums always intersect in at least one non-faulty replica"
  ([Liskov, MIT EECS colloquium 2001 transcript](https://infinite.mit.edu/video/barbara-liskov-%E2%80%9Cpractical-byzantine-fault-tolerance%E2%80%9D-mit-eecs-colloquium-1232001/)).
  The agreement crux: "you can never get two prepared certificates with the same view and sequence
  number for different requests… the two quorums intersect in at least one correct replica, and
  that replica would have had to send prepare for two distinct requests, which it does not do"
  ([PBFT lecture transcript](https://www.youtube.com/watch?v=Q0xYCN-rvUs)).
- **The n=3f+1 table** ([Cube, "What is PBFT", 2026](https://www.cube.exchange/what-is/pbft-practical-byzantine-fault-tolerance)):
  PBFT n=3f+1 → quorum 2f+1 → honest overlap ≥ f+1 → "Conflicting commits impossible"; n ≤ 3f →
  honest overlap ≤ f → "Conflicting commits possible." "Byzantine behavior cannot gather enough
  intersecting support to make two conflicting values both look committed to honest nodes."
- **Tendermint / HotStuff (stake-weighted)**: same intersection argument in voting power — "if less
  than one-third of the voting power is Byzantine, two conflicting commits cannot both gather the
  required two-thirds majority without at least one-third equivocation"
  ([Cube, "What is BFT Consensus", 2026](https://www.cube.exchange/what-is/bft-consensus)).
- **PSL impossibility (n ≤ 3f)**: Byzantine agreement is impossible for n ≤ 3f
  ([Lamport–Shostak–Pease, "The Byzantine Generals Problem", ACM TOPLAS 4(3), 1982](https://doi.org/10.1145/357172.357176);
  Fischer–Lynch–Merritt 1985). This is WHY unconditional safety without n>3f is FALSE — it bounds
  the conditional theorem and matches `Lutar/Wave8/Byzantine.lean`'s `byzantine_impossibility_3_1`.

**STATUS IN-TREE: this lemma is ALREADY PROVEN sorry-free** as
`Lutar.Round12.AyniQuorum.quorum_intersection_honest` (`(Q₁∩Q₂).card > f` from `n ≥ 3f+1`,
`|Qᵢ| ≥ n−f`, via `Finset.card_union_add_card_inter` + `omega`). The combinatorial half is DONE.

## 3. The MISSING input = HONEST NON-EQUIVOCATION (the "slice-multiplicativity" of BFT)
Quorum intersection gives you an honest organ in Q₁∩Q₂. To finish agreement you need that this
honest organ did NOT vote for two different values. That is **non-equivocation of honest nodes**:

> H_NE: ∀ honest organ o, ∀ a b, (o votes a) → (o votes b) → a = b.

This is THE irreducible hypothesis. Every BFT safety proof assumes it as the definition of an honest
node, and at RUNTIME it is enforced by **signed votes**: an honest replica produces at most one
signed (view, seq, value) message per round; signatures make votes attributable and non-forgeable
([Cube BFT, "Signed messages… signed votes are attributable"](https://www.cube.exchange/what-is/bft-consensus);
PBFT "Assume public key cryptography (signatures). All messages are signed"
([UIUC ECE498AC slides](https://soc1024.ece.illinois.edu/teaching/ece498ac/fall2019/2019_11_ECE542_498AM.pptx))).
Crucially: **the cryptography only enforces H_NE for honest nodes** — "The cryptography's role is
narrower: it prevents faulty replicas from forging support they do not have"
([Cube PBFT](https://www.cube.exchange/what-is/pbft-practical-byzantine-fault-tolerance)). A
Byzantine node CAN equivocate (sign two conflicting votes) — Fig 2.2 in Buchman shows process C
telling A and B different things. So the honest model is NOT a global single-valued function; it is
a RELATION where only honest nodes are single-valued.

### Why H_NE is the *weakest* checkable hypothesis (the sharp boundary)
- Drop n ≥ 3f+1 → quorum intersection ≤ f → the intersection can be ALL faulty → split-brain
  possible (PSL impossibility, n ≤ 3f). Unconditional safety is FALSE here — matches the conjecture.
- Drop H_NE → an honest organ in the intersection could itself equivocate → v₁ ≠ v₂ possible.
- H_NE is CHECKABLE: it is exactly the signature-verification predicate already modeled by
  `verifies` / `consents` in `Lutar/KhipuConsensus.lean` (one valid signed allow-vote per honest
  organ per action). It is the BFT analog of slice-multiplicativity: the cryptographic Cauchy-type
  input the bare conjecture lacks.

## 4. THE EXACT WAVE23 SAFETY STATEMENT (conditional, axiom-clean target)
Model (relation-based, allows Byzantine equivocation):
- `n : ℕ`, `f : ℕ`, charter `hn : n ≥ 3*f + 1`.
- `faulty : Finset (Fin n)`, `hf : faulty.card ≤ f`. An organ is honest iff `o ∉ faulty`.
- `votes : Fin n → Verdict → Prop` — a RELATION (a Byzantine `o ∈ faulty` may satisfy
  `votes o a ∧ votes o b` with `a ≠ b`; an honest `o` may not — see H_NE).
- H_NE: `hHonestNE : ∀ o, o ∉ faulty → ∀ a b, votes o a → votes o b → a = b`.
- Quorums `Q₁ Q₂ : Finset (Fin n)`, `hq₁ : Q₁.card ≥ n - f`, `hq₂ : Q₂.card ≥ n - f`.
- Certification: `hv₁ : ∀ o ∈ Q₁, votes o v₁`, `hv₂ : ∀ o ∈ Q₂, votes o v₂`.

**THEOREM (conditional Khipu BFT safety / agreement):** under the above, `v₁ = v₂`.

**Proof skeleton (all Mathlib v4.18.0 + in-tree):**
1. `quorum_intersection_honest f hn Q₁ Q₂ hq₁ hq₂ : (Q₁ ∩ Q₂).card > f`  (in-tree, sorry-free).
2. Honest witness extraction: `(Q₁∩Q₂).card > f ≥ faulty.card`, so `Q₁∩Q₂ ⊄ faulty`, hence
   `∃ o ∈ Q₁∩Q₂, o ∉ faulty`. Lemma: from `faulty.card < (Q₁∩Q₂).card` get
   `¬ (Q₁∩Q₂) ⊆ faulty` via `Finset.card_le_card` (contrapositive), then `Finset.not_subset` gives
   the witness `o ∈ Q₁∩Q₂ ∧ o ∉ faulty`. (This is the step the old `sorry` deferred.)
3. `o ∈ Q₁∩Q₂` ⟹ `o ∈ Q₁ ∧ o ∈ Q₂` (`Finset.mem_inter`), so `votes o v₁` (hv₁) and `votes o v₂`
   (hv₂).
4. `o ∉ faulty` + H_NE ⟹ `v₁ = v₂`. ∎

This DISCHARGES the exact residual named in `Identity_Ayni_Quorum.lean` ("non-faulty-witness
extraction + HONEST_ORGAN_SINGLE_VALUED") — but now H_NE is an EXPLICIT, checkable HYPOTHESIS
(realized by signatures), not a global axiom. Result is CONDITIONAL, exactly like conditional-Λ.

## 5. Mathlib v4.18.0 lemmas needed
- `Finset.card_union_add_card_inter` (inclusion–exclusion) — already used in tree.
- `Finset.card_le_card : s ⊆ t → s.card ≤ t.card`.
- `Finset.not_subset : ¬ s ⊆ t ↔ ∃ a ∈ s, a ∉ t`.
- `Finset.mem_inter : a ∈ s ∩ t ↔ a ∈ s ∧ a ∈ t`.
- `Finset.subset_univ`, `Finset.card_univ` / `Fintype.card_fin` — for the universe-bound (in tree).
- `omega` / `Nat` order — arithmetic closure.
All present in Mathlib v4.18.0 `Mathlib.Data.Finset.Card` / `Mathlib.Data.Finset.Basic`.

## 6. The HONEST RESIDUAL (what stays open after Wave23)
- **Unconditional BFT safety stays Conjecture 2.** Without H_NE an honest organ could equivocate;
  without n≥3f+1 quorums need not honestly intersect (PSL impossibility). Both are necessary; neither
  can be dropped — this is the sharp boundary, mirroring slice-multiplicativity for Λ.
- The `opaque canonicalHistory` form (`KhipuConsensus.khipu_consensus_safety`) is NOT addressed: an
  opaque predicate cannot be derived. We do not touch the locked kernel file. Wave23 proves the
  AGREEMENT (no-split-brain) safety property — the actual content every BFT safety proof verifies —
  on an explicit relation model, which is the honest and standard formalization.
- LIVENESS (Conjecture 3) untouched.

## 7. Authoritative citations (real, with URLs)
- Lamport, Shostak, Pease, "The Byzantine Generals Problem", ACM TOPLAS 4(3):382–401, 1982.
  https://doi.org/10.1145/357172.357176  (n>3f necessity; oral-messages bound).
- Castro & Liskov, "Practical Byzantine Fault Tolerance", OSDI 1999; Liskov MIT colloquium 2001.
  https://infinite.mit.edu/video/barbara-liskov-%E2%80%9Cpractical-byzantine-fault-tolerance%E2%80%9D-mit-eecs-colloquium-1232001/
- Rahli, Vukotic, Völp, Esteves-Verissimo, "Velisarios: Byzantine Fault-Tolerant Protocols Powered
  by Coq", ESOP 2018. https://vrahli.github.io/articles/velisarios.pdf  (machine-checked PBFT
  agreement; the safety crux we mirror).
- Buchman, "Tendermint: Byzantine Fault Tolerance in the Age of Blockchains", MSc thesis, 2016, §2–3
  (agreement definition; safety = no two conflicting logs).
  https://knowen-production.s3.amazonaws.com/uploads/attachment/file/1814/Buchman_Ethan_201606_Msater+thesis.pdf
- Yin et al., "HotStuff: BFT Consensus with Linearity and Responsiveness", PODC 2019 (QC of n−f
  signatures; intersection across views).
- Cube Exchange, "What Is PBFT" / "What is BFT Consensus", 2026 (clear quorum-intersection tables).
  https://www.cube.exchange/what-is/pbft-practical-byzantine-fault-tolerance ·
  https://www.cube.exchange/what-is/bft-consensus
- Howard, Malkhi, Spiegelman, "Flexible Paxos: Quorum Intersection Revisited", OPODIS 2016
  https://drops.dagstuhl.de/opus/volltexte/2017/7094/  (quorum-intersection generality).

Signed-off-by: SZL CTO <cto@szl-holdings.com>
