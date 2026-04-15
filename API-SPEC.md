# API Specification — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Engineers, integration partners, enterprise evaluators

> The live, machine-readable OpenAPI specification is served at `/api/docs` (Swagger UI) and maintained in `lib/api-spec/openapi.yaml`. This document is the narrative catalogue — use the live spec for code generation and precise schema details.

---

## Overview

All SZL Holdings platform backends are served through a single centralized Express 5 API server (`artifacts/api-server`). There are 172 route files exposing approximately 2,331 endpoints.

**Base URL (development):** `https://$REPLIT_DEV_DOMAIN/api`
**Base URL (production):** `https://<domain>/api`

---

## Authentication

All authenticated endpoints require a valid session established via the auth flow below.

### Session Auth (Web)

Two auth route files serve different authentication flows:

**`auth.ts`** — Password / session auth (mounted at `/api`):
```
POST /api/auth/login           — Username/email + password login
POST /api/auth/login-password  — Alternative email + password endpoint
POST /api/auth/register        — New user registration
GET  /api/auth/verify-email    — Email verification callback
GET  /api/auth/me              — Current session user
GET  /api/auth/providers       — Available auth providers
POST /api/auth/sessions        — Create session
DELETE /api/auth/sessions/current  — Logout (invalidate current session)
DELETE /api/auth/sessions/:id  — Invalidate specific session
GET  /api/auth/roles           — Available roles (operator/analyst required)
GET  /api/auth/users           — User list (ops role required)
POST /api/auth/ws-ticket       — Issue HMAC-signed WebSocket ticket
```

**`oidc-auth.ts`** — OIDC/PKCE flow (mounted at `/api`):
```
GET  /api/login                — Initiate OIDC login (Replit Auth / Azure AD)
GET  /api/callback             — OIDC authorization code callback
GET  /api/logout               — OIDC logout + session invalidation
GET  /api/auth/user            — OIDC session user info
GET  /api/azure-ad/login       — Azure AD SSO initiation
GET  /api/azure-ad/callback    — Azure AD SSO callback
POST /api/mobile-auth/token-exchange — Exchange OIDC code for mobile session
POST /api/mobile-auth/logout   — Mobile session logout
```

Session token is returned as an opaque `sid` cookie. All state-changing requests require a `csrf_token` cookie (double-submit CSRF pattern).

### WebSocket Auth

```
POST /api/auth/ws-ticket       — Issue a 5-minute HMAC-signed WebSocket ticket
```

Include the ticket as a query parameter when upgrading to WebSocket.

### Mobile / Bearer Auth

Mobile apps may use `Authorization: Bearer <token>` header in place of the `sid` cookie.

---

## Global Middleware

Applied to every request in this order:

| Middleware | Purpose |
|-----------|---------|
| `correlationMiddleware` | Assigns `X-Correlation-Id` to every request |
| `apiVersionMiddleware` | Reads `X-API-Version` header |
| `helmet` | Security headers (CSP, HSTS, etc.) |
| `CORS` | `CORS_ORIGINS` env var controls allowed origins |
| `compression` | gzip response compression |
| `globalLimiter` | Rate limiting (configurable via env) |
| `telemetryMiddleware` | Request telemetry and latency tracking |
| `pinoHttp` | Structured request logging |
| `cookieParser` | Cookie parsing |
| `JSON / urlencoded body` | Request body parsing |
| `CSRF` | Double-submit CSRF token validation |
| `authMiddleware` | Session hydrator — populates `req.user` (does NOT reject unauthenticated) |
| `sessionRefreshPolicy` | Extends session TTL on activity |
| `etagMiddleware` | Optimistic concurrency (`/api` prefix only; health/docs excluded) |

---

## Route Groups

### Auth (`/api/auth`, `/api/login`, `/api/callback`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/login` | Public | Initiate OIDC login (Replit Auth / Azure AD) |
| `GET` | `/api/callback` | Public | OIDC authorization code callback |
| `GET` | `/api/logout` | Session | OIDC logout + session invalidation |
| `GET` | `/api/auth/user` | Session | OIDC session user info |
| `POST` | `/api/auth/login` | Public | Username/password login |
| `POST` | `/api/auth/login-password` | Public | Alternative email/password endpoint |
| `POST` | `/api/auth/register` | Public | New user registration |
| `GET` | `/api/auth/verify-email` | Public | Email verification callback |
| `GET` | `/api/auth/me` | Session | Current session user info |
| `GET` | `/api/auth/providers` | Public | Available auth providers |
| `POST` | `/api/auth/sessions` | Session | Create/extend session |
| `DELETE` | `/api/auth/sessions/current` | Session | Invalidate current session |
| `DELETE` | `/api/auth/sessions/:id` | Session | Invalidate specific session |
| `POST` | `/api/auth/ws-ticket` | Session | Issue HMAC-signed WebSocket ticket |
| `GET` | `/api/azure-ad/login` | Public | Azure AD SSO initiation |
| `GET` | `/api/azure-ad/callback` | Public | Azure AD SSO callback |
| `POST` | `/api/mobile-auth/token-exchange` | Public | Exchange OIDC code for mobile session |
| `POST` | `/api/mobile-auth/logout` | Session | Mobile session logout |

### Health (`/api/health`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health/live` | Public | Liveness probe |
| `GET` | `/api/health/ready` | Public | Readiness probe (DB check) |
| `GET` | `/api/health` | Public | Full system health |
| `GET` | `/api/health/detailed` | Session or `X-Internal-Token` | DB pool, queue depth, telemetry, p95 latency |

**Health response example:**
```json
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy" },
    "auth": { "status": "configured" },
    "ai": { "status": "configured" },
    "storage": { "status": "configured" },
    "job_queue": { "status": "healthy" }
  },
  "timestamp": "2026-04-15T12:00:00Z"
}
```

### Alloy — Execution Fabric (`/api/alloy`)

Workflow orchestration, approval chains, audit trail, and agent coordination.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/alloy/workflows` | Session | List workflow definitions |
| `POST` | `/api/alloy/workflows` | Session + operator | Create workflow |
| `GET` | `/api/alloy/workflows/:id` | Session | Get workflow detail |
| `POST` | `/api/alloy/workflows/:id/run` | Session + operator | Trigger workflow run |
| `GET` | `/api/alloy/runs` | Session | List workflow runs |
| `GET` | `/api/alloy/runs/:id` | Session | Get run detail + audit trail |
| `GET` | `/api/alloy/approvals` | Session | List pending approvals |
| `POST` | `/api/alloy/approvals/:id/approve` | Session + approver | Approve action |
| `POST` | `/api/alloy/approvals/:id/reject` | Session + approver | Reject action |
| `GET` | `/api/alloy/audit` | Session | Query audit trail |
| `GET` | `/api/alloy/agents` | Session | List registered agents |
| `POST` | `/api/alloy/chat` | Session | Alloy AI chat |

Additional sub-routes under `/api/alloy`:
`/alloy-channels`, `/alloy-cognitive-learning`, `/alloy-digest`, `/alloy-email`, `/alloy-governance`, `/alloy-integrations`, `/alloy-meetings`, `/alloy-research`, `/alloy-skills`, `/alloy-voice`, `/autopilot`

### Aegis / Firestorm — Security Operations (`/api/firestorm`)

SOC operations, threat intelligence, incident management.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/firestorm/threats` | Session + analyst | List active threats |
| `GET` | `/api/firestorm/incidents` | Session + analyst | List security incidents |
| `POST` | `/api/firestorm/incidents` | Session + operator | Create incident |
| `GET` | `/api/firestorm/incidents/:id` | Session + analyst | Get incident detail |
| `POST` | `/api/firestorm/incidents/:id/respond` | Session + operator | Record response action |
| `GET` | `/api/firestorm/playbooks` | Session + analyst | List SOAR playbooks |
| `POST` | `/api/firestorm/playbooks/:id/run` | Session + operator | Execute playbook |
| `GET` | `/api/firestorm/intel` | Session + security_analyst | Threat intelligence feed |
| `GET` | `/api/firestorm/mitre` | Session | MITRE ATT&CK coverage |
| `GET` | `/api/firestorm/vulnerabilities` | Session + analyst | Vulnerability list |

### Terra — Real Estate Intelligence (`/api/terra`)

Property intelligence, ownership graph, deal pipeline.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/terra/properties` | Session | List properties |
| `GET` | `/api/terra/properties/:id` | Session | Property detail + distress signals |
| `GET` | `/api/terra/distress` | Session | Active distress pipeline |
| `GET` | `/api/terra/ownership` | Session | Ownership entity graph |
| `GET` | `/api/terra/deals` | Session | Deal pipeline |
| `POST` | `/api/terra/deals` | Session + operator | Create deal |
| `GET` | `/api/terra/deals/:id` | Session | Deal detail |
| `PUT` | `/api/terra/deals/:id` | Session + operator | Update deal |
| `GET` | `/api/terra/market-signals` | Session | Market signal feed |
| `GET` | `/api/terra/contacts` | Session | Contact CRM |

### Vessels — Maritime Intelligence (`/api/vessels`)

Fleet tracking, voyage economics, sanctions screening, AIS telemetry.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/vessels/fleet` | Session | Fleet overview |
| `GET` | `/api/vessels/vessels` | Session | List vessels |
| `GET` | `/api/vessels/vessels/:id` | Session | Vessel digital twin |
| `GET` | `/api/vessels/ais` | Session | Real-time AIS positions |
| `GET` | `/api/vessels/voyages` | Session | Voyage list |
| `GET` | `/api/vessels/voyages/:id` | Session | Voyage P&L, route, timeline |
| `GET` | `/api/vessels/anomalies` | Session | Dark vessel / route anomalies |
| `GET` | `/api/vessels/sanctions` | Session | Sanctions screening results |
| `GET` | `/api/vessels/exceptions` | Session | Exception center |
| `POST` | `/api/vessels/exceptions/:id/respond` | Session + operator | Record exception response |

### PRISM Counsel — Legal Matter Command (`/api/prism-counsel`)

Full legal matter management, court filings, recovery tracking.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/prism-counsel/matters` | Session | List matters |
| `POST` | `/api/prism-counsel/matters` | Session + operator | Create matter |
| `GET` | `/api/prism-counsel/matters/:id` | Session | Matter detail |
| `GET` | `/api/prism-counsel/matters/:id/timeline` | Session | Matter timeline |
| `GET` | `/api/prism-counsel/matters/:id/documents` | Session | Matter documents |
| `GET` | `/api/prism-counsel/recovery` | Session | Recovery operations |
| `GET` | `/api/prism-counsel/deadlines` | Session | Deadline calendar |
| `GET` | `/api/prism-counsel/no-fault` | Session | NY No-Fault module |
| `GET` | `/api/prism-counsel/playbooks` | Session | Legal playbooks |

### AI Tool Execution (`/api/ai`)

AI inference routing across OpenAI, Anthropic, and Gemini. Source: `artifacts/api-server/src/routes/ai-engine.ts`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/ai/health` | Session | AI engine health check |
| `GET` | `/api/ai/models` | Session | Available model list |
| `POST` | `/api/ai/respond` | Session | General AI inference/chat completion |
| `POST` | `/api/ai/triage` | Session | Triage and classify input |
| `POST` | `/api/ai/extract` | Session | Structured data extraction |
| `POST` | `/api/ai/plan` | Session | AI task planning |
| `POST` | `/api/ai/retrieve` | Session | RAG / retrieval-augmented query |
| `GET` | `/api/ai/tools` | Session | List registered AI tools |
| `POST` | `/api/ai/tools/preview` | Session | Preview tool execution (dry-run) |
| `POST` | `/api/ai/tools/execute` | Session | Execute registered AI tool |
| `GET` | `/api/ai/audit` | Session | AI usage audit log |
| `POST` | `/api/ai/evals/run` | Session | Run evaluation against golden set |
| `GET` | `/api/ai/evals/golden-set` | Session | Retrieve evaluation golden set |
| `POST` | `/api/ai/retrieval/ingest` | Session | Ingest document into vector store |
| `GET` | `/api/ai/decision` | Session | List AI decision records |
| `POST` | `/api/ai/decision` | Session | Create AI decision record |
| `GET` | `/api/ai/decision/:id` | Session | Get AI decision by ID |
| `GET` | `/api/ai/approval-matrix` | Session | Current AI approval matrix |

### Intelligence Feeds (`/api/intelligence`)

External data source adapters.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/intelligence/feeds` | Session + analyst | Available feed list |
| `GET` | `/api/intelligence/stix` | Session + security_analyst | STIX/TAXII threat objects |
| `GET` | `/api/intelligence/ais` | Session | AIS vessel positions |
| `GET` | `/api/intelligence/sanctions` | Session | Sanctions list query |
| `GET` | `/api/intelligence/legal` | Session | Legal record feeds |

### Billing (`/api/billing`)

Stripe billing operations.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/billing/subscription` | Session | Current subscription |
| `POST` | `/api/billing/checkout` | Session | Create Stripe Checkout session |
| `POST` | `/api/billing/portal` | Session | Create Customer Portal session |
| `GET` | `/api/billing/invoices` | Session | Invoice history |
| `POST` | `/api/billing/webhook` | Public (Stripe sig) | Stripe webhook handler |

### Object Storage (`/api/storage`)

File upload and retrieval.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/storage/upload` | Session | Upload file |
| `GET` | `/api/storage/files` | Session | List org files |
| `GET` | `/api/storage/files/:id` | Session | Get file metadata |
| `DELETE` | `/api/storage/files/:id` | Session + operator | Delete file |

### Admin (`/api/admin`)

Guarded with `super_admin` role or admin PIN.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/admin/tenants` | super_admin | List tenants |
| `POST` | `/api/admin/tenants` | super_admin | Provision tenant |
| `POST` | `/api/admin/backup` | super_admin | Trigger DB backup |
| `GET` | `/api/admin/audit` | super_admin | Platform-wide audit log |

### Notifications (`/api/notifications`)

Push notification management.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/notifications/subscribe` | Session | Register push subscription |
| `POST` | `/api/notifications/send` | Session + operator | Send notification |
| `GET` | `/api/notifications/history` | Session | Notification history |

### Additional Route Groups

The following route groups exist with standard CRUD and query endpoints:

`/api/analytics`, `/api/analytics-engine`, `/api/apm`, `/api/approvals`, `/api/atlas-artifacts`,
`/api/audit-chain`, `/api/autopilot`, `/api/backup`, `/api/booking`, `/api/briefing`,
`/api/capital-readiness`, `/api/carlota-jo`, `/api/certification-readiness`, `/api/changes`,
`/api/cms`, `/api/command`, `/api/comments`, `/api/compliance`, `/api/connectors`,
`/api/documents`, `/api/export`, `/api/feature-flags`, `/api/feedback`,
`/api/files`, `/api/graphql`, `/api/imperium`, `/api/lyte`, `/api/orgs`,
`/api/search`, `/api/settings`, `/api/users`, `/api/webhooks`

---

## GraphQL Endpoint

**Endpoint:** `POST /api/graphql`

Apollo Server is mounted at `/api/graphql`. The schema covers query and mutation operations across platform domains.

**Introspection:** Enabled in development. Disabled in production.

**Authentication:** Same session cookie / Bearer token as REST endpoints.

**Explorer:** Available at `/api/graphql` in development (Apollo Sandbox).

---

## MCP (Model Context Protocol)

The platform implements a full MCP server at `/api/mcp` (JSON-RPC 2.0 style). Source: `artifacts/api-server/src/routes/mcp.ts`.

### MCP Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/mcp` | Session | JSON-RPC 2.0 tool invocation |
| `GET` | `/api/mcp/sse` | Session | Server-Sent Events (streaming) |
| `GET` | `/api/mcp/tools` | Session | List registered tools |
| `GET` | `/api/mcp/resources` | Session | List registered resources |
| `GET` | `/api/mcp/prompts` | Session | List registered prompts |
| `GET` | `/api/mcp/health` | Session | MCP server health |

### Registered Tools

| Tool Name | Purpose |
|-----------|---------|
| `vessels_fleet_status` | Vessels fleet status query |
| `vessels_weather_risk` | Vessels route weather risk assessment |
| `firestorm_threat_scan` | Aegis threat intelligence scan |
| `firestorm_compliance_check` | Aegis compliance check |
| `terra_property_search` | Terra property search |
| `terra_market_signals` | Terra market signals query |
| `lyte_health_check` | Lyte platform health check |
| `lyte_executive_summary` | Lyte executive summary generation |
| `inca_experiment_status` | INCA model experiment status |
| `alloy_launch_workflow` | Alloy workflow trigger |
| `alloy_workflow_status` | Alloy workflow run status |
| `alloy_create_artifact` | Alloy artifact creation |
| `alloy_research` | Alloy research mode query |
| `alloy_decision_status` | Alloy decision record status |
| `alloy_approve_decision` | Alloy decision approval |
| `alloy_skill_list` | List registered agent skills |
| `alloy_skill_invoke` | Invoke a registered agent skill |
| `connector_hub_discover` | Connector Hub integration discovery |
| `connector_hub_execute` | Execute a connector action |
| `connector_hub_health` | Connector Hub health check |
| `query_holdings_ecosystem` | SZL Holdings ecosystem query |
| `query_audit_log` | Audit log query |
| `query_notifications` | Notifications query |

### Registered Prompts

| Prompt Name | Purpose |
|------------|---------|
| `research_brief` | Multi-domain research brief generation |
| `threat_assessment` | Security threat assessment |
| `property_analysis` | Real estate property analysis |
| `fleet_report` | Maritime fleet report generation |
| `executive_digest` | Cross-domain executive digest |

---

## Rate Limiting

| Tier | Limit | Scope |
|------|-------|-------|
| Global | Configurable via `RATE_LIMIT_*` env vars | Per IP |
| Auth routes | Stricter limit | Per IP |
| AI routes | Token-based limit | Per session |

---

## Error Format

All errors follow a consistent JSON envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {},
    "correlationId": "req-abc123"
  }
}
```

Common HTTP status codes:
- `400` — Validation error (Zod)
- `401` — Unauthenticated
- `403` — Insufficient role
- `404` — Resource not found
- `409` — Conflict (ETag mismatch)
- `429` — Rate limited
- `500` — Internal server error

---

## OpenAPI & Code Generation

The full OpenAPI spec is in `lib/api-spec/openapi.yaml` and served live at `/api/docs`.

Zod validation schemas are maintained in `@szl-holdings/api-zod` and derived from the OpenAPI spec:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Related Documents

| Document | Path |
|----------|------|
| Live OpenAPI spec | `/api/docs` |
| OpenAPI source | `lib/api-spec/openapi.yaml` |
| Zod schemas | `lib/api-zod/` |
| Route inventory (frontend) | `ROUTE_INVENTORY.md` |
| Access control | `ACCESS-CONTROL-MATRIX.md` |
| Architecture | `ARCHITECTURE.md` |
