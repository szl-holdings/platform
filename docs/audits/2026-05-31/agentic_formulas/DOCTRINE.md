# DOCTRINE.md — PURIQ Agentic Formulas, Doctrine v11 (LOCKED)

**Author:** Yachay
**Date:** 2026-06-01
**Scope:** Locked-invariant reference for the 23 PURIQ Agentic Formulas build. Every number
below is reproduced **verbatim** from Doctrine v11 and is **LOCKED** — no formula, agent,
test, or deployment in this build is permitted to alter, round, or "improve" these values.

---

## 1. LOCKED Doctrine v11 numbers (verbatim)

| Invariant | LOCKED value |
|---|---|
| Total declarations | **749 declarations** |
| Unique axioms | **14 unique axioms** |
| Sorries (open obligations) | **163 sorries** |
| Yuyay axis | **yuyay_v3 (13-axis)** |
| Replay digest | **bacf5443…631fc5** |
| Axiom A2 | **IsHomogeneous** |
| Axiom A4 | **IsBounded** |
| Supply-chain level | **SLSA L1** |
| Λ (Lambda) uniqueness | **Conjecture 1 — NOT a theorem** |

These are emitted verbatim by the live `/api/a11oy/v1/puriq/formulas` endpoint under the
`doctrine_v11_locked` key and are asserted in `formula_os/registry.py::DOCTRINE_V11_LOCKED`.

## 2. Λ-uniqueness is Conjecture 1 (explicit honesty clause)

Λ-uniqueness (the claim that the Lambda spine admits a unique consistent assignment) is
**Conjecture 1**. It is **NOT** stated, exported, or displayed as a theorem anywhere in this
build. Formulas whose Lean obligation depends on it (F13 Gauss–Bonnet, F14 Ramanujan,
F22 Feynman) carry `lean_status = CONJ` and are backed by **named axioms**
(`gaussBonnet_pinned`, `hardyRamanujan_upper`, `feynman_fiber_collapse`) in the full
Mathlib suite — they are honestly axiomatized, never "proved".

## 3. Axiom roster discipline

- **A2 = IsHomogeneous** and **A4 = IsBounded** are preserved verbatim as axiom identities.
- The full suite (`puriq/formulas/PuriqFormulaLean.lean`, 1309 lines) carries
  **23 `SORRY_PURIQ_OPEN` obligations** plus **3 named conjecture axioms** (the CONJ trio above).
- The self-prove sprint (Phase 3) proved **Mathlib-free CORES** only — it does **not** discharge
  the full-suite Mathlib obligations, which remain `sorry`-tagged honestly. See `AUTO_PROVE_LOG.md`.

## 4. Additivity & IP-HOLD

- All deployment changes are **ADDITIVE**. The PURIQ layer is mounted via a `try/except`-guarded
  `szl_puriq_formulas.register(app)` so a missing dependency can **never** take down an existing
  a11oy route.
- **IP-HOLD a11oy#57 is untouched.** No file under that hold was read, modified, or referenced.

## 5. Provenance & supply chain

- Every formula tick emits a **SHA-256 chain-linked Khipu receipt** (`formula_os/khipu.py`);
  all 23 chains verified `verified=True` over 2300 ticks (`out/summary.json`).
- Supply-chain posture is **SLSA L1** (LOCKED) — no claim above L1 is made.

## 6. Signature

Signed as **Yachay**, 2026-06-01.
