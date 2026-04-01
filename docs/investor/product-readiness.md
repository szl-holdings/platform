# SZL Holdings — Product Readiness Assessment

**Date:** April 2026  
**Prepared by:** Stephen Lutar, Founder

---

## Readiness Label Definitions

| Label | Definition |
|-------|-----------|
| **Concept** | Thesis and specification only. No working software. |
| **Prototype** | Core user flows working. Not hardened for real use. |
| **Functional Alpha** | Full feature set implemented with seeded/demo data. Architecture production-grade. Not commercially deployed. |
| **Internal Beta** | In use by real users internally. Some rough edges. |
| **Public Beta Candidate** | Ready for limited public exposure. Well-documented. Stable. |
| **Generally Available** | Commercially deployed with paying customers. SLA-backed. |

---

## Product Readiness Matrix

### Lyte — Business Observability

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade — monorepo, typed API, Drizzle ORM, RBAC |
| **Feature Completeness** | PRISM framework, Command Inbox, Action Queue, Approvals Center, Ownership Map, Escalation Center, Readiness Module |
| **AI Integration** | PRISM scoring, signal analysis, readiness assessment via Alloy |
| **Data State** | Seeded demo data — clearly labeled in UI |
| **Auth** | OIDC PKCE + role-based access fully implemented |
| **Mobile** | ✅ Lyte Mobile (Expo/React Native) |
| **What's Needed for GA** | Live connector data feeds, enterprise SSO, commercial billing activation |

### Alloy — Execution Fabric

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade — workflow engine, audit trail, agent coordination |
| **Feature Completeness** | Workflow CRUD, action routing, human-in-the-loop gates, audit log, agent network |
| **Data State** | Seeded workflow data |
| **What's Needed for GA** | Full production load testing, Redis queue for high-volume workloads |

### Aegis — Unified Defense & Intelligence

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade |
| **Feature Completeness** | Defense (SOC, MITRE ATT&CK, SOAR), Command (MSP ops), Intelligence (INCA, model registry, experiments) |
| **AI Integration** | Sentinel agent, INCA model governance, ensemble evaluation |
| **Data State** | Mix of seeded data and simulated threat scenarios |
| **Mobile** | ✅ Aegis Mobile (Expo/React Native) |
| **What's Needed for GA** | Live SIEM connector, FedRAMP audit track, commercial billing |

### Terra — Real Estate Intelligence

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade |
| **Feature Completeness** | NYC distress pipeline, ownership tracking, deal pipeline, property map |
| **Live Data** | ✅ NYC Open Data API integration active |
| **Mobile** | ✅ Terra Mobile (Expo/React Native) |
| **What's Needed for GA** | Expanded data coverage, broker workflow validation with real users, billing |

### Vessels — Maritime Intelligence

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade |
| **Feature Completeness** | Fleet command, voyage economics, AIS telemetry, dark vessel detection, sanctions screening, Helmsman agent |
| **Data State** | Simulated AIS data — labeled Demo in UI |
| **Mobile** | ✅ Vessels Mobile (Expo/React Native) |
| **What's Needed for GA** | Live AIS data feed subscription, sanctions list API, billing activation |

### Carlota Jo — Private Advisory

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Public Beta Candidate |
| **Core Architecture** | Production-grade |
| **Feature Completeness** | Web platform + native mobile client, service catalog, inquiry workflow, brand positioning |
| **Live Data** | N/A — advisory service, not data platform |
| **Mobile** | ✅ Carlota Jo Mobile (Expo/React Native) |
| **What's Needed for GA** | Client intake flow activation, billing, domain configuration |

### SZL Holdings — Corporate Platform

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Public Beta Candidate |
| **Feature Completeness** | Ecosystem overview, investor relations, trust center, admin control plane |
| **What's Needed for GA** | Final domain configuration, investor data room |

### Stephen Lutar — Founder Site

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Public Beta Candidate |
| **Feature Completeness** | Portfolio, work showcase, technical frameworks, career command |
| **What's Needed for GA** | Live domain, final content review |

---

## Cross-Platform Infrastructure Readiness

| Infrastructure | Status | Notes |
|----------------|--------|-------|
| PostgreSQL schema | ✅ Production-grade | Drizzle ORM, per-domain namespacing |
| Authentication (OIDC PKCE) | ✅ Production-grade | Full RBAC with org scoping |
| API Server | ✅ Production-grade | Express, typed, health endpoints |
| WebSocket real-time | ✅ Production-grade | HMAC tickets, per-channel ACL |
| Audit trail | ✅ Production-grade | Immutable, attributed, queryable |
| Stripe billing | 🔧 Built, not activated | Needs API key + price IDs configured |
| Email (Resend/SendGrid) | 🔧 Built, not activated | Needs API key configured |
| AI integration | ✅ Active | Via Replit AI integration proxies |
| Mapbox (Terra, Vessels) | 🔧 Built, not activated | Needs Mapbox token |
| Azure IaC | ✅ Designed | Bicep templates ready, not deployed |

---

## Honest Summary

The SZL Holdings platform ecosystem is a **technically credible, architecturally mature, investor-ready demonstration** of a multi-product software platform. Every platform is functional, documented, and visually polished.

The gap between current state and General Availability is primarily:
1. **Data activation** — Live AIS feeds, live connector data for Lyte, expanded Terra coverage
2. **Billing activation** — Stripe configuration and pricing structure finalization
3. **Commercial deployment** — First paying customer deployment and the operational learnings that follow
4. **Compliance** — SOC 2, FedRAMP (Aegis-specific), and other certifications are post-revenue milestones

None of these gaps represent architectural risk. The infrastructure is built for them.
