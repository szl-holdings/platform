# Carlota Jo — Premium Advisory Operations

> White-glove UHNW client portal with secure communication, service catalog, appointment booking, and Proof Chain-attributed document delivery.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Demo](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor) · [Architecture](../../docs/architecture/architecture.md) · [Platform Thesis](../../docs/investor/platform-thesis.md)

![Carlota Jo Advisory Portal](../../.github/assets/screenshots/carlota-jo-hero.jpg)

---

## What it does

Carlota Jo is the premium advisory operations domain pack for the SZL Holdings platform. It provides a private, white-glove digital experience for ultra-high-net-worth (UHNW) clients: secure intake, service catalog browsing, appointment booking, and document delivery — all under the Proof Chain and Covenant Policy infrastructure.

This is the most complete artifact in the monorepo (GA status). Live integrations: World Bank, BLS, HBR RSS, Microsoft Outlook Calendar/Contacts.

## Run locally

```bash
# From the monorepo root
pnpm install
pnpm --filter @workspace/api-server dev   # Start the API server first
pnpm --filter @workspace/carlota-jo dev
```

**Primary route:** `/carlota-jo/`

## Key modules

| Module | Route | Purpose |
|--------|-------|---------|
| Client Portal | `/carlota-jo/` | Main client engagement surface |
| Service Catalog | `/carlota-jo/services` | Advisory offerings and engagement options |
| Appointments | `/carlota-jo/appointments` | Booking via Microsoft Outlook integration |
| Document Vault | `/carlota-jo/documents` | Secure document delivery with Proof Chain |
| Intelligence | `/carlota-jo/intelligence` | AI-powered market and advisory intelligence |

## Tech stack

React 19 + Vite 7 + TypeScript (strict) · Luxury light-mode design theme · Express 5 (shared API server) · PostgreSQL 16 / Drizzle ORM · World Bank / BLS / HBR RSS / Microsoft Outlook (live) · OIDC/PKCE auth · Proof Chain audit trail

## Architecture reference

Full system architecture: [`docs/architecture/architecture.md`](../../docs/architecture/architecture.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
