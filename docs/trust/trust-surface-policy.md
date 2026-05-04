# Trust Surface Policy — SZL Holdings Platform

**Status:** AUTHORITATIVE  
**Effective date:** April 16, 2026  
**Audience:** growth capital investors, technical due diligence reviewers, enterprise buyers, internal team

---

## Purpose

This document defines the trust classification for every product surface in the SZL Holdings platform. It provides a clear, honest accounting of what is live and operational, what requires external setup, and what is in development — removing any ambiguity about platform maturity for investors and buyers.

---

## Trust Buckets

### Bucket 1 — Live / Operational
> Fully wired to real data, real authentication, real database. Works today for authenticated users. No external credentials needed beyond platform provisioning.

### Bucket 2 — Functional Alpha with Demo Data
> Core functionality complete, data structures real, auth wired. Missing one external credential or enterprise setup step before live data flows.

### Bucket 3 — Partial Integration / In Progress
> Implementation underway. May have working UI with mock or stub data. Not ready for production use.

### Bucket 4 — Planned / Not Activated
> Architecture designed, may have stub code, not built. Exists in documentation as future capability.

### Bucket 5 — Archived / Out of Scope
> Existed at some point, now deprecated. Code may be present but is not deployed or maintained.

---

## Surface Classification

### Bucket 1 — Live / Operational

| Surface | Path | What Works Today |
|---------|------|-----------------|
| **API Server** | `/api/` | REST (all domains), GraphQL, WebSocket, health checks, 155/170 routes auth-enforced, Drizzle ORM, job queue, SSE |
| **SZL Holdings Site** | `/` | Marketing, investor hub, trust center, Decision Theater, legal pages, contact form routing |
| **Unified Command** | `/command/` | Cross-domain ops, strategy dashboard, ATLAS signals, infrastructure governance |
| **Aegis** | `/aegis/` | Security intelligence, threat feeds, SOC workflows, structured incident data |
| **Vessels** | `/vessels/` | Maritime fleet tracking, voyage management, cargo operations, structured fleet data |
| **Terra** | `/terra/` | Real estate intelligence, NYC Open Data pipeline, property analysis, distress signals |
| **Carlota Jo** | `/carlota-jo/` | Premium advisory platform, matter management, client portal |
| **CORTEX Mobile** | Expo | iOS/Android unified command, real API connectivity |
| **Authentication** | Platform-wide | OIDC/PKCE via Replit Auth, session management, 11-role RBAC |
| **Audit Trail** | Platform-wide | Immutable event log, proof chain, action attribution |
| **Workflow Engine** | Platform-wide | Durable process orchestration, approval gates |
| **AI Agents (12)** | Platform-wide | Domain AI agents governed by Covenant Policy |
| **MCP Gateway** | `/api/mcp` | 26 tenant-scoped, role-enforced tools (JSON-RPC 2.0 + SSE) |
| **GraphQL API** | `/api/graphql` | Apollo Server v5 + graphql-ws subscriptions |
| **Business Observability (ATLAS)** | `/api/business-events/*` | KPI ingestion, event emission, aggregated summaries |

**Trust statement for Bucket 1:** These surfaces are demonstrated in live investor and buyer sessions. They operate against a real PostgreSQL database with real application logic. No mocks or stubs are active in production paths.

---

### Bucket 2 — Functional Alpha with Demo Data

| Surface | What's Built | What's Missing | Time to Live |
|---------|-------------|----------------|-------------|
| **Stripe Billing** | Full payment flow, subscription management, invoice generation | Live `STRIPE_SECRET_KEY` — currently test/demo mode | Hours (get key) |
| **Transactional Email** | Resend integration, email templates for all workflows | `RESEND_API_KEY` — no emails sent in dev | Hours (get key) |
| **Azure AD SSO** | Full SCIM endpoint, multi-tenant auth code | Per-tenant admin consent in Azure AD | Days (enterprise setup) |
| **Power BI Embed** | Embed code complete, token refresh logic | Per-tenant Power BI workspace access token | Days (enterprise setup) |
| **Object Storage** | Upload/download, ACLs, presigned URLs | `OBJECT_STORAGE_BUCKET_ID` — falls back to local filesystem | Hours (provision bucket) |
| **SCIM Provisioning** | REST endpoint `/api/scim/*`, user sync logic | IdP admin configuration per tenant | Days (enterprise setup) |

**Trust statement for Bucket 2:** These are fully implemented product features. The code is production-quality. They appear as "demo mode" only because they need credentials that are external to the platform. Time-to-live is measured in hours to days, not weeks or months.

---

### Bucket 3 — Partial Integration / In Progress

| Surface | Status | Expected Completion |
|---------|--------|-------------------|
| **CORTEX Mobile (cortex-mobile dir)** | Active Expo development, unregistered as artifact | Wave 3–4 |
| **Zod validation coverage** | 21% of routes (21/170) validated; highest-risk routes prioritized | Q2 2026 |
| **Route security matrix** | Auth enforced on 155/170 routes; automated matrix not yet built | Q2 2026 |
| **Persistent session store** | In-memory sessions work; Redis/PostgreSQL session persistence not yet wired | Before first paid tenant |

**Trust statement for Bucket 3:** These are real gaps, acknowledged and tracked. They do not affect current demo or internal use. They are prerequisite items for general commercial availability.

---

### Bucket 4 — Planned / Not Activated

| Surface | Status |
|---------|--------|
| **Sentry error monitoring** | Planned — no DSN configured |
| **Rate limiting on public marketing pages** | Config change required |
| **Custom domain per artifact** | DNS + Replit config — infrastructure work |
| **Cloudflare CDN** | DNS proxy configuration — infrastructure work |
| **Log aggregation** (Logtail, Datadog) | Not started |
| **Cross-browser automated testing** | Not started |
| **Mobile-specific accessibility testing** | Not started |

---

### Bucket 5 — Archived / Out of Scope

| Surface | Notes |
|---------|-------|
| `artifacts/firestorm` | Fully absorbed into Aegis. Dir exists with DEPRECATED.md. |
| `artifacts/imperium` | Was an internal admin concept. Never built. |
| `artifacts/prism-counsel` | Legal matter management. Deregistered and archived. |
| `artifacts/stephen-site` | Founder profile moved to `/founder` in szl-holdings. |

---

## Honesty Standards

The SZL Holdings platform upholds the following honesty standards for all investor and buyer communications:

1. **Never describe Bucket 3 or 4 items as Bucket 1.** A feature is "live" only when real data flows end-to-end.
2. **Demo data must be labeled.** Any screen showing illustrative or seeded data must carry a visible "Demo" badge.
3. **Metrics shown in demos must be real or clearly labeled as benchmarks/targets.** Product metrics ("< 4 min signal detection", "2.4M+ signals/day") must be labeled as performance benchmarks, not production statistics, until verified with live workloads.
4. **Financial figures require founder verification.** Any funding amounts or ARR figures in public-facing materials must be confirmed as accurate before publication.
5. **Archived surfaces are not demoed.** Archived artifact directories (firestorm, imperium, prism-counsel, stephen-site) are never shown as active product.

---

## Investor Session Protocol

For growth capital investor sessions:
- Use the live development environment (Replit workspace) — it is the canonical demo surface
- Authenticate with the demo org account (credentials in Replit Secrets via SECRETS_SETUP.md)
- Surfaces in Bucket 1 are demonstrated as live
- Surfaces in Bucket 2 are described as "requiring one external credential to go live"
- Do not demo Bucket 3, 4, or 5 surfaces as production-ready

---

_For surface-by-surface maturity details see `docs/architecture/canonical-product-surface.md`. For gap details see `docs/audit/series-a-gap-register.md`._
