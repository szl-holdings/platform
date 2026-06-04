# Threat Model

**Platform:** SZL Holdings Governed Decision Infrastructure  
**Last updated:** 2026-04-25  
**Scope:** Platform-level threat analysis covering all active artifacts, the API server, and supporting infrastructure. Customer-integration-specific threat modeling is out of scope.

---

## Production Scope Assumptions

These assumptions are authoritative for this scan and future production-focused scans unless the deployment model changes:

- `mockup-sandbox` is never deployed to production.
- In production, `NODE_ENV === 'production'`.
- Replit / platform-managed TLS is assumed for browser↔server transport; certificate lifecycle is handled by the platform.
- Demo-only UI leads are not reportable unless a production server route or production runtime path makes them reachable.

---

## Project Overview

SZL Holdings is a governed decision infrastructure platform delivered as a multi-tenant TypeScript/Node.js SaaS. It spans six domain packs — maritime intelligence (Vessels), cyber resilience (Sentra/Aegis), real estate intelligence (Terra), legal matter management (PRISM Counsel / Counsel), advisory/decision operations (Lyte, Command), and corporate intelligence (SZL Holdings Dashboard, Pulse) — plus a mobile CORTEX application (Expo/React Native).

**Tech stack:**
- Frontend: React 19, Vite, TanStack Query, Wouter, Tailwind CSS v4, Framer Motion
- Backend: Express 5, Drizzle ORM, Zod, Pino, PostgreSQL 16
- Auth: OIDC/PKCE, server-side PostgreSQL sessions, 11-role RBAC, SCIM 2.0
- AI: Multi-provider (OpenAI, Anthropic, Gemini, HuggingFace) gated by Covenant Policy
- Real-time: WebSocket (HMAC-signed tickets), SSE
- Hosting: Replit (development), Azure (production)
- Monorepo: pnpm, Turborepo, TypeScript project references

**Users:** Enterprise operators, analysts, executive viewers, maritime ops, sales/delivery, and pilot customers across a shared PostgreSQL database. Most tenant-owned data is intended to be isolated via `org_id` scoping, but several legacy/shared tables and public demo-style surfaces exist and must be reviewed explicitly rather than assumed safe.

**Production scan assumptions:**
- `NODE_ENV === "production"` for all findings proposed in this scan.
- Mockup sandbox and other demo-only sandbox surfaces are out of scope unless production reachability is demonstrated.
- `lib/shared-ui/src/PrivateAppGuard.tsx` is currently treated as non-production because the corresponding `/api/pulse/demo/*` bypasses are disabled in production.

---

## Actors

| Actor | Trust Level | Description |
|-------|------------|-------------|
| **Authenticated platform user** | Low-Medium | Enterprise employees using web or mobile surfaces. Trust is bounded by their assigned role in the 11-role RBAC hierarchy. They must not be able to access other tenants or platform-global operator surfaces unless explicitly authorized. |
| **Tenant admin / org admin** | Medium | Manages users, roles, and settings within their own org. Cannot access other tenants. Cannot grant `super_admin`. |
| **Platform super_admin / ops user** | High | SZL Holdings staff with cross-tenant administrative capability. Access should be minimized and auditable. |
| **Continuum AI execution engine** | Medium-High | Internal service calling privileged API endpoints with `CONTINUUM_INTERNAL_TOKEN`. Advisory-only — cannot execute consequential actions without human approval via Covenant Policy. |
| **External AI providers** | External | OpenAI, Anthropic, Gemini, HuggingFace — receive prompt data and return inference results. Operate under no-training-on-customer-data terms. |
| **Third-party connectors** | External | OAuth-connected customer systems (maritime data feeds, Mapbox, Stripe, etc.). Credentials are stored encrypted and used through connector adapters. |
| **Webhook source** | Untrusted | External systems posting events to inbound webhook endpoints. Every production webhook must be authenticated with a provider signature or equivalent shared secret before mutation/persistence. |
| **Unauthenticated browser/bot** | Untrusted | Public internet traffic. In practice this can reach more than health/static assets: explicit allowlisted `/api/*` routes, selected demo/public routes, webhook endpoints, and the `/mcp/*` proxy all form production-reachable anonymous surfaces and must be treated as hostile entry points. |
| **CI/CD pipeline** | Trusted (build-time) | GitHub Actions runner with repository access. Cannot access production secrets or the production database. |

---

## Data Flows

```text
[Browser / Mobile App]
        │  HTTPS / TLS 1.3
        ▼
[WAF / Reverse Proxy]
        │
        ▼
[Express API Server — artifacts/api-server]
    ├── Non-public /api/* routes
    │       ├── session auth / role checks
    │       ├── tenantScope (where tenant data is involved)
    │       └── DB / object storage / internal services
    │
    ├── Explicit public surfaces
    │       ├── selected allowlisted /api/* endpoints (webhooks, demo/public routes)
    │       ├── /api/csrf-token
    │       └── /api/agent-mesh/*
    │
    ├── /mcp/* raw reverse proxy
    │       ▼
    │   [substrate-mcp-gateway sidecar]
    │
    ├── Internal service endpoints
    │       └── `CONTINUUM_INTERNAL_TOKEN` / internal token auth
    │
    ├── PostgreSQL 16
    ├── Object storage
    └── Outbound third-party / AI provider calls
```

**Key data flow security invariants:**
- Most browser → API flows cross `globalAuthEnforcer`, but standalone and pre-auth-mounted surfaces require separate review (`/api/graphql/ws`, `/mcp/*`).
- Tenant isolation depends on correct route-group use of `tenantScope` plus per-record/org ownership checks; it is not universal across all route families.
- Object storage flows are private by default and tracked-file serving is scan-status gated; the older blanket “no virus scanning” assumption is stale.
- Internal service flows require `CONTINUUM_INTERNAL_TOKEN` or a narrow loopback trust condition; any bypass that synthesizes elevated identity is a high-risk boundary.
- Global third-party objects (Stripe customers/sessions, webhook destinations, RMM connector endpoints) must be explicitly bound or validated before server-side use.
- Every **non-public** browser/mobile flow must cross server-side authentication before it reaches business logic.
- Tenant-owned data flows must enforce `tenantScope` and/or equivalent `org_id` ownership checks at the server and query level.
- Public/allowlisted routes are exceptions, not proofs of safety; they require dedicated authentication, integrity, and rate-limit review.

---

## Assets

| Asset | Why it matters |
|---|---|
| **Session tokens and OIDC credentials** | Compromise allows impersonation of any user. OIDC is the sole auth mechanism. |
| **Tenant operational data** | Fleet positions, decision records, deal scenarios, legal matters, and AI agent outputs are confidential business data. Cross-tenant leakage is a severe trust and liability failure. |
| **AI agent outputs and Proof Chain entries** | The Proof Chain is the platform’s governance artifact. Tampering corrupts the evidence basis for consequential business decisions. |
| **Connector credentials** | OAuth tokens and API keys for third-party integrations are field-encrypted with `CONNECTOR_ENCRYPTION_KEY`. Leakage enables unauthorized access to connected systems. |
| **Internal service tokens** | `CONTINUUM_INTERNAL_TOKEN` and similar internal secrets gate privileged service-to-service flows. Leakage can bypass normal auth. |
| **Session signing key (`SESSION_SECRET`)** | Compromise allows forged session cookies. |
| **Database connection string** | Leakage gives direct full-database access, bypassing application-level scoping. |
| **Uploaded documents and files** | Object-stored documents are private by default; exposure is a confidentiality failure. |
| **PII** | User email addresses and profile data are regulated and sensitive. |
| **Operator/control-plane configuration** | MCP gateway policy, environment registry state, telemetry, and workflow inventory expose sensitive internal posture and operations. |

---

## Trust Boundaries

| Boundary | What it separates |
|---|---|
| **Browser / Mobile → API** | All client requests cross this boundary over TLS. The client is fully untrusted. Server-side authz must not rely on frontend routing or UI gating. |
| **Anonymous → Authenticated** | Public routes versus authenticated API routes. This boundary is enforced partly by `global-auth-enforcer.ts`, but explicit allowlists and `/mcp/*` bypasses mean the boundary must be reviewed route-by-route. |
| **Authenticated → Privileged roles** | `requireRole`/equivalent checks separate ordinary users from operator/admin/control-plane capability. Authenticating a session is not enough for platform-global surfaces. |
| **Tenant A → Tenant B** | Multi-tenant isolation via `org_id` and ownership checks. Missing `org_id` columns or filters create cross-tenant disclosure and tampering paths. |
| **API → PostgreSQL** | The API server is the only intended query issuer. Injection or credential leakage gives broad database access. |
| **API → Internal sidecars / MCP gateway** | `/mcp/*` and `/api/mcp-gateway/*` bridge into control-plane services and shared telemetry. They require stronger-than-basic-user authorization. |
| **API → External AI providers** | The server calls external model providers with paid API keys. SSRF or key leakage can trigger arbitrary billable inference or data exfiltration. |
| **API → Object Storage** | Signed URLs and private ACLs are required to keep uploaded files private. |
| **API → Third-party connectors** | OAuth tokens and API keys are stored encrypted and used to call customer-connected systems. |
| **Webhook inbound** | External services post events into the API. Forged or unauthenticated webhooks can mutate stored state or suppress user communications. |

---

## Scan Anchors

**Primary production entry points:**
- `artifacts/api-server/src/app.ts` — Express app setup, middleware chain, route mounting, `/mcp` proxy, `/api/env-registry`
- `artifacts/api-server/src/routes/index.ts` — aggregate route mounting, public/demo route exposure
- `artifacts/api-server/src/middlewares/global-auth-enforcer.ts` — deny-by-default `/api/*` gate plus public allowlist
- `artifacts/api-server/src/middlewares/auth.ts` — session auth, role checks, internal token verification
- `artifacts/api-server/src/middlewares/tenant-scope.ts` — tenant isolation enforcement

**Highest-risk code areas:**
- `artifacts/api-server/src/routes/continuum-governance.ts` — AI policy mutation
- `artifacts/api-server/src/routes/admin/` — Super-admin operations, impersonation
- `artifacts/api-server/src/graphql/` — GraphQL HTTP/WS auth boundaries and directive-backed RBAC
- `artifacts/api-server/src/routes/mcp.ts` — Agent Gateway tool calls (per-tool RBAC)
- `artifacts/api-server/src/routes/mcp-gateway.ts` and `services/substrate-mcp-gateway/` — MCP governance plane, sidecar auth, SSE/discovery exposure
- `artifacts/api-server/src/routes/nexus.ts` — Shared AI control plane and loopback orchestration
- `artifacts/api-server/src/routes/continuum-chat.ts` — Tenantless persistence and cross-tenant chat/KB access
- `artifacts/api-server/src/routes/fund-inbound-deals.ts` — Internal pipeline records and attachments exposed under baseline auth
- `artifacts/api-server/src/routes/billing.ts` — Stripe object ownership verification
- `artifacts/api-server/src/routes/vessels.ts` — Tenant isolation enforced via `tenantScope()` + `org_id` filters (AF-003, AF-007 resolved Apr-2026, Task #1048)
- `artifacts/api-server/src/lib/ai-engine/src/retrieval/continuum-retrieval.ts` — Retrieval engine tenant filtering
- `artifacts/api-server/src/routes/documents.ts` — File upload and object storage ACL
- `artifacts/api-server/src/routes/email-webhooks.ts` — inbound email trust boundary, public mutation routes
- `artifacts/api-server/src/routes/streaming-ingestion.ts` — public SIEM ingestion
- `artifacts/api-server/src/routes/agent-mesh.ts` — public gateway telemetry/export surface
- `artifacts/api-server/src/routes/action-store.ts` and `artifacts/api-server/src/routes/carlota-time-tracking.ts` — public persistent shared-state mutation

**Public vs authenticated vs admin surfaces:**
- Public intended surfaces: `/health`, `/api/health`, static frontend bundles, and the explicit allowlisted demo/marketing/webhook/discovery routes in `global-auth-enforcer.ts`, `/api/csrf-token`, `/api/agent-mesh/*`, and `/mcp/*`
- Authenticated-by-default surfaces: most `/api/*` routes after `globalAuthEnforcer`
- High-risk special surfaces requiring separate review: `/api/graphql/ws` (standalone WebSocket server outside Express middleware) and `/mcp/*` (sidecar proxy mounted before API auth/CSRF)
- Admin-only intended surfaces: `/api/admin/*`, `/api/scim/v2/*`, backup export endpoint, and selected governance/control-plane mutations
- Internal service surfaces: endpoints protected by `checkInternalToken` or the narrow `nexus_loopback` bypass

**Dev-only or out-of-scope areas unless production reachability is demonstrated:**
- `mockup-sandbox/`
- `scripts/`, `packages/*/src/__tests__/`, `vitest.*.config.ts`, `.github/`
- Expo dev-client specifics in `artifacts/szl-holdings-mobile/` as a web attack surface
- Demo PIN storage or other shared-ui demo affordances unless a production route makes them effective in production

---

## Threat Categories

### Spoofing

The platform uses OIDC/PKCE exclusively; no passwords are stored. Session cookies are HttpOnly, Secure, and SameSite=Lax. Internal service calls use separate bearer tokens or headers.

**Guarantees required:**
- All protected routes must verify a valid session before processing requests.
- Internal service tokens must be verified with timing-safe comparison through canonical shared helpers.
- Public webhook endpoints must verify provider authenticity before accepting mutations.
- Session cookies must never be accepted over non-HTTPS production transport.

### Tampering

Business logic is intended to be computed server-side. Proof Chain entries are append-only. Public write surfaces are especially sensitive because they bypass the normal session boundary.

**Guarantees required:**
- Input validation must cover every write route parameter, query string, and body field.
- Persistent shared-state routes must not be anonymously writable in production unless the state is explicitly non-sensitive and isolated from real business data.
- Proof Chain entries must not be mutable after creation.
- AI agent recommendations must pass through Covenant Policy before downstream actions trigger.

### Repudiation

Privileged mutations should generate auditable records including actor identity, role context, and timestamp.

**Guarantees required:**
- All privileged mutations (role changes, policy changes, impersonation, control-plane configuration) must write immutable audit events.
- Audit log rows must not be deletable by application roles.
- AI trace records must include model identity and version.

### Information Disclosure

Multi-tenant isolation is the most critical information disclosure surface. Four intended enforcement layers exist: `org_id` in every DB query, Drizzle ORM scoping, `tenantScope` middleware at the route level, and channel/stream filtering for live transports. The previously open Vessels gap (AF-003, AF-007) was closed Apr-2026 (Task #1048) — `routes/vessels.ts` now applies `tenantScope()` + `org_id` filters and migration `0076_vessels_org_id.sql` adds the column at the DB level. The backup export authority issue (AF-004) also appears fixed in `routes/backup.ts`. Current disclosure hotspots are route families that omit tenant scope or bind global platform objects to an authenticated caller without proving ownership (`continuum-chat`, billing, NEXUS, inbound deals, GraphQL subscriptions). Operational control-plane inventory and telemetry are also sensitive because they reveal internal architecture, secrets posture, and live workflows.

**Guarantees required:**
- Every database query that returns tenant-owned data MUST include a `WHERE org_id = ?` clause. The Drizzle ORM layer MUST enforce this; raw SQL bypasses are prohibited.
- API error responses MUST NOT include stack traces, database error details, or internal file paths in production (`NODE_ENV === 'production'`).
- Connector credentials MUST be returned from the API only as masked values (e.g., `***`). Full plaintext credentials MUST NOT appear in API responses.
- PII (email, user profiles) MUST NOT appear in application logs. Pino structured logging is enforced across all production paths.
- IP addresses MUST be hashed before storage (`hashIp()` in `lib/audit/src/ip-hash.ts`). Raw IPs MUST NOT be persisted.
- The backup export endpoint MUST verify that the requesting admin has authority over the requested `orgId` (AF-004 verified fixed in this scan; preserve this invariant).
- Billing routes that accept Stripe identifiers (`customerId`, `sessionId`, email lookup) MUST bind returned objects to the caller's org before disclosure or mutation.
- Long-lived event streams (GraphQL WS, MCP SSE) MUST authenticate clients and filter events by tenant and role before subscribing.
- Shared AI control-plane stores (NEXUS memory/skills/tools/orchestrations) MUST persist creator or tenant ownership and enforce it on every read/write path.
- Tables storing tenant conversations, messages, or user-generated content must carry sufficient ownership fields to enforce that constraint.

### Denial of Service

Write-heavy, AI, and export paths can amplify compute or queue load. Public routes increase abuse potential if not throttled.

**Guarantees required:**
- AI inference endpoints must have per-user or per-tenant rate limits.
- File upload endpoints must enforce server-side size limits.
- Any endpoint triggering resource-intensive operations must be authenticated or strongly rate-limited and integrity-protected.
- External HTTP calls must have explicit timeouts.

### Elevation of Privilege

RBAC is intended to protect admin, operator, and cross-tenant functions. In practice, platform-global control-plane routes need explicit role checks beyond the presence of an authenticated session.

**Guarantees required:**
- Role assignment MUST require at least `operator` role for standard changes and `super_admin` for cross-tenant or platform-level changes.
- Session invalidation MUST occur on role change. `revokeUserSessionsOnRoleChange()` is implemented (AF-010 resolved); it MUST be called on every role modification path including SCIM group changes.
- Internal token verification MUST use a single, canonical `checkInternalToken()` function across all middlewares (AF-013: currently duplicated with divergent patterns — P2 open gap).
- GraphQL role directives MUST be backed by actual resolver wrapping or equivalent runtime enforcement; SDL annotations alone are not a control.
- The MCP Agent Gateway MUST enforce per-tool RBAC checks before invoking any external tool, regardless of the initiating agent's role context.
- NEXUS and MCP governance/control-plane routes MUST require explicit privileged roles and tenant or ownership binding; baseline authenticated sessions are insufficient.
- There MUST be no ORM-bypass paths that allow cross-tenant queries without explicit org scoping (AF-014: no ORM-layer guard — P2 open gap).
- Platform-global configuration, telemetry, and control-plane routes must require explicit privileged roles or internal tokens.

---

## Residual Risk Summary

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| AF-001 | `adminGuard` uses non-timing-safe token comparison | P1 | ✅ Resolved Apr-2026 (Task #2693) |
| AF-003 / AF-007 | Vessels routes and DB tables lack tenant scoping | P1 | ✅ Resolved Apr-2026 (Task #1048) |
| AF-004 | Backup export accepts arbitrary `orgId` without authority check | P2 | ✅ Resolved Apr-2026 (verified 2026-04-25) |
| AF-008 | `conversations` / ContinuumChat persistence lacks `org_id` and is exposed via `/api/continuum-chat/*` | P1 | Open — expanded Apr-2026 |
| AF-012 | Sessions not invalidated on `SESSION_SECRET` rotation | P2 | Open |
| AF-013 | Internal token verification duplicated with divergent patterns | P2 | Open |
| AF-014 | No ORM-layer cross-tenant query guard | P2 | Open |
| AF-015 | GraphQL role directives are declared but never enforced at runtime | P1 | Open |
| AF-016 | GraphQL WebSocket subscriptions accept anonymous clients | P1 | Open |
| AF-017 | Inbound deal records and attachments are readable/writable by any authenticated user | P1 | Open |
| AF-018 | Billing routes trust arbitrary global Stripe identifiers without org ownership checks | P1 | Open |
| AF-019 | RMM connector `baseUrl` is used in server-side fetches without SSRF validation | P2 | Open |
| AF-020 | NEXUS shared control-plane stores have no tenant/owner/role scoping | P1 | Open |
| AF-021 | NEXUS loopback orchestration bypass acts as a confused deputy into protected APIs | P1 | Open |
| AF-022 | MCP gateway governance and proxy routes are reachable to any authenticated user | P1 | Open |
| AF-023 | Substrate MCP sidecar GET auth bypass exposes `/mcp/sse` and discovery endpoints | P2 | Open |
| AF-024 | Public allowlisted demo/shared-state routes mutate persistent production data | P2 | Open — confirmed Apr-2026 |
| AF-025 | Public webhook / ingestion routes accept forged or unauthenticated events | P1 | Open — confirmed Apr-2026 |
| AF-026 | MCP surfaces expose anonymous telemetry/discovery and lack operator-only authz on shared policy endpoints | P1 | Open — confirmed Apr-2026 |
| AF-027 | Operational environment registry accessible to any authenticated user | P2 | Open — confirmed Apr-2026 |
| KG009 | OTEL exporter not wired for production | P1 | Open |
| KG020b | Direct webhook SSRF validation exists, but DNS-rebinding TOCTOU remains in delivery | P2 | Open (refined 2026-04-25) |
| KG020c | No virus scanning on uploaded files | P2 | ✅ Resolved Apr-2026 (verified 2026-04-25) |
| KG020d | No field-level encryption for PII columns | P2 | Open |
| KG026 | Platform-native MFA not implemented | P1 | Formally accepted — IdP-level MFA is current control |

See `KNOWN-GAPS.md` and `AUDIT_FINDINGS_REGISTER.md` for broader remediation planning where those registers remain current.

---

*Threat model refreshed 2026-04-25 after production-scope security scan. Review again before major route/middleware restructuring or exposure of new public/control-plane surfaces.*
