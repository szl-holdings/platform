import { pool } from "@szl-holdings/db";
import { logger } from "./logger";
import { gatewayInfer } from "./ai-gateway";
import type { CapabilityGap } from "./capability-gap-detector";

export type ProposalType = "new_tool" | "new_agent_skill" | "mesh_connection" | "new_pipeline" | "app_feature" | "ecosystem_alert";
export type ImpactLevel = "transformative" | "high" | "medium" | "low";
export type ComplexityLevel = "simple" | "moderate" | "complex" | "extensive";
export type ProposalStatus = "pending" | "approved" | "dismissed" | "in_progress" | "completed";

export interface InnovationProposal {
  id?: number;
  title: string;
  proposalType: ProposalType;
  rationale: string;
  estimatedImpact: ImpactLevel;
  impactDescription: string;
  affectedVentures: string[];
  implementationComplexity: ComplexityLevel;
  implementationNotes: string;
  relatedGapIds?: number[];
  relatedEvidenceKeys: string[];
  confidenceScore: number;
  status: ProposalStatus;
  approvedBy?: number;
  approvedAt?: string;
  dismissedReason?: string;
  generatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface EcosystemAlert {
  id?: number;
  alertType: "performance_degradation" | "missed_synergy" | "coverage_gap" | "cross_domain_opportunity";
  title: string;
  message: string;
  severity: "critical" | "high" | "medium" | "info";
  affectedApps: string[];
  recommendation: string;
  generatedAt: string;
  isRead: boolean;
}

const VENTURE_DOMAINS: Record<string, string[]> = {
  vessels: ["maritime", "compliance", "fleet"],
  aegis: ["defense", "cyber", "intelligence"],
  terra: ["real_estate", "finance"],
  prism: ["legal", "compliance"],
  lyte: ["finance", "aiops", "infrastructure"],
  "carlota-jo": ["consulting", "advisory"],
  "szl-holdings": ["general", "cross_domain"],
};

function mapDomainsToVentures(domains: string[]): string[] {
  const ventures = new Set<string>();
  for (const [venture, vDomains] of Object.entries(VENTURE_DOMAINS)) {
    if (domains.some(d => vDomains.includes(d) || d === venture)) {
      ventures.add(venture);
    }
  }
  if (ventures.size === 0) ventures.add("szl-holdings");
  return Array.from(ventures);
}

function estimateImpact(gap: CapabilityGap): { impact: ImpactLevel; description: string } {
  const freq = gap.frequency;
  const isMultiDomain = gap.affectedDomains.length > 2;

  if (gap.severity === "critical" || (freq > 50 && isMultiDomain)) {
    return {
      impact: "transformative",
      description: `Resolving this gap affects ${gap.affectedDomains.length} domains and impacts ${freq}+ interactions. Fixing this would dramatically improve platform reliability.`,
    };
  }
  if (gap.severity === "high" || freq > 20) {
    return {
      impact: "high",
      description: `This gap affects ${gap.affectedDomains.join(", ")} with ${freq} detected occurrences. Remediation will notably improve agent performance and user satisfaction.`,
    };
  }
  if (freq > 5 || isMultiDomain) {
    return {
      impact: "medium",
      description: `Moderate-frequency gap across ${gap.affectedDomains.length} domain(s). Resolution will improve specific workflows without systemic impact.`,
    };
  }
  return {
    impact: "low",
    description: `Low-frequency gap detected. Remediation will provide incremental improvement for specialized use cases.`,
  };
}

function estimateComplexity(proposalType: ProposalType, gap: CapabilityGap): { complexity: ComplexityLevel; notes: string } {
  switch (proposalType) {
    case "new_tool":
      return {
        complexity: gap.affectedDomains.length > 2 ? "complex" : "moderate",
        notes: `New Mastra tool implementation with schema validation, handler logic, and rate limiting. Estimated: ${gap.affectedDomains.length > 2 ? "3-5 days" : "1-2 days"}.`,
      };
    case "new_agent_skill":
      return {
        complexity: "moderate",
        notes: "Agent prompt enhancement + RAG context enrichment + optional new tool registration. Estimated: 2-3 days.",
      };
    case "mesh_connection":
      return {
        complexity: "extensive",
        notes: "Full capability mesh integration requiring protocol definition, auth, and bilateral testing. Estimated: 5-10 days.",
      };
    case "new_pipeline":
      return {
        complexity: "complex",
        notes: "Multi-stage pipeline design with LLM stage configs, failure handling, and audit hooks. Estimated: 3-7 days.",
      };
    case "app_feature":
      return {
        complexity: "moderate",
        notes: "Frontend component + backend API route + data model. Estimated: 2-4 days.",
      };
    case "ecosystem_alert":
      return {
        complexity: "simple",
        notes: "Alert configuration only. No code change required. Estimated: < 1 day.",
      };
  }
}

function inferProposalType(gap: CapabilityGap): ProposalType {
  switch (gap.gapType) {
    case "tool_missing": return "new_tool";
    case "agent_skill": return "new_agent_skill";
    case "cross_domain": return "mesh_connection";
    case "pipeline_gap": return "new_pipeline";
    case "domain_coverage": return "new_agent_skill";
    default: return "app_feature";
  }
}

export function synthesizeProposalsFromGaps(gaps: CapabilityGap[]): InnovationProposal[] {
  const proposals: InnovationProposal[] = [];

  for (const gap of gaps) {
    if (gap.status === "resolved") continue;

    const proposalType = inferProposalType(gap);
    const { impact, description: impactDescription } = estimateImpact(gap);
    const { complexity, notes: implementationNotes } = estimateComplexity(proposalType, gap);
    const affectedVentures = mapDomainsToVentures(gap.affectedDomains);

    proposals.push({
      title: `[${proposalType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}] ${gap.title}`,
      proposalType,
      rationale: gap.description,
      estimatedImpact: impact,
      impactDescription,
      affectedVentures,
      implementationComplexity: complexity,
      implementationNotes: `${implementationNotes}\n\nSuggested approach: ${gap.suggestedRemediation}`,
      relatedGapIds: gap.id ? [gap.id] : [],
      relatedEvidenceKeys: gap.evidenceSamples,
      confidenceScore: gap.frequency > 20 ? 0.9 : gap.frequency > 10 ? 0.75 : 0.6,
      status: "pending",
      generatedAt: new Date().toISOString(),
      metadata: { sourceGap: gap },
    });
  }

  return proposals;
}

export async function generateAIProposals(
  gaps: CapabilityGap[],
  evolutionStats?: { generation: number; bestFitness: number; avgFitness: number }
): Promise<InnovationProposal[]> {
  if (gaps.length === 0) return [];

  const gapSummary = gaps.slice(0, 10).map((g, i) =>
    `${i + 1}. [${g.severity.toUpperCase()}] ${g.title} (domain: ${g.affectedDomains.join(", ")}, freq: ${g.frequency})`
  ).join("\n");

  const evolutionContext = evolutionStats
    ? `Current evolution state: generation ${evolutionStats.generation}, best fitness ${evolutionStats.bestFitness.toFixed(3)}, avg fitness ${evolutionStats.avgFitness.toFixed(3)}.`
    : "";

  try {
    const response = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are Alloy's Innovation Synthesis Engine — an autonomous meta-intelligence that analyzes capability gaps and evolution data to generate structured innovation proposals for a multi-venture AI platform (SZL Holdings).

The platform has these ventures: Vessels (maritime intelligence), Aegis (defense/cyber), Terra (real estate), PRISM (legal), Lyte (AIOps/finance), Carlota Jo (consulting).

Generate EXACTLY 3 high-impact innovation proposals in JSON array format. Each proposal must be actionable, specific, and address real gaps or opportunities. Format:
[
  {
    "title": "...",
    "proposalType": "new_tool|new_agent_skill|mesh_connection|new_pipeline|app_feature",
    "rationale": "...",
    "estimatedImpact": "transformative|high|medium|low",
    "impactDescription": "...",
    "affectedVentures": ["..."],
    "implementationComplexity": "simple|moderate|complex|extensive",
    "implementationNotes": "...",
    "confidenceScore": 0.0-1.0
  }
]`
        },
        {
          role: "user",
          content: `Capability gaps detected:\n${gapSummary}\n\n${evolutionContext}\n\nGenerate 3 innovation proposals that would most significantly improve platform performance and capability. Focus on cross-domain opportunities and highest-frequency gaps. Return ONLY valid JSON array.`
        }
      ],
      model: "gpt-4o-mini",
      maxTokens: 1500,
      strategy: "fastest",
      agentId: "alloy-innovation-engine",
      domain: "system",
    });

    const match = response.content.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]) as Array<Partial<InnovationProposal>>;
      return parsed.map(p => ({
        title: p.title || "AI-Generated Proposal",
        proposalType: (p.proposalType as ProposalType) || "app_feature",
        rationale: p.rationale || "",
        estimatedImpact: (p.estimatedImpact as ImpactLevel) || "medium",
        impactDescription: p.impactDescription || "",
        affectedVentures: p.affectedVentures || ["szl-holdings"],
        implementationComplexity: (p.implementationComplexity as ComplexityLevel) || "moderate",
        implementationNotes: p.implementationNotes || "",
        relatedEvidenceKeys: [],
        confidenceScore: p.confidenceScore || 0.7,
        status: "pending" as ProposalStatus,
        generatedAt: new Date().toISOString(),
        metadata: { source: "ai_synthesis" },
      }));
    }
  } catch (err) {
    logger.warn({ err }, "AI proposal generation failed, falling back to rule-based");
  }

  return [];
}

export function generateEcosystemAlerts(
  performanceData: Record<string, { successRate?: number; avgLatency?: number; domain: string }>
): EcosystemAlert[] {
  const alerts: EcosystemAlert[] = [];
  const now = new Date().toISOString();

  for (const [agentId, data] of Object.entries(performanceData)) {
    const successRate = data.successRate || 1;
    const avgLatency = data.avgLatency || 0;

    if (avgLatency > 5000) {
      const app = agentId.split("-")[0] || agentId;
      alerts.push({
        alertType: "performance_degradation",
        title: `${app.charAt(0).toUpperCase() + app.slice(1)} agents are ${Math.round(avgLatency / 1000)}s slower than baseline`,
        message: `Agents in the "${data.domain}" domain are averaging ${Math.round(avgLatency)}ms response time. Baseline expectation is < 2000ms. This may indicate missing dedicated tools or heavy RAG retrieval.`,
        severity: avgLatency > 10000 ? "high" : "medium",
        affectedApps: [app],
        recommendation: `Add a dedicated ${data.domain} MCP tool to handle high-frequency queries without full LLM roundtrip.`,
        generatedAt: now,
        isRead: false,
      });
    }

    if (successRate < 0.6) {
      alerts.push({
        alertType: "coverage_gap",
        title: `Low success rate in ${data.domain} — recommend capability audit`,
        message: `Agent "${agentId}" is succeeding only ${(successRate * 100).toFixed(0)}% of the time. Users are hitting unhandled query types that the agent cannot resolve.`,
        severity: successRate < 0.4 ? "critical" : "high",
        affectedApps: [agentId.split("-")[0] || agentId],
        recommendation: `Audit failed runs for "${agentId}". Add domain-specific tools or expand the agent's capability mesh connections.`,
        generatedAt: now,
        isRead: false,
      });
    }
  }

  return alerts;
}

export async function persistProposals(proposals: InnovationProposal[]): Promise<number[]> {
  await ensureProposalsTable();
  const ids: number[] = [];

  for (const proposal of proposals) {
    try {
      const result = await pool.query(
        `INSERT INTO alloy_innovation_proposals
         (title, proposal_type, rationale, estimated_impact, impact_description, affected_ventures,
          implementation_complexity, implementation_notes, related_gap_ids, related_evidence_keys,
          confidence_score, status, generated_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', NOW(), $12)
         RETURNING id`,
        [
          proposal.title,
          proposal.proposalType,
          proposal.rationale,
          proposal.estimatedImpact,
          proposal.impactDescription,
          JSON.stringify(proposal.affectedVentures),
          proposal.implementationComplexity,
          proposal.implementationNotes,
          JSON.stringify(proposal.relatedGapIds || []),
          JSON.stringify(proposal.relatedEvidenceKeys),
          proposal.confidenceScore,
          JSON.stringify(proposal.metadata || {}),
        ]
      );
      ids.push(result.rows[0].id);
    } catch (err) {
      logger.warn({ err, title: proposal.title }, "Failed to persist innovation proposal");
    }
  }

  return ids;
}

export async function getStoredProposals(options: {
  status?: string;
  proposalType?: string;
  venture?: string;
  limit?: number;
} = {}): Promise<InnovationProposal[]> {
  await ensureProposalsTable();

  const conditions = ["1=1"];
  const params: unknown[] = [];
  let idx = 1;

  if (options.status) {
    conditions.push(`status = $${idx}`);
    params.push(options.status);
    idx++;
  }
  if (options.proposalType) {
    conditions.push(`proposal_type = $${idx}`);
    params.push(options.proposalType);
    idx++;
  }
  if (options.venture) {
    conditions.push(`affected_ventures @> $${idx}::jsonb`);
    params.push(JSON.stringify([options.venture]));
    idx++;
  }

  params.push(options.limit || 30);

  try {
    const result = await pool.query(
      `SELECT * FROM alloy_innovation_proposals
       WHERE ${conditions.join(" AND ")}
       ORDER BY
         CASE estimated_impact WHEN 'transformative' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         confidence_score DESC,
         generated_at DESC
       LIMIT $${idx}`,
      params
    );
    return result.rows.map(r => ({
      id: r.id,
      title: r.title,
      proposalType: r.proposal_type,
      rationale: r.rationale,
      estimatedImpact: r.estimated_impact,
      impactDescription: r.impact_description,
      affectedVentures: r.affected_ventures || [],
      implementationComplexity: r.implementation_complexity,
      implementationNotes: r.implementation_notes,
      relatedGapIds: r.related_gap_ids || [],
      relatedEvidenceKeys: r.related_evidence_keys || [],
      confidenceScore: parseFloat(r.confidence_score) || 0,
      status: r.status,
      approvedBy: r.approved_by,
      approvedAt: r.approved_at,
      dismissedReason: r.dismissed_reason,
      generatedAt: r.generated_at,
      metadata: r.metadata,
    }));
  } catch {
    return [];
  }
}

export async function updateProposalStatus(
  proposalId: number,
  status: ProposalStatus,
  options: { userId?: number; dismissedReason?: string } = {}
): Promise<void> {
  await ensureProposalsTable();
  await pool.query(
    `UPDATE alloy_innovation_proposals
     SET status = $1,
         approved_by = $2,
         approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
         dismissed_reason = $3,
         updated_at = NOW()
     WHERE id = $4`,
    [status, options.userId || null, options.dismissedReason || null, proposalId]
  );
}

export async function ensureProposalsTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alloy_innovation_proposals (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        proposal_type TEXT NOT NULL,
        rationale TEXT,
        estimated_impact TEXT DEFAULT 'medium',
        impact_description TEXT,
        affected_ventures JSONB DEFAULT '[]',
        implementation_complexity TEXT DEFAULT 'moderate',
        implementation_notes TEXT,
        related_gap_ids JSONB DEFAULT '[]',
        related_evidence_keys JSONB DEFAULT '[]',
        confidence_score NUMERIC(4,3) DEFAULT 0.7,
        status TEXT DEFAULT 'pending',
        approved_by INTEGER,
        approved_at TIMESTAMPTZ,
        dismissed_reason TEXT,
        metadata JSONB DEFAULT '{}',
        generated_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    logger.warn({ err }, "Failed to ensure proposals table");
  }
}
