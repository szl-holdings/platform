# A11oy — Governed Execution Fabric Prototype

> Active prototype and investor-demo surface for inspecting governed execution concepts, seeded Workcells, approval gates, and receipt models.

[![CI](https://github.com/szl-holdings/platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Start route](http://localhost:4110/a11oy/start) · [Architecture](../../docs/architecture/architecture.md) · [Claims doctrine](../../docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md)

---

## What it does

A11oy is the governed-execution-fabric product in the SZL Holdings family. This artifact provides an audience-oriented start route and prototype surfaces for architecture, seed Workcells, modeled governance, seeded Proof-Carrying Execution contracts, and demonstration receipts.

The checked-in UI uses repository fixtures unless a surface explicitly identifies a current authenticated source and observation time. A rendered route or fixture status is not evidence of production operation, public deployment, customer use, or source/runtime parity. The operational Workcell registry in `@workspace/a11oy-runtime` currently fails closed as `UNAVAILABLE` with no records.

## Run locally

```bash
# From the monorepo root
pnpm install
pnpm --filter @workspace/a11oy dev
```

The seeded frontend renders without an API server. Connected features may require separately governed services, but the UI must not reinterpret an unavailable service as live.

**Start route:** `/a11oy/start`

## Key modules

| Module | Route | Purpose |
|--------|-------|---------|
| Start here | `/a11oy/start` | Qualified investor and developer journeys |
| Interactive demo | `/a11oy/demo` | Repository-seeded scenario walkthrough |
| Workcells | `/a11oy/workcells` | Seed workflow state separated from `DEMO` evidence state |
| Architecture | `/a11oy/architecture` | Designed component model |
| SDK | `/a11oy/sdk` | Prototype developer exploration surface |
| Governance | `/a11oy/governance` | Modeled policies and browser-local approvals |
| PCE | `/a11oy/pce` | Seed Proof-Carrying Execution contract fields |
| Proof | `/a11oy/proof` | Demonstration reasoning and receipt model |
| Trust | `/a11oy/trust` | Prototype controls, unavailable operations, and roadmap |

## Verify locally

```bash
pnpm --filter @workspace/a11oy-fabric test
pnpm --filter @workspace/a11oy-fabric typecheck
pnpm --filter @workspace/a11oy typecheck
pnpm --filter @workspace/a11oy lint:ci
pnpm --filter @workspace/a11oy build
```

These commands validate local source behavior only. They do not establish a deployment or authenticated operational source.

## Tech stack

React 19, Vite, TypeScript, Wouter, and the repository-local `@workspace/a11oy-fabric` seed package.

## Architecture reference

Full system architecture: [`docs/architecture/architecture.md`](../../docs/architecture/architecture.md)

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
