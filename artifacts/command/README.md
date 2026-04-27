# Unified Command — Operations Command Surface

> The cross-domain nerve center: correlated signals, pending decisions, approval queues, and the Governed Decision Loop — all in one surface.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Demo](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor) · [Architecture](../../docs/architecture/architecture.md)

![Command Operations Surface](../../.github/assets/screenshots/command-hero.jpg)

---

## What it does

Unified Command is the primary operations command surface for the SZL Holdings platform. It merges business observability (formerly Lyte Command Center) and cloud sovereignty (formerly IMPERIUM) into a single interface giving operators a real-time view across all connected domains: signals, pending decisions, approval queues, cloud infrastructure, and the platform's flagship Governed Decision Loop.

The Governed Decision Loop at `/command/operations/governed-decision-loop` walks through the end-to-end decision lifecycle — from raw signal to executed outcome with full Proof Chain — in a step-by-step demonstration any operator or investor can follow.

## Run locally

```bash
# From the monorepo root
pnpm install
pnpm --filter @workspace/api-server dev   # Start the API server first
pnpm --filter @workspace/command dev

# Seed demo data
pnpm seed:demo
```

**Primary route:** `/command/`

## Key modules

| Module | Route | Purpose |
|--------|-------|---------|
| Strategy Dashboard | `/command/` | PRISM 5-pillar operations overview |
| Signal Timeline | `/command/signals` | Cross-domain correlated signal feed |
| Action Queue | `/command/actions` | Pending decisions with context |
| Approvals Center | `/command/approvals` | Human-in-the-loop approval queue |
| Governed Decision Loop | `/command/operations/governed-decision-loop` | End-to-end decision demo |
| Automations | `/command/operations/automations` | n8n workflow bridge (400+ integrations) |
| Infrastructure | `/command/infrastructure` | Cloud sovereignty surfaces |

## Tech stack

React 19 + Vite 7 + TypeScript (strict) · SSE real-time feeds · Recharts · Express 5 (shared API server) · PostgreSQL 16 / Drizzle ORM · Multi-provider AI · OIDC/PKCE auth · Proof Chain audit trail

## Architecture reference

Full system architecture: [`docs/architecture/architecture.md`](../../docs/architecture/architecture.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
