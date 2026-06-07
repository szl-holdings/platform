import { randomUUID } from 'node:crypto';
import {
  defaultSkillRegistry,
  defaultSkillRunStore,
  type SkillRegistry,
  type SkillRunStore,
} from './registry.js';
import type {
  SkillDefinition,
  SkillRegistryQuery,
  SkillRun,
  SkillRunStepRecord,
  StepHandlerFn,
} from './types.js';

export class SkillNotFoundError extends Error {
  constructor(skillId: string) {
    super(`Skill '${skillId}' not found`);
    this.name = 'SkillNotFoundError';
  }
}

export class SkillDisabledError extends Error {
  constructor(skillId: string) {
    super(`Skill '${skillId}' is disabled`);
    this.name = 'SkillDisabledError';
  }
}

export class SkillHandlerNotFoundError extends Error {
  constructor(handlerName: string) {
    super(`Step handler '${handlerName}' is not registered`);
    this.name = 'SkillHandlerNotFoundError';
  }
}

const registeredHandlers = new Map<string, StepHandlerFn>();

export function registerSkillStepHandler(name: string, fn: StepHandlerFn): void {
  registeredHandlers.set(name, fn);
}

function updatePerformanceStats(
  registry: SkillRegistry,
  skill: SkillDefinition,
  run: SkillRun,
): void {
  const now = new Date().toISOString();
  const succeeded = run.status === 'completed';
  const p = skill.performance;

  const totalRuns = p.totalRuns + 1;
  const successfulRuns = p.successfulRuns + (succeeded ? 1 : 0);
  const failedRuns = p.failedRuns + (succeeded ? 0 : 1);
  const successRate = totalRuns > 0 ? successfulRuns / totalRuns : 0;

  const latency = run.latencyMs ?? 0;
  const avgLatencyMs =
    p.totalRuns > 0 ? (p.avgLatencyMs * p.totalRuns + latency) / totalRuns : latency;

  registry.updateSkill(skill.id, {
    performance: {
      totalRuns,
      successfulRuns,
      failedRuns,
      successRate,
      avgLatencyMs,
      lastRunAt: now,
      lastFailureAt: succeeded ? p.lastFailureAt : now,
      lastFailureReason: succeeded ? p.lastFailureReason : (run.error ?? 'unknown error'),
    },
  });
}

export interface RunSkillOptions {
  registry?: SkillRegistry;
  runStore?: SkillRunStore;
}

export async function runSkill(
  skillId: string,
  inputs: Record<string, unknown> = {},
  opts: RunSkillOptions = {},
): Promise<SkillRun> {
  const registry = opts.registry ?? defaultSkillRegistry;
  const runStore = opts.runStore ?? defaultSkillRunStore;

  const skill = registry.getSkill(skillId);
  if (!skill) throw new SkillNotFoundError(skillId);
  if (!skill.enabled) throw new SkillDisabledError(skillId);

  const runId = randomUUID();
  const startedAt = Date.now();

  const run: SkillRun = {
    runId,
    skillId: skill.id,
    skillName: skill.name,
    status: 'running',
    inputs,
    steps: skill.steps.map((s) => ({
      stepId: s.id,
      stepName: s.name,
      status: 'pending',
      startedAt: 0,
    })),
    startedAt,
  };

  runStore.saveRun(run);

  const stepOutputs = new Map<string, Record<string, unknown>>();

  for (let i = 0; i < skill.steps.length; i++) {
    const stepDef = skill.steps[i]!;
    const stepRecord: SkillRunStepRecord = run.steps[i]!;

    stepRecord.status = 'running';
    stepRecord.startedAt = Date.now();
    stepRecord.inputs = stepDef.parameters;
    runStore.saveRun(run);

    const handler = registeredHandlers.get(stepDef.handler);

    try {
      if (!handler) {
        throw new SkillHandlerNotFoundError(stepDef.handler);
      }

      const outputs = await handler(stepDef.parameters, inputs, {
        runId,
        stepId: stepDef.id,
        skillId: skill.id,
      });

      stepRecord.status = 'completed';
      stepRecord.outputs = outputs;
      stepRecord.completedAt = Date.now();
      stepOutputs.set(stepDef.id, outputs);
      runStore.saveRun(run);
    } catch (err) {
      stepRecord.status = 'failed';
      stepRecord.error = err instanceof Error ? err.message : String(err);
      stepRecord.completedAt = Date.now();

      run.status = 'failed';
      run.error = `Step '${stepDef.name}' failed: ${stepRecord.error}`;
      run.completedAt = Date.now();
      run.latencyMs = run.completedAt - startedAt;
      runStore.saveRun(run);
      updatePerformanceStats(registry, skill, run);
      return run;
    }
  }

  const lastStepOutputs =
    stepOutputs.size > 0 ? stepOutputs.get(skill.steps[skill.steps.length - 1]?.id) ?? {} : {};

  run.status = 'completed';
  run.outputs = lastStepOutputs;
  run.completedAt = Date.now();
  run.latencyMs = run.completedAt - startedAt;
  runStore.saveRun(run);
  updatePerformanceStats(registry, skill, run);

  return run;
}

export function registerSkill(skill: SkillDefinition, registry?: SkillRegistry): void {
  (registry ?? defaultSkillRegistry).registerSkill(skill);
}

export function getSkill(skillId: string, registry?: SkillRegistry): SkillDefinition | undefined {
  return (registry ?? defaultSkillRegistry).getSkill(skillId);
}

export function listSkills(
  query?: SkillRegistryQuery,
  registry?: SkillRegistry,
): SkillDefinition[] {
  return (registry ?? defaultSkillRegistry).listSkills(query);
}
