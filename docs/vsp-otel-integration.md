# vsp-otel Integration Guide

`services/vsp-otel/` is the OTel span verifier that emits Λ-signed receipts
per governance span.

## Status

**BUILT** — compiles, tested. **NOT yet wired** as the OTLP target for
`apps/alloy-runtime-api`. Honest label: roadmap item.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/spans/verify` | Verify a span against the Λ formula |
| `POST` | `/spans/export` | Export a batch of spans with signed receipts |
| `GET` | `/spans/:hash` | Retrieve a span receipt by hash |

Port: **3004**

## Wire path (roadmap)

1. Deploy `vsp-otel` (port 3004) alongside `apps/alloy-runtime-api`.
2. Set `OTEL_EXPORTER_OTLP_ENDPOINT=http://vsp-otel:3004` in the
   `alloy-runtime-api` environment.
3. Every governed workflow span now has a Λ-signed verifiable receipt
   at `GET /spans/:hash` — auditable offline.

## Architecture position

`vsp-otel` is listed as the CIRCULATORY layer in
`replit-sync/UNIFICATION_INDEX.md` and as a branch in
`packages/unified-kernel/src/branches.ts`.

## Formula binding

`SummationInvariant`
Lean commit: `1dca00032dfc9aa8559cc6c2e4b63192fcf52371`
File: `Lutar/Khipu/SummationInvariant.lean`

## Honest label

Λ = Conjecture 1 (advisory gate, NOT a theorem).
Do not promote to theorem status. The 8 locked-proven formulas are
{F1,F4,F7,F11,F12,F18,F19,F22} @ `c7c0ba17` — these are distinct
from this advisory conjecture.
