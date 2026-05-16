# @szl-holdings/vsp-otel

**MVP slice** of the Verifiable Span Protocol (VSP) — an OpenTelemetry bridge
that emits one OTel span per Λ-receipt with the receipt hash embedded as the
span's `trace_id`. Tracks the public proposal at
[szl-holdings/vsp-otel](https://github.com/szl-holdings/vsp-otel).

License: Apache-2.0 · Author: Lutar, Stephen P. (ORCID 0009-0001-0110-4173)

## What ships here

- `LambdaSpanEmitter.emit(receipt)` — derives a 16-byte OTel `traceId` from
  the first 32 hex chars of the receipt hash, stamps per-axis Λ scores as
  `gen_ai.lambda.<axis>` attributes, and stamps license / replay-count /
  ingestion-policy under the `gen_ai.szl.*` namespace. License values are
  allowlisted (Apache-2.0, MIT, BSD-3-Clause, CC-BY-4.0) per Doctrine V6.
- `recordRhoClosure(span, witnessPair)` — emits a `rho.closure` span event
  carrying `{ byte_identical, chain_root }`.

## What is intentionally NOT in this slice

OTLP/gRPC + OTLP/HTTP exporter wiring, Langfuse / Arize / Honeycomb /
Datadog adapters, and the p50-latency benchmark are all follow-up slices.
This layer depends on `@opentelemetry/api` only — callers wire the SDK.

## Usage

```ts
import { LambdaSpanEmitter, recordRhoClosure } from '@szl-holdings/vsp-otel';

const emitter = new LambdaSpanEmitter();
const span = emitter.emit({
  hash: receipt.selfHash,
  license: 'Apache-2.0',
  lambdaAxes: { cleanliness: 0.95, horizon: 0.9 /* … */ },
});
recordRhoClosure(span, { byteIdentical: true, chainRoot: '0xabc…' });
```
