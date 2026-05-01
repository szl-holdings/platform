/**
 * Cognitive Reflexivity Runtime — server-side singleton.
 *
 * Bootstraps the @workspace/cognitive-reflexivity engine and wires it into
 * the rest of the cognitive substrate:
 *
 *   - SignalBus    : reuses defaultSignalBus from @szl-holdings/signal-mesh.
 *   - Monologue    : adapts lib/ai-engine InnerMonologue.dialecticalReason
 *                    (which expects multi-agent responses) into our simpler
 *                    {observation, context} → DialecticalTriple shape.
 *   - ApprovalGate : creates a pending request in @workspace/approvals-inbox
 *                    so operators can approve from the existing inbox UI.
 *   - Recent ring  : keeps the last 100 cognitive-reflexive signals so the
 *                    /recent-signals route can show live activity without
 *                    requiring a separate persistence layer.
 *
 * All state is process-local. A future iteration can swap StrategyRegistry
 * persistence for Drizzle/PG via the StrategyPersistenceAdapter hook.
 */

import { defaultSignalBus } from '@szl-holdings/signal-mesh/bus';
import {
  CognitiveReflexivityEngine,
  defaultStrategyRegistry,
  computeHealthScore,
  runConsolidationCycle,
  InMemoryConsolidationStore,
  PostgresConsolidationStore,
  applyStrategiesToDecision,
  type CognitiveHealthScore,
  type MemoryStoreLike,
  type ReflexiveStrategy,
  type MonologueAdapter,
  type ApprovalGate,
} from '@workspace/cognitive-reflexivity';
import { defaultMemoryStore } from '@workspace/memory-fabric';
import type { Signal } from '@workspace/ontology/signal';
import { pool } from '@szl-holdings/db';
import { registerRouterStrategyHook } from '@szl-holdings/ai-engine';
import { buildCognitiveReflexivityAdapter } from './cognitive-reflexivity-persistence';
import { logger } from './logger';

interface ReflexivityRuntime {
  engine: CognitiveReflexivityEngine;
  registry: typeof defaultStrategyRegistry;
  /**
   * The store the consolidation cycle drives. In production this is a
   * {@link PostgresConsolidationStore} adapter on top of the
   * `defaultMemoryStore` that persistence-init wires to PostgresMemoryStore.
   * If memory-fabric isn't ready yet we fall back to the in-memory store
   * so engine bootstrap never blocks on the database.
   */
  consolidationStore: MemoryStoreLike;
  /** True when the consolidation store is the persistent (Postgres-backed) one. */
  consolidationPersistent: boolean;
  /** Cumulative consolidation cycle counters for the health score. */
  consolidationCycles: { ok: number; fail: number };
  recentSignals(): Signal[];
  computeHealth(): CognitiveHealthScore;
  shutdown(): void;
}

let _runtime: ReflexivityRuntime | null = null;

const RECENT_RING_SIZE = 100;
const CONSOLIDATION_INTERVAL_MS = 5 * 60_000; // 5 min

function buildMonologueAdapter(): MonologueAdapter {
  // Lazy-load to avoid pulling ai-engine into the module graph until first use.
  let innerRef: { innerMonologue: { dialecticalReason: (i: unknown) => unknown } } | null = null;
  return {
    async dialecticalReason(observation, context) {
      try {
        if (!innerRef) {
          const mod = (await import('@szl-holdings/ai-engine')) as unknown as {
            innerMonologue: { dialecticalReason: (i: unknown) => unknown };
          };
          innerRef = { innerMonologue: mod.innerMonologue };
        }
        const triple = innerRef.innerMonologue.dialecticalReason({
          topic: context ?? 'cognitive-reflexive observation',
          context: observation,
          agentResponses: [
            { agentId: 'self.proponent', response: observation, confidence: 80, domain: 'self' },
            {
              agentId: 'self.skeptic',
              response: `Counter-view: this could be noise — ${observation.slice(0, 120)}`,
              confidence: 55,
              domain: 'self',
            },
          ],
        }) as {
          tripleId?: string;
          thesis: string;
          antithesis: string;
          synthesis: string;
          confidence?: number;
        };
        return {
          thesis: triple.thesis,
          antithesis: triple.antithesis,
          synthesis: triple.synthesis,
          confidence:
            typeof triple.confidence === 'number'
              ? Math.max(0, Math.min(1, triple.confidence > 1 ? triple.confidence / 100 : triple.confidence))
              : 0.7,
          monologueId: triple.tripleId,
        };
      } catch {
        // If ai-engine is unavailable, fall back to a deterministic stub so
        // the engine never crashes the request path.
        return {
          thesis: `Position: ${observation.slice(0, 120)}`,
          antithesis: 'Counter-position: insufficient evidence — defer.',
          synthesis: 'Synthesis: emit advisory; revisit if reinforced.',
          confidence: 0.55,
        };
      }
    },
  };
}

function buildApprovalGate(): ApprovalGate {
  let inboxModP: Promise<typeof import('@workspace/approvals-inbox')> | null = null;
  return {
    async request(strategy: ReflexiveStrategy) {
      try {
        if (!inboxModP) inboxModP = import('@workspace/approvals-inbox');
        const inbox = await inboxModP;
        inbox.submitPendingApprovalRequest({
          runId: `cognitive-reflexive:${strategy.strategyId}`,
          stepId: 'apply-strategy',
          stepName: `Apply reflexive strategy ${strategy.class}`,
          action: `apply:${strategy.class}`,
          justification: strategy.description,
          projectedImpact: `Adjusts ${strategy.class} dimension; tier=${strategy.tier}; confidence=${strategy.confidence.toFixed(2)}`,
          projectedRisk:
            strategy.tier === 'dual-approved'
              ? 'High — requires dual approval; affects model routing or detection thresholds'
              : strategy.tier === 'operator-approved'
                ? 'Medium — bounded operator-approved change'
                : strategy.tier === 'supervised'
                  ? 'Low-medium — single human approval'
                  : 'Low — advisory tier, audit-only',
          requestedBy: 'cognitive-reflexivity-engine',
          domain: 'cognitive-reflexivity',
          surface: 'a11oy-reflexivity',
        });
      } catch {
        // Inbox is best-effort; the strategy still sits in the registry.
      }
    },
  };
}

export function getReflexivityRuntime(): ReflexivityRuntime {
  if (_runtime) return _runtime;

  // Wire DB-backed persistence so operator-approved strategies and
  // per-decision traces survive restarts. The adapter is best-effort —
  // failures degrade to in-memory only, never break engine startup.
  try {
    defaultStrategyRegistry.setPersistenceAdapter(
      buildCognitiveReflexivityAdapter(pool),
    );
    void defaultStrategyRegistry.hydrate?.().catch((err: unknown) => {
      logger.warn(
        { err: (err as Error).message },
        'cognitive-reflexivity registry hydrate failed',
      );
    });
  } catch (err) {
    logger.warn(
      { err: (err as Error).message },
      'cognitive-reflexivity persistence adapter wiring skipped',
    );
  }

  // Install the model-router strategy hook so reflexive strategies bias
  // routing decisions in production. The hook is wrapped in try/catch
  // inside the router; here we only translate the registry call.
  try {
    registerRouterStrategyHook((input) => {
      const r = applyStrategiesToDecision(
        {
          routeClass: input.routeClass,
          ...(input.agentId !== undefined ? { agentId: input.agentId } : {}),
          defaults: input.defaults,
        },
        defaultStrategyRegistry,
      );
      return {
        ...(r.lane !== undefined ? { lane: r.lane } : {}),
        ...(r.model !== undefined ? { model: r.model } : {}),
        ...(r.retrievalDepth !== undefined ? { retrievalDepth: r.retrievalDepth } : {}),
        ...(r.minConfidence !== undefined ? { minConfidence: r.minConfidence } : {}),
        appliedStrategyIds: r.appliedStrategyIds,
        influencedDimensions: r.influencedDimensions,
      };
    });
  } catch (err) {
    logger.warn(
      { err: (err as Error).message },
      'cognitive-reflexivity model-router hook registration failed',
    );
  }

  const recent: Signal[] = [];
  const recentUnsub = defaultSignalBus.on('cognitive-reflexive', (s) => {
    recent.push(s);
    if (recent.length > RECENT_RING_SIZE) recent.splice(0, recent.length - RECENT_RING_SIZE);
  });

  const engine = new CognitiveReflexivityEngine({
    bus: defaultSignalBus,
    registry: defaultStrategyRegistry,
    monologue: buildMonologueAdapter(),
    approvalGate: buildApprovalGate(),
  });
  engine.start();

  // ── Memory consolidation: persistent by default ──────────────────────
  // `defaultMemoryStore` is a MutableMemoryStore — persistence-init swaps
  // its backend to PostgresMemoryStore at boot. The PostgresConsolidationStore
  // adapter wraps it so the consolidation cycle drives Postgres rows
  // (working → episodic → semantic) directly, satisfying the durability
  // contract documented in #4571. We still keep an InMemory fallback path
  // so unit tests / cold boots before persistence-init runs do not crash.
  let consolidationStore: MemoryStoreLike;
  let consolidationPersistent: boolean;
  try {
    consolidationStore = new PostgresConsolidationStore(
      defaultMemoryStore as unknown as ConstructorParameters<
        typeof PostgresConsolidationStore
      >[0],
    );
    consolidationPersistent = true;
  } catch (err) {
    logger.warn(
      { err: (err as Error).message },
      'cognitive-reflexivity: PostgresConsolidationStore unavailable; falling back to in-memory store',
    );
    consolidationStore = new InMemoryConsolidationStore();
    consolidationPersistent = false;
  }

  const cycles = { ok: 0, fail: 0 };
  const consolidationTimer = setInterval(() => {
    void runConsolidationCycle(consolidationStore)
      .then(() => {
        cycles.ok++;
      })
      .catch((err: unknown) => {
        cycles.fail++;
        logger.warn(
          { err: (err as Error).message },
          'cognitive-reflexivity: consolidation cycle failed',
        );
      });
  }, CONSOLIDATION_INTERVAL_MS);
  if (typeof consolidationTimer.unref === 'function') consolidationTimer.unref();

  _runtime = {
    engine,
    registry: defaultStrategyRegistry,
    consolidationStore,
    consolidationPersistent,
    consolidationCycles: cycles,
    recentSignals: () => [...recent].reverse(),
    computeHealth: () => {
      const m = engine.metrics();
      return computeHealthScore(
        {
          signalsObserved: m.signalsObserved,
          signalsActedOn: m.signalsActedOn,
          dialecticInvocations: m.dialecticInvocations,
          consolidationCycles: { ok: cycles.ok, fail: cycles.fail },
        },
        defaultStrategyRegistry,
      );
    },
    shutdown() {
      try {
        engine.stop();
      } catch {}
      try {
        recentUnsub();
      } catch {}
      try {
        clearInterval(consolidationTimer);
      } catch {}
      _runtime = null;
    },
  };
  return _runtime;
}
