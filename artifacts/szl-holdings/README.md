# SZL Holdings — Platform Dashboard

> The corporate site, product hub, investor portal, and trust center — the public front door to the SZL Holdings governed decision infrastructure platform.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Site](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor) · [Architecture](../../docs/architecture/architecture.md)

![SZL Holdings Dashboard](../../.github/assets/screenshots/szl-holdings-hero.jpg)

---

## What it does

This is the primary public-facing web application for SZL Holdings. It serves as the corporate site, product overview, investor hub, founder profile, trust center, and — for authenticated operators — the Forge admin surface.

Investors access the data room here. Operators access Forge here. Prospects explore the product portfolio here.

## Run locally

```bash
# From the monorepo root
pnpm install
pnpm --filter @workspace/api-server dev   # Start the API server first
pnpm --filter @workspace/szl-holdings dev
```

**Primary route:** `/`

## Key modules

| Module | Route | Purpose |
|--------|-------|---------|
| Home | `/` | Corporate hero with product overview |
| Products | `/products` | Full platform product portfolio |
| Investor Portal | `/stephen/investor` | Data room and investor materials |
| Trust Center | `/trust` | Security posture, AI governance, compliance |
| Forge Admin | `/forge` | Platform administration (authenticated operators) |

## Tech stack

React 19 + Vite 7 + TypeScript (strict) · Framer Motion · Express 5 (shared API server) · PostgreSQL 16 / Drizzle ORM · OIDC/PKCE auth

## Architecture reference

Full system architecture: [`docs/architecture/architecture.md`](../../docs/architecture/architecture.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
