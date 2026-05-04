# Error Contracts
**Phase:** 3  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Standard Error Response Shape

All API errors return the following JSON structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "correlationId": "req-uuid-xxxx",
    "timestamp": "2026-04-19T12:00:00Z",
    "details": [
      { "field": "fieldName", "message": "specific issue" }
    ]
  }
}
```

---

## Error Code Registry

| HTTP Status | Error Code | When Used |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod schema validation failure |
| 400 | `INVALID_REQUEST` | Malformed request body / query |
| 401 | `UNAUTHORIZED` | No valid session; OIDC required |
| 403 | `FORBIDDEN` | Valid session but insufficient role |
| 403 | `POLICY_VIOLATION` | Policy check failed; human approval required |
| 404 | `NOT_FOUND` | Resource does not exist or tenant-scoped out |
| 409 | `CONFLICT` | Idempotency conflict; resource already exists |
| 422 | `UNPROCESSABLE_ENTITY` | Business logic rejection |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unhandled server error (Sentry-captured) |
| 502 | `UPSTREAM_ERROR` | External API failure (AI provider, AIS, etc.) |
| 503 | `SERVICE_UNAVAILABLE` | DB or required service unreachable |

---

## Correlation IDs

- Every request receives a `correlationId` (UUID v4) injected by the request middleware
- `correlationId` is propagated to all downstream service calls, AI model calls, and database audit entries
- `correlationId` is included in all error responses
- Client receives `X-Correlation-Id` response header on every request
- Pino logger includes `correlationId` in all structured log entries for the request lifecycle

---

## Graceful Degradation Contracts

| External Dependency | Failure Behavior |
|---|---|
| AI provider (OpenAI/Anthropic/Gemini) | Returns `502 UPSTREAM_ERROR`; no silent fallback; client shows error state |
| AIS live feed (MarineTraffic) | Falls back to cached demo data; logs warning; UI shows "Demo Data" label |
| STIX/TAXII threat feed | Falls back to last ingested batch; logs staleness warning |
| Sanctions feed (OFAC/EU/UN) | Falls back to last ingested batch; freshness indicator shown |
| Email delivery (Resend) | Logs failure; no silent retry storm; error returned to caller |
| PostgreSQL DB | Returns `503 SERVICE_UNAVAILABLE`; health endpoint reflects DB down |
| Redis cache | Falls back to DB query; no error surfaced to client |

---

## Timeout Configuration

| Service | Timeout | Retry |
|---|---|---|
| AI completions | 30s | 2 retries with exponential backoff |
| AI embeddings | 15s | 1 retry |
| External threat feeds | 10s | 1 retry |
| AIS queries | 8s | No retry (demo fallback) |
| Email delivery | 10s | 1 retry |
| Database queries | 30s (pool) | No retry (fail fast) |
| External webhooks | 10s | 3 retries |

---

## Error Contract Status

| Dimension | Status |
|---|---|
| Centralized error handler | ✅ Present in Express app |
| Consistent JSON error shape | ✅ Standardized |
| Correlation IDs in errors | ✅ Implemented |
| Pino structured logging | ✅ All console.* removed from production paths |
| Sentry error capture | ⚠️ Code ready; `SENTRY_DSN` not set (LB-003) |
| Zod validation on all write routes | 🟡 High-risk routes covered; full coverage expanding |
| Graceful degradation on AI failure | ✅ Implemented |
| Timeout/retry contracts | ✅ Configured |
