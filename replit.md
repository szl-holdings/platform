# DreamStack Platform

## Overview
DreamStack is a pnpm monorepo containing a suite of 14 interconnected applications built with TypeScript, sharing a common PostgreSQL database, authentication system, and design system. Built for "Stephen L" — technology consultant and founder of SZL Holdings. The platform provides an integrated ecosystem for maritime intelligence, cybersecurity operations, AI research, creative production, organizational readiness, operations command, real estate intelligence, strategic advisory, and corporate/personal portfolios.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (60+ tables across 20 schema files).
- **Authentication:** Session-based with Replit Auth fallback, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
Premium dark-mode-forward design via `@workspace/shared-ui`. Navy background (220 20% 4%), primary indigo/violet (250 90% 65%), Plus Jakarta Sans display font, Inter body font. Glassmorphism effects, gradients, shadows, and Framer Motion animations. Military/NASA command center aesthetic on operational apps (Vessels, Firestorm, Lyte, INCA, Readiness). Components include KPI ribbon, chart container, data table shell, AgentCopilot, and advanced form elements.

### Applications (14 total)

#### Portfolio & Brand
- **Project List (`project-list`, route: `/`):** Main portfolio with hero section, project showcase, and social links.
- **Stephen Site (`stephen-site`, route: `/stephen/`):** Founder/CEO personal brand — "Builder. Architect. Operator." positioning with case studies ($12M fuel savings, 52% faster incident response), ecosystem health monitoring, and strategic advisory rates ($25K-$150K).
- **SZL Holdings (`szl-holdings`, route: `/szl-holdings/`):** Holding company corporate portal — "The Future Is Engineered" cinematic hero, animated portfolio with 4-metric company cards, 11-milestone funding timeline (seed $2.4M → Series B $45M), constellation ecosystem visualization with particle system.

#### Operational Platforms
- **Vessels (`vessels`, route: `/vessels/`):** Maritime intelligence command center — 18 realistic vessels (Panamax, VLCC, Valemax, Arc7 LNG), CII emissions per IMO MEPC.352(78), Bosporus/Turkish Straits chokepoint intelligence, OFAC/EU sanctions monitoring. Military UI: "CLASSIFICATION: UNCLASSIFIED".
- **Firestorm (`firestorm`, route: `/firestorm/`):** SOC Operations Center — incidents (Kanban), MITRE ATT&CK mapping, compliance frameworks (NIST CSF, FedRAMP, FISMA), real-time alerts with NVD CVE proxy, SOC dashboard with MTTD/MTTR metrics. DB-backed incidents, compliance controls, and alerts.
- **Lyte Command Center (`lyte-command-center`, route: `/lyte-command-center/`):** Operations command — real-time infrastructure telemetry (4 regions, 47 services, 12 K8s clusters), 99.97% uptime, 24 realistic signals (CloudWatch, PagerDuty, Datadog, Sentry), 12 production incidents, cost optimization recommendations ($197k-$628k savings), SOC 2/GDPR/ISO 27001 compliance references.
- **INCA (`inca`, route: `/inca/`):** AI Research Command Center — 10 programs (TITAN LLM 70B, AEGIS Nav, HELIX Drug Discovery), 25 experiments with realistic ML hyperparameters, real benchmarks (MMLU, nuScenes, CASP15), compute utilization (A100/H100/TPU v4), government AI program references (NAIRR, EU AI Act).
- **Readiness Report (`readiness-report`, route: `/readiness-report/`):** Organizational readiness — NIST CSF/ISO 27001/CMMC frameworks, Zero-Trust Architecture Migration program, 3-tier color system (green/amber/red), 8 compliance dimensions, EO 14028 SBOM references.
- **Terra (`terra`, route: `/terra/`):** Real estate intelligence — portfolio dashboard with 8 properties, market intelligence (8 regions), deal pipeline (5-stage Kanban), revenue/occupancy analytics, risk/alert center.

#### Creative & Advisory
- **Dreamscape (`dreamscape`, route: `/dreamscape/`):** Creative production platform — 6 campaigns ($340K-$2.4M budgets), AI tools (Stable Diffusion XL, RunwayML Gen-3 Alpha, ElevenLabs V2), industry-standard storyboards with shot types, department-based approval workflows (Creative/Client/Legal/Production/Media). "CREATIVE ENGINE" branding.
- **Carlota Jo (`carlota-jo`, route: `/carlota-jo/`):** Strategic advisory — "Counsel for Consequential Decisions" for Fortune 500/sovereign wealth/PE. Porter's Five Forces, BCG matrix, COSO ERM frameworks. Executive Strategy Sessions to Senior Advisory Retainers. Confidential inquiry with NDA.

#### Infrastructure
- **Admin Panel (`admin-panel`, route: `/admin/`):** System administration — health monitoring, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, environment readiness.
- **API Server (`api-server`):** Express 5 backend with 60+ REST endpoints, structured logging, rate limiting, CORS, Zod validation, Drizzle ORM.

### Database Schema
60+ tables across 20 schema files in `lib/db/src/schema/`:
- **Auth:** users, sessions, roles, user_roles, organizations, org_members
- **Billing:** billing_plans, subscriptions, invoices, entitlements, usage_events
- **Vessels:** vessels, vessels_fleets, vessels_positions, vessels_routes, vessels_alerts, vessels_cargo, vessels_simulations, vessels_weather_snapshots, vessels_alert_rules
- **Firestorm:** firestorm_scenarios, firestorm_assessments, firestorm_simulation_runs, firestorm_findings, firestorm_risk_scores, firestorm_incidents, firestorm_compliance_controls, firestorm_alerts, firestorm_campaigns, firestorm_leads, firestorm_analytics
- **Lyte:** lyte_workspaces, lyte_signals, lyte_command_cards, lyte_incidents, lyte_playbooks, lyte_recommendations
- **Dreamscape:** dreamscape_campaigns, dreamscape_scripts, dreamscape_storyboards, dreamscape_voice_assets, dreamscape_campaign_assets, dreamscape_reviews
- **Readiness:** readiness_programs, readiness_dimensions, readiness_score_history, readiness_milestones, readiness_risks, readiness_alerts
- **Stephen:** stephen_content_blocks, stephen_case_studies, stephen_booking_requests, stephen_site_contacts, stephen_site_case_studies, stephen_site_testimonials

### Shared Libraries
- `lib/shared-ui`: Design system, AgentCopilot, copilot configs, AI components, premium components
- `lib/db`: Drizzle ORM schemas and database connection
- `lib/config`: Application-to-connector dependency mapping
- `lib/services`: 24 service adapters with health checks and mock fallback
- `lib/api-spec`: OpenAPI 3.1 specification
- `lib/api-zod`: Generated Zod schemas
- `lib/api-client-react`: Generated React Query hooks

### Post-Merge Script
`scripts/post-merge.sh` runs `pnpm install --frozen-lockfile` then `yes '' | pnpm --filter db push || true` to handle interactive drizzle-kit prompts automatically.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic
- **Weather Data:** Stormglass
- **Communication:** Slack, Twilio
- **Productivity/Collaboration:** Google APIs (Calendar, Docs, Drive, Gmail), Notion, Confluence, HubSpot
- **Cloud Storage:** Dropbox, OneDrive
- **Analytics:** Posthog
- **Voice Synthesis:** Elevenlabs
- **Design Collaboration:** Figma
- **Azure Services (Stubs):** Key Vault, Blob Storage, Redis, PostgreSQL, App Insights
