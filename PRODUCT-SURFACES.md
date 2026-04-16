# Product Surfaces — SZL Holdings Platform

**Version:** 2.0 · **Last updated:** April 2026
**Audience:** Engineers, product managers, investors, enterprise evaluators

> Every user-facing surface in the SZL ecosystem — command surfaces, domain packs, mobile, and corporate — with purpose, audience, entry point, and key dependencies.
> For the product surface-to-primitive mapping see [PRODUCT_SURFACE_MAP.md](PRODUCT_SURFACE_MAP.md). For the category narrative see [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md).

---

## Platform Architecture Model

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMAND SURFACES                                               │
│  Lyte — Operator Command    Command Portal — Ecosystem Hub     │
│  CORTEX — Unified Mobile    SZL Holdings — Corporate           │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                   │
│  Aegis         Vessels       Terra        PRISM Counsel        │
│  Security &    Maritime      Real Estate  Legal Matter         │
│  Defense       Intelligence  Intelligence Command              │
│  Carlota Jo — Premium Advisory    IMPERIUM — Cloud Sovereignty │
├─────────────────────────────────────────────────────────────────┤
│  GOVERNANCE INFRASTRUCTURE (shared by all surfaces)            │
│  Outcome Graph · Proof Chain · Covenant Policy · Monte Carlo   │
│  Workflow Engine · PRISM Bus · AI Engine · RBAC + Auth         │
│  Alloy — Execution Fabric (workflows, approvals, audit trail)  │
├─────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                     │
│  PostgreSQL 16 (Drizzle) · External feeds · AI providers       │
└─────────────────────────────────────────────────────────────────┘
```

All surfaces share the same five platform primitives — see [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) for the full specification.

---

## Web Applications

### Lyte Command Center

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/lyte-command-center` |
| **Preview path** | `/lyte-command-center/` |
| **Status** | Functional alpha |
| **Components** | 142 |
| **Audience** | Operations leads, CTOs, SRE/DevOps teams, PMOs, CFOs |
| **Problem solved** | Organizations cannot see across their operational systems in real time — risks surface too late, signals are siloed |
| **Core capability** | PRISM framework (Pulse / Risk / Intelligence / Signals / Motion), Autonomous NOC, AI-driven alert correlation, self-healing orchestration, revenue impact mapping |
| **Key modules** | PRISM dashboard, signal timeline, action queue, approval chains, AIOps, APM, MSP/RMM tooling, ML pipeline management, cost governance |
| **Key dependencies** | `@szl-holdings/ai-engine`, `@szl-holdings/forge-runtime`, `@szl-holdings/observability`, `@szl-holdings/prism-bus`, `@szl-holdings/shared-ui` |
| **Primitives used** | All 5 — Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine |
| **Strategic role** | Operating wedge — primary command surface for the governed decision loop. Entry point to all domain packs |

---

### Aegis — Unified Defense & Intelligence Command

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/firestorm` |
| **Preview path** | `/firestorm/` |
| **Status** | Functional alpha |
| **Components** | 157 |
| **Audience** | CISOs, SOC analysts, managed security providers (MSPs), compliance officers |
| **Problem solved** | Security and intelligence operations are fragmented across disconnected tools |
| **Core capability** | Three unified workspaces sharing one intelligence layer: Defense (SOC operations and threat response), Command (managed services operations), Intelligence (AI research and model governance) |
| **Key modules** | MITRE ATT&CK v14 detection, SOAR playbook engine, STIX/TAXII protocol, XDR console, Sentinel AI agent, INCA analytics, Citadel crisis war room, deception grids, vulnerability management, dark vessel detection |
| **Key dependencies** | `@szl-holdings/ai-engine`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/forge-runtime`, `@szl-holdings/proof-chain`, `@szl-holdings/shared-ui` |
| **Primitives used** | Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine |
| **Strategic role** | Security & defense domain pack. MSP Command module creates managed services revenue path. FedRAMP readiness track |

---

### Terra — Real Estate Intelligence

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/terra` |
| **Preview path** | `/terra/` |
| **Status** | Functional alpha |
| **Components** | 77 |
| **Audience** | NYC brokers, real estate investors, portfolio managers |
| **Problem solved** | Distressed property intelligence is fragmented across public records, manual research, and disconnected tools |
| **Core capability** | Live NYC distress data pipeline (multiple public data sources), AI distress scoring, ownership entity graph, deal pipeline management, broker workflow integration |
| **Key modules** | Distress property map, ownership graph, deal pipeline, MLS listing ingestion, commercial analytics, lead scoring, market signal intelligence, broker CRM |
| **Key dependencies** | `@szl-holdings/db`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/monte-carlo`, `@szl-holdings/shared-ui` |
| **Primitives used** | Outcome Graph, Monte Carlo |
| **Strategic role** | Real estate domain pack. Foundation for national expansion beyond NYC |

---

### Vessels — Maritime Intelligence

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/vessels` |
| **Preview path** | `/vessels/` |
| **Status** | Functional alpha |
| **Components** | 83 |
| **Audience** | Fleet executives, maritime operations teams, commercial directors, compliance officers, insurers |
| **Problem solved** | Fleet operators lack real-time visibility into vessel behavior, voyage economics, and compliance risk |
| **Core capability** | AIS telemetry integration, voyage economics modeling, dark vessel detection, sanctions screening, route intelligence, exception center with consequence modeling |
| **Key modules** | Fleet map (Mapbox), vessel digital twin, voyage P&L, dark vessel alerts, sanctions screening, exception center, commodity trading, marine insurance, Helmsman AI agent |
| **Key dependencies** | `@szl-holdings/db`, `@szl-holdings/intelligence-feeds`, `@szl-holdings/worldline`, `@szl-holdings/shared-ui` |
| **Primitives used** | Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine |
| **Strategic role** | Maritime domain pack. High-stakes buyer profile: enterprise, government, insurance |

---

### PRISM Counsel — Legal Matter Command

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/prism-counsel` |
| **Preview path** | `/prism-counsel/` |
| **Status** | Functional alpha |
| **Components** | 127 |
| **Audience** | Legal partners, case managers, discovery analysts, recovery specialists |
| **Problem solved** | High-stakes litigation and recovery operations require cross-domain intelligence that standalone LegalTech platforms lack |
| **Core capability** | Agentic legal operating system — Matter Twin case management, AI-assisted document review, court filing integration, recovery ops, NY No-Fault module |
| **Key modules** | Matter management, court filing integration (NY courts), document review, multi-jurisdictional support, recovery tracking (liens, settlements), proof chain audit, pressure/friction boards, copilot workbench, No-Fault module |
| **Key dependencies** | `@szl-holdings/ai-engine`, `@szl-holdings/proof-chain`, `@szl-holdings/receipt-graph`, `@szl-holdings/covenant-policy`, `@szl-holdings/shared-ui` |
| **Database** | 120+ tables across 10 schema modules |
| **Primitives used** | All 5 — Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine |
| **Strategic role** | Legal domain pack with cross-domain intelligence from defense, maritime, and financial domains |

---

### Carlota Jo Consulting

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/carlota-jo` |
| **Preview path** | `/carlota-jo/` |
| **Status** | Live |
| **Components** | 60 |
| **Audience** | Founders, executives, UHNW clients seeking brand and operational strategy |
| **Problem solved** | Premium advisory is disconnected from operational reality — advice is intuition-based rather than intelligence-informed |
| **Core capability** | White-glove advisory operations — strategic diagnostic engine, secure client portal, scenario simulator, booking and reservation system |
| **Key modules** | Client profile management, service catalog, booking system, document delivery, secure messaging, inquiry intake, reservation management |
| **Key dependencies** | `@szl-holdings/ai-engine`, `@szl-holdings/shared-ui`, `@szl-holdings/db` |
| **Primitives used** | Proof Chain, Covenant Policy |
| **Strategic role** | Advisory domain pack. Live, client-facing. Demonstrates principal-led advisory grounded in platform intelligence |

---

### IMPERIUM — Cloud Sovereignty Engine

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/imperium` |
| **Preview path** | `/imperium/` |
| **Status** | Functional alpha |
| **Components** | 11 |
| **Audience** | Executive leadership, strategic planners, operations directors |
| **Problem solved** | Organizations need sovereign control over their cloud infrastructure with executive-grade visibility |
| **Core capability** | Strategic command and intelligence briefing platform — executive decision-support (Legatus Console), organizational asset visualization (Imperium Map), governance interface (Senate Chamber), AI tactical insights (Centurion AI) |
| **Key dependencies** | `@szl-holdings/ai-engine`, `@szl-holdings/shared-ui` |
| **Primitives used** | Covenant Policy |
| **Strategic role** | Cloud sovereignty domain pack — infrastructure control plane, tenant provisioning, cost budget governance, compliance monitoring |

---

### Command Portal — Ecosystem Intelligence Hub

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/command` |
| **Preview path** | `/command/` |
| **Status** | Functional alpha |
| **Components** | 24 |
| **Audience** | Internal administrators, ecosystem operators, prospective clients |
| **Problem solved** | No single surface provides cross-domain operational health and signal aggregation across the full SZL ecosystem |
| **Core capability** | Real-time 8-domain dashboard (SSE), composite health scoring, per-domain drill-downs, global command bar (Cmd+K), executive briefing view, timeline with filter chips, Cortex Voice AI assistant |
| **Key dependencies** | `@szl-holdings/shared-ui`, `@szl-holdings/prism-bus` |
| **Strategic role** | Central portal for ecosystem-wide management, cross-platform orchestration, and enterprise marketing demos |

---

### SZL Holdings Dashboard

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/szl-holdings` |
| **Preview path** | `/` |
| **Status** | Live |
| **Audience** | Investors, fund managers, venture partners, design partners, enterprise evaluators |
| **Problem solved** | The ecosystem needs a coherent corporate presence presenting the platform hierarchy, trust posture, and investor narrative |
| **Core capability** | Investor and venture intelligence platform — portfolio health radar, cap table management, fund operations, LP reporting, trust center, developer portal |
| **Key modules** | Landing page, platform product pages, trust center, investor hub (NDA-gated data room), admin CMS, PRISM Counsel integration, Alloy workflow integration |
| **Key dependencies** | `@szl-holdings/db`, `@szl-holdings/shared-ui`, `@szl-holdings/api-zod`, `@szl-holdings/prism-bus` |
| **Strategic role** | Top of the brand hierarchy. Primary destination for investor and enterprise evaluation |

---

### Stephen Lutar — Founder Authority Site

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/stephen-site` |
| **Preview path** | `/stephen-site/` |
| **Status** | Live |
| **Components** | 58 |
| **Audience** | Prospective partners, employers, clients, collaborators |
| **Core capability** | Research impact tracking, media relations, audience intelligence, digital product storefront, work showcase |
| **Key dependencies** | `@szl-holdings/shared-ui` |
| **Strategic role** | Founder positioning and personal brand — independent from SZL Holdings corporate identity |

---

### API Server

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/api-server` |
| **Preview path** | `/api/` |
| **Status** | Live (internal service) |
| **Audience** | All web and mobile frontends — not user-facing |
| **Core capability** | Centralized Express 5 API server. Handles all authentication, business logic, data access, AI orchestration, WebSocket connections, and billing for the entire ecosystem |
| **Key dependencies** | `@szl-holdings/db`, `@szl-holdings/auth`, `@szl-holdings/ai-engine`, `@szl-holdings/forge-runtime`, `@szl-holdings/observability`, `@szl-holdings/services` |
| **Entry point** | `GET /api/health` (public), `GET /api/docs` (Swagger UI), `POST /api/auth/login` |

---

## Mobile Applications

### CORTEX — Unified Mobile Command (szl-holdings-mobile)

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/szl-holdings-mobile` |
| **Preview path** | `/szl-holdings-mobile/` (Expo tunnel) |
| **Status** | Functional alpha |
| **Screens** | 116 |
| **Audience** | Executives, investors, SZL ecosystem operators |
| **Core capability** | All 8 domain workspaces in one Expo/React Native app — biometric authentication, workspace switcher with cross-domain badge counts, unified command feed, workspace-adaptive AI copilot, SpotlightFab for quick actions |
| **Domains** | Lyte, Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, Command, SZL Holdings |
| **Key dependencies** | `@szl-holdings/mobile-shared`, `@szl-holdings/shared-ui`, `@szl-holdings/ai-engine` |
| **API** | `EXPO_PUBLIC_API_URL` (points to `/api/`) |

### CORTEX Mobile (cortex-mobile)

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/cortex-mobile` |
| **Preview path** | `/cortex-mobile/` |
| **Status** | Work in progress |
| **Purpose** | Next-generation CORTEX mobile experience (separate from szl-holdings-mobile) |

---

## Development / Internal Surfaces

### Component Preview Server (mockup-sandbox)

| Attribute | Detail |
|-----------|--------|
| **Artifact** | `artifacts/mockup-sandbox` |
| **Preview path** | `/__mockup` |
| **Audience** | Internal — design and frontend engineers only |
| **Purpose** | Design sandbox for iterating on `@szl-holdings/shared-ui` components in isolation |

---

## Unregistered / Work in Progress

The following directories exist under `artifacts/` but are not yet deployed artifacts:

| Directory | Notes |
|-----------|-------|
| `artifacts/partner-portal` | In-progress partner/channel portal |
| `artifacts/alloy-mobile` | Mobile companion for Alloy |
| `artifacts/forge` | Internal forge/build tooling workspace |
| `artifacts/nexus` | Internal nexus integration/platform workspace |
| `artifacts/inca-lab` | Intelligence and analytics lab (Aegis research) |

---

## Entry Points Summary

| Surface | URL Pattern | Auth Required |
|---------|-------------|---------------|
| SZL Holdings | `/` | No (public pages) / Yes (app routes) |
| Lyte Command Center | `/lyte-command-center/` | Yes |
| Aegis / Firestorm | `/firestorm/` | Yes |
| Terra | `/terra/` | Yes |
| Vessels | `/vessels/` | Yes |
| PRISM Counsel | `/prism-counsel/` | Yes |
| Carlota Jo | `/carlota-jo/` | No (public) / Yes (portal) |
| IMPERIUM | `/imperium/` | Yes |
| Command Portal | `/command/` | Yes |
| Stephen Site | `/stephen-site/` | No |
| API Server | `/api/` | Varies per endpoint |
| CORTEX Mobile | Expo tunnel URL | Yes (biometric) |
| Swagger Docs | `/api/docs` | No (development) |

See `ROUTE_INVENTORY.md` for the complete per-artifact route inventory with PUBLIC/PRIVATE/INTERNAL classification.

---

## Related Documents

| Document | Path |
|----------|------|
| Product surface map | [PRODUCT_SURFACE_MAP.md](PRODUCT_SURFACE_MAP.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| Category positioning | [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md) |
| Navigation strategy | [NAVIGATION_STRATEGY.md](NAVIGATION_STRATEGY.md) |
| Route inventory | [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) |
| Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| API specification | [API-SPEC.md](API-SPEC.md) |
| Access control | [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) |
