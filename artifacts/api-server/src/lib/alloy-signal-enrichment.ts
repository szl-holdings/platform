import { pool } from "@szl-holdings/db";
import { gatewayInfer } from "./ai-gateway";
import { logger } from "./logger";
import { extractEntitiesAndTriples } from "./alloy-knowledge-graph";

export interface EnrichmentSignal {
  signalId: string;
  domain: string;
  title: string;
  description: string;
  severity?: string;
  rawData?: Record<string, unknown>;
}

export interface EnrichmentStep {
  stepId: string;
  action: string;
  tool?: string;
  queryUsed: string;
  findings: string;
  confidence: number;
  timestamp: string;
  tokensUsed: number;
}

export interface EnrichmentReport {
  reportId: string;
  signalId: string;
  domain: string;
  title: string;
  executiveSummary: string;
  threatClassification?: string;
  taxonomyMapping: Record<string, string[]>;
  confidenceScore: number;
  entitiesExtracted: string[];
  crossDomainConnections: string[];
  enrichmentSteps: EnrichmentStep[];
  analystRecommendations: string[];
  iocIndicators?: string[];
  riskLevel: "critical" | "high" | "medium" | "low" | "informational";
  totalTokensUsed: number;
  totalLatencyMs: number;
  completedAt: string;
}

const DOMAIN_TAXONOMIES: Record<string, Record<string, string[]>> = {
  defense: {
    "MITRE ATT&CK": [
      "TA0001 - Initial Access", "TA0002 - Execution", "TA0003 - Persistence",
      "TA0005 - Defense Evasion", "TA0006 - Credential Access", "TA0010 - Exfiltration",
    ],
    "Kill Chain": ["Reconnaissance", "Weaponization", "Delivery", "Exploitation", "Installation", "C2", "Actions on Objectives"],
  },
  maritime: {
    "IMO Codes": ["SOLAS", "MARPOL", "ISM Code", "ISPS Code", "MLC 2006"],
    "Risk Categories": ["AIS Manipulation", "Sanctions Violation", "Dark Activity", "Port Security"],
    "OFAC Lists": ["SDN List", "Consolidated Sanctions", "CAATSA"],
  },
  legal: {
    "Matter Types": ["Litigation", "Regulatory", "Compliance", "Contract Dispute", "M&A"],
    "Jurisdiction": ["Federal", "State", "International", "Arbitration"],
    "Urgency": ["Imminent Deadline", "Filing Required", "Settlement Window"],
  },
  real_estate: {
    "Distress Signals": ["Pre-Foreclosure", "Tax Lien", "NOD Filed", "Vacancy"],
    "Transaction Types": ["Acquisition", "Disposition", "Refinance", "Development"],
    "Market Indicators": ["Cap Rate Compression", "Vacancy Rate", "Absorption Rate"],
  },
};

async function ensureEnrichmentTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS alloy_enrichment_reports (
      report_id TEXT PRIMARY KEY,
      signal_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      title TEXT NOT NULL,
      executive_summary TEXT NOT NULL,
      threat_classification TEXT,
      taxonomy_mapping JSONB NOT NULL DEFAULT '{}',
      confidence_score REAL NOT NULL DEFAULT 0.5,
      entities_extracted TEXT[] NOT NULL DEFAULT '{}',
      cross_domain_connections TEXT[] NOT NULL DEFAULT '{}',
      enrichment_steps JSONB NOT NULL DEFAULT '[]',
      analyst_recommendations TEXT[] NOT NULL DEFAULT '{}',
      ioc_indicators TEXT[],
      risk_level TEXT NOT NULL DEFAULT 'medium',
      total_tokens_used INT NOT NULL DEFAULT 0,
      total_latency_ms INT NOT NULL DEFAULT 0,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_enrichment_signal ON alloy_enrichment_reports(signal_id);
    CREATE INDEX IF NOT EXISTS idx_enrichment_domain ON alloy_enrichment_reports(domain);
    CREATE INDEX IF NOT EXISTS idx_enrichment_risk ON alloy_enrichment_reports(risk_level);
  `);
}

let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured) return;
  try { await ensureEnrichmentTables(); tablesEnsured = true; } catch {}
}

export async function runSignalEnrichment(params: {
  orgId: number;
  signal: EnrichmentSignal;
  maxSteps?: number;
}): Promise<EnrichmentReport> {
  await ensureTables();
  const startTime = Date.now();
  const reportId = `enrich_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const steps: EnrichmentStep[] = [];
  let totalTokens = 0;

  const domainTaxonomy = DOMAIN_TAXONOMIES[params.signal.domain] || {};

  const planStep: EnrichmentStep = {
    stepId: "step_plan",
    action: "Planning enrichment strategy",
    queryUsed: `Analyze signal: ${params.signal.title}`,
    findings: "",
    confidence: 0.9,
    timestamp: new Date().toISOString(),
    tokensUsed: 0,
  };

  let planResponse: any;
  try {
    planResponse = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are an autonomous intelligence enrichment agent. Given a signal, plan and execute an investigation to produce a structured analyst-ready report.

Domain: ${params.signal.domain}
Available taxonomies: ${Object.keys(domainTaxonomy).join(", ")}

Return a JSON investigation plan:
{
  "queries": ["query 1", "query 2", ...],
  "crossDomainSources": ["domain1", "domain2"],
  "taxonomiesToApply": ["taxonomy1"],
  "estimatedSteps": 3
}`,
        },
        {
          role: "user",
          content: `Signal: ${params.signal.title}\nDescription: ${params.signal.description}\nSeverity: ${params.signal.severity ?? "unknown"}`,
        },
      ],
      maxTokens: 600,
      strategy: "preferred",
    });
    totalTokens += planResponse?.usage?.totalTokens ?? 0;
    planStep.findings = planResponse.content;
    planStep.tokensUsed = planResponse?.usage?.totalTokens ?? 0;
  } catch (err: any) {
    planStep.findings = `Planning failed: ${err.message}`;
  }

  steps.push(planStep);

  const extractStep: EnrichmentStep = {
    stepId: "step_extract",
    action: "Extracting entities and knowledge graph nodes",
    queryUsed: `${params.signal.title} ${params.signal.description}`,
    findings: "",
    confidence: 0.85,
    timestamp: new Date().toISOString(),
    tokensUsed: 0,
  };

  const extractionContent = `${params.signal.title}\n${params.signal.description}\n${JSON.stringify(params.signal.rawData || {})}`;
  const extraction = await extractEntitiesAndTriples({
    orgId: params.orgId,
    content: extractionContent,
    domain: params.signal.domain,
    sourceSystem: "signal_enrichment",
  });

  extractStep.findings = `Extracted ${extraction.entities.length} entities and ${extraction.triples.length} relations`;
  extractStep.tokensUsed = extraction.tokensUsed;
  totalTokens += extraction.tokensUsed;
  steps.push(extractStep);

  const entityNames = extraction.entities.map(e => e.name);

  const crossDomainStep: EnrichmentStep = {
    stepId: "step_cross_domain",
    action: "Cross-domain intelligence correlation",
    queryUsed: `Cross-reference: ${params.signal.domain} signal with other domains`,
    findings: "",
    confidence: 0.75,
    timestamp: new Date().toISOString(),
    tokensUsed: 0,
  };

  let crossDomainConnections: string[] = [];
  try {
    const crossResponse = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a cross-domain intelligence analyst. Identify how this ${params.signal.domain} signal connects to other domains (maritime, legal, defense, real_estate, consulting).
Return JSON: {"connections": ["connection description 1", ...], "relatedDomains": ["domain1"]}`,
        },
        {
          role: "user",
          content: `Signal: ${params.signal.title}\nEntities: ${entityNames.slice(0, 10).join(", ")}`,
        },
      ],
      maxTokens: 400,
      strategy: "cheapest",
    });
    totalTokens += crossResponse?.usage?.totalTokens ?? 0;
    crossDomainStep.tokensUsed = crossResponse?.usage?.totalTokens ?? 0;

    try {
      const match = crossResponse.content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        crossDomainConnections = parsed.connections || [];
        crossDomainStep.findings = `Found ${crossDomainConnections.length} cross-domain connections`;
      }
    } catch {}
  } catch {}

  steps.push(crossDomainStep);

  const taxonomyMapping: Record<string, string[]> = {};
  const taxonomyStep: EnrichmentStep = {
    stepId: "step_taxonomy",
    action: "Mapping to domain taxonomies",
    queryUsed: `Map signal to ${Object.keys(domainTaxonomy).join(", ")} taxonomies`,
    findings: "",
    confidence: 0.8,
    timestamp: new Date().toISOString(),
    tokensUsed: 0,
  };

  if (Object.keys(domainTaxonomy).length > 0) {
    try {
      const taxResponse = await gatewayInfer({
        messages: [
          {
            role: "system",
            content: `Map this signal to the provided taxonomy categories. Return JSON only:
{"taxonomyMapping": {"TaxonomyName": ["Category1", "Category2"]}}`,
          },
          {
            role: "user",
            content: `Signal: ${params.signal.title}\n${params.signal.description}\n\nAvailable taxonomies:\n${JSON.stringify(domainTaxonomy, null, 2)}`,
          },
        ],
        maxTokens: 400,
        strategy: "cheapest",
      });
      totalTokens += taxResponse?.usage?.totalTokens ?? 0;
      taxonomyStep.tokensUsed = taxResponse?.usage?.totalTokens ?? 0;

      try {
        const match = taxResponse.content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          Object.assign(taxonomyMapping, parsed.taxonomyMapping || {});
          taxonomyStep.findings = `Mapped to ${Object.keys(taxonomyMapping).length} taxonomy frameworks`;
        }
      } catch {}
    } catch {}
  }
  steps.push(taxonomyStep);

  const reportStep: EnrichmentStep = {
    stepId: "step_report",
    action: "Generating structured analyst report",
    queryUsed: "Synthesize all findings into analyst-ready report",
    findings: "",
    confidence: 0.9,
    timestamp: new Date().toISOString(),
    tokensUsed: 0,
  };

  let report: {
    executiveSummary: string;
    threatClassification: string;
    riskLevel: string;
    analystRecommendations: string[];
    iocIndicators: string[];
    confidenceScore: number;
  } = {
    executiveSummary: `Signal "${params.signal.title}" enriched across ${params.signal.domain} domain.`,
    threatClassification: "Unclassified",
    riskLevel: params.signal.severity || "medium",
    analystRecommendations: ["Review signal details", "Cross-reference with historical patterns"],
    iocIndicators: [],
    confidenceScore: 0.7,
  };

  try {
    const finalResponse = await gatewayInfer({
      messages: [
        {
          role: "system",
          content: `You are a senior intelligence analyst. Based on the enrichment investigation, generate a structured analyst-ready report.
Return ONLY valid JSON:
{
  "executiveSummary": "2-3 sentence executive summary",
  "threatClassification": "classification string",
  "riskLevel": "critical|high|medium|low|informational",
  "analystRecommendations": ["action 1", "action 2"],
  "iocIndicators": ["IOC 1", "IOC 2"],
  "confidenceScore": 0.0-1.0
}`,
        },
        {
          role: "user",
          content: `Signal: ${params.signal.title} (${params.signal.domain})
Description: ${params.signal.description}
Entities found: ${entityNames.slice(0, 10).join(", ")}
Cross-domain connections: ${crossDomainConnections.slice(0, 5).join("; ")}
Taxonomy mappings: ${JSON.stringify(taxonomyMapping)}
Investigation steps: ${steps.length}`,
        },
      ],
      maxTokens: 800,
      strategy: "preferred",
    });
    totalTokens += finalResponse?.usage?.totalTokens ?? 0;
    reportStep.tokensUsed = finalResponse?.usage?.totalTokens ?? 0;

    try {
      const match = finalResponse.content.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        Object.assign(report, parsed);
        reportStep.findings = `Report generated with confidence ${parsed.confidenceScore?.toFixed(2) ?? "N/A"}`;
      }
    } catch {}
  } catch {}

  steps.push(reportStep);

  const totalLatencyMs = Date.now() - startTime;

  const enrichmentReport: EnrichmentReport = {
    reportId,
    signalId: params.signal.signalId,
    domain: params.signal.domain,
    title: params.signal.title,
    executiveSummary: report.executiveSummary,
    threatClassification: report.threatClassification,
    taxonomyMapping,
    confidenceScore: report.confidenceScore,
    entitiesExtracted: entityNames,
    crossDomainConnections,
    enrichmentSteps: steps,
    analystRecommendations: report.analystRecommendations,
    iocIndicators: report.iocIndicators,
    riskLevel: (report.riskLevel || "medium") as EnrichmentReport["riskLevel"],
    totalTokensUsed: totalTokens,
    totalLatencyMs,
    completedAt: new Date().toISOString(),
  };

  try {
    await pool.query(
      `INSERT INTO alloy_enrichment_reports
       (report_id, signal_id, domain, title, executive_summary, threat_classification, taxonomy_mapping,
        confidence_score, entities_extracted, cross_domain_connections, enrichment_steps,
        analyst_recommendations, ioc_indicators, risk_level, total_tokens_used, total_latency_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        reportId, params.signal.signalId, params.signal.domain, params.signal.title,
        enrichmentReport.executiveSummary, enrichmentReport.threatClassification ?? null,
        JSON.stringify(taxonomyMapping), enrichmentReport.confidenceScore,
        entityNames, crossDomainConnections, JSON.stringify(steps),
        enrichmentReport.analystRecommendations, enrichmentReport.iocIndicators ?? [],
        enrichmentReport.riskLevel, totalTokens, totalLatencyMs,
      ]
    );
  } catch (err) {
    logger.warn({ err }, "Failed to persist enrichment report");
  }

  logger.info({ reportId, domain: params.signal.domain, steps: steps.length, totalTokens }, "Signal enrichment complete");
  return enrichmentReport;
}

export async function listEnrichmentReports(params: {
  domain?: string;
  riskLevel?: string;
  limit?: number;
}): Promise<EnrichmentReport[]> {
  await ensureTables();
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.domain) { conditions.push(`domain = $${idx++}`); values.push(params.domain); }
  if (params.riskLevel) { conditions.push(`risk_level = $${idx++}`); values.push(params.riskLevel); }
  values.push(params.limit ?? 20);

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const { rows } = await pool.query(
      `SELECT * FROM alloy_enrichment_reports ${where} ORDER BY completed_at DESC LIMIT $${idx}`,
      values
    );
    return rows.map(r => ({
      reportId: r.report_id,
      signalId: r.signal_id,
      domain: r.domain,
      title: r.title,
      executiveSummary: r.executive_summary,
      threatClassification: r.threat_classification,
      taxonomyMapping: r.taxonomy_mapping || {},
      confidenceScore: r.confidence_score,
      entitiesExtracted: r.entities_extracted || [],
      crossDomainConnections: r.cross_domain_connections || [],
      enrichmentSteps: r.enrichment_steps || [],
      analystRecommendations: r.analyst_recommendations || [],
      iocIndicators: r.ioc_indicators,
      riskLevel: r.risk_level,
      totalTokensUsed: r.total_tokens_used,
      totalLatencyMs: r.total_latency_ms,
      completedAt: r.completed_at?.toISOString() ?? "",
    }));
  } catch {
    return [];
  }
}

export async function getEnrichmentStats(): Promise<{
  totalReports: number;
  reportsByDomain: Record<string, number>;
  reportsByRisk: Record<string, number>;
  avgConfidence: number;
  avgTokensPerReport: number;
}> {
  try {
    const { rows } = await pool.query(
      `SELECT domain, risk_level, COUNT(*) as cnt, AVG(confidence_score) as avg_conf, AVG(total_tokens_used) as avg_tokens
       FROM alloy_enrichment_reports GROUP BY domain, risk_level`
    );

    const reportsByDomain: Record<string, number> = {};
    const reportsByRisk: Record<string, number> = {};
    let total = 0;
    let totalConf = 0;
    let totalTokens = 0;

    for (const row of rows) {
      const cnt = parseInt(row.cnt);
      reportsByDomain[row.domain] = (reportsByDomain[row.domain] || 0) + cnt;
      reportsByRisk[row.risk_level] = (reportsByRisk[row.risk_level] || 0) + cnt;
      total += cnt;
      totalConf += parseFloat(row.avg_conf) * cnt;
      totalTokens += parseFloat(row.avg_tokens) * cnt;
    }

    return {
      totalReports: total,
      reportsByDomain,
      reportsByRisk,
      avgConfidence: total > 0 ? totalConf / total : 0,
      avgTokensPerReport: total > 0 ? Math.round(totalTokens / total) : 0,
    };
  } catch {
    return { totalReports: 0, reportsByDomain: {}, reportsByRisk: {}, avgConfidence: 0, avgTokensPerReport: 0 };
  }
}
