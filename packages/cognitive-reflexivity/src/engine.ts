/**
 * Cognitive Reflexivity Engine — orchestrator.
 *
 * Subscribes to the universal Signal Mesh for type='cognitive-reflexive'
 * signals. When a signal arrives whose intensity crosses a configurable
 * threshold, the engine:
 *
 *   1. Asks the Inner Monologue to dialectically reason about the
 *      observation (thesis ↔ antithesis ↔ synthesis).
 *   2. Optionally calls perspective-simulation for high-impact subtypes
 *      (router constraints, detection tuning).
 *   3. Constructs a ReflexiveStrategy proposal whose params depend on
 *      the subtype and synthesis confidence.
 *   4. Classifies the strategy into a Guardian tier.
 *   5. For 'advisory' tier — auto-approves it (audit trail captured).
 *      For higher tiers — emits an approval request via the gate hook
 *      passed in at bootstrap.
 *
 * The engine is intentionally side-effect-light at the package boundary:
 * monologue, signal bus, and the approval gate are all injected. The
 * api-server bootstraps the wiring.
 */

import type { Signal } from '@workspace/ontology/signal';
import { createSignal } from '@workspace/ontology/signal';
import { defaultSignalBus, type SignalBus } from '@szl-holdings/signal-mesh/bus';
import { randomUUID } from 'node:crypto';
import {
  type CognitiveReflexivePayload,
  CognitiveReflexivePayloadSchema,
  type ReflexiveStrategy,
  type StrategyClass,
  classifyTier,
} from './types';
import { defaultStrategyRegistry, type StrategyRegistry } from './strategies';

/** Pluggable hook invoked when a strategy needs human approval. */
export interface ApprovalGate {
  request(strategy: ReflexiveStrategy): Promise<void> | void;
}

/** Pluggable hook to talk to the Inner Monologue. */
export interface MonologueAdapter {
  dialecticalReason(observation: string, context?: string): Promise<{
    thesis: string;
    antithesis: string;
    synthesis: string;
    confidence: number;
    monologueId?: string;
  }>;
}

const noopApprovalGate: ApprovalGate = {
  request() {},
};

const stubMonologue: MonologueAdapter = {
  async dialecticalReason(observation: string) {
    return {
      thesis: `Default position: act on "${observation.slice(0, 80)}".`,
      antithesis: 'Counter-position: signal may be noise; defer until reinforced.',
      synthesis:
        'Synthesis: propose a low-confidence advisory adjustment, monitor for reinforcement.',
      confidence: 0.55,
    };
  },
};

export interface ReflexivityEngineOptions {
  bus?: SignalBus;
  registry?: StrategyRegistry;
  monologue?: MonologueAdapter;
  approvalGate?: ApprovalGate;
  /** Below this intensity, signals are absorbed silently. */
  triggerThreshold?: number;
  /** Below this intensity, dialectic is skipped (auto-advisory). */
  dialecticThreshold?: number;
}

export class CognitiveReflexivityEngine {
  private bus: SignalBus;
  private registry: StrategyRegistry;
  private monologue: MonologueAdapter;
  private approvalGate: ApprovalGate;
  private triggerThreshold: number;
  private dialecticThreshold: number;

  // metrics for health score
  private signalsObserved = 0;
  private signalsActedOn = 0;
  private dialecticInvocations = 0;
  private autoAppliedCount = 0;
  private approvalRequestedCount = 0;
  private startedAt = Date.now();

  private unsubscribe: (() => void) | null = null;

  constructor(opts: ReflexivityEngineOptions = {}) {
    this.bus = opts.bus ?? defaultSignalBus;
    this.registry = opts.registry ?? defaultStrategyRegistry;
    this.monologue = opts.monologue ?? stubMonologue;
    this.approvalGate = opts.approvalGate ?? noopApprovalGate;
    this.triggerThreshold = opts.triggerThreshold ?? 0.4;
    this.dialecticThreshold = opts.dialecticThreshold ?? 0.6;
  }

  start(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.bus.on('cognitive-reflexive', (sig) => {
      void this.handleSignal(sig).catch(() => {
        // swallow; signals must not crash the loop
      });
    });
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Public API: emit a cognitive-reflexive signal into the mesh.
   * Wraps the typed payload in the universal Signal envelope.
   */
  emit(payload: CognitiveReflexivePayload, opts?: {
    tenantId?: string;
    severity?: Signal['severity'];
    source?: Signal['source'];
  }): Signal {
    const normalized = CognitiveReflexivePayloadSchema.parse(payload);
    const sig = createSignal({
      source: opts?.source ?? 'system',
      type: 'cognitive-reflexive',
      domain: 'ai',
      occurredAt: new Date().toISOString(),
      freshness: 1,
      confidence: normalized.intensity,
      severity: opts?.severity ?? severityFromIntensity(normalized.intensity),
      entityRefs: [],
      tenantId: opts?.tenantId,
      rawPayload: { reflexive: normalized },
      normalizedPayload: { reflexive: normalized },
      tags: ['cognitive-reflexive', normalized.subtype],
      provenance: { sourceService: 'cognitive-reflexivity-engine' },
    });
    this.bus.publish(sig);
    return sig;
  }

  metrics() {
    const uptimeMs = Date.now() - this.startedAt;
    return {
      uptimeMs,
      signalsObserved: this.signalsObserved,
      signalsActedOn: this.signalsActedOn,
      dialecticInvocations: this.dialecticInvocations,
      autoAppliedCount: this.autoAppliedCount,
      approvalRequestedCount: this.approvalRequestedCount,
    };
  }

  // ------------- internals -------------

  private async handleSignal(sig: Signal): Promise<void> {
    this.signalsObserved++;
    const raw = (sig.normalizedPayload?.reflexive ?? sig.rawPayload?.reflexive) as
      | unknown
      | undefined;
    if (!raw) return;
    const parsed = CognitiveReflexivePayloadSchema.safeParse(raw);
    if (!parsed.success) return;
    const payload = parsed.data;

    if (payload.intensity < this.triggerThreshold) return;
    this.signalsActedOn++;

    // Skip dialectic for clearly low-impact signals — they become advisory
    // strategies directly.
    let dialectic: Awaited<ReturnType<MonologueAdapter['dialecticalReason']>> | null = null;
    if (payload.intensity >= this.dialecticThreshold) {
      this.dialecticInvocations++;
      dialectic = await this.monologue.dialecticalReason(
        payload.observation,
        payload.subtype,
      );
    }

    const klass = pickStrategyClass(payload.subtype, payload.affectedDimension);
    const confidence = dialectic?.confidence ?? Math.min(1, payload.intensity * 0.85);
    const params = paramsForStrategy(klass, payload, confidence);

    const strategy = this.registry.propose({
      strategyId: randomUUID(),
      class: klass,
      description:
        dialectic?.synthesis ??
        `Reflexive adjustment for ${payload.subtype}: ${payload.observation.slice(0, 120)}`,
      params,
      applicableContexts: payload.agentId
        ? [`agent:${payload.agentId}`, `subtype:${payload.subtype}`]
        : [`subtype:${payload.subtype}`],
      confidence,
      provenance: {
        originatingSignalIds: [sig.signalId],
        monologueThreadIds: dialectic?.monologueId ? [dialectic.monologueId] : [],
        dialecticalTrace: dialectic ?? undefined,
        proposedBy: 'cognitive-reflexivity-engine',
        proposedAt: new Date().toISOString(),
      },
    });

    if (strategy.tier === 'advisory') {
      this.registry.approve(strategy.strategyId, 'auto:advisory');
      this.autoAppliedCount++;
    } else {
      this.approvalRequestedCount++;
      await this.approvalGate.request(strategy);
    }
  }
}

// ------------- helpers -------------

function severityFromIntensity(i: number): Signal['severity'] {
  if (i >= 0.85) return 'critical';
  if (i >= 0.65) return 'high';
  if (i >= 0.4) return 'medium';
  if (i >= 0.2) return 'low';
  return 'info';
}

function pickStrategyClass(
  subtype: CognitiveReflexivePayload['subtype'],
  hint: CognitiveReflexivePayload['affectedDimension'],
): StrategyClass {
  switch (subtype) {
    case 'router.lane_drift':
    case 'router.cost_spike':
      return 'router.constraint';
    case 'router.confidence_floor_breach':
      return 'router.constraint';
    case 'router.retrieval_depth_recommendation':
      return 'router.retrieval-bias';
    case 'detection.fp_spike':
    case 'detection.coverage_gap':
    case 'detection.true_positive_confirmed':
      return 'detection.confidence-floor';
    case 'sync.failed':
    case 'sync.schema_drift':
      return 'sync.retry-policy';
    case 'sync.success':
      return 'router.advisory';
    case 'memory.working_full':
    case 'memory.episode_promoted':
    case 'memory.semantic_pattern_detected':
      return 'memory.consolidation-hint';
    case 'cognition.dialectic_disagreement':
    case 'cognition.strategy_promoted':
    case 'cognition.strategy_retired':
    case 'cognition.consolidation_cycle':
      return 'router.advisory';
    default:
      // Unknown subtype falls back to advisory — never auto-applies a constraint.
      return hint === 'lane' || hint === 'model' || hint === 'confidence-floor'
        ? 'router.constraint'
        : 'router.advisory';
  }
}

function paramsForStrategy(
  klass: StrategyClass,
  payload: CognitiveReflexivePayload,
  confidence: number,
): Record<string, unknown> {
  switch (klass) {
    case 'router.constraint':
      return {
        suggestedLane: payload.data.suggestedLane ?? null,
        suggestedModel: payload.data.suggestedModel ?? null,
        minConfidence: payload.data.minConfidence ?? Math.min(0.95, 0.5 + confidence * 0.4),
      };
    case 'router.retrieval-bias':
      return {
        depthDelta: payload.data.depthDelta ?? (confidence > 0.7 ? 1 : 0),
      };
    case 'detection.confidence-floor':
      return {
        ruleId: payload.data.ruleId ?? null,
        floorDelta: payload.data.floorDelta ?? (confidence > 0.7 ? 0.05 : 0.02),
      };
    case 'sync.retry-policy':
      return {
        maxRetries: payload.data.maxRetries ?? 3,
        backoffMs: payload.data.backoffMs ?? 5_000,
      };
    case 'memory.consolidation-hint':
      return {
        targetTier: payload.data.targetTier ?? 'episodic',
        keysToConsolidate: payload.data.keysToConsolidate ?? [],
      };
    case 'router.advisory':
    default:
      return { note: payload.observation };
  }
}

// Re-export for convenience
export { classifyTier };

export const defaultEngine = new CognitiveReflexivityEngine();
