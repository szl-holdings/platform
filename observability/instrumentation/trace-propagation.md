# SZL Holdings — Trace Propagation Rules

**Version:** 1.0 (Phase 8)
**Authority:** Platform Engineering

---

## Required Headers

All HTTP calls between SZL services **must** propagate W3C trace context:

| Header | Standard | Purpose |
|--------|----------|---------|
| `traceparent` | W3C Trace Context (RFC 8786) | Span context (trace ID, span ID, flags) |
| `tracestate` | W3C Trace Context | Vendor-specific trace state |
| `baggage` | W3C Baggage (RFC 8942) | Cross-cutting key-value pairs |

## Required Baggage Keys

| Baggage Key | Type | Required | Description |
|-------------|------|----------|-------------|
| `szl.tenant_id` | string | When multi-tenant | Tenant context propagated end-to-end |
| `szl.domain` | string | Always | Service domain from taxonomy |
| `szl.org_id` | string | When org-scoped | Organization context |
| `szl.proof_chain_id` | string | For agent decisions | Proof chain entry ID |

## SDK Configuration

TypeScript (auto-configured by `otel-init.ts`):
```typescript
// W3CTraceContextPropagator + W3CBaggagePropagator are both registered
// All HTTP calls via fetch/axios will automatically propagate headers
```

Python (auto-configured by `otel_init.py`):
```python
# CompositePropagator registers both propagators
# Requests via httpx/requests will automatically propagate
```

## Manual Propagation (where auto-instrumentation doesn't reach)

```typescript
import { propagation, context } from "@opentelemetry/api";

// Inject into outgoing fetch/axios headers
const carrier: Record<string, string> = {};
propagation.inject(context.active(), carrier);
// carrier now has { traceparent: "00-...", tracestate: "...", baggage: "..." }
headers = { ...headers, ...carrier };

// Extract from incoming request headers
const ctx = propagation.extract(context.active(), req.headers);
```

## Cross-Service Rules

1. **Never strip headers** — intermediate services must forward `traceparent`/`tracestate` even if they don't instrument the call.
2. **Baggage is additive** — services may add keys but must not remove existing ones.
3. **Sampling decision is inherited** — if the root service samples a trace, all downstream spans are included. Do not resample mid-trace.
4. **Frontend → Backend** — the SPA `@workspace/api-client-react` injects `traceparent` automatically (Phase 3 golden path). Custom fetch calls must use the `useFetch` hook.

## Prohibited Patterns

- Do not pass trace context via query string or body.
- Do not pass credentials or PII in baggage.
- Do not use B3 propagation headers (`X-B3-TraceId`) — W3C only.
