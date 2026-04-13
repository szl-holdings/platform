import { pool } from "@szl-holdings/db";
import { logger } from "../logger";

export type ActivityEventType =
  | "skill_invoked"
  | "skill_completed"
  | "skill_failed"
  | "tool_called"
  | "tool_completed"
  | "tool_failed"
  | "a2a_delegation_started"
  | "a2a_delegation_completed"
  | "a2a_delegation_failed"
  | "approval_requested"
  | "approval_granted"
  | "approval_rejected"
  | "autonomy_level_changed"
  | "composition_started"
  | "composition_step_completed"
  | "composition_completed"
  | "composition_failed"
  | "insight_surfaced"
  | "action_queued"
  | "action_executed";

export interface AgentActivityEvent {
  eventId: string;
  eventType: ActivityEventType;
  agentId: string;
  agentName?: string;
  skillId?: string;
  skillLabel?: string;
  toolName?: string;
  domain?: string;
  userId?: string;
  runId?: string;
  parentEventId?: string;
  compositionId?: string;
  fromAgentId?: string;
  toAgentId?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  reasoning?: string;
  latencyMs?: number;
  autonomyLevel?: string;
  requiresApproval?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  metadata?: Record<string, unknown>;
  occurredAt: Date;
}

const inMemoryFeed: AgentActivityEvent[] = [];
const MAX_IN_MEMORY = 500;

export async function ensureAgentActivityTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_agent_activity (
        id BIGSERIAL PRIMARY KEY,
        event_id TEXT NOT NULL UNIQUE,
        event_type TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        agent_name TEXT,
        skill_id TEXT,
        skill_label TEXT,
        tool_name TEXT,
        domain TEXT,
        user_id TEXT,
        run_id TEXT,
        parent_event_id TEXT,
        composition_id TEXT,
        from_agent_id TEXT,
        to_agent_id TEXT,
        input JSONB,
        output JSONB,
        reasoning TEXT,
        latency_ms INTEGER,
        autonomy_level TEXT,
        requires_approval BOOLEAN DEFAULT FALSE,
        approval_status TEXT,
        metadata JSONB DEFAULT '{}',
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_agent_activity_event_type ON ai_agent_activity(event_type);
      CREATE INDEX IF NOT EXISTS idx_agent_activity_agent_id ON ai_agent_activity(agent_id);
      CREATE INDEX IF NOT EXISTS idx_agent_activity_user_id ON ai_agent_activity(user_id);
      CREATE INDEX IF NOT EXISTS idx_agent_activity_domain ON ai_agent_activity(domain);
      CREATE INDEX IF NOT EXISTS idx_agent_activity_occurred_at ON ai_agent_activity(occurred_at DESC);
      CREATE INDEX IF NOT EXISTS idx_agent_activity_run_id ON ai_agent_activity(run_id);
    `);
    logger.info("ai_agent_activity table ensured");
  } catch (err) {
    logger.warn({ err }, "Failed to ensure agent activity table (non-fatal)");
  }
}

export async function emitActivityEvent(event: Omit<AgentActivityEvent, "eventId" | "occurredAt"> & { eventId?: string; occurredAt?: Date }): Promise<string> {
  const eventId = event.eventId ?? `activity_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const occurredAt = event.occurredAt ?? new Date();

  const fullEvent: AgentActivityEvent = { ...event, eventId, occurredAt };

  inMemoryFeed.unshift(fullEvent);
  if (inMemoryFeed.length > MAX_IN_MEMORY) {
    inMemoryFeed.splice(MAX_IN_MEMORY);
  }

  try {
    await pool.query(
      `INSERT INTO ai_agent_activity
       (event_id, event_type, agent_id, agent_name, skill_id, skill_label, tool_name, domain,
        user_id, run_id, parent_event_id, composition_id, from_agent_id, to_agent_id,
        input, output, reasoning, latency_ms, autonomy_level, requires_approval,
        approval_status, metadata, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       ON CONFLICT (event_id) DO NOTHING`,
      [
        eventId, event.eventType, event.agentId, event.agentName ?? null,
        event.skillId ?? null, event.skillLabel ?? null, event.toolName ?? null,
        event.domain ?? null, event.userId ?? null, event.runId ?? null,
        event.parentEventId ?? null, event.compositionId ?? null,
        event.fromAgentId ?? null, event.toAgentId ?? null,
        event.input ? JSON.stringify(event.input) : null,
        event.output ? JSON.stringify(event.output) : null,
        event.reasoning ?? null, event.latencyMs ?? null,
        event.autonomyLevel ?? null, event.requiresApproval ?? false,
        event.approvalStatus ?? null,
        JSON.stringify(event.metadata ?? {}),
        occurredAt,
      ]
    );
  } catch (err) {
    logger.warn({ err, eventId }, "Failed to persist activity event (non-fatal)");
  }

  return eventId;
}

export async function getActivityFeed(filters?: {
  agentId?: string;
  domain?: string;
  userId?: string;
  runId?: string;
  compositionId?: string;
  eventTypes?: ActivityEventType[];
  limit?: number;
  offset?: number;
  since?: Date;
}): Promise<{ events: AgentActivityEvent[]; total: number }> {
  const conditions = ["1=1"];
  const params: any[] = [];
  let idx = 1;

  if (filters?.agentId) { conditions.push(`agent_id = $${idx}`); params.push(filters.agentId); idx++; }
  if (filters?.domain) { conditions.push(`domain = $${idx}`); params.push(filters.domain); idx++; }
  if (filters?.userId) { conditions.push(`user_id = $${idx}`); params.push(filters.userId); idx++; }
  if (filters?.runId) { conditions.push(`run_id = $${idx}`); params.push(filters.runId); idx++; }
  if (filters?.compositionId) { conditions.push(`composition_id = $${idx}`); params.push(filters.compositionId); idx++; }
  if (filters?.eventTypes?.length) { conditions.push(`event_type = ANY($${idx})`); params.push(filters.eventTypes); idx++; }
  if (filters?.since) { conditions.push(`occurred_at > $${idx}`); params.push(filters.since); idx++; }

  const where = conditions.join(" AND ");

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM ai_agent_activity WHERE ${where} ORDER BY occurred_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, filters?.limit ?? 50, filters?.offset ?? 0]
      ),
      pool.query(`SELECT COUNT(*) as cnt FROM ai_agent_activity WHERE ${where}`, params),
    ]);

    return {
      events: dataResult.rows.map(rowToEvent),
      total: parseInt(countResult.rows[0]?.cnt ?? "0"),
    };
  } catch (err) {
    logger.error({ err }, "Failed to get activity feed from DB, using in-memory");
    let events = [...inMemoryFeed];
    if (filters?.agentId) events = events.filter(e => e.agentId === filters.agentId);
    if (filters?.domain) events = events.filter(e => e.domain === filters.domain);
    if (filters?.userId) events = events.filter(e => e.userId === filters.userId);
    if (filters?.eventTypes?.length) events = events.filter(e => filters.eventTypes!.includes(e.eventType));
    const total = events.length;
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit ?? 50;
    return { events: events.slice(offset, offset + limit), total };
  }
}

export function getRecentActivityFromMemory(limit = 20): AgentActivityEvent[] {
  return inMemoryFeed.slice(0, limit);
}

export async function getA2ADelegationChain(runId: string): Promise<AgentActivityEvent[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM ai_agent_activity
       WHERE run_id = $1 AND event_type IN ('a2a_delegation_started', 'a2a_delegation_completed', 'a2a_delegation_failed')
       ORDER BY occurred_at ASC`,
      [runId]
    );
    return result.rows.map(rowToEvent);
  } catch {
    return inMemoryFeed.filter(e =>
      e.runId === runId &&
      ["a2a_delegation_started", "a2a_delegation_completed", "a2a_delegation_failed"].includes(e.eventType)
    );
  }
}

export async function getAgentActivityStats(windowHours = 24): Promise<{
  totalEvents: number;
  byEventType: Record<string, number>;
  byAgent: Record<string, number>;
  byDomain: Record<string, number>;
  approvalRate: number;
  topSkills: Array<{ skillId: string; skillLabel: string; count: number }>;
}> {
  try {
    const [totalResult, byTypeResult, byAgentResult, byDomainResult, approvalResult, skillsResult] = await Promise.all([
      pool.query(
        "SELECT COUNT(*) as cnt FROM ai_agent_activity WHERE occurred_at > NOW() - INTERVAL '1 hour' * $1",
        [windowHours]
      ),
      pool.query(
        "SELECT event_type, COUNT(*) as cnt FROM ai_agent_activity WHERE occurred_at > NOW() - INTERVAL '1 hour' * $1 GROUP BY event_type",
        [windowHours]
      ),
      pool.query(
        "SELECT agent_id, COUNT(*) as cnt FROM ai_agent_activity WHERE occurred_at > NOW() - INTERVAL '1 hour' * $1 GROUP BY agent_id ORDER BY cnt DESC LIMIT 10",
        [windowHours]
      ),
      pool.query(
        "SELECT domain, COUNT(*) as cnt FROM ai_agent_activity WHERE domain IS NOT NULL AND occurred_at > NOW() - INTERVAL '1 hour' * $1 GROUP BY domain",
        [windowHours]
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE approval_status = 'approved') as approved,
           COUNT(*) FILTER (WHERE requires_approval = TRUE) as total_requiring
         FROM ai_agent_activity WHERE occurred_at > NOW() - INTERVAL '1 hour' * $1`,
        [windowHours]
      ),
      pool.query(
        `SELECT skill_id, skill_label, COUNT(*) as cnt FROM ai_agent_activity
         WHERE skill_id IS NOT NULL AND occurred_at > NOW() - INTERVAL '1 hour' * $1
         GROUP BY skill_id, skill_label ORDER BY cnt DESC LIMIT 5`,
        [windowHours]
      ),
    ]);

    const byEventType: Record<string, number> = {};
    for (const row of byTypeResult.rows) byEventType[row.event_type] = parseInt(row.cnt);

    const byAgent: Record<string, number> = {};
    for (const row of byAgentResult.rows) byAgent[row.agent_id] = parseInt(row.cnt);

    const byDomain: Record<string, number> = {};
    for (const row of byDomainResult.rows) byDomain[row.domain] = parseInt(row.cnt);

    const approvalRow = approvalResult.rows[0];
    const totalRequiring = parseInt(approvalRow?.total_requiring ?? "0");
    const approved = parseInt(approvalRow?.approved ?? "0");
    const approvalRate = totalRequiring > 0 ? approved / totalRequiring : 1;

    return {
      totalEvents: parseInt(totalResult.rows[0]?.cnt ?? "0"),
      byEventType,
      byAgent,
      byDomain,
      approvalRate,
      topSkills: skillsResult.rows.map((r: any) => ({
        skillId: r.skill_id,
        skillLabel: r.skill_label ?? r.skill_id,
        count: parseInt(r.cnt),
      })),
    };
  } catch (err) {
    logger.error({ err }, "Failed to get activity stats");
    return {
      totalEvents: inMemoryFeed.length,
      byEventType: {},
      byAgent: {},
      byDomain: {},
      approvalRate: 1,
      topSkills: [],
    };
  }
}

function rowToEvent(row: any): AgentActivityEvent {
  return {
    eventId: row.event_id,
    eventType: row.event_type,
    agentId: row.agent_id,
    agentName: row.agent_name,
    skillId: row.skill_id,
    skillLabel: row.skill_label,
    toolName: row.tool_name,
    domain: row.domain,
    userId: row.user_id,
    runId: row.run_id,
    parentEventId: row.parent_event_id,
    compositionId: row.composition_id,
    fromAgentId: row.from_agent_id,
    toAgentId: row.to_agent_id,
    input: row.input,
    output: row.output,
    reasoning: row.reasoning,
    latencyMs: row.latency_ms,
    autonomyLevel: row.autonomy_level,
    requiresApproval: row.requires_approval,
    approvalStatus: row.approval_status,
    metadata: row.metadata,
    occurredAt: row.occurred_at,
  };
}
