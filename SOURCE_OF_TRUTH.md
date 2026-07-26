# SZL Holdings — Source-of-truth index

This file is an index, not a hand-maintained metric table. Current claims come from
two machine-readable records with deliberately different scopes.

## Repository structure

[`audit/source-of-truth.json`](audit/source-of-truth.json) is the canonical registry
for reproducible facts about the tracked platform tree: registered artifacts, package
directories, schema and migration files, static route declarations, workflows,
environment declarations, and the locked Doctrine contract.

`node scripts/audit/validate-source-of-truth.js` recomputes those facts from the
checked-out Git index and fails on drift. Source counts do not prove deployment,
reachability, authentication, or provisioned world state.

## Live and investor evidence

[`artifacts/SOURCE_OF_TRUTH.json`](artifacts/SOURCE_OF_TRUTH.json) is the dated public
evidence record. Every value carries one of these labels:

- `MEASURED`
- `REPORTED`
- `MODELED`
- `CONJECTURE`
- `UNKNOWN`
- `UNAVAILABLE`

Unavailable evidence is represented by `null`; it is never inherited from an older
green state. `pnpm truth:check` verifies local reproducible measurements, the evidence
schema, and the public-claims drift ledger.

## Authority rules

1. Never copy a number into this index.
2. Never use a source declaration count as a runtime or deployment claim.
3. Never promote third-party or historical evidence to `MEASURED`.
4. Regenerate the affected record and commit its evidence when a claim changes.
5. A disagreement between the two records is not automatically drift: first compare
   their scopes. A mismatch inside the same scope is release-blocking.

Historical snapshots remain in the audit and documentation archives with their
original dates and labels. They are evidence of what was previously reported, not
current company facts.
