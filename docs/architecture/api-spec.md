# API Specification — SZL Holdings Platform

**Date:** April 2026 | **Audience:** Technical advisors, integration engineers, enterprise evaluators

**Related:** [architecture.md](architecture.md) · [DATA-MODEL.md](data-model.md) · [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md)

---

## API Overview

The SZL Holdings platform exposes a single centralized API server (`artifacts/api-server`) that backs all web and mobile frontends.

| Metric | Value |
|--------|-------|
| Total endpoints | 5,065 measured operations in `artifacts/SOURCE_OF_TRUTH.json` |
| Route files | 140+ TypeScript route files in `artifacts/api-server/src/routes/` |
| Spec format | OpenAPI 3.1 (served at `/api/docs`) |
| JSON spec | `/api/docs.json` |
| Endpoint catalogue | [`API-CATALOGUE.md`](api-catalogue.md) (auto-generated from spec) |
| GraphQL | Apollo Server at `/api/graphql` |
| Protocol | REST/JSON primary; GraphQL for complex queries |
| Authentication | Session cookie (`sid`) or `Authorization: Bearer` token |

---

## Base URL

| Environment | Base URL |
|-------------|----------|
| Development (Replit) | `https://$REPLIT_DEV_DOMAIN/api` |
| Production (Azure) | `https://api.szlholdings.com/api` |

All REST routes are prefixed with `/api`.

---

## Authentication Model

### Session Authentication (Web)

The platform has two distinct session flows with different token delivery mechanisms:

**OIDC (Primary — cookie-based):** `GET /api/login` → redirect to Replit Auth or Azure AD → `GET /api/callback` completes the flow and calls `setSessionCookie()`, setting an `sid` HttpOnly cookie (Secure, SameSite=Lax). Session TTL: **7 days** (`SESSION_TTL` in `artifacts/api-server/src/lib/auth.ts`). Azure AD alternate: `GET /api/azure-ad/login` → `GET /api/azure-ad/callback`.

**Credential (Fallback — bearer token):** `POST /api/auth/login` (Zod-validated credential) and `POST /api/auth/login-password` (PBKDF2 email/password) both create a session record and return the session token **in the JSON response body** — they do NOT call `setSessionCookie()`. Session TTL: **30 days** (hardcoded in `artifacts/api-server/src/routes/auth.ts`). The client stores this token and sends it as `Authorization: Bearer <token>` in subsequent requests.

**Common to both flows:**
- Session record stored in PostgreSQL `sessions` table
- Global `authMiddleware` accepts both `sid` cookie and `Authorization: Bearer <token>`; populates `req.user` if session is valid
- Route-level `requireAuth()` enforces authentication and role checks per-route

### Token Authentication (Mobile / API)

Mobile clients and machine-to-machine callers use `Authorization: Bearer <token>` instead of the `sid` cookie. The token is the same opaque session token stored in PostgreSQL.

### WebSocket Authentication

WebSocket connections use short-lived HMAC-signed tickets:

1. Client calls `POST /api/auth/ws-ticket` with valid session
2. Server issues a ticket signed with `SESSION_SECRET`, TTL: 5 minutes
3. Client presents ticket on WebSocket handshake
4. Per-channel role-based ACL enforced at subscription time via `CHANNEL_ALLOWED_ROLES`. Channel names are static strings (e.g., `aegis-incidents`, `lyte-metrics`) — not org_id-namespaced. `tenantId` from the ticket is tracked per-client. Tickets are self-contained 5-minute tokens with no central revocation on session expiry.

### CSRF Protection

Most state-changing requests (POST, PUT, PATCH, DELETE) require a CSRF token via double-submit pattern. The CSRF token is available at `GET /api/csrf-token`. The following paths use different CSRF protection or are exempt:
- **`/api/graphql`**: Not exempt — uses a dedicated protection scheme requiring `Content-Type: application/json` plus at least one of: `X-Requested-With`, `X-CSRF-Token`, or `X-Apollo-Operation-Name` header.
- **`/api/ai/*` routes**: Fully exempt.
- **Webhook receivers** (`/api/webhooks/*`, `/api/billing/webhooks`, `/api/alloy/channels/slack/webhook`, etc.): Exempt (verified via provider signatures instead).
- **Billing checkout/portal paths**: Exempt.
- **Observability/telemetry ingest, MCP routes, auth handshake endpoints**: Exempt.

See `artifacts/api-server/src/middlewares/csrf.ts` `EXEMPT_PATHS` and `isExempt()` for the full list.

---

## Route Groups

### Auth (`/api/auth` and OIDC top-level)

**OIDC flow routes** (redirect-based, mounted at `/api` root — see `artifacts/api-server/src/routes/oidc-auth.ts`):

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/login` | GET | Public | OIDC login initiation (Replit Auth) — redirects to identity provider |
| `/api/callback` | GET | Public | OIDC callback handler — completes token exchange |
| `/api/logout` | GET | Public | OIDC logout — clears session and cookie |
| `/api/azure-ad/login` | GET | Public | Azure AD OIDC initiation |
| `/api/azure-ad/callback` | GET | Public | Azure AD callback |

**Credential and session routes** (mounted at `/api/auth` — see `artifacts/api-server/src/routes/auth.ts`):

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | Public | Credential-based login (Zod-validated) |
| `/api/auth/login-password` | POST | Public | Email/password login with PBKDF2 verification |
| `/api/auth/register` | POST | Public | Email/password registration |
| `/api/auth/verify-email` | GET | Public | Email verification via token |
| `/api/auth/me` | GET | Required | Current user + roles |
| `/api/auth/sessions` | POST | Required | Create additional session |
| `/api/auth/sessions/current` | DELETE | Required | Logout / invalidate current session |
| `/api/auth/sessions/:id` | DELETE | Required | Invalidate specific session by ID |
| `/api/auth/ws-ticket` | POST | Required | Issue HMAC-signed WebSocket ticket |
| `/api/auth/user` | GET | Public | Current OIDC user info |
| `/api/auth/providers` | GET | Public | List configured auth providers |
| `/api/csrf-token` | GET | Public | Get CSRF token |

---

### Alloy — Workflow Engine (`/api/alloy`)

| Endpoint Group | Auth | Description |
|---------------|------|-------------|
| `/api/alloy/workflows` | Required | CRUD for workflow instances |
| `/api/alloy/workflows/:id/approve` | Required | Approve a workflow action |
| `/api/alloy/workflows/:id/reject` | Required | Reject a workflow action |
| `/api/alloy/actions` | Required | Action history and audit |
| `/api/alloy/agents` | Required | AI agent registry and status |
| `/api/alloy/audit` | Required | Full audit trail access |

---

### Aegis — Security & Defense (`/api/firestorm`)

Routes retain the `/api/firestorm` prefix for backward compatibility; the frontend artifact is `aegis` at `/aegis/`.

| Endpoint Group | Auth | Description |
|---------------|------|-------------|
| `/api/firestorm/incidents` | Required | SOC incident management |
| `/api/firestorm/findings` | Required | Threat finding CRUD |
| `/api/firestorm/playbooks` | Required | SOAR playbook management |
| `/api/firestorm/threat-intel` | Required | Threat intelligence feeds |
| `/api/firestorm/cves` | Required | CVE database access |
| `/api/firestorm/mitre` | Required | MITRE ATT&CK mapping |
| `/api/firestorm/assets` | Required | Asset inventory |
| `/api/firestorm/compliance` | Required (compliance_officer+) | Compliance reports |

---

### Vessels — Maritime (`/api/vessels`)

| Endpoint Group | Auth | Description |
|---------------|------|-------------|
| `/api/vessels` | Required | Fleet registry CRUD |
| `/api/vessels/:id/positions` | Required | AIS position history |
| `/api/vessels/:id/voyages` | Required | Voyage history and economics |
| `/api/vessels/sanctions` | Required | Sanctions screening results |
| `/api/vessels/dark-activity` | Required | Dark period detection events |
| `/api/vessels/port-calls` | Required | Port call history |
| `/api/vessels/trading` | Required | Commodity trading (fills, positions) |
| `/api/vessels/insurance` | Required | Marine insurance records |

---

### Terra — Real Estate (`/api/terra`)

| Endpoint Group | Auth | Description |
|---------------|------|-------------|
| `/api/terra/properties` | Required | Property search and CRUD |
| `/api/terra/properties/:id/distress` | Required | Distress signal history |
| `/api/terra/deals` | Required | Deal pipeline management |
| `/api/terra/owners` | Required | Ownership entity graph |
| `/api/terra/market` | Required | Market signal aggregation |
| `/api/terra/contacts` | Required | Broker/investor CRM |

---

### PRISM Counsel — Legal (`/api/prism-counsel`) [DEPRECATED]

PRISM Counsel frontend is deprecated (task #579). API routes remain for data access but are no longer actively developed.

| Endpoint Group | Auth | Description |
|---------------|------|-------------|
| `/api/prism-counsel/matters` | Required | Matter management CRUD |
| `/api/prism-counsel/parties` | Required | Parties and representation |
| `/api/prism-counsel/documents` | Required | Document management |
| `/api/prism-counsel/filings` | Required | Court filing records |
| `/api/prism-counsel/timeline` | Required | Case timeline events |
| `/api/prism-counsel/recovery` | Required | Recovery and lien tracking |
| `/api/prism-counsel/no-fault` | Required | NY No-Fault module |

---

### AI Tools (`/api/ai`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai/chat` | POST | Required | AI inference (multi-provider) |
| `/api/ai/analyze` | POST | Required | Document/signal analysis |
| `/api/ai/recommend` | POST | Required | Recommendation generation |

AI endpoints return recommendations with model version logged to the audit trail. Confidence scores and reasoning context are included where implemented, but are not uniformly enforced across all AI endpoints (see KNOWN-GAPS.md). AI endpoints do not execute consequential actions directly — outputs are routed through the Alloy workflow gate for human approval.

---

### AI Operations Dashboard (`/api/ai/ops`)

Provides visibility into AI system cost, latency, quality, and human review operations. Access requires `analyst` minimum role.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/ai/ops/summary` | GET | Required (`analyst+`) | 24-hour rolling snapshot: cost, latency, confidence, review queue, eval pass rates, per-domain aggregates |
| `/api/ai/ops/traces` | GET | Required (`analyst+`) | Paginated trace list; filter by `domain`, `requiresReview`, `status`, `riskLevel` |
| `/api/ai/ops/traces/:traceId` | GET | Required (`analyst+`) | Single trace detail |
| `/api/ai/ops/traces/:traceId/status` | PATCH | Required (`operator+`) | Update trace status (`pending` / `evaluated` / `reviewed` / `flagged` / `archived`) |
| `/api/ai/ops/traces/capture` | POST | Required (`operator+`) | Manually capture a trace (testing / data import) |
| `/api/ai/ops/review-queue` | GET | Required (`analyst+`) | Review queue items; filter by `domain`, `status`, `priority`, `verdict` |
| `/api/ai/ops/review-queue/stats` | GET | Required (`analyst+`) | Review queue statistics and priority breakdown |
| `/api/ai/ops/review-queue/:reviewId/decision` | PATCH | Required (`operator+`) | Record review verdict: `approved`, `rejected`, `flagged`, `escalated`, `deferred` |
| `/api/ai/ops/review-queue/:reviewId/claim` | PATCH | Required (`analyst+`) | Claim a review item for in-progress review |
| `/api/ai/ops/evaluators` | GET | Required (`admin+`) | Registered evaluator hooks inventory (platform-global; admin only) |
| `/api/ai/ops/evaluators/stats` | GET | Required (`admin+`) | Aggregated evaluator hook pass rates and run counts (platform-global; admin only) |
| `/api/ai/ops/traces/:traceId/feedback` | POST | Required (any role) | Record human feedback on a trace. Body: `{ sentiment: "up" \| "down", correction?: string, comment?: string }`. `down` marks the trace `flagged` |
| `/api/ai/ops/traces/:traceId/feedback` | GET | Required (`analyst+`) | List feedback entries + summary for a trace |

**Trace schema fields:** `traceId`, `model`, `modelProvider`, `domain`, `recommendationType`, `promptHash`, `promptTokens`, `completionTokens`, `latencyMs`, `costEstimateUsd`, `confidence`, `riskLevel`, `requiresReview`, `reviewReason`, `evalScore`, `evalPassed`, `status`, `capturedAt`.

See [AI_EVALUATION_STRATEGY.md](ai-evaluation-strategy.md) for full trace capture and evaluation documentation.

---

### Intelligence Feeds (`/api/intelligence`)

| Endpoint Group | Auth | Description |
|---------------|------|-------------|
| `/api/intelligence/stix` | Required | STIX/TAXII threat data |
| `/api/intelligence/ais` | Required | AIS telemetry feeds |
| `/api/intelligence/sanctions` | Required | Sanctions list sync |
| `/api/intelligence/legal` | Required | Legal record feeds (CourtListener) |

---

### Storage (`/api/storage`)

| Endpoint Group | Auth | Description |
|---------------|------|-------------|
| `/api/storage/uploads/request-url` | Required | POST — generate signed upload URL (object storage) |
| `/api/storage/objects/*path` | Required | GET — retrieve protected object by path |
| `/api/storage/public-objects/*path` | Public | GET — retrieve public object by path |
| `/api/files` | Required | GET — list files; POST — create file record |
| `/api/files/:id` | Required | GET — get file; DELETE — delete file |
| `/api/assets` | Required | GET — list assets |

---

### Billing (`/api/billing`)

| Endpoint Group | Auth | Description |
|---------------|------|-------------|
| `/api/billing/checkout` | Required | Stripe checkout session creation |
| `/api/billing/subscriptions` | Required | Subscription management |
| `/api/billing/customer-portal` | Required | Stripe Customer Portal redirect |
| `/api/billing/webhooks` | Public (Stripe signature verified) | Stripe webhook receiver |

---

### Admin (`/api/admin`)

Admin routes are protected by `adminGuard` middleware (`artifacts/api-server/src/middlewares/admin-guard.ts`). Access requires **one** of:
- An authenticated session where the user has `super_admin`, `ops`, or `exec` assigned in the `roles` table (via `user_roles` join)
- A valid `x-internal-token` header matching `ALLOY_INTERNAL_TOKEN` env var (server-to-server use only)

There is **no PIN gate** in `adminGuard`.

| Endpoint Group | Auth | Description |
|---------------|------|-------------|
| `/api/admin/tenants` | adminGuard | Tenant provisioning |
| `/api/admin/backup` | adminGuard | Database backup operations |
| `/api/admin/users` | adminGuard | Platform-level user management |

---

### MCP Gateway (`/api/mcp`)

The Model Context Protocol gateway exposes platform capabilities as structured, scoped, auditable tools for AI agents and operator assistants.

**Protocol:** JSON-RPC 2.0 (MCP 2024-11-05)
**Authentication:** Optional — public tool subset available without auth; tenant-scoped tools require session cookie or Bearer token.
**CSRF:** Exempt (auth via session/token; request integrity enforced at middleware level).

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `POST /api/mcp` | POST | Optional | JSON-RPC 2.0 message endpoint (single or batch requests) |
| `GET /api/mcp/sse` | GET | Optional | Server-Sent Events stream for persistent MCP client sessions |
| `GET /api/mcp/health` | GET | Public | Gateway health, server info, tool/resource/prompt counts |
| `GET /api/mcp/tools` | GET | Optional | Tool inventory with JSON schema for each tool |
| `GET /api/mcp/resources` | GET | Optional | Resource inventory |
| `GET /api/mcp/prompts` | GET | Optional | Prompt template inventory |

**MCP Methods:**

| Method | Description |
|--------|-------------|
| `initialize` | Handshake — returns server info and capabilities |
| `tools/list` | List all available tools with input schemas |
| `tools/call` | Invoke a specific tool by name |
| `resources/list` | List platform data resources |
| `resources/read` | Read a named resource by URI |
| `prompts/list` | List available prompt templates |
| `prompts/get` | Get a prompt template with rendered messages |
| `ping` | Liveness check |

**Tool categories:**
- **Domain tools** (~13): `firestorm_*`, `vessels_*`, `terra_*`, `lyte_*`, `inca_*` — domain intelligence and operations
- **Platform tools** (~6): `alloy_*` — workflow engine, decision records, skills, approvals
- **Data tools** (~7): `platform_*` — proof chain, outcome graph, policy simulation, tenant state

**Security:** Every tool invocation is org-scoped (tenant context injected from session, not from caller parameters), role-checked, and audit-logged. High-risk workflow actions require approval before execution and return `status: "pending_approval"`.

See [MCP_GATEWAY_STRATEGY.md](mcp-gateway-strategy.md) for full gateway design, tool inventory, and security model.

---

### Health (`/api/health`)

Implemented in `artifacts/api-server/src/app.ts`. Health endpoints are public except `/api/health/detailed`.

| Endpoint | Auth | Description |
|----------|------|-------------|
| `/api/health` | Public | Checks DB connectivity and connection count. Returns `200 OK` if healthy, `503` if degraded. |
| `/api/health/live` | Public | Always returns `200 OK` with `{status: "ok"}` — process liveness only, no DB check. |
| `/api/health/ready` | Public | Checks DB connectivity. Returns `200` if DB reachable, `503` if not. |
| `/api/health/detailed` | **Production:** any authenticated session (`req.isAuthenticated()`) or `X-Internal-Token` header matching `ALLOY_INTERNAL_TOKEN`. **Development:** no auth enforced. | Full system status: DB connectivity + pool stats, job queue depth (pending/running/failed), telemetry (P95 latency, error rate, active alerts). Returns `503` if any check is `degraded`. |

---

## Rate Limiting

Rate limiting is applied at two levels:

| Level | Configuration | Policy |
|-------|---------------|--------|
| Global | `globalLimiter` middleware | Applied to all routes |
| Auth routes | Stricter per-IP limits | `POST /api/auth/*` endpoints |
| AI routes | Per-user token budget | `POST /api/ai/*` endpoints |

Specific limits are environment-configured. Clients that exceed limits receive `429 Too Many Requests` with a `Retry-After` header.

---

## OpenAPI Specification

The full machine-readable spec is maintained in `lib/api-spec/openapi.yaml` (OpenAPI 3.1). It is served at `/api/docs` as Swagger UI and can be fetched as JSON at `/api/docs.json`.

A human-readable endpoint table is auto-generated from the spec and committed as **[API-CATALOGUE.md](api-catalogue.md)**. Regenerate it after any spec changes with:

```bash
pnpm docs:generate
```

To verify the catalogue matches the current spec without writing a new file (useful in CI):

```bash
pnpm docs:check
```

The spec is the authoritative source for:
- Request/response schemas (Zod validation is used in many handlers; several high-traffic routes lack Zod validation — see KNOWN-GAPS.md)
- Authentication requirements per endpoint
- Error response codes and shapes

---

## GraphQL Endpoint

Apollo Server is mounted at `/api/graphql`. It is used for complex cross-domain queries that would require multiple REST round-trips. Schema introspection is disabled in production (`!isProduction` flag in `artifacts/api-server/src/graphql/index.ts`).

GraphQL context is populated with `req.user` via the global `authMiddleware`. Authentication (identity verification) is enforced before GraphQL resolvers execute by `globalAuthEnforcer` (`artifacts/api-server/src/middlewares/global-auth-enforcer.ts`), which applies deny-by-default to all `/api/*` routes not on the public allowlist. `/api/graphql` is not on the public allowlist. Individual resolvers are still responsible for **authorization** checks (which data a user may access), but unauthenticated requests are rejected at the middleware layer before reaching resolvers.

---

## Error Response Format

Error responses from `sendError` (`artifacts/api-server/src/lib/api-response.ts`) follow this shape:

```json
{
  "error": "Descriptive error message",
  "code": "BAD_REQUEST",
  "requestId": "unique-request-uuid",
  "correlationId": "trace-correlation-uuid",
  "details": [
    { "path": "email", "message": "Required" }
  ]
}
```

- `error` — human-readable error string (always present)
- `code` — machine-readable error code (always present; defaults to `INTERNAL_ERROR` for 5xx, `CLIENT_ERROR` for 4xx)
- `requestId` — unique request identifier (always present, maps to `X-Request-Id` response header)
- `correlationId` — trace correlation ID (always present, maps to `X-Correlation-Id` response header)
- `details` — additional context (optional; Zod validation errors produce field-level arrays automatically)

HTTP status is set via the response status code, not a field in the body. Some route handlers return bespoke error shapes outside of `sendError`; the above applies to the majority of routes.

---

## Versioning

The API uses date-based versioning via the `X-Api-Version` request header, implemented in `artifacts/api-server/src/middlewares/api-version.ts`.

| Version | Status | Sunset |
|---------|--------|--------|
| `2026-04-15` | Current | — |
| `2025-01-01` | Deprecated | `2027-01-01` |

If `X-Api-Version` is not provided, the server defaults to the current version. Unsupported versions receive `400 Bad Request`. The response always includes `X-Api-Version` and `X-Api-Versions-Supported` headers.

---

*See also: [DATA-MODEL.md](data-model.md) · [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) · [ROUTE_INVENTORY.md](route-inventory.md)*

---

*Last verified against source code: 2026-04-16. Re-verify against `artifacts/api-server/src/`, `lib/db/src/schema/`, and `lib/auth/src/` after significant code changes.*
