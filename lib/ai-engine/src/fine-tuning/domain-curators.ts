/**
 * Domain-Specific Dataset Curators
 *
 * For each agent domain (maritime/Helmsman, security/Sentinel, legal/Prism, etc.)
 * implements filtering logic that selects relevant training examples from the shared pool,
 * enriches them with domain context, and produces agent-specific training datasets.
 */

import {
  type DatasetExportResult,
  type ExportFormat,
  exportTrainingData,
} from './dataset-exporter.js';

export interface DomainCuratorConfig {
  agentId: string;
  domain: string;
  keywords: string[];
  systemPromptEnrichment: string;
  minQualityRating: number;
  maxSamples: number;
  preferredCategories: string[];
}

export const DOMAIN_CURATOR_CONFIGS: DomainCuratorConfig[] = [
  {
    agentId: 'helmsman',
    domain: 'maritime',
    keywords: [
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
      'sanctions',
      'imm',
      'imo',
      'flag',
      'ballast',
      'draft',
    ],
    systemPromptEnrichment:
      'Focus on maritime domain expertise: fleet tracking, AIS data interpretation, route risk assessment, sanctions screening, port state control, and maritime regulations (SOLAS, MARPOL, ISM Code).',
    minQualityRating: 4,
    maxSamples: 3000,
    preferredCategories: ['maritime', 'fleet', 'sanctions', 'route', 'general'],
  },
  {
    agentId: 'sentinel',
    domain: 'security',
    keywords: [
      'threat',
      'vulnerability',
      'cve',
      'attack',
      'breach',
      'malware',
      'firewall',
      'incident',
      'exploit',
      'ransomware',
      'phishing',
      'cvss',
      'mitre',
      'apt',
      'ioc',
      'siem',
    ],
    systemPromptEnrichment:
      'Focus on cybersecurity expertise: threat intelligence, CVE/CVSS scoring, MITRE ATT&CK framework, incident response playbooks, security posture evaluation, and vulnerability management.',
    minQualityRating: 4,
    maxSamples: 3000,
    preferredCategories: ['security', 'threat', 'vulnerability', 'incident', 'general'],
  },
  {
    agentId: 'inca',
    domain: 'research',
    keywords: [
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
      'llm',
      'transformer',
      'neural',
      'fine-tuning',
      'rag',
    ],
    systemPromptEnrichment:
      'Focus on AI/ML research expertise: model architecture analysis, benchmark evaluation, research paper synthesis, emerging AI capabilities, and technology trend assessment.',
    minQualityRating: 3,
    maxSamples: 2000,
    preferredCategories: ['research', 'ai', 'benchmark', 'general'],
  },
  {
    agentId: 'muse',
    domain: 'creative',
    keywords: [
      'content',
      'campaign',
      'creative',
      'marketing',
      'brand',
      'copy',
      'design',
      'engagement',
      'audience',
      'narrative',
      'strategy',
      'positioning',
      'messaging',
    ],
    systemPromptEnrichment:
      'Focus on creative intelligence: content strategy development, campaign ideation, brand voice consistency, audience targeting, and performance optimization for creative assets.',
    minQualityRating: 4,
    maxSamples: 2000,
    preferredCategories: ['creative', 'marketing', 'content', 'general'],
  },
  {
    agentId: 'beacon',
    domain: 'analytics',
    keywords: [
      'anomaly',
      'metric',
      'performance',
      'signal',
      'trend',
      'kpi',
      'analytics',
      'dashboard',
      'slo',
      'alert',
      'threshold',
      'baseline',
      'deviation',
      'forecast',
    ],
    systemPromptEnrichment:
      'Focus on analytics and observability expertise: anomaly detection, metric interpretation, SLO compliance analysis, capacity planning, and data-driven operational intelligence.',
    minQualityRating: 4,
    maxSamples: 2000,
    preferredCategories: ['analytics', 'monitoring', 'slo', 'general'],
  },
  {
    agentId: 'zeus',
    domain: 'infrastructure',
    keywords: [
      'infrastructure',
      'azure',
      'kubernetes',
      'docker',
      'deployment',
      'server',
      'database',
      'cloud',
      'devops',
      'terraform',
      'ci/cd',
      'container',
      'scaling',
      'reliability',
    ],
    systemPromptEnrichment:
      'Focus on cloud infrastructure expertise: Azure resource management, Kubernetes operations, infrastructure reliability, DevOps best practices, and platform architecture recommendations.',
    minQualityRating: 4,
    maxSamples: 2000,
    preferredCategories: ['infrastructure', 'cloud', 'devops', 'general'],
  },
  {
    agentId: 'compass',
    domain: 'readiness',
    keywords: [
      'readiness',
      'maturity',
      'assessment',
      'gap',
      'score',
      'milestone',
      'capability',
      'compliance',
      'audit',
      'framework',
      'certification',
      'soc2',
      'iso',
      'nist',
    ],
    systemPromptEnrichment:
      'Focus on organizational readiness expertise: maturity model assessment, gap analysis, capability scoring, compliance framework alignment, and structured improvement roadmaps.',
    minQualityRating: 4,
    maxSamples: 2000,
    preferredCategories: ['readiness', 'compliance', 'maturity', 'general'],
  },
  {
    agentId: 'alloy',
    domain: 'orchestration',
    keywords: [
      'orchestrate',
      'coordinate',
      'synthesize',
      'route',
      'aggregate',
      'multi-agent',
      'intelligence',
      'unified',
      'analysis',
    ],
    systemPromptEnrichment:
      'Focus on orchestration intelligence: routing queries to appropriate domain agents, synthesizing multi-agent responses, and providing unified cross-domain intelligence.',
    minQualityRating: 4,
    maxSamples: 1500,
    preferredCategories: ['orchestration', 'general'],
  },
];

function filterByKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function enrichOpenAISample(
  sample: { messages: Array<{ role: string; content: string }> },
  config: DomainCuratorConfig,
): { messages: Array<{ role: string; content: string }> } {
  const messages = [...sample.messages];
  const systemMsg = messages.find((m) => m.role === 'system');
  if (systemMsg && !systemMsg.content.includes(config.systemPromptEnrichment)) {
    systemMsg.content = `${systemMsg.content}\n\n${config.systemPromptEnrichment}`;
  }
  return { messages };
}

export interface CuratedDatasetResult extends DatasetExportResult {
  curatorConfig: {
    domain: string;
    keywords: string[];
    preferredCategories: string[];
  };
  filteredCount: number;
  enriched: boolean;
}

export async function curateDatasetForAgent(
  agentId: string,
  format: ExportFormat = 'openai-jsonl',
  options?: { since?: Date },
): Promise<CuratedDatasetResult> {
  const config = DOMAIN_CURATOR_CONFIGS.find((c) => c.agentId === agentId);

  if (!config) {
    const baseResult = await exportTrainingData(agentId, format, options);
    return {
      ...baseResult,
      curatorConfig: { domain: agentId, keywords: [], preferredCategories: [] },
      filteredCount: baseResult.sampleCount,
      enriched: false,
    };
  }

  const rawResult = await exportTrainingData(agentId, format, {
    minRating: config.minQualityRating,
    maxSamples: config.maxSamples * 2,
    ...(options?.since !== undefined ? { since: options.since } : {}),
  });

  let filteredSamples: typeof rawResult.samples;
  if (format === 'openai-jsonl') {
    const openaiSamples = rawResult.samples as Array<{
      messages: Array<{ role: string; content: string }>;
    }>;
    const domainRelevant = openaiSamples.filter((s) => {
      const text = s.messages.map((m) => m.content).join(' ');
      return (
        filterByKeywords(text, config.keywords) ||
        config.preferredCategories.some((cat) => text.toLowerCase().includes(cat))
      );
    });
    const enriched = domainRelevant.map((s) => enrichOpenAISample(s, config));
    filteredSamples = enriched.slice(0, config.maxSamples) as typeof rawResult.samples;
  } else {
    const hfSamples = rawResult.samples as Array<{
      instruction: string;
      input: string;
      output: string;
      domain: string;
      agentId: string;
      source: string;
      quality: number;
    }>;
    filteredSamples = hfSamples
      .filter((s) => {
        const text = `${s.input} ${s.output}`;
        return (
          filterByKeywords(text, config.keywords) || config.preferredCategories.includes(s.domain)
        );
      })
      .map((s) => ({ ...s, domain: config.domain }))
      .slice(0, config.maxSamples) as typeof rawResult.samples;
  }

  return {
    ...rawResult,
    samples: filteredSamples,
    sampleCount: filteredSamples.length,
    curatorConfig: {
      domain: config.domain,
      keywords: config.keywords,
      preferredCategories: config.preferredCategories,
    },
    filteredCount: filteredSamples.length,
    enriched: true,
  };
}

export async function curateAllDomainDatasets(
  format: ExportFormat = 'openai-jsonl',
): Promise<Map<string, CuratedDatasetResult>> {
  const results = new Map<string, CuratedDatasetResult>();
  for (const config of DOMAIN_CURATOR_CONFIGS) {
    try {
      const result = await curateDatasetForAgent(config.agentId, format);
      results.set(config.agentId, result);
    } catch {
      // Skip failed domains
    }
  }
  return results;
}

export function getDomainCuratorConfig(agentId: string): DomainCuratorConfig | undefined {
  return DOMAIN_CURATOR_CONFIGS.find((c) => c.agentId === agentId);
}

export function getAllSupportedAgents(): string[] {
  return DOMAIN_CURATOR_CONFIGS.map((c) => c.agentId);
}
