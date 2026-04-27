# Aegis — Defense & Intelligence Command

> Unified SOC command, managed security operations, and AI research workspaces — four operating surfaces sharing one intelligence layer.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Demo](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor) · [Architecture](../../docs/architecture/architecture.md)

![Aegis — Defense & Intelligence Command](../../.github/assets/screenshots/aegis-hero.jpg)

---

## What it does

Aegis is the defense and intelligence domain pack for the SZL Holdings platform. It provides four unified workspaces — Defense (SOC operations), Command (managed services), Labs (AI research), and Legal (matter intelligence) — that share one data context, one correlation engine, and one operating model.

Live data from CISA KEV, NVD CVE, MITRE ATT&CK v14, and AbuseIPDB power real-time threat detection and enrichment.

## Run locally

```bash
# From the monorepo root
pnpm install
pnpm --filter @workspace/api-server dev   # Start the API server first
pnpm --filter @workspace/aegis dev
```

**Primary route:** `/aegis/`

## Key modules

| Module | Route | Purpose |
|--------|-------|---------|
| Defense | `/aegis/defense` | SOC command — threat detection, XDR correlation, MITRE mapping |
| Command | `/aegis/command` | Managed services operations — device management, client health |
| Labs | `/aegis/labs` | AI research — model evaluation, intelligence engine |
| Legal | `/aegis/legal` | Legal matter intelligence integration |

## Tech stack

React 19 + Vite 7 + TypeScript (strict) · Express 5 (shared API server) · PostgreSQL 16 / Drizzle ORM · CISA KEV / NVD CVE / MITRE ATT&CK v14 / AbuseIPDB (live) · OIDC/PKCE auth · Proof Chain audit trail

## Architecture reference

Full system architecture: [`docs/architecture/architecture.md`](../../docs/architecture/architecture.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [security@szlholdings.com](mailto:security@szlholdings.com)
