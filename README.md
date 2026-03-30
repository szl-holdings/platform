# SZL Holdings — Platform Ecosystem

**Business Observability at enterprise scale.** SZL Holdings builds and operates technology platforms that connect operational signal to strategic decision — across maritime logistics, security operations, AI research, and enterprise management.

## The Architecture

The SZL platform follows a doctrine hierarchy where each platform has a named role. This is not a product portfolio arranged for presentation — it is a working architecture where each layer has a defined contract with the adjacent ones.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ADVISE                                                             │
│  Carlota Jo Consulting — Brand, Strategy, Advisory                  │
├─────────────────────────────────────────────────────────────────────┤
│  EXECUTE                                                            │
│  AlloyScape — Execution Fabric, Audit, Automation                   │
├─────────────────────────────────────────────────────────────────────┤
│  DECIDE                                                             │
│  Nimbus — Score, Recommend, Explain (cross-platform AI engine)      │
├─────────────────────────────────────────────────────────────────────┤
│  INTERPRET                                                          │
│  Lyte — Route signals, govern models, orchestrate remediation       │
│  INCA — AI Research, experiment tracking, model registry            │
├─────────────────────────────────────────────────────────────────────┤
│  OBSERVE                                                            │
│  Beacon · Business Telemetry    Rosie · Incident Command            │
│  Vessels · Maritime Intelligence    Firestorm · Security Simulation │
└─────────────────────────────────────────────────────────────────────┘
```

**Observe** (Beacon, Rosie, Vessels, Firestorm) — Acquire and structure operational signals across domains. Detect anomalies, vulnerabilities, incidents, and opportunities.
**Interpret** (Lyte, INCA) — Reason across signals: route incidents, govern models, correlate patterns.
**Decide** (Nimbus) — Score any entity type, generate explainable recommendations with confidence scores and rationale.
**Execute** (AlloyScape) — Route intelligence into confirmed, traceable human action with full audit trail.
**Advise** (Carlota Jo) — Translate platform intelligence into strategic decisions, with expert accountability.

### Naming Standard

| Platform | Role | Doctrine Label |
|---|---|---|
| Beacon (Terra) | Business Telemetry | OBSERVE |
| Rosie (MSP) | Threat & Incident Command | OBSERVE / COMMAND |
| Vessels | Maritime Intelligence | TRACK |
| Firestorm | Security Simulation | SECURE |
| Lyte | AIOps Command Center | INTERPRET / ROUTE |
| INCA | AI Research Command | RESEARCH |
| Nimbus (Dreamscape) | Predictive Intelligence | DECIDE / SCORE |
| AlloyScape (Alloy) | Execution Fabric | EXECUTE / AUDIT |
| Carlota Jo | Brand & Strategy Advisory | ADVISE |

---

## Products

### Observe Layer

**Vessels** — Maritime intelligence for fleet operations
Real-time AIS telemetry, voyage economics, route intelligence, maintenance readiness, dark vessel detection, and sanctions screening. Built for fleet executives, operations teams, and commercial directors who need fleet-wide visibility without information overload.

**Rosie (MSP)** — Threat and incident command
SOC-grade incident management, threat intelligence, MITRE ATT&CK coverage, forensics timeline, XDR console, and compliance readiness. Designed for security teams where the cost of a slow response is quantifiably high.

**Beacon (Terra)** — Business telemetry
KPI monitoring, SLO tracking, anomaly detection, workflow latency analysis, and portfolio signal aggregation. Connects infrastructure behaviour to business outcomes for operators and executives.

### Understand Layer

**INCA** — AI research command
Agent orchestration, model registry, experiment management, ensemble evaluation, LLM assessment, GPU monitoring, and explainability tooling. The internal intelligence layer where SZL's AI outputs become traceable, versioned, and accountable.

**Nimbus (Dreamscape)** — Predictive intelligence
Scenario construction, drift monitoring, confidence visualisation, and anomaly correlation. Forward signal analysis for teams that need structured reasoning about what comes next.

### Execute Layer

**AlloyScape (Alloy)** — Execution fabric
The agent coordination layer for the SZL platform. Routes signals through the agent network (Helmsman, Sentinel, Beacon, and others), enforces human-in-the-loop governance, and maintains the audit trail for every confirmed action. Advisory agents recommend; AlloyScape governs what happens next.

### Advise Layer

**Carlota Jo Consulting** — Principal advisory
Brand strategy, content architecture, and operational transformation advisory. Distinct from typical consulting: the advisory capability is informed by the same observability infrastructure that powers the platform products.

### Identity

**Stephen Lutar — Career** — Founder identity
Not a portfolio site. A platform architect's narrative: the thesis, the tech, the track record, and the strategic intent behind the ecosystem.

---

## Core Command Center

The SZL Holdings portal includes a unified **Core Command Center** at `/core` — a cross-platform intelligence dashboard that aggregates live telemetry from all platform layers.

**Summary Cards:**
- Distress Properties — total count from Beacon (NYC + NY)
- High Opportunity — count of properties with opportunity score ≥ 80
- Converted Deals — closed won deals
- Open Vulnerabilities — active Firestorm findings
- Nimbus Recommendations — all-time scored recommendations
- Workflow Runs — AlloyScape jobs in the last 30 days

**Tabs:**
- **Overview** — platform doctrine grid, recent Nimbus recommendations, quick links to all platform products
- **Recommendations** — browse and generate new Nimbus recommendations for any entity type
- **Audit** — cross-platform audit event log with source attribution
- **Services** — real-time health status for all platform APIs (DB latency, uptime)

---

## Platform APIs

The centralised API server (`/api-server`) exposes the following core endpoints in addition to product-specific routes:

| Endpoint | Method | Description |
|---|---|---|
| `/api/core/health` | GET | Real service health: DB latency, connectivity, uptime, timestamp |
| `/api/core/metrics` | GET | Aggregate telemetry across Beacon, Firestorm, AlloyScape, Nimbus |
| `/api/core/recommendations` | POST | Generate a scored Nimbus recommendation for any entity type |
| `/api/core/recommendations` | GET | List stored recommendations (filterable by entity type and platform) |

**Recommendation Request Schema:**
```json
{
  "entityType": "distress_property | lead | deal | vulnerability | incident | asset | vessel | signal | workflow | general",
  "entityId": "optional-entity-id",
  "platform": "beacon | rosie | firestorm | vessels | nimbus | alloy | inca | general",
  "context": { "arbitrary": "metadata" }
}
```

**Recommendation Response:**
```json
{
  "score": 87,
  "confidence": 0.82,
  "reasoning": "Explanation of why this recommendation was made",
  "recommended_action": "Specific actionable next step"
}
```

---

## Key Capabilities

| Capability | Description |
|---|---|
| Shared design system | Every product shares `@workspace/shared-ui` — a TypeScript component library with unified navigation, command palette, agent indicators, and interaction model |
| Agent network | Coordinated advisory agents (Helmsman, Sentinel, Beacon, Muse, Compass) operating under AlloyScape governance |
| Human-in-the-loop | Advisory agents cannot execute consequential actions without explicit human confirmation — enforced at the workflow level |
| Audit trail | Immutable, attributed event log across all products. Every signal, finding, recommendation, and action is traceable |
| Role-based access | Product-specific RBAC (exec, ops, compliance, maintenance) with shared enforcement infrastructure |
| Explainability | AI outputs include reasoning and confidence signals. No black-box scoring |
| Demo / live transparency | Platform state (demo mode, live data, stale cache) is always explicitly labelled |

---

## Technology Stack

| Category | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Routing | Wouter (client-side, path-based monorepo routing) |
| State management | TanStack Query, React Context |
| UI components | Custom `@workspace/shared-ui` (Radix UI primitives) |
| Backend | Node.js, Express, TypeScript |
| AI inference | OpenAI (GPT series), Anthropic (Claude series) |
| Database | PostgreSQL (Drizzle ORM) |
| Charts | Recharts |
| Monorepo | pnpm workspaces |

---

## Repository Structure

```
/
├── artifacts/
│   ├── alloy/               # AlloyScape — Execution Fabric
│   ├── carlota-jo/          # Carlota Jo Consulting
│   ├── dreamscape/          # Nimbus — Predictive Intelligence
│   ├── firestorm/           # Firestorm Security Simulation
│   ├── inca/                # INCA AI Research Command
│   ├── lyte-command-center/ # Lyte / Beacon — Business Telemetry
│   ├── msp/                 # Rosie — Threat & Incident Command
│   ├── stephen-site/        # Career — Founder Identity
│   ├── szl-holdings/        # SZL Holdings — Portfolio Site
│   ├── terra/               # Beacon / Terra — Business Intelligence
│   ├── vessels/             # Vessels Maritime Intelligence
│   └── api-server/          # Centralised API and integration layer
├── lib/
│   ├── shared-ui/           # Shared design system and components
│   ├── db/                  # Drizzle ORM schema and database client
│   ├── services/            # Stripe, email, and third-party adapters
│   ├── auth/                # Authentication service (Replit OIDC)
│   └── analytics/           # Telemetry and event tracking
├── docs/
│   ├── architecture.md      # Four-layer model, entity graph, agent network
│   ├── trust-center.md      # Platform trust, security, AI governance
│   └── investor-narrative.md# Strategic narrative and investment thesis
└── README.md
```

---

## Documentation

- [Architecture](docs/architecture.md) — Four-layer model, entity graph, agent network, technology stack
- [Trust Center](docs/trust-center.md) — Access control, AI governance, deployment discipline, incident readiness
- [Investor Narrative](docs/investor-narrative.md) — Strategic thesis, category definition, expansion logic, defensibility

---

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (provided by Replit managed database)

### Installation

```bash
# Install all workspace dependencies
pnpm install

# Push database schema to development database
pnpm --filter @workspace/db run push

# Seed demo data (optional)
pnpm --filter @workspace/scripts run seed
```

### Starting Services

Each artifact runs as a separate Vite dev server and reads `PORT` from the environment. In Replit, workflows manage this automatically. To start individually:

```bash
# Start the API server
pnpm --filter @workspace/api-server run dev

# Start a specific frontend artifact (e.g. SZL Holdings)
pnpm --filter szl-holdings run dev

# Start all services simultaneously (via Replit workflow manager)
# Each artifact is registered as a separate workflow
```

### Build

```bash
# Build a specific artifact
pnpm --filter szl-holdings run build

# Build all artifacts
pnpm -r run build
```

---

## Environment Variables

All environment variables are managed through Replit Secrets. Do **not** commit secrets to version control.

### Required (Production)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Random secret for session signing (min 32 chars) | `openssl rand -hex 32` |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret for event verification | `whsec_...` |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key (via Replit AI Integration proxy) | Set via Replit Integrations |
| `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | Anthropic API key (via Replit AI Integration proxy) | Set via Replit Integrations |

### Optional

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port for each service to bind on | Assigned by Replit per artifact |
| `NODE_ENV` | Environment mode | `development` |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins | Open in development |
| `LOG_LEVEL` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) | `info` |
| `RESEND_API_KEY` | Resend API key for transactional email | Required for contact forms |
| `SMTP_HOST` | SMTP host for email delivery (alternative to Resend) | — |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | — |
| `SMTP_PASS` | SMTP password | — |
| `SZL_INTERNAL_EMAIL` | Internal routing address for contact form submissions | — |
| `ISSUER_URL` | OIDC issuer URL for Replit Auth | Auto-detected on Replit |
| `VITE_APP_URL` | Base URL for frontend apps (used in email links) | — |
| `VITE_ADMIN_PIN` | PIN for the SZL Holdings admin panel UI gate (client-side only — not a substitute for server-side auth) | Defaults to `szl2026` — **must be changed in production** |

### Stripe Pricing (Carlota Jo Checkout)

| Variable | Description |
|---|---|
| `STRIPE_PRICE_STRATEGY_SESSION` | Stripe Price ID for Strategy Session tier |
| `STRIPE_PRICE_PORTFOLIO_REVIEW` | Stripe Price ID for Portfolio Review tier |
| `STRIPE_PRICE_ADVISORY_RETAINER` | Stripe Price ID for Advisory Retainer tier |

---

## Stripe Webhooks

The API server handles the following Stripe webhook events at `POST /api/billing/webhooks`:

| Event | Description | Handler action |
|---|---|---|
| `checkout.session.completed` | Payment or subscription checkout completed | Creates or links subscription record, logs payment confirmation |
| `customer.subscription.created` | New subscription activated | Inserts subscription into DB with active status |
| `customer.subscription.updated` | Subscription modified (plan change, renewal) | Updates status, `current_period_start`, and `current_period_end` |
| `customer.subscription.deleted` | Subscription cancelled | Sets subscription status to `canceled` |
| `invoice.paid` | Invoice payment succeeded (Stripe's event name for successful invoice payment, also called `invoice.payment_succeeded` in older docs) | Inserts invoice record with `paid` status and amount |
| `invoice.payment_failed` | Payment attempt failed | Marks linked subscription as `past_due` |
| `payment_intent.succeeded` | One-time payment completed | Logged to audit trail; no DB write required |

**Webhook configuration:**
1. In the Stripe Dashboard, create a webhook endpoint pointing to `https://your-domain.com/api/billing/webhooks`
2. Select all seven events listed above
3. Copy the signing secret and set `STRIPE_WEBHOOK_SECRET` in Replit Secrets
4. The endpoint validates every event signature before processing — unsigned events are rejected with 400

---

## Deployment Checklist

Run through this checklist before promoting any release to production.

### Secrets & Configuration

- [ ] `DATABASE_URL` is set to the production database connection string
- [ ] `SESSION_SECRET` is a cryptographically random value (minimum 32 characters)
- [ ] `STRIPE_SECRET_KEY` is the live key (`sk_live_...`), not test key
- [ ] `STRIPE_WEBHOOK_SECRET` is copied from the production Stripe webhook endpoint
- [ ] All `STRIPE_PRICE_*` variables are set to live Stripe Price IDs
- [ ] `AI_INTEGRATIONS_OPENAI_API_KEY` is set (via Replit AI Integrations)
- [ ] `AI_INTEGRATIONS_ANTHROPIC_API_KEY` is set (via Replit AI Integrations)
- [ ] `CORS_ORIGINS` is set to the production domain(s) — do not leave open
- [ ] `RESEND_API_KEY` or SMTP credentials are configured for transactional email
- [ ] `SZL_INTERNAL_EMAIL` is set to the correct internal routing address
- [ ] `NODE_ENV=production` is set

### Auth & Access

- [ ] Replit Auth redirect URIs include the production domain
- [ ] `VITE_ADMIN_PIN` is set to a strong value (not the default `szl2026`)
- [ ] All protected API endpoints return 401 without a valid session token
- [ ] Org-scoped endpoints deny requests from mismatched org IDs
- [ ] Client portal endpoints deny access from non-matching clients

### Build & Start Commands

- [ ] All artifacts build without TypeScript errors: `pnpm -r run build`
- [ ] API server builds successfully: `pnpm --filter @workspace/api-server run build`
- [ ] Database schema is up to date: `pnpm --filter @workspace/db run push`
- [ ] All workflows are registered and start correctly in the Replit workflow manager

### Stripe Webhooks

- [ ] Webhook endpoint is registered in the Stripe Dashboard for production
- [ ] Webhook signing secret matches `STRIPE_WEBHOOK_SECRET`
- [ ] All seven event types from the Stripe Webhooks section are selected in the Stripe Dashboard
- [ ] Test a webhook delivery from the Stripe Dashboard and confirm 200 response

### Frontend

- [ ] All public pages load without console errors at production URL
- [ ] SEO meta tags (title, description, OG) are present on all public pages
- [ ] No placeholder text, "Lorem ipsum", or "Coming soon" labels visible to users
- [ ] All forms validate inline and show loading states on submit
- [ ] Mobile layout verified at 375px, 768px, and 1024px breakpoints
- [ ] All navigation links resolve to real pages (no 404s)

### Security

- [ ] No API keys or secrets are present in frontend JavaScript bundles
- [ ] HTTPS is enforced on the production domain
- [ ] Content-Security-Policy headers are active (enabled by Helmet in production)
- [ ] HSTS headers are set (`max-age=31536000; includeSubDomains; preload`)
- [ ] Rate limiting is active on all API endpoints

---

## Strategic Thesis

The enterprises that will win the next decade are not the ones with the most data. They are the ones that can reason across their data, connect operational signal to strategic decision, and act with confidence — faster than their competitors, and with more accountability than their regulators require.

SZL Holdings is building the platform infrastructure for that outcome. Not as a single product, but as a layered ecosystem where every product makes the others stronger, every data signal compounds across domains, and every AI recommendation is traceable, explainable, and confirmed by a human who understood it.

The category is Business Observability. The architecture is explicit. The compounding has started.

---

*SZL Holdings · Built for operators who cannot afford to be wrong.*
