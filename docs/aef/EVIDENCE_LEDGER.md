# AEF Evidence Ledger

## Current status: development/test only

The checked-in `@workspace/aef-evidence-ledger` package is not an authoritative
production audit ledger. `defaultLedgerStore` wraps an `InMemoryLedgerStore`:
records disappear on restart and the public `clear()` method can delete them.
The optional `FilesystemLedgerStore` appends mutable JSONL to a local file, but
it also supports `clear()`, skips malformed lines, and has no authenticated
sequence, previous-entry hash, signature, or independent verifier.

For that reason, production embed, rerank, hybrid-search, and multimodal-embed
routes return HTTP 503 with `EVIDENCE_LEDGER_DURABILITY_REQUIRED` before model
execution or evidence-ID minting. `/readyz` reports the ledger as
`EVALUATION_HOLD`. No environment variable can promote either checked-in store.

## What exists today

Development and test requests write one `EvidenceEntry` per returned item or
hit. The schema in `packages/aef-evidence-ledger/src/types.ts` records request,
tenant, profile, source/chunk, scores, policy outcome, model/runtime identity,
and timestamps when those fields are available. The records are useful for
contract tests and local inspection only.

Current limitations include:

- no durable default backend;
- no atomic request-level record or zero-result record;
- no hash chain, signature, trusted timestamp, or independent integrity check;
- no authenticated writer/reader authority;
- no implemented retention, archival, or deletion workflow;
- no crash, concurrency, backup/restore, or cross-process proof.

## Production acceptance contract

A future production ledger must be configured through an explicit backend and
pass a live readiness probe. Promotion requires evidence for all of the
following:

1. Durable, tenant-scoped storage survives process and host restart.
2. Each admitted request is recorded atomically, including denials and
   zero-result outcomes, with a payload fingerprint and stable request ID.
3. Entries are append-only and tamper-evident through a hash chain or an
   equivalent independently verifiable integrity mechanism.
4. Writer identity, authorization, ordering, and concurrency behavior are
   defined and tested.
5. Retention, legal hold, deletion, export, backup, restore, and corruption
   handling are implemented and witnessed.
6. Readiness verifies the same backend used by request execution; a configured
   path or hash-shaped field alone is not sufficient.

Until that contract is implemented, local evidence IDs must never be described
as immutable, non-repudiable, complete, or suitable for legal/audit production.

## Relationship to the proof chain

The intended evidence ledger is one input to SZL's broader proof-chain design.
The current local recorder does not establish that proof chain and must not be
used as authority for downstream governance claims.
