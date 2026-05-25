# @szl-holdings/vsp-otel

OpenTelemetry bridge for the **Verifiable Span Protocol (VSP)** — emits one
OTel span per Λ-receipt with the receipt hash embedded as the span's
`trace_id`, then ships them to real observability backends (Honeycomb,
Datadog, Arize Phoenix, any OTLP collector). Tracks the public proposal at
[szl-holdings/vsp-otel](https://github.com/szl-holdings/vsp-otel).

License: Apache-2.0 · Author: Lutar, Stephen P. (ORCID 0009-0001-0110-4173)

## What ships here

- `LambdaSpanEmitter.emit(receipt)` — derives a 16-byte OTel `traceId` from
  the first 32 hex chars of the receipt hash, stamps per-axis Λ scores as
  `gen_ai.lambda.<axis>` attributes, and stamps license / replay-count /
  ingestion-policy under the `gen_ai.szl.*` namespace. License values are
  allowlisted (Apache-2.0, MIT, BSD-3-Clause, CC-BY-4.0) per Doctrine V6.
  Pass `vendor: 'honeycomb' | 'datadog' | 'phoenix'` to stamp vendor-shaped
  mirror attributes alongside the canonical namespace.
- `recordRhoClosure(span, witnessPair)` — emits a `rho.closure` span event
  carrying `{ byte_identical, chain_root }`.
- `startVspNodeSdk(opts?)` — NodeSDK bootstrap that wires the emitter to
  an OTLP gRPC or HTTP/protobuf exporter, sets `service.name`, and returns
  an emitter pre-configured with the selected vendor adapter.
- `applyVendorAttributes(span, vendor, info)` — the pure function the
  emitter uses internally; exported so callers can mirror attributes onto
  spans they create themselves.

## Usage

### In-process spans only (no exporter)

```ts
import { LambdaSpanEmitter, recordRhoClosure } from '@szl-holdings/vsp-otel';

const emitter = new LambdaSpanEmitter();
const span = emitter.emit({
  hash: receipt.selfHash,
  license: 'Apache-2.0',
  lambdaAxes: { cleanliness: 0.95, horizon: 0.9 /* … */ },
});
recordRhoClosure(span, { byteIdentical: true, chainRoot: '0xabc…' });
span.end();
```

### Ship to a real backend (Honeycomb / Datadog / Phoenix)

```ts
import { startVspNodeSdk, recordRhoClosure } from '@szl-holdings/vsp-otel';

const { emitter, shutdown } = startVspNodeSdk({
  // Or set OTEL_EXPORTER_OTLP_ENDPOINT in the environment.
  endpoint: 'https://api.honeycomb.io',
  headers: { 'x-honeycomb-team': process.env.HONEYCOMB_API_KEY! },
  serviceName: 'my-service',
  vendor: 'honeycomb',
});

process.on('SIGTERM', async () => {
  // shutdown() rethrows on flush failure so caller can observe lost spans.
  await shutdown();
});

const span = emitter.emit({ hash, license: 'Apache-2.0', lambdaAxes });
recordRhoClosure(span, { byteIdentical: true, chainRoot });
span.end();
```

## Environment variables

Standard OTel env vars are honored, plus one VSP-specific selector:

| Variable                              | Default          | Notes                                                                           |
| ------------------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_ENDPOINT`         | _(none)_         | Collector **base** URL (e.g. `https://api.honeycomb.io`). For HTTP, `/v1/traces` is appended automatically. |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`  | _(none)_         | Signal-specific **full** URL — wins over `OTEL_EXPORTER_OTLP_ENDPOINT` and is used verbatim. |
| `OTEL_EXPORTER_OTLP_PROTOCOL`         | `http/protobuf`  | `grpc` or `http/protobuf`.                                                      |
| `OTEL_EXPORTER_OTLP_HEADERS`          | _(none)_         | `key=val,key2=val2` — API keys, tenant IDs, etc.                                |
| `OTEL_SERVICE_NAME`                   | `vsp-otel`       | `service.name` resource attribute.                                              |
| `VSP_OTEL_VENDOR`                     | `none`           | `honeycomb` \| `datadog` \| `phoenix` \| `none`.                                |

The `endpoint` option / `OTEL_EXPORTER_OTLP_ENDPOINT` env var accepts a
base URL — the `/v1/traces` signal path is appended automatically for
HTTP transports. Pass a full URL ending in `/v1/traces` if you prefer to
spell it out. gRPC ignores the path component.

### Vendor cheatsheet

Setting `vendor` (constructor option) or `VSP_OTEL_VENDOR` (env var) is the
**only** step required to get vendor-shaped mirrors. Every `emit()` call
auto-stamps the mirror attributes for the selected vendor alongside the
canonical `gen_ai.*` namespace — there is no separate `mirrorLambdaAxesFor*`
call to remember. Originals are never modified.

**Honeycomb**

```
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
OTEL_EXPORTER_OTLP_HEADERS=x-honeycomb-team=YOUR_INGEST_KEY
VSP_OTEL_VENDOR=honeycomb
```

Adds `app.span_name` + `app.kind=vsp.lambda_receipt` so receipts are
filterable in Honeycomb's dataset views.

**Datadog** (point at a local DD Agent with OTLP intake enabled)

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
VSP_OTEL_VENDOR=datadog
```

Mirrors the span name to `operation.name` + `resource.name` and per-axis
scores to `dd.lambda.<axis>` so DD APM groups them properly.

**Arize Phoenix** (local Docker, or a hosted Phoenix instance)

```
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:6006/v1/traces
VSP_OTEL_VENDOR=phoenix
```

Sets `openinference.span.kind=LLM` so the spans land in Phoenix's LLM
trace view, and mirrors per-axis Λ scores to `llm.evaluation.<axis>.score`
for the evaluator panel.

## Performance

`LambdaSpanEmitter.emit` is hot-path code (called once per Λ-receipt), so we
keep two reproducible benchmarks. The first isolates the emitter's own work;
the second measures end-to-end latency once a real OTLP exporter is on the
wire — those two numbers answer very different questions and should be
quoted together.

### A) Emitter-only (no exporter on the wire)

`bench/emit.bench.ts` measures `emit()` against the default OTel no-op
tracer (no SDK / exporter registered — what we isolate is the emitter's own
work: license check, hash slicing, traceId derivation, parent-context
construction, span start, attribute stamping, `span.end()`).

```bash
pnpm --filter @szl-holdings/vsp-otel bench
```

Methodology: [tinybench](https://github.com/tinylibs/tinybench) with 1s
warmup and 3s measured time per case. Reported in microseconds (µs).

- Node: v24.13.0, linux/x64
- CPU: Intel Xeon Platinum 8581C @ 2.30 GHz (Replit Reserved-VM class, shared tenant)
- Date: 2026-05-18

| case                            | mean (µs) | p50 (µs) | p75 (µs) | p99 (µs) | samples   |
| ------------------------------- | --------: | -------: | -------: | -------: | --------: |
| `emit(minimal)`                 |      0.63 |     0.47 |     0.54 |     1.86 | 4,726,576 |
| `emit(full: 9 axes + metadata)` |      0.80 |     0.65 |     0.73 |     1.63 | 3,735,100 |

The previously aspirational "p50 ≈ 11.5 µs" figure quoted in the public VSP
proposal was an upper-bound guess made before this harness existed; the
measured numbers above are roughly **15–25× faster** on the reference
hardware. Treat them as a ceiling-of-best-case — they're what `emit` costs
the caller's thread, **not** what it costs to actually get a receipt span
to a collector.

### B) End-to-end with a real OTLP/HTTP exporter

`bench/emit-e2e.bench.ts` boots an in-process HTTP catcher (acting as an
OTLP/HTTP collector that 200s every POST), then boots `startVspNodeSdk`
against it — same `BatchSpanProcessor` + `OTLPHttpExporter` wiring real
users get. Two measurement modes:

- **`forceFlush per receipt`** — emit one span, `await forceFlush()`,
  measure wall-clock. This is the worst-case latency to get a single
  receipt durable on the collector with no batching benefit (e.g. a
  shutdown path or a single-shot CLI). Cost is dominated by the HTTP
  round-trip, not by `emit` itself.
- **`amortized (batch=100)`** — emit 100 spans synchronously, then a
  single `forceFlush()`, divide. This is the per-receipt cost when the
  BatchSpanProcessor is allowed to do its job — what steady-state
  production traffic actually pays.

```bash
pnpm --filter @szl-holdings/vsp-otel bench:e2e
```

Methodology: custom harness, 500ms warmup + 3s measured time per case.
Same reference hardware as above.

- Node: v24.13.0, linux/x64
- CPU: Intel Xeon Platinum 8581C @ 2.30 GHz (Replit Reserved-VM class, shared tenant)
- Date: 2026-05-25
- Collector: localhost HTTP catcher (loopback only — no real network)
- Avg OTLP/protobuf payload: ~33 KB per POST under the batched cases

| case                                       | mean (µs) | p50 (µs) | p75 (µs) | p99 (µs) | samples |
| ------------------------------------------ | --------: | -------: | -------: | -------: | ------: |
| `emit(minimal)` + forceFlush per receipt   |    793.70 |   757.64 |   830.40 |  1,284.58 |   3,778 |
| `emit(full)` + forceFlush per receipt      |    801.24 |   766.54 |   835.30 |  1,267.55 |   3,743 |
| `emit(minimal)` amortized (batch=100)      |     14.62 |    13.68 |    14.30 |     35.71 |   2,051 |
| `emit(full)` amortized (batch=100)         |     20.78 |    19.43 |    20.19 |    104.48 |   1,444 |

Takeaways:

- **Single-receipt flush is ~750–800 µs p50** — that's a localhost
  loopback HTTP round-trip plus protobuf serialization. A real collector
  on a remote host will add the network RTT on top.
- **Amortized under batching is ~14–21 µs p50**, roughly **30× faster**
  per receipt than the flush-per-call path. Production traffic should
  always rely on the BatchSpanProcessor — `forceFlush` per receipt is for
  shutdown/CLI scenarios only.
- The amortized number is still ~20–30× higher than the no-op emitter
  benchmark above. The gap is serialization + the HTTP send, not the
  emitter — which confirms the no-op figure was a true ceiling.

## End-to-end verification

`src/node-sdk-bootstrap.test.ts` spins up an in-process HTTP catcher
acting as an OTLP/HTTP collector, boots the SDK against it, emits a
Λ-receipt span, and asserts that the receipt hash, endpoint name,
`gen_ai.*` attributes, service name, and vendor-mirror attributes all
land in the serialized OTLP body on the wire. This proves the full
pipeline (`emit` → BatchSpanProcessor → OTLPHttpExporter → HTTP POST)
without needing a live Honeycomb / Phoenix sandbox.
