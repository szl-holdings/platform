# SZL Holdings Platform

## Overview
A pnpm monorepo consisting of 8 active applications + 1 API server + 1 design sandbox. Shares a common PostgreSQL database, authentication system, and command-grade design system. Built for Stephen Lutar, founder of SZL Holdings. The ecosystem has 6 product platforms (Alloy, Lyte, Vessels, Aegis, Terra, Carlota Jo), 1 parent company site (SZL Holdings), and 1 founder identity site (Stephen Lutar). Provides command and intelligence systems across maritime, cybersecurity, AI, real estate, and enterprise operations. Note: Dreamscape was consolidated into Alloy as "Creative Workflows" (Task #177). Rosie (MSP) and INCA (AI Research) were consolidated into Aegis as modules — they are not standalone platforms.

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
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (over 120 tables), including comprehensive CMS, product-specific, client portal, and organization membership schemas with a 7-role CMS model.
- **Authentication:** Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, command-grade design system inspired by Palantir Foundry/Anduril Lattice, entirely SZL-branded. Each application features a unique visual identity aligned with its market focus. Typography includes Space Grotesk (headings), Inter (body), and JetBrains Mono (data/code). Common components include KPI ribbons, chart containers, data table shells, `AgentCopilot`, and advanced form elements. Design principles emphasize dark-first aesthetics (except Carlota Jo), purposeful motion, and sharp corners.

#### Brand Hierarchy & Visuals
- **SZL Holdings:** Dark-first, platinum/silver/graphite, Space Grotesk.
- **Alloy:** Cool steel / signal blue, infrastructure engine aesthetic.
- **Lyte:** Amber (#f59e0b), Business Observability Platform — standalone SaaS product using the PRISM framework (7 lenses: Signal, Impact, Anticipation, Topology, Posture, Velocity, Experience). Connects to enterprise tools (Microsoft 365, Slack, Jira, Salesforce, etc.) and provides role-based command views for executives, operators, delivery, and analysts. Marketing site positions Lyte as a competitor to New Relic/Datadog for business processes (not infrastructure). Pricing: Starter $49, Business $149, Enterprise Custom.
- **Vessels:** Deep ocean blue, maritime command intelligence.
- **Terra:** Bronze/stone (#a07848), portfolio intelligence for real-estate — distinct from Lyte. Terminology: Portfolio Intelligence, not generic brokerage.
- **Carlota Jo:** Warm ivory/brushed gold, light luxury, serif fonts.
- **Stephen Lutar:** Near-monochrome, founder identity.
- **Alloy Creative Workflows:** Integrated into Alloy (cyan/steel) — Campaign Hub, Brand Voice Engine, Content Calendar, AI Studio. These are accessed at `/alloy/creative` and subdirectories. API routes remain at `/api/dreamscape/*` for backward compatibility. Dreamscape standalone artifact is retired.
- **Aegis:** Indigo/violet (#6366f1), Unified Defense & Intelligence Command — consolidates Firestorm (security), Rosie/MSP (managed operations), and INCA (AI intelligence) into one platform. Three modules: Security Operations (/soc), Managed Operations (/ops/*), Intelligence Engine (/intel/*). Artifact slug remains `firestorm`, base path `/firestorm/`.

#### Architecture Decision: Nimbus Dissolved as Public Brand
Nimbus was consolidated into Alloy's intelligence layer (Task #173). It is NOT a standalone public product.
- Internal API routes (`/api/nimbus/*`, `/api/core/recommendations`) are preserved as Alloy's predictive engine.
- The `recommendations` DB table stores cross-platform AI recommendations attributed to Alloy intelligence.
- The `alloyPredictiveConfig` copilot config represents Alloy's predictive capability.
- All user-facing "Nimbus" labels have been replaced with "AI Recommendations" / "Alloy Intelligence".
- SZL Holdings Core Command links to Alloy Creative Workflows (at `/alloy/creative`), not Dreamscape or Nimbus.

### Platform Architecture & Features
The platform features 13 applications sharing authentication and design.
- **Authentication & RBAC:** Middleware manages Bearer token sessions and Replit Auth with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` use Zod for validation and Drizzle for persistence, incorporating security features like `helmet`, `express-rate-limit`, CORS, and structured error handling.
- **Service Adapters:** `lib/services` provides a pattern for integrating 29 third-party services with environment variable detection and mock fallbacks, including `DataverseAdapter` for Dynamics 365 Online / Dataverse Web API v9.2 and `MicrosoftGraphAdapter` for Microsoft 365.
- **Azure AD Multi-Tenant Provisioning:** Admin panel API at `/api/admin/tenants` manages customer Azure AD tenant onboarding. Platform admins can provision tenants by Azure tenant ID, generate admin consent URLs, and manage status (pending/active/suspended). Multi-tenant SSO validates incoming tokens against the provisioned tenant allowlist (DB). New tables: `azure_tenants`, `dataverse_connections`.
- **Dynamics 365 / Dataverse Integration:** `DataverseAdapter` connects to customer Dynamics 365 environments via Dataverse Web API. Supports Accounts, Contacts, Leads, Opportunities, and Activities. Lyte signal ingestion (`/api/dataverse/signals`) detects stale deals, pipeline anomalies, high-value leads, and overdue activities. Per-tenant connections stored in `dataverse_connections` with sync tracking. Wired to Vessels (fleet operators), Terra CRM (lead/opportunity sync), Alloy (create activity/opportunity stage update/log note), and Aegis (identity signals). Health check at `/api/health/integrations` includes `dynamics365` entry.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds with TTL caching and AI-powered endpoints (chat, summarize, sentiment, image-gen, threat-briefing).
- **Core Command Center:** Unified cross-platform dashboard at `/core` in szl-holdings. Shows live summary cards (distress properties, high-opportunity, open vulns, Nimbus recs, workflow runs), doctrine hierarchy grid, recent recommendations, and platform service health. Four tabs: Overview, Recommendations, Audit, Services.
- **Core API Endpoints:** `/api/core/health` (real DB latency + uptime), `/api/core/metrics` (aggregate counts across Beacon/Firestorm/AlloyScape/Nimbus/platform), `/api/core/recommendations` POST+GET (Nimbus recommendation engine accepting any entity type, returning score/confidence/reasoning/recommended_action).
- **Recommendations Table:** `recommendations` DB table stores cross-platform Nimbus recommendations with entity type, score (0–100), confidence (0–1), reasoning, recommended action, and platform source attribution.
- **Live AI Models:** AI inference primarily uses GPT-5.2 (OpenAI via Replit proxy) and Claude Sonnet 4.6 (Anthropic via Replit proxy).
- **Nimbus AI Evolution:** Production intelligence layer with core modules for inference telemetry, a unified AI gateway, real-time provider health monitoring, an enhanced model registry, multi-agent orchestration, and composable multi-step AI pipelines.
- **Domain AI Agents:** 10 specialized advisory-only agents (e.g., Helmsman, Sentinel, INCA) with specialized system prompts and tool definitions, accessible via a unified API.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all applications, featuring SSE streaming, markdown rendering, suggested questions, voice input/output, and mobile optimization.
- **Agent Training Studio:** Per-agent training with Q&A pairs, behavioral customization, and performance monitoring.
- **AlloyChat:** Multi-model AI operations assistant routing queries to Claude or GPT-5.2 based on task, with SSE streaming and conversation history persistence.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework across all applications, including performance, business, user experience, and security posture.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` controls access based on entitlements and usage limits, with middleware for API routes.
- **Admin Panel CMS:** Centralized administration for all 16 CMS tables, media asset management, site settings, and Plausible analytics overview.
- **In-App Collaboration Layer:** Platform-wide system for team discussions via a `comments` table, API routes, and shared UI components (`CommentThread`, `ActivityFeed`).
- **Universal Notification & Real-Time Alerting System:** `useNotificationCenter` hook, WebSocket integration for real-time pushes, API endpoints for notification management, and domain-specific notification generators.
- **Alloy Platform Core — Orchestration Engine:** Canonical shared data model (`alloy_owners`, `alloy_signals`, `alloy_workflows`, `alloy_workflow_runs`, `alloy_approvals`, `alloy_actions`, `alloy_artifacts`, `alloy_audit_log`), ingestion layer, normalization pipeline, and workflow orchestration engine.

### Database Schema
Over 97 tables across 21+ schema files, covering authentication, billing, various application-specific data (Vessels, Firestorm, Lyte, Alloy Platform, Dreamscape, Readiness, Stephen/Holdings), Alloy Chat, Collaboration, and MSP (5 tables: msp_clients, msp_technicians, msp_tickets, msp_devices, msp_contracts). Azure/Dataverse schema: `azure_tenants` (multi-tenant provisioning), `dataverse_connections` (per-tenant Dynamics 365 connection config with sync tracking).

### Aegis — Consolidated Defense & Intelligence Platform
Aegis (artifact slug `firestorm`, path `/firestorm/`) consolidates three former standalone apps into one unified platform:
- **Security Operations (SOC):** Former Firestorm — SOC dashboard, MITRE ATT&CK, XDR console, threat hunting, forensics, identity threat, compliance readiness, Sacsayhuamán Shield.
- **Managed Operations (Ops):** Former Rosie/MSP — NOC, client management, ticket queue, RMM console, technician dispatch, revenue/MRR dashboards. Pages in `src/pages/msp/`, routes at `/ops/*`.
- **Intelligence Engine (Intel):** Former INCA — Quipu Command, Chasqui Relay, model registry, experiments, neural explorer, Willaq Umu Oracle. Pages in `src/pages/intel/`, routes at `/intel/*`.
- **DB Schema:** MSP data in `lib/db/src/schema/msp.ts` — 5 tables. INCA data via `@workspace/services`.
- **API Routes:** `/api/msp/*` and `/api/aegis/ops/*` (managed ops), `/api/inca/*` and `/api/aegis/intel/*` (intelligence), `/api/firestorm/*` and `/api/aegis/soc/*` (security), `/api/aegis/*` (readiness/compliance).
- **Theme:** `aegisTheme` in shared-ui, with legacy aliases for `firestormTheme`, `mspTheme`, `incaTheme` all pointing to aegisTheme.

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic
- **Weather Data:** Stormglass
- **Communication:** Slack, Twilio, Resend (for email templates)
- **Productivity/Collaboration:** Google APIs (Calendar, Docs, Drive, Gmail), Notion, Confluence, HubSpot
- **Cloud Storage:** Dropbox, OneDrive
- **Analytics:** Plausible, Posthog
- **Voice Synthesis:** Elevenlabs
- **Government Data Feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau ACS, BLS Construction Employment, FEMA NRI, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR, NYC Open Data (PLUTO + 311), FRED (Federal Reserve), HUD Fair Market Rents
- **Maritime Data:** Digitraffic AIS (Finnish Transport Infrastructure Agency), BarentsWatch AIS (Norwegian Coastal Administration), Open-Meteo Marine Weather API
- **Threat Intelligence (keyless):** Shodan InternetDB, GreyNoise Community API, MalwareBazaar (Abuse.ch), URLhaus (Abuse.ch)
- **Other:** GitHub Public API (OAuth via Replit integration), AbuseIPDB (IP reputation), Figma (design collaboration)

### External Data Feed Health Dashboard
A unified external data feed status panel at `/api/health/external-feeds` monitors 16 external APIs across all four platforms:
- **Vessels:** Digitraffic AIS positions (5min TTL), Open-Meteo Marine Weather (15min TTL), BarentsWatch AIS (5min TTL)
- **Terra:** NYC PLUTO (6hr TTL, filter by zipcode or borough), NYC 311 complaints (1hr TTL), Census ACS (daily), FRED mortgage rates (6hr), BLS construction employment (daily), FEMA NRI (30-day)
- **Aegis:** Shodan InternetDB (1hr, keyless), GreyNoise Community (1hr, keyless), MalwareBazaar (1hr), URLhaus (1hr), NVD CVE (1hr), CISA KEV (daily)
- **Lyte:** GitHub API (5min), real process telemetry (uptime, heap, CPU, DB latency)

All feeds implement: TTL-based in-memory caching, stale data indicators, graceful fallback to demo data, circuit-breaker pattern via Promise.allSettled, and `isStale`/`cacheAgeSeconds` metadata in all responses.
- **Azure Services:** Key Vault, Blob Storage, Redis, PostgreSQL, App Insights (infrastructure stubs)