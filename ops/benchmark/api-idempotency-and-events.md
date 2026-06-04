# API Idempotency & Event Architecture

**Last updated:** April 2026
**Purpose:** Specify idempotency and event patterns for governed decision APIs

---

## Idempotency Model

### Why Governed Decisions Need Idempotency

A governed decision must be recorded exactly once. If a network failure causes a retry:
- The same approval should not create two proof chain records
- The same simulation should not run twice (wasting compute)
- The same execution should not trigger duplicate workflows

### Implementation Pattern (Stripe-inspired)

```
POST /api/decisions/:correlationId/approve
Headers:
  X-Idempotency-Key: idem_20260416_abc123
  Authorization: Bearer <token>

Response (first call):
  201 Created
  { "data": { "receiptId": "DR-...", "status": "approved" }, "meta": { "requestId": "..." } }

Response (retry with same idempotency key):
  200 OK (returns cached first response)
  { "data": { "receiptId": "DR-...", "status": "approved" }, "meta": { "requestId": "...", "idempotent": true } }
```

### Idempotency Key Storage
- Store in PostgreSQL with TTL (24 hours)
- Key: SHA-256 hash of `(userId, endpoint, idempotencyKey)`
- Value: serialized response
- Enforce: unique constraint prevents duplicate processing

### Scope
Require `X-Idempotency-Key` on all mutating endpoints:
- `POST /api/decisions/*/approve`
- `POST /api/decisions/*/reject`
- `POST /api/decisions/*/escalate`
- `POST /api/simulations/run`
- `POST /api/proof-chain/capture`
- `POST /api/outcomes/record`

---

## Event Architecture

### Decision Lifecycle Events

Every state transition in the governed loop publishes an event. External consumers (webhooks, integrations) can subscribe.

| Event | Payload |
|-------|---------|
| `decision.signal.detected` | `{ signalId, domain, sourceId, severity, correlationId }` |
| `decision.correlated` | `{ correlationId, confidence, linkedSignals[], domains[] }` |
| `decision.recommended` | `{ correlationId, title, confidence, modelId, actions[] }` |
| `decision.simulated` | `{ correlationId, scenarioId, iterations, metrics }` |
| `decision.policy.evaluated` | `{ correlationId, effect, matchedPolicies[], reason }` |
| `decision.approved` | `{ correlationId, approvedBy, receiptId }` |
| `decision.rejected` | `{ correlationId, rejectedBy, reason }` |
| `decision.escalated` | `{ correlationId, escalatedTo, reason }` |
| `decision.executed` | `{ correlationId, steps[], totalDuration }` |
| `decision.proved` | `{ correlationId, proofChainId, contentType }` |
| `decision.outcome.recorded` | `{ correlationId, outcomeId, predictedVsActual }` |

### Webhook Delivery (Stripe Pattern)

```
POST https://customer-endpoint.com/webhooks/szl
Headers:
  Content-Type: application/json
  X-SZL-Signature: sha256=<HMAC of payload with webhook secret>
  X-SZL-Event-Id: evt_20260416_abc123
  X-SZL-Delivery-Attempt: 1

Body:
{
  "id": "evt_20260416_abc123",
  "type": "decision.approved",
  "created": "2026-04-16T12:00:00Z",
  "data": { ... }
}
```

### Retry Policy
- Exponential backoff: 1s, 5s, 30s, 5m, 30m, 2h, 24h
- Max 7 attempts over 24 hours
- Dead letter queue for permanently failed deliveries
- Webhook logs visible in operator dashboard

---

## Competitive Advantage

Stripe's webhook architecture is the gold standard for API event delivery. By adopting the same patterns (signed payloads, structured event types, retry policy), SZL signals "integration-grade" to technical buyers.

The decision lifecycle events are unique to SZL — no competitor publishes the full signal-to-outcome event stream as a subscribable webhook feed.
