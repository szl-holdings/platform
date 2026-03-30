# DreamStack Platform

## Overview
DreamStack is a pnpm monorepo consisting of 14 interconnected TypeScript applications. It provides an integrated ecosystem for maritime intelligence, cybersecurity, AI research, creative production, organizational readiness, operations command, real estate intelligence, strategic advisory, and corporate/personal portfolios, all built for "Stephen L" — technology consultant and founder of SZL Holdings. The platform shares a common PostgreSQL database, authentication system, and design system, aiming to offer a comprehensive suite of tools for diverse business needs.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
The platform is built as a pnpm monorepo using Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (90+ tables).
- **Authentication:** Real Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC. Fallback to DevAuthProvider in local dev (when REPL_ID is absent).
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, dark-mode-forward design system is implemented via `@workspace/shared-ui`, ensuring a unified aesthetic across all dashboard applications. This includes a consistent dark background, distinct card and border colors, and a sidebar. Each app retains its unique primary/accent color. Typography utilizes Plus Jakarta Sans for display and Inter for body text. Design elements incorporate glassmorphism effects, gradients, shadows, and Framer Motion animations. Operational applications (Vessels, Firestorm, Lyte, INCA, Readiness) adopt a military/NASA command center aesthetic. Common components include KPI ribbons, chart containers, data table shells, `AgentCopilot`, and advanced form elements. Demo Mode banners and loading states with skeleton placeholders are also integrated.

### Platform Architecture & Features
DreamStack comprises 14 applications sharing a PostgreSQL database, authentication, and design system.
- **Authentication & RBAC:** Middleware manages Bearer token sessions and Replit Auth, with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` use Zod for validation and Drizzle for persistence, including security features like `helmet`, `express-rate-limit`, CORS, and structured error handling.
- **Service Adapters:** `lib/services` provides a pattern for integrating 27 third-party services with environment variable detection and mock fallbacks, including health checks.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds (CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau, BLS, FEMA, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR) with TTL caching and AI-powered endpoints (chat, summarize, sentiment, image-gen, threat-briefing).
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) are present in all applications, offering SSE streaming, markdown rendering, suggested questions, voice input/output, and mobile optimization.
- **Advisory-Only Architecture:** Infrastructure agents are designed as advisory-only, preventing direct execution of changes and logging recommendations for human approval.
- **Agent Training Studio (Admin Panel):** A dedicated studio allows per-agent training with Q&A pairs, behavioral customization, and performance monitoring.
- **AlloyChat (Admin Panel):** A production multi-model AI operations assistant routes queries to Claude or GPT-5.2 based on task, providing SSE streaming and conversation history persistence.
- **Observability:** Structured logging via pino and a system health endpoint monitor DB, storage, auth, connectors, and app routes. The `@workspace/observability` framework offers 8-pillar domain-native observability (Performance, Business, User Experience, Predictive Health, Operational Awareness, Strategic Insight, Security Posture, Innovation Velocity) across all applications.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` controls access based on entitlements and usage limits.
- **Admin Panel:** Centralized administration for health monitoring, app registry, connectors, user roles, audit logs, webhooks, feature flags, billing, and a Developer Portal.

### Application Portfolio
The platform includes 15 applications:
- **Project List:** App directory with search and filtering.
- **Stephen Site:** Executive portfolio.
- **SZL Holdings:** Corporate portal.
- **Vessels:** Maritime intelligence command center.
- **Firestorm:** SOC Operations Center for cybersecurity.
- **Lyte Command Center:** Operations command for infrastructure telemetry.
- **INCA:** AI Research Command Center.
- **Readiness Report:** Organizational readiness and compliance.
- **Terra:** Real estate intelligence.
- **Dreamscape:** Creative production platform.
- **Carlota Jo:** Strategic advisory.
- **Admin Panel:** Platform administration.
- **MSP Command Center:** Managed Service Provider platform.
- **API Server:** Backend services.
- **Mockup Sandbox:** For mockups and testing.

### Domain Agent System
AI-powered domain agents are implemented for each application, with specialized system prompts, tool definitions, and connections to existing API routes for data retrieval.

### Shared Libraries
<<<<<<< HEAD
Key shared libraries (`lib/`) provide:
- `shared-ui`: Design system, `AgentCopilot`, AI components, hooks, `ErrorBoundary`.
- `db`: Drizzle ORM schemas, connection pool.
- `config`: Application-to-connector dependency mapping.
- `services`: 27 service adapters.
- `api-spec`, `api-zod`, `api-client-react`: OpenAPI specification, Zod schemas, React Query hooks.
- `integrations-openai-ai-server`, `integrations-openai-ai-react`, `integrations-anthropic-ai`, `integrations-gemini-ai`: AI integration packages.
- `observability`: DreamStack Intelligence framework.
=======
- `lib/shared-ui`: Design system (56 UI components), AgentCopilot, copilot configs, AI components, premium components, IntelligencePhilosophy, `ErrorBoundary`, `useRealtimeChannel`, `useFeatureFlag` hooks, `UserButton` (real auth sign-in/out), `AuthGate`
- `lib/replit-auth-web`: `useAuth()` React hook — fetches `/api/auth/user`, triggers login/logout via server-side OIDC redirects. Used by `UserButton` and `AuthGate`.
- `lib/db`: Drizzle ORM schemas, connection pool (min/max/idle timeout/statement timeout), slow-query logging in dev (includes `conversations` + `messages` tables for AlloyChat, and `agent_training_pairs`, `agent_behavior_prefs`, `agent_feedback`, `advisory_audit` for Agent Training Studio)
- `lib/config`: Application-to-connector dependency mapping
- `lib/services`: 24 service adapters with health checks and mock fallback
- `lib/api-spec`: OpenAPI 3.1 specification
- `lib/api-zod`: Generated Zod schemas
- `lib/api-client-react`: Generated React Query hooks
- `lib/integrations-openai-ai-server`: OpenAI server-side integration via Replit AI Integrations (exports `toFile` from openai)
- `lib/integrations-openai-ai-react`: OpenAI React client hooks
- `lib/integrations-anthropic-ai`: Anthropic server-side integration via Replit AI Integrations
- `lib/integrations-gemini-ai`: Gemini AI server-side integration via Replit AI Integrations
>>>>>>> 1c7865d (feat: replace DevAuthProvider with real Replit Auth (OIDC/PKCE))

### Infrastructure Hardening
Includes graceful shutdown, response compression, WebSocket layer, API documentation (Swagger UI), structured error codes (`lib/error-codes.ts`), CI/CD pipelines for typecheck, lint, build, security audit, and migration checks, `ErrorBoundary` for all React apps, runtime feature flags, and an in-process background job queue.

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
- **Azure Services:** Key Vault, Blob Storage, Redis, PostgreSQL, App Insights (used as stubs within the infrastructure).