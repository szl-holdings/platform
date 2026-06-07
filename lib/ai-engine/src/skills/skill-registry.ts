export interface SkillInputSchema {
  required: string[];
  properties: Record<string, { type: string; description: string }>;
}

export interface SkillOutputSchema {
  properties: Record<string, { type: string; description: string }>;
}

export interface SkillTriggerCondition {
  keywords: string[];
  domains: string[];
  minConfidenceThreshold: number;
}

export type SkillCategory =
  | 'analysis'
  | 'synthesis'
  | 'extraction'
  | 'generation'
  | 'validation'
  | 'monitoring'
  | 'research'
  | 'orchestration';

export interface SkillPackage {
  skillId: string;
  name: string;
  description: string;
  version: string;
  category: SkillCategory;
  applicableAgents: string[];
  triggerConditions: SkillTriggerCondition;
  inputSchema: SkillInputSchema;
  outputSchema: SkillOutputSchema;
  chainable: boolean;
  chainableWith: string[];
  estimatedTokens: number;
  systemPromptFragment: string;
  executionHint: string;
}

const SKILL_REGISTRY: Map<string, SkillPackage> = new Map(<[string, SkillPackage][]>[
  [
    'threat_triage',
    {
      skillId: 'threat_triage',
      name: 'Threat Triage',
      description: 'Rapidly classify and prioritize cybersecurity threats using MITRE ATT&CK',
      version: '1.0.0',
      category: 'analysis',
      applicableAgents: ['sentinel', 'alloy'],
      triggerConditions: {
        keywords: ['threat', 'attack', 'vulnerability', 'breach', 'incident', 'malware', 'CVE'],
        domains: ['security'],
        minConfidenceThreshold: 0.6,
      },
      inputSchema: {
        required: ['threatDescription'],
        properties: {
          threatDescription: {
            type: 'string',
            description: 'Description of the threat or incident',
          },
          affectedAssets: { type: 'array', description: 'List of affected systems or assets' },
          context: { type: 'string', description: 'Additional context' },
        },
      },
      outputSchema: {
        properties: {
          severity: { type: 'string', description: 'Critical/High/Medium/Low' },
          mitreId: { type: 'string', description: 'MITRE ATT&CK technique ID' },
          priority: { type: 'string', description: 'P0-P4 priority level' },
          recommendedAction: { type: 'string', description: 'Immediate recommended action' },
        },
      },
      chainable: true,
      chainableWith: ['incident_response_plan', 'escalation_decision', 'executive_brief'],
      estimatedTokens: 600,
      systemPromptFragment:
        'Apply MITRE ATT&CK framework. Classify with CVSS scoring. Output severity, technique ID, and priority.',
      executionHint: 'Use CVE database and threat feeds for context. Validate against known IOCs.',
    },
  ],
  [
    'maritime_risk_scoring',
    {
      skillId: 'maritime_risk_scoring',
      name: 'Maritime Risk Scoring',
      description: 'Score maritime route and vessel risk using AIS, sanctions, and weather data',
      version: '1.0.0',
      category: 'analysis',
      applicableAgents: ['helmsman'],
      triggerConditions: {
        keywords: ['vessel', 'route', 'ship', 'AIS', 'port', 'cargo', 'maritime', 'fleet'],
        domains: ['maritime'],
        minConfidenceThreshold: 0.65,
      },
      inputSchema: {
        required: ['vesselOrRoute'],
        properties: {
          vesselOrRoute: { type: 'string', description: 'Vessel MMSI, name, or route description' },
          timeRange: { type: 'string', description: 'Time window for analysis' },
          sanctionsCheck: {
            type: 'boolean',
            description: 'Whether to include sanctions screening',
          },
        },
      },
      outputSchema: {
        properties: {
          riskScore: { type: 'number', description: '0-100 risk score' },
          riskFactors: { type: 'array', description: 'Contributing risk factors' },
          recommendation: { type: 'string', description: 'Operational recommendation' },
        },
      },
      chainable: true,
      chainableWith: ['route_optimization', 'sanctions_screening'],
      estimatedTokens: 800,
      systemPromptFragment:
        'Use AIS data, BIMCO guidelines, and sanctions lists. Calculate composite risk score.',
      executionHint:
        'Cross-reference vessel history, flag state, and owner/operator against sanctions databases.',
    },
  ],
  [
    'research_synthesis',
    {
      skillId: 'research_synthesis',
      name: 'Research Synthesis',
      description:
        'Synthesize AI/ML research papers, models, and datasets into actionable intelligence',
      version: '1.0.0',
      category: 'research',
      applicableAgents: ['inca'],
      triggerConditions: {
        keywords: ['research', 'paper', 'model', 'dataset', 'AI', 'machine learning', 'benchmark'],
        domains: ['research'],
        minConfidenceThreshold: 0.55,
      },
      inputSchema: {
        required: ['topic'],
        properties: {
          topic: { type: 'string', description: 'Research topic or query' },
          depth: { type: 'string', description: 'shallow|standard|deep' },
          modelTypes: { type: 'array', description: 'Types of models to consider' },
        },
      },
      outputSchema: {
        properties: {
          summary: { type: 'string', description: 'Research synthesis' },
          keyFindings: { type: 'array', description: 'Key findings' },
          recommendedModels: { type: 'array', description: 'Recommended models for evaluation' },
        },
      },
      chainable: true,
      chainableWith: ['model_evaluation', 'executive_brief'],
      estimatedTokens: 1200,
      systemPromptFragment:
        'Synthesize from arXiv, HuggingFace, and academic sources. Cite evidence. Focus on actionable insights.',
      executionHint: 'Search HuggingFace for relevant models. Cross-reference with arXiv papers.',
    },
  ],
  [
    'anomaly_detection',
    {
      skillId: 'anomaly_detection',
      name: 'Anomaly Detection',
      description: 'Detect operational anomalies from metrics, logs, and time-series data',
      version: '1.0.0',
      category: 'monitoring',
      applicableAgents: ['beacon', 'zeus'],
      triggerConditions: {
        keywords: ['anomaly', 'metric', 'performance', 'latency', 'SLO', 'alert', 'degradation'],
        domains: ['analytics', 'infrastructure'],
        minConfidenceThreshold: 0.6,
      },
      inputSchema: {
        required: ['metricDescription'],
        properties: {
          metricDescription: {
            type: 'string',
            description: 'Description of metrics or system state',
          },
          baseline: { type: 'object', description: 'Baseline performance data' },
          threshold: { type: 'number', description: 'Alert threshold' },
        },
      },
      outputSchema: {
        properties: {
          anomaliesDetected: { type: 'boolean', description: 'Whether anomalies were detected' },
          anomalies: { type: 'array', description: 'List of anomalies' },
          severity: { type: 'string', description: 'Anomaly severity' },
          rootCauseHypothesis: { type: 'string', description: 'Likely root cause' },
        },
      },
      chainable: true,
      chainableWith: ['incident_response_plan', 'infrastructure_diagnosis'],
      estimatedTokens: 700,
      systemPromptFragment:
        'Apply statistical analysis and rule-based detection. Identify root cause patterns.',
      executionHint:
        'Compare against historical baselines. Apply 3-sigma rule for statistical anomalies.',
    },
  ],
  [
    'incident_response_plan',
    {
      skillId: 'incident_response_plan',
      name: 'Incident Response Plan',
      description:
        'Generate structured incident response plans with containment, eradication, and recovery steps',
      version: '1.0.0',
      category: 'generation',
      applicableAgents: ['sentinel', 'alloy'],
      triggerConditions: {
        keywords: ['incident', 'response', 'containment', 'eradication', 'recovery', 'playbook'],
        domains: ['security'],
        minConfidenceThreshold: 0.7,
      },
      inputSchema: {
        required: ['incidentDescription', 'affectedSystems'],
        properties: {
          incidentDescription: { type: 'string', description: 'Description of the incident' },
          affectedSystems: { type: 'array', description: 'Affected systems' },
          phase: { type: 'string', description: 'containment|eradication|recovery' },
        },
      },
      outputSchema: {
        properties: {
          steps: { type: 'array', description: 'Ordered response steps' },
          rollbackPlan: { type: 'string', description: 'Rollback plan' },
          successCriteria: { type: 'array', description: 'Success criteria' },
        },
      },
      chainable: true,
      chainableWith: ['escalation_decision', 'executive_brief'],
      estimatedTokens: 1500,
      systemPromptFragment:
        'Generate NIST IR framework-aligned response plan. Be specific about ownership and timelines.',
      executionHint: 'Reference NIST SP 800-61 playbooks. Include rollback steps for every action.',
    },
  ],
  [
    'executive_brief',
    {
      skillId: 'executive_brief',
      name: 'Executive Brief',
      description:
        'Translate technical findings into executive-level summaries with business impact',
      version: '1.0.0',
      category: 'synthesis',
      applicableAgents: ['alloy', 'sentinel', 'compass'],
      triggerConditions: {
        keywords: [
          'executive',
          'brief',
          'board',
          'C-suite',
          'summary',
          'business impact',
          'leadership',
        ],
        domains: ['security', 'analytics', 'orchestration'],
        minConfidenceThreshold: 0.6,
      },
      inputSchema: {
        required: ['technicalFindings'],
        properties: {
          technicalFindings: { type: 'string', description: 'Technical findings to brief' },
          audience: { type: 'string', description: 'board|executive|management' },
          riskLevel: { type: 'string', description: 'Overall risk level' },
        },
      },
      outputSchema: {
        properties: {
          headline: { type: 'string', description: 'Executive headline' },
          situationOverview: { type: 'string', description: 'Business-friendly overview' },
          recommendations: { type: 'array', description: 'Executive recommendations' },
          riskSummary: { type: 'object', description: 'Risk summary' },
        },
      },
      chainable: false,
      chainableWith: [],
      estimatedTokens: 800,
      systemPromptFragment:
        'Translate technical details to business risk. No jargon. Focus on financial and operational impact.',
      executionHint: 'Avoid technical acronyms. Lead with business impact, not technical details.',
    },
  ],
  [
    'escalation_decision',
    {
      skillId: 'escalation_decision',
      name: 'Escalation Decision',
      description:
        'Determine whether and how to escalate an issue through organizational hierarchy',
      version: '1.0.0',
      category: 'analysis',
      applicableAgents: ['alloy', 'sentinel', 'helmsman'],
      triggerConditions: {
        keywords: ['escalate', 'escalation', 'notify', 'alert', 'senior', 'manager', 'director'],
        domains: ['security', 'maritime', 'orchestration'],
        minConfidenceThreshold: 0.65,
      },
      inputSchema: {
        required: ['issueDescription', 'currentStatus'],
        properties: {
          issueDescription: { type: 'string', description: 'Issue requiring escalation decision' },
          currentStatus: { type: 'string', description: 'Current handling status' },
          timeToImpact: { type: 'string', description: 'Estimated time to business impact' },
        },
      },
      outputSchema: {
        properties: {
          shouldEscalate: { type: 'boolean', description: 'Whether to escalate' },
          escalationLevel: { type: 'string', description: 'Escalation level' },
          reason: { type: 'string', description: 'Escalation rationale' },
          recipients: { type: 'array', description: 'Recommended recipients' },
        },
      },
      chainable: true,
      chainableWith: ['executive_brief'],
      estimatedTokens: 500,
      systemPromptFragment:
        'Apply RACI matrix logic. Consider time criticality, business impact, and escalation fatigue.',
      executionHint: 'Only escalate when current level cannot resolve within impact window.',
    },
  ],
  [
    'readiness_gap_analysis',
    {
      skillId: 'readiness_gap_analysis',
      name: 'Readiness Gap Analysis',
      description: 'Score organizational readiness and identify capability gaps against frameworks',
      version: '1.0.0',
      category: 'analysis',
      applicableAgents: ['compass'],
      triggerConditions: {
        keywords: [
          'readiness',
          'maturity',
          'gap',
          'assessment',
          'capability',
          'score',
          'framework',
        ],
        domains: ['readiness'],
        minConfidenceThreshold: 0.6,
      },
      inputSchema: {
        required: ['framework', 'scope'],
        properties: {
          framework: {
            type: 'string',
            description: 'Assessment framework (NIST, ISO, SOC2, etc.)',
          },
          scope: { type: 'string', description: 'Assessment scope' },
          currentState: { type: 'string', description: 'Current state description' },
        },
      },
      outputSchema: {
        properties: {
          overallScore: { type: 'number', description: '0-100 maturity score' },
          gaps: { type: 'array', description: 'Identified gaps' },
          roadmap: { type: 'array', description: 'Improvement roadmap' },
        },
      },
      chainable: true,
      chainableWith: ['executive_brief'],
      estimatedTokens: 1000,
      systemPromptFragment:
        'Apply CMMI levels. Score each domain. Prioritize gaps by risk and feasibility.',
      executionHint: 'Reference framework controls. Map gaps to specific control failures.',
    },
  ],
]);

export function getSkill(skillId: string): SkillPackage | null {
  return SKILL_REGISTRY.get(skillId) ?? null;
}

export function getAllSkills(): SkillPackage[] {
  return Array.from(SKILL_REGISTRY.values());
}

export function getSkillsForAgent(agentId: string): SkillPackage[] {
  return getAllSkills().filter((s) => s.applicableAgents.includes(agentId));
}

export function discoverSkillsForQuery(query: string, agentId?: string): SkillPackage[] {
  const lower = query.toLowerCase();
  const scored = getAllSkills()
    .filter((s) => !agentId || s.applicableAgents.includes(agentId))
    .map((skill) => {
      let score = 0;
      for (const kw of skill.triggerConditions.keywords) {
        if (lower.includes(kw.toLowerCase())) score += 3;
      }
      const queryWords = lower.split(/\s+/).filter((w) => w.length > 3);
      const descWords = `${skill.name} ${skill.description}`.toLowerCase();
      for (const w of queryWords) {
        if (descWords.includes(w)) score += 1;
      }
      return { skill, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map((s) => s.skill);
}

export function resolveSkillChain(rootSkillId: string, maxDepth = 3): SkillPackage[] {
  const chain: SkillPackage[] = [];
  const seen = new Set<string>();

  function traverse(skillId: string, depth: number) {
    if (depth > maxDepth || seen.has(skillId)) return;
    const skill = getSkill(skillId);
    if (!skill) return;
    seen.add(skillId);
    chain.push(skill);
    for (const nextId of skill.chainableWith) {
      traverse(nextId, depth + 1);
    }
  }

  traverse(rootSkillId, 0);
  return chain;
}

export function registerSkill(skill: SkillPackage): void {
  SKILL_REGISTRY.set(skill.skillId, skill);
}
