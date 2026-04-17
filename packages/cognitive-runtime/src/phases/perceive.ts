import { randomUUID } from "crypto";
import { defaultMemoryStore } from "@workspace/memory-fabric";
import type { MemoryEntry, MemoryStore } from "@workspace/memory-fabric";
import type { PerceiveInput, PhaseResult } from "../types.js";

export interface PerceivePhaseOptions {
  memoryStore?: MemoryStore;
  traceId: string;
  agentId: string;
  sessionId?: string;
  scopeId?: string;
}

export interface PerceiveOutput {
  perceptionId: string;
  signalCount: number;
  storedMemoryIds: string[];
  summary: string;
  detectedEventTypes: string[];
  priorityLevel: PerceiveInput["priority"];
  raw: PerceiveInput;
}

export async function perceivePhase(
  input: PerceiveInput,
  opts: PerceivePhaseOptions,
): Promise<PhaseResult & { output: PerceiveOutput }> {
  const startedAt = Date.now();
  const memoryStore = opts.memoryStore ?? defaultMemoryStore;

  const perceptionId = `percept-${randomUUID()}`;
  const storedMemoryIds: string[] = [];
  const detectedEventTypes: string[] = [];

  for (const signal of input.rawSignals) {
    const eventType = (signal["type"] ?? signal["eventType"] ?? "unknown") as string;
    if (!detectedEventTypes.includes(eventType)) {
      detectedEventTypes.push(eventType);
    }

    const memId = `percept-signal-${randomUUID()}`;
    const entry: MemoryEntry = {
      id: memId,
      tier: "working",
      key: `perception:${perceptionId}:${memId}`,
      value: signal,
      summary: `Signal of type '${eventType}' perceived at ${new Date().toISOString()}`,
      provenance: {
        source: "cognitive-runtime:perceive",
        sourceId: opts.traceId,
        author: opts.agentId,
        method: "agent",
        createdAt: new Date().toISOString(),
      },
      freshness: {
        lastUpdatedAt: new Date().toISOString(),
        isStale: false,
      },
      confidence: 1,
      retention: { policy: "session-scoped", pinned: false },
      sensitivity: "internal",
      linkedEntities: [],
      linkedTraces: [opts.traceId],
      linkedActions: [],
      tags: ["perception", eventType, input.sourceDomain ?? "unknown"].filter(Boolean),
      scopeId: opts.scopeId,
      metadata: { perceptionId, agentId: opts.agentId },
    };
    memoryStore.put(entry);
    storedMemoryIds.push(memId);
  }

  const summary =
    input.rawSignals.length === 0
      ? "No signals perceived — clean slate for objective."
      : `Perceived ${input.rawSignals.length} signal(s) across ${detectedEventTypes.length} event type(s): ${detectedEventTypes.join(", ")}.`;

  const output: PerceiveOutput = {
    perceptionId,
    signalCount: input.rawSignals.length,
    storedMemoryIds,
    summary,
    detectedEventTypes,
    priorityLevel: input.priority,
    raw: input,
  };

  const completedAt = Date.now();
  return {
    phase: "perceive",
    status: "ok",
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    output,
    retryCount: 0,
    metadata: { perceptionId, signalCount: input.rawSignals.length },
  };
}
