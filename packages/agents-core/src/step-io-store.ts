/**
 * Step I/O Store
 *
 * Captures full input/output of each agent step so that deterministic replay
 * can reconstruct exact prompt + tool I/O without re-executing the handler.
 *
 * Keys are "${runId}:${stepId}". Data is stored in process memory; for
 * production durability, wire the save/get callbacks to an external store
 * (e.g., Redis, Postgres) via setStepIOBackend().
 */

export interface CapturedStepIO {
  runId: string;
  stepId: string;
  stepName: string;
  toolId?: string;
  promptId?: string;
  input: unknown;
  output: unknown;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  retryCount: number;
  traceId?: string;
}

export interface StepIOBackend {
  save(key: string, record: CapturedStepIO): void;
  get(key: string): CapturedStepIO | undefined;
  listByRunId(runId: string): CapturedStepIO[];
  clear(): void;
}

class InMemoryStepIOBackend implements StepIOBackend {
  private readonly store = new Map<string, CapturedStepIO>();
  private readonly byRunId = new Map<string, CapturedStepIO[]>();

  save(key: string, record: CapturedStepIO): void {
    this.store.set(key, record);
    const existing = this.byRunId.get(record.runId) ?? [];
    const idx = existing.findIndex((r) => r.stepId === record.stepId);
    if (idx >= 0) {
      existing[idx] = record;
    } else {
      existing.push(record);
    }
    this.byRunId.set(record.runId, existing);
  }

  get(key: string): CapturedStepIO | undefined {
    return this.store.get(key);
  }

  listByRunId(runId: string): CapturedStepIO[] {
    return [...(this.byRunId.get(runId) ?? [])];
  }

  clear(): void {
    this.store.clear();
    this.byRunId.clear();
  }
}

let _backend: StepIOBackend = new InMemoryStepIOBackend();

export function setStepIOBackend(backend: StepIOBackend): void {
  _backend = backend;
}

export function saveStepIO(record: CapturedStepIO): void {
  const key = `${record.runId}:${record.stepId}`;
  _backend.save(key, record);
}

export function getStepIO(runId: string, stepId: string): CapturedStepIO | undefined {
  return _backend.get(`${runId}:${stepId}`);
}

export function listStepIOForRun(runId: string): CapturedStepIO[] {
  return _backend.listByRunId(runId);
}

export function clearStepIOStore(): void {
  _backend.clear();
}
