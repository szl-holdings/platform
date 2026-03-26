# DreamStack Platform

## Overview
The SZL Holdings DreamStack is a pnpm monorepo built with TypeScript, designed as a comprehensive suite of seven applications sharing a common PostgreSQL database, a unified authentication system, and a consistent design system. DreamStack aims to provide a robust and integrated platform for various business operations, including maritime intelligence, security simulation, creative project management, readiness assessment, and incident command. The platform also includes a premium corporate portal for SZL Holdings and a personal portfolio site for Stephen L. The business vision is to offer a scalable, secure, and highly integrated solution that streamlines operations and enhances decision-making across diverse domains.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture
The DreamStack monorepo utilizes pnpm workspaces, Node.js 24, and TypeScript 5.9.

**Backend:**
- **Framework:** Express 5
- **ORM:** Drizzle ORM with PostgreSQL for data persistence.
- **Validation:** Zod, integrated with Drizzle for schema validation.
- **Logging:** Pino for structured logging.
- **API Codegen:** Orval from OpenAPI specification.
- **Authentication:** Session-based with Replit Auth fallback, implementing Role-Based Access Control (RBAC) with 7 roles (`super_admin`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`). `super_admin` bypasses all checks. Admin panel routes are unauthenticated by design for internal development.
- **Middleware:** Request correlation IDs (`x-correlation-id`), per-route-group rate limiters (global, auth, write, read), startup config validation, `helmet` security headers, fail-closed CORS in production, structured error handling.
- **API Server Structure:** Modular routes (`artifacts/api-server`) organized by domain (e.g., `health.ts`, `projects.ts`, `auth.ts`, `vessels.ts`).
- **Observability:** Health endpoints (`/api/health`, `/api/health/live`, `/api/health/ready`) with DB connectivity and service status checks. System health endpoint (`/api/admin/system-health`) monitors various system components.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` for entitlement and usage-based access control.

**Frontend:**
- **Framework:** React
- **Build Tool:** Vite
- **Data Fetching:** TanStack React Query
- **Routing:** Wouter
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion for UI animations (fade-ins, parallax, scroll-triggered reveals, hover effects).
- **Icons:** Lucide React
- **Design System (`@workspace/shared-ui`):** Premium dark-mode-forward theme with a specific color palette (navy/indigo/violet), typography (Plus Jakarta Sans, Inter), spacing, glassmorphism effects, gradients, and shadows. Includes premium components like KPI ribbon, chart container, data table shell, status pill, alert banner, modal/drawer, skeleton loader, and premium form elements. Fully responsive with reduced-motion accessibility support.

**System Design Choices:**
- **Monorepo Structure:** pnpm workspaces for managing multiple applications and shared libraries.
- **Database Schema:** Over 40 tables across 18 schema files (`lib/db`), organized by domain.
- **Service Adapters (`lib/services`):** Consistent pattern for integrating 24 third-party services with auto environment variable detection and mock fallback. Includes health check mechanisms.
- **Intelligence Layer:** Provides 25+ REST endpoints for cross-platform intelligence (threats, geopolitical events, maritime data, news, tech trends, anomalies) and AI-powered endpoints (chat, summarize, sentiment, NER, classify, translate, image-gen, threat-briefing, situation-report, risk-prediction, content-ideas). Utilizes in-memory caching and demo data fallback.
- **AI Copilots:** Domain-specific AI copilots in all 8 apps via `AgentCopilot` component. Each copilot offers a floating button, slide-out chat panel with SSE streaming, markdown rendering, and suggested questions. Supports Replit proxy, OpenAI, and Anthropic providers.
- **Admin Panel (`artifacts/admin-panel`):** A dark-mode operational dashboard with animated health indicators, loading skeletons, and empty states. Provides management for system health, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, file browsing, environment readiness, and a seed manager.
- **Application Structure:**
    - **SZL Holdings (`szl-holdings`):** Corporate umbrella portal with animated hero, interactive portfolio visualization, filterable catalog, milestone timeline, innovation pillars, leadership section, and contact form. Content is config-driven via JSON files.
    - **Portfolio Site (`project-list`):** Stephen L.'s personal portfolio with particle animations, project showcases, testimonials, and contact information. Optimized for SEO.
    - **Vessels:** Maritime intelligence application.
    - **Firestorm:** Security simulation platform.
    - **Dreamscape:** Creative project management and studio application.
    - **Readiness Report:** Readiness assessment application.
    - **Lyte Command Center:** Incident and signal command center.
    - **Stephen-site:** Additional personal portfolio site.

**Shared Libraries:**
- `lib/config`: Maps applications to their connector dependencies.
- `lib/api-spec`: OpenAPI 3.1 specification.
- `lib/api-zod`: Generated Zod schemas from the OpenAPI spec.
- `lib/api-client-react`: Generated React Query hooks and fetch client.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth (fallback)
- **Payment Processing:** Stripe (full checkout/subscription/webhook pipeline)
- **AI/NLP:** HuggingFace Inference API (text-gen, summarization, classification, NER, translation, zero-shot, sentiment, Q&A, image-gen), Replit's OpenAI proxy, OpenAI, Anthropic.
- **Weather Data:** Stormglass
- **Shipping Services:** (General adapter)
- **Communication:** Slack, Twilio
- **Productivity/Collaboration:** Google APIs (Calendar, Docs, Drive, Gmail), Notion, Confluence, HubSpot
- **Cloud Storage:** (General adapter for various providers)
- **Monitoring:** (General adapter)
- **Version Control:** GitHub
- **File Storage:** Dropbox, OneDrive
- **Analytics:** Posthog
- **Voice Synthesis:** Elevenlabs
- **Design Collaboration:** Figma
- **Azure Services (Stubs):** Key Vault, Blob Storage, Redis, PostgreSQL, App Insights