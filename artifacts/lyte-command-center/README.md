# Lyte Command Center — Decision Intelligence

> **Archived — all functionality merged into [Unified Command](../command/README.md).** This artifact is retained for historical reference only; no new development happens here.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Unified Command (successor)](../command/README.md) · [Architecture](../../docs/architecture/architecture.md) · [Investor Dashboard](https://szlholdings.com/stephen/investor)

![Lyte Command Center](../../.github/assets/screenshots/lyte-command-center-hero.jpg)

---

## What it does

Lyte was the original business observability surface for the SZL Holdings platform. It provided cross-domain metrics, outcome tracking, and decision quality scoring. All functionality has been absorbed into [Unified Command](../command/README.md) (`/command/`), which is a strict superset.

## Run locally (deprecated — use Unified Command instead)

```bash
# Use Unified Command instead:
pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/command dev
```

**Primary route (archived):** `/lyte/`
**Active successor route:** `/command/`

## Route migration

| Old Route | New Route |
|-----------|-----------|
| `/lyte/` | `/command/` |
| `/lyte/signals` | `/command/signals` |
| `/lyte/actions` | `/command/actions` |
| `/lyte/approvals` | `/command/approvals` |

## Tech stack

React 19 + Vite 7 + TypeScript (strict) · Express 5 (shared API server) · PostgreSQL 16 / Drizzle ORM

## Architecture reference

Full system architecture: [`docs/architecture/architecture.md`](../../docs/architecture/architecture.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com)
