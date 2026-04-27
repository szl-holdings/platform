# Terra — Real Estate Intelligence

> NYC distress pipeline, ownership entity graph, and AI-assisted deal workflow — governed real estate intelligence for acquisition teams and fund operators.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Demo](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor) · [Architecture](../../docs/architecture/architecture.md) · [Platform Thesis](../../docs/investor/platform-thesis.md)

![Terra Real Estate Intelligence](../../.github/assets/screenshots/terra-hero.jpg)

---

## What it does

Terra is the real estate intelligence domain pack for the SZL Holdings platform. It monitors New York City public records for distress signals, maps ownership entity relationships, runs AI-assisted lead scoring, and tracks deal pipelines — all under the same governance infrastructure that powers every SZL Holdings product.

Live data: NYC Open Data distress pipeline, Census ACS, BLS, FEMA, SEC EDGAR. Note: maps are blank without a Mapbox token configured.

## Run locally

```bash
# From the monorepo root
pnpm install
pnpm --filter @workspace/api-server dev   # Start the API server first
pnpm --filter @workspace/terra dev
```

**Primary route:** `/terra/`

> **Maps:** Add `MAPBOX_TOKEN` to your environment secrets to enable map views. The free Mapbox tier covers all demo use cases.

## Key modules

| Module | Route | Purpose |
|--------|-------|---------|
| Distress Pipeline | `/terra/` | NYC distress signal monitoring and lead scoring |
| Ownership Graph | `/terra/ownership` | Entity relationship mapping for properties |
| Deal Pipeline | `/terra/deals` | Active deal tracking with AI-assisted underwriting |
| Market Intelligence | `/terra/market` | NYC market signals from live public data |

## Tech stack

React 19 + Vite 7 + TypeScript (strict) · Mapbox GL JS · Express 5 (shared API server) · PostgreSQL 16 / Drizzle ORM · NYC Open Data / Census ACS / BLS (live) · OIDC/PKCE auth · Proof Chain audit trail

## Architecture reference

Full system architecture: [`docs/architecture/architecture.md`](../../docs/architecture/architecture.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
