/**
 * Cognitive Reflexivity persistence adapter.
 *
 * Bridges the in-memory StrategyRegistry from
 * @workspace/cognitive-reflexivity to durable PostgreSQL storage so that
 * operator-approved reflexive strategies survive process restarts. The
 * registry's `setPersistenceAdapter` hook is the only contract — this
 * file owns all SQL.
 *
 * Storage shape (see lib/db/drizzle/0151_cognitive_reflexivity.sql):
 *   cognitive_reflexive_strategies        — strategy registry rows.
 *   cognitive_reflexive_decision_traces   — per-decision audit log.
 *
 * All writes are best-effort and never throw into the engine path: the
 * adapter logs and continues. Reads happen once at boot via loadAll().
 */
import type { Pool } from 'pg';
import {
  ReflexiveStrategySchema,
  type ReflexiveStrategy,
  type StrategyDecisionTrace,
  type StrategyPersistenceAdapter,
} from '@workspace/cognitive-reflexivity';
import { logger } from './logger';

export function buildCognitiveReflexivityAdapter(
  pool: Pool,
): StrategyPersistenceAdapter {
  return {
    async loadAll(): Promise<ReflexiveStrategy[]> {
      try {
        const { rows } = await pool.query<{ payload: unknown }>(
          `SELECT payload FROM cognitive_reflexive_strategies
             WHERE status IN ('proposed','approved','active')
             ORDER BY created_at DESC
             LIMIT 1000`,
        );
        const valid: ReflexiveStrategy[] = [];
        let dropped = 0;
        for (const r of rows) {
          const parsed = ReflexiveStrategySchema.safeParse(r.payload);
          if (parsed.success) {
            valid.push(parsed.data);
          } else {
            dropped += 1;
          }
        }
        if (dropped > 0) {
          logger.warn(
            { dropped, loaded: valid.length },
            'cognitive-reflexivity persistence loadAll: dropped invalid payloads',
          );
        }
        return valid;
      } catch (err) {
        logger.warn(
          { err: (err as Error).message },
          'cognitive-reflexivity persistence loadAll failed; starting empty',
        );
        return [];
      }
    },

    async saveStrategy(s: ReflexiveStrategy): Promise<void> {
      try {
        const approvalSummary = s.approvedAt
          ? { approvedAt: s.approvedAt, approvedBy: s.approvedBy ?? null }
          : null;
        const reinforcementSummary = {
          hits: s.reinforcedCount ?? 0,
          successRate: s.successRate ?? null,
        };
        await pool.query(
          `INSERT INTO cognitive_reflexive_strategies (
             strategy_id, class, status, tier, confidence, description,
             applicable_contexts, params, provenance, approval, rejection_reason,
             reinforcement, created_at, updated_at, payload
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,
             $12::jsonb,$13,NOW(),$14::jsonb
           )
           ON CONFLICT (strategy_id) DO UPDATE SET
             status = EXCLUDED.status,
             tier = EXCLUDED.tier,
             confidence = EXCLUDED.confidence,
             description = EXCLUDED.description,
             applicable_contexts = EXCLUDED.applicable_contexts,
             params = EXCLUDED.params,
             provenance = EXCLUDED.provenance,
             approval = EXCLUDED.approval,
             rejection_reason = EXCLUDED.rejection_reason,
             reinforcement = EXCLUDED.reinforcement,
             updated_at = NOW(),
             payload = EXCLUDED.payload`,
          [
            s.strategyId,
            s.class,
            s.status,
            s.tier,
            s.confidence,
            s.description,
            JSON.stringify(s.applicableContexts ?? []),
            JSON.stringify(s.params ?? {}),
            JSON.stringify(s.provenance ?? {}),
            approvalSummary ? JSON.stringify(approvalSummary) : null,
            s.rejectionReason ?? null,
            JSON.stringify(reinforcementSummary),
            s.createdAt,
            JSON.stringify(s),
          ],
        );
      } catch (err) {
        logger.warn(
          { err: (err as Error).message, strategyId: s.strategyId },
          'cognitive-reflexivity persistence saveStrategy failed',
        );
      }
    },

    async recordDecisionTrace(trace: StrategyDecisionTrace): Promise<void> {
      try {
        await pool.query(
          `INSERT INTO cognitive_reflexive_decision_traces (
             decision_id, agent_id, applied_strategy_ids,
             influenced_dimensions, resolved, occurred_at
           ) VALUES ($1,$2,$3::jsonb,$4::jsonb,$5::jsonb,$6)
           ON CONFLICT (decision_id) DO NOTHING`,
          [
            trace.decisionId,
            trace.agentId ?? null,
            JSON.stringify(trace.appliedStrategyIds ?? []),
            JSON.stringify(trace.influencedDimensions ?? []),
            JSON.stringify(trace.resolved ?? {}),
            trace.occurredAt,
          ],
        );
      } catch (err) {
        logger.warn(
          { err: (err as Error).message, decisionId: trace.decisionId },
          'cognitive-reflexivity persistence recordDecisionTrace failed',
        );
      }
    },
  };
}
