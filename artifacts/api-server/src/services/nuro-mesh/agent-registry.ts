
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
    name: 'Counsel',
    domain: 'orchestration',
    preferredModel: 'gpt-5.2',
    preferredProvider: 'openai',
    highStakesDomains: [],
    tools: ['system_health', 'admin_overview'],
    systemPrompt: `You are Alloy, the central orchestration intelligence of the Nuro Mesh — SZL Holdings' unified multi-agent AI system. You coordinate specialized domain agents, aggregate their insights, and provide unified intelligence across the entire SZL platform. You route complex questions to the right domain experts, synthesize their responses, and present coherent, actionable answers. You have access to live system data and coordinate with: Helmsman (maritime), Sentinel (security), Counsel (research), Muse (creative), Beacon (analytics), Zeus (infrastructure), Compass (readiness), Lexis (legal/compliance), Atlas (financial/portfolio), Terra (real estate), Praxis (client relations). Be direct, authoritative, and orchestrate intelligently.`,
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
    name: 'Counsel',
    domain: 'research',
    preferredModel: 'gemini-3.1-pro-preview',
    preferredProvider: 'gemini',
    highStakesDomains: [],
    tools: ['huggingface_search', 'arxiv_search', 'model_registry'],
    systemPrompt: `You are Counsel, the AI research intelligence agent within the Nuro Mesh. You specialize in AI/ML research, model evaluation, academic literature analysis, and technology trend assessment. You can search HuggingFace for relevant models, analyze research papers, and provide cutting-edge AI insights. Use precise technical language, cite your reasoning, and focus on actionable research intelligence.`,
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
    systemPrompt: `You are Lexis, the legal and compliance intelligence agent within the Nuro Mesh, dedicated to Counsel matters. You specialize in legal matter management, regulatory compliance analysis, contract risk assessment, litigation strategy, and compliance audit support. You analyze contracts, regulations, and case precedents to surface material legal risks and actionable counsel recommendations. For high-stakes findings (regulatory violations, active litigation, sanctions exposure), flag them explicitly for human legal review. Cite applicable regulations, statutes, and case law where relevant. Be precise, risk-aware, and privilege-conscious.`,
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
    name: 'Terra',
    domain: 'real_estate',
    preferredModel: 'gpt-5.2',
    preferredProvider: 'openai',
    highStakesDomains: ['deal_risk', 'valuation_alert', 'zoning_issue', 'title_defect'],
    tools: ['property_data', 'market_comps', 'geo_analysis', 'deal_pipeline', 'valuation_models'],
    systemPrompt: `You are Terra, the real estate intelligence agent within the Nuro Mesh, powering Terra property analytics. You specialize in property valuation, deal pipeline management, market comparables analysis, geographic market intelligence, zoning and title risk assessment, and investment underwriting. You analyze real estate transactions across the SZL portfolio — surfacing pricing risks, market dislocation, and deal-level red flags. Use real estate finance metrics (cap rate, NOI, IRR, LTV, DSCR) with precision. For title defects or zoning issues on active deals, escalate immediately. Be data-driven and deal-focused.`,
  },
  {
    id: 'nexus',
    name: 'Praxis',
    domain: 'client_relations',
    preferredModel: 'claude-sonnet-4-6',
    preferredProvider: 'anthropic',
    highStakesDomains: [],
    tools: ['crm_data', 'engagement_tracking', 'proposal_generator', 'client_history'],
    systemPrompt: `You are Praxis, the client relations intelligence agent within the Nuro Mesh, supporting Carlota Jo consulting workflows. You specialize in client relationship management, engagement tracking, proposal development, client satisfaction analysis, and consulting delivery intelligence. You help structure client communications, synthesize engagement history, identify relationship risks, and support proposal and SOW development. Be professional, client-centric, and attuned to the nuances of consulting relationships. Surface upsell opportunities and engagement health signals proactively.`,
  },
];

export const DOMAIN_ROUTING_RULES: Record<string, string[]> = {
  maritime: [
    'vessel',
    'ship',
    'fleet',
    'port',
    'ais',
    'mmsi',
    'cargo',
    'voyage',
    'route',
    'maritime',
    'nautical',
    'sanctions',
    'sea',
    'ocean',
    'captain',
    'crew',
    'freight',
  ],
  security: [
    'threat',
    'vulnerability',
    'cve',
    'attack',
    'breach',
    'malware',
    'ransomware',
    'phishing',
    'incident',
    'security',
    'cvss',
    'exploit',
    'patch',
    'firewall',
    'intrusion',
  ],
  research: [
    'model',
    'paper',
    'research',
    'huggingface',
    'arxiv',
    'llm',
    'ai',
    'machine learning',
    'neural',
    'transformer',
    'fine-tuning',
    'benchmark',
    'dataset',
    'inference',
  ],
  creative: [
    'content',
    'marketing',
    'campaign',
    'brand',
    'creative',
    'copy',
    'social media',
    'blog',
    'narrative',
    'strategy',
    'messaging',
    'engagement',
  ],
  analytics: [
    'metric',
    'performance',
    'dashboard',
    'kpi',
    'signal',
    'anomaly',
    'trend',
    'report',
    'analysis',
    'data',
    'analytics',
    'telemetry',
    'uptime',
    'latency',
  ],
  infrastructure: [
    'cloud',
    'azure',
    'server',
    'database',
    'api',
    'deploy',
    'kubernetes',
    'docker',
    'infrastructure',
    'devops',
    'reliability',
    'scaling',
    'cost',
    'resource',
  ],
  readiness: [
    'readiness',
    'maturity',
    'certification',
    'compliance',
    'gap analysis',
    'capability',
    'assessment',
    'score',
    'benchmark',
    'improvement',
    'roadmap',
  ],
  legal: [
    'legal',
    'contract',
    'regulation',
    'compliance',
    'litigation',
    'matter',
    'law',
    'statute',
    'clause',
    'risk',
    'liability',
    'counsel',
    'attorney',
    'dispute',
    'settlement',
    'sanctions',
  ],
  financial: [
    'portfolio',
    'investment',
    'irr',
    'moic',
    'nav',
    'fund',
    'capital',
    'valuation',
    'deal',
    'acquisition',
    'return',
    'risk',
    'equity',
    'debt',
    'financial',
  ],
  real_estate: [
    'property',
    'real estate',
    'lease',
    'rent',
    'tenant',
    'zoning',
    'title',
    'cap rate',
    'noi',
    'building',
    'land',
    'development',
    'terra',
    'comps',
    'valuation',
  ],
  client_relations: [
    'client',
    'engagement',
    'proposal',
    'consulting',
    'relationship',
    'crm',
    'satisfaction',
    'deliverable',
    'sow',
    'project',
    'carlota',
    'account',
  ],
};

export const DOMAIN_SEMANTIC_INTENTS: Record<string, string[]> = {
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

export const CROSS_DOMAIN_AFFINITY: Record<string, string[]> = {
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

export function routeToAgents(query: string): AgentDefinition[] {
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
