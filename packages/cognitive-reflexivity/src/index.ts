/**
 * @workspace/cognitive-reflexivity
 *
 * Public surface:
 *
 *   - Types: CognitiveReflexivePayload, ReflexiveStrategy, CognitiveHealthScore.
 *   - Engine: CognitiveReflexivityEngine, defaultEngine.
 *   - Strategy registry: StrategyRegistry, defaultStrategyRegistry.
 *   - Router integration: applyStrategiesToDecision.
 *   - Health: computeHealthScore.
 *   - Consolidation: runConsolidationCycle, InMemoryConsolidationStore.
 */

export * from './types';
export {
  StrategyRegistry,
  defaultStrategyRegistry,
  type StrategyPersistenceAdapter,
} from './strategies';
export {
  CognitiveReflexivityEngine,
  defaultEngine,
  type ReflexivityEngineOptions,
  type ApprovalGate,
  type MonologueAdapter,
} from './engine';
export {
  applyStrategiesToDecision,
  type RouterDecisionInput,
  type RouterDecisionResult,
} from './router-integration';
export { computeHealthScore, type HealthInputs } from './health';
export {
  runConsolidationCycle,
  InMemoryConsolidationStore,
  PostgresConsolidationStore,
  DEFAULT_CONSOLIDATION,
  type MemoryEntryLike,
  type MemoryStoreLike,
  type MemoryFabricStoreLike,
  type ConsolidationConfig,
  type ConsolidationResult,
} from './consolidation';

export const COGNITIVE_REFLEXIVITY_VERSION = '1.0.0';
