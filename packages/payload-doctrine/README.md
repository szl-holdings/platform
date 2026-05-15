# @szl-holdings/payload-doctrine

Typed, build-time canonical SZL Holdings payload. The package is a single
source of truth for the V6 doctrine, the 13-DOI ledger, the 16-repo
GitHub inventory, the push queue, the 9-axis Λ-gate, and the
A11oy axiom / theorem / derivation / constant indices.

## Exports

- `DOCTRINE_V6` — Doctrine V6 snapshot (replay root, byline, ORCID, Λ floors)
- `PAYLOAD_SCHEMA_VERSION`, `PAYLOAD_GENERATED_AT`, `PAYLOAD_COMPONENTS`,
  `FILE_INTEGRITY_COUNT` — manifest metadata
- `DOI_LEDGER` — 13 DOI entries (concept + paper v1..v11 + runtime v6.3.0)
- `REPOS`, `ORG_SUMMARY` — 16-repo inventory + org-wide summary metrics
- `PUSH_QUEUE_READY`, `PUSH_QUEUE_BLOCKED` — release queue
- `LAMBDA_AXES` — 9 axes of the Λ-gate with per-axis floors
- `A11OY_AXIOMS`, `A11OY_THEOREMS`, `A11OY_DERIVATIONS`,
  `A11OY_CONSTANTS`, `A11OY_ARTIFACT_PAYLOAD`

## Doctrine snapshot

```
Λ floor          : 0.90 (conjunctive 9-axis AND)
moralGrounding   : ≥ 0.95
measurability    : ≥ 0.95
replay root      : 1ed4d253e876f428c6e182f8ed8a569585442556b339529bbf8ec2522581698b
byte-identical   : 5×
ingestion policy : PUBLIC_ONLY
license allow    : Apache-2.0, MIT, BSD-3-Clause, CC-BY-4.0
```

Consumed by `artifacts/api-server` (Express route group
`/api/a11oy/payload/*`), `artifacts/a11oy`, and the vertical embeds.
