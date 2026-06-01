import type { SkillDefinition, SkillRegistryQuery, SkillRun, SkillRunQuery } from './types.js';

export type { SkillRegistryQuery, SkillRunQuery };

export interface SkillRegistryBackend {
  persistSkill(skill: SkillDefinition): Promise<void>;
  persistSkillUpdate(skillId: string, patch: Partial<SkillDefinition>): Promise<void>;
}

export interface SkillRunStoreBackend {
  persistRun(run: SkillRun): Promise<void>;
}

export interface SkillRegistry {
  registerSkill(skill: SkillDefinition): void;
  getSkill(skillId: string): SkillDefinition | undefined;
  listSkills(query?: SkillRegistryQuery): SkillDefinition[];
  updateSkill(skillId: string, patch: Partial<SkillDefinition>): boolean;
  count(query?: Pick<SkillRegistryQuery, 'category' | 'enabled' | 'isBuiltin' | 'tag'>): number;
  setBackend(backend: SkillRegistryBackend): void;
}

export interface SkillRunStore {
  saveRun(run: SkillRun): void;
  getRun(runId: string): SkillRun | undefined;
  listRuns(query?: SkillRunQuery): SkillRun[];
  countRuns(query?: Pick<SkillRunQuery, 'skillId' | 'status'>): number;
  setBackend(backend: SkillRunStoreBackend): void;
}

let persistenceLogger: { warn: (...args: unknown[]) => void } = {
  warn: (..._args) => {},
};

export function setSkillLibraryLogger(logger: { warn: (...args: unknown[]) => void }): void {
  persistenceLogger = logger;
}

export class InMemorySkillRegistry implements SkillRegistry {
  private readonly skills = new Map<string, SkillDefinition>();
  private backend?: SkillRegistryBackend;

  setBackend(backend: SkillRegistryBackend): void {
    this.backend = backend;
  }

  registerSkill(skill: SkillDefinition): void {
    this.skills.set(skill.id, { ...skill });
    if (this.backend) {
      void this.backend.persistSkill(skill).catch((err) => {
        persistenceLogger.warn({ err }, '[skill-registry] Failed to persist skill registration');
      });
    }
  }

  getSkill(skillId: string): SkillDefinition | undefined {
    const s = this.skills.get(skillId);
    return s ? { ...s } : undefined;
  }

  listSkills(query?: SkillRegistryQuery): SkillDefinition[] {
    let results = Array.from(this.skills.values());

    if (query?.category !== undefined) {
      results = results.filter((s) => s.category === query.category);
    }
    if (query?.enabled !== undefined) {
      results = results.filter((s) => s.enabled === query.enabled);
    }
    if (query?.isBuiltin !== undefined) {
      results = results.filter((s) => s.isBuiltin === query.isBuiltin);
    }
    if (query?.tag !== undefined) {
      const tag = query.tag;
      results = results.filter((s) => s.tags.includes(tag));
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const offset = query?.offset ?? 0;
    const limit = query?.limit ?? 100;
    return results.slice(offset, offset + limit).map((s) => ({ ...s }));
  }

  updateSkill(skillId: string, patch: Partial<SkillDefinition>): boolean {
    const existing = this.skills.get(skillId);
    if (!existing) return false;
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    this.skills.set(skillId, updated);
    if (this.backend) {
      void this.backend.persistSkillUpdate(skillId, patch).catch((err) => {
        persistenceLogger.warn({ err }, '[skill-registry] Failed to persist skill update');
      });
    }
    return true;
  }

  count(query?: Pick<SkillRegistryQuery, 'category' | 'enabled' | 'isBuiltin' | 'tag'>): number {
    return this.listSkills({ ...query, limit: 100_000 }).length;
  }
}

export class InMemorySkillRunStore implements SkillRunStore {
  private readonly runs = new Map<string, SkillRun>();
  private backend?: SkillRunStoreBackend;

  setBackend(backend: SkillRunStoreBackend): void {
    this.backend = backend;
  }

  saveRun(run: SkillRun): void {
    this.runs.set(run.runId, { ...run });
    if (this.backend) {
      void this.backend.persistRun(run).catch((err) => {
        persistenceLogger.warn({ err }, '[skill-run-store] Failed to persist run');
      });
    }
  }

  getRun(runId: string): SkillRun | undefined {
    const r = this.runs.get(runId);
    return r ? { ...r } : undefined;
  }

  listRuns(query?: SkillRunQuery): SkillRun[] {
    let results = Array.from(this.runs.values());

    if (query?.skillId !== undefined) {
      results = results.filter((r) => r.skillId === query.skillId);
    }
    if (query?.status !== undefined) {
      results = results.filter((r) => r.status === query.status);
    }

    results.sort((a, b) => b.startedAt - a.startedAt);

    const offset = query?.offset ?? 0;
    const limit = query?.limit ?? 100;
    return results.slice(offset, offset + limit).map((r) => ({ ...r }));
  }

  countRuns(query?: Pick<SkillRunQuery, 'skillId' | 'status'>): number {
    return this.listRuns({ ...query, limit: 100_000 }).length;
  }
}

export const defaultSkillRegistry = new InMemorySkillRegistry();
export const defaultSkillRunStore = new InMemorySkillRunStore();
