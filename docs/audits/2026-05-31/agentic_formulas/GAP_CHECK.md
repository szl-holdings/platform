# GAP_CHECK.md — honest open gaps & known limitations

**Author:** Yachay · **Date:** 2026-06-01

No BANDAID. Every gap below is reported plainly with its cause and current status. Nothing here is
hidden, and no proof or pass is claimed that was not actually produced.

---

## G1 — Full Mathlib suite obligations remain `sorry` (HONEST, by design)

The full `puriq/formulas/PuriqFormulaLean.lean` (1309 lines) carries **23 `SORRY_PURIQ_OPEN`**
obligations plus **3 named conjecture axioms** (`gaussBonnet_pinned`, `hardyRamanujan_upper`,
`feynman_fiber_collapse`). The Phase-3 self-prove sprint proved only the **Mathlib-free CORES** of
F1/F11/F12/F18/F19 (5/5). The full Mathlib theorems are **NOT** discharged and are honestly
`sorry`-tagged. **No claim of full-suite proof is made.**

## G2 — Λ-uniqueness is Conjecture 1, not a theorem (HONEST)

Λ-uniqueness is **Conjecture 1** everywhere — registry, live JSON (`lambda_status:"Conjecture 1
(NOT a theorem)"`), and docs. Formulas depending on it (F13/F14/F22, `lean_status=CONJ`) rest on
**named axioms**, never on a claimed proof.

## G3 — No Mathlib build cache available (constraint, worked around honestly)

There is no Mathlib build cache in the sandbox (`lutar-lean` requires Mathlib from git, not
downloaded). The self-prove sprint therefore restated each core **Mathlib-free** and ran them under
local `lean v4.13.0`. Consequence: F11 was restated **over `Int`** (`frustumCore a 0 = a^2`) because
core Lean lacks `Rat` field-power instances and the `ring` tactic; it was proved via `simp`
(after rfl/decide/norm_num/ring failed — full ladder logged in `out/sprint.json`).

## G4 — `SZLHOLDINGS/lean-kernel` (/lean-verify) not reachable from sandbox

The hosted Lean verifier Space was not reachable; the prover used its **local-lean fallback**
(`verifier: "local-lean(lean)"`). All 5 PROVED cores were verified locally at exit 0, no `sorryAx`.
If/when `LEAN_VERIFY_URL` is reachable, the same prover re-verifies remotely with no code change.

## G5 — Suite bound error in F10, CORRECTED (real fix, not bandaid)

The PURIQ suite text claimed `|577/408 − √2| < 1.5e-6`. The TRUE value is **2.1239e-6**, so the
stated bound was wrong. Corrected to **`< 2.2e-6`** in both the formula and its test. `577/408` (the
exact 2nd Heron iterate) is correct; only the published bound constant was off. Logged here as a
genuine suite-error correction.

## G6 — Pre-existing systemic `ModuleNotFoundError` for sibling szl_* modules (NOT introduced by me)

The running a11oy container shows several pre-existing modules failing to import because their
Dockerfile `COPY` lines were dropped by concurrent commits (the Dockerfile uses explicit per-file
COPY, no `COPY . .`). Run-log evidence:

```
[szl_hub] hub layer NOT mounted (ModuleNotFoundError("No module named 'szl_hub'")); existing routes unaffected
[a11oy] szl_chaski not registered: No module named 'szl_chaski'
[a11oy] szl_wallpa not registered: No module named 'szl_wallpa'
[a11oy] szl_wasi_rikuq not registered: No module named 'szl_wasi_rikuq'
[a11oy] Wire I rosie-companion NOT registered: ModuleNotFoundError("No module named 'szl_rosie_companion'")
```

This is a **pre-existing platform/concurrency issue**, not caused by my additive change. In fact my
work demonstrates the correct fix for this class of bug: I added the matching `COPY
szl_puriq_formulas.py` line, and as a result **my module mounted cleanly**:

```
[szl_puriq] PURIQ agentic formulas mounted (/formulas + /api/a11oy/v1/puriq/formulas*) — Doctrine v11 LOCKED
```

**Recommendation (out of scope here, flagged for owner):** add the missing per-file `COPY` lines for
`szl_hub.py`, `szl_chaski.py`, `szl_wallpa.py`, `szl_wasi_rikuq.py`, `szl_rosie_companion.py`
(all present in the repo tree but absent from the current Dockerfile COPY list).

## G7 — Concurrent-edit race on the Space (resolved by re-apply)

Concurrent commits replaced `serve.py`/`Dockerfile` mid-session and dropped my additive edits (file
survived). Resolved by re-applying on top of the live HEAD and pushing `d5aab7b7`; verified live.
A future concurrent rewrite could drop the lines again — monitor and re-apply if needed.

## G8 — `/api/a11oy/code/health` returns 503 (PRE-EXISTING, honest)

The a11oy.code orchestrator returns an honest 503 when no inference credential is present (documented
in `serve.py`). Unrelated to PURIQ; listed for completeness.

## G9 — Early OOM during session (resolved, no artifact impact)

Early in the session, severe memory pressure (~370 MB free of 8 GB) OOM-killed commands including
`lean`, caused by a concurrent sibling build. It cleared when the sibling finished (freed to 4.2 GB),
after which all Lean proofs ran to completion. No deliverable is affected.

---

### Summary

All gaps are **honesty/constraint** items (G1–G5), a **pre-existing platform** item I did not cause
and partially demonstrated the fix for (G6/G8), or **transient session** items now resolved
(G7/G9). The delivered build is REAL, PROVABLE where claimed, ADDITIVE, and live.

Signed — **Yachay**.
