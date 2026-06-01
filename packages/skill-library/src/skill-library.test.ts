import { describe, expect, it } from 'vitest';
import { InMemorySkillRegistry, InMemorySkillRunStore } from './registry.js';
import {
  getSkill,
  listSkills,
  registerSkill,
  registerSkillStepHandler,
  runSkill,
  SkillDisabledError,
  SkillNotFoundError,
} from './runner.js';
import { builtinSkills, seedBuiltinSkills } from './seeds.js';
import type { SkillDefinition, SkillRun } from './types.js';

function makeRegistry() {
  return new InMemorySkillRegistry();
}

function makeRunStore() {
  return new InMemorySkillRunStore();
}

function sampleSkill(overrides?: Partial<SkillDefinition>): SkillDefinition {
  const now = new Date().toISOString();
  return {
    id: 'test:skill:001',
    name: 'Test Skill',
    description: 'A test skill',
    category: 'analysis',
    objective: 'Run a test',
    inputFields: ['input1'],
    steps: [
      {
        id: 'step:001',
        name: 'Step One',
        description: 'Do something',
        handler: 'test:noop',
        parameters: { value: 42 },
        toolsUsed: ['noop-tool'],
      },
    ],
    toolsUsed: ['noop-tool'],
    expectedOutputs: ['output1'],
    successCriteria: [
      { criterion: 'runs_without_error', description: 'Executes without throwing.' },
    ],
    failureConditions: [
      {
        condition: 'handler_throws',
        description: 'Handler throws an unexpected error.',
        recoveryHint: 'Check handler registration.',
      },
    ],
    performance: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgLatencyMs: 0,
    },
    isBuiltin: false,
    enabled: true,
    version: '1.0.0',
    tags: ['test'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('InMemorySkillRegistry', () => {
  it('registers and retrieves a skill', () => {
    const registry = makeRegistry();
    const skill = sampleSkill();
    registry.registerSkill(skill);
    const found = registry.getSkill(skill.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe(skill.name);
  });

  it('returns undefined for an unknown skill', () => {
    const registry = makeRegistry();
    expect(registry.getSkill('does:not:exist')).toBeUndefined();
  });

  it('lists skills with category filter', () => {
    const registry = makeRegistry();
    registry.registerSkill(sampleSkill({ id: 'a', category: 'analysis' }));
    registry.registerSkill(sampleSkill({ id: 'b', category: 'research' }));
    const analysis = registry.listSkills({ category: 'analysis' });
    expect(analysis).toHaveLength(1);
    expect(analysis[0].id).toBe('a');
  });

  it('lists skills with enabled filter', () => {
    const registry = makeRegistry();
    registry.registerSkill(sampleSkill({ id: 'enabled', enabled: true }));
    registry.registerSkill(sampleSkill({ id: 'disabled', enabled: false }));
    expect(registry.listSkills({ enabled: true })).toHaveLength(1);
    expect(registry.listSkills({ enabled: false })).toHaveLength(1);
  });

  it('lists skills with isBuiltin filter', () => {
    const registry = makeRegistry();
    registry.registerSkill(sampleSkill({ id: 'custom', isBuiltin: false }));
    registry.registerSkill(sampleSkill({ id: 'builtin', isBuiltin: true }));
    expect(registry.listSkills({ isBuiltin: true })).toHaveLength(1);
  });

  it('lists skills with tag filter', () => {
    const registry = makeRegistry();
    registry.registerSkill(sampleSkill({ id: 'tagged', tags: ['foo', 'bar'] }));
    registry.registerSkill(sampleSkill({ id: 'other', tags: ['baz'] }));
    expect(registry.listSkills({ tag: 'foo' })).toHaveLength(1);
  });

  it('paginates results', () => {
    const registry = makeRegistry();
    for (let i = 0; i < 5; i++) {
      registry.registerSkill(sampleSkill({ id: `skill-${i}` }));
    }
    const page1 = registry.listSkills({ limit: 2, offset: 0 });
    const page2 = registry.listSkills({ limit: 2, offset: 2 });
    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);
    expect(page1[0].id).not.toBe(page2[0].id);
  });

  it('updates a skill', () => {
    const registry = makeRegistry();
    const skill = sampleSkill();
    registry.registerSkill(skill);
    registry.updateSkill(skill.id, { name: 'Updated Name' });
    expect(registry.getSkill(skill.id)?.name).toBe('Updated Name');
  });

  it('counts skills', () => {
    const registry = makeRegistry();
    registry.registerSkill(sampleSkill({ id: 'a' }));
    registry.registerSkill(sampleSkill({ id: 'b' }));
    expect(registry.count()).toBe(2);
  });
});

describe('InMemorySkillRunStore', () => {
  it('saves and retrieves a run', () => {
    const store = makeRunStore();
    const run = {
      runId: 'run-001',
      skillId: 'test:skill',
      skillName: 'Test',
      status: 'completed' as const,
      inputs: {},
      steps: [],
      startedAt: Date.now(),
      completedAt: Date.now(),
      latencyMs: 100,
    };
    store.saveRun(run);
    expect(store.getRun('run-001')).toBeDefined();
  });

  it('lists runs filtered by skillId', () => {
    const store = makeRunStore();
    store.saveRun({
      runId: 'r1',
      skillId: 'skill-a',
      skillName: 'A',
      status: 'completed',
      inputs: {},
      steps: [],
      startedAt: Date.now(),
    });
    store.saveRun({
      runId: 'r2',
      skillId: 'skill-b',
      skillName: 'B',
      status: 'completed',
      inputs: {},
      steps: [],
      startedAt: Date.now(),
    });
    expect(store.listRuns({ skillId: 'skill-a' })).toHaveLength(1);
  });

  it('counts runs by status', () => {
    const store = makeRunStore();
    store.saveRun({
      runId: 'r1',
      skillId: 's',
      skillName: 'S',
      status: 'completed',
      inputs: {},
      steps: [],
      startedAt: Date.now(),
    });
    store.saveRun({
      runId: 'r2',
      skillId: 's',
      skillName: 'S',
      status: 'failed',
      inputs: {},
      steps: [],
      startedAt: Date.now(),
    });
    expect(store.countRuns({ status: 'completed' })).toBe(1);
    expect(store.countRuns({ status: 'failed' })).toBe(1);
  });
});

describe('runSkill', () => {
  it('throws SkillNotFoundError for unknown skill', async () => {
    const registry = makeRegistry();
    const runStore = makeRunStore();
    await expect(runSkill('does:not:exist', {}, { registry, runStore })).rejects.toThrow(
      SkillNotFoundError,
    );
  });

  it('throws SkillDisabledError for disabled skill', async () => {
    const registry = makeRegistry();
    const runStore = makeRunStore();
    registry.registerSkill(sampleSkill({ id: 'disabled', enabled: false }));
    await expect(runSkill('disabled', {}, { registry, runStore })).rejects.toThrow(
      SkillDisabledError,
    );
  });

  it('fails a skill when no handler is registered for a step', async () => {
    const registry = makeRegistry();
    const runStore = makeRunStore();
    registry.registerSkill(sampleSkill());
    const run = await runSkill('test:skill:001', { input1: 'hello' }, { registry, runStore });
    expect(run.status).toBe('failed');
    expect(run.error).toContain('test:noop');
    expect(run.skillId).toBe('test:skill:001');
    expect(run.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('completes a skill with a registered handler', async () => {
    const registry = makeRegistry();
    const runStore = makeRunStore();
    registry.registerSkill(sampleSkill());
    registerSkillStepHandler('test:noop', async (params, inputs) => ({
      processed: true,
      value: params.value,
      input1: inputs.input1,
    }));
    const run = await runSkill('test:skill:001', { input1: 'world' }, { registry, runStore });
    expect(run.status).toBe('completed');
    expect(run.outputs?.processed).toBe(true);
  });

  it('marks run as failed when handler throws', async () => {
    const registry = makeRegistry();
    const runStore = makeRunStore();
    const skill = sampleSkill({
      id: 'failing-skill',
      steps: [
        {
          id: 'step:bad',
          name: 'Bad Step',
          description: 'Will throw',
          handler: 'test:throw',
          parameters: {},
          toolsUsed: [],
        },
      ],
    });
    registry.registerSkill(skill);
    registerSkillStepHandler('test:throw', async () => {
      throw new Error('intentional failure');
    });
    const run = await runSkill('failing-skill', {}, { registry, runStore });
    expect(run.status).toBe('failed');
    expect(run.error).toContain('intentional failure');
  });

  it('updates performance stats after a successful run', async () => {
    const registry = makeRegistry();
    const runStore = makeRunStore();
    registry.registerSkill(sampleSkill());
    registerSkillStepHandler('test:noop', async () => ({ done: true }));
    await runSkill('test:skill:001', {}, { registry, runStore });
    const updated = registry.getSkill('test:skill:001');
    expect(updated?.performance.totalRuns).toBe(1);
    expect(updated?.performance.successfulRuns).toBe(1);
    expect(updated?.performance.successRate).toBe(1);
    expect(updated?.performance.lastRunAt).toBeDefined();
  });

  it('updates performance stats after a failed run', async () => {
    const registry = makeRegistry();
    const runStore = makeRunStore();
    const skill = sampleSkill({
      id: 'fail-stats-skill',
      steps: [
        {
          id: 'step:bad',
          name: 'Bad Step',
          description: 'Throws',
          handler: 'test:throw',
          parameters: {},
          toolsUsed: [],
        },
      ],
    });
    registry.registerSkill(skill);
    registerSkillStepHandler('test:throw', async () => {
      throw new Error('boom');
    });
    await runSkill('fail-stats-skill', {}, { registry, runStore });
    const updated = registry.getSkill('fail-stats-skill');
    expect(updated?.performance.totalRuns).toBe(1);
    expect(updated?.performance.failedRuns).toBe(1);
    expect(updated?.performance.successRate).toBe(0);
    expect(updated?.performance.lastFailureAt).toBeDefined();
    expect(updated?.performance.lastFailureReason).toContain('boom');
  });

  it('accumulates stats over multiple runs', async () => {
    const registry = makeRegistry();
    const runStore = makeRunStore();
    registry.registerSkill(sampleSkill());
    registerSkillStepHandler('test:noop', async () => ({ done: true }));
    await runSkill('test:skill:001', {}, { registry, runStore });
    await runSkill('test:skill:001', {}, { registry, runStore });
    await runSkill('test:skill:001', {}, { registry, runStore });
    const updated = registry.getSkill('test:skill:001');
    expect(updated?.performance.totalRuns).toBe(3);
    expect(updated?.performance.successRate).toBe(1);
  });

  it('persists run record in run store', async () => {
    const registry = makeRegistry();
    const runStore = makeRunStore();
    registry.registerSkill(sampleSkill());
    registerSkillStepHandler('test:noop', async () => ({ done: true }));
    const run = await runSkill('test:skill:001', { x: 1 }, { registry, runStore });
    const found = runStore.getRun(run.runId);
    expect(found).toBeDefined();
    expect(found?.status).toBe('completed');
  });
});

describe('setBackend — write-through persistence', () => {
  it('forwards registerSkill to backend', async () => {
    const registry = makeRegistry();
    const persisted: SkillDefinition[] = [];
    registry.setBackend({
      persistSkill: async (s) => {
        persisted.push(s);
      },
      persistSkillUpdate: async () => {},
    });
    registry.registerSkill(sampleSkill());
    await new Promise((r) => setTimeout(r, 10));
    expect(persisted).toHaveLength(1);
    expect(persisted[0].id).toBe('test:skill:001');
  });

  it('forwards updateSkill to backend', async () => {
    const registry = makeRegistry();
    const updates: Array<{ skillId: string; patch: Partial<SkillDefinition> }> = [];
    registry.setBackend({
      persistSkill: async () => {},
      persistSkillUpdate: async (skillId, patch) => {
        updates.push({ skillId, patch });
      },
    });
    registry.registerSkill(sampleSkill());
    registry.updateSkill('test:skill:001', { name: 'New Name' });
    await new Promise((r) => setTimeout(r, 10));
    expect(updates).toHaveLength(1);
    expect(updates[0].skillId).toBe('test:skill:001');
  });

  it('forwards saveRun to backend', async () => {
    const store = makeRunStore();
    const persisted: SkillRun[] = [];
    store.setBackend({
      persistRun: async (r) => {
        persisted.push(r);
      },
    });
    store.saveRun({
      runId: 'r-backend',
      skillId: 's',
      skillName: 'S',
      status: 'completed',
      inputs: {},
      steps: [],
      startedAt: Date.now(),
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(persisted).toHaveLength(1);
    expect(persisted[0].runId).toBe('r-backend');
  });
});

describe('registerSkill / getSkill / listSkills (top-level helpers)', () => {
  it('works with custom registry passed explicitly', () => {
    const registry = makeRegistry();
    const skill = sampleSkill({ id: 'helper-test' });
    registerSkill(skill, registry);
    expect(getSkill('helper-test', registry)).toBeDefined();
    expect(listSkills({}, registry)).toHaveLength(1);
  });
});

describe('Built-in skills seed', () => {
  it('seeds one skill per category', () => {
    const registry = makeRegistry();
    seedBuiltinSkills(registry);
    const categories = [
      'graph-query',
      'research',
      'synthesis',
      'workflow',
      'reporting',
      'analysis',
      'remediation',
      'executive-brief',
    ] as const;
    for (const cat of categories) {
      const skills = registry.listSkills({ category: cat });
      expect(skills.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all builtin skills have valid step definitions', () => {
    for (const skill of builtinSkills) {
      expect(skill.steps.length).toBeGreaterThan(0);
      for (const step of skill.steps) {
        expect(step.id).toBeTruthy();
        expect(step.handler).toBeTruthy();
      }
    }
  });

  it('all builtin skills have success criteria and failure conditions', () => {
    for (const skill of builtinSkills) {
      expect(skill.successCriteria.length).toBeGreaterThan(0);
      expect(skill.failureConditions.length).toBeGreaterThan(0);
    }
  });

  it('all builtin skills are enabled', () => {
    for (const skill of builtinSkills) {
      expect(skill.enabled).toBe(true);
      expect(skill.isBuiltin).toBe(true);
    }
  });

  it('total seeded skills count matches categories', () => {
    expect(builtinSkills).toHaveLength(8);
  });
});
