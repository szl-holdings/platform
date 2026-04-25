# A11oy Phase 3 — Sovereign Execution Lab Architecture

## Overview

A11oy Phase 3 adds the Sovereign Execution Lab to the governed execution fabric. This document describes the Phase 3 architecture, data flows, and component interactions.

## Components

### Backend — Sovereign API (`artifacts/api-server/src/routes/a11oy-sovereign-api.ts`)

Mounted at `/api/a11oy`. All Phase 3 endpoints are read-only (GET) or demo-mutation (POST) — no destructive operations in demo mode.

#### Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/sovereign/summary` | GET | Telemetry rollup: tenants, models, evals, replays, connectors, twins, skills, board packets |
| `/models` | GET | 5 model profiles: GPT-4o, DeepSeek-R2, Llama 3.3, Mixtral, Mock |
| `/models/health` | GET | Provider health scores, fallback chain, active provider |
| `/evals/sovereign` | GET | MirrorEval 2.0: 40+ eval results, regression suite, model comparison, compliance trend |
| `/replay` | GET | 15 workcell replay summaries with failure classification |
| `/replay/:id` | GET | Full replay detail with step timeline |
| `/connectors/sovereign` | GET | 12 connectors with trust scores, firewall events, injection blocking |
| `/connectors/:id/test` | POST | Demo connection test (no real connector call) |
| `/twins/sovereign` | GET | 30+ business twins with drift scores, risk levels, recommended actions |
| `/twins/sovereign/:id` | GET | Twin detail with full state |
| `/twins/sovereign/:id/simulate` | POST | No-action vs. approved-action simulation |
| `/skills/sovereign` | GET | 15 skills with success rates, latency, tool policies |
| `/skills/sovereign/:id/run` | POST | Demo skill execution |
| `/boardroom/sovereign` | GET | 5 board packets with KPIs, sections, proof references |
| `/boardroom/generate` | POST | Generate new board packet (demo) |
| `/trust` | GET | Complete trust posture: governance controls, security claims |
| `/telemetry` | GET | 50+ trace spans with blocked span analysis |
| `/demo/regenerate` | POST | Regenerate all demo seed data |
| `/selftest/run` | POST | Run sovereign self-test (10 system checks) |

### Frontend — Phase 3 Pages (`artifacts/a11oy/src/pages/`)

| Page | Route | API Dependency |
|---|---|---|
| `Sovereign.tsx` | `/sovereign` | `/sovereign/summary`, `/selftest/run`, `/demo/regenerate` |
| `ModelRouter.tsx` | `/model-router` | `/models`, `/models/health` |
| `MirrorEval.tsx` | `/evals` | `/evals/sovereign` |
| `WorkcellReplay.tsx` | `/replay` | `/replay` |
| `ConnectorFirewall.tsx` | `/connectors` | `/connectors/sovereign`, `/connectors/:id/test` |
| `TwinFoundry.tsx` | `/twins` | `/twins/sovereign`, `/twins/sovereign/:id/simulate` |
| `SkillsLibrary.tsx` | `/skills` | `/skills/sovereign`, `/skills/sovereign/:id/run` |
| `BoardroomMode.tsx` | `/boardroom` | `/boardroom/sovereign`, `/boardroom/generate` |
| `TrustCenter.tsx` | `/trust` | `/trust` |
| `InvestorDemo.tsx` | `/investor-demo` | (static — 12 seeded stages) |

## Data Flow

```
Signal Mesh
    ↓
Workcell Runtime (structured execution)
    ↓
MirrorEval 2.0 (14-dimension scoring)
    ↓ [pass/blocked]
Covenant Layer (approval gate)
    ↓ [approved]
Connector Firewall (tool allowlist)
    ↓
Execution + Proof Ledger (SHA-256 hash chain)
    ↓
Twin Foundry (state update)
    ↓
Boardroom Mode (synthesis)
```

## Demo Mode Boundaries

All Phase 3 endpoints are instrumented with `demoMode: true`. In demo mode:
- No real LLM API calls
- No real connector calls
- No destructive tool execution
- All data is seeded and deterministic
- Simulations use pre-computed outputs

## Security Architecture

See `docs/CONNECTOR_FIREWALL.md` and `docs/HUMAN_GATED_AUTONOMY.md` for full details.

Key principles:
- Default deny on all connectors
- Prompt injection scanning on every tool call input and output
- Schema validation required before any connector is approved
- Consent gate required before first call

## Deployment Model

| Posture | Status | Description |
|---|---|---|
| Cloud Managed | LIVE (demo) | Current. A11oy hosted infrastructure. Demo data only. |
| VPC Isolated | ROADMAP | Customer VPC. Data stays within cloud boundary. |
| Air-Gapped | ROADMAP | Full on-premises. Local model inference. Defense/gov. |
