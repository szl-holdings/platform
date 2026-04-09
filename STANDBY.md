# SZL Holdings Platform — Standby Guide

**Status:** On standby as of April 9, 2026.
**Tag:** `v1.0-standby`
**Last commit:** `3854aad` — fix: doctrine compliance & production quality sweep — web apps

This document is your "welcome back" guide for resuming work after 1-2 months away.

---

## Ecosystem Overview

This is a **pnpm monorepo** (Node.js 24, TypeScript 5.9) hosting the full SZL Holdings platform — 17 artifacts across 8 web apps, 6 mobile apps, 1 API server, and 1 design sandbox.

### Repository
- **GitHub:** `szl-holdings/szl-holdings-platform` (branch: `master`)
- **Replit Project:** SZL Holdings Platform
- **Database:** PostgreSQL via Replit (446 tables, Drizzle ORM)
- **Auth:** Replit Auth (OIDC/PKCE), 11-role RBAC

---

## Artifacts

### Web Applications

| Artifact | Directory | Preview Path | Purpose | Status |
|----------|-----------|--------------|---------|--------|
| SZL Holdings | `artifacts/szl-holdings` | `/` | Parent company site, HELM console, commercial packaging, ROI calculator | Stable |
| Lyte Command Center | `artifacts/lyte-command-center` | `/lyte-command-center` | Business observability platform — primary commercial product | Stable |
| Vessels Maritime Intelligence | `artifacts/vessels` | `/vessels` | Maritime fleet command intelligence | Stable |
| Aegis / Firestorm | `artifacts/firestorm` | `/firestorm` | Unified defense & intelligence command (SOC, tradecraft, SOAR) | Stable |
| Terra | `artifacts/terra` | `/terra` | Real estate portfolio intelligence | Stable |
| Carlota Jo Consulting | `artifacts/carlota-jo` | `/carlota-jo` | UHNW residential advisory — luxury light theme | Stable |
| PRISM Counsel | `artifacts/prism-counsel` | `/prism-counsel` | Legal matter command & insurance observability | Stable |
| Stephen Lutar | `artifacts/stephen-site` | `/stephen` | Founder identity site | Stable |

### Mobile Applications (Expo / React Native)

| Artifact | Directory | Preview Path | Status |
|----------|-----------|--------------|--------|
| SZL Holdings Mobile | `artifacts/szl-holdings-mobile` | `/szl-holdings-mobile` | Stable |
| Carlota Jo Mobile | `artifacts/carlota-jo-mobile` | `/carlota-jo-mobile` | Stable |
| Lyte Mobile | `artifacts/lyte-mobile` | `/lyte-mobile` | Stable |
| Vessels Mobile | `artifacts/vessels-mobile` | `/vessels-mobile` | Stable |
| Aegis Mobile | `artifacts/aegis-mobile` | `/aegis-mobile` | Failed in dev (known issue — Expo crash) |
| Terra Mobile | `artifacts/terra-mobile` | `/terra-mobile` | Failed in dev (known issue — Expo crash) |
| Stephen Mobile | `artifacts/stephen-mobile` | `/stephen-mobile` | Failed in dev (known issue — Expo crash) |

### Infrastructure

| Artifact | Directory | Preview Path | Purpose | Status |
|----------|-----------|--------------|---------|--------|
| API Server | `artifacts/api-server` | `/api` | Express 5 REST + GraphQL + MCP server | Stable |
| Mockup Sandbox | `artifacts/mockup-sandbox` | `/__mockup` | Component Preview Server (design system) | Stable |

---

## Tech Stack

### Core
- **Runtime:** Node.js 24
- **Language:** TypeScript 5.9
- **Package Manager:** pnpm (workspace monorepo)
- **Frontend:** React 19, Vite 7, TanStack React Query, Wouter, Tailwind CSS v4, Framer Motion, Lucide React, Recharts
- **Backend:** Express 5, Drizzle ORM, Zod validation, pino logging
- **Database:** PostgreSQL (446 tables across multiple schema namespaces)
- **Mobile:** Expo (React Native)

### AI / Intelligence
- **Primary AI:** HuggingFace Inference (Qwen3-8B)
- **Fallbacks:** Replit OpenAI Proxy → OpenAI → Anthropic
- **Alloy AI Engine:** Decision objects, policy-gated tool execution, model registry
- **MCP Server:** 20 tools, 4 resources, 5 prompt templates at `/api/mcp`
- **GraphQL:** Apollo Server v5, 9 domain modules at `/api/graphql`

### External Services (all require env vars — see `.env.example` or API server code)
- Stripe (payments), ElevenLabs (voice), Slack, Twilio, Resend (email)
- Google APIs, Notion, HubSpot, Figma
- CISA KEV, NVD CVE, MITRE ATT&CK (threat feeds)
- Digitraffic AIS / BarentsWatch (maritime data)
- SEC EDGAR, FRED, HUD, Census (financial/gov data)
- Plausible, PostHog (analytics)

---

## Key Features Implemented

### Flagship Platform Features
- **Alloy AI Engine** — decision memory, learning loop, policy governance (`lib/outcome-graph`, `lib/atlas-artifacts`)
- **HELM Console** — unified operator control plane at `/helm` in SZL Holdings
- **Cross-App Handoff Contracts** — 5 typed PRISM BUS contracts across all domain apps
- **MCP Server** — 20 platform tools for AI orchestration at `/api/mcp`
- **Alloy Enterprise Governance** — SOC 2/HIPAA policy engine with 5 DB tables
- **Distribution OS** — full content publishing platform (22 `dos_*` tables, admin panel)
- **NPS & Feedback System** — in-app feedback collection with admin dashboard

### Per-Product Highlights
- **Lyte:** Executive Command pages (7 views), Blocker Board, Digest Center, Alloy Action Console
- **Aegis:** 5 Intelligence Tradecraft pages (ACH matrix, Confidence Challenge, Board Brief, Resilience Drills, Scorecard)
- **Vessels:** Maritime fleet intelligence with live AIS data integration
- **Terra:** Real estate portfolio intelligence with gov data feeds
- **PRISM Counsel:** Legal matter observability, NY insurance layer, 6-lens PRISM framework
- **Carlota Jo:** Luxury rebuild — PremiumHome with gold-dust canvas animation, Cormorant Garamond
- **SZL Holdings:** Commercial packaging page, ROI calculator, relief-based messaging, HELM console

### Marketing Readiness
- All 6 product apps have competitor-grade marketing pages with testimonials and outcome metrics
- Full Open Graph / Twitter Card meta tags on all 8 web apps
- Demo seed data: incidents, listings, leads, articles, newsletters, X posts
- `export/` directory: ready-to-publish social media content (Medium, Substack, X, LinkedIn)

---

## Known Issues

### Mobile Apps (3 failing in development)
- **aegis-mobile, terra-mobile, stephen-mobile** — Expo dev server crashes on startup
- These were intentionally deprioritized (Task #363) to free resources
- Root cause: likely version conflicts or missing native module config
- **Action to resume:** Run `cd artifacts/aegis-mobile && pnpm expo install --fix` and check Expo SDK version compatibility

### General
- Several 3rd-party service integrations (ElevenLabs, Twilio, etc.) use mock/fallback data when env vars are absent — expected behavior in dev
- The `gitsafe-backup/main` branch is a Replit internal backup and diverges from `master` — this is normal

---

## Database

- **446 tables** across multiple namespaces
- **Schema location:** `lib/db/src/schema/`
- **Migrations:** `lib/db/src/migrations/`
- **Seed scripts:** `scripts/` directory
- Connection is managed by Replit's PostgreSQL integration

---

## How to Resume

1. **Start workflows** — All 17 workflows should auto-start; restart any that are stopped
2. **Check API server** — `artifacts/api-server` is the backbone; ensure it starts cleanly
3. **Verify database** — Run `pnpm --filter @szl-holdings/db run migrate` if schema changes needed
4. **Review task history** — Check `.local/tasks/` for the last assigned task number to pick up where work left off
5. **Fix mobile apps** — Address the 3 failing Expo mobile apps (see Known Issues above)
6. **Check Dependabot PRs** — Several dependency update PRs exist on GitHub (`framer-motion`, `recharts`, `react-hook-form`, etc.)

---

## File Structure

```
/
├── artifacts/          # 17 app directories (web, mobile, api, design)
├── lib/
│   ├── db/            # Drizzle ORM schema + migrations
│   ├── shared-ui/     # Shared React components + design tokens
│   ├── shared-types/  # Cross-package TypeScript types
│   ├── outcome-graph/ # Decision memory + learning loop engine
│   └── atlas-artifacts/ # Branded document generation
├── packages/          # Internal packages
├── scripts/           # QA, seeding, build utilities
├── export/            # Ready-to-publish social media content
├── social-media-kit/  # Platform-specific copy files
├── profile-readme/    # GitHub profile README
├── replit.md          # Full architecture reference (auto-loaded by agent)
└── STANDBY.md         # This file
```

---

## Contacts & Links

- **GitHub:** https://github.com/szl-holdings/szl-holdings-platform
- **Replit Project:** SZL Holdings Platform
- **Founder:** Stephen Lutar (`@stephenlutar2-hash` on GitHub)
- **X:** `@szlholdings`
- **LinkedIn:** `linkedin.com/in/stephenlutar`
- **Substack:** `szlholdings.substack.com`

---

*Generated April 9, 2026 — Task #369: Final push & standby prep*
