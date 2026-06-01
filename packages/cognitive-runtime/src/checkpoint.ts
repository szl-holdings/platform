import { randomUUID } from 'node:crypto';
import type { CognitiveLoopRun } from './types.js';

export interface CheckpointEntry {
  ref: string;
  runId: string;
  agentId: string;
  objective: string;
  phase: string;
  stepIndex: number;
  snapshot: CognitiveLoopRun;
  createdAt: number;
  expiresAt?: number;
}

export interface CheckpointStore {
  save(entry: CheckpointEntry): void;
  load(ref: string): CheckpointEntry | undefined;
  list(runId?: string): CheckpointEntry[];
  listByAgent(agentId: string, runId?: string): CheckpointEntry[];
  delete(ref: string): boolean;
  prune(maxAgeMs?: number): number;
}

export class InMemoryCheckpointStore implements CheckpointStore {
  private entries = new Map<string, CheckpointEntry>();

  save(entry: CheckpointEntry): void {
    this.entries.set(entry.ref, entry);
  }

  load(ref: string): CheckpointEntry | undefined {
    return this.entries.get(ref);
  }

  list(runId?: string): CheckpointEntry[] {
    const all = Array.from(this.entries.values());
    if (runId) return all.filter((e) => e.runId === runId);
    return all;
  }

  listByAgent(agentId: string, runId?: string): CheckpointEntry[] {
    const all = Array.from(this.entries.values()).filter((e) => e.agentId === agentId);
    if (runId) return all.filter((e) => e.runId === runId);
    return all;
  }

  delete(ref: string): boolean {
    return this.entries.delete(ref);
  }

  prune(maxAgeMs = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;
    for (const [ref, entry] of this.entries) {
      if (entry.createdAt < cutoff || (entry.expiresAt && entry.expiresAt < Date.now())) {
        this.entries.delete(ref);
        removed++;
      }
    }
    return removed;
  }
}

/**
 * A CheckpointStore wrapper that delegates to a swappable backend. Mirrors
 * the MutableTraceStore pattern: process-wide singletons hold a reference to
 * a MutableCheckpointStore so the API server can install a Postgres-backed
 * implementation at boot time without breaking import sites.
 */
export class MutableCheckpointStore implements CheckpointStore {
  private backend: CheckpointStore;

  constructor(initial: CheckpointStore = new InMemoryCheckpointStore()) {
    this.backend = initial;
  }

  setBackend(store: CheckpointStore): void {
    this.backend = store;
  }

  getBackend(): CheckpointStore {
    return this.backend;
  }

  save(entry: CheckpointEntry): void {
    this.backend.save(entry);
  }

  load(ref: string): CheckpointEntry | undefined {
    return this.backend.load(ref);
  }

  list(runId?: string): CheckpointEntry[] {
    return this.backend.list(runId);
  }

  listByAgent(agentId: string, runId?: string): CheckpointEntry[] {
    return this.backend.listByAgent(agentId, runId);
  }

  delete(ref: string): boolean {
    return this.backend.delete(ref);
  }

  prune(maxAgeMs?: number): number {
    return this.backend.prune(maxAgeMs);
  }
}

export const defaultCheckpointStore: MutableCheckpointStore = new MutableCheckpointStore();

export function saveCheckpoint(
  run: CognitiveLoopRun,
  stepIndex: number,
  store: CheckpointStore = defaultCheckpointStore,
): string {
  const ref = `ckpt-${run.runId}-step${stepIndex}-${randomUUID().slice(0, 8)}`;
  store.save({
    ref,
    runId: run.runId,
    agentId: run.context.agentId,
    objective: run.objective,
    phase: run.currentPhase,
    stepIndex,
    snapshot: JSON.parse(JSON.stringify(run)) as CognitiveLoopRun,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });
  return ref;
}

export function loadCheckpoint(
  ref: string,
  store: CheckpointStore = defaultCheckpointStore,
): CheckpointEntry {
  const entry = store.load(ref);
  if (!entry) {
    throw new Error(`Checkpoint not found: ${ref}`);
  }
  return entry;
}
