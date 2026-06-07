# API Commercial Readiness — CTO Assessment

**Generated:** 2026-04-16  
**Scope:** `artifacts/api-server` — DreamStack Platform API  
**Status:** ✅ Integration-Grade / Buyer-Safe

---

## Executive Summary

The SZL Holdings DreamStack API meets the bar for technical evaluators, integration partners, and enterprise buyers. The server is built on a production-hardened Express/TypeScript foundation with structured middleware, consistent error envelopes, request tracing, idempotency support, Swagger/OpenAPI contract discovery, and a safe structured logging posture. The items below document each commercial-readiness dimension.

---

## 1. Health & Observability Endpoints

| Endpoint | Auth | Purpose | Status |
|---|---|---|---|
| `GET /api/health` | None | Full platform health with DB latency, service matrix | ✅ |
| `GET /api/health/live` | None | Kubernetes liveness probe — always 200 | ✅ |
| `GET /api/health/ready` | None | Readiness probe — checks DB connectivity | ✅ |
| `GET /api/ready` | None | Readiness alias — same as /api/health/ready | ✅ (added Phase E) |
| `GET /api/health/detailed` | Internal token or session | Deep diagnostics: pool stats, queue depth, telemetry p95 | ✅ |
| `GET /api/version` | None | Build metadata, API version matrix, endpoint index | ✅ (added Phase E) |
| `GET /healthz` | None | Legacy health alias (router-level) | ✅ |

**Health response shape (summary):**
```json
{
  "status": "healthy | degraded",
  "timestamp": "ISO-8601",
  "uptime": 3600,
  "version": "0.0.0",
  "environment": "production",
  "services": {
    "database": { "status": "ok", "latencyMs": 4 },
    "job_queue": { "status": "ok", "depth": 0 },
    "auth": { "status": "ok", "mode": "configured" },
    "ai": { "status": "ok", "mode": "live" }
  },
  "platform": { "totalApps": 11 }
}
```

---

## 2. Contract Discovery (OpenAPI)

| Path | Description |
|---|---|
| `GET /api/docs` | Swagger UI with persisted authorization |
| `GET /api/docs.json` | Raw OpenAPI 3.1.0 JSON |
| `GET /api/openapi` | OpenAPI JSON (alias — added Phase E) |
| `GET /api/openapi.json` | OpenAPI JSON (alias — added Phase E) |

- Spec location: `lib/api-spec/openapi.yaml`
- Spec format: OpenAPI 3.1.0
- Served via `swagger-ui-express` with `persistAuthorization: true`
- Graceful fallback: if spec file is absent, endpoints 404 silently with a startup log warning

---

## 3. Error Envelope

All error responses conform to a single JSON envelope emitted by `src/lib/api-response.ts`:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_CODE",
  "requestId": "uuid-or-propagated-correlation-id",
  "details": {}
}
```

**Standard error codes:**

| Code | HTTP | Trigger |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema rejection |
| `BAD_REQUEST` | 400 | Malformed input |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | Missing key on required-idempotency routes |
| `IDEMPOTENCY_BODY_MISMATCH` | 409 | Key reused with a different request body |
| `UNAUTHORIZED` | 401 | Missing or invalid credentials |
| `TOKEN_EXPIRED` | 401 | Expired session |
| `FORBIDDEN` | 403 | Insufficient role/scope |
| `ORG_MISMATCH` | 403 | Cross-tenant access attempt (vague by design) |
| `NOT_FOUND` | 404 | Resource missing |
| `CONFLICT` | 409 | Duplicate resource or state conflict |
| `RATE_LIMITED` | 429 | Rate limit window exceeded |
| `INTERNAL_ERROR` | 500 | Unhandled server error |
| `SERVICE_UNAVAILABLE` | 503 | Server overloaded or dependency offline |
| `MUTATION_ERROR` | 500 | Generic write-path failure |

**Consistent enforcement:** `sendError`, `sendBadRequest`, `sendUnauthorized`, `sendForbidden`, `sendNotFound`, and the global error handler all route through the same envelope function.

---

## 4. Request ID / Correlation Tracing

**Middleware:** `src/middlewares/correlation.ts`  
**Applied:** First in the middleware stack — before auth, rate limiting, and logging.

- Reads `X-Correlation-Id` or `X-Request-Id` from inbound request
- Validates against pattern `/^[\w\-.:]{1,128}$/`
- If absent or invalid, generates a UUID
- Propagates via response headers: `X-Correlation-Id` and `X-Request-Id`
- Included in all error envelopes as `requestId`
- Captured by Pino HTTP logger on every request log

Every response — including 4xx/5xx errors — carries both headers.

---

## 5. Validation at API Boundaries

**Tooling:** Zod (via `@szl-holdings/api-zod` shared package)

- Health endpoint responses parsed against `HealthCheckResponse` Zod schema
- Route handlers use `z.safeParse()` / `z.parse()` on request bodies and query params
- Validation errors surface as `400 BAD_REQUEST` with `VALIDATION_ERROR` code
- `handleRouteError()` in `api-response.ts` detects Zod `issues` arrays and produces consistent 400s
- `parsePagination()` normalises and clamps all pagination parameters

**Known coverage gaps:** Some internal/admin routes use light validation; full Zod coverage on all public-facing routes is a follow-up item tracked separately.

---

## 6. Public vs Internal Route Separation

### Public (no auth)
| Path | Notes |
|---|---|
| `GET /api/health` | Platform health |
| `GET /api/health/live` | Liveness |
| `GET /api/health/ready` | Readiness |
| `GET /api/ready` | Readiness alias |
| `GET /api/version` | Build metadata |
| `GET /api/csrf-token` | CSRF token issuance |
| `GET /api/docs` | Swagger UI |
| `GET /api/openapi` | OpenAPI spec |
| `GET /api/public/status` | Public platform status page |
| `POST /api/contact` | Contact form submission |
| `POST /api/demo-requests` | Demo request intake |
| `POST /api/auth/login` | Authentication |
| `POST /api/auth/register` | Registration |

### Authenticated (session cookie or bearer token)
All `/api/*` routes not listed above are protected by `globalAuthEnforcer`.

### Internal (service-to-service)
Routes accepting `X-Internal-Token: <ALLOY_INTERNAL_TOKEN>`:
- `GET /api/health/detailed`
- All routes when called with the internal token bypass standard session auth and are granted `super_admin` role.

### Admin
Routes under `/api/admin/*` additionally require `adminGuard` (role ≥ `ops`).

### SCIM
`/api/scim/*` uses `dos-api-key-auth` middleware (API key via `Authorization: Bearer`), separate from session auth, intended for directory sync integrations.

---

## 7. Auth Model

### Cookie Sessions (primary — web clients)
- Session cookie: `sid`
- Expiry: 24h with sliding refresh via `sessionRefreshPolicy`
- Flags: `HttpOnly`, `Secure` (production), `SameSite=Lax`
- CSRF: Double-submit cookie pattern via `csrfMiddleware` + `GET /api/csrf-token`

### Bearer Tokens (mobile & API consumers)
- Header: `Authorization: Bearer <token>`
- Verified by `authMiddleware`

### Internal Token (service-to-service)
- Header: `X-Internal-Token: <ALLOY_INTERNAL_TOKEN>`
- Constant-time comparison to prevent timing attacks
- Grants `super_admin` role; bypasses session lookup

### SCIM API Key
- Header: `Authorization: Bearer <scim_api_key>`
- Separate key namespace for directory provisioning

### Environment-Aware CORS
- Controlled via `CORS_ORIGINS` environment variable (comma-separated list, supports `*` wildcards)
- Development: all origins permitted when `CORS_ORIGINS` unset
- Production: rejects cross-origin credentialed requests if `CORS_ORIGINS` is unset (logs a startup warning)
- Exposed headers: `X-Correlation-Id`, `X-Request-Id`, `X-Api-Version`, `X-Api-Versions-Supported`, `Deprecation`, `Sunset`

---

## 8. Idempotency

**Middleware:** `src/middlewares/idempotency.ts`  
**Header:** `X-Idempotency-Key` (string, 8–128 chars)  
**TTL:** 24 hours (LRU cache, max 5,000 entries)

- Applies to mutation methods: `POST`, `PUT`, `PATCH`, `DELETE`
- Body fingerprinting via SHA-256; key reuse with a different body returns `409 IDEMPOTENCY_BODY_MISMATCH`
- Replayed responses carry `X-Idempotency-Replayed: true` and `X-Idempotency-Created-At`
- Scoped per user: `userId:method:path:key` prevents cross-user replay

**Required idempotency routes:**
- `POST /api/billing/checkout`
- `POST /api/billing/terra/subscribe`
- `POST /api/billing/cancel-subscription`
- `POST /api/billing/update-subscription`
- `POST /api/ai/tools/execute`

**Optional idempotency routes (key accepted but not required):**
- `POST /api/billing/*` (all other billing mutations)
- `POST /api/webhooks/*`
- `POST /api/alloy/ingest`
- `POST /api/alloy/workflows`

---

## 9. API Versioning

**Current version:** `2026-04-15`  
**Supported versions:** `2025-01-01`, `2026-04-15`  
**Deprecated versions:** `2025-01-01` (sunset: `2027-01-01`)

- Clients declare version via `X-Api-Version` header
- Unsupported version → `400` with supported list in error body
- Deprecated version → response carries `Deprecation: true`, `Sunset: <date>`, `X-Api-Deprecation-Notice`
- Server always responds with `X-Api-Version` (effective version) and `X-Api-Versions-Supported`
- Route-level guards via `requireMinVersion()` for features gated to newer versions

---

## 10. Rate Limiting

| Scope | Limit | Window | Notes |
|---|---|---|---|
| Global | 200 req | 15 min | Per IP, health endpoints excluded |
| Auth endpoints | 5 req | 1 min sliding | Per IP, POST only, fail-closed |
| Read operations | 100 req | 1 min sliding | Per authenticated user, fail-open |
| Write operations | 60 req | 1 min sliding | Per authenticated user, fail-closed |
| Public submissions | 5 req | 1 hour | Per IP (contact, demo-requests) |

Rate limit exceeded → `429 RATE_LIMITED` in standard error envelope with `code` and `requestId`.  
All sliding-window 429s include `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `X-RateLimit-Policy` headers.

---

## 11. Structured Logging

**Library:** Pino (JSON, via `pino-http`)  
**PII Safety:**
- URL query strings are stripped from log records: `url: req.url?.split("?")[0]`
- No password, token, or credential fields are logged
- User identity logged as `userId` (opaque ID), never email or name in hot paths
- 4xx → logged at `warn`; 5xx → logged at `error` with stack trace

**Every request log includes:** `method`, `url` (path only), `correlationId`, `statusCode`, `responseTime`

---

## 12. API Version Endpoint (new — Phase E)

`GET /api/version` — public, no auth required

```json
{
  "version": "0.0.0",
  "apiVersion": "2026-04-15",
  "supportedApiVersions": ["2025-01-01", "2026-04-15"],
  "deprecatedApiVersions": ["2025-01-01"],
  "sunsetDates": { "2025-01-01": "2027-01-01" },
  "environment": "production",
  "build": {
    "commitSha": "abc1234",
    "builtAt": "2026-04-16T00:00:00Z",
    "nodeVersion": "v22.x.x"
  },
  "docs": "/api/docs",
  "openapi": "/api/openapi",
  "health": "/api/health"
}
```

---

## Readiness Verdict

| Dimension | Grade | Notes |
|---|---|---|
| Health endpoints | ✅ Green | Full suite: live/ready/detailed/version |
| Contract discovery | ✅ Green | OpenAPI 3.1.0 at /api/docs, /api/openapi |
| Error envelope | ✅ Green | Single envelope, machine codes, requestId |
| Request tracing | ✅ Green | x-correlation-id on every response |
| Auth model | ✅ Green | Session + Bearer + Internal + SCIM |
| CORS | ✅ Green | Environment-aware, configurable |
| Idempotency | ✅ Green | Required/optional per route |
| API versioning | ✅ Green | Date-versioned, deprecation lifecycle |
| Rate limiting | ✅ Green | Multi-tier sliding window |
| Logging safety | ✅ Green | PII-stripped, structured JSON |
| Validation | 🟡 Amber | Strong on public routes; internal coverage varies |
| Developer docs | ✅ Green | Swagger UI + quickstart |
