# @szl-holdings/formulas

The **canonical formula library** for the SZL Holdings platform. Every scoring
heuristic, governance threshold, risk calculation, routing decision, and proof
score that operates on production data lives here as a typed pure function with
**provenance metadata** pointing back to its thesis section, version, and
first-seen commit.

## Why this package exists

The user's intellectual property — every formula — lives **canonically in the
V8/V9/V10 thesis corpus** (`docs/thesis/v10-canonical.md`) and was historically
**derivatively scattered** across ROSIE, A11oy runtime, api-server, workers,
connectors, lib/ai-engine, and inline component constants.

This package closes that loop:

1. The thesis is the source of truth.
2. Every formula in the thesis has exactly one canonical implementation here.
3. Every site in the monorepo imports from `@szl-holdings/formulas` —
   no duplicates remain.
4. Every invocation emits a proof-ledger entry (when the instrumented variant
   is used), so any decision is fully traceable.

## What's inside

| Module        | Purpose                                                                        |
|---------------|--------------------------------------------------------------------------------|
| `registry`    | The catalog: `FormulaSpec[]` with provenance for every formula                 |
| `instrument`  | `instrument(spec, fn)` — wraps a pure function with proof-ledger emission       |
| `governance`  | Approval thresholds, autonomy gates, escalation rules                          |
| `risk`        | VaR-style risk scoring, drift detection, severity weighting                    |
| `scoring`     | Generic [0,1] scorers used by Sentra, Counsel, Terra                           |
| `routing`     | Re-export of the Lutar Ξ router with provenance                                |
| `evolution`   | The **ROSIE loop primitive** — observe → score → propose tuning                |

## Provenance contract

```ts
export interface FormulaProvenance {
  /** Thesis document filename (e.g. 'v10-canonical.md'). */
  thesisDoc: string;
  /** Section reference (e.g. '§2.7' or '§5.3'). */
  thesisSection: string;
  /** Thesis version identifier (e.g. 'v10'). */
  thesisVersion: string;
  /** Git commit where this formula first landed. */
  firstSeenCommit?: string;
  /** Equation rendering for the UI. */
  equation: string;
  /** Plain-English intent. */
  intent: string;
}
```

Every `FormulaSpec` carries these fields so the A11oy `/formulas` Codex
surface can render the citation alongside the live parameter values.

## Governance

Parameter changes flow through a tuning queue:

1. ROSIE observes Sentra events and scores them against the formula.
2. If performance falls below threshold OR a recurring pattern is detected,
   ROSIE proposes a parameter tuning to the A11oy governance queue with
   thesis-cited evidence.
3. A11oy operator approves (or rejects).
4. On approval, the new version becomes default; the proof ledger records
   the version delta and the chain of reasoning.
