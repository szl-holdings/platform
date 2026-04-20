import { randomUUID } from "crypto";
import { defaultMemoryStore, MEMORY_DOMAIN_UNKNOWN } from "@workspace/memory-fabric";
import type { MemoryStore } from "@workspace/memory-fabric";
import type { PhaseResult, WorldModelUpdate } from "../types.js";
import type { PerceiveOutput } from "./perceive.js";

export interface OrientPhaseOptions {
  memoryStore?: MemoryStore;
  traceId: string;
  agentId: string;
  objective: string;
  domain?: string;
}

export interface OrientOutput {
  orientationId: string;
  worldModelUpdate: WorldModelUpdate;
  noveltyScore: number;
  riskScore: number;
  uncertaintyScore: number;
  missingContextKeys: string[];
  detectedAnomalies: string[];
  entityCount: number;
  graphUpdateCount: number;
  summary: string;
}

export async function orientPhase(
  perceptOutput: PerceiveOutput,
  opts: OrientPhaseOptions,
): Promise<PhaseResult & { output: OrientOutput }> {
  const startedAt = Date.now();
  const memoryStore = opts.memoryStore ?? defaultMemoryStore;

  const orientationId = `orient-${randomUUID()}`;

  const entities: WorldModelUpdate["entities"] = [];
  const detectedAnomalies: string[] = [];
  const missingContextKeys: string[] = [];
  let noveltyScore = 0;
  let riskScore = 0;
  let uncertaintyScore = 0;

  for (const signal of perceptOutput.raw.rawSignals) {
    if (signal["entityId"]) {
      entities.push({
        entityId: signal["entityId"] as string,
        entityType: (signal["entityType"] ?? "unknown") as string,
        attributes: (signal as Record<string, unknown>),
        confidence: typeof signal["confidence"] === "number" ? signal["confidence"] : 0.8,
      });
    }

    if (signal["risk"] && typeof signal["risk"] === "number") {
      riskScore = Math.max(riskScore, signal["risk"] as number);
    }
    if (signal["anomaly"]) {
      detectedAnomalies.push(String(signal["anomaly"]));
    }
    if (signal["novelty"] && typeof signal["novelty"] === "number") {
      noveltyScore = Math.max(noveltyScore, signal["novelty"] as number);
    }
  }

  if (perceptOutput.signalCount === 0) {
    uncertaintyScore = 0.3;
    missingContextKeys.push("input_signals");
  }

  if (!opts.domain) {
    missingContextKeys.push("domain");
    uncertaintyScore = Math.min(1, uncertaintyScore + 0.2);
  }

  noveltyScore = Math.min(1, noveltyScore);
  riskScore = Math.min(1, riskScore);
  uncertaintyScore = Math.min(1, uncertaintyScore);

  const worldModelUpdate: WorldModelUpdate = {
    entities,
    noveltyScore,
    riskScore,
    uncertaintyScore,
    missingContextKeys,
    detectedAnomalies,
    graphUpdates: entities.length,
  };

  const orientMemId = `orient-wm-${randomUUID()}`;
  memoryStore.put({
    id: orientMemId,
    tier: "semantic",
    key: `world-model:${orientationId}`,
    value: worldModelUpdate,
    summary: `World model orientation from ${perceptOutput.signalCount} signals. Risk=${riskScore.toFixed(2)}, Novelty=${noveltyScore.toFixed(2)}.`,
    provenance: {
      source: "cognitive-runtime:orient",
      sourceId: opts.traceId,
      author: opts.agentId,
      method: "agent",
      createdAt: new Date().toISOString(),
    },
    freshness: { lastUpdatedAt: new Date().toISOString(), isStale: false },
    confidence: 1 - uncertaintyScore,
    retention: { policy: "workflow-scoped", pinned: false },
    sensitivity: "internal",
    linkedEntities: entities.map((e) => e.entityId),
    linkedTraces: [opts.traceId],
    linkedActions: [],
    tags: ["world-model", "orientation", opts.domain ?? "unknown"].filter(Boolean),
    domain: opts.domain ?? MEMORY_DOMAIN_UNKNOWN,
    metadata: { orientationId, objective: opts.objective },
  });

  const summary =
    `Oriented on ${entities.length} entit${entities.length === 1 ? "y" : "ies"}. ` +
    `Risk=${riskScore.toFixed(2)}, Novelty=${noveltyScore.toFixed(2)}, ` +
    `Uncertainty=${uncertaintyScore.toFixed(2)}. ` +
    (detectedAnomalies.length > 0 ? `Anomalies: ${detectedAnomalies.join(", ")}. ` : "") +
    (missingContextKeys.length > 0 ? `Missing context: ${missingContextKeys.join(", ")}.` : "");

  const output: OrientOutput = {
    orientationId,
    worldModelUpdate,
    noveltyScore,
    riskScore,
    uncertaintyScore,
    missingContextKeys,
    detectedAnomalies,
    entityCount: entities.length,
    graphUpdateCount: entities.length,
    summary,
  };

  const completedAt = Date.now();
  return {
    phase: "orient",
    status: "ok",
    startedAt,
    completedAt,
    durationMs: completedAt - startedAt,
    output,
    retryCount: 0,
    metadata: { orientationId, entityCount: entities.length },
  };
}
