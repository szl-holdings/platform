# Proof Packet — Alloy State-Native Runtime Final Review Hardening

**Workcell:** `A11OY-STATE-001-D`  
**Date:** 2026-08-11  
**Repository:** `szl-holdings/platform`  
**Pull request:** `#591`  
**Publication parent:** `db9399cad9d78630a85455f273d74b0450434546`  
**Risk:** B — additive trust-boundary hardening and adversarial tests  
**Claim level:** source implementation pending exact-head protected CI

## Context

The signed successor already closes the original non-plain parameter, mutable receipt-custody, and
truthy epoch-evidence review findings. Final adversarial review identified two residual JavaScript
shape hazards that must remain fail-closed:

1. a sparse parameter array can otherwise serialize with holes as JSON `null`, sharing a digest with
   materially different dense input; and
2. a sparse epoch-validation array can otherwise pass a length gate while `map()` and `every()` skip
   the missing evidence entry.

## Patch

- canonical parameter encoding now walks arrays by index and rejects every missing own element;
- cognitive-epoch validation now validates the array shape, snapshots each evidence object exactly
  once, requires nonempty name/detail strings and an exact boolean outcome, freezes the snapshot,
  and derives state only from `passed === true`;
- a focused regression covers non-plain parameters, sparse parameter arrays, malformed and sparse
  epoch evidence, one-read accessor evidence, and immutable receipt signer/writer custody; and
- the package test command executes the focused regression with the existing state-native suites.

## Local verification

```text
canonical.ts strict TypeScript stub compile: PASS
epoch-manager.ts strict TypeScript stub compile: PASS
focused Node regression syntax check: PASS
package.json parse: PASS
secret material added: NONE
network calls in focused regression: NONE
```

These checks validate the changed source boundaries and test syntax only. The repository-pinned
workspace graph, Vitest suite, TypeScript build, CodeQL, dependency audit, DCO, source-of-truth, and
truth-drift checks on the exact final GitHub head remain the promotion authority.

## Screenshot

`N/A` — no route, page, component, or public visual surface changed.

## Security and claim boundary

- No token, credential, private key, `.env`, authorization header, DNS setting, deployment target,
  repository visibility, branch protection, or external account is changed.
- Test signing keys are generated in memory.
- This workcell establishes source-level operational runtime behavior only. It does not claim live
  Kimi K3 inference, production KMS/HSM custody, Mooncake transport, durable distributed state,
  customer traffic, or production deployment.

## Promotion gate

Merge is prohibited until the exact final head has all required hosted checks successful, no
unresolved current review findings, valid DCO/commit-policy, and an immediate exact-head reread
before an ordinary protected squash merge. No force push or history rewrite is authorized.
