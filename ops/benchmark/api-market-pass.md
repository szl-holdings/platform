# API Market Pass

**Last updated:** April 2026
**Purpose:** Benchmark SZL's API against integration-grade patterns from Stripe, Plaid, Twilio, Cloudflare

---

## What "Integration-Grade" Means

An integration-grade API signals to technical buyers: "This platform is built for production, not demos."

The benchmarks:

| Pattern | Stripe | Plaid | Twilio | Cloudflare | SZL Current | SZL Target |
|---------|--------|-------|--------|------------|-------------|------------|
| Structured error envelope | ✅ `{ error: { type, code, message } }` | ✅ | ✅ | ✅ RFC 9457 | ✅ `{ error, message, statusCode, requestId }` | ✅ Already compliant |
| Request ID tracing | ✅ Every response | ✅ | ✅ | ✅ | ✅ `requestId` in response | ✅ Already compliant |
| Idempotency keys | ✅ On POST/mutations | ❌ | ❌ | ❌ | Partial (`X-Idempotency-Key` on AI/billing) | Expand to all writes |
| Webhook architecture | ✅ Signed, versioned | ✅ | ✅ | ✅ | ❌ Not implemented | Priority P1 |
| OpenAPI spec | ✅ Auto-generated | ✅ | ✅ | ✅ | ✅ `lib/api-spec/openapi.yaml` | ✅ Exists |
| Test/sandbox mode | ✅ Test mode keys | ✅ Sandbox env | ✅ Test credentials | ❌ | ❌ | Priority P2 |
| Rate limit headers | ✅ `X-RateLimit-*` | ❌ | ✅ | ✅ | Partial (limits enforced, headers not exposed) | Add headers |
| Pagination | ✅ Cursor-based | ✅ | ✅ | ✅ Cursor | ✅ Page-based | Consider cursor migration |

---

## Stripe Patterns to Adopt

### 1. Idempotency on All Mutations
Stripe requires `Idempotency-Key` on all POST requests. SZL currently only enforces this on AI/billing routes. Expand to all write endpoints.

**Why it matters for SZL:** Governed decisions must be idempotent. Approving the same decision twice should not create duplicate proof chain records.

### 2. Webhook Events for Decision Lifecycle
Stripe publishes events for every state change (payment created, succeeded, failed). SZL should publish decision lifecycle events:

| Event Type | Trigger |
|-----------|---------|
| `decision.signal.detected` | New signal arrives |
| `decision.correlated` | Cross-domain correlation established |
| `decision.recommended` | AI recommendation generated |
| `decision.simulated` | Monte Carlo simulation completed |
| `decision.approved` | Policy gate passed |
| `decision.executed` | Workflow execution completed |
| `decision.proved` | Proof chain record created |
| `decision.outcome.recorded` | Outcome measurement captured |

### 3. Error Taxonomy Alignment
SZL's current error taxonomy is clean (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`). Add governance-specific errors:

| Code | Status | Description |
|------|--------|-------------|
| `POLICY_DENIED` | 403 | Covenant Policy engine denied the action |
| `SIMULATION_REQUIRED` | 422 | Action requires Monte Carlo simulation before approval |
| `APPROVAL_REQUIRED` | 422 | Action requires human approval |
| `PROOF_CHAIN_FAILURE` | 500 | Failed to create immutable proof record |

---

## Cloudflare RFC 9457 Pattern

Cloudflare recently adopted RFC 9457 (Problem Details for HTTP APIs). SZL's error envelope is already close:

```json
// SZL current
{ "error": "VALIDATION_ERROR", "message": "Email is required", "statusCode": 400, "requestId": "abc-123" }

// RFC 9457 target
{ "type": "https://api.szlholdings.com/errors/validation", "title": "Validation Error", "status": 400, "detail": "Email is required", "instance": "/api/deals/123", "requestId": "abc-123" }
```

Consider migrating to RFC 9457 for maximum standards compliance — but the current format is functional and Stripe-aligned.

---

## Developer Experience Metrics

| Metric | Stripe Benchmark | SZL Target |
|--------|-----------------|------------|
| Time to first API call | 5 minutes | < 10 minutes |
| API documentation completeness | 100% of endpoints | 100% of endpoints |
| Error messages actionability | Always includes fix guidance | Always includes fix guidance |
| SDK availability | 7 languages | TypeScript (start with one, ship quality) |
| Quickstart guide | Inline code examples | Interactive Decision Theater as quickstart |
