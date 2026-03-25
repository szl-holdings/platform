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

Shared backend service adapter library. Each adapter auto-detects environment variables and falls back to mock/demo mode.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) with 50+ endpoints across 16 tags. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `artifacts/project-list` (`@workspace/project-list`)

React + Vite single-page career portfolio for Stephen L. — Technology Consultant.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Run scripts via `pnpm --filter @workspace/scripts run <script>`.
- `seed` — Seeds all tables with realistic demo data
- `hello` — Hello world test script

### Seed Script

Run `pnpm --filter @workspace/scripts run seed` to populate all tables with realistic demo data including users, roles, organizations, connectors, vessels, campaigns, products, orders, creative projects, readiness assessments, and more.
