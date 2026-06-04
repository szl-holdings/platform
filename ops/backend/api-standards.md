# API Standards

Generated: 2026-04-15

## Base URL
- Development: `http://localhost:8080/api/`
- Staging: `https://staging.szlholdings.com/api/`
- Production: `https://api.szlholdings.com/api/`

## Request Format

### Headers
| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes (POST/PUT) | `application/json` |
| `Authorization` | Conditional | `Bearer <token>` for authenticated endpoints |
| `X-Correlation-Id` | Optional | Propagated through request chain; auto-generated if absent |
| `X-Internal-Token` | Internal only | Service-to-service auth bypass |
| `X-Idempotency-Key` | Conditional | Required for mutating billing/AI endpoints |

### Pagination
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

## Response Format

### Success
```json
{
  "data": { ... },
  "meta": {
    "requestId": "abc-123",
    "timestamp": "2026-04-15T12:00:00Z"
  }
}
```

### Error
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Email is required",
  "statusCode": 400,
  "requestId": "abc-123"
}
```

## Error Taxonomy

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input failed Zod schema validation |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate resource or state conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Rate Limits

| Scope | Limit | Window | Notes |
|-------|-------|--------|-------|
| Global | 200 requests | 15 minutes | Per IP via express-rate-limit; health endpoints excluded |
| Auth endpoints | 5 requests | 1 minute (sliding) | Per IP, POST only, strict (fail-closed) |
| Read operations | 100 requests | 1 minute (sliding) | Per authenticated user, fail-open |
| Write operations | 60 requests | 1 minute (sliding) | Per authenticated user, fail-closed |
| Public submissions | 5 requests | 1 hour | Per IP for contact/demo endpoints |
| AI/billing mutations | — | — | Idempotency enforced; subject to write limits |

### Rate Limit Headers

Every response from a rate-limited route advertises remaining quota so clients
can pace themselves and avoid 429s. The following headers are emitted on **all**
responses (2xx and 4xx alike):

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed in the current window. |
| `X-RateLimit-Remaining` | Requests remaining in the current window. |
| `X-RateLimit-Reset` | Unix epoch (seconds) when the window resets. |
| `RateLimit-Policy` | IETF draft policy descriptor, e.g. `100;w=60;sliding`. |

On 429 responses an additional `Retry-After` header (seconds) is included.
The OpenAPI spec documents this contract via the shared
`#/components/responses/RateLimited` response object.

## Authentication

### Cookie Sessions
- Session cookie `sid` set on login
- 24-hour expiry with sliding refresh
- Secure, HttpOnly, SameSite=Lax

### Bearer Tokens
- `Authorization: Bearer <token>`
- Used by mobile clients and API consumers

### Internal Token
- `X-Internal-Token: <ALLOY_INTERNAL_TOKEN>`
- Fast path for service-to-service calls
- Bypasses standard auth, grants `super_admin` role

## Role Hierarchy

```
super_admin > ops > manager > analyst > viewer > guest
```

Each role inherits all permissions of roles below it.

## Health Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/health` | None | Full health with DB latency |
| `GET /api/health/live` | None | Liveness probe (always 200) |
| `GET /api/health/ready` | None | Readiness (checks DB) |
| `GET /api/health/detailed` | Internal | Metrics, memory, queue depth |

## GraphQL

- Endpoint: `POST /api/graphql`
- Playground: Available in development
- Authentication: Same as REST (cookie or bearer)
- All operations must be named (Apollo 4 requirement)

## API Documentation

- Swagger UI: `GET /api/docs`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
