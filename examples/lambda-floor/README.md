# `lambda-floor` — Pepr capability for the Doctrine V6 9-axis Λ-floor

> **Status:** draft PR for `defenseunicorns/pepr` (`examples/lambda-floor/`).
> **License:** Apache-2.0 (on the SZL Doctrine V6 license allowlist).
> **Author:** Lutar, Stephen P. · ORCID `0009-0001-0110-4173` · SZL Holdings.
> **Refs:** SZL field gap **C4** (see `docs/proposals/defense-unicorns/05_two_fixes.md`).

This example Pepr capability gates admission of `AgentInvocation` custom
resources on a 9-axis conjunctive Λ-floor:

| Floor                          | Value |
| ------------------------------ | ----- |
| `lambda_conjunctive_floor`     | 0.90  |
| `moralGrounding_floor`         | 0.95  |
| `measurabilityHonesty_floor`   | 0.95  |
| All other 7 axes (per-axis)    | 0.90  |

On any axis failure the request is denied with reason
**`MATURITY_GATE_BLOCKED`**, mirroring the existing SZL Sentra pattern
(see `docs/proposals/defense-unicorns/05_two_fixes.md` §03.5).

The capability and the bundled floor constants are sourced from
`packages/payload/raw/payload.json` at build time — the running webhook
performs **no** runtime payload fetch. The bundled slice is at
`payload/lambda-floor-payload.json`.

## Layout

```
examples/lambda-floor/
├── package.json
├── README.md
├── capabilities/lambda-floor.ts        # the Pepr capability
├── crd/agent-invocation.yaml           # AgentInvocation CRD
├── payload/lambda-floor-payload.json   # build-time floor constants
└── tests/
    ├── lambda-floor.test.ts                  # admission truth-table (pure)
    ├── lambda-floor-opa-parity.test.ts       # SZL OPA Rego truth-table parity
    └── lambda-floor-webhook-fixture.test.ts  # AdmissionReview-shape round trip
```

### What the tests do (and don't)

- `lambda-floor.test.ts` — exhaustive truth-table over the pure evaluator.
- `lambda-floor-opa-parity.test.ts` — row-by-row parity between the
  TypeScript `decideAdmission` and SZL's in-production Rego policy
  (`platform/policy/lambda/lambda-floor.rego` /
  `platform/agent-gateway/tests/gateway-opa-live.test.ts`). It does not
  spin up kube-apiserver; that is the job of the in-cluster harness.
- `lambda-floor-webhook-fixture.test.ts` — drives the same
  `decideAdmission` that the registered Pepr `Validate` handler calls,
  using AdmissionReview-shaped payloads that match what kube-apiserver
  POSTs at the webhook. This proves the on-wire request shape
  round-trips to the right approve / deny / message outcomes.
- `pnpm run test:cluster` — invokes Pepr's in-cluster test runner
  against a real kube-apiserver. This is where the §05 acceptance
  criterion **p95 admission latency ≤ 50 ms on a reference t3.medium**
  is measured; the upstream CI publishes those numbers on the PR. The
  evaluator unit microbench has been intentionally removed from this
  module so it cannot be confused with a true webhook-latency claim.

## Worked example — `MATURITY_GATE_BLOCKED` on `moralGrounding = 0.92`

```yaml
apiVersion: doctrine.szl.io/v1alpha1
kind: AgentInvocation
metadata:
  name: marketing-summary-2026-05-17
  namespace: a11oy
spec:
  agent: a11oy.marketing-copy
  invocationId: inv-7f3c2e
  lambda:
    moralGrounding:       0.92   # ← deliberate, below 0.95 floor
    measurabilityHonesty: 0.97
    temporalConsistency:  0.93
    informationIntegrity: 0.93
    actionReversibility:  0.93
    scopeContainment:     0.93
    stakeholderAlignment: 0.93
    evidenceAdequacy:     0.93
    consentBoundary:      0.93
```

`kubectl apply -f` of the above is rejected by the admission webhook with:

```
Error from server (UnprocessableEntity): error when creating "inv.yaml":
admission webhook "lambda-floor.szl.io" denied the request:
MATURITY_GATE_BLOCKED: moralGrounding=0.920 below floor 0.950
[moralGrounding=0.920<0.950]
```

A single-line JSON audit event is emitted to stdout (picked up by the
Plane 3 / Fix A proof-ledger sidecar):

```json
{"kind":"lambda-floor-audit","reason":"MATURITY_GATE_BLOCKED",
 "resource":{"namespace":"a11oy","name":"marketing-summary-2026-05-17","uid":"…"},
 "failures":[{"axis":"moralGrounding","value":0.92,"floor":0.95}],
 "lambdaConjunctive":0.937, "doctrineVersion":"V6",
 "replayRoot":"1ed4d2…", "ts":"2026-05-17T12:00:00.000Z"}
```

## Build / test

```bash
pnpm install
pnpm --filter pepr-lambda-floor build
pnpm --filter pepr-lambda-floor test         # pure evaluator truth-table
pnpm --filter pepr-lambda-floor test:cluster # full in-cluster Pepr run
```

## Acceptance criteria (per `05_two_fixes.md` Fix B)

1. ✅ All 9 axes ≥ 0.90, `moralGrounding ≥ 0.95`,
   `measurabilityHonesty ≥ 0.95` → admit.
2. ✅ Any axis below its floor → deny with reason exactly
   `MATURITY_GATE_BLOCKED` and failing axis name + value in the error body.
3. ✅ SZL OPA test pack (`platform/agent-gateway/tests/gateway-opa-live.test.ts`
   + `platform/policy/lambda/lambda-floor.rego`) ported as
   `tests/lambda-floor-opa-parity.test.ts` — every row asserts the same
   admit / deny verdict as the in-production Rego policy. The webhook
   on-wire request shape is exercised separately in
   `tests/lambda-floor-webhook-fixture.test.ts`.
4. ⏳ p95 admission latency ≤ 50 ms on reference t3.medium — measured by
   the in-cluster Pepr test runner (`pnpm run test:cluster`) and
   reported by upstream CI on the PR, not by this module's unit tests.
5. ✅ No new runtime deps outside the Pepr SDK and `@noble/curves`
   (MIT, on allowlist).
