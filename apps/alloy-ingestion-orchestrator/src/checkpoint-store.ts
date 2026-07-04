/**
 * AEF Ingestion Orchestrator — Checkpoint Store
 *
 * Persists workflow run checkpoints so runs can be resumed from the last
 * known-good step after failure or restart.
 *
 * Dev implementation: in-memory (filesystem-backed optional via JSON).
 */

import { randomUUID } from 'node:crypto';
import type { StepResult, WorkflowCheckpoint } from './types.js';

export interface CheckpointStore {
  save(checkpoint: WorkflowCheckpoint): void;
  get(checkpointId: string): WorkflowCheckpoint | undefined;
  latest(runId: string): WorkflowCheckpoint | undefined;
  listByRun(runId: string): WorkflowCheckpoint[];
}

export class InMemoryCheckpointStore implements CheckpointStore {
  private readonly store = new Map<string, WorkflowCheckpoint>();
  private readonly byRun = new Map<string, string[]>();

  save(checkpoint: WorkflowCheckpoint): void {
    this.store.set(checkpoint.checkpointId, { ...checkpoint });
    const list = this.byRun.get(checkpoint.runId) ?? [];
    list.push(checkpoint.checkpointId);
    this.byRun.set(checkpoint.runId, list);
  }

  get(checkpointId: string): WorkflowCheckpoint | undefined {
    return this.store.get(checkpointId);
  }

  latest(runId: string): WorkflowCheckpoint | undefined {
    const ids = this.byRun.get(runId);
    if (!ids || ids.length === 0) return undefined;
    const lastId = ids[ids.length - 1];
    return this.store.get(lastId);
  }

  listByRun(runId: string): WorkflowCheckpoint[] {
    const ids = this.byRun.get(runId) ?? [];
    return ids
      .map((id) => this.store.get(id))
      .filter((c): c is WorkflowCheckpoint => c !== undefined);
  }

  clear(): void {
    this.store.clear();
    this.byRun.clear();
  }
}

export function createCheckpoint(
  runId: string,
  stepIndex: number,
  completedStepResults: StepResult[],
): WorkflowCheckpoint {
  return {
    checkpointId: `cp-${runId}-${stepIndex}-${randomUUID().slice(0, 8)}`,
    runId,
    stepIndex,
    completedStepResults: [...completedStepResults],
    savedAt: new Date().toISOString(),
  };
}

export const defaultCheckpointStore = new InMemoryCheckpointStore();
