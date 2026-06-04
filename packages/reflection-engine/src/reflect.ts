import { type MemoryEntry, defaultMemoryStore, MEMORY_DOMAIN_UNKNOWN } from '@workspace/memory-fabric';
import { defaultTraceStore } from '@workspace/trace-graph';
import { randomUUID } from 'node:crypto';
import { type CandidateSkillLibrary, defaultCandidateSkillLibrary } from './candidate-skill-library.js';
import { classifyFailureMode } from './classifier.js';
import { writeLessons } from './lesson-writer.js';
import { extractBestRoute, scoreTrace } from './scorer.js';
import { draftCandidateSkill, shouldDraftSkill } from './skill-drafter.js';
import { defaultReflectionStore } from './store.js';
import type { Reflection } from './types.js';

export interface ReflectOptions {
  traceStore?: typeof defaultTraceStore;
  memoryStore?: typeof defaultMemoryStore;
  reflectionStore?: typeof defaultReflectionStore;
  skillLibrary?: CandidateSkillLibrary;
  onSkillDrafted?: (skill: import('./types.js').CandidateSkill) => void;
  /**
   * Domain to tag the reflection's memory entries with so executive briefings
   * and other domain-scoped readers can find them. Defaults to
   * `MEMORY_DOMAIN_UNKNOWN` when callers don't thread a domain through.
   */
  domain?: string;
}

export class TraceNotFoundError extends Error {
  constructor(traceId: string) {
    super(`Trace not found: ${traceId}`);
    this.name = 'TraceNotFoundError';
  }
}

export async function reflect(traceId: string, options: ReflectOptions = {}): Promise<Reflection> {
  const traceStore = options.traceStore ?? defaultTraceStore;
  const memoryStore = options.memoryStore ?? defaultMemoryStore;
  const reflectionStore = options.reflectionStore ?? defaultReflectionStore;

  const existing = reflectionStore.getByTrace(traceId);
  if (existing) return existing;

  const trace = traceStore.get(traceId);
  if (!trace) {
    throw new TraceNotFoundError(traceId);
  }

  const score = scoreTrace(trace);
  const failureMode = classifyFailureMode(trace);
  const bestRoute = extractBestRoute(trace);
  const { whatWorked, whatFailed, whatWasMissing, whatToTryNext, lesson } = writeLessons(
    trace,
    score,
    failureMode,
    bestRoute,
  );

  const skillLibrary = options.skillLibrary ?? defaultCandidateSkillLibrary;

  let candidateSkill: Reflection['candidateSkill'];
  if (shouldDraftSkill(trace, score, failureMode)) {
    candidateSkill = draftCandidateSkill(trace, score);
    skillLibrary.registerDraft(candidateSkill);
    if (options.onSkillDrafted) {
      options.onSkillDrafted(candidateSkill);
    }
  }

  const now = new Date().toISOString();
  const memoryIds: Reflection['memoryIds'] = {};

  const episodicId = `reflection-episodic-${traceId}`;
  const episodicEntry: MemoryEntry = {
    id: episodicId,
    tier: 'episodic',
    key: `reflection:${traceId}`,
    value: {
      traceId,
      qualityScore: score.overall,
      failureMode,
      lesson,
      whatWorked,
      whatFailed,
      whatToTryNext,
    },
    provenance: {
      source: 'reflection-engine',
      sourceId: traceId,
      method: 'derived',
      createdAt: now,
    },
    freshness: {
      lastUpdatedAt: now,
      isStale: false,
    },
    confidence: score.overall,
    retention: { policy: 'persistent', pinned: false },
    sensitivity: 'internal',
    linkedEntities: [],
    linkedTraces: [traceId],
    linkedActions: [],
    tags: ['reflection', 'lesson', `failure:${failureMode}`],
    domain: options.domain ?? MEMORY_DOMAIN_UNKNOWN,
    metadata: { qualityScore: score.overall, failureMode },
  };
  memoryStore.put(episodicEntry);
  memoryIds.episodicId = episodicId;

  if (candidateSkill) {
    const skillMemoryId = `reflection-skill-${candidateSkill.skillId}`;
    const skillEntry: MemoryEntry = {
      id: skillMemoryId,
      tier: 'skill',
      key: `candidate-skill:${candidateSkill.skillId}`,
      value: candidateSkill,
      provenance: {
        source: 'reflection-engine',
        sourceId: traceId,
        method: 'derived',
        createdAt: now,
      },
      freshness: {
        lastUpdatedAt: now,
        isStale: false,
      },
      confidence: score.overall,
      retention: { policy: 'persistent', pinned: false },
      sensitivity: 'internal',
      linkedEntities: [],
      linkedTraces: [traceId],
      linkedActions: [],
      tags: ['candidate-skill', 'draft', candidateSkill.category],
      domain: options.domain ?? MEMORY_DOMAIN_UNKNOWN,
      metadata: { skillId: candidateSkill.skillId, derivedFromTraceId: traceId },
    };
    memoryStore.put(skillEntry);
    memoryIds.skillMemoryId = skillMemoryId;
  }

  const reflection: Reflection = {
    reflectionId: randomUUID(),
    traceId,
    createdAt: now,
    qualityScore: score.overall,
    failureMode,
    whatWorked,
    whatFailed,
    whatWasMissing,
    whatToTryNext,
    bestRoute,
    lesson,
    candidateSkill,
    memoryIds,
  };

  reflectionStore.put(reflection);
  return reflection;
}
