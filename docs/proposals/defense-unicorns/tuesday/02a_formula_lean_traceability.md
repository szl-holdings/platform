# Appendix — Formula ↔ Lean traceability

**Companion to:** `02_a11oy_uds_architecture.md`
**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Status:** Honest inventory. Every binding below is path-walkable.

---

## Why this appendix exists

The architecture writeup uses the phrase "machine-checked formulas." For
that phrase to be defensible on the Tuesday call, the reader has to be
able to walk from a named registry entry to a named Lean lemma, and back,
without taking our word for anything. This appendix is that walk.

It also draws the honest line between **formalized** (a registry entry
with a Lean lemma binding it today) and **registered but not yet
formalized** (a registry entry whose formal counterpart is on the proof
plan, not in the tree).

## What is bound to what

### Registry → Lean bindings (formalized)

| Registry id | One-line description | Lean file | Lean lemma | What the lemma proves | What it does **not** prove |
| ----------- | -------------------- | --------- | ---------- | --------------------- | -------------------------- |
| `null-space-projection` | Null-space projection coexistence: for a channel map `A` and a projector `P` into `ker(A)`, every projected waveform satisfies `A(P v) = 0` (the radar/comms coexistence post-condition). | `packages/lean-formulas/Connection/NullSpace.lean` | `null_space_projection` (and its historical alias `null_space_coexistence`) | That **if** `P` is given as a null-projector of `A` (`IsNullProjection A P`), **then** for every `v`, `A (P v) = 0`. The post-condition itself, discharged in pure Lean 4. | That any *particular* analytic construction of `P` from `A` actually lands in `ker(A)`. That side of the proof is checked numerically by the TS shim `packages/agi-forecast/src/null-space.ts` against 1k random inputs. |

The naming convention is documented in `packages/lean-formulas/README.md`:
the registry id maps to a Lean identifier via `kebab-case → snake_case`,
so `null-space-projection` ↦ `null_space_projection`. The
"coexistence" alias is retained so prose can still cite the 2012
Sodagari–Khawar–Clancy–McGwier paper by name.

### Registry → Lean (registered but not yet formalized)

Every other entry in `lib/formulas/src/registry.ts` is **registered but
not yet formalized**. The runtime is a pure typed function with a
thesis-section citation; there is no Lean lemma in
`packages/lean-formulas/` that names this id today.

| Registry id | Domain | Runtime in registry | Lean binding |
| ----------- | ------ | ------------------- | ------------ |
| `lutar-invariant-5` | invariant | `@workspace/lutar-formulas/lutar` `lutarInvariant5` | — |
| `l-omega-router` | routing | `@workspace/lutar-formulas/omega` `lOmega` | — |
| `xi-unification` | routing | `@workspace/lutar-formulas/xi` `xi` | — |
| `propeller-alignment` | optimization | `@workspace/lutar-formulas/propeller` `propeller` | — |
| `risk-score` | risk | `lib/formulas/src/risk.ts` `riskScore` | — |
| `drift-score` | risk | `lib/formulas/src/risk.ts` `driftScore` | — |
| `autonomy-gate` | governance | `lib/formulas/src/governance.ts` `autonomyGate` | — |
| `escalation-delay` | governance | `lib/formulas/src/governance.ts` `escalationDelaySeconds` | — |
| `proof-closure-score` | scoring | `lib/formulas/src/scoring.ts` `proofClosureScore` | — |
| `rosie-proposal-score` | evolution | `lib/formulas/src/evolution.ts` `rosieProposalScore` | — |

Each of these is a candidate for a follow-up Lean lemma. None of them
are claimed as "machine-checked" today.

### Lean → registry (formalized, not yet registered)

The converse direction also has gaps, and we list them here so the
binding table is symmetric and honest. Three Lean files in
`packages/lean-formulas/` formalize results that the platform *runtime*
consumes via TS shims, but whose registry entries do not yet exist:

| Lean file | Headline lemma | Platform shim it backs | Registry id |
| --------- | -------------- | ---------------------- | ----------- |
| `packages/lean-formulas/Substance/GCA.lean` | `heCoeff3Num_centred`, `heCoeff4Num_centred` — Gram–Charlier A centred-density reductions (Kawamoto–McGwier 2016 AMC). | `moments.ts` | not yet in `lib/formulas/src/registry.ts` |
| `packages/lean-formulas/Anatomy/Boundary.lean` | `boundary_uniqueness` — Henderson–McGwier 1987 fourth-order BVP uniqueness corollary (axiom-gated wrapper, see file for scope). | `anatomy-boundary.ts` | not yet in `lib/formulas/src/registry.ts` |
| `packages/lean-formulas/Forecast/Perturbation.lean` | `residual_zero_at_zero` (proved in core); `residual_bound` (Fleming–McGwier 1983 `O(ε²)` bound, axiom-gated). | `perturbation.ts` | not yet in `lib/formulas/src/registry.ts` |

These are real formal results — and two of them are explicitly
axiom-gated, which we surface here rather than hide. They are not
claimed as "machine-checked registry formulas" until a corresponding
registry entry binds them.

## What we are claiming, exactly

- **One** registry formula (`null-space-projection`) is machine-checked
  in Lean today, via `null_space_projection` in
  `packages/lean-formulas/Connection/NullSpace.lean`. The lemma is
  discharged in pure Lean 4 with no `axiom` and no mathlib dependency.
- **Three** additional Lean files formalize platform results
  (`Substance/GCA.lean`, `Anatomy/Boundary.lean`,
  `Forecast/Perturbation.lean`); two of them rely on `axiom`s for the
  deep real-analysis steps, as their file headers state. They are
  honest-but-partial formalizations awaiting matching registry entries.
- **Ten** other registry formulas are registered with thesis-section
  provenance and a typed runtime, but **no Lean lemma**. They are
  candidates for the proof-plan backlog, not part of any "machine-checked"
  claim.

## How to verify this appendix without taking our word for it

```
# 1. The registry entry
rg -n "null-space-projection" lib/formulas/src/registry.ts

# 2. The Lean file it cites
sed -n '1,82p' packages/lean-formulas/Connection/NullSpace.lean

# 3. The lemma name lands a definition
rg -n "theorem null_space_projection" packages/lean-formulas/Connection/NullSpace.lean

# 4. Lean build is green
bash packages/lean-formulas/scripts/check-lean-build.sh
```

The same walk reproduces for `Substance/GCA.lean`,
`Anatomy/Boundary.lean`, and `Forecast/Perturbation.lean` — note the
`axiom` declarations in the latter two, which mark exactly what is
*not* yet discharged.

---

— Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
