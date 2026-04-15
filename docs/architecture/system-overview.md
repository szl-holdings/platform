# SZL Holdings — System Architecture Overview

**Version:** 3.0  
**Date:** April 2026

---

## Purpose

This document describes the top-level architecture of the SZL Holdings platform ecosystem — the structural decisions that define how the system is built, why those decisions were made, and what they enable.

---

## The Core Thesis

SZL Holdings is not a collection of products. It is a platform ecosystem built on a single architectural commitment: **business observability and execution accountability as a unified system**.

The operating wedge is **Lyte + Alloy**:
- Lyte surfaces operational signals across an organization's full system — making every surface visible, contextual, and actionable through the PRISM framework.
- Alloy closes the loop — routing those signals to verified, auditable action through a governed workflow engine with human-in-the-loop approval at every consequential step.

Additional domain verticals (Aegis, Terra, Vessels, Carlota Jo) are built on the same architectural foundation — sharing the intelligence layer, execution fabric, design system, and data model. Each vertical adds domain-specific signal ingestion and reasoning; the core infrastructure is shared.

---

## Architectural Layers

```
┌──────────────────────────────────────────────────────────────────┐
│  ADVISE                                                          │
│  Carlota Jo — Private Advisory                                   │
│  Principal advisory grounded in platform intelligence            │
├──────────────────────────────────────────────────────────────────┤
│  EXECUTE                                                         │
│  Alloy — Execution Fabric                                        │
│  Workflow engine · Audit trail · Agent coordination              │
│  Human-in-the-loop gates for consequential actions               │
├──────────────────────────────────────────────────────────────────┤
│  OBSERVE · DECIDE · ACT                                          │
│  Lyte            Aegis           Terra          Vessels          │
│  Business        Defense &       Real Estate    Maritime         │
│  Observability   Intelligence    Intelligence   Intelligence     │
│  PRISM           Defense/Cmd/    NYC Distress   Fleet & AIS      │
│  Framework       Intelligence    Pipeline       Telemetry        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Signal-to-Action Flow

The core operational cycle across all platforms:

```
Raw Signal (domain-specific)
    │
    ▼
[INGEST] — Domain-specific data acquisition and normalization
    │   Lyte:    Business metrics, approval queues, workflow signals
    │   Aegis:   Security events, threat feeds, CVE data, MITRE ATT&CK
    │   Terra:   NYC distress filings, ownership records, market data
    │   Vessels: AIS telemetry, voyage data, port calls, sanctions lists
    │
    ▼
[ANALYZE] — Pattern recognition, scoring, explainability
    │   PRISM (Lyte):       Pulse/Risk/Intelligence/Signals/Motion
    │   INCA (Aegis Labs):  Model evaluation, confidence scoring
    │   Domain agents:      Helmsman (maritime), Sentinel (security),
    │                       Compass (readiness)
    │
    ▼
[SURFACE] — Role-appropriate visualization and recommendation
    │   Command center dashboards, inbox, action queue
    │   AI recommendations with reasoning and confidence
    │   Priority-ranked signals with contributing factors
    │
    ▼
[EXECUTE] — Human-confirmed action via Alloy
    │   Approval workflow routing
    │   Human-in-the-loop gate (required for consequential ops)
    │   Immutable audit trail: recommendation → approval → action
    │
    ▼
Confirmed Action + Full Audit Trail
```

---

## Monorepo Structure

The platform is a **pnpm monorepo** with TypeScript project references throughout.

```
/
├── artifacts/              # Deployable applications (16 total)
│   ├── api-server/         # Express — all platform backends
│   ├── szl-holdings/       # Corporate site
│   ├── lyte-command-center/# Lyte — Business Observability
│   ├── firestorm/          # Aegis — Unified Defense & Intelligence
│   ├── terra/              # Terra — Real Estate Intelligence
│   ├── vessels/            # Vessels — Maritime Intelligence
│   ├── carlota-jo/         # Carlota Jo — Advisory web app
│   ├── command/            # Ecosystem Command Portal
│   ├── imperium/           # IMPERIUM — Cloud Sovereignty Engine
│   ├── szl-holdings-mobile/# CORTEX — Unified Mobile Command (iOS/Android)
│   └── mockup-sandbox/     # Component design preview server
│
├── lib/                    # Shared TypeScript libraries
│   ├── db/                 # Drizzle schema, migrations, seed
│   ├── shared-ui/          # Cross-app React component library
│   ├── auth/               # OIDC authentication
│   ├── services/           # Business logic adapters
│   ├── workflow-engine/    # Alloy execution fabric
│   ├── ai-engine/          # AI inference and orchestration
│   ├── audit/              # Compliance audit trail
│   ├── analytics/          # Event tracking
│   ├── observability/      # APM, logging, metrics
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Zod schema validation
│   ├── api-spec/           # OpenAPI 3.1 specification
│   └── graphql-client/     # GraphQL client
│
├── packages/               # Marketplace packages
│   ├── salesforce-appexchange/  # Salesforce AppExchange
│   └── atlassian-connect/       # Jira Marketplace Connect
│
├── infra/                  # Azure Bicep IaC templates
├── scripts/                # Seed data, automation scripts
└── docs/                   # Full documentation suite
```

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Mobile | Expo, React Native, expo-auth-session |
| Backend | Node.js, Express, TypeScript, esbuild |
| Database | PostgreSQL 15+, Drizzle ORM |
| Real-time | WebSocket (HMAC-signed tickets, per-channel ACL) |
| AI / LLM | OpenAI, Anthropic, Google Gemini (via integration proxies) |
| Authentication | OpenID Connect (PKCE), organization-scoped RBAC |
| Payments | Stripe (Checkout, Subscriptions, Invoicing, Customer Portal) |
| Maps | Mapbox GL JS |
| PDF | pdfkit (server-side, 8 branded templates) |
| Email | Resend → SendGrid → SMTP (failover chain) |
| Notifications | Slack webhooks, Microsoft Teams webhooks, WebSocket push |
| IaC | Azure Bicep (App Service, PostgreSQL, Key Vault, Redis, CDN) |
| API | OpenAPI 3.1, GraphQL (Apollo Server), generated React Query hooks |
| Marketplace | Salesforce AppExchange, Jira Marketplace (Atlassian Connect) |
| Monorepo | pnpm workspaces, TypeScript project references |

---

## Shared Infrastructure Investment

The architectural leverage of the SZL ecosystem comes from shared infrastructure that every platform benefits from:

| Infrastructure | Detail |
|----------------|--------|
| `@workspace/shared-ui` | TypeScript component library: UI primitives, navigation, command palette, keyboard shortcuts, agent indicators |
| `@workspace/db` | Drizzle schema with per-domain table namespacing. Single PostgreSQL instance with domain isolation |
| `@workspace/auth` | OIDC (PKCE) with session cookies. Roles: `founder_admin`, `admin`, `operator`, `analyst`, `viewer`, `client` |
| `@workspace/workflow-engine` | Alloy: workflow CRUD, execution routing, approval gates, agent coordination |
| `@workspace/audit` | Immutable event log: every significant action attributed, timestamped, and queryable |
| `@workspace/ai-engine` | Multi-provider AI inference (OpenAI, Anthropic, Gemini), agent routing, output governance |
| `@workspace/observability` | APM, structured logging (Pino), metrics, health endpoints |
| `@workspace/api-spec` | OpenAPI 3.1 specification — single source of truth for all API contracts |

---

## Design Principles

**Explicit over implicit.** Platform state — data freshness, demo mode, model version, agent confidence — is always visible. Users never assume what they are looking at.

**Advisory before autonomous.** AI outputs are recommendations with reasoning. Execution requires human confirmation. This is architectural, not policy.

**Traceability as a feature.** Every significant event is logged with attribution and context. The audit trail is an operational tool, not a compliance artifact.

**Shared infrastructure, domain-specific surfaces.** Architecture is shared. Domain expertise — maritime terminology, security taxonomy, real estate distress signals — lives in each platform's surface layer.

**Premium restraint in design.** Dark, immersive aesthetic. Density with clarity, subdued palettes with deliberate accent use, information hierarchy over decoration.

---

*See also:*
- *[Platform Map](platform-map.md) — Visual topology of the ecosystem*
- *[Data Flow](data-flow.md) — Entity model and cross-domain signal flow*
- *[Trust Center](../trust/trust-center.md) — Security posture and AI governance*
