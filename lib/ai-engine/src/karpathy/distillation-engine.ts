import { randomUUID } from 'node:crypto';

export interface ChainExecutionRecord {
  recordId: string;
  taskClass: string;
  chainAgentIds: string[];
  chainDomains: string[];
  finalOutput: string;
  finalConfidence: number;
  inputSignature: string;
  outputSignature: string;
  latencyMs: number;
  tokensUsed: number;
  timestamp: string;
}

export interface DistilledAgent {
  distilledId: string;
  name: string;
  sourceChainIds: string[];
  sourceAgentIds: string[];
  sourceDomains: string[];
  taskClass: string;
  compressedPrompt: string;
  avgConfidence: number;
  avgLatencyMs: number;
  avgTokensSaved: number;
  distillationCount: number;
  successRate: number;
  createdAt: string;
  lastUsedAt: string;
  usageCount: number;
  expansionThreshold: number;
  status: 'proposed' | 'active' | 'retired';
}

export interface DistillationCandidate {
  candidateId: string;
  taskClass: string;
  chainPattern: string[];
  occurrences: number;
  avgConfidence: number;
  convergenceScore: number;
  estimatedSavings: { latencyMs: number; tokens: number };
  recommendation: 'distill' | 'monitor' | 'insufficient_data';
  reason: string;
}

export interface DistillationStats {
  totalObservations: number;
  taskClassCount: number;
  activeDistilledAgents: number;
  proposedDistilledAgents: number;
  totalDistilledUsages: number;
  avgCompressionRatio: number;
  topTaskClasses: Array<{ taskClass: string; count: number; convergence: number }>;
}

const MAX_OBSERVATIONS = 5000;
const MIN_CONVERGENCE_OBSERVATIONS = 5;
const CONVERGENCE_THRESHOLD = 0.7;

class AgentDistillationEngine {
  private observations: ChainExecutionRecord[] = [];
  private distilledAgents = new Map<string, DistilledAgent>();
  private taskClassIndex = new Map<string, ChainExecutionRecord[]>();

  observeChainExecution(record: Omit<ChainExecutionRecord, 'recordId' | 'timestamp'>): ChainExecutionRecord {
    const full: ChainExecutionRecord = {
      ...record,
      recordId: `cxr_${randomUUID().slice(0, 12)}`,
      timestamp: new Date().toISOString(),
    };

    this.observations.push(full);
    if (this.observations.length > MAX_OBSERVATIONS) {
      this.observations.splice(0, this.observations.length - MAX_OBSERVATIONS);
    }

    if (!this.taskClassIndex.has(full.taskClass)) {
      this.taskClassIndex.set(full.taskClass, []);
    }
    this.taskClassIndex.get(full.taskClass)!.push(full);

    return full;
  }

  detectConvergence(taskClass: string): DistillationCandidate | null {
    const records = this.taskClassIndex.get(taskClass);
    if (!records || records.length < MIN_CONVERGENCE_OBSERVATIONS) {
      return {
        candidateId: `dc_${randomUUID().slice(0, 8)}`,
        taskClass,
        chainPattern: [],
        occurrences: records?.length ?? 0,
        avgConfidence: 0,
        convergenceScore: 0,
        estimatedSavings: { latencyMs: 0, tokens: 0 },
        recommendation: 'insufficient_data',
        reason: `Only ${records?.length ?? 0} observations. Need at least ${MIN_CONVERGENCE_OBSERVATIONS}.`,
      };
    }

    const chainPatterns = new Map<string, number>();
    for (const r of records) {
      const key = r.chainAgentIds.join('→');
      chainPatterns.set(key, (chainPatterns.get(key) ?? 0) + 1);
    }

    const sortedPatterns = [...chainPatterns.entries()].sort((a, b) => b[1] - a[1]);
    const dominantPattern = sortedPatterns[0]!;
    const dominantRatio = dominantPattern[1] / records.length;

    const avgConfidence = records.reduce((s, r) => s + r.finalConfidence, 0) / records.length;
    const confidenceVariance = records.reduce(
      (s, r) => s + Math.pow(r.finalConfidence - avgConfidence, 2), 0
    ) / records.length;
    const confidenceStability = 1 - Math.min(1, Math.sqrt(confidenceVariance) * 3);

    const convergenceScore = dominantRatio * 0.5 + confidenceStability * 0.3 + Math.min(1, avgConfidence) * 0.2;

    const avgLatency = records.reduce((s, r) => s + r.latencyMs, 0) / records.length;
    const avgTokens = records.reduce((s, r) => s + r.tokensUsed, 0) / records.length;

    const recommendation = convergenceScore >= CONVERGENCE_THRESHOLD ? 'distill' : 'monitor';

    return {
      candidateId: `dc_${randomUUID().slice(0, 8)}`,
      taskClass,
      chainPattern: dominantPattern[0].split('→'),
      occurrences: records.length,
      avgConfidence,
      convergenceScore,
      estimatedSavings: {
        latencyMs: Math.floor(avgLatency * 0.6),
        tokens: Math.floor(avgTokens * 0.5),
      },
      recommendation,
      reason: recommendation === 'distill'
        ? `Convergence score ${(convergenceScore * 100).toFixed(0)}% exceeds threshold. ${dominantPattern[1]}/${records.length} executions follow the same chain pattern.`
        : `Convergence score ${(convergenceScore * 100).toFixed(0)}% below ${(CONVERGENCE_THRESHOLD * 100).toFixed(0)}% threshold. Continue monitoring.`,
    };
  }

  proposeDistillation(taskClass: string): DistilledAgent | null {
    const candidate = this.detectConvergence(taskClass);
    if (!candidate || candidate.recommendation !== 'distill') return null;

    const records = this.taskClassIndex.get(taskClass)!;
    const representativeOutputs = records
      .sort((a, b) => b.finalConfidence - a.finalConfidence)
      .slice(0, 5)
      .map(r => r.finalOutput.slice(0, 300));

    const compressedPrompt = [
      `You are a distilled specialist for "${taskClass}" tasks.`,
      `You combine the capabilities of: ${candidate.chainPattern.join(', ')}.`,
      `Historical performance: ${(candidate.avgConfidence * 100).toFixed(0)}% avg confidence across ${candidate.occurrences} executions.`,
      `Reference outputs:\n${representativeOutputs.map((o, i) => `${i + 1}. ${o}`).join('\n')}`,
      `Produce a single comprehensive response that covers all aspects these agents would address.`,
    ].join('\n');

    const distilled: DistilledAgent = {
      distilledId: `dist_${randomUUID().slice(0, 12)}`,
      name: `Distilled-${taskClass}`,
      sourceChainIds: records.map(r => r.recordId),
      sourceAgentIds: candidate.chainPattern,
      sourceDomains: [...new Set(records.flatMap(r => r.chainDomains))],
      taskClass,
      compressedPrompt,
      avgConfidence: candidate.avgConfidence,
      avgLatencyMs: records.reduce((s, r) => s + r.latencyMs, 0) / records.length,
      avgTokensSaved: candidate.estimatedSavings.tokens,
      distillationCount: candidate.occurrences,
      successRate: records.filter(r => r.finalConfidence > 0.6).length / records.length,
      createdAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      usageCount: 0,
      expansionThreshold: 0.4,
      status: 'proposed',
    };

    this.distilledAgents.set(distilled.distilledId, distilled);
    return distilled;
  }

  activateDistilled(distilledId: string): boolean {
    const agent = this.distilledAgents.get(distilledId);
    if (!agent || agent.status === 'retired') return false;
    agent.status = 'active';
    return true;
  }

  retireDistilled(distilledId: string): boolean {
    const agent = this.distilledAgents.get(distilledId);
    if (!agent) return false;
    agent.status = 'retired';
    return true;
  }

  shouldExpand(distilledId: string, taskConfidence: number): boolean {
    const agent = this.distilledAgents.get(distilledId);
    if (!agent) return true;
    return taskConfidence < agent.expansionThreshold;
  }

  recordDistilledUsage(distilledId: string): void {
    const agent = this.distilledAgents.get(distilledId);
    if (agent) {
      agent.usageCount++;
      agent.lastUsedAt = new Date().toISOString();
    }
  }

  getDistilledAgent(distilledId: string): DistilledAgent | null {
    return this.distilledAgents.get(distilledId) ?? null;
  }

  getDistilledForTaskClass(taskClass: string): DistilledAgent | null {
    for (const agent of this.distilledAgents.values()) {
      if (agent.taskClass === taskClass && agent.status === 'active') {
        return agent;
      }
    }
    return null;
  }

  getAllDistilled(): DistilledAgent[] {
    return [...this.distilledAgents.values()];
  }

  getAllCandidates(): DistillationCandidate[] {
    const candidates: DistillationCandidate[] = [];
    for (const taskClass of this.taskClassIndex.keys()) {
      const candidate = this.detectConvergence(taskClass);
      if (candidate) candidates.push(candidate);
    }
    return candidates.sort((a, b) => b.convergenceScore - a.convergenceScore);
  }

  getStats(): DistillationStats {
    const distilled = [...this.distilledAgents.values()];
    const active = distilled.filter(d => d.status === 'active');
    const proposed = distilled.filter(d => d.status === 'proposed');

    const topClasses = [...this.taskClassIndex.entries()]
      .map(([taskClass, records]) => {
        const candidate = this.detectConvergence(taskClass);
        return {
          taskClass,
          count: records.length,
          convergence: candidate?.convergenceScore ?? 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const avgCompression = active.length > 0
      ? active.reduce((s, d) => s + (d.avgTokensSaved / Math.max(1, d.avgTokensSaved + 1000)), 0) / active.length
      : 0;

    return {
      totalObservations: this.observations.length,
      taskClassCount: this.taskClassIndex.size,
      activeDistilledAgents: active.length,
      proposedDistilledAgents: proposed.length,
      totalDistilledUsages: distilled.reduce((s, d) => s + d.usageCount, 0),
      avgCompressionRatio: avgCompression,
      topTaskClasses: topClasses,
    };
  }
}

export const distillationEngine = new AgentDistillationEngine();
