# Pulse — AI Executive Briefing

> Narrative intelligence briefings synthesized from live platform signals across all domains — an AI-powered executive intelligence layer that replaces daily status meetings.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Demo](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor) · [Platform Thesis](../../docs/investor/platform-thesis.md)

---

## What it does

Pulse generates structured narrative intelligence briefings synthesized from live signals across all SZL Holdings domain packs — maritime, real estate, cybersecurity, advisory, and operations. Instead of navigating multiple dashboards, executives receive a single curated briefing that surfaces what changed, why it matters, and what decisions are pending.

Pulse is the output layer of the SZL Holdings intelligence stack. Where the platform observes and governs, Pulse communicates — converting thousands of correlated signals into the three paragraphs an executive actually needs.

## Feature Highlights

- **Briefing Reader** — Structured narrative intelligence reports with section-level navigation and source attribution
- **Signal Synthesis** — Cross-domain signal aggregation that correlates maritime, security, real estate, and operational signals into coherent narratives
- **Trend Analysis** — Automated trend detection with velocity scoring and directional indicators
- **Risk Summaries** — Distilled risk register surfaced as plain-language executive summaries
- **Opportunity Highlights** — AI-generated opportunity callouts linked to active platform signals
- **Briefing Archive** — Historical briefing index with full-text search and signal replay
- **Domain Lens** — Filter briefings by domain pack (Vessels, Terra, Sentra, Carlota Jo, Command)

## Architecture

```
Platform Signals (Vessels + Terra + Sentra + Command + Carlota Jo)
          |
    PRISM Bus (cross-domain event fabric)
          |
    Signal Synthesis Engine (correlation, clustering, ranking)
          |
    AI Narrative Generator (Anthropic Claude / OpenAI GPT)
          |
    Briefing Store (PostgreSQL + Drizzle ORM)
          |
    Pulse UI (React 19 + Vite 7)
```

Pulse reads from the shared signal fabric rather than hitting domain APIs directly, ensuring briefings reflect the same correlated view that operators see in real time.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Framer Motion |
| **Language** | TypeScript (strict mode, full stack) |
| **State** | TanStack Query v5, React Context |
| **Backend** | Express 5 via shared API server |
| **Database** | PostgreSQL 16 via Drizzle ORM |
| **AI** | Anthropic Claude + OpenAI GPT via Alloy agent fabric |
| **Auth** | OIDC/PKCE, 11-role RBAC, org-scoped tenant isolation |

## Quick Start

```bash
# From the monorepo root
pnpm install
pnpm --filter @szl-holdings/api-server dev   # Start the API server first
pnpm --filter @szl-holdings/pulse dev
```

## Key Modules

| Module | Route | Purpose |
|--------|-------|---------|
| Briefing Reader | `/pulse/` | Current intelligence briefing |
| Briefing Archive | `/pulse/archive` | Historical briefing index |
| Domain Lens | `/pulse/domains` | Domain-filtered briefing views |

## Notable Source Paths

| Path | Purpose |
|------|---------|
| `src/pages/` | Briefing reader and archive routes |
| `src/components/` | Briefing layout components |
| `src/lib/` | API client and formatting helpers |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_DEMO_ALLOWED` | Toggle demo-mode briefings |
| `VITE_STRIPE_PRICE_PULSE_EXECUTIVE` | Stripe price ID for Pulse Executive tier |

AI provider keys live on `api-server` (`AI_INTEGRATIONS_*`). See [`ops/infra/environment-matrix.md`](../../ops/infra/environment-matrix.md) for the full matrix.

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
