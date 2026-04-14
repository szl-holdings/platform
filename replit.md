# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a pnpm monorepo that develops **Lyte**, a business observability platform, powered by **Alloy**, its execution fabric and audit layer. The project encompasses five product platforms (Lyte, Vessels, Aegis, Terra, Carlota Jo), a parent company site (SZL Holdings), and a founder identity site (Stephen Lutar). The core vision is to establish Lyte + Alloy as the commercial foundation for an expanding ecosystem, leveraging a shared PostgreSQL database, a unified authentication system, and a command-grade design system. The platform aims to provide advanced observability, governed execution, and intelligent automation capabilities across various business domains, with a strong emphasis on verifiable outcomes and operational readiness.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Technologies
The platform is built as a pnpm monorepo utilizing Node.js 24 and TypeScript 5.9.
- **Frontend:** React, Vite, TanStack React Query, Wouter, Tailwind CSS, Framer Motion, Lucide React, Recharts. Internationalization is handled by `react-i18next` with RTL support.
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
- **Database:** PostgreSQL with Drizzle ORM (over 120 tables) managing multiple schemas including CMS, product, client portal, and organization membership.
- **Authentication:** Replit Auth (OIDC/PKCE), session-based with cookie+Bearer token, 7-role RBAC.
- **API Codegen:** Orval from OpenAPI specification.
- **Bundling:** esbuild (CJS) and Vite.

### UI/UX Design System
A premium, SZL-branded design system inspired by Palantir Foundry/Anduril Lattice, featuring dark-first aesthetics (except for Carlota Jo), purposeful motion, and sharp corners. Typography includes Space Grotesk, Inter, and JetBrains Mono. Applications maintain unique visual identities within the overarching brand hierarchy. Key shared components and design tokens ensure consistency and a high-quality user experience. The Carlota Jo platform specifically features a luxury light-mode theme with warm ivory backgrounds and gold accents.

#### Brand Hierarchy & Visuals
Each platform has a distinct visual identity:
- **SZL Holdings:** Platinum/silver/graphite, incorporating the Alloy module.
- **Lyte:** Burnished amber, focused on business observability.
- **Vessels:** Deep ocean blue, for maritime command intelligence.
- **Terra:** Obsidian/graphite/deep forest, for real-estate portfolio intelligence.
- **Carlota Jo:** Warm ivory/brushed gold, for UHNW residential advisory.
- **Aegis:** Navy/amber/red, for unified defense and intelligence.
- **PRISM Counsel:** A standalone artifact focusing on legal matter observability with specialized data products and an NY insurance observability layer.
- **SZL Distribution OS:** A content publishing and distribution platform with a dedicated admin panel and public-facing content.

### API Layers
- **REST API:** Modular Express routes using Zod and Drizzle, located in `artifacts/api-server`. Includes robust security features.
- **GraphQL API:** A unified API mounted at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions, with 9 domain modules.
- **MCP Server:** Model Context Protocol server at `/api/mcp` for AI tool orchestration, exposing 20 tools, 4 resources, and 5 prompt templates via HTTP+SSE.

### Platform Architecture & Features
The platform consists of 13 interconnected applications sharing authentication and design.
- **Authentication & RBAC:** Middleware with an 11-role RBAC system.
- **Service Adapters:** Integrates 29 third-party services with environment variable detection and mock fallbacks.
- **Multi-Tenant Provisioning & Branding:** Supports Azure AD multi-tenant onboarding, SCIM 2.0 user provisioning, and white-label branding for enterprise tenants.
- **Intelligence Layer:** Over 40 REST endpoints providing cross-platform intelligence, including government data feeds and AI services.
- **Core Command Center:** A unified cross-platform dashboard at `/core`.
- **Alloy AI Decision Engine:** HuggingFace-powered AI execution fabric with schema-validated decision types, a model registry, and policy-gated tool execution.
- **AI Models & Agents:** Utilizes Qwen3-8B (HuggingFace) primarily, with OpenAI and Anthropic as fallbacks. Includes 12 specialized domain AI agents (Alloy, Helmsman, Sentinel, INCA, Muse, Beacon, Zeus, Compass, Lexis, Atlas, Terra, Nexus) and domain-specific AI copilots with SSE streaming and voice input/output.
- **Nuro Mesh Intelligence Layer:** Cross-domain causal reasoning engine (18 causal patterns), proactive agent activation via signal correlation, Bayesian confidence calibration, structured conflict resolution between agents, and agent performance telemetry. Hybrid semantic+keyword routing with cross-domain affinity, pre-turn agent consultation pattern, and maker-checker validation for high-stakes outputs.
- **AlloyChat:** A multi-model AI operations assistant.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework.
- **Feature Gating:** Entitlement-based access control using `checkFeatureAccess`.
- **Admin Panel CMS:** Centralized administration for 16 CMS tables, media assets, and site settings.
- **Collaboration & Notifications:** In-app collaboration layer via `comments` table and a universal notification/real-time alerting system with multi-channel dispatch (Slack, MS Teams) and Expo Push Notifications for mobile.
- **Email Delivery:** Triple-failover email chain (SendGrid → Resend → SMTP nodemailer).
- **Alloy Platform Core:** Orchestration engine with canonical shared data model, ingestion, normalization, and workflow orchestration.
- **Alloy Unified Command Surface:** Features a Global Command Bar, Workspace Home, Decision Objects, Skill Registry, and Operator Control Center.
- **Alloy Enterprise Governance:** A comprehensive governance system with policies, model routing, cost controls, and incident management.
- **Outcome Graph & Atlas Artifacts:** Decision memory and learning loop engine, and branded document/report generation with provenance and versioning.
- **HELM Console:** Operator control plane providing platform health, agent stats, outcome metrics, and trust receipt anomalies.
- **Platform Marketing Readiness:** Includes feature flags, analytics integration, elite layer pages (`/academy`, `/help`, `/demos`), robust demo data, and full Open Graph/Twitter Card meta tags.
- **Cross-App Compounding:** Implements cross-app handoff contracts, notification relay, and a family dashboard in HELM for visualizing cross-platform KPIs and health.
- **Commercialization:** Includes dedicated pages for commercial packaging (`/packages`), ROI calculation (`/roi`), and relief-based messaging (`/relief`).

## External Dependencies
- **Database:** PostgreSQL
- **Authentication:** Replit Auth
- **Payment Processing:** Stripe
- **AI/NLP:** HuggingFace Inference API, Replit's OpenAI proxy, OpenAI, Anthropic, Elevenlabs (for voice synthesis)
- **Communication:** Slack, Twilio, Resend (for email)
- **Productivity/Collaboration:** Google APIs, Notion, Confluence, HubSpot, Dropbox, OneDrive
- **Analytics:** Plausible, Posthog
- **Government Data Feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau ACS, BLS Construction Employment, FEMA NRI, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR, NYC Open Data, FRED, HUD Fair Market Rents
- **Maritime Data:** Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather API
- **Threat Intelligence:** Shodan InternetDB, GreyNoise Community API, MalwareBazaar, URLhaus
- **Other:** GitHub Public API, AbuseIPDB, Figma