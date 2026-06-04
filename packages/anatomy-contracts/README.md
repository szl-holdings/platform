# @szl-holdings/anatomy-contracts

Shared wire contracts for the SZL anatomy mesh — the typed boundaries the apps
use to talk to each other. This package is the single source of truth for the
cross-app calls; every app (a11oy, rosie, amaru, sentra, vessels) validates
against the same schemas.

```
rosie ──ActionProposal──▶ a11oy  POST /v1/policy/evaluate ──▶ PolicyDecision
a11oy ──ReasonRequest──▶  amaru  POST /v1/reason           ──▶ ReasonResponse
a11oy ──(immune scan)───▶ sentra inspect                   ──▶ PolicyDecision (deny on threat)
vessels / domain apps ──ActionProposal──▶ a11oy (substrate, never amaru/sentra directly)
every cross-app call carries SpanHeaders (W3C traceparent); every call mints a MeshReceipt
```

## Contracts

| Type | Wire | Schema file |
| --- | --- | --- |
| `ActionProposal` | rosie/domain-app → a11oy | `schema/action-proposal.v1.json` |
| `PolicyDecision` | a11oy → caller | `schema/policy-decision.v1.json` |
| `ReasonRequest` | a11oy → amaru | `schema/reason-request.v1.json` |
| `ReasonResponse` | amaru → a11oy | `schema/reason-response.v1.json` |
| `SpanHeaders` | every cross-app call | `schema/span-headers.v1.json` |
| `MeshReceipt` | a11oy ledger projection | `schema/mesh-receipt.v1.json` |

## Trace Context helpers

`newTraceparent()`, `childTraceparent(parent)`, `isValidTraceparent(s)`,
`traceIdOf(s)` implement the W3C Trace Context (version `00`) propagation the
nervous-system wire depends on. A child span keeps the parent's `trace-id` and
gets a fresh `span-id`, which is how parent→child relationships are established
across processes.

## Why zero dependencies

The package ships a small JSON-Schema-subset `validate()` so it runs under
`node --experimental-strip-types --test` with no install step, and the emitted
`schema/*.json` files are consumable by non-TS apps. amaru (Python) validates
inbound `ReasonRequest` and outbound `ReasonResponse` against the byte-identical
`schema/*.json` files via its own small checker.

## Build & test

```bash
node --experimental-strip-types scripts/emit-schemas.ts   # regenerate schema/*.json
node --experimental-strip-types --test src/__tests__/*.test.ts
```

## Consumers

- **a11oy** — `serve` policy/reason routes type their request/response bodies
  against `ActionProposal` / `PolicyDecision` / `ReasonResponse`.
- **rosie** — the operator console "Propose Action" panel builds an
  `ActionProposal` and renders the returned `PolicyDecision` + receipt.
- **amaru** — validates `ReasonRequest` / `ReasonResponse` against the schema
  files.
- **sentra** — its immune verdict is surfaced as a `PolicyDecision` with
  `decidedBy: "sentra.immune"`.
- **vessels** and any domain app — issue actions as `ActionProposal`s through
  a11oy's substrate; never call amaru/sentra directly.

Authored for SZL Holdings. Signed-off per repository DCO.
