# Sentra — Cyber Resilience Command

> Threat monitoring, AI-assisted incident triage, security posture scoring, and Guardian-approved response — governed cybersecurity command for enterprise security teams.

[![CI](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/szl-holdings/szl-holdings-platform/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](../../LICENSE.md)

[Live Demo](https://szlholdings.com) · [Platform Demo Video](https://szlholdings.com/szl-demo-video/) · [Investor Dashboard](https://szlholdings.com/stephen/investor) · [Platform Thesis](../../docs/investor/platform-thesis.md)

![Sentra — Cyber Resilience Command](../../.github/assets/screenshots/sentra-hero.jpg)

---

## What it does

Sentra is the cyber resilience domain pack for the SZL Holdings platform. It gives security teams a governed command surface for active threat monitoring, AI-assisted incident triage, cross-environment posture scoring, and policy-gated response actions — all under the same Proof Chain and Covenant Policy infrastructure that governs every SZL Holdings product.

Where traditional SIEMs generate alert volume, Sentra generates governed decisions. Every threat is triaged by AI, every response action requires human approval through Guardian, and every disposition is recorded in the immutable Proof Chain with full actor attribution. Security operations become accountable by design.

## Feature Highlights

- **Threat Monitor** — Real-time threat detection with severity scoring, MITRE ATT&CK mapping, and correlation across environments
- **Incident Triage** — AI-assisted prioritization with explainable confidence scores and Proof Chain attribution on every triage decision
- **Posture Dashboard** — Cross-environment security posture overview with drift tracking and remediation queues
- **Guardian Actions** — Human-in-the-loop response approvals — AI cannot execute consequential actions without explicit human confirmation
- **Compliance Tracker** — Policy adherence monitoring, audit-ready reports, and control framework mapping
- **Alert Correlation** — Cross-domain signal fusion: a Vessels sanctions hit or Terra ownership anomaly can surface a Sentra threat enrichment
- **Response Playbooks** — Codified incident response workflows with approval chains and audit trails

## Architecture

```
Threat Intelligence Feeds / SIEM Integrations / Platform Signals
          |
    Signal Normalization (Alloy)
          |
    Sentra Domain Engine (correlation, severity scoring, MITRE mapping)
          |
    AI Triage (Anthropic / OpenAI)
          |
    Guardian Approval Gate (human-in-the-loop, Covenant Policy)
          |
    Response Execution + Proof Chain (immutable audit trail)
          |
    Sentra UI (React 19 + Vite 7)
```

Every response action is gated by Covenant Policy. AI advisory agents cannot execute without human confirmation — enforced at the Alloy workflow layer, not as a UI option.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Framer Motion |
| **Language** | TypeScript (strict mode, full stack) |
| **State** | TanStack Query v5, React Context |
| **Backend** | Express 5 via shared API server |
| **Database** | PostgreSQL 16 via Drizzle ORM |
| **AI** | Multi-provider (Anthropic, OpenAI, Gemini) via Alloy agent fabric |
| **Auth** | OIDC/PKCE, 11-role RBAC, org-scoped tenant isolation |
| **Audit** | Proof Chain — immutable, append-only event log |

## Quick Start

```bash
# From the monorepo root
pnpm install
pnpm --filter @szl-holdings/api-server dev   # Start the API server first
pnpm --filter @szl-holdings/sentra dev
```

## Key Modules

| Module | Route | Purpose |
|--------|-------|---------|
| Threat Monitor | `/sentra/threats` | Real-time threat detection and severity scoring |
| Incident Triage | `/sentra/incidents` | AI-assisted prioritization with Proof Chain |
| Posture Dashboard | `/sentra/posture` | Cross-environment security posture overview |
| Guardian Actions | `/sentra/guardian` | Human-in-the-loop response approvals |
| Compliance Tracker | `/sentra/compliance` | Policy adherence and audit-ready reports |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API server base URL |
| `VITE_PLAUSIBLE_DOMAIN` | Plausible analytics domain |

Security provider keys and threat intelligence feed credentials live on `api-server`. See [`ops/infra/environment-matrix.md`](../../ops/infra/environment-matrix.md) for the full matrix.

## Visual Standards

See [`media/brand-kit/tokens.md`](../../media/brand-kit/tokens.md) for the visual brand standards that govern this surface.

---

**SZL Holdings** · [szlholdings.com](https://szlholdings.com) · [security@szlholdings.com](mailto:security@szlholdings.com)
