# Precision Evolution Runtime — Architecture

> Version: 1.0.0 | Status: Simulation-mode available · Production-ready pattern

## Overview

The Precision Evolution Runtime (PER) is a governed, evidence-gated system for continuously evolving agent policies within the SZL Holdings platform. It manages the full lifecycle from candidate creation through calibration, evaluation, drift-checked promotion, and canary rollout, with every decision logged to an immutable audit trail.

PER is built on a simulation-first principle: the entire system runs in a rich synthetic data mode (`EVOLUTION_MODE=simulation`) by default, making it safe to develop, demo, and operate without requiring real GPU hardware or a live inference backend.

---

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Command Artifact (UI)                      │
│  /evolution/runtime · /evaluation · /governance · /diagnostics  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ REST / JSON
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Server (Express)                       │
│               /api/evolution/*  (14 endpoints)                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Node require
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  @szl-holdings/evolution-core                   │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ Capability │ │  Reward  │ │   Drift    │ │  Governance  │  │
│  │ Detector   │ │ Composer │ │ Measure    │ │  Promo Gate  │  │
│  └────────────┘ └──────────┘ └────────────┘ └──────────────┘  │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐                    │
│  │Calibration │ │ Rollout  │ │ Simulation │                    │
│  │  Engine    │ │ Job Mgr  │ │   Engine   │                    │
│  └────────────┘ └──────────┘ └────────────┘                    │
│  Adapters: local_mock · local_safe · nvidia_remote              │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Drizzle ORM
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL (lib/db)                         │
│  10 PER tables — precision_evolution.ts schema                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Package Layout

```
packages/evolution-core/
  src/
    capability/         — precision profile detection (never claims GPU it can't see)
    adapters/           — local_mock · local_safe · NvidiaInferenceAdapter
    reward/             — multi-component reward composition
    drift/              — KL-divergence, reward delta, latency drift
    governance/         — promotion gate (evidence-gated, human-in-the-loop)
    calibration/        — calibration run management
    rollout/            — canary / phased rollout job runner
    simulation/         — buildSimulatedState() — full synthetic PER state
    utils/              — control-plane helpers, env parsing
    index.ts            — public barrel export
```

---

## Promotion Pipeline

```
Candidate Policy (DRAFT)
        │
        ▼ registerCandidate()
  Calibration Run ──── drift check ────► FAILED → archived
        │
        ▼ (passed)
  Evaluation Run  ──── pass rate ────► FAILED → rollback
        │
        ▼ (≥ threshold)
  Governance Gate ──── policy check ────► BLOCKED → review
        │
        ▼ (all checks pass)
  [human approval if required]
        │
        ▼ approvePromotion()
  Rollout Job (canary → full)
        │
        ▼ activatePolicy()
  ACTIVE Policy
```

---

## Evidence Gating

Every promotion decision records a full evidence bundle:

- Evaluation pass rate vs. configured threshold
- Reward score breakdown (task success, safety, latency, regression, coverage)
- Drift score (KL-divergence proxy, reward delta, latency delta)
- Governance check results (policy compliance, risk level)
- Human approval record (approver identity, timestamp, notes)
- Calibration baseline comparison

This bundle is stored in `per_promotion_decisions.evidence_bundle` and surfaced in the Governance Console.

---

## Current Implementation Scope

The 14 API endpoints are **simulation-first** — all return data from `buildSimulatedState()` when `EVOLUTION_MODE=simulation` (the default). This covers the full demo and development workflow. Live-mode paths (real DB queries, proof-chain writes, worker rollout) are architectural stubs awaiting wiring tasks:

- Live DB reads/writes → wire Drizzle queries in `artifacts/api-server/src/routes/evolution.ts`
- Proof-chain persistence → call `auditChainEvents` table on promotion decisions
- Human approval wiring → write to `approvalRequests` table on `humanApprovalRequired=true`
- Decoupled rollout worker → `workers/evolution-rollout.ts` (not yet created)

See `docs/IMPLEMENTATION_SUMMARY.md` for the full gap table.

---

## Simulation Mode

When `EVOLUTION_MODE=simulation` (the default), `buildSimulatedState()` generates a complete, realistic synthetic PER world:

- 4 candidate policies at different lifecycle stages (active, review, shadow, draft)
- Multiple completed and in-progress evaluation runs with reward breakdowns
- Drift reports with varied severity
- A promotion queue with human-approval-required items
- Runtime diagnostics reflecting the `cpu_safe` Replit environment

Every simulated record is tagged with `simulated: true` and clearly labelled throughout the UI.

---

## Runtime Profiles

| Profile | Hardware Required | Notes |
|---|---|---|
| `cpu_safe` | Any CPU | Default. Always selected on Replit. |
| `cuda_bf16` | NVIDIA Ampere+ | Requires CUDA visible device |
| `cuda_fp8_linear` | NVIDIA Hopper (H100) | FP8 precision |
| `cuda_fp8_linear_kv` | NVIDIA Hopper (H100) | FP8 + KV-cache quantisation |
| `remote_accelerated` | Remote GPU service | Requires `REMOTE_INFERENCE_HEALTH_URL` |
| `future_blackwell_path` | NVIDIA Blackwell | Reserved path, not yet available |

The capability detector selects the highest available profile at startup and **never** claims a capability it cannot verify. Profile selection is logged and surfaced in Diagnostics.
