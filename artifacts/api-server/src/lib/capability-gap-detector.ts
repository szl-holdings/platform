import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

export interface CapabilityGap {
  id?: number;
  gapType: "tool_missing" | "agent_skill" | "domain_coverage" | "pipeline_gap" | "cross_domain";
  title: string;
  description: string;
  frequency: number;
  severity: "critical" | "high" | "medium" | "low";
  affectedDomains: string[];
  suggestedRemediation: string;
  evidenceSamples: string[];
  detectedAt: string;
  status: "open" | "acknowledged" | "resolved";
  metadata?: Record<string, unknown>;
}

export interface GapDetectionResult {
  gapsDetected: number;
  gaps: CapabilityGap[];
  analysisWindow: string;
  domainsAnalyzed: string[];
}

const DOMAIN_CAPABILITIES: Record<string, string[]> = {
  maritime: ["route_optimization", "ais_tracking", "sanctions_check", "port_risk", "cargo_compliance", "weather_routing"],
  defense: ["threat_detection", "incident_response", "vulnerability_scan", "kill_chain", "osint", "counter_intel"],
  legal: ["contract_review", "compliance_check", "matter_management", "litigation_support", "regulatory_filing"],
  real_estate: ["property_valuation", "market_analysis", "deal_scoring", "portfolio_optimization"],
  finance: ["portfolio_analysis", "risk_assessment", "revenue_modeling", "cost_optimization"],
  cyber: ["threat_intel", "malware_analysis", "network_forensics", "zero_day_detection"],
  intelligence: ["signal_correlation", "entity_resolution", "pattern_analysis", "geospatial_intel"],
  consulting: ["strategic_advisory", "stakeholder_analysis", "change_management"],
  general: ["signal_triage", "workflow_routing", "cross_domain_correlation"],
};

async function getRecentToolFailures(windowHours = 24): Promise<Array<{ tool_name: string; error: string; count: number; domain: string }>> {
  try {
    const result = await pool.query(
      `SELECT tool_name, error, count(*) as count,
              COALESCE(agent_id, 'unknown') as domain
       FROM ai_tool_executions
       WHERE status = 'failed'
         AND created_at > NOW() - INTERVAL '1 hour' * $1
       GROUP BY tool_name, error, agent_id
       ORDER BY count DESC
       LIMIT 50`,
      [windowHours]
    );
    return result.rows;
  } catch {
    return [];
  }
}

async function getUnhandledQueries(windowHours = 48): Promise<Array<{ content: string; agent_id: string; thread_id: string }>> {
  try {
    const result = await pool.query(
      `SELECT m.content, t.agent_id, m.thread_id
       FROM agent_memory_messages m
       JOIN agent_memory_threads t ON m.thread_id = t.thread_id
       WHERE m.role = 'user'
         AND m.created_at > NOW() - INTERVAL '1 hour' * $1
         AND NOT EXISTS (
           SELECT 1 FROM agent_memory_messages m2
           WHERE m2.thread_id = m.thread_id
             AND m2.role = 'assistant'
             AND m2.created_at > m.created_at
         )
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [windowHours]
    );
    return result.rows;
  } catch {
    return [];
  }
}

async function getAgentPerformanceGaps(): Promise<Array<{ agent_id: string; domain: string; success_rate: number; avg_latency: number }>> {
  try {
    const result = await pool.query(
      `SELECT agent_id, domain,
              COUNT(*) FILTER (WHERE status = 'completed')::float / NULLIF(COUNT(*), 0) as success_rate,
              AVG(duration_ms) as avg_latency
       FROM agent_runs
       WHERE created_at > NOW() - INTERVAL '72 hours'
       GROUP BY agent_id, domain
       HAVING COUNT(*) >= 3
       ORDER BY success_rate ASC
       LIMIT 30`
    );
    return result.rows;
  } catch {
    return [];
  }
}

async function getRoutingFallbacks(windowHours = 24): Promise<Array<{ domain: string; count: number }>> {
  try {
    const result = await pool.query(
      `SELECT metadata->>'domain' as domain, count(*) as count
       FROM alloy_audit_log
       WHERE action = 'route_fallback'
         AND created_at > NOW() - INTERVAL '1 hour' * $1
       GROUP BY domain
       ORDER BY count DESC`,
      [windowHours]
    );
    return result.rows;
  } catch {
    try {
      const result2 = await pool.query(
        `SELECT selected_expert_slug as domain, count(*) as count
         FROM alloy_expert_routing_log
         WHERE fallback_used = true
           AND created_at > NOW() - INTERVAL '1 hour' * $1
         GROUP BY selected_expert_slug
         ORDER BY count DESC`,
        [windowHours]
      );
      return result2.rows;
    } catch {
      return [];
    }
  }
}

function detectToolCoverageGaps(toolFailures: Array<{ tool_name: string; error: string; count: number; domain: string }>): CapabilityGap[] {
  const gaps: CapabilityGap[] = [];
  const highFreqFailures = toolFailures.filter(f => f.count >= 3);

  const byTool = new Map<string, { totalCount: number; errors: string[]; domains: string[] }>();
  for (const f of highFreqFailures) {
    const existing = byTool.get(f.tool_name) || { totalCount: 0, errors: [], domains: [] };
    existing.totalCount += parseInt(String(f.count));
    if (!existing.errors.includes(f.error)) existing.errors.push(f.error);
    if (!existing.domains.includes(f.domain)) existing.domains.push(f.domain);
    byTool.set(f.tool_name, existing);
  }

  for (const [toolName, data] of byTool) {
    if (data.totalCount >= 5) {
      gaps.push({
        gapType: "tool_missing",
        title: `Tool "${toolName}" failing repeatedly (${data.totalCount}x)`,
        description: `The tool "${toolName}" has failed ${data.totalCount} times in the analysis window. This indicates a recurring capability gap that users are hitting regularly. Errors: ${data.errors.slice(0, 2).join("; ")}`,
        frequency: data.totalCount,
        severity: data.totalCount > 20 ? "critical" : data.totalCount > 10 ? "high" : "medium",
        affectedDomains: data.domains,
        suggestedRemediation: `Investigate and repair the "${toolName}" tool, or replace it with a more reliable alternative. Consider adding a fallback tool for this capability.`,
        evidenceSamples: data.errors.slice(0, 3),
        detectedAt: new Date().toISOString(),
        status: "open",
      });
    }
  }

  return gaps;
}

function detectAgentSkillGaps(performanceData: Array<{ agent_id: string; domain: string; success_rate: number; avg_latency: number }>): CapabilityGap[] {
  const gaps: CapabilityGap[] = [];

  for (const agent of performanceData) {
    const successRate = parseFloat(String(agent.success_rate)) || 0;
    const avgLatency = parseFloat(String(agent.avg_latency)) || 0;

    if (successRate < 0.7) {
      gaps.push({
        gapType: "agent_skill",
        title: `Agent "${agent.agent_id}" has low success rate (${(successRate * 100).toFixed(1)}%)`,
        description: `Agent "${agent.agent_id}" in domain "${agent.domain}" is succeeding only ${(successRate * 100).toFixed(1)}% of the time. This indicates the agent lacks skills needed to handle the queries it receives. It may need new tools, better prompting, or RAG context enrichment.`,
        frequency: Math.round((1 - successRate) * 100),
        severity: successRate < 0.5 ? "critical" : successRate < 0.6 ? "high" : "medium",
        affectedDomains: [agent.domain || "unknown"],
        suggestedRemediation: `Analyze failed runs for "${agent.agent_id}". Consider adding domain-specific tools, enhancing the system prompt with RAG context, or delegating to a specialist sub-agent.`,
        evidenceSamples: [`Success rate: ${(successRate * 100).toFixed(1)}%`, `Avg latency: ${Math.round(avgLatency)}ms`],
        detectedAt: new Date().toISOString(),
        status: "open",
      });
    }

    if (avgLatency > 8000 && successRate > 0.7) {
      gaps.push({
        gapType: "pipeline_gap",
        title: `Agent "${agent.agent_id}" has high latency (${Math.round(avgLatency)}ms avg)`,
        description: `Agent "${agent.agent_id}" is taking ${Math.round(avgLatency)}ms on average to respond. This is above the 8000ms threshold and may indicate tool chain inefficiency, excessive RAG retrieval, or lack of caching.`,
        frequency: 1,
        severity: avgLatency > 15000 ? "high" : "medium",
        affectedDomains: [agent.domain || "unknown"],
        suggestedRemediation: `Profile the agent's execution trace. Consider adding caching for frequent tool calls, reducing RAG retrieval depth, or using a faster model for initial classification steps.`,
        evidenceSamples: [`Avg latency: ${Math.round(avgLatency)}ms`, `Domain: ${agent.domain}`],
        detectedAt: new Date().toISOString(),
        status: "open",
      });
    }
  }

  return gaps;
}

function detectDomainCoverageGaps(fallbacks: Array<{ domain: string; count: number }>): CapabilityGap[] {
  const gaps: CapabilityGap[] = [];

  for (const fb of fallbacks) {
    const count = parseInt(String(fb.count));
    if (count >= 5 && fb.domain) {
      gaps.push({
        gapType: "domain_coverage",
        title: `Domain "${fb.domain}" routing falling back to general expert (${count}x)`,
        description: `Signals for domain "${fb.domain}" are repeatedly routed to the fallback/general expert instead of a domain specialist. This suggests either the domain expert is underperforming or no specialist agent exists for this query type.`,
        frequency: count,
        severity: count > 20 ? "high" : "medium",
        affectedDomains: [fb.domain],
        suggestedRemediation: `Investigate why the "${fb.domain}" expert is not being selected. If the domain is growing, consider adding a dedicated expert agent with appropriate capabilities and a lower confidence threshold.`,
        evidenceSamples: [`Fallback count: ${count}`, `Domain: ${fb.domain}`],
        detectedAt: new Date().toISOString(),
        status: "open",
      });
    }
  }

  return gaps;
}

function detectUnhandledQueryGaps(unhandledQueries: Array<{ content: string; agent_id: string; thread_id: string }>): CapabilityGap[] {
  if (unhandledQueries.length === 0) return [];

  const domainCounts = new Map<string, { count: number; samples: string[] }>();
  for (const q of unhandledQueries) {
    const agentDomain = q.agent_id?.split("-")[0] || "unknown";
    const existing = domainCounts.get(agentDomain) || { count: 0, samples: [] };
    existing.count++;
    if (existing.samples.length < 3) existing.samples.push(q.content.slice(0, 120));
    domainCounts.set(agentDomain, existing);
  }

  const gaps: CapabilityGap[] = [];
  for (const [domain, data] of domainCounts) {
    if (data.count >= 2) {
      gaps.push({
        gapType: "agent_skill",
        title: `${data.count} unanswered queries in "${domain}" domain`,
        description: `${data.count} user queries in the "${domain}" domain were left without a response, suggesting the agent lacks coverage for these request types. This may indicate a skill gap, a missing tool, or an unrouted query type.`,
        frequency: data.count,
        severity: data.count > 10 ? "high" : data.count > 5 ? "medium" : "low",
        affectedDomains: [domain],
        suggestedRemediation: `Review unanswered queries for "${domain}". Add relevant tools or expand the agent's system prompt to cover these query types.`,
        evidenceSamples: data.samples,
        detectedAt: new Date().toISOString(),
        status: "open",
      });
    }
  }

  return gaps;
}

function detectCrossDomainGaps(allGaps: CapabilityGap[]): CapabilityGap[] {
  const domainFrequency = new Map<string, number>();

  for (const gap of allGaps) {
    for (const domain of gap.affectedDomains) {
      domainFrequency.set(domain, (domainFrequency.get(domain) || 0) + gap.frequency);
    }
  }

  const crossDomainGaps: CapabilityGap[] = [];
  const affectedDomainPairs: Array<[string, string]> = [];

  const entries = Array.from(domainFrequency.entries()).filter(([, v]) => v > 10);
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const domA = entries[i]![0];
      const domB = entries[j]![0];
      affectedDomainPairs.push([domA, domB]);
    }
  }

  if (affectedDomainPairs.length >= 2) {
    crossDomainGaps.push({
      gapType: "cross_domain",
      title: `Multiple domains experiencing capability gaps simultaneously`,
      description: `Domains ${affectedDomainPairs.slice(0, 3).map(([a, b]) => `${a}+${b}`).join(", ")} are all experiencing capability gaps at the same time. This may indicate a shared infrastructure issue or cross-domain data sharing opportunity.`,
      frequency: entries.reduce((sum, [, v]) => sum + v, 0),
      severity: "medium",
      affectedDomains: entries.map(([d]) => d),
      suggestedRemediation: `Evaluate whether a cross-domain Mesh connection or shared tool module would resolve gaps across multiple verticals simultaneously.`,
      evidenceSamples: affectedDomainPairs.slice(0, 3).map(([a, b]) => `${a} ↔ ${b} correlation`),
      detectedAt: new Date().toISOString(),
      status: "open",
    });
  }

  return crossDomainGaps;
}

export async function detectCapabilityGaps(windowHours = 48): Promise<GapDetectionResult> {
  const startTime = Date.now();
  logger.info({ windowHours }, "Capability gap detection started");

  const [toolFailures, performanceData, fallbacks, unhandledQueries] = await Promise.all([
    getRecentToolFailures(windowHours),
    getAgentPerformanceGaps(),
    getRoutingFallbacks(windowHours),
    getUnhandledQueries(windowHours),
  ]);

  const toolGaps = detectToolCoverageGaps(toolFailures);
  const skillGaps = detectAgentSkillGaps(performanceData);
  const coverageGaps = detectDomainCoverageGaps(fallbacks);
  const unhandledGaps = detectUnhandledQueryGaps(unhandledQueries);

  const allGaps = [...toolGaps, ...skillGaps, ...coverageGaps, ...unhandledGaps];
  const crossDomainGaps = detectCrossDomainGaps(allGaps);

  const detectedGaps = [...allGaps, ...crossDomainGaps];

  const domainsAnalyzed = new Set<string>();
  for (const gap of detectedGaps) {
    for (const d of gap.affectedDomains) domainsAnalyzed.add(d);
  }

  try {
    await persistCapabilityGaps(detectedGaps);
  } catch (err) {
    logger.warn({ err }, "Failed to persist capability gaps");
  }

  logger.info({ gapsDetected: detectedGaps.length, durationMs: Date.now() - startTime }, "Capability gap detection complete");

  return {
    gapsDetected: detectedGaps.length,
    gaps: detectedGaps,
    analysisWindow: `${windowHours}h`,
    domainsAnalyzed: Array.from(domainsAnalyzed),
  };
}

export async function persistCapabilityGaps(gaps: CapabilityGap[]): Promise<void> {
  await ensureCapabilityGapsTable();

  for (const gap of gaps) {
    try {
      await pool.query(
        `INSERT INTO alloy_capability_gaps
         (gap_type, title, description, frequency, severity, affected_domains, suggested_remediation,
          evidence_samples, detected_at, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 'open', $9)
         ON CONFLICT DO NOTHING`,
        [
          gap.gapType,
          gap.title,
          gap.description,
          gap.frequency,
          gap.severity,
          JSON.stringify(gap.affectedDomains),
          gap.suggestedRemediation,
          JSON.stringify(gap.evidenceSamples),
          JSON.stringify(gap.metadata || {}),
        ]
      );
    } catch (err) {
      logger.warn({ err, gapTitle: gap.title }, "Failed to persist individual capability gap");
    }
  }
}

export async function getStoredCapabilityGaps(options: {
  status?: string;
  severity?: string;
  domain?: string;
  limit?: number;
} = {}): Promise<CapabilityGap[]> {
  await ensureCapabilityGapsTable();

  const conditions = ["1=1"];
  const params: unknown[] = [];
  let idx = 1;

  if (options.status) {
    conditions.push(`status = $${idx}`);
    params.push(options.status);
    idx++;
  }
  if (options.severity) {
    conditions.push(`severity = $${idx}`);
    params.push(options.severity);
    idx++;
  }
  if (options.domain) {
    conditions.push(`affected_domains @> $${idx}::jsonb`);
    params.push(JSON.stringify([options.domain]));
    idx++;
  }

  params.push(options.limit || 50);

  try {
    const result = await pool.query(
      `SELECT * FROM alloy_capability_gaps
       WHERE ${conditions.join(" AND ")}
       ORDER BY
         CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         frequency DESC
       LIMIT $${idx}`,
      params
    );
    return result.rows.map(r => ({
      id: r.id,
      gapType: r.gap_type,
      title: r.title,
      description: r.description,
      frequency: r.frequency,
      severity: r.severity,
      affectedDomains: r.affected_domains || [],
      suggestedRemediation: r.suggested_remediation,
      evidenceSamples: r.evidence_samples || [],
      detectedAt: r.detected_at,
      status: r.status,
      metadata: r.metadata,
    }));
  } catch {
    return [];
  }
}

export async function updateGapStatus(gapId: number, status: "open" | "acknowledged" | "resolved"): Promise<void> {
  await ensureCapabilityGapsTable();
  await pool.query(
    `UPDATE alloy_capability_gaps SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, gapId]
  );
}

export async function ensureCapabilityGapsTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alloy_capability_gaps (
        id SERIAL PRIMARY KEY,
        gap_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        frequency INTEGER DEFAULT 1,
        severity TEXT NOT NULL DEFAULT 'medium',
        affected_domains JSONB DEFAULT '[]',
        suggested_remediation TEXT,
        evidence_samples JSONB DEFAULT '[]',
        status TEXT DEFAULT 'open',
        metadata JSONB DEFAULT '{}',
        detected_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    logger.warn({ err }, "Failed to ensure capability gaps table");
  }
}
