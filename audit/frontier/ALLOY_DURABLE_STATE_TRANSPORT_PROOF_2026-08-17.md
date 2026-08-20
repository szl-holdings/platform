# Proof Packet — Alloy Durable State Transport

**Workcell:** `A11OY-STATE-002`  
**Date:** 2026-08-17  
**Scope:** Additive encrypted filesystem persistence for portable State Capsules  
**Claim level:** Package-workflow verified durable single-host transport; full protected CI remains authoritative

## Context

The state-native runtime already had encrypted in-memory State Capsules, P0–P5 compatibility,
cognitive epochs, a sealed provider-state vault, verified kernels, signed receipts, and an in-memory
transport conformance adapter. The architecture document correctly kept durable and distributed
storage red.

This workcell advances that boundary without claiming Postgres, S3, MinIO, Mooncake, LMCache, NIXL,
Kimi K3 inference, distributed locking, production KMS custody, or a deployed service.

## Plan

1. Add a real filesystem-backed `StateTransportAdapter` using only repository-approved Node
   primitives.
2. Encrypt every payload under an independent AES-256-GCM data key wrapped by the configured
   transport master key.
3. Authenticate the complete immutable State Capsule as additional authenticated data.
4. Publish records atomically with an fsynced temporary inode and a no-replace hard link.
5. Shard paths by the canonical `state_<sha256>` identity and reject noncanonical IDs before path
   construction.
6. Bound payload and record reads, bind reads to opened descriptors, and reject links or special
   files.
7. Make deletion terminal through an HMAC-authenticated, digest-bound tombstone written before
   object removal.
8. Add exact readback, concurrent idempotency, tamper, wrong-key, traversal, budget, reopen,
   tombstone-forgery, symlink-redirection, unlink-target-preservation, and resurrection tests.

## Patch boundary

- `packages/a11oy-runtime/src/state-native/filesystem-transport.ts`
- `packages/a11oy-runtime/src/state-native/index.ts`
- `packages/a11oy-runtime/schemas/state-transport-deletion.v1.schema.json`
- `packages/a11oy-runtime/test/state-native-filesystem-transport.test.mjs`
- `packages/a11oy-runtime/package.json`
- `docs/architecture/alloy-state-native-runtime.md`
- this proof packet

No UI, route, database schema, deployment, secret, DNS, environment, visibility, branch protection,
license, or external account is changed.

## Implemented security and durability properties

- canonical `state_<sha256>` IDs only;
- two-level content-addressed sharding;
- AES-256-GCM payload encryption;
- per-record random data key wrapped by a 32-byte master key;
- complete capsule metadata bound as AES-GCM AAD;
- record digest verification before decryption;
- payload byte-length and SHA-256 verification after decryption;
- atomic no-replace publication through an fsynced temporary file plus hard link;
- cleanup of failed temporary write candidates;
- directory fsync required by default on supporting non-Windows systems;
- exact post-write readback;
- idempotent concurrent same-object writes;
- deletion-state rechecks across existing-object and publication races;
- divergent protected-input rejection;
- bounded record reads and configurable payload ceiling;
- descriptor-bound, bounded no-follow reads with post-read descriptor and path identity checks;
- link and special-file rejection for records and every created shard component;
- direct unlink cleanup that removes a replaced link entry without following its target;
- HMAC-SHA-256-authenticated deletion receipts bound to the prior record digest;
- terminal deletion receipts written before object removal;
- no resurrection after a valid deletion receipt;
- wrong-key, record tamper, tombstone forgery, and link redirection failure as a closed result.

## Validation

### Initial dependency-isolated validation

A dependency-isolated TypeScript harness used the repository's exact canonical hashing, encryption,
error, and transport contracts.

```text
tsc --pretty false
result: PASS

node --test test/filesystem-transport.test.mjs
result: PASS

node --check dist/state-native/filesystem-transport.js
result: PASS
```

Initial adapter blob:

```text
0cb2198e3df05a74acbb694348a5751390cc03bc
```

That blob established the encrypted persistence, tamper, wrong-key, terminal deletion, traversal,
quota, tombstone-authentication, and stable symlink-rejection boundary before Advanced Security
identified a path check/use race.

### Descriptor-bound successor validation

A one-use same-repository workcell generated the successor from the protected feature branch, ran the
exact frozen workspace install and package test command, deleted both temporary workflows and the
patch script, and then published only the reviewed source changes.

```text
pnpm install --frozen-lockfile --ignore-scripts
result: PASS

pnpm --filter @workspace/a11oy-runtime test
result: PASS
```

Tested source-only tree:

```text
5bf6256f9564990b0b344e6bb0421f9f71aa8b92
```

Current adapter blob:

```text
3b979b7b0b971d65cd1de0eae06ca0932cc775e4
```

Additional successor coverage verifies that terminal cleanup unlinks only the canonical directory
entry and does not follow a replacement symlink to an external target. Current-head CodeQL and the
complete protected repository matrix remain the merge authority; the package workcell is not
represented as the full monorepo result.

## Screenshot

`N/A` — no visual surface or public route changed.

## Secret and privacy review

- No token, API key, credential, `.env`, private key, or production master key is committed.
- Tests generate keys in memory.
- Plaintext payloads are not persisted by the adapter.
- File paths contain only the content-addressed capsule ID, never tenant, session, prompt, or tool
  output text.
- The adapter stores opaque provider continuity state only when the existing governance layer has
  already authorized export.

## Boundaries retained as red

- multi-host consensus and distributed locking;
- object-store or database durability;
- KMS/HSM key custody and rotation;
- backup, restore, disaster recovery, and retention-policy operators;
- complete protection from an adversary with concurrent same-user mutation of the private storage
  tree beyond the explicit descriptor, identity, no-follow, directory-mode, and unlink controls;
- Mooncake, LMCache, NIXL, GPU, or Kimi K3 deployment;
- externally observed performance, uptime, customer traffic, or production use.

## Result

The State Bus now has a real encrypted, restart-surviving, fail-closed single-host transport option.
The next independently reversible frontier is an object-store adapter with conditional writes,
versioning, KMS envelope keys, deletion markers, and a live failure-injection proof.
