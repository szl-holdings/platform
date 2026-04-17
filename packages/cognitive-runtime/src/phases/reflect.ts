import { randomUUID } from "crypto";
import { reflect } from "@workspace/reflection-engine";
import { defaultTraceStore } from "@workspace/trace-graph";
import { defaultMemoryStore } from "@workspace/memory-fabric";
import { defaultReflectionStore, defaultCandidateSkillLibrary } from "@workspace/reflection-engine";
import type { TraceStore } from "@workspace/trace-graph";
import type { MemoryStore } from "@workspace/memory-fabric";
import type { Reflection } from "@workspace/reflection-engine";
import type { PhaseResult } from "../types.js";

export interface ReflectPhaseOptions {
  traceId: string;
  traceStore?: TraceStore;
  memoryStore?: MemoryStore;
}

export interface ReflectPhaseOutput {
  reflectionId: string;
  traceId: string;
  qualityScore: number;
  failureMode: Reflection["failureMode"];
  lesson: string;
  whatWorked: string[];
  whatFailed: string[];
  whatToTryNext: string[];
  candidateSkillDrafted: boolean;
  memoryIds: Reflection["memoryIds"];
  summary: string;
}

export async function reflectPhase(
  opts: ReflectPhaseOptions,
): Promise<PhaseResult & { output: ReflectPhaseOutput }> {
  const startedAt = Date.now();
  const traceStore = opts.traceStore ?? defaultTraceStore;
  const memoryStore = opts.memoryStore ?? defaultMemoryStore;

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
      failureMode: "unknown",
      lesson: `Reflection skipped: trace ${opts.traceId} not available in store. This is expected for in-memory traces.`,
      whatWorked: [],
      whatFailed: ["Trace not persisted to trace store"],
      whatToTryNext: ["Ensure trace is written to store before reflecting"],
      candidateSkillDrafted: false,
      memoryIds: {},
      summary: `Reflection skipped — trace not found in store (${err instanceof Error ? err.message : String(err)}).`,
    };
    const completedAt = Date.now();
    return {
      phase: "reflect",
      status: "skipped",
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
      output: fallbackOutput,
      retryCount: 0,
      metadata: { skipped: true, reason: "trace_not_found" },
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
      `Lesson: "${reflection.lesson.slice(0, 100)}${reflection.lesson.length > 100 ? "..." : ""}"`,
  };

  const completedAt = Date.now();
  return {
    phase: "reflect",
    status: "ok",
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
