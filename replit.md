# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies. This is the **SZL Holdings DreamStack** platform — a suite of 7 apps sharing a common database, auth system, and design system.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Session-based with Replit Auth fallback, RBAC with 6 roles

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server (modular routes per domain)
│   └── project-list/       # React + Vite portfolio site
│   └── mockup-sandbox/     # Component preview server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── services/           # Shared service adapters (AI, weather, shipping, payments, etc.)
│   ├── db/                 # Drizzle ORM schema + DB connection (18+ schema files, 40+ tables)
│   ├── shared-ui/          # Design tokens, animation presets, utilities
│   ├── config/             # Platform constants, app registry, role definitions
│   ├── shared-types/       # Shared TypeScript interfaces (API responses, UI types)
│   └── utils/              # Common utility functions (formatting, slugify, etc.)
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Database Schema

Schema files are organized by domain in `lib/db/src/schema/`:

**Core Platform Tables:**
- `auth.ts` — users, roles, user_roles, sessions
- `organizations.ts` — organizations, org_members
- `connectors.ts` — connectors, connector_logs
- `notifications.ts` — notifications, notification_preferences
- `activity.ts` — activity_log, audit_events
- `api_keys.ts` — api_keys
- `feature_flags.ts` — feature_flags, feature_flag_overrides
- `billing.ts` — billing_plans, subscriptions, invoices
- `files.ts` — files, assets
- `health_checks.ts` — health_checks
- `webhook_events.ts` — webhook_events
- `apps_registry.ts` — apps_registry
- `projects.ts` — projects

**App-Specific Tables:**
- `stephen_site.ts` — stephen_site_contacts, stephen_site_testimonials, stephen_site_case_studies
- `vessels.ts` — vessels, vessels_positions, vessels_cargo, vessels_routes
- `firestorm.ts` — firestorm_campaigns, firestorm_leads, firestorm_analytics
- `lyte.ts` — lyte_products, lyte_orders, lyte_order_items
- `dreamscape.ts` — dreamscape_projects, dreamscape_assets, dreamscape_reviews
- `readiness.ts` — readiness_assessments, readiness_checklists, readiness_findings

**Total: 40+ tables across 18 schema files**

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

## Auth & RBAC

- Auth middleware in `artifacts/api-server/src/middlewares/auth.ts`
- Supports Bearer token sessions and Replit Auth headers (x-replit-user-id/x-replit-user-name)
- 6 roles: `super_admin`, `operator`, `analyst`, `seller`, `client_viewer`, `creative_user`
- `super_admin` bypasses all permission checks
- `authMiddleware({ required: true/false })` for authentication
- `requireRole('operator', 'analyst')` for RBAC permission checks

## API Routes

Routes are modular, one file per domain in `artifacts/api-server/src/routes/`:
- `health.ts` — GET /api/healthz
- `projects.ts` — CRUD /api/projects
- `services.ts` — GET /api/services/health
- `auth.ts` — /api/auth/me, /api/auth/sessions, /api/auth/roles, /api/auth/users
- `connectors.ts` — CRUD /api/connectors
- `notifications.ts` — CRUD /api/notifications
- `audit.ts` — GET /api/audit/activity, /api/audit/events
- `billing.ts` — GET /api/billing/plans, /api/billing/subscriptions, /api/billing/invoices
- `feature-flags.ts` — CRUD /api/feature-flags
- `files.ts` — GET /api/files, /api/assets
- `stephen.ts` — /api/stephen/contacts, /api/stephen/testimonials, /api/stephen/case-studies
- `vessels.ts` — /api/vessels, /api/vessels/:id/positions, /api/vessels/:id/cargo, /api/vessels/:id/routes
- `firestorm.ts` — /api/firestorm/campaigns, /api/firestorm/leads, /api/firestorm/analytics
- `lyte.ts` — /api/lyte/products, /api/lyte/orders
- `dreamscape.ts` — /api/dreamscape/projects, /api/dreamscape/projects/:id/assets, reviews
- `readiness.ts` — /api/readiness/assessments, checklists, findings

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Middlewares: `src/middlewares/auth.ts` — auth + RBAC middleware
- Lib: `src/lib/api-response.ts` — standard response helpers, `src/lib/activity-logger.ts` — activity logging
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/services`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models (18 schema files)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

### `lib/shared-ui` (`@workspace/shared-ui`)

Premium dark-mode-forward design system with:
- `src/tokens.ts` — Color palette (navy/indigo/violet), typography scale, spacing, glassmorphism effects, gradients, shadows
- `src/animations.ts` — Framer Motion presets: fadeIn, stagger, scroll-reveal, hover effects, parallax
- `src/utils.ts` — `cn()` class merge utility
- Exports: `.`, `./tokens`, `./animations`

### `lib/config` (`@workspace/config`)

Platform configuration constants: app registry (7 apps with slugs, names, icons, colors), role definitions, session duration, pagination defaults, env helpers.

### `lib/shared-types` (`@workspace/shared-types`)

Shared TypeScript interfaces: ApiResponse, PaginationParams, DashboardStat, NavItem, BreadcrumbItem, TimelineEvent, NotificationPayload.

### `lib/utils` (`@workspace/utils`)

Common utilities: slugify, truncate, formatCurrency, formatNumber, formatDate, generateId, groupBy, pick, omit, sleep, clamp, percentage.

### `lib/services` (`@workspace/services`)

Shared backend service adapter library. Provides a consistent pattern for integrating with third-party services. Each adapter auto-detects environment variables and falls back to mock/demo mode when keys are missing.

- `src/base.ts` — abstract `ServiceAdapter` class with status reporting (LIVE_CONFIGURED / MOCKED_DEMO_MODE / MANUAL_REQUIRED)
- `src/adapters/` — 23 individual adapters: ai, weather, shipping, stripe, slack, twilio, google, notion, storage, monitoring, github, google-calendar, google-docs, google-drive, dropbox, onedrive, stormglass, posthog, gmail, confluence, hubspot, elevenlabs, figma
- `src/registry.ts` — `ServiceRegistry` aggregates all adapters, exports singleton `services` instance
- `src/index.ts` — barrel export of all adapters, types, and registry
- API endpoint: `GET /api/services/health` returns the full integration health matrix
- Admin API endpoints: `GET /api/admin/overview`, `GET /api/admin/connectors`, `POST /api/admin/connectors/:name/test`, `POST /api/admin/connectors/:name/sync`, `GET /api/admin/users`, `POST /api/admin/users`, `GET /api/admin/audit-log`, `GET /api/admin/feature-flags`, `PUT /api/admin/feature-flags/:key`, `GET /api/admin/billing`, `GET /api/admin/webhooks`, `GET /api/admin/files`, `GET /api/admin/environment`, `POST /api/admin/seed`, `POST /api/admin/seed/reset`
- `.env.example` at project root documents all supported environment variables

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) with 50+ endpoints across 16 tags. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `artifacts/project-list` (`@workspace/project-list`)

React + Vite single-page career portfolio for Stephen L. — Technology Consultant.

**Sections:**
- Hero: particle animation background, animated gradient text, "Available for Consulting" badge, CTA buttons, social links (LinkedIn, GitHub, Twitter, Email)
- About: professional summary, stat cards (10+ Years, 50+ Projects, 100% Satisfaction, 24/7 Support), technologies/tools tag cloud
- Services: 6 consulting service cards (Full-Stack Dev, Cloud/Infrastructure, Digital Products, Data Architecture, Security/Compliance, Performance Optimization)
- Portfolio/Work: project cards fetched from API with status badges (In Progress, Delivered, Paused, Legacy)
- Testimonials: 3 client testimonial cards with star ratings
- Contact: LinkedIn connect button, email CTA, full social links row
- Footer: brand, social icons, copyright

**Design:**
- Dark theme: navy background (`220 20% 4%`), primary indigo/violet (`250 90% 65%`)
- Fonts: Plus Jakarta Sans (display), Inter (body)
- Gradient text via `.gradient-text` class
- Particle canvas animation with connection lines
- Framer Motion animations: fade-ins, parallax, scroll-triggered reveals, hover effects
- Glassmorphism sticky navbar
- Fully responsive (mobile/tablet/desktop)
- Reduced-motion accessibility support

**SEO:**
- Open Graph + Twitter Card meta tags
- JSON-LD structured data (Person schema)
- Canonical URL, meta description, keywords

**Contact info:**
- LinkedIn: https://linkedin.com/in/stephen-l-279315240
- Email: contact@stephenl.dev
- Website: stephenl.dev

- Depends on: `@workspace/api-client-react`, `framer-motion`, `lucide-react`

### `artifacts/admin-panel` (`@workspace/admin-panel`)

Admin Control Plane — premium dark-mode executive dashboard for managing the SZL ecosystem.

**Pages:**
- Dashboard: System overview with real-time health indicators for database, storage, memory, and all 23 connectors
- App Registry: Lists all SZL apps with status indicators (active/planned)
- Connectors: View all 23 integrations with test/sync actions, search, category filtering, missing env var display
- Users & Roles: User management CRUD with role badges (admin, developer, operator, viewer)
- Audit Log: Filterable system activity log with search
- Webhooks: Incoming webhook event viewer
- Feature Flags: Toggle features with ON/OFF switches
- Billing: Plan details, seats, invoices, included features
- Files: File browser for uploaded assets
- Environment: Readiness screen showing configured vs missing env vars per connector
- Seed Data: Seed/reset demo data manager

**Design:** Premium dark executive theme, navy/slate backgrounds, blue primary accent, sidebar navigation with section grouping

- Route: `/admin/`
- Depends on: `@tanstack/react-query`, `wouter`, `lucide-react`, `tailwindcss`

### `scripts` (`@workspace/scripts`)

Utility scripts package. Run scripts via `pnpm --filter @workspace/scripts run <script>`.
- `seed` — Seeds all tables with realistic demo data
- `hello` — Hello world test script

### Seed Script

Run `pnpm --filter @workspace/scripts run seed` to populate all tables with realistic demo data including users, roles, organizations, connectors, vessels, campaigns, products, orders, creative projects, readiness assessments, and more.
