# SZL Holdings — Platform Ecosystem

**Business observability and execution accountability — built to operate where unreliability isn't recoverable.**

SZL Holdings is a technology holding company operating a unified ecosystem of command-grade software platforms. Five domain verticals — business observability, defense intelligence, real estate intelligence, maritime operations, and premium advisory — share one intelligence backbone, one execution fabric, one design system, and one data layer.

The operating wedge is **Lyte + Alloy**: Lyte surfaces operational signals across an organization's full system; Alloy routes those signals to verified, auditable action. Together, they deliver business observability and execution accountability to organizations where execution drift compounds into operational failure.

Founded and operated by [Stephen Lutar](https://linkedin.com/in/stephen-l-279315240).

[![CI](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/ci.yml)
[![Build](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/build.yml)
[![Deploy](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/deploy.yml)

---

## Platform Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│  ADVISE                                                             │
│  Carlota Jo — Private Advisory & Strategy                           │
│  Principal advisory grounded in platform intelligence               │
├─────────────────────────────────────────────────────────────────────┤
│  EXECUTE                                                            │
│  Alloy — Execution Fabric                                           │
│  Workflow engine · Audit trail · Human-in-the-loop gates            │
├─────────────────────────────────────────────────────────────────────┤
│  OBSERVE · DECIDE · ACT                                             │
│  Lyte             Aegis             Terra          Vessels          │
│  Business         Defense &         Real Estate    Maritime         │
│  Observability    Intelligence      Intelligence   Intelligence     │
│  PRISM Framework  Defense/Cmd/Labs  NYC Distress   Fleet & AIS     │
└─────────────────────────────────────────────────────────────────────┘
```

### Lyte — Business Observability

The flagship platform. Lyte defines the category of **Business Observability** — making every operational surface visible, contextual, and actionable through the **PRISM** analytical framework:

- **P**ulse — Business health, operating heartbeat, trend status
- **R**isk — Approvals, churn, delays, ownership gaps, regulatory exposure
- **I**ntelligence — Modeled reasoning, evidence, confidence, likely outcomes
- **S**ignals — Anomalies, changes, event spikes, workflow drift
- **M**otion — Escalations, routing, approvals, interventions, execution

40+ connector integrations. Role-aware dashboards. Signal-to-action lifecycle with full audit trail.

### Alloy — Execution Fabric

The orchestration engine that closes the loop. When Lyte surfaces a signal, Alloy routes the action. Workflow engine, human-in-the-loop approval gates, agent coordination, and immutable audit trail — the infrastructure that makes observability and accountability a single system.

### Aegis — Unified Defense & Intelligence

Enterprise cybersecurity and managed services command. Three unified workspaces sharing one intelligence context: **Defense** (SOC operations, SOAR playbooks, XDR), **Command** (managed services operations, client SLA management), and **Intelligence** (AI research, model governance, experiment tracking). Built on the same PRISM observability backbone as Lyte.

### Terra — Real Estate Intelligence

Property intelligence for NYC brokers, investors, and portfolio teams. Live distress data pipeline integrating public data sources. Ownership structure tracking, deal pipeline management via Alloy, and market signal intelligence.

### Vessels — Maritime Intelligence

Fleet command for maritime operators. Real-time AIS telemetry, voyage economics, route intelligence, dark vessel detection, and sanctions screening. All execution flows through Alloy.

### Carlota Jo — Private Advisory

Luxury consulting platform for brand strategy, advisory, and client engagement. Web app plus native mobile client (Expo/React Native). Principal advisory informed by platform-grade intelligence.

---

## Repository Structure

This is a **pnpm monorepo** with a shared TypeScript foundation. Every frontend artifact is a Vite + React SPA. The API server is a single Express process serving all platform backends. PostgreSQL with Drizzle ORM is the persistence layer. WebSocket provides real-time push to all clients.

```
/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API — all platform backends
│   ├── szl-holdings/       # SZL Holdings — corporate site
│   ├── lyte-command-center/# Lyte — Business Observability
│   ├── firestorm/          # Aegis — Defense & Intelligence
│   ├── terra/              # Terra — Real Estate Intelligence
│   ├── vessels/            # Vessels — Maritime Intelligence
│   ├── carlota-jo/         # Carlota Jo — Advisory web app
│   ├── carlota-jo-mobile/  # Carlota Jo — Expo/React Native client
│   ├── szl-holdings-mobile/# SZL Holdings — Executive mobile command
│   ├── aegis-mobile/       # Aegis — Mobile SOC command
│   ├── vessels-mobile/     # Vessels — Fleet command mobile
│   ├── lyte-mobile/        # Lyte — AIOps mobile command
│   └── stephen-site/       # Stephen Lutar — Founder authority site
├── lib/                    # Shared libraries
│   ├── db/                 # Drizzle schema, migrations, seed
│   ├── shared-ui/          # Cross-app React component library
│   ├── auth/               # OIDC authentication
│   ├── services/           # Business logic and third-party adapters
│   ├── workflow-engine/    # Alloy execution fabric
│   ├── ai-engine/          # AI inference and orchestration layer
│   ├── audit/              # Compliance audit trail
│   ├── analytics/          # Event tracking
│   ├── observability/      # APM, logging, metrics
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Zod schema validation
│   ├── api-spec/           # OpenAPI specification
│   └── graphql-client/     # GraphQL client
├── packages/               # Marketplace packages
│   ├── salesforce-appexchange/ # Salesforce AppExchange package
│   └── atlassian-connect/  # Jira Marketplace Connect app
├── infra/                  # Azure Bicep IaC templates
├── scripts/                # Seed data, post-merge automation
├── docs/                   # Architecture, trust, deployment documentation
└── social-content/         # Brand assets
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Express, TypeScript, Node.js, esbuild |
| Database | PostgreSQL, Drizzle ORM |
| Auth | OpenID Connect (PKCE), organization-scoped RBAC |
| Real-time | WebSocket (HMAC-signed tickets, per-channel ACL) |
| AI | OpenAI, Anthropic, Google Gemini |
| Payments | Stripe (Checkout, Subscriptions, Invoicing, Customer Portal) |
| Maps | Mapbox GL JS (Terra property maps, Vessels fleet tracking) |
| Mobile | Expo / React Native |
| PDF | pdfkit (server-side generation, 8 branded templates) |
| Email | Resend / SendGrid / SMTP (multi-provider with failover) |
| Notifications | Slack webhooks, Microsoft Teams webhooks, WebSocket push |
| Infra | Azure Bicep (App Service, PostgreSQL, Key Vault, Redis, CDN) |
| API | OpenAPI 3.1, GraphQL (Apollo Server), generated client hooks |
| Marketplace | Salesforce AppExchange, Jira Marketplace (Atlassian Connect) |

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
# Edit .env — add DATABASE_URL and required secrets

# Push database schema
pnpm --filter db push

# Seed demo data (optional)
pnpm --filter scripts run seed

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start a frontend application
pnpm --filter @workspace/lyte-command-center run dev
pnpm --filter @workspace/firestorm run dev
pnpm --filter @workspace/terra run dev
pnpm --filter @workspace/vessels run dev
pnpm --filter @workspace/szl-holdings run dev
pnpm --filter @workspace/carlota-jo run dev
pnpm --filter @workspace/stephen-site run dev
```

### Build

```bash
# Build all artifacts
pnpm -r build

# Build a specific application
pnpm --filter @workspace/lyte-command-center build
pnpm --filter @workspace/api-server build
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Session signing secret — generate with `openssl rand -hex 32` |
| `ISSUER_URL` | Yes | OIDC provider URL |
| `STRIPE_SECRET_KEY` | Optional | Activates payment flows when set |
| `RESEND_API_KEY` | Optional | Activates transactional email |
| `OPENAI_API_KEY` | Optional | Direct OpenAI access (proxy available by default) |
| `MAPBOX_ACCESS_TOKEN` | Optional | Activates map views in Terra and Vessels |

All services have graceful fallbacks when optional keys are absent. See `.env.example` for the complete variable reference.

---

## Screenshots

![SZL Holdings](docs/screenshots/szl-holdings-home.jpg)
*SZL Holdings corporate platform — ecosystem overview and investor relations*

![Lyte Business Observability](docs/screenshots/lyte-marketing.jpg)
*Lyte — Business Observability platform with PRISM framework*

![Lyte PRISM Dashboard](docs/screenshots/lyte-prism-pulse.jpg)
*Lyte PRISM command surface — Pulse, Risk, Intelligence, Signals, Motion*

![Aegis Defense Intelligence](docs/screenshots/aegis-soc-dashboard.jpg)
*Aegis — SOC command dashboard with threat intelligence integration*

![Terra Real Estate](docs/screenshots/terra-marketing.jpg)
*Terra — NYC real estate intelligence and distress data platform*

![Vessels Maritime](docs/screenshots/vessels-dashboard.jpg)
*Vessels — Fleet command dashboard with AIS telemetry*

---

## What This Repo Demonstrates

This codebase demonstrates the full scope of a production-grade, multi-product software platform built under founder-led technical program management:

**Multi-product platform architecture** — Five domain platforms and one execution fabric sharing one infrastructure investment. Architectural unity that compounds engineering leverage across every new vertical.

**Full-stack execution** — React frontends, Node.js/Express API, PostgreSQL schema design, WebSocket real-time layer, Expo/React Native mobile apps, Azure Bicep infrastructure, OpenAPI + GraphQL API surface, Stripe billing integration, multi-provider email.

**AI-enabled operational intelligence** — The PRISM framework, Nimbus AI orchestration layer, domain-specific advisory agents (Helmsman, Sentinel, Compass), and human-in-the-loop governance enforced at the workflow level.

**Enterprise workflow design** — RBAC with organization scoping, SCIM 2.0 provisioning, immutable audit trail, approval gates for consequential operations, CSRF protection, rate limiting.

**Command-center product strategy** — Dense, deliberate information surfaces designed for skilled operators. Dark-first aesthetic. Shared design system with TypeScript component library and consistent interaction patterns across five distinct platforms.

**Technical program leadership** — Architecture documentation before implementation, shared library design with TypeScript project references, API-first design, monorepo discipline, post-merge automation.

---

## Current Status

The SZL Holdings ecosystem is in **active production development**. All platforms are deployed and demonstrable. The architecture is production-grade. Commercial billing flows are built and pending activation.

**Infrastructure status:** Fully operational across all platforms.

**Data state:** Platform dashboards use seeded data for demonstration. All data state is labeled clearly within each application (Demo / Pilot / Live).

**Commercial flows:** Stripe billing infrastructure is built. Activation requires API key configuration (see `.env.example`).

**Mobile:** Expo/React Native apps available for Carlota Jo, SZL Holdings, Aegis, Vessels, Lyte, Terra, and Stephen Lutar.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Platform Overview](docs/PLATFORM_OVERVIEW.md) | Ecosystem explanation for executives and investors |
| [What This Proves](docs/WHAT_THIS_PROVES.md) | Capability summary for recruiters, investors, and partners |
| [Product Matrix](docs/PRODUCT_MATRIX.md) | Public-facing platform inventory |
| [Architecture](docs/architecture.md) | System architecture, data flow, service boundaries |
| [Trust Center](docs/trust-center.md) | Security posture, AI governance, compliance |
| [Deployment](docs/deployment.md) | Deployment strategy, Azure IaC, CI/CD |
| [Investor Narrative](docs/investor-narrative.md) | Company thesis, market positioning, category definition |
| [Public Mirror Policy](docs/PUBLIC_MIRROR_POLICY.md) | What's published and why |
| [Contact](docs/CONTACT.md) | Business inquiry pathways |

---

## Contact & Partnerships

**Investment, partnership, and enterprise evaluation inquiries:**
[inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)

**Founder LinkedIn:**
[linkedin.com/in/stephen-l-279315240](https://linkedin.com/in/stephen-l-279315240)

**Website:**
[szlholdings.com](https://szlholdings.com)

---

## Legal

SZL Holdings is a private operating company. All platforms, intellectual property, and trademarks are owned by SZL Holdings. Stephen Lutar is the founder and sole officer.

**License:** Proprietary. All rights reserved. SZL Holdings.
