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

## End-to-end verification

`src/node-sdk-bootstrap.test.ts` spins up an in-process HTTP catcher
acting as an OTLP/HTTP collector, boots the SDK against it, emits a
Λ-receipt span, and asserts that the receipt hash, endpoint name,
`gen_ai.*` attributes, service name, and vendor-mirror attributes all
land in the serialized OTLP body on the wire. This proves the full
pipeline (`emit` → BatchSpanProcessor → OTLPHttpExporter → HTTP POST)
without needing a live Honeycomb / Phoenix sandbox.
