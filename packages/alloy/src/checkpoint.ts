import type { RunState } from './types.js';

export interface CheckpointStore {
  save(checkpoint: Checkpoint): void;
  get(checkpointId: string): Checkpoint | undefined;
  listByRun(runId: string): Checkpoint[];
  latest(runId: string): Checkpoint | undefined;
}

export interface Checkpoint {
  checkpointId: string;
  runId: string;
  stepIndex: number;
  state: RunState;
  savedAt: string;
}

export class InMemoryCheckpointStore implements CheckpointStore {
  private readonly checkpoints = new Map<string, Checkpoint>();

  save(checkpoint: Checkpoint): void {
    this.checkpoints.set(checkpoint.checkpointId, checkpoint);
  }

  get(checkpointId: string): Checkpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  listByRun(runId: string): Checkpoint[] {
    return Array.from(this.checkpoints.values())
      .filter((c) => c.runId === runId)
      .sort((a, b) => a.stepIndex - b.stepIndex);
  }

  latest(runId: string): Checkpoint | undefined {
    const all = this.listByRun(runId);
    return all[all.length - 1];
  }
}

export function createCheckpoint(state: RunState, stepIndex: number): Checkpoint {
  return {
    checkpointId: `cp-${state.runId}-${stepIndex}-${Date.now()}`,
    runId: state.runId,
    stepIndex,
    state: { ...state },
    savedAt: new Date().toISOString(),
  };
}

export const defaultCheckpointStore = new InMemoryCheckpointStore();
