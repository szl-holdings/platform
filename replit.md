# DreamStack Platform

## Overview
DreamStack is a pnpm monorepo consisting of 13 interconnected applications. It shares a common PostgreSQL database, authentication system, and a command-grade design system. The platform is designed for Stephen Lutar, founder of SZL Holdings, and follows a strict brand hierarchy: SZL Holdings, Alloy, Lyte, Vessels, Terra, Carlota Jo, and Stephen Lutar's personal identity. The project aims to provide an advanced ecosystem of command and intelligence platforms with specialized AI capabilities for various business domains, from maritime intelligence to elite real estate brokerage and premium advisory services.

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
- **Lyte:** Signal cyan, for business observability.
- **Vessels:** Deep ocean blue, maritime command intelligence.
- **Terra:** Stone/slate, elite real estate.
- **Carlota Jo:** Warm ivory/brushed gold, light luxury, serif fonts.
- **Stephen Lutar:** Near-monochrome, founder identity.

### Platform Architecture & Features
The platform features 13 applications sharing authentication and design.
- **Authentication & RBAC:** Middleware manages Bearer token sessions and Replit Auth with an 11-role RBAC system.
- **API Server:** Modular routes in `artifacts/api-server` use Zod for validation and Drizzle for persistence, incorporating security features like `helmet`, `express-rate-limit`, CORS, and structured error handling.
- **Service Adapters:** `lib/services` provides a pattern for integrating 27 third-party services with environment variable detection and mock fallbacks.
- **Stripe Billing:** Full integration for checkout, subscriptions, and webhooks.
- **Intelligence Layer:** Over 40 REST endpoints provide cross-platform intelligence, including government data feeds with TTL caching and AI-powered endpoints (chat, summarize, sentiment, image-gen, threat-briefing).
- **Live AI Models:** AI inference primarily uses GPT-5.2 (OpenAI via Replit proxy) and Claude Sonnet 4.6 (Anthropic via Replit proxy).
- **Nimbus AI Evolution:** Production intelligence layer with core modules for inference telemetry, a unified AI gateway, real-time provider health monitoring, an enhanced model registry, multi-agent orchestration, and composable multi-step AI pipelines.
- **Domain AI Agents:** 10 specialized advisory-only agents (e.g., Helmsman, Sentinel, INCA) with specialized system prompts and tool definitions, accessible via a unified API.
- **AI Copilots:** Domain-specific AI copilots (`AgentCopilot` component) in all applications, featuring SSE streaming, markdown rendering, suggested questions, voice input/output, and mobile optimization.
- **Agent Training Studio (Admin Panel):** Allows per-agent training with Q&A pairs, behavioral customization, and performance monitoring.
- **AlloyChat (Admin Panel):** A multi-model AI operations assistant routing queries to Claude or GPT-5.2 based on task, with SSE streaming and conversation history persistence.
- **Observability:** Structured logging via pino and an 8-pillar domain-native observability framework across all applications, including performance, business, user experience, and security posture.
- **Feature Gating:** `checkFeatureAccess(orgId, featureKey)` controls access based on entitlements and usage limits, with middleware for API routes.
- **Admin Panel CMS:** Centralized administration for all 16 CMS tables, media asset management, site settings, and Plausible analytics overview.
- **In-App Collaboration Layer:** Platform-wide system for team discussions via a `comments` table, API routes, and shared UI components (`CommentThread`, `ActivityFeed`).
- **Universal Notification & Real-Time Alerting System:** `useNotificationCenter` hook, WebSocket integration for real-time pushes, API endpoints for notification management, and domain-specific notification generators.
- **Alloy Platform Core — Orchestration Engine:** Canonical shared data model (`alloy_owners`, `alloy_signals`, `alloy_workflows`, `alloy_workflow_runs`, `alloy_approvals`, `alloy_actions`, `alloy_artifacts`, `alloy_audit_log`), ingestion layer, normalization pipeline, and workflow orchestration engine.

### Database Schema
Over 90 tables across 20+ schema files, covering authentication, billing, various application-specific data (Vessels, Firestorm, Lyte, Alloy Platform, Dreamscape, Readiness, Stephen/Holdings), Alloy Chat, and Collaboration.

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
- **Government Data Feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, FedRAMP, Census Bureau, BLS, FEMA, USAspending.gov, NOAA, arXiv, Semantic Scholar, PapersWithCode, HuggingFace Hub, SEC EDGAR
- **Other:** AbuseIPDB (IP reputation), Figma (design collaboration)
- **Azure Services:** Key Vault, Blob Storage, Redis, PostgreSQL, App Insights (infrastructure stubs)