# SZL Holdings — Investor Readiness Overview

*Prepared: Q1 2026*
*Founder: Stephen Lutar | inquiries@szlholdings.com | linkedin.com/in/stephen-l-279315240*

---

## 1. Ecosystem Architecture Overview

SZL Holdings is a technology holding company operating a unified ecosystem of command-grade software platforms. Every platform shares a common intelligence backbone (Alloy), a shared design system, and a single PostgreSQL data layer — producing engineering leverage, shared cloud spend, and unified security overhead that no standalone product company can replicate at this scale.

### Tech Stack Summary
- **Frontend**: React + Vite + TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Express.js + Node.js, Drizzle ORM, PostgreSQL
- **Architecture**: pnpm monorepo, shared component library, shared database schemas
- **Auth**: OpenID Connect with PKCE, organization-scoped RBAC
- **AI**: OpenAI, Anthropic, and Google Gemini via integration proxies
- **Mobile**: Expo / React Native (iOS and Android)

---

## 2. Product Hierarchy

```
SZL Holdings (szlholdings.com)
├── Alloy — Execution Fabric
│   ├── Signal ingestion and workflow orchestration
│   ├── Action routing and output generation
│   └── Human approval gates and governance
│
├── Lyte — Business Observability
│   ├── PRISM framework (Pulse / Risk / Intelligence / Signals / Motion)
│   ├── Command Inbox and Action Queue
│   ├── Approvals Center and Ownership Map
│   ├── Escalation Center and Readiness Module
│   └── 40+ connector integrations
│
├── Aegis — Unified Defense & Intelligence
│   ├── Defense workspace (SOC operations)
│   ├── Command workspace (managed services)
│   └── Intelligence workspace (AI research)
│
├── Terra — Real Estate Intelligence
│   ├── NYC distress property data pipeline
│   ├── Broker workflow and deal tracking
│   └── Market intelligence and ownership data
│
├── Vessels — Maritime Intelligence
│   ├── Fleet telemetry and AIS integration
│   ├── Voyage economics and route intelligence
│   ├── Dark vessel detection and sanctions screening
│   └── Command workflows and exception center
│
└── Carlota Jo — Private Advisory
    ├── Service catalog and inquiry workflow
    └── Native mobile client (Expo/React Native)
```

---

## 3. Authentication and Access Model

- **Authentication**: OIDC PKCE flow (Replit Auth)
- **Platform Roles**: Role-based access with organization scoping
- **API auth**: Bearer token with platform role middleware
- **Audit trail**: Full event logging for all platform actions
- **WebSocket**: HMAC-signed tickets with TTL, per-channel role ACL

---

## 4. Platform Operational Status

| Platform | State | Key Capabilities Demonstrated |
|----------|-------|-------------------------------|
| Lyte | Production-grade infrastructure | Signal lifecycle, action queue, readiness scoring |
| Aegis | Production-grade infrastructure | SOC workflow, MITRE ATT&CK, compliance frameworks |
| Terra | Live data pipeline | NYC Open Data integration, distress scoring |
| Vessels | Operational | Fleet management, voyage economics, exception modeling |
| Carlota Jo | Operational | Inquiry management, client engagement, mobile app |
| Alloy | Production-grade infrastructure | Workflow engine, audit trail, agent coordination |

---

## 5. Phased Roadmap

### Phase 0 (Complete): Foundation
- Monorepo architecture, shared design system, database schema
- Authentication, API server, multi-product deployments
- Brand hierarchy established

### Phase 1 (Complete): Productization
- Lyte: action queue, readiness module, role-aware views
- Vessels: command workflows, exception modeling
- Alloy: signal ingest, workflow CRUD, artifact management
- Terra: NYC distress pipeline integration
- Aegis: SOC, managed services, and intelligence workspaces

### Phase 2 (In Progress): Production Hardening
- Enterprise auth (SCIM, SSO, multi-tenant enforcement)
- Mobile parity (Expo apps for all major platforms)
- OpenAPI documentation and developer portal
- Demo/seed data separation and labeling

### Phase 3 (Planned): Revenue Activation
- Stripe billing activation (Vessels, Carlota Jo, Terra, Lyte)
- Enterprise inquiry and contract workflows
- Usage-based billing infrastructure

### Phase 4 (Planned): Scale
- Live AIS data feed integration (Vessels)
- Aegis FedRAMP readiness track
- Terra national coverage expansion
- SOC 2 Type II preparation

---

## 6. Risk and Mitigation Summary

| Risk Area | Mitigation |
|-----------|-----------|
| Data state in demos | Demo mode banners and data state badges on all platforms |
| Billing not yet live | Stripe infrastructure built; activation is configuration, not engineering |
| Single-region deployment | Multi-region roadmapped for Phase 4 |

---

## 7. Demo Guide

### Recommended order for investor walkthroughs:

1. **SZL Holdings** — Corporate presence, ecosystem logic, trust center
2. **Lyte** — Command inbox, signal lifecycle, PRISM framework, readiness module
3. **Vessels** — Marketing page, fleet dashboard, voyage economics, exception center
4. **Aegis** — SOC dashboard, threat intelligence, MITRE ATT&CK coverage
5. **Terra** — Distress property map, deal pipeline, market signals
6. **Carlota Jo** — Advisory brand, inquiry flow, mobile app
7. **Alloy** — Execution runs, workflow orchestration, governance audit

---

## 8. Founder

Stephen Lutar is a technology consultant and systems builder who founded SZL Holdings to consolidate premium command systems across business observability, maritime operations, real estate intelligence, defense, and advisory. His approach: one intelligence backbone (Alloy), shared across purpose-built platforms, each solving a specific domain problem with command-grade precision.

- LinkedIn: https://linkedin.com/in/stephen-l-279315240
- Email: inquiries@szlholdings.com
- Portfolio: /stephen/

---

*For full data room access, cap table details, financial projections, and due diligence materials, contact investor relations directly.*
