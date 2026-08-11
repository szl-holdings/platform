# Proof Packet — Alloy State-Native Runtime Boundary Hardening

**Workcell:** `A11OY-STATE-001-B`  
**Date:** 2026-08-11  
**Repository:** `szl-holdings/platform`  
**Branch:** `feat/alloy-state-native-runtime-clean-2026-08-11`  
**Parent head reviewed:** `d66395250d210f7b02ce03d4c952ecf44c8eff22`  
**Risk:** B — additive runtime hardening and adversarial tests  
**Claim level:** source implementation pending exact-head protected CI

## Context

Security review of PR #589 identified mutable trust-boundary objects that could let JavaScript or
deserialized callers bypass TypeScript-only invariants. The affected boundaries were kernel
registration, policy-effect interpretation, request and budget custody, execution/verifier input
isolation, and output persistence selection.

Several review findings were already closed on the reviewed parent head: canonical idempotency
scoping, portability-tier completeness, digest format validation, output sensitivity floors,
verifier output-copy isolation, and deep receipt snapshots. This workcell changes only the remaining
live defects and adds executable regressions for both the remaining and already-corrected output
snapshot boundary.

## Patch

- Snapshot and freeze each validated kernel definition before registration.
- Validate kernel kind, callable boundaries, and `requiresVerification` at runtime.
- Snapshot the full governed request before any asynchronous boundary.
- Reject unknown policy effects before epoch pinning or kernel execution.
- Keep the private authorized budget immutable and pass separate frozen context copies.
- Keep decrypted input payloads in a private baseline and pass independent copies to execution and
  verification.
- Snapshot verifier results before receipt or release decisions.
- Derive per-output state idempotency keys with canonical SHA-256 scoping rather than delimiters.
- Add six adversarial Node regressions and wire them into the package test command.

## Adversarial regressions

The added suite proves that:

1. mutating a caller-held kernel definition after registration cannot disable its verifier or replace
   its execution function;
2. an unknown policy effect such as `deny` fails closed before pinning or execution;
3. kernel code cannot raise `maxStateWrites` or `maxOutputBytes` through the context object;
4. kernel mutation of decrypted input bytes cannot alter the verifier's independent input snapshot;
5. caller mutation after `execute()` starts cannot expand the private request budget; and
6. a verifier closure mutating the raw kernel output cannot change the bytes selected for
   persistence.

## Local verification

```text
tsc strict boundary harness: PASS
node --check state-native-runtime-boundary-regressions.test.mjs: PASS
package.json parse: PASS
secret material added: NONE
network calls in tests: NONE
```

The local boundary harness uses strict TypeScript stubs to validate this file's types and syntax. It
is not represented as a substitute for the repository's pinned workspace dependencies or full
monorepo test graph. GitHub-hosted checks on the exact final PR head remain the promotion authority.

## Screenshot

`N/A` — no visual route, component, or public UI changed.

## Security and claim boundary

- No token, credential, private key, `.env`, authorization header, or secret value is committed.
- No branch protection, deployment, database, DNS, visibility, license, or external account changes
  are included.
- This closes source-level mutable-boundary findings only. It does not claim production Kimi K3
  inference, production KMS/HSM custody, durable distributed state, external GPU transport,
  customer traffic, or live deployment.

## Promotion gate

Merge is prohibited until the exact final head has:

- all required hosted checks completed successfully;
- no unresolved current review threads;
- DCO and commit-policy success;
- dependency, CodeQL, security, source-of-truth, and truth-drift success; and
- an exact-head reread immediately before ordinary squash merge.

Rollback is the ordinary PR revert of this independently reviewable workcell. No history rewrite or
force push is authorized.
