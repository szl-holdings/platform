# AGENTS — packages/trace-graph

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the trace graph package.

## What This Is

`@workspace/trace-graph` provides full-fidelity trace capture for agent runs: run spans, model calls, tool invocations, retrievals, memory operations, and workflow steps. Traces are queryable and replayable. This is the foundation for the Reflection Engine, Eval OS, and Replay Core.

## Critical Rules

- **Every agent run must produce a root RunSpan.** If a run completes without a trace, the reflection engine cannot score it, and the eval system cannot benchmark it.
- **Correlation IDs are propagated from the originating signal.** The `correlationId` on a trace must match the `correlationId` on the signal that triggered the run. Never generate a new one.
- **Traces are immutable after the run completes.** You can add spans to an in-progress run, but you cannot modify or delete spans after the run transitions to `completed` or `failed`.
- **No PII in trace payloads.** Trace payloads may contain model inputs and outputs. Do not include user PII, credentials, or session tokens in the payload. Use references (e.g. `userId: "hash:abc123"`) instead of raw values.

## Key Files

| File | Purpose |
|------|---------|
| `src/schema.ts` | Trace span type definitions |
| `src/writer.ts` | Trace write API |
| `src/store.ts` | In-memory trace store |
| `src/postgres-store.ts` | PostgreSQL-backed trace store |
| `src/replay.ts` | Deterministic replay logic |
| `src/query.ts` | Trace query API |
| `src/sdk.ts` | High-level SDK for agent instrumentation |
