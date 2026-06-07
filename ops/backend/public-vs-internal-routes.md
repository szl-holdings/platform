# Public vs Internal Route Classification

**Last updated:** 2026-04-16
**Owner:** API Platform
**Source of truth:** `artifacts/api-server/src/app.ts` and `artifacts/api-server/src/routes/`

This document classifies every externally-reachable surface on the API server into one of three tiers and states the enforcement mechanism for each. Use it to answer: *"Can this endpoint be called by an external integrator?"*

---

## Tier definitions

| Tier | Audience | Authentication required | CORS audience | Documented in OpenAPI |
|------|----------|-------------------------|---------------|------------------------|
| **Public** | Anyone (probes, login, status) | No | All origins (anonymous) | Yes |
| **Authenticated** | Customers, integrators with bearer/cookie | Yes (session or `Authorization: Bearer`) | `CORS_ORIGINS` allow-list with credentials | Yes |
| **Internal** | Service-to-service / operator tooling | `X-Internal-Token` (`ALLOY_INTERNAL_TOKEN`) **or** authenticated operator session | Same-origin / internal mesh only | No (intentionally undocumented) |

CORS enforcement lives in `app.ts` (`corsOriginFn`). In production, `CORS_ORIGINS` must be set or credentialed cross-origin requests are rejected. The `X-Internal-Token` check uses `crypto.timingSafeEqual` to prevent timing oracles.

---

## Public routes (unauthenticated)

These are intentionally callable without credentials. Each one is rate-limited by the global limiter (200 req / 15 min per IP) and, where applicable, by the route-specific limiter. The authoritative allowlist lives in `artifacts/api-server/src/middlewares/global-auth-enforcer.ts` — this table mirrors it.

### Platform / probe surfaces

| Method | Path | Purpose | Notes |
|--------|------|---------|-------|
| `GET` | `/` | Liveness sentinel | Returns `OK` text |
| `GET` | `/api/health` | Full health summary | Returns 503 when `dbStatus=degraded` or `auth=degraded` |
| `GET` | `/api/health/live` | Pure liveness probe | Always 200 if process is up |
| `GET` | `/api/ready` | Readiness probe | Includes DB ping, returns 503 if unreachable |
| `GET` | `/api/health/ready` | Alias of `/api/ready` | For probe systems that prefer the `/health/*` namespace |
| `GET` | `/api/version` | Build/version metadata | `version`, `apiVersion`, `supportedApiVersions`, `commitSha`, `builtAt` |
| `GET` | `/api/openapi`, `/api/openapi.json`, `/api/docs.json` | OpenAPI spec (JSON) | Served from `lib/api-spec/openapi.yaml` |
| `GET` | `/api/docs` | Swagger UI | Browsable API explorer |
| `GET` | `/api/csrf-token` | Issue CSRF cookie + token | Required before mutating calls from browsers |

### Auth & identity

| Method | Path | Purpose | Notes |
|--------|------|---------|-------|
| `*` | `/api/auth/*` | Login / logout / session bootstrap | Strict rate limit (5 req / min per IP) |
| `*` | `/api/oidc/*` | OIDC callbacks (Replit, Azure AD) | Discovery-driven; no app session yet at callback time |

### Public submissions & content

| Method | Path | Purpose | Notes |
|--------|------|---------|-------|
| `POST` | `/api/contact` | Marketing contact form | Public-submission rate limit (5 req / hr per IP) |
| `POST` | `/api/demo-requests` | Demo signup form | Public-submission rate limit (5 req / hr per IP) |
| `*` | `/api/public/*` | Public marketing/status content | Read-only, anonymous |

### Service-token authenticated (not session/OIDC)

These routes are publicly *reachable* but every request is verified by a per-route credential (HMAC signature, bearer token, or stream auth token). No platform session or OIDC principal is required, so the OIDC enforcer treats them as "public" and delegates auth to the route handler.

| Method | Path | Auth mechanism | Purpose |
|--------|------|----------------|---------|
| `*` | `/api/webhooks/*` | HMAC signature in route handler | Inbound webhooks from third-party systems |
| `*` | `/api/scim/*` | SCIM bearer token (`scimTokensTable`, RFC 7643/7644) | SCIM 2.0 user/group provisioning |
| `*` | `/api/stream/webhook/*`, `/api/stream/webhook-siem`, `/api/stream/ais-nmea` | Source token (streamed-ingestion `authToken`) | High-volume webhook ingestion |
| `GET` | `/api/stream/siem-events`, `/api/stream/market-data`, `/api/stream/ais-tracking`, `/api/stream/status` | Read-only SSE feeds | Live dashboards (auth handled at subscription gate) |
| `GET` | `/api/federation/agents`, `/api/federation/agents/*`, `/api/federation/health` | A2A discovery (per A2A spec) | Agent-to-agent federation discovery |
| `*` | `/api/v1/*` | DOS public API key (`X-Api-Key` validated by `dos-api-key-auth`) | DOS Public API surface |

Operational rule: do **not** add a new public route without (a) writing it into the appropriate table above, (b) adding it to the allowlist in `global-auth-enforcer.ts` with a comment explaining why session auth is bypassed, (c) adding the route-specific rate limit and/or service-token verification, and (d) adding it to the OpenAPI spec (or, for service-token surfaces, to the integration-specific spec).

---

## Authenticated routes

Default tier for all `/api/*` routes mounted via `routes/index.ts` after `authMiddleware` and `globalAuthEnforcer`. They require either:

- A valid session cookie (`sid`) issued by the OIDC flow, or
- `Authorization: Bearer <token>` for API consumers / mobile clients.

Every authenticated route runs through:

1. `correlationMiddleware` — assigns `X-Request-Id` and propagates `X-Correlation-Id`.
2. `apiVersionMiddleware` — negotiates API version, emits `Deprecation`/`Sunset` headers when applicable.
3. `csrfMiddleware` — required for state-changing requests originating from cookie sessions.
4. `authMiddleware` + `globalAuthEnforcer` — rejects with `UNAUTHORIZED` envelope if no valid principal.
5. `etagMiddleware` — emits/validates ETags for optimistic concurrency on resource reads/writes.
6. Route-specific Zod validation (`lib/api-zod`) at the handler boundary.

Mutating routes that touch billing, AI inference, decision approvals, workflow executions, or proof-chain writes additionally require `X-Idempotency-Key` (8–128 chars). The middleware (`middlewares/idempotency.ts`) enforces single-execution semantics with a 24-hour replay window and a body-fingerprint mismatch check (returns `409 IDEMPOTENCY_BODY_MISMATCH`).

---

## Internal routes

These exist for service-to-service calls and operator tooling. They are **not** advertised in the public OpenAPI spec and **not** intended for third-party integration.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/health/detailed` | `X-Internal-Token` **or** authenticated user (in production) | DB pool stats, queue depth, telemetry snapshot |
| `*` | `/api/admin/*` | Authenticated + role ≥ `admin` | Operator console, system config, diagnostics |
| `POST` | `/api/graphql` | Authenticated | Internal GraphQL surface; not part of the integration contract |

In production, `/api/health/detailed` rejects anonymous callers entirely. The `X-Internal-Token` value must equal `process.env.ALLOY_INTERNAL_TOKEN` (minimum 32 chars; enforced at startup by `lib/startup-validation.ts`).

Operational rule: a route is internal **only** if it is either gated by `X-Internal-Token` or restricted to `role >= admin`. Marking a route "internal" in code without one of these gates is a documentation error, not an authorization decision.

---

## Auth & CORS configuration matrix

| Environment | `CORS_ORIGINS` | Credentials | OIDC | Internal token | Notes |
|-------------|----------------|-------------|------|----------------|-------|
| Local dev   | unset → all origins allowed | enabled | optional (REPL_ID) | auto-generated 96-char | Convenient defaults; never enable in prod |
| Staging     | required (allow-list)        | enabled | required           | required 32+ chars     | Mirrors prod auth path |
| Production  | required (allow-list)        | enabled | required           | required 32+ chars     | Startup `failFastOnInvalidConfig` aborts boot if missing |

`CORS_ORIGINS` accepts either exact origins (`https://app.example.com`) or wildcard subdomains (`https://*.example.com`). Wildcards compile to anchored regular expressions in `originToPattern`.

---

## Adding a new route — checklist

1. Decide tier (public / authenticated / internal) and add it to the table above in the same PR.
2. If public: add a route-specific rate limit and a positive auth-bypass test.
3. If authenticated: confirm Zod validation is wired at the route entry; confirm idempotency requirement for mutating endpoints.
4. If internal: gate behind `X-Internal-Token` *or* `requireRole('admin'|'super_admin')`; do **not** publish it in the OpenAPI spec.
5. Add or update the OpenAPI definition for tiers 1 and 2.
6. Update `ops/backend/authz-matrix.md` if the route introduces a new role/permission.
