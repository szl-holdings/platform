# SKELETON — Lean-spine claim→theorem traceability (`skeleton_spine.py`)

**Organ 5 of the anatomy shell.** The SKELETON is the proof spine: every agentic
claim the GPU mind makes must **trace to a Lean theorem** — or be **honestly
flagged as a conjecture**. `skeleton_spine.py` is that traceability map. Given an
engine claim it returns the backing witness (theorem name, repo path, axiom
footprint, sorry status) and, critically, **refuses to let a conjecture be
asserted as proven**.

> The killer property of this estate is not that things are proven — it is that
> the **conjectures are labelled as conjectures**. Λ is bounded and symmetric
> (proven); its **uniqueness is Conjecture 1, intentionally NEVER a theorem**.

## The honesty rule (the doctrine moat)
`is_proven(claim)` is `True` **only** for a closed, 0-sorry, kernel-checkable
theorem. Everything else returns `False`:

| `Kind` | Meaning | `is_proven` |
|---|---|---|
| `THEOREM_0SORRY` | closed proof, kernel-checkable | **True** |
| `THEOREM_WITH_HYPOTHESES` | proven only *modulo* explicit open obligations | False |
| `RUNTIME_INVARIANT` | tested structural guarantee, **not** a Lean theorem | False |
| `CONJECTURE` | open — **NEVER** a theorem | False |
| `UNKNOWN` | no backing witness on the spine | False |

`assert_proven(claim)` raises `ConjectureError` for a conjecture and
`NotProvenError` for anything else un-proven — so **no code path can launder a
conjecture (or an unbacked claim) into a proven one**.

## The spine — which claim → which theorem
### Proven (0-sorry, kernel-checkable)
| Claim | Lean witness | Path |
|---|---|---|
| `energy_budget_bounded` | `EnergyBudgetWitness` (budget ≤ Bekenstein bits) | `energy_engine/lean/EnergyBudgetWitness.lean` (lutar-lean #239) |
| `min_energy_per_bit` | `LandauerFloorWitness` (≥ n·kT ln2; floor ≤ ceiling) | `energy_engine/wave/w9_landauer_lean/LandauerFloorWitness.lean` (#240) |
| `belief_update_bounded` | `BrainBeliefUpdate` (PAC-Bayes slack monotone) | `lutar-lean/.../round9/BrainBeliefUpdate.lean` |
| `deny_by_default_gate` | `ImmuneNeymanPearson` (fail-closed monotone) | `lutar-lean/.../round9/ImmuneNeymanPearson.lean` |
| `receipt_filtration_monotone` | `HeartReceiptSigma` (σ-algebra filtration ↑) | `lutar-lean/.../round9/HeartReceiptSigma.lean` |
| `provenance_chain_extends` | `BloodDSSEMerkle` (Merkle path monotone) | `lutar-lean/.../round9/BloodDSSEMerkle.lean` |
| `drift_alarm_sound` | `NervousShannonAlarm` (fires iff H>noise+ε) | `lutar-lean/.../round9/NervousShannonAlarm.lean` |
| `lambda_bounded` | `SkeletonLambdaSpine` (λ ≤ max; locks 749/14/163) | `lutar-lean/.../round9/SkeletonLambdaSpine.lean` |
| `fleet_linking_invariant` | `CalugareanuFleetInvariant` (Lk = Tw+Wr) | `lutar-lean/.../round7/CalugareanuFleetInvariant.lean` |

### Proven only *modulo* open hypotheses (NOT closed proofs)
| Claim | Witness | Open obligation |
|---|---|---|
| `swarm_connected` | `EulerFleetTopology` (χ = V−E+F = 2) | planarity + connectivity supplied as **runtime** hypotheses |
| `lambda_unique_conditional` | `lambda_unique_of_factors` (any A1–A5 aggregator that **factors** = Λ) | `FACTORIZATION_AXIOM_GAP` — the `Factors` premise (A6/bisymmetry) is **essential** |

### Runtime/structural invariants (tested, NOT Lean theorems)
| Claim | Where verified | Note |
|---|---|---|
| `reactive_preempts` | `apps/agentic-gpu/scheduler.py` self-test (platform #357) | **No Lean theorem exists** for scheduler preemption; the guarantee is structural + unit-tested. Do not cite it as proven on the spine. |

### Conjectures — NEVER theorems (the honesty moat)
| Claim | ID | Declaration | Why it stays open |
|---|---|---|---|
| `lambda_uniqueness` | **Conjecture 1** | `lambda_unique` (unconditional) ends in `sorry` | `FACTORIZATION_AXIOM_GAP`; **FALSE under A1–A5** (counterexample `maxAgg(4,1)=4 ≠ Λ₂(4,1)=2`). The public `Conjecture` declaration is **NOT** upgraded; 749/14/163 stays locked. |
| `khipu_bft_safety` | **Conjecture 2** | `khipu_consensus_safety` ends in `sorry` | needs an adaptive Byzantine adversary model. Deliberate sibling of Conjecture 1. |
| `khipu_bft_liveness` | **Conjecture 3** | `khipu_consensus_liveness` ends in `sorry` | needs a synchrony/timeout model. |

The crucial pair: **`lambda_unique_conditional`** (a real conditional theorem)
is kept *separate* from **`lambda_uniqueness`** (Conjecture 1). The conditional
result is genuine; the unconditional uniqueness is not — and the map will never
conflate them.

## Live SKELETON endpoint mapping
- **Live runtime:** `amaru /api/amaru/v1/math/lean/theorems` — the spine's
  theorem / axiom / sorry counts (and `/v1/formulas` reports
  `lambda_aggregate` with `proof_status = "PROVEN(A1-A4); uniqueness CONJECTURE"`).
- When reachable, `SkeletonSpine.trace()` cross-checks the live spine and labels
  the answer `source: "live-spine"`.
- **Off-box** (this control plane today) the endpoint is unreachable
  (DNS/`000`), so the module **degrades to the static on-disk map** and labels
  the answer `source: "static-map"` — a degraded reading is **never** presented
  as a live query. The doctrine constant defaults to `749/14/163`.
- Pure stdlib (`urllib`); the probe **never raises** and **never sends a key**.

## Scheduler / organ integration
This module is a **read-only traceability oracle** — it changes no scheduling
behavior. Other organs call it to prove their claims are honest before acting:
e.g. the BRAIN admission gate can cite `belief_update_bounded`, the IMMUNE gate
`deny_by_default_gate`, the HEART receipt loop `receipt_filtration_monotone`.
A caller that tries to justify an action with `lambda uniqueness` gets a
`ConjectureError`, closing the half-state loop at the proof layer.

## Run the self-test (no GPU, no network, no key)
```bash
python3 skeleton_spine.py        # → {"ok": true}  (43 checks)
```
Exercises: a proven claim resolves to a **0-sorry** theorem (`is_proven True`);
**Λ-uniqueness is flagged Conjecture 1 and `assert_proven` RAISES**; Khipu-BFT
safety/liveness are Conjecture 2/3 and refused; `swarm_connected` is a
theorem-with-hypotheses (not a closed proof); `reactive_preempts` is a
RUNTIME_INVARIANT (honestly **not** a Lean theorem); an unknown claim resolves
UNKNOWN and is refused as proven; the off-box source is labelled `static-map`
while an injected live snapshot is labelled `live-spine` and **still** refuses
the conjecture.

## Doctrine floor
- **Λ = Conjecture 1 — NEVER a theorem.** `749/14/163` locked.
- Conjectures (Λ-uniqueness, Khipu-BFT) are flagged and can never resolve proven.
- Theorems-with-open-hypotheses and runtime invariants are **labelled as such**,
  not dressed as closed proofs.
- A claim with no witness resolves UNKNOWN — never silently "proven".
- open-weight only; **NEVER commits a key**; additive (does not touch the locked
  kernel — `SkeletonLambdaSpine.lean` itself re-asserts the doctrine sorry-free
  and explicitly does **not** assert uniqueness).
