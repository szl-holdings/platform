# Counsel — Legal Matter Command

> Portfolio-wide legal matter tracking with obligation management, counterparty exposure mapping, and policy-gated human review — built for in-house counsel teams.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Demo](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor) · [Architecture](../../docs/architecture/architecture.md)

![Counsel — Legal Matter Command](../../.github/assets/screenshots/counsel-hero.jpg)

---

## What it does

Counsel is the legal matter intelligence surface for the SZL Holdings platform. It tracks obligations, deadlines, counterparty exposure, and compliance events across the full portfolio — with AI-assisted risk classification and policy-mandated human review gates enforced by the Alloy Fabric.

Every consequential legal action requires human approval through the Human Lock gate. Every disposition is recorded in the Proof Chain with full actor attribution and decision context.

## Run locally

```bash
# From the monorepo root
pnpm install
pnpm --filter @workspace/api-server dev   # Start the API server first
pnpm --filter @workspace/counsel dev
```

**Primary route:** `/counsel/`

## Key modules

| Module | Route | Purpose |
|--------|-------|---------|
| Matter Dashboard | `/counsel/` | Active matter tracking with urgency scoring |
| Obligation Timeline | `/counsel/obligations` | Deadline and obligation management |
| Counterparty Map | `/counsel/counterparties` | Legal exposure by entity |
| Compliance Center | `/counsel/compliance` | Regulatory compliance status |
| Human Lock | `/counsel/approvals` | Policy-gated approval queue |
| Matter Knowledge | `/counsel/knowledge` | RAG knowledge index over matter documents (BM25 retrieval, entity extraction, cited answers) |

## Tech stack

React 19 + Vite 7 + TypeScript (strict) · Express 5 (shared API server) · PostgreSQL 16 / Drizzle ORM · Anthropic Claude (risk classification + RAG) · OIDC/PKCE auth · Proof Chain audit trail

## Architecture reference

Full system architecture: [`docs/architecture/architecture.md`](../../docs/architecture/architecture.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
