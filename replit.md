# SZL Holdings Platform

## Overview
The SZL Holdings Platform is a **governed operational intelligence platform** designed to connect observable data with executable actions under strict governance and full attribution. It is a pnpm monorepo encompassing web and mobile applications, an API, a design system, and a development sandbox. The platform's core architecture revolves around a nine-step governed loop: Signal → Context → Recommendation → Simulation → Policy → Approval → Execution → Proof → Outcome. This loop is powered by five platform primitives: Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, and Workflow Engine.

The platform aims to provide a comprehensive solution for decision lifecycle tracking, immutable audit trails, permission and approval gates, probabilistic risk simulation, and durable process orchestration. Key capabilities include integrated reporting and analytics, AI agents, and a robust execution fabric, targeting various domains such as security, maritime, real estate, legal, and advisory.

## User Preferences
I prefer detailed explanations.
I want iterative development.
Ask before making major changes.
Do not make changes to the folder `Z`.
Do not make changes to the file `Y`.

## System Architecture

### Core Architecture
The platform is built as a pnpm monorepo using TypeScript 5.9, React 19, Vite, and Node.js. It features a micro-frontend architecture for web applications, utilizing a shared gateway proxy pattern on port 9090 for routing sub-path artifacts.

**Five Platform Primitives:**
-   **Outcome Graph:** Tracks the decision lifecycle from recommendation to outcome.
-   **Proof Chain:** Provides an immutable audit trail with provenance.
-   **Covenant Policy:** Manages permissions and human-in-the-loop approval gates.
-   **Monte Carlo:** Offers probabilistic risk simulation before execution.
-   **Workflow Engine:** Orchestrates durable processes.

### Technology Stack
-   **Frontend:** React 19, Vite, TanStack React Query, Wouter, Tailwind CSS v4, Framer Motion.
-   **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging.
-   **Database:** PostgreSQL 16 with Drizzle ORM.
-   **Authentication:** OIDC/PKCE, session-based with cookie+Bearer token, 11-role RBAC.
-   **Mobile:** Expo / React Native, NativeWind.
-   **AI:** Multi-provider (OpenAI, Anthropic, Gemini) with fallback, supporting 9 schema-validated decision types.
-   **Real-time:** WebSocket (HMAC-signed tickets), Server-Sent Events (SSE), push notifications.
-   **Bundling:** esbuild (CJS) and Vite.

### UI/UX and Design System
The platform utilizes a premium, SZL-branded, dark-first design system. Typography includes Space Grotesk, Inter, and JetBrains Mono. Domain packs maintain unique visual identities within the overarching brand. Onboarding components like ProductTour, OnboardingChecklist, and HelpTip are available.

### API Layers
-   **REST API:** Modular Express routes using Zod and Drizzle.
-   **GraphQL API:** Unified API at `/api/graphql` using Apollo Server v5 and `graphql-ws` for subscriptions.
-   **MCP Server:** Model Context Protocol server at `/api/mcp` for AI tool orchestration.

### Key Features
-   **Reporting & Analytics Engine:** Includes an Investor Analytics Dashboard, Data Export Builder, and Scheduled Reports.
-   **Authentication & RBAC:** 11-role hierarchy with global auth enforcer.
-   **Alloy Execution Fabric:** Workflow orchestration with approval gates and decision tracking.
-   **AI Agents:** 12 specialized domain AI agents governed by Covenant Policy.
-   **PRISM Bus:** Cross-domain event bus for signal routing.
-   **Monte Carlo Engine:** Probabilistic simulation with domain-specific scenario libraries.
-   **Multi-Tenant Provisioning:** Azure AD multi-tenant SSO, SCIM 2.0, white-label branding.
-   **Object Storage:** Replit's GCS-backed storage for file uploads and documents, secured by ACLs and presigned URLs.

## External Dependencies
-   **Database:** PostgreSQL 16
-   **Authentication:** Replit Auth (OIDC/PKCE)
-   **Payment Processing:** Stripe
-   **AI Providers:** OpenAI, Anthropic, Gemini, HuggingFace Inference API, Elevenlabs
-   **Communication:** Slack, Twilio, Resend, SendGrid
-   **Maritime Data:** MarineTraffic, AISHub, Digitraffic AIS, BarentsWatch AIS, Open-Meteo Marine Weather
-   **Threat Intelligence:** STIX/TAXII, AlienVault OTX, MISP OSINT, OFAC SDN, EU Consolidated List, UN Security Council, Shodan, GreyNoise, MalwareBazaar
-   **Government Data:** CISA KEV, NVD CVE, MITRE ATT&CK, Census/BLS, FEMA NRI, NYC Open Data, SEC EDGAR
-   **Legal Data:** CourtListener REST API
-   **Other APIs/Services:** GitHub API, Figma, Google APIs, HubSpot