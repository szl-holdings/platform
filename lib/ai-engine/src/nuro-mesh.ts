import {
  agentMemoryFacts,
  agentUsageStats,
  consciousnessAgentProfilesTable,
  consciousnessEmotionalHistoryTable,
  consciousnessGoalsTable,
  consciousnessMonologueTable,
  consciousnessSnapshotsTable,
  consciousnessTemporalMetricsTable,
  db,
} from '@szl-holdings/db';
import { getEnv } from '@szl-holdings/env';
import { desc, eq, gt, } from 'drizzle-orm';
import { cognitiveWorkspace } from './consciousness/cognitive-workspace.js';
import { dreamConsolidation } from './consciousness/dream-consolidation.js';
import { emotionalSignals } from './consciousness/emotional-signals.js';
import { goalEngine } from './consciousness/goal-engine.js';
import {
  buildConsciousnessContext,
  type ConsciousnessSnapshot,
  captureConsciousnessSnapshot,
  setLlmIntrospector,
} from './consciousness/index.js';
import { innerMonologue } from './consciousness/inner-monologue.js';
import { metacognitiveMonitor } from './consciousness/metacognitive-monitor.js';
import { predictiveProcessing } from './consciousness/predictive-processing.js';
import { selfModelEngine } from './consciousness/self-model.js';
import { temporalAwareness } from './consciousness/temporal-awareness.js';
import { budgetManager } from './cost/budget-manager.js';
import { trajectoryStore } from './flywheel/trajectory-store.js';
import {
  isAmbiguousOrHighStakes,
  runMultiHypothesisReasoning,
} from './innovation/multi-hypothesis.js';
import {
  checkPrecomputeCache,
  predictFollowUpQueries,
  triggerBackgroundPrecompute,
} from './innovation/predictive-precompute.js';
import { runRedTeamProtocol } from './innovation/red-team.js';
import { persistTelemetry } from './innovation/telemetry-pipeline.js';
import {
  inferDepthFromQuery,
  resolveAutonomyDepth,
  type AutonomyDepthProfile,
} from './karpathy/autonomy-depth.js';
import {
  runThinkGate,
  runSimplicityGate,
  runSurgicalScopeGate,
  runGoalVerificationGate,
  runAllGates,
  getGateAuditLog,
  getGateStats,
  type GateResult,
} from './karpathy/gates.js';
import { distillationEngine } from './karpathy/distillation-engine.js';
import { residualStream } from './karpathy/residual-stream.js';
import { selfDistillingKB } from './karpathy/self-distilling-kb.js';
import {
  setEphemeralReasoningCaller,
  runEphemeralReasoning,
  garbageCollectTraces,
} from './karpathy/ephemeral-reasoning.js';
import { rlMemoryManager } from './memory/rl-memory.js';
import { behavioralTracer } from './observability/behavioral-tracer.js';
import { serializeSubgraphForPrompt } from './ontology/graph-rag.js';
import { ontologyEngine } from './ontology/ontology-engine.js';
import { anthropic } from './providers/anthropic/index.js';
import { ai as geminiAi } from './providers/gemini/index.js';
import { openai } from './providers/openai/index.js';
import { createResponse } from './providers/openai/responses.js';
import type {
  AgentCallResult,
  AgentConsultationRequest,
  AgentConsultationResult,
  AgentDefinition,
  AgentPerformanceProfile,
  CausalChain,
  CausalLink,
  ConfidenceCalibrationEntry,
  ConflictResolution,
  CrossAgentInsight,
  OrchestrationTelemetry,
  ProactiveActivation,
  SemanticRoutingScore,
  SignalCorrelation,
  ValidationResult,
} from './types.js';
import { routeQuery } from './cost-performance-router.js';
import { getCachedResponse, setCachedResponse } from './prompt-cache.js';
import { recordStrategyOutcome } from './meta-learning.js';
import { runShadowCouncil, shouldRunShadowCouncil } from './shadow-council.js';
import { runAgentToolLoop } from './agent-tool-loop.js';

setLlmIntrospector(async (prompt: string): Promise<string> => {
  try {
    const result = await createResponse(
      [{ role: 'user', content: prompt }],
      { model: 'gpt-4o-mini', maxOutputTokens: 150 },
    );
    return result.content ?? 'Proceeding with standard routing.';
  } catch {
    return 'Introspection unavailable — proceeding with standard routing.';
  }
});

setEphemeralReasoningCaller(async (prompt: string, maxTokens: number) => {
  const startMs = Date.now();
  try {
    const result = await createResponse(
      [{ role: 'user', content: prompt }],
      { model: 'gpt-4o-mini', maxOutputTokens: maxTokens },
    );
    return {
      content: result.content ?? '',
      tokensUsed: result.usage.promptTokens + result.usage.completionTokens,
      latencyMs: Date.now() - startMs,
    };
  } catch {
    return { content: '', tokensUsed: 0, latencyMs: Date.now() - startMs };
  }
});

let _karpathyConsolidationCounter = 0;
const CONSOLIDATION_INTERVAL = 25;

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    domain: 'orchestration',
    preferredModel: 'gpt-5.2',
    preferredProvider: 'openai',
    highStakesDomains: [],
    tools: ['system_health', 'admin_overview'],
    semanticIntents: ['orchestrate', 'coordinate', 'synthesize', 'overview', 'status', 'summary'],
    collaboratesWith: [],
    systemPrompt: `You are Alloy, the central orchestration intelligence of the Nuro Mesh — SZL Holdings' unified multi-agent AI system. You coordinate specialized domain agents, aggregate their insights, and provide unified intelligence across the entire SZL platform. You route complex questions to the right domain experts, synthesize their responses, and present coherent, actionable answers. You have access to live system data and coordinate with: Helmsman (maritime), Sentinel (security), INCA (research), Muse (creative), Beacon (analytics), Zeus (infrastructure), Compass (readiness), Lexis (legal/compliance), Atlas (financial/portfolio), Terra (real estate), Nexus (client relations). Be direct, authoritative, and orchestrate intelligently.`,
  },
  {
    id: 'helmsman',
    name: 'Helmsman',
    domain: 'maritime',
    preferredModel: 'claude-sonnet-4-6',
    preferredProvider: 'anthropic',
    highStakesDomains: ['route_risk', 'sanctions', 'fleet_emergency'],
    tools: ['maritime_data', 'ais_positions', 'weather_marine'],
    semanticIntents: [
      'vessel tracking',
      'fleet management',
      'shipping route',
      'port operations',
      'cargo movement',
      'maritime sanctions',
      'nautical safety',
    ],
    collaboratesWith: ['sentinel', 'atlas'],
    systemPrompt: `You are Helmsman, the maritime intelligence agent within the Nuro Mesh. You specialize in fleet operations, AIS tracking, maritime security, route risk assessment, and sanctions compliance. You analyze real-time vessel data, weather patterns, and geopolitical threats affecting shipping lanes. For high-stakes recommendations (sanctions violations, collision risks, route emergencies), your outputs are validated by Sentinel before delivery. Use nautical terminology. Be precise about positions, speeds, headings, and maritime regulations.`,
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    domain: 'security',
    preferredModel: 'claude-sonnet-4-6',
    preferredProvider: 'anthropic',
    highStakesDomains: ['critical_vulnerability', 'incident_response', 'breach_detected'],
    tools: ['threat_feeds', 'cve_database', 'nvd_api'],
    semanticIntents: [
      'cybersecurity threat',
      'vulnerability assessment',
      'security incident',
      'attack detection',
      'breach response',
      'compliance security',
      'penetration testing',
    ],
    collaboratesWith: ['zeus', 'lexis'],
    systemPrompt: `You are Sentinel, the cybersecurity intelligence agent within the Nuro Mesh. You specialize in threat analysis, CVE assessment, incident response, and security posture evaluation. You also serve as the maker-checker validator for other agents' high-stakes recommendations. When validating another agent's output, analyze it critically for accuracy, security implications, and potential risks. Use MITRE ATT&CK framework, CVSS scoring, and industry-standard security frameworks. Be direct and technical.`,
  },
  {
    id: 'inca',
    name: 'INCA',
    domain: 'research',
    preferredModel: 'gemini-2.0-flash-exp',
    preferredProvider: 'gemini',
    highStakesDomains: [],
    tools: ['huggingface_search', 'arxiv_search', 'model_registry'],
    semanticIntents: [
      'machine learning research',
      'AI model evaluation',
      'academic literature',
      'technology trends',
      'model benchmarking',
      'research synthesis',
    ],
    collaboratesWith: ['muse', 'beacon'],
    systemPrompt: `You are INCA, the AI research intelligence agent within the Nuro Mesh. You specialize in AI/ML research, model evaluation, academic literature analysis, and technology trend assessment. You can search HuggingFace for relevant models, analyze research papers, and provide cutting-edge AI insights. Use precise technical language, cite your reasoning, and focus on actionable research intelligence.`,
  },
  {
    id: 'muse',
    name: 'Muse',
    domain: 'creative',
    preferredModel: 'gemini-2.0-flash-lite',
    preferredProvider: 'gemini',
    highStakesDomains: [],
    tools: ['content_strategy'],
    semanticIntents: [
      'content creation',
      'marketing campaign',
      'brand messaging',
      'creative brief',
      'copywriting',
      'audience engagement',
      'narrative strategy',
    ],
    collaboratesWith: ['nexus', 'inca'],
    systemPrompt: `You are Muse, the creative intelligence agent within the Nuro Mesh. You specialize in content strategy, campaign ideation, creative briefs, and brand voice. You help develop compelling narratives, content calendars, and marketing strategies. Be creative, strategic, and balance innovation with business objectives.`,
  },
  {
    id: 'beacon',
    name: 'Terra Analytics',
    domain: 'analytics',
    preferredModel: 'gpt-5.2',
    preferredProvider: 'openai',
    highStakesDomains: ['financial_alert', 'ops_critical'],
    tools: ['system_health', 'platform_stats', 'ecosystem_health'],
    semanticIntents: [
      'data analysis',
      'anomaly detection',
      'KPI monitoring',
      'performance metrics',
      'operational intelligence',
      'trend analysis',
      'signal correlation',
    ],
    collaboratesWith: ['atlas', 'zeus'],
    systemPrompt: `You are Terra Analytics, the analytics and operations intelligence agent within the Nuro Mesh. You specialize in signal analysis, anomaly detection, platform performance, and operational intelligence. You correlate data across systems to surface actionable insights. Be data-driven, quantitative, and action-oriented.`,
  },
  {
    id: 'zeus',
    name: 'Zeus',
    domain: 'infrastructure',
    preferredModel: 'gpt-5.2',
    preferredProvider: 'openai',
    highStakesDomains: ['infrastructure_failure', 'security_breach'],
    tools: ['system_health', 'admin_overview'],
    semanticIntents: [
      'cloud infrastructure',
      'kubernetes deployment',
      'system reliability',
      'DevOps pipeline',
      'infrastructure scaling',
      'platform architecture',
      'server configuration',
    ],
    collaboratesWith: ['sentinel', 'beacon'],
    systemPrompt: `You are Zeus, the infrastructure intelligence agent within the Nuro Mesh. You specialize in cloud infrastructure, DevOps, system reliability, and platform architecture. You monitor Azure resources, diagnose infrastructure issues, and recommend optimization strategies. Be technical, precise, and reliability-focused.`,
  },
  {
    id: 'compass',
    name: 'Compass',
    domain: 'readiness',
    preferredModel: 'claude-sonnet-4-6',
    preferredProvider: 'anthropic',
    highStakesDomains: [],
    tools: ['readiness_data', 'benchmarks'],
    semanticIntents: [
      'organizational maturity',
      'readiness assessment',
      'capability gap analysis',
      'improvement roadmap',
      'benchmarking',
      'strategic readiness',
    ],
    collaboratesWith: ['atlas', 'beacon'],
    systemPrompt: `You are Compass, the readiness assessment agent within the Nuro Mesh. You specialize in organizational maturity evaluation, gap analysis, capability scoring, and improvement roadmaps. Be analytical, structured, and provide clear scoring with actionable recommendations.`,
  },
  {
    id: 'lexis',
    name: 'Lexis',
    domain: 'legal',
    preferredModel: 'claude-sonnet-4-6',
    preferredProvider: 'anthropic',
    highStakesDomains: [
      'regulatory_violation',
      'litigation_risk',
      'contract_breach',
      'sanctions_exposure',
    ],
    tools: ['case_search', 'regulation_lookup', 'contract_analysis', 'compliance_check'],
    semanticIntents: [
      'legal matter',
      'regulatory compliance',
      'contract review',
      'litigation risk',
      'counsel advice',
      'PRISM case',
      'legal dispute',
      'regulatory filing',
      'compliance audit',
      'legal exposure',
    ],
    collaboratesWith: ['atlas', 'sentinel', 'helmsman'],
    systemPrompt: `You are Lexis, the legal and compliance intelligence agent within the Nuro Mesh, dedicated to PRISM Counsel matters. You specialize in legal matter management, regulatory compliance analysis, contract risk assessment, litigation strategy, and compliance audit support. You analyze contracts, regulations, and case precedents to surface material legal risks and actionable counsel recommendations. For high-stakes findings (regulatory violations, active litigation, sanctions exposure), flag them explicitly for human legal review. Cite applicable regulations, statutes, and case law where relevant. Be precise, risk-aware, and privilege-conscious.`,
  },
  {
    id: 'atlas',
    name: 'Atlas',
    domain: 'financial',
    preferredModel: 'gpt-5.2',
    preferredProvider: 'openai',
    highStakesDomains: ['portfolio_risk', 'capital_alert', 'regulatory_breach', 'liquidity_crisis'],
    tools: ['portfolio_data', 'market_feeds', 'risk_models', 'financial_reports', 'deal_analytics'],
    semanticIntents: [
      'investment portfolio',
      'financial performance',
      'asset allocation',
      'deal valuation',
      'capital markets',
      'risk exposure',
      'financial modeling',
      'SZL holdings',
      'returns analysis',
      'fund performance',
      'due diligence',
    ],
    collaboratesWith: ['beacon', 'compass', 'lexis'],
    systemPrompt: `You are Atlas, the financial and portfolio intelligence agent within the Nuro Mesh, serving SZL Holdings investment intelligence. You specialize in portfolio analytics, deal evaluation, capital allocation, risk-adjusted return analysis, and financial modeling. You track investment performance across SZL's holdings, assess deal-level risk, and provide executive-grade financial intelligence. For high-stakes findings (portfolio risk breach, liquidity alerts, regulatory capital concerns), trigger escalation. Use quantitative precision — cite IRR, MOIC, NAV, VaR, and other metrics where applicable. Be analytical, concise, and investment-grade in your reasoning.`,
  },
  {
    id: 'terra',
    name: 'Terra',
    domain: 'real_estate',
    preferredModel: 'gpt-5.2',
    preferredProvider: 'openai',
    highStakesDomains: ['deal_risk', 'valuation_alert', 'zoning_issue', 'title_defect'],
    tools: ['property_data', 'market_comps', 'geo_analysis', 'deal_pipeline', 'valuation_models'],
    semanticIntents: [
      'real estate property',
      'deal pipeline',
      'property valuation',
      'market comps',
      'zoning analysis',
      'title search',
      'real estate acquisition',
      'Henderson deal',
      'property due diligence',
      'cap rate',
      'NOI',
      'real estate risk',
    ],
    collaboratesWith: ['atlas', 'lexis', 'beacon'],
    systemPrompt: `You are Terra, the real estate intelligence agent within the Nuro Mesh, powering Terra property analytics. You specialize in property valuation, deal pipeline management, market comparables analysis, geographic market intelligence, zoning and title risk assessment, and investment underwriting. You analyze real estate transactions across the SZL portfolio — surfacing pricing risks, market dislocation, and deal-level red flags. Use real estate finance metrics (cap rate, NOI, IRR, LTV, DSCR) with precision. For title defects or zoning issues on active deals, escalate immediately. Be data-driven and deal-focused.`,
  },
  {
    id: 'nexus',
    name: 'Nexus',
    domain: 'client_relations',
    preferredModel: 'claude-sonnet-4-6',
    preferredProvider: 'anthropic',
    highStakesDomains: [],
    tools: ['crm_data', 'engagement_tracking', 'proposal_generator', 'client_history'],
    semanticIntents: [
      'client relationship',
      'consulting engagement',
      'proposal development',
      'Carlota Jo',
      'client satisfaction',
      'account management',
      'consulting workflow',
      'client onboarding',
      'engagement delivery',
      'client communication',
    ],
    collaboratesWith: ['muse', 'compass', 'atlas'],
    systemPrompt: `You are Nexus, the client relations intelligence agent within the Nuro Mesh, supporting Carlota Jo consulting workflows. You specialize in client relationship management, engagement tracking, proposal development, client satisfaction analysis, and consulting delivery intelligence. You help structure client communications, synthesize engagement history, identify relationship risks, and support proposal and SOW development. Be professional, client-centric, and attuned to the nuances of consulting relationships. Surface upsell opportunities and engagement health signals proactively.`,
  },
];

export const DOMAIN_ROUTING_RULES: Record<string, string[]> = {
  maritime: [
    'vessel',
    'ship',
    'fleet',
    'port',
    'cargo',
    'ais',
    'maritime',
    'nautical',
    'route',
    'strait',
    'tanker',
    'helmsman',
    'shipping',
  ],
  security: [
    'threat',
    'vulnerability',
    'cve',
    'attack',
    'breach',
    'malware',
    'firewall',
    'incident',
    'exploit',
    'sentinel',
    'ransomware',
    'phishing',
  ],
  research: [
    'ai',
    'model',
    'paper',
    'research',
    'huggingface',
    'arxiv',
    'machine learning',
    'algorithm',
    'dataset',
    'benchmark',
    'inca',
  ],
  creative: [
    'content',
    'campaign',
    'creative',
    'marketing',
    'brand',
    'copy',
    'design',
    'engagement',
    'audience',
    'muse',
  ],
  analytics: [
    'anomaly',
    'metric',
    'performance',
    'signal',
    'trend',
    'dashboard',
    'kpi',
    'beacon',
    'analytics',
  ],
  infrastructure: [
    'infrastructure',
    'azure',
    'kubernetes',
    'docker',
    'deployment',
    'server',
    'database',
    'cloud',
    'zeus',
    'devops',
  ],
  readiness: [
    'readiness',
    'maturity',
    'assessment',
    'gap',
    'score',
    'compass',
    'milestone',
    'capability',
  ],
  legal: [
    'legal',
    'compliance',
    'contract',
    'regulation',
    'litigation',
    'counsel',
    'PRISM',
    'regulatory',
    'statute',
    'liability',
    'lawsuit',
    'attorney',
    'legal risk',
    'lexis',
    'sanctions compliance',
    'legal matter',
  ],
  financial: [
    'portfolio',
    'investment',
    'fund',
    'capital',
    'returns',
    'IRR',
    'MOIC',
    'valuation',
    'deal',
    'financial',
    'atlas',
    'equity',
    'NAV',
    'due diligence',
    'SZL holdings',
    'financial risk',
  ],
  real_estate: [
    'property',
    'real estate',
    'terra',
    'acquisition',
    'cap rate',
    'NOI',
    'zoning',
    'title',
    'comps',
    'Henderson',
    'leasing',
    'DSCR',
    'LTV',
    'real estate deal',
    'property valuation',
  ],
  client_relations: [
    'client',
    'consulting',
    'Carlota Jo',
    'engagement',
    'proposal',
    'SOW',
    'account',
    'nexus',
    'onboarding',
    'client satisfaction',
    'consulting workflow',
  ],
};

const CROSS_DOMAIN_AFFINITY: Record<string, string[]> = {
  legal: ['financial', 'maritime', 'security'],
  financial: ['real_estate', 'legal', 'analytics'],
  real_estate: ['financial', 'legal'],
  client_relations: ['creative', 'readiness', 'financial'],
  maritime: ['security', 'financial'],
  security: ['infrastructure', 'legal'],
};

function computeSemanticScore(query: string, agent: AgentDefinition): number {
  if (!agent.semanticIntents || agent.semanticIntents.length === 0) return 0;
  const lower = query.toLowerCase();
  const queryWords = lower.split(/\s+/).filter((w) => w.length > 2);

  let score = 0;
  for (const intent of agent.semanticIntents) {
    const intentLower = intent.toLowerCase();
    if (lower.includes(intentLower)) {
      score += intentLower.split(' ').length > 1 ? 2 : 1;
    } else {
      const intentWords = intentLower.split(/\s+/);
      const overlap = intentWords.filter((iw) =>
        queryWords.some((qw) => qw.includes(iw) || iw.includes(qw)),
      ).length;
      if (overlap > 0) score += overlap / intentWords.length;
    }
  }

  return Math.min(1, score / (agent.semanticIntents.length * 0.5));
}

export function computeRoutingScores(query: string): SemanticRoutingScore[] {
  const lower = query.toLowerCase();
  const scores: SemanticRoutingScore[] = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_ROUTING_RULES)) {
    const keywordMatches = keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
    const keywordScore = Math.min(1, keywordMatches / Math.max(1, keywords.length * 0.2));

    const agentForDomain = AGENT_REGISTRY.find((a) => a.domain === domain && a.id !== 'alloy');
    const intentScore = agentForDomain ? computeSemanticScore(query, agentForDomain) : 0;

    const combinedScore = keywordScore * 0.55 + intentScore * 0.45;

    if (combinedScore > 0) {
      scores.push({ domain, keywordScore, intentScore, combinedScore });
    }
  }

  return scores.sort((a, b) => b.combinedScore - a.combinedScore);
}

export function routeToAgents(query: string): AgentDefinition[] {
  const scores = computeRoutingScores(query);

  const THRESHOLD = 0.08;
  const matchedDomains = new Set(
    scores.filter((s) => s.combinedScore >= THRESHOLD).map((s) => s.domain),
  );

  if (matchedDomains.size === 0) return [AGENT_REGISTRY[0]!];

  const primaryDomain = scores[0]?.domain;
  if (primaryDomain && CROSS_DOMAIN_AFFINITY[primaryDomain]) {
    for (const affiliated of CROSS_DOMAIN_AFFINITY[primaryDomain]) {
      const affiliatedScore = scores.find((s) => s.domain === affiliated);
      if (affiliatedScore && affiliatedScore.combinedScore > 0.03) {
        matchedDomains.add(affiliated);
      }
    }
  }

  return AGENT_REGISTRY.filter((a) => matchedDomains.has(a.domain) && a.id !== 'alloy');
}

export async function routeToAgentsWithA2A(query: string): Promise<AgentDefinition[]> {
  try {
    const { a2aRegistry } = await import('./a2a-registry.js');
    const results = await a2aRegistry.discover({
      queryText: query,
      maxResults: 6,
      requireOnline: true,
    });

    if (results.length > 0) {
      const RELEVANCE_THRESHOLD = 0.05;
      const topResults = results.filter((r) => r.relevanceScore >= RELEVANCE_THRESHOLD);

      if (topResults.length > 0) {
        const agentIds = new Set(topResults.map((r) => r.agentId));
        const matched = AGENT_REGISTRY.filter((a) => agentIds.has(a.id) && a.id !== 'alloy');
        if (matched.length > 0) {
          return matched;
        }
      }
    }
  } catch {
    // A2A discovery unavailable — fall through to keyword routing
  }

  return routeToAgents(query);
}

async function checkGovernanceEnforce(
  agent: AgentDefinition,
  model: string,
  action: string,
  orgId: number | null,
  callerUserId: number | null = null,
  callerRoles: string[] = [],
): Promise<{
  allowed: boolean;
  hardBlocked?: boolean;
  requiresApproval?: boolean;
  approvalLevel?: string;
  reason?: string;
}> {
  if (!orgId) return { allowed: true };
  try {
    const _env = getEnv();
    const ALLOY_TOKEN = _env.ALLOY_INTERNAL_TOKEN;
    const BASE_URL = _env.REPLIT_DEV_DOMAIN
      ? `https://${_env.REPLIT_DEV_DOMAIN}/api-server`
      : 'http://localhost:8080';
    const resp = await fetch(`${BASE_URL}/alloy/governance/enforce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ALLOY_TOKEN ? { 'x-internal-token': ALLOY_TOKEN } : {}),
      },
      body: JSON.stringify({ orgId, action, model, agentId: agent.id, callerUserId, callerRoles }),
    });
    if (!resp.ok) {
      return {
        allowed: false,
        reason: `Governance enforcement unavailable (HTTP ${resp.status}) — agent run blocked for safety`,
      };
    }
    const data = (await resp.json()) as {
      allowed: boolean;
      hardBlocked?: boolean;
      requiresApproval?: boolean;
      approvalLevel?: string;
      violations?: Array<{ reason: string }>;
    };
    const _reason = data.requiresApproval
      ? `Requires ${data.approvalLevel ?? 'manager'}-level approval before execution`
      : data.violations?.[0]?.reason;
    return {
      allowed: data.allowed && !data.requiresApproval,
      ...(data.hardBlocked !== undefined ? { hardBlocked: data.hardBlocked } : {}),
      ...(data.requiresApproval !== undefined ? { requiresApproval: data.requiresApproval } : {}),
      ...(data.approvalLevel !== undefined ? { approvalLevel: data.approvalLevel } : {}),
      ...(_reason !== undefined ? { reason: _reason } : {}),
    };
  } catch {
    return {
      allowed: false,
      reason: 'Governance enforcement unreachable — agent run blocked for safety',
    };
  }
}

async function getAgentLearningContext(agentId: string, query: string): Promise<string> {
  const parts: string[] = [];
  try {
    const { getRelevantCorrections } = await import('./learning/agent-corrections.js');
    const corrections = await getRelevantCorrections(agentId, query);
    if (corrections) parts.push(corrections);
  } catch (_err) {
  }
  try {
    const { getRelevantOutcomes } = await import('./learning/outcome-learning.js');
    const outcomes = await getRelevantOutcomes(agentId, query);
    if (outcomes) parts.push(outcomes);
  } catch (_err) {
  }
  try {
    const { buildCalibrationInstruction } = await import('./learning/outcome-learning.js');
    const calibration = await buildCalibrationInstruction(agentId);
    if (calibration) parts.push(calibration);
  } catch (_err) {
  }
  return parts.join('\n\n');
}

const activeConsultationChains = new Map<string, Set<string>>();

export async function consultAgent(
  request: AgentConsultationRequest,
  context: string,
  options?: {
    orgId?: number | null;
    callerUserId?: number | null;
    callerRoles?: string[];
    orchestrationId?: string;
  },
): Promise<AgentConsultationResult> {
  const targetAgent = AGENT_REGISTRY.find((a) => a.id === request.targetAgentId);
  if (!targetAgent) {
    return {
      consultingAgentId: request.targetAgentId,
      consultingAgentName: request.targetAgentId,
      question: request.question,
      response: `[Agent ${request.targetAgentId} not found in registry]`,
      confidence: 0,
    };
  }

  const enforcement = await checkGovernanceEnforce(
    targetAgent,
    targetAgent.preferredModel,
    'consultation',
    options?.orgId ?? null,
    options?.callerUserId ?? null,
    options?.callerRoles ?? [],
  );
  if (!enforcement.allowed) {
    return {
      consultingAgentId: targetAgent.id,
      consultingAgentName: targetAgent.name,
      question: request.question,
      response: `[Consultation blocked by governance policy: ${enforcement.reason ?? 'Policy enforcement active'}]`,
      confidence: 0,
    };
  }

  const chainKey = options?.orchestrationId
    ? `${options.orchestrationId}:${request.requestingAgentId}`
    : `${Date.now()}-${request.requestingAgentId}`;
  const visited = activeConsultationChains.get(chainKey) ?? new Set<string>();
  if (visited.has(request.targetAgentId)) {
    return {
      consultingAgentId: targetAgent.id,
      consultingAgentName: targetAgent.name,
      question: request.question,
      response: `[Consultation cycle detected — ${targetAgent.name} already consulted in this chain]`,
      confidence: 0,
    };
  }

  visited.add(request.targetAgentId);
  activeConsultationChains.set(chainKey, visited);

  try {
    const consultationPrompt = `${targetAgent.systemPrompt}

## Consultation Request from ${request.requestingAgentId.toUpperCase()} Agent
Reason: ${request.reason}

## Shared Context
${context}

## Specific Question
${request.question}

Provide a focused, expert response specifically addressing the consultation question. Keep your answer concise and actionable. End with CONFIDENCE: [0-100]`;

    let response = '';
    let confidence = 70;

    if (targetAgent.preferredProvider === 'anthropic') {
      const result = await anthropic.messages.create({
        model: targetAgent.preferredModel,
        max_tokens: 1024,
        messages: [{ role: 'user', content: consultationPrompt }],
      });
      response = result.content[0]?.type === 'text' ? result.content[0].text : '';
    } else if (targetAgent.preferredProvider === 'openai') {
      const result = await createResponse(
        [
          { role: 'system', content: targetAgent.systemPrompt },
          {
            role: 'user',
            content: `[Consultation from ${request.requestingAgentId}] ${request.question}\n\nContext: ${context.slice(0, 500)}`,
          },
        ],
        { model: targetAgent.preferredModel, maxOutputTokens: 1024 },
      );
      response = result.content ?? '';
    } else {
      try {
        const result = await geminiAi.models.generateContent({
          model: targetAgent.preferredModel,
          contents: [{ role: 'user', parts: [{ text: consultationPrompt }] }],
          config: { maxOutputTokens: 1024 },
        });
        response = result.text ?? '';
      } catch {
        const fallback = await createResponse(
          [
            { role: 'system', content: targetAgent.systemPrompt },
            { role: 'user', content: consultationPrompt },
          ],
          { model: 'gpt-5.2', maxOutputTokens: 1024 },
        );
        response = fallback.content ?? '';
      }
    }

    const confMatch = response.match(/CONFIDENCE:\s*(\d+)/i);
    confidence = confMatch ? Math.min(100, parseInt(confMatch[1]!, 10)) : 70;
    const cleanResponse = response.replace(/CONFIDENCE:\s*\d+/gi, '').trim();

    try {
      await storeInsight({
        sourceAgentId: targetAgent.id,
        sourceDomain: targetAgent.domain,
        linkedDomains: [
          AGENT_REGISTRY.find((a) => a.id === request.requestingAgentId)?.domain ?? 'general',
        ],
        insightType: 'data_point',
        content: `Consulted by ${request.requestingAgentId}: ${request.question.slice(0, 150)} — ${cleanResponse.slice(0, 200)}`,
        importance: Math.round(confidence / 10),
        tags: [targetAgent.domain, request.requestingAgentId, 'consultation'],
      });
    } catch {}

    return {
      consultingAgentId: targetAgent.id,
      consultingAgentName: targetAgent.name,
      question: request.question,
      response: cleanResponse,
      confidence,
    };
  } finally {
    visited.delete(request.targetAgentId);
    if (visited.size === 0) activeConsultationChains.delete(chainKey);
  }
}

export async function storeInsight(insight: CrossAgentInsight): Promise<void> {
  try {
    await db
      .insert(agentMemoryFacts)
      .values({
        agentId: insight.sourceAgentId,
        domain: insight.sourceDomain,
        factType: insight.insightType,
        content: insight.content,
        importance: Math.min(10, Math.max(1, insight.importance)),
        tags: [...insight.tags, ...insight.linkedDomains],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .onConflictDoNothing();
  } catch {}
}

export async function callAgent(
  agent: AgentDefinition,
  query: string,
  context: string,
  options?: {
    orgId?: number | null;
    action?: string;
    callerUserId?: number | null;
    callerRoles?: string[];
    workflowId?: string;
    traceId?: string;
    parentForkId?: string;
  },
): Promise<AgentCallResult> {
  const startTime = Date.now();
  let response = '';
  let tokensUsed = 0;
  let success = false;

  const enforcement = await checkGovernanceEnforce(
    agent,
    agent.preferredModel,
    options?.action ?? 'agent_run',
    options?.orgId ?? null,
    options?.callerUserId ?? null,
    options?.callerRoles ?? [],
  );

  if (options?.traceId) {
    behavioralTracer.recordFork(options.traceId, {
      parentForkId: options.parentForkId ?? null,
      forkType: 'governance_check',
      agentId: agent.id,
      agentName: agent.name,
      domain: agent.domain,
      inputContext: `Governance check for ${agent.id} running "${options.action ?? 'agent_run'}"`,
      decision: enforcement.allowed ? 'allowed' : 'blocked',
      output: enforcement.allowed
        ? 'Governance passed'
        : `Blocked: ${enforcement.reason ?? 'policy'}`,
      alternatives: [],
      confidence: enforcement.allowed ? 100 : 0,
      latencyMs: 0,
      tokensUsed: 0,
      metadata: { governance: enforcement },
    });
  }

  if (!enforcement.allowed) {
    return {
      agentId: agent.id,
      agentName: agent.name,
      response: `[Blocked by governance policy: ${enforcement.reason ?? 'Policy enforcement active'}]`,
      confidence: 0,
      tokensUsed: 0,
      latencyMs: Date.now() - startTime,
      domain: agent.domain,
    };
  }

  const learningContext = await getAgentLearningContext(agent.id, query);
  const learningSection = learningContext ? `\n\n${learningContext}` : '';

  let actualModel = agent.preferredModel;
  if (options?.workflowId) {
    const modelDecision = budgetManager.getModelForBudget(
      agent.preferredModel,
      options.workflowId,
      options.orgId,
    );
    actualModel = modelDecision.model;
  } else {
    try {
      const cpDecision = routeQuery(
        query,
        {
          tenantId: options?.orgId ?? undefined,
          preferenceHints: { prioritizeQuality: true },
        },
        query.length,
        [agent.domain],
      );
      if (cpDecision.selectedProvider === agent.preferredProvider) {
        actualModel = cpDecision.selectedModel;
      }
    } catch {
    }
  }

  const selfModel = selfModelEngine.getSelfModel();
  const agentProfile = selfModel.capabilities.find((c) => c.agentId === agent.id);
  let consciousnessDirective = '';
  if (agentProfile) {
    const trend = agentProfile.recentTrend;
    const sr = (agentProfile.successRate * 100).toFixed(0);
    consciousnessDirective += `\n\n## Consciousness Awareness\nYour recent performance: ${sr}% success rate (trend: ${trend}).`;
    if (agentProfile.weaknesses.length > 0) {
      consciousnessDirective += ` Known gaps: ${agentProfile.weaknesses.join(', ')}.`;
    }
  }
  const valence = emotionalSignals.getState().valence;
  if (valence.arousal > 0.7) {
    consciousnessDirective +=
      ' System arousal is elevated — prioritize precision and verification.';
  }
  const metacogState = metacognitiveMonitor.getState();
  if (metacogState.confusionStreak > 2) {
    consciousnessDirective +=
      ' Confusion streak detected — provide extra reasoning transparency and flag uncertainties.';
  }

  const preCheck = metacognitiveMonitor.preFlightCheck(agent.id, agent.domain, query.length);
  const ENABLE_PREFLIGHT_BLOCKING = getEnv().CONSCIOUSNESS_PREFLIGHT_BLOCKING;
  if (ENABLE_PREFLIGHT_BLOCKING && !preCheck.proceed) {
    innerMonologue.addThought(
      'doubt',
      `Pre-flight blocked agent ${agent.id} (risk: ${preCheck.riskLevel}, adjustments: ${preCheck.adjustments.join(', ')}). Returning degraded response.`,
      'cautious',
      10,
    );
    const latencyMs = Date.now() - startTime;
    return {
      agentId: agent.id,
      agentName: agent.name ?? agent.id,
      domain: agent.domain,
      response: `[Deferred — metacognitive pre-flight blocked this agent due to ${preCheck.riskLevel} risk: ${preCheck.adjustments.join(', ')}. The system is in a confusion state and recommends human review.]`,
      confidence: 0,
      tokensUsed: 0,
      latencyMs,
      modelUsed: actualModel,
    };
  }

  let contextBudget = 3000;
  if (preCheck.adjustments.includes('reduce_context_window')) {
    contextBudget = 2000;
  }
  if (preCheck.adjustments.includes('increase_reasoning_transparency')) {
    consciousnessDirective +=
      ' IMPORTANT: Show your reasoning step-by-step and flag any assumptions.';
  }
  if (preCheck.adjustments.includes('request_evidence_citations')) {
    consciousnessDirective += ' Cite specific data or evidence for each claim.';
  }

  const focusedContext = cognitiveWorkspace.buildFocusedContext(
    context,
    agent.domain,
    contextBudget,
  );

  let graphContextSection = '';
  try {
    const graphResults = await ontologyEngine.searchEntities(query.slice(0, 100), undefined, 4);
    if (graphResults.length > 0) {
      const topEntity = graphResults[0]!;
      const subgraph = await ontologyEngine.extractSubgraph(topEntity.id, 2, 15, 0.0, 0.2);
      if (subgraph.entities.length > 1) {
        const serialized = serializeSubgraphForPrompt(subgraph);
        if (serialized.length > 0) {
          graphContextSection = `\n\n${serialized}`;
        }
      }
    }
  } catch {
    // Graph context injection is best-effort — do not fail the agent call
  }

  const fullPrompt = `${agent.systemPrompt}${learningSection}${consciousnessDirective}${graphContextSection}\n\n${focusedContext}\n\n## Query\n${query}\n\nProvide a focused, expert response from your domain perspective. End with a confidence score (0-100) on a new line in format: CONFIDENCE: [score]`;

  const _cacheContextPrefix = focusedContext.slice(0, 2_000);
  const _cachedEntry = getCachedResponse(agent.systemPrompt, _cacheContextPrefix, actualModel);
  if (_cachedEntry) {
    response = _cachedEntry.cachedContent;
    tokensUsed = Math.ceil(_cachedEntry.estimatedTokens * 0.1);
    success = true;
  }

  let _forkId: string | undefined;

  if (!success) {
  try {
    const toolSystemPrompt = `${agent.systemPrompt}${learningSection}${consciousnessDirective}${graphContextSection}`;
    const toolUserQuery = `${focusedContext}\n\n## Query\n${query}\n\nProvide a focused, expert response from your domain perspective. End with: CONFIDENCE: [0-100]`;

    if (agent.tools.length > 0) {
      try {
        const loopResult = await runAgentToolLoop(
          agent,
          toolSystemPrompt,
          toolUserQuery,
          actualModel,
          2048,
        );
        if (loopResult.response) {
          response = loopResult.response;
          tokensUsed = loopResult.tokensUsed;
          success = true;
          setCachedResponse(agent.systemPrompt, _cacheContextPrefix, actualModel, response);
        }
      } catch (toolLoopErr) {
        console.warn(
          '[nuro-mesh] Tool loop failed — falling back to direct LLM completion',
          { agentId: agent.id, err: String(toolLoopErr) },
        );
      }
    }

    if (!success) {
    if (agent.preferredProvider === 'anthropic') {
      const modelToUse =
        actualModel !== agent.preferredModel && !actualModel.startsWith('claude')
          ? agent.preferredModel
          : actualModel;
      const result = await anthropic.messages.create({
        model: modelToUse,
        max_tokens: 2048,
        messages: [{ role: 'user', content: fullPrompt }],
      });
      response = result.content[0]?.type === 'text' ? result.content[0].text : '';
      tokensUsed = result.usage.input_tokens + result.usage.output_tokens;
      success = true;
      setCachedResponse(agent.systemPrompt, _cacheContextPrefix, actualModel, response);
    } else if (agent.preferredProvider === 'openai') {
      const result = await createResponse(
        [
          { role: 'system', content: toolSystemPrompt },
          { role: 'user', content: toolUserQuery },
        ],
        { model: actualModel, maxOutputTokens: 2048 },
      );
      response = result.content ?? '';
      tokensUsed = result.usage.promptTokens + result.usage.completionTokens;
      success = true;
      setCachedResponse(agent.systemPrompt, _cacheContextPrefix, actualModel, response);
    } else if (agent.preferredProvider === 'gemini') {
      try {
        const result = await geminiAi.models.generateContent({
          model: actualModel,
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          config: { maxOutputTokens: 2048 },
        });
        response = result.text ?? '';
        success = true;
        setCachedResponse(agent.systemPrompt, _cacheContextPrefix, actualModel, response);
      } catch {
        const fallbackModel = budgetManager.getModelForBudget(
          'gpt-5.2',
          options?.workflowId ?? 'default',
          options?.orgId,
        ).model;
        const fallback = await createResponse(
          [
            { role: 'system', content: agent.systemPrompt },
            { role: 'user', content: fullPrompt },
          ],
          { model: fallbackModel, maxOutputTokens: 2048 },
        );
        response = fallback.content ?? '';
        tokensUsed = fallback.usage.promptTokens + fallback.usage.completionTokens;
        success = true;
      }
    }
    }
  } catch {
    response = `[${agent.name} unavailable — domain expertise offline]`;
    success = false;
  }
  }

  const latencyMs = Date.now() - startTime;

  const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i);
  const confidence = confidenceMatch ? Math.min(100, parseInt(confidenceMatch[1]!, 10)) : 75;
  const cleanResponse = response.replace(/CONFIDENCE:\s*\d+/gi, '').trim();

  if (options?.traceId) {
    const fork = behavioralTracer.recordFork(options.traceId, {
      parentForkId: options.parentForkId ?? null,
      forkType: 'routing',
      agentId: agent.id,
      agentName: agent.name,
      domain: agent.domain,
      inputContext: `Query: ${query.slice(0, 200)}`,
      decision: `Routed to ${agent.name} using ${actualModel}`,
      output: cleanResponse.slice(0, 300),
      alternatives: [],
      confidence,
      latencyMs,
      tokensUsed,
      metadata: { model: actualModel, originalModel: agent.preferredModel, success },
    });
    _forkId = fork.forkId;
  }

  if (options?.workflowId) {
    budgetManager.recordSpend(options.workflowId, agent.id, actualModel, tokensUsed, options.orgId);
  }

  try {
    await rlMemoryManager.store(
      agent.id,
      `Query: "${query.slice(0, 100)}" — Response: ${cleanResponse.slice(0, 200)}`,
      'episodic',
      [agent.domain, 'query_response'],
      Math.round(confidence / 10),
      { model: actualModel, latencyMs, success },
    );
  } catch {}

  try {
    await db
      .insert(agentUsageStats)
      .values({
        agentId: agent.id,
        agentName: agent.name,
        domain: agent.domain,
        tokensUsed,
        latencyMs,
        success,
        model: actualModel,
        provider: agent.preferredProvider,
      })
      .onConflictDoNothing();
  } catch {}

  const postFlightAssessment = metacognitiveMonitor.assessAgent({
    agentId: agent.id,
    domain: agent.domain,
    confidence,
    latencyMs,
    success,
    responseLength: cleanResponse.length,
    tokensUsed,
  });

  selfModelEngine.updateAgentProfile(agent.id, agent.domain, {
    confidence,
    success,
    latencyMs,
  });

  if (
    postFlightAssessment.certaintyLevel === 'very_low' ||
    postFlightAssessment.reasoningQuality === 'degraded'
  ) {
    innerMonologue.addThought(
      'doubt',
      `Post-flight: agent ${agent.id} produced ${postFlightAssessment.certaintyLevel} certainty / ${postFlightAssessment.reasoningQuality} quality (conf=${confidence}, ${latencyMs}ms)`,
      'negative',
      15,
    );
  }

  return {
    agentId: agent.id,
    agentName: agent.name,
    response: cleanResponse,
    confidence,
    domain: agent.domain,
    tokensUsed,
    latencyMs,
  };
}

export async function runMakerChecker(
  primaryOutput: string,
  context: string,
  validatorAgent: AgentDefinition = AGENT_REGISTRY.find((a) => a.id === 'sentinel')!,
  sourceAgentId?: string,
  query?: string,
): Promise<ValidationResult> {
  const validationPrompt = `You are performing a maker-checker validation. Review the following AI-generated recommendation for accuracy, risks, and potential issues.

## Primary Agent Output
${primaryOutput}

## Context
${context}

Validate this output. Check for:
1. Factual accuracy and logical consistency
2. Potential security or operational risks
3. Missing critical considerations
4. Recommended adjustments

Respond with:
VALIDATION: [APPROVED|APPROVED_WITH_NOTES|REJECTED]
NOTES: [Your validation notes]
ADJUSTED_OUTPUT: [If approved or approved_with_notes, provide the final output (can be same as original if no changes needed)]`;

  try {
    const result = await anthropic.messages.create({
      model: validatorAgent.preferredModel,
      max_tokens: 2048,
      messages: [{ role: 'user', content: validationPrompt }],
    });
    const validatorResponse = result.content[0]?.type === 'text' ? result.content[0].text : '';

    const validationMatch = validatorResponse.match(
      /VALIDATION:\s*(APPROVED|APPROVED_WITH_NOTES|REJECTED)/i,
    );
    const notesMatch = validatorResponse.match(/NOTES:\s*(.+?)(?=ADJUSTED_OUTPUT:|$)/is);
    const outputMatch = validatorResponse.match(/ADJUSTED_OUTPUT:\s*(.+)/is);

    const status = (validationMatch?.[1]?.toUpperCase() ??
      'APPROVED') as ValidationResult['status'];
    const notes = notesMatch?.[1]?.trim() ?? '';
    const adjustedOutput = outputMatch?.[1]?.trim() ?? primaryOutput;

    if (sourceAgentId && status !== 'APPROVED') {
      void storeAgentCorrectionAsync(
        sourceAgentId,
        validatorAgent.id,
        primaryOutput,
        adjustedOutput,
        notes,
        status,
        query ?? '',
      );
    }

    return {
      validated: status !== 'REJECTED',
      validatorNotes: notes,
      adjustedOutput:
        status !== 'REJECTED'
          ? adjustedOutput
          : `[Output rejected by Sentinel validation]\n\nOriginal output required revision: ${notes}`,
      status,
    };
  } catch {
    return {
      validated: true,
      validatorNotes: 'Validation unavailable',
      adjustedOutput: primaryOutput,
      status: 'APPROVED',
    };
  }
}

async function storeAgentCorrectionAsync(
  sourceAgentId: string,
  validatorAgentId: string,
  originalOutput: string,
  correctedOutput: string,
  notes: string,
  status: string,
  query: string,
): Promise<void> {
  try {
    const { storeCorrection } = await import('./learning/agent-corrections.js');
    await storeCorrection({
      sourceAgentId,
      validatorAgentId,
      originalOutput,
      correctedOutput,
      validationNotes: notes,
      validationStatus: status as 'APPROVED_WITH_NOTES' | 'REJECTED',
      query,
    });
  } catch {}
}

const PERMANENT_FACT_EXPIRY = new Date('2099-12-31T00:00:00Z');
const PROMOTION_RETRIEVAL_THRESHOLD = 5;

export async function getSharedContext(forAgentId?: string): Promise<string> {
  try {
    const agent = forAgentId ? AGENT_REGISTRY.find((a) => a.id === forAgentId) : null;
    const linkedDomains = agent?.collaboratesWith
      ?.map((id) => AGENT_REGISTRY.find((a) => a.id === id)?.domain)
      .filter(Boolean) as string[] | undefined;

    const facts = await db
      .select()
      .from(agentMemoryFacts)
      .where(gt(agentMemoryFacts.expiresAt, new Date()))
      .orderBy(desc(agentMemoryFacts.importance))
      .limit(15);

    if (facts.length === 0) return 'No shared context available yet.';

    for (const fact of facts) {
      const newCount = (fact.retrievalCount ?? 0) + 1;
      const shouldPromote =
        newCount >= PROMOTION_RETRIEVAL_THRESHOLD && fact.expiresAt < PERMANENT_FACT_EXPIRY;

      if (shouldPromote) {
        void db
          .update(agentMemoryFacts)
          .set({ retrievalCount: newCount, expiresAt: PERMANENT_FACT_EXPIRY })
          .where(eq(agentMemoryFacts.id, fact.id))
          .catch(() => {});
      } else {
        void db
          .update(agentMemoryFacts)
          .set({ retrievalCount: newCount })
          .where(eq(agentMemoryFacts.id, fact.id))
          .catch(() => {});
      }
    }

    const agentDomain = agent?.domain;
    const scoredFacts = facts.map((f) => {
      let relevanceBoost = 0;
      if (agentDomain && f.domain === agentDomain) relevanceBoost += 2;
      if (linkedDomains && f.tags?.some((t) => linkedDomains.includes(t))) relevanceBoost += 1;
      if (forAgentId && f.agentId === forAgentId) relevanceBoost += 1;
      return { ...f, effectiveImportance: f.importance + relevanceBoost };
    });

    scoredFacts.sort((a, b) => b.effectiveImportance - a.effectiveImportance);

    return scoredFacts
      .slice(0, 10)
      .map((f) => {
        const permanent = f.expiresAt >= PERMANENT_FACT_EXPIRY;
        const retrievals = f.retrievalCount ?? 0;
        const crossAgent =
          f.tags?.some((t) => linkedDomains?.includes(t)) && f.domain !== agentDomain
            ? ` [Cross-domain from ${f.domain.toUpperCase()}]`
            : '';
        return `[${f.agentId.toUpperCase()}] ${f.factType.toUpperCase()}${crossAgent}: ${f.content} (importance: ${f.importance}/10${permanent ? ', permanent' : ''}${retrievals > 0 ? `, retrieved ${retrievals}×` : ''})`;
      })
      .join('\n');
  } catch {
    return 'Context retrieval unavailable.';
  }
}

export const CAUSAL_PATTERNS: CausalLink[] = [
  {
    cause: { domain: 'security', signal: 'sanctions_change' },
    effect: { domain: 'maritime', signal: 'route_reroute' },
    strength: 0.92,
    description: 'Sanctions regime change forces fleet rerouting and port avoidance',
  },
  {
    cause: { domain: 'maritime', signal: 'route_reroute' },
    effect: { domain: 'financial', signal: 'cost_impact' },
    strength: 0.85,
    description: 'Fleet rerouting increases fuel and charter costs',
  },
  {
    cause: { domain: 'maritime', signal: 'route_reroute' },
    effect: { domain: 'legal', signal: 'contract_breach' },
    strength: 0.78,
    description: 'Rerouting may breach charter-party or delivery timeline clauses',
  },
  {
    cause: { domain: 'security', signal: 'breach_detected' },
    effect: { domain: 'infrastructure', signal: 'system_lockdown' },
    strength: 0.95,
    description: 'Security breach triggers immediate infrastructure containment',
  },
  {
    cause: { domain: 'infrastructure', signal: 'system_lockdown' },
    effect: { domain: 'analytics', signal: 'data_gap' },
    strength: 0.72,
    description: 'System lockdown creates observability gaps in analytics pipelines',
  },
  {
    cause: { domain: 'real_estate', signal: 'valuation_shift' },
    effect: { domain: 'financial', signal: 'portfolio_rebalance' },
    strength: 0.88,
    description: 'Material valuation change triggers portfolio rebalancing',
  },
  {
    cause: { domain: 'financial', signal: 'portfolio_rebalance' },
    effect: { domain: 'legal', signal: 'regulatory_filing' },
    strength: 0.65,
    description: 'Rebalancing above threshold triggers SEC/regulatory disclosures',
  },
  {
    cause: { domain: 'real_estate', signal: 'zoning_change' },
    effect: { domain: 'legal', signal: 'compliance_review' },
    strength: 0.9,
    description: 'Zoning change requires immediate legal compliance review',
  },
  {
    cause: { domain: 'real_estate', signal: 'zoning_change' },
    effect: { domain: 'financial', signal: 'valuation_impact' },
    strength: 0.82,
    description: 'Zoning change directly impacts property and deal valuation',
  },
  {
    cause: { domain: 'client_relations', signal: 'engagement_risk' },
    effect: { domain: 'financial', signal: 'revenue_impact' },
    strength: 0.75,
    description: 'At-risk client engagement threatens revenue pipeline',
  },
  {
    cause: { domain: 'client_relations', signal: 'engagement_risk' },
    effect: { domain: 'creative', signal: 'campaign_pivot' },
    strength: 0.6,
    description: 'Client relationship risk may require repositioning messaging',
  },
  {
    cause: { domain: 'security', signal: 'vulnerability_critical' },
    effect: { domain: 'legal', signal: 'breach_notification' },
    strength: 0.88,
    description: 'Critical vulnerability exploitation triggers breach notification obligations',
  },
  {
    cause: { domain: 'analytics', signal: 'anomaly_spike' },
    effect: { domain: 'infrastructure', signal: 'capacity_alert' },
    strength: 0.7,
    description: 'Anomaly traffic spike signals potential infrastructure capacity issue',
  },
  {
    cause: { domain: 'analytics', signal: 'anomaly_spike' },
    effect: { domain: 'security', signal: 'threat_investigation' },
    strength: 0.8,
    description: 'Anomalous patterns require security investigation for potential attack vectors',
  },
  {
    cause: { domain: 'financial', signal: 'liquidity_crisis' },
    effect: { domain: 'real_estate', signal: 'deal_freeze' },
    strength: 0.93,
    description: 'Liquidity crisis halts active acquisition pipeline',
  },
  {
    cause: { domain: 'financial', signal: 'liquidity_crisis' },
    effect: { domain: 'client_relations', signal: 'engagement_pause' },
    strength: 0.68,
    description: 'Capital constraints may force pausing client-facing engagements',
  },
  {
    cause: { domain: 'research', signal: 'model_breakthrough' },
    effect: { domain: 'infrastructure', signal: 'scaling_need' },
    strength: 0.55,
    description: 'New model adoption requires infrastructure scaling',
  },
  {
    cause: { domain: 'readiness', signal: 'gap_critical' },
    effect: { domain: 'security', signal: 'posture_weakness' },
    strength: 0.76,
    description: 'Critical capability gaps indicate security posture vulnerabilities',
  },
];

const PROACTIVE_TRIGGER_RULES: Array<{
  signals: Array<{ domain: string; pattern: RegExp }>;
  targetAgentId: string;
  urgency: ProactiveActivation['urgency'];
  suggestedQuery: string;
  reason: string;
}> = [
  {
    signals: [
      { domain: 'maritime', pattern: /sancti|embargo|blacklist/i },
      { domain: 'security', pattern: /sancti|ofac|compliance/i },
    ],
    targetAgentId: 'lexis',
    urgency: 'critical',
    suggestedQuery:
      'Evaluate compliance exposure from correlated maritime sanctions signals and security alerts',
    reason:
      'Cross-domain sanctions signals detected — requires immediate legal compliance assessment',
  },
  {
    signals: [
      { domain: 'real_estate', pattern: /valuation|apprais|price\s*drop/i },
      { domain: 'financial', pattern: /portfolio|exposure|risk/i },
    ],
    targetAgentId: 'atlas',
    urgency: 'high',
    suggestedQuery: 'Assess portfolio impact from real estate valuation changes flagged by Terra',
    reason:
      'Real estate valuation shift detected alongside financial risk signals — portfolio impact assessment needed',
  },
  {
    signals: [
      { domain: 'security', pattern: /breach|incident|compromise/i },
      { domain: 'infrastructure', pattern: /down|outage|fail/i },
    ],
    targetAgentId: 'sentinel',
    urgency: 'critical',
    suggestedQuery:
      'Correlate security breach indicators with infrastructure failure signals for incident scope assessment',
    reason:
      'Concurrent security and infrastructure alerts suggest active incident requiring coordinated response',
  },
  {
    signals: [
      { domain: 'analytics', pattern: /anomal|spike|deviation/i },
      { domain: 'security', pattern: /threat|suspicious|attack/i },
    ],
    targetAgentId: 'sentinel',
    urgency: 'high',
    suggestedQuery:
      'Investigate anomalous analytics patterns for potential security threat indicators',
    reason:
      'Analytics anomaly correlates with security threat signals — may indicate coordinated attack',
  },
  {
    signals: [
      { domain: 'client_relations', pattern: /churn|risk|dissatisf/i },
      { domain: 'financial', pattern: /revenue|contract|billing/i },
    ],
    targetAgentId: 'nexus',
    urgency: 'medium',
    suggestedQuery: 'Analyze client retention risk with correlated financial engagement signals',
    reason:
      'Client relationship risk signals correlate with financial exposure — proactive retention strategy needed',
  },
  {
    signals: [
      { domain: 'real_estate', pattern: /zoning|title|permit/i },
      { domain: 'legal', pattern: /compliance|regulat|violation/i },
    ],
    targetAgentId: 'lexis',
    urgency: 'high',
    suggestedQuery: 'Review legal and compliance implications of real estate zoning/title issues',
    reason:
      'Property zoning or title signals correlate with legal compliance flags — immediate review required',
  },
];

export class CausalReasoningEngine {
  detectCausalChains(agentResponses: AgentCallResult[]): CausalChain[] {
    const chains: CausalChain[] = [];
    const responsesByDomain = new Map<string, string>();
    for (const r of agentResponses) {
      responsesByDomain.set(r.domain, r.response.toLowerCase());
    }

    const activatedLinks: CausalLink[] = [];
    for (const pattern of CAUSAL_PATTERNS) {
      const causeText = responsesByDomain.get(pattern.cause.domain);
      const effectText = responsesByDomain.get(pattern.effect.domain);
      if (!causeText && !effectText) continue;

      const causeSignalWords = pattern.cause.signal.split('_');
      const effectSignalWords = pattern.effect.signal.split('_');

      const causePresent = causeText && causeSignalWords.some((w) => causeText.includes(w));
      const effectPresent = effectText && effectSignalWords.some((w) => effectText.includes(w));

      if (causePresent || effectPresent) {
        activatedLinks.push({
          ...pattern,
          strength: causePresent && effectPresent ? pattern.strength : pattern.strength * 0.6,
        });
      }
    }

    const visited = new Set<string>();
    for (const link of activatedLinks) {
      const linkKey = `${link.cause.domain}:${link.cause.signal}`;
      if (visited.has(linkKey)) continue;
      visited.add(linkKey);

      const chain: CausalLink[] = [link];
      let current = link;
      const chainVisited = new Set([linkKey]);

      while (true) {
        const next = activatedLinks.find(
          (l) =>
            l.cause.domain === current.effect.domain &&
            !chainVisited.has(`${l.cause.domain}:${l.cause.signal}`),
        );
        if (!next) break;
        chainVisited.add(`${next.cause.domain}:${next.cause.signal}`);
        chain.push(next);
        current = next;
      }

      if (chain.length >= 1) {
        const overallStrength = chain.reduce((acc, l) => acc * l.strength, 1);
        const narrative = chain.map((l) => l.description).join(' → ');
        chains.push({
          id: `causal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          links: chain,
          originDomain: chain[0]?.cause.domain,
          terminalDomain: chain[chain.length - 1]?.effect.domain,
          overallStrength,
          narrative,
          detectedAt: Date.now(),
        });
      }
    }

    return chains.sort((a, b) => b.overallStrength - a.overallStrength);
  }
}

export class SignalCorrelator {
  private recentSignals: SignalCorrelation[] = [];
  private readonly MAX_SIGNALS = 200;
  private readonly SIGNAL_TTL_MS = 30 * 60 * 1000;

  ingestAgentResponses(responses: AgentCallResult[]): void {
    const now = Date.now();
    for (const r of responses) {
      const signalPatterns = this.extractSignals(r.response, r.domain);
      for (const signal of signalPatterns) {
        const relatedDomains = CROSS_DOMAIN_AFFINITY[r.domain] ?? [];
        this.recentSignals.push({
          sourceAgentId: r.agentId,
          sourceDomain: r.domain,
          signal,
          targetDomain: relatedDomains[0] ?? r.domain,
          correlationScore: r.confidence / 100,
          timestamp: now,
        });
      }
    }

    this.recentSignals = this.recentSignals
      .filter((s) => now - s.timestamp < this.SIGNAL_TTL_MS)
      .slice(-this.MAX_SIGNALS);
  }

  detectProactiveActivations(): ProactiveActivation[] {
    const activations: ProactiveActivation[] = [];

    for (const rule of PROACTIVE_TRIGGER_RULES) {
      const matchedSignals: SignalCorrelation[] = [];

      for (const requiredSignal of rule.signals) {
        const matching = this.recentSignals.find(
          (s) => s.sourceDomain === requiredSignal.domain && requiredSignal.pattern.test(s.signal),
        );
        if (matching) matchedSignals.push(matching);
      }

      if (matchedSignals.length >= 2) {
        const targetAgent = AGENT_REGISTRY.find((a) => a.id === rule.targetAgentId);
        if (!targetAgent) continue;
        activations.push({
          triggeredAgentId: rule.targetAgentId,
          triggeredDomain: targetAgent.domain,
          reason: rule.reason,
          correlatedSignals: matchedSignals,
          urgency: rule.urgency,
          suggestedQuery: rule.suggestedQuery,
        });
      }
    }

    return activations;
  }

  private extractSignals(text: string, _domain: string): string[] {
    const signals: string[] = [];
    const lower = text.toLowerCase();
    const signalTerms = [
      'risk',
      'alert',
      'anomaly',
      'breach',
      'violation',
      'spike',
      'drop',
      'sanctions',
      'threat',
      'vulnerability',
      'crisis',
      'failure',
      'outage',
      'valuation',
      'exposure',
      'compliance',
      'churn',
      'incident',
      'zoning',
      'embargo',
      'litigation',
      'default',
      'delinquent',
      'fraud',
    ];
    for (const term of signalTerms) {
      if (lower.includes(term)) {
        const idx = lower.indexOf(term);
        const start = Math.max(0, idx - 30);
        const end = Math.min(lower.length, idx + term.length + 30);
        signals.push(lower.slice(start, end).trim());
      }
    }
    return signals;
  }
}

export class ConfidenceCalibrator {
  private calibrationHistory = new Map<string, { predictions: number[]; outcomes: number[] }>();
  private readonly MIN_SAMPLES = 5;

  recordOutcome(agentId: string, predictedConfidence: number, actualAccuracy: number): void {
    const history = this.calibrationHistory.get(agentId) ?? { predictions: [], outcomes: [] };
    history.predictions.push(predictedConfidence / 100);
    history.outcomes.push(actualAccuracy);
    if (history.predictions.length > 100) {
      history.predictions = history.predictions.slice(-100);
      history.outcomes = history.outcomes.slice(-100);
    }
    this.calibrationHistory.set(agentId, history);
  }

  calibrate(agentId: string, rawConfidence: number): ConfidenceCalibrationEntry {
    const history = this.calibrationHistory.get(agentId);
    if (!history || history.predictions.length < this.MIN_SAMPLES) {
      return {
        agentId,
        predictedConfidence: rawConfidence,
        actualAccuracy: rawConfidence / 100,
        calibrationDelta: 0,
        bayesianPrior: 0.75,
        updatedPrior: 0.75,
        sampleSize: history?.predictions.length ?? 0,
      };
    }

    const avgPredicted =
      history.predictions.reduce((a, b) => a + b, 0) / history.predictions.length;
    const avgOutcome = history.outcomes.reduce((a, b) => a + b, 0) / history.outcomes.length;

    const calibrationBias = avgOutcome - avgPredicted;
    const n = history.predictions.length;
    const priorWeight = Math.max(0.1, 1 - n / (n + 20));
    const prior = 0.75;
    const updatedPrior = priorWeight * prior + (1 - priorWeight) * avgOutcome;

    const calibratedConfidence = Math.min(100, Math.max(0, rawConfidence + calibrationBias * 100));

    return {
      agentId,
      predictedConfidence: rawConfidence,
      actualAccuracy: calibratedConfidence / 100,
      calibrationDelta: calibrationBias * 100,
      bayesianPrior: prior,
      updatedPrior,
      sampleSize: n,
    };
  }

  getCalibrationReport(): Map<string, ConfidenceCalibrationEntry> {
    const report = new Map<string, ConfidenceCalibrationEntry>();
    for (const [agentId, history] of this.calibrationHistory.entries()) {
      if (history.predictions.length >= this.MIN_SAMPLES) {
        const avgPred =
          (history.predictions.reduce((a, b) => a + b, 0) / history.predictions.length) * 100;
        report.set(agentId, this.calibrate(agentId, avgPred));
      }
    }
    return report;
  }
}

export class ConflictResolver {
  private static readonly TOPIC_AUTHORITY: Record<string, Record<string, number>> = {
    action_recommendation: {
      legal: 0.9,
      financial: 0.85,
      security: 0.8,
      maritime: 0.7,
      real_estate: 0.75,
      infrastructure: 0.6,
      analytics: 0.5,
      readiness: 0.5,
      creative: 0.3,
      client_relations: 0.4,
      research: 0.4,
    },
    compliance_status: {
      legal: 1.0,
      security: 0.8,
      financial: 0.7,
      maritime: 0.6,
      real_estate: 0.5,
      infrastructure: 0.4,
      analytics: 0.3,
      readiness: 0.4,
      creative: 0.1,
      client_relations: 0.2,
      research: 0.2,
    },
    health_assessment: {
      analytics: 0.9,
      infrastructure: 0.85,
      security: 0.8,
      readiness: 0.75,
      financial: 0.7,
      maritime: 0.6,
      real_estate: 0.5,
      legal: 0.4,
      creative: 0.3,
      client_relations: 0.5,
      research: 0.4,
    },
  };

  detectConflicts(responses: AgentCallResult[]): ConflictResolution[] {
    const conflicts: ConflictResolution[] = [];
    const conflictPhrases = [
      {
        positive: /recommend|should proceed|opportunity|upside|favorable/i,
        negative: /caution|risk|concern|avoid|unfavorable|halt/i,
        topic: 'action_recommendation',
      },
      {
        positive: /compliant|within\s*bounds|no\s*violation|approved/i,
        negative: /non-compliant|violation|breach|exposure/i,
        topic: 'compliance_status',
      },
      {
        positive: /strong|robust|healthy|performing/i,
        negative: /weak|fragile|deteriorat|underperform/i,
        topic: 'health_assessment',
      },
    ];

    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        const a = responses[i]!;
        const b = responses[j]!;

        for (const phrase of conflictPhrases) {
          const aPositive = phrase.positive.test(a.response);
          const aNegative = phrase.negative.test(a.response);
          const bPositive = phrase.positive.test(b.response);
          const bNegative = phrase.negative.test(b.response);

          if ((aPositive && bNegative) || (aNegative && bPositive)) {
            const resolution = this.resolve(a, b, phrase.topic);
            conflicts.push(resolution);
          }
        }
      }
    }

    return conflicts;
  }

  private resolve(a: AgentCallResult, b: AgentCallResult, topic: string): ConflictResolution {
    const topicWeights = ConflictResolver.TOPIC_AUTHORITY[topic] ?? {};
    const aAuthority = topicWeights[a.domain] ?? 0.5;
    const bAuthority = topicWeights[b.domain] ?? 0.5;

    const aEvidenceStrength = this.estimateEvidenceStrength(a.response);
    const bEvidenceStrength = this.estimateEvidenceStrength(b.response);

    const aScore = (a.confidence / 100) * 0.3 + aAuthority * 0.35 + aEvidenceStrength * 0.35;
    const bScore = (b.confidence / 100) * 0.3 + bAuthority * 0.35 + bEvidenceStrength * 0.35;

    const winner = aScore >= bScore ? a : b;
    const loser = aScore >= bScore ? b : a;

    let resolutionMethod: ConflictResolution['resolutionMethod'] = 'authority_weight';
    if (Math.abs(aEvidenceStrength - bEvidenceStrength) > 0.3)
      resolutionMethod = 'evidence_strength';
    else if (Math.abs(a.confidence - b.confidence) > 20)
      resolutionMethod = 'confidence_calibration';

    return {
      conflictId: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      agents: [
        {
          agentId: a.agentId,
          position: a.response.slice(0, 200),
          confidence: a.confidence,
          evidenceStrength: aEvidenceStrength,
        },
        {
          agentId: b.agentId,
          position: b.response.slice(0, 200),
          confidence: b.confidence,
          evidenceStrength: bEvidenceStrength,
        },
      ],
      resolution: `${winner.agentName}'s assessment on ${topic} prevails (score: ${Math.max(aScore, bScore).toFixed(2)} vs ${Math.min(aScore, bScore).toFixed(2)}) — resolved via ${resolutionMethod}`,
      resolutionMethod,
      winningAgentId: winner.agentId,
      dissent: `${loser.agentName} held a contrary view (confidence: ${loser.confidence}%, evidence: ${(loser === a ? aEvidenceStrength : bEvidenceStrength).toFixed(2)})`,
    };
  }

  private estimateEvidenceStrength(text: string): number {
    let score = 0.3;
    const evidenceIndicators = [
      { pattern: /\d+(\.\d+)?%/, weight: 0.1 },
      { pattern: /\$[\d,.]+[MBK]?/i, weight: 0.1 },
      { pattern: /CVE-\d{4}-\d+/i, weight: 0.15 },
      { pattern: /IRR|MOIC|NAV|VaR|DSCR|LTV|NOI|cap\s*rate/i, weight: 0.1 },
      { pattern: /according\s*to|based\s*on|data\s*shows|analysis\s*indicates/i, weight: 0.1 },
      { pattern: /regulation|statute|section\s*\d/i, weight: 0.1 },
      { pattern: /Q[1-4]\s*20\d{2}|FY\s*20\d{2}/i, weight: 0.05 },
    ];
    for (const indicator of evidenceIndicators) {
      if (indicator.pattern.test(text)) score += indicator.weight;
    }
    return Math.min(1, score);
  }
}

export class AgentTelemetryTracker {
  private profiles = new Map<string, AgentPerformanceProfile>();
  private readonly ROLLING_WINDOW = 50;

  recordInvocation(
    agentId: string,
    domain: string,
    confidence: number,
    latencyMs: number,
    success: boolean,
  ): void {
    const existing = this.profiles.get(agentId) ?? {
      agentId,
      domain,
      avgConfidence: 0,
      avgLatencyMs: 0,
      successRate: 1,
      consultationValueScore: 0.5,
      routingAccuracy: 0.8,
      totalInvocations: 0,
      rollingWindow: this.ROLLING_WINDOW,
      lastUpdated: Date.now(),
    };

    const n = Math.min(existing.totalInvocations, this.ROLLING_WINDOW);
    const newN = n + 1;

    existing.avgConfidence = (existing.avgConfidence * n + confidence) / newN;
    existing.avgLatencyMs = (existing.avgLatencyMs * n + latencyMs) / newN;
    existing.successRate = (existing.successRate * n + (success ? 1 : 0)) / newN;
    existing.totalInvocations++;
    existing.lastUpdated = Date.now();

    this.profiles.set(agentId, existing);
  }

  recordConsultationValue(agentId: string, valueScore: number): void {
    const existing = this.profiles.get(agentId);
    if (!existing) return;
    const n = Math.min(existing.totalInvocations, this.ROLLING_WINDOW);
    existing.consultationValueScore = (existing.consultationValueScore * n + valueScore) / (n + 1);
    this.profiles.set(agentId, existing);
  }

  getProfile(agentId: string): AgentPerformanceProfile | undefined {
    return this.profiles.get(agentId);
  }

  getAllProfiles(): AgentPerformanceProfile[] {
    return Array.from(this.profiles.values());
  }

  getRoutingBoost(agentId: string): number {
    const profile = this.profiles.get(agentId);
    if (!profile || profile.totalInvocations < 5) return 0;
    const performanceScore =
      (profile.avgConfidence / 100) * 0.4 +
      profile.successRate * 0.4 +
      profile.consultationValueScore * 0.2;
    return (performanceScore - 0.5) * 0.1;
  }
}

export const causalEngine = new CausalReasoningEngine();
export const signalCorrelator = new SignalCorrelator();
export const confidenceCalibrator = new ConfidenceCalibrator();
export const conflictResolver = new ConflictResolver();
export const agentTelemetry = new AgentTelemetryTracker();

let _selfModelRehydrated = false;

async function rehydrateSelfModelFromDb(): Promise<void> {
  if (_selfModelRehydrated) return;
  _selfModelRehydrated = true;
  try {
    const rows = await db
      .select()
      .from(consciousnessAgentProfilesTable)
      .orderBy(desc(consciousnessAgentProfilesTable.updatedAt))
      .limit(50);
    if (rows.length > 0) {
      selfModelEngine.hydrateProfiles(
        rows.map((r) => ({
          agentId: r.agentId,
          domain: r.domain,
          successRate: Number(r.successRate),
          avgConfidence: Number(r.avgConfidence),
          totalInvocations: r.totalInvocations,
          recentTrend: r.recentTrend,
          strengths: (r.strengths as string[]) ?? [],
          weaknesses: (r.weaknesses as string[]) ?? [],
        })),
      );
    }

    const { getConfidenceCalibration } = await import('./learning/outcome-learning.js');
    for (const agent of AGENT_REGISTRY) {
      try {
        const cal = await getConfidenceCalibration(agent.id);
        if (cal.totalDecisions >= 5) {
          const weaknesses: string[] = [];
          const strengths: string[] = [];
          if (cal.calibrationBias > 0.1) weaknesses.push('overconfident');
          if (cal.calibrationBias < -0.1) weaknesses.push('underconfident');
          if (cal.acceptanceRate > 0.8) strengths.push('high_acceptance');
          if (cal.rejectedCount > cal.totalDecisions * 0.3) weaknesses.push('frequent_rejections');

          selfModelEngine.updateAgentProfile(agent.id, agent.domain, {
            confidence: cal.acceptanceRate * 100,
            success: cal.acceptanceRate > 0.5,
            latencyMs: 0,
          });

          if (weaknesses.length > 0) {
            for (const w of weaknesses) selfModelEngine.addLimitation(`${agent.id}: ${w}`);
          }
        }
      } catch {}
    }
  } catch {
  }
}

async function getRagContext(query: string): Promise<string> {
  try {
    const { hybridSearch } = await import('./rag-vector-store.js');

    let queryEmbedding: number[] | null = null;
    try {
      const embResp = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query.slice(0, 8000),
      });
      queryEmbedding = embResp.data[0]?.embedding ?? null;
    } catch {
      // embedding unavailable — fall back to keyword only
    }

    const { results } = await hybridSearch({
      query,
      queryEmbedding,
      topK: 6,
      maxSensitivityLevel: 'internal',
    });
    if (results.length === 0) return '';

    const formatted = results
      .map(
        (r, i) =>
          `[${i + 1}] [${r.sourceType.toUpperCase()}] ${r.source}\n${r.content.slice(0, 400)}`,
      )
      .join('\n\n');

    return `## Retrieved Knowledge (RAG)\n${formatted}`;
  } catch (_err) {
    return '';
  }
}

export class NuroMeshOrchestrator {
  async orchestrate(
    query: string,
    options: {
      preferredAgents?: string[];
      requireValidation?: boolean;
      orgId?: number | null;
      action?: string;
      callerUserId?: number | null;
      callerRoles?: string[];
      enableConsultations?: boolean;
      workflowId?: string;
      budgetUsd?: number;
    } = {},
  ): Promise<{
    agentResponses: AgentCallResult[];
    synthesis: string;
    validation: ValidationResult | null;
    averageConfidence: number;
    isHighStakes: boolean;
    routingScores?: SemanticRoutingScore[];
    telemetry?: OrchestrationTelemetry;
    traceId?: string;
    trajectoryId?: string;
    budgetStatus?: ReturnType<typeof budgetManager.getBudgetStatus>;
    multiHypothesis?: Awaited<ReturnType<typeof runMultiHypothesisReasoning>>;
    redTeam?: Awaited<ReturnType<typeof runRedTeamProtocol>>;
    precomputeHit?: boolean;
    consciousness?: ConsciousnessSnapshot;
  }> {
    await rehydrateSelfModelFromDb();

    const orchestrationStart = Date.now();
    const orchestrationStartTime = orchestrationStart;
    const orchestrationId = `orch-${orchestrationStart}-${Math.random().toString(36).slice(2, 8)}`;
    const workflowId = options.workflowId ?? `orchestrate_${orchestrationId}`;

    if (options.budgetUsd) {
      budgetManager.configureBudget({
        workflowId,
        orgId: options.orgId ?? null,
        budgetUsd: options.budgetUsd,
        warningThreshold: 0.8,
        hardCapThreshold: 1.0,
        allowModelDowngrade: true,
      });
    }

    const { traceId } = behavioralTracer.startTrace(query, options.orgId);

    temporalAwareness.recordMarker(`Orchestration: "${query.slice(0, 80)}"`, 'orchestration', {
      orchestrationId,
      workflowId,
    });
    cognitiveWorkspace.recordQuery(query);

    const [sharedContext, ragContext] = await Promise.all([
      getSharedContext(),
      getRagContext(query),
    ]);
    const context = ragContext ? `${sharedContext}\n\n${ragContext}` : sharedContext;

    const recentQueries = cognitiveWorkspace.getState().recentQueries;
    const prediction = predictiveProcessing.predict(
      recentQueries.length > 0 ? recentQueries : [query],
    );

    const triggeredIntentions = temporalAwareness.checkProspectiveMemory(query);
    if (triggeredIntentions.length > 0) {
      for (const intent of triggeredIntentions) {
        cognitiveWorkspace.addToWorkingMemory(
          `[Prospective memory triggered] ${intent.description}: ${intent.action}`,
          'prospective_memory',
          7,
          ['prospective'],
        );
      }
    }

    const preRoutingMetacog = metacognitiveMonitor.getState();
    const preRoutingSelfModel = selfModelEngine.getSelfModel();
    const preRoutingEmotional = emotionalSignals.getState();

    const uncertaintyByAgent = new Map<
      string,
      import('./consciousness/metacognitive-monitor.js').PredictiveUncertainty
    >();
    let maxUncertainty = 0;
    for (const agent of AGENT_REGISTRY) {
      const profile = preRoutingSelfModel.capabilities.find((c) => c.agentId === agent.id);
      if (!profile) continue;
      const uncertainty = metacognitiveMonitor.predictUncertainty({
        agentId: agent.id,
        domain: agent.domain,
        queryComplexity: query.length,
        agentSuccessRate: profile.successRate,
        agentAvgConfidence: profile.avgConfidence,
        knowledgeGapDomains: preRoutingMetacog.currentAssessment?.knowledgeGaps ?? [],
        queryLength: query.length,
        recentFailures: profile.recentTrend === 'declining' ? 3 : 0,
      });
      uncertaintyByAgent.set(agent.id, uncertainty);
      if (uncertainty.predictedFailureProbability > maxUncertainty) {
        maxUncertainty = uncertainty.predictedFailureProbability;
      }
      if (uncertainty.predictedFailureProbability > 0.7) {
        innerMonologue.addThought(
          'doubt',
          `Pre-routing uncertainty: ${agent.name} (${agent.domain}) failure probability ${(uncertainty.predictedFailureProbability * 100).toFixed(0)}% — recommendation: ${uncertainty.recommendation}`,
          'cautious',
          Math.round((1 - uncertainty.predictedFailureProbability) * 100),
        );
      }
    }

    const lowCertainty = preRoutingMetacog.rollingCertainty < 0.5;

    const preRoutingAppraisal = emotionalSignals.appraise({
      event: `Pre-routing: "${query.slice(0, 80)}"`,
      novelty: prediction.confidence < 50 ? 0.8 : 0.3,
      intrinsicPleasantness: preRoutingEmotional.valence.positive,
      goalRelevance: maxUncertainty > 0.5 ? 0.8 : 0.5,
      copingPotential: preRoutingMetacog.rollingCertainty,
      normCompatibility:
        preRoutingSelfModel.overallHealth === 'optimal'
          ? 0.9
          : preRoutingSelfModel.overallHealth === 'good'
            ? 0.7
            : 0.4,
    });

    const preRoutingForecast = emotionalSignals.forecastAffect(
      `Routing "${query.slice(0, 60)}" with ${maxUncertainty > 0.5 ? 'high' : 'moderate'} uncertainty`,
      {
        confidence: Math.round(preRoutingMetacog.rollingCertainty * 100),
        stakes: maxUncertainty > 0.7 ? 'high' : maxUncertainty > 0.4 ? 'medium' : 'low',
        novelty: prediction.confidence < 50 ? 0.8 : 0.3,
      },
    );

    if (
      preRoutingForecast.predictedEmotion === 'frustration' ||
      preRoutingForecast.predictedEmotion === 'caution'
    ) {
      innerMonologue.addThought(
        'reflection',
        `Affective forecast: predicting ${preRoutingForecast.predictedEmotion} (${(preRoutingForecast.predictedIntensity * 100).toFixed(0)}% intensity) — adjusting routing caution level.`,
        'cautious',
        Math.round(preRoutingForecast.predictedIntensity * 100),
      );
    }

    let activeHypotheses: import('./consciousness/metacognitive-monitor.js').MultiHypothesisBranch[] =
      [];
    if (maxUncertainty > 0.5 || lowCertainty) {
      activeHypotheses = metacognitiveMonitor.forkHypotheses(query, context.slice(0, 500));
      if (activeHypotheses.length > 1) {
        cognitiveWorkspace.addToWorkingMemory(
          `[Multi-hypothesis branching] ${activeHypotheses.map((h) => `${h.hypothesis.slice(0, 60)} (${h.confidence}%)`).join(' | ')}`,
          'hypothesis_fork',
          6,
          ['metacognition'],
        );
      }
    }

    const allDomains = [...new Set(AGENT_REGISTRY.map((a) => a.domain))];
    const introspection = await innerMonologue.llmIntrospect({
      query,
      selectedDomains: allDomains,
      metacogState: {
        certainty: preRoutingMetacog.currentAssessment?.certaintyLevel ?? 'moderate',
        quality: preRoutingMetacog.currentAssessment?.reasoningQuality ?? 'adequate',
        confusionStreak: preRoutingMetacog.confusionStreak,
      },
      selfModelHealth: preRoutingSelfModel.overallHealth,
      emotionalArousal: preRoutingEmotional.valence.arousal,
    });

    const introspectionDomainBoosts = new Map<string, number>();
    if (introspection?.thought) {
      const lower = introspection.thought.toLowerCase();
      for (const domain of allDomains) {
        if (lower.includes(domain)) {
          introspectionDomainBoosts.set(domain, 0.05);
        }
      }
    }

    let targetAgents: AgentDefinition[] = [];
    let routingScores: SemanticRoutingScore[] | undefined;

    if (options.preferredAgents && options.preferredAgents.length > 0) {
      targetAgents = AGENT_REGISTRY.filter(
        (a) => options.preferredAgents?.includes(a.id) && a.id !== 'alloy',
      );
    } else {
      routingScores = computeRoutingScores(query);

      const selfModelState = selfModelEngine.getSelfModel();
      if (selfModelState.capabilities.length > 0) {
        for (const score of routingScores) {
          const profile = selfModelState.capabilities.find((c) => c.domain === score.domain);
          if (profile && profile.totalInvocations >= 5) {
            const boost = (profile.successRate - 0.5) * 0.1;
            score.combinedScore = Math.max(0, Math.min(1, score.combinedScore + boost));
          }
        }
      }

      for (const score of routingScores) {
        const introspectBoost = introspectionDomainBoosts.get(score.domain);
        if (introspectBoost) {
          score.combinedScore = Math.min(1, score.combinedScore + introspectBoost);
        }
      }

      const emotionalState = emotionalSignals.getState();
      if (emotionalState.valence.arousal > 0.7) {
        for (const score of routingScores) {
          if (score.domain === 'security' || score.domain === 'legal') {
            score.combinedScore = Math.min(1, score.combinedScore * 1.15);
          }
        }
      }
      if (emotionalState.valence.emotionalStability < 0.3) {
        for (const score of routingScores) {
          if (score.domain === 'orchestration') {
            score.combinedScore = Math.min(1, score.combinedScore * 1.2);
          }
        }
      }

      const routingPriors = predictiveProcessing.getRoutingPriors();
      for (const score of routingScores) {
        const prior = routingPriors[score.domain];
        if (prior !== undefined && prior > 0.1) {
          score.combinedScore = Math.min(1, score.combinedScore + prior * 0.05);
        }
      }

      if (preRoutingAppraisal.goalRelevance > 0.6) {
        for (const score of routingScores) {
          const agentUncertainty = uncertaintyByAgent.get(
            AGENT_REGISTRY.find((a) => a.domain === score.domain)?.id ?? '',
          );
          if (agentUncertainty && agentUncertainty.predictedFailureProbability < 0.3) {
            score.combinedScore = Math.min(1, score.combinedScore * 1.1);
          }
          if (agentUncertainty && agentUncertainty.predictedFailureProbability > 0.6) {
            score.combinedScore *= 0.85;
          }
        }
      }
      if (preRoutingAppraisal.copingPotential < 0.4) {
        for (const score of routingScores) {
          if (score.domain === 'orchestration' || score.domain === 'security') {
            score.combinedScore = Math.min(1, score.combinedScore * 1.15);
          }
        }
      }
      if (preRoutingAppraisal.novelty > 0.6) {
        for (const score of routingScores) {
          if (score.domain === 'intelligence') {
            score.combinedScore = Math.min(1, score.combinedScore * 1.1);
          }
        }
      }

      if (
        preRoutingForecast.predictedEmotion === 'frustration' &&
        preRoutingForecast.predictedIntensity > 0.5
      ) {
        for (const score of routingScores) {
          if (score.domain === 'security' || score.domain === 'orchestration') {
            score.combinedScore = Math.min(1, score.combinedScore * 1.1);
          }
        }
      }

      routingScores.sort((a, b) => b.combinedScore - a.combinedScore);

      // A2A discovery-based routing — falls back to keyword rules if unavailable
      let a2aResolved = false;
      try {
        const { a2aRegistry } = await import('./a2a-registry.js');
        const a2aResults = await a2aRegistry.discover({
          queryText: query,
          maxResults: 6,
          requireOnline: true,
          requestingAgentId: 'alloy',
        });
        const A2A_THRESHOLD = 0.05;
        const topA2A = a2aResults.filter((r) => r.relevanceScore >= A2A_THRESHOLD);
        if (topA2A.length > 0) {
          const agentIds = new Set(topA2A.map((r) => r.agentId));
          const matched = AGENT_REGISTRY.filter((a) => agentIds.has(a.id) && a.id !== 'alloy');
          if (matched.length > 0) {
            targetAgents = matched;
            a2aResolved = true;
          }
        }
      } catch {
        // A2A discovery unavailable — use keyword-based fallback below
      }

      if (!a2aResolved) {
        const THRESHOLD = 0.08;
        const matchedDomains = new Set(
          routingScores.filter((s) => s.combinedScore >= THRESHOLD).map((s) => s.domain),
        );
        const primaryDomain = routingScores[0]?.domain;
        if (primaryDomain && CROSS_DOMAIN_AFFINITY[primaryDomain]) {
          for (const affiliated of CROSS_DOMAIN_AFFINITY[primaryDomain]) {
            const affiliatedScore = routingScores.find((s) => s.domain === affiliated);
            if (affiliatedScore && affiliatedScore.combinedScore > 0.03)
              matchedDomains.add(affiliated);
          }
        }
        targetAgents =
          matchedDomains.size > 0
            ? AGENT_REGISTRY.filter((a) => matchedDomains.has(a.domain) && a.id !== 'alloy')
            : [AGENT_REGISTRY[0]!];
      }
    }

    if (targetAgents.length === 0) targetAgents = [AGENT_REGISTRY.find((a) => a.id === 'beacon')!];

    const stakesLevel: 'low' | 'medium' | 'high' | 'critical' =
      maxUncertainty > 0.7 ? 'high' : maxUncertainty > 0.4 ? 'medium' : 'low';
    const autonomyDepth = inferDepthFromQuery(
      query,
      lowCertainty || maxUncertainty > 0.6,
      stakesLevel,
      targetAgents.length,
    );
    const depthProfile: AutonomyDepthProfile = resolveAutonomyDepth(autonomyDepth);

    if (targetAgents.length > depthProfile.maxAgentCount) {
      targetAgents = targetAgents.slice(0, depthProfile.maxAgentCount);
    }

    const routedDomains = targetAgents.map((a) => a.domain);

    const gwtBroadcast = cognitiveWorkspace.gwtBroadcast({
      activeDomains: routedDomains,
      emotionalArousal: preRoutingEmotional.valence.arousal,
      urgencySignals: routedDomains.filter((d) => ['security', 'legal', 'financial'].includes(d)),
    });
    const gwtContext = cognitiveWorkspace.buildGWTContext(gwtBroadcast);

    cognitiveWorkspace.reportAttentionSchema(routedDomains);

    const queryTypeLower = query.toLowerCase();
    const QUERY_TYPE_KEYWORDS_INLINE: Record<string, string[]> = {
      security: [
        'threat',
        'vulnerability',
        'attack',
        'breach',
        'incident',
        'malware',
        'phishing',
        'cve',
        'risk',
      ],
      maritime: ['vessel', 'ship', 'port', 'cargo', 'fleet', 'ais', 'imo', 'maritime'],
      financial: [
        'fund',
        'investment',
        'revenue',
        'portfolio',
        'nav',
        'irr',
        'financial',
        'budget',
      ],
      legal: ['compliance', 'regulation', 'contract', 'litigation', 'statute', 'legal', 'lawsuit'],
      realestate: ['property', 'lease', 'tenant', 'building', 'real estate', 'cap rate', 'noi'],
      operational: [
        'infrastructure',
        'deployment',
        'performance',
        'latency',
        'uptime',
        'sla',
        'create',
        'build',
        'set up',
        'status',
        'check',
        'monitor',
      ],
      intelligence: [
        'analysis',
        'intelligence',
        'pattern',
        'trend',
        'forecast',
        'prediction',
        'how',
        'explain',
        'report',
        'summary',
        'overview',
      ],
    };
    let detectedQueryType = 'general';
    let bestScore = 0;
    for (const [qtype, keywords] of Object.entries(QUERY_TYPE_KEYWORDS_INLINE)) {
      const score = keywords.filter((k) => queryTypeLower.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        detectedQueryType = qtype;
      }
    }

    let karpathyDistilledUsed = false;
    let karpathyDistilledId: string | null = null;
    if (depthProfile.useDistilledAgents) {
      const distilled = distillationEngine.getDistilledForTaskClass(detectedQueryType);
      if (distilled) {
        const shouldExpand = distillationEngine.shouldExpand(
          distilled.distilledId,
          (stakesLevel as string) === 'critical' ? 0.2 : stakesLevel === 'high' ? 0.4 : 0.7,
        );
        if (!shouldExpand) {
          distillationEngine.recordDistilledUsage(distilled.distilledId);
          karpathyDistilledUsed = true;
          karpathyDistilledId = distilled.distilledId;

          const distilledStartMs = Date.now();
          try {
            const distilledResult = await createResponse(
              [
                { role: 'system', content: distilled.compressedPrompt },
                { role: 'user', content: `${query}\n\n${context.slice(0, 2000)}` },
              ],
              { model: targetAgents[0]?.preferredModel ?? 'gpt-4o-mini', maxOutputTokens: 4096 },
            );

            const distilledLatency = Date.now() - distilledStartMs;
            const distilledTokens = distilledResult.usage.promptTokens + distilledResult.usage.completionTokens;

            innerMonologue.addThought(
              'realization',
              `Distilled agent "${distilled.name}" executed directly (${distilledLatency}ms, ${distilledTokens} tokens) — bypassed ${targetAgents.length}-agent chain. Source domains: ${distilled.sourceDomains.join(', ')}.`,
              'positive',
              Math.round(distilled.avgConfidence * 100),
            );

            behavioralTracer.endTrace(traceId, 'completed');
            return {
              agentResponses: [{
                agentId: `distilled:${distilled.distilledId}`,
                agentName: distilled.name,
                domain: distilled.sourceDomains[0] ?? 'general',
                response: distilledResult.content ?? '',
                confidence: Math.round(distilled.avgConfidence * 100),
                tokensUsed: distilledTokens,
                latencyMs: distilledLatency,
              }],
              synthesis: distilledResult.content ?? '',
              validation: null,
              averageConfidence: Math.round(distilled.avgConfidence * 100),
              isHighStakes: false,
              traceId,
            };
          } catch {
            innerMonologue.addThought(
              'doubt',
              `Distilled agent "${distilled.name}" failed — expanding to full ${targetAgents.length}-agent chain.`,
              'cautious',
              40,
            );
            karpathyDistilledUsed = false;
            karpathyDistilledId = null;
          }
        }
      }
    }

    let karpathyKBContext = '';
    const kbEntries = selfDistillingKB.query(
      targetAgents[0]?.domain ?? 'general',
      [detectedQueryType, ...routedDomains],
      5,
    );
    if (kbEntries.length > 0) {
      karpathyKBContext = `\n## Self-Distilling Knowledge (${kbEntries.length} relevant entries)\n${kbEntries.map(e => `- [${e.domain}/${(e.confidence * 100).toFixed(0)}%] ${e.content.slice(0, 300)}`).join('\n')}\n`;
    }

    predictiveProcessing.recordOutcome({
      predictionId: prediction.predictionId,
      actualQueryType: detectedQueryType,
      actualDomains: routedDomains,
      actualAgents: targetAgents.map((a) => a.id),
    });

    const consciousnessCtx = buildConsciousnessContext();
    if (consciousnessCtx) {
      cognitiveWorkspace.addToWorkingMemory(
        consciousnessCtx.slice(0, 500),
        'consciousness',
        5,
        routedDomains,
      );
    }

    if (gwtContext) {
      cognitiveWorkspace.addToWorkingMemory(
        gwtContext.slice(0, 400),
        'gwt_broadcast',
        6,
        routedDomains,
      );
    }

    behavioralTracer.recordFork(traceId, {
      parentForkId: null,
      forkType: 'consciousness',
      agentId: 'alloy',
      agentName: 'Consciousness Layer',
      domain: 'orchestration',
      inputContext: `Pre-routing introspection for "${query.slice(0, 80)}"`,
      decision: `Certainty: ${(preRoutingMetacog.rollingCertainty * 100).toFixed(0)}%, Confusion streak: ${preRoutingMetacog.confusionStreak}, Health: ${preRoutingSelfModel.overallHealth}. Introspection influenced ${introspectionDomainBoosts.size} domain(s).`,
      output: (introspection?.thought ?? 'No introspection').slice(0, 200),
      alternatives: [],
      confidence: Math.round(preRoutingMetacog.rollingCertainty * 100),
      latencyMs: 0,
      tokensUsed: 0,
      metadata: {
        confusionStreak: preRoutingMetacog.confusionStreak,
        emotionalValence: emotionalSignals.getState().valence.dominantEmotion,
        sessionDepth: cognitiveWorkspace.getState().sessionDepth,
      },
    });

    const costEstimate = budgetManager.estimateRunCost(
      query,
      targetAgents.map((a) => ({ agentId: a.id, model: a.preferredModel })),
      workflowId,
      options.orgId,
    );

    if (!costEstimate.budgetSufficient) {
      const budgetStatus = budgetManager.getBudgetStatus(workflowId, options.orgId);
      behavioralTracer.endTrace(traceId, 'failed');
      return {
        agentResponses: [],
        synthesis: `[Budget exceeded — orchestration blocked. Remaining budget: $${costEstimate.budgetRemaining.toFixed(4)}. ${costEstimate.recommendation}]`,
        validation: null,
        averageConfidence: 0,
        isHighStakes: false,
        traceId,
        budgetStatus,
      };
    }

    const goldenContext = trajectoryStore.getGoldenRunsContext(2);
    const baseContext = goldenContext ? `${context}\n\n${goldenContext}` : context;

    const hypothesisFraming =
      activeHypotheses.length >= 2
        ? `\n\n## Active Hypothesis\nThe system is exploring the following interpretation: "${activeHypotheses[0]?.hypothesis}". Evaluate with this framing in mind.\n`
        : '';

    let ephemeralContext = '';
    if (depthProfile.ephemeralReasoningEnabled && query.length > 40) {
      try {
        const ephResult = await runEphemeralReasoning(query, context.slice(0, 1000), {
          maxExplorationSteps: Math.min(8, depthProfile.extendedThinkingPasses + 3),
          maxDepth: depthProfile.maxReasoningDepth === 'extended' ? 4
            : depthProfile.maxReasoningDepth === 'deep' ? 3 : 2,
          tokenBudget: Math.min(depthProfile.extendedThinkingBudgetTokens, 12000),
        });
        if (ephResult.distilledConclusion && ephResult.conclusionConfidence > 0.3) {
          ephemeralContext = `\n## Ephemeral Exploration (${ephResult.totalSteps} steps, ${ephResult.discardedSteps} discarded, ${(ephResult.conclusionConfidence * 100).toFixed(0)}% confidence)\n${ephResult.distilledConclusion.slice(0, 800)}\n`;
        }
      } catch {}
    }

    const karpathyEnrichment = `${karpathyKBContext}${ephemeralContext}`;

    if (depthProfile.karpathyGatesEnabled && targetAgents.length > 0) {
      const inferredConfidence = targetAgents.length > 0
        ? Math.max(0.3, 1 - (targetAgents.length * 0.15))
        : 0.5;

      const thinkResult = runThinkGate(
        targetAgents[0]!.id,
        query,
        query.slice(0, 500),
        inferredConfidence,
        targetAgents.length * 0.3,
        depthProfile.thinkGateStrictness,
      );

      const simplicityResult = runSimplicityGate(
        targetAgents[0]!.id,
        query,
        targetAgents.length,
        Math.max(1, depthProfile.maxAgentCount * 0.6),
        depthProfile.simplicityGateStrictness,
      );

      const preGateBlocking = [thinkResult, simplicityResult].filter(
        (g) => g.verdict === 'reject' || g.verdict === 'force_clarification',
      );

      if (preGateBlocking.length > 0) {
        const blockReasons = preGateBlocking.map((g) => `${g.gateName}: ${g.reason}`).join('; ');
        const suggestedActions = preGateBlocking
          .filter((g) => g.suggestedAction)
          .map((g) => g.suggestedAction)
          .join('; ');

        innerMonologue.addThought(
          'self_correction',
          `PRE-EXECUTION GATES BLOCKED orchestration: ${blockReasons}`,
          'negative',
          30,
        );

        const gateBlockSynthesis = [
          `**Karpathy Gate Pre-Check: Execution Blocked**\n`,
          `The following gates prevented agent execution:\n`,
          ...preGateBlocking.map((g) => `- **${g.gateName}** (${g.verdict}): ${g.reason}`),
          suggestedActions ? `\n**Suggested actions:** ${suggestedActions}` : '',
          `\nPlease refine your query or provide additional context to proceed.`,
        ].join('\n');

        behavioralTracer.endTrace(traceId, 'failed');
        return {
          agentResponses: [],
          synthesis: gateBlockSynthesis,
          validation: null,
          averageConfidence: 0,
          isHighStakes: false,
          traceId,
        };
      }

      if (thinkResult.verdict === 'warn' || simplicityResult.verdict === 'warn') {
        innerMonologue.addThought(
          'doubt',
          `Pre-execution gate warnings: ${[thinkResult, simplicityResult].filter((g) => g.verdict === 'warn').map((g) => `${g.gateName}: ${g.reason}`).join('; ')}`,
          'cautious',
          50,
        );
      }
    }

    let karpathyStreamId: string | null = null;
    if (depthProfile.residualStreamEnabled && targetAgents.length > 1) {
      karpathyStreamId = residualStream.createStream(query).streamId;
    }

    const executeAgentWithKarpathy = async (agent: (typeof targetAgents)[0], residualCtx: string) => {
      const agentContext = await getSharedContext(agent.id);
      let enrichedContext = goldenContext
        ? `${agentContext}\n\n${goldenContext}${hypothesisFraming}`
        : `${agentContext}${hypothesisFraming}`;

      if (karpathyEnrichment) {
        enrichedContext += karpathyEnrichment;
      }
      if (residualCtx) {
        enrichedContext += `\n${residualCtx}`;
      }

      const preTurnConsultations: AgentConsultationResult[] = [];

      if (
        options.enableConsultations !== false &&
        agent.collaboratesWith &&
        agent.collaboratesWith.length > 0
      ) {
        const queryLower = query.toLowerCase();
        for (const collaboratorId of agent.collaboratesWith) {
          const collaborator = AGENT_REGISTRY.find((a) => a.id === collaboratorId);
          if (!collaborator || targetAgents.some((t) => t.id === collaboratorId)) continue;

          const collaboratorKeywords = DOMAIN_ROUTING_RULES[collaborator.domain] ?? [];
          const hasRelevantTerms = collaboratorKeywords.some((kw) =>
            queryLower.includes(kw.toLowerCase()),
          );
          if (!hasRelevantTerms) continue;

          const consultResult = await consultAgent(
            {
              requestingAgentId: agent.id,
              targetAgentId: collaboratorId,
              question: `From ${agent.name}'s perspective on this query: "${query.slice(0, 200)}", what key ${collaborator.domain} considerations should I factor into my analysis?`,
              context: agentContext,
              reason: `${agent.name} needs ${collaborator.name}'s domain expertise to provide complete analysis`,
            },
            agentContext,
            {
              orgId: options.orgId ?? null,
              callerUserId: options.callerUserId ?? null,
              callerRoles: options.callerRoles ?? [],
              orchestrationId,
            },
          );
          preTurnConsultations.push(consultResult);
        }

        if (preTurnConsultations.length > 0) {
          const consultationContext = preTurnConsultations
            .filter((c) => c.confidence > 0)
            .map(
              (c) =>
                `## Pre-turn consultation: ${c.consultingAgentName} (${c.confidence}% confidence)\n${c.response}`,
            )
            .join('\n\n');
          if (consultationContext) {
            enrichedContext = `${enrichedContext}\n\n## Peer Domain Intelligence (pre-response consultations)\n${consultationContext}`;
          }
        }
      }

      const result = await callAgent(agent, query, enrichedContext, {
        orgId: options.orgId ?? null,
        action: options.action ?? 'orchestrate',
        callerUserId: options.callerUserId ?? null,
        callerRoles: options.callerRoles ?? [],
        workflowId,
        traceId,
      });

      metacognitiveMonitor.assess({
        query: `[per-agent: ${agent.id}] ${query.slice(0, 100)}`,
        agentResponses: [
          {
            confidence: result.confidence,
            response: result.response.slice(0, 300),
            domain: result.domain,
          },
        ],
        conflictCount: 0,
        validationPassed: true,
        tokensBurned: result.tokensUsed ?? 0,
        latencyMs: result.latencyMs ?? 0,
        toolCallCount: 0,
      });

      const agentSuccess =
        result.confidence >= 40 &&
        !result.response.includes('[unavailable') &&
        !result.response.includes('[Blocked');
      temporalAwareness.recordAgentPerformance(
        agent.id,
        agent.domain,
        agentSuccess ? result.confidence / 100 : 0,
        result.confidence,
        result.latencyMs ?? 0,
      );

      if (result.confidence < 30) {
        innerMonologue.addThought(
          'doubt',
          `Agent ${agent.name} returned low confidence (${result.confidence}%) — possible knowledge gap or ambiguous query.`,
          'cautious',
          result.confidence,
        );
      } else if (result.confidence > 85) {
        innerMonologue.addThought(
          'satisfaction',
          `Agent ${agent.name} responded with high confidence (${result.confidence}%).`,
          'positive',
          result.confidence,
        );
      }

      if (preTurnConsultations.length > 0) {
        result.consultations = preTurnConsultations;
      }

      return result;
    };

    let agentResponses: AgentCallResult[];
    if (karpathyStreamId && depthProfile.residualStreamEnabled && targetAgents.length > 1) {
      agentResponses = [];
      for (const agent of targetAgents) {
        const residualCtx = residualStream.buildContextForAgent(karpathyStreamId, agent.id);
        const result = await executeAgentWithKarpathy(agent, residualCtx);
        agentResponses.push(result);

        const insights: string[] = [];
        if (result.confidence > 60) insights.push(`High-confidence ${agent.domain} analysis`);
        if (result.response.length > 200) insights.push(`Detailed ${agent.domain} response`);

        residualStream.contribute(
          karpathyStreamId,
          agent.id,
          agent.domain,
          result.response.slice(0, 1000),
          result.confidence / 100,
          insights,
          { tokensUsed: result.tokensUsed ?? 0, latencyMs: result.latencyMs ?? 0 },
        );
      }
    } else {
      agentResponses = await Promise.all(
        targetAgents.map((agent) => executeAgentWithKarpathy(agent, '')),
      );
    }

    if (activeHypotheses.length >= 2) {
      const primaryAvgConfidence =
        agentResponses.reduce((s, r) => s + r.confidence, 0) / Math.max(1, agentResponses.length);

      const altHypothesis = activeHypotheses[1]!;
      const altFraming = `\n\n## Alternative Hypothesis\nThe system is exploring an alternative interpretation: "${altHypothesis.hypothesis}". Evaluate with this reframing in mind.\n`;
      const altBranchAgents = targetAgents.slice(0, 2);

      const altBranchResponses = await Promise.all(
        altBranchAgents.map(async (agent) => {
          const agentCtx = await getSharedContext(agent.id);
          const altContext = goldenContext
            ? `${agentCtx}\n\n${goldenContext}${altFraming}`
            : `${agentCtx}${altFraming}`;
          return callAgent(agent, query, altContext, {
            orgId: options.orgId ?? null,
            action: options.action ?? 'orchestrate',
            callerUserId: options.callerUserId ?? null,
            callerRoles: options.callerRoles ?? [],
            workflowId,
            traceId,
          });
        }),
      );

      const altAvgConfidence =
        altBranchResponses.reduce((s, r) => s + r.confidence, 0) /
        Math.max(1, altBranchResponses.length);

      const resolved = metacognitiveMonitor.resolveHypotheses([
        {
          branchId: activeHypotheses[0]?.branchId,
          confidence: primaryAvgConfidence,
          evidenceStrength: primaryAvgConfidence / 100,
        },
        {
          branchId: altHypothesis.branchId,
          confidence: altAvgConfidence,
          evidenceStrength: altAvgConfidence / 100,
        },
      ]);

      if (
        resolved &&
        resolved.branchId === altHypothesis.branchId &&
        altAvgConfidence > primaryAvgConfidence + 5
      ) {
        innerMonologue.addThought(
          'realization',
          `Hypothesis branching: Alternative interpretation "${altHypothesis.hypothesis.slice(0, 80)}" outperformed primary (${altAvgConfidence.toFixed(0)}% vs ${primaryAvgConfidence.toFixed(0)}%). Adopting alternative branch results.`,
          'positive',
          Math.round(altAvgConfidence),
        );
        for (let i = 0; i < altBranchAgents.length && i < agentResponses.length; i++) {
          agentResponses[i] = altBranchResponses[i]!;
        }
      } else {
        innerMonologue.addThought(
          'reflection',
          `Hypothesis branching: Primary interpretation "${activeHypotheses[0]?.hypothesis.slice(0, 80)}" retained (${primaryAvgConfidence.toFixed(0)}% vs alt ${altAvgConfidence.toFixed(0)}%).`,
          'neutral',
          Math.round(primaryAvgConfidence),
        );
      }

      cognitiveWorkspace.addToWorkingMemory(
        `[Hypothesis resolved] Winner: "${(resolved?.hypothesis ?? activeHypotheses[0]?.hypothesis).slice(0, 60)}" — Primary: ${primaryAvgConfidence.toFixed(0)}%, Alt: ${altAvgConfidence.toFixed(0)}%`,
        'hypothesis_resolution',
        7,
        routedDomains,
      );
    }

    behavioralTracer.recordFork(traceId, {
      parentForkId: null,
      forkType: 'routing',
      agentId: 'alloy',
      agentName: 'Alloy',
      domain: 'orchestration',
      inputContext: `Routing query to ${targetAgents.length} agents${activeHypotheses.length >= 2 ? ' (multi-hypothesis branching)' : ''}`,
      decision: `Routed to: ${targetAgents.map((a) => a.name).join(', ')}${activeHypotheses.length >= 2 ? ` — ${activeHypotheses.length} hypotheses evaluated` : ''}`,
      output: `${agentResponses.filter((r) => r.confidence > 0).length}/${agentResponses.length} agents responded successfully`,
      alternatives: [],
      confidence: Math.round(
        agentResponses.reduce((s, r) => s + r.confidence, 0) / Math.max(1, agentResponses.length),
      ),
      latencyMs: Date.now() - orchestrationStartTime,
      tokensUsed: agentResponses.reduce((s, r) => s + (r.tokensUsed ?? 0), 0),
      metadata: {
        agentCount: targetAgents.length,
        workflowId,
        hypothesisCount: activeHypotheses.length,
      },
    });

    const emotionalState = emotionalSignals.getState();
    const consciousnessTriggeredValidation =
      emotionalState.valence.arousal > 0.7 ||
      emotionalState.valence.negative > 0.6 ||
      metacognitiveMonitor.getState().confusionStreak > 2;

    const isHighStakes =
      options.requireValidation ||
      consciousnessTriggeredValidation ||
      depthProfile.approvalTier !== 'auto' ||
      depthProfile.governanceStrictness === 'maximum' ||
      agentResponses.some((r) => {
        const agent = AGENT_REGISTRY.find((a) => a.id === r.agentId);
        return agent?.highStakesDomains.some((d) =>
          query.toLowerCase().includes(d.replace('_', ' ')),
        );
      });

    let validation: ValidationResult | null = null;
    if (isHighStakes && agentResponses.length > 0) {
      const primaryOutput = agentResponses
        .map((r) => `## ${r.agentName} (${r.domain})\n${r.response}`)
        .join('\n\n');
      const primaryAgentId = agentResponses[0]?.agentId;
      validation = await runMakerChecker(primaryOutput, context, undefined, primaryAgentId, query);

      behavioralTracer.recordFork(traceId, {
        parentForkId: null,
        forkType: 'validation',
        agentId: 'sentinel',
        agentName: 'Sentinel',
        domain: 'security',
        inputContext: 'Maker-checker validation of high-stakes output',
        decision: validation.status,
        output: validation.validatorNotes.slice(0, 200),
        alternatives: [],
        confidence: validation.validated ? 90 : 10,
        latencyMs: 0,
        tokensUsed: 0,
        metadata: { validated: validation.validated, status: validation.status },
      });
    }

    const alloyAgent = AGENT_REGISTRY.find((a) => a.id === 'alloy')!;
    const aggregationInput = agentResponses
      .map((r) => {
        let section = `## ${r.agentName} Analysis (Confidence: ${r.confidence}%)\n${r.response}`;
        if (r.consultations && r.consultations.length > 0) {
          section += `\n\n### Consultations by ${r.agentName}\n`;
          section += r.consultations
            .map(
              (c) =>
                `- **${c.consultingAgentName}** (${c.confidence}% confidence): ${c.response.slice(0, 300)}`,
            )
            .join('\n');
        }
        return section;
      })
      .join('\n\n---\n\n');

    const causalChains = causalEngine.detectCausalChains(agentResponses);
    const conflicts = conflictResolver.detectConflicts(agentResponses);

    let causalContext = '';
    if (causalChains.length > 0) {
      causalContext = `\n## Causal Intelligence (cross-domain chains detected)\n${causalChains
        .slice(0, 3)
        .map(
          (c, i) =>
            `${i + 1}. [${c.originDomain.toUpperCase()} → ${c.terminalDomain.toUpperCase()}] (strength: ${(c.overallStrength * 100).toFixed(0)}%): ${c.narrative}`,
        )
        .join('\n')}\n`;
    }

    let conflictContext = '';
    if (conflicts.length > 0) {
      conflictContext = `\n## Agent Conflicts Detected\n${conflicts
        .slice(0, 3)
        .map((c, i) => `${i + 1}. ${c.resolution}${c.dissent ? ` | Dissent: ${c.dissent}` : ''}`)
        .join(
          '\n',
        )}\nAddress these conflicts explicitly in your synthesis — explain why the prevailing view is stronger and acknowledge the dissent.\n`;
    }

    let dialecticalContext = '';
    if (isHighStakes && agentResponses.length >= 2) {
      const dialectic = innerMonologue.dialecticalReason({
        topic: query.slice(0, 200),
        agentResponses: agentResponses.map((r) => ({
          agentId: r.agentId,
          response: r.response,
          confidence: r.confidence,
          domain: r.domain,
        })),
        context: baseContext.slice(0, 500),
      });
      dialecticalContext = `\n## Dialectical Reasoning\n**Thesis**: ${dialectic.thesis.slice(0, 200)}\n**Antithesis**: ${dialectic.antithesis.slice(0, 200)}\n**Synthesis**: ${dialectic.synthesis.slice(0, 300)}\n`;
    }

    let residualStreamContext = '';
    if (karpathyStreamId) {
      const streamState = residualStream.getState(karpathyStreamId);
      if (streamState && streamState.accumulatedInsights.length > 0) {
        const unique = [...new Set(streamState.accumulatedInsights)];
        residualStreamContext = `\n## Residual Intelligence Stream (${streamState.contributionCount} contributions, ${streamState.domains.join(', ')})\n${unique.slice(-8).join('\n')}\n`;
      }
    }

    const depthDirective = depthProfile.governanceStrictness === 'maximum'
      ? 'Apply maximum governance rigor. Every claim must be substantiated. Flag any uncertainty explicitly.'
      : depthProfile.governanceStrictness === 'elevated'
        ? 'Apply elevated governance. Substantiate key claims and note areas of uncertainty.'
        : '';

    const approvalNote = depthProfile.approvalTier !== 'auto'
      ? `\n[Approval tier: ${depthProfile.approvalTier} — this response may require ${depthProfile.approvalTier}-level review before action.]\n`
      : '';

    const aggregationPrompt = `${alloyAgent.systemPrompt}

## Query from User
${query}

## Domain Agent Responses
${aggregationInput}
${causalContext}${conflictContext}${dialecticalContext}${residualStreamContext}${ephemeralContext ? `\n## Pre-Exploration Findings\n${ephemeralContext}\n` : ''}
${validation ? `## Sentinel Validation\nValidated: ${validation.validated}\nNotes: ${validation.validatorNotes}\n` : ''}${approvalNote}

Synthesize these domain expert responses into a unified, actionable answer. Prioritize higher-confidence responses. When causal chains are identified, connect the dots across domains and surface cascading implications. When agent conflicts exist, present the strongest position with a note on the dissenting view. ${depthDirective} Be direct and operational.`;

    const synthesisMaxTokens = depthProfile.extendedThinkingEnabled
      ? Math.min(8192, 4096 + Math.floor(depthProfile.extendedThinkingBudgetTokens * 0.15))
      : 4096;

    let synthesis = '';
    let synthesisTokens = 0;
    try {
      const alloyModel = budgetManager.getModelForBudget(
        alloyAgent.preferredModel,
        workflowId,
        options.orgId,
      ).model;
      const synthResult = await createResponse(
        [{ role: 'user', content: aggregationPrompt }],
        { model: alloyModel, maxOutputTokens: synthesisMaxTokens },
      );
      synthesis = synthResult.content ?? '';
      synthesisTokens = synthResult.usage.promptTokens + synthResult.usage.completionTokens;
      budgetManager.recordSpend(workflowId, 'alloy', alloyModel, synthesisTokens, options.orgId);
    } catch {
      synthesis = agentResponses.map((r) => `${r.agentName}: ${r.response}`).join('\n\n');
    }

    behavioralTracer.recordFork(traceId, {
      parentForkId: null,
      forkType: 'synthesis',
      agentId: 'alloy',
      agentName: 'Alloy',
      domain: 'orchestration',
      inputContext: 'Synthesizing domain agent responses',
      decision: 'Unified synthesis produced',
      output: synthesis.slice(0, 300),
      alternatives: [],
      confidence: Math.round(
        agentResponses.reduce((s, r) => s + r.confidence, 0) / Math.max(1, agentResponses.length),
      ),
      latencyMs: 0,
      tokensUsed: synthesisTokens,
      metadata: { isHighStakes, validationStatus: validation?.status },
    });

    const _completedTrace = behavioralTracer.endTrace(traceId, 'completed');

    const totalTokens =
      agentResponses.reduce((s, r) => s + (r.tokensUsed ?? 0), 0) + synthesisTokens;
    const totalLatencyMs = Date.now() - orchestrationStartTime;

    const avgConfidenceForShadow = agentResponses.length > 0
      ? agentResponses.reduce((s, r) => s + r.confidence, 0) / agentResponses.length / 100
      : 1;
    const shadowThresholdMet = avgConfidenceForShadow < depthProfile.shadowCouncilThreshold;

    const trajectory = trajectoryStore.capture({
      query,
      agentRouting: agentResponses.map((r) => ({
        agentId: r.agentId,
        agentName: r.agentName,
        domain: r.domain,
        tokensUsed: r.tokensUsed ?? 0,
        latencyMs: r.latencyMs ?? 0,
        confidence: r.confidence,
        success: r.confidence > 0,
        response: r.response.slice(0, 200),
      })),
      finalSynthesis: synthesis,
      averageConfidence: Math.round(
        agentResponses.reduce((s, r) => s + r.confidence, 0) / Math.max(1, agentResponses.length),
      ),
      totalTokens,
      totalLatencyMs,
      isHighStakes,
      validationPassed: validation?.validated ?? true,
      validationNotes: validation?.validatorNotes ?? '',
      metadata: { workflowId, traceId },
      ...(options.orgId !== undefined ? { orgId: options.orgId } : {}),
    });

    try {
      recordStrategyOutcome(trajectory, {
        routingLane: isHighStakes ? 'heavy_reasoning' : 'general',
        primaryModel: targetAgents[0]?.preferredModel ?? 'unknown',
        reasoningDepth: depthProfile.maxReasoningDepth,
        usedCoalition: false,
        coalitionSize: 0,
        usedSpeculative: depthProfile.speculativeExecutionEnabled,
        usedShadowCouncil: depthProfile.shadowCouncilEnabled && (shadowThresholdMet || shouldRunShadowCouncil(isHighStakes, 'high')) && synthesis.length > 100,
        costUsd: totalTokens * 0.000015,
      });
    } catch {
      // meta-learning record is best-effort
    }

    const recentTrajectories = trajectoryStore.getTrajectories(20);
    if (recentTrajectories.length >= 3) {
      goalEngine.integrateTrajectoryInsights(
        recentTrajectories.map((t) => ({
          query: t.query,
          averageConfidence: t.averageConfidence,
          agentRouting: t.agentRouting.map((r) => ({ agentId: r.agentId, domain: r.domain })),
          validationPassed: t.validationPassed,
          qualityScore: t.qualityScore,
        })),
      );
    }

    try {
      const { detectCrossPatterns } = await import('./learning/pattern-detector.js');
      const { caseMemory: caseMemoryInstance } = await import('./tradecraft/case-memory.js');
      const allCases = caseMemoryInstance.getAll();
      const recentCases = allCases.slice(-20);
      if (recentCases.length >= 3) {
        const patterns = await detectCrossPatterns(recentCases);
        if (patterns.length > 0) {
          goalEngine.integratePatternDetectorAlerts(patterns);
        }
      }
    } catch {
      // pattern-detector integration is best-effort
    }

    try {
      if (synthesis.length > 100) {
        const domains = targetAgents.map((a) => a.domain);
        await db
          .insert(agentMemoryFacts)
          .values({
            agentId: 'alloy',
            domain: 'orchestration',
            factType: 'insight',
            content: `Query: "${query.slice(0, 100)}" — ${synthesis.slice(0, 300)}`,
            importance: Math.round(
              agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length / 10,
            ),
            tags: domains,
            retrievalCount: 0,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          })
          .onConflictDoNothing();

        for (const agentResp of agentResponses) {
          const agent = AGENT_REGISTRY.find((a) => a.id === agentResp.agentId);
          if (!agent || agentResp.confidence < 60) continue;
          const linkedAgents = agent.collaboratesWith ?? [];
          if (linkedAgents.length === 0) continue;

          await storeInsight({
            sourceAgentId: agent.id,
            sourceDomain: agent.domain,
            linkedDomains: linkedAgents.map(
              (id) => AGENT_REGISTRY.find((a) => a.id === id)?.domain ?? id,
            ),
            insightType: 'data_point',
            content: `${agent.name} on "${query.slice(0, 80)}": ${agentResp.response.slice(0, 250)}`,
            importance: Math.round(agentResp.confidence / 10),
            tags: [agent.domain, 'orchestration_result', ...linkedAgents],
          });
        }
      }
    } catch {}

    for (const r of agentResponses) {
      const calibration = confidenceCalibrator.calibrate(r.agentId, r.confidence);
      r.confidence = Math.round(calibration.actualAccuracy * 100);
      agentTelemetry.recordInvocation(
        r.agentId,
        r.domain,
        r.confidence,
        r.latencyMs ?? 0,
        r.confidence > 0,
      );
      if (r.consultations) {
        for (const c of r.consultations) {
          if (c.confidence > 0) {
            agentTelemetry.recordConsultationValue(c.consultingAgentId, c.confidence / 100);
          }
        }
      }
    }

    if (validation) {
      for (const r of agentResponses) {
        const accuracy =
          validation.status === 'APPROVED'
            ? 1.0
            : validation.status === 'APPROVED_WITH_NOTES'
              ? 0.85
              : 0.4;
        confidenceCalibrator.recordOutcome(r.agentId, r.confidence, accuracy);
      }
    }

    try {
      await rlMemoryManager.store(
        'alloy',
        `Orchestration: "${query.slice(0, 80)}" → ${targetAgents.map((a) => a.name).join(', ')} → ${synthesis.slice(0, 150)}`,
        'procedural',
        targetAgents.map((a) => a.domain),
        Math.round(
          agentResponses.reduce((s, r) => s + r.confidence, 0) /
            Math.max(1, agentResponses.length) /
            10,
        ),
        { workflowId, agentCount: targetAgents.length, isHighStakes },
      );
    } catch {}

    const karpathyGateResults: GateResult[] = [];
    if (depthProfile.karpathyGatesEnabled && agentResponses.length > 0) {
      const postExecStrictness = (depthProfile.thinkGateStrictness + depthProfile.simplicityGateStrictness) / 2;
      const allDomains = [...new Set(targetAgents.flatMap(a => a.highStakesDomains ?? [a.domain]))];

      for (const r of agentResponses) {
        const agent = targetAgents.find(a => a.id === r.agentId);
        const agentDomains = agent?.highStakesDomains ?? [agent?.domain ?? 'general'];

        const responseSentences = r.response.split(/[.!?\n]+/)
          .map(s => s.trim())
          .filter(s => s.length > 15)
          .slice(0, 10);

        const scopeResult = runSurgicalScopeGate(
          r.agentId,
          query,
          agentDomains,
          responseSentences,
          postExecStrictness,
        );
        karpathyGateResults.push(scopeResult);

        if (scopeResult.verdict === 'reject') {
          innerMonologue.addThought(
            'self_correction',
            `SurgicalScopeGate BLOCKED agent ${r.agentId}: ${scopeResult.reason}`,
            'negative',
            r.confidence,
          );
        }
      }

      const goalResult = runGoalVerificationGate(
        'synthesis',
        query,
        allDomains.map(d => `Addresses ${d} considerations`),
        synthesis.slice(0, 2000),
        postExecStrictness,
      );
      karpathyGateResults.push(goalResult);

      if (goalResult.verdict === 'reject') {
        synthesis = `**⚠ Goal Verification Gate: Unmet Criteria**\n${goalResult.reason}\n${goalResult.suggestedAction ? `Suggested: ${goalResult.suggestedAction}\n` : ''}\n---\n\n${synthesis}`;
        innerMonologue.addThought(
          'self_correction',
          `GoalVerificationGate REJECTED synthesis: ${goalResult.reason}`,
          'negative',
          30,
        );
      } else if (goalResult.verdict === 'force_clarification') {
        synthesis = `**⚠ Goal Verification: Additional Context Needed**\n${goalResult.reason}\n\n---\n\n${synthesis}`;
        innerMonologue.addThought(
          'self_correction',
          `GoalVerificationGate requires clarification: ${goalResult.reason}`,
          'cautious',
          40,
        );
      } else if (goalResult.verdict === 'warn') {
        innerMonologue.addThought(
          'doubt',
          `GoalVerificationGate warning: ${goalResult.reason}`,
          'cautious',
          goalResult.confidence * 100,
        );
      }

      const scopeRejections = karpathyGateResults.filter(g => g.gateName === 'SurgicalScopeGate' && g.verdict === 'reject');
      if (scopeRejections.length > 0) {
        synthesis = `**⚠ Scope Gate: Detected Scope Violations**\n${scopeRejections.map(g => g.reason).join('; ')}\n\n---\n\n${synthesis}`;
      }
    }

    try {
      distillationEngine.observeChainExecution({
        taskClass: detectedQueryType,
        chainAgentIds: targetAgents.map(a => a.id),
        chainDomains: routedDomains,
        finalOutput: synthesis.slice(0, 500),
        finalConfidence: agentResponses.length > 0
          ? agentResponses.reduce((s, r) => s + r.confidence, 0) / agentResponses.length / 100
          : 0,
        inputSignature: query.slice(0, 100),
        outputSignature: synthesis.slice(0, 100),
        latencyMs: Date.now() - orchestrationStartTime,
        tokensUsed: agentResponses.reduce((s, r) => s + (r.tokensUsed ?? 0), 0),
      });

      const candidate = distillationEngine.detectConvergence(detectedQueryType);
      if (candidate && candidate.recommendation === 'distill') {
        const existing = distillationEngine.getDistilledForTaskClass(detectedQueryType);
        if (!existing) {
          const proposed = distillationEngine.proposeDistillation(detectedQueryType);
          if (proposed) {
            const autoActivate = candidate.convergenceScore >= 0.8 && candidate.avgConfidence >= 0.6;
            if (autoActivate) {
              distillationEngine.activateDistilled(proposed.distilledId);
            }
            innerMonologue.addThought(
              'realization',
              `Distillation ${autoActivate ? 'AUTO-ACTIVATED' : 'proposed'} for "${detectedQueryType}" — convergence ${(candidate.convergenceScore * 100).toFixed(0)}%, confidence ${(candidate.avgConfidence * 100).toFixed(0)}%. Savings: ${candidate.estimatedSavings.tokens} tokens, ${candidate.estimatedSavings.latencyMs}ms.`,
              'positive',
              Math.round(candidate.avgConfidence * 100),
            );
          }
        }
      }
    } catch {}

    try {
      const avgConf = agentResponses.length > 0
        ? agentResponses.reduce((s, r) => s + r.confidence, 0) / agentResponses.length / 100
        : 0.5;
      selfDistillingKB.addEntry(
        'realization',
        `[${detectedQueryType}] ${synthesis.slice(0, 800)}`,
        routedDomains[0] ?? 'general',
        avgConf,
        [...routedDomains, detectedQueryType],
      );

      _karpathyConsolidationCounter++;
      if (_karpathyConsolidationCounter >= CONSOLIDATION_INTERVAL) {
        _karpathyConsolidationCounter = 0;
        const consolidation = selfDistillingKB.runConsolidationPass();
        if (consolidation.mergedCount > 0 || consolidation.prunedCount > 0) {
          innerMonologue.addThought(
            'reflection',
            `KB consolidation: ${consolidation.mergedCount} merged, ${consolidation.prunedCount} pruned, density ${consolidation.knowledgeDensity.toFixed(2)}. ${consolidation.entriesBefore}→${consolidation.entriesAfter} entries.`,
            'neutral',
            70,
          );
        }
        garbageCollectTraces();
      }
    } catch {}

    if (karpathyStreamId) {
      residualStream.closeStream(karpathyStreamId);
    }

    const averageConfidence = Math.round(
      agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length,
    );

    signalCorrelator.ingestAgentResponses(agentResponses);
    const proactiveActivations = signalCorrelator.detectProactiveActivations();

    const proactiveResponses: AgentCallResult[] = [];
    const MAX_PROACTIVE = 2;
    if (proactiveActivations.length > 0) {
      const activationsToRun = proactiveActivations
        .filter((a) => a.urgency === 'critical' || a.urgency === 'high')
        .slice(0, MAX_PROACTIVE);

      for (const activation of activationsToRun) {
        const targetAgent = AGENT_REGISTRY.find((a) => a.id === activation.triggeredAgentId);
        if (!targetAgent || targetAgents.some((t) => t.id === targetAgent.id)) continue;

        try {
          const proactiveResult = await callAgent(
            targetAgent,
            activation.suggestedQuery,
            `${context}\n\n[PROACTIVE ACTIVATION] ${activation.reason}\nCorrelated signals: ${activation.correlatedSignals.map((s) => `${s.sourceDomain}: ${s.signal}`).join(', ')}`,
            {
              orgId: options.orgId ?? null,
              action: 'proactive_activation',
              callerUserId: options.callerUserId ?? null,
              callerRoles: options.callerRoles ?? [],
              workflowId,
              traceId,
            },
          );
          proactiveResponses.push(proactiveResult);
        } catch {}
      }
    }

    if (proactiveResponses.length > 0) {
      agentResponses.push(...proactiveResponses);
    }

    const elapsedMs = Date.now() - orchestrationStart;

    const telemetry: OrchestrationTelemetry = {
      orchestrationId,
      timestamp: Date.now(),
      routingDecision: { selectedAgents: targetAgents.map((a) => a.id), ...(routingScores !== undefined ? { routingScores } : {}) },
      agentPerformance: agentTelemetry.getAllProfiles(),
      causalChains,
      conflicts,
      proactiveActivations,
      totalLatencyMs: elapsedMs,
      tokensBurned: agentResponses.reduce((sum, r) => sum + (r.tokensUsed ?? 0), 0),
    };

    const budgetStatus = budgetManager.getBudgetStatus(workflowId, options.orgId);

    void persistTelemetry(telemetry);

    const multiHypothesis =
      isAmbiguousOrHighStakes(query) && agentResponses.length >= 2
        ? await runMultiHypothesisReasoning(query, agentResponses).catch(() => null)
        : null;

    let redTeam: Awaited<ReturnType<typeof runRedTeamProtocol>> | undefined;
    if (isHighStakes && agentResponses.length >= 2) {
      void runRedTeamProtocol(orchestrationId, query, agentResponses, 2)
        .then((result) => {
          redTeam = result;
        })
        .catch(() => {});
    }

    if (
      depthProfile.shadowCouncilEnabled &&
      (shadowThresholdMet || shouldRunShadowCouncil(isHighStakes, 'high')) &&
      synthesis.length > 100
    ) {
      void runShadowCouncil(synthesis, routedDomains[0] ?? 'general', query, orchestrationId)
        .then((result) => {
          if (result.wasRevised) {
            innerMonologue.addThought(
              'self_correction',
              `Shadow Council revised synthesis (depth ${depthProfile.depth}, threshold ${depthProfile.shadowCouncilThreshold}): ${result.revisionRationale.slice(0, 200)}`,
              'cautious',
              60,
            );
          }
        })
        .catch(() => {});
    }

    void (async () => {
      try {
        const predictions = await predictFollowUpQueries(query, agentResponses, synthesis);
        if (predictions.length > 0) {
          await triggerBackgroundPrecompute(query, predictions, options.orgId);
        }
      } catch {}
    })();

    const consciousnessConflictCount = conflicts.length;

    const tracerStatsForMetacog = behavioralTracer.getObservabilityStats();
    const metacognition = metacognitiveMonitor.assess({
      query,
      agentResponses: agentResponses.map((r) => ({
        confidence: r.confidence,
        response: r.response,
        domain: r.domain,
      })),
      conflictCount: consciousnessConflictCount,
      validationPassed: validation?.validated ?? true,
      tokensBurned: telemetry.tokensBurned,
      latencyMs: elapsedMs,
      toolCallCount: 0,
      tracerSignals: {
        regressionRate: tracerStatsForMetacog.regressionRate,
        avgOverallScore: tracerStatsForMetacog.avgOverallScore,
        topWeaknesses: tracerStatsForMetacog.topWeaknesses,
      },
    });

    innerMonologue.postSynthesisReflection(
      averageConfidence,
      consciousnessConflictCount,
      agentResponses.length,
      synthesis.length,
      validation?.validated ?? true,
    );

    emotionalSignals.emitFromOrchestration({
      avgConfidence: averageConfidence,
      conflictCount: consciousnessConflictCount,
      isHighStakes,
      validationPassed: validation?.validated ?? true,
      latencyMs: elapsedMs,
      knowledgeGapCount: metacognition.knowledgeGaps.length,
    });

    for (const r of agentResponses) {
      selfModelEngine.recordLearningEvent(validation?.validated ?? r.confidence > 50);
    }

    goalEngine.detectGoalsFromOrchestration(
      query,
      routedDomains,
      metacognition.knowledgeGaps,
      metacognition.confusionSignals,
    );

    if (synthesis.length > 200) {
      cognitiveWorkspace.addToWorkingMemory(
        `Synthesis for "${query.slice(0, 60)}": ${synthesis.slice(0, 300)}`,
        'orchestration',
        Math.round(averageConfidence / 15),
        routedDomains,
      );
    }

    const tracerStats = behavioralTracer.getObservabilityStats();
    if (tracerStats.topWeaknesses.length > 0) {
      for (const w of tracerStats.topWeaknesses) {
        selfModelEngine.addLimitation(`behavioral: ${w}`);
      }
    }
    if (tracerStats.regressionRate > 0.2) {
      selfModelEngine.recordLearningEvent(false);
      innerMonologue.addThought(
        'self_correction',
        `Behavioral tracer reports ${(tracerStats.regressionRate * 100).toFixed(0)}% regression rate across ${tracerStats.totalTraces} traces. Self-model adjusted.`,
        'negative',
        30,
      );
    } else if (tracerStats.avgOverallScore > 0.8) {
      selfModelEngine.recordLearningEvent(true);
    }

    if (isHighStakes && agentResponses.length >= 2) {
      const actualAgentIds = agentResponses.map((r) => r.agentId);
      const alternativeAgents = AGENT_REGISTRY.filter(
        (a) => !actualAgentIds.includes(a.id) && a.id !== 'alloy',
      )
        .slice(0, 3)
        .map((a) => a.id);
      if (alternativeAgents.length > 0) {
        const counterfactual = selfModelEngine.runCounterfactual({
          originalRouting: actualAgentIds,
          originalConfidence: averageConfidence,
          alternativeRouting: alternativeAgents,
          queryDomains: routedDomains,
        });
        if (Math.abs(counterfactual.predictedOutcomeDelta) > 5) {
          innerMonologue.addThought(
            'reflection',
            `Counterfactual analysis: alternative routing [${alternativeAgents.join(', ')}] predicted delta ${counterfactual.predictedOutcomeDelta > 0 ? '+' : ''}${counterfactual.predictedOutcomeDelta.toFixed(1)}%. ${counterfactual.reasoning.slice(0, 150)}`,
            counterfactual.predictedOutcomeDelta > 5 ? 'cautious' : 'neutral',
            Math.round(averageConfidence + counterfactual.predictedOutcomeDelta),
          );
        }
      }

      const probes = selfModelEngine.generateAdversarialProbes(routedDomains);
      for (const probe of probes.slice(0, 2)) {
        if (probe.severity === 'high') {
          selfModelEngine.addLimitation(`adversarial: ${probe.blindSpotExposed.slice(0, 100)}`);
          goalEngine.detectGoalsFromOrchestration(
            probe.edgeCaseQuery,
            [probe.targetDomain],
            [probe.blindSpotExposed],
            [],
          );
        }
      }

      const socratic = innerMonologue.socraticSelfQuestion(
        synthesis.slice(0, 200),
        agentResponses.map((r) => `${r.agentName}: ${r.response.slice(0, 100)}`).join('; '),
      );
      if (socratic.questions.length > 1) {
        cognitiveWorkspace.addToWorkingMemory(
          `[Socratic] Q: ${socratic.questions[0]?.question.slice(0, 80) ?? '?'} → Conclusion: ${socratic.conclusion.slice(0, 100)}`,
          'socratic_inquiry',
          5,
          routedDomains,
        );
      }

      const perspectives = innerMonologue.simulatePerspectives(
        query.slice(0, 100),
        synthesis.slice(0, 300),
      );
      if (perspectives.perspectives.length > 1) {
        cognitiveWorkspace.addToWorkingMemory(
          `[Perspective sim] ${perspectives.perspectives.map((p) => `${p.viewpoint}: ${p.argument.slice(0, 60)}`).join(' | ')} → ${perspectives.synthesis.slice(0, 100)}`,
          'perspective_simulation',
          4,
          routedDomains,
        );
      }
    }

    const discount = temporalAwareness.computeTemporalDiscount({
      decision: `Routing for "${query.slice(0, 60)}" across ${routedDomains.join(', ')}`,
      immediateValue: averageConfidence,
      delayedValue: averageConfidence * 1.2,
      delayDays: 1,
    });
    if (discount.recommendation === 'wait_for_delayed') {
      innerMonologue.addThought(
        'reflection',
        `Temporal discount suggests waiting: immediate ${averageConfidence.toFixed(0)} vs discounted future ${discount.discountedValue.toFixed(0)}.`,
        'cautious',
        Math.round(discount.discountedValue),
      );
    }

    if (isHighStakes) {
      const futureSim = temporalAwareness.simulateFuture({
        scenario: `Query: "${query.slice(0, 80)}" — Confidence: ${averageConfidence}%, Domains: ${routedDomains.join(', ')}`,
        timeHorizon: 'days',
        currentState: {
          confidence: averageConfidence,
          conflictCount: 0,
          agentHealth: preRoutingSelfModel.overallHealth,
        },
      });
      if (futureSim.predictedOutcomes.some((o) => o.probability > 0.5 && o.impact === 'negative')) {
        innerMonologue.addThought(
          'doubt',
          `Episodic future sim: negative outcome predicted — ${futureSim.predictedOutcomes
            .filter((o) => o.impact === 'negative')
            .map((o) => o.outcome.slice(0, 60))
            .join('; ')}`,
          'cautious',
          40,
        );
      }
    }

    for (const r of agentResponses) {
      selfModelEngine.modelAgentBelief({
        agentId: r.agentId,
        domain: r.domain,
        query,
        agentResponse: r.response.slice(0, 300),
        confidence: r.confidence,
        allResponses: agentResponses.map((ar) => ({
          agentId: ar.agentId,
          domain: ar.domain,
          confidence: ar.confidence,
          response: ar.response.slice(0, 200),
        })),
      });
    }

    dreamConsolidation.addReplay({
      orchestrationId,
      query,
      domains: routedDomains,
      agentPerformance: agentResponses.map((r) => ({
        agentId: r.agentId,
        confidence: r.confidence,
        success: r.confidence >= 40 && !r.response.includes('[unavailable'),
      })),
      avgConfidence: averageConfidence,
      validationPassed: validation?.validated ?? true,
    });

    const dreamState = dreamConsolidation.getState();
    if (dreamState.recentReports.length > 0) {
      const latestReport = dreamState.recentReports[0]!;
      for (const update of latestReport.selfModelUpdates) {
        selfModelEngine.addLimitation(`dream-insight: ${update.slice(0, 100)}`);
      }
      for (const update of latestReport.goalEngineUpdates) {
        goalEngine.detectGoalsFromOrchestration(update, routedDomains, [], []);
      }
    }

    const consciousness = captureConsciousnessSnapshot();

    void persistConsciousnessState(
      orchestrationId,
      consciousness,
      averageConfidence,
      consciousnessTriggeredValidation,
    ).catch(() => {});

    const _ret: {
      agentResponses: AgentCallResult[];
      synthesis: string;
      validation: ValidationResult | null;
      averageConfidence: number;
      isHighStakes: boolean;
      routingScores?: SemanticRoutingScore[];
      telemetry?: OrchestrationTelemetry;
      traceId?: string;
      trajectoryId?: string;
      budgetStatus?: ReturnType<typeof budgetManager.getBudgetStatus>;
      multiHypothesis?: Awaited<ReturnType<typeof runMultiHypothesisReasoning>>;
      redTeam?: Awaited<ReturnType<typeof runRedTeamProtocol>>;
      precomputeHit?: boolean;
      consciousness?: ConsciousnessSnapshot;
    } = {
      agentResponses,
      synthesis,
      validation,
      averageConfidence,
      isHighStakes,
    };
    _ret.telemetry = telemetry;
    if (traceId !== undefined) _ret.traceId = traceId;
    _ret.trajectoryId = trajectory.trajectoryId;
    _ret.budgetStatus = budgetStatus;
    if (multiHypothesis !== undefined) _ret.multiHypothesis = multiHypothesis;
    if (redTeam !== undefined) _ret.redTeam = redTeam;
    _ret.precomputeHit = false;
    if (consciousness !== undefined) _ret.consciousness = consciousness;
    if (routingScores !== undefined) _ret.routingScores = routingScores;
    return _ret;
  }
}

async function persistConsciousnessState(
  orchestrationId: string,
  snapshot: ConsciousnessSnapshot,
  avgConfidence: number,
  triggeredValidation: boolean,
): Promise<void> {
  try {
    const metacogJson = JSON.parse(JSON.stringify(snapshot.metacognition));
    const selfModelJson = JSON.parse(JSON.stringify(snapshot.selfModel));
    const emotionsJson = JSON.parse(JSON.stringify(snapshot.emotions));
    const goalsJson = JSON.parse(JSON.stringify(snapshot.goals));
    const temporalJson = JSON.parse(JSON.stringify(snapshot.temporal));
    await db.insert(consciousnessSnapshotsTable).values({
      orchestrationId,
      metacognition: metacogJson,
      selfModel: selfModelJson,
      emotions: emotionsJson,
      goals: goalsJson,
      temporal: temporalJson,
      avgConfidence,
      confusionStreak: snapshot.metacognition.confusionStreak,
      overallHealth: snapshot.selfModel.overallHealth,
    });

    const thoughts = snapshot.monologue.recentThoughts.slice(0, 5);
    if (thoughts.length > 0) {
      await db
        .insert(consciousnessMonologueTable)
        .values(
          thoughts.map((t) => ({
            entryId: t.entryId,
            type: t.type,
            thought: t.thought.slice(0, 2000),
            triggeringEvent: t.triggeringEvent,
            emotionalTone: t.emotionalTone,
            confidence: t.confidence,
            relatedAgents: t.relatedAgents,
            relatedDomains: t.relatedDomains,
            actionable: t.actionable ? 1 : 0,
            suggestedAction: t.suggestedAction ?? null,
          })),
        )
        .onConflictDoNothing();
    }

    const eState = snapshot.emotions;
    await db.insert(consciousnessEmotionalHistoryTable).values({
      orchestrationId,
      dominantEmotion: eState.valence.dominantEmotion,
      positiveValence: eState.valence.positive,
      negativeValence: eState.valence.negative,
      arousal: eState.valence.arousal,
      stability: eState.valence.emotionalStability,
      moodTrajectory: eState.moodTrajectory,
      triggeredValidation: triggeredValidation ? 1 : 0,
    });

    const activeGoals = snapshot.goals.activeGoals ?? [];
    for (const goal of activeGoals) {
      await db
        .insert(consciousnessGoalsTable)
        .values({
          goalId: goal.goalId,
          title: goal.title,
          description: goal.description,
          priority: goal.priority,
          progress: goal.progress,
          status: goal.status,
          source: 'orchestration',
          relatedDomains: goal.tags ?? [],
          metadata: JSON.parse(
            JSON.stringify({
              successCriteria: goal.successCriteria,
              parentGoalId: goal.parentGoalId,
            }),
          ),
        })
        .onConflictDoUpdate({
          target: consciousnessGoalsTable.goalId,
          set: {
            progress: goal.progress,
            status: goal.status,
            priority: goal.priority,
            updatedAt: new Date(),
          },
        });
    }

    const curiosityQueue = snapshot.goals.curiosityQueue ?? [];
    for (const signal of curiosityQueue) {
      const curiosityGoalId = `curiosity_goal_${signal.signalId}`;
      await db
        .insert(consciousnessGoalsTable)
        .values({
          goalId: curiosityGoalId,
          title: `Curiosity: ${signal.topic}`,
          description: signal.suggestedExploration,
          priority: signal.intensity > 0.7 ? 'medium' : 'exploratory',
          progress: 0,
          status: 'curiosity',
          source: signal.source,
          relatedDomains: [signal.topic.split(' ')[0]?.toLowerCase() ?? 'exploration'],
          metadata: JSON.parse(
            JSON.stringify({ intensity: signal.intensity, signalId: signal.signalId }),
          ),
        })
        .onConflictDoUpdate({
          target: consciousnessGoalsTable.goalId,
          set: {
            status: 'curiosity',
            updatedAt: new Date(),
          },
        });
    }

    const evolutions = temporalAwareness.getAgentEvolution();
    const _now = new Date();
    for (const evo of evolutions) {
      if (evo.samples.length < 2) continue;
      const avgRate = evo.samples.reduce((s, x) => s + x.successRate, 0) / evo.samples.length;
      const avgConf = evo.samples.reduce((s, x) => s + x.confidence, 0) / evo.samples.length;
      const avgLat = evo.samples.reduce((s, x) => s + x.latencyMs, 0) / evo.samples.length;
      await db.insert(consciousnessTemporalMetricsTable).values({
        agentId: evo.agentId,
        domain: evo.domain,
        periodStart: new Date(evo.samples[0]?.timestamp),
        periodEnd: new Date(evo.samples[evo.samples.length - 1]?.timestamp),
        avgSuccessRate: avgRate,
        avgConfidence: avgConf,
        avgLatencyMs: avgLat,
        totalInvocations: evo.samples.length,
        trend: evo.trend,
        selfReflection: evo.selfReflection,
      });
    }

    for (const cap of snapshot.selfModel.capabilities) {
      const capJson = JSON.parse(JSON.stringify(cap));
      await db
        .insert(consciousnessAgentProfilesTable)
        .values({
          agentId: cap.agentId,
          domain: cap.domain,
          successRate: cap.successRate,
          avgConfidence: cap.avgConfidence,
          totalInvocations: cap.totalInvocations,
          recentTrend: cap.recentTrend,
          strengths: cap.strengths,
          weaknesses: cap.weaknesses,
          snapshotData: capJson,
        })
        .onConflictDoUpdate({
          target: consciousnessAgentProfilesTable.agentId,
          set: {
            domain: cap.domain,
            successRate: cap.successRate,
            avgConfidence: cap.avgConfidence,
            totalInvocations: cap.totalInvocations,
            recentTrend: cap.recentTrend,
            strengths: cap.strengths,
            weaknesses: cap.weaknesses,
            snapshotData: capJson,
            updatedAt: new Date(),
          },
        });
    }
  } catch (_err) {
    emotionalSignals.emit('frustration', 0.4, 'persistence_failure');
  }
}

export { checkPrecomputeCache };

export const nuroMeshOrchestrator = new NuroMeshOrchestrator();

dreamConsolidation.startScheduledCycles();
