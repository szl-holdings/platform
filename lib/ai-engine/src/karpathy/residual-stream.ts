import { randomUUID } from 'node:crypto';

export interface ResidualContribution {
  contributionId: string;
  agentId: string;
  domain: string;
  content: string;
  confidence: number;
  insights: string[];
  metadata: Record<string, unknown>;
  addedAt: string;
}

export interface ResidualState {
  streamId: string;
  query: string;
  contributions: ResidualContribution[];
  accumulatedInsights: string[];
  totalConfidence: number;
  contributionCount: number;
  domains: string[];
  createdAt: string;
  lastUpdatedAt: string;
}

export interface ResidualStreamResult {
  streamId: string;
  query: string;
  finalState: ResidualState;
  synthesizedOutput: string;
  averageConfidence: number;
  contributionCount: number;
  domainsInvolved: string[];
  totalLatencyMs: number;
  auditTrail: ResidualAuditEntry[];
}

export interface ResidualAuditEntry {
  entryId: string;
  streamId: string;
  agentId: string;
  action: 'contribute' | 'read' | 'synthesize';
  summary: string;
  timestamp: string;
}

type AgentExecutor = (
  agentId: string,
  query: string,
  residualState: ResidualState,
) => Promise<{ content: string; confidence: number; insights: string[] }>;

const MAX_STREAMS = 200;
const MAX_AUDIT = 2000;

class ResidualStreamOrchestrator {
  private streams = new Map<string, ResidualState>();
  private auditLog: ResidualAuditEntry[] = [];

  createStream(query: string): ResidualState {
    const now = new Date().toISOString();
    const state: ResidualState = {
      streamId: `rs_${randomUUID().slice(0, 12)}`,
      query,
      contributions: [],
      accumulatedInsights: [],
      totalConfidence: 0,
      contributionCount: 0,
      domains: [],
      createdAt: now,
      lastUpdatedAt: now,
    };

    this.streams.set(state.streamId, state);
    this.enforceCapacity();
    return state;
  }

  contribute(
    streamId: string,
    agentId: string,
    domain: string,
    content: string,
    confidence: number,
    insights: string[] = [],
    metadata: Record<string, unknown> = {},
  ): ResidualContribution | null {
    const state = this.streams.get(streamId);
    if (!state) return null;

    const contribution: ResidualContribution = {
      contributionId: `rc_${randomUUID().slice(0, 12)}`,
      agentId,
      domain,
      content,
      confidence: Math.max(0, Math.min(1, confidence)),
      insights,
      metadata,
      addedAt: new Date().toISOString(),
    };

    state.contributions.push(contribution);
    state.accumulatedInsights.push(...insights);
    state.totalConfidence += contribution.confidence;
    state.contributionCount++;
    if (!state.domains.includes(domain)) {
      state.domains.push(domain);
    }
    state.lastUpdatedAt = new Date().toISOString();

    this.recordAudit(streamId, agentId, 'contribute', `Added ${insights.length} insight(s) at ${(confidence * 100).toFixed(0)}% confidence`);
    return contribution;
  }

  getState(streamId: string): ResidualState | null {
    const state = this.streams.get(streamId);
    if (state) {
      this.recordAudit(streamId, 'system', 'read', 'State read');
    }
    return state ?? null;
  }

  buildContextForAgent(streamId: string, agentId: string): string {
    const state = this.streams.get(streamId);
    if (!state || state.contributions.length === 0) return '';

    const lines = [
      `## Residual Intelligence Stream (${state.contributionCount} contributions from ${state.domains.join(', ')})`,
    ];

    for (const c of state.contributions) {
      if (c.agentId === agentId) continue;
      lines.push(`### ${c.domain} (${(c.confidence * 100).toFixed(0)}% confidence)`);
      lines.push(c.content.slice(0, 500));
      if (c.insights.length > 0) {
        lines.push(`Key insights: ${c.insights.join('; ')}`);
      }
    }

    if (state.accumulatedInsights.length > 0) {
      const unique = [...new Set(state.accumulatedInsights)];
      lines.push(`\n## Accumulated Insights (${unique.length} total)`);
      lines.push(unique.slice(-10).join('\n'));
    }

    return lines.join('\n');
  }

  async runStream(
    query: string,
    agentIds: string[],
    executor: AgentExecutor,
  ): Promise<ResidualStreamResult> {
    const startMs = Date.now();
    const state = this.createStream(query);

    for (const agentId of agentIds) {
      const currentState = this.streams.get(state.streamId)!;
      const result = await executor(agentId, query, currentState);
      this.contribute(
        state.streamId,
        agentId,
        agentId,
        result.content,
        result.confidence,
        result.insights,
      );
    }

    const finalState = this.streams.get(state.streamId)!;
    const avgConfidence = finalState.contributionCount > 0
      ? finalState.totalConfidence / finalState.contributionCount
      : 0;

    const synthesized = this.synthesize(finalState);
    this.recordAudit(state.streamId, 'system', 'synthesize', `Synthesized ${finalState.contributionCount} contributions`);

    return {
      streamId: state.streamId,
      query,
      finalState,
      synthesizedOutput: synthesized,
      averageConfidence: avgConfidence,
      contributionCount: finalState.contributionCount,
      domainsInvolved: finalState.domains,
      totalLatencyMs: Date.now() - startMs,
      auditTrail: this.getAuditForStream(state.streamId),
    };
  }

  synthesize(state: ResidualState): string {
    if (state.contributions.length === 0) return '';

    const sorted = [...state.contributions].sort((a, b) => b.confidence - a.confidence);
    const parts: string[] = [];

    for (const c of sorted) {
      parts.push(`[${c.domain}] ${c.content}`);
    }

    const uniqueInsights = [...new Set(state.accumulatedInsights)];
    if (uniqueInsights.length > 0) {
      parts.push(`\nCross-domain insights:\n${uniqueInsights.join('\n')}`);
    }

    return parts.join('\n\n');
  }

  getActiveStreams(): ResidualState[] {
    return [...this.streams.values()];
  }

  getStats(): {
    activeStreams: number;
    totalContributions: number;
    avgInsightsPerStream: number;
    auditEntries: number;
  } {
    const streams = [...this.streams.values()];
    const totalContributions = streams.reduce((s, st) => s + st.contributionCount, 0);
    const totalInsights = streams.reduce((s, st) => s + st.accumulatedInsights.length, 0);

    return {
      activeStreams: streams.length,
      totalContributions,
      avgInsightsPerStream: streams.length > 0 ? totalInsights / streams.length : 0,
      auditEntries: this.auditLog.length,
    };
  }

  private recordAudit(streamId: string, agentId: string, action: ResidualAuditEntry['action'], summary: string): void {
    this.auditLog.push({
      entryId: `rsa_${randomUUID().slice(0, 8)}`,
      streamId,
      agentId,
      action,
      summary,
      timestamp: new Date().toISOString(),
    });
    if (this.auditLog.length > MAX_AUDIT) {
      this.auditLog.splice(0, this.auditLog.length - MAX_AUDIT);
    }
  }

  private getAuditForStream(streamId: string): ResidualAuditEntry[] {
    return this.auditLog.filter(e => e.streamId === streamId);
  }

  private enforceCapacity(): void {
    if (this.streams.size <= MAX_STREAMS) return;
    const sorted = [...this.streams.entries()].sort(
      (a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime(),
    );
    const removeCount = this.streams.size - MAX_STREAMS;
    for (let i = 0; i < removeCount; i++) {
      this.streams.delete(sorted[i]![0]);
    }
  }

  closeStream(streamId: string): void {
    this.streams.delete(streamId);
  }
}

export const residualStream = new ResidualStreamOrchestrator();
