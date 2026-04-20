import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { WorkflowCheckpoint } from './types.js';

export interface CheckpointStore {
  save(checkpoint: WorkflowCheckpoint): void;
  load(workflowId: string): WorkflowCheckpoint | undefined;
  delete(workflowId: string): boolean;
  list(): WorkflowCheckpoint[];
}

export class InMemoryCheckpointStore implements CheckpointStore {
  private readonly store = new Map<string, WorkflowCheckpoint>();

  save(checkpoint: WorkflowCheckpoint): void {
    this.store.set(checkpoint.workflowId, { ...checkpoint });
  }

  load(workflowId: string): WorkflowCheckpoint | undefined {
    const cp = this.store.get(workflowId);
    return cp ? { ...cp } : undefined;
  }

  delete(workflowId: string): boolean {
    return this.store.delete(workflowId);
  }

  list(): WorkflowCheckpoint[] {
    return Array.from(this.store.values()).map((cp) => ({ ...cp }));
  }
}

export class FileCheckpointStore implements CheckpointStore {
  private readonly filePath: string;
  private data: Map<string, WorkflowCheckpoint>;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): Map<string, WorkflowCheckpoint> {
    try {
      if (!existsSync(this.filePath)) return new Map();
      const raw = readFileSync(this.filePath, 'utf8');
      const entries = JSON.parse(raw) as Array<[string, WorkflowCheckpoint]>;
      return new Map(entries);
    } catch {
      return new Map();
    }
  }

  private flush(): void {
    try {
      const dir = dirname(this.filePath);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        this.filePath,
        JSON.stringify(Array.from(this.data.entries()), null, 2),
        'utf8',
      );
    } catch {
      // best-effort — do not throw
    }
  }

  save(checkpoint: WorkflowCheckpoint): void {
    this.data.set(checkpoint.workflowId, { ...checkpoint });
    this.flush();
  }

  load(workflowId: string): WorkflowCheckpoint | undefined {
    const cp = this.data.get(workflowId);
    return cp ? { ...cp } : undefined;
  }

  delete(workflowId: string): boolean {
    const result = this.data.delete(workflowId);
    if (result) this.flush();
    return result;
  }

  list(): WorkflowCheckpoint[] {
    return Array.from(this.data.values()).map((cp) => ({ ...cp }));
  }
}

export const defaultCheckpointStore: CheckpointStore = new InMemoryCheckpointStore();
