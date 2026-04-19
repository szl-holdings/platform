# Counsel — Legal Matter Command

> Portfolio-wide legal matter tracking with obligation management, counterparty exposure mapping, and policy-gated human review — built for in-house counsel teams.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Demo](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor)

---

## What it does

Counsel is the legal matter intelligence surface for the SZL Holdings platform. It tracks obligations, deadlines, counterparty exposure, and compliance events across the full portfolio — with AI-assisted risk classification and policy-mandated human review gates enforced by the Alloy Fabric.

In-house counsel teams deal with volume: hundreds of active matters, thousands of deadlines, and exposure spread across dozens of counterparties. Counsel surfaces the right matter at the right moment, flags urgency before it becomes a miss, and ensures every consequential legal action has a human approval in the Proof Chain.

## Feature Highlights

- **Matter Dashboard** — Active legal matter tracking with urgency scoring and deadline proximity ranking
- **Obligation Timeline** — Deadline and obligation management: filing dates, renewal triggers, notice periods
- **Counterparty Map** — Legal exposure visualization by entity and counterparty relationship
- **Compliance Center** — Regulatory compliance status, control gap analysis, and audit readiness scoring
- **Human Lock** — Policy-mandated human review gates: consequential legal actions require explicit counsel approval before execution
- **Cross-Domain Signals** — Legal matter enrichment from Vessels (sanctions), Terra (ownership disputes), and Sentra (data breach exposure)

## Architecture

```
Portfolio Legal Data / Regulatory Feeds / Cross-Domain Signals
          |
    Signal Normalization (Alloy)
          |
    Counsel Domain Engine (urgency scoring, obligation resolution)
          |
    AI Risk Classification (Anthropic Claude)
          |
    Human Lock Gate (Covenant Policy — counsel approval required)
          |
    Proof Chain (immutable legal event log)
          |
    Counsel UI (React 19 + Vite 7)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Framer Motion |
| **Language** | TypeScript (strict mode, full stack) |
| **State** | TanStack Query v5, React Context |
| **Backend** | Express 5 via shared API server |
| **Database** | PostgreSQL 16 via Drizzle ORM |
| **AI** | Anthropic Claude via Alloy agent fabric (risk classification) |
| **Auth** | OIDC/PKCE, 11-role RBAC, org-scoped tenant isolation |
| **Audit** | Proof Chain — immutable, append-only event log |

## Quick Start

```bash
# From the monorepo root
pnpm install
pnpm --filter @szl-holdings/api-server dev   # Start the API server first
pnpm --filter @szl-holdings/counsel dev
```

## Key Modules

| Module | Route | Purpose |
|--------|-------|---------|
| Matter Dashboard | `/counsel/` | Active matter tracking with urgency scoring |
| Obligation Timeline | `/counsel/obligations` | Deadline and obligation management |
| Counterparty Map | `/counsel/counterparties` | Legal exposure by entity |
| Compliance Center | `/counsel/compliance` | Regulatory compliance status |
| Human Lock | `/counsel/approvals` | Policy-gated approval queue |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API server base URL |
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain |

See [`ops/infra/environment-matrix.md`](../../ops/infra/environment-matrix.md) for the full matrix.

## Visual Standards

See [`media/brand-kit/tokens.md`](../../media/brand-kit/tokens.md) for the visual brand standards that govern this surface.

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
