# SZL Holdings — Dapr Usage Justification

**Version:** 1.0 (Phase 10)
**Authority:** Platform Engineering
**Principle:** Dapr is used selectively where it simplifies a real problem. It is NOT used everywhere.

---

## Dapr Adoption Decision Framework

Before adding a Dapr component, the author must answer:

1. **What specific problem does Dapr solve here that the existing approach doesn't?**
2. **Would a direct SDK call (Azure Service Bus client, Redis client) be simpler?**
3. **Is the portability benefit of Dapr's abstraction worth the operational overhead?**

If answers 2 or 3 suggest the direct approach is simpler, do NOT add Dapr.

---

## Approved Dapr Touchpoints

### 1. Alloy Worker — Azure Service Bus Pub/Sub (JUSTIFIED)

**Component:** `platform/dapr/components/pubsub-service-bus.yaml`

**Problem solved:** Alloy embedding and ingestion workers need to subscribe to multiple
Azure Service Bus topics (embed-requests, ingest-requests, rerank-requests) and fan out
to different handler functions. The Azure Service Bus SDK requires per-topic subscription
management, dead-letter handling, and retry configuration at the application layer.

**Dapr value:** Dapr pub/sub abstracts the Service Bus topology behind a single subscribe
decorator. Workers declare which topics they subscribe to; Dapr handles connection pooling,
dead-letter routing, and retry backoff. The broker can be swapped to Redis Streams in dev
without changing application code.

**Justification rating:** ✅ **Approved** — portability (dev uses Redis Streams, prod uses
Azure Service Bus) + operational simplification outweigh the Dapr operational overhead.

---

### 2. Temporal Worker → API Server — Service Invocation (JUSTIFIED)

**Component:** `platform/dapr/components/service-invocation.yaml`

**Problem solved:** Temporal activity workers need to call the api-server for evidence
recording, health checks, and Lyte visibility events. Direct HTTP calls require service
discovery, mTLS configuration, and retry logic at the activity layer.

**Dapr value:** Dapr service invocation provides automatic mTLS between sidecars, built-in
retries, distributed tracing propagation, and service discovery without a full service mesh.
For the Temporal → api-server call pattern, this significantly reduces boilerplate.

**Justification rating:** ✅ **Approved** — mTLS and tracing propagation between Temporal
worker and api-server is non-trivial without Dapr; complexity reduction is meaningful.

---

### 3. Evidence Ledger — State Store (CONDITIONALLY JUSTIFIED)

**Component:** `platform/dapr/components/statestore-redis.yaml`

**Problem solved:** The `lib/evidence-ledger` package currently writes directly to PostgreSQL.
In the Temporal activity context, the state store provides a transactional write path that
can checkpoint workflow state independently of the PostgreSQL write path during database
maintenance windows.

**Dapr value:** Dapr state store provides a unified checkpoint API that the Temporal activity
can use for idempotent writes. The Redis state store is available in dev; PostgreSQL state
store (or Azure Cosmos DB) can be used in production without code changes.

**Justification rating:** 🟡 **Conditional** — only deploy if database availability SLO
falls below 99.5%. Direct PostgreSQL writes are preferred when the database is healthy.
Document this tradeoff in the runbook.

---

## Rejected Dapr Use Cases

| Use Case | Reason Rejected |
|----------|----------------|
| API server → domain service HTTP calls | Direct fetch() with OTel instrumentation is simpler; Dapr overhead unjustified |
| SPA → api-server calls | Client-side code cannot use Dapr sidecar |
| Crossplane → Temporal | Crossplane uses its own provider model; Dapr would add a layer without value |
| OTel Collector | OTLP exporters are already standardised; Dapr pub/sub not needed here |
| All services (blanket adoption) | Explicitly rejected by architectural principle: Dapr as a religion is forbidden |
