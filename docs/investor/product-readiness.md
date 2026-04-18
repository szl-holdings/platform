# SZL Holdings — Product Readiness Assessment

**Date:** April 2026  
**Prepared by:** Stephen Lutar, Founder  
**Updated for:** Phase 10–16 Operations & Launch Readiness completion

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

![SZL Holdings ecosystem map — how command surfaces, execution fabric, domain packs, and external signal sources interconnect](../../assets/readme/architecture/ecosystem-map.svg)

### Lyte — Governed Command Surface

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Public Beta Candidate |
| **Core Architecture** | Production-grade — monorepo, typed API, Drizzle ORM, RBAC |
| **Feature Completeness** | PRISM framework, Command Inbox, Action Queue, Approvals Center, Ownership Map, Escalation Center, Readiness Module |
| **AI Integration** | PRISM scoring, signal analysis, readiness assessment via Alloy |
| **Analytics** | Core events instrumented: dashboard_viewed, signal_viewed, action_created, approval_decision, billing events |
| **Admin Diagnostics** | ✅ Real-time system health diagnostics page at /admin/diagnostics |
| **Data State** | Seeded demo data — clearly labeled in UI |
| **Auth** | OIDC PKCE + role-based access fully implemented |
| **Mobile** | ✅ CORTEX — Unified Mobile Command (Expo/React Native) |
| **What's Needed for GA** | Live connector data feeds, enterprise SSO, commercial billing activation |

### Alloy — Execution Fabric

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade — workflow engine, audit trail, agent coordination |
| **Feature Completeness** | Workflow CRUD, action routing, human-in-the-loop gates, audit log, agent network |
| **Background Jobs** | Webhook delivery, report generation, notification dispatch, daily digest, health scan |
| **Data State** | Seeded workflow data |
| **What's Needed for GA** | Full production load testing, Redis queue for high-volume workloads |

### Aegis — Unified Defense & Intelligence

![Aegis — unified Security & Defense command surface](../../assets/readme/products/aegis-command.jpg)

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade |
| **Feature Completeness** | Defense (SOC, MITRE ATT&CK, SOAR), Command (MSP ops), Intelligence (INCA, model registry, experiments) |
| **AI Integration** | Sentinel agent, INCA model governance, ensemble evaluation |
| **Data State** | Mix of seeded data and simulated threat scenarios |
| **Mobile** | ✅ CORTEX — Unified Mobile Command (Expo/React Native) |
| **What's Needed for GA** | Live SIEM connector, FedRAMP audit track, commercial billing |

### Terra — Real Estate Intelligence

![Terra — Real Estate Intelligence with NYC distress signal pipeline and ownership tracking](../../assets/readme/products/terra-real-estate.jpg)

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade |
| **Feature Completeness** | NYC distress pipeline, ownership tracking, deal pipeline, property map |
| **Live Data** | ✅ NYC Open Data API integration active |
| **Mobile** | ✅ CORTEX — Unified Mobile Command (Expo/React Native) |
| **What's Needed for GA** | Expanded data coverage, broker workflow validation with real users, billing |

### Vessels — Maritime Intelligence

![Vessels — Maritime Intelligence command surface with AIS fleet, sanctions screening, and Helmsman agent](../../assets/readme/products/vessels-maritime.jpg)

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade |
| **Feature Completeness** | Fleet command, voyage economics, AIS telemetry, dark vessel detection, sanctions screening, Helmsman agent |
| **Data State** | Simulated AIS data — labeled Demo in UI |
| **Mobile** | ✅ CORTEX — Unified Mobile Command (Expo/React Native) |
| **What's Needed for GA** | Live AIS data feed subscription, sanctions list API, billing activation |

### Carlota Jo — Private Advisory

![Carlota Jo Consulting — luxury advisory web platform](../../assets/readme/products/carlota-jo.jpg)

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Public Beta Candidate |
| **Core Architecture** | Production-grade |
| **Feature Completeness** | Web platform + native mobile client, service catalog, inquiry workflow, brand positioning |
| **Live Data** | N/A — advisory service, not data platform |
| **Mobile** | ✅ CORTEX — Unified Mobile Command (Expo/React Native) |
| **What's Needed for GA** | Client intake flow activation, billing, domain configuration |

### SZL Holdings — Corporate Platform

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Public Beta Candidate |
| **Feature Completeness** | Ecosystem overview, investor relations, trust center, admin control plane |
| **What's Needed for GA** | Final domain configuration, investor data room |

### CORTEX — Unified Mobile Command

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade — Expo, React Native, OIDC auth, cross-domain workspace routing |
| **Feature Completeness** | Unified authentication, all domain workspaces (Lyte, Aegis, Vessels, Terra, Carlota Jo), push notifications, deep linking |
| **Data State** | Seeded demo data — consistent with web platforms |
| **What's Needed for GA** | App Store / Play Store submission, MDM distribution profile, live data feeds matching web platforms |

### Command Portal — Ecosystem Hub

| Dimension | Assessment |
|-----------|-----------|
| **Readiness Label** | Functional Alpha |
| **Core Architecture** | Production-grade |
| **Feature Completeness** | Cross-domain signal aggregation, portfolio health monitoring, ecosystem status view |
| **Data State** | Seeded demo data |
| **What's Needed for GA** | Live API signal wiring from all domain platforms |

---

## Cross-Platform Infrastructure Readiness

| Infrastructure | Status | Notes |
|----------------|--------|-------|
| PostgreSQL schema | ✅ Production-grade | Drizzle ORM, per-domain namespacing |
| Authentication (OIDC PKCE) | ✅ Production-grade | Full RBAC with org scoping |
| API Server | ✅ Production-grade | Express, typed, health endpoints |
| WebSocket real-time | ✅ Production-grade | HMAC tickets, per-channel ACL, reconnect handling |
| Audit trail | ✅ Production-grade | Immutable, attributed, queryable |
| Background job infrastructure | ✅ Production-grade | Webhook delivery, reports, notifications, health scans, daily digest |
| Notification dispatch | ✅ Production-grade | Rate-limited, templated, multi-channel (Slack, Teams, email, push) |
| Analytics instrumentation | ✅ Operational | Core events: signup, login, dashboard view, signal view, approval decisions, billing events |
| Admin diagnostics | ✅ Operational | Real-time system health at /command/admin/diagnostics (Command is the canonical admin surface) |
| OpenTelemetry | ✅ Integrated | Traces, metrics, configurable OTLP endpoint |
| Stripe billing | 🔧 Built, not activated | Needs API key + price IDs configured |
| Email (Resend/SendGrid) | 🔧 Built, not activated | Needs API key configured |
| AI integration | ✅ Active | Via Replit AI integration proxies |
| Mapbox (Terra, Vessels) | 🔧 Built, not activated | Needs Mapbox token |
| Azure IaC | ✅ Designed | Bicep templates ready, not deployed |
| CI gates | ✅ Documented | Typecheck, lint, audit, secret scan, build — see release-governance.md |
| Incident response | ✅ Documented | Severity model, escalation, runbooks in docs/internal/ops/ |
| Go-live sequence | ✅ Documented | 8-phase launch checklist with acceptance criteria |

---

## Operational Readiness (Phase 10–16 Additions)

The following operational capabilities have been added and documented:

| Capability | Status | Location |
|------------|--------|----------|
| Incident response runbook | ✅ | `docs/internal/ops/incident-response-runbook.md` |
| Support routing runbook | ✅ | `docs/internal/ops/support-runbook.md` |
| Known-gap policy & backup procedures | ✅ | `docs/internal/security/backup-restore.md` |
| Release governance (CI gates, rollback) | ✅ | `docs/releases/release-governance.md` |
| Deployment matrix | ✅ | `docs/releases/deployment-matrix.md` |
| Analytics event taxonomy | ✅ | `docs/internal/analytics/event-taxonomy.md` |
| Go-live sequence | ✅ | `docs/internal/ops/go-live-sequence.md` |
| Investor data room index | ✅ | `docs/investor/data-room-index.md` |

---

## Honest Summary

The SZL Holdings platform ecosystem is a **technically credible, architecturally mature, operationally documented, investor-ready demonstration** of a multi-product software platform. Every platform is functional, documented, and visually polished. Operational backbone (observability, incident response, release discipline, analytics) is now in place.

The gap between current state and General Availability is primarily:
1. **Data activation** — Live AIS feeds, live connector data for Lyte, expanded Terra coverage
2. **Billing activation** — Stripe configuration and pricing structure finalization
3. **Commercial deployment** — First paying customer deployment and the operational learnings that follow
4. **Compliance** — SOC 2, FedRAMP (Aegis-specific), and other certifications are post-revenue milestones

None of these gaps represent architectural risk. The infrastructure is built for them.
