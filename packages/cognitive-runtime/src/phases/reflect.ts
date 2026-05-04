import { type MemoryEntry, type MemoryStore, defaultMemoryStore } from '@workspace/memory-fabric';
import { type Reflection, defaultCandidateSkillLibrary, defaultReflectionStore, reflect } from '@workspace/reflection-engine';
import { type TraceStore, defaultTraceStore } from '@workspace/trace-graph';
import { randomUUID } from 'node:crypto';
import type { PhaseResult } from '../types.js';

/** A concise memory entry recalled from the orient phase. */
export interface RecalledMemoryHint {
  key: string;
  tier: string;
  summary: string;
  confidence: number;
  domain?: string;
}

export interface ReflectPhaseOptions {
  traceId: string;
  traceStore?: TraceStore;
  memoryStore?: MemoryStore;
  /**
   * Optional recalled context from the orient phase (via orient.recalledContext).
   * When provided, these entries are written into the memory store before
   * reflection runs so that the reflection engine can surface them as prior
   * context when scoring quality and generating lessons. This is the primary
   * mechanism by which memory fabric influences the recommend / reflect path.
   */
  recalledContext?: RecalledMemoryHint[];
}

export interface ReflectPhaseOutput {
  reflectionId: string;
  traceId: string;
  qualityScore: number;
  failureMode: Reflection['failureMode'];
  lesson: string;
  whatWorked: string[];
  whatFailed: string[];
  whatToTryNext: string[];
  candidateSkillDrafted: boolean;
  memoryIds: Reflection['memoryIds'];
  summary: string;
}

export async function reflectPhase(
  opts: ReflectPhaseOptions,
): Promise<PhaseResult & { output: ReflectPhaseOutput }> {
  const startedAt = Date.now();
  const traceStore = opts.traceStore ?? defaultTraceStore;
  const memoryStore = opts.memoryStore ?? defaultMemoryStore;

  // ── Seed recalled context into the memory store before reflecting ─────────
  // The orient phase retrieves memories from the fabric; we write any recalled
  // entries that aren't already present so the reflection engine can see prior
  // operator decisions when it scores quality and generates lessons. This is
  // the explicit hook that makes memory influence the reflect / recommend path.
  if (opts.recalledContext && opts.recalledContext.length > 0) {
    const existingKeys = new Set(memoryStore.list({ includeStale: true }).map((e) => e.key));
    for (const hint of opts.recalledContext) {
      const entryKey = `recalled:${hint.key}`;
      if (!existingKeys.has(entryKey)) {
        const now = new Date().toISOString();
        const VALID_TIERS = new Set(['working', 'session', 'episodic', 'semantic', 'workflow', 'entity', 'artifact', 'operator-feedback', 'executive', 'skill']);
        const entry: MemoryEntry = {
          id: randomUUID(),
          key: entryKey,
          value: hint.summary,
          tier: (VALID_TIERS.has(hint.tier) ? hint.tier : 'semantic') as MemoryEntry['tier'],
          confidence: hint.confidence,
          domain: hint.domain ?? 'recalled-context',
          tags: ['recalled-context', 'memory-fabric'],
          summary: hint.summary,
          metadata: {},
          provenance: { source: 'orient-phase-recall', method: 'derived', createdAt: now },
          freshness: { lastUpdatedAt: now, isStale: false },
          retention: { policy: 'persistent', pinned: false },
          sensitivity: 'internal',
          linkedEntities: [],
          linkedTraces: [],
          linkedActions: [],
        };
        memoryStore.put(entry);
      }
    }
  }

  let reflection: Reflection;
  try {
    reflection = await reflect(opts.traceId, {
      traceStore: traceStore as unknown as typeof defaultTraceStore,
      memoryStore: memoryStore as unknown as typeof defaultMemoryStore,
      reflectionStore: defaultReflectionStore,
      skillLibrary: defaultCandidateSkillLibrary,
    });
  } catch (err) {
    const reflectionId = `reflect-fallback-${randomUUID()}`;
    const fallbackOutput: ReflectPhaseOutput = {
      reflectionId,
      traceId: opts.traceId,
      qualityScore: 0,
      failureMode: 'unknown',
      lesson: `Reflection skipped: trace ${opts.traceId} not available in store. This is expected for in-memory traces.`,
      whatWorked: [],
      whatFailed: ['Trace not persisted to trace store'],
      whatToTryNext: ['Ensure trace is written to store before reflecting'],
      candidateSkillDrafted: false,
      memoryIds: {},
      summary: `Reflection skipped — trace not found in store (${err instanceof Error ? err.message : String(err)}).`,
    };
    const completedAt = Date.now();
    return {
      phase: 'reflect',
      status: 'skipped',
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
      output: fallbackOutput,
      retryCount: 0,
      metadata: { skipped: true, reason: 'trace_not_found' },
    };
  }

  const output: ReflectPhaseOutput = {
    reflectionId: reflection.reflectionId,
    traceId: opts.traceId,
    qualityScore: reflection.qualityScore,
    failureMode: reflection.failureMode,
    lesson: reflection.lesson,
    whatWorked: reflection.whatWorked,
    whatFailed: reflection.whatFailed,
    whatToTryNext: reflection.whatToTryNext,
    candidateSkillDrafted: reflection.candidateSkill !== undefined,
    memoryIds: reflection.memoryIds,
    summary:
      `Reflected on trace ${opts.traceId}. ` +
      `Quality=${reflection.qualityScore.toFixed(2)}, ` +
      `FailureMode=${reflection.failureMode}. ` +
      `Lesson: "${reflection.lesson.slice(0, 100)}${reflection.lesson.length > 100 ? '...' : ''}"`,
  };

  const completedAt = Date.now();
  return {
    phase: 'reflect',
    status: 'ok',
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    output,
    retryCount: 0,
    metadata: {
      reflectionId: reflection.reflectionId,
      qualityScore: reflection.qualityScore,
      failureMode: reflection.failureMode,
    },
  };
}
