<!-- doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header. -->
<p align="center"><strong>Khipu Doctrine Open Spec</strong></p>

<p align="center">
<code>0.1.0</code> · authored and operated by A11oy · published under <a href="./LICENSE.md">CC-BY-4.0</a>
</p>

---

## What this is

The **Khipu Doctrine Open Spec** is an open standard for the artifacts that govern enterprise agentic AI: constitutions, system cards, risk reports, behavioral-audit findings, welfare telemetry, adversarial-robustness scores, snapshot fingerprints, covenant-lift samples, partner attestations, and coordinated agent-vulnerability disclosures.

A11oy is the first implementation. It emits and consumes every artifact kind. Other parties — frontier labs, governance fabrics, regulators, auditors, partner networks — are invited to adopt the same shapes so that posture is comparable, disclosures are interoperable, and there is one common vocabulary for how an agent is governed.

## Why a spec at all

Without a shared shape:
- Every fabric ships its own model-card analog. Auditors cannot compare.
- Every vendor publishes its own incident format. Regulators cannot aggregate.
- Every partner program defines its own attestation envelope. Enterprises cannot reuse.

The spec fixes the shape. It does not fix what *should* be in a constitution, what *counts* as a welfare intervention, or what *threshold* a robustness score must exceed. Those are policy decisions; the spec is the format they live in.

Grounded in the prior art catalogued in [`KHIPU_RESEARCH_SWEEP.md`](../../KHIPU_RESEARCH_SWEEP.md). See §9 of that sweep for spec-authoring conventions and §10 for the full citation map.

## Versioning

`MAJOR.MINOR.PATCH`. Current: `0.1.0`.

- `MAJOR` — breaking shape change.
- `MINOR` — additive field, new artifact kind, or new optional enum value.
- `PATCH` — clarifications, examples, doc-only changes.

Backward compatibility: every consumer must accept unknown additive fields. Producers must include the `specVersion` discriminator on every emitted artifact.

## Layout

```
khipu-doctrine-spec/
├── README.md                      ← this file
├── LICENSE.md                     ← CC-BY-4.0
├── CHANGELOG.md                   ← version history
├── schemas/                       ← JSON Schema 2020-12 per artifact kind
│   ├── _shared.json               ← reusable $defs (SemVer, ISO timestamps, hashes)
│   ├── constitution.json
│   ├── system-card.json
│   ├── risk-report.json
│   ├── behavioral-audit-finding.json
│   ├── welfare-telemetry-sample.json
│   ├── adversarial-robustness-score.json
│   ├── snapshot-fingerprint.json
│   ├── covenant-lift-sample.json
│   ├── pillpintu-partner-attestation.json
│   └── coordinated-agent-vulnerability-disclosure.json
└── types/                         ← TypeScript companion types
    └── index.d.ts
```

## Artifact kinds (10)

| Kind | Purpose | Cite |
|:-----|:--------|:-----|
| `Constitution` | Versioned, machine-readable behavior contract for an agent. | §5 of the sweep |
| `SystemCard` | Per-agent disclosure: capabilities, scope, evals, residual risks. | §9 (MLCommons Model Card) |
| `RiskReport` | Periodic, board-ready aggregate of governed posture. | §6 (transparency reports) |
| `BehavioralAuditFinding` | One observation from a Petri-style behavioral audit. | §1 (Petri) |
| `WelfareTelemetrySample` | One welfare-signal observation; aggregated, never user-replayable. | §2 |
| `AdversarialRobustnessScore` | Per-snapshot score (0–100) per attack category. | §3 (ART, Shade, ATLAS, OWASP) |
| `SnapshotFingerprint` | Bit-exact identity of a workcell snapshot — replayability anchor. | §8 (Sigstore) |
| `CovenantLiftSample` | One paired (governed vs. helpful-only shadow) brief outcome. | §1 (Khipu #3993) |
| `PillpintuPartnerAttestation` | Per-partner record: vetting, scope, dual-approval, revocation log. | §1 (Project Pillpintu), §7 |
| `CoordinatedAgentVulnerabilityDisclosure` | Hash-now / disclose-later record per CAVD protocol. | §4 (CERT/CC, CISA, CSAF) |

Every artifact carries:

```jsonc
{
  "specVersion": "0.1.0",
  "kind": "Constitution",          // discriminator
  "id": "cst-cascade-2.4.0",       // stable, human-readable
  "issuedBy": "a11oy/op-cascade",  // emitter identity
  "issuedAt": "2026-04-12T09:00:00Z",
  "signature": { ... },             // OPTIONAL — Sigstore-style
  // ... kind-specific fields
}
```

## How to consume

```ts
import type { Constitution, SystemCard } from "@khipu-doctrine/spec/types";
// or, fetch the JSON Schema directly
const schema = await fetch(
  "https://a11oy.io/spec/khipu-doctrine/0.1.0/schemas/constitution.json"
).then(r => r.json());
```

A11oy serves the schemas at `/spec/khipu-doctrine/<version>/schemas/<kind>.json`. The spec viewer at `/a11oy/khipu-spec` renders human-readable views of every kind with a copyable `$schema` URL, a `$ref` map, and live A11oy-emitted examples.

## How to contribute

The spec is open under CC-BY-4.0. Adopt it; suggest changes; publish your own implementation. A11oy commits to:

1. Treating the spec as **public infrastructure**: changes go through a posted review window before becoming `MINOR`/`MAJOR` releases.
2. Maintaining backward compatibility per the SemVer rules above.
3. Listing external implementations on the spec viewer when notified.
4. Auto-disclosing all CAVD records emitted by A11oy on the public Trust Center after the embargo window.

For commitments around the spec, see [`A11OY_PUBLIC_CLAIMS_DOCTRINE.md`](../../A11OY_PUBLIC_CLAIMS_DOCTRINE.md).

For the doctrine that drives the spec, see [`A11OY_DOCTRINE.md`](../../A11OY_DOCTRINE.md).

## Adoption invitation

If you operate a governance fabric, partner program, or auditing practice and want to publish artifacts in this format, you do not need to ask permission. The spec is the open standard; A11oy is one of its implementations. We will list your implementation publicly when you let us know.

— A11oy, author and operator of the Khipu Doctrine Open Spec.
