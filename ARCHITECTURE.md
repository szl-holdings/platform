# Architecture — SZL Holdings Platform

**Version:** 3.0 | **Date:** April 2026 | **Audience:** Technical advisors, engineers, enterprise evaluators

**Related:** [SYSTEM-OVERVIEW.md](SYSTEM-OVERVIEW.md) · [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) · [DATA-MODEL.md](DATA-MODEL.md) · [API-SPEC.md](API-SPEC.md) · [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md) · [DEPENDENCY_MAP.md](DEPENDENCY_MAP.md) · [CONTROL_PLANE_ARCHITECTURE.md](CONTROL_PLANE_ARCHITECTURE.md) · [AUDIT_FINDINGS_REGISTER.md](AUDIT_FINDINGS_REGISTER.md)

---

## Architectural Thesis

SZL Holdings is a **pnpm monorepo** hosting the governed operational intelligence platform and its domain extensions. Every surface shares one API server, one PostgreSQL database, one design system, and one authentication model. Domain packs extend this shared governance core — they do not replace it.

The platform hierarchy: SZL Holdings (platform) → Lyte (flagship command surface) → Alloy (execution fabric) → CORTEX (mobile command) → Domain packs.

The defining architectural commitment: **governed decision execution as a platform primitive**. Signals surface across domains via the Event Fabric; actions route through Alloy; every consequential decision generates an immutable Proof Chain entry.

---

## Platform Layer Model

```
┌──────────────────────────────────────────────────────────────────┐
│  PLATFORM                                                        │
│  SZL Holdings — Governed Operational Intelligence                │
│  The governed decision layer for consequential operations        │
├──────────────────────────────────────────────────────────────────┤
│  COMMAND SURFACES                                                │
│  Lyte (flagship)    CORTEX (mobile)    Command Portal (hub)      │
│  PRISM framework    iOS + Android      8-domain SSE dashboard    │
│  Signal → action    All domains        Cross-domain oversight    │
├──────────────────────────────────────────────────────────────────┤
│  EXECUTION FABRIC                                                │
│  Alloy — Workflow orchestration · Approval gates · Audit trail   │
│  Human-in-the-loop enforcement for all consequential actions     │
├──────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                    │
│  Aegis       Vessels        Terra           PRISM Counsel        │
│  Security &  Maritime       Real Estate     Legal Matter         │
│  Defense     Intelligence   Intelligence    Command              │
│                                                                  │
│  Carlota Jo — Premium Advisory   IMPERIUM — Cloud Sovereignty    │
└──────────────────────────────────────────────────────────────────┘
```

All surfaces share six governance primitives: Outcome Graph, Proof Chain, Covenant Policy, Decision Simulation, Workflow Engine, and Event Fabric (Prism Bus).

Additional supporting surfaces: **Command Portal** (ecosystem hub), **SZL Holdings** (corporate/investor portal).

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
│   ├── imperium/           # IMPERIUM — Cloud Sovereignty (in development)
│   ├── szl-holdings-mobile/# CORTEX — Unified Mobile Command
│   ├── prism-counsel/      # PRISM Counsel — Legal Command
│   ├── stephen-site/       # Stephen Lutar — Founder site
│   └── mockup-sandbox/     # Component design preview (internal)
│
├── lib/                    # 37 shared TypeScript packages
│   ├── db/                 # Drizzle schema (700+ tables), migrations, seed
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
│   ├── forge-runtime/      # Durable job queue / agent execution (legacy lib)
│   #  Forge (April 2026): governed agent factory & promotion pipeline lives in
│   #    artifacts/api-server/src/services/forge/ + lib/db/src/schema/forge.ts
│   #    UI: artifacts/szl-holdings/src/pages/forge/ — see service README.md
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

*Last verified against source code: 2026-04-16 (Phase 2–3 audit). Re-verify against `artifacts/api-server/src/`, `lib/db/src/schema/`, and `lib/auth/src/` after significant code changes. See [AUDIT_FINDINGS_REGISTER.md](AUDIT_FINDINGS_REGISTER.md) for open architectural findings.*
