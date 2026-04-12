import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

export type LearningEventType =
  | "agent_execution"
  | "rag_retrieval"
  | "tool_call"
  | "a2a_delegation"
  | "user_feedback"
  | "proposal_approved"
  | "proposal_dismissed"
  | "gap_detected"
  | "evolution_cycle"
  | "routing_decision";

export interface LearningRecord {
  id?: number;
  eventType: LearningEventType;
  agentId?: string;
  domain?: string;
  runId?: string;
  sessionId?: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  latencyMs?: number;
  tokensUsed?: number;
  costUsd?: number;
  successScore?: number;
  userSatisfaction?: number;
  routingWeight?: number;
  toolsUsed?: string[];
  ragSourceCount?: number;
  delegationCount?: number;
  feedbackSignal?: "positive" | "negative" | "neutral";
  metadata?: Record<string, unknown>;
  recordedAt: string;
}

export interface EvolutionBehaviorUpdate {
  routingWeightAdjustments: Record<string, number>;
  promptStrategyChanges: Record<string, string>;
  toolSelectionPreferences: Record<string, number>;
  generation: number;
  drivingRecordCount: number;
  performanceDelta: {
    latencyDeltaMs: number;
    successRateDelta: number;
    satisfactionDelta: number;
  };
}

export interface LearningAggregates {
  totalRecords: number;
  byEventType: Record<string, number>;
  byDomain: Record<string, { count: number; avgSuccess: number; avgLatency: number }>;
  topPerformingAgents: Array<{ agentId: string; avgScore: number; count: number }>;
  bottomPerformingAgents: Array<{ agentId: string; avgScore: number; count: number }>;
  recentFeedback: { positive: number; negative: number; neutral: number };
  periodStart: string;
  periodEnd: string;
}

export async function recordLearningEvent(event: Omit<LearningRecord, "id" | "recordedAt">): Promise<void> {
  await ensureLearningTable();
  try {
    await pool.query(
      `INSERT INTO alloy_learning_records
       (event_type, agent_id, domain, run_id, session_id, inputs, outputs,
        latency_ms, tokens_used, cost_usd, success_score, user_satisfaction,
        routing_weight, tools_used, rag_source_count, delegation_count,
        feedback_signal, metadata, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())`,
      [
        event.eventType,
        event.agentId || null,
        event.domain || null,
        event.runId || null,
        event.sessionId || null,
        JSON.stringify(event.inputs || {}),
        JSON.stringify(event.outputs || {}),
        event.latencyMs || null,
        event.tokensUsed || null,
        event.costUsd || null,
        event.successScore ?? null,
        event.userSatisfaction ?? null,
        event.routingWeight ?? null,
        JSON.stringify(event.toolsUsed || []),
        event.ragSourceCount ?? null,
        event.delegationCount ?? null,
        event.feedbackSignal || null,
        JSON.stringify(event.metadata || {}),
      ]
    );
  } catch (err) {
    logger.warn({ err, eventType: event.eventType }, "Failed to record learning event");
  }
}

export async function recordAgentExecution(params: {
  agentId: string;
  domain: string;
  runId: string;
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  toolsUsed: string[];
  delegationCount: number;
  success: boolean;
  outputSummary?: string;
}): Promise<void> {
  await recordLearningEvent({
    eventType: "agent_execution",
    agentId: params.agentId,
    domain: params.domain,
    runId: params.runId,
    latencyMs: params.latencyMs,
    tokensUsed: params.tokensUsed,
    costUsd: params.costUsd,
    toolsUsed: params.toolsUsed,
    delegationCount: params.delegationCount,
    successScore: params.success ? 1.0 : 0.0,
    outputs: params.outputSummary ? { summary: params.outputSummary.slice(0, 200) } : {},
  });
}

export async function recordRAGRetrieval(params: {
  agentId: string;
  query: string;
  sourceCount: number;
  topSimilarity: number;
  latencyMs: number;
}): Promise<void> {
  await recordLearningEvent({
    eventType: "rag_retrieval",
    agentId: params.agentId,
    ragSourceCount: params.sourceCount,
    latencyMs: params.latencyMs,
    successScore: params.topSimilarity,
    inputs: { query: params.query.slice(0, 200) },
    outputs: { sourceCount: params.sourceCount, topSimilarity: params.topSimilarity },
  });
}

export async function recordToolCall(params: {
  toolName: string;
  agentId?: string;
  latencyMs: number;
  success: boolean;
  error?: string;
}): Promise<void> {
  await recordLearningEvent({
    eventType: "tool_call",
    agentId: params.agentId,
    toolsUsed: [params.toolName],
    latencyMs: params.latencyMs,
    successScore: params.success ? 1.0 : 0.0,
    metadata: params.error ? { error: params.error } : {},
  });
}

export async function recordA2ADelegation(params: {
  fromAgentId: string;
  toAgentId: string;
  domain: string;
  latencyMs: number;
  success: boolean;
}): Promise<void> {
  await recordLearningEvent({
    eventType: "a2a_delegation",
    agentId: params.fromAgentId,
    domain: params.domain,
    delegationCount: 1,
    latencyMs: params.latencyMs,
    successScore: params.success ? 1.0 : 0.0,
    metadata: { toAgent: params.toAgentId },
  });
}

export async function recordUserFeedback(params: {
  agentId?: string;
  domain?: string;
  sessionId?: string;
  feedback: "positive" | "negative" | "neutral";
  satisfaction?: number;
  comment?: string;
}): Promise<void> {
  await recordLearningEvent({
    eventType: "user_feedback",
    agentId: params.agentId,
    domain: params.domain,
    sessionId: params.sessionId,
    feedbackSignal: params.feedback,
    userSatisfaction: params.satisfaction,
    metadata: params.comment ? { comment: params.comment } : {},
  });
}

export async function recordProposalAction(params: {
  proposalId: number;
  action: "approved" | "dismissed";
  userId?: number;
  proposalType?: string;
  affectedVentures?: string[];
}): Promise<void> {
  await recordLearningEvent({
    eventType: params.action === "approved" ? "proposal_approved" : "proposal_dismissed",
    feedbackSignal: params.action === "approved" ? "positive" : "negative",
    successScore: params.action === "approved" ? 1.0 : 0.0,
    metadata: {
      proposalId: params.proposalId,
      userId: params.userId,
      proposalType: params.proposalType,
      affectedVentures: params.affectedVentures,
    },
  });
}

export async function getLearningAggregates(windowHours = 168): Promise<LearningAggregates> {
  await ensureLearningTable();

  try {
    const [totalResult, byTypeResult, byDomainResult, agentPerf, feedbackResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as total FROM alloy_learning_records
         WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1`,
        [windowHours]
      ),
      pool.query(
        `SELECT event_type, COUNT(*) as cnt
         FROM alloy_learning_records
         WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
         GROUP BY event_type`,
        [windowHours]
      ),
      pool.query(
        `SELECT domain, COUNT(*) as cnt,
                AVG(success_score) as avg_success,
                AVG(latency_ms) as avg_latency
         FROM alloy_learning_records
         WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
           AND domain IS NOT NULL
         GROUP BY domain`,
        [windowHours]
      ),
      pool.query(
        `SELECT agent_id, AVG(success_score) as avg_score, COUNT(*) as cnt
         FROM alloy_learning_records
         WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
           AND agent_id IS NOT NULL
           AND success_score IS NOT NULL
         GROUP BY agent_id
         HAVING COUNT(*) >= 3
         ORDER BY avg_score DESC`,
        [windowHours]
      ),
      pool.query(
        `SELECT feedback_signal, COUNT(*) as cnt
         FROM alloy_learning_records
         WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
           AND feedback_signal IS NOT NULL
         GROUP BY feedback_signal`,
        [windowHours]
      ),
    ]);

    const byEventType: Record<string, number> = {};
    for (const row of byTypeResult.rows) {
      byEventType[row.event_type] = parseInt(row.cnt);
    }

    const byDomain: Record<string, { count: number; avgSuccess: number; avgLatency: number }> = {};
    for (const row of byDomainResult.rows) {
      byDomain[row.domain] = {
        count: parseInt(row.cnt),
        avgSuccess: parseFloat(row.avg_success) || 0,
        avgLatency: parseFloat(row.avg_latency) || 0,
      };
    }

    const allAgents = agentPerf.rows.map(r => ({
      agentId: r.agent_id as string,
      avgScore: parseFloat(r.avg_score as string) || 0,
      count: parseInt(r.cnt as string),
    }));

    const feedbackCounts: Record<string, number> = {};
    for (const row of feedbackResult.rows) {
      feedbackCounts[row.feedback_signal] = parseInt(row.cnt);
    }

    const now = new Date();
    const periodStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

    return {
      totalRecords: parseInt(totalResult.rows[0].total),
      byEventType,
      byDomain,
      topPerformingAgents: allAgents.slice(0, 5),
      bottomPerformingAgents: allAgents.slice(-5).reverse(),
      recentFeedback: {
        positive: feedbackCounts["positive"] || 0,
        negative: feedbackCounts["negative"] || 0,
        neutral: feedbackCounts["neutral"] || 0,
      },
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
    };
  } catch (err) {
    logger.warn({ err }, "Failed to get learning aggregates");
    return {
      totalRecords: 0,
      byEventType: {},
      byDomain: {},
      topPerformingAgents: [],
      bottomPerformingAgents: [],
      recentFeedback: { positive: 0, negative: 0, neutral: 0 },
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
    };
  }
}

export async function computeBehaviorUpdate(
  currentGeneration: number,
  windowHours = 48
): Promise<EvolutionBehaviorUpdate> {
  await ensureLearningTable();

  try {
    const [agentPerf, toolPrefs, feedbackData] = await Promise.all([
      pool.query(
        `SELECT agent_id, domain,
                AVG(success_score) as avg_success,
                AVG(latency_ms) as avg_latency,
                COUNT(*) as cnt
         FROM alloy_learning_records
         WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
           AND event_type = 'agent_execution'
           AND agent_id IS NOT NULL
         GROUP BY agent_id, domain`,
        [windowHours]
      ),
      pool.query<{ tool_name: string; avg_success: string; cnt: string }>(
        `SELECT tool_name,
                AVG(success_score) as avg_success,
                COUNT(*) as cnt
         FROM alloy_learning_records,
              jsonb_array_elements_text(
                CASE jsonb_typeof(tools_used)
                  WHEN 'array' THEN tools_used
                  ELSE '[]'::jsonb
                END
              ) AS tool_name
         WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
           AND tools_used IS NOT NULL
           AND tools_used != 'null'::jsonb
         GROUP BY tool_name
         HAVING COUNT(*) >= 2`,
        [windowHours]
      ).catch(() => ({ rows: [] as Array<{ tool_name: string; avg_success: string; cnt: string }> })),
      pool.query(
        `SELECT AVG(CASE WHEN feedback_signal = 'positive' THEN 1 WHEN feedback_signal = 'negative' THEN -1 ELSE 0 END) as avg_feedback
         FROM alloy_learning_records
         WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
           AND feedback_signal IS NOT NULL`,
        [windowHours]
      ),
    ]);

    const routingWeightAdjustments: Record<string, number> = {};
    for (const row of agentPerf.rows) {
      const successRate = parseFloat(row.avg_success) || 0;
      const adjustment = (successRate - 0.5) * 0.2;
      routingWeightAdjustments[row.agent_id] = parseFloat((1.0 + adjustment).toFixed(3));
    }

    const toolSelectionPreferences: Record<string, number> = {};
    for (const row of toolPrefs.rows) {
      toolSelectionPreferences[row.tool_name] = parseFloat(row.avg_success) || 0;
    }

    const avgFeedback = parseFloat(feedbackData.rows[0]?.avg_feedback) || 0;

    const prevPerf = await pool.query(
      `SELECT AVG(success_score) as prev_success, AVG(latency_ms) as prev_latency
       FROM alloy_learning_records
       WHERE recorded_at BETWEEN NOW() - INTERVAL '1 hour' * $1 * 2 AND NOW() - INTERVAL '1 hour' * $1
         AND event_type = 'agent_execution'`,
      [windowHours]
    );

    const currPerf = await pool.query(
      `SELECT AVG(success_score) as curr_success, AVG(latency_ms) as curr_latency
       FROM alloy_learning_records
       WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
         AND event_type = 'agent_execution'`,
      [windowHours]
    );

    const prevSuccess = parseFloat(prevPerf.rows[0]?.prev_success) || 0;
    const currSuccess = parseFloat(currPerf.rows[0]?.curr_success) || 0;
    const prevLatency = parseFloat(prevPerf.rows[0]?.prev_latency) || 0;
    const currLatency = parseFloat(currPerf.rows[0]?.curr_latency) || 0;

    return {
      routingWeightAdjustments,
      promptStrategyChanges: {},
      toolSelectionPreferences,
      generation: currentGeneration,
      drivingRecordCount: agentPerf.rows.reduce((s, r) => s + parseInt(r.cnt), 0),
      performanceDelta: {
        latencyDeltaMs: Math.round(currLatency - prevLatency),
        successRateDelta: parseFloat((currSuccess - prevSuccess).toFixed(4)),
        satisfactionDelta: parseFloat(avgFeedback.toFixed(4)),
      },
    };
  } catch (err) {
    logger.warn({ err }, "Failed to compute behavior update");
    return {
      routingWeightAdjustments: {},
      promptStrategyChanges: {},
      toolSelectionPreferences: {},
      generation: currentGeneration,
      drivingRecordCount: 0,
      performanceDelta: { latencyDeltaMs: 0, successRateDelta: 0, satisfactionDelta: 0 },
    };
  }
}

export async function ensureLearningTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alloy_learning_records (
        id SERIAL PRIMARY KEY,
        event_type TEXT NOT NULL,
        agent_id TEXT,
        domain TEXT,
        run_id TEXT,
        session_id TEXT,
        inputs JSONB DEFAULT '{}',
        outputs JSONB DEFAULT '{}',
        latency_ms INTEGER,
        tokens_used INTEGER,
        cost_usd NUMERIC(10,6),
        success_score NUMERIC(4,3),
        user_satisfaction NUMERIC(4,3),
        routing_weight NUMERIC(6,4),
        tools_used JSONB DEFAULT '[]',
        rag_source_count INTEGER,
        delegation_count INTEGER,
        feedback_signal TEXT,
        metadata JSONB DEFAULT '{}',
        recorded_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_learning_records_event_type ON alloy_learning_records(event_type);
      CREATE INDEX IF NOT EXISTS idx_learning_records_agent ON alloy_learning_records(agent_id);
      CREATE INDEX IF NOT EXISTS idx_learning_records_domain ON alloy_learning_records(domain);
      CREATE INDEX IF NOT EXISTS idx_learning_records_recorded ON alloy_learning_records(recorded_at);
    `).catch(() => {});
  } catch (err) {
    logger.warn({ err }, "Failed to ensure learning records table");
  }
}
