# Architecture — SZL Holdings Platform

**Version:** 3.0 | **Date:** April 2026 | **Audience:** Technical advisors, engineers, enterprise evaluators

**Related:** [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md) · [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) · [DATA-MODEL.md](DATA-MODEL.md) · [API-SPEC.md](API-SPEC.md) · [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md)

---

## Architectural Thesis

SZL Holdings is a **pnpm monorepo** hosting a unified ecosystem of platforms across multiple operational domains. Every platform shares one API server, one PostgreSQL database, one design system, and one authentication model. Domain-specific surfaces (maritime, security, real estate, legal) extend this shared core — they do not replace it.

The defining architectural commitment: **business observability and execution accountability as a unified system**. Signals surface across domains; actions route through a single governed execution fabric (Alloy); every consequential decision generates an immutable audit event.

---

## Platform Layer Model

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
│  PRISM FW        MITRE/SOAR      NYC Distress   AIS Telemetry    │
└──────────────────────────────────────────────────────────────────┘
```

Additional surfaces: **PRISM Counsel** (legal), **IMPERIUM** (cloud sovereignty), **Command Portal** (ecosystem hub), **CORTEX** (unified mobile), **SZL Holdings** (corporate/investor).

---

## System Topology

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                        │
│  Web (Vite + React 19)           Mobile (Expo + React Native)   │
│  szl-holdings  lyte-cmd-center   CORTEX (szl-holdings-mobile)   │
│  firestorm     terra             carlota-jo-mobile              │
│  vessels       prism-counsel     aegis/vessels/terra/lyte-mobile │
│  carlota-jo    command                                          │
│  imperium      stephen-site                                     │
└──────────────────┬──────────────────────┬───────────────────────┘
                   │  REST/JSON           │  REST/JSON
                   │  GraphQL (Apollo)    │  (EXPO_PUBLIC_API_URL)
                   ▼                      ▼
┌────────────────────────────────────────────────────────────────┐
│  API SERVER  (artifacts/api-server)  Express 5 · TypeScript    │
│                                                                │
│  Global middleware chain (applied in order):                   │
│    correlationMiddleware → apiVersionMiddleware → helmet →     │
│    CORS → compression → globalLimiter → telemetryMiddleware → │
│    pinoHttp → cookieParser → JSON body → CSRF →               │
│    authMiddleware (session hydrator) → sessionRefreshPolicy    │
│                                                                │
│  Route groups:                                                  │
│    /api/auth          — Sessions, OIDC, WebSocket tickets      │
│    /api/alloy         — Workflow engine, approvals, audit      │
│    /api/firestorm     — SOC / security ops (Aegis)             │
│    /api/terra         — Property intelligence + CRM            │
│    /api/vessels       — Fleet tracking + maritime ops          │
│    /api/prism-counsel — Legal matter management                │
│    /api/ai            — AI tool execution                      │
│    /api/intelligence  — External intel feeds                   │
│    /api/storage       — Object storage / file management       │
│    /api/billing       — Stripe billing operations              │
│    /api/admin         — Backup, tenant provisioning (guarded)  │
│    /api/notifications — Push notifications                     │
│    /api/graphql       — GraphQL endpoint (Apollo)              │
│    /api/health        — System health checks                   │
│    /api/docs          — Swagger UI (OpenAPI spec)              │
└──────────────┬─────────────────────────┬───────────────────────┘
               │                         │
               ▼                         ▼
┌──────────────────────┐    ┌────────────────────────────────────┐
│  PostgreSQL 16+      │    │  External Services                 │
│  Drizzle ORM         │    │  • OpenAI / Anthropic / Gemini     │
│  644 tables          │    │    (via Replit AI proxy)           │
│  10 schema domains   │    │  • Stripe (billing)                │
│                      │    │  • Resend / SMTP (email)           │
│  Domain isolation:   │    │  • AIS feeds (maritime)            │
│  • auth / sessions   │    │  • Legal data (CourtListener)      │
│  • organizations     │    │  • Mapbox / Google Maps            │
│  • alloy (workflows) │    │  • Slack / Teams / Twilio          │
│  • vessels           │    │  • Object storage (Replit / Azure) │
│  • projects          │    │  • STIX/TAXII (threat intel)       │
│  • audit logs        │    │  • Sanctions lists (OFAC/UN/EU/UK) │
└──────────────────────┘    └────────────────────────────────────┘
```

---

## Signal-to-Action Flow

The core operational cycle shared across all platforms:

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
    │   Domain agents:      Helmsman (maritime), Sentinel (security)
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
    │   Immutable audit trail: signal → recommendation → approval → action
    │
    ▼
Confirmed Action + Full Audit Trail
```

---

## Monorepo Structure

```
/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express — single backend for all platforms
│   ├── szl-holdings/       # Corporate site + investor portal
│   ├── lyte-command-center/# Lyte — Business Observability
│   ├── firestorm/          # Aegis — Unified Defense & Intelligence
│   ├── aegis/              # Aegis (alternate registration)
│   ├── terra/              # Terra — Real Estate Intelligence
│   ├── vessels/            # Vessels — Maritime Intelligence
│   ├── carlota-jo/         # Carlota Jo — Advisory
│   ├── command/            # Command Portal — Ecosystem Hub
│   ├── imperium/           # IMPERIUM — Cloud Sovereignty
│   ├── szl-holdings-mobile/# CORTEX — Unified Mobile Command
│   ├── prism-counsel/      # PRISM Counsel — Legal Command
│   ├── stephen-site/       # Stephen Lutar — Founder site
│   └── mockup-sandbox/     # Component design preview (internal)
│
├── lib/                    # 37 shared TypeScript packages
│   ├── db/                 # Drizzle schema (644 tables), migrations, seed
│   ├── shared-ui/          # Cross-app React component library
│   ├── auth/               # OIDC authentication, session management
│   ├── services/           # Business logic adapters
│   ├── workflow-engine/    # Alloy execution fabric
│   ├── ai-engine/          # AI inference and orchestration (Nuro Mesh)
│   ├── audit/              # Immutable compliance audit trail
│   ├── analytics/          # Event tracking
│   ├── observability/      # APM, Pino logging, metrics
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Zod schema validation
│   ├── api-spec/           # OpenAPI 3.1 specification
│   ├── prism-bus/          # Cross-domain event bus
│   ├── forge-runtime/      # Durable job queue / agent execution
│   ├── intelligence-feeds/ # AIS, STIX/TAXII, legal data adapters
│   ├── proof-chain/        # Cryptographic audit trail
│   ├── worldline/          # Timeline and event sequencing
│   ├── monte-carlo/        # Probabilistic risk simulation
│   ├── covenant-policy/    # Policy enforcement engine
│   ├── mobile-shared/      # React Native shared components
│   ├── offline-engine/     # Offline sync for mobile
│   ├── graphql-client/     # Apollo GraphQL client
│   └── mcp-client/         # Model Context Protocol client
│
├── packages/               # Marketplace integrations
│   ├── salesforce-appexchange/
│   └── atlassian-connect/
│
├── infra/                  # Azure Bicep IaC templates
├── scripts/                # Seed data, QA, automation
└── docs/                   # Full documentation suite
```

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Mobile | Expo, React Native, NativeWind, expo-auth-session |
| Backend | Node.js 20, Express 5, TypeScript, esbuild |
| Database | PostgreSQL 16+, Drizzle ORM |
| Real-time | WebSocket (HMAC-signed tickets, per-channel ACL), SSE |
| AI / LLM | OpenAI, Anthropic, Google Gemini (via Replit AI proxy) |
| Authentication | OpenID Connect (PKCE), 11-role org-scoped RBAC, SCIM 2.0 |
| Payments | Stripe (Checkout, Subscriptions, Invoicing, Customer Portal) |
| Maps | Mapbox GL JS |
| PDF | pdfkit (server-side, 8 branded templates) |
| Email | Resend → SendGrid → SMTP (failover chain) |
| Notifications | Slack webhooks, Teams webhooks, WebSocket push, Twilio SMS |
| IaC | Azure Bicep (App Service, PostgreSQL, Key Vault, Redis, CDN) |
| API | OpenAPI 3.1, GraphQL (Apollo Server), generated React Query hooks |
| Marketplace | Salesforce AppExchange, Atlassian Connect (Jira) |
| Monorepo | pnpm workspaces, TypeScript project references |

---

## Shared Infrastructure

| Package | Detail |
|---------|--------|
| `@szl-holdings/shared-ui` | Component library: UI primitives, navigation, command palette, keyboard shortcuts |
| `@szl-holdings/db` | Drizzle schema with per-domain table namespacing. Single PostgreSQL instance |
| `@szl-holdings/auth` | OIDC (PKCE) with session cookies. `users.platform_role` has 11 values: `anonymous_visitor`, `founder_admin`, `platform_admin`, `operator`, `analyst`, `executive_viewer`, `ops_manager`, `sales_delivery_user`, `maritime_ops_user`, `service_coordinator`, `pilot_customer_user`. Separate role systems exist for org membership and admin access — see ACCESS-CONTROL-MATRIX.md |
| `@szl-holdings/workflow-engine` | Alloy: workflow CRUD, execution routing, approval gates, agent coordination |
| `@szl-holdings/audit` | Immutable event log: every significant action attributed, timestamped, queryable |
| `@szl-holdings/ai-engine` | Multi-provider AI inference, Nuro Mesh agent routing, output governance |
| `@szl-holdings/observability` | APM, structured logging (Pino), metrics, health endpoints |
| `@szl-holdings/api-spec` | OpenAPI 3.1 specification — single source of truth for all API contracts |
| `@szl-holdings/prism-bus` | Cross-domain event bus connecting all verticals |
| `@szl-holdings/forge-runtime` | Durable job queue, worker scheduling, agent execution runtime |

---

## Design Principles

**Explicit over implicit.** Platform state — data freshness, demo mode, model version, agent confidence — is always visible.

**Advisory before autonomous.** AI outputs are recommendations with reasoning. Execution requires human confirmation. This is architectural, not policy.

**Traceability as a feature.** Every significant event is logged with attribution and context. The audit trail is an operational tool, not a compliance artifact.

**Shared infrastructure, domain-specific surfaces.** Architecture is shared. Domain expertise lives in each platform's surface layer.

**Premium restraint in design.** Dark, immersive aesthetic. Density with clarity, subdued palettes with deliberate accent use.

---

*See also: [docs/architecture/system-overview.md](docs/architecture/system-overview.md) · [docs/architecture/platform-map.md](docs/architecture/platform-map.md) · [docs/architecture/data-flow.md](docs/architecture/data-flow.md)*

---

*Last verified against source code: 2026-04-15. Re-verify against `artifacts/api-server/src/`, `lib/db/src/schema/`, and `lib/auth/src/` after significant code changes.*
