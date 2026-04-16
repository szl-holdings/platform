# System Overview — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Source of truth for:** technical architecture organized around the governed decision loop

---

## Architecture Thesis

The SZL Holdings platform is organized around a single architectural principle: **every consequential decision follows the same governed loop**, regardless of which domain it originates in.

```
Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome
```

The platform provides the infrastructure for this loop. Domain packs provide the signal sources, analysis models, and action vocabularies. The loop itself — the governance — is shared.

---

## Platform Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMMAND SURFACES                                                        │
│                                                                          │
│  Lyte (web)        Command Portal (web)        CORTEX (mobile)          │
│  Operator command   Ecosystem overview          All domains, one app     │
│  surface            8-domain dashboard          Biometric auth           │
├─────────────────────────────────────────────────────────────────────────┤
│  DOMAIN PACKS                                                            │
│                                                                          │
│  Aegis          Vessels        Terra         PRISM Counsel   Carlota Jo │
│  Security &     Maritime       Real Estate   Legal Matter    Premium    │
│  Defense        Intelligence   Intelligence  Command         Advisory   │
│  Intelligence                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│  GOVERNANCE INFRASTRUCTURE (shared by all domains)                      │
│                                                                          │
│  Outcome Graph  │  Proof Chain  │  Covenant Policy  │  Monte Carlo      │
│  Decision        │  Immutable    │  Permission &     │  Risk             │
│  lifecycle       │  audit trail  │  approval gates   │  simulation       │
│                                                                          │
│  Workflow Engine  │  PRISM Bus  │  AI Engine  │  RBAC + Auth            │
│  Process          │  Cross-domain│  Model      │  11-role hierarchy      │
│  orchestration    │  event bus   │  orchestration│  Org-scoped isolation  │
├─────────────────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                              │
│                                                                          │
│  PostgreSQL 16 (Drizzle ORM)  │  685 tables  │  112 schema files       │
│  External feeds (AIS, STIX, sanctions, court records, market data)      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Governed Decision Loop

### Step 1: Signal Ingestion

Signals arrive from external integrations, internal events, or scheduled data feeds.

| Domain | Signal Sources |
|--------|---------------|
| Aegis | STIX/TAXII threat feeds, MITRE ATT&CK, CVE databases, CISA KEV, endpoint telemetry |
| Vessels | AIS telemetry (MarineTraffic, AISHub, Digitraffic), port records, sanctions lists (OFAC, EU, UN) |
| Terra | NYC public records, MLS listings, Census/BLS data, FEMA risk indices |
| PRISM Counsel | CourtListener filings, NY court records, deadline triggers |
| Carlota Jo | Client inquiry forms, booking events, document delivery triggers |
| Lyte | Cross-domain operational metrics, approval queue changes, SLA breach signals |

Signals are normalized by PRISM Bus (`@szl-holdings/prism-bus`) into a common event format with domain, severity, correlation ID, and timestamp.

### Step 2: Context and Correlation

The signal is enriched with context from across domains. PRISM Bus enables cross-domain correlation — a sanctions alert from Vessels can trigger a related case check in PRISM Counsel, which can surface a risk flag in Lyte.

### Step 3: AI Recommendation

An AI agent (via `@szl-holdings/ai-engine`) analyzes the signal and proposes an action. The recommendation includes:
- Source citations (what evidence supports this recommendation)
- Confidence score (calibrated by historical outcome data)
- Proof chain entry (provenance metadata for the AI output)
- Domain context (which domain pack this recommendation applies to)

### Step 4: Risk Simulation

For high-stakes decisions, the Monte Carlo engine (`@szl-holdings/monte-carlo`) runs probabilistic simulations before the recommendation is presented. Operators see not just "what to do" but "what could happen" — with confidence intervals and sensitivity rankings.

### Step 5: Policy Check

The Covenant Policy engine (`@szl-holdings/covenant-policy`) evaluates whether the recommended action:
- Is permitted by the user's role and organizational context
- Requires human approval (and from whom)
- Meets domain-specific regulatory requirements
- Has been cleared for auto-execution (if applicable)

### Step 6: Human Approval

If the policy requires approval, the action enters the approval queue. The operator reviews the recommendation, the simulation results, and the evidence in Lyte (web) or CORTEX (mobile), then approves, rejects, or overrides.

### Step 7: Action Execution

The Workflow Engine (`@szl-holdings/workflow-engine`) executes the action as a durable, multi-step process. Each step is logged, state is preserved, and the process can recover from failures.

### Step 8: Proof Recording

The Proof Chain (`@szl-holdings/proof-chain`) records the complete audit trail: signal → recommendation → simulation → policy decision → approval → execution → outcome. Every entry includes actor attribution, timestamp, and evidence references.

### Step 9: Outcome Tracking

The Outcome Graph (`@szl-holdings/outcome-graph`) records the real-world result. Was the recommendation accepted? Did the action achieve its intended outcome? This data feeds back into agent confidence calibration and Monte Carlo model tuning.

---

## Service Topology

```
┌──────────────────────────────────────────────────────────────────────┐
│  CLIENTS                                                              │
│                                                                       │
│  Web Apps (React + Vite)              Mobile (Expo / React Native)   │
│  szl-holdings  lyte-command-center    szl-holdings-mobile (CORTEX)   │
│  aegis         terra                  cortex-mobile                  │
│  vessels       prism-counsel                                         │
│  carlota-jo    command                                               │
│  imperium                                                            │
└────────────────────┬──────────────────┬──────────────────────────────┘
                     │  HTTPS           │  HTTPS
                     ▼                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│  API SERVER  (artifacts/api-server)                                    │
│                                                                       │
│  Express 5  ·  172 route files  ·  2,331 endpoints                   │
│  Global auth enforcer (deny-by-default on /api/*)                    │
│  REST + GraphQL (Apollo) + WebSocket + MCP                           │
│                                                                       │
│  Governance middleware chain:                                         │
│    correlationId → apiVersion → helmet → CORS → rateLimiter →        │
│    telemetry → auth → CSRF → globalAuthEnforcer → tenantScope        │
└────────────────────┬──────────────────┬──────────────────────────────┘
                     │                  │
                     ▼                  ▼
┌─────────────────────────┐  ┌─────────────────────────────────────────┐
│  PostgreSQL 16           │  │  External Services                      │
│  685 tables (Drizzle)    │  │  AI: OpenAI, Anthropic, Gemini          │
│  Org-scoped isolation    │  │  Payments: Stripe                       │
│  112 schema files        │  │  Email: Resend / SendGrid / SMTP        │
│                          │  │  Intel: AIS, STIX/TAXII, sanctions      │
│                          │  │  Maps: Mapbox, Google Maps              │
│                          │  │  Legal: CourtListener                   │
└─────────────────────────┘  └─────────────────────────────────────────┘
```

---

## Authentication and Authorization

1. **Authentication:** OIDC/PKCE or password-based login. Session stored in database, delivered as `sid` cookie.
2. **Global auth enforcer:** Deny-by-default on all `/api/*` routes. Explicit public allowlist for health, auth, webhooks, SCIM, and docs endpoints.
3. **RBAC:** 11-role hierarchy (`super_admin` → `demo`). Route-level guards via `requireRole()`.
4. **Tenant isolation:** All queries scoped by `org_id`. Cross-org access returns 404 (not 403) to prevent information leakage.
5. **WebSocket:** HMAC-signed tickets with 5-minute TTL.
6. **CSRF:** Double-submit cookie on all mutating requests.

---

## Real-Time Communication

| Channel | Technology | Purpose |
|---------|-----------|---------|
| WebSocket | `ws` library with signed tickets | Aegis alerts, Vessels AIS, Lyte signals |
| SSE | Server-Sent Events | Command Portal 8-domain dashboard |
| Push | VAPID / Expo Push | CORTEX mobile notifications |
| PRISM Bus | Internal event bus | Cross-domain signal correlation |

---

## AI Architecture

All AI agents are **advisory only** — they surface intelligence and recommendations but require explicit human confirmation before executing consequential actions.

| Component | Purpose |
|-----------|---------|
| `@szl-holdings/ai-engine` | Model routing, safety rails, telemetry, multi-provider support |
| Provider fallback | OpenAI → Anthropic → Gemini (configurable priority) |
| Evidence retrieval | Hybrid retrieval with source citations and confidence scoring |
| Schema validation | 9 validated decision types (risk assessment, recommendation, forecast, etc.) |
| MCP server | 23 tools, 4 resources, 5 prompt templates via `/api/mcp` |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (full stack) |
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| Mobile | Expo / React Native, NativeWind |
| Backend | Express 5, Node.js |
| Database | PostgreSQL 16, Drizzle ORM |
| AI | OpenAI, Anthropic, Gemini (multi-provider with fallback) |
| Auth | OIDC/PKCE, 11-role RBAC, SCIM 2.0 |
| Monorepo | pnpm workspaces, 51 packages |
| Real-time | WebSocket, SSE, push notifications |
| Event system | PRISM Bus (cross-domain), Forge Runtime (agent execution) |

---

## Related Documents

| Document | Path |
|----------|------|
| Architecture (detailed) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| Category positioning | [CATEGORY_POSITIONING.md](CATEGORY_POSITIONING.md) |
| Product surfaces | [PRODUCT-SURFACES.md](PRODUCT-SURFACES.md) |
| API specification | [API-SPEC.md](API-SPEC.md) |
| Data model | [DATA-MODEL.md](DATA-MODEL.md) |
| Access control | [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) |
