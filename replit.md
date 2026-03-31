# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo designed to provide command and intelligence systems across various sectors including maritime, cybersecurity, AI, real estate, and enterprise operations. It integrates five product platforms (Lyte, Vessels, Aegis, Terra, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). The platform uses a common PostgreSQL database, authentication system, and a command-grade design system to deliver specialized solutions for business observability, maritime intelligence, unified defense, real estate portfolio management, and UHNW residential advisory.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
The platform is a pnpm monorepo utilizing Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (over 120 tables), including comprehensive CMS, product-specific, client portal, and organization membership schemas with a 7-role CMS model.
- **Authentication:** Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, command-grade, SZL-branded design system inspired by Palantir Foundry/Anduril Lattice. Each application features a unique visual identity aligned with its market focus, with a dark-first aesthetic (except Carlota Jo), purposeful motion, and sharp corners. Typography includes Space Grotesk, Inter, and JetBrains Mono.

#### Brand Hierarchy & Visuals
- **SZL Holdings:** Dark-first, platinum/silver/graphite. Includes the Alloy execution fabric module at `/alloy/*`.
- **Lyte:** Amber, Business Observability Platform using the PRISM framework.
- **Vessels:** Deep ocean blue, maritime command intelligence.
- **Terra:** Bronze/stone, real-estate portfolio intelligence.
- **Carlota Jo:** Warm ivory/brushed gold, UHNW residential advisory platform with a public marketing site and private Client Portal.
- **Stephen Lutar:** Near-monochrome, founder identity.
- **Aegis:** Indigo/violet, Unified Defense & Intelligence Command, consolidating Security Operations (Firestorm), Managed Operations (Rosie/MSP), and Intelligence Engine (INCA).

### GraphQL API Layer
A unified GraphQL API is mounted at `/api/graphql` using Apollo Server v5 with `@as-integrations/express5` and `graphql-ws` for subscriptions. It features 9 domain modules covering all platform areas. A shared client library (`@workspace/graphql-client`) provides Apollo Client integration and typed hooks for all frontends. REST endpoints remain active alongside GraphQL.

### Platform Architecture & Features
The platform comprises 13 applications sharing authentication and design.
- **Authentication & RBAC:** Middleware manages Replit Auth with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` use Zod and Drizzle, with security features like `helmet`, `express-rate-limit`, and CORS.
- **Service Adapters:** `lib/services` provides a pattern for integrating 29 third-party services with environment variable detection and mock fallbacks.
- **Azure AD Multi-Tenant Provisioning:** Admin panel API at `/api/admin/tenants` manages customer Azure AD tenant onboarding and multi-tenant SSO.
- **Dynamics 365 / Dataverse Integration:** `DataverseAdapter` connects to customer Dynamics 365 environments, supporting various entities and signal ingestion for Lyte, Vessels, Terra, Alloy, and Aegis.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds and AI-powered services (chat, summarize, sentiment, image-gen, threat-briefing).
- **Core Command Center:** Unified cross-platform dashboard at `/core` for live summaries, recommendations, audit, and service health.
- **Live AI Models:** AI inference primarily uses GPT-5.2 (OpenAI) and Claude Sonnet 4.6 (Anthropic).
- **Nimbus AI Evolution:** Production intelligence layer with core modules for inference telemetry, a unified AI gateway, real-time provider health monitoring, an enhanced model registry, multi-agent orchestration, and composable multi-step AI pipelines.
- **Domain AI Agents:** 10 specialized advisory-only agents (e.g., Helmsman, Sentinel, INCA) with specialized system prompts and tool definitions.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all applications, featuring SSE streaming, markdown rendering, suggested questions, voice input/output, and mobile optimization.
- **AlloyChat:** Multi-model AI operations assistant.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` controls access based on entitlements.
- **Admin Panel CMS:** Centralized administration for 16 CMS tables, media assets, site settings, and analytics.
- **In-App Collaboration Layer:** Platform-wide system for team discussions via a `comments` table and shared UI components.
- **Universal Notification & Real-Time Alerting System:** `useNotificationCenter` hook and WebSocket integration for real-time pushes.
- **Alloy Platform Core — Orchestration Engine:** Canonical shared data model, ingestion layer, normalization pipeline, and workflow orchestration engine.

### Database Schema
Over 97 tables across 21+ schema files, covering authentication, billing, various application-specific data, Alloy Chat, Collaboration, and MSP, including Azure/Dataverse specific tables.

### Aegis — Consolidated Defense & Intelligence Platform
Aegis (artifact slug `firestorm`, path `/firestorm/`) unifies Security Operations (SOC), Managed Operations (Ops), and Intelligence Engine (Intel) into a single platform with distinct modules and API routes.

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