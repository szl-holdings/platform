# API Specification — Rate Limiting & Abuse Protection

## Overview

All API endpoints served by the `api-server` are protected by a layered rate-limit and
abuse-protection stack. Limits are enforced at multiple tiers — a broad portfolio-wide cap, a
per-route override for sensitive surfaces, and a per-user/org sliding window for AI inference.

> **v1 Limitation:** The in-memory limiters (`express-rate-limit`) are per-process. A multi-instance
> deployment does **not** share state across instances. For multi-instance coordination, use the
> PostgreSQL-backed `slidingWindowLimiter` (see `src/middlewares/sliding-window-limiter.ts`).
> Migrating all limits to the DB-backed limiter is tracked as a follow-up hardening item.

---

## Standard 429 Response Shape

Every rate-limit rejection returns HTTP `429 Too Many Requests` with the following JSON body:

```json
{
  "error": "<human-readable message>",
  "code": "RATE_LIMITED",
  "requestId": "<uuid>",
  "correlationId": "<uuid>"
}
```

Response headers on **all** responses (429 and non-429):

| Header | Description |
|---|---|
| `RateLimit-Limit` | Maximum requests allowed in the window |
| `RateLimit-Remaining` | Requests remaining in the current window |
| `RateLimit-Reset` | UTC epoch seconds when the window resets |
| `X-RateLimit-Limit` | Legacy alias (for SDK compatibility) |
| `X-RateLimit-Remaining` | Legacy alias |
| `X-RateLimit-Reset` | Legacy alias |

On 429 responses only:

| Header | Description |
|---|---|
| `Retry-After` | Seconds until the client may retry |

---

## Rate-Limit Tiers

### Tier 1 — Global (portfolio-wide default)

Applied globally in `app.ts` before all route handlers.

| Environment | Window | Max requests | Key |
|---|---|---|---|
| Production | 15 min | 200 | user ID → org ID → IP |
| Development | 15 min | 1,000 | user ID → org ID → IP |

Skips: `/api/health`, `/api/health/live`, `/api/health/ready`, `/api/ready`, verified internal callers.

### Tier 2 — Write operations

Applied on authenticated mutating routes.

| Environment | Window | Max requests | Key |
|---|---|---|---|
| Production | 15 min | 100 | user ID → org ID → IP |
| Development | 15 min | 500 | user ID → org ID → IP |

### Tier 3 — Read operations

Applied on high-volume read routes where the global cap is too tight.

| Environment | Window | Max requests | Key |
|---|---|---|---|
| Production | 15 min | 600 | user ID → org ID → IP |
| Development | 15 min | 2,000 | user ID → org ID → IP |

### Tier 4 — Auth / Login

Applied to all credential-verification endpoints (`POST /auth/login`, `/auth/refresh`, `/auth/mfa/*`).

| Environment | Window | Max requests | Key | Notes |
|---|---|---|---|---|
| Production | 15 min | 10 | IP only | `skipSuccessfulRequests: true` |
| Development | 15 min | 100 | IP only | |

### Tier 5 — AI Inference (express-rate-limit, in-memory)

Applied to model-invoking endpoints: `/ai/respond`, `/ai/triage`, `/ai/extract`, `/ai/plan`,
`/ai/tools/execute`, `/ai/evals/run`, `/forge`, `/copilot`.

| Environment | Window | Max requests | Key |
|---|---|---|---|
| Production | 15 min | 30 | user ID → org ID → IP |
| Development | 15 min | 200 | user ID → org ID → IP |

### Tier 6 — AI Inference Sliding Window (PostgreSQL-backed, multi-instance safe)

Layered on top of Tier 5. Uses an atomic advisory-lock sliding window backed by PostgreSQL.
`failOpen: false` — a DB failure returns 503 instead of permitting the request.

| Environment | Window | Max requests | Key |
|---|---|---|---|
| Production | 1 min | 20 | user ID → IP |
| Development | 1 min | 200 | user ID → IP |

### Tier 7 — Bulk Export

Applied to heavyweight export endpoints: `/aegis-export/*`, `/sentra/siem-export/*`.

| Environment | Window | Max requests | Key |
|---|---|---|---|
| Production | 1 hour | 10 | user ID → org ID → IP |
| Development | 1 hour | 100 | user ID → org ID → IP |

### Tier 8 — Public Form Submissions

Applied to unauthenticated public submission endpoints (e.g. deal intake, contact forms).

| Environment | Window | Max requests | Key |
|---|---|---|---|
| Production | 1 hour | 5 | IP |
| Development | 1 hour | 50 | IP |

### Tier 9 — Public File Uploads

Applied to unauthenticated file-upload endpoints that precede a form submission.

| Environment | Window | Max requests | Key |
|---|---|---|---|
| Production | 1 hour | 60 | IP |
| Development | 1 hour | 300 | IP |

### Tier 10 — GDPR / Data Requests

Applied to GDPR data-request endpoints.

| Environment | Window | Max requests | Key |
|---|---|---|---|
| Production | 1 hour | 3 | IP |
| Development | 1 hour | 30 | IP |

---

## Key Strategy

Rate-limit keys follow this priority order (most-specific wins):

1. **Org ID** — `org:<orgId>` — for tenanted authenticated traffic
2. **User ID** — `user:<userId>` — for authenticated traffic without an org
3. **IP address** — `req.ip` — for anonymous traffic

This ensures authenticated users share a budget that is not inflated by IP collisions (e.g.
shared NAT, CDN egress nodes) and that anonymous bursts from one IP do not exhaust the budget of
legitimate authenticated users on the same network.

---

## Internal Caller Bypass

Verified internal service callers (presenting a valid `X-Internal-Token` header matched against
`INTERNAL_SERVICE_TOKENS`) are **bypassed** from all in-memory rate limits.

The bypass is implemented in `skipForInternalCallers()` (`src/middlewares/rate-limiters.ts`).
Health probe paths (`/api/health`, `/healthz`, `/readyz`) are also unconditionally skipped.

Internal callers are **not** bypassed from the PostgreSQL-backed sliding-window limiters; those
use their own `skip` option when needed.

Token configuration is documented in `docs/SECRETS_POLICY.md`.

---

## Files

| File | Purpose |
|---|---|
| `src/middlewares/rate-limiters.ts` | In-memory limiters, bypass function, key generator |
| `src/middlewares/sliding-window-limiter.ts` | PostgreSQL-backed sliding-window limiter |
| `src/middlewares/__tests__/rate-limiters.test.ts` | Unit + integration tests |
| `src/app.ts` | Global limiter applied at line `app.use(globalLimiter)` |
| `src/routes/groups/ai.ts` | AI inference limiter applied per-route |
| `src/routes/index.ts` | Bulk export limiter applied to export surfaces |
