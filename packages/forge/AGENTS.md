# AGENTS — packages/continuum

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the Continuum cognitive runtime package.

## What This Is

`@workspace/continuum` is the cognitive runtime and execution control plane. It manages agent runs, model routing, tool invocation (via `@workspace/tool-mesh`), approval gates (via `@workspace/guardian`), action ledger writing, and checkpoints. Everything that requires an agent to "do something" flows through Continuum.

## Before You Change Anything

1. Understand the run lifecycle: `pending → running → awaiting_approval → approved → executing → completed` (or `failed`).
2. Understand checkpoint semantics: runs must be resumable after restart without re-executing committed steps.
3. Understand that `@workspace/guardian` is the approval gate — Continuum calls it, does not bypass it.

## Critical Rules

- **Approval gates are mandatory for consequential steps.** If a workflow step is marked `requiresApproval: true`, Continuum must call `guardian.requestApproval()` before executing. This check cannot be skipped in any autonomy mode other than `full_auto`, and `full_auto` requires founder approval to activate.
- **Checkpoints are append-only.** A checkpoint records the state at a completed step. Do not modify or delete checkpoint records.
- **Tool invocations are governed.** Every tool call goes through `@workspace/tool-mesh`. Do not invoke tools directly from Continuum internals — tool governance (rate limits, policy checks, audit logging) lives in tool-mesh.
- **Correlation IDs propagate.** Pass the originating signal's `correlationId` through every run, checkpoint, and ledger entry.

## Key Files

| File | Purpose |
|------|---------|
| `src/run-manager.ts` | Run lifecycle management |
| `src/checkpoint.ts` | Checkpoint/resume logic |
| `src/model-router.ts` | Model routing and selection |
| `src/ledger.ts` | Action ledger (append-only execution log) |
| `src/workflow.ts` | Workflow orchestration |
| `src/types.ts` | All Continuum type definitions |
