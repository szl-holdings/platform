# Embedding vector admission — bounded source proof

- `workcell_id`: EMBEDDING-VECTOR-ADMISSION-20261102
- `agent`: OpenAI Codex
- `objective`: reject malformed provider vectors before they can be cached or
  counted as successful, and replace the batch zero-vector fallback with an
  explicit result that callers cannot index.
- `source_base`: `21d4ee44d4eb9b3a8fcb30530b02f9de6ff52537`
- `proof_level`: 2
- `recorded_at`: 2026-11-02T03:57:00Z
- `recorded_by`: OpenAI Codex

## Plan summary

Inspect the provider pipeline and every in-repository batch consumer, establish
the expected vector dimensions, reproduce the malformed-vector and fallback
behavior, introduce one discriminated batch contract, update all consumers, and
exercise invalid, successful, cache, and provider-health paths. No deployment,
credential, data-store, or UI change was planned.

## Patch summary

`lib/ai-engine/src/embedding/provider.ts` now rejects empty, wrong-dimension,
NaN, and infinite vectors before provider-health success, cache insertion, or
analytics success. Expected dimensions remain local to response validation and
cache identity, so domain configuration does not change compatible-provider
request payloads. Cached embeddings are copied on write and read so a caller
cannot corrupt a later cache hit by mutating its returned array.

Batch items are now a discriminated union. Successes carry `ok: true` and an
embedding; failures carry `ok: false`, input position, text, and error only.
An all-failure batch reports null summary provider/model values instead of a
mock provider. The analytics endpoint and the three storage/retrieval consumers
now narrow on `ok` before accessing an embedding. Both package export surfaces
expose the new item types. A focused Vitest module covers the contract.

## Test results

| Command or check | Exit | Result |
| --- | ---: | --- |
| Baseline `pnpm --filter @szl-holdings/ai-engine typecheck` | 1 | Blocked before TypeScript: runner pnpm 11.19.0 does not satisfy repository pin 10.26.1. |
| Candidate `pnpm --filter @szl-holdings/ai-engine typecheck` | 1 | Same pre-execution pnpm engine blocker as baseline. |
| Candidate `pnpm qa:routes` | 1 | Same pre-execution pnpm engine blocker; route checks did not run. |
| `COREPACK_HOME=/tmp/corepack corepack pnpm@10.26.1 --version` | 1 | The runner proxy rejected the pinned-package download with HTTP CONNECT 403. |
| Original-source Node 24 negative-control harness | 0 | Reproduced non-finite/wrong-dimension admission, the 384-zero `error-fallback`, and cache-array aliasing. |
| Candidate Node 24 runtime harness | 0 | 13 scenarios passed: dimension mismatch, NaN, positive/negative infinity, empty vector, analytics accounting, dimension-aware cache, cache mutation isolation, success/failure batch contracts, real Hugging Face provider-health failure accounting, and compatible API payload preservation. |
| Node 24 TypeScript syntax transform | 0 | All eight changed/new TypeScript files parsed. |
| `git diff --check` | 0 | No whitespace errors. |

The committed Vitest cases could not execute locally because the workspace has
no installed dependency graph and the pinned package manager could not be
downloaded. Exact-head hosted typecheck, lint, tests, route checks, and security
checks remain required before merge.

## Verification notes

The original and candidate harnesses execute transformed copies of the actual
provider module, not a reimplementation of its pipeline. The candidate harness
also exercises the real Hugging Face provider with a bounded fetch double and
confirms the invalid output increments failure health without recording a
success latency. An independent source review caught and removed an earlier
candidate change that forwarded domain-derived dimensions to provider requests;
the final payload regression preserves the existing compatible API shape.
Repository and accessible organization default-branch search
found four batch consumers, all in this package; each was updated. No external
published-package consumer was qualified, so the intentional batch type and API
response change requires normal review and versioning discipline.

- `screenshot_refs`: N/A; no UI surface changed.
- `public_claim_check`: no customer, compliance, deployment, performance, or
  readiness claim was added.
- `security_check`: no secret, credential, token, environment value, permission,
  or network target was added or changed. Test provider responses are inert.
- `known_gaps_update`: no registered gap entry was closed. Existing durable AEF
  ingestion, evidence-ledger, provider-availability, and deployment holds remain
  unchanged; this patch only prevents malformed vectors from being admitted as
  usable embeddings.

## Limits and rollback

This is bounded source and offline runtime evidence. It does not qualify any
embedding provider, live model, vector database, deployment, or data migration.
Mixed-version clients that still expect failure objects to contain an embedding
must adopt the `ok` discriminant. Rollback is a protected revert; the in-memory
cache requires no migration. No merge, workflow dispatch, provider call, or
deployment was performed while assembling this packet.
