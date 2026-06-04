# ATLAS Spatial Runtime — Architecture

**Version:** 1.0  
**Date:** April 2026  
**Status:** Functional Alpha

---

## Overview

The ATLAS Spatial Runtime is the platform layer responsible for **composing, branching, replaying, and governing digital scene state** across all SZL domain verticals. It sits between the raw data layer (domain signals, AIS telemetry, security events, real estate records) and the execution layer (Alloy workflows, approval gates).

Where traditional BI answers "what happened?", the ATLAS Spatial Runtime answers: **"What is the current state of this operational scene, how has it drifted from baseline, what branches are plausible, and what would happen if we acted on each one?"**

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│  ATLAS Spatial Runtime                                         │
│                                                                │
│  ┌──────────────────┐   ┌──────────────────┐                  │
│  │  Scene Memory    │   │   Worldline       │                  │
│  │  Router          │   │   (Branch Store)  │                  │
│  │                  │◄──┤                   │                  │
│  │  Composes scene  │   │  Tracks branch    │                  │
│  │  state from      │   │  lineage, delta   │                  │
│  │  domain signals  │   │  state, approvals │                  │
│  └──────┬───────────┘   └──────┬────────────┘                  │
│         │                      │                               │
│         ▼                      ▼                               │
│  ┌──────────────────────────────────────────┐                  │
│  │  Drift Guard                             │                  │
│  │  Computes drift score vs. baseline       │                  │
│  │  Raises drift alerts above threshold     │                  │
│  │  Triggers proof chain snapshot on drift  │                  │
│  └──────────────────────┬───────────────────┘                  │
│                         │                                      │
│         ┌───────────────┴──────────────┐                       │
│         ▼                              ▼                       │
│  ┌──────────────┐              ┌───────────────┐               │
│  │ Scenario     │              │ Replay        │               │
│  │ Forge        │              │ Engine        │               │
│  │              │              │               │               │
│  │ Generates    │              │ Replays scene │               │
│  │ what-if      │              │ state at any  │               │
│  │ branches via │              │ past timestamp│               │
│  │ AI + Monte   │              │ from snapshot │               │
│  │ Carlo        │              │ compaction    │               │
│  └──────┬───────┘              └───────────────┘               │
│         │                                                      │
│         ▼                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  scene-export: Export Adapters                           │  │
│  │  JSON Snapshot · Branch Package · Proof Bundle · OpenUSD │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
  Alloy Approval Gate            Proof Chain (audit)
  (human-in-the-loop)            (immutable record)
```

---

## Core Components

### 1. Scene Memory Router

The Scene Memory Router is responsible for composing the current "scene" — a typed snapshot of operational state — from domain-specific signals. It:

- Queries the domain signal store for the most recent state of a given entity (vessel, incident, property, matter)
- Applies normalization and enrichment rules specific to each domain
- Outputs a `SceneSnapshot` — the canonical representation of current state

**Compaction & TTL:** Scene snapshots are compacted on a rolling window. Full-resolution snapshots are retained for 72 hours. Hourly checkpoints are retained for 30 days. Monthly aggregates are retained indefinitely. This prevents unbounded storage growth while preserving replay fidelity for post-incident analysis.

**Demo vs. Production Isolation:** When `NODE_ENV !== "production"` or `DEMO_MODE=true`, the Scene Memory Router serves from a seeded snapshot store rather than live signals. This prevents demo data from contaminating production scene state.

### 2. Worldline (Branch Store)

The Worldline is the branching substrate — it maintains the directed acyclic graph of scene branches. Each branch is a delta from a parent scene, with:

- A typed `BranchPackage` containing the delta state and outcome projections
- Approval status (pending, approved, rejected)
- Lineage back to the root scene

Branches are immutable once created. Approval changes the branch's `approvedBy` field and creates a Proof Chain entry. Execution of an approved branch triggers an Alloy workflow.

### 3. Drift Guard

The Drift Guard computes a **drift score** (0.0–1.0) comparing the current scene state against a registered baseline. The baseline is set at scene creation time and can be updated by an approved human action.

| Drift Score | Interpretation | Action |
|-------------|----------------|--------|
| 0.0 – 0.25 | Nominal — within expected variance | No action |
| 0.25 – 0.50 | Elevated — monitor closely | Warning signal |
| 0.50 – 0.75 | Significant drift — review recommended | Alert + scene snapshot |
| 0.75 – 1.0 | Critical drift — intervention required | Alert + proof chain entry + Alloy trigger |

**Proof-chain retention:** Drift Guard snapshot entries are always written to the proof chain at the 0.75 threshold. These entries are retained for the lifetime of the organization record (never purged).

### 4. Scenario Forge

The Scenario Forge generates AI-assisted what-if branches. Given a current scene, it:

1. Queries the AI engine with the scene state and domain context
2. Generates a set of plausible branch hypotheses
3. For each hypothesis, runs a Monte Carlo simulation to compute outcome projections
4. Presents branches ranked by expected value for human review

Scenario Forge is gated by `ENABLE_SCENARIO_FORGE`. When disabled, existing branches are still viewable but no new AI-generated branches are proposed.

### 5. Replay Engine

The Replay Engine reconstructs scene state at any past timestamp from the snapshot compaction store. Use cases:

- **Post-incident review:** Reconstruct the exact scene state at the time of a security incident, voyage anomaly, or matter deadline
- **Audit trail support:** Provide regulators or counsel with a verified reconstruction of operational state at a specific time
- **Model calibration:** Feed historical scenes to the Scenario Forge to evaluate whether past branch proposals would have been accurate

Replay fidelity degrades gracefully: full resolution within 72 hours, hourly checkpoints for 30 days, monthly aggregates beyond that.

---

## Export Adapters (`lib/scene-export`)

The `@szl-holdings/scene-export` package provides typed, contract-driven export adapters for ATLAS scene state:

| Adapter | Output | Use Case |
|---------|--------|----------|
| `JsonSnapshotAdapter` | JSON snapshot | Programmatic integration, API delivery, debugging |
| `BranchPackageAdapter` | JSON branch package | Approval workflow delivery, audit record, branch comparison |
| `ProofBundleAdapter` | JSON proof bundle | Compliance export, legal hold, regulatory submission |
| `OpenUSDManifestAdapter` | USDA text + JSON | Future 3D visualization, Omniverse staging (stub) |

All adapters implement the `ExportAdapterContract<TInput, TOutput>` interface, providing a typed `validate()`, `serialize()`, and `toExportResult()` method.

---

## Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| `ENABLE_ATLAS_SPATIAL_RUNTIME` | `true` | Master kill switch — disables all ATLAS API routes when off |
| `ENABLE_OPENUSD_EXPORTS` | `false` | Enables OpenUSD manifest export adapter (stub) |
| `ENABLE_NIM_PROVIDER` | `false` | Routes spatial inference to NVIDIA NIM endpoint |
| `ENABLE_SCENARIO_FORGE` | `true` | Enables AI branch proposal and Monte Carlo simulation |
| `ENABLE_EXECUTIVE_SAFE_MODE` | `false` | Restricts outputs to executive-safe summaries |

---

## Fallback Behavior

| Scenario | Behavior |
|----------|----------|
| `ENABLE_ATLAS_SPATIAL_RUNTIME` off | All ATLAS routes return `503 Service Unavailable` with maintenance body |
| AI engine unavailable | Scenario Forge degrades to manual branch creation only |
| NIM endpoint unavailable | Falls back to standard AI engine when `ENABLE_NIM_PROVIDER` is on |
| Snapshot compaction failure | Alert logged; scene state served from most recent successful snapshot |
| Proof chain write failure | Scene operation proceeds; alert logged for manual reconciliation |

---

## OpenUSD / Omniverse / RTX / NIM Integration Roadmap

The OpenUSD Manifest Adapter is a typed stub that documents where future GPU-accelerated infrastructure would integrate:

1. **OpenUSD SDK** — Replace `serializeToUsdText()` with NVIDIA USD Python bindings (`pxr.Usd`) or C++ SDK for true binary `.usdc` output
2. **Omniverse Nucleus** — Upload generated layers to a Nucleus server for multi-app scene composition
3. **RTX Renderer** — Trigger RTX render jobs via OmniFarm/KitAppStreaming for visual scene snapshots
4. **NIM (NVIDIA Inference Microservices)** — Route spatial inference through NIM endpoints for GPU-accelerated anomaly detection on the scene graph

This integration is not required for functional ATLAS operation — the platform runs entirely on CPU-resident JSON state. The OpenUSD layer is an additive visualization and inference acceleration capability.

---

## Data Model

ATLAS scene state is persisted in the `atlas_artifacts` table with the following key fields:

| Field | Purpose |
|-------|---------|
| `slug` | Stable identifier for version history |
| `domain` | Domain pack (`maritime`, `security`, `real_estate`, `general`) |
| `sections` | Typed section array — the scene content |
| `metadata` | Scene-specific metadata (drift score, correlationId, etc.) |
| `proofChainId` | Foreign key to proof chain entry |
| `isLatest` | Branch/version flag |

---

*See also: [Buyer Overview](../buyer/atlas-spatial-runtime-overview.md) · [Trust Controls](../trust/atlas-spatial-runtime-controls.md) · [Investor Moat](../investor/atlas-spatial-runtime-moat.md) · [Demo Guide](../demo/atlas-spatial-runtime-demo.md)*
