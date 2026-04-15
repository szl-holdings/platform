# Architecture — SZL Holdings Platform

**Version:** 2.1 · **Last updated:** April 2026
**Source of truth for:** service topology, artifact map, shared libraries, data flow, infrastructure

> For the detailed narrative version see `docs/architecture.md`. For deployment topology see `DEPLOYMENT-GUIDE.md`. For the platform product map see `PRODUCT-SURFACES.md`.

---

## Doctrine

SZL Holdings is a **governed operational intelligence layer** — the platform that connects what is observable to what is executable, under governance, with full attribution.

The core operating wedge is **Lyte + Alloy**. Lyte delivers business observability. Alloy delivers execution accountability. Domain packs (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM) share the same data layer, execution fabric, and AI engine, extending the system into vertical markets without rebuilding infrastructure.

**Four design principles govern every architectural decision:**

1. **Explicit over implicit.** Platform state — data freshness, demo mode, model version, agent confidence — is always visible.
2. **Advisory before autonomous.** AI outputs are recommendations with reasoning. Execution requires human confirmation. This is architectural, enforced at the Alloy workflow layer.
3. **Traceability as a feature.** Every significant event is logged with attribution and context via the immutable audit trail.
4. **Shared infrastructure, domain-specific surfaces.** The architecture is shared. Domain expertise is built into each platform's surface layer only.

---

## Monorepo Structure

```
/
├── artifacts/          # Deployable apps (web + mobile) + dev sandboxes
│   ├── api-server/     # Centralized Express API server (all backends)
│   ├── szl-holdings/   # SZL Holdings corporate dashboard
│   ├── lyte-command-center/
│   ├── firestorm/      # Aegis — Unified Defense & Intelligence
│   ├── terra/
│   ├── vessels/
│   ├── prism-counsel/
│   ├── carlota-jo/
│   ├── imperium/
│   ├── command/        # Ecosystem Command Portal
│   ├── stephen-site/
│   ├── szl-holdings-mobile/  # CORTEX — Unified Mobile Command
│   ├── cortex-mobile/        # Cortex Mobile (WIP)
│   └── mockup-sandbox/       # Design sandbox (internal)
├── lib/                # ~37 shared TypeScript packages (@szl-holdings/*)
├── scripts/            # QA, seeding, backup, and migration scripts
├── docs/               # Operator and architecture documentation
├── infra/              # Azure Bicep IaC templates
└── packages/           # Utility packages
```

---

## System Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                                │
│                                                                         │
│  Web (Vite + React 19)              Mobile (Expo + React Native)        │
│  szl-holdings  lyte-command-center  szl-holdings-mobile (CORTEX)        │
│  firestorm     terra                cortex-mobile                       │
│  vessels       prism-counsel                                            │
│  carlota-jo    command                                                  │
│  imperium      stephen-site                                             │
└──────────────────┬──────────────────────┬───────────────────────────────┘
                   │  REST/JSON           │  REST/JSON
                   │  GraphQL (Apollo)    │  (EXPO_PUBLIC_API_URL)
                   │  WebSocket           │
                   ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│  API SERVER  (artifacts/api-server)  ·  Express 5 · TypeScript         │
│                                                                        │
│  Global middleware (in order):                                         │
│    correlationMiddleware → apiVersionMiddleware → helmet →             │
│    CORS → compression → globalLimiter → telemetryMiddleware →          │
│    pinoHttp → cookieParser → JSON body → CSRF →                        │
│    authMiddleware (session hydrator) → sessionRefreshPolicy            │
│                                                                        │
│  Route groups:                                                         │
│    /api/auth          Sessions, OIDC, WebSocket tickets                │
│    /api/alloy         Workflow engine, approvals, audit trail          │
│    /api/firestorm     SOC / Aegis security ops                         │
│    /api/terra         Property intelligence + CRM                      │
│    /api/vessels       Fleet tracking + maritime ops                    │
│    /api/prism-counsel Legal matter management                          │
│    /api/ai            AI tool execution, agent orchestration           │
│    /api/intelligence  External intel feeds (AIS, STIX, sanctions)      │
│    /api/storage       Object storage / file management                 │
│    /api/billing       Stripe billing operations                        │
│    /api/admin         Backup, tenant provisioning (guarded)            │
│    /api/notifications Push notifications                               │
│    /api/graphql       GraphQL endpoint (Apollo)                        │
│    /api/health        System health checks                             │
│    /api/docs          Swagger UI (live OpenAPI spec)                   │
└──────────────┬─────────────────────────┬──────────────────────────────┘
               │                         │
               ▼                         ▼
┌──────────────────────┐    ┌────────────────────────────────────────────┐
│  PostgreSQL (Drizzle)│    │  External Services                         │
│  @szl-holdings/db    │    │  • AI: OpenAI, Anthropic, Gemini           │
│                      │    │    (via Replit AI proxy by default)        │
│  112 schema files    │    │  • Stripe (billing + webhooks)             │
│  685 tables total    │    │  • Resend / SendGrid / SMTP (email)        │
│                      │    │  • AIS feeds (maritime telemetry)          │
│  Schema domains:     │    │  • CourtListener (legal records)           │
│  • auth / sessions   │    │  • Mapbox / Google Maps                    │
│  • organizations     │    │  • Slack / Teams / Twilio (notifications)  │
│  • alloy / workflows │    │  • Object storage (Replit / Azure)         │
│  • vessels           │    │  • STIX/TAXII (threat intel)               │
│  • firestorm         │    │  • Sanctions lists                         │
│  • terra             │    │                                            │
│  • prism-counsel     │    │                                            │
│  • carlota_jo        │    │                                            │
│  • billing           │    │                                            │
│  • audit logs        │    │                                            │
└──────────────────────┘    └────────────────────────────────────────────┘
```

---

## Intelligence Stack

How raw signal becomes actionable output:

```
Raw Signal (integrations, telemetry, data feeds, intelligence sources)
    │
    ▼
[OBSERVE] — Domain-specific ingestion and structuring
    │   Lyte:         Operational metrics, approval queues, workflow signals
    │   Aegis:        Security events, threat feeds, CVE data, MITRE ATT&CK
    │   Terra:        Distress filings, ownership records, NYC public data
    │   Vessels:      AIS telemetry, voyage data, port calls, sanctions lists
    │
    ▼
[ANALYZE] — Pattern recognition, scoring, explainability
    │   PRISM (Lyte):      Pulse/Risk/Intelligence/Signals/Motion decomposition
    │   INCA (Aegis):      Model evaluation, experiment tracking, confidence scoring
    │   Dreamscape:        Entity scoring engine, anomaly detection
    │   Helmsman (Vessels):Route intelligence, dark vessel detection
    │
    ▼
[EXECUTE] — Workflow routing and human-confirmed action
    │   Alloy:  Agent network governance, approval workflows
    │           Human-in-the-loop gates for consequential actions
    │
    ▼
Confirmed Action + Immutable Audit Trail (proof-chain)
```

---

## Platform Layer Map

| Layer | Platform | Domain |
|-------|----------|--------|
| Observe / Decide / Act | Lyte Command Center | Business Operations |
| Observe / Respond | Aegis (Firestorm) | Cybersecurity & Defense |
| Observe / Underwrite | Terra | NYC Real Estate |
| Track / Analyze | Vessels | Maritime & Logistics |
| Execute | Alloy (embedded in API server) | Cross-domain |
| Advise | Carlota Jo | Brand & Strategy |
| Advise | PRISM Counsel | Legal Matter Command |
| Command | IMPERIUM | Cloud Sovereignty |
| Command | Command Portal | Ecosystem Hub |
| Corporate | SZL Holdings | Investor / Corporate |
| Personal | Stephen Site | Founder Portfolio |
| Mobile | CORTEX (szl-holdings-mobile) | Unified Mobile |

---

## Shared Libraries (`lib/`)

All packages are scoped to `@szl-holdings/*` or `@workspace/*`.

### Core Infrastructure

| Package | Purpose |
|---------|---------|
| `@szl-holdings/db` | Drizzle ORM + PostgreSQL schema. 685 tables, 112 schema files |
| `@szl-holdings/auth` | Session management, OIDC logic, RBAC helpers |
| `@szl-holdings/config` | Centralized environment configuration with validation |
| `@szl-holdings/observability` | Pino logging, telemetry snapshots, analytics |
| `@szl-holdings/api-spec` | OpenAPI specification (`openapi.yaml`). Served at `/api/docs` |
| `@szl-holdings/api-zod` | Zod validation schemas derived from the OpenAPI spec |
| `@szl-holdings/services` | Business logic layer and external service connectors |
| `@szl-holdings/forge-runtime` | Durable job queue, worker scheduling, execution runtime |

### UI & Frontend

| Package | Purpose |
|---------|---------|
| `@szl-holdings/shared-ui` | Design system: components, tokens, animations |
| `@szl-holdings/mobile-shared` | React Native shared components and hooks |
| `@szl-holdings/graphql-client` | Apollo GraphQL client, provider, and generated hooks |
| `@workspace/object-storage-web` | Web file upload utilities (Uppy-based) |
| `@szl-holdings/i18n` | Internationalization and date/number formatting |

### Domain Engines

| Package | Purpose |
|---------|---------|
| `@szl-holdings/ai-engine` | AI agent orchestration, Nuro Mesh architecture, skill registry |
| `@szl-holdings/prism-bus` | Cross-domain event bus for intra-platform communication |
| `@szl-holdings/worldline` | Timeline and event sequencing engine |
| `@szl-holdings/proof-chain` | Verifiable, immutable audit trail generation |
| `@szl-holdings/receipt-graph` | Graph-based receipt and evidence tracking (PRISM Counsel) |
| `@szl-holdings/monte-carlo` | Probabilistic simulation and risk analysis (Terra) |
| `@szl-holdings/covenant-policy` | Policy rules and enforcement engine (PRISM Counsel) |
| `@szl-holdings/outcome-graph` | Outcome dependency graph and impact modeling |
| `@szl-holdings/intelligence-feeds` | External data adapters: AIS, STIX/TAXII, legal records |
| `@szl-holdings/offline-engine` | Offline support for mobile: storage, command queue, delta sync |
| `@szl-holdings/mcp-client` | Model Context Protocol (MCP) client |
| `@szl-holdings/crdt-sync` | Conflict-free replicated data types for collaborative editing |

### AI Provider Integrations

| Package | Provider |
|---------|----------|
| `@szl-holdings/integrations-openai-ai-server` | OpenAI (via Replit AI proxy by default) |
| `@szl-holdings/integrations-anthropic-ai` | Anthropic Claude (via Replit AI proxy by default) |
| `@szl-holdings/integrations-gemini-ai` | Google Gemini (via Replit AI proxy by default) |

---

## Authentication & Session Model

1. User authenticates via `POST /api/auth/login` (Replit OIDC/PKCE) or `POST /api/auth/login-password`.
2. A session record is written to the database. The opaque session token is set as a `sid` cookie.
3. The global `authMiddleware` (line 175 of `app.ts`) is a **session hydrator** — it populates `req.user` and `req.oidcUser` from the session cookie but does not itself reject requests.
4. The `globalAuthEnforcer` middleware (line 385 of `app.ts`) implements **deny-by-default** authentication for all `/api/*` routes. Unauthenticated requests receive `401` unless the path is in the explicit public allowlist (see below).
5. Route-level `authMiddleware({ required: true })` and role guards (`requireRole(...)`) add further enforcement beyond the global gate.

**Public route allowlist** (`global-auth-enforcer.ts`):

*Exact paths:* `/api/contact`, `/api/demo-requests`, `/api/csrf-token`, `/api/docs.json`, `/api/stream/webhook-siem`, `/api/stream/ais-nmea`, `/api/stream/siem-events`, `/api/stream/market-data`, `/api/stream/ais-tracking`, `/api/stream/status`, `/api/federation/health`, `/api/federation/agents`, `/api/prism-counsel/health`, `/api/prism-counsel/readiness`

*Path prefixes:* `/api/health`, `/api/auth/`, `/api/oidc/`, `/api/public/`, `/api/webhooks/`, `/api/scim/`, `/api/stream/webhook/`, `/api/federation/agents/`, `/api/v1/`, `/api/docs/`

All other `/api/*` paths require an authenticated session.

6. WebSocket connections use HMAC-signed tickets (5-minute TTL) issued by `POST /api/auth/ws-ticket`.
7. CSRF protection via double-submit `csrf_token` cookie on all mutating requests.

**RBAC roles (11 total):** `super_admin`, `org_admin`, `org_owner`, `compliance_officer`, `security_analyst`, `operator`, `approver`, `analyst`, `viewer`, `auditor`, `demo`

See `ACCESS-CONTROL-MATRIX.md` for the full role/route/permission mapping and `docs/ACCESS_CONTROL.md` for the policy document.

---

## Multi-Tenancy

- Every user belongs to one or more **organizations** via `org_members` (roles: `owner`, `admin`, `member`, `viewer`).
- All database queries involving org-specific data include `WHERE org_id = ?`.
- The `tenantScope` middleware is applied to: `/api/audit`, `/api/jobs`, `/api/comments`, `/api/documents`, `/api/exports`, `/api/orgs`.
- Domain routes (Alloy, Firestorm, Terra, Vessels) enforce org scope internally within route handlers.

---

## Real-Time

- **WebSocket:** HMAC-signed tickets, per-channel role ACL, automatic reconnection with exponential backoff. Feeds: Firestorm alerts, Vessels AIS, Lyte PRISM signals.
- **SSE:** Command Portal uses Server-Sent Events for real-time 8-domain dashboard updates.
- **Push Notifications:** Mobile apps via VAPID/web-push and Expo push infrastructure.

---

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Framer Motion |
| Mobile | Expo / React Native, NativeWind, expo-auth-session |
| Routing | Wouter (client-side), path-based monorepo routing |
| State | TanStack Query, React Context |
| UI | `@szl-holdings/shared-ui`, Radix UI primitives |
| Backend | Node.js 20, Express 5, TypeScript, esbuild |
| Database | PostgreSQL 16, Drizzle ORM |
| Real-time | WebSocket (ws library), SSE |
| AI / LLM | OpenAI, Anthropic, Google Gemini (via Replit AI proxy) |
| Maps | Mapbox GL JS |
| Payments | Stripe (Checkout, Subscriptions, Invoicing, Customer Portal) |
| PDF | pdfkit (8 branded templates) |
| Email | Resend, SendGrid, nodemailer (multi-provider failover) |
| Monorepo | pnpm workspaces (51 packages) |
| IaC | Azure Bicep |

---

## Agent Network

All agents are advisory — they surface intelligence and recommendations but require explicit human confirmation before executing consequential actions.

| Agent | Domain | Platform | Function |
|-------|--------|----------|----------|
| Helmsman | Maritime | Vessels | Fleet intelligence, route risk, weather analysis |
| Sentinel | Security | Aegis | Threat analysis, incident response, vulnerability triage |
| Compass | Readiness | Alloy | Gap analysis, maturity assessment, improvement roadmaps |
| Navigator | Portfolio | SZL Holdings | Ecosystem navigation, portfolio overview |

---

## Scale

| Metric | Count |
|--------|-------|
| Production web applications | 10 |
| Mobile apps | 2 unified command centers |
| Shared libraries | 37 packages |
| API route files | 172 |
| API endpoints | 2,331 |
| Database tables | 685 (pgTable declarations, verified by `grep -rc "= pgTable" lib/db/src/schema/`) |
| Database schema files | 112 |
| Source files | 1,620 TypeScript files |
| Lines of code | 450,000+ |

---

## Related Documents

| Document | Path |
|----------|------|
| Detailed architecture narrative | `docs/architecture.md` |
| System topology detail | `docs/architecture/system-overview.md` |
| Platform map | `docs/architecture/platform-map.md` |
| Data flow | `docs/architecture/data-flow.md` |
| Data model | `DATA-MODEL.md` |
| API surface catalogue | `API-SPEC.md` |
| Product surfaces | `PRODUCT-SURFACES.md` |
| Access control | `ACCESS-CONTROL-MATRIX.md` |
| Ops runbook | `OPERATIONS-RUNBOOK.md` |
| Deployment guide | `DEPLOYMENT-GUIDE.md` |
