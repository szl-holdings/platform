# AGENTS.md — A11oy Agentic System Reference

This document describes the agentic architecture of the A11oy Live Enterprise Execution Fabric.

## Overview

A11oy is structured around Workcells — governed, encapsulated units of agentic work. Each Workcell has its own context, tools, approval gates, and proof obligations. Operators assign tasks to Workcells; Workcells reason, recommend, and execute within covenant policy constraints.

## Phase Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 — Foundation | Complete | Brand, schemas, fabric layer, read-side API, demo seed |
| Phase 2 — Agent Runtime | Planned | Operators, governed tools, MirrorEval, governance, Workcell engine, model router, PCE |
| Phase 3 — Full Platform | Planned | Terminal CLI, MCP server, 150-signal seed, 20 Workcells |

## Core Concepts

### Workcell
A Workcell is an encapsulated unit of agentic work. Each Workcell:
- Has a defined vertical (domain)
- Declares its tools and permissions
- Requires covenant policy evaluation before execution
- Carries a ProofCarryingExecution contract on every run
- Is monitored by MirrorEval for quality and alignment

### Operators
Operators are the human-in-the-loop principals who:
- Configure and authorize Workcells
- Approve actions at the appropriate tier (auto, operator, executive, board)
- Review MirrorEval results
- Access the Proof Ledger for audit

### MirrorEval
MirrorEval is the quality and alignment evaluation framework that assesses every AI recommendation against:
- Stated objectives
- Policy constraints
- Historical outcome data
- Business impact estimates

Results are attached to every ActionBrief before it reaches an approval gate.

## Verticals

| Vertical ID | Label | Domain |
|-------------|-------|--------|
| `lyte-revenue` | Lyte Revenue | SaaS revenue operations |
| `vessels-maritime` | Vessels Maritime | Fleet and voyage management |
| `terra-real-estate` | Terra Real Estate | Portfolio and asset management |
| `aegis-defense` | Aegis Defense | Defense and intelligence operations |
| `prism-counsel` | PRISM Counsel | Legal matter and contract management |
| `carlota-jo` | Carlota Jo | Professional services consulting |
| `alloy-core` | Alloy Core | Platform health and fabric operations |

## Fabric Layers (Phase 1 — In-Memory)

1. **Coverage Graph** — Coverage completeness across domains
2. **Signal Mesh** — Signal ingestion and routing
3. **State Engine** — Authoritative enterprise state
4. **Causal Core** — Causal reasoning and explanation
5. **Action Rail** — Governed action recommendation and queuing
6. **Covenant Layer** — Policy evaluation and enforcement
7. **Proof Ledger** — Immutable audit and proof recording

## API Surface

Base URL: `/api/a11oy/`

### Read-Side (Phase 1, Operational)
- `GET /now` — Current summary: signal counts, severity, fabric status
- `GET /signals` — All business signals (filterable by vertical, severity, status)
- `GET /signals/:id` — Single signal by ID
- `GET /outcomes` — Active outcomes
- `GET /actions` — Recommended and active actions
- `GET /proof` — Proof packets list
- `GET /proof/:entityId` — Proof packets for a specific entity
- `GET /governance` — Active covenant policies
- `GET /verticals` — Registered verticals
- `GET /fabric` — Fabric layer health
- `GET /workcells` — Active workcells
- `GET /workcells/:id` — Single workcell by ID

### Write-Side (Phase 2 Stubs — Return 501)
- `POST /actions/:id/approve` — Approve an action
- `POST /actions/:id/execute` — Execute an action
- `POST /workcells/:id/run` — Run a workcell

## Environment Variables

See `.env.example` for all required and optional environment variables.

## Demo Mode

Phase 1 operates in Demo Mode by default. All data is in-memory and deterministic. No external calls are made. Mutating operations are blocked with a `not_implemented` error envelope.
