import { db, mlModelVersions } from '@szl-holdings/db';
import { and, desc, eq } from 'drizzle-orm';
import { logger } from './logger.js';
import type { TrainingMetrics } from './training-pipeline.js';

export type ModelLifecycle = 'experimental' | 'staging' | 'production' | 'deprecated';

export interface RegisteredModel {
  modelVersionId: string;
  modelName: string;
  domain: string;
  version: string;
  algorithmFamily: string;
  runId: string;
  datasetId: string;
  datasetVersion: string;
  featureIds: string[];
  hyperparameters: Record<string, unknown>;
  trainMetrics: TrainingMetrics;
  testMetrics: TrainingMetrics;
  featureImportance: Record<string, number> | null;
  lifecycle: ModelLifecycle;
  isProduction: boolean;
  promotedBy?: string;
  promotedAt?: Date;
  deprecatedAt?: Date;
  tags: string[];
  notes?: string;
  createdAt: Date;
}

export interface ModelPromotionResult {
  modelVersionId: string;
  from: ModelLifecycle;
  to: ModelLifecycle;
  success: boolean;
  message: string;
}

export interface RegisterModelInput {
  modelName: string;
  domain: string;
  algorithmFamily: string;
  runId: string;
  datasetId: string;
  datasetVersion: string;
  featureIds: string[];
  hyperparameters: Record<string, unknown>;
  trainMetrics: TrainingMetrics;
  testMetrics: TrainingMetrics;
  featureImportance: Record<string, number> | null;
  tags?: string[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// In-process version counter (DB-authoritative on restart via COUNT query)
// ---------------------------------------------------------------------------

const versionCounters = new Map<string, number>();

async function nextVersion(modelName: string): Promise<string> {
  try {
    const existing = await db
      .select()
      .from(mlModelVersions)
      .where(eq(mlModelVersions.modelName, modelName))
      .orderBy(desc(mlModelVersions.createdAt))
      .limit(1);

    const lastVersion = existing[0]?.version ?? '1.0.0';
    const match = lastVersion.match(/^1\.(\d+)\.0$/);
    const counter = match ? parseInt(match[1]!, 10) : 0;
    const next = counter + 1;
    versionCounters.set(modelName, next);
    return `1.${next}.0`;
  } catch {
    const current = versionCounters.get(modelName) ?? 0;
    const next = current + 1;
    versionCounters.set(modelName, next);
    return `1.${next}.0`;
  }
}

// ---------------------------------------------------------------------------
// Row → domain model mapper
// ---------------------------------------------------------------------------

function rowToModel(row: typeof mlModelVersions.$inferSelect): RegisteredModel {
  return {
    modelVersionId: row.modelVersionId,
    modelName: row.modelName,
    domain: row.domain,
    version: row.version,
    algorithmFamily: row.algorithmFamily,
    runId: row.runId,
    datasetId: row.datasetId,
    datasetVersion: row.datasetVersion,
    featureIds: (row.featureIds as string[]) ?? [],
    hyperparameters: (row.hyperparameters as Record<string, unknown>) ?? {},
    trainMetrics: (row.trainMetrics as TrainingMetrics) ?? {},
    testMetrics: (row.testMetrics as TrainingMetrics) ?? {},
    featureImportance: row.featureImportance as Record<string, number> | null,
    lifecycle: row.lifecycle as ModelLifecycle,
    isProduction: row.isProduction,
    ...(row.promotedBy !== null && row.promotedBy !== undefined
      ? { promotedBy: row.promotedBy }
      : {}),
    ...(row.promotedAt !== null && row.promotedAt !== undefined
      ? { promotedAt: row.promotedAt }
      : {}),
    ...(row.deprecatedAt !== null && row.deprecatedAt !== undefined
      ? { deprecatedAt: row.deprecatedAt }
      : {}),
    tags: (row.tags as string[]) ?? [],
    ...(row.notes !== null && row.notes !== undefined ? { notes: row.notes } : {}),
    createdAt: row.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Registry — dual interface: sync in-memory reads + async DB writes
//
// The in-memory Map is the source of truth for all sync callers (inference
// service, A/B testing, model monitor). DB persistence happens on every
// registerModel() / promoteModel() call so the registry survives restarts.
// On startup, hydrateFromDb() loads all model versions from PostgreSQL into
// the in-memory Map so that production state (versions, lineage, promotions)
// is immediately available after a process restart.
// ---------------------------------------------------------------------------

class MlModelRegistryService {
  private readonly models = new Map<string, RegisteredModel>();

  constructor() {
    // Hydrate in-memory cache from DB on startup so production model state
    // survives process restarts without requiring callers to await.
    this.hydrateFromDb().catch((err) =>
      logger.warn({ err }, 'ml-registry: startup hydration skipped — DB may be unavailable'),
    );
  }

  private async hydrateFromDb(): Promise<void> {
    const rows = await db
      .select()
      .from(mlModelVersions)
      .orderBy(desc(mlModelVersions.createdAt))
      .limit(1000);

    let loaded = 0;
    for (const row of rows) {
      const model = rowToModel(row);
      this.models.set(model.modelVersionId, model);
      loaded++;
    }
    logger.info({ loaded }, 'ml-registry: hydrated from DB');
  }

  // -------------------------------------------------------------------------
  // Write methods — async, write to DB + in-memory cache
  // -------------------------------------------------------------------------

  async registerModel(input: RegisterModelInput): Promise<RegisteredModel> {
    const modelVersionId = `mv-${crypto.randomUUID()}`;
    const version = await nextVersion(input.modelName);
    const now = new Date();

    const model: RegisteredModel = {
      modelVersionId,
      modelName: input.modelName,
      domain: input.domain,
      version,
      algorithmFamily: input.algorithmFamily,
      runId: input.runId,
      datasetId: input.datasetId,
      datasetVersion: input.datasetVersion,
      featureIds: input.featureIds,
      hyperparameters: input.hyperparameters,
      trainMetrics: input.trainMetrics,
      testMetrics: input.testMetrics,
      featureImportance: input.featureImportance,
      lifecycle: 'experimental',
      isProduction: false,
      tags: input.tags ?? [],
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      createdAt: now,
    };

    this.models.set(modelVersionId, model);

    try {
      await db.insert(mlModelVersions).values({
        modelVersionId,
        modelName: input.modelName,
        domain: input.domain,
        version,
        algorithmFamily: input.algorithmFamily,
        runId: input.runId,
        datasetId: input.datasetId,
        datasetVersion: input.datasetVersion,
        featureIds: input.featureIds,
        hyperparameters: input.hyperparameters,
        trainMetrics: input.trainMetrics as Record<string, unknown>,
        testMetrics: input.testMetrics as Record<string, unknown>,
        featureImportance: input.featureImportance as Record<string, unknown> | null,
        lifecycle: 'experimental' as const,
        isProduction: false,
        tags: input.tags ?? [],
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        updatedAt: now,
      });
    } catch (err) {
      logger.warn({ err, modelName: input.modelName }, 'DB insert failed — model registered in-memory only');
    }

    logger.info(
      { modelVersionId, modelName: input.modelName, version, domain: input.domain },
      'Model registered (in-memory + PostgreSQL)',
    );

    return model;
  }

  promoteModel(
    modelVersionId: string,
    targetLifecycle: ModelLifecycle,
    promotedBy?: string,
  ): ModelPromotionResult {
    const model = this.models.get(modelVersionId);
    if (!model) {
      return {
        modelVersionId,
        from: 'experimental',
        to: targetLifecycle,
        success: false,
        message: 'Model version not found in registry',
      };
    }

    const currentLifecycle = model.lifecycle;
    const validTransitions: Record<ModelLifecycle, ModelLifecycle[]> = {
      experimental: ['staging', 'deprecated'],
      staging: ['production', 'experimental', 'deprecated'],
      production: ['staging', 'deprecated'],
      deprecated: [],
    };

    if (!validTransitions[currentLifecycle].includes(targetLifecycle)) {
      return {
        modelVersionId,
        from: currentLifecycle,
        to: targetLifecycle,
        success: false,
        message: `Invalid transition from ${currentLifecycle} to ${targetLifecycle}`,
      };
    }

    const now = new Date();

    // Update in-memory cache synchronously
    if (targetLifecycle === 'production') {
      for (const [id, m] of this.models) {
        if (m.modelName === model.modelName && m.isProduction && id !== modelVersionId) {
          this.models.set(id, { ...m, lifecycle: 'staging', isProduction: false });
        }
      }
    }

    this.models.set(modelVersionId, {
      ...model,
      lifecycle: targetLifecycle,
      isProduction: targetLifecycle === 'production',
      ...(targetLifecycle === 'production' ? { promotedAt: now, promotedBy } : {}),
      ...(targetLifecycle === 'deprecated' ? { deprecatedAt: now } : {}),
    });

    // Persist to DB asynchronously (fire-and-forget — in-memory is source of truth)
    const dbPromise = (async () => {
      try {
        if (targetLifecycle === 'production') {
          await db
            .update(mlModelVersions)
            .set({ lifecycle: 'staging', isProduction: false, updatedAt: now })
            .where(
              and(
                eq(mlModelVersions.modelName, model.modelName),
                eq(mlModelVersions.isProduction, true),
              ),
            );
        }

        await db
          .update(mlModelVersions)
          .set({
            lifecycle: targetLifecycle,
            isProduction: targetLifecycle === 'production',
            ...(targetLifecycle === 'production'
              ? { promotedAt: now, ...(promotedBy !== undefined ? { promotedBy } : {}) }
              : {}),
            ...(targetLifecycle === 'deprecated' ? { deprecatedAt: now } : {}),
            updatedAt: now,
          })
          .where(eq(mlModelVersions.modelVersionId, modelVersionId));
      } catch (err) {
        logger.warn({ err, modelVersionId, targetLifecycle }, 'DB update failed — promotion applied in-memory only');
      }
    })();
    void dbPromise;

    logger.info({ modelVersionId, from: currentLifecycle, to: targetLifecycle }, 'Model promoted');
    return {
      modelVersionId,
      from: currentLifecycle,
      to: targetLifecycle,
      success: true,
      message: `Promoted from ${currentLifecycle} to ${targetLifecycle}`,
    };
  }

  rollbackModel(
    modelVersionId: string,
    requestedBy?: string,
  ): ModelPromotionResult {
    const model = this.models.get(modelVersionId);
    if (!model) {
      return {
        modelVersionId,
        from: 'experimental',
        to: 'experimental',
        success: false,
        message: 'Model version not found',
      };
    }

    const targetLifecycle: ModelLifecycle =
      model.lifecycle === 'production' ? 'staging' : 'experimental';
    return this.promoteModel(modelVersionId, targetLifecycle, requestedBy);
  }

  // -------------------------------------------------------------------------
  // Read methods — SYNC, read from in-memory cache
  // Backward-compatible with all existing callers (inference-service, ab-testing,
  // model-monitor, ml-pipeline routes).
  // -------------------------------------------------------------------------

  getModel(modelVersionId: string): RegisteredModel | null {
    return this.models.get(modelVersionId) ?? null;
  }

  getProductionModel(modelName: string): RegisteredModel | null {
    for (const m of this.models.values()) {
      if (m.modelName === modelName && m.isProduction) return m;
    }
    return null;
  }

  getProductionModelForDomain(domain: string, modelType: string): RegisteredModel | null {
    return this.getProductionModel(`${domain}-${modelType}`);
  }

  listModels(domain?: string, lifecycle?: ModelLifecycle): RegisteredModel[] {
    const results: RegisteredModel[] = [];
    for (const m of this.models.values()) {
      if (domain && m.domain !== domain) continue;
      if (lifecycle && m.lifecycle !== lifecycle) continue;
      results.push(m);
    }
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getModelLineage(
    modelVersionId: string,
  ): { model: RegisteredModel; parents: RegisteredModel[] } | null {
    const model = this.models.get(modelVersionId);
    if (!model) return null;

    const parents: RegisteredModel[] = [];
    for (const m of this.models.values()) {
      if (m.modelName === model.modelName && m.createdAt < model.createdAt) {
        parents.push(m);
      }
    }
    parents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { model, parents };
  }

  getRegistrySummary(): {
    totalVersions: number;
    lifecycleCounts: Record<string, number>;
    domains: string[];
    productionModels: Array<{
      modelVersionId: string;
      modelName: string;
      domain: string;
      version: string;
      algorithm: string;
    }>;
  } {
    const all = Array.from(this.models.values());
    const lifecycleCounts: Record<string, number> = {
      experimental: 0,
      staging: 0,
      production: 0,
      deprecated: 0,
    };
    for (const m of all) lifecycleCounts[m.lifecycle] = (lifecycleCounts[m.lifecycle] ?? 0) + 1;

    return {
      totalVersions: all.length,
      lifecycleCounts,
      domains: [...new Set(all.map((m) => m.domain))],
      productionModels: all
        .filter((m) => m.isProduction)
        .map((m) => ({
          modelVersionId: m.modelVersionId,
          modelName: m.modelName,
          domain: m.domain,
          version: m.version,
          algorithm: m.algorithmFamily,
        })),
    };
  }

  // -------------------------------------------------------------------------
  // DB-backed read methods — async, used by API routes that need DB truth
  // (e.g., cross-process queries, pagination, or full-history views)
  // -------------------------------------------------------------------------

  async dbListModels(domain?: string, lifecycle?: ModelLifecycle): Promise<RegisteredModel[]> {
    try {
      const conditions = [];
      if (domain) conditions.push(eq(mlModelVersions.domain, domain));
      if (lifecycle) conditions.push(eq(mlModelVersions.lifecycle, lifecycle));

      const rows = await db
        .select()
        .from(mlModelVersions)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(mlModelVersions.createdAt))
        .limit(500);

      return rows.map(rowToModel);
    } catch {
      return this.listModels(domain, lifecycle);
    }
  }

  async dbGetModel(modelVersionId: string): Promise<RegisteredModel | null> {
    try {
      const rows = await db
        .select()
        .from(mlModelVersions)
        .where(eq(mlModelVersions.modelVersionId, modelVersionId))
        .limit(1);
      return rows[0] ? rowToModel(rows[0]) : (this.models.get(modelVersionId) ?? null);
    } catch {
      return this.models.get(modelVersionId) ?? null;
    }
  }

  async dbGetRegistrySummary(): Promise<{
    totalVersions: number;
    lifecycleCounts: Record<string, number>;
    domains: string[];
    productionModels: Array<{
      modelVersionId: string;
      modelName: string;
      domain: string;
      version: string;
      algorithm: string;
    }>;
  }> {
    try {
      const all = await db.select().from(mlModelVersions).orderBy(desc(mlModelVersions.createdAt));
      const lifecycleCounts: Record<string, number> = {
        experimental: 0,
        staging: 0,
        production: 0,
        deprecated: 0,
      };
      for (const m of all) lifecycleCounts[m.lifecycle] = (lifecycleCounts[m.lifecycle] ?? 0) + 1;

      return {
        totalVersions: all.length,
        lifecycleCounts,
        domains: [...new Set(all.map((m) => m.domain))],
        productionModels: all
          .filter((m) => m.isProduction)
          .map((m) => ({
            modelVersionId: m.modelVersionId,
            modelName: m.modelName,
            domain: m.domain,
            version: m.version,
            algorithm: m.algorithmFamily,
          })),
      };
    } catch {
      return this.getRegistrySummary();
    }
  }
}

export const mlModelRegistry = new MlModelRegistryService();
