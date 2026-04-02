# Error Response Contract

> Version: 1.0.0 | Updated: 2026-04-02

## Standard Error Shape

All error responses from the API use the following consistent JSON structure:

```json
{
  "error": "Short error title",
  "message": "Human-readable description of what went wrong",
  "statusCode": 400,
  "code": "MACHINE_READABLE_CODE"
}
```

### Fields

| Field        | Type   | Required | Description                                               |
|--------------|--------|----------|-----------------------------------------------------------|
| `error`      | string | Yes      | Short title. For 5xx errors: "Internal Server Error"      |
| `message`    | string | Yes      | Descriptive message. For 5xx, generic to avoid leaking   |
| `statusCode` | number | Yes      | HTTP status code repeated in body for client convenience  |
| `code`       | string | No       | Machine-readable domain error code (see below)            |

---

## HTTP Status Codes Used

| Code | Meaning                                                 |
|------|---------------------------------------------------------|
| 200  | Success                                                 |
| 201  | Created                                                 |
| 204  | No Content (successful DELETE)                          |
| 400  | Bad Request — missing or invalid input                  |
| 401  | Unauthorized — not authenticated                        |
| 403  | Forbidden — authenticated but lacks permission          |
| 404  | Not Found                                               |
| 409  | Conflict — duplicate or state violation                 |
| 422  | Unprocessable Entity — schema validation failure        |
| 429  | Too Many Requests — rate limit exceeded                 |
| 500  | Internal Server Error                                   |
| 503  | Service Unavailable — dependency unreachable            |

---

## Domain Error Codes

| Code                        | Status | Description                                           |
|-----------------------------|--------|-------------------------------------------------------|
| `VALIDATION_ERROR`          | 400    | Request body failed Zod/schema validation             |
| `MISSING_FIELD`             | 400    | A required field is absent                            |
| `INVALID_PARAM`             | 400    | Path or query param is malformed                      |
| `UNAUTHENTICATED`           | 401    | No valid session or Bearer token                      |
| `TOKEN_EXPIRED`             | 401    | Session/token has expired                             |
| `FORBIDDEN`                 | 403    | Insufficient role or org membership                   |
| `NO_ORG`                    | 403    | User has no organization membership                   |
| `ORG_MISMATCH`              | 403    | Resource org does not match user org                  |
| `NOT_FOUND`                 | 404    | Resource does not exist                               |
| `CONFLICT`                  | 409    | Resource already exists or state collision            |
| `QUOTA_EXCEEDED`            | 429    | Per-org or per-user quota breached                    |
| `RATE_LIMITED`              | 429    | Too many requests in time window                      |
| `APPROVAL_REQUIRED`         | 403    | Action requires human approval before execution       |
| `WORKFLOW_INVALID_STATE`    | 409    | Workflow is not in a valid state for this transition  |
| `AI_PROVIDER_UNAVAILABLE`   | 503    | AI provider is down or rate-limited; fallback served  |
| `DB_UNREACHABLE`            | 503    | Database could not be reached                         |
| `IDEMPOTENCY_CONFLICT`      | 409    | Idempotency key already used with different payload   |

---

## Validation Errors (422)

When request body validation fails (Zod), the response includes an `issues` array:

```json
{
  "error": "Validation Error",
  "message": "Request body is invalid",
  "statusCode": 422,
  "code": "VALIDATION_ERROR",
  "issues": [
    {
      "path": ["field", "name"],
      "message": "Expected string, received number",
      "code": "invalid_type"
    }
  ]
}
```

---

## Rate Limit Errors (429)

Rate limit responses include retry timing headers:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1712000000
```

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please wait before retrying.",
  "statusCode": 429,
  "code": "RATE_LIMITED"
}
```

---

## AI Degraded Mode Errors (503)

When an AI provider is unavailable, a structured fallback is returned with status 503:

```json
{
  "error": "AI Provider Unavailable",
  "message": "Primary AI provider is offline. A safe fallback decision was generated.",
  "statusCode": 503,
  "code": "AI_PROVIDER_UNAVAILABLE",
  "degraded": true,
  "fallback": {
    "action": "Unable to generate recommendation — manual review required",
    "actionType": "escalate",
    "confidence": 0,
    "approvalRequired": true,
    "approvalLevel": "operator",
    "reasoning": "Safe fallback triggered: provider timeout"
  }
}
```

---

## Idempotency

Endpoints that mutate state accept `X-Idempotency-Key` header. Keys are stored for 24 hours.

- First request: processed normally, response cached.
- Repeat request with same key + same payload: cached response returned with `X-Idempotency-Replayed: true` header.
- Repeat request with same key + different payload: `409 IDEMPOTENCY_CONFLICT` returned.

---

## Correlation IDs

Every response includes `X-Correlation-Id` header, echoing the request correlation ID. Include this in bug reports.
