# Technical Evaluator Brief

**Last updated:** April 2026  
**Audience:** Senior engineers, architects, DevOps leads evaluating the SZL Holdings platform  
**Reading time:** 10 minutes

---

## What This Is

SZL Holdings is a governed decision infrastructure platform — not a dashboard and not an AI chatbot. It sits between signal detection and action execution, enforcing governance, attribution, and proof on every consequential decision.

This brief covers the technical architecture, security model, API capabilities, and what integration actually looks like.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express 5, PostgreSQL 16, Drizzle ORM |
| AI | OpenAI, Anthropic, Gemini — multi-provider with fallback; evidence-backed hybrid retrieval |
| Auth | Session cookies + Bearer tokens; OIDC/PKCE; 11-role RBAC; SCIM 2.0; Azure AD SSO |
| Mobile | Expo / React Native (iOS + Android) |
| Infrastructure | Replit (dev/staging/production); Azure Bicep IaC for enterprise deployments |
| Monorepo | pnpm workspace — 40+ packages, 700+ database tables across 116 schema files |

---

## Database Model

- **Database:** PostgreSQL 16
- **ORM:** Drizzle ORM with fully typed schema
- **Scale:** 700+ tables across 116 schema files
- **Multi-tenancy:** Org-scoped at the data layer — `callerOrgIds()` applied to every query, `inArray(orgId, orgIds)` in every WHERE clause. Cross-org data returns 404, not 403.
- **Audit trail:** Immutable Proof Chain — append-only entries, SHA-256 integrity verification

---

## Authentication and Authorization

**Session management:**
- Cookie name: `sid`
- HttpOnly + Secure + SameSite=Lax
- 24-hour expiry, sliding refresh

**Bearer token:**
- `Authorization: Bearer <token>`
- Same RBAC enforcement as session cookie

**Role hierarchy (6 levels, external-facing):**
```
super_admin > ops > manager > analyst > viewer > guest
```
Each role inherits all permissions of lower roles. See `ops/backend/authz-matrix.md` for the canonical role definitions and endpoint access mapping.

**Rate limits:**
- Auth endpoints: 5 req/min per IP (strict, fail-closed)
- Read ops: 100 req/min per authenticated user (fail-open)
- Write ops: 60 req/min per authenticated user (fail-closed)
- Global: 200 req/15min per IP

---

## API Basics

**Base URL (production):** `https://api.szlholdings.com/api/`

**Documentation:** Swagger UI at `/api/docs`, OpenAPI 3.1 spec at `/lib/api-spec/openapi.yaml`

**Standard response envelope:**
```json
{
  "data": { ... },
  "meta": { "requestId": "abc-123", "timestamp": "2026-04-15T12:00:00Z" }
}
```

**Standard error format:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Email is required",
  "statusCode": 400,
  "requestId": "abc-123"
}
```

**Error codes:** `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`

**GraphQL:** `POST /api/graphql` — same auth as REST; all operations must be named.

**Correlation tracking:** Use `X-Correlation-Id: <uuid>` on every request. It propagates through the chain and appears in all log entries.

---

## Security Architecture Summary

| Control | Implementation |
|---|---|
| Transport | TLS 1.3; mTLS for Replit proxy preview |
| Encryption at rest | AES-256-GCM with auth tags for sensitive fields |
| Tenant isolation | Architectural — org-scoped at query layer, not UI layer |
| Secrets management | Replit Secrets (encrypted); no secrets in source code |
| AI governance | Advisory only; Proof Chain anchoring; Covenant Policy enforcement |
| Audit trail | Immutable, append-only; SHA-256 integrity; full actor attribution |

**Known gaps (disclosed proactively):**
- No SOC 2 yet (targeted Phase 3, post-funding)
- No penetration test yet (pre-production)
- No immutable external log sink yet (Pino structured logs in place; external sink on roadmap)

---

## Deployment Model

| Service | Type | Reason |
|---|---|---|
| Web apps (szl-holdings, Aegis, Terra, Vessels, etc.) | Autoscale | Stateless, HTTP, scales with demand |
| API server | Reserved VM | Always-on for WebSocket connections and background jobs |
| Mobile (CORTEX, szl-holdings-mobile) | EAS / App Stores | Built via Expo Application Services |

**Health endpoints:**
- `GET /api/health/live` — liveness (always 200 if running)
- `GET /api/health/ready` — readiness (checks DB)
- `GET /api/health` — full health with DB latency and version

---

## Integration Patterns

**High-priority integrations already in scope:**
- Microsoft 365 (SharePoint, Outlook, Teams) — for PRISM Counsel
- AIS data feeds — for Vessels maritime intelligence
- STIX/TAXII threat intelligence — for Aegis security

**Integration style:**
- REST API polling or webhook ingestion
- Events normalized into Event Fabric signal format
- Standard bearer token auth for all API consumers

**Typical integration effort:**
- REST API read integration: 1–3 days
- Webhook integration: 3–7 days
- Full connector with data normalization: 2–4 weeks

**Sandbox:** No dedicated sandbox currently. Design partners get a provisioned workspace for integration testing.

---

## What Is Not Available Yet

| Capability | Status |
|---|---|
| Outbound webhooks | On roadmap — not yet available |
| Public OAuth 2.0 app authorization | On roadmap — not yet available |
| Developer API keys (separate from user accounts) | On roadmap |
| Dedicated sandbox environment | On roadmap — post-first production agreement |
| SOC 2 audit report | Post-funding, estimated 6–9 months |

---

## Where to Go for More

| Resource | Location |
|---|---|
| Full API documentation | `/api/docs` (Swagger UI) |
| OpenAPI spec | `/lib/api-spec/openapi.yaml` |
| Authorization matrix | `ops/backend/authz-matrix.md` |
| API standards | `ops/backend/api-standards.md` |
| Integration patterns | `ops/market/integration-priority-map.md` |
| Security architecture | `ops/security/threat-model-summary.md` |
| Technical questions | Direct to founder: inquiries@szlholdings.com |

---

*Full API and integration documentation is available to qualified evaluators. Contact inquiries@szlholdings.com to request access to extended technical documentation or to schedule a technical deep-dive session.*
