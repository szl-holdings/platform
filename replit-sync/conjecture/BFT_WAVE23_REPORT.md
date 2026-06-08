# LEAN WAVE23 — Conditional Khipu BFT SAFETY (agreement / no split-brain)

**Branch:** `wave23-bft-safety` (off `main` @ `da013be5`)
**PR:** [#214](https://github.com/szl-holdings/lutar-lean/pull/214) — OPEN, base `main`, **NOT merged** (parent/founder verifies + merges)
**Head commit:** `36c8abcf`
**Toolchain:** `leanprover/lean4:v4.18.0` · Mathlib v4.18.0 · verified with LOCAL `lake build` (EXIT 0)
**Date:** 2026-06-08

---

## Headline verdict

> **The "last formula" (CUT-1 / Λ) is DONE — Wave22 (PR #212) is MERGED on `main` @ da013be5.**
> CUT-1 is fully closed on its stated hypotheses; conditional Λ is at its sharpest reachable form.
> Λ UNCONDITIONAL uniqueness STAYS **Conjecture 1** (machine-checked FALSE). No new honest
> unconditional motion exists there — it is at the sharp boundary inside the separable family.

> **The open conjecture worth attacking = Khipu BFT SAFETY (Conjecture 2). Wave23 proves it
> CONDITIONALLY, axiom-clean.**

> **UNCONDITIONAL BFT safety STAYS Conjecture 2.** A Byzantine organ can equivocate; `n ≤ 3f`
> is impossible (Lamport–Shostak–Pease, formalized in `Lutar/Wave8/Byzantine.lean`). We did
> **NOT** attempt the false unconditional statement.

Exactly as Wave22 identified **slice-multiplicativity** as the weakest checkable hypothesis that
turns Λ-uniqueness from FALSE-unconditional into a CONDITIONAL theorem, Wave23 identifies the
weakest checkable hypothesis that turns Khipu quorum safety into a THEOREM: **honest
non-equivocation under signed votes** — the BFT analog of slice-multiplicativity.

---

## 1. What was proven — `Lutar/Wave23/QuorumSafety.lean` (5 declarations, all axiom-clean)

### The honest model (allows Byzantine equivocation)
Votes are a **RELATION** `votes : Fin n → Verdict → Prop`, NOT a total function. A faulty organ
`o ∈ faulty` MAY satisfy `votes o a ∧ votes o b` with `a ≠ b` (equivocation — the essence of a
Byzantine fault). This is strictly more general than the Wave13 `quorum_agreement_single_valued_vote`
shadow, which used a total `voteOf : Fin n → Verdict` and therefore could not even REPRESENT
equivocation (Wave13 itself flags this gap and states it is "strictly weaker than `ubuntu_quorum_safety`").

The single checkable hypothesis added, realized at runtime by ECDSA-P256 cosignatures (one valid
signed allow-vote per honest organ per action — exactly `verifies`/`consents` in `KhipuConsensus.lean`):

```
HonestNonEquivocation faulty votes  :=  ∀ o, o ∉ faulty → ∀ a b, votes o a → votes o b → a = b
```

### Declarations
- **`exists_honest_of_card_gt`** — from `faulty.card < S.card` extract `∃ o ∈ S, o ∉ faulty`.
  (Mathlib `Finset.not_subset` + `Finset.card_le_card` + `omega`.) **DISCHARGES** the
  non-faulty-witness step that both the kernel `KhipuConsensus.khipu_consensus_safety` and the
  Round12 `AyniQuorum.ubuntu_quorum_safety` left as a proof-deferred `sorry`.
- **`exists_honest_in_inter`** — `n ≥ 3f+1`, `|faulty| ≤ f`, two quorums of size `≥ n−f` share a
  NON-FAULTY organ. Reuses the in-tree, placeholder-free
  `Lutar.Round12.AyniQuorum.quorum_intersection_honest` (`|Q₁∩Q₂| > f`).
- **`khipu_quorum_safety_conditional`** — **THE CONDITIONAL SAFETY THEOREM (agreement / no
  split-brain):** under `n ≥ 3f+1`, `|faulty| ≤ f`, quorums `Q₁,Q₂` of size `≥ n−f` certifying
  `v₁,v₂` (every organ in `Qᵢ` votes `vᵢ`), and `HonestNonEquivocation`, we have `v₁ = v₂`.
  Proof: quorum intersection ⟹ shared honest organ `o`; `o` voted both `v₁` (from `Q₁`) and `v₂`
  (from `Q₂`); honest non-equivocation forces `v₁ = v₂`. ∎
- **`khipu_unique_decision_conditional`** — system-wide unique-decision corollary.
- **`subsumes_single_valued_shadow`** — re-derives the Wave13 single-valued shadow's conclusion
  from the Byzantine-aware theorem (model `voteOf` as a relation with `faulty = ∅`), witnessing
  that Wave23 is strictly more general.

This is the precise content of PBFT/Tendermint/HotStuff safety (= **agreement**), machine-checked
in the Velisarios Coq PBFT formalization. The combinatorial half (quorum intersection) was already
in-tree; Wave23 supplies the witness extraction + non-equivocation closure the old `sorry` deferred.

---

## 2. The conditional-safety chain

```
  n ≥ 3f+1  +  |faulty| ≤ f                          (Ubuntu charter; Lamport–Shostak–Pease bound)
        │  quorum_intersection_honest                (Round12, placeholder-free: |Q₁∩Q₂| > f)
        ▼
  |Q₁∩Q₂| > f ≥ |faulty|
        │  exists_honest_of_card_gt                  (Wave23: Finset.not_subset — DISCHARGES the old sorry)
        ▼
  ∃ honest organ o ∈ Q₁ ∩ Q₂
        │  HonestNonEquivocation o  (signed votes)   (Wave23: the weakest checkable hypothesis)
        ▼
  v₁ = v₂   (agreement / no split-brain)             (khipu_quorum_safety_conditional)
```

---

## 3. Constraint verification (all PASS)

| Constraint | Status | Evidence |
|---|---|---|
| No `sorry` / `admit` / `native_decide` | ✅ PASS | no bare placeholder token (only backtick docstring references) |
| NO new axiom token | ✅ PASS | no `axiom` declaration added |
| `#print axioms ⊆ {propext, Classical.choice, Quot.sound}` | ✅ PASS | all **5** decls — see `WAVE23_AXIOM_SCAN.txt` |
| Zero drift vs baseline | ✅ PASS | numbers UNCHANGED (decls 1323, axioms_unique 22, sorries_raw 307, sorries_noncomment 254); CI `lake build + numbers` = success |
| `Lutar/Wave23/` registered in `EXPERIMENTAL_SCOPES` | ✅ PASS | `lean_numbers.py` (Wave23 block after Wave22); `_is_experimental('Lutar/Wave23/QuorumSafety.lean') = True` |
| Locked-proven STAYS EXACTLY 5 `{F1,F11,F12,F18,F19}` | ✅ PASS | purely additive; no kernel / Round12 / Wave / locked file modified |
| Verified with LOCAL `lake build` | ✅ PASS | `lake build Lutar.Wave23.QuorumSafety` EXIT 0; full axiom scan EXIT 0 |
| PR opened, NOT merged | ✅ PASS | PR #214 OPEN, base `main`, mergeable=True |

**Diff vs `main` (purely additive, 4 files):**
```
 .github/data/lean_numbers.json   |  6 +-   (ref/sha/note → wave23; numbers UNCHANGED)
 .github/scripts/lean_numbers.py  | 22 ++   (Wave23 EXPERIMENTAL_SCOPES block)
 Lutar.lean                       | 18 ++   (Wave23 import block + doc)
 Lutar/Wave23/QuorumSafety.lean   | 221 ++  (new)
 4 files changed, 264 insertions(+), 3 deletions(-)
```
No locked/kernel/Round12/Wave8–22 proof file was touched.

---

## 4. CI status (PR #214, head `36c8abcf`) — honest report

**ALL substantive gates GREEN:**
`lake build + numbers` ✅ · `build` ✅ · `check / doctrine` ✅ · `CI checks` ✅ · `Run tests` ✅ ·
`DCO sign-off check` ✅ · `gitleaks` ✅ · `CodeQL` ✅ · `Trivy filesystem scan` ✅ ·
`Grype CVE gate` ✅ · `doi-title-gate` ✅ · `Analyze actions` ✅.

**One RED, and it is a PRE-EXISTING CI-INFRASTRUCTURE bug, NOT a Wave23 content problem
(honest disclosure):**
- `Lint PR title (Conventional Commits)` — fails with annotation:
  *"Unable to resolve action `amannn/action-semantic-pull-request@0723387f…`, unable to find
  version `0723387f…`"*. The workflow `commit-lint.yml` pins a SHA that GitHub cannot resolve, so
  the job errors before ever evaluating the title. The PR title was corrected to valid
  conventional-commits form (`feat(wave23): conditional khipu bft safety …`, lower-case subject per
  the `subjectPattern` rule), but the action itself cannot be fetched. This is environmental and
  affects every PR in the repo identically; it is independent of Wave23 and should be fixed by
  re-pinning the action SHA (founder/parent action) — Wave23 must NOT be blocked on it, and the
  doctrine/build/numbers/tests gates that actually verify correctness are all green.

---

## 5. Honest residual (what stays open)

1. **UNCONDITIONAL Byzantine BFT safety stays Conjecture 2.** Dropping `n ≥ 3f+1` (n ≤ 3f
   impossibility, PSL 1982) OR honest non-equivocation re-admits split-brain. Both hypotheses are
   necessary; neither can be dropped. This is the **sharp boundary** — the BFT analog of
   slice-multiplicativity for Λ. The result is CONDITIONAL and is labeled as such throughout.
2. **The `opaque canonicalHistory` form** (`KhipuConsensus.khipu_consensus_safety`) is NOT touched.
   An `opaque` predicate cannot be derived — that statement is unprovable as written and remains the
   honest conjecture token in the locked kernel (its `sorry` at `Identity_Ayni_Quorum.lean:102` /
   the kernel `KhipuConsensus.lean` stays the Conjecture-2 marker, counted in baseline). Wave23
   proves the AGREEMENT (no-split-brain) property — the actual content every BFT safety proof
   verifies — on an explicit, standard relation model.
3. **LIVENESS (Conjecture 3)** untouched.
4. **Λ UNCONDITIONAL uniqueness** stays Conjecture 1 (machine-checked FALSE). Not attempted.

---

## 6. Artifacts
- Branch `wave23-bft-safety` @ `36c8abcf` — created on `origin` via GitHub Git Data API.
- PR [#214](https://github.com/szl-holdings/lutar-lean/pull/214) — OPEN, not merged.
- `/home/user/workspace/team/WAVE23_FRONTIER_STATEMENT.md` — Phase A one-page frontier.
- `/home/user/workspace/team/BFT_SAFETY_RESEARCH.md` — Phase B research: weakest checkable
  hypothesis + Mathlib lemmas + real citations/URLs.
- `/home/user/workspace/team/WAVE23_AXIOM_SCAN.txt` — `#print axioms` for all 5 Wave23 decls
  (all ⊆ `{propext, Classical.choice, Quot.sound}`).

### Sources
- Lamport, Shostak, Pease, "The Byzantine Generals Problem", ACM TOPLAS 4(3):382–401, 1982.
  https://doi.org/10.1145/357172.357176
- Castro & Liskov, "Practical Byzantine Fault Tolerance", OSDI 1999.
- Rahli, Vukotic, Völp, Esteves-Verissimo, "Velisarios: Byzantine Fault-Tolerant Protocols Powered
  by Coq", ESOP 2018. https://vrahli.github.io/articles/velisarios.pdf
- Buchman, "Tendermint: BFT in the Age of Blockchains", MSc thesis, 2016.
  https://knowen-production.s3.amazonaws.com/uploads/attachment/file/1814/Buchman_Ethan_201606_Msater+thesis.pdf
- Yin et al., "HotStuff: BFT Consensus with Linearity and Responsiveness", PODC 2019.

Signed-off-by: SZL CTO <cto@szl-holdings.com>
Co-Authored-By: Perplexity Computer Agent <agent@perplexity.ai>
