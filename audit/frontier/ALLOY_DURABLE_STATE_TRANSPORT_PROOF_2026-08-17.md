# Proof Packet — Alloy Durable State Transport

**Workcell:** `A11OY-STATE-002`  
**Date:** 2026-08-17  
**Scope:** Additive encrypted filesystem persistence for portable State Capsules  
**Claim level:** Locally verified durable single-host transport; protected CI remains authoritative

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
6. Bound payload and record reads and reject links or special files.
7. Make deletion terminal through an HMAC-authenticated, digest-bound tombstone written before
   object removal.
8. Add exact readback, concurrent idempotency, tamper, wrong-key, traversal, budget, reopen,
   tombstone-forgery, symlink-redirection, and resurrection tests.

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
- link and special-file rejection for records and every created shard component;
- HMAC-SHA-256-authenticated deletion receipts bound to the prior record digest;
- terminal deletion receipts written before object removal;
- no resurrection after a valid deletion receipt;
- wrong-key, record tamper, tombstone forgery, and link redirection failure as a closed result.

## Local validation

A dependency-isolated TypeScript harness used the repository's exact canonical hashing, encryption,
error, and transport contracts.

```text
tsc --pretty false
exit: 0

node --test test/filesystem-transport.test.mjs
subtests: 6
passed: 6
failed: 0
exit: 0

node --check dist/state-native/filesystem-transport.js
exit: 0
```

Exact locally validated source blob:

```text
0cb2198e3df05a74acbb694348a5751390cc03bc
```

Covered behavior:

1. encrypted persistence, concurrent idempotency, exact reopen, and plaintext absence;
2. wrong-key rejection and on-disk record tamper rejection;
3. terminal deletion receipt, idempotent delete, and resurrection rejection;
4. path-traversal ID rejection and configured payload-budget enforcement;
5. HMAC rejection after an attacker recomputes the public tombstone digest but cannot reproduce the
   authentication tag, plus wrong-key tombstone rejection;
6. record-file and shard-directory symlink redirection rejection on platforms supporting the test.

Protected repository checks on the exact pull-request head remain the merge authority. Isolated
validation is not represented as the complete monorepo result.

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
- fully race-free operation against an adversary with concurrent same-user filesystem mutation;
- Mooncake, LMCache, NIXL, GPU, or Kimi K3 deployment;
- externally observed performance, uptime, customer traffic, or production use.

## Result

The State Bus now has a real encrypted, restart-surviving, fail-closed single-host transport option.
The next independently reversible frontier is an object-store adapter with conditional writes,
versioning, KMS envelope keys, deletion markers, and a live failure-injection proof.
