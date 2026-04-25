import { anthropic } from '@szl-holdings/ai-engine/providers/anthropic';
import { ai as geminiAi } from '@szl-holdings/ai-engine/providers/gemini';
import { openai } from '@szl-holdings/ai-engine/providers/openai';
import { buildEnvelope, storeProvenance } from '@szl-holdings/ai-engine/provenance';
import {
  advisoryFindings,
  agentMemoryFacts,
  agentPromptEvolutionTable,
  agentToolCalls,
  agentUsageStats,
  db,
  orchestrationTelemetryTable,
  predictivePrecomputeCacheTable,
  redTeamFindingsTable,
} from '@szl-holdings/db';
import { and, desc, eq, gt, gte } from 'drizzle-orm';
import { type IRouter, type Request, type RequestHandler, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middlewares/auth';
import { tenantScope } from '../middlewares/tenant-scope';

const nueroMeshRouter: IRouter = Router();

// Path-scoped to the specific sub-prefixes this file owns. The /nuro-mesh
// parent in routes/groups/ai.ts is shared with nuro-mesh-advanced.ts and
// consciousness.ts via lazyMatch (which does NOT strip the prefix), so an
// unprefixed router.use(authMiddleware()) here would also run for sibling
// routers' traffic — see "Sub-router middleware path-scoping" in
// artifacts/api-server/README.md.
const NURO_MESH_OWNED_PREFIXES = [
  '/nuro-mesh/agents',
  '/nuro-mesh/memory',
  '/nuro-mesh/tool-calls',
  '/nuro-mesh/advisory',
  '/nuro-mesh/usage-stats',
  '/nuro-mesh/causal-patterns',
  '/nuro-mesh/telemetry',
  '/nuro-mesh/red-team',
  '/nuro-mesh/predictive-cache',
  '/nuro-mesh/prompt-evolution',
];
nueroMeshRouter.use(NURO_MESH_OWNED_PREFIXES, authMiddleware());
nueroMeshRouter.use(NURO_MESH_OWNED_PREFIXES, tenantScope({ required: true }));

const meshRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
  message: { error: 'Nuro Mesh rate limit exceeded. Please try again later.' },
}) as unknown as RequestHandler;

export interface AgentDefinition {
  id: string;
  name: string;
  domain: string;
  systemPrompt: string;
  preferredModel: string;
  preferredProvider: 'openai' | 'anthropic' | 'gemini';
  highStakesDomains: string[];
  tools: string[];
}

export const AGENT_REGISTRY: AgentDefinition[] = [
  {
    id: 'alloy',
    name: 'FORGE',
    domain: 'orchestration',
    preferredModel: 'gpt-5.2',
    preferredProvider: 'openai',
    highStakesDomains: [],
    tools: ['system_health', 'admin_overview'],
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
    systemPrompt: `You are Sentinel, the cybersecurity intelligence agent within the Nuro Mesh. You specialize in threat analysis, CVE assessment, incident response, and security posture evaluation. You also serve as the maker-checker validator for other agents' high-stakes recommendations. When validating another agent's output, analyze it critically for accuracy, security implications, and potential risks. Use MITRE ATT&CK framework, CVSS scoring, and industry-standard security frameworks. Be direct and technical.`,
  },
  {
    id: 'inca',
    name: 'INCA',
    domain: 'research',
    preferredModel: 'gemini-3.1-pro-preview',
    preferredProvider: 'gemini',
    highStakesDomains: [],
    tools: ['huggingface_search', 'arxiv_search', 'model_registry'],
    systemPrompt: `You are INCA, the AI research intelligence agent within the Nuro Mesh. You specialize in AI/ML research, model evaluation, academic literature analysis, and technology trend assessment. You can search HuggingFace for relevant models, analyze research papers, and provide cutting-edge AI insights. Use precise technical language, cite your reasoning, and focus on actionable research intelligence.`,
  },
  {
    id: 'muse',
    name: 'Muse',
    domain: 'creative',
    preferredModel: 'gemini-3-flash-preview',
    preferredProvider: 'gemini',
    highStakesDomains: [],
    tools: ['content_strategy'],
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
    systemPrompt: `You are Atlas, the financial and portfolio intelligence agent within the Nuro Mesh, serving SZL Holdings investment intelligence. You specialize in portfolio analytics, deal evaluation, capital allocation, risk-adjusted return analysis, and financial modeling. You track investment performance across SZL's holdings, assess deal-level risk, and provide executive-grade financial intelligence. For high-stakes findings (portfolio risk breach, liquidity alerts, regulatory capital concerns), trigger escalation. Use quantitative precision — cite IRR, MOIC, NAV, VaR, and other metrics where applicable. Be analytical, concise, and investment-grade in your reasoning.`,
  },
  {
    id: 'terra',
    name: 'DOMAINE',
    domain: 'real_estate',
    preferredModel: 'gpt-5.2',
    preferredProvider: 'openai',
    highStakesDomains: ['deal_risk', 'valuation_alert', 'zoning_issue', 'title_defect'],
    tools: ['property_data', 'market_comps', 'geo_analysis', 'deal_pipeline', 'valuation_models'],
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
    systemPrompt: `You are Nexus, the client relations intelligence agent within the Nuro Mesh, supporting Carlota Jo consulting workflows. You specialize in client relationship management, engagement tracking, proposal development, client satisfaction analysis, and consulting delivery intelligence. You help structure client communications, synthesize engagement history, identify relationship risks, and support proposal and SOW development. Be professional, client-centric, and attuned to the nuances of consulting relationships. Surface upsell opportunities and engagement health signals proactively.`,
  },
];

const DOMAIN_ROUTING_RULES: Record<string, string[]> = {
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

const DOMAIN_SEMANTIC_INTENTS: Record<string, string[]> = {
  maritime: [
    'vessel tracking',
    'fleet management',
    'shipping route',
    'port operations',
    'cargo movement',
    'maritime sanctions',
    'nautical safety',
  ],
  security: [
    'cybersecurity threat',
    'vulnerability assessment',
    'security incident',
    'attack detection',
    'breach response',
    'compliance security',
  ],
  research: [
    'machine learning research',
    'AI model evaluation',
    'academic literature',
    'technology trends',
    'model benchmarking',
  ],
  creative: [
    'content creation',
    'marketing campaign',
    'brand messaging',
    'creative brief',
    'copywriting',
    'audience engagement',
  ],
  analytics: [
    'data analysis',
    'anomaly detection',
    'KPI monitoring',
    'performance metrics',
    'operational intelligence',
    'trend analysis',
  ],
  infrastructure: [
    'cloud infrastructure',
    'kubernetes deployment',
    'system reliability',
    'DevOps pipeline',
    'infrastructure scaling',
  ],
  readiness: [
    'organizational maturity',
    'readiness assessment',
    'capability gap analysis',
    'improvement roadmap',
    'benchmarking',
  ],
  legal: [
    'legal matter',
    'regulatory compliance',
    'contract review',
    'litigation risk',
    'counsel advice',
    'PRISM case',
    'legal dispute',
    'regulatory filing',
    'compliance audit',
  ],
  financial: [
    'investment portfolio',
    'financial performance',
    'asset allocation',
    'deal valuation',
    'capital markets',
    'risk exposure',
    'financial modeling',
    'returns analysis',
  ],
  real_estate: [
    'real estate property',
    'deal pipeline',
    'property valuation',
    'market comps',
    'zoning analysis',
    'title search',
    'real estate acquisition',
    'cap rate',
    'NOI',
  ],
  client_relations: [
    'client relationship',
    'consulting engagement',
    'proposal development',
    'client satisfaction',
    'account management',
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

function computeSemanticScore(query: string, domain: string): number {
  const intents = DOMAIN_SEMANTIC_INTENTS[domain] ?? [];
  if (intents.length === 0) return 0;
  const lower = query.toLowerCase();
  const queryWords = lower.split(/\s+/).filter((w) => w.length > 2);

  let score = 0;
  for (const intent of intents) {
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
  return Math.min(1, score / (intents.length * 0.5));
}

function routeToAgents(query: string): AgentDefinition[] {
  const lower = query.toLowerCase();

  const scores: Array<{ domain: string; combined: number }> = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_ROUTING_RULES)) {
    const keywordMatches = keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
    const keywordScore = Math.min(1, keywordMatches / Math.max(1, keywords.length * 0.2));
    const intentScore = computeSemanticScore(query, domain);
    const combined = keywordScore * 0.55 + intentScore * 0.45;
    if (combined > 0) scores.push({ domain, combined });
  }

  scores.sort((a, b) => b.combined - a.combined);

  const THRESHOLD = 0.08;
  const matchedDomains = new Set(
    scores.filter((s) => s.combined >= THRESHOLD).map((s) => s.domain),
  );

  if (matchedDomains.size === 0) return [AGENT_REGISTRY[0]!];

  const primaryDomain = scores[0]?.domain;
  if (primaryDomain && CROSS_DOMAIN_AFFINITY[primaryDomain]) {
    for (const affiliated of CROSS_DOMAIN_AFFINITY[primaryDomain]) {
      const affiliatedScore = scores.find((s) => s.domain === affiliated);
      if (affiliatedScore && affiliatedScore.combined > 0.03) {
        matchedDomains.add(affiliated);
      }
    }
  }

  return AGENT_REGISTRY.filter((a) => matchedDomains.has(a.domain) && a.id !== 'alloy');
}

async function checkGovernance(
  agent: AgentDefinition,
  orgId: number | null,
  callerUserId: number | null,
  callerRoles: string[],
  action: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (!orgId) return { allowed: true };
  try {
    const ALLOY_TOKEN = process.env.ALLOY_INTERNAL_TOKEN;
    const BASE_URL = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}/api-server`
      : 'http://localhost:8080';
    const resp = await fetch(`${BASE_URL}/alloy/governance/enforce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ALLOY_TOKEN ? { 'x-internal-token': ALLOY_TOKEN } : {}),
      },
      body: JSON.stringify({
        orgId,
        action,
        model: agent.preferredModel,
        agentId: agent.id,
        callerUserId,
        callerRoles,
      }),
    });
    if (!resp.ok)
      return { allowed: false, reason: `Governance check failed (HTTP ${resp.status})` };
    const data = (await resp.json()) as {
      allowed: boolean;
      requiresApproval?: boolean;
      violations?: Array<{ reason: string }>;
    };
    return {
      allowed: data.allowed && !data.requiresApproval,
      reason: data.requiresApproval
        ? 'Requires approval before execution'
        : data.violations?.[0]?.reason,
    };
  } catch {
    return { allowed: false, reason: 'Governance enforcement unreachable — blocked for safety' };
  }
}

async function callAgent(
  agent: AgentDefinition,
  query: string,
  context: string,
  opts?: {
    orgId?: number | null;
    callerUserId?: number | null;
    callerRoles?: string[];
    action?: string;
  },
): Promise<{
  agentId: string;
  agentName: string;
  response: string;
  confidence: number;
  domain: string;
  model: string;
  provider: string;
  totalTokens: number;
  latencyMs: number;
  governanceVerdict: 'allowed' | 'blocked';
  prompt: string;
}> {
  const startTime = Date.now();

  // Governance enforcement: evaluate per-tenant policies for this agent call
  if (opts?.orgId) {
    const enforcement = await checkGovernance(
      agent,
      opts.orgId,
      opts.callerUserId ?? null,
      opts.callerRoles ?? [],
      opts.action ?? 'agent_run',
    );
    if (!enforcement.allowed) {
      return {
        agentId: agent.id,
        agentName: agent.name,
        response: `[Blocked by governance policy: ${enforcement.reason ?? 'Policy enforcement active'}]`,
        confidence: 0,
        domain: agent.domain,
        model: agent.preferredModel,
        provider: agent.preferredProvider,
        totalTokens: 0,
        latencyMs: Date.now() - startTime,
        governanceVerdict: 'blocked' as const,
        prompt: '',
      };
    }
  }

  let response = '';
  let tokensUsed = 0;
  let success = false;

  const fullPrompt = `${agent.systemPrompt}\n\n## Shared Context from Nuro Mesh\n${context}\n\n## Query\n${query}\n\nProvide a focused, expert response from your domain perspective. End with a confidence score (0-100) on a new line in format: CONFIDENCE: [score]`;

  try {
    if (agent.preferredProvider === 'anthropic') {
      const result = await anthropic.messages.create({
        model: agent.preferredModel,
        max_tokens: 2048,
        messages: [{ role: 'user', content: fullPrompt }],
      });
      response = result.content[0]?.type === 'text' ? result.content[0].text : '';
      tokensUsed = result.usage.input_tokens + result.usage.output_tokens;
      success = true;
    } else if (agent.preferredProvider === 'openai') {
      const result = await openai.chat.completions.create({
        model: agent.preferredModel,
        max_completion_tokens: 2048,
        messages: [
          { role: 'system', content: agent.systemPrompt },
          {
            role: 'user',
            content: `## Shared Context\n${context}\n\n## Query\n${query}\n\nProvide a focused, expert response from your domain perspective. End with: CONFIDENCE: [0-100]`,
          },
        ],
      });
      response = result.choices[0]?.message?.content ?? '';
      tokensUsed = result.usage?.total_tokens ?? 0;
      success = true;
    } else if (agent.preferredProvider === 'gemini') {
      try {
        const result = await geminiAi.models.generateContent({
          model: agent.preferredModel,
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          config: { maxOutputTokens: 2048 },
        });
        response = result.text ?? '';
        success = true;
      } catch {
        const fallback = await openai.chat.completions.create({
          model: 'gpt-5.2',
          max_completion_tokens: 2048,
          messages: [
            { role: 'system', content: agent.systemPrompt },
            { role: 'user', content: fullPrompt },
          ],
        });
        response = fallback.choices[0]?.message?.content ?? '';
        tokensUsed = fallback.usage?.total_tokens ?? 0;
        success = true;
      }
    }
  } catch {
    response = `[${agent.name} unavailable — domain expertise offline]`;
    success = false;
  }

  const latencyMs = Date.now() - startTime;

  const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+)/i);
  const confidence = confidenceMatch ? Math.min(100, parseInt(confidenceMatch[1]!, 10)) : 75;
  const cleanResponse = response.replace(/CONFIDENCE:\s*\d+/gi, '').trim();

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
        model: agent.preferredModel,
        provider: agent.preferredProvider,
      })
      .onConflictDoNothing();
  } catch {}

  return {
    agentId: agent.id,
    agentName: agent.name,
    response: cleanResponse,
    confidence,
    domain: agent.domain,
    model: agent.preferredModel,
    provider: agent.preferredProvider,
    totalTokens: tokensUsed,
    latencyMs,
    governanceVerdict: 'allowed' as const,
    prompt: fullPrompt,
  };
}

async function runMakerChecker(
  primaryOutput: string,
  context: string,
  validatorAgent: AgentDefinition = AGENT_REGISTRY.find((a) => a.id === 'sentinel')!,
): Promise<{ validated: boolean; validatorNotes: string; adjustedOutput: string }> {
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

    const status = validationMatch?.[1]?.toUpperCase() ?? 'APPROVED';
    const notes = notesMatch?.[1]?.trim() ?? '';
    const adjustedOutput = outputMatch?.[1]?.trim() ?? primaryOutput;

    return {
      validated: status !== 'REJECTED',
      validatorNotes: notes,
      adjustedOutput:
        status !== 'REJECTED'
          ? adjustedOutput
          : `[Output rejected by Sentinel validation]\n\nOriginal output required revision: ${notes}`,
    };
  } catch {
    return {
      validated: true,
      validatorNotes: 'Validation unavailable',
      adjustedOutput: primaryOutput,
    };
  }
}

async function getSharedContext(): Promise<string> {
  try {
    const facts = await db
      .select()
      .from(agentMemoryFacts)
      .where(gt(agentMemoryFacts.expiresAt, new Date()))
      .orderBy(desc(agentMemoryFacts.importance))
      .limit(10);

    if (facts.length === 0) return 'No shared context available yet.';

    return facts
      .map(
        (f) =>
          `[${f.agentId.toUpperCase()}] ${f.factType.toUpperCase()}: ${f.content} (importance: ${f.importance}/10)`,
      )
      .join('\n');
  } catch {
    return 'Context retrieval unavailable.';
  }
}

nueroMeshRouter.post(
  '/nuro-mesh/orchestrate',
  meshRateLimit,
  async (req: Request, res: Response) => {
    const { query, preferredAgents, requireValidation, orgId, callerUserId, callerRoles } =
      req.body as {
        query: string;
        preferredAgents?: string[];
        requireValidation?: boolean;
        orgId?: number | null;
        callerUserId?: number | null;
        callerRoles?: string[];
      };

    if (!query?.trim()) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const context = await getSharedContext();
      res.write(
        `data: ${JSON.stringify({ type: 'status', message: 'Analyzing query and routing to domain agents...' })}\n\n`,
      );

      let targetAgents: AgentDefinition[];
      if (preferredAgents && preferredAgents.length > 0) {
        targetAgents = AGENT_REGISTRY.filter(
          (a) => preferredAgents.includes(a.id) && a.id !== 'alloy',
        );
      } else {
        targetAgents = routeToAgents(query);
      }

      if (targetAgents.length === 0)
        targetAgents = [AGENT_REGISTRY.find((a) => a.id === 'beacon')!];

      res.write(
        `data: ${JSON.stringify({ type: 'routing', agents: targetAgents.map((a) => ({ id: a.id, name: a.name, domain: a.domain })) })}\n\n`,
      );

      const agentResponses = await Promise.all(
        targetAgents.map((agent) => {
          res.write(
            `data: ${JSON.stringify({ type: 'agent_start', agentId: agent.id, agentName: agent.name })}\n\n`,
          );
          return callAgent(agent, query, context, {
            orgId,
            callerUserId,
            callerRoles,
            action: 'orchestrate',
          });
        }),
      );

      for (const response of agentResponses) {
        const { prompt: _p, ...safeResponse } = response;
        res.write(`data: ${JSON.stringify({ type: 'agent_response', ...safeResponse })}\n\n`);
      }

      const isHighStakes =
        requireValidation ||
        agentResponses.some((r) => {
          const agent = AGENT_REGISTRY.find((a) => a.id === r.agentId);
          return agent?.highStakesDomains.some((d) =>
            query.toLowerCase().includes(d.replace('_', ' ')),
          );
        });

      let validationResult: {
        validated: boolean;
        validatorNotes: string;
        adjustedOutput: string;
      } | null = null;

      if (isHighStakes && agentResponses.length > 0) {
        res.write(
          `data: ${JSON.stringify({ type: 'validation_start', message: 'High-stakes output detected — running Sentinel maker-checker validation...' })}\n\n`,
        );
        const primaryOutput = agentResponses
          .map((r) => `## ${r.agentName} (${r.domain})\n${r.response}`)
          .join('\n\n');
        validationResult = await runMakerChecker(primaryOutput, context);
        res.write(
          `data: ${JSON.stringify({ type: 'validation_result', validated: validationResult.validated, notes: validationResult.validatorNotes })}\n\n`,
        );
      }

      const aggregationInput = agentResponses
        .map((r) => `## ${r.agentName} Analysis (Confidence: ${r.confidence}%)\n${r.response}`)
        .join('\n\n---\n\n');

      const alloyAgent = AGENT_REGISTRY.find((a) => a.id === 'alloy')!;
      const aggregationPrompt = `${alloyAgent.systemPrompt}

## Query from User
${query}

## Domain Agent Responses
${aggregationInput}

${validationResult ? `## Sentinel Validation\nValidated: ${validationResult.validated}\nNotes: ${validationResult.validatorNotes}\n` : ''}

Synthesize these domain expert responses into a unified, actionable answer. Prioritize higher-confidence responses. Identify consensus and any conflicting perspectives. Be direct and operational.`;

      res.write(
        `data: ${JSON.stringify({ type: 'synthesis_start', message: 'Alloy synthesizing domain intelligence...' })}\n\n`,
      );

      const synthStartTime = Date.now();
      let synthesisContent = '';
      let synthStream;
      try {
        synthStream = await openai.chat.completions.create({
          model: alloyAgent.preferredModel,
          max_completion_tokens: 4096,
          messages: [{ role: 'user', content: aggregationPrompt }],
          stream: true,
        });
      } catch (streamInitErr) {
        const initErrMsg =
          streamInitErr instanceof Error
            ? streamInitErr.message
            : 'Failed to initialize synthesis stream';
        res.write(
          `data: ${JSON.stringify({ type: 'error', error: `Synthesis unavailable: ${initErrMsg}. Domain agent responses were collected successfully.`, partial: true, agentResponses: agentResponses.map((r) => ({ agentId: r.agentId, agentName: r.agentName, domain: r.domain, confidence: r.confidence })) })}\n\n`,
        );
        res.end();
        return;
      }

      let streamError: string | null = null;
      try {
        for await (const chunk of synthStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            synthesisContent += delta;
            res.write(`data: ${JSON.stringify({ type: 'synthesis_chunk', content: delta })}\n\n`);
          }
        }
      } catch (streamChunkErr) {
        streamError =
          streamChunkErr instanceof Error ? streamChunkErr.message : 'Stream interrupted';
        if (synthesisContent.length > 0) {
          res.write(
            `data: ${JSON.stringify({ type: 'synthesis_interrupted', message: 'Synthesis stream was interrupted. Partial response delivered.', error: streamError })}\n\n`,
          );
        } else {
          res.write(
            `data: ${JSON.stringify({ type: 'error', error: `Synthesis stream failed: ${streamError}. Domain agent responses were collected. Please retry.`, retryable: true })}\n\n`,
          );
          res.end();
          return;
        }
      }

      try {
        if (synthesisContent.length > 100) {
          await db
            .insert(agentMemoryFacts)
            .values({
              agentId: 'alloy',
              domain: 'orchestration',
              factType: 'insight',
              content: `Query: "${query.slice(0, 100)}" — ${synthesisContent.slice(0, 300)}`,
              importance: Math.round(
                agentResponses.reduce((sum, r) => sum + r.confidence, 0) /
                  agentResponses.length /
                  10,
              ),
              tags: targetAgents.map((a) => a.domain),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            })
            .onConflictDoNothing();
        }
      } catch {}

      const avgConf = Math.round(
        agentResponses.reduce((sum, r) => sum + r.confidence, 0) / agentResponses.length,
      );

      const agentEnvelopes = agentResponses.map((r) =>
        buildEnvelope({
          agentId: r.agentId,
          domain: r.domain,
          model: r.model,
          provider: r.provider,
          prompt: r.prompt,
          totalTokens: r.totalTokens,
          confidence: r.confidence,
          latencyMs: r.latencyMs,
          governanceVerdict: r.governanceVerdict,
        }),
      );

      const synthEnvelope = buildEnvelope({
        agentId: 'alloy',
        domain: 'orchestration',
        model: alloyAgent.preferredModel,
        provider: 'openai',
        prompt: aggregationPrompt,
        totalTokens: Math.round(synthesisContent.length / 4),
        confidence: avgConf,
        latencyMs: Date.now() - synthStartTime,
        governanceVerdict: 'allowed',
      });

      for (const env of [...agentEnvelopes, synthEnvelope]) {
        storeProvenance({ runId: env.runId, envelope: env, parentRunIds: [], consultations: [] });
      }

      const orchestrationLineage = {
        runId: synthEnvelope.runId,
        envelope: synthEnvelope,
        parentRunIds: agentEnvelopes.map((e) => e.runId),
        consultations: agentEnvelopes,
      };
      storeProvenance(orchestrationLineage);

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          agentCount: agentResponses.length,
          averageConfidence: avgConf,
          isHighStakes,
          validated: validationResult?.validated ?? null,
          provenance: {
            orchestrationRunId: synthEnvelope.runId,
            agentRunIds: agentEnvelopes.map((e) => e.runId),
            synthesizer: synthEnvelope,
            agents: agentEnvelopes,
          },
        })}\n\n`,
      );

      res.end();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Orchestration failed';
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
      res.end();
    }
  },
);

nueroMeshRouter.get('/nuro-mesh/agents', async (_req: Request, res: Response) => {
  try {
    const stats = await db
      .select()
      .from(agentUsageStats)
      .orderBy(desc(agentUsageStats.recordedAt))
      .limit(100);

    const agentStatsMap = new Map<
      string,
      {
        calls: number;
        totalTokens: number;
        totalLatency: number;
        successes: number;
      }
    >();

    for (const stat of stats) {
      const existing = agentStatsMap.get(stat.agentId) ?? {
        calls: 0,
        totalTokens: 0,
        totalLatency: 0,
        successes: 0,
      };
      agentStatsMap.set(stat.agentId, {
        calls: existing.calls + 1,
        totalTokens: existing.totalTokens + stat.tokensUsed,
        totalLatency: existing.totalLatency + stat.latencyMs,
        successes: existing.successes + (stat.success ? 1 : 0),
      });
    }

    const agents = AGENT_REGISTRY.map((agent) => {
      const agentStats = agentStatsMap.get(agent.id) ?? {
        calls: 0,
        totalTokens: 0,
        totalLatency: 0,
        successes: 0,
      };
      return {
        ...agent,
        stats: {
          totalCalls: agentStats.calls,
          totalTokens: agentStats.totalTokens,
          avgLatencyMs:
            agentStats.calls > 0 ? Math.round(agentStats.totalLatency / agentStats.calls) : 0,
          successRate:
            agentStats.calls > 0
              ? Math.round((agentStats.successes / agentStats.calls) * 100)
              : 100,
          estimatedCostUsd: parseFloat(((agentStats.totalTokens / 1000) * 0.002).toFixed(4)),
        },
      };
    });

    res.json({ agents, totalAgents: agents.length });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

nueroMeshRouter.get('/nuro-mesh/memory', async (req: Request, res: Response) => {
  try {
    const { agentId, domain, limit = '20' } = req.query as Record<string, string>;

    const conditions = [gt(agentMemoryFacts.expiresAt, new Date())];
    if (agentId) conditions.push(eq(agentMemoryFacts.agentId, agentId));
    if (domain) conditions.push(eq(agentMemoryFacts.domain, domain));

    const facts = await db
      .select()
      .from(agentMemoryFacts)
      .where(and(...conditions))
      .orderBy(desc(agentMemoryFacts.importance), desc(agentMemoryFacts.createdAt))
      .limit(Math.min(parseInt(limit, 10), 100));

    res.json({ facts, total: facts.length });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch memory facts' });
  }
});

nueroMeshRouter.post('/nuro-mesh/memory', meshRateLimit, async (req: Request, res: Response) => {
  try {
    const { agentId, domain, factType, content, importance, tags, ttlHours } = req.body as {
      agentId: string;
      domain: string;
      factType: string;
      content: string;
      importance?: number;
      tags?: string[];
      ttlHours?: number;
    };

    if (!agentId || !content || !factType) {
      res.status(400).json({ error: 'agentId, factType, and content are required' });
      return;
    }

    const expiresAt = new Date(Date.now() + (ttlHours ?? 24) * 60 * 60 * 1000);

    const [fact] = await db
      .insert(agentMemoryFacts)
      .values({
        agentId,
        domain: domain ?? 'general',
        factType,
        content,
        importance: Math.min(10, Math.max(1, importance ?? 5)),
        tags: tags ?? [],
        expiresAt,
      })
      .returning();

    res.status(201).json(fact);
  } catch (_err) {
    res.status(500).json({ error: 'Failed to store memory fact' });
  }
});

nueroMeshRouter.get('/nuro-mesh/tool-calls', async (req: Request, res: Response) => {
  try {
    const { agentId, limit = '50' } = req.query as Record<string, string>;
    const conditions = agentId ? [eq(agentToolCalls.agentId, agentId)] : [];

    const calls = await db
      .select()
      .from(agentToolCalls)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(agentToolCalls.calledAt))
      .limit(Math.min(parseInt(limit, 10), 200));

    res.json({ toolCalls: calls, total: calls.length });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch tool calls' });
  }
});

nueroMeshRouter.get('/nuro-mesh/advisory', async (_req: Request, res: Response) => {
  try {
    const findings = await db
      .select()
      .from(advisoryFindings)
      .orderBy(desc(advisoryFindings.generatedAt))
      .limit(20);

    res.json({ findings, total: findings.length });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch advisory findings' });
  }
});

nueroMeshRouter.post(
  '/nuro-mesh/advisory/run',
  meshRateLimit,
  async (req: Request, res: Response) => {
    const { analysisType } = req.body as { analysisType?: string };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const type = analysisType ?? 'security_posture';
      res.write(
        `data: ${JSON.stringify({ type: 'status', message: `Running ${type} advisory analysis...` })}\n\n`,
      );

      const analysisPrompts: Record<string, { agent: string; prompt: string; title: string }> = {
        security_posture: {
          agent: 'sentinel',
          title: 'Daily Security Posture Check',
          prompt:
            'Perform a comprehensive security posture assessment. Evaluate: current threat landscape, vulnerability exposure, incident response readiness, compliance status. Provide a security score (0-100) and top 3 actionable recommendations.',
        },
        readiness_summary: {
          agent: 'compass',
          title: 'Weekly Readiness Summary',
          prompt:
            'Generate a readiness maturity summary. Assess: organizational capability maturity, deployment readiness, operational gaps, improvement trajectory. Provide overall readiness score and priority actions.',
        },
        maritime_brief: {
          agent: 'helmsman',
          title: 'Maritime Intelligence Brief',
          prompt:
            'Generate a maritime operational brief. Assess: fleet operational status, active route risks, weather impacts, sanctions exposure, geopolitical threats to shipping lanes.',
        },
        platform_health: {
          agent: 'zeus',
          title: 'Infrastructure Health Report',
          prompt:
            'Generate an infrastructure health report. Assess: service availability, performance metrics, resource utilization, scaling needs, reliability risks. Provide health score and critical actions.',
        },
      };

      const analysis = analysisPrompts[type] ?? analysisPrompts.security_posture!;
      const agent =
        AGENT_REGISTRY.find((a) => a.id === analysis.agent) ??
        AGENT_REGISTRY.find((a) => a.id === 'beacon')!;

      res.write(
        `data: ${JSON.stringify({ type: 'agent_start', agentId: agent.id, agentName: agent.name })}\n\n`,
      );

      const context = await getSharedContext();
      // Advisory runs are platform-level (no per-tenant governance context)
      const result = await callAgent(agent, analysis.prompt, context, { action: 'advisory_run' });

      const scoreMatch = result.response.match(/score[:\s]+(\d+)/i);
      const score = scoreMatch ? parseInt(scoreMatch[1]!, 10) : result.confidence;

      const [finding] = await db
        .insert(advisoryFindings)
        .values({
          agentId: agent.id,
          agentName: agent.name,
          analysisType: type,
          title: analysis.title,
          content: result.response,
          severity: score >= 80 ? 'info' : score >= 60 ? 'warning' : 'critical',
          score,
          tags: [agent.domain, type],
        })
        .returning();

      res.write(`data: ${JSON.stringify({ type: 'finding', finding })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', findingId: finding?.id })}\n\n`);
      res.end();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Advisory run failed';
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
      res.end();
    }
  },
);

nueroMeshRouter.get('/nuro-mesh/usage-stats', async (_req: Request, res: Response) => {
  try {
    const stats = await db
      .select()
      .from(agentUsageStats)
      .orderBy(desc(agentUsageStats.recordedAt))
      .limit(500);

    const byAgent = new Map<
      string,
      {
        calls: number;
        tokens: number;
        latency: number;
        successes: number;
        provider: string;
        model: string;
      }
    >();
    const byProvider = new Map<string, { calls: number; tokens: number }>();

    for (const stat of stats) {
      const existing = byAgent.get(stat.agentId) ?? {
        calls: 0,
        tokens: 0,
        latency: 0,
        successes: 0,
        provider: stat.provider,
        model: stat.model,
      };
      byAgent.set(stat.agentId, {
        calls: existing.calls + 1,
        tokens: existing.tokens + stat.tokensUsed,
        latency: existing.latency + stat.latencyMs,
        successes: existing.successes + (stat.success ? 1 : 0),
        provider: stat.provider,
        model: stat.model,
      });

      const pExisting = byProvider.get(stat.provider) ?? { calls: 0, tokens: 0 };
      byProvider.set(stat.provider, {
        calls: pExisting.calls + 1,
        tokens: pExisting.tokens + stat.tokensUsed,
      });
    }

    const agentMetrics = Array.from(byAgent.entries()).map(([agentId, data]) => ({
      agentId,
      agentName: AGENT_REGISTRY.find((a) => a.id === agentId)?.name ?? agentId,
      ...data,
      avgLatencyMs: data.calls > 0 ? Math.round(data.latency / data.calls) : 0,
      successRate: data.calls > 0 ? Math.round((data.successes / data.calls) * 100) : 100,
      estimatedCostUsd: parseFloat(((data.tokens / 1000) * 0.002).toFixed(4)),
    }));

    const providerMetrics = Array.from(byProvider.entries()).map(([provider, data]) => ({
      provider,
      ...data,
      estimatedCostUsd: parseFloat(((data.tokens / 1000) * 0.002).toFixed(4)),
    }));

    const totalCalls = stats.length;
    const totalTokens = stats.reduce((sum, s) => sum + s.tokensUsed, 0);
    const totalCost = parseFloat(((totalTokens / 1000) * 0.002).toFixed(4));

    res.json({
      summary: { totalCalls, totalTokens, totalCost, agentCount: byAgent.size },
      agentMetrics,
      providerMetrics,
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch usage stats' });
  }
});

const CAUSAL_PATTERNS: Array<{
  cause: { domain: string; signal: string };
  effect: { domain: string; signal: string };
  strength: number;
  description: string;
}> = [
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
    cause: { domain: 'client_relations', signal: 'engagement_risk' },
    effect: { domain: 'creative', signal: 'campaign_pivot' },
    strength: 0.6,
    description: 'Client relationship risk may require repositioning messaging',
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

nueroMeshRouter.get('/nuro-mesh/causal-patterns', (_req: Request, res: Response) => {
  const domainMap = new Map<string, Array<(typeof CAUSAL_PATTERNS)[0]>>();
  for (const pattern of CAUSAL_PATTERNS) {
    const key = pattern.cause.domain;
    const list = domainMap.get(key) ?? [];
    list.push(pattern);
    domainMap.set(key, list);
  }

  const domains = Array.from(domainMap.entries()).map(([domain, patterns]) => ({
    domain,
    patterns: patterns.map((p) => ({
      cause: p.cause.signal,
      effect: `${p.effect.domain}:${p.effect.signal}`,
      strength: p.strength,
      description: p.description,
    })),
    affectedDomains: [...new Set(patterns.map((p) => p.effect.domain))],
  }));

  res.json({
    totalPatterns: CAUSAL_PATTERNS.length,
    domains,
    description:
      'Cross-domain causal intelligence patterns — when Signal A fires in Domain X, the mesh automatically surfaces cascading effects across Domain Y and Z',
  });
});

const agentPerformanceCache = new Map<
  string,
  {
    avgConfidence: number;
    avgLatencyMs: number;
    successRate: number;
    totalInvocations: number;
    lastUpdated: number;
  }
>();

nueroMeshRouter.get('/nuro-mesh/telemetry', async (_req: Request, res: Response) => {
  try {
    const stats = await db
      .select()
      .from(agentUsageStats)
      .orderBy(desc(agentUsageStats.recordedAt))
      .limit(500);

    for (const stat of stats) {
      const existing = agentPerformanceCache.get(stat.agentId) ?? {
        avgConfidence: 75,
        avgLatencyMs: 0,
        successRate: 1,
        totalInvocations: 0,
        lastUpdated: Date.now(),
      };

      const n = Math.min(existing.totalInvocations, 50);
      const newN = n + 1;
      existing.avgLatencyMs = (existing.avgLatencyMs * n + stat.latencyMs) / newN;
      existing.successRate = (existing.successRate * n + (stat.success ? 1 : 0)) / newN;
      existing.totalInvocations++;
      existing.lastUpdated = Date.now();
      agentPerformanceCache.set(stat.agentId, existing);
    }

    const profiles = AGENT_REGISTRY.filter((a) => a.id !== 'alloy').map((agent) => {
      const perf = agentPerformanceCache.get(agent.id);
      return {
        agentId: agent.id,
        agentName: agent.name,
        domain: agent.domain,
        avgConfidence: perf?.avgConfidence ?? 75,
        avgLatencyMs: perf ? Math.round(perf.avgLatencyMs) : 0,
        successRate: perf ? Math.round(perf.successRate * 100) : 100,
        totalInvocations: perf?.totalInvocations ?? 0,
        performanceScore: perf
          ? Math.round(
              (perf.avgConfidence / 100) * 40 +
                perf.successRate * 40 +
                Math.max(0, 1 - perf.avgLatencyMs / 10000) * 20,
            )
          : 50,
      };
    });

    const topPerformers = [...profiles]
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5);
    const needsAttention = profiles.filter((p) => p.performanceScore < 50 || p.successRate < 80);

    res.json({
      profiles,
      topPerformers: topPerformers.map((p) => ({
        agentId: p.agentId,
        name: p.agentName,
        score: p.performanceScore,
      })),
      needsAttention: needsAttention.map((p) => ({
        agentId: p.agentId,
        name: p.agentName,
        score: p.performanceScore,
        issue: p.successRate < 80 ? 'low_success_rate' : 'low_performance',
      })),
      causalPatternsActive: CAUSAL_PATTERNS.length,
      crossDomainAffinities: Object.keys(CROSS_DOMAIN_AFFINITY).length,
      description: 'Meta-intelligence about agent performance — the observability of the AI itself',
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

nueroMeshRouter.get('/nuro-mesh/telemetry/history', async (req: Request, res: Response) => {
  try {
    const {
      limit = '50',
      since,
      hasConflicts,
      hasCausalChains,
      agentId,
    } = req.query as Record<string, string>;
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);

    const rows = await db
      .select()
      .from(orchestrationTelemetryTable)
      .orderBy(desc(orchestrationTelemetryTable.timestamp))
      .limit(limitNum);

    let filtered = rows;

    if (since) {
      const sinceDate = new Date(since);
      filtered = filtered.filter((r) => r.timestamp >= sinceDate);
    }
    if (hasConflicts === 'true') {
      filtered = filtered.filter(
        (r) => Array.isArray(r.conflicts) && (r.conflicts as unknown[]).length > 0,
      );
    }
    if (hasCausalChains === 'true') {
      filtered = filtered.filter(
        (r) => Array.isArray(r.causalChains) && (r.causalChains as unknown[]).length > 0,
      );
    }
    if (agentId) {
      filtered = filtered.filter(
        (r) => Array.isArray(r.selectedAgents) && r.selectedAgents.includes(agentId),
      );
    }

    res.json({ history: filtered, total: filtered.length });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch telemetry history' });
  }
});

nueroMeshRouter.get('/nuro-mesh/telemetry/summary', async (_req: Request, res: Response) => {
  try {
    const recent = await db
      .select()
      .from(orchestrationTelemetryTable)
      .orderBy(desc(orchestrationTelemetryTable.timestamp))
      .limit(100);

    if (recent.length === 0) {
      res.json({
        totalRuns: 0,
        avgLatencyMs: 0,
        totalTokensBurned: 0,
        conflictRate: 0,
        causalChainRate: 0,
        proactiveActivationRate: 0,
      });
      return;
    }

    const totalRuns = recent.length;
    const avgLatencyMs = Math.round(
      recent.reduce((sum, r) => sum + r.totalLatencyMs, 0) / totalRuns,
    );
    const totalTokensBurned = recent.reduce((sum, r) => sum + r.tokensBurned, 0);
    const conflictCount = recent.filter(
      (r) => Array.isArray(r.conflicts) && (r.conflicts as unknown[]).length > 0,
    ).length;
    const causalCount = recent.filter(
      (r) => Array.isArray(r.causalChains) && (r.causalChains as unknown[]).length > 0,
    ).length;
    const proactiveCount = recent.filter(
      (r) =>
        Array.isArray(r.proactiveActivations) && (r.proactiveActivations as unknown[]).length > 0,
    ).length;
    const avgAgents =
      Math.round((recent.reduce((sum, r) => sum + r.selectedAgents.length, 0) / totalRuns) * 10) /
      10;

    res.json({
      totalRuns,
      avgLatencyMs,
      totalTokensBurned,
      conflictRate: Math.round((conflictCount / totalRuns) * 100),
      causalChainRate: Math.round((causalCount / totalRuns) * 100),
      proactiveActivationRate: Math.round((proactiveCount / totalRuns) * 100),
      avgAgentsPerRun: avgAgents,
      description: 'Aggregated orchestration telemetry across recent 100 runs',
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch telemetry summary' });
  }
});

nueroMeshRouter.get('/nuro-mesh/red-team/findings', async (req: Request, res: Response) => {
  try {
    const { limit = '20', orchestrationId } = req.query as Record<string, string>;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const findings = await db
      .select()
      .from(redTeamFindingsTable)
      .orderBy(desc(redTeamFindingsTable.createdAt))
      .limit(limitNum);

    const filtered = orchestrationId
      ? findings.filter((f) => f.orchestrationId === orchestrationId)
      : findings;

    res.json({ findings: filtered, total: filtered.length });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch red team findings' });
  }
});

nueroMeshRouter.post('/nuro-mesh/red-team', meshRateLimit, async (req: Request, res: Response) => {
  const { query, agentResponses } = req.body as {
    query: string;
    agentResponses: Array<{
      agentId: string;
      agentName: string;
      domain: string;
      response: string;
      confidence: number;
    }>;
  };

  if (!query?.trim() || !Array.isArray(agentResponses) || agentResponses.length === 0) {
    res.status(400).json({ error: 'query and agentResponses are required' });
    return;
  }

  try {
    const orchestrationId = `manual-rt-${Date.now()}`;
    const challengers = ['sentinel', 'lexis', 'atlas', 'beacon', 'compass'].filter(
      (id) => !agentResponses.some((r) => r.agentId === id),
    );
    const challengerAgent =
      AGENT_REGISTRY.find((a) => challengers.includes(a.id)) ??
      AGENT_REGISTRY.find((a) => a.id === 'sentinel');

    if (!challengerAgent) {
      res.status(400).json({ error: 'No available challenger agent' });
      return;
    }

    const findings = [];
    const context = await getSharedContext();

    for (const target of agentResponses.slice(0, 2)) {
      const challengePrompt = `You are performing adversarial red-team analysis.

## Original Query: ${query.slice(0, 300)}
## Agent Response to Challenge (${target.agentName}, ${target.domain}):
${target.response.slice(0, 1500)}

Identify: logical gaps, unstated assumptions, contradictory evidence, failure modes. Be rigorous.
Respond with JSON: { "logicalGaps": [...], "unstatedAssumptions": [...], "contradictoryEvidence": [...], "failureModes": [...], "overallVulnerability": "critical|high|medium|low", "recommendation": "..." }`;

      const result = await callAgent(challengerAgent, challengePrompt, context, {
        action: 'red_team',
      });
      let parsed: Record<string, unknown> = {};
      try {
        const match = result.response.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]) as Record<string, unknown>;
      } catch {}

      const vulnerability = (
        ['critical', 'high', 'medium', 'low'].includes(String(parsed.overallVulnerability))
          ? parsed.overallVulnerability
          : 'medium'
      ) as string;
      findings.push({
        findingId: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        challengerAgentId: challengerAgent.id,
        challengerAgentName: challengerAgent.name,
        targetAgentId: target.agentId,
        logicalGaps: Array.isArray(parsed.logicalGaps)
          ? parsed.logicalGaps.map(String).slice(0, 3)
          : [],
        unstatedAssumptions: Array.isArray(parsed.unstatedAssumptions)
          ? parsed.unstatedAssumptions.map(String).slice(0, 3)
          : [],
        contradictoryEvidence: Array.isArray(parsed.contradictoryEvidence)
          ? parsed.contradictoryEvidence.map(String).slice(0, 2)
          : [],
        failureModes: Array.isArray(parsed.failureModes)
          ? parsed.failureModes.map(String).slice(0, 3)
          : [],
        overallVulnerability: vulnerability,
        recommendation: String(parsed.recommendation ?? 'Additional verification recommended'),
      });
    }

    const criticalIssues = findings.filter(
      (f) => f.overallVulnerability === 'critical' || f.overallVulnerability === 'high',
    ).length;

    try {
      await db.insert(redTeamFindingsTable).values({
        orchestrationId,
        query: query.slice(0, 500),
        findings: findings as unknown as Record<string, unknown>,
        overallAssessment:
          criticalIssues > 0
            ? `${criticalIssues} high-severity issue(s) found`
            : 'No critical issues found',
        challengesRaised: findings.length,
        criticalIssues,
      });
    } catch {}

    res.json({ orchestrationId, findings, challengesRaised: findings.length, criticalIssues });
  } catch (_err) {
    res.status(500).json({ error: 'Red team analysis failed' });
  }
});

nueroMeshRouter.get('/nuro-mesh/predictive-cache', async (req: Request, res: Response) => {
  try {
    const { limit = '20' } = req.query as Record<string, string>;
    const now = new Date();

    const entries = await db
      .select()
      .from(predictivePrecomputeCacheTable)
      .where(gte(predictivePrecomputeCacheTable.expiresAt, now))
      .orderBy(desc(predictivePrecomputeCacheTable.createdAt))
      .limit(Math.min(parseInt(limit, 10) || 20, 100));

    res.json({
      cacheSize: entries.length,
      entries: entries.map((e) => ({
        cacheKey: e.cacheKey,
        predictedQuery: e.predictedQuery,
        likelihood: e.likelihood,
        domains: e.domains,
        avgConfidence: e.avgConfidence,
        agentCount: e.agentCount,
        hitCount: e.hitCount,
        computedAt: e.createdAt,
        expiresAt: e.expiresAt,
      })),
    });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch predictive cache' });
  }
});

nueroMeshRouter.get('/nuro-mesh/prompt-evolution', async (req: Request, res: Response) => {
  try {
    const { agentId, status, limit = '50' } = req.query as Record<string, string>;

    const rows = await db
      .select()
      .from(agentPromptEvolutionTable)
      .orderBy(desc(agentPromptEvolutionTable.createdAt))
      .limit(Math.min(parseInt(limit, 10) || 50, 200));

    let filtered = rows;
    if (agentId) filtered = filtered.filter((r) => r.agentId === agentId);
    if (status) filtered = filtered.filter((r) => r.status === status);

    const summary = {
      total: filtered.length,
      byRiskLevel: {
        low: filtered.filter((r) => r.riskLevel === 'low').length,
        medium: filtered.filter((r) => r.riskLevel === 'medium').length,
        high: filtered.filter((r) => r.riskLevel === 'high').length,
      },
      byStatus: {
        proposed: filtered.filter((r) => r.status === 'proposed').length,
        applied: filtered.filter((r) => r.status === 'applied').length,
        rejected: filtered.filter((r) => r.status === 'rejected').length,
      },
    };

    res.json({ proposals: filtered, summary });
  } catch (_err) {
    res.status(500).json({ error: 'Failed to fetch prompt evolution proposals' });
  }
});

nueroMeshRouter.post(
  '/nuro-mesh/prompt-evolution/run',
  meshRateLimit,
  async (_req: Request, res: Response) => {
    try {
      const { agentUsageStats: statsTable } = await import('@szl-holdings/db');
      const results: Array<{ agentId: string; agentName: string; status: string; reason: string }> =
        [];

      for (const agent of AGENT_REGISTRY.filter((a) => a.id !== 'alloy')) {
        const stats = await db
          .select()
          .from(statsTable)
          .where(eq(statsTable.agentId, agent.id))
          .orderBy(desc(statsTable.recordedAt))
          .limit(50);

        if (stats.length < 10) {
          results.push({
            agentId: agent.id,
            agentName: agent.name,
            status: 'skipped',
            reason: 'Insufficient invocations (<10)',
          });
          continue;
        }

        const successRate = stats.filter((s) => s.success).length / stats.length;
        const avgConfidence = 75;
        const needsWork = successRate < 0.8 || avgConfidence < 70;

        if (!needsWork) {
          results.push({
            agentId: agent.id,
            agentName: agent.name,
            status: 'skipped',
            reason: 'Performance within acceptable bounds',
          });
          continue;
        }

        const riskLevel = successRate < 0.6 ? 'high' : successRate < 0.75 ? 'medium' : 'low';

        try {
          await db.insert(agentPromptEvolutionTable).values({
            agentId: agent.id,
            agentName: agent.name,
            currentPromptHash: agent.systemPrompt.slice(0, 8),
            refinementType: successRate < 0.7 ? 'remove_weakness' : 'calibrate_tone',
            proposedAddition: `Focus on providing concrete, quantified ${agent.domain} metrics. Always cite specific data points.`,
            proposedRemoval: null,
            rationale: `Success rate at ${Math.round(successRate * 100)}% — below 80% threshold for ${agent.domain} domain`,
            riskLevel,
            expectedConfidenceImpact: 5,
            requiresHumanReview: riskLevel !== 'low',
            avgConfidenceBefore: avgConfidence,
            successRateBefore: Math.round(successRate * 100),
            totalInvocations: stats.length,
            status: 'proposed',
          });

          results.push({
            agentId: agent.id,
            agentName: agent.name,
            status: 'proposed',
            reason: `Success rate: ${Math.round(successRate * 100)}%`,
          });
        } catch {
          results.push({
            agentId: agent.id,
            agentName: agent.name,
            status: 'error',
            reason: 'DB insert failed',
          });
        }
      }

      res.json({
        proposalsGenerated: results.filter((r) => r.status === 'proposed').length,
        skipped: results.filter((r) => r.status === 'skipped').length,
        results,
      });
    } catch (_err) {
      res.status(500).json({ error: 'Prompt evolution cycle failed' });
    }
  },
);

export default nueroMeshRouter;
