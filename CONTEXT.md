# CONTEXT.md — A11oy Platform Context

This document provides deep context for AI assistants, engineers, and operators working on the A11oy platform.

## What A11oy Is

A11oy is the **Live Enterprise Execution Fabric** — a governed, reasoning layer between enterprise data and enterprise decisions. It is not a dashboard, workflow builder, or automation tool. It is the layer that:

1. **Senses** — Continuously ingests business signals from across all verticals
2. **Structures** — Normalizes, classifies, and routes signals through the Signal Mesh
3. **Correlates** — Maintains authoritative enterprise state via the State Engine
4. **Explains** — Traces causal chains via the Causal Core
5. **Recommends** — Generates governed action recommendations via the Action Rail
6. **Approves** — Enforces policy and human approval via the Covenant Layer
7. **Executes** — Carries out approved actions within Workcells
8. **Verifies** — Confirms execution via MirrorEval
9. **Preserves Proof** — Records cryptographic proof of every step via the Proof Ledger

## Repository Structure (Phase 1)

```
artifacts/
  a11oy/                    — A11oy web artifact (this phase)
    src/
      a11oy/
        core/               — types.ts, constants.ts, terminology.ts, demoMode.ts
        schema/             — TypeScript interfaces + Zod validators for all models
        fabric/             — In-memory fabric layer implementations
        demo/               — Seed data: signals, outcomes, policies, proof packets
      components/           — Layout, Header, Footer, shared UI primitives
      pages/                — HomePage, ComingSoon
  api-server/
    src/routes/
      a11oy-fabric-api.ts   — /api/a11oy/* route handlers (read-side + stubs)
```

## Data Model

### Signal Lifecycle
```
BusinessSignal → SignalMesh.ingest() → StateEngine.update()
                → CausalCore.explain() → ActionRail.recommend()
                → CovenantLayer.evaluate() → [approval gate]
                → Workcell.execute() → ProofLedger.record()
```

### Proof Chain
Every action carries a ProofCarryingExecution contract:
- `originSignalId` — The signal that triggered the action
- `causalChainIds` — IDs of causal reasoning steps
- `policyEvaluationId` — Covenant Layer evaluation record
- `approvalRecordId` — Human approval record (if required)
- `executionTraceId` — Workcell execution trace
- `proofPacketId` — Cryptographic proof packet in Proof Ledger

## Demo Mode

Phase 1 operates in Demo Mode:
- All data is in-memory and deterministic
- No external API calls
- No database writes
- Mutating endpoints return 501 with `not_implemented` error type
- `DEMO_MODE = true` in `src/a11oy/core/demoMode.ts`

## Response Envelopes

### Success
```json
{ "ok": true, "data": {...}, "meta": { "timestamp": "...", "mode": "demo" } }
```

### Error
```json
{ "ok": false, "error": { "type": "not_implemented", "message": "...", "retryable": false, "suggestion": "..." } }
```

### Not Found
```json
{ "ok": false, "error": { "type": "not_found", "message": "...", "retryable": false, "suggestion": "..." } }
```

## Phase Roadmap

### Phase 1 — Foundation (This Phase)
- [x] Brand system and home page
- [x] TypeScript schema module (all models)
- [x] Seven-layer fabric (in-memory)
- [x] Demo seed (~30 signals, 5 outcomes, 5 policies, 5 proof packets)
- [x] Read-side API (`/api/a11oy/*`)
- [x] Root documentation

### Phase 2 — Agent Runtime (Planned)
- [ ] Operator model and authentication
- [ ] Tool registry and governed tool execution
- [ ] MirrorEval quality assessment
- [ ] Workcell engine with approval gates
- [ ] Model router (OpenAI, DeepSeek, NVIDIA)
- [ ] Proof-Carrying Execution gate

### Phase 3 — Full Platform (Planned)
- [ ] A11oy Terminal CLI
- [ ] MCP server
- [ ] Full 150-signal / 20-Workcell seed
- [ ] All inner UI pages (Command Surface, NOW Board, etc.)
- [ ] Production database persistence

## Key Terminology

| Term | Definition |
|------|------------|
| Command Surface | The unified human-facing interface for governed action |
| NOW Board | Real-time executive view of signals and decisions |
| Signal Mesh | Signal ingestion and routing layer |
| State Engine | Authoritative current enterprise state |
| Causal Core | Causal reasoning and explanation layer |
| Action Rail | Governed action recommendation and execution lane |
| Covenant Layer | Policy enforcement layer |
| Proof Ledger | Immutable audit and proof recording layer |
| Workcell | Encapsulated unit of agentic work |
| Proof-Carrying Execution | Cryptographic accountability for every action |
| Business Twin | Living structured model of the enterprise |
| MirrorEval | Quality and alignment evaluation framework |
