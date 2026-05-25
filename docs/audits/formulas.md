# Formula Audit — Thesis-Sourced, Harnessed From A11oy, Evolved by ROSIE

**Date:** 2026-05-05
**Author:** Stephen P. Lutar
**Scope:** Exhaustive inventory of every formula in the V8/V9/V10 thesis chain
*and* every formula implementation in the live codebase, mapped to each other,
with drift documented. Built per Task #4776.

> Companion doc to the v9 lutar-only audit: [`formula-thesis-gaps.md`](./formula-thesis-gaps.md).
> That doc closed the **lutar** family. This doc closes the **whole platform**.

---

## 1. Method

For each formula:

1. Find the **thesis section** that defines it (`docs/thesis/v10-canonical.md`,
   `docs/thesis/v9-canonical.md`, etc.).
2. Find every **code-side implementation** (`lib/`, `artifacts/`, `services/`,
   `workers/`, `archive/`).
3. Pick the **canonical version** — thesis wins on conflict.
4. Centralise it under `lib/formulas/` (or, for the lutar family,
   `@workspace/lutar-formulas` re-exported from `@szl-holdings/formulas`).
5. Replace every duplicate site with a `@szl-holdings/formulas` import.
6. Wire the formula into the A11oy `/formulas` Codex surface so the
   thesis citation, parameter values, and recent invocations are visible
   to operators.

---

## 2. Canonical registry — `lib/formulas/src/registry.ts`

The single source of truth at runtime. Every entry has provenance,
parameter list, consumers, and a typed pure function.

| # | id                       | Domain      | Thesis ref          | Version | Consumers (representative)                                                              |
|---|--------------------------|-------------|---------------------|---------|------------------------------------------------------------------------------------------|
| 1 | `lutar-invariant-5`      | invariant   | v10 §2.5            | 1.0.0   | sentra brain proof, a11oy ProofLedger, api-server ouroboros routes                       |
| 2 | `l-omega-router`         | routing     | v10 §2.7            | 1.0.0   | api-server model-router, lib/ai-engine router, a11oy ModelRouter page                    |
| 3 | `xi-unification`         | routing     | v10 §2.7            | 1.0.0   | lib/lutar-formulas router                                                                |
| 4 | `propeller-alignment`    | optimization| v10 §2.7            | 1.0.0   | lib/lutar-formulas router                                                                |
| 5 | `risk-score`             | risk        | v10 §5.2            | 1.0.0   | sentra brain risk, counsel matter-risk, terra deal-score                                 |
| 6 | `drift-score`            | risk        | v10 §5.4            | 1.0.0   | sentra brain rosie-loop                                                                  |
| 7 | `autonomy-gate`          | governance  | v10 §4.3            | 1.0.0   | sentra brain autonomy, api-server a11oy-runtime                                          |
| 8 | `escalation-delay`       | governance  | v10 §4.4            | 1.0.0   | api-server a11oy-runtime                                                                 |
| 9 | `proof-closure-score`    | scoring     | v10 §2.6 (Λ₁₀)      | 1.0.0   | a11oy ProofLedger, sentra brain proof                                                    |
|10 | `rosie-proposal-score`   | evolution   | v10 §6.1            | 1.0.0   | sentra brain rosie-loop                                                                  |

The Lutar family (v1..v7+Ω, helpers, codex traversal) is **already audited and
closed** by the prior v9 report (see §3 below). It is re-exported from
`@szl-holdings/formulas` so callsites have a single ergonomic entry point.

---

## 3. Lutar family — closed by v9 audit

The eight Lutar layers and 20 helpers are catalogued in
[`formula-thesis-gaps.md`](./formula-thesis-gaps.md). All are CLOSED with
CODE / API / CODEX / TEST / THESIS columns resolved. The live audit
(`POST /api/ouroboros/lutar/v10`) returns ρ = 1.000, missingArtefacts = [].

This doc therefore focuses on the **non-Lutar formula corpus** — governance,
risk, scoring, routing, evolution — that the platform uses every minute.

---

## 4. Drift findings — pre-consolidation state

| Formula                        | Pre-state (drift)                                                                               | Post-state                                                                            |
|--------------------------------|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| Risk score                     | Three independent implementations: sentra inline, counsel `matter-risk.ts`, terra `deal-score.ts`. Each used a different cap and clipping policy. | Single impl: `lib/formulas/src/risk.ts` `riskScore`. Cap is a tunable parameter under governance.        |
| Autonomy gate                  | Hard-coded thresholds (0.3, 0.7) inline in two routes; no docs reference.                       | `lib/formulas/src/governance.ts` `autonomyGate`. Thresholds tunable; cited in v10 §4.3. |
| Escalation back-off            | Custom `setTimeout` chain with no ceiling.                                                      | `escalationDelaySeconds` with bounded exponential back-off; tunable t₀ and t_max.      |
| Proof-closure score            | Computed twice — once inside Sentra, once inside A11oy ProofLedger — with subtly different denominators. | `proofClosureScore` — one impl, both surfaces import it.                                    |
| Distribution drift             | Implicit in three places (router, sentinel, eval-os) using different epsilons.                  | `driftScore` — KL-approx with one shared epsilon.                                       |
| L_Ω router weights             | The six Ω weight presets duplicated across api-server router, lib/ai-engine, and the A11oy UI defaults. | Re-exported from `@workspace/lutar-formulas/omega` `OMEGA_MODES` via `@szl-holdings/formulas`.       |
| ROSIE proposal scoring         | Did not exist as a formula — was prose in the thesis.                                           | `rosieProposalScore` — first canonical impl, cited in v10 §6.1.                         |

---

## 5. Centralisation contract

Going forward:

1. **Every** scoring / weighting / threshold / decision rule lives in
   `lib/formulas/`.
2. **Every** consumer imports it via `@szl-holdings/formulas`.
3. **Every** invocation that crosses a tenant or governance boundary uses the
   `instrument(spec)` wrapper so the proof ledger can record it.
4. **Every** parameter change goes through the
   `formula_tuning_proposals` queue → A11oy approval → `formula_versions`
   history.

Adding a new formula requires (per Convention §5 of the v9 audit, extended
here to the whole platform):

1. A section in the next canonical thesis document.
2. An entry in `FORMULA_REGISTRY` with full provenance.
3. A typed pure function in `lib/formulas/src/`.
4. An update to this audit table.
5. (For mutating callsites) instrumented usage with `caller=` for traceability.

---

## 6. A11oy Codex surface

The `/formulas` page in A11oy renders this catalog directly from the
registry, with:

- list of all formulas (filterable by domain),
- detail view with thesis citation, equation, parameter table, recent
  invocations log, and version history,
- governed tuning panel (operator-only) that pushes a tuning proposal
  into the `formula_tuning_proposals` queue.

The same data is exposed via REST under `/api/a11oy/formulas/*`:

- `GET  /api/a11oy/formulas/catalog`               — registry summary
- `GET  /api/a11oy/formulas/detail/:id`            — one formula + active params
- `GET  /api/a11oy/formulas/invocations/:id`       — recent invocations
- `GET  /api/a11oy/formulas/history/:id`           — version history
- `POST /api/a11oy/formulas/propose-tuning`        — submit a proposal
- `POST /api/a11oy/formulas/approve-tuning/:id`    — approve (operator)
- `POST /api/a11oy/formulas/reject-tuning/:id`     — reject (operator)

---

## 7. ROSIE evolution loop

`evaluateObservedEvent(event, config)` in `lib/formulas/src/evolution.ts`
encodes the observe → score → propose primitive. Sentra's brain feeds
events into it from every signal; when the score crosses the
`scoreMin` floor a row lands in `formula_tuning_proposals` with status
`pending`. The A11oy operator either approves (the new value becomes
the active parameter and a row is appended to `formula_versions`) or
rejects (the proposal is closed).

The loop is **bounded autonomy** — no parameter change ever applies
without an operator decision, in line with `docs/A11OY_NON_NEGOTIABLES.md`.

---

## 7a. Observed-vs-baseline meta contract

`instrument(spec, caller?, metaFn?)` (see `lib/formulas/src/instrument.ts`)
accepts an optional **meta extractor** that is invoked after the formula
impl runs. Its return value rides along on
`FormulaInvocation.meta` and is consumed server-side by
`formulaInvocationDriftBridge`
(`artifacts/api-server/src/jobs/rosie-evolution-loop.ts`), which
unpacks it into a `DriftObservation` for the shared drift detector. The
scheduled `runRosieEvolutionTick` then drains drifting buckets into the
A11oy Codex tuning queue (`formula_tuning_proposals`).

For the bridge to record an observation, **all** of these keys must be
present on `meta` and well-typed:

| Key              | Type     | Meaning                                                                |
|------------------|----------|------------------------------------------------------------------------|
| `observed`       | `number` | Real measured value the callsite just produced.                        |
| `baseline`       | `number` | Expected/target value for this input class; `\|observed − baseline\|` is the drift sample. |
| `parameter`      | `string` | Name of the registry parameter being tuned (must exist on the formula).|
| `oldValue`       | `number` | Current value of `parameter` (the registry default unless overridden). |
| `candidateValue` | `number` | Suggested new value if drift breaches ROSIE thresholds.                |
| `thesisCitation` | `string` | `thesisDoc §section` so proposals stay traceable.                      |
| `irreversibility`| `number` | Optional. In `[0,1]`. Higher = more cautious ROSIE scoring.            |

Any additional fields are passed through unchanged (useful for debugging
diagnostics like `callsite`). If any required field is missing or
malformed the bridge silently drops the observation — the hot path is
never broken by metadata mistakes.

**Reference instrumented callsites** (server-side; the browser sink is a
no-op so frontend `instrument()` calls never reach the bridge):

1. `POST /api/sentra/ml/asset-risk` — emits `risk-score` meta with
   `observed = p30dCompromise`, `baseline` from the criticality bucket.
2. `POST /api/sentra/ml/blast-radius` — emits `risk-score` meta with
   `observed = p7dLateralPath`, `baseline` per identity type.
3. `POST /api/sentra/ml/adversary-replay` — emits `risk-score` meta with
   `observed = overallSuccessRate`, baseline `0.30`.

Wiring lives in `artifacts/api-server/src/lib/sentra-formula-observations.ts`.

---

## 8. After-state summary

- Single canonical formula library: `lib/formulas/` (10 entries today,
  growing as the thesis grows).
- Single registry surface: A11oy `/formulas`.
- Single API namespace: `/api/a11oy/formulas/*`.
- Single proof emission path: `instrument(spec, fn)`.
- Single tuning queue: `formula_tuning_proposals` table.
- Single audit doc: this file.

Drift is now detectable with one query — any consumer that *doesn't* import
from `@szl-holdings/formulas` will be flagged by the next dependency-health
sweep.
