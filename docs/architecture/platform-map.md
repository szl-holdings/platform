# SZL Holdings — Platform Map

**Date:** April 2026

---

## Ecosystem Topology

```
                        ┌─────────────────────────────┐
                        │      SZL HOLDINGS            │
                        │   (Corporate Holding Entity) │
                        │   szlholdings.com            │
                        └──────────────┬──────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              │                        │                        │
    ┌─────────▼──────────┐  ┌──────────▼────────┐  ┌──────────▼─────────┐
    │  OBSERVE · DECIDE  │  │     EXECUTE        │  │      ADVISE        │
    │  · ACT             │  │                    │  │                    │
    └─────────┬──────────┘  └──────────┬────────┘  └──────────┬─────────┘
              │                        │                        │
   ┌──────────┴──────────┐   ┌────────┴──────────┐  ┌────────┴──────────┐
   │                     │   │                   │  │                   │
   │  ┌───────────────┐  │   │  ┌─────────────┐  │  │  ┌─────────────┐  │
   │  │     LYTE      │  │   │  │    ALLOY    │  │  │  │  CARLOTA JO │  │
   │  │  Business     │  │   │  │  Execution  │  │  │  │  Private    │  │
   │  │ Observability │  │   │  │   Fabric    │  │  │  │  Advisory   │  │
   │  │  PRISM FW     │◄─┼───┼─►│  Workflows  │◄─┼──┼─►│  + Mobile   │  │
   │  └───────────────┘  │   │  │  Audit Trail│  │  │  └─────────────┘  │
   │                     │   │  │  Agent Net  │  │  │                   │
   │  ┌───────────────┐  │   │  └─────────────┘  │  └───────────────────┘
   │  │    AEGIS      │  │   │                   │
   │  │  Defense &    │◄─┼───┤                   │
   │  │ Intelligence  │  │   │                   │
   │  │ Defense/Cmd/  │  │   │                   │
   │  │ Intelligence  │  │   │                   │
   │  └───────────────┘  │   │                   │
   │                     │   │                   │
   │  ┌───────────────┐  │   │                   │
   │  │    TERRA      │  │   │                   │
   │  │  Real Estate  │◄─┼───┤                   │
   │  │ Intelligence  │  │   │                   │
   │  │ NYC Distress  │  │   │                   │
   │  └───────────────┘  │   │                   │
   │                     │   │                   │
   │  ┌───────────────┐  │   │                   │
   │  │   VESSELS     │  │   │                   │
   │  │  Maritime     │◄─┼───┘                   │
   │  │ Intelligence  │  │
   │  │  Fleet & AIS  │  │
   │  └───────────────┘  │
   └─────────────────────┘
```

---

## Platform Registry

| Platform | Domain | Layer | Audience | Status |
|----------|--------|-------|----------|--------|
| **Lyte** | Business Operations | Observe / Act | Ops leads, CFO, PMO | Functional Alpha |
| **Alloy** | Execution Fabric | Execute | All platforms (internal) | Functional Alpha |
| **Aegis** | Cybersecurity & Defense | Observe / Respond | CISO, SOC, MSP | Functional Alpha |
| **Terra** | Real Estate Intelligence | Observe / Underwrite | Broker, Investor, Portfolio | Functional Alpha |
| **Vessels** | Maritime Intelligence | Track / Analyze | Fleet Exec, Ops, Commercial | Functional Alpha |
| **Carlota Jo** | Private Advisory | Advise | Founder, CMO, Executive | Functional Alpha |
| **SZL Holdings** | Corporate | Corporate | Investors, Partners, Enterprise | Public Beta Candidate |
| **Stephen Lutar** | Founder Portfolio | Personal | Partners, Evaluators | Public Beta Candidate |

**Readiness Label Definitions:**
- **Concept** — Thesis and spec only, no working software
- **Prototype** — Core flows working, not hardened
- **Functional Alpha** — Full feature set, seeded/demo data, not commercially deployed
- **Internal Beta** — In use by real users internally
- **Public Beta Candidate** — Ready for limited public exposure
- **Generally Available** — Commercially deployed with paying customers

---

## Mobile Platform Coverage

| Platform | Web | iOS/Android | Status |
|----------|-----|-------------|--------|
| Lyte | ✅ | ✅ Lyte Mobile | Functional Alpha |
| Aegis | ✅ | ✅ Aegis Mobile | Functional Alpha |
| Terra | ✅ | ✅ Terra Mobile | Functional Alpha |
| Vessels | ✅ | ✅ Vessels Mobile | Functional Alpha |
| Carlota Jo | ✅ | ✅ Carlota Jo Mobile | Functional Alpha |
| SZL Holdings | ✅ | ✅ SZL Holdings Mobile | Functional Alpha |
| Stephen Site | ✅ | ✅ Stephen Mobile | Functional Alpha |

---

## Shared Backbone

All platforms share:

```
┌────────────────────────────────────────────────────────────────┐
│                   SHARED PLATFORM BACKBONE                     │
├──────────────┬────────────────┬───────────────┬───────────────┤
│  @workspace/ │  @workspace/   │  @workspace/  │  @workspace/  │
│  shared-ui   │  db            │  auth         │  workflow-    │
│  Component   │  Drizzle ORM   │  OIDC PKCE    │  engine       │
│  library     │  PostgreSQL    │  RBAC         │  Alloy fabric │
├──────────────┼────────────────┼───────────────┼───────────────┤
│  @workspace/ │  @workspace/   │  @workspace/  │  @workspace/  │
│  ai-engine   │  audit         │  api-spec     │  observability│
│  Multi-LLM   │  Immutable     │  OpenAPI 3.1  │  APM + Pino   │
│  inference   │  event log     │  GraphQL      │  logging      │
└──────────────┴────────────────┴───────────────┴───────────────┘
```

---

*See also: [System Overview](system-overview.md) · [Data Flow](data-flow.md)*
