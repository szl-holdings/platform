export type AutonomyLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface AutonomyDepthProfile {
  depth: AutonomyLevel;
  maxAgentCount: number;
  governanceStrictness: 'minimal' | 'standard' | 'elevated' | 'maximum';
  shadowCouncilEnabled: boolean;
  shadowCouncilThreshold: number;
  extendedThinkingEnabled: boolean;
  extendedThinkingBudgetTokens: number;
  extendedThinkingPasses: number;
  speculativeExecutionEnabled: boolean;
  useDistilledAgents: boolean;
  approvalTier: 'auto' | 'operator' | 'executive';
  multiHypothesisEnabled: boolean;
  redTeamEnabled: boolean;
  ephemeralReasoningEnabled: boolean;
  residualStreamEnabled: boolean;
  karpathyGatesEnabled: boolean;
  thinkGateStrictness: number;
  simplicityGateStrictness: number;
  maxReasoningDepth: 'shallow' | 'standard' | 'deep' | 'extended';
  label: string;
  description: string;
}

const DEPTH_PROFILES: Record<AutonomyLevel, AutonomyDepthProfile> = {
  1: {
    depth: 1,
    maxAgentCount: 1,
    governanceStrictness: 'minimal',
    shadowCouncilEnabled: false,
    shadowCouncilThreshold: 1.0,
    extendedThinkingEnabled: false,
    extendedThinkingBudgetTokens: 0,
    extendedThinkingPasses: 0,
    speculativeExecutionEnabled: false,
    useDistilledAgents: true,
    approvalTier: 'auto',
    multiHypothesisEnabled: false,
    redTeamEnabled: false,
    ephemeralReasoningEnabled: false,
    residualStreamEnabled: false,
    karpathyGatesEnabled: false,
    thinkGateStrictness: 0,
    simplicityGateStrictness: 0,
    maxReasoningDepth: 'shallow',
    label: 'Minimal',
    description: 'Single distilled agent, no governance overhead. For trivial queries.',
  },
  2: {
    depth: 2,
    maxAgentCount: 1,
    governanceStrictness: 'minimal',
    shadowCouncilEnabled: false,
    shadowCouncilThreshold: 1.0,
    extendedThinkingEnabled: false,
    extendedThinkingBudgetTokens: 0,
    extendedThinkingPasses: 0,
    speculativeExecutionEnabled: false,
    useDistilledAgents: true,
    approvalTier: 'auto',
    multiHypothesisEnabled: false,
    redTeamEnabled: false,
    ephemeralReasoningEnabled: false,
    residualStreamEnabled: false,
    karpathyGatesEnabled: true,
    thinkGateStrictness: 0.2,
    simplicityGateStrictness: 0.3,
    maxReasoningDepth: 'shallow',
    label: 'Light',
    description: 'Single agent with basic Karpathy gates. Low-stakes routine tasks.',
  },
  3: {
    depth: 3,
    maxAgentCount: 2,
    governanceStrictness: 'standard',
    shadowCouncilEnabled: false,
    shadowCouncilThreshold: 0.9,
    extendedThinkingEnabled: false,
    extendedThinkingBudgetTokens: 2000,
    extendedThinkingPasses: 1,
    speculativeExecutionEnabled: false,
    useDistilledAgents: true,
    approvalTier: 'auto',
    multiHypothesisEnabled: false,
    redTeamEnabled: false,
    ephemeralReasoningEnabled: false,
    residualStreamEnabled: false,
    karpathyGatesEnabled: true,
    thinkGateStrictness: 0.3,
    simplicityGateStrictness: 0.4,
    maxReasoningDepth: 'standard',
    label: 'Routine',
    description: 'Distilled agents with standard governance. Routine operational queries.',
  },
  4: {
    depth: 4,
    maxAgentCount: 3,
    governanceStrictness: 'standard',
    shadowCouncilEnabled: false,
    shadowCouncilThreshold: 0.8,
    extendedThinkingEnabled: true,
    extendedThinkingBudgetTokens: 4000,
    extendedThinkingPasses: 2,
    speculativeExecutionEnabled: false,
    useDistilledAgents: false,
    approvalTier: 'auto',
    multiHypothesisEnabled: false,
    redTeamEnabled: false,
    ephemeralReasoningEnabled: true,
    residualStreamEnabled: false,
    karpathyGatesEnabled: true,
    thinkGateStrictness: 0.4,
    simplicityGateStrictness: 0.5,
    maxReasoningDepth: 'standard',
    label: 'Standard',
    description: 'Full agents with extended thinking. Standard business queries.',
  },
  5: {
    depth: 5,
    maxAgentCount: 4,
    governanceStrictness: 'standard',
    shadowCouncilEnabled: false,
    shadowCouncilThreshold: 0.7,
    extendedThinkingEnabled: true,
    extendedThinkingBudgetTokens: 6000,
    extendedThinkingPasses: 2,
    speculativeExecutionEnabled: false,
    useDistilledAgents: false,
    approvalTier: 'auto',
    multiHypothesisEnabled: true,
    redTeamEnabled: false,
    ephemeralReasoningEnabled: true,
    residualStreamEnabled: true,
    karpathyGatesEnabled: true,
    thinkGateStrictness: 0.5,
    simplicityGateStrictness: 0.5,
    maxReasoningDepth: 'deep',
    label: 'Enhanced',
    description: 'Multi-agent with residual stream and multi-hypothesis. Complex queries.',
  },
  6: {
    depth: 6,
    maxAgentCount: 5,
    governanceStrictness: 'elevated',
    shadowCouncilEnabled: true,
    shadowCouncilThreshold: 0.6,
    extendedThinkingEnabled: true,
    extendedThinkingBudgetTokens: 8000,
    extendedThinkingPasses: 3,
    speculativeExecutionEnabled: true,
    useDistilledAgents: false,
    approvalTier: 'operator',
    multiHypothesisEnabled: true,
    redTeamEnabled: false,
    ephemeralReasoningEnabled: true,
    residualStreamEnabled: true,
    karpathyGatesEnabled: true,
    thinkGateStrictness: 0.6,
    simplicityGateStrictness: 0.6,
    maxReasoningDepth: 'deep',
    label: 'Elevated',
    description: 'Shadow council active. Speculative execution. High-value decisions.',
  },
  7: {
    depth: 7,
    maxAgentCount: 6,
    governanceStrictness: 'elevated',
    shadowCouncilEnabled: true,
    shadowCouncilThreshold: 0.5,
    extendedThinkingEnabled: true,
    extendedThinkingBudgetTokens: 12000,
    extendedThinkingPasses: 3,
    speculativeExecutionEnabled: true,
    useDistilledAgents: false,
    approvalTier: 'operator',
    multiHypothesisEnabled: true,
    redTeamEnabled: true,
    ephemeralReasoningEnabled: true,
    residualStreamEnabled: true,
    karpathyGatesEnabled: true,
    thinkGateStrictness: 0.7,
    simplicityGateStrictness: 0.6,
    maxReasoningDepth: 'extended',
    label: 'High Stakes',
    description: 'Red-team active. Full multi-hypothesis reasoning. Strategic decisions.',
  },
  8: {
    depth: 8,
    maxAgentCount: 8,
    governanceStrictness: 'maximum',
    shadowCouncilEnabled: true,
    shadowCouncilThreshold: 0.4,
    extendedThinkingEnabled: true,
    extendedThinkingBudgetTokens: 16000,
    extendedThinkingPasses: 4,
    speculativeExecutionEnabled: true,
    useDistilledAgents: false,
    approvalTier: 'executive',
    multiHypothesisEnabled: true,
    redTeamEnabled: true,
    ephemeralReasoningEnabled: true,
    residualStreamEnabled: true,
    karpathyGatesEnabled: true,
    thinkGateStrictness: 0.8,
    simplicityGateStrictness: 0.7,
    maxReasoningDepth: 'extended',
    label: 'Critical',
    description: 'Maximum governance. Executive approval required. Critical business decisions.',
  },
  9: {
    depth: 9,
    maxAgentCount: 10,
    governanceStrictness: 'maximum',
    shadowCouncilEnabled: true,
    shadowCouncilThreshold: 0.3,
    extendedThinkingEnabled: true,
    extendedThinkingBudgetTokens: 24000,
    extendedThinkingPasses: 5,
    speculativeExecutionEnabled: true,
    useDistilledAgents: false,
    approvalTier: 'executive',
    multiHypothesisEnabled: true,
    redTeamEnabled: true,
    ephemeralReasoningEnabled: true,
    residualStreamEnabled: true,
    karpathyGatesEnabled: true,
    thinkGateStrictness: 0.9,
    simplicityGateStrictness: 0.8,
    maxReasoningDepth: 'extended',
    label: 'Board-Level',
    description: 'Full adversarial red-team. Maximum token budget. Board-level decisions.',
  },
  10: {
    depth: 10,
    maxAgentCount: 12,
    governanceStrictness: 'maximum',
    shadowCouncilEnabled: true,
    shadowCouncilThreshold: 0.2,
    extendedThinkingEnabled: true,
    extendedThinkingBudgetTokens: 32000,
    extendedThinkingPasses: 6,
    speculativeExecutionEnabled: true,
    useDistilledAgents: false,
    approvalTier: 'executive',
    multiHypothesisEnabled: true,
    redTeamEnabled: true,
    ephemeralReasoningEnabled: true,
    residualStreamEnabled: true,
    karpathyGatesEnabled: true,
    thinkGateStrictness: 1.0,
    simplicityGateStrictness: 0.9,
    maxReasoningDepth: 'extended',
    label: 'Sovereign',
    description: 'Every capability active at maximum. Existential or regulatory-critical decisions.',
  },
};

export function resolveAutonomyDepth(depth: number): AutonomyDepthProfile {
  const clamped = Math.max(1, Math.min(10, Math.round(depth))) as AutonomyLevel;
  return { ...DEPTH_PROFILES[clamped] };
}

export function inferDepthFromQuery(
  query: string,
  isHighStakes: boolean,
  stakesLevel: 'low' | 'medium' | 'high' | 'critical',
  domainCount: number,
): AutonomyLevel {
  const lower = query.toLowerCase();

  if (stakesLevel === 'critical' || /board|existential|regulatory\s+breach|sovereignty/i.test(lower)) {
    return 9;
  }
  if (stakesLevel === 'high' || isHighStakes) {
    return domainCount > 3 ? 8 : 7;
  }
  if (stakesLevel === 'medium') {
    if (domainCount > 3) return 6;
    if (domainCount > 1) return 5;
    return 4;
  }

  if (domainCount > 2) return 4;
  if (domainCount > 1) return 3;

  const trivialPatterns = /^(hi|hello|hey|what time|what is your name|status|health)/i;
  if (trivialPatterns.test(lower) && lower.length < 40) return 1;

  return 2;
}

export function getAllDepthProfiles(): AutonomyDepthProfile[] {
  return Object.values(DEPTH_PROFILES).map(p => ({ ...p }));
}

export function getDepthLabel(depth: number): string {
  const clamped = Math.max(1, Math.min(10, Math.round(depth))) as AutonomyLevel;
  return DEPTH_PROFILES[clamped].label;
}
