# Error Taxonomy

Generated: 2026-04-16
Status: Canonical — all error codes must be registered here

## Standard Error Envelope

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Human-readable description",
  "statusCode": 400,
  "requestId": "correlation-id-here",
  "details": {
    "field": "email",
    "issue": "Required"
  }
}
```

All error responses set `X-Correlation-Id` and `X-Request-Id` headers.

## HTTP Status Codes in Use

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Input failed Zod schema validation |
| 400 | `BAD_REQUEST` | Malformed request format |
| 400 | `UNSUPPORTED_API_VERSION` | Requested API version is not supported |
| 401 | `UNAUTHORIZED` | Missing or invalid auth credentials |
| 401 | `TOKEN_EXPIRED` | Auth token has expired |
| 403 | `FORBIDDEN` | Authenticated but insufficient permissions |
| 403 | `ORG_MISMATCH` | Cross-org access attempt (returns 404 in response) |
| 403 | `CSRF_INVALID` | CSRF token missing or mismatch |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Duplicate resource or state conflict |
| 409 | `IDEMPOTENCY_CONFLICT` | Duplicate idempotency key with different body |
| 422 | `UNPROCESSABLE` | Valid JSON but semantically invalid |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 502 | `UPSTREAM_ERROR` | External service failure |
| 503 | `SERVICE_UNAVAILABLE` | Server overloaded or in maintenance |

## Domain-Specific Error Codes

### Authentication (`AUTH_*`)

| Code | HTTP | Description | User Message |
|------|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password | "Invalid email or password" |
| `ACCOUNT_LOCKED` | 403 | Too many failed login attempts | "Account temporarily locked" |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification pending | "Please verify your email" |
| `SESSION_EXPIRED` | 401 | Session has expired | "Your session has expired" |

### AI/Intelligence (`AI_*`)

| Code | HTTP | Description |
|------|------|-------------|
| `AI_PROVIDER_ERROR` | 502 | OpenAI/Anthropic/Gemini API failure |
| `AI_RATE_LIMITED` | 429 | AI provider rate limit hit |
| `AI_CONTENT_FILTERED` | 422 | Response filtered by safety system |
| `AI_TIMEOUT` | 504 | AI provider response timed out |
| `AI_LOW_CONFIDENCE` | 422 | Output confidence below action threshold |

### CORTEX (`CORTEX_*`)

| Code | HTTP | Description |
|------|------|-------------|
| `DRAFT_ALREADY_ACTIONED` | 409 | Action draft already approved/dismissed |
| `SCENARIO_INVALID` | 400 | Invalid scenario configuration |
| `DOMAIN_NOT_FOUND` | 404 | CORTEX domain slug not recognized |

### Billing (`BILLING_*`)

| Code | HTTP | Description |
|------|------|-------------|
| `SUBSCRIPTION_NOT_FOUND` | 404 | No active subscription |
| `PAYMENT_METHOD_REQUIRED` | 402 | Payment method needed to continue |
| `PLAN_LIMIT_EXCEEDED` | 429 | Usage exceeds plan limits |

### Data/Validation (`DB_*`)

| Code | HTTP | Description |
|------|------|-------------|
| `DB_CONSTRAINT_VIOLATION` | 409 | Unique constraint or FK violation |
| `DB_TIMEOUT` | 503 | Database query timed out |
| `RECORD_STALE` | 409 | Optimistic concurrency conflict (ETag mismatch) |

## Error Logging Rules

| HTTP Range | Log Level | Stack Trace |
|------------|-----------|-------------|
| 400–499 | `warn` | No |
| 500–599 | `error` | Yes |

### Never Log

- Passwords or password hashes
- Session tokens or bearer tokens
- PII (email, phone, SSN) in error details
- Encryption keys or secrets

### Always Log

- `requestId` (correlation ID)
- `userId` if authenticated
- Route path (`req.url`)
- HTTP method
- Response status code
- Error code and message (sanitized)

## Error Response Helpers

Canonical helpers in `artifacts/api-server/src/lib/api-response.ts`:

```typescript
sendError(res, "message", statusCode, "ERROR_CODE", details?)
sendNotFound(res, "Resource name")
sendBadRequest(res, "message", details?)
sendUnauthorized(res, "message")
sendForbidden(res, "message")
sendSuccess(res, data, 200, meta?)
sendCreated(res, data)
sendNoContent(res)
```

## Client Error Handling (Frontend)

Frontend uses `apiFetch` from `@szl-holdings/shared-ui`:

```typescript
// Automatically extracts error.error (code) and error.message
const data = await apiFetch("/lyte/actions");
```

Error display conventions:
- `toast.error(message)` for transient user actions
- Inline error state for form validation failures
- Banner for degraded mode (AI provider unavailable)
- Full-page error boundary for 500s
