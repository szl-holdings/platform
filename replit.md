# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo developing **Lyte**, a business observability platform, powered by **Alloy**, its execution fabric and audit layer. The ecosystem includes five product platforms (Lyte, Vessels, Aegis, Terra, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). Lyte + Alloy serve as the commercial foundation, with other platforms positioned for future expansion. The platform leverages a common PostgreSQL database, authentication system, and a command-grade design system.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
The platform is a pnpm monorepo using Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Internationalization (i18n):** react-i18next + i18next, with language detection via querystring, cookie, localStorage, and browser navigator. Supports RTL.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (over 120 tables), including CMS, product, client portal, and organization membership schemas.
- **Authentication:** Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, SZL-branded design system inspired by Palantir Foundry/Anduril Lattice. Applications feature unique visual identities, dark-first aesthetics (except Carlota Jo), purposeful motion, and sharp corners. Typography includes Space Grotesk, Inter, and JetBrains Mono.

#### Brand Hierarchy & Visuals
- **SZL Holdings:** Dark-first, platinum/silver/graphite. Includes the Alloy execution fabric module at `/alloy/*`.
- **Lyte:** Burnished amber, Business Observability Platform using the PRISM framework. Split architecture for editorial website and operational app.
- **Vessels:** Deep ocean blue, maritime command intelligence. Mobile app for fleet command.
- **Terra:** Obsidian/graphite/deep forest/slate emerald/muted brass for real-estate portfolio intelligence. Hard website/app split.
- **Carlota Jo:** Warm ivory/brushed gold, UHNW residential advisory platform with a public marketing site, private Client Portal, and a native mobile app.
- **SZL Holdings Mobile:** Executive Command + Alloy Orchestration mobile app.
- **Stephen Lutar:** Near-monochrome, founder identity, with a native mobile app for digital card and portfolio showcase.
- **Aegis:** Navy/amber/red, Unified Defense & Intelligence Command, consolidating Security Operations, Managed Operations, and Intelligence Engine. Includes a native mobile SOC command center app.
- **PRISM Counsel:** Legal matter observability and governed execution vertical — full command center for plaintiff-side NY insurance litigation teams. ~30-table DB schema, 3 demo matters (auto/FL, premises/NJ, coverage/NY), 17 pages (Dashboard, Watchlist, Matters, Matter Detail with 7 tabs, Forecast, Deadlines, Discovery, Playbooks, Approvals, Copilot, Parties, Trust with 6 tabs, Admin, Insurer Intel with 3 tabs, Venue Intel, No-Fault/PIP Claims with clock rules, NY Litigation Command). Uses 6-pillar PRISM scoring (Posture, Readiness, Integrity, Strategy, Money, Governance). NY insurance wedge includes Regulation 68 compliance clocks, insurer behavior profiling, venue intelligence, and no-fault claim tracking. Sidebar organized into Command, Operations, Intelligence, New York, and System sections. Routes at `/prism-counsel/*` within SZL Holdings app. Marketing page at `/solutions/prism-counsel`.

### GraphQL API Layer
A unified GraphQL API is mounted at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions. It includes 9 domain modules and a shared client library (`@workspace/graphql-client`) for frontends. REST endpoints remain active.

### Developer Documentation Portal
Located at `/developers` within the SZL Holdings app, it includes an OpenAPI interactive explorer, GraphQL playground, authentication guide, code samples, rate limit documentation, error code reference, and versioning strategy.

### Platform Architecture & Features
The platform comprises 13 applications sharing authentication and design.
- **Authentication & RBAC:** Middleware with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` with Zod and Drizzle, including security features like `helmet`, `express-rate-limit`, and CORS.
- **Service Adapters:** `lib/services` integrates 29 third-party services with environment variable detection and mock fallbacks.
- **Azure AD Multi-Tenant Provisioning:** Admin panel API for customer Azure AD tenant onboarding and multi-tenant SSO.
- **White-Label Tenant Branding:** Custom branding for each enterprise tenant.
- **SCIM 2.0 User Provisioning:** RFC-compliant SCIM server for Users and Groups CRUD, with group-to-role mapping.
- **Dynamics 365 / Dataverse Integration:** `DataverseAdapter` for connecting to customer Dynamics 365 environments.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints providing cross-platform intelligence, including government data feeds and AI-powered services.
- **Core Command Center:** Unified cross-platform dashboard at `/core`.
- **Alloy AI Decision Engine (`@workspace/ai-engine`):** HuggingFace-powered AI execution fabric with 9 schema-validated decision types, a model registry, evidence-backed hybrid retrieval, and policy-gated tool execution.
- **Live AI Models:** Primarily Qwen3-8B (HuggingFace), with OpenAI and Anthropic as fallbacks.
- **Nimbus AI Evolution:** Production intelligence layer with core modules for inference telemetry, a unified AI gateway, real-time provider health monitoring, and multi-agent orchestration.
- **Domain AI Agents:** 10 specialized advisory-only agents.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all applications with SSE streaming, markdown rendering, and voice input/output.
- **AlloyChat:** Multi-model AI operations assistant.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` for entitlement-based access control.
- **Admin Panel CMS:** Centralized administration for 16 CMS tables, media assets, and site settings.
- **In-App Collaboration Layer:** Platform-wide system for team discussions via a `comments` table.
- **Universal Notification & Real-Time Alerting System:** `useNotificationCenter` hook and WebSocket integration for real-time pushes, with multi-channel dispatch to Slack and Microsoft Teams.
- **Expo Push Notifications (Mobile):** End-to-end push notification system for Carlota Jo, with 15 domain-specific templates.
- **Email Delivery System:** Triple-failover email chain (SendGrid → Resend → SMTP nodemailer) with brand templates.
- **Alloy Platform Core — Orchestration Engine:** Canonical shared data model, ingestion layer, normalization pipeline, and workflow orchestration.
- **Alloy Unified Command Surface:** Transformed into a unified command platform with features like a Global Command Bar, Workspace Home, Decision Objects, Skill Registry, and Operator Control Center.
- **Alloy Enterprise Governance (Task #271):** Full governance system with 5 DB tables (`alloy_policies`, `model_routing_policies`, `cost_budgets`, `cost_events`, `governance_incidents`), CRUD API at `/api/governance/*` (uses `authMiddleware()` + `requireRole` for write ops, org-scoped), and premium tabbed UI at `/alloy/enterprise-governance` (Overview, Policies, Model Routing, Cost Controls, Incidents). Seeded with compliance templates (SOC 2, HIPAA, etc.) and model routing policies. Trust UX components: `DataSourceIndicator`, `DemoModeBanner`, `CapabilityBadge` in `src/components/DataSourceIndicator.tsx`.
- **Aegis — Consolidated Defense & Intelligence Platform:** Unifies Security Operations, Managed Operations, and Intelligence Engine with modules for SOAR Playbook Engine, STIX/TAXII Protocol Layer, Unified XDR Console, Threat Intel Feed, Sentinel Watch, and Framework Scorecards.
- **NPS & Contextual Feedback System:** Full in-app feedback collection system with DB schema, API routes, shared UI components, and admin dashboard.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic
- **Communication:** Slack, Twilio, Resend
- **Productivity/Collaboration:** Google APIs, Notion, Confluence, HubSpot, Dropbox, OneDrive
- **Analytics:** Plausible, Posthog
- **Voice Synthesis:** Elevenlabs
- **Government Data Feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau ACS, BLS Construction Employment, FEMA NRI, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR, NYC Open Data, FRED, HUD Fair Market Rents
- **Maritime Data:** Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather API
- **Threat Intelligence (keyless):** Shodan InternetDB, GreyNoise Community API, MalwareBazaar, URLhaus
- **Other:** GitHub Public API, AbuseIPDB, Figma