# @workspace/alloy

Alloy OS is the **cognitive runtime and execution fabric** for the SZL Agentic Cognitive Operating Intelligence Platform.

## Contract

Alloy provides the run manager, checkpoint/replay hooks, model router interface, tool invocation through Tool Mesh, approval gate via Guardian, and an immutable action ledger. Every agent run is tracked end-to-end.

### Key Interfaces

- **RunManager** — Orchestrates workflow execution, checkpointing, and ledger recording
- **WorkflowStep** — Typed contract for individual workflow steps
- **ModelRouter** — Selects the best model based on task, latency budget, and cost
- **ActionLedgerWriter** — Immutable record of all actions taken during a run
- **CheckpointStore** — Saves and restores run state for replay/recovery

### Running a Workflow

```typescript
import { RunManager, RunConfigSchema } from '@workspace/forge';

const manager = new RunManager();

const config = RunConfigSchema.parse({
  runId: 'run-001',
  workflowId: 'invoice-processing',
  agentId: 'financial-agent',
  policyTier: 'regulated-workflow',
  checkpointEnabled: true,
});

manager.createRun(config);

const state = await manager.executeSteps(config.runId, [
  validateStep,
  extractDataStep,
  enrichStep,
  postToLedgerStep,
], config);

console.log(state.status); // 'completed' | 'failed' | ...
```

### Reference Workflow

```typescript
import { runReferenceWorkflow } from '@workspace/forge/workflow';

const result = await runReferenceWorkflow('hello world', {
  policyTier: 'internal-workflow',
  agentId: 'test-agent',
});
```

## Non-goals

- Alloy does not ship with a production LLM client — wire your model router per-app.
- Alloy does not implement human-in-the-loop approval UIs — wire the approval gate per-app.
- Per-app 3.0 runtime adoption happens in separate follow-up tasks.

## Absorption

This package absorbs and re-exports `@szl-holdings/action-engine` as a compatibility shim.
