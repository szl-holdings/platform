# FORMULA_OS_SOURCE_INDEX.md — formula_os runtime + 23 PURIQ formulas

**Author:** Yachay · **Date:** 2026-06-01
**Root:** `/home/user/workspace/szl_formula_os/`

A self-contained, open-source-only (stdlib + FastAPI/Starlette + pytest) agentic runtime for
the 23 PURIQ formulas. Each formula is a **deterministic Python function** with real unit tests
and a **FormulaAgent** that ticks, self-tests, self-proves (Lean), and emits Khipu receipts.

---

## 1. Runtime modules (`formula_os/`)

| File | Lines | Role |
|---|---:|---|
| `__init__.py` | 21 | Package surface; version. |
| `registry.py` | 183 | 23 `FormulaSpec` rows + `DOCTRINE_V11_LOCKED` dict (749/14/163, A2/A4, Λ=Conjecture 1). |
| `formulas/__init__.py` | 455 | 23 pure deterministic functions `f1_identity … f23_identity` (input → output). |
| `agent.py` | 109 | `FormulaAgent`: `tick / self_test / self_prove / snapshot`, `period_s=300`. |
| `evaluator.py` | 81 | Runs the numeric harness for one formula; returns pass/total. |
| `prover.py` | 151 | Tactic ladder `rfl→decide→norm_num→ring→simp→omega→linarith…`; `LEAN_VERIFY_URL` env then local `lean`; outcomes PROVED / STILL-SORRY / FAILED-WITH-REASON / BLOCKED. |
| `numeric_harness.py` | 50 | Deterministic-seed sampler + assertion harness. |
| `citation_tracker.py` | 41 | `ORGAN_INVOCATIONS` counter per organ. |
| `khipu.py` | 74 | SHA-256 chain-linked receipts; `verify_chain()`. |

## 2. Lean self-prove assets (`lean/`)

| File | Lines | Role |
|---|---:|---|
| `templates.py` | 91 | Mathlib-free `.lean` templates with `__TACTIC__` placeholder. |
| `proved/F1_proved.lean` | 11 | `euler_char_def` — **PROVED via rfl**, no extra axioms. |
| `proved/F11_proved.lean` | 8 | `frustum_degenerates_core` (over Int) — **PROVED via simp**, axiom: propext. |
| `proved/F12_proved.lean` | 7 | `crt_7_12` — **PROVED via rfl**, axiom: propext. |
| `proved/F18_proved.lean` | 7 | `programs_k10` — **PROVED via rfl**, no extra axioms. |
| `proved/F19_proved.lean` | 13 | `fuel_halts_3` — **PROVED via rfl**, no extra axioms. |

All five verified locally under `lean v4.13.0` at exit code 0; **no `sorryAx`**. See `AUTO_PROVE_LOG.md`.

## 3. Tests (`tests/`)

| File | Lines | Role |
|---|---:|---|
| `test_numeric_harness.py` | 145 | **54 tests** — 23 parametrized (100-trial each) + 31 targeted. **54/54 PASS** (`pytest_output.txt`). |

## 4. Space module (deployable)

| File | Lines | Role |
|---|---:|---|
| `szl_puriq_formulas.py` | 651 | `register(app)` mounts GET `/formulas` (HTML), GET `/api/a11oy/v1/puriq/formulas` (JSON), GET `/api/a11oy/v1/puriq/formulas/{fid}`. Recomputes live values + 5 Khipu receipts per request. Byte-identical copy in the a11oy repo. |

## 5. Sprint driver & outputs (`run_sprint.py`, `out/`)

- `run_sprint.py` drives Phase 2 (instantiate 23 agents, 100× eval each) + Phase 3 (Lean sprint).
- `out/snapshots.json` — 23 agent snapshots. `out/summary.json` — 2300 ticks, all chains verified,
  harness 2300/2300. `out/sprint.json` — per-formula Lean outcomes + attempt ladders.
  `out/embed.json` — compact per-formula metadata for the live dashboard.

## 6. The 23 PURIQ formulas (organ · Lean obligation · full-suite status)

| FID | Name | Organ | Lean name | Full-suite status |
|---|---|---|---|---|
| F1 | Euler-Khipu DAG Identity | Khipu | wellFormed_iff | PROVED |
| F2 | Egyptian-Kallpa Allocation | Kallpa | egyptian_sum_eq | SKELETON |
| F3 | Noether-Khipu Conservation | Khipu | noether_conservation | PROVED |
| F4 | Gauss-Yuyay Aggregation | Yuyay | gaussYuyayPass | SKELETON |
| F5 | Euler-Lagrange Agency | A/agency | isStationary | SKELETON |
| F6 | Newton Risk-Velocity Tripwire | HUKLLA | velocity_tripwire_sound | SKELETON |
| F7 | Inverse-Square/Zeta Provenance | Khipu/Kallpa | provenance_converges | SKELETON |
| F8 | Newton-Parsimony Pick | HUKLLA | parsimony_minimal | SKELETON |
| F9 | Sulba Yuyay Mass-Conservation | Yuyay | yuyay_mass_conserved | PROVED |
| F10 | Baudhayana Orthogonality Bound | Lambda-spine | baudhayana_iterate | PROVED |
| F11 | Frustum A-Shrink Law | A | frustum_degenerates_to_pyramid | PROVED |
| F12 | CRT-Hukulla Schedule | HUKLLA | crt_collision_period | SKELETON |
| F13 | Gauss-Bonnet Spine Curvature | Lambda-spine | curvatureConsistent | CONJ |
| F14 | Ramanujan A-Partition Bound | A | hardyRamanujan | CONJ |
| F15 | Grothendieck Organ Functor | compose | organ_comp_assoc | SKELETON |
| F16 | von-Neumann-Hukulla Minimax | HUKLLA | minimax_exists | SKELETON |
| F17 | Shannon-Kallpa Capacity | Kallpa | entropy_nonneg | SKELETON |
| F18 | Kolmogorov A-Description Cap | A | actions_bounded_by_K | SKELETON |
| F19 | Turing-Fuel Halting Safety | core | fuel_total | PROVED |
| F20 | Schrodinger Action Superposition | A | superposition_normalized | PROVED |
| F21 | Dirac-Commit Projection | Khipu | projections_sum_one | PROVED |
| F22 | Feynman-Puriq Path Integral | A | puriqPathWeight | CONJ |
| F23 | Bekenstein A-Cap | A | actionSpaceBounded | SKELETON |

> **Status legend.** PROVED/SKELETON/CONJ describe the **full Mathlib suite** obligation in
> `puriq/formulas/PuriqFormulaLean.lean` (23 `SORRY_PURIQ_OPEN` + 3 named CONJ axioms). The
> Phase-3 self-prove sprint independently proved the **Mathlib-free CORES** of F1, F11, F12, F18, F19
> (5/5). CONJ rows (F13/F14/F22) rest on named axioms — honestly axiomatized, never claimed proved.
> Λ-uniqueness remains **Conjecture 1**.
