# SZL Holdings DreamStack

A modular enterprise platform built as a pnpm monorepo. Seven applications share a common database, authentication system, and design system.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Reverse Proxy (Replit)                │
│  /         /admin/    /vessels/   /firestorm/  /stephen/ │
└───┬──────────┬──────────┬───────────┬──────────┬────────┘
    │          │          │           │          │
┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌────▼───┐ ┌───▼───┐
│Project│ │ Admin │ │Vessels│ │Firestom│ │Stephen│  React+Vite
│ List  │ │ Panel │ │Tracker│ │Security│ │ Site  │  frontends
└───┬───┘ └───┬───┘ └───┬───┘ └────┬───┘ └───┬───┘
    │         │         │          │         │
    └─────────┴─────┬───┴──────────┴─────────┘
                    │
              ┌─────▼──────┐
              │  API Server │  Express 5  (/api)
              │  (REST)     │
              └─────┬───┬──┘
                    │   │
          ┌─────────┘   └─────────┐
     ┌────▼────┐           ┌──────▼──────┐
     │PostgreSQL│           │  23 Service │
     │ (Drizzle)│           │  Adapters   │
     └─────────┘           └─────────────┘
```

## Applications

| App | Path | Description |
|-----|------|-------------|
| Project List | `/` | Career portfolio for Stephen L. — Technology Consultant |
| Admin Panel | `/admin/` | System administration dashboard with 12 pages |
| Vessels | `/vessels/` | Maritime fleet tracking and intelligence |
| Firestorm | `/firestorm/` | Security simulation and risk assessment |
| Stephen Site | `/stephen/` | Personal portfolio site |
| API Server | `/api` | Express REST API with 50+ endpoints |
| Mockup Sandbox | `/__mockup/` | Component preview server |

## Quick Start

```bash
# Install dependencies
pnpm install

# Push database schema (development)
pnpm --filter @workspace/db run push

# Seed demo data
pnpm --filter @workspace/scripts run seed

# Start all services (handled by Replit workflows)
# Each artifact reads PORT from environment
```

## Environment Variables

### Required

| Variable | Description | Used By |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | API Server, Scripts |
| `PORT` | Server port (auto-assigned per artifact) | All artifacts |

### Optional (Demo Mode When Missing)

| Variable | Service | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | AI Adapter | LLM and embedding support |
| `STRIPE_SECRET_KEY` | Stripe | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook signature verification |
| `SLACK_BOT_TOKEN` | Slack | Workspace messaging |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | Twilio | SMS and voice |
| `GITHUB_TOKEN` | GitHub | Repository access |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google | OAuth and API access |
| `NOTION_API_KEY` | Notion | Page and database access |
| `REPLIT_OBJECT_STORE_URL` | Storage | Object storage |
| `SENTRY_DSN` | Monitoring | Error tracking |
| `POSTHOG_API_KEY` | PostHog | Product analytics |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot | CRM integration |
| `ELEVENLABS_API_KEY` | ElevenLabs | Text-to-speech |
| `FIGMA_ACCESS_TOKEN` | Figma | Design file access |
| `STORMGLASS_API_KEY` | StormGlass | Marine weather data |
| `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` | Gmail | Email sending |
| `CONFLUENCE_API_TOKEN` | Confluence | Wiki integration |
| `DROPBOX_ACCESS_TOKEN` | Dropbox | File storage |
| `ONEDRIVE_CLIENT_ID` / `ONEDRIVE_CLIENT_SECRET` | OneDrive | File storage |
| `GOOGLE_CALENDAR_API_KEY` | Google Calendar | Calendar events |
| `GOOGLE_DOCS_API_KEY` | Google Docs | Document access |
| `GOOGLE_DRIVE_API_KEY` | Google Drive | Drive file access |

## Live vs Demo Mode

All 23 service adapters auto-detect their environment variables and gracefully fall back to demo mode when credentials are missing. The platform boots and runs fully in demo mode without any external API keys.

**Currently Live:**
- PostgreSQL database
- Session-based auth with Replit Auth fallback
- All 7 web applications
- Full seed data across 50 tables

**Demo Mode (architecture ready, no live keys):**
- Stripe billing (schema, UI, and API ready)
- Slack, Twilio, Gmail notifications
- GitHub, Notion, Confluence integrations
- PostHog analytics, Sentry monitoring
- Cloud storage (Dropbox, OneDrive, Google Drive)
- AI features (OpenAI)

## Database

50+ tables organized across 20 schema files using Drizzle ORM.

**Core:** users, roles, organizations, sessions, api_keys, activity_log, audit_events, feature_flags, connectors, notifications, files, apps_registry, health_checks, webhook_events

**Billing:** billing_plans, subscriptions, invoices, entitlements, usage_events

**Vessels:** fleets, vessels, positions, cargo, routes, alert_rules, alerts, weather_snapshots, simulations

**Firestorm:** scenarios, assessments, simulation_runs, findings, risk_scores

**Other:** lyte (products, orders), dreamscape (projects, assets, reviews), readiness (assessments, checklists, findings), stephen_site (testimonials, case_studies, contacts)

## Admin Panel Features

- **Dashboard** — Real-time system overview (uptime, memory, DB, storage, connectors)
- **System Health** — Unified health checks: database, storage, auth, connectors, webhooks, notifications, billing, app routes
- **App Registry** — All platform applications with status
- **Connectors** — 23 integration adapters with test/sync actions
- **Users & Roles** — RBAC with 6 roles
- **Audit Log** — Filterable system activity
- **Webhooks** — Incoming event viewer
- **Feature Flags** — Toggle features with rollout control
- **Billing** — Plan details, seats, invoices, entitlements, usage tracking
- **Files** — Asset management
- **Environment** — Env var readiness checker
- **Seed Data** — Seed/reset/validate demo data with integrity checker

## Auth & RBAC

Session-based authentication with Replit Auth fallback. Six roles:
- `super_admin` — Full platform access (bypasses all checks)
- `operator` — Day-to-day operational access
- `analyst` — Read-only dashboards and analytics
- `seller` — E-commerce and marketing tools
- `client_viewer` — External client portal access
- `creative_user` — Creative tools access

## Development

```bash
# Typecheck entire project
pnpm run typecheck

# Build all packages
pnpm run build

# Run seed script
pnpm --filter @workspace/scripts run seed

# Push schema changes
pnpm --filter @workspace/db run push
```

## Deployment

The platform is configured for Replit deployment:
- Server binds to `0.0.0.0` on the assigned `PORT`
- Each artifact is a separate Replit workflow
- Database migrations run via `drizzle-kit push`
- All services gracefully degrade without external API keys
