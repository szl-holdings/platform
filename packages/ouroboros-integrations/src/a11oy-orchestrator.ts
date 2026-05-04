/**
 * A11oy Orchestrator -- the unified control plane.
 *
 * A11oy ingests everything. Every guard decision, every axis evaluation,
 * every receipt flows through here. The orchestrator:
 *
 *   1. Runs the Guardrails pipeline (14 rails + receipt sealing)
 *   2. Runs the Lambda Engine (9-axis evaluation + Adaptive Depth Routing)
 *   3. Updates the Convergence Pulse (real-time trust heartbeat)
 *   4. Reconciles agent handoffs (MMP-14 frustum)
 *   5. Routes to the right model tier based on Lambda
 *   6. Owns the SovereignEngine (all 38 SZL innovations)
 *   7. Exposes the innovation registry for all downstream products
 *
 * The guard() method runs BOTH the Guardrails pipeline (producing a
 * tamper-evident v2.0.0 receipt with Lambda-9 cryptographically signed)
 * AND the Lambda Engine (producing routing decisions). One canonical
 * trust artifact per decision.
 *
 * The sovereignChat() method runs a prompt through the full 38-innovation
 * pipeline AND the guard/pulse pipeline in a single call, returning the
 * combined result. This is the canonical entry point for all orchestrated
 * AI execution across every SZL product surface.
 */

import {
  computeLambdaEngine,
  scoreContentAxes,
  estimateBatchSavings,
  LAMBDA_ENGINE_VERSION,
  type LambdaEngineInput,
  type LambdaEngineReport,
  type AdaptiveDepthDecision,
} from "./lambda-engine.js";

import {
  ConvergencePulse,
  type PulseReading,
  type PulseSnapshot,
  type ConvergencePulseConfig,
} from "./convergence-pulse.js";

import {
  reconcileHandoff,
  auditFleetHandoffs,
  type AgentHandoffEvent,
  type A11oyHandoffVerdict,
  type A11oyFleetStats,
} from "./a11oy.js";

import {
  Guardrails,
  type GuardrailReceipt,
  type GuardCallInput,
} from "@workspace/ouroboros-guardrails";

import {
  SovereignEngine,
  INNOVATION_MANIFEST,
  type SovereignChatRequest,
  type SovereignChatResult,
} from "./sovereign-engine.js";

export interface A11oyGuardRequest {
  subject: string;
  prompt: string;
  response?: string;
  citations?: number;
  witnessCount?: number;
  priorLambda?: number;
  axisOverrides?: Partial<LambdaEngineInput>;
  metadata?: Record<string, string>;
}

export interface A11oyGuardResult {
  requestId: string;
  receipt: GuardrailReceipt;
  routing: AdaptiveDepthDecision;
  pulse: PulseReading;
  timestamp: string;
}

export interface A11oySovereignResult {
  requestId: string;
  sovereign: SovereignChatResult;
  receipt: GuardrailReceipt;
  routing: AdaptiveDepthDecision;
  pulse: PulseReading;
  innovationsActive: number;
  timestamp: string;
}

export interface A11oyInnovationRegistryEntry {
  id: number;
  name: string;
  vs: string;
  status: "operational";
}

export interface A11oyInnovationRegistry {
  count: number;
  version: string;
  innovations: A11oyInnovationRegistryEntry[];
  author: string;
}

export interface A11oyOrchestratorStats {
  totalGuards: number;
  totalHandoffs: number;
  totalSovereignCalls: number;
  lambdaHistory: number[];
  costSavings: {
    aggregateCostMultiplier: number;
    savingsPercent: number;
    frontierRouted: number;
    midRouted: number;
    workhouseRouted: number;
  };
  currentPulse: PulseReading;
  engineVersion: string;
  sovereignVersion: string;
  innovationsActive: number;
}

let requestCounter = 0;

function generateRequestId(): string {
  requestCounter++;
  const ts = Date.now().toString(36);
  const seq = requestCounter.toString(36).padStart(4, "0");
  return `a11oy_${ts}_${seq}`;
}

export class A11oyOrchestrator {
  private pulse: ConvergencePulse;
  private guardrails: Guardrails;
  private sovereign: SovereignEngine;
  private guardHistory: { receipt: GuardrailReceipt; routing: AdaptiveDepthDecision }[] = [];
  private handoffHistory: A11oyHandoffVerdict[] = [];
  private sovereignCallCount = 0;

  constructor(config?: {
    tenantId?: string;
    pulseConfig?: ConvergencePulseConfig;
    windowSize?: number;
  }) {
    this.pulse = new ConvergencePulse(config?.pulseConfig);
    this.sovereign = new SovereignEngine();
    this.guardrails = new Guardrails({
      tenantId: config?.tenantId ?? "a11oy-orchestrator",
      inputRails: [
        { name: "jailbreak_detection" },
        { name: "sensitive_data_detection" },
      ],
      outputRails: [
        { name: "pii_filter" },
        { name: "hallucination_check" },
      ],
      executionRails: [
        { name: "tool_authority_check" },
      ],
    });
  }

  getSovereign(): SovereignEngine {
    return this.sovereign;
  }

  innovationRegistry(): A11oyInnovationRegistry {
    return {
      count: INNOVATION_MANIFEST.length,
      version: "v21-38",
      innovations: INNOVATION_MANIFEST.map((i) => ({
        ...i,
        status: "operational" as const,
      })),
      author: "Stephen Lutar / SZL Consulting Ltd",
    };
  }

  async guard(request: A11oyGuardRequest): Promise<A11oyGuardResult> {
    const guardInput: GuardCallInput = {
      subject: request.subject,
      prompt: request.prompt,
      response: request.response,
      metadata: request.metadata,
    };
    const receipt = await this.guardrails.guard(guardInput);

    const contentAxes = scoreContentAxes({
      prompt: request.prompt,
      response: request.response,
      citations: request.citations,
      witnessCount: request.witnessCount,
      priorLambda: request.priorLambda,
    });

    const mergedAxes: LambdaEngineInput = {
      ...contentAxes,
      ...request.axisOverrides,
    };

    const lambdaReport = computeLambdaEngine(mergedAxes);

    const snapshot: PulseSnapshot = {
      lambda: receipt.lambda9?.invariant ?? lambdaReport.lambda.invariant,
      axisValues: receipt.lambda9?.axisValues ?? lambdaReport.lambda.axisValues,
      timestamp: Date.now(),
    };
    this.pulse.record(snapshot);

    this.guardHistory.push({ receipt, routing: lambdaReport.routing });

    return {
      requestId: generateRequestId(),
      receipt,
      routing: lambdaReport.routing,
      pulse: this.pulse.read(),
      timestamp: new Date().toISOString(),
    };
  }

  async sovereignChat(request: SovereignChatRequest): Promise<A11oySovereignResult> {
    this.sovereignCallCount++;
    const chatResult = this.sovereign.chat(request);

    const guardResult = await this.guard({
      subject: `sovereign-chat-${request.session ?? "default"}`,
      prompt: request.prompt,
      response: chatResult.content,
    });

    return {
      requestId: guardResult.requestId,
      sovereign: chatResult,
      receipt: guardResult.receipt,
      routing: guardResult.routing,
      pulse: guardResult.pulse,
      innovationsActive: INNOVATION_MANIFEST.length,
      timestamp: guardResult.timestamp,
    };
  }

  reconcile(event: AgentHandoffEvent): A11oyHandoffVerdict {
    const verdict = reconcileHandoff(event);
    this.handoffHistory.push(verdict);
    return verdict;
  }

  auditFleet(events: readonly AgentHandoffEvent[]): {
    verdicts: readonly A11oyHandoffVerdict[];
    stats: A11oyFleetStats;
  } {
    return auditFleetHandoffs(events);
  }

  currentPulse(): PulseReading {
    return this.pulse.read();
  }

  stats(): A11oyOrchestratorStats {
    const lambdaScores = this.guardHistory.map(
      (h) => h.receipt.lambda9?.invariant ?? h.receipt.lambda,
    );
    const savings = estimateBatchSavings(lambdaScores);

    return {
      totalGuards: this.guardHistory.length,
      totalHandoffs: this.handoffHistory.length,
      totalSovereignCalls: this.sovereignCallCount,
      lambdaHistory: lambdaScores,
      costSavings: {
        aggregateCostMultiplier: savings.aggregateCostMultiplier,
        savingsPercent: savings.savingsPercent,
        frontierRouted: savings.frontierRouted,
        midRouted: savings.midRouted,
        workhouseRouted: savings.workhouseRouted,
      },
      currentPulse: this.pulse.read(),
      engineVersion: LAMBDA_ENGINE_VERSION,
      sovereignVersion: "v21-38",
      innovationsActive: INNOVATION_MANIFEST.length,
    };
  }

  reset(): void {
    this.guardHistory = [];
    this.handoffHistory = [];
    this.sovereignCallCount = 0;
    this.guardrails.reset();
    this.pulse.reset();
  }
}
