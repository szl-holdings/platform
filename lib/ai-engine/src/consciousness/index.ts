export {
  metacognitiveMonitor,
  type MetacognitiveAssessment,
  type MetacognitiveState,
  type CertaintyLevel,
  type ReasoningQuality,
  type CognitiveLoad,
} from "./metacognitive-monitor.js";

export {
  selfModelEngine,
  type AgentCapabilityProfile,
  type SystemSelfModel,
  type SystemIdentity,
} from "./self-model.js";

export {
  cognitiveWorkspace,
  type WorkingMemoryItem,
  type AttentionFocus,
  type CognitiveWorkspaceState,
} from "./cognitive-workspace.js";

export {
  innerMonologue,
  setLlmIntrospector,
  type MonologueEntry,
  type MonologueType,
  type InnerMonologueState,
} from "./inner-monologue.js";

export {
  goalEngine,
  type CognitiveGoal,
  type CuriositySignal,
  type GoalPriority,
  type GoalStatus,
  type GoalEngineState,
} from "./goal-engine.js";

export {
  emotionalSignals,
  type EmotionalSignal,
  type EmotionalValence,
  type EmotionalState,
  type EmotionType,
} from "./emotional-signals.js";

export {
  temporalAwareness,
  type TemporalMarker,
  type TemporalPattern,
  type TemporalAwarenessState,
} from "./temporal-awareness.js";

import { metacognitiveMonitor } from "./metacognitive-monitor.js";
import { selfModelEngine } from "./self-model.js";
import { cognitiveWorkspace } from "./cognitive-workspace.js";
import { innerMonologue } from "./inner-monologue.js";
import { goalEngine } from "./goal-engine.js";
import { emotionalSignals } from "./emotional-signals.js";
import { temporalAwareness } from "./temporal-awareness.js";
import type { MetacognitiveState } from "./metacognitive-monitor.js";
import type { SystemSelfModel } from "./self-model.js";
import type { CognitiveWorkspaceState } from "./cognitive-workspace.js";
import type { InnerMonologueState } from "./inner-monologue.js";
import type { GoalEngineState } from "./goal-engine.js";
import type { EmotionalState } from "./emotional-signals.js";
import type { TemporalAwarenessState } from "./temporal-awareness.js";

export interface ConsciousnessSnapshot {
  metacognition: MetacognitiveState;
  selfModel: SystemSelfModel;
  workspace: CognitiveWorkspaceState;
  monologue: InnerMonologueState;
  goals: GoalEngineState;
  emotions: EmotionalState;
  temporal: TemporalAwarenessState;
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
  ].filter(s => s.length > 0);

  if (sections.length === 0) return "";
  return `# Consciousness Layer\n\n${sections.join("\n\n")}`;
}
