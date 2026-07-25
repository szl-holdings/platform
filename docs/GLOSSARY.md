# SZL Holdings — Canonical Governance Vocabulary

**Status:** Canonical

**Effective:** 2026-07-25

**Owner:** Engineering / Governance

This glossary separates four concepts that older documents sometimes called a
"surface." New or materially revised canonical documentation must use the
terms below. Canonical counts remain sourced from `SOURCE_OF_TRUTH.md`,
`audit/source-of-truth.json`, and the generated live-evidence registry at
`artifacts/SOURCE_OF_TRUTH.json`.

| Canonical term | Definition | Count rule | Do not call it |
|---|---|---|---|
| **Holographic state** | A state or wave in the holographic/visual model. | Counted only by the model or wave manifest that declares it. | surface |
| **Product vertical** | A customer-facing domain product with a registered `artifact.toml` and an explicit domain purpose. | Counted from registered vertical artifacts; A11oy is the orchestration product, not a vertical. | surface, organ |
| **Runtime organ** | A deployable or addressable runtime participant in the governed mesh. | Counted from the runtime organ registry or deployment manifests. | surface, vertical |
| **Policy gate module** | A code module that evaluates policy and may return ALLOW, DENY, or BLOCKED. | Counted from the canonical policy-gate manifest, never from marketing copy. | surface, organ |

## Supporting terms

| Term | Definition |
|---|---|
| **Registered artifact** | A tracked artifact directory containing `.replit-artifact/artifact.toml` or `artifact.toml`. Registration proves discoverability, not production readiness. |
| **Orchestration product** | A cross-vertical product such as A11oy that coordinates governed work across product verticals. It is counted separately from product verticals. |
| **Public repository** | A GitHub repository whose current visibility is `public`. Repository visibility does not prove conformance or production readiness. |
| **Conformant vertical** | A product vertical that has passed the current vertical conformance suite at a cited commit and CI run. Until that evidence exists, the status is **UNVERIFIED**. |
| **Locked doctrine metric** | A frozen measurement tied to a named kernel commit. It is not recalculated from experimental `main`. |
| **Evidence status** | One of LIVE, MODELED, PLANNED, REPORTED, UNAVAILABLE, CURRENT-TREE, LOCKED, OBSERVED, HISTORICAL, or UNVERIFIED. It describes evidence state and never implies customer traction. |

## Writing rules

1. Use **product vertical** for customer-facing domain products.
2. Use **runtime organ** for governed mesh participants.
3. Use **policy gate module** for executable policy evaluators.
4. Use **holographic state** for model or wave states.
5. A bare use of "surface" is allowed only for ordinary UI or attack-surface
   prose where none of the four governed concepts above is intended.
6. Every published count must cite its registry, manifest, command, commit, or
   CI run. If none is available, label the count **UNVERIFIED** and do not place
   it in the canonical metrics table.
