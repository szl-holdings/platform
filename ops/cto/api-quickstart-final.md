# DreamStack API — Technical Evaluator Quickstart

**Version:** 2026-04-16  
**API Version:** 2026-04-15  
**Base URL (production):** `https://api.szlholdings.com/api`  
**Base URL (development):** `http://localhost:8080/api`

---

## 5-Minute Tour

### 1. Verify the API is alive

```bash
curl https://api.szlholdings.com/api/health/live
# → {"status":"ok"}
```

### 2. Check API version and contract discovery

```bash
curl https://api.szlholdings.com/api/version
```

```json
{
  "version": "0.0.0",
  "apiVersion": "2026-04-15",
  "supportedApiVersions": ["2025-01-01", "2026-04-15"],
  "deprecatedApiVersions": ["2025-01-01"],
  "environment": "production",
  "docs": "/api/docs",
  "openapi": "/api/openapi",
  "health": "/api/health"
}
```

### 3. Explore the full OpenAPI spec

```bash
# Machine-readable JSON
curl https://api.szlholdings.com/api/openapi

# Interactive Swagger UI (open in browser)
open https://api.szlholdings.com/api/docs
```

### 4. Full platform health

```bash
curl https://api.szlholdings.com/api/health
```

Returns database latency, service matrix, job queue depth, memory usage, and the platform app registry.

---

## Authentication

The API supports three authentication mechanisms:

### A. Session Cookie (web clients)

```bash
# 1. Get a CSRF token
curl -c cookies.txt https://api.szlholdings.com/api/csrf-token
# → {"csrfToken":"abc123..."}

# 2. Log in
curl -c cookies.txt -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <csrfToken>" \
  -d '{"email":"user@example.com","password":"secret"}' \
  https://api.szlholdings.com/api/auth/login
```

The session cookie `sid` is set automatically. Include `-b cookies.txt` on subsequent requests.

### B. Bearer Token (mobile / API clients)

```bash
curl -H "Authorization: Bearer <your-token>" \
  https://api.szlholdings.com/api/projects
```

### C. Internal Service Token (service-to-service)

```bash
curl -H "X-Internal-Token: <ALLOY_INTERNAL_TOKEN>" \
  https://api.szlholdings.com/api/health/detailed
```

Only for trusted internal services. Bypasses session auth and grants `super_admin` role.

---

## Request Conventions

### Required Headers

| Header | When | Value |
|---|---|---|
| `Content-Type` | POST/PUT/PATCH | `application/json` |
| `Authorization` | Authenticated endpoints (bearer mode) | `Bearer <token>` |
| `X-CSRF-Token` | Mutation endpoints (cookie mode) | Token from `/api/csrf-token` |
| `X-Api-Version` | Optional | `2026-04-15` (omit to use default) |
| `X-Correlation-Id` | Optional | Propagated through to response and logs |
| `X-Idempotency-Key` | Required for billing/AI mutations | Unique string, 8–128 chars |

### Declaring an API Version

```bash
curl -H "X-Api-Version: 2026-04-15" \
  https://api.szlholdings.com/api/projects
```

If omitted, the current version (`2026-04-15`) is used. Deprecated versions return deprecation headers.

### Request Tracing

Include `X-Correlation-Id` to trace requests across services:

```bash
curl -H "X-Correlation-Id: my-trace-12345" \
  https://api.szlholdings.com/api/projects
# Response includes: X-Correlation-Id: my-trace-12345
```

---

## Response Conventions

### Success

```json
{ "data": { "id": "123", "name": "My Project" } }
```

Paginated:
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 25, "total": 142, "totalPages": 6 }
}
```

### Error

All errors follow a single envelope:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_CODE",
  "requestId": "uuid",
  "details": {}
}
```

**Common codes:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`

---

## Idempotency (Mutation Safety)

High-value mutation endpoints require an idempotency key to prevent duplicate operations:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: $(uuidgen)" \
  -d '{"planId":"pro","billingCycle":"annual"}' \
  https://api.szlholdings.com/api/billing/checkout
```

- Keys are scoped per user; the same key by a different user is independent
- Replayed responses include `X-Idempotency-Replayed: true`
- TTL: 24 hours
- Sending the same key with a different body → `409 IDEMPOTENCY_BODY_MISMATCH`

**Endpoints requiring idempotency keys:**
- `POST /api/billing/checkout`
- `POST /api/billing/terra/subscribe`
- `POST /api/billing/cancel-subscription`
- `POST /api/billing/update-subscription`
- `POST /api/ai/tools/execute`

---

## Rate Limits

| Scope | Limit | Window | Notes |
|---|---|---|---|
| Global | 200 req | 15 min | Per IP; health endpoints excluded |
| Auth (`/api/auth/*`) | 5 req | 1 min sliding | Per IP, POST only |
| Read operations | 100 req | 1 min sliding | Per authenticated user |
| Write operations | 60 req | 1 min sliding | Per authenticated user |
| Public submissions | 5 req | 1 hour | Per IP (contact, demo) |

Rate limited responses: `429 RATE_LIMITED` with standard error envelope (`error`, `code`, `requestId`).  
Sliding-window 429s also include `Retry-After`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

---

## Key Endpoints by Domain

### Platform
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Full platform health |
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe |
| GET | `/api/ready` | Readiness alias (same as /api/health/ready) |
| GET | `/api/version` | Build metadata + API version |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/openapi` | OpenAPI 3.1.0 JSON |

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with email + password |
| POST | `/api/auth/register` | Register new account |
| POST | `/api/auth/logout` | Invalidate session |
| GET | `/api/csrf-token` | Get CSRF token |

### AI Intelligence (Alloy)
| Method | Path | Description |
|---|---|---|
| POST | `/api/alloy/chat` | Chat with Alloy AI |
| POST | `/api/ai/tools/execute` | Execute AI tool (idempotent) |
| GET | `/api/alloy/digest` | AI-curated briefings |
| POST | `/api/alloy/research` | Deep research requests |

### Domain Packs
| Domain | Base Path |
|---|---|
| Terra (Real Estate) | `/api/terra` |
| Vessels (Maritime) | `/api/vessels` |
| Aegis / Firestorm (Defense/Cyber) | `/api/firestorm` |
| PRISM Counsel (Legal) | `/api/prism-counsel` |
| Lyte (E-commerce) | `/api/lyte` |
| Holdings | `/api/holdings` |

### Observability & Jobs
| Method | Path | Description |
|---|---|---|
| GET | `/api/jobs` | Job queue status |
| GET | `/api/observability` | Platform telemetry |
| GET | `/api/analytics` | Usage analytics |
| GET | `/api/audit` | Audit trail |

---

## GraphQL

```bash
# All GraphQL operations via POST
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' \
  https://api.szlholdings.com/api/graphql
```

- All operations must be named
- Authentication: same as REST (cookie or bearer)
- Development playground available at `/api/graphql` (GET)

---

## Webhooks

Outbound events are delivered to your registered endpoint via `POST` with:

```http
POST https://your-endpoint.com/webhook
Content-Type: application/json
X-Correlation-Id: <event-correlation-id>
X-Event-Type: <event.type>
X-Signature: sha256=<hmac-hex>
```

Register your endpoint: `POST /api/webhooks`  
Verify signatures using the shared secret from your webhook config.

See `/ops/cto/event-and-webhook-map.md` for the full event catalog.

---

## Developer Checklist

- [ ] Hit `/api/health/live` — confirm `200 OK`
- [ ] Hit `/api/version` — record `apiVersion` and bookmark `/api/docs`
- [ ] Authenticate and receive session cookie or bearer token
- [ ] Include `X-Correlation-Id` on all requests for tracing
- [ ] Generate a unique `X-Idempotency-Key` for all billing/AI mutations
- [ ] Add `X-Api-Version: 2026-04-15` to lock your integration to the current version
- [ ] Register a webhook endpoint and verify the HMAC signature on delivery
- [ ] Review the full OpenAPI spec at `/api/openapi`
