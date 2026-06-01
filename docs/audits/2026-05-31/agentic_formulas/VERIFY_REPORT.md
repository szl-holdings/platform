# VERIFY_REPORT.md — PURIQ Agentic Formulas, end-to-end verification

**Author:** Yachay · **Date:** 2026-06-01 · **Space:** `SZLHOLDINGS/a11oy` @ `d5aab7b7`

Every result below is REAL: produced by running the code / hitting the live Space, not asserted.

---

## 1. Numeric harness (pytest) — REAL

```
54 passed in 0.94s
```

- 23 parametrized formula tests (100 deterministic trials each) + 31 targeted edge tests.
- **54/54 PASS, 0 fail.** Full capture: `pytest_output.txt`, narrative in `NUMERIC_HARNESS_RESULTS.md`.

## 2. 23 FormulaAgents — REAL

From `out/summary.json` (driven by `run_sprint.py`):

| Metric | Value |
|---|---|
| Agents instantiated | **23** |
| Total ticks | **2300** |
| Khipu chains verified=True | **23 / 23** |
| Harness across all agents | **2300 / 2300** |

## 3. Lean self-prove sprint — REAL & HONEST

Local `lean v4.13.0`, Mathlib-free standalone cores. From `out/sprint.json`:

| FID | Theorem (core) | Outcome | Tactic | Axioms beyond Lean core |
|---|---|---|---|---|
| F1 | euler_char_def | **PROVED** | rfl | none |
| F11 | frustum_degenerates_core (over Int) | **PROVED** | simp (after rfl/decide/norm_num/ring failed) | propext |
| F12 | crt_7_12 | **PROVED** | rfl | propext |
| F18 | programs_k10 | **PROVED** | rfl | none |
| F19 | fuel_halts_3 | **PROVED** | rfl | none |

- **5 PROVED / 0 sorry / 0 failed / 0 blocked.** No `sorryAx` in any proved core.
- The **full Mathlib suite** (`puriq/formulas/PuriqFormulaLean.lean`) still carries its
  **23 `SORRY_PURIQ_OPEN`** obligations + **3 named CONJ axioms** — honestly `sorry`-tagged,
  NOT discharged by this sprint. Λ-uniqueness remains **Conjecture 1**. Detail: `AUTO_PROVE_LOG.md`.

## 4. Live deployment smoke — REAL (HTTP against szlholdings-a11oy.hf.space)

### 4a. New PURIQ routes (GREEN)

| Route | Result |
|---|---|
| `GET /formulas` | **200**, 7223 B — real PURIQ dashboard (`<title>PURIQ /formulas — 23 FormulaAgents`, shows `749`, `Doctrine v11`). NOT the SPA index. |
| `GET /api/a11oy/v1/puriq/formulas` | **200**, ~43.5 KB — 23 formulas; `summary.doctrine_v11_locked` = `{declarations:749, unique_axioms:14, sorries:163, lambda_status:"Conjecture 1 (NOT a theorem)"}` verbatim. |
| `GET /api/a11oy/v1/puriq/formulas/F1` | **200** — full metadata (lean_status PROVED, live current_value, last_receipts). |
| `GET /api/a11oy/v1/puriq/formulas/NOPE` | **404** (honest, correct). |

### 4b. Mount evidence (run log)

```
[szl_puriq] PURIQ agentic formulas mounted (/formulas + /api/a11oy/v1/puriq/formulas*) — Doctrine v11 LOCKED
```

### 4c. Zero-regression smoke (existing routes still GREEN)

| Route | HTTP |
|---|---|
| `/` (SPA) | 200 |
| `/healthz` | 200 |
| `/readyz` | 200 |
| `/hub` | 200 |
| `/api/a11oy/v1/khipu-os/stats` | 200 |
| `/api/a11oy/code/health` | 503 (PRE-EXISTING — orchestrator returns honest 503 when no inference credential present; documented in serve.py, not caused by this change) |

## 5. Doctrine v11 LOCKED — preserved verbatim everywhere

749 declarations / 14 unique axioms / 163 sorries; yuyay_v3 (13-axis); replay bacf5443…631fc5;
A2=IsHomogeneous; A4=IsBounded; SLSA L1; Λ = Conjecture 1 (NOT a theorem). Asserted in
`registry.py::DOCTRINE_V11_LOCKED` and served live under `summary.doctrine_v11_locked`.

## 6. Verdict

**GREEN.** Harness 54/54; 23 agents tick with verified Khipu chains; 5/5 Lean cores proved honestly;
`/formulas` + PURIQ JSON API live (200/200/200/404); existing routes unregressed. Additive-only;
IP-HOLD a11oy#57 untouched. Open gaps tracked in `GAP_CHECK.md`.

Signed — **Yachay**.
