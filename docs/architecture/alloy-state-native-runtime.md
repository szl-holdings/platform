# Alloy State-Native Runtime

**Status:** Operational reference implementation
**Package:** `@workspace/a11oy-runtime/state-native`
**Public-claim boundary:** Active prototype and investor-demo infrastructure; not a claim of a
production Kimi K3, Mooncake, LMCache, NIXL, or customer deployment.

## Purpose

The Alloy State-Native Runtime makes expensive execution state a governed object instead of an
untracked per-request by-product. It adds two executable control-plane primitives to A11oy:

1. **Alloy State Bus** — encrypted, content-addressed State Capsules with tenant, session,
   compatibility, retention, sensitivity, provenance, revocation, transfer, and reuse policy.
2. **Alloy Kernel Runtime** — epoch-pinned context, planning, prefill, decode, tool, multimodal,
   policy, and verification kernels that consume and produce State Capsules under a governed action
   envelope and signed receipt.

The implementation borrows the architectural idea of disaggregating expensive state movement and
compute stages. The original SZL layer is the compatibility, policy, approval, evidence, receipt,
retention, and release boundary. No upstream repository code is copied into this package.

## Runtime path

```text
Governed Action Envelope
  → exact request digest
  → policy / approval gate
  → active Cognitive Epoch lease
  → compatible State Capsule reads
  → bounded kernel execution
  → mandatory verifier where declared
  → encrypted output State Capsules
  → Ed25519 kernel receipt
  → receipt persistence
  → releasable output
```

A receipt persistence failure quarantines every newly produced output. The runtime never returns a
successful result without a persisted signed receipt.

## State Capsule

A State Capsule separates metadata from encrypted payload bytes. The capsule ID is a SHA-256
content address over tenant, session, state type, portability tier, content digest, compatibility,
governance, provenance, and expiry.

Payload encryption uses a random AES-256-GCM data key per capsule. The data key is wrapped under the
runtime master key with separate AES-256-GCM authenticated encryption. Crypto-shred removes the
wrapped key and ciphertext while retaining terminal metadata and transition evidence.

### Portability tiers

| Tier | Intended state | Required compatibility |
|---|---|---|
| P0 | Raw provider/engine session state | Model, revision, engine, tokenizer, layout, adapters, policy, epoch, provider session |
| P1 | Engine-bound KV or activation state | Model, revision, engine, tokenizer, layout, adapters, policy, epoch |
| P2 | Model-bound derived state | Model, revision, tokenizer, adapters, policy, epoch |
| P3 | Semantic-space state | Semantic-space digest, schema digest, policy, epoch |
| P4 | Structured portable state | Schema digest, policy, epoch |
| P5 | Policy-scoped control metadata | Policy and epoch |

Missing fields fail compatibility. A looser tier is never inferred automatically.

### Reuse policies

- `never` — cannot be read after creation.
- `same_action` — only the originating action may read it.
- `same_session` — only the originating tenant/session may read it.
- `same_tenant` — any authorized session in the same tenant may read it.
- `explicit` — requires an exact grant identifier in addition to tenant isolation.

Sensitivity authorization and compatibility checks are separate conjunctive gates.

## Cognitive epochs

A Cognitive Epoch pins the exact model revision, engine, tokenizer, state layout, adapters,
verifiers, prompt bundle, policy bundle, and tool manifest used by a request.

```text
PREPARED → VALIDATED → ACTIVE → DRAINING → RETIRED
                 ↘ REJECTED
ACTIVE + zero leases → ROLLED_BACK → prior validated/retired epoch ACTIVE
```

Activation drains the previous epoch. Existing requests retain leases to their original epoch;
new requests pin the new active epoch. A draining epoch retires only after its final lease releases.

## Sealed provider-state vault

`ReasoningVault` stores opaque provider continuity state for APIs that require the exact previous
assistant/tool state on the next request. It is not a general transcript logger and must not be used
to expose private reasoning.

Bindings are exact across tenant, session, model ID, model revision, and cognitive epoch. Lifecycle:

```text
PREPARED → IN_FLIGHT → COMPLETE | REJECTED | INDETERMINATE → SHREDDED
```

An `INDETERMINATE` entry cannot be replayed automatically. This prevents duplicate consequential
provider execution after an ambiguous network boundary.

## Transport adapters

`StateTransportAdapter` defines the state data-plane seam. The included in-memory adapter exists for
conformance tests and local demonstration only. Mooncake, LMCache, NIXL, object storage, or other
transports must implement this interface and pass digest, tenant, revocation, compatibility, and
failure-injection conformance before production admission.

Transport availability never overrides policy. A successful byte transfer is not permission to
reuse the state.

## Kernel registration

A kernel declares an immutable ID and version, kind and route, bounded `execute` function, whether
independent verification is required, and a verifier function when required. Registration fails if
a verification-required kernel lacks a verifier. Duplicate kernel IDs fail closed.

## Action and approval binding

Each execution requires `szl.governed-action/v1`. The envelope must identify the same tenant and
kernel, declare state mutation, and carry the exact digest returned by `kernelRequestDigest()`.

When policy returns `approval_required`, approval evidence must bind to the same action and exact
request digest. Broad natural-language authorization is not accepted as machine approval evidence.

## Idempotency and ambiguous completion

State writes and kernel executions accept explicit idempotency keys. Reuse with changed protected
inputs is rejected as divergent replay. A completed kernel request returns the original immutable
result. An execution that crossed the kernel boundary and then failed is held `INDETERMINATE` and
is not automatically retried.

## Receipt contract

Every terminal kernel receipt contains exact input/output capsule IDs and content digests, epoch,
policy decision, approval ID where applicable, verifier evidence, budgets, measured runtime, and
prior receipt digest. The receipt digest is signed with Ed25519.

The verifier recomputes the canonical receipt digest and checks the signature against an externally
pinned public key. Key distribution and durable production receipt storage remain deployment
responsibilities; private keys are never serialized by this package.

## Local verification

```bash
pnpm --filter @workspace/a11oy-runtime typecheck
pnpm --filter @workspace/a11oy-runtime test
pnpm --filter @workspace/a11oy-runtime demo:state-native
```

The demo performs no network calls. It creates an epoch, encrypted input state, verified kernel
transition, encrypted output state, signed receipt, local transport receipt, sealed provider-state
lifecycle, and crypto-shred. Its terminal status is `OPERATIONAL_REFERENCE`, not `PRODUCTION`.

## Current boundaries

Implemented and locally verified:

- in-memory encrypted State Bus;
- P0–P5 compatibility enforcement;
- reuse, sensitivity, tenant, expiry, revocation, quarantine, and crypto-shred gates;
- cognitive epoch activation, pinning, draining, retirement, and rollback;
- sealed provider-state lifecycle;
- kernel budgets, policy/approval binding, mandatory verifier, idempotency, and fail-closed receipt persistence;
- Ed25519 execution receipts and offline verification;
- transport adapter contract and local adapter.

Not claimed by this change:

- durable Postgres/S3/MinIO State Bus;
- cross-process distributed locking;
- production KMS/HSM key custody;
- Mooncake, LMCache, NIXL, or GPU transfer deployment;
- live Kimi K3 inference;
- external production deployment, customer traffic, uptime, or performance improvement.

Those boundaries require separate independently reversible workcells with exact infrastructure and
live evidence.
