import { logger } from "./logger.js";
import type { SelfModelPersistenceAdapter, SelfModelState } from "@workspace/self-model";

interface PoolQueryResult<T> { rows: T[] }
interface DbPool {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<PoolQueryResult<T>>;
}

/**
 * Converts a SelfModelState to a serializable metadata JSONB blob containing
 * all extended spec fields not covered by first-class DB columns.
 */
function buildMetadata(model: SelfModelState): Record<string, unknown> {
  return {
    runtimeId: model.runtimeId,
    toolAccess: model.toolAccess,
    riskTier: model.riskTier,
    policiesInForce: model.policiesInForce,
    currentEnvironment: model.currentEnvironment,
    escalationThresholds: model.escalationThresholds,
    humanDependencies: model.humanDependencies,
    confidenceProfile: model.confidenceProfile,
    uncertaintyProfile: model.uncertaintyProfile,
    preferredRoutingPatterns: model.preferredRoutingPatterns,
    learnedStrategies: model.learnedStrategies,
    domainStrengths: model.domainStrengths,
    domainWeaknesses: model.domainWeaknesses,
    driftScore: model.driftScore,
    failurePatternCount: model.failurePatternCount,
    consecutiveFailures: model.consecutiveFailures,
    recentFailures: model.recentFailures,
    recentWins: model.recentWins,
    version: model.version,
    updatedAt: model.updatedAt,
  };
}

/** Full snapshot data — includes every field needed to restore a SelfModelState. */
function buildSnapshotData(model: SelfModelState): Record<string, unknown> {
  return {
    runtimeId: model.runtimeId,
    identityProfile: model.identityProfile,
    activeObjectives: model.activeObjectives,
    capabilities: model.capabilities,
    toolAccess: model.toolAccess,
    riskTier: model.riskTier,
    policiesInForce: model.policiesInForce,
    currentEnvironment: model.currentEnvironment,
    recentFailures: model.recentFailures,
    recentWins: model.recentWins,
    learnedStrategies: model.learnedStrategies,
    confidenceProfile: model.confidenceProfile,
    uncertaintyProfile: model.uncertaintyProfile,
    preferredRoutingPatterns: model.preferredRoutingPatterns,
    escalationThresholds: model.escalationThresholds,
    humanDependencies: model.humanDependencies,
    domainStrengths: model.domainStrengths,
    domainWeaknesses: model.domainWeaknesses,
    driftScore: model.driftScore,
    failurePatternCount: model.failurePatternCount,
    consecutiveFailures: model.consecutiveFailures,
    version: model.version,
    updatedAt: model.updatedAt,
  };
}

/** Rebuilds a SelfModelState from the DB row returned by self_models. */
function rowToState(row: Record<string, unknown>): SelfModelState {
  const meta = (row["metadata"] as Record<string, unknown>) ?? {};
  const identity = (row["identity"] as Record<string, unknown>) ?? {};
  const goals = (row["goals"] as unknown[]) ?? [];
  const caps = (row["capabilities"] as unknown[]) ?? [];
  const perf = (row["performance_profile"] as Record<string, unknown>) ?? {};
  const confidence = typeof row["confidence"] === "number" ? row["confidence"] : 1.0;
  const now = new Date().toISOString();

  return {
    runtimeId: (meta["runtimeId"] as string) || (row["agent_id"] as string),
    identityProfile: identity as unknown as SelfModelState["identityProfile"],
    activeObjectives: (goals as SelfModelState["activeObjectives"]) || [],
    capabilities: (caps as SelfModelState["capabilities"]) || [],
    toolAccess: (meta["toolAccess"] as SelfModelState["toolAccess"]) ?? [],
    riskTier: (meta["riskTier"] as SelfModelState["riskTier"]) ?? "internal-workflow",
    policiesInForce: (meta["policiesInForce"] as SelfModelState["policiesInForce"]) ?? [],
    currentEnvironment: (meta["currentEnvironment"] as string) ?? "production",
    recentFailures: (meta["recentFailures"] as SelfModelState["recentFailures"]) ?? [],
    recentWins: (meta["recentWins"] as SelfModelState["recentWins"]) ?? [],
    learnedStrategies: (meta["learnedStrategies"] as SelfModelState["learnedStrategies"]) ?? [],
    confidenceProfile: (meta["confidenceProfile"] as SelfModelState["confidenceProfile"]) ?? {
      overall: confidence,
      byDomain: {},
      byCapability: {},
      trend: "stable",
      lastAdjustedAt: now,
    },
    uncertaintyProfile: (meta["uncertaintyProfile"] as SelfModelState["uncertaintyProfile"]) ?? {
      overall: 1 - confidence,
      byDomain: {},
      flaggedAreas: [],
      lastReviewedAt: now,
    },
    preferredRoutingPatterns: (meta["preferredRoutingPatterns"] as SelfModelState["preferredRoutingPatterns"]) ?? [],
    escalationThresholds: (meta["escalationThresholds"] as SelfModelState["escalationThresholds"]) ?? [],
    humanDependencies: (meta["humanDependencies"] as SelfModelState["humanDependencies"]) ?? [],
    domainStrengths: (meta["domainStrengths"] as SelfModelState["domainStrengths"]) ?? [],
    domainWeaknesses: (meta["domainWeaknesses"] as SelfModelState["domainWeaknesses"]) ?? [],
    driftScore: typeof meta["driftScore"] === "number" ? meta["driftScore"] : (typeof perf["driftScore"] === "number" ? perf["driftScore"] : 0),
    failurePatternCount: typeof meta["failurePatternCount"] === "number" ? meta["failurePatternCount"] : 0,
    consecutiveFailures: typeof meta["consecutiveFailures"] === "number" ? meta["consecutiveFailures"] : 0,
    version: typeof row["version"] === "number" ? row["version"] : 1,
    updatedAt: (row["updated_at"] instanceof Date ? row["updated_at"].toISOString() : String(row["updated_at"] ?? now)),
  };
}

export class PoolSelfModelAdapter implements SelfModelPersistenceAdapter {
  constructor(private readonly pool: DbPool) {}

  async saveModel(agentId: string, model: SelfModelState): Promise<void> {
    try {
      const existing = await this.pool.query<{ id: string; version: number }>(
        `SELECT id, version FROM self_models WHERE agent_id = $1 AND status = 'active' ORDER BY version DESC LIMIT 1`,
        [agentId],
      );

      const meta = buildMetadata(model);
      const perfProfile = {
        driftScore: model.driftScore,
        consecutiveFailures: model.consecutiveFailures,
        failurePatternCount: model.failurePatternCount,
      };

      if (existing.rows.length > 0) {
        const row = existing.rows[0]!;
        await this.pool.query(
          `UPDATE self_models
           SET version = $1, confidence = $2,
               capabilities = $3::jsonb,
               goals = $4::jsonb,
               identity = $5::jsonb,
               performance_profile = $6::jsonb,
               metadata = $7::jsonb,
               updated_at = NOW()
           WHERE id = $8::uuid`,
          [
            model.version,
            model.confidenceProfile.overall,
            JSON.stringify(model.capabilities),
            JSON.stringify(model.activeObjectives),
            JSON.stringify(model.identityProfile),
            JSON.stringify(perfProfile),
            JSON.stringify(meta),
            row.id,
          ],
        );
      } else {
        await this.pool.query(
          `INSERT INTO self_models
             (agent_id, version, status, capabilities, goals, constraints,
              beliefs, identity, performance_profile, confidence, metadata)
           VALUES ($1, $2, 'active', $3::jsonb, $4::jsonb, '[]'::jsonb,
                   '{}'::jsonb, $5::jsonb, $6::jsonb, $7, $8::jsonb)`,
          [
            agentId,
            model.version,
            JSON.stringify(model.capabilities),
            JSON.stringify(model.activeObjectives),
            JSON.stringify(model.identityProfile),
            JSON.stringify(perfProfile),
            model.confidenceProfile.overall,
            JSON.stringify(meta),
          ],
        );
      }
    } catch (err) {
      logger.warn({ agentId, err }, "PoolSelfModelAdapter.saveModel failed");
      throw err;
    }
  }

  async saveSnapshot(agentId: string, model: SelfModelState, changeReason?: string, triggeredBy?: string): Promise<void> {
    try {
      const existing = await this.pool.query<{ id: string }>(
        `SELECT id FROM self_models WHERE agent_id = $1 AND status = 'active' ORDER BY version DESC LIMIT 1`,
        [agentId],
      );
      const selfModelId = existing.rows[0]?.id;
      if (!selfModelId) {
        logger.warn({ agentId }, "PoolSelfModelAdapter.saveSnapshot: no active model row — skipping snapshot");
        return;
      }
      const snapshotData = buildSnapshotData(model);
      await this.pool.query(
        `INSERT INTO self_model_snapshots
           (self_model_id, agent_id, version, snapshot_data, change_reason, triggered_by, confidence)
         VALUES ($1::uuid, $2, $3, $4::jsonb, $5, $6, $7)`,
        [
          selfModelId,
          agentId,
          model.version,
          JSON.stringify(snapshotData),
          changeReason ?? null,
          triggeredBy ?? null,
          model.confidenceProfile.overall,
        ],
      );
    } catch (err) {
      logger.warn({ agentId, err }, "PoolSelfModelAdapter.saveSnapshot failed");
      throw err;
    }
  }

  async loadModel(agentId: string): Promise<SelfModelState | null> {
    try {
      const result = await this.pool.query<Record<string, unknown>>(
        `SELECT * FROM self_models WHERE agent_id = $1 AND status = 'active' ORDER BY version DESC LIMIT 1`,
        [agentId],
      );
      if (result.rows.length === 0) return null;
      return rowToState(result.rows[0]!);
    } catch (err) {
      logger.warn({ agentId, err }, "PoolSelfModelAdapter.loadModel failed");
      return null;
    }
  }

  async loadHistory(agentId: string, limit = 50, offset = 0): Promise<SelfModelState[]> {
    try {
      const result = await this.pool.query<Record<string, unknown>>(
        `SELECT snapshot_data FROM self_model_snapshots
         WHERE agent_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [agentId, limit, offset],
      );
      return result.rows.map((row: Record<string, unknown>) => {
        const data = row["snapshot_data"] as Record<string, unknown>;
        return data as unknown as SelfModelState;
      });
    } catch (err) {
      logger.warn({ agentId, err }, "PoolSelfModelAdapter.loadHistory failed");
      return [];
    }
  }

  async loadAll(): Promise<SelfModelState[]> {
    try {
      const result = await this.pool.query<Record<string, unknown>>(
        `SELECT * FROM self_models WHERE status = 'active' ORDER BY updated_at DESC`,
      );
      return result.rows.map(rowToState);
    } catch (err) {
      logger.warn({ err }, "PoolSelfModelAdapter.loadAll failed");
      return [];
    }
  }
}
