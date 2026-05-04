# SZL Holdings — Repo Truth Discovery
**Phase:** 0  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)  
**Status:** Final — evidence drawn from live repo walk

---

## 1. Monorepo Overview

| Attribute | Value |
|---|---|
| Package manager | pnpm workspaces |
| TypeScript version | 5.9 (strict mode) |
| Root scripts | `dev`, `build`, `lint`, `typecheck`, `test`, `test:integration`, `test:e2e`, `seed`, `migrate`, `db:migrate`, `audit:all`, `health:check`, `release:prep` |
| Node version | 20 LTS |
| Frontend framework | React 19, Vite, TanStack Query, Wouter, Tailwind CSS v4, Framer Motion |
| Backend framework | Express 5, Drizzle ORM, Zod, Pino |
| Database | PostgreSQL 16 (Replit-managed) |
| Auth | OIDC/PKCE, session-based, 11-role RBAC |
| Mobile | Expo / React Native, NativeWind |
| AI providers | OpenAI, Anthropic, Gemini (via Replit AI proxy) |

---

## 2. Deployable Artifact Inventory (15 total)

### 2.1 Active Web Artifacts (10)

| Dir | Package | Preview Path | Port | Purpose | Auth | Data Mode | Status |
|---|---|---|---|---|---|---|---|
| `artifacts/szl-holdings` | `@workspace/szl-holdings` | `/` | 21130 | Corporate site, investor hub, trust center | Public + OIDC | Real + illustrative | Production-ready |
| `artifacts/api-server` | `@workspace/api-server` | `/api/` | 8080 | REST + GraphQL + WebSocket backend | OIDC/PKCE session | Real PostgreSQL | Production-ready |
| `artifacts/command` | `@workspace/command` | `/command/` | 5000 | Unified ops command center, Demo Launchpad | OIDC required | Real API + DB | Production-ready |
| `artifacts/aegis` | `@workspace/aegis` | `/aegis/` | 3002 | Defense & security intelligence | OIDC required | Real structured + seeded | Production-ready |
| `artifacts/vessels` | `@workspace/vessels` | `/vessels/` | 8099 | Maritime fleet intelligence | OIDC required | Real + demo AIS | Production-ready |
| `artifacts/terra` | `@workspace/terra` | `/terra/` | 6000 | Real estate intelligence | OIDC required | Real + NYC Open Data | Production-ready |
| `artifacts/carlota-jo` | `@workspace/carlota-jo` | `/carlota-jo/` | 8098 | Premium advisory | OIDC required | Real structured | Production-ready |
| `artifacts/sentra` | `@workspace/sentra` | `/sentra/` | 4099 | Cyber resilience (supplementary) | OIDC required | Seeded | Production-ready |
| `artifacts/counsel` | `@workspace/counsel` | `/counsel/` | 4199 | Legal matter command | OIDC required | Seeded | Production-ready |
| `artifacts/prism-counsel` | `@workspace/prism-counsel` | `/prism-counsel/` | 7100 | PRISM legal command | OIDC required | Seeded | Production-ready |
| `artifacts/pulse` | `@workspace/pulse` | `/pulse/` | 5201 | AI executive briefing | OIDC required | Seeded (AI generation partial) | Beta |
| `artifacts/lyte-command-center` | `@workspace/lyte-command-center` | `/lyte/` | 7099 | Decision Intelligence (9 surfaces) | OIDC required | Seeded | Production-ready |

### 2.2 Active Mobile Artifacts (1)

| Dir | Package | Preview | Purpose | Auth |
|---|---|---|---|---|
| `artifacts/szl-holdings-mobile` | `@workspace/szl-holdings-mobile` | Expo tunnel (port 8085) | CORTEX unified mobile command | OIDC required |

### 2.3 Video / Other Artifacts (1)

| Dir | Package | Preview Path | Purpose |
|---|---|---|---|
| `artifacts/szl-demo-video` | `@workspace/szl-demo-video` | `/szl-demo-video/` | Governed Autonomy demo video |

### 2.4 Design / Sandbox Artifacts (1)

| Dir | Package | Preview Path | Purpose |
|---|---|---|---|
| `artifacts/mockup-sandbox` | `@workspace/mockup-sandbox` | `/nexus/` | NEXUS design sandbox — internal tool |

### 2.5 Deprecated / Archived Artifact Directories

| Dir | Status | Notes |
|---|---|---|
| `artifacts/firestorm` | Archived | `DEPRECATED.md` present; Aegis is successor |
| `artifacts/imperium` | Skeleton | No source; `node_modules/` only |
| `artifacts/cortex-mobile` | Active dev, unregistered | Expo config present; no `artifact.toml` |
| `artifacts/audit` | Internal tool | Audit tooling only |
| `artifacts/internal-audit` | Documentation | 18-document capability audit (Singularity Program) |

---

## 3. Shared Library Inventory (lib/ — 40 directories)

| Library | Package Name | Purpose |
|---|---|---|
| `lib/action-engine` | `@szl-holdings/action-engine` | Action execution and coordination |
| `lib/ai-engine` | `@szl-holdings/ai-engine` | Multi-provider AI wrappers, eval hooks, trace |
| `lib/analytics` | `@szl-holdings/analytics` | Analytics event tracking |
| `lib/api-client-react` | `@szl-holdings/api-client-react` | React Query hooks (generated) |
| `lib/api-spec` | `@szl-holdings/api-spec` | OpenAPI 3.1 specification |
| `lib/api-zod` | `@szl-holdings/api-zod` | Zod schemas for API validation |
| `lib/approvals` | `@szl-holdings/approvals` | Multi-step approval workflow types |
| `lib/atlas-artifacts` | `@szl-holdings/atlas-artifacts` | Atlas artifact registration |
| `lib/atlas-spatial-runtime` | `@szl-holdings/atlas-spatial-runtime` | Spatial graph runtime |
| `lib/audit` | `@szl-holdings/audit` | Immutable audit trail |
| `lib/auth` | `@szl-holdings/auth` | Auth types, OIDC helpers |
| `lib/config` | `@szl-holdings/config` | Platform constants, app registry, roles |
| `lib/covenant-policy` | `@szl-holdings/covenant-policy` | Policy enforcement |
| `lib/crdt-sync` | `@szl-holdings/crdt-sync` | CRDT-based real-time sync |
| `lib/data-connectors` | `@szl-holdings/data-connectors` | External data source connectors |
| `lib/db` | `@szl-holdings/db` | Drizzle ORM schema, migrations, PostgreSQL |
| `lib/decision-engine` | `@szl-holdings/decision-engine` | Decision scoring and recommendations |
| `lib/decision-fabric` | `@szl-holdings/decision-fabric` | Decision trace fabric |
| `lib/forge-runtime` | `@szl-holdings/forge-runtime` | Alloy workflow execution internals |
| `lib/graphql-client` | `@szl-holdings/graphql-client` | Apollo GraphQL client |
| `lib/i18n` | `@szl-holdings/i18n` | Internationalization |
| `lib/intelligence-feeds` | `@szl-holdings/intelligence-feeds` | AIS, STIX/TAXII, legal, CISA KEV, NVD, MITRE |
| `lib/mcp-client` | `@szl-holdings/mcp-client` | MCP protocol client |
| `lib/mobile-shared` | `@szl-holdings/mobile-shared` | Shared mobile primitives |
| `lib/monte-carlo` | `@szl-holdings/monte-carlo` | Monte Carlo simulation engine |
| `lib/object-storage-web` | `@szl-holdings/object-storage-web` | GCS-backed object storage |
| `lib/observability` | `@szl-holdings/observability` | Structured logging, metrics |
| `lib/offline-engine` | `@szl-holdings/offline-engine` | Offline-first sync primitives |
| `lib/outcome-graph` | `@szl-holdings/outcome-graph` | Decision outcome graph |
| `lib/policy-engine` | `@szl-holdings/policy-engine` | Policy check primitives |
| `lib/proof-chain` | `@szl-holdings/proof-chain` | Immutable proof chain |
| `lib/pulse-evals` | `@szl-holdings/pulse-evals` | Pulse briefing evaluation |
| `lib/receipt-graph` | `@szl-holdings/receipt-graph` | Trust receipt graph |
| `lib/replit-auth-web` | `@szl-holdings/replit-auth-web` | Replit Auth web integration |
| `lib/scene-export` | `@szl-holdings/scene-export` | Atlas scene export |
| `lib/services` | `@szl-holdings/services` | Service layer helpers |
| `lib/shared-ui` | `@szl-holdings/shared-ui` | OS-layer UI primitives (Decision Center, Run Console) |
| `lib/workflow-engine` | `@szl-holdings/workflow-engine` | Durable workflow engine |
| `lib/worldline` | `@szl-holdings/worldline` | Timeline event primitives |

---

## 4. Packages Inventory (packages/ — 45+ directories)

| Package | Package Name | Purpose |
|---|---|---|
| `packages/action-engine` | `@workspace/action-engine` | Cross-app action engine runtime |
| `packages/ai-control-plane` | `@szl-holdings/ai-control-plane` | Provider-agnostic AI infrastructure |
| `packages/alloy` | `@workspace/alloy` | Cognitive runtime, workflow execution |
| `packages/approvals-inbox` | `@workspace/approvals-inbox` | Approval inbox primitives |
| `packages/atlas-core` | `@szl-holdings/atlas-core` | ATLAS entity model |
| `packages/atlas-events` | `@szl-holdings/atlas-events` | ATLAS event taxonomy |
| `packages/atlas-types` | `@szl-holdings/atlas-types` | ATLAS type definitions |
| `packages/brand-registry` | `@szl-holdings/brand-registry` | Single source of truth for brand vocabulary |
| `packages/business-events` | `@szl-holdings/business-events` | Business event emission |
| `packages/cognitive-observability` | `@workspace/cognitive-observability` | Agent run observability |
| `packages/cognitive-runtime` | `@workspace/cognitive-runtime` | AI cognitive runtime |
| `packages/config` | `@workspace/config` | Workspace configuration |
| `packages/connectors` | `@szl-holdings/connectors` | Connector adapter implementations |
| `packages/constellation` | `@workspace/constellation` | World model graph (CONSTELLATION) |
| `packages/decision-engine` | `@workspace/decision-engine` | Decision ranking engine |
| `packages/demo-seed` | `@workspace/demo-seed` | Demo seeding utilities |
| `packages/design-system` | `@szl-holdings/design-system` | Governed-intelligence design system |
| `packages/eval-forge` | `@workspace/eval-forge` | Eval suite management |
| `packages/eval-os` | `@workspace/eval-os` | Eval OS (runner + registry) |
| `packages/evals-core` | `@szl-holdings/evals-core` | Core evaluation infrastructure |
| `packages/evidence-graph` | `@szl-holdings/evidence-graph` | Evidence item graph |
| `packages/executive-briefing` | `@workspace/executive-briefing` | Executive briefing generation |
| `packages/guardian` | `@workspace/guardian` | Safety and compliance guardian |
| `packages/marketing` | `@workspace/marketing` | Marketing site primitives |
| `packages/memory-fabric` | `@workspace/memory-fabric` | Tiered memory with provenance |
| `packages/nvidia-adapters` | `@szl-holdings/nvidia-adapters` | NVIDIA integration adapters |
| `packages/observability-core` | `@szl-holdings/observability-core` | OpenTelemetry setup |
| `packages/ontology` | `@workspace/ontology` | Canonical entity/domain type vocabulary |
| `packages/openusd-export` | `@szl-holdings/openusd-export` | OpenUSD digital twin export |
| `packages/planner` | `@workspace/planner` | Agent planning primitives |
| `packages/policy-engine` | `@workspace/policy-engine` | Policy enforcement engine |
| `packages/prompt-registry` | `@szl-holdings/prompt-registry` | Prompt registry and versioning |
| `packages/reflection-engine` | `@workspace/reflection-engine` | Self-improvement and skill scoring |
| `packages/replay-core` | `@szl-holdings/replay-core` | Incident replay infrastructure |
| `packages/self-model` | `@workspace/self-model` | ATLAS self-model inspection |
| `packages/signal-mesh` | `@szl-holdings/signal-mesh` | 9-stage signal processing pipeline |
| `packages/simulation` | `@workspace/simulation` | Monte Carlo simulation runtime |
| `packages/skill-library` | `@workspace/skill-library` | Governed skill registry |
| `packages/szl-alloy` | `@workspace/szl-alloy` | Alloy orchestration layer |
| `packages/telemetry-standards` | `@szl-holdings/telemetry-standards` | OpenTelemetry semantic conventions |
| `packages/tool-mesh` | `@workspace/tool-mesh` | Tool invocation mesh |
| `packages/tool-registry` | `@szl-holdings/tool-registry` | Tool registry and versioning |
| `packages/trace-graph` | `@workspace/trace-graph` | Canonical trace graph (agent runs, model calls) |
| `packages/verifier` | `@workspace/verifier` | Agent verifier and policy check |

---

## 5. Frontend Route Inventory (by artifact)

### szl-holdings (Corporate Dashboard)
`/`, `/about`, `/products`, `/platform`, `/lyte`, `/command`, `/vessels`, `/terra`, `/carlota-jo`, `/aegis`, `/sentra`, `/trust`, `/legal/privacy`, `/legal/terms`, `/legal/dpa`, `/investor`, `/founder`, `/contact`, `/demo`, `/blog`, `/press`

### Command (Unified Ops)
`/command/`, `/command/overview`, `/command/signals`, `/command/operations/alloy/*`, `/command/operations/agents`, `/command/governance/*`, `/command/cognitive/*`, `/command/demo` (Demo Launchpad)

### Lyte (Decision Intelligence)
`/lyte/`, `/lyte/overview`, `/lyte/signals`, `/lyte/entity-graph`, `/lyte/decision-center`, `/lyte/decision-twin`, `/lyte/workflow-health`, `/lyte/run-console`, `/lyte/evidence-explorer`, `/lyte/policy-center`, `/lyte/eval-studio`, `/lyte/board`, `/lyte/ownership-drift`, `/lyte/pressure-map`, `/lyte/action-debt`, `/lyte/decision-replay`

### Aegis (Cyber Resilience)
`/aegis/`, `/aegis/soc-dashboard`, `/aegis/threat-intelligence`, `/aegis/incidents`, `/aegis/alerts`, `/aegis/vulnerabilities`, `/aegis/mitre-attack`, `/aegis/soar-playbooks`, `/aegis/compliance`, `/aegis/identity-blast-radius`, `/aegis/xdr-console`, `/aegis/adversary-narrative-engine`

### Vessels (Maritime Intelligence)
`/vessels/`, `/vessels/fleet`, `/vessels/voyage-risk-twin`, `/vessels/ais-tracking`, `/vessels/sanctions-screening`, `/vessels/route-anomaly`, `/vessels/vessel-profile`, `/vessels/voyage-economics`, `/vessels/insurance`, `/vessels/trading`, `/vessels/platform`

### Terra (Real Estate Intelligence)
`/terra/`, `/terra/map`, `/terra/why-this-property-now`, `/terra/distress-engine`, `/terra/ownership-graph`, `/terra/portfolio`, `/terra/deals`, `/terra/investment-analysis`, `/terra/pro-forma`, `/terra/avm`, `/terra/comparable-sales`, `/terra/watchlist`

### Carlota Jo (Premium Advisory)
`/carlota-jo/`, `/carlota-jo/overview`, `/carlota-jo/cases`, `/carlota-jo/concierge`, `/carlota-jo/clients`, `/carlota-jo/billing`, `/carlota-jo/reports`, `/carlota-jo/settings`

### Sentra (Cyber Supplementary)
`/sentra/`, `/sentra/dashboard`, `/sentra/incidents`, `/sentra/assets`, `/sentra/threats`, `/sentra/reports`

### Counsel (Legal Matter)
`/counsel/`, `/counsel/matters`, `/counsel/documents`, `/counsel/research`, `/counsel/timeline`, `/counsel/contacts`

### PRISM Counsel (Legal Command)
`/prism-counsel/`, `/prism-counsel/matters`, `/prism-counsel/evidence`, `/prism-counsel/timeline`, `/prism-counsel/research`

### Pulse (Executive Briefing)
`/pulse/`, `/pulse/briefings`, `/pulse/settings`, `/pulse/archive`

---

## 6. Backend API Inventory

| Category | Count | Key Routes |
|---|---|---|
| Auth | ~10 | `/api/auth/*`, `/api/session`, `/api/logout` |
| Health | 3 | `/api/health`, `/api/health/detailed`, `/api/health/ready` |
| Users & RBAC | ~15 | `/api/users/*`, `/api/roles/*`, `/api/permissions/*` |
| Alloy / Workflow | ~30 | `/api/alloy/*`, `/api/workflows/*`, `/api/approvals/*` |
| AI / Agents | ~25 | `/api/ai/*`, `/api/agents/*`, `/api/agent-*` |
| Policy | ~15 | `/api/policy/*`, `/api/covenant-policy/*` |
| Lyte / Decision | ~20 | `/api/decisions/*`, `/api/signals/*`, `/api/recommendations/*` |
| Vessels / Maritime | ~15 | `/api/vessels/*`, `/api/ais/*`, `/api/sanctions/*` |
| Terra / Real Estate | ~15 | `/api/terra/*`, `/api/properties/*` |
| Aegis / Security | ~20 | `/api/aegis/*`, `/api/threats/*`, `/api/incidents/*` |
| Carlota Jo | ~10 | `/api/carlota-jo/*`, `/api/clients/*` |
| Counsel / Legal | ~10 | `/api/counsel/*`, `/api/matters/*` |
| Pulse / Briefings | ~10 | `/api/briefings/*`, `/api/pulse/*` |
| Analytics | ~10 | `/api/analytics/*`, `/api/events/*` |
| Billing | ~10 | `/api/billing/*`, `/api/stripe/*` |
| Admin | ~15 | `/api/admin/*` |
| GraphQL | 1 | `/api/graphql` |
| WebSocket | 3 | `/ws/signals`, `/ws/agents`, `/ws/alloy` |
| **Total route files** | **254** | — |

---

## 7. Database Schema Inventory

| Domain | Tables (est.) | Key Tables |
|---|---|---|
| Users / Auth / RBAC | ~30 | `users`, `sessions`, `roles`, `role_assignments`, `permissions` |
| Tenancy | ~10 | `tenants`, `tenant_users`, `tenant_settings` |
| Decisions / Lyte | ~40 | `decisions`, `signals`, `recommendations`, `simulations`, `entities` |
| Workflow / Alloy | ~50 | `workflows`, `workflow_steps`, `workflow_runs`, `approvals`, `actions` |
| Policy | ~20 | `policies`, `policy_versions`, `policy_checks`, `covenants` |
| Proof Chain | ~15 | `proof_entries`, `trust_receipts`, `audit_events` |
| Vessels | ~30 | `vessels`, `voyages`, `ais_positions`, `vessel_risks`, `sanctions_hits` |
| Terra | ~30 | `properties`, `deals`, `ownership_records`, `distress_scores`, `pro_formas` |
| Aegis / Security | ~40 | `threats`, `incidents`, `vulnerabilities`, `mitre_techniques`, `alerts` |
| Carlota Jo | ~20 | `clients`, `cases`, `service_requests`, `invoices` |
| Counsel / Legal | ~20 | `matters`, `documents`, `evidence`, `legal_contacts` |
| AI / Agents | ~40 | `agent_runs`, `agent_tools`, `memory_records`, `eval_runs` |
| Analytics | ~20 | `events`, `sessions`, `metrics`, `funnels` |
| Billing | ~20 | `subscriptions`, `invoices`, `usage_events`, `stripe_customers` |
| **TOTAL** | **~700** | — |

---

## 8. Migrations Inventory

| Migration system | Drizzle ORM (`lib/db`) |
|---|---|
| Migration command | `pnpm --filter @szl-holdings/db run migrate` or `pnpm db:migrate` |
| Push command (non-interactive) | `pnpm --filter @szl-holdings/db run push-non-interactive` |
| Migration files | `lib/db/migrations/` |
| Status | Tested; some tables (eval_forge_*, platform_settings) pending run in current dev env |
| Known missing tables | `platform_settings`, `eval_forge_suites`, `eval_forge_runs` (non-fatal for demo) |

---

## 9. Job / Scheduler Inventory

| Job | Type | Trigger | Purpose |
|---|---|---|---|
| AIS polling | Scheduled (cron) | Configurable interval | Maritime vessel position updates |
| STIX/TAXII feed | Scheduled (cron) | Configurable interval | Threat intelligence ingestion |
| CISA KEV polling | Scheduled (cron) | Daily | CVE alert ingestion |
| NVD CVE polling | Scheduled (cron) | Daily | Vulnerability data refresh |
| OFAC/EU/UN sanctions | Scheduled (cron) | Daily | Sanctions list refresh |
| CourtListener feed | Scheduled (cron) | Configurable | Legal case updates |
| Alloy workflow runner | Durable job queue | Event-driven | Background workflow execution |
| Briefing generation | Scheduled + on-demand | Daily + trigger | Pulse briefing synthesis |
| Email delivery | Event-driven | Triggered | Resend/SendGrid email dispatch |
| Analytics flush | Scheduled | 30s batches | Event batching to analytics provider |

---

## 10. Secrets / Config Inventory

**Required secrets (production):**

| Variable | Purpose | Status |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | Set (Replit-managed) |
| `SESSION_SECRET` | Session cookie signing | Must set (prod) |
| `ALLOY_INTERNAL_TOKEN` | Internal service auth | Must set (prod) |
| `CONNECTOR_ENCRYPTION_KEY` | OAuth token encryption | Must set (prod) |
| `ISSUER_URL` | OIDC issuer URL | Must set (prod) |
| `PUBLIC_APP_URL` | Canonical public URL | Must set (prod) |
| `CORS_ORIGINS` | CORS origins | Must set (prod) |
| `SECRET_ENCRYPTION_KEY` | Secrets encryption | Must set (prod) |
| `IP_HASH_SALT` | IP anonymization | Must set (prod) |
| `OAUTH_STATE_SECRET` | OAuth state signing | Must set (prod) |

**Conditional secrets:**

| Variable | Purpose | Status |
|---|---|---|
| `STRIPE_SECRET_KEY` | Payment processing | Test mode configured |
| `SENTRY_DSN` | Error tracking | Code ready; DSN not set |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Tracing | Code ready; endpoint not set |
| `RESEND_API_KEY` | Email delivery | Not set (GAP-001) |
| `MARINETRAFFIC_API_KEY` | Live AIS data | Not set (GAP-003) |
| `MAPBOX_PUBLIC_TOKEN` | Map rendering | Set |
| `AI_INTEGRATIONS_*` | AI provider proxies | Set via Replit integration |
| `POSTHOG_API_KEY` | Product analytics | Set |
| `AMPLITUDE_API_KEY` | Analytics | Set |

---

## 11. Third-Party Integration Inventory

| Integration | Status | Notes |
|---|---|---|
| Stripe | Test mode, webhook configured | No live checkout UI |
| Sentry | Code ready; DSN not provisioned | LB-003 |
| PostHog | Configured (PASS in smoke test) | |
| Amplitude | Configured (PASS) | |
| Google Maps | Configured | |
| Mapbox | Token configured | |
| OpenAI / Anthropic / Gemini | Via Replit AI proxy | |
| HuggingFace | Direct API key | |
| ElevenLabs | Direct API key | Voice synthesis |
| Slack | Webhook configured | |
| Twilio | Configured | SMS/voice |
| Resend | Not configured | GAP-001 |
| SendGrid | Not configured | Backup email |
| MarineTraffic | Not configured | GAP-003 |
| STIX/TAXII | Polling code present; not actively scheduled | |
| CourtListener | Code present; no auth token | GAP-015 |
| GitHub | Connected (Replit integration) | |

---

## 12. Feature Flag Inventory

| Flag | Location | Purpose | Default |
|---|---|---|---|
| `FEATURE_LIVE_AI_BRIEFINGS` | Pulse artifact | Enable live AI briefing generation | OFF (seeded content) |
| `FEATURE_LIVE_AIS` | Vessels artifact | Enable live MarineTraffic AIS feed | OFF (demo AIS) |
| `FEATURE_STRIPE_LIVE` | API server | Enable Stripe live keys | OFF (test mode) |
| `FEATURE_SSO_SCIM` | Auth layer | Enable SSO/SCIM provisioning | OFF |
| `FEATURE_EMAIL_DELIVERY` | API server | Enable Resend email dispatch | OFF (no DSN) |
| `AI_EXECUTION_MODE` | AI engine | Override AI mode (live/demo) | Contextual |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Observability | Enable OTEL export | Not set |

---

## 13. Claimed Abilities Inventory (from README / docs / marketing)

See `/launch/01_ability_matrix.json` for the machine-readable row-per-ability matrix.

**Summary:** 89 claimed capabilities cataloged. Status distribution:
- working: 72 (81%)
- partial: 9 (10%)
- mock/dormant: 6 (7%)
- broken: 2 (2%)

**Key capability clusters:**
- Platform primitives (8): 87.5% working
- Lyte decision intelligence (14): 100% working
- Command / Alloy (20): 100% working
- Terra real estate (13): 85% working
- Aegis cyber (12): 83% working
- Vessels maritime (9): 67% working (AIS is mock; labeled)
- Carlota Jo advisory (8): 87.5% working
- Counsel / PRISM (6): 83% working
- Pulse briefings (5): 60% working (AI generation not live)
- Cross-cutting / platform (13): 85% working
