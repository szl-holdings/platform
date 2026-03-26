# Workspace

## Overview

This pnpm workspace monorepo, built with TypeScript, is the **SZL Holdings DreamStack** platform. It's a comprehensive suite of 7 applications designed to share a common PostgreSQL database, a unified authentication system, and a consistent design language. The platform aims to provide a robust, scalable, and integrated solution for various business needs, from maritime intelligence and security simulations to e-commerce and creative project management.

## User Preferences

The user prefers an iterative development approach.
The user wants clear communication and detailed explanations for complex changes.
The user wants to be asked before making major architectural changes or introducing new dependencies.

## System Architecture

The project is a pnpm workspace monorepo utilizing Node.js 24 and TypeScript 5.9. It follows a modular architecture where each package manages its own dependencies.

**Core Technologies:**
- **Monorepo Tool:** pnpm workspaces
- **API Framework:** Express 5
- **Database:** PostgreSQL with Drizzle ORM
- **Validation:** Zod (`zod/v4`) and `drizzle-zod`
- **API Codegen:** Orval (from OpenAPI spec)
- **Build System:** esbuild (for CJS bundles)
- **Auth System:** Session-based authentication with Replit Auth fallback and an RBAC system supporting 6 roles (`super_admin`, `operator`, `analyst`, `seller`, `client_viewer`, `creative_user`). `super_admin` role bypasses all permission checks.

**Project Structure:**
The monorepo is divided into `artifacts/` (deployable applications) and `lib/` (shared libraries).
- `artifacts/`: Contains applications like `api-server`, `project-list`, and `mockup-sandbox`.
- `lib/`: Houses shared components such as `api-spec`, `api-client-react`, `api-zod`, `services`, `db`, `shared-ui`, `config`, `shared-types`, and `utils`.

**TypeScript & Composite Projects:**
All packages extend a base `tsconfig.json` with `composite: true` and are listed as project references in the root `tsconfig.json`. This enables cross-package type-checking and efficient incremental builds. Type-checking (`tsc --build --emitDeclarationOnly`) is performed from the root, emitting only `.d.ts` files, with actual JS bundling handled by esbuild/Vite.

**Database Schema:**
The `lib/db` package manages a PostgreSQL database schema using Drizzle ORM. It includes 18 schema files defining over 40 tables, organized by domain:
- **Core Platform:** `auth`, `organizations`, `connectors`, `notifications`, `activity`, `api_keys`, `feature_flags`, `billing`, `files`, `health_checks`, `webhook_events`, `apps_registry`, `projects`.
- **App-Specific:** `stephen_site`, `vessels`, `firestorm`, `lyte`, `dreamscape`, `readiness`.

**API Design (`artifacts/api-server`):**
The Express API server features modular routes organized by domain (e.g., `health.ts`, `projects.ts`, `auth.ts`, `connectors.ts`, `vessels.ts`). It uses `@workspace/api-zod` for request/response validation and `@workspace/db` for data persistence.

**UI/UX Design (`lib/shared-ui`):**
A premium dark-mode-first design system provides:
- **Tokens:** Color palette (navy/indigo/violet), typography, spacing, glassmorphism, gradients, shadows.
- **Animations:** Framer Motion presets for fade-ins, stagger, scroll-reveal, hover effects, and parallax.
- **Utilities:** `cn()` for class merging.

**Key Applications:**
- **`api-server`**: Main Express API, handling all backend logic and data interactions.
- **`project-list`**: A React + Vite portfolio site featuring a dark theme, gradient text, particle animations, Framer Motion, and full responsiveness. Includes sections for Hero, About, Services, Portfolio, Testimonials, and Contact.
- **`admin-panel`**: An executive dashboard for managing the SZL ecosystem. Features pages for System Overview, App Registry, Connectors, Integration Health (unified health dashboard with per-connector test buttons, status badges, search, and alerting), Integration Activity Feed (filterable event log), Users & Roles, Audit Log, Webhooks, Feature Flags, Billing, Files, Environment, and Seed Data. Includes a demo mode top banner and sidebar health warning badges.
- **`vessels`**: React + Vite maritime intelligence app with a dark executive theme (navy/cyan). Pages include Fleet Dashboard, Vessel Detail, Route Planning, Weather Impact, Simulations, and Alert Center. Includes demo mode banner and integration status sidebar footer.
- **`firestorm`**: React + Vite security simulation app with a dark executive theme (charcoal/orange). Pages cover Assessment Dashboard, Scenario Library, Simulation Runner, Findings, Risk Scoring, and Executive Reports. Includes demo mode banner and integration status sidebar footer.
- **`stephen-site`**: Portfolio/personal site with demo mode banner and integration status sidebar footer.

**Shared Libraries:**
- **`lib/db`**: Drizzle ORM layer for PostgreSQL.
- **`lib/shared-ui`**: Design system with tokens, animations, and utilities.
- **`lib/config`**: Platform constants, app registry, role definitions, and environment helpers.
- **`lib/shared-types`**: Common TypeScript interfaces.
- **`lib/utils`**: General utility functions.
- **`lib/services`**: Adapter library for third-party integrations, supporting mock/demo modes. ServiceAdapter base includes `runHealthCheck()`, health metrics tracking (lastChecked, errorCount, responseTimeMs). ServiceRegistry exposes per-app health matrix, connection testing, and unhealthy/demo mode counts.
- **`lib/config`** includes `APP_INTEGRATIONS` mapping all 7 apps to their connector dependencies.
- **`lib/api-spec`**: OpenAPI 3.1 specification.
- **`lib/api-zod`**: Generated Zod schemas from the OpenAPI spec.
- **`lib/api-client-react`**: Generated React Query hooks and fetch client.

## External Dependencies

- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** Replit Auth (fallback), internal session-based system
- **API Documentation:** OpenAPI 3.1
- **API Client Generation:** Orval
- **Frontend Frameworks:** React, Vite
- **State Management/Data Fetching:** TanStack React Query
- **Routing:** Wouter
- **Animation Library:** Framer Motion
- **Icon Library:** Lucide React
- **Styling:** Tailwind CSS (implied by utility class usage and design descriptions)
- **Third-Party Service Integrations (via `lib/services` adapters):**
    - AI
    - Weather (Stormglass)
    - Shipping
    - Stripe (payments)
    - Slack
    - Twilio
    - Google APIs (Calendar, Docs, Drive, Gmail)
    - Notion
    - Cloud Storage (general adapter)
    - Monitoring (general adapter)
    - GitHub
    - Dropbox
    - OneDrive
    - Posthog (analytics)
    - Confluence
    - HubSpot
    - Elevenlabs
    - Figma