# Threat Model

**Platform:** SZL Holdings Governed Decision Infrastructure  
**Last updated:** 2026-05-16  
**Scope:** Production-focused threat model for the deployed application, with primary emphasis on `artifacts/api-server/` and production-reachable server routes.

---

## Production Scope Assumptions

These assumptions are authoritative for this scan and future production-focused scans unless the deployment model changes:

- `mockup-sandbox/` is never deployed to production.
- In production, `NODE_ENV === "production"`.
- Replit/platform-managed TLS is assumed for browser↔server traffic.
- Demo-only UI behavior is out of scope unless a production server route or runtime path makes it reachable.
- The primary production attack surface is `artifacts/api-server/`.
- Development scripts, local test harnesses, and build-time helpers are not reportable unless production reachability is demonstrated.

---

## Project Overview

SZL Holdings is a multi-tenant TypeScript/Node.js platform that combines business intelligence, operational monitoring, AI orchestration, and control-plane tooling behind a shared Express API server.

### Stack

- **Frontend:** React, Vite, shared UI packages
- **Backend:** Express 5, TypeScript, Drizzle ORM, PostgreSQL
- **Auth:** Session-backed auth via `authMiddleware`, route-level RBAC via `requireRole`, tenant scoping via `tenantScope`
- **AI / control plane:** MCP routes, governed MCP gateway, NEXUS shared AI/control-plane surfaces
- **Realtime transports:** GraphQL WebSocket subscriptions, SSE streams, WebSocket broadcast channels
- **Persistence:** Shared PostgreSQL database with mixed tenant-scoped and platform-global tables

### Primary actors

| Actor | Trust level | Notes |
|---|---|---|
| Unauthenticated internet user | Untrusted | Can reach explicit public routes, webhook endpoints, and a number of allowlisted demo/control-plane surfaces. |
| Authenticated tenant user | Low-Medium | Must not gain platform-global or cross-tenant access purely by having a valid session. |
| Tenant admin / org admin | Medium | Can manage their own tenant but must not access other tenants or platform-global operator surfaces. |
| Ops / super_admin user | High | Allowed to access sensitive control-plane and cross-tenant operational surfaces. |
| Internal services | Trusted only when internal-token checks succeed | Must not be reachable through confused-deputy paths from ordinary users. |
| Webhook / ingestion source | Untrusted until authenticated | Must prove authenticity before mutation or ingestion. |

---

## Production Surface Map

### Production-reachable core

- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/index.ts`
- `artifacts/api-server/src/routes/index.ts`
- `artifacts/api-server/src/middlewares/auth.ts`
- `artifacts/api-server/src/middlewares/global-auth-enforcer.ts`
- `artifacts/api-server/src/middlewares/tenant-scope.ts`

### Highest-risk route families

- `artifacts/api-server/src/routes/mcp.ts`
- `artifacts/api-server/src/routes/mcp-governed-gateway.ts`
- `artifacts/api-server/src/routes/nexus.ts`
- `artifacts/api-server/src/routes/billing.ts`
- `artifacts/api-server/src/graphql/`
- `artifacts/api-server/src/routes/streaming-ingestion.ts`
- `artifacts/api-server/src/routes/sentra.ts`
- `artifacts/api-server/src/routes/sentra-siem.ts`
- `artifacts/api-server/src/routes/risk-evidence.ts`
- `artifacts/api-server/src/routes/agent-mesh.ts`

### Out of scope unless production reachability is shown

- `mockup-sandbox/`
- `scripts/`
- `__tests__/`
- local/dev workflows and smoke-test scripts
- build-only configuration and CI assets

**Current note:** HoundDog flagged a token-to-stdout issue in `apps/substrate-inference/scripts/smoke_test.py`, but that path is currently treated as dev-only and not production-reachable.

---

## Key Trust Boundaries

| Boundary | Security requirement |
|---|---|
| Anonymous → authenticated | Public allowlists must be narrowly scoped and must not expose sensitive mutation or control-plane data. |
| Authenticated user → privileged operator/admin | Baseline authentication is not enough for MCP governance, agent-mesh, NEXUS control-plane, or other operational surfaces. |
| Tenant A → Tenant B | Every tenant-owned record, event stream, and Stripe object must be bound to the caller's org before read or mutation. |
| API → internal services | Internal tokens must never be usable indirectly by ordinary users through proxy/tool/confused-deputy flows. |
| API → external systems | Stripe, connectors, and webhook-backed sources must validate ownership/integrity before server-side actions. |
| Shared realtime bus → subscriber | WebSocket and SSE subscribers must be authenticated where appropriate and filtered by tenant/role before receiving events. |

---

## Security Invariants

These are the rules the production system must satisfy.

### Authentication and authorization

- Non-public routes must require a valid authenticated session.
- Privileged control-plane routes must require explicit elevated roles, not just any authenticated user.
- MCP governance and approval flows must enforce reviewer privilege before approval is accepted.
- Raw MCP transport must not expose privileged/internal-token-backed capabilities to ordinary tenant users.

### Tenant isolation

- Tenant-owned reads and writes must be constrained by server-side org ownership, not UI assumptions.
- Global identifiers supplied by clients, especially Stripe identifiers, must be rebound to the caller's tenant before use.
- Shared control-plane stores must persist sufficient ownership data to enforce tenant isolation on both reads and writes.
- Long-lived transports must filter pushed events by tenant and role, not merely authenticate the initial connection.

### Public routes and webhooks

- Public routes are exceptions and must be reviewed individually.
- Any public mutation route must be explicitly intended, integrity-protected, and safe against cross-user tampering.
- Webhook/ingestion endpoints must verify signatures or secrets that an attacker cannot self-provision.
- Public telemetry feeds must not expose operationally sensitive production data.

### Internal/control-plane exposure

- Internal topology, egress policy, secret metadata, and runtime inventory are sensitive.
- Scanning or discovery surfaces must not allow anonymous users to enumerate server-side AI tooling or local config files.
- Environment registry and similar operational inventory must remain restricted to ops/super_admin or internal scoped tokens.

---

## Scan Anchors for Future Security Reviews

Start here before broadening the scan:

- `artifacts/api-server/src/app.ts` — app wiring, special public routes, env registry, middleware order
- `artifacts/api-server/src/middlewares/global-auth-enforcer.ts` — public allowlist and implicit trust boundaries
- `artifacts/api-server/src/middlewares/auth.ts` — session user shape and role enforcement helpers
- `artifacts/api-server/src/middlewares/tenant-scope.ts` — tenant/org enforcement behavior
- `artifacts/api-server/src/routes/mcp.ts` — raw MCP transport and tool execution
- `artifacts/api-server/src/routes/mcp-governed-gateway.ts` — approvals, API keys, gateway governance plane
- `artifacts/api-server/src/graphql/index.ts` + `artifacts/api-server/src/graphql/domains/*` — WS auth context and subscription filtering
- `artifacts/api-server/src/routes/nexus.ts` — shared control-plane data, orchestration, code-execution history
- `artifacts/api-server/src/routes/billing.ts` — Stripe ownership binding
- `artifacts/api-server/src/routes/streaming-ingestion.ts` — public feeds and ingestion endpoints
- `artifacts/api-server/src/routes/sentra.ts` / `sentra-siem.ts` — public mutation paths into security data
- `artifacts/api-server/src/routes/risk-evidence.ts` — public shared-state evidence persistence
- `artifacts/api-server/src/routes/agent-mesh.ts` + `services/agent-mesh-collector.ts` — public telemetry inventory and scan behavior

---

## Current Findings and Residual Risks

| Gap ID | Description | Severity | Status |
|---|---|---|---|
| AF-008 | Continuum chat cross-tenant persistence gap | High | ✅ Resolved and re-verified 2026-05-16. `continuum-chat.ts` now documents tenant isolation and enforces org binding. |
| AF-016 | GraphQL WebSocket subscriptions authenticate the socket but do not enforce tenant/role filtering on many subscription resolvers | High | Open — confirmed 2026-05-16 |
| AF-018 | Billing mutation routes trust caller-supplied global Stripe subscription/subscription-item IDs without proving ownership | High | Open — confirmed 2026-05-16 |
| AF-020 | NEXUS shared stores remain platform-global and readable to any authenticated user | High | Open — confirmed 2026-05-16 |
| AF-021 | NEXUS code-execution history uses wrong identity fields and fails tenant binding on read/write paths | High | Open — confirmed 2026-05-16 |
| AF-022 | MCP governance/control-plane routes lack privileged-role enforcement, and raw MCP transport bypasses governed approval for ordinary tenant users | High | Open — confirmed/refined 2026-05-16 |
| AF-024 | Public shared-state surfaces allow anonymous evidence tampering (`/api/risk-evidence/*`) | High | Open — confirmed 2026-05-16 |
| AF-025 | Public write/ingestion surfaces allow unauthenticated mutation of security or telemetry state (`/api/sentra/*`, `/api/stream/ais-nmea`) | High / Medium | Open — confirmed 2026-05-16 |
| AF-026 | Public agent-mesh state/index/scan routes expose internal AI tooling inventory and allow anonymous server-side config scanning | High | Open — confirmed 2026-05-16 |
| AF-027 | Environment registry accessible to any authenticated user | Medium | ✅ Resolved and re-verified 2026-05-16. Production route now requires ops/super_admin or scoped internal token. |
| AF-029 | Public SSE feeds expose live SIEM/AIS/market telemetry, including replay of buffered events, with `Access-Control-Allow-Origin: *` | High | Open — confirmed 2026-05-16 |

---

## Verified Fixes / Stale Assumptions Removed

The following older assumptions are now stale and should not be re-proposed without new evidence:

- `continuum-chat` is no longer treated as an open cross-tenant persistence issue; the route file now explicitly states AF-008 is resolved and the handlers use tenant-bound `org_id` reads/writes.
- `/api/env-registry` is no longer treated as baseline-auth-only in production; it now requires either a scoped internal token or `ops` / `super_admin` role.
- The previous GraphQL WS issue should no longer be described as “anonymous subscriptions accepted.” The current confirmed issue is narrower and more accurate: authenticated sockets are accepted, but downstream subscription authorization is missing or ineffective.

---

## Threat Priorities for the Next Scan

1. **Control-plane authorization:** MCP, NEXUS, agent-mesh, internal registries
2. **Cross-tenant disclosure/tampering:** Stripe object binding, shared stores, execution history, live subscriptions
3. **Public mutation and ingestion:** Sentra, risk evidence, AIS/NMEA, other allowlisted public write paths
4. **Realtime transport leakage:** GraphQL WS, SSE, any cross-origin or replay-capable stream
5. **Confused deputy / internal token use:** Any route that lets an ordinary user trigger internal-token-backed fetches or tool calls

---

*Threat model refreshed on 2026-05-16 after a production-focused security scan. Refresh again after changes to route mounting, allowlists, auth middleware, MCP/NEXUS design, or realtime transport behavior.*
