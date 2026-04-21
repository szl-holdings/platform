# Threat Model

**Platform:** SZL Holdings Governed Decision Infrastructure  
**Last updated:** 2026-04-20  
**Scope:** Platform-level threat analysis covering all active artifacts, the API server, and supporting infrastructure. Customer-integration-specific threat modeling is out of scope.

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

**Users:** Enterprise operators, analysts, executive viewers, maritime ops, sales/delivery, and pilot customers across a shared multi-tenant PostgreSQL database. All tenants are logically isolated via `org_id` scoping.

---

## Actors

| Actor | Trust Level | Description |
|-------|------------|-------------|
| **Authenticated platform user** | Low-Medium | Enterprise employees using any web or mobile surface. Trust is bounded by their assigned role in the 11-role RBAC hierarchy. Can only access their own tenant's data. |
| **Tenant admin / org admin** | Medium | Manages users, roles, and settings within their own org. Cannot access other tenants. Cannot grant super_admin. |
| **Platform super_admin** | High | SZL Holdings staff with cross-tenant administrative capability. All actions are logged in the immutable audit trail. Number should be minimized. |
| **Alloy AI execution engine** | Medium-High | Internal service calling privileged API endpoints with `ALLOY_INTERNAL_TOKEN`. Advisory-only — cannot execute consequential actions without human approval via Covenant Policy. |
| **External AI providers** | External | OpenAI, Anthropic, Gemini, HuggingFace — receive prompt data and return inference results. Operate under no-training-on-customer-data terms. |
| **Third-party connectors** | External | OAuth-connected customer systems (maritime data feeds, Mapbox, Stripe, etc.). Credentials stored encrypted; called via connector adapters. |
| **Webhook source** | Untrusted | External systems posting events to inbound webhook endpoints. Must be signature-verified before processing. |
| **Unauthenticated browser/bot** | Untrusted | Public internet traffic. Only health endpoints and static assets are accessible. All other routes deny without auth. |
| **CI/CD pipeline** | Trusted (build-time) | GitHub Actions runner with repository access. Cannot access production secrets or the production database. |

---

## Data Flows

```
[Browser / Mobile App]
        │  HTTPS / TLS 1.3
        ▼
[Replit / Azure WAF + mTLS Proxy]
        │
        ▼
[Express API Server — artifacts/api-server]
    ├── requireAuth + requireRole middleware
    ├── tenantScope middleware (org_id filter)
    │
    ├── POST /api/ai-engine/*, /api/alloy/*
    │       │  Internal bearer token (ALLOY_INTERNAL_TOKEN)
    │       ▼
    │   [Alloy Execution Engine — lib/ai-engine]
    │       │  HTTPS + API key
    │       ▼
    │   [External AI providers: OpenAI / Anthropic / Gemini / HuggingFace]
    │
    ├── SELECT/INSERT/UPDATE (Drizzle ORM, parameterized, org_id scoped)
    │       ▼
    │   [PostgreSQL 16 — encrypted at rest]
    │
    ├── PUT/GET object storage
    │       ▼
    │   [GCS / Azure Blob — private ACL, signed URLs]
    │
    ├── POST /api/webhooks/* (inbound)
    │   [Signature verification required before processing]
    │
    └── Outbound: connector adapters → [Third-party APIs]
                  geocoding → [Mapbox / Google — allowlist enforced]

[WebSocket connections]
    └── HMAC-signed ticket (5 min TTL) → API server → per-org channel
```

**Key data flow security invariants:**
- Every flow from browser → API crosses `requireAuth` + `tenantScope` middleware
- Database flows always carry `org_id`; Drizzle ORM prevents raw SQL interpolation
- AI provider flows never carry raw customer PII in prompts (contract obligation)
- Object storage flows use signed URLs with expiry; no public ACL permitted
- Internal service flows require `ALLOY_INTERNAL_TOKEN`; verified with `crypto.timingSafeEqual` on HMAC digests across both `auth.ts::checkInternalToken` and `admin-guard.ts` (AF-001 resolved Apr-2026, Task #2693)

---

## Assets

| Asset | Why it matters |
|---|---|
| **Session tokens and OIDC credentials** | Compromise allows complete impersonation of any user. No passwords are stored — OIDC is the sole auth mechanism. |
| **Tenant operational data** | Each tenant's fleet positions, decision records, deal scenarios, legal matters, and AI agent outputs are confidential business data. Cross-tenant leakage would be a severe trust and liability failure. |
| **AI agent outputs and Proof Chain entries** | The Proof Chain is the platform's core governance artifact. Tampering would corrupt the evidence basis for consequential business decisions. |
| **Connector credentials** | OAuth tokens and API keys for third-party integrations are field-encrypted with `CONNECTOR_ENCRYPTION_KEY`. Leakage enables unauthorized access to connected systems. |
| **Internal service token (`ALLOY_INTERNAL_TOKEN`)** | Used by the Alloy AI execution engine to call privileged internal endpoints. Leakage allows bypassing normal auth. |
| **Session signing key (`SESSION_SECRET`)** | Compromise allows forging session cookies for any user. |
| **Database connection string** | Leakage gives direct full-database access bypassing application-level tenant scoping. |
| **Uploaded documents and files** | Object-stored documents are private by default; exposure is a confidentiality failure. |
| **PII** | User email addresses and profile data are subject to GDPR obligations. |
| **AI model routing configuration** | The platform's multi-provider AI fallback chain is commercially sensitive. |

---

## Trust Boundaries

| Boundary | What it separates |
|---|---|
| **Browser / Mobile → API** | All client requests cross this boundary over TLS. The API must authenticate and authorize every non-public request. The client is fully untrusted. |
| **API → PostgreSQL** | The API server is the only authorized query issuer. SQL injection or credential leakage at the API layer gives full database access. |
| **API → External AI providers** | The server calls OpenAI, Anthropic, Gemini, and HuggingFace with provider API keys. SSRF or key leakage would allow arbitrary inference calls billed to the platform. |
| **API → Object Storage** | GCS/Azure Blob stores uploaded files. Signed URLs grant time-limited access. Incorrect ACL configuration could expose private documents. |
| **API → Third-party connectors** | OAuth tokens and API keys are stored encrypted in the database and used to call customer-integrated systems (Stripe, mapping providers, maritime data feeds). |
| **Anonymous → Authenticated** | Public routes (health, static assets) vs. authenticated API routes. The boundary must be enforced server-side; `requireAuth` middleware is the enforcement point. |
| **Authenticated → Privileged roles** | `requireRole` checks separate analyst/viewer access from operator/admin access. Frontend enforcement alone is insufficient. |
| **Tenant A → Tenant B** | Multi-tenant isolation via `org_id` in every DB query. A missing `org_id` filter in any query creates a cross-tenant data leak. |
| **API → Alloy internal endpoints** | The Alloy AI execution engine calls privileged internal routes using `ALLOY_INTERNAL_TOKEN`. This is a service-to-service boundary that must remain internal-only. |
| **Webhook inbound** | External services post webhooks to the API. Without HMAC signature verification, a forged webhook can trigger privileged operations. |

---

## Scan Anchors

**Production entry points:**
- `artifacts/api-server/src/app.ts` — Express app setup, middleware chain, route mounting
- `artifacts/api-server/src/routes/` — All domain route files (2,816+ endpoints)
- `artifacts/api-server/src/middlewares/auth.ts` — `requireAuth`, `requireRole`, `checkInternalToken`
- `artifacts/api-server/src/middlewares/tenant-scope.ts` — Tenant isolation enforcement

**Highest-risk code areas:**
- `artifacts/api-server/src/routes/alloy-governance.ts` — AI policy mutation
- `artifacts/api-server/src/routes/admin/` — Super-admin operations, impersonation
- `artifacts/api-server/src/routes/mcp.ts` — Agent Gateway tool calls (per-tool RBAC)
- `artifacts/api-server/src/routes/vessels.ts` — Tenant isolation enforced via `tenantScope()` + `org_id` filters (AF-003, AF-007 resolved Apr-2026, Task #1048)
- `artifacts/api-server/src/lib/ai-engine/src/retrieval/alloy-retrieval.ts` — Retrieval engine tenant filtering
- `artifacts/api-server/src/routes/documents.ts` — File upload and object storage ACL

**Public vs authenticated vs admin surfaces:**
- Public: `/health`, `/api/health`, static frontend bundles
- Authenticated: all `/api/*` routes except health
- Admin-only: `/api/admin/*`, `/api/scim/v2/*`, backup export endpoint
- Internal service: endpoints protected by `checkInternalToken` (X-Alloy-Token header)

**Dev-only areas (ignore in production scan):**
- `scripts/`, `packages/*/src/__tests__/`, `vitest.*.config.ts`, `.github/`
- Expo dev client (`artifacts/szl-holdings-mobile/`) — native-only, not a web attack surface

---

## Threat Categories

### Spoofing

The platform uses OIDC/PKCE exclusively; no passwords are stored. Session cookies are HttpOnly, Secure (unconditional), SameSite=Lax. WebSocket connections use HMAC-signed tickets with 5-minute TTL. Internal Alloy service calls use a separate token (`ALLOY_INTERNAL_TOKEN`) verified with timing-safe comparison in `auth.ts`.

**Guarantees required:**
- All protected routes MUST verify a valid session before processing any request.
- `ALLOY_INTERNAL_TOKEN` MUST be verified with `crypto.timingSafeEqual` on all internal endpoints. Both `auth.ts::checkInternalToken` and `admin-guard.ts` route through `verifyInternalHeader()` in `lib/internal-tokens.ts`, which compares HMAC-SHA256 digests with `timingSafeEqual` (AF-001 resolved Apr-2026, Task #2693).
- Webhook endpoints that receive inbound events from external services MUST verify HMAC signatures.
- Session cookies MUST NOT be transmitted over non-HTTPS connections. The `secure: true` flag is unconditional.

### Tampering

All write routes accept Zod-validated request bodies via `validateBody`. Business logic (pricing, policy verdicts, Proof Chain entries) is computed server-side. The Proof Chain is immutable by design — entries are append-only.

**Guarantees required:**
- Input validation (Zod schemas) MUST cover every write route parameter, query string, and body field.
- Proof Chain entries MUST NOT be mutable after creation. Any update to a governed decision MUST create a new entry rather than modify an existing one.
- File upload metadata (MIME type, size) MUST be validated server-side; client-supplied metadata cannot be trusted.
- AI agent recommendations MUST pass through the Covenant Policy engine before any downstream action is triggered. The policy layer is at the workflow level, not the UI level.

### Repudiation

Every significant mutation generates an audit event in the `audit_log` table, recording actor identity, role context, `org_id`, and timestamp. AI recommendations are recorded in the Proof Chain with model identity and confidence score. Admin impersonation has explicit start/end audit log entries.

**Guarantees required:**
- All privileged mutations (role changes, policy changes, AI-triggered actions, impersonation) MUST write an immutable audit row.
- Audit log rows MUST NOT be deletable by any application role. Physical deletion must require out-of-band database access.
- AI trace records MUST include model identity and version so outputs can be attributed to a specific model snapshot.

### Information Disclosure

Multi-tenant isolation is the most critical information disclosure surface. Four enforcement layers exist: `org_id` in every DB query, Drizzle ORM scoping, `tenantScope` middleware at the route level, and WebSocket channel prefixing. The previously open Vessels gap (AF-003, AF-007) was closed Apr-2026 (Task #1048) — `routes/vessels.ts` now applies `tenantScope()` + `org_id` filters and migration `0076_vessels_org_id.sql` adds the column at the DB level.

**Guarantees required:**
- Every database query that returns tenant-owned data MUST include a `WHERE org_id = ?` clause. The Drizzle ORM layer MUST enforce this; raw SQL bypasses are prohibited.
- API error responses MUST NOT include stack traces, database error details, or internal file paths in production (`NODE_ENV === 'production'`).
- Connector credentials MUST be returned from the API only as masked values (e.g., `***`). Full plaintext credentials MUST NOT appear in API responses.
- PII (email, user profiles) MUST NOT appear in application logs. Pino structured logging is enforced across all production paths.
- IP addresses MUST be hashed before storage (`hashIp()` in `lib/audit/src/ip-hash.ts`). Raw IPs MUST NOT be persisted.
- The backup export endpoint MUST verify that the requesting admin has authority over the requested `orgId` (AF-004 is an open P2 gap).

### Denial of Service

Rate limiting via `express-rate-limit` is applied to write-heavy and AI endpoints. File uploads are limited to 100 MB via Zod schema validation. AI provider calls have timeout configurations.

**Guarantees required:**
- AI inference endpoints MUST have per-tenant and per-user rate limits enforced at the API layer, not just the AI provider layer.
- File upload endpoints MUST enforce size limits server-side (not just via Zod schema on metadata).
- Any endpoint triggering a resource-intensive operation (embedding, ML inference, large export) MUST be authenticated.
- External HTTP calls (to AI providers, geocoding, webhooks) MUST have explicit timeout values to prevent connection pool exhaustion.

### Elevation of Privilege

RBAC is enforced by `requireRole` middleware on all admin, operator, and executive routes. The 11-role hierarchy is deny-by-default. Super-admin cannot be granted via the UI.

**Guarantees required:**
- Role assignment MUST require at least `operator` role for standard changes and `super_admin` for cross-tenant or platform-level changes.
- Session invalidation MUST occur on role change. `revokeUserSessionsOnRoleChange()` is implemented (AF-010 resolved); it MUST be called on every role modification path including SCIM group changes.
- Internal token verification MUST use a single, canonical `checkInternalToken()` function across all middlewares (AF-013: currently duplicated with divergent patterns — P2 open gap).
- The MCP Agent Gateway MUST enforce per-tool RBAC checks before invoking any external tool, regardless of the initiating agent's role context.
- There MUST be no ORM-bypass paths that allow cross-tenant queries without explicit org scoping (AF-014: no ORM-layer guard — P2 open gap).

---

## Residual Risk Summary

| Gap ID | Description | Severity | Status |
|--------|-------------|----------|--------|
| AF-001 | `adminGuard` uses non-timing-safe token comparison | P1 | ✅ Resolved Apr-2026 (Task #2693) |
| AF-003 / AF-007 | Vessels routes and DB tables lack tenant scoping | P1 | ✅ Resolved Apr-2026 (Task #1048) |
| AF-004 | Backup export accepts arbitrary `orgId` without authority check | P2 | Open |
| AF-008 | `conversations` table missing `org_id` | P2 | Open |
| AF-012 | Sessions not invalidated on `SESSION_SECRET` rotation | P2 | Open |
| AF-013 | Internal token verification duplicated with divergent patterns | P2 | Open |
| AF-014 | No ORM-layer cross-tenant query guard | P2 | Open |
| KG009 | OTEL exporter not wired for production | P1 | Open |
| KG020b | Webhook delivery URL SSRF validation absent | P1 | Open |
| KG020c | No virus scanning on uploaded files | P2 | Open |
| KG020d | No field-level encryption for PII columns | P2 | Open |
| KG026 | Platform-native MFA not implemented | P1 | Formally accepted — IdP-level MFA is current control |

See [KNOWN-GAPS.md](KNOWN-GAPS.md) and [AUDIT_FINDINGS_REGISTER.md](AUDIT_FINDINGS_REGISTER.md) for full remediation plans and owners.

---

*Threat model produced 2026-04-20. Next review: before Series A close or first production customer onboarding, whichever comes first.*
