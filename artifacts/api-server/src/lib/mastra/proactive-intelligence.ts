import { pool } from "@szl-holdings/db";
import { logger } from "../logger";
import { gatewayInfer } from "../ai-gateway";

export interface ProactiveInsight {
  insightId: string;
  agentId: string;
  domain: string;
  category: "opportunity" | "risk" | "pattern" | "anomaly" | "cross_domain";
  title: string;
  description: string;
  dataPoints: string[];
  confidence: number;
  priority: "low" | "medium" | "high" | "critical";
  actionable: boolean;
  suggestedActions: string[];
  relatedDomains: string[];
  createdAt: string;
  expiresAt?: string;
  dismissed: boolean;
}

export interface MonitoringObjective {
  objectiveId: string;
  agentId: string;
  domain: string;
  description: string;
  dataQuery: string;
  frequency: "hourly" | "daily" | "weekly";
  lastRunAt?: string;
  isActive: boolean;
  proposedBy: "system" | "agent" | "user";
  createdAt: string;
}

export async function ensureProactiveTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_proactive_insights (
        id BIGSERIAL PRIMARY KEY,
        insight_id TEXT NOT NULL UNIQUE,
        agent_id TEXT NOT NULL,
        domain TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        data_points JSONB DEFAULT '[]',
        confidence FLOAT NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'medium',
        actionable BOOLEAN NOT NULL DEFAULT FALSE,
        suggested_actions JSONB DEFAULT '[]',
        related_domains JSONB DEFAULT '[]',
        dismissed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_monitoring_objectives (
        id BIGSERIAL PRIMARY KEY,
        objective_id TEXT NOT NULL UNIQUE,
        agent_id TEXT NOT NULL,
        domain TEXT NOT NULL,
        description TEXT NOT NULL,
        data_query TEXT NOT NULL,
        frequency TEXT NOT NULL DEFAULT 'daily',
        last_run_at TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        proposed_by TEXT NOT NULL DEFAULT 'system',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_insights_domain ON agent_proactive_insights(domain, created_at);
      CREATE INDEX IF NOT EXISTS idx_insights_dismissed ON agent_proactive_insights(dismissed, priority);
    `);

    logger.info("Proactive intelligence tables ensured");
  } catch (err) {
    logger.error({ err }, "Failed to ensure proactive intelligence tables");
  }
}

export async function generateCrossDomainInsight(
  domains: string[],
  agentId: string
): Promise<ProactiveInsight | null> {
  try {
    const domainStats: Record<string, any> = {};
    for (const domain of domains) {
      try {
        const runs = await pool.query(
          `SELECT count(*) as total, count(*) FILTER (WHERE status = 'failed') as failures, avg(duration_ms) as avg_ms
           FROM agent_runs WHERE domain = $1 AND created_at > NOW() - INTERVAL '48 hours'`,
          [domain]
        );
        domainStats[domain] = runs.rows[0];
      } catch {
        domainStats[domain] = { total: 0, failures: 0, avg_ms: 0 };
      }
    }

    const statsText = Object.entries(domainStats)
      .map(([d, s]) => `${d}: ${s.total} runs, ${s.failures} failures, ${Math.round(s.avg_ms)}ms avg`)
      .join("\n");

    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a proactive AI intelligence analyst for SZL Holdings. Analyze cross-domain activity data and surface actionable insights the user may not have noticed.

Respond with JSON or null if no meaningful insight:
{
  "category": "opportunity"|"risk"|"pattern"|"anomaly"|"cross_domain",
  "title": "concise insight title",
  "description": "2-3 sentence description of what was found and why it matters",
  "dataPoints": ["specific data point supporting this insight"],
  "confidence": 0.0-1.0,
  "priority": "low"|"medium"|"high"|"critical",
  "actionable": true|false,
  "suggestedActions": ["specific action to take"],
  "relatedDomains": ["domain1", "domain2"]
}`,
        },
        {
          role: "user",
          content: `Domain activity in the last 48 hours:\n${statsText}\n\nIdentify any cross-domain patterns, risks, or opportunities:`,
        },
      ],
      maxTokens: 500,
      strategy: "cheapest",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (!parsed.title || !parsed.description) return null;

    const insightId = `ins_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const insight: ProactiveInsight = {
      insightId,
      agentId,
      domain: "cross_domain",
      category: parsed.category || "pattern",
      title: parsed.title,
      description: parsed.description,
      dataPoints: parsed.dataPoints || [],
      confidence: parsed.confidence ?? 0.6,
      priority: parsed.priority || "medium",
      actionable: parsed.actionable ?? false,
      suggestedActions: parsed.suggestedActions || [],
      relatedDomains: parsed.relatedDomains || domains,
      createdAt: new Date().toISOString(),
      dismissed: false,
    };

    await saveInsight(insight);
    return insight;
  } catch (err) {
    logger.error({ err }, "Failed to generate cross-domain insight");
    return null;
  }
}

export async function saveInsight(insight: ProactiveInsight): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO agent_proactive_insights
       (insight_id, agent_id, domain, category, title, description, data_points, confidence, priority, actionable, suggested_actions, related_domains, dismissed, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, FALSE, NOW())
       ON CONFLICT (insight_id) DO NOTHING`,
      [
        insight.insightId, insight.agentId, insight.domain, insight.category,
        insight.title, insight.description,
        JSON.stringify(insight.dataPoints), insight.confidence, insight.priority,
        insight.actionable, JSON.stringify(insight.suggestedActions),
        JSON.stringify(insight.relatedDomains),
      ]
    );
  } catch (err) {
    logger.error({ err }, "Failed to save insight");
  }
}

export async function getActiveInsights(
  domain?: string,
  limit = 20
): Promise<ProactiveInsight[]> {
  try {
    const params: any[] = [false];
    let query = `SELECT * FROM agent_proactive_insights WHERE dismissed = $1`;
    let idx = 2;

    if (domain) {
      query += ` AND (domain = $${idx} OR $${idx} = ANY(related_domains::text[]))`;
      params.push(domain);
      idx++;
    }

    query += ` AND (expires_at IS NULL OR expires_at > NOW())`;
    query += ` ORDER BY CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC LIMIT $${idx}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows.map(mapInsight);
  } catch {
    return [];
  }
}

export async function dismissInsight(insightId: string): Promise<void> {
  try {
    await pool.query(
      "UPDATE agent_proactive_insights SET dismissed = TRUE WHERE insight_id = $1",
      [insightId]
    );
  } catch {}
}

export async function proposeMonitoringObjective(
  agentId: string,
  domain: string,
  discoveredPattern: string
): Promise<MonitoringObjective | null> {
  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `Based on a discovered pattern, propose a new monitoring objective for an AI agent. 
Respond with JSON:
{
  "description": "what to monitor",
  "dataQuery": "SQL-like description of what data to query",
  "frequency": "hourly"|"daily"|"weekly"
}`,
        },
        {
          role: "user",
          content: `Domain: ${domain}\nDiscovered pattern: ${discoveredPattern}\n\nPropose a monitoring objective to track this pattern:`,
        },
      ],
      maxTokens: 250,
      strategy: "cheapest",
    });

    const match = response.content.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    const objectiveId = `obj_${agentId}_${Date.now()}`;

    const objective: MonitoringObjective = {
      objectiveId,
      agentId,
      domain,
      description: parsed.description || `Monitor ${discoveredPattern.slice(0, 80)}`,
      dataQuery: parsed.dataQuery || "SELECT * FROM agent_runs",
      frequency: parsed.frequency || "daily",
      isActive: true,
      proposedBy: "agent",
      createdAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO agent_monitoring_objectives
       (objective_id, agent_id, domain, description, data_query, frequency, is_active, proposed_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, 'agent', NOW())`,
      [objective.objectiveId, objective.agentId, objective.domain, objective.description, objective.dataQuery, objective.frequency]
    );

    return objective;
  } catch {
    return null;
  }
}

export async function listMonitoringObjectives(agentId?: string): Promise<MonitoringObjective[]> {
  try {
    const params: any[] = [];
    let query = "SELECT * FROM agent_monitoring_objectives WHERE is_active = TRUE";
    if (agentId) { query += ` AND agent_id = $1`; params.push(agentId); }
    query += " ORDER BY created_at DESC LIMIT 50";

    const result = await pool.query(query, params);
    return result.rows.map((r: any) => ({
      objectiveId: r.objective_id, agentId: r.agent_id, domain: r.domain,
      description: r.description, dataQuery: r.data_query, frequency: r.frequency,
      lastRunAt: r.last_run_at, isActive: r.is_active,
      proposedBy: r.proposed_by, createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

function mapInsight(r: any): ProactiveInsight {
  return {
    insightId: r.insight_id, agentId: r.agent_id, domain: r.domain,
    category: r.category, title: r.title, description: r.description,
    dataPoints: r.data_points || [], confidence: r.confidence,
    priority: r.priority, actionable: r.actionable,
    suggestedActions: r.suggested_actions || [],
    relatedDomains: r.related_domains || [],
    createdAt: r.created_at, expiresAt: r.expires_at,
    dismissed: r.dismissed,
  };
}
