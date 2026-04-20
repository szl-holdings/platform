import type { InferInsertModel } from 'drizzle-orm';
import { desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { SkillRegistryBackend, SkillRunStoreBackend } from './registry.js';
import type { SkillCategory, SkillDefinition, SkillRun } from './types.js';

export interface SkillsTableLike extends PgTable {
  skillId: PgColumn;
  name: PgColumn;
  description: PgColumn;
  category: PgColumn;
  objective: PgColumn;
  inputFields: PgColumn;
  steps: PgColumn;
  toolsUsed: PgColumn;
  expectedOutputs: PgColumn;
  successCriteria: PgColumn;
  failureConditions: PgColumn;
  totalRuns: PgColumn;
  successfulRuns: PgColumn;
  failedRuns: PgColumn;
  successRate: PgColumn;
  avgLatencyMs: PgColumn;
  lastRunAt: PgColumn;
  lastFailureAt: PgColumn;
  lastFailureReason: PgColumn;
  isBuiltin: PgColumn;
  enabled: PgColumn;
  version: PgColumn;
  tags: PgColumn;
  createdAt: PgColumn;
  updatedAt: PgColumn;
}

export interface SkillRunsTableLike extends PgTable {
  runId: PgColumn;
  skillId: PgColumn;
  skillName: PgColumn;
  status: PgColumn;
  inputs: PgColumn;
  outputs: PgColumn;
  steps: PgColumn;
  error: PgColumn;
  startedAt: PgColumn;
  completedAt: PgColumn;
  latencyMs: PgColumn;
}

type DB = NodePgDatabase<Record<string, unknown>>;

function skillToRow(skill: SkillDefinition): InferInsertModel<SkillsTableLike> {
  return {
    skillId: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    objective: skill.objective,
    inputFields: skill.inputFields,
    steps: skill.steps,
    toolsUsed: skill.toolsUsed,
    expectedOutputs: skill.expectedOutputs,
    successCriteria: skill.successCriteria,
    failureConditions: skill.failureConditions,
    totalRuns: skill.performance.totalRuns,
    successfulRuns: skill.performance.successfulRuns,
    failedRuns: skill.performance.failedRuns,
    successRate: skill.performance.successRate,
    avgLatencyMs: skill.performance.avgLatencyMs,
    lastRunAt: skill.performance.lastRunAt ? new Date(skill.performance.lastRunAt) : null,
    lastFailureAt: skill.performance.lastFailureAt
      ? new Date(skill.performance.lastFailureAt)
      : null,
    lastFailureReason: skill.performance.lastFailureReason ?? null,
    isBuiltin: skill.isBuiltin,
    enabled: skill.enabled,
    version: skill.version,
    tags: skill.tags,
    createdAt: new Date(skill.createdAt),
    updatedAt: new Date(skill.updatedAt),
  } as InferInsertModel<SkillsTableLike>;
}

function rowToSkill(row: Record<string, unknown>): SkillDefinition {
  const now = new Date().toISOString();
  const toIso = (v: unknown): string | undefined => {
    if (!v) return undefined;
    return v instanceof Date ? v.toISOString() : (v as string);
  };
  return {
    id: row['skillId'] as string,
    name: row['name'] as string,
    description: row['description'] as string,
    category: row['category'] as SkillCategory,
    objective: row['objective'] as string,
    inputFields: (row['inputFields'] as string[]) ?? [],
    steps: (row['steps'] as SkillDefinition['steps']) ?? [],
    toolsUsed: (row['toolsUsed'] as string[]) ?? [],
    expectedOutputs: (row['expectedOutputs'] as string[]) ?? [],
    successCriteria: (row['successCriteria'] as SkillDefinition['successCriteria']) ?? [],
    failureConditions: (row['failureConditions'] as SkillDefinition['failureConditions']) ?? [],
    performance: {
      totalRuns: (row['totalRuns'] as number) ?? 0,
      successfulRuns: (row['successfulRuns'] as number) ?? 0,
      failedRuns: (row['failedRuns'] as number) ?? 0,
      successRate: (row['successRate'] as number) ?? 0,
      avgLatencyMs: (row['avgLatencyMs'] as number) ?? 0,
      lastRunAt: toIso(row['lastRunAt']),
      lastFailureAt: toIso(row['lastFailureAt']),
      lastFailureReason: (row['lastFailureReason'] as string | undefined) ?? undefined,
    },
    isBuiltin: (row['isBuiltin'] as boolean) ?? false,
    enabled: (row['enabled'] as boolean) ?? true,
    version: (row['version'] as string) ?? '1.0.0',
    tags: (row['tags'] as string[]) ?? [],
    createdAt: toIso(row['createdAt']) ?? now,
    updatedAt: toIso(row['updatedAt']) ?? now,
  };
}

function skillUpdateValues(patch: Partial<SkillDefinition>): Record<string, unknown> {
  const v: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) v['name'] = patch.name;
  if (patch.description !== undefined) v['description'] = patch.description;
  if (patch.objective !== undefined) v['objective'] = patch.objective;
  if (patch.enabled !== undefined) v['enabled'] = patch.enabled;
  if (patch.tags !== undefined) v['tags'] = patch.tags;
  if (patch.version !== undefined) v['version'] = patch.version;
  if (patch.steps !== undefined) v['steps'] = patch.steps;
  if (patch.toolsUsed !== undefined) v['toolsUsed'] = patch.toolsUsed;
  if (patch.expectedOutputs !== undefined) v['expectedOutputs'] = patch.expectedOutputs;
  if (patch.successCriteria !== undefined) v['successCriteria'] = patch.successCriteria;
  if (patch.failureConditions !== undefined) v['failureConditions'] = patch.failureConditions;
  if (patch.performance !== undefined) {
    const p = patch.performance;
    if (p.totalRuns !== undefined) v['totalRuns'] = p.totalRuns;
    if (p.successfulRuns !== undefined) v['successfulRuns'] = p.successfulRuns;
    if (p.failedRuns !== undefined) v['failedRuns'] = p.failedRuns;
    if (p.successRate !== undefined) v['successRate'] = p.successRate;
    if (p.avgLatencyMs !== undefined) v['avgLatencyMs'] = p.avgLatencyMs;
    if (p.lastRunAt !== undefined) v['lastRunAt'] = p.lastRunAt ? new Date(p.lastRunAt) : null;
    if (p.lastFailureAt !== undefined)
      v['lastFailureAt'] = p.lastFailureAt ? new Date(p.lastFailureAt) : null;
    if (p.lastFailureReason !== undefined) v['lastFailureReason'] = p.lastFailureReason ?? null;
  }
  return v;
}

export interface PostgresSkillRegistryOptions {
  db: DB;
  skillsTable: SkillsTableLike;
  logger?: { warn: (...args: unknown[]) => void };
}

export class PostgresSkillRegistry implements SkillRegistryBackend {
  private readonly db: DB;
  private readonly table: SkillsTableLike;

  constructor(opts: PostgresSkillRegistryOptions) {
    this.db = opts.db;
    this.table = opts.skillsTable;
  }

  async persistSkill(skill: SkillDefinition): Promise<void> {
    const row = skillToRow(skill);
    await this.db
      .insert(this.table)
      .values(row)
      .onConflictDoUpdate({ target: this.table.skillId, set: row });
  }

  async persistSkillUpdate(skillId: string, patch: Partial<SkillDefinition>): Promise<void> {
    const values = skillUpdateValues(patch);
    await this.db
      .update(this.table)
      .set(values as InferInsertModel<SkillsTableLike>)
      .where(eq(this.table.skillId, skillId));
  }

  async hydrate(): Promise<SkillDefinition[]> {
    const rows = await this.db.select().from(this.table);
    return (rows as Record<string, unknown>[]).map(rowToSkill);
  }

  async seedBuiltins(skills: SkillDefinition[]): Promise<number> {
    if (skills.length === 0) return 0;
    let seeded = 0;
    for (const skill of skills) {
      const row = skillToRow(skill);
      const result = await this.db.insert(this.table).values(row).onConflictDoNothing();
      if ((result as { rowCount?: number }).rowCount) seeded++;
    }
    return seeded;
  }
}

function runToRow(run: SkillRun): InferInsertModel<SkillRunsTableLike> {
  return {
    runId: run.runId,
    skillId: run.skillId,
    skillName: run.skillName,
    status: run.status,
    inputs: run.inputs,
    outputs: run.outputs ?? null,
    steps: run.steps,
    error: run.error ?? null,
    startedAt: new Date(run.startedAt),
    completedAt: run.completedAt ? new Date(run.completedAt) : null,
    latencyMs: run.latencyMs ?? null,
  } as InferInsertModel<SkillRunsTableLike>;
}

function rowToRun(row: Record<string, unknown>): SkillRun {
  const toTs = (v: unknown): number | undefined => {
    if (v === null || v === undefined) return undefined;
    return v instanceof Date ? v.getTime() : (v as number);
  };
  return {
    runId: row['runId'] as string,
    skillId: row['skillId'] as string,
    skillName: row['skillName'] as string,
    status: row['status'] as SkillRun['status'],
    inputs: (row['inputs'] as Record<string, unknown>) ?? {},
    outputs: (row['outputs'] as Record<string, unknown>) ?? undefined,
    steps: (row['steps'] as SkillRun['steps']) ?? [],
    error: (row['error'] as string | undefined) ?? undefined,
    startedAt: toTs(row['startedAt']) ?? Date.now(),
    completedAt: toTs(row['completedAt']),
    latencyMs: (row['latencyMs'] as number | undefined) ?? undefined,
  };
}

export interface PostgresSkillRunStoreOptions {
  db: DB;
  skillRunsTable: SkillRunsTableLike;
  hydrateLimit?: number;
}

export class PostgresSkillRunStore implements SkillRunStoreBackend {
  private readonly db: DB;
  private readonly table: SkillRunsTableLike;
  private readonly hydrateLimit: number;

  constructor(opts: PostgresSkillRunStoreOptions) {
    this.db = opts.db;
    this.table = opts.skillRunsTable;
    this.hydrateLimit = opts.hydrateLimit ?? 2000;
  }

  async persistRun(run: SkillRun): Promise<void> {
    const row = runToRow(run);
    await this.db
      .insert(this.table)
      .values(row)
      .onConflictDoUpdate({ target: this.table.runId, set: row });
  }

  async hydrate(): Promise<SkillRun[]> {
    const rows = await this.db
      .select()
      .from(this.table)
      .orderBy(desc(this.table.startedAt))
      .limit(this.hydrateLimit);
    return (rows as Record<string, unknown>[]).map(rowToRun);
  }
}
