# Allodial Frontier Slice — Report

**Task:** Extend the a11oy live formula rail with three EXPERIMENTAL lutar-lean backbone modules.  
**Doctrine:** v11/v12, c7c0ba17. Locked-8 unchanged. Λ = Conjecture 1 (NEVER a theorem).

---

## PR

| Field | Value |
|-------|-------|
| **PR number** | #337 |
| **PR URL** | https://github.com/szl-holdings/a11oy/pull/337 |
| **Branch** | `feat/allodial-frontier-formulas` |
| **Commit** | `e1b491c` |
| **Status** | Open — do NOT merge without review |

---

## Three New Formula Modules

| Module | Path | Endpoint(s) | Lean backbone |
|--------|------|-------------|---------------|
| `allodial.py` | `src/a11oy/formulas/allodial.py` | `GET /api/a11oy/v1/formula/allodial` | `Lutar/Allodial.lean` (PR #229, merge 783a38d0) |
| `entanglement.py` | `src/a11oy/formulas/entanglement.py` | `GET /api/a11oy/v1/formula/entanglement` | `Lutar/Entanglement.lean` (PR #230, merge 3a7f222ed3bb) |
| `allodial_gate.py` | `src/a11oy/formulas/allodial_gate.py` | `GET\|POST /api/a11oy/v1/formula/sovereign` | `Lutar/Allodial.lean` (PR #229) — `ni_low_independent_of_high` |

---

## Self-Test Outputs

All tests run locally against the workspace copy. **No test was faked.**

```
=== allodial.py ===
ok:true checks:12

=== entanglement.py ===
ok:true checks:9

=== allodial_gate.py ===
ok:true checks:10
```

### What each test suite verifies

**allodial.py (12 checks)**
- `allodial_iff_top`: `top` is allodial; `a` and `bot` are not (3 checks)
- `dominates_all`: `top` dominates the full 4-element lattice {bot,a,b,top}; `a` does not (2 checks)
- `has_overlord`: `a` and `bot` have overlords; `top` does not (3 checks)
- `non_interference_check`: invariant when low outputs are constant across high states; FAILS (returns `invariant:false`) when they vary (2 checks)
- `allodial_check` full compound: `top` passes; `a` fails (2 checks)

**entanglement.py (9 checks)**
- `cap_bound(C0, γ, 0) == C0` (identity at t=0); `cap_bound(0, γ, t) == 0` (2 checks)
- `cap_bound_nonneg` true for positive and zero inputs (2 checks)
- `cap_bound_antitone`: t=0 ≥ t=1; t=2 ≥ t=5 (2 checks)
- `entanglement_decays_under_bound`: at the bound passes; above the bound fails (2 checks)
- Strict decay: `cap_bound(1,1,1) < cap_bound(1,1,0)` for γ>0 (1 check)

**allodial_gate.py (10 checks)**
- `local_node_serving=True` → `sovereign:true, half_state:false` (2 checks)
- Banner sovereign + `local_node_serving=False` → `sovereign:false, half_state:true` (2 checks)
- Explicit `"external-router"` + `local_node_serving=False` → `sovereign:false, half_state:false` (honest, not a half-state) (2 checks)
- CDN (`"cloudflare-cdn"`) with `local_node_serving=False` → `half_state:false, sovereign:false` (2 checks)
- Metadata: `tier=="experimental"`, Lean theorem tag contains `"ni_low_independent_of_high"` (2 checks)

---

## Exact `lean_theorem` Tags Used

### allodial.py
```
Lutar/Allodial.lean::allodial_dominates_all / galois_preserves_allodial
 / ni_low_independent_of_high
 (EXPERIMENTAL — PROPOSED gate, not a locked theorem)
```

### entanglement.py
```
Lutar/Entanglement.lean::capBound_antitone
 / entanglement_decays_under_bound
 (EXPERIMENTAL — PROPOSED gate, not a locked theorem)
```

### allodial_gate.py
```
Lutar/Allodial.lean::ni_low_independent_of_high / allodial_iff_top
 (EXPERIMENTAL — PROPOSED gate, not a locked theorem)
```

### Index entries (in `_INDEX` / `/formulas/index`)
- `allodial`: `Lutar/Allodial.lean::allodial_dominates_all / galois_preserves_allodial / ni_low_independent_of_high (EXPERIMENTAL — PROPOSED gate, not a locked theorem)`
- `entanglement`: `Lutar/Entanglement.lean::capBound_antitone / entanglement_decays_under_bound (EXPERIMENTAL — PROPOSED gate, not a locked theorem)`
- `sovereign`: `Lutar/Allodial.lean::ni_low_independent_of_high / allodial_iff_top (EXPERIMENTAL — PROPOSED gate, not a locked theorem)`

---

## Honest Note: What Is Proven vs. What Is Engineering

### What is formally proven (Lean-side)

The three referenced Lean files are **kernel-checked, 0-sorry, no-new-axiom EXPERIMENTAL backbones**:

- **`Lutar/Allodial.lean`** (PR #229, merge 783a38d0): The Lean4 kernel has verified `allodial_dominates_all`, `allodial_iff_top`, `feudal_has_overlord`, `galois_preserves_allodial`, and `ni_low_independent_of_high` without introducing new axioms or sorry placeholders. These are **EXPERIMENTAL** gates — they are real Lean theorems in the EXPERIMENTAL tier, not locked-8.

- **`Lutar/Entanglement.lean`** (PR #230, merge 3a7f222ed3bb): The Lean4 kernel has verified `capBound_nonneg`, `capBound_zero`, `capBound_antitone`, and `entanglement_decays_under_bound` without new axioms or sorry. EXPERIMENTAL tier.

- **`EnergyBudgetWitness.lean`** (open PR #239, keystone): Referenced in doctrine context as the energy engine's keystone. This PR does not depend on its merge state.

None of these are in the **locked-8 set** {F1,F4,F7,F11,F12,F18,F19,F22} (hash c7c0ba17). They are not Λ results. Λ unconditional uniqueness remains **Conjecture 1** (machine-checked FALSE, NEVER a theorem).

### What is engineering (Python-side)

The three Python modules are **faithful but informal mirrors** of the Lean proofs:

- The pure functions implement the same mathematical objects as the Lean declarations.
- The response envelopes carry `tier: "experimental"` and `honest_note` fields that repeat this distinction explicitly on every response.
- The `lean_theorem` field is a genuine citation pointing to real Lean declarations — not a fabricated label.
- The Python code is NOT the proof. It does not and cannot inherit kernel-checking guarantees. It is an operational endpoint that makes the proven structure accessible via HTTP.

### The sovereignty gate in particular

`allodial_gate.py` / `sovereign` operationalizes the **half-state doctrine**:

The Lean theorem `ni_low_independent_of_high` establishes that in the allodial model, the low-security (user-visible) output must be independent of the high-security (overlord) state. The Python gate implements this as: *if routing is externally delegated, the sovereignty verdict becomes a function of the external router's state* — violating non-interference. The half-state (`half_state:true, sovereign:false`) is the uniquely unacceptable outcome and is the only case the gate flags as a doctrine violation. This is engineering grounded in a proven result, not the proof itself.

---

## Doctrine Compliance Summary

| Check | Status |
|-------|--------|
| Locked-8 set unchanged | ✓ |
| Λ = Conjecture 1 (never a theorem) | ✓ |
| Khipu BFT = Conjecture 2 | ✓ |
| No free-energy claims | ✓ |
| No energy figures (no real meter) | ✓ |
| EXPERIMENTAL tier labeled everywhere | ✓ |
| No key committed | ✓ |
| No merge — PR only | ✓ |
| DCO sign-off (`-s`) | ✓ |
| Honesty gate not weakened | ✓ |
| All self-tests genuinely green | ✓ |
