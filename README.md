# SZL Holdings Platform

> [Live Demo](https://szlholdings.com) | [Security](./SECURITY.md) | [Code of Conduct](./CODE_OF_CONDUCT.md) | [Architecture](./docs/architecture/system-overview.md) | [Investor Docs](./docs/investor/platform-thesis.md) | [Trust Center](./docs/trust/trust-center.md)

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![E2E Tests](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/e2e.yml/badge.svg?branch=master)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/e2e.yml)
[![Lighthouse CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/lighthouse.yml/badge.svg?branch=master)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/lighthouse.yml)
[![CodeQL](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/codeql.yml/badge.svg?branch=master)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/codeql.yml)
[![Security Audit](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/security.yml/badge.svg?branch=master)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/security.yml)
![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-proprietary-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Node](https://img.shields.io/badge/Node-20.x-green)
![React](https://img.shields.io/badge/React-19-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)
![Apps](https://img.shields.io/badge/apps-22-gold)
![API_Endpoints](https://img.shields.io/badge/API_endpoints-2%2C331-orange)
![DB_Tables](https://img.shields.io/badge/DB_tables-685-purple)

> Lyte is the command surface. Alloy is the execution fabric. CORTEX is the unified mobile command center. Domain packs extend the same system into security, maritime, real estate, legal, and consulting.

> Business observability must connect to action, not just visualization. AI outputs without traceability create noise, not trust. Every decision should have a signal, a routing path, an approval gate, and an audit trail.

**Stephen Lutar** — Founder & CEO, SZL Holdings

---

## Platform at a Glance

| Metric | Count |
|--------|-------|
| Production Web Applications | 10 |
| Native Mobile Apps (Expo) | 2 unified command centers |
| Shared Libraries | 37 packages |
| API Route Files | 172 backend services |
| API Endpoints | 2,331 |
| Database Tables | 685 |
| Source Files | 1,620 TypeScript files |
| Lines of Code | 450,000+ |
| UI Components | 252 web + 116 mobile screens |

---

## Platform Thesis

Enterprise operations have an accountability gap. Dashboards show what happened. Alerts show what's wrong. Neither tells operators what to do next, who is responsible, or whether the recommended action is safe to execute.

AI tools compound the problem: they add recommendation volume without adding governance. Operators end up with more data, more noise, and more untracked decisions running in parallel.

SZL Holdings builds the **governed operational intelligence layer** — the platform that connects what's observable to what's executable, under governance, with full attribution.

---

## Ecosystem

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                          SZL Holdings Platform                                │
│                                                                               │
│  ┌─────────────────┐    ┌──────────────────────────────────────────────────┐  │
│  │      Lyte       │    │                    Alloy                         │  │
│  │  Business       │◄──►│  Signal Routing · Workflow Orchestration         │  │
│  │  Observability  │    │  Approval Gates · Human-in-the-Loop              │  │
│  │  PRISM Framework│    │  Immutable Audit Trail                           │  │
│  └─────────────────┘    └──────────────────────────────────────────────────┘  │
│                                        │                                      │
│          ┌─────────────────────────────┼─────────────────────────────┐        │
│          ▼                             ▼                             ▼        │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐          │
│  │      Aegis       │   │     Vessels      │   │      Terra       │          │
│  │  Security &      │   │  Maritime Fleet  │   │  Real Estate     │          │
│  │  Defense Intel   │   │  Command         │   │  Intelligence    │          │
│  │  157 components  │   │  83 components   │   │  77 components   │          │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘          │
│                                                                               │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐          │
│  │  PRISM Counsel   │   │    Carlota Jo    │   │    IMPERIUM      │          │
│  │  Legal Matter    │   │  Premium         │   │  Cloud           │          │
│  │  Command         │   │  Advisory        │   │  Sovereignty     │          │
│  │  127 components  │   │  60 components   │   │  Engine          │          │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘          │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │                  CORTEX — Unified Mobile Command                       │   │
│  │     8 domain workspaces · biometric auth · cross-domain signals       │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │              Command Portal — Ecosystem Intelligence Hub               │   │
│  │   Real-time SSE · Cmd+K search · Executive briefing · 8-domain view   │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Products

| Product | Domain | Function | Components | Status |
|---------|--------|----------|------------|--------|
| **Lyte** | Business observability | Command surface — PRISM framework, signal timeline, action queue | 142 | Functional alpha |
| **Alloy** | Execution fabric | Signal routing, approval gates, workflow engine, audit trail | Integrated | Functional alpha |
| **Aegis / Firestorm** | Security & defense | SOC command, SOAR playbooks, threat intelligence, MITRE ATT&CK | 157 | Functional alpha |
| **Vessels** | Maritime intelligence | AIS fleet tracking, sanctions screening, dark activity detection | 83 | Functional alpha |
| **Terra** | Real estate intelligence | Distress signals, ownership graph, deal pipeline, broker workflow | 77 | Functional alpha |
| **PRISM Counsel** | Legal command | Matter management, court filings, multi-jurisdictional compliance | 127 | Functional alpha |
| **Carlota Jo** | Premium advisory | UHNW residential advisory — private intake, client portal | 60 | Live |
| **IMPERIUM** | Cloud sovereignty | Infrastructure control, tenant provisioning, cost governance | 11 | Functional alpha |
| **CORTEX** | Unified mobile | All 8 domain workspaces in one native app — biometric auth, cross-domain signals | 116 screens | Functional alpha |
| **Command Portal** | Ecosystem hub | 8-domain real-time dashboard, executive briefing, global search | 24 | Functional alpha |
| **Stephen Lutar** | Founder site | Professional portfolio and public presence | 58 | Live |

### Lyte — Business Observability (142 components)

The command surface for operators who need to see risk, bottlenecks, ownership gaps, and next actions in one place. PRISM framework: **P**eople, **R**evenue, **I**nfrastructure, **S**ecurity, **M**arket. Signal timeline, correlation engine, priority action queue, and execution accountability. Full AIOps with APM, MSP/RMM tooling, ML pipeline management, and cost governance.

### Alloy — Execution Fabric

Signal normalization, workflow orchestration, approval controls, human-in-the-loop gates, and immutable audit trail. The governance layer that makes AI-assisted operations durable and accountable. Enterprise compliance templates for SOC 2, HIPAA, and financial services.

### Aegis / Firestorm — Security & Defense Intelligence (157 components)

Unified defense platform: SOC command center, MITRE ATT&CK v14 mapping, SOAR playbook engine, STIX/TAXII protocol support, XDR console, AI-assisted triage (Sentinel agent) with human approval gates. Intelligence feeds from AIS, sanctions lists, legal records, and STIX/TAXII sources. 22 database tables covering the complete security lifecycle.

### Vessels — Maritime Intelligence (83 components)

Fleet command, AIS telemetry, route anomaly detection, sanctions screening, voyage economics, dark vessel detection, commodity trading (fills, instruments, orders, positions), marine insurance management, and exception-based workflows. Helmsman AI agent for maritime intelligence. 30+ database tables.

### Terra — Real Estate Intelligence (77 components)

NYC distress property pipeline (public data sources), ownership entity graph, deal pipeline, MLS listing ingestion, commercial property analytics, broker workflow, lead scoring, transaction tracking, and market signal intelligence. 17 database tables.

### PRISM Counsel — Legal Matter Command (127 components)

Full matter management system with court filing integration (NY courts, S31, Purview), document review workflows, multi-jurisdictional support, recovery tracking, and approval chains with audit trail. 120+ legal database tables across 10 schema modules. Rivals standalone LegalTech platforms but with cross-domain intelligence from defense, maritime, and financial verticals.

### Carlota Jo — Premium Advisory (60 components)

White-glove advisory operations for UHNW residential clients. Client profile management, service catalog, booking system, document delivery, client messaging, inquiry tracking, and reservation system. 10 database tables.

### IMPERIUM — Cloud Sovereignty Engine

Multi-tenant infrastructure control plane. Azure tenant provisioning, cost budget governance, ownership control, and compliance monitoring. Built for organizations that need to maintain sovereign control over their cloud infrastructure.

### CORTEX — Unified Mobile Command (116 screens)

All 8 domain workspaces in a single Expo/React Native app. Biometric authentication, workspace switcher with cross-domain badge counts, unified command feed, workspace-adaptive copilot, and SpotlightFab for quick actions. Each workspace inherits its domain accent color and icon set.

### Command Portal — Ecosystem Intelligence Hub (24 components)

Real-time 8-domain dashboard with SSE updates, composite health scoring, per-domain drill-downs, global command bar (Cmd+K), executive briefing view, timeline with filter chips, and severity-based event classification.

### CORTEX — Unified Mobile Command

The consolidated mobile command surface for the SZL Holdings ecosystem. One app, full platform coverage — Lyte, Aegis, Vessels, Terra, and Carlota Jo accessible from a single authenticated session on iOS and Android.

### Command Portal — Ecosystem Hub

Cross-domain signal aggregation and ecosystem monitoring. Provides a unified view across all platform domains — operational health, signal volume, active alerts, and portfolio status in a single command surface.

---

## Screenshots

### Platform Command Surface

| SZL Holdings — Observe · Understand · Decide · Execute | Lyte Command Center — PRISM Framework |
|---|---|
| ![SZL Holdings](screenshots/web-apps/szl-holdings-hero.jpg) | ![Lyte Command](screenshots/web-apps/lyte-command-center-hero.jpg) |
| *Unified SZL Holdings command surface — business observability with explainable execution* | *PRISM framework: People, Revenue, Infrastructure, Security, Market — signal timeline and priority action queue* |

| Lyte Executive Action Queue | Lyte + Alloy — Signal-to-Action |
|---|---|
| ![Lyte Executive](screenshots/web-apps/lyte-executive-command.jpg) | ![Alloy Actions](screenshots/web-apps/lyte-alloy-actions.jpg) |
| *Executive command with approval chains, owner attribution, and audit trail* | *Signal normalization → workflow orchestration → human-in-the-loop approval gates* |

---

### Aegis — Security & Defense Intelligence (157 components)

| SOC Command Center | Web Security Dashboard |
|---|---|
| ![Aegis SOC](screenshots/web-apps/aegis-soc-dashboard.jpg) | ![Aegis Hero](screenshots/web-apps/aegis-hero.jpg) |
| *MITRE ATT&CK v14 mapping, SOAR playbooks, STIX/TAXII threat intel, XDR console, Sentinel AI agent* | *Unified security posture across endpoints, network, cloud, and OT/ICS environments* |

| Aegis Mobile — Field Security Command | Aegis Firestorm — Defense Intelligence |
|---|---|
| ![Aegis Mobile](screenshots/mobile-apps/aegis-mobile-home.jpg) | ![Aegis Firestorm](screenshots/web-apps/aegis-firestorm-hero.jpg) |
| *Full SOC capability in one authenticated mobile session — iOS and Android* | *Firestorm defense intelligence with cross-domain threat correlation and sanctions screening* |

---

### Vessels — Maritime Fleet Intelligence (83 components)

| Fleet Command — AIS Telemetry | Fleet Map — Route Anomaly Detection |
|---|---|
| ![Vessels Fleet Command](screenshots/web-apps/vessels-fleet-command.jpg) | ![Vessels Fleet](screenshots/web-apps/vessels-fleet.jpg) |
| *Real-time AIS tracking, dark vessel detection, voyage economics, commodity trading* | *Route anomaly detection, sanctions screening, and marine insurance in one command surface* |

| Vessels Mobile — Field Fleet Tracking | Vessels Platform |
|---|---|
| ![Vessels Mobile](screenshots/mobile-apps/vessels-mobile-fleet.jpg) | ![Vessels](screenshots/web-apps/vessels-hero.jpg) |
| *Fleet command from the field — AIS, anomalies, sanctions, and voyage data on iOS/Android* | *Helmsman AI agent for maritime intelligence with human-approved action execution* |

---

### Terra — Real Estate Intelligence (77 components)

| Property Intelligence Dashboard | Deal Pipeline |
|---|---|
| ![Terra Dashboard](screenshots/web-apps/terra-dashboard.jpg) | ![Terra Pipeline](screenshots/web-apps/terra-pipeline.jpg) |
| *NYC distress property pipeline, ownership entity graph, MLS ingestion, lead scoring* | *Broker workflow, deal pipeline, transaction tracking, and market signal intelligence* |

| Terra Hero | Terra Mobile |
|---|---|
| ![Terra Hero](screenshots/web-apps/terra-hero.jpg) | ![Terra Mobile](screenshots/mobile-apps/terra-mobile-home.jpg) |
| *Public data sources feeding real-time distress signals and ownership graph* | *Full real estate intelligence from mobile — property search, pipeline, and market signals* |

---

### PRISM Counsel — Legal Matter Command (127 components)

| Matter Management | Legal Platform |
|---|---|
| ![PRISM Counsel](screenshots/web-apps/prism-counsel-hero.jpg) | ![PRISM Counsel Demo](screenshots/web-apps/prism-counsel-demo.jpg) |
| *Court filing integration, multi-jurisdictional compliance, recovery tracking, approval chains* | *120+ legal database tables across 10 schema modules — cross-domain intelligence from defense and maritime* |

---

### Command Portal — Ecosystem Intelligence Hub

![Command Portal](demo-assets/screenshots/command-hero.jpg)
*Real-time 8-domain dashboard with SSE updates, composite health scoring, global Cmd+K search, executive briefing view, and per-domain drill-downs.*

---

### Carlota Jo — Premium Advisory (60 components)

| Client Operations | Advisory Dashboard |
|---|---|
| ![Carlota Jo](screenshots/web-apps/carlota-jo-hero.jpg) | ![Carlota Jo Operator](screenshots/web-apps/carlota-jo-operator.jpg) |
| *White-glove UHNW advisory — private intake, client portal, service catalog, document delivery* | *Operator view: client messaging, booking, reservation management, inquiry tracking* |

---

### CORTEX — Unified Mobile Command (116 screens)

All 8 domain workspaces in a single Expo/React Native app with biometric authentication, workspace-adaptive AI copilot, and cross-domain badge counts.

| Aegis Mobile | Vessels Mobile | Terra Mobile |
|---|---|---|
| ![Aegis Mobile](screenshots/mobile-apps/aegis-mobile-home.jpg) | ![Vessels Mobile](screenshots/mobile-apps/vessels-mobile-home.jpg) | ![Terra Mobile](screenshots/mobile-apps/terra-mobile-home.jpg) |

---

## Architecture

```
External Signals (integrations, telemetry, data feeds, intelligence sources)
        │
        ▼
  Signal Normalization (Alloy + PRISM Bus)
        │
        ▼
  Context Engine (correlation, attribution, severity scoring)
        │
        ▼
  Routing Logic (priority classification, role assignment, domain routing)
        │
   ┌────┴────────────────────────────────┐
   ▼                                     ▼
Auto-Execute (policy-approved)    Human Review Gate
   │                                     │
   └────────────────┬────────────────────┘
                    ▼
             Action Execution
                    │
                    ▼
          Immutable Audit Trail (append-only, actor-attributed, proof-chain)
```

### Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (full stack) |
| Frontend | React 19, Vite, Tailwind CSS, Framer Motion, Recharts |
| Mobile | Expo / React Native, NativeWind |
| Backend | Express 5, Node.js |
| Database | PostgreSQL 16, Drizzle ORM |
| AI | HuggingFace Inference (Qwen3-8B), evidence-backed hybrid retrieval, 9 schema-validated decision types |
| Auth | OIDC/PKCE, session-based, 11-role RBAC, SCIM 2.0, Azure AD multi-tenant SSO |
| Infra | pnpm monorepo, 51 packages, Azure (App Service, PostgreSQL Flexible, Key Vault, Redis, CDN) |
| Event System | PRISM Bus (cross-domain event bus), Forge Runtime (agent execution engine) |
| Real-time | SSE, WebSocket, push notifications |

### Shared Libraries (37 packages)

| Library | Purpose |
|---------|---------|
| `prism-bus` | Cross-domain event bus connecting all verticals |
| `forge-runtime` | Agent execution engine with policy gates |
| `ai-engine` | AI orchestration — model routing, safety rails, telemetry |
| `intelligence-feeds` | Threat intel ingestion (STIX/TAXII, AIS, sanctions, legal) |
| `covenant-policy` | Policy engine for governance and compliance |
| `proof-chain` | Cryptographic audit trail with append-only verification |
| `monte-carlo` | Financial simulation engine for risk modeling |
| `crdt-sync` | Conflict-free replicated data types for real-time collaboration |
| `observability` | Full telemetry stack — metrics, traces, structured logging |
| `worldline` | Global signal publication and routing |
| `receipt-graph` | Financial receipt tracking and reconciliation |
| `outcome-graph` | Decision outcome modeling and attribution |
| `offline-engine` | Offline-first data sync for mobile |
| `mcp-client` | Model Context Protocol for AI tool use |
| `mobile-shared` | Shared mobile components and navigation |
| `shared-ui` | Design system tokens and shared components |
| `api-spec` | OpenAPI specification and code generation |
| `auth` | Authentication middleware and session management |
| `db` | Database schema (685 tables), migrations, and query builders |

**Infrastructure:** Azure (App Service, PostgreSQL Flexible, Key Vault, Redis, CDN). IaC via Bicep templates.

**Scale:** 16 deployable artifacts, 120+ database tables, 8 web apps, 1 unified mobile app (CORTEX — all domains).

---

## Trust

An AI-assisted operations platform carries a distinct trust burden. SZL Holdings addresses it structurally:

| Concern | Approach |
|---------|----------|
| **AI without oversight** | Advisory agents cannot execute consequential actions without explicit human confirmation — enforced at the Alloy workflow layer |
| **Opaque AI outputs** | All recommendations include source citations, confidence scores, and retrieval provenance |
| **Audit accountability** | Every action, approval, and decision generates an immutable audit event with actor attribution via proof-chain |
| **Access control** | 11-role RBAC with org-scoped tenant isolation. Every route and WebSocket channel is access-controlled |
| **Multi-tenancy** | All database queries include org_id scoping — cross-tenant access is architecturally prevented |
| **Data in transit** | TLS 1.3 for all connections. HMAC-signed WebSocket tickets with 5-minute TTL |
| **Cross-domain isolation** | PRISM Bus ensures domain events are routed with provenance — no lateral data leakage between verticals |

See [Trust Center](docs/trust/trust-center.md) · [Security Posture](docs/trust/security-posture.md)

---

## Local Development Setup

```bash
# Clone the repository
git clone https://github.com/szl-holdings/szl-holdings-platform.git
cd szl-holdings-platform

# Install all workspace dependencies
pnpm install

# Start all services (API + web apps)
pnpm dev
```

Individual artifacts can be started with `pnpm --filter @workspace/<artifact-name> dev`. See each artifact's `README` or `package.json` for environment variable requirements.

---

## Deployment

| Environment | Purpose | Trigger |
|-------------|---------|---------|
| **Replit Workspace** | Active development, internal preview | Always on |
| **Staging** | Integration validation before production | Auto on push to `main` via `deploy-staging.yml` |
| **Production** | Customer-facing deployment | On published release via `deploy-production.yml` |

See [Deployment Model](docs/trust/deployment-model.md) · [Branch Protection & CI/CD Settings](.github/BRANCH_PROTECTION.md)

---

## Documentation Map

### Canonical Technical Reference (root-level)

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System-level architecture overview — service topology, artifact map, shared libraries, data flow, infrastructure |
| [API-SPEC.md](API-SPEC.md) | Catalogue of all API surfaces (REST routes, GraphQL, MCP tools) with auth requirements and example payloads |
| [DATA-MODEL.md](DATA-MODEL.md) | Database schema overview — 685 tables, domain groupings, key relationships, Drizzle ORM conventions |
| [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) | Map of every user-facing artifact with purpose, audience, and entry points |
| [OPERATIONS-RUNBOOK.md](OPERATIONS-RUNBOOK.md) | Consolidated ops runbook — monitoring, incident triage, failure modes, database operations |
| [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) | Step-by-step deployment for staging and production (Replit, Azure, CI/CD) |
| [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) | Role/route/permission mappings for all artifacts |
| [ANALYTICS-EVENTS.md](ANALYTICS-EVENTS.md) | Canonical event reference — naming conventions, event registry, properties, funnels |

### Architecture & Design

| Area | Document |
|------|----------|
| System architecture narrative | [docs/architecture.md](docs/architecture.md) |
| System topology detail | [docs/architecture/system-overview.md](docs/architecture/system-overview.md) |
| Platform map | [docs/architecture/platform-map.md](docs/architecture/platform-map.md) |
| Data flow | [docs/architecture/data-flow.md](docs/architecture/data-flow.md) |

### Trust & Security

| Area | Document |
|------|----------|
| Trust center | [docs/trust/trust-center.md](docs/trust/trust-center.md) |
| Security posture | [docs/trust/security-posture.md](docs/trust/security-posture.md) |
| Access control policy | [docs/ACCESS_CONTROL.md](docs/ACCESS_CONTROL.md) |
| Secrets policy | [docs/SECRETS_POLICY.md](docs/SECRETS_POLICY.md) |

### Investor & Product

| Area | Document |
|------|----------|
| Platform thesis | [docs/investor/platform-thesis.md](docs/investor/platform-thesis.md) |
| Product readiness | [docs/investor/product-readiness.md](docs/investor/product-readiness.md) |
| Investor overview | [docs/investor/investor-overview.md](docs/investor/investor-overview.md) |
| Platform overview | [docs/PLATFORM_OVERVIEW.md](docs/PLATFORM_OVERVIEW.md) |
| Product matrix | [docs/PRODUCT_MATRIX.md](docs/PRODUCT_MATRIX.md) |
| Buyer use cases | [docs/buyer/use-cases.md](docs/buyer/use-cases.md) |
| Deployment model | [docs/trust/deployment-model.md](docs/trust/deployment-model.md) |

### Operations & Development

| Area | Document |
|------|----------|
| Ops runbook (source) | [docs/ops-runbook.md](docs/ops-runbook.md) |
| Replit operations | [REPLIT_OPERATIONS.md](REPLIT_OPERATIONS.md) |
| Environment variable matrix | [ENV_MATRIX.md](ENV_MATRIX.md) |
| Deployment readiness checklist | [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md) |
| Route inventory | [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) |
| Analytics plan | [ANALYTICS_PLAN.md](ANALYTICS_PLAN.md) |
| Disaster recovery | [docs/disaster-recovery.md](docs/disaster-recovery.md) |
| Backup & recovery | [BACKUP_AND_RECOVERY.md](BACKUP_AND_RECOVERY.md) |

### Process & Governance

| Area | Document |
|------|----------|
| Release process | [RELEASE_PROCESS.md](RELEASE_PROCESS.md) |
| Release checklist | [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| Release notes | [docs/releases/v0.1.0.md](docs/releases/v0.1.0.md) |
| Incident response | [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) |
| Security disclosure | [SECURITY.md](SECURITY.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |

---

## Start Here

| You are... | Start with |
|------------|------------|
| **Investor** | [Platform Thesis](docs/investor/platform-thesis.md) → [Product Readiness](docs/investor/product-readiness.md) → [Why Now](docs/investor/why-now.md) |
| **Technical Reviewer** | [Architecture](docs/architecture/system-overview.md) → [Data Flow](docs/architecture/data-flow.md) → [Trust Center](docs/trust/trust-center.md) |
| **Enterprise Buyer** | [Trust Center](docs/trust/trust-center.md) → [Use Cases](docs/buyer/use-cases.md) → [Solution Brief](docs/buyer/solution-brief.md) |
| **Design/Product** | [Platform Map](docs/architecture/platform-map.md) → [Solution Brief](docs/buyer/solution-brief.md) |

---

## Technical Due Diligence Guide

For engineering reviewers conducting Series A technical diligence, here is a structured starting point:

### Architecture & Code Quality

- **Monorepo structure** — `pnpm` workspaces with TypeScript project references. All cross-app logic lives in `lib/`. Artifacts are isolated deployable units under `artifacts/`.
- **Type safety** — Strict TypeScript throughout. Zod schemas validate all API boundaries. No `any` types without justification.
- **API discipline** — OpenAPI 3.1 specification in `lib/api-spec/`. Generated React Query hooks in `lib/api-client-react/`. GraphQL via Apollo Server.
- **Database** — Drizzle ORM, PostgreSQL, per-domain table namespacing, all queries org-scoped. Schema + migrations in `lib/db/`.
- **CI gates** — Lint, typecheck, unit tests, dependency audit, secret scan, and full build on every PR. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

### Security Posture

- OIDC/PKCE auth — no password storage. 11-role RBAC with org scoping on every route.
- HMAC-signed WebSocket tickets (5-minute TTL). TLS 1.3 for all connections.
- AI agents advisory-only — consequential actions require explicit human approval, enforced at workflow layer.
- Immutable audit trail on every significant action. See [Security Policy](SECURITY.md) and [Trust Center](docs/trust/trust-center.md).

### AI Governance

- Multi-provider inference (OpenAI, Anthropic, Gemini) via `lib/ai-engine/` with schema-validated output types.
- 9 validated decision types. Evidence-backed retrieval with confidence scores on all recommendations.
- Policy-gated tool execution — advisory agents cannot execute without human confirmation.

### Scalability & Infrastructure

- Azure-ready IaC (Bicep templates in `infra/`). App Service, PostgreSQL Flexible Server, Key Vault, Redis, CDN.
- Background job infrastructure for webhooks, reports, notifications, and health scans.
- Multi-tenant architecture — `org_id` scoping at database layer prevents cross-tenant access.

### Key Files for Reviewers

| Area | File |
|------|------|
| System architecture (canonical) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| API surface catalogue (canonical) | [API-SPEC.md](API-SPEC.md) |
| Data model (canonical) | [DATA-MODEL.md](DATA-MODEL.md) |
| Access control matrix (canonical) | [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) |
| Product surfaces (canonical) | [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) |
| System architecture narrative | [docs/architecture/system-overview.md](docs/architecture/system-overview.md) |
| Platform map | [docs/architecture/platform-map.md](docs/architecture/platform-map.md) |
| Security policy | [SECURITY.md](SECURITY.md) |
| Trust center | [docs/trust/trust-center.md](docs/trust/trust-center.md) |
| Product readiness | [docs/investor/product-readiness.md](docs/investor/product-readiness.md) |
| CI configuration | [.github/workflows/ci.yml](.github/workflows/ci.yml) |
| Database schema | `lib/db/src/schema/` |
| API specification (OpenAPI) | `lib/api-spec/openapi.yaml` |

---

## Release Status

**Current:** v0.1.0 — Platform Ecosystem Release (April 2026)

**Highlights:**
- 10 production web applications across 8 industry verticals
- CORTEX unified mobile command center (all domains in one native app)
- Command Portal with real-time SSE, executive briefing, global search
- 685 database tables, 2,331 API endpoints, 37 shared libraries
- Full audit trail, approval chains, and AI governance

**Phase 2 (active):** Azure production deployment, Stripe billing activation, enterprise SSO, OpenAPI developer portal.

See [CHANGELOG.md](CHANGELOG.md)

---

## License

Proprietary. All rights reserved. See [LICENSE.md](LICENSE.md).

---

## Contact

**Stephen Lutar** — Founder & CEO, SZL Holdings

| Purpose | Contact |
|---------|---------|
| Enterprise inquiries, design partner | [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com) |
| Investment conversations | [stephen@szlholdings.com](mailto:stephen@szlholdings.com) |
| Security disclosures | [security@szlholdings.com](mailto:security@szlholdings.com) |
| Website | [szlholdings.com](https://szlholdings.com) |
| LinkedIn | [linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240) |
