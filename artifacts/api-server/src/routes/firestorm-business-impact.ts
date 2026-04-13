import { Router, type IRouter } from 'express';
import {
  db,
  firestormIncidentsTable,
  mspClientsTable,
  mspContractsTable,
} from '@szl-holdings/db';
import { eq, desc, ne, and } from 'drizzle-orm';
import { sendSuccess, sendNotFound, handleRouteError } from '../lib/api-response';
import { authMiddleware, parseIdParam } from '../middlewares/auth';

const router: IRouter = Router();

// ─── Business Impact — Incident-to-Invoice Correlation Engine ─────────────────

interface SlaTierConfig {
  tier: string;
  responseTarget: string;
  resolutionTarget: string;
  breachThresholdMs: number;
  penaltyPct: number;
}

interface MspClientRow {
  id: number;
  name: string;
  industry: string | null;
  mrr: number | null;
  tags: string[] | null;
  status: string;
}

interface MspContractRow {
  id: number;
  clientId: number | null;
  value: number;
  mrr: number | null;
  type: string;
  status: string;
}

interface BoardBriefSections {
  headline: string;
  whatHappened: string;
  whoAffected: string;
  financialExposure: string;
  remediationStatus: string;
  timeline: string;
}

const SLA_TIERS: Record<string, SlaTierConfig> = {
  Platinum: { tier: "Platinum", responseTarget: "15 min", resolutionTarget: "2h",  breachThresholdMs: 2  * 60 * 60 * 1000, penaltyPct: 0.15 },
  Gold:     { tier: "Gold",     responseTarget: "30 min", resolutionTarget: "4h",  breachThresholdMs: 4  * 60 * 60 * 1000, penaltyPct: 0.10 },
  Silver:   { tier: "Silver",   responseTarget: "1h",     resolutionTarget: "8h",  breachThresholdMs: 8  * 60 * 60 * 1000, penaltyPct: 0.05 },
  Standard: { tier: "Standard", responseTarget: "2h",     resolutionTarget: "NBD", breachThresholdMs: 24 * 60 * 60 * 1000, penaltyPct: 0    },
};

const REMEDIATION_COST_BY_SEVERITY: Record<string, number> = {
  critical: 45000,
  high: 18000,
  medium: 6000,
  low: 1500,
};

const INDUSTRY_ATTACK_AFFINITY: Record<string, string[]> = {
  healthcare:    ["ransomware", "phi", "hipaa", "ehr", "patient", "medical", "healthcare"],
  finance:       ["banking", "wire", "fraud", "swift", "payment", "card", "pci", "financial"],
  manufacturing: ["ot", "scada", "ics", "industrial", "plc", "operational", "supply"],
  retail:        ["pos", "ecommerce", "card", "payment", "retail", "inventory"],
  technology:    ["cloud", "api", "devops", "source", "code", "software", "saas"],
  legal:         ["attorney", "confidential", "legal", "litigation", "privilege"],
  education:     ["student", "university", "school", "academic", "learning"],
  government:    ["federal", "state", "municipal", "government", "public"],
  energy:        ["power", "grid", "utility", "energy", "critical infrastructure"],
};

function assignClientTier(mrr: number): string {
  if (mrr >= 15000) return "Platinum";
  if (mrr >= 9000)  return "Gold";
  if (mrr >= 5000)  return "Silver";
  return "Standard";
}

function scoreClientAffinity(incident: { title: string; description: string | null; attackTechnique: string | null }, client: MspClientRow): number {
  const corpus = [incident.title, incident.description ?? "", incident.attackTechnique ?? ""].join(" ").toLowerCase();
  const clientIndustry = (client.industry ?? "").toLowerCase();
  const clientName = client.name.toLowerCase();
  const clientTags: string[] = Array.isArray(client.tags) ? client.tags.map((t) => t.toLowerCase()) : [];

  let score = 0;

  const affinityTerms = INDUSTRY_ATTACK_AFFINITY[clientIndustry] ?? [];
  for (const term of affinityTerms) {
    if (corpus.includes(term)) score += 20;
  }

  for (const tag of clientTags) {
    if (corpus.includes(tag)) score += 15;
  }

  if (corpus.includes(clientName)) score += 30;
  if (corpus.includes(clientIndustry)) score += 10;

  if (client.mrr && client.mrr >= 15000) score += 5;
  if (client.status === "at-risk") score += 8;

  return score;
}

function correlateIncidentToClients(
  incident: { id: number; title: string; description: string | null; attackTechnique: string | null; severity: string },
  clients: MspClientRow[],
): { client: MspClientRow; confidence: number } | null {
  if (clients.length === 0) return null;

  const scored = clients.map((c) => ({ client: c, score: scoreClientAffinity(incident, c) }));
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const hasSemanticSignal = best.score > 0;

  const confidenceBase = incident.severity === "critical" ? 0.88 : incident.severity === "high" ? 0.76 : 0.58;
  const confidenceBoost = hasSemanticSignal ? Math.min(0.10, best.score / 100) : 0;
  const confidence = Math.min(0.97, confidenceBase + confidenceBoost);

  return { client: best.client, confidence };
}

function buildBoardBrief(
  incident: { title: string; status: string; severity: string; assignedAnalyst: string | null; createdAt: Date },
  client: MspClientRow,
  contractValue: number,
  totalExposure: number,
  slaBreached: boolean,
): BoardBriefSections {
  const tier = assignClientTier(client.mrr ?? 0);
  const mrr = client.mrr ?? 0;
  const industry = client.industry ?? "enterprise";
  const sevLabel = incident.severity === "critical" ? "critical" : "high-severity";

  return {
    headline: `${incident.severity === "critical" ? "CRITICAL: " : ""}${incident.title} — ${client.name} impacted${slaBreached ? " · SLA BREACHED" : ""}`,
    whatHappened: `A ${sevLabel} security incident was detected on infrastructure serving ${client.name} (${industry} sector). The incident "${incident.title}" was identified at the ${incident.status} phase. Initial analysis indicates ${incident.severity === "critical" || incident.severity === "high" ? "active threat actor behavior with lateral movement indicators" : "anomalous activity requiring investigation and containment"}.`,
    whoAffected: `${client.name} (${industry}) — a ${tier} tier managed service client generating $${mrr.toLocaleString()}/month in recurring revenue under a $${contractValue.toLocaleString()} annual contract. ${slaBreached ? "SLA terms have been breached — client notification is required." : "SLA clock is running."}`,
    financialExposure: `Total estimated exposure is $${totalExposure.toLocaleString()}, comprising revenue at risk from potential contract impact, remediation labor costs, and${slaBreached ? " SLA breach penalties as outlined in the service agreement." : " projected containment costs."}`,
    remediationStatus: `Incident is in ${incident.status} phase. ${incident.assignedAnalyst ?? "Unassigned"}${incident.assignedAnalyst ? " is leading the investigation." : " — analyst assignment required."} Playbooks have been triggered automatically.${slaBreached ? " Escalation to Incident Commander is active." : ""}`,
    timeline: `Detected ${incident.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}. ${incident.status === "closed" ? "Incident has been resolved." : "Active investigation underway — next update due within 30 minutes."}`,
  };
}

router.get("/firestorm/incident-impact/:incidentId", authMiddleware({ required: true }), async (req, res) => {
  try {
    const incidentId = parseIdParam(req.params.incidentId);
    const [incident] = await db.select().from(firestormIncidentsTable).where(eq(firestormIncidentsTable.id, incidentId));
    if (!incident) { sendNotFound(res, "Incident"); return; }

    const clients = await db.select({
      id: mspClientsTable.id,
      name: mspClientsTable.name,
      industry: mspClientsTable.industry,
      mrr: mspClientsTable.mrr,
      tags: mspClientsTable.tags,
      status: mspClientsTable.status,
    }).from(mspClientsTable).where(eq(mspClientsTable.status, "active")).orderBy(desc(mspClientsTable.mrr)).limit(30);

    const correlation = correlateIncidentToClients(incident, clients as MspClientRow[]);
    const correlatedClient = correlation?.client ?? null;
    const correlationConfidence = correlation?.confidence ?? 0;

    let contractValue = 0;
    if (correlatedClient) {
      const [contract] = await db.select({
        id: mspContractsTable.id,
        clientId: mspContractsTable.clientId,
        value: mspContractsTable.value,
        mrr: mspContractsTable.mrr,
        type: mspContractsTable.type,
        status: mspContractsTable.status,
      }).from(mspContractsTable)
        .where(and(eq(mspContractsTable.clientId, correlatedClient.id), eq(mspContractsTable.status, "active")))
        .orderBy(desc(mspContractsTable.value))
        .limit(1);
      contractValue = (contract as MspContractRow | undefined)?.value ?? (correlatedClient.mrr ?? 0) * 12;
    }

    const mrr = correlatedClient?.mrr ?? 0;
    const tier = assignClientTier(mrr);
    const slaConfig = SLA_TIERS[tier] ?? SLA_TIERS.Standard;

    const incidentCreatedAt = incident.createdAt.getTime();
    const timeElapsedMs = Date.now() - incidentCreatedAt;
    const timeRemainingMs = Math.max(0, slaConfig.breachThresholdMs - timeElapsedMs);
    const percentConsumed = Math.min(100, Math.round((timeElapsedMs / slaConfig.breachThresholdMs) * 100));
    const breached = incident.status !== "closed" && timeElapsedMs > slaConfig.breachThresholdMs;

    const remediationCost = REMEDIATION_COST_BY_SEVERITY[incident.severity] ?? 6000;
    const revenueAtRisk = correlatedClient && incident.status !== "closed"
      ? Math.round(mrr * (incident.severity === "critical" ? 3 : incident.severity === "high" ? 1.5 : 0.5))
      : 0;
    const slaBreachPenalty = breached && correlatedClient ? Math.round(contractValue * slaConfig.penaltyPct) : null;
    const totalExposure = revenueAtRisk + remediationCost + (slaBreachPenalty ?? 0);

    const isHighSeverity = incident.severity === "critical" || incident.severity === "high";
    const boardBrief: BoardBriefSections | null = isHighSeverity && correlatedClient
      ? buildBoardBrief(incident, correlatedClient, contractValue, totalExposure, breached)
      : null;

    sendSuccess(res, {
      incidentId,
      correlatedClient: correlatedClient ? {
        id: correlatedClient.id,
        name: correlatedClient.name,
        industry: correlatedClient.industry ?? "Enterprise",
        tier,
        mrr,
        contractValue,
      } : null,
      slaStatus: correlatedClient ? {
        tier,
        responseTarget: slaConfig.responseTarget,
        resolutionTarget: slaConfig.resolutionTarget,
        breachThresholdMs: slaConfig.breachThresholdMs,
        timeElapsedMs,
        timeRemainingMs,
        percentConsumed,
        breached,
        escalationRecommended: percentConsumed > 80 || breached,
      } : null,
      financialExposure: {
        revenueAtRisk,
        estimatedRemediationCost: remediationCost,
        slaBreachPenalty,
        totalExposure,
      },
      boardBrief,
      correlationConfidence,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute incident business impact");
  }
});

router.get("/firestorm/business-impact/revenue-at-risk", authMiddleware({ required: true }), async (_req, res) => {
  try {
    const activeIncidents = await db.select().from(firestormIncidentsTable)
      .where(ne(firestormIncidentsTable.status, "closed"))
      .orderBy(desc(firestormIncidentsTable.createdAt))
      .limit(50);

    const clients = await db.select({
      id: mspClientsTable.id,
      name: mspClientsTable.name,
      industry: mspClientsTable.industry,
      mrr: mspClientsTable.mrr,
      tags: mspClientsTable.tags,
      status: mspClientsTable.status,
    }).from(mspClientsTable).where(eq(mspClientsTable.status, "active")).orderBy(desc(mspClientsTable.mrr)).limit(30);

    let totalRevenueAtRisk = 0;
    let totalRemediationCost = 0;
    let totalSlaBreachPenalty = 0;
    let slaBreachedCount = 0;
    let criticalCount = 0;
    const impactedClientIds = new Set<number>();

    interface BreakdownEntry { incidentId: number; incidentTitle: string; severity: string; clientName: string; revenueAtRisk: number; slaBreached: boolean }
    const breakdown: BreakdownEntry[] = [];

    for (const incident of activeIncidents) {
      const severity = incident.severity;
      if (severity === "critical") criticalCount++;

      const remediationCost = REMEDIATION_COST_BY_SEVERITY[severity] ?? 6000;
      totalRemediationCost += remediationCost;

      const correlation = correlateIncidentToClients(incident, clients as MspClientRow[]);
      if (!correlation) continue;

      const client = correlation.client;
      const mrr = client.mrr ?? 0;
      const tier = assignClientTier(mrr);
      const slaConfig = SLA_TIERS[tier] ?? SLA_TIERS.Standard;
      const contractValue = mrr * 12;

      const timeElapsedMs = Date.now() - incident.createdAt.getTime();
      const breached = timeElapsedMs > slaConfig.breachThresholdMs;
      if (breached) {
        slaBreachedCount++;
        totalSlaBreachPenalty += Math.round(contractValue * slaConfig.penaltyPct);
      }

      const revenueAtRisk = Math.round(mrr * (severity === "critical" ? 3 : severity === "high" ? 1.5 : 0.5));
      totalRevenueAtRisk += revenueAtRisk;
      impactedClientIds.add(client.id);

      breakdown.push({ incidentId: incident.id, incidentTitle: incident.title, severity, clientName: client.name, revenueAtRisk, slaBreached: breached });
    }

    breakdown.sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);

    sendSuccess(res, {
      totalRevenueAtRisk,
      totalRemediationCost,
      totalExposure: totalRevenueAtRisk + totalRemediationCost + totalSlaBreachPenalty,
      activeIncidentCount: activeIncidents.length,
      slaBreachedCount,
      criticalIncidentCount: criticalCount,
      impactedClients: impactedClientIds.size,
      breakdown: breakdown.slice(0, 10),
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute revenue at risk");
  }
});

router.get("/firestorm/business-impact/historical", authMiddleware({ required: true }), async (_req, res) => {
  try {
    const allIncidents = await db.select().from(firestormIncidentsTable)
      .orderBy(desc(firestormIncidentsTable.createdAt))
      .limit(100);

    const bySeverity: Record<string, { count: number; totalExposure: number; avgExposure: number }> = {
      critical: { count: 0, totalExposure: 0, avgExposure: 0 },
      high:     { count: 0, totalExposure: 0, avgExposure: 0 },
      medium:   { count: 0, totalExposure: 0, avgExposure: 0 },
      low:      { count: 0, totalExposure: 0, avgExposure: 0 },
    };

    const last30Days: Record<string, number> = {};
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    for (const incident of allIncidents) {
      const severity = incident.severity;
      const remediation = REMEDIATION_COST_BY_SEVERITY[severity] ?? 6000;
      const exposure = remediation + (severity === "critical" ? 45000 : severity === "high" ? 15000 : 3000);

      if (bySeverity[severity]) {
        bySeverity[severity].count++;
        bySeverity[severity].totalExposure += exposure;
      }

      const dayKey = incident.createdAt.toISOString().slice(0, 10);
      if (dayKey >= cutoff) {
        last30Days[dayKey] = (last30Days[dayKey] ?? 0) + exposure;
      }
    }

    for (const sev of Object.keys(bySeverity)) {
      if (bySeverity[sev].count > 0) {
        bySeverity[sev].avgExposure = Math.round(bySeverity[sev].totalExposure / bySeverity[sev].count);
      }
    }

    const timeline = Object.entries(last30Days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, exposure]) => ({ date, exposure }));

    sendSuccess(res, {
      totalIncidents: allIncidents.length,
      closedIncidents: allIncidents.filter((i) => i.status === "closed").length,
      bySeverity,
      timeline,
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute historical impact data");
  }
});

export default router;
