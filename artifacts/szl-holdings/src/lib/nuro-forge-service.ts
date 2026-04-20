export interface NuroModel {
  id: string;
  name: string;
  provider: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  avgLatency: number;
  costPer1k: number;
  color: string;
  specialties: string[];
  status: 'active' | 'canary' | 'degraded' | 'retired';
}

export interface DuelResult {
  id: string;
  modelA: string;
  modelB: string;
  winner: string | null;
  domain: string;
  prompt: string;
  timestamp: number;
  scoreA: number;
  scoreB: number;
}

export interface GovernanceEvent {
  id: string;
  model: string;
  domain: string;
  type: 'bias' | 'hallucination' | 'toxicity' | 'constitutional' | 'pii';
  severity: 'pass' | 'warning' | 'violation';
  score: number;
  detail: string;
  timestamp: number;
}

export interface Pipeline {
  id: string;
  name: string;
  steps: { model: string; task: string; color: string }[];
  qualityScore: number;
  avgLatency: number;
  successRate: number;
  executions: number;
  status: 'active' | 'optimizing' | 'draft';
}

export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  domain: string;
  winRate: number;
  tests: number;
  variants: number;
  uses: number;
  status: 'production' | 'testing' | 'draft';
}

export interface CostEntry {
  model: string;
  provider: string;
  requests: number;
  totalCost: number;
  avgCost: number;
  trend: number;
}

export interface ModelHealth {
  model: string;
  status: 'healthy' | 'canary' | 'degraded';
  uptime: number;
  lastIncident: string;
  failoverTarget: string;
  canaryVersion: string;
}

const SEED_MODELS: NuroModel[] = [
  {
    id: 'claude-4-sonnet',
    name: 'Claude 4 Sonnet',
    provider: 'Anthropic',
    elo: 1847,
    wins: 312,
    losses: 89,
    draws: 24,
    avgLatency: 1240,
    costPer1k: 3.0,
    color: '#8b5cf6',
    specialties: ['Legal', 'Advisory', 'Creative'],
    status: 'active',
  },
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'OpenAI',
    elo: 1823,
    wins: 298,
    losses: 102,
    draws: 31,
    avgLatency: 980,
    costPer1k: 5.0,
    color: '#10b981',
    specialties: ['Financial', 'Code', 'Research'],
    status: 'active',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    elo: 1798,
    wins: 267,
    losses: 118,
    draws: 28,
    avgLatency: 1100,
    costPer1k: 3.5,
    color: '#3b82f6',
    specialties: ['Maritime', 'Multimodal', 'Research'],
    status: 'active',
  },
  {
    id: 'qwen3-8b',
    name: 'Qwen3-8B',
    provider: 'Alibaba',
    elo: 1756,
    wins: 245,
    losses: 134,
    draws: 19,
    avgLatency: 142,
    costPer1k: 0.5,
    color: '#06b6d4',
    specialties: ['Maritime', 'Structured Data', 'Cost-Optimal'],
    status: 'active',
  },
  {
    id: 'llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'Meta',
    elo: 1734,
    wins: 231,
    losses: 148,
    draws: 22,
    avgLatency: 280,
    costPer1k: 0.2,
    color: '#f59e0b',
    specialties: ['Cybersecurity', 'Threat Assessment', 'Open Source'],
    status: 'canary',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    elo: 1721,
    wins: 218,
    losses: 156,
    draws: 18,
    avgLatency: 350,
    costPer1k: 0.8,
    color: '#d4a054',
    specialties: ['Financial', 'Operations', 'Advisory'],
    status: 'active',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    elo: 1698,
    wins: 204,
    losses: 167,
    draws: 15,
    avgLatency: 420,
    costPer1k: 0.3,
    color: '#ec4899',
    specialties: ['Cybersecurity', 'Code', 'Research'],
    status: 'active',
  },
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'Cohere',
    elo: 1682,
    wins: 195,
    losses: 178,
    draws: 12,
    avgLatency: 560,
    costPer1k: 1.2,
    color: '#64748b',
    specialties: ['RAG', 'Research', 'Knowledge'],
    status: 'active',
  },
  {
    id: 'phi-4-mini',
    name: 'Phi-4 Mini',
    provider: 'Microsoft',
    elo: 1654,
    wins: 183,
    losses: 192,
    draws: 10,
    avgLatency: 95,
    costPer1k: 0.1,
    color: '#0ea5e9',
    specialties: ['Edge', 'Cost-Optimal', 'Operations'],
    status: 'degraded',
  },
  {
    id: 'grok-3',
    name: 'Grok 3',
    provider: 'xAI',
    elo: 1641,
    wins: 176,
    losses: 198,
    draws: 14,
    avgLatency: 780,
    costPer1k: 2.0,
    color: '#a855f7',
    specialties: ['Real-Time', 'Social', 'Research'],
    status: 'active',
  },
  {
    id: 'claude-3.5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    elo: 1628,
    wins: 168,
    losses: 205,
    draws: 8,
    avgLatency: 180,
    costPer1k: 0.25,
    color: '#f472b6',
    specialties: ['Fast', 'Code', 'Cost-Optimal'],
    status: 'active',
  },
  {
    id: 'nova-pro',
    name: 'Nova Pro',
    provider: 'Amazon',
    elo: 1612,
    wins: 162,
    losses: 214,
    draws: 11,
    avgLatency: 620,
    costPer1k: 1.5,
    color: '#f97316',
    specialties: ['AWS', 'Enterprise', 'Operations'],
    status: 'active',
  },
];

class NuroForgeService {
  private models: NuroModel[] = [...SEED_MODELS];
  private duelHistory: DuelResult[] = [];
  private governanceLog: GovernanceEvent[] = [];

  getModels(): NuroModel[] {
    return [...this.models].sort((a, b) => b.elo - a.elo);
  }

  getModelById(id: string): NuroModel | undefined {
    return this.models.find((m) => m.id === id);
  }

  runDuel(modelAId: string, modelBId: string, domain: string): DuelResult {
    const modelA = this.models.find((m) => m.id === modelAId);
    const modelB = this.models.find((m) => m.id === modelBId);
    if (!modelA || !modelB) throw new Error('Model not found');

    const scoreA = Math.random() * 100;
    const scoreB = Math.random() * 100;
    const winner = scoreA > scoreB ? modelAId : scoreB > scoreA ? modelBId : null;

    const K = 32;
    const expectedA = 1 / (1 + 10 ** ((modelB.elo - modelA.elo) / 400));
    const expectedB = 1 - expectedA;
    const actualA = winner === modelAId ? 1 : winner === null ? 0.5 : 0;
    const actualB = 1 - actualA;

    modelA.elo = Math.round(modelA.elo + K * (actualA - expectedA));
    modelB.elo = Math.round(modelB.elo + K * (actualB - expectedB));

    if (winner === modelAId) {
      modelA.wins++;
      modelB.losses++;
    } else if (winner === modelBId) {
      modelB.wins++;
      modelA.losses++;
    } else {
      modelA.draws++;
      modelB.draws++;
    }

    const result: DuelResult = {
      id: `duel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      modelA: modelA.name,
      modelB: modelB.name,
      winner: winner ? (winner === modelAId ? modelA.name : modelB.name) : null,
      domain,
      prompt: `Evaluate ${domain.toLowerCase()} task`,
      timestamp: Date.now(),
      scoreA,
      scoreB,
    };
    this.duelHistory.unshift(result);
    if (this.duelHistory.length > 100) this.duelHistory.length = 100;

    this.checkPromotion(modelA);
    this.checkPromotion(modelB);

    return result;
  }

  private checkPromotion(model: NuroModel): void {
    if (model.elo >= 1800 && model.status !== 'active') {
      model.status = 'active';
    }
    if (model.elo < 1600 && model.wins + model.losses > 50) {
      model.status = 'degraded';
    }
  }

  getDuelHistory(): DuelResult[] {
    return [...this.duelHistory];
  }

  evaluateGovernance(model: string, domain: string, output: string): GovernanceEvent {
    const types: GovernanceEvent['type'][] = [
      'bias',
      'hallucination',
      'toxicity',
      'constitutional',
      'pii',
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const score = Math.round((0.7 + Math.random() * 0.3) * 100);
    const severity: GovernanceEvent['severity'] =
      score >= 92 ? 'pass' : score >= 70 ? 'warning' : 'violation';

    const event: GovernanceEvent = {
      id: `gov-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      model,
      domain,
      type,
      severity,
      score,
      detail: this.getGovernanceDetail(type, severity),
      timestamp: Date.now(),
    };
    this.governanceLog.unshift(event);
    if (this.governanceLog.length > 200) this.governanceLog.length = 200;
    return event;
  }

  private getGovernanceDetail(
    type: GovernanceEvent['type'],
    severity: GovernanceEvent['severity'],
  ): string {
    const details: Record<string, Record<string, string>> = {
      bias: {
        pass: 'Gender-neutral language verified',
        warning: 'Minor sentiment bias detected — corrected',
        violation: 'Demographic bias exceeded threshold',
      },
      hallucination: {
        pass: 'Factual grounding confirmed via RAG',
        warning: 'Uncertain claim flagged for review',
        violation: 'Ungrounded claim detected — blocked',
      },
      toxicity: {
        pass: 'Content safety check passed',
        warning: 'Output filtered — rephrased',
        violation: 'Toxic content blocked',
      },
      constitutional: {
        pass: 'Constitutional AI alignment verified',
        warning: 'Ethical boundary approached',
        violation: 'Constitutional AI violation — blocked',
      },
      pii: {
        pass: 'No PII detected in output',
        warning: 'Email address redacted',
        violation: 'PII leak detected — output blocked',
      },
    };
    return details[type]?.[severity] || 'Check completed';
  }

  getGovernanceLog(): GovernanceEvent[] {
    return [...this.governanceLog];
  }

  routeOptimalModel(domain: string, maxLatency?: number, maxCostPer1k?: number): NuroModel | null {
    let candidates = this.models.filter((m) => m.status === 'active');
    if (domain)
      candidates = candidates.filter((m) =>
        m.specialties.some((s) => s.toLowerCase() === domain.toLowerCase()),
      );
    if (maxLatency) candidates = candidates.filter((m) => m.avgLatency <= maxLatency);
    if (maxCostPer1k) candidates = candidates.filter((m) => m.costPer1k <= maxCostPer1k);
    candidates.sort((a, b) => b.elo - a.elo);
    return candidates[0] || null;
  }

  triggerFailover(modelId: string): {
    failedModel: string;
    failoverTarget: string;
    success: boolean;
  } {
    const model = this.models.find((m) => m.id === modelId);
    if (!model) return { failedModel: modelId, failoverTarget: 'none', success: false };

    model.status = 'degraded';
    const fallback = this.models.find(
      (m) =>
        m.id !== modelId &&
        m.status === 'active' &&
        m.specialties.some((s) => model.specialties.includes(s)),
    );
    return {
      failedModel: model.name,
      failoverTarget: fallback?.name || 'none',
      success: !!fallback,
    };
  }

  canaryDeploy(
    modelId: string,
    trafficPct: number,
  ): { model: string; canaryPct: number; status: string } {
    const model = this.models.find((m) => m.id === modelId);
    if (!model) return { model: modelId, canaryPct: 0, status: 'not_found' };
    model.status = 'canary';
    return {
      model: model.name,
      canaryPct: Math.min(100, Math.max(1, trafficPct)),
      status: 'deployed',
    };
  }

  promoteCanary(modelId: string): { model: string; status: string } {
    const model = this.models.find((m) => m.id === modelId);
    if (!model) return { model: modelId, status: 'not_found' };
    model.status = 'active';
    return { model: model.name, status: 'promoted' };
  }

  rollback(modelId: string): { model: string; status: string } {
    const model = this.models.find((m) => m.id === modelId);
    if (!model) return { model: modelId, status: 'not_found' };
    model.status = 'active';
    model.elo = Math.max(model.elo, 1650);
    return { model: model.name, status: 'rolled_back' };
  }
}

export const nuroForgeService = new NuroForgeService();

export function getNuroForgeModels() {
  return nuroForgeService.getModels();
}
export function runModelDuel(a: string, b: string, domain: string) {
  return nuroForgeService.runDuel(a, b, domain);
}
export function evaluateGovernance(model: string, domain: string, output: string) {
  return nuroForgeService.evaluateGovernance(model, domain, output);
}
export function routeOptimalModel(domain: string, maxLatency?: number, maxCost?: number) {
  return nuroForgeService.routeOptimalModel(domain, maxLatency, maxCost);
}
export function triggerFailover(modelId: string) {
  return nuroForgeService.triggerFailover(modelId);
}
export function canaryDeploy(modelId: string, pct: number) {
  return nuroForgeService.canaryDeploy(modelId, pct);
}
export function promoteCanary(modelId: string) {
  return nuroForgeService.promoteCanary(modelId);
}
export function rollbackModel(modelId: string) {
  return nuroForgeService.rollback(modelId);
}
