/**
 * Pulse — AI Executive Briefing Engine
 * API routes for briefing generation, library, confidence, custom briefs, dissent, settings, and PDF export.
 * All data persisted via Drizzle ORM to PostgreSQL.
 */
import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger";
import { AGENT_REGISTRY, callAgent, routeToAgents, getSharedContext } from "./nuro-mesh";
import { db } from "@szl-holdings/db";
import { pulseBriefs, pulseDissents, pulseCustomRequests, pulseSettings } from "@szl-holdings/db/schema";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { renderDocumentToPdfBuffer } from "../lib/pdf-renderer";
import type { BlockNode } from "../lib/pdf-renderer-types";

const CONFIDENCE_RUBRIC = {
  scoringDimensions: [
    { dimension: "Source Reliability", weight: 0.25, description: "Credibility and track record of intelligence sources" },
    { dimension: "Information Quality", weight: 0.25, description: "Completeness, timeliness, and accuracy of underlying data" },
    { dimension: "Analytic Rigor", weight: 0.20, description: "Strength of reasoning, consideration of alternatives" },
    { dimension: "Corroboration", weight: 0.20, description: "Degree to which independent sources confirm the assessment" },
    { dimension: "Transparency", weight: 0.10, description: "Clarity about gaps, assumptions, and limitations" },
  ],
  levels: [
    { label: "Very High", min: 85, max: 100, description: "Assessment based on high-quality information with strong corroboration" },
    { label: "High", min: 70, max: 84, description: "Assessment based on credible information from multiple sources" },
    { label: "Moderate", min: 50, max: 69, description: "Plausible assessment but limited by information gaps or single-source reliance" },
    { label: "Low", min: 25, max: 49, description: "Assessment with significant uncertainty; competing hypotheses exist" },
    { label: "Very Low", min: 0, max: 24, description: "Speculative assessment based on fragmentary or unverified information" },
  ],
};

const router = Router();

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface BriefSection {
  sectionId: string;
  title: string;
  agentId: string;
  agentName: string;
  domain: string;
  content: string;
  confidenceScore: number;
  keyFindings: string[];
  riskLevel: "critical" | "high" | "medium" | "low" | "info";
  actionItems: string[];
}

interface RecommendedAction {
  priority: "P0" | "P1" | "P2" | "P3";
  action: string;
  owner: string;
  domain: string;
  rationale: string;
}

interface ExecutiveBrief {
  id: string;
  date: string;
  classification: string;
  headline: string;
  executiveSummary: string;
  riskLevel: "critical" | "high" | "medium" | "low";
  overallConfidence: number;
  sections: BriefSection[];
  recommendedActions: RecommendedAction[];
  tags: string[];
  generatedAt: string;
  generationDurationMs: number;
  agentsContributed: string[];
  status: "generating" | "complete" | "archived";
  dissents: DissentView[];
}

interface DissentView {
  id: string;
  briefId: string;
  sectionId: string | null;
  claim: string;
  dissentingView: string;
  basis: string;
  submittedBy: string;
  submittedAt: string;
  status: "open" | "under_review" | "resolved" | "withdrawn";
  resolution: string | null;
  resolvedAt: string | null;
  impactOnConfidence: number;
  briefHeadline?: string;
  briefDate?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pulse_briefs (
        id SERIAL PRIMARY KEY,
        brief_id TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        classification TEXT NOT NULL DEFAULT 'OPERATOR SENSITIVE // NURO MESH',
        headline TEXT NOT NULL,
        executive_summary TEXT NOT NULL,
        risk_level TEXT NOT NULL DEFAULT 'medium',
        overall_confidence INTEGER NOT NULL DEFAULT 0,
        sections JSONB NOT NULL DEFAULT '[]'::jsonb,
        recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        generation_duration_ms INTEGER NOT NULL DEFAULT 0,
        agents_contributed JSONB NOT NULL DEFAULT '[]'::jsonb,
        status TEXT NOT NULL DEFAULT 'complete',
        brief_type TEXT NOT NULL DEFAULT 'daily',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS pulse_briefs_date_idx ON pulse_briefs(date);
      CREATE INDEX IF NOT EXISTS pulse_briefs_risk_level_idx ON pulse_briefs(risk_level);

      CREATE TABLE IF NOT EXISTS pulse_dissents (
        id SERIAL PRIMARY KEY,
        dissent_id TEXT NOT NULL UNIQUE,
        brief_id TEXT NOT NULL,
        section_id TEXT,
        claim TEXT NOT NULL,
        dissenting_view TEXT NOT NULL,
        basis TEXT NOT NULL,
        submitted_by TEXT NOT NULL DEFAULT 'Analyst',
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'open',
        resolution TEXT,
        resolved_at TIMESTAMP,
        impact_on_confidence INTEGER NOT NULL DEFAULT -10,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS pulse_dissents_brief_id_idx ON pulse_dissents(brief_id);
      CREATE INDEX IF NOT EXISTS pulse_dissents_status_idx ON pulse_dissents(status);

      CREATE TABLE IF NOT EXISTS pulse_custom_requests (
        id SERIAL PRIMARY KEY,
        request_id TEXT NOT NULL UNIQUE,
        topic TEXT NOT NULL,
        entities JSONB NOT NULL DEFAULT '[]'::jsonb,
        domains JSONB NOT NULL DEFAULT '[]'::jsonb,
        agents JSONB NOT NULL DEFAULT '[]'::jsonb,
        requested_by TEXT NOT NULL DEFAULT 'Operator',
        requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'queued',
        brief_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS pulse_custom_requests_status_idx ON pulse_custom_requests(status);

      CREATE TABLE IF NOT EXISTS pulse_settings (
        id SERIAL PRIMARY KEY,
        setting_key TEXT NOT NULL UNIQUE,
        setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    logger.info("[pulse] Tables ensured");
  } catch (err) {
    logger.error({ err }, "[pulse] Table creation error");
  }
}

let tablesEnsured = false;
async function ensureInit(): Promise<void> {
  if (!tablesEnsured) {
    await ensureTables();
    tablesEnsured = true;
    await seedDemoData();
  }
}

async function getBriefWithDissents(briefId: string): Promise<ExecutiveBrief | null> {
  const [row] = await db.select().from(pulseBriefs).where(eq(pulseBriefs.briefId, briefId)).limit(1);
  if (!row) return null;
  const dissents = await db.select().from(pulseDissents).where(eq(pulseDissents.briefId, briefId)).orderBy(desc(pulseDissents.submittedAt));
  return {
    id: row.briefId,
    date: row.date,
    classification: row.classification,
    headline: row.headline,
    executiveSummary: row.executiveSummary,
    riskLevel: row.riskLevel as ExecutiveBrief["riskLevel"],
    overallConfidence: row.overallConfidence,
    sections: row.sections as BriefSection[],
    recommendedActions: row.recommendedActions as RecommendedAction[],
    tags: row.tags as string[],
    generatedAt: row.generatedAt.toISOString(),
    generationDurationMs: row.generationDurationMs,
    agentsContributed: row.agentsContributed as string[],
    status: row.status as ExecutiveBrief["status"],
    dissents: dissents.map(d => ({
      id: d.dissentId,
      briefId: d.briefId,
      sectionId: d.sectionId,
      claim: d.claim,
      dissentingView: d.dissentingView,
      basis: d.basis,
      submittedBy: d.submittedBy,
      submittedAt: d.submittedAt.toISOString(),
      status: d.status as DissentView["status"],
      resolution: d.resolution,
      resolvedAt: d.resolvedAt?.toISOString() ?? null,
      impactOnConfidence: d.impactOnConfidence,
    })),
  };
}

// ─── Seed demo data ───────────────────────────────────────────────────────────

async function seedDemoData(): Promise<void> {
  const existing = await db.select({ count: sql<number>`count(*)` }).from(pulseBriefs);
  if ((existing[0]?.count ?? 0) > 0) return;

  logger.info("[pulse] Seeding demo briefings...");
  const dates = [0, 1, 2, 3, 4, 5, 6].map(d => {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    return dt.toISOString().split("T")[0]!;
  });

  const headlines = [
    "Elevated maritime risk in Strait of Malacca corridor; sanctions entity detected in vessel chain",
    "Platform health nominal — Lyte workflow optimization opportunity identified across 3 business units",
    "High-confidence threat pattern in PRISM regulatory pipeline; 2 matters require immediate escalation",
    "Critical: Compound intelligence event — OFAC-listed entity appears in vessel, terra, and legal filings simultaneously",
    "Terra portfolio distress signal declining — favorable macro shift detected by Beacon",
    "Low-risk operating environment — no active threat escalations, confidence trending upward",
    "Aegis threat surface update — 3 new CVEs affecting platform infrastructure components",
  ];

  const summaries = [
    "Helmsman has identified a sanctioned entity traversing the Strait of Malacca corridor with 87% confidence. Cross-venture routing has elevated this to PRISM for sanctions exposure review and Terra for beneficial ownership analysis. Sentinel has validated the finding. Immediate action required on vessel IMO-9847231.",
    "Platform is operating at nominal capacity. Beacon analytics surfaced a workflow optimization opportunity in Lyte — three business units show 40% above-baseline approval latency. INCA research integration performing as expected. No active threat escalations.",
    "PRISM legal pipeline shows two high-priority matters at deadline risk. Sentinel threat assessment: medium confidence on regulatory enforcement uptick in maritime sector. Helmsman and PRISM data corroborated — legal exposure requires escalation within 24 hours.",
    "Compound intelligence event of critical severity. An OFAC-sanctioned entity appears simultaneously in: vessel AIS transponder data (Helmsman), beneficial ownership records for two Terra-monitored properties (Beacon), and pending legal filings in PRISM matter queue. This cross-domain correlation was unavailable in siloed analysis. Immediate executive action required.",
    "Terra portfolio distress signals show 18% decline from previous week. Macro indicators analyzed by Beacon suggest improving credit conditions. Carlota Jo advisory clients with real estate exposure showing reduced risk scores. No active threat escalations.",
    "Clean operating picture across all domains. No active threats, no escalations, no deadline risks. Platform confidence scores at 90-day high. INCA research surfaced 2 new AI model capabilities for platform integration consideration.",
    "INCA and Sentinel jointly identified three CVEs in infrastructure components used by Zeus-monitored Azure resources. Severity: medium-high. Remediation timeline: 7 days. Lyte workflow for patch approvals has been pre-configured.",
  ];

  const riskLevels = ["high", "medium", "high", "critical", "medium", "low", "medium"] as const;
  const confidences = [78, 85, 72, 61, 88, 91, 76];
  const tagSets = [["maritime", "sanctions", "legal"], ["platform", "workflow", "optimization"], ["legal", "compliance", "deadline"], ["sanctions", "cross-domain", "critical"], ["real-estate", "macro", "portfolio"], ["platform", "health", "green"], ["security", "cve", "infrastructure"]];
  const agentSets = [["helmsman", "sentinel", "beacon"], ["beacon", "inca", "alloy"], ["sentinel", "helmsman", "inca"], ["helmsman", "beacon", "sentinel", "inca"], ["beacon", "alloy", "inca"], ["beacon", "sentinel", "alloy"], ["sentinel", "zeus", "inca"]];
  const durationMs = [12400, 9800, 11200, 15600, 8900, 7400, 10300];

  const sectionSets: BriefSection[][] = [
    [
      { sectionId: "maritime", title: "Maritime Outlook", agentId: "helmsman", agentName: "Helmsman", domain: "maritime", content: "Helmsman has flagged IMO-9847231 (MV GOLDEN STAR) traversing the Strait of Malacca. AIS transponder shows 12 port calls to high-risk jurisdictions in the past 90 days. Beneficial owner cross-referenced against OFAC SDN list — confirmed match with 87% confidence.", confidenceScore: 87, keyFindings: ["Sanctioned entity in vessel chain — IMO-9847231", "12 high-risk port calls in 90 days", "Charter party linked to monitored corporate network"], riskLevel: "critical", actionItems: ["Initiate immediate entity screening", "Alert PRISM for sanctions compliance exposure"] },
      { sectionId: "threat", title: "Threat Landscape", agentId: "sentinel", agentName: "Sentinel", domain: "security", content: "Sentinel has validated Helmsman's finding with independent OSINT corroboration. No active cyber threats on platform infrastructure. Sanctions entity shows behavioral patterns consistent with flag-of-convenience operations.", confidenceScore: 82, keyFindings: ["Helmsman finding validated", "No active platform cyber threats", "Financial crime pattern identified"], riskLevel: "high", actionItems: ["Finalize OFAC SDN match report", "Initiate cross-domain routing to Terra and PRISM"] },
    ],
    [
      { sectionId: "platform", title: "Platform Health", agentId: "beacon", agentName: "Terra Analytics", domain: "analytics", content: "Platform operating at 99.7% availability. Lyte workflow latency elevated in three business units: Finance (4.7× baseline), Legal Ops (3.2× baseline), Procurement (2.1× baseline). Root cause: approval chain ownership gaps.", confidenceScore: 91, keyFindings: ["99.7% platform availability", "Workflow latency spikes in 3 business units"], riskLevel: "medium", actionItems: ["Assign owners to unowned critical approval queues"] },
    ],
    [
      { sectionId: "legal", title: "Legal Pipeline", agentId: "sentinel", agentName: "Sentinel", domain: "security", content: "PRISM matter pipeline shows two high-priority items at statutory deadline risk. Both require senior attorney assignment within 4 hours to meet SLA.", confidenceScore: 94, keyFindings: ["2 matters at statutory deadline risk", "48-hour window on sanctions filing"], riskLevel: "high", actionItems: ["Assign senior attorney to matter #PR-2024-1847"] },
    ],
  ];

  const actionSets: RecommendedAction[][] = [
    [
      { priority: "P0", action: "Initiate OFAC-SDN entity screening on IMO-9847231 — suspend all pending approvals", owner: "Compliance Officer", domain: "maritime", rationale: "Sanctioned entity confirmed in vessel chain with 87% confidence" },
      { priority: "P1", action: "Open PRISM pre-matter for sanctions exposure review", owner: "General Counsel", domain: "legal", rationale: "Legal exposure created by sanctioned counterparty" },
    ],
    [
      { priority: "P1", action: "Rebalance Lyte approval ownership — 23% of critical queues unassigned", owner: "Operations Lead", domain: "platform", rationale: "Sustained latency spike creates regulatory deadline risk" },
    ],
    [
      { priority: "P0", action: "Assign senior attorney to PRISM matter #PR-2024-1847 — 48h deadline", owner: "General Counsel", domain: "legal", rationale: "Statutory filing deadline cannot be extended" },
    ],
  ];

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i]!;
    const briefId = `brief_${date}_daily`;
    await db.insert(pulseBriefs).values({
      briefId,
      date,
      headline: headlines[i] ?? "Daily Executive Briefing",
      executiveSummary: summaries[i] ?? "No summary available.",
      riskLevel: riskLevels[i] ?? "medium",
      overallConfidence: confidences[i] ?? 75,
      sections: sectionSets[Math.min(i, sectionSets.length - 1)] ?? sectionSets[0]!,
      recommendedActions: actionSets[Math.min(i, actionSets.length - 1)] ?? actionSets[0]!,
      tags: tagSets[i] ?? [],
      generatedAt: new Date(`${date}T07:00:00Z`),
      generationDurationMs: durationMs[i] ?? 10000,
      agentsContributed: agentSets[i] ?? ["alloy"],
      status: "complete",
      briefType: "daily",
    }).onConflictDoNothing();
  }

  const criticalBriefId = `brief_${dates[3]}_daily`;
  await db.insert(pulseDissents).values({
    dissentId: `dissent_${criticalBriefId}_001`,
    briefId: criticalBriefId,
    sectionId: "maritime",
    claim: "Sanctioned entity confirmed in vessel chain with 87% confidence",
    dissentingView: "The 87% confidence assessment overstates certainty. The OFAC SDN match was based on name similarity — not document verification. The beneficial owner name (Li Wei) is among the 50 most common Chinese names. Independent verification required before regulatory action.",
    basis: "AML tradecraft standard: name-only matches on common names must be corroborated with at minimum one documentary proof (passport, registry filing, or verified corporate document) before SDN match is recorded.",
    submittedBy: "Analyst T. Morrison",
    submittedAt: new Date(Date.now() - 3 * 3600000),
    status: "under_review",
    impactOnConfidence: -15,
  }).onConflictDoNothing();

  await db.insert(pulseCustomRequests).values({
    requestId: "req_001",
    topic: "Vessel IMO-9847231 and owner portfolio cross-analysis",
    entities: ["IMO-9847231", "Golden Star Shipping Ltd"],
    domains: ["maritime", "real-estate", "legal"],
    agents: ["helmsman", "beacon", "sentinel"],
    requestedBy: "Portfolio Manager",
    requestedAt: new Date(Date.now() - 2 * 3600000),
    status: "complete",
    briefId: dates[0] ? `brief_${dates[0]}_daily` : null,
  }).onConflictDoNothing();

  logger.info("[pulse] Demo data seeded");
}

// ─── Routes ────────────────────────────────────────────────────────────────────

router.get("/pulse/briefs", readLimiter, async (req: Request, res: Response) => {
  await ensureInit();
  const { domain, riskLevel, q, limit = "20", offset = "0" } = req.query as Record<string, string>;

  const conditions: ReturnType<typeof eq>[] = [];
  if (riskLevel) conditions.push(eq(pulseBriefs.riskLevel, riskLevel));

  let rows = await db.select().from(pulseBriefs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(pulseBriefs.date))
    .limit(100);

  if (domain) {
    rows = rows.filter(r =>
      (r.sections as BriefSection[]).some(s => s.domain === domain) ||
      (r.tags as string[]).includes(domain)
    );
  }

  if (q) {
    const lower = q.toLowerCase();
    rows = rows.filter(r =>
      r.headline.toLowerCase().includes(lower) ||
      r.executiveSummary.toLowerCase().includes(lower) ||
      (r.tags as string[]).some(t => t.includes(lower))
    );
  }

  const total = rows.length;
  const off = parseInt(offset, 10);
  const lim = parseInt(limit, 10);
  const paged = rows.slice(off, off + lim);

  const briefs = await Promise.all(paged.map(r => getBriefWithDissents(r.briefId)));
  res.json({ briefs: briefs.filter(Boolean), total, offset: off, limit: lim });
});

router.get("/pulse/briefs/today", readLimiter, async (_req: Request, res: Response) => {
  await ensureInit();
  const today = new Date().toISOString().split("T")[0]!;
  const brief = await getBriefWithDissents(`brief_${today}_daily`);
  res.json({ brief: brief ?? null, date: today, status: brief ? "complete" : "not_generated" });
});

router.get("/pulse/briefs/:id", readLimiter, async (req: Request, res: Response) => {
  await ensureInit();
  const brief = await getBriefWithDissents(req.params.id);
  if (!brief) { res.status(404).json({ error: "Brief not found" }); return; }
  res.json({ brief });
});

router.post("/pulse/briefs/generate", writeLimiter, async (_req: Request, res: Response) => {
  await ensureInit();
  const today = new Date().toISOString().split("T")[0]!;
  const briefId = `brief_${today}_daily`;

  const existing = await getBriefWithDissents(briefId);
  if (existing) { res.json({ brief: existing, alreadyGenerated: true }); return; }

  const startTime = Date.now();

  try {
    const domainQueries = [
      { query: "What are the current maritime risks, vessel threats, and fleet anomalies?", agents: ["helmsman", "sentinel"], title: "Maritime Outlook", domain: "maritime", sectionId: "maritime" },
      { query: "What are the current cybersecurity threats, CVEs, and incident alerts?", agents: ["sentinel", "zeus"], title: "Threat Landscape", domain: "security", sectionId: "threat" },
      { query: "What real estate market signals and portfolio distress indicators are active?", agents: ["beacon"], title: "Real Estate Pulse", domain: "analytics", sectionId: "realestate" },
      { query: "What are the critical legal deadlines and regulatory risks?", agents: ["sentinel", "inca"], title: "Legal Pipeline", domain: "security", sectionId: "legal" },
      { query: "What is the current platform health and workflow anomalies?", agents: ["beacon", "zeus"], title: "Platform Health", domain: "analytics", sectionId: "platform" },
    ];

    const context = await getSharedContext();

    const sectionResults = await Promise.all(
      domainQueries.map(async (dq) => {
        try {
          const targetAgents = AGENT_REGISTRY.filter(a => dq.agents.includes(a.id));
          const agentResponses = await Promise.all(
            targetAgents.map(agent => callAgent(agent, dq.query, context))
          );
          return { ...dq, agentResponses, error: null };
        } catch (err) {
          return { ...dq, agentResponses: [] as { agentId: string; agentName: string; response: string; confidence: number; domain: string }[], error: err };
        }
      })
    );

    const sections: BriefSection[] = sectionResults.map(sr => {
      const primaryAgent = sr.agentResponses[0];
      const agent = AGENT_REGISTRY.find(a => a.id === (primaryAgent?.agentId ?? sr.agents[0]));
      return {
        sectionId: sr.sectionId,
        title: sr.title,
        agentId: agent?.id ?? sr.agents[0] ?? "alloy",
        agentName: agent?.name ?? sr.agents[0] ?? "Alloy",
        domain: sr.domain,
        content: primaryAgent?.response ?? "[Section generation unavailable — agent offline]",
        confidenceScore: primaryAgent?.confidence ?? 70,
        keyFindings: [],
        riskLevel: "medium" as const,
        actionItems: [],
      };
    });

    const avgConf = Math.round(sections.reduce((s, sec) => s + sec.confidenceScore, 0) / sections.length);
    const riskLevel: ExecutiveBrief["riskLevel"] = avgConf < 50 ? "critical" : avgConf < 65 ? "high" : avgConf < 80 ? "medium" : "low";

    await db.insert(pulseBriefs).values({
      briefId,
      date: today,
      headline: `Daily Intelligence Briefing — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`,
      executiveSummary: sections.map(s => `${s.title}: ${s.content.slice(0, 150)}...`).join("\n\n"),
      riskLevel,
      overallConfidence: avgConf,
      sections,
      recommendedActions: [],
      tags: [...new Set(sections.map(s => s.domain))],
      generatedAt: new Date(),
      generationDurationMs: Date.now() - startTime,
      agentsContributed: [...new Set(sections.map(s => s.agentId))],
      status: "complete",
      briefType: "daily",
    });

    const brief = await getBriefWithDissents(briefId);
    res.json({ brief, alreadyGenerated: false });
  } catch (err) {
    logger.error({ err }, "[pulse] Daily brief generation failed");
    res.status(500).json({ error: "Brief generation failed", detail: String(err) });
  }
});

router.post("/pulse/briefs/custom", writeLimiter, async (req: Request, res: Response) => {
  await ensureInit();
  const body = req.body as { topic: string; entities?: string[]; domains?: string[]; agents?: string[]; requestedBy?: string };
  const { topic, entities = [], domains = [], agents = [], requestedBy = "Operator" } = body;

  if (!topic) { res.status(400).json({ error: "topic is required" }); return; }

  const reqId = `req_${Date.now()}`;
  await db.insert(pulseCustomRequests).values({
    requestId: reqId, topic, entities, domains, agents, requestedBy,
    requestedAt: new Date(), status: "generating",
  });

  const query = `Custom intelligence brief on: "${topic}". Focus on: ${entities.join(", ") || "all entities"}. Domains: ${domains.join(", ") || "all"}.`;

  try {
    const context = await getSharedContext();
    const targetAgents = agents.length > 0
      ? AGENT_REGISTRY.filter(a => agents.includes(a.id))
      : routeToAgents(query);
    const agentResponses = await Promise.all(
      targetAgents.map(agent => callAgent(agent, query, context))
    );

    const briefDate = new Date().toISOString().split("T")[0]!;
    const avgConf = agentResponses.length > 0
      ? Math.round(agentResponses.reduce((s, r) => s + r.confidence, 0) / agentResponses.length)
      : 70;
    const riskLevel: ExecutiveBrief["riskLevel"] = avgConf < 50 ? "critical" : avgConf < 65 ? "high" : avgConf < 80 ? "medium" : "low";
    const briefId = `brief_custom_${reqId}`;

    const synthesis = agentResponses.map(r => `**${r.agentName}**: ${r.response.slice(0, 200)}`).join("\n\n");

    await db.insert(pulseBriefs).values({
      briefId,
      date: briefDate,
      classification: "OPERATOR SENSITIVE // CUSTOM PRODUCT",
      headline: `Custom Brief: ${topic}`,
      executiveSummary: synthesis,
      riskLevel,
      overallConfidence: avgConf,
      sections: agentResponses.map(ar => ({
        sectionId: ar.agentId,
        title: `${ar.agentName} Assessment`,
        agentId: ar.agentId,
        agentName: ar.agentName,
        domain: ar.domain,
        content: ar.response,
        confidenceScore: ar.confidence,
        keyFindings: [] as string[],
        riskLevel: "medium" as const,
        actionItems: [] as string[],
      })),
      recommendedActions: [],
      tags: entities.length > 0 ? entities.slice(0, 5) : [...domains],
      generatedAt: new Date(),
      generationDurationMs: 0,
      agentsContributed: agentResponses.map(r => r.agentId),
      status: "complete",
      briefType: "custom",
    });

    await db.update(pulseCustomRequests).set({ status: "complete", briefId, updatedAt: new Date() }).where(eq(pulseCustomRequests.requestId, reqId));

    const brief = await getBriefWithDissents(briefId);
    res.json({ brief, requestId: reqId });
  } catch (err) {
    await db.update(pulseCustomRequests).set({ status: "failed", updatedAt: new Date() }).where(eq(pulseCustomRequests.requestId, reqId));
    logger.error({ err }, "[pulse] Custom brief generation failed");
    res.status(500).json({ error: "Custom brief generation failed", detail: String(err) });
  }
});

router.get("/pulse/custom/requests", readLimiter, async (_req: Request, res: Response) => {
  await ensureInit();
  const rows = await db.select().from(pulseCustomRequests).orderBy(desc(pulseCustomRequests.requestedAt)).limit(50);
  res.json({
    requests: rows.map(r => ({
      id: r.requestId, topic: r.topic, entities: r.entities, domains: r.domains, agents: r.agents,
      requestedBy: r.requestedBy, requestedAt: r.requestedAt.toISOString(), status: r.status, briefId: r.briefId,
    })),
  });
});

router.get("/pulse/confidence", readLimiter, async (_req: Request, res: Response) => {
  await ensureInit();
  const rows = await db.select().from(pulseBriefs).where(eq(pulseBriefs.status, "complete")).orderBy(desc(pulseBriefs.date)).limit(30);

  const domainTrend: Record<string, { dates: string[]; scores: number[] }> = {};
  for (const row of rows) {
    for (const section of row.sections as BriefSection[]) {
      if (!domainTrend[section.domain]) domainTrend[section.domain] = { dates: [], scores: [] };
      domainTrend[section.domain]!.dates.push(row.date);
      domainTrend[section.domain]!.scores.push(section.confidenceScore);
    }
  }

  const domainBreakdown = Object.entries(domainTrend).map(([domain, data]) => {
    const avgScore = Math.round(data.scores.reduce((s, n) => s + n, 0) / data.scores.length);
    const trend = data.scores.length > 1 ? (data.scores[data.scores.length - 1]! > data.scores[0]! ? "increasing" : "decreasing") : "stable";
    return { domain, avgScore, trend, dataPoints: data.scores.length, latestScore: data.scores[0] ?? 0 };
  });

  const overallScores = rows.map(r => r.overallConfidence);
  const overallAvg = overallScores.length > 0 ? Math.round(overallScores.reduce((s, n) => s + n, 0) / overallScores.length) : 0;
  const trendSeries = rows.slice(0, 14).reverse().map(r => ({ date: r.date, score: r.overallConfidence, riskLevel: r.riskLevel }));

  const agentStats: Record<string, { scores: number[]; briefCount: number }> = {};
  for (const row of rows) {
    for (const section of row.sections as BriefSection[]) {
      if (!agentStats[section.agentId]) agentStats[section.agentId] = { scores: [], briefCount: 0 };
      agentStats[section.agentId]!.scores.push(section.confidenceScore);
      agentStats[section.agentId]!.briefCount++;
    }
  }

  const agentBreakdown = Object.entries(agentStats).map(([agentId, data]) => {
    const agent = AGENT_REGISTRY.find((a: { id: string; name: string; domain: string }) => a.id === agentId);
    return { agentId, agentName: agent?.name ?? agentId, domain: agent?.domain ?? "unknown", avgConfidence: Math.round(data.scores.reduce((s, n) => s + n, 0) / data.scores.length), briefCount: data.briefCount };
  }).sort((a, b) => b.avgConfidence - a.avgConfidence);

  const rubric = CONFIDENCE_RUBRIC.scoringDimensions.map((d: { dimension: string; weight: number; description: string }) => ({ dimension: d.dimension, weight: d.weight, description: d.description }));
  const dissentCount = await db.select({ count: sql<number>`count(*)` }).from(pulseDissents);

  res.json({ overallAvg, trendSeries, domainBreakdown, agentBreakdown, rubric, confidenceLevels: CONFIDENCE_RUBRIC.levels, totalBriefs: rows.length, totalDissents: Number(dissentCount[0]?.count ?? 0) });
});

router.post("/pulse/dissent", writeLimiter, async (req: Request, res: Response) => {
  await ensureInit();
  const body = req.body as { briefId: string; sectionId?: string; claim: string; dissentingView: string; basis: string; submittedBy?: string };
  const { briefId, sectionId, claim, dissentingView, basis, submittedBy = "Analyst" } = body;

  if (!briefId || !claim || !dissentingView || !basis) {
    res.status(400).json({ error: "briefId, claim, dissentingView, and basis are required" });
    return;
  }

  const [brief] = await db.select().from(pulseBriefs).where(eq(pulseBriefs.briefId, briefId)).limit(1);
  if (!brief) { res.status(404).json({ error: "Brief not found" }); return; }

  const dissentId = `dissent_${briefId}_${Date.now()}`;
  const [dissent] = await db.insert(pulseDissents).values({
    dissentId, briefId, sectionId: sectionId ?? null, claim, dissentingView, basis, submittedBy,
    submittedAt: new Date(), status: "open", impactOnConfidence: -10,
  }).returning();

  res.json({ dissent: { ...dissent, id: dissentId, submittedAt: dissent?.submittedAt.toISOString() } });
});

router.get("/pulse/dissents", readLimiter, async (_req: Request, res: Response) => {
  await ensureInit();
  const rows = await db.select().from(pulseDissents).orderBy(desc(pulseDissents.submittedAt)).limit(100);

  const briefIds = [...new Set(rows.map(r => r.briefId))];
  const briefRows = briefIds.length > 0
    ? await db.select({ briefId: pulseBriefs.briefId, headline: pulseBriefs.headline, date: pulseBriefs.date }).from(pulseBriefs).where(inArray(pulseBriefs.briefId, briefIds))
    : [];
  const briefMap = new Map(briefRows.map(b => [b.briefId, b]));

  res.json({
    dissents: rows.map(d => {
      const brief = briefMap.get(d.briefId);
      return {
        id: d.dissentId, briefId: d.briefId, sectionId: d.sectionId, claim: d.claim, dissentingView: d.dissentingView,
        basis: d.basis, submittedBy: d.submittedBy, submittedAt: d.submittedAt.toISOString(), status: d.status,
        resolution: d.resolution, resolvedAt: d.resolvedAt?.toISOString() ?? null, impactOnConfidence: d.impactOnConfidence,
        briefHeadline: brief?.headline, briefDate: brief?.date,
      };
    }),
  });
});

router.patch("/pulse/dissent/:id", writeLimiter, async (req: Request, res: Response) => {
  await ensureInit();
  const body = req.body as { status?: string; resolution?: string };

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status) updates.status = body.status;
  if (body.resolution) { updates.resolution = body.resolution; updates.resolvedAt = new Date(); }

  const [updated] = await db.update(pulseDissents).set(updates).where(eq(pulseDissents.dissentId, req.params.id)).returning();
  if (!updated) { res.status(404).json({ error: "Dissent not found" }); return; }
  res.json({ dissent: { ...updated, id: updated.dissentId, submittedAt: updated.submittedAt.toISOString(), resolvedAt: updated.resolvedAt?.toISOString() ?? null } });
});

router.get("/pulse/agents", readLimiter, (_req: Request, res: Response) => {
  res.json({
    agents: AGENT_REGISTRY.filter((a: { id: string }) => a.id !== "alloy").map((a: { id: string; name: string; domain: string; preferredModel?: string; preferredProvider?: string; tools?: string[] }) => ({
      id: a.id, name: a.name, domain: a.domain, model: a.preferredModel, provider: a.preferredProvider, tools: a.tools,
    })),
  });
});

// ─── PDF Export ────────────────────────────────────────────────────────────────

router.get("/pulse/briefs/:id/pdf", readLimiter, async (req: Request, res: Response) => {
  await ensureInit();
  const brief = await getBriefWithDissents(req.params.id);
  if (!brief) { res.status(404).json({ error: "Brief not found" }); return; }

  try {
    const blocks: BlockNode[] = [];

    blocks.push({ type: "heading1", children: [{ text: `PULSE EXECUTIVE BRIEFING — ${brief.date}` }] });
    blocks.push({ type: "paragraph", children: [{ text: `Classification: ${brief.classification}` }] });
    blocks.push({ type: "paragraph", children: [{ text: `Overall Confidence: ${brief.overallConfidence}% | Risk Level: ${brief.riskLevel.toUpperCase()}` }] });
    blocks.push({ type: "paragraph", children: [{ text: `Generated: ${brief.generatedAt} | Agents: ${brief.agentsContributed.join(", ")}` }] });
    blocks.push({ type: "horizontal_rule", children: [{ text: "" }] });

    blocks.push({ type: "heading2", children: [{ text: "HEADLINE" }] });
    blocks.push({ type: "paragraph", children: [{ text: brief.headline }] });

    blocks.push({ type: "heading2", children: [{ text: "EXECUTIVE SUMMARY" }] });
    blocks.push({ type: "paragraph", children: [{ text: brief.executiveSummary }] });
    blocks.push({ type: "horizontal_rule", children: [{ text: "" }] });

    for (const section of brief.sections) {
      blocks.push({ type: "heading2", children: [{ text: `${section.title} — ${section.agentName}` }] });
      blocks.push({ type: "paragraph", children: [{ text: `Confidence: ${section.confidenceScore}% | Risk: ${section.riskLevel}` }] });
      blocks.push({ type: "paragraph", children: [{ text: section.content }] });

      if (section.keyFindings.length > 0) {
        blocks.push({ type: "heading3", children: [{ text: "Key Findings" }] });
        blocks.push({ type: "bullet_list", children: section.keyFindings.map(f => ({ type: "list_item" as const, children: [{ text: f }] })) });
      }

      if (section.actionItems.length > 0) {
        blocks.push({ type: "heading3", children: [{ text: "Action Items" }] });
        blocks.push({ type: "bullet_list", children: section.actionItems.map(a => ({ type: "list_item" as const, children: [{ text: a }] })) });
      }
    }

    if (brief.recommendedActions.length > 0) {
      blocks.push({ type: "horizontal_rule", children: [{ text: "" }] });
      blocks.push({ type: "heading2", children: [{ text: "RECOMMENDED ACTIONS" }] });
      blocks.push({
        type: "bullet_list",
        children: brief.recommendedActions.map(a => ({
          type: "list_item" as const,
          children: [{ text: `[${a.priority}] ${a.action} — ${a.owner} (${a.domain}): ${a.rationale}` }],
        })),
      });
    }

    if (brief.dissents.length > 0) {
      blocks.push({ type: "horizontal_rule", children: [{ text: "" }] });
      blocks.push({ type: "heading2", children: [{ text: "ACTIVE DISSENTS" }] });
      for (const d of brief.dissents) {
        blocks.push({ type: "blockquote", children: [{ text: `Claim: "${d.claim}"` }] });
        blocks.push({ type: "paragraph", children: [{ text: `Dissenting View: ${d.dissentingView}` }] });
        blocks.push({ type: "paragraph", children: [{ text: `Basis: ${d.basis} | Status: ${d.status} | Filed by: ${d.submittedBy}` }] });
      }
    }

    const pdfBuffer = await renderDocumentToPdfBuffer({
      content: { blocks },
      title: `Pulse Brief — ${brief.date}`,
      appSource: "Pulse Briefing Engine",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="pulse-brief-${brief.date}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    logger.error({ err }, "[pulse] PDF export failed");
    res.status(500).json({ error: "PDF generation failed" });
  }
});

// ─── Settings ─────────────────────────────────────────────────────────────────

router.get("/pulse/settings", readLimiter, async (_req: Request, res: Response) => {
  await ensureInit();
  const rows = await db.select().from(pulseSettings);
  const settings: Record<string, unknown> = {};
  for (const row of rows) settings[row.settingKey] = row.settingValue;

  if (Object.keys(settings).length === 0) {
    const defaults = {
      classification: "OPERATOR SENSITIVE // NURO MESH",
      autoGenerateDaily: true,
      dailyGenerationTime: "07:00",
      defaultDomains: ["maritime", "security", "analytics", "legal", "infrastructure"],
      defaultAgents: ["helmsman", "sentinel", "beacon", "inca", "zeus"],
      notifyOnCritical: true,
      dissentsRequireReview: true,
      archiveAfterDays: 90,
      pdfBranding: "szl-holdings",
    };
    for (const [key, value] of Object.entries(defaults)) {
      await db.insert(pulseSettings).values({ settingKey: key, settingValue: value }).onConflictDoNothing();
    }
    res.json({ settings: defaults });
    return;
  }

  res.json({ settings });
});

router.patch("/pulse/settings", writeLimiter, async (req: Request, res: Response) => {
  await ensureInit();
  const updates = req.body as Record<string, unknown>;

  for (const [key, value] of Object.entries(updates)) {
    await db.insert(pulseSettings).values({ settingKey: key, settingValue: value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: pulseSettings.settingKey, set: { settingValue: value, updatedAt: new Date() } });
  }

  const rows = await db.select().from(pulseSettings);
  const settings: Record<string, unknown> = {};
  for (const row of rows) settings[row.settingKey] = row.settingValue;
  res.json({ settings });
});

export default router;
