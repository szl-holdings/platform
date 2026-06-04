# Canonical Product Surface Map — SZL Holdings Platform

**Status:** AUTHORITATIVE  
**Effective date:** April 16, 2026  
**Supersedes:** `PRODUCT_SURFACE_MAP.md`, `docs/audit/public-surface-inventory.md`, `docs/audit/deploy-surface-map.md`

---

## Overview

This document is the single canonical map of every product surface in the SZL Holdings platform — what it is, who it's for, its maturity level, and its operational status. It is the authoritative reference for investor conversations, Series A due diligence, and all product planning.

---

## Tier 1 — Live / Operational

These surfaces are fully wired to real data, real auth, and real database. They are ready for authenticated internal or investor use today.

| Surface | URL Path | Description | Auth Required | Data Mode |
|---------|----------|-------------|--------------|-----------|
| **SZL Holdings** — Corporate site | `/` | Marketing, investor hub, trust center, Decision Theater | No (public) / Yes (investor portal) | Real + illustrative content |
| **API Server** | `/api/` | REST, GraphQL, WebSocket backend — all domain packs | Yes (OIDC) | Real database (PostgreSQL) |
| **Unified Command** | `/command/` | Ops command center (absorbed Lyte + IMPERIUM functionality) | Yes | Real API + real DB |
| **Aegis** | `/aegis/` | Defense & security intelligence | Yes | Real structured data |
| **Vessels** | `/vessels/` | Maritime fleet command | Yes | Real structured data (simulated AIS positions) |
| **Terra** | `/terra/` | Real estate intelligence | Yes | Real structured data + NYC Open Data |
| **Carlota Jo** | `/carlota-jo/` | Premium advisory platform | Yes | Real structured data |
| **CORTEX Mobile** | Expo | Unified mobile command (iOS/Android) | Yes | Real API |

---

## Tier 2 — Functional Alpha with Demo Data

These surfaces are functionally complete but require external credentials or enterprise setup before going live with real data.

| Surface | Description | What's Missing |
|---------|-------------|---------------|
| **Stripe Billing** | Payment processing, subscription management | Live `STRIPE_SECRET_KEY` — currently in demo/test mode |
| **Email Delivery** | Transactional email via Resend | `RESEND_API_KEY` — gracefully degraded (no emails sent) |
| **Azure AD SSO** | Multi-tenant enterprise SSO, SCIM provisioning | Per-tenant Azure AD admin consent |
| **Power BI Embed** | Embedded analytics per tenant workspace | Per-tenant Power BI workspace access token |
| **SCIM Provisioning** | Automated user provisioning from IdP | IdP admin configuration per tenant |
| **Object Storage** | File uploads, document storage | `OBJECT_STORAGE_BUCKET_ID` — falls back to local filesystem |

---

## Tier 3 — Partial Integration / In Progress

| Surface | Status | Notes |
|---------|--------|-------|
| **CORTEX Mobile (cortex-mobile dir)** | Active development, unscaffolded | `artifacts/cortex-mobile` has Expo config but not registered as artifact |
| **MCP Gateway** | Functional | 26 tenant-scoped, role-enforced tools at `/api/mcp` |
| **WebSocket Push** | Functional | HMAC-signed tickets, SSE |
| **AI Agents (12 domain agents)** | Functional | Governed by Covenant Policy; requires AI provider keys |
| **GraphQL API** | Functional | Apollo Server v5 at `/api/graphql` |

---

## Tier 4 — Planned / Not Activated

These are documented capabilities with implementation stubs but not yet activated:

| Surface | Description | Activation Requirement |
|---------|-------------|----------------------|
| **Sentry Error Monitoring** | Frontend + backend error tracking | Configure `SENTRY_DSN` |
| **Persistent Session Store** | Redis or PostgreSQL-backed sessions | Provision Redis or configure DB sessions |
| **Rate Limiting (public pages)** | DDoS mitigation on marketing routes | Configuration change |
| **Custom Domain per Artifact** | `vessels.szlholdings.com`, etc. | DNS configuration + Replit custom domain setup |
| **Cloudflare CDN** | Asset caching, DDoS mitigation | DNS proxy configuration |

---

## Tier 5 — Archived / Out of Scope

These artifact directories exist in the repo but have no active source code and are not presented to any user:

| Artifact | Status | Notes |
|----------|--------|-------|
| `artifacts/firestorm` | Archived | Content fully absorbed into Aegis |
| `artifacts/lyte-command-center` | Archived | Content absorbed into Command |
| `artifacts/imperium` | Archived skeleton | Never built; only node_modules skeleton |
| `artifacts/prism-counsel` | Archived | Legal matter management — deregistered, content archived |
| `artifacts/stephen-site` | Deprecated | Founder profile moved to `/founder` in szl-holdings |

---

## Platform Primitives (Invisible — Surface Through Interactions)

These are shared infrastructure components that power the domain surfaces above:

| Primitive | Package | Description |
|-----------|---------|-------------|
| **Outcome Graph** | `lib/outcome-graph` | Decision lifecycle tracking |
| **Proof Chain** | `lib/proof-chain` | Immutable audit trail with provenance |
| **Covenant Policy** | `lib/covenant-policy` | Permission gates and human-in-the-loop approvals |
| **Monte Carlo** | `lib/monte-carlo` | Probabilistic risk simulation |
| **Workflow Engine** | `lib/workflow-engine` | Durable process orchestration |
| **PRISM Bus** | `lib/prism-bus` | Cross-domain event bus |
| **Alloy Runtime** | `lib/forge-runtime` | Workflow execution internals |
| **AI Engine** | `lib/ai-engine` | Multi-provider AI (OpenAI, Anthropic, Gemini) |
| **AI Control Plane** | `packages/ai-control-plane` | Model routing, eval-aware selection, cost controls |

---

## Navigation Hierarchy

```
Platform Level (visible from anywhere)
├── SZL Holdings (/)          — Corporate, trust, investor
├── Unified Command (/command/) — Cross-domain ops, IMPERIUM-equivalent
├── CORTEX (mobile)            — Unified mobile command
│
Domain Packs (specialized surfaces)
├── Aegis (/aegis/)            — Defense & security
├── Vessels (/vessels/)        — Maritime fleet
├── Terra (/terra/)            — Real estate
└── Carlota Jo (/carlota-jo/)  — Premium advisory
│
Internal / Infrastructure
├── API Server (/api/)         — Backend, not user-facing
└── Mockup Sandbox (/__mockup) — Design system, dev only
```

---

_This map is the authoritative product surface reference. For gap analysis see `docs/audit/series-a-gap-register.md`. For trust classification see `docs/trust/trust-surface-policy.md`._
