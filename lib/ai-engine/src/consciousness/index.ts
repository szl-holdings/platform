export {
  type AttentionFocus,
  type AttentionSchemaReport,
  type CognitiveWorkspaceState,
  cognitiveWorkspace,
  type GWTBroadcast,
  type WorkingMemoryItem,
} from './cognitive-workspace.js';
export {
  type ConsolidationReport,
  type DiscoveredPattern,
  type DreamConsolidationState,
  type DreamReplay,
  dreamConsolidation,
} from './dream-consolidation.js';
export {
  type AffectiveForecast,
  type EmotionalSignal,
  type EmotionalState,
  type EmotionalValence,
  type EmotionRegulationStrategy,
  type EmotionType,
  emotionalSignals,
  type SchererAppraisal,
} from './emotional-signals.js';
export {
  type CognitiveGoal,
  type CuriositySignal,
  type GoalEngineState,
  type GoalInterference,
  type GoalPriority,
  type GoalStatus,
  goalEngine,
  type IntrinsicMotivation,
  type MetaGoal,
} from './goal-engine.js';
export {
  type DialecticalTriple,
  type InnerMonologueState,
  innerMonologue,
  type MonologueEntry,
  type MonologueType,
  type PerspectiveSimulation,
  type SocraticChain,
  setLlmIntrospector,
} from './inner-monologue.js';
export {
  type CertaintyLevel,
  type CognitiveLoad,
  type HallucinationRisk,
  type MetacognitiveAssessment,
  type MetacognitiveState,
  type MultiHypothesisBranch,
  metacognitiveMonitor,
  type PredictiveUncertainty,
  type ReasoningQuality,
} from './metacognitive-monitor.js';
export {
  type FreeEnergyState,
  type Prediction,
  type PredictionError,
  type PredictionModel,
  type PredictiveProcessingState,
  predictiveProcessing,
} from './predictive-processing.js';
export {
  type AdversarialProbe,
  type AgentBeliefModel,
  type AgentCapabilityProfile,
  type CounterfactualScenario,
  type SystemIdentity,
  type SystemSelfModel,
  selfModelEngine,
} from './self-model.js';
export {
  type AgentTemporalEvolution,
  type EpisodicFutureSimulation,
  type ProspectiveMemoryItem,
  type TemporalAwarenessState,
  type TemporalDiscount,
  type TemporalMarker,
  type TemporalPattern,
  temporalAwareness,
} from './temporal-awareness.js';

import type { CognitiveWorkspaceState } from './cognitive-workspace.js';
import { cognitiveWorkspace } from './cognitive-workspace.js';
import type { DreamConsolidationState } from './dream-consolidation.js';
import { dreamConsolidation } from './dream-consolidation.js';
import type { EmotionalState } from './emotional-signals.js';
import { emotionalSignals } from './emotional-signals.js';
import type { GoalEngineState } from './goal-engine.js';
import { goalEngine } from './goal-engine.js';
import type { InnerMonologueState } from './inner-monologue.js';
import { innerMonologue } from './inner-monologue.js';
import type { MetacognitiveState } from './metacognitive-monitor.js';
import { metacognitiveMonitor } from './metacognitive-monitor.js';
import type { PredictiveProcessingState } from './predictive-processing.js';
import { predictiveProcessing } from './predictive-processing.js';
import type { SystemSelfModel } from './self-model.js';
import { selfModelEngine } from './self-model.js';
import type { TemporalAwarenessState } from './temporal-awareness.js';
import { temporalAwareness } from './temporal-awareness.js';

export interface ConsciousnessSnapshot {
  metacognition: MetacognitiveState;
  selfModel: SystemSelfModel;
  workspace: CognitiveWorkspaceState;
  monologue: InnerMonologueState;
  goals: GoalEngineState;
  emotions: EmotionalState;
  temporal: TemporalAwarenessState;
  predictive: PredictiveProcessingState;
  dream: DreamConsolidationState;
  timestamp: string;
}

export function captureConsciousnessSnapshot(): ConsciousnessSnapshot {
  return {
    metacognition: metacognitiveMonitor.getState(),
    selfModel: selfModelEngine.getSelfModel(),
    workspace: cognitiveWorkspace.getState(),
    monologue: innerMonologue.getState(),
    goals: goalEngine.getState(),
    emotions: emotionalSignals.getState(),
    temporal: temporalAwareness.getState(),
    predictive: predictiveProcessing.getState(),
    dream: dreamConsolidation.getState(),
    timestamp: new Date().toISOString(),
  };
}

export function buildConsciousnessContext(): string {
  const sections = [
    metacognitiveMonitor.buildMetacognitiveContext(),
    selfModelEngine.buildSelfModelContext(),
    cognitiveWorkspace.buildWorkspaceContext(),
    innerMonologue.buildMonologueContext(),
    goalEngine.buildGoalContext(),
    emotionalSignals.buildEmotionalContext(),
    temporalAwareness.buildTemporalContext(),
    predictiveProcessing.buildPredictiveContext(),
    dreamConsolidation.buildDreamContext(),
  ].filter((s) => s.length > 0);

  if (sections.length === 0) return '';
  return `# Consciousness Layer\n\n${sections.join('\n\n')}`;
}
