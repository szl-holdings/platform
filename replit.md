# DreamStack Platform

## Overview
DreamStack is a pnpm monorepo containing a suite of applications built with TypeScript, sharing a common PostgreSQL database, authentication system, and design system. It aims to provide an integrated platform for diverse operations, including maritime intelligence, security simulation, creative project management, readiness assessment, incident command, and corporate/personal portfolios. The platform's vision is to deliver a scalable, secure, and integrated solution to streamline operations and enhance decision-making.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM.
- **Authentication:** Session-based with Replit Auth fallback, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium dark-mode-forward design system is implemented via `@workspace/shared-ui`. It includes a navy/indigo/violet color palette, Plus Jakarta Sans/Inter typography, glassmorphism effects, gradients, shadows, and Framer Motion animations. Components include KPI ribbon, chart container, data table shell, and advanced form elements. All applications are responsive and support reduced-motion accessibility.

### Technical Implementations & Feature Specifications
- **Database Schema:** Over 40 tables across 18 schema files (`lib/db`), organized by domain (e.g., auth, organizations, billing, projects, vessels, firestorm).
- **Authentication & RBAC:** Middleware handles Bearer token sessions and Replit Auth. Seven roles (`super_admin`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`) control access.
- **API Server:** Modular routes in `artifacts/api-server`, utilizing Zod for validation and Drizzle for persistence. Includes `helmet` for security, `express-rate-limit`, CORS, structured error handling, and health endpoints.
- **Service Adapters:** `lib/services` provides a consistent pattern for integrating 24 third-party services with auto environment variable detection and mock fallback, including health check mechanisms.
- **Stripe Billing Integration:** Full checkout/subscription/webhook pipeline with API routes for managing billing flows and webhook verification.
- **Intelligence Layer:** Provides 25+ REST endpoints for cross-platform intelligence (threats, geopolitical events, maritime data, news, tech trends) and AI-powered endpoints (chat, summarize, sentiment, image-gen, threat-briefing). Features in-memory caching and demo data fallback.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all 8 applications, offering a floating button, slide-out chat panel with SSE streaming, markdown rendering, and suggested questions. Supports Replit proxy, OpenAI, and Anthropic providers.
- **Observability:** Structured logging via pino and a system health endpoint monitoring DB, storage, auth, connectors, and app routes.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` manages access based on entitlements and usage limits.
- **Admin Panel:** A dark-mode operational dashboard (`artifacts/admin-panel`) for managing system health, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, and environment readiness.
- **Application Structure:**
    - **SZL Holdings (`szl-holdings`):** Corporate portal with animated hero, interactive portfolio visualization, and config-driven content.
    - **Portfolio Site (`project-list`, `stephen-site`):** Personal portfolio sites with project showcases and contact info.
    - **Vessels:** Maritime intelligence application with fleet management, route planning, and alert center.
    - **Firestorm:** Security simulation platform with assessment dashboard and scenario library.
    - **Dreamscape:** Creative project management and studio application.
    - **Readiness Report:** Readiness assessment application.
    - **Lyte Command Center:** Incident and signal command center.
    - **INCA:** AI Research Command Center for managing AI/ML research projects and experiments.
    - **Carlota Jo (`carlota-jo`):** Luxury advisory consulting site with service portfolio, case studies, and booking/checkout flow.
    - **Terra (`terra`):** Real estate business observability platform with portfolio dashboard, market intelligence, deal pipeline, property detail pages, occupancy/revenue analytics, and risk/alert feed. Uses Recharts for data visualization and premium dark-mode design consistent with SZL Holdings aesthetic.

### Shared Libraries
- `lib/config`: Maps applications to connector dependencies.
- `lib/api-spec`: OpenAPI 3.1 specification.
- `lib/api-zod`: Generated Zod schemas.
- `lib/api-client-react`: Generated React Query hooks and fetch client.

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