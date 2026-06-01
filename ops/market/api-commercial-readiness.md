# API Commercial Readiness

**Last updated:** April 2026  
**Purpose:** Defines the public-facing API story for technical evaluators and integration partners. Covers what is public, what is internal, authentication, error semantics, and what an integration looks like.

---

## API Overview

The SZL Holdings API is a REST API with GraphQL capabilities. It provides programmatic access to the platform's decision intelligence and workflow capabilities.

**Base URLs:**

| Environment | URL |
|---|---|
| Development | `http://localhost:8080/api/` |
| Staging | `https://staging.szlholdings.com/api/` |
| Production | `https://api.szlholdings.com/api/` |

**API Documentation:** Swagger UI available at `/api/docs`. OpenAPI 3.1 spec at `/lib/api-spec/openapi.yaml`.

---

## Public vs. Internal vs. Authenticated Routes

### Public (No Auth Required)

These routes are accessible without authentication:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Full health check with DB latency and version |
| `/api/health/live` | GET | Liveness probe — always returns 200 if server is running |
| `/api/health/ready` | GET | Readiness probe — checks DB connection |
| `/api/auth/login` | POST | Authenticate with email + password |
| `/api/auth/register` | POST | Create a new account |
| `/api/docs` | GET | Swagger UI documentation |

**Rate limits on public routes:**
- Auth endpoints: 5 requests/minute per IP (strict, fail-closed)
- Public contact/demo submissions: 5 requests/hour per IP
- Health endpoints: excluded from rate limiting

---

### Authenticated Routes (Bearer Token or Session Cookie)

The majority of API routes require authentication. Access level is determined by the caller's role.

**Authentication mechanisms:**

1. **Session Cookie** — Primary mechanism for web application users
   - Cookie name: `sid`
   - 24-hour expiry with sliding refresh
   - Secure, HttpOnly, SameSite=Lax

2. **Bearer Token** — Primary mechanism for API consumers and mobile clients
   - Header: `Authorization: Bearer <token>`
   - Token obtained from `/api/auth/login`
   - Same role enforcement as session cookie

**Both mechanisms enforce the same RBAC hierarchy:**

```
super_admin > ops > manager > analyst > viewer > guest
```

**Rate limits for authenticated routes:**
- Read operations: 100 requests/minute per authenticated user (fail-open)
- Write operations: 60 requests/minute per authenticated user (fail-closed)
- Global: 200 requests/15 minutes per IP (all users, fail-open)

---

### Internal Routes (Service-to-Service Only)

Some routes are protected by the internal token:

- `X-Internal-Token: <ALLOY_INTERNAL_TOKEN>` header required
- Bypasses standard auth, grants `super_admin` role
- Used only for service-to-service communication within the platform
- **Never exposed to external API consumers**

Technical evaluators should note: if they encounter 403 on any endpoint with a valid bearer token, the endpoint likely requires `ops` or `super_admin` role. Internal token routes are not available to external integrations.

---

## Request and Response Format

### Standard Request Headers

| Header | Required | Description |
|---|---|---|
| `Content-Type` | Yes (POST/PUT) | `application/json` |
| `Authorization` | Conditional | `Bearer <token>` for authenticated endpoints |
| `X-Correlation-Id` | Optional | Propagated through request chain; auto-generated if absent |
| `X-Idempotency-Key` | Conditional | Required for mutating billing/AI endpoints |

---

### Standard Success Response

```json
{
  "data": { ... },
  "meta": {
    "requestId": "abc-123",
    "timestamp": "2026-04-15T12:00:00Z"
  }
}
```

---

### Standard Paginated Response

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 142,
    "totalPages": 6
  }
}
```

---

### Standard Error Response

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Email is required",
  "statusCode": 400,
  "requestId": "abc-123"
}
```

---

## Error Taxonomy

| Code | HTTP Status | Meaning | Integration Guidance |
|---|---|---|---|
| `VALIDATION_ERROR` | 400 | Input failed schema validation | Check request body against OpenAPI spec |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token | Re-authenticate and retry |
| `FORBIDDEN` | 403 | Insufficient role for this endpoint | Caller's role does not include this permission |
| `NOT_FOUND` | 404 | Resource does not exist | Also returned for cross-org access (by design) |
| `CONFLICT` | 409 | Duplicate resource or state conflict | Check for existing resource before creating |
| `RATE_LIMITED` | 429 | Too many requests | Back off and retry with exponential backoff |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Log the `requestId` and report if persistent |

**Integration note:** 404 is returned for both genuinely missing resources and cross-org access attempts. This is a deliberate security design — it prevents information leakage about the existence of resources in other organizations.

---

## GraphQL Endpoint

- Endpoint: `POST /api/graphql`
- Authentication: Same as REST (cookie or bearer token)
- All operations must be named (Apollo 4 requirement)
- GraphQL Playground: Available in development environment only

---

## API Quickstart for Integrators

### 1. Authenticate

```bash
curl -X POST https://api.szlholdings.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@org.com", "password": "your-password"}'

# Response: {"data": {"token": "<bearer-token>", "user": {...}}}
```

### 2. Use the Token

```bash
curl https://api.szlholdings.com/api/dashboard/summary \
  -H "Authorization: Bearer <bearer-token>"
```

### 3. Handle Rate Limits

When you receive a `429 RATE_LIMITED` response:
- Read the `Retry-After` header if present
- Apply exponential backoff: wait 1s, then 2s, then 4s, then 8s
- For write operations: use `X-Idempotency-Key` to safely retry without duplication

### 4. Track Requests with Correlation IDs

Provide `X-Correlation-Id: <your-uuid>` on every request. This ID is:
- Propagated through the request chain
- Included in all log entries related to that request
- The reference you provide when reporting an issue

---

## API Sandbox Status

**Current status:** No dedicated sandbox environment.

Integration testing against the platform requires either:
- A design partner agreement that includes API integration scope
- A founder-provisioned test workspace (available on request for qualified technical evaluators)

A dedicated sandbox/developer environment is on the roadmap post-first-production agreement.

---

## What the API Does Not Currently Expose

For transparency with technical evaluators:

| Capability | Status |
|---|---|
| Webhook event subscriptions | On roadmap — not yet available |
| OAuth 2.0 authorization flow for third-party apps | On roadmap — not yet available |
| Real-time streaming (WebSocket for external integrators) | Internal use only (WebSocket for web app); external streaming on roadmap |
| Bulk data export via API | Available via `POST /api/*/export` endpoints for authenticated users |
| Public developer API keys | Not yet available — all access requires account authentication |

---

*See also: `integration-priority-map.md` (high-value integration patterns), `technical-evaluator-brief.md` (one-page summary)*
