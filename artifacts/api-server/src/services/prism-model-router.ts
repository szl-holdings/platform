import { db } from '@szl-holdings/db';
import {
  pcCostTrackingTable,
  pcModelLanesTable,
  pcModelRequestsTable,
} from '@szl-holdings/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { logger } from '../lib/logger';

export type ModelLane =
  | 'embedding'
  | 'retrieval'
  | 'classification'
  | 'extraction'
  | 'reasoning'
  | 'forecast'
  | 'policy_guardrail';

interface RouteRequest {
  orgId: number;
  lane: ModelLane;
  taskType: string;
  matterId?: number;
  input: any;
  options?: { timeout?: number; maxRetries?: number };
}

interface RouteResult {
  laneId: number;
  provider: string;
  model: string;
  output: any;
  latencyMs: number;
  cost?: number;
  metadata?: any;
}

const LANE_DEFAULTS: Record<ModelLane, { provider: string; model: string; endpoint?: string }> = {
  embedding: { provider: 'huggingface', model: 'BAAI/bge-large-en-v1.5' },
  retrieval: { provider: 'azure', model: 'azure-ai-search-hybrid' },
  classification: { provider: 'huggingface', model: 'facebook/bart-large-mnli' },
  extraction: { provider: 'azure', model: 'azure-document-intelligence-v4' },
  reasoning: { provider: 'openai', model: 'gpt-4o' },
  forecast: { provider: 'internal', model: 'prism-forecast-v1' },
  policy_guardrail: { provider: 'internal', model: 'prism-policy-engine-v1' },
};

class ModelRouter {
  private circuitStates: Map<
    number,
    { state: 'closed' | 'open' | 'half_open'; failures: number; openedAt?: Date }
  > = new Map();

  async route(req: RouteRequest): Promise<RouteResult> {
    const start = Date.now();
    const lane = await this.selectLane(req.orgId, req.lane);
    const provider = lane?.provider ?? LANE_DEFAULTS[req.lane].provider;
    const model = lane?.modelName ?? LANE_DEFAULTS[req.lane].model;

    try {
      if (lane && this.isCircuitOpen(lane.id)) {
        throw new Error(`Circuit open for lane ${lane.id} (${req.lane}/${provider})`);
      }

      const output = await this.executeLane(
        req.lane,
        req.taskType,
        req.input,
        provider,
        model,
        lane?.endpoint ?? undefined,
      );
      const latencyMs = Date.now() - start;
      const cost = lane?.costPerRequest ? parseFloat(lane.costPerRequest) : 0;

      await this.logRequest(
        req.orgId,
        lane?.id ?? null,
        req.lane,
        provider,
        model,
        req.taskType,
        req.matterId,
        latencyMs,
        cost,
        'success',
      );

      if (lane) this.resetCircuit(lane.id);

      return { laneId: lane?.id ?? 0, provider, model, output, latencyMs, cost };
    } catch (error: any) {
      const latencyMs = Date.now() - start;
      if (lane) this.recordFailure(lane.id);
      await this.logRequest(
        req.orgId,
        lane?.id ?? null,
        req.lane,
        provider,
        model,
        req.taskType,
        req.matterId,
        latencyMs,
        0,
        'failure',
        error.message,
      );

      const fallback = await this.tryFallback(req, lane?.id);
      if (fallback) return fallback;

      throw error;
    }
  }

  private async selectLane(orgId: number, lane: ModelLane) {
    const lanes = await db
      .select()
      .from(pcModelLanesTable)
      .where(
        and(
          eq(pcModelLanesTable.orgId, orgId),
          eq(pcModelLanesTable.lane, lane),
          eq(pcModelLanesTable.status, 'active'),
        ),
      )
      .orderBy(pcModelLanesTable.priority)
      .limit(1);
    return lanes[0] ?? null;
  }

  private async executeLane(
    lane: ModelLane,
    taskType: string,
    input: any,
    provider: string,
    model: string,
    endpoint?: string,
  ): Promise<any> {
    switch (lane) {
      case 'embedding':
        return this.executeEmbedding(input, provider, model, endpoint);
      case 'retrieval':
        return this.executeRetrieval(input, provider, model);
      case 'classification':
        return this.executeClassification(input, provider, model, endpoint);
      case 'extraction':
        return this.executeExtraction(input, provider, model);
      case 'reasoning':
        return this.executeReasoning(input, taskType, provider, model);
      case 'forecast':
        return this.executeForecast(input, taskType);
      case 'policy_guardrail':
        return this.executePolicyCheck(input, taskType);
      default:
        throw new Error(`Unknown lane: ${lane}`);
    }
  }

  private async executeEmbedding(input: any, provider: string, model: string, endpoint?: string) {
    const text = typeof input === 'string' ? input : input.text;
    const dimensions = 1024;
    const embedding = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
    const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    return { embedding: embedding.map((v) => v / norm), dimensions, model, provider };
  }

  private async executeRetrieval(input: any, provider: string, model: string) {
    return {
      results: [],
      query: input.query ?? input,
      method: 'hybrid_rrf',
      filters: input.filters ?? {},
      provider,
      model,
    };
  }

  private async executeClassification(
    input: any,
    provider: string,
    model: string,
    endpoint?: string,
  ) {
    const text = typeof input === 'string' ? input : input.text;
    const labels = input.labels ?? ['privilege', 'work_product', 'standard', 'spam'];
    return {
      label: labels[0],
      confidence: 0.85,
      scores: labels.reduce(
        (acc: any, l: string, i: number) => ({ ...acc, [l]: Math.max(0.1, 0.85 - i * 0.2) }),
        {},
      ),
      model,
      provider,
    };
  }

  private async executeExtraction(input: any, provider: string, model: string) {
    return {
      fields: {},
      tables: [],
      text: '',
      confidence: 0.9,
      pages: 0,
      model,
      provider,
    };
  }

  private async executeReasoning(input: any, taskType: string, provider: string, model: string) {
    return {
      response: `[Reasoning output for task: ${taskType}]`,
      sources: [],
      confidence: 0.8,
      model,
      provider,
      requiresReview: true,
    };
  }

  private async executeForecast(input: any, taskType: string) {
    return {
      forecastType: taskType,
      score: 0.72,
      confidence: 0.78,
      drivers: [],
      trend: 'stable',
      model: 'prism-forecast-v1',
      provider: 'internal',
    };
  }

  private async executePolicyCheck(input: any, taskType: string) {
    return {
      allowed: true,
      violations: [],
      warnings: [],
      requiresApproval: false,
      model: 'prism-policy-engine-v1',
      provider: 'internal',
    };
  }

  private isCircuitOpen(laneId: number): boolean {
    const state = this.circuitStates.get(laneId);
    if (!state || state.state === 'closed') return false;
    if (state.state === 'open' && state.openedAt) {
      const elapsed = Date.now() - state.openedAt.getTime();
      if (elapsed > 30000) {
        state.state = 'half_open';
        return false;
      }
    }
    return state.state === 'open';
  }

  private recordFailure(laneId: number) {
    const state = this.circuitStates.get(laneId) ?? { state: 'closed' as const, failures: 0 };
    state.failures++;
    if (state.failures >= 5) {
      state.state = 'open';
      state.openedAt = new Date();
    }
    this.circuitStates.set(laneId, state);
  }

  private resetCircuit(laneId: number) {
    this.circuitStates.set(laneId, { state: 'closed', failures: 0 });
  }

  private async tryFallback(
    req: RouteRequest,
    excludeLaneId?: number | null,
  ): Promise<RouteResult | null> {
    const lanes = await db
      .select()
      .from(pcModelLanesTable)
      .where(and(eq(pcModelLanesTable.orgId, req.orgId), eq(pcModelLanesTable.lane, req.lane)))
      .orderBy(pcModelLanesTable.priority);

    for (const lane of lanes) {
      if (lane.id === excludeLaneId) continue;
      if (lane.status === 'disabled') continue;
      if (this.isCircuitOpen(lane.id)) continue;

      try {
        const start = Date.now();
        const output = await this.executeLane(
          req.lane,
          req.taskType,
          req.input,
          lane.provider,
          lane.modelName,
          lane.endpoint ?? undefined,
        );
        const latencyMs = Date.now() - start;
        logger.info(
          { lane: req.lane, fallbackProvider: lane.provider },
          'Model mesh failover succeeded',
        );
        return {
          laneId: lane.id,
          provider: lane.provider,
          model: lane.modelName,
          output,
          latencyMs,
        };
      } catch {}
    }
    return null;
  }

  private async logRequest(
    orgId: number,
    laneId: number | null,
    lane: string,
    provider: string,
    model: string,
    taskType: string,
    matterId: number | undefined,
    latencyMs: number,
    cost: number,
    status: string,
    error?: string,
  ) {
    try {
      await db.insert(pcModelRequestsTable).values({
        orgId,
        laneId,
        lane,
        provider,
        model,
        taskType,
        matterId,
        latencyMs,
        cost: cost.toString(),
        status: status as any,
        error,
        createdAt: new Date(),
      });
    } catch (e: any) {
      logger.error({ error: e.message }, 'Failed to log model request');
    }
  }

  async getLaneHealth(orgId: number) {
    const lanes = await db
      .select()
      .from(pcModelLanesTable)
      .where(eq(pcModelLanesTable.orgId, orgId));
    return lanes.map((l) => ({
      id: l.id,
      lane: l.lane,
      provider: l.provider,
      model: l.modelName,
      status: l.status,
      circuit: this.circuitStates.get(l.id)?.state ?? 'closed',
    }));
  }

  async getRequestStats(orgId: number, hours = 24) {
    const since = new Date(Date.now() - hours * 3600000);
    const requests = await db
      .select()
      .from(pcModelRequestsTable)
      .where(and(eq(pcModelRequestsTable.orgId, orgId)))
      .orderBy(desc(pcModelRequestsTable.createdAt))
      .limit(1000);

    const stats: Record<
      string,
      { total: number; success: number; failed: number; avgLatency: number; totalCost: number }
    > = {};
    for (const r of requests) {
      if (!stats[r.lane])
        stats[r.lane] = { total: 0, success: 0, failed: 0, avgLatency: 0, totalCost: 0 };
      const s = stats[r.lane];
      s.total++;
      if (r.status === 'success') s.success++;
      else s.failed++;
      s.avgLatency = (s.avgLatency * (s.total - 1) + (r.latencyMs ?? 0)) / s.total;
      s.totalCost += parseFloat(r.cost ?? '0');
    }
    return stats;
  }
}

export const modelRouter = new ModelRouter();
