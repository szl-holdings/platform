# SZL Holdings — Product Reality Check

## Assessment Date: April 3, 2026

### ALLOY — Execution Fabric / Orchestration / Audit

| Capability | Status | Evidence |
|------------|--------|----------|
| Workflow definition model | ✅ Real | alloy_workflows table, CRUD API, UI at /alloy/workflows |
| Run lifecycle | ✅ Real | alloy_workflow_runs table, status tracking |
| Approval gates | ✅ Real | alloy_approvals, alloy_pending_approvals_chat tables |
| Action routing | ✅ Real | alloy_actions, alloy_skills tables |
| Actor attribution | ✅ Real | owner fields on all records, alloy_owners table |
| Execution log | ✅ Real | alloy_audit_log table with structured events |
| Immutable audit trace | ✅ Real | alloy_ai_audit_log, alloy_audit_log tables |
| Connector abstraction | ✅ Real | alloy_integration_connections, alloy_channel_configs |
| Failure/retry handling | ⚠️ Partial | Schema supports it, runtime handling limited |

**Verdict: 8/10 — Real operational fabric with audit depth**

### LYTE — Business Observability Command Plane

| Capability | Status | Evidence |
|------------|--------|----------|
| Signal/event intake view | ✅ Real | Dashboard at / with signal cards |
| Prioritization model | ✅ Real | Priority scoring in signals |
| Triage queue | ✅ Real | Signal list with status filtering |
| Owner assignment | ✅ Real | Owner fields throughout |
| Escalation | ✅ Real | Escalation workflows in schema |
| Evidence/rationale panel | ✅ Real | Detail panels with context |
| Audit/history view | ✅ Real | Activity logs per entity |
| Executive summary | ✅ Real | Executive command dashboard |
| Saved views | ⚠️ Partial | Filter states, no persistent saved views |
| Bulk actions | ⚠️ Partial | Limited bulk operations |

**Verdict: 8/10 — Strong command plane with real data flows**

### AEGIS (Firestorm) — Security / Resilience / Intelligence

| Capability | Status | Evidence |
|------------|--------|----------|
| Incident/risk queue | ✅ Real | firestorm_incidents, firestorm_alerts tables, /incidents route |
| Case detail | ✅ Real | /cases route with case management |
| Investigation timeline | ✅ Real | /investigations with timeline view |
| Evidence/context panel | ✅ Real | Detail panels per incident/case |
| Assignee/escalation flow | ✅ Real | Assignment fields, status lifecycle |
| Status lifecycle | ✅ Real | Full status state machine |
| Admin/policy controls | ✅ Real | /gov/* governance routes |
| XDR console | ✅ Real | /xdr-console route |
| MITRE ATT&CK mapping | ✅ Real | /mitre-attack route |
| Threat intel | ✅ Real | /threat-intel route |
| Simulation panel | ✅ Real | /simulation-panel route |

**Verdict: 8/10 — Comprehensive SOC/defense surface, 170+ routes**

### TERRA — Real Estate Operating Intelligence

| Capability | Status | Evidence |
|------------|--------|----------|
| Portfolio list | ✅ Real | terra_properties, terra_listings tables |
| Asset detail | ✅ Real | /property/:id detail route |
| Watchlist/risk workflow | ✅ Real | terra_distress_alerts, terra_distress_properties |
| Ownership/deal context | ✅ Real | terra_deals, terra_transactions tables |
| Diligence/reporting flow | ✅ Real | /diligence-prep, /readiness-board routes |
| Source provenance | ⚠️ Partial | terra_ingestion_runs table |
| Data freshness | ⚠️ Partial | Timestamp fields, no active refresh |
| Export/report pack | ✅ Real | /document-engine route |
| Action routing | ✅ Real | terra_action_items table |

**Verdict: 8/10 — Full real estate intelligence platform**

### VESSELS — Maritime Operating Intelligence

| Capability | Status | Evidence |
|------------|--------|----------|
| Fleet list | ✅ Real | vessels table, /fleet route with map |
| Vessel detail | ✅ Real | /vessel/:id and /vessels/:id routes |
| Readiness panel | ✅ Real | /maintenance route |
| Exception/alert queue | ✅ Real | /exceptions, /exception-queue routes |
| List/map/detail coordination | ✅ Real | Fleet map + list + detail views |
| Status history | ✅ Real | vessel_events table |
| Export/share summary | ✅ Real | /analytics, document engine |
| Voyage economics | ✅ Real | vessel_voyage_economics, /economics route |
| Sanctions screening | ✅ Real | vessel_sanctions_screening table |
| Route risk | ✅ Real | /route-risk route |

**Verdict: 8/10 — Complete maritime command center**

### CARLOTA JO — Premium Advisory / Service Brand

| Capability | Status | Evidence |
|------------|--------|----------|
| Premium site IA | ✅ Real | / homepage with luxury design |
| Real inquiry/contact flow | ✅ Real | /contact, /inquiries, /book routes |
| Mobile-perfect CTA path | ✅ Real | Responsive design, booking flow |
| Trust cues | ✅ Real | Methodology, approach, founder pages |
| Confirmation states | ✅ Real | /booking/success, /booking/cancel |
| Analytics hooks | ⚠️ Partial | Page view tracking, limited analytics |
| Spam-safe forms | ✅ Real | Form validation on contact/inquiry |
| Client portal | ✅ Real | /client-portal with auth guard, docs, messages, updates |

**Verdict: 8/10 — Premium advisory brand fully operational**

### SZL HOLDINGS — Parent Company Shell

| Capability | Status | Evidence |
|------------|--------|----------|
| Clean product hierarchy | ✅ Real | /platform, /solutions/* routes |
| Live-vs-roadmap honesty | ⚠️ Needs Work | Some claims need labeling |
| Trust section | ✅ Real | /trust/* with 7 sub-pages |
| Investor-safe narrative | ✅ Real | /investors/* with 7 sub-pages, /ir |
| Demo/contact path | ✅ Real | /demo, /contact, /design-partners |
| Proof-of-readiness section | ✅ Real | /architecture, /docs/* |
| Distribution OS | ✅ Real | /admin/distribution/* with 11 sub-pages |

**Verdict: 9/10 — Strongest surface, 171 routes**

### FOUNDER SURFACES — Credibility

| Capability | Status | Evidence |
|------------|--------|----------|
| Credibility only | ✅ Real | stephen-site with /work, /thesis, /writing, /about |
| No product confusion | ✅ Real | Clean separation from product surfaces |
| Downloads/resources | ✅ Real | /downloads route |
| Career/professional | ✅ Real | /career, /hackajob routes |

**Verdict: 8/10 — Clean credibility surface**

### EXPERIMENTAL SURFACES

| Surface | Disposition | Reason |
|---------|------------|--------|
| Mockup Sandbox | **Internal-only** | Design tool for component previews |
| Firestorm | **Keep as Aegis** | It IS the Aegis web app |

### MOBILE SUITE

| App | Boot | Auth | Nav | Core Flows | Status |
|-----|------|------|-----|------------|--------|
| SZL Holdings Mobile | ✅ | ✅ | ✅ | ⚠️ | Functional |
| Lyte Mobile | ✅ | ✅ | ✅ | ⚠️ | Functional |
| Aegis Mobile | ✅ | ✅ | ✅ | ⚠️ | Functional |
| Terra Mobile | ✅ | ✅ | ✅ | ⚠️ | Functional |
| Vessels Mobile | ✅ | ✅ | ✅ | ⚠️ | Functional |
| Carlota Jo Mobile | ✅ | ✅ | ✅ | ⚠️ | Functional |
| Stephen Mobile | ✅ | ✅ | ✅ | ⚠️ | Functional |

**Verdict: 6/10 — All boot and navigate, core flows need deepening**
