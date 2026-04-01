# SZL Holdings — Platform Ecosystem

**Business observability and execution accountability — built to operate where unreliability isn't recoverable.**

SZL Holdings is built around a focused operating wedge: **Lyte + Alloy**. Lyte is the business observability engine — PRISM-powered signal detection, risk interpretation, and action routing. Alloy is the execution fabric — the workflow engine, audit trail, and orchestration layer that makes every action traceable and every outcome verifiable.

Together, Lyte + Alloy deliver *business observability and execution accountability* to organizations that can't afford to discover problems after the fact.

Founded and operated by [Stephen Lutar](https://linkedin.com/in/stephen-l-279315240).

[![CI](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/ci.yml)
[![Build](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/build.yml)
[![Deploy](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/deploy.yml)

---

## The Operating Wedge: Lyte + Alloy

**Lyte** defines the category of Business Observability — making every operational surface visible, contextual, and actionable through the PRISM framework:

- **P**ulse — Business health, operating heartbeat, trend status
- **R**isk — Approvals, churn, delays, ownership gaps, regulatory exposure
- **I**ntelligence — Modeled reasoning, evidence, confidence, likely outcomes
- **S**ignals — Anomalies, changes, event spikes, workflow drift
- **M**otion — Escalations, routing, approvals, interventions, execution

**Alloy** is the execution fabric that closes the loop — workflow engine, human-in-the-loop gates, audit trail, and agent coordination. When Lyte surfaces a signal, Alloy routes the action, tracks the response, and creates the immutable record. Every consequential decision is attributed, auditable, and verifiable.

The combination creates a single operating system for organizations where execution drift compounds into operational failure.

---

## Broader Ecosystem

The Lyte + Alloy wedge is the foundation. The same architecture — shared data layer, shared execution fabric, shared AI engine — extends to four additional domain verticals:

| Platform | Domain | Expansion Path |
|----------|--------|---------------|
| **Aegis** | Unified Defense & Intelligence | Security observability on the same PRISM backbone |
| **Terra** | NYC Real Estate Intelligence | Property signal → deal execution through Alloy |
| **Vessels** | Maritime Intelligence & Fleet Operations | Fleet telemetry → operational decisions through Alloy |
| **Carlota Jo** | Private Advisory & Strategy | Principal advisory grounded in platform intelligence |

These platforms share one architecture. Each one is an expansion path built on the same infrastructure — not a separate product requiring separate infrastructure investment.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  ADVISE                                                             │
│  Carlota Jo — Private Advisory & Strategy Consulting                │
├─────────────────────────────────────────────────────────────────────┤
│  EXECUTE                                                            │
│  Alloy — Execution Fabric, Workflow Engine, Audit Trail             │
├─────────────────────────────────────────────────────────────────────┤
│  OBSERVE · DECIDE · ACT                                             │
│  Lyte — Business Observability (PRISM Framework)    ← Operating Wedge │
│  Aegis — Unified Defense & Intelligence             ← Expansion     │
│  Terra — NYC Real Estate Intelligence               ← Expansion     │
│  Vessels — Maritime Intelligence & Fleet Operations ← Expansion     │
└─────────────────────────────────────────────────────────────────────┘
```

This is a **pnpm monorepo** with a shared TypeScript foundation. Every frontend artifact is a Vite + React SPA. The API server is a single Express process serving all platform backends. PostgreSQL (Drizzle ORM) is the persistence layer. WebSocket provides real-time push to all clients.

```
/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API — all platform backends
│   ├── szl-holdings/       # SZL Holdings — corporate site + Alloy console
│   ├── lyte-command-center/# Lyte — Business Observability
│   ├── firestorm/          # Aegis — Defense & Intelligence
│   ├── terra/              # Terra — Real Estate Intelligence
│   ├── vessels/            # Vessels — Maritime Intelligence
│   ├── carlota-jo/         # Carlota Jo — Advisory web app
│   ├── carlota-jo-mobile/  # Carlota Jo — Expo/React Native client app
│   └── stephen-site/       # Stephen Lutar — founder authority site
├── lib/                    # Shared libraries
│   ├── db/                 # Drizzle schema, migrations, seed
│   ├── shared-ui/          # Cross-app React components
│   ├── auth/               # OIDC authentication
│   ├── config/             # Shared configuration
│   ├── services/           # Business logic services
│   ├── workflow-engine/    # Alloy execution fabric
│   ├── ai-engine/          # AI/ML integration layer
│   ├── analytics/          # Event tracking
│   ├── audit/              # Compliance audit trail
│   ├── data-connectors/    # External data source adapters
│   ├── observability/      # APM, logging, metrics
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Zod schema validation
│   ├── api-spec/           # OpenAPI specification
│   └── graphql-client/     # GraphQL client
├── packages/               # Marketplace packages
│   ├── salesforce-appexchange/ # Salesforce AppExchange package
│   └── atlassian-connect/  # Jira Marketplace Connect app
├── infra/                  # Azure Bicep IaC templates
├── scripts/                # Seed data, post-merge hooks
├── docs/                   # Architecture, trust, deployment docs
└── social-content/         # Brand assets, social media content
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4, Recharts |
| Backend | Express, TypeScript, esbuild |
| Database | PostgreSQL, Drizzle ORM |
| Auth | OpenID Connect (PKCE), session cookies |
| Real-time | WebSocket (HMAC-signed tickets, per-channel ACL) |
| AI | OpenAI, Anthropic, Google Gemini (via integration proxies) |
| Payments | Stripe (Checkout, Subscriptions, Invoicing, Customer Portal) |
| Maps | Mapbox GL JS (Terra property maps, Vessels fleet tracking) |
| Mobile | Expo / React Native (Carlota Jo client app) |
| PDF | pdfkit (server-side document generation, 8 templates) |
| Email | Resend / SendGrid / SMTP (multi-provider with fallback) |
| Notifications | Slack webhooks, Microsoft Teams webhooks, WebSocket push |
| Infra | Azure Bicep (App Service, PostgreSQL, Key Vault, Redis, CDN) |
| Marketplace | Salesforce AppExchange, Jira Marketplace (Connect app) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env
# Edit .env with your database URL and secrets

# Push database schema
pnpm --filter db push

# Seed demo data (optional)
pnpm --filter scripts run seed

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start any frontend app
pnpm --filter @workspace/lyte-command-center run dev
pnpm --filter @workspace/firestorm run dev
pnpm --filter @workspace/terra run dev
pnpm --filter @workspace/vessels run dev
pnpm --filter @workspace/szl-holdings run dev
pnpm --filter @workspace/stephen-site run dev
pnpm --filter @workspace/carlota-jo run dev
```

### Build

```bash
# Build all artifacts
pnpm -r build

# Build specific app
pnpm --filter @workspace/lyte-command-center build
pnpm --filter @workspace/api-server build
```

---

## App Inventory

### Lyte — Business Observability

*"In the dark, let Lyte guide you."*

The flagship platform and operating wedge. Lyte defines the category of **Business Observability** — the discipline of making every operational surface visible, contextual, and actionable. Built on the **PRISM** analytical framework (Pulse / Risk / Intelligence / Signals / Motion).

40+ connector integrations. 7 Pillars of Business Observability doctrine.

### Alloy — Execution Fabric

The internal platform that closes the loop. When Lyte surfaces a signal, Alloy routes the action. Workflow engine, audit trail, human-in-the-loop gates, and agent coordination — the infrastructure layer that makes business observability and execution accountability a reality.

### Aegis — Unified Defense & Intelligence

*"One platform. Three workspaces. One shared intelligence layer."*

Enterprise cybersecurity and managed services command console. Three workspaces sharing one data context: Defense (SOC operations), Command (managed operations), Labs (AI research). Built on the same PRISM observability backbone as Lyte.

### Terra — NYC Real Estate Intelligence

*"The distress intelligence platform built for NYC real estate."*

Property intelligence for brokers, investors, and portfolio teams. Surfaces distressed properties, tracks ownership structures, manages deal pipelines. Executes through Alloy's workflow fabric.

### Vessels — Maritime Intelligence

*"Fleet operations. Decided faster."*

Maritime command platform for fleet operators. Real-time AIS telemetry, voyage economics, route intelligence, dark vessel detection, sanctions screening. All execution flows through Alloy.

### Carlota Jo — Private Advisory & Strategy

Luxury consulting platform for brand strategy, advisory, and client engagement. Web app + native mobile client (Expo/React Native). Principal advisory grounded in platform intelligence.

### SZL Holdings — Corporate Site

The parent company site. Ecosystem overview, investor relations, trust center, compliance documentation, and contact. Presents the unified platform hierarchy with Lyte + Alloy as the operating wedge.

### Stephen Lutar — Founder Authority Site

Professional portfolio and founder positioning site. Work showcase, thesis writing, career command, case studies, and contact.

---

## Authentication

All apps use **OpenID Connect** with PKCE flow. The API server validates sessions via cookie or Bearer token. WebSocket connections use HMAC-signed tickets with 5-minute TTL and per-channel role-based access control.

Roles: `founder_admin`, `admin`, `operator`, `analyst`, `viewer`, `client`.

Mobile (Expo) uses `expo-auth-session` for native OIDC with SecureStore token persistence.

---

## Payments & Billing

Stripe powers all commercial flows:

- **Carlota Jo**: Session bookings via Stripe Checkout
- **Terra**: Starter/Pro subscription tiers with annual discount
- **Aegis**: Enterprise quotes via Stripe Invoicing or Checkout
- **Lyte**: Self-serve and enterprise pricing
- **Vessels**: Enterprise sales model (contact-driven)

---

## PDF Document Generation

Server-side PDF generation via pdfkit with 8 branded templates:

| Template | Context |
|----------|---------|
| `stephen-resume` | Stephen Lutar professional resume |
| `szl-investor-letter` | Investor communications |
| `szl-compliance-summary` | Compliance documentation |
| `szl-portfolio-report` | Portfolio performance report |
| `terra-property-report` | Property analysis with distress scoring |
| `aegis-assessment-report` | Security assessment |
| `firestorm-incident-summary` | Incident post-mortem |
| `carlota-engagement-summary` | Client engagement summary |

---

## Security & Trust

- CSRF protection (double-submit cookie pattern) on all mutation endpoints
- GraphQL depth limiting (max 10 levels)
- WebSocket connection limits (max 500 concurrent)
- HMAC-signed WebSocket tickets with TTL
- Role-based access control on all API routes
- Constant-time comparison for webhook secret validation
- No secrets in client bundles — all sensitive config server-side only

See [docs/trust-center.md](docs/trust-center.md) for the full security posture.

---

## Deployment

### Replit (Primary — Development & Staging)

The live workspace runs on Replit with automatic HTTPS, PostgreSQL, and environment secret management. Each artifact binds to a unique port via the `PORT` environment variable.

### Azure (Production — Enterprise)

Full Azure Bicep IaC in `/infra/`:
- App Service (Node.js 20 LTS)
- Azure Database for PostgreSQL Flexible Server
- Azure Key Vault (secrets management)
- Azure Redis Cache (session store)
- Azure CDN (static asset delivery)
- Application Insights (APM)

See [docs/deployment.md](docs/deployment.md) for full deployment guide.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System architecture, data flow, service boundaries |
| [Trust Center](docs/trust-center.md) | Security posture, compliance, AI governance |
| [Deployment](docs/deployment.md) | Deployment strategies, Azure IaC, CI/CD |
| [Integrations](docs/integrations.md) | Third-party integrations, secrets map, connectors |
| [Product Matrix](docs/product-matrix.md) | Platform inventory, naming, lane ownership |
| [Investor Narrative](docs/investor-narrative.md) | Company thesis, market positioning |

---

## Entity Ownership & Legal

SZL Holdings is a private operating company. All platforms, IP, and trademarks are owned by SZL Holdings. Stephen Lutar is the founder and sole officer.

**Contact**: [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com) · [LinkedIn](https://linkedin.com/in/stephen-l-279315240)

---

## License

Proprietary. All rights reserved. SZL Holdings.
