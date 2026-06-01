export type Domain =
  | 'platform'
  | 'vessels'
  | 'terra'
  | 'security'
  | 'counsel'
  | 'carlota'
  | 'pulse'
  | 'command'
  | 'lyte';

export type DataFreshnessLevel = 'live' | 'recent' | 'stale' | 'expired';

export interface OntologyMapping {
  entityType: string;
  domain: Domain;
  fieldMap: Record<string, string>;
}

export interface RefreshSchedule {
  intervalMs: number;
  retryBackoffMs: number;
  maxRetries: number;
  activeHoursUtc?: { start: number; end: number };
}

export interface CostRecord {
  adapterId: string;
  tenantId: string;
  queryCount: number;
  totalCostUsd: number;
  lastQueryAt: string;
  periodStart: string;
}

export interface DataProvenance {
  sourceId: string;
  adapterId: string;
  confidence: number;
  freshness: DataFreshnessLevel;
  fetchedAt: string;
  costUsd: number;
  rawRecordCount: number;
}

export interface NormalizedEntity {
  id: string;
  entityType: string;
  domain: Domain;
  label: string;
  confidence: number;
  freshness: DataFreshnessLevel;
  sourceRef: string;
  provenance: DataProvenance;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AdapterHealthStatus {
  adapterId: string;
  status: 'healthy' | 'degraded' | 'down' | 'unconfigured';
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
  totalQueries: number;
  totalErrors: number;
  avgLatencyMs: number;
}

export interface DataFabricAdapter {
  readonly id: string;
  readonly displayName: string;
  readonly domain: Domain;
  readonly category: string;
  readonly costPerQueryUsd: number;
  readonly ontologyMappings: OntologyMapping[];
  readonly refreshSchedule: RefreshSchedule;

  isConfigured(): boolean;
  fetch(params?: Record<string, unknown>): Promise<NormalizedEntity[]>;
  healthCheck(): Promise<AdapterHealthStatus>;
}

function computeFreshness(fetchedAt: Date, thresholdMs: number): DataFreshnessLevel {
  const ageMs = Date.now() - fetchedAt.getTime();
  if (ageMs <= 5 * 60 * 1000) return 'live';
  if (ageMs <= 60 * 60 * 1000) return 'recent';
  if (ageMs <= thresholdMs) return 'stale';
  return 'expired';
}

class DataFabricRegistry {
  private adapters = new Map<string, DataFabricAdapter>();
  private costLedger = new Map<string, CostRecord>();
  private entityCache = new Map<string, { entities: NormalizedEntity[]; fetchedAt: number }>();
  private healthCache = new Map<string, AdapterHealthStatus>();
  private queryStats = new Map<string, { total: number; errors: number; latencySum: number }>();

  register(adapter: DataFabricAdapter): void {
    this.adapters.set(adapter.id, adapter);
    this.queryStats.set(adapter.id, { total: 0, errors: 0, latencySum: 0 });
  }

  get(id: string): DataFabricAdapter | undefined {
    return this.adapters.get(id);
  }

  listAdapters(): Array<{
    id: string;
    displayName: string;
    domain: Domain;
    category: string;
    configured: boolean;
    costPerQueryUsd: number;
    refreshIntervalMs: number;
    ontologyMappingCount: number;
  }> {
    return Array.from(this.adapters.values()).map((a) => ({
      id: a.id,
      displayName: a.displayName,
      domain: a.domain,
      category: a.category,
      configured: a.isConfigured(),
      costPerQueryUsd: a.costPerQueryUsd,
      refreshIntervalMs: a.refreshSchedule.intervalMs,
      ontologyMappingCount: a.ontologyMappings.length,
    }));
  }

  async fetchFromAdapter(
    adapterId: string,
    tenantId: string,
    params?: Record<string, unknown>,
    forceRefresh = false,
  ): Promise<{ entities: NormalizedEntity[]; provenance: DataProvenance; cached: boolean }> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) throw new Error(`Adapter '${adapterId}' not found`);

    const cacheKey = `${adapterId}:${tenantId}`;
    const cached = this.entityCache.get(cacheKey);
    if (!forceRefresh && cached) {
      const ageMs = Date.now() - cached.fetchedAt;
      if (ageMs < adapter.refreshSchedule.intervalMs) {
        const freshness = computeFreshness(new Date(cached.fetchedAt), adapter.refreshSchedule.intervalMs);
        return {
          entities: cached.entities,
          provenance: {
            sourceId: `${adapterId}-cache`,
            adapterId,
            confidence: 0.95,
            freshness,
            fetchedAt: new Date(cached.fetchedAt).toISOString(),
            costUsd: 0,
            rawRecordCount: cached.entities.length,
          },
          cached: true,
        };
      }
    }

    const startMs = Date.now();
    const stats = this.queryStats.get(adapterId) ?? { total: 0, errors: 0, latencySum: 0 };

    try {
      const entities = await adapter.fetch(params);
      const latencyMs = Date.now() - startMs;
      stats.total++;
      stats.latencySum += latencyMs;
      this.queryStats.set(adapterId, stats);

      this.entityCache.set(cacheKey, { entities, fetchedAt: Date.now() });

      this.trackCost(adapterId, tenantId, adapter.costPerQueryUsd);

      const provenance: DataProvenance = {
        sourceId: `${adapterId}-${Date.now()}`,
        adapterId,
        confidence: entities.length > 0 ? entities.reduce((s, e) => s + e.confidence, 0) / entities.length : 0,
        freshness: 'live',
        fetchedAt: new Date().toISOString(),
        costUsd: adapter.costPerQueryUsd,
        rawRecordCount: entities.length,
      };

      this.healthCache.set(adapterId, {
        adapterId,
        status: 'healthy',
        lastSuccessAt: new Date().toISOString(),
        lastErrorAt: this.healthCache.get(adapterId)?.lastErrorAt ?? null,
        lastError: null,
        totalQueries: stats.total,
        totalErrors: stats.errors,
        avgLatencyMs: Math.round(stats.latencySum / stats.total),
      });

      return { entities, provenance, cached: false };
    } catch (err) {
      stats.total++;
      stats.errors++;
      this.queryStats.set(adapterId, stats);

      const errorMsg = err instanceof Error ? err.message : String(err);
      this.healthCache.set(adapterId, {
        adapterId,
        status: 'degraded',
        lastSuccessAt: this.healthCache.get(adapterId)?.lastSuccessAt ?? null,
        lastErrorAt: new Date().toISOString(),
        lastError: errorMsg,
        totalQueries: stats.total,
        totalErrors: stats.errors,
        avgLatencyMs: stats.total > 0 ? Math.round(stats.latencySum / stats.total) : 0,
      });

      throw err;
    }
  }

  async fetchAll(
    tenantId: string,
    adapterIds?: string[],
  ): Promise<{
    entities: NormalizedEntity[];
    byAdapter: Record<string, NormalizedEntity[]>;
    provenances: DataProvenance[];
    totalCostUsd: number;
  }> {
    const targets = adapterIds
      ? adapterIds.map((id) => this.adapters.get(id)).filter((a): a is DataFabricAdapter => Boolean(a))
      : Array.from(this.adapters.values());

    const byAdapter: Record<string, NormalizedEntity[]> = {};
    const all: NormalizedEntity[] = [];
    const provenances: DataProvenance[] = [];
    let totalCost = 0;

    await Promise.allSettled(
      targets.map(async (adapter) => {
        try {
          const result = await this.fetchFromAdapter(adapter.id, tenantId);
          byAdapter[adapter.id] = result.entities;
          all.push(...result.entities);
          provenances.push(result.provenance);
          totalCost += result.provenance.costUsd;
        } catch {
          byAdapter[adapter.id] = [];
        }
      }),
    );

    return { entities: all, byAdapter, provenances, totalCostUsd: totalCost };
  }

  getCostReport(tenantId?: string): CostRecord[] {
    const records = Array.from(this.costLedger.values());
    if (tenantId) return records.filter((r) => r.tenantId === tenantId);
    return records;
  }

  getHealthReport(): AdapterHealthStatus[] {
    return Array.from(this.adapters.keys()).map((id) => {
      const cached = this.healthCache.get(id);
      if (cached) return cached;
      const adapter = this.adapters.get(id)!;
      return {
        adapterId: id,
        status: adapter.isConfigured() ? ('healthy' as const) : ('unconfigured' as const),
        lastSuccessAt: null,
        lastErrorAt: null,
        lastError: null,
        totalQueries: 0,
        totalErrors: 0,
        avgLatencyMs: 0,
      };
    });
  }

  private trackCost(adapterId: string, tenantId: string, costUsd: number): void {
    const key = `${adapterId}:${tenantId}`;
    const existing = this.costLedger.get(key);
    if (existing) {
      existing.queryCount++;
      existing.totalCostUsd += costUsd;
      existing.lastQueryAt = new Date().toISOString();
    } else {
      this.costLedger.set(key, {
        adapterId,
        tenantId,
        queryCount: 1,
        totalCostUsd: costUsd,
        lastQueryAt: new Date().toISOString(),
        periodStart: new Date().toISOString(),
      });
    }
  }
}

export const dataFabricRegistry = new DataFabricRegistry();

export { computeFreshness };
