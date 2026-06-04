# API Style Guide

Generated: 2026-04-16
Status: Canonical — all new routes must conform

## Base URL

| Environment | Base |
|-------------|------|
| Development | `http://localhost:<PORT>/api/` |
| Staging | `https://staging.szlholdings.com/api/` |
| Production | `https://api.szlholdings.com/api/` |

## Request Format

### Required Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes (POST/PUT/PATCH) | `application/json` |
| `Authorization` | Conditional | `Bearer <token>` for authenticated routes |
| `X-Correlation-Id` | Optional | Auto-generated if absent; propagated through chain |
| `X-Idempotency-Key` | Conditional | Required for billing and AI mutation endpoints |
| `X-Api-Version` | Optional | Request a specific API version (`2026-04-15`) |

### Path Conventions

```
GET    /api/<resource>             → List (paginated)
GET    /api/<resource>/:id         → Fetch single
POST   /api/<resource>             → Create
PUT    /api/<resource>/:id         → Full replace
PATCH  /api/<resource>/:id         → Partial update
DELETE /api/<resource>/:id         → Delete
POST   /api/<resource>/:id/action  → Domain action (approve, reject, execute)
GET    /api/<resource>/export      → Export (analyst+)
POST   /api/<resource>/search      → Advanced search (analyst+)
```

## Response Format

### Success — Single Resource

```json
{
  "data": { "id": 1, "name": "..." },
  "meta": {
    "requestId": "abc-123",
    "timestamp": "2026-04-16T10:00:00Z"
  }
}
```

### Success — List (Paginated)

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 142,
    "totalPages": 6
  },
  "meta": {
    "requestId": "abc-123",
    "timestamp": "2026-04-16T10:00:00Z"
  }
}
```

### Error Envelope

```json
{
  "error": "Human-readable description",
  "code": "BAD_REQUEST",
  "requestId": "unique-request-uuid",
  "correlationId": "trace-correlation-uuid",
  "details": [
    { "path": "email", "message": "Required" }
  ]
}
```

Both `requestId` and `correlationId` are always present. `code` defaults to `INTERNAL_ERROR` (5xx) or `CLIENT_ERROR` (4xx) when not explicitly provided. Zod validation errors produce field-level details arrays automatically.

## Pagination

All list endpoints must support:

| Query Param | Default | Max | Description |
|-------------|---------|-----|-------------|
| `limit` | 25 | 500 | Items per page |
| `offset` | 0 | — | Number of items to skip |
| `page` | — | — | Alternative to offset; `page=2&limit=25` → offset=25 |
| `sort` | `createdAt` | — | Sort field |
| `order` | `desc` | — | `asc` or `desc` |

Use `commonSchemas.pagination` from `lib/validation.ts` for Zod validation.

## Filtering

- Simple filters: `?status=active&orgId=3`
- Multi-value: `?status=active&status=pending` (array query params)
- Date ranges: `?createdAfter=2026-01-01&createdBefore=2026-04-16`
- Full-text: `?q=<search term>` (backed by DB ILIKE or vector search)

## Zod Validation

Every route that accepts body or query params must validate with Zod before touching the database.

```typescript
import { validateBody, validateQuery, commonSchemas } from "../lib/validation";

// Body validation
const schema = z.object({
  name: commonSchemas.shortText,
  email: commonSchemas.email,
  orgId: commonSchemas.orgId,
});

router.post("/example", async (req, res) => {
  const parsed = validateBody(schema, req, res);
  if (!parsed) return;
  // ... use parsed.name, parsed.email, etc.
});
```

## Request IDs & Tracing

- Every request gets a `correlationId` set by `correlationMiddleware`
- Accessible as `req.correlationId` on the request object
- Sent as `X-Correlation-Id` and `X-Request-Id` response headers
- All log lines include `requestId` from the correlation ID

## Idempotency

Required for: billing, AI mutation endpoints, user provisioning.

```
X-Idempotency-Key: <client-generated UUID>
```

Server returns `409 IDEMPOTENCY_CONFLICT` if a different request body is submitted with the same key.

## API Versioning

- Header: `X-Api-Version: 2026-04-15`
- Current version: `2026-04-15`
- Deprecated: `2025-01-01` (sunset: 2027-01-01)
- Unsupported versions return `400` with `UNSUPPORTED_API_VERSION` error

## Health & Meta Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/health` | None | Full health with DB latency |
| `GET /api/health/live` | None | Liveness probe |
| `GET /api/health/ready` | None | Readiness (checks DB) |
| `GET /api/health/detailed` | Internal/Authed | Metrics, memory, queue depth |
| `GET /api/ready` | None | Alias for health/ready |
| `GET /api/version` | None | Version, supported API versions |
| `GET /api/openapi` | None | OpenAPI JSON spec |
| `GET /api/docs` | None | Swagger UI |

## Security Headers (Set by Helmet)

- `Strict-Transport-Security` (production only)
- `Content-Security-Policy` (production only)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

## Rate Limits

| Scope | Limit | Window | Mode |
|-------|-------|--------|------|
| Global | 200 req | 15 min | Per IP |
| Auth endpoints | 5 req | 1 min | Per IP, strict |
| Read operations | 100 req | 1 min | Per user, fail-open |
| Write operations | 60 req | 1 min | Per user, fail-closed |
| Public submissions | 5 req | 1 hour | Per IP |

Health endpoints are excluded from global rate limiting.
