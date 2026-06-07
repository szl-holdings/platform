# Error Catalog

Generated: 2026-04-15

## Standard HTTP Errors

| Status | Code | Description | User Message |
|--------|------|-------------|-------------|
| 400 | `VALIDATION_ERROR` | Request body failed Zod schema | "Please check your input and try again" |
| 400 | `BAD_REQUEST` | Malformed request | "Invalid request format" |
| 401 | `UNAUTHORIZED` | No valid auth credentials | "Please sign in to continue" |
| 401 | `TOKEN_EXPIRED` | Auth token has expired | "Your session has expired, please sign in again" |
| 403 | `FORBIDDEN` | Insufficient permissions | "You don't have permission to perform this action" |
| 403 | `ORG_MISMATCH` | Cross-org access attempt | "Resource not found" (intentionally vague) |
| 404 | `NOT_FOUND` | Resource doesn't exist | "The requested resource was not found" |
| 409 | `CONFLICT` | Duplicate or state conflict | "This resource already exists or conflicts with current state" |
| 409 | `IDEMPOTENCY_CONFLICT` | Duplicate idempotency key with different body | "Request conflicts with a previous submission" |
| 422 | `UNPROCESSABLE` | Valid JSON but semantically wrong | "Unable to process this request" |
| 429 | `RATE_LIMITED` | Too many requests | "Too many requests, please try again later" |
| 500 | `INTERNAL_ERROR` | Unexpected server error | "Something went wrong, please try again" |
| 502 | `UPSTREAM_ERROR` | External service failure | "An external service is temporarily unavailable" |
| 503 | `SERVICE_UNAVAILABLE` | Server overloaded/maintenance | "Service temporarily unavailable" |

## Domain-Specific Errors

### Authentication
| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Wrong email/password |
| `ACCOUNT_LOCKED` | Too many failed login attempts |
| `EMAIL_NOT_VERIFIED` | Email verification pending |

### AI/Intelligence
| Code | Description |
|------|-------------|
| `AI_PROVIDER_ERROR` | OpenAI/Anthropic/Gemini API failure |
| `AI_RATE_LIMITED` | AI provider rate limit hit |
| `AI_CONTENT_FILTERED` | Response filtered by safety |

### CORTEX
| Code | Description |
|------|-------------|
| `DRAFT_ALREADY_ACTIONED` | Action draft already approved/dismissed |
| `SCENARIO_INVALID` | Invalid scenario configuration |

## Error Response Structure

All errors follow this format:
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

## Logging Rules

- 4xx errors: Logged at `warn` level
- 5xx errors: Logged at `error` level with stack trace
- Never log: passwords, tokens, PII, encryption keys
- Always log: requestId, userId (if authenticated), route, method, status
