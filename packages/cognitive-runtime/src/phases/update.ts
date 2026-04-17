import { randomUUID } from "crypto";
import { defaultSelfModelStore, updateAfterRun } from "@workspace/self-model";
import { defaultMemoryStore } from "@workspace/memory-fabric";
import type { SelfModelStore } from "@workspace/self-model";
import type { MemoryStore, MemoryEntry } from "@workspace/memory-fabric";
import type { PhaseResult } from "../types.js";
import type { ReflectPhaseOutput } from "./reflect.js";
import type { ExecutePhaseOutput } from "./execute.js";
import type { VerifyPhaseOutput } from "./verify.js";

export interface UpdatePhaseOptions {
  agentId: string;
  runId: string;
  traceId: string;
  domain?: string;
  selfModelStore?: SelfModelStore;
  memoryStore?: MemoryStore;
  durationMs: number;
  objective: string;
}

export interface UpdateSelfModelPhaseOutput {
  selfModelUpdated: boolean;
  selfModelVersion?: number;
  confidenceAfter?: number;
  driftScore?: number;
  helpRequested?: boolean;
  summary: string;
}

export interface UpdateMemoryPhaseOutput {
  memoryIdsWritten: string[];
  episodicId: string;
  lessonId?: string;
  summary: string;
}

// ─── Phase 7: UPDATE SELF MODEL ──────────────────────────────────────────────
export async function updateSelfModelPhase(
  executeOutput: ExecutePhaseOutput,
  verifyOutput: VerifyPhaseOutput | undefined,
  reflectOutput: ReflectPhaseOutput | undefined,
  opts: UpdatePhaseOptions,
): Promise<PhaseResult & { output: UpdateSelfModelPhaseOutput }> {
  const startedAt = Date.now();
  const selfModelStore = opts.selfModelStore ?? defaultSelfModelStore;

  const overallSuccess =
    executeOutput.failedSteps === 0 &&
    executeOutput.blockedSteps === 0 &&
    (verifyOutput?.passed ?? true);

  const status: "success" | "partial" | "failure" =
    overallSuccess
      ? "success"
      : executeOutput.completedSteps > 0
        ? "partial"
        : "failure";

  let selfModelUpdated = false;
  let selfModelVersion: number | undefined;
  let confidenceAfter: number | undefined;
  let driftScore: number | undefined;
  let helpRequested = false;

  try {
    const result = updateAfterRun(
      opts.agentId,
      {
        runId: opts.runId,
        agentId: opts.agentId,
        domain: opts.domain,
        status,
        summary:
          `Run ${opts.runId}: ${executeOutput.completedSteps} steps completed, ` +
          `${executeOutput.failedSteps} failed. ` +
          (reflectOutput ? `Lesson: ${reflectOutput.lesson.slice(0, 80)}` : ""),
        durationMs: opts.durationMs,
        errorCode:
          status === "failure"
            ? (executeOutput.stepResults.find((r) => r.status === "failed")?.error ?? undefined)
            : undefined,
      },
      selfModelStore,
    );
    selfModelUpdated = result.updated;
    selfModelVersion = result.newVersion;
    confidenceAfter = result.confidenceAfter;
    driftScore = result.driftScore;
    helpRequested = result.helpRequested !== null;
  } catch {
    selfModelUpdated = false;
  }

  const output: UpdateSelfModelPhaseOutput = {
    selfModelUpdated,
    selfModelVersion,
    confidenceAfter,
    driftScore,
    helpRequested,
    summary:
      `Self-model ${selfModelUpdated ? `updated to v${selfModelVersion}` : "not found/updated"}. ` +
      `Confidence=${confidenceAfter?.toFixed(3) ?? "N/A"}, Drift=${driftScore?.toFixed(3) ?? "N/A"}.` +
      (helpRequested ? " Help request triggered." : ""),
  };

  const completedAt = Date.now();
  return {
    phase: "update_self_model",
    status: "ok",
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    output,
    retryCount: 0,
    metadata: { selfModelUpdated, selfModelVersion },
  };
}

// ─── Phase 8: UPDATE MEMORY ──────────────────────────────────────────────────
export async function updateMemoryPhase(
  executeOutput: ExecutePhaseOutput,
  verifyOutput: VerifyPhaseOutput | undefined,
  reflectOutput: ReflectPhaseOutput | undefined,
  opts: UpdatePhaseOptions,
): Promise<PhaseResult & { output: UpdateMemoryPhaseOutput }> {
  const startedAt = Date.now();
  const memoryStore = opts.memoryStore ?? defaultMemoryStore;

  const overallSuccess =
    executeOutput.failedSteps === 0 &&
    executeOutput.blockedSteps === 0 &&
    (verifyOutput?.passed ?? true);

  const status: "success" | "partial" | "failure" =
    overallSuccess
      ? "success"
      : executeOutput.completedSteps > 0
        ? "partial"
        : "failure";

  const memoryIdsWritten: string[] = [];

  // Episodic entry — records this run for temporal memory
  const episodicId = `episodic-run-${opts.runId}-${randomUUID()}`;
  const episodicEntry: MemoryEntry = {
    id: episodicId,
    tier: "episodic",
    key: `run:${opts.runId}`,
    value: {
      runId: opts.runId,
      objective: opts.objective,
      domain: opts.domain,
      status,
      completedSteps: executeOutput.completedSteps,
      failedSteps: executeOutput.failedSteps,
      verifyPassed: verifyOutput?.passed,
      qualityScore: reflectOutput?.qualityScore,
      lesson: reflectOutput?.lesson,
      durationMs: opts.durationMs,
    },
    summary: `Cognitive run ${opts.runId} (${status}): "${opts.objective.slice(0, 80)}"`,
    provenance: {
      source: "cognitive-runtime:update_memory",
      sourceId: opts.traceId,
      author: opts.agentId,
      method: "agent",
      createdAt: new Date().toISOString(),
    },
    freshness: { lastUpdatedAt: new Date().toISOString(), isStale: false },
    confidence: overallSuccess ? 1.0 : 0.6,
    retention: { policy: "persistent", pinned: false },
    sensitivity: "internal",
    linkedEntities: [],
    linkedTraces: [opts.traceId],
    linkedActions: [],
    tags: ["cognitive-run", status, opts.domain ?? "unknown"].filter(Boolean),
    metadata: { runId: opts.runId },
  };
  memoryStore.put(episodicEntry);
  memoryIdsWritten.push(episodicId);

  // Semantic lesson entry — extracted learning for future reference
  let lessonId: string | undefined;
  if (reflectOutput && reflectOutput.lesson) {
    lessonId = `semantic-lesson-${opts.runId}-${randomUUID()}`;
    const lessonEntry: MemoryEntry = {
      id: lessonId,
      tier: "semantic",
      key: `lesson:${opts.traceId}`,
      value: {
        lesson: reflectOutput.lesson,
        qualityScore: reflectOutput.qualityScore,
        failureMode: reflectOutput.failureMode,
        whatWorked: reflectOutput.whatWorked,
        whatFailed: reflectOutput.whatFailed,
        whatToTryNext: reflectOutput.whatToTryNext,
        domain: opts.domain,
      },
      summary: `Learned lesson from run ${opts.runId}: ${reflectOutput.lesson.slice(0, 100)}`,
      provenance: {
        source: "cognitive-runtime:update_memory",
        sourceId: opts.traceId,
        author: opts.agentId,
        method: "agent",
        createdAt: new Date().toISOString(),
      },
      freshness: { lastUpdatedAt: new Date().toISOString(), isStale: false },
      confidence: reflectOutput.qualityScore,
      retention: { policy: "persistent", pinned: false },
      sensitivity: "internal",
      linkedEntities: [],
      linkedTraces: [opts.traceId],
      linkedActions: [],
      tags: ["lesson", "reflection", opts.domain ?? "unknown", reflectOutput.failureMode].filter(Boolean),
      metadata: { reflectionId: reflectOutput.reflectionId, runId: opts.runId },
    };
    memoryStore.put(lessonEntry);
    memoryIdsWritten.push(lessonId);
  }

  const output: UpdateMemoryPhaseOutput = {
    memoryIdsWritten,
    episodicId,
    lessonId,
    summary:
      `Wrote ${memoryIdsWritten.length} memory entries: 1 episodic run record` +
      (lessonId ? `, 1 semantic lesson` : "") + `.`,
  };

  const completedAt = Date.now();
  return {
    phase: "update_memory",
    status: "ok",
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    output,
    retryCount: 0,
    metadata: { memoryIdsWritten },
  };
}

// ─── Combined update for convenience (both phases sequentially) ──────────────
export interface UpdatePhaseOutput {
  selfModelUpdated: boolean;
  selfModelVersion?: number;
  confidenceAfter?: number;
  driftScore?: number;
  helpRequested?: boolean;
  memoryIdsWritten: string[];
  summary: string;
}

export async function updatePhase(
  executeOutput: ExecutePhaseOutput,
  verifyOutput: VerifyPhaseOutput | undefined,
  reflectOutput: ReflectPhaseOutput | undefined,
  opts: UpdatePhaseOptions,
): Promise<PhaseResult & { output: UpdatePhaseOutput }> {
  const selfModelResult = await updateSelfModelPhase(executeOutput, verifyOutput, reflectOutput, opts);
  const memoryResult = await updateMemoryPhase(executeOutput, verifyOutput, reflectOutput, opts);

  const output: UpdatePhaseOutput = {
    selfModelUpdated: selfModelResult.output.selfModelUpdated,
    selfModelVersion: selfModelResult.output.selfModelVersion,
    confidenceAfter: selfModelResult.output.confidenceAfter,
    driftScore: selfModelResult.output.driftScore,
    helpRequested: selfModelResult.output.helpRequested,
    memoryIdsWritten: memoryResult.output.memoryIdsWritten,
    summary: selfModelResult.output.summary + " " + memoryResult.output.summary,
  };

  const completedAt = Date.now();
  return {
    phase: "update_self_model",
    status: "ok",
    startedAt: selfModelResult.startedAt,
    completedAt,
    durationMs: completedAt - selfModelResult.startedAt,
    output,
    retryCount: 0,
    metadata: {
      selfModelUpdated: selfModelResult.output.selfModelUpdated,
      memoryIdsWritten: memoryResult.output.memoryIdsWritten,
    },
  };
}
