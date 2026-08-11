# Proof Packet — Alloy State-Native Runtime

**Workcell:** `A11OY-STATE-001`
**Date:** 2026-08-11
**Scope:** Additive state-native runtime core inside `@workspace/a11oy-runtime`
**Claim level:** Local operational reference implementation

## Context

The repository already contains truth-lock, vertical conformance, signed MCP governance, receipt
verification, frontier-preflight controls, and protected monorepo CI. It did not contain an
executable State Capsule, Cognitive Epoch, sealed provider-state, or disaggregated kernel runtime.

## Plan

1. Add encrypted content-addressed State Capsules and policy-bound reads.
2. Add P0–P5 compatibility tiers and a state-transport contract.
3. Add cognitive epoch activation, pinning, drain, retirement, and rollback.
4. Add a sealed opaque provider-state vault with ambiguous-completion protection.
5. Add a bounded verified kernel runtime bound to `szl.governed-action/v1`.
6. Sign terminal execution receipts and quarantine output when receipt persistence fails.
7. Add schemas, tests, a deterministic demo, architecture documentation, and proof evidence.
8. Use the existing protected typecheck, test, security, and truth gates rather than adding a
   redundant workflow.

## Patch boundary

- `packages/a11oy-runtime/src/state-native/**`
- `packages/a11oy-runtime/test/state-native-runtime.test.mjs`
- `packages/a11oy-runtime/test/state-native-runtime-timeout.test.mjs`
- `packages/a11oy-runtime/test/state-native-runtime-security.test.mjs`
- `packages/a11oy-runtime/test/state-native-state-bus-security.test.mjs`
- `packages/a11oy-runtime/schemas/**`
- `packages/a11oy-runtime/package.json`
- `packages/a11oy-runtime/src/index.ts`
- `docs/architecture/alloy-state-native-runtime.md`
- `.github/workflows/truth-drift.yml`
- this proof packet

No UI route, database schema, deployment, DNS, secret, branch protection, license, visibility, or
external account is changed.

## Implementation validation

Focused isolated validation was executed during implementation and adversarial security review:

```text
tsc --pretty false
result: passed

node --test test/state-native-runtime.test.mjs \
  test/state-native-runtime-timeout.test.mjs \
  test/state-native-runtime-security.test.mjs \
  test/state-native-state-bus-security.test.mjs
result: passed

node dist/state-native/demo.js
status: OPERATIONAL_REFERENCE
networkCalls: none
receiptVerified: true
reasoningVaultState: SHREDDED
result: passed
```

Exact-head GitHub checks under the repository-pinned Node and pnpm toolchain remain the promotion
authority. This proof does not substitute isolated validation for protected monorepo CI.

Covered behavior:

- deterministic canonical JSON;
- portability compatibility pass/fail;
- encrypted State Bus write/read;
- tenant and session isolation;
- policy mismatch and sensitivity-authorization rejection;
- idempotent state replay and divergent replay rejection;
- transport export/import with full content-addressed metadata authentication;
- forged session, governance, compatibility, and reuse-policy rejection;
- crypto-shred terminal behavior;
- epoch lease drain semantics;
- pinned-epoch input isolation;
- retry safety after failed epoch pinning;
- exact provider-state binding and indeterminate replay refusal;
- bounded kernel execution and mandatory verification under one shared deadline;
- abort propagation and fail-closed verifier timeout behavior;
- signed policy-block and kernel-error receipts;
- serialized per-tenant receipt-chain persistence;
- Ed25519 receipt verification;
- successful execution replay returns the original receipt;
- divergent kernel replay rejection;
- receipt persistence failure quarantines produced state.

## CI and truth-gate boundary

The runtime package participates in the repository's existing protected typecheck, test, security,
dependency, DCO, source-of-truth, and truth-drift gates. No net-new permanent workflow remains in the
patch, so the canonical workflow count is unchanged.

Pull requests and protected-source pushes execute deterministic public-surface manifest and claim
drift checks. External route probes execute on the scheduled truth audit and explicit manual runs.
This preserves fail-closed live verification without allowing transient third-party transport
failures to masquerade as source-code defects.

## Screenshot

`N/A` — no visual surface or route changed.

## Security verification

- No token, API key, credential, private key, `.env`, or authorization header is added.
- Demo signing and encryption keys are generated in memory and destroyed at teardown.
- Payload bytes are encrypted at rest inside the reference State Bus and Reasoning Vault.
- Imported payloads and immutable capsule metadata are authenticated before local persistence.
- Receipt verification uses an externally supplied public key.
- The included transport adapter is explicitly local/test-only.

Hosted repository checks remain the merge authority for the complete monorepo and pinned Node/pnpm
toolchain.

## Public-claim verification

The implementation is described as an operational reference, not general production. It does not
claim live Kimi K3 inference, Mooncake integration, customer traffic, production durability,
third-party validation, or throughput gains.

## Result

The patch makes the state-native design executable and independently testable inside the canonical
runtime package. Durable/distributed adapters and production deployment remain separate workcells;
they are not painted green by this proof.
