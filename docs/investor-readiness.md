# SZL Holdings — Investor Readiness Package

_Prepared: March 30, 2026_
_Founder: Stephen Lutar | contact@stephenl.dev | linkedin.com/in/stephen-l-279315240_

---

## 1. Ecosystem Architecture Overview

SZL Holdings is a technology holding company operating a unified ecosystem of command-grade software platforms. Every platform shares a common intelligence backbone (Alloy) and design system, producing shared cloud spend, unified security overhead, and engineering leverage no standalone company can match.

### Tech Stack
- **Frontend**: React 19 + Vite 7 + TypeScript, Tailwind CSS, Framer Motion, Wouter routing
- **Backend**: Express.js + Node.js 24, Drizzle ORM, PostgreSQL
- **Architecture**: pnpm monorepo, shared component library, shared DB schemas
- **Auth**: OpenID Connect with PKCE (Replit Auth), 11 platform roles, org-scoped access
- **AI**: Integrated via OpenAI, Anthropic, and Gemini proxy APIs
- **Data**: 198 database tables, 5 NYC open data source pipelines, autonomous agent scheduler

## 2. Product Hierarchy Map

```
SZL Holdings (szlholdings.com)
├── Alloy — Intelligence Backbone
│   ├── Signal ingestion & workflow orchestration
│   ├── Action routing & output generation
│   └── Human approval gates & governance
│
├── Lyte — Business Observability [approval latency detection]
│   ├── Command Inbox (prioritized signals)
│   ├── Approvals Center (aging impact estimates)
│   ├── Ownership Map (handoff visibility)
│   ├── Escalation Center (auto-recommendations)
│   ├── Readiness Module (launch gates & blockers)
│   └── Action Queue (role-aware, SLA-tracked)
│
├── Vessels — Maritime Command [dark vessel anomaly detection]
│   ├── Fleet Map (AIS + anomaly detection)
│   ├── Voyage Economics (revenue/cost/margin modeling)
│   ├── Exception Center (consequence modeling)
│   ├── Maintenance Readiness (predictive scheduling)
│   ├── Dark Vessel Detection & Sanctions Screening
│   └── Command Workflows (intervention triggers)
│
├── Carlota Jo — Premium Services [100% pilot client retention]
│   ├── Service catalog & booking
│   ├── Discreet inquiry workflow
│   └── Client relationship management
│
├── Terra — Real Estate Intelligence (internal/pilot)
│   ├── NYC distress data pipeline (5 sources)
│   ├── Broker workflow & deal tracking
│   └── Market predictions & automations
│
└── Stephen Lutar — Founder Identity
    ├── Career narrative & case studies
    ├── Technical frameworks
    └── Professional contact
```

## 3. Public vs Private Boundary Map

| Surface | Visibility | URL Pattern |
|---------|-----------|-------------|
| SZL Holdings homepage | Public | szlholdings.com/ |
| SZL ecosystem/ventures/founder/contact | Public | szlholdings.com/ecosystem, /ventures, /founder, /contact |
| SZL legal/trust/investor | Public | szlholdings.com/legal/*, /trust, /investor |
| Vessels marketing pages | Public | vessels/platform, /capabilities, /pricing, /demo |
| Vessels dashboard | Private (auth required) | vessels/dashboard/* |
| Carlota Jo landing | Public | carlota-jo/ |
| Stephen Lutar portfolio | Public | stephen/ |
| Alloy command surface | Private | alloy/* |
| Lyte command center | Private | lyte-command-center/* |
| Terra broker tools | Private (hidden from public nav) | terra/* |
| Firestorm security | Private (hidden from public nav) | firestorm/* |
| INCA research | Private (hidden from public nav) | inca/* |
| API endpoints | Private (bearer auth) | /api/* |

## 4. Auth & Access Model

- **Authentication**: OIDC PKCE flow via Replit Auth
- **11 Platform Roles**: super_admin, org_admin, executive_viewer, product_admin, ops_lead, analyst, contributor, viewer, agent, api_client, auditor
- **Organization scoping**: Multi-tenant with org membership and role-based access
- **API auth**: Bearer token + platform role middleware
- **Audit trail**: Full event logging for all platform actions

## 5. Real vs Mocked Status Matrix

| Component | Status | Data Source |
|-----------|--------|-------------|
| Lyte signals & executive summary | Real | PostgreSQL + canonical seed |
| Lyte readiness items | Real | PostgreSQL |
| Vessels fleet tracking | Demo | 10 simulated vessels |
| Vessels voyage economics | Demo | Seeded voyage data |
| Terra NYC distress pipeline | Real | 5 NYC Open Data APIs |
| Alloy workflow engine | Real | PostgreSQL + API |
| Feature flags system | Real | PostgreSQL |
| Auth/session management | Real | OIDC + PostgreSQL |
| Observability/health checks | Real | Live telemetry |
| INCA experiments | Demo | Generated data |
| Firestorm SOC dashboard | Hybrid | Partial real, partial demo |
| Intelligence endpoints | Demo | Simulated geopolitical data |
| Carlota Jo inquiries | Real | PostgreSQL (form submissions) |
| CMS content | Real | PostgreSQL |
| Billing/subscriptions | Stub | Static plan data |

## 6. Phased Roadmap

### Phase 0 (Complete): Foundation
- Monorepo architecture, shared design system, DB schema
- Auth, API server, 13 running workflows
- Brand hierarchy established

### Phase 1 (Complete): Productization
- Lyte: action queue, readiness module, role-aware views
- Vessels: command workflows, exception modeling
- Alloy: signal ingest, workflow CRUD, artifact management
- Terra: NYC distress pipeline, 5 data sources

### Phase 2 (In Progress): Production Hardening
- Auth role consolidation & private route enforcement
- Response caching, mobile responsive pass
- OpenAPI documentation
- Demo/seed data separation

### Phase 3 (Planned): Revenue
- Stripe integration for Vessels fleet plans
- Carlota Jo booking payments
- Lyte enterprise subscriptions
- Usage-based billing infrastructure

### Phase 4 (Planned): Scale
- Multi-region deployment
- Real AIS data feed integration
- Enterprise SSO (SAML)
- SOC 2 Type II preparation

## 7. Risk / Mitigation Notes

| Risk | Impact | Mitigation | Priority |
|------|--------|------------|----------|
| Vessels uses demo data | Investors see simulated fleet | Clear "DEMO" banner; real AIS integration planned | High |
| No Stripe integration yet | No revenue collection | Stripe webhook + plan infrastructure scaffolded | High |
| 198 DB tables | Schema complexity | Consolidation plan for production; canonical schemas separate | Medium |
| NYC Open Data API 400 errors | Terra ingestion gaps | Graceful fallback; no crash; logged | Low |
| Single-region deployment | No failover | Multi-region planned for Phase 4 | Medium |

## 8. Product Demo Guide

### For investors, demonstrate in this order:

1. **SZL Holdings** (szlholdings.com/) — Corporate presence, ecosystem logic, proof metrics
2. **Lyte** (/lyte-command-center/) — Command inbox, signal lifecycle, readiness module
3. **Vessels** (/vessels/) — Marketing page → Dashboard → Fleet map → Voyage economics
4. **Alloy** (/alloy/) — Execution runs, workflow orchestration, governance
5. **Carlota Jo** (/carlota-jo/) — Service brand, inquiry form
6. **Stephen Site** (/stephen/) — Founder narrative, case studies

### Key talking points:
- Approval latency detection surfaces bottlenecks before they impact revenue (Lyte)
- AIS anomaly detection flags dark vessel behavior for early intervention (Vessels)
- Shared monorepo architecture reduces infrastructure overhead vs separate deployments
- 11 platform roles with org-scoped access (enterprise-grade auth)
- 198 database tables across 5 product domains (real schema, not a mockup)
- 5 NYC open data sources ingested automatically (Terra real data pipeline)

## 9. Core KPI Definitions

| KPI | Definition | Status |
|-----|-----------|--------|
| Revenue at Risk / Quarter | Value of stalled approvals detected by Lyte before manual review | Measurable — requires production data |
| Dark Vessel Detection Lead | Days before formal designation that Vessels flags anomalous behavior | Measurable — requires AIS feed |
| Decision Velocity | Throughput via Alloy workflow orchestration vs manual | Measurable — requires production data |
| Infrastructure Overhead | Cost delta of shared ecosystem vs standalone deployments | Estimable — architecture comparison |
| Signal Detection Time | Time from event occurrence to Lyte surfacing the signal | Measurable — instrumented in Alloy |
| Platforms Live | Number of operational platform surfaces | 4 (public), 8+ (internal/demo) |

_Note: Quantitative KPI targets should be established once production workloads generate baseline data._

## 10. Data Room Folder Recommendations

```
/01-corporate
  - SZL Holdings overview deck
  - Certificate of incorporation
  - Operating agreement
  - Cap table

/02-product
  - Product hierarchy diagram
  - Demo credentials & walkthrough guide
  - Feature roadmap by phase
  - Real vs mocked status matrix

/03-technology
  - Architecture overview (monorepo structure)
  - Database schema documentation
  - API endpoint catalog (OpenAPI spec)
  - Auth & access model documentation
  - Infrastructure & deployment documentation

/04-market
  - TAM/SAM/SOM analysis by vertical
  - Competitor landscape
  - Customer interview summaries
  - Case study shells

/05-financials
  - Revenue model by product
  - Cost structure (infrastructure, personnel)
  - Runway projections
  - Unit economics by vertical

/06-legal
  - Privacy policy
  - Terms of service
  - Trust center documentation
  - IP assignment agreements

/07-team
  - Founder bio and LinkedIn
  - Advisory board (if applicable)
  - Hiring plan
  - Org chart
```

## 11. Founder Narrative Summary

Stephen Lutar is a technology consultant and systems builder who founded SZL Holdings to consolidate premium command systems across business observability, maritime operations, real estate intelligence, and high-trust services. His approach: one intelligence backbone (Alloy), shared across purpose-built platforms, each solving a specific domain problem with command-grade precision.

LinkedIn: https://linkedin.com/in/stephen-l-279315240
Email: contact@stephenl.dev
Portfolio: /stephen/

## 12. Deployment / Environment Structure

| Environment | Purpose | Database | Config |
|-------------|---------|----------|--------|
| Development (Replit) | Active development, 13 workflows | Replit PostgreSQL | NODE_ENV=development |
| Production (Replit Deploy) | Published deployment | Replit PostgreSQL (production) | NODE_ENV=production |

### Static vs App-Tier Classification:
- **Static/Pre-rendered**: SZL Holdings homepage, Carlota Jo landing, Stephen Site, Vessels marketing pages
- **App-tier (autoscale)**: API server, Alloy, Lyte, Vessels dashboard, Terra
- **Internal only**: Admin panel, INCA, Firestorm, Dreamscape, MSP
