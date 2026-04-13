import { Router, type IRouter, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const meshRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
});

router.use(meshRateLimit as any);

const VENTURES = [
  { id: "vessels", name: "Vessels", domain: "maritime", color: "hsl(206,72%,52%)" },
  { id: "aegis", name: "Aegis", domain: "defense", color: "hsl(222,60%,62%)" },
  { id: "terra", name: "Terra", domain: "real-estate", color: "hsl(140,50%,48%)" },
  { id: "prism", name: "PRISM Counsel", domain: "legal", color: "hsl(38,72%,58%)" },
  { id: "lyte", name: "Lyte", domain: "observability", color: "hsl(192,72%,48%)" },
  { id: "carlota-jo", name: "Carlota Jo", domain: "advisory", color: "hsl(280,50%,65%)" },
];

const ROUTING_RULES: Array<{
  id: string;
  sourceVenture: string;
  targetVenture: string;
  signalType: string;
  condition: string;
  description: string;
  enabled: boolean;
}> = [
  {
    id: "rule-vessels-aegis-threat",
    sourceVenture: "vessels",
    targetVenture: "aegis",
    signalType: "threat",
    condition: "confidence >= 0.75",
    description: "Vessels threat actors route to Aegis threat intelligence for correlation",
    enabled: true,
  },
  {
    id: "rule-vessels-terra-ownership",
    sourceVenture: "vessels",
    targetVenture: "terra",
    signalType: "entity",
    condition: "entity_type = 'owner'",
    description: "Suspicious maritime owners surface in Terra ownership risk scoring",
    enabled: true,
  },
  {
    id: "rule-vessels-prism-exposure",
    sourceVenture: "vessels",
    targetVenture: "prism",
    signalType: "threat",
    condition: "severity >= high",
    description: "High-severity vessel flags trigger PRISM legal exposure review",
    enabled: true,
  },
  {
    id: "rule-terra-vessels-charter",
    sourceVenture: "terra",
    targetVenture: "vessels",
    signalType: "distress",
    condition: "owner_risk >= 0.65",
    description: "Distressed property owners checked against active charter contracts",
    enabled: true,
  },
  {
    id: "rule-terra-prism-legal",
    sourceVenture: "terra",
    targetVenture: "prism",
    signalType: "distress",
    condition: "severity >= high",
    description: "Terra distress signals open PRISM matter tracking for legal risk",
    enabled: true,
  },
  {
    id: "rule-aegis-vessels-sanction",
    sourceVenture: "aegis",
    targetVenture: "vessels",
    signalType: "threat",
    condition: "threat_type = 'sanctions'",
    description: "Aegis sanctions list matches propagate to Vessels entity screening",
    enabled: true,
  },
  {
    id: "rule-aegis-prism-incident",
    sourceVenture: "aegis",
    targetVenture: "prism",
    signalType: "incident",
    condition: "severity >= critical",
    description: "Critical security incidents trigger PRISM legal incident response",
    enabled: true,
  },
  {
    id: "rule-prism-aegis-compliance",
    sourceVenture: "prism",
    targetVenture: "aegis",
    signalType: "compliance",
    condition: "matter_type = 'regulatory'",
    description: "PRISM regulatory matters feed Aegis compliance threat surface",
    enabled: true,
  },
  {
    id: "rule-lyte-all-anomaly",
    sourceVenture: "lyte",
    targetVenture: "aegis",
    signalType: "anomaly",
    condition: "confidence >= 0.8",
    description: "Lyte workflow anomalies route to Aegis for behavioral threat analysis",
    enabled: true,
  },
  {
    id: "rule-carlota-prism-matter",
    sourceVenture: "carlota-jo",
    targetVenture: "prism",
    signalType: "risk",
    condition: "client_risk >= medium",
    description: "Carlota Jo advisory risk flags open PRISM pre-matter intake",
    enabled: true,
  },
];

const SIGNAL_TEMPLATES: Array<{
  type: string;
  severities: string[];
  titles: string[];
  sourceVentures: string[];
  enrichmentDescriptions: Record<string, string>;
}> = [
  {
    type: "threat",
    severities: ["critical", "high", "medium"],
    titles: [
      "Sanctioned entity detected in AIS transponder data",
      "Vessel flag-of-convenience pattern identified",
      "Known threat actor linked to charter party",
      "Cyberattack signature on maritime control system",
    ],
    sourceVentures: ["vessels", "aegis"],
    enrichmentDescriptions: {
      aegis: "Cross-referenced against OFAC SDN list — 3 additional aliases confirmed",
      terra: "Entity holds beneficial interest in 2 properties under active distress watch",
      prism: "Regulatory exposure identified — recommend pre-matter intake for sanctions compliance",
      lyte: "Workflow anomaly correlation: approval chain shows 4-day latency spike at entity name",
      vessels: "AIS history shows 12 port calls to high-risk jurisdictions in last 90 days",
    },
  },
  {
    type: "distress",
    severities: ["high", "medium", "low"],
    titles: [
      "Property owner entered default proceedings",
      "Portfolio distress score exceeds threshold",
      "Owner linked to offshore SPV with no visible revenue",
      "Forced liquidation signal detected on 3 assets",
    ],
    sourceVentures: ["terra"],
    enrichmentDescriptions: {
      vessels: "Owner operates charter agreements on 2 active voyages — counterparty risk elevated",
      prism: "Matter opened for distressed asset legal review — 3 pending liens surfaced",
      aegis: "Beneficial owner appears in financial crime database with 2 prior investigations",
      lyte: "Deal workflow stalled for 11 days — approval ownership gap identified",
    },
  },
  {
    type: "incident",
    severities: ["critical", "high"],
    titles: [
      "SOC alert: lateral movement detected in tenant network",
      "Credential stuffing attack on enterprise SSO portal",
      "Insider threat signal: anomalous data export pattern",
      "Supply chain compromise in vendor integration layer",
    ],
    sourceVentures: ["aegis"],
    enrichmentDescriptions: {
      prism: "Incident triggers statutory breach notification window — PRISM matter initiated",
      lyte: "Workflow disruption: 14 approvals blocked by affected authentication layer",
      vessels: "Fleet telemetry endpoints may be within affected IP range — isolation recommended",
      terra: "Property management portals use affected SSO — tenant data review required",
    },
  },
  {
    type: "compliance",
    severities: ["high", "medium"],
    titles: [
      "Regulatory deadline missed on matter portfolio",
      "Material adverse change clause triggered",
      "Cross-border data transfer compliance gap identified",
      "Counterparty KYC refresh overdue — 45-day exposure window",
    ],
    sourceVentures: ["prism"],
    enrichmentDescriptions: {
      aegis: "Compliance gap creates exploitable surface — threat model updated",
      terra: "Property transactions with affected counterparty flagged for legal review",
      vessels: "Charter counterparties under same KYC regime — 3 agreements at risk",
      lyte: "Deadline tracking workflow shows 8 approvals unassigned — escalation triggered",
    },
  },
  {
    type: "anomaly",
    severities: ["high", "medium"],
    titles: [
      "Workflow ownership gap: 23% of critical approvals unassigned",
      "Approval latency spike: 4.7× above baseline in finance queue",
      "Decision object stale for 14 days — risk of expiry",
      "Execution pattern divergence detected across 3 business units",
    ],
    sourceVentures: ["lyte"],
    enrichmentDescriptions: {
      aegis: "Workflow gap pattern consistent with insider threat precursor — behavioral alert raised",
      prism: "Unassigned approvals include 2 regulatory items — PRISM deadline risk flagged",
      vessels: "Fleet approval chain shows same ownership gap — compliance exposure noted",
      terra: "Deal pipeline stalled items linked to same approval owner — portfolio impact assessed",
    },
  },
  {
    type: "risk",
    severities: ["medium", "low"],
    titles: [
      "Client risk profile updated — private equity restructuring",
      "Advisory engagement reveals undisclosed conflict of interest",
      "Family office governance gap — succession risk identified",
    ],
    sourceVentures: ["carlota-jo"],
    enrichmentDescriptions: {
      prism: "Pre-matter intake opened for conflict review and governance advisory",
      terra: "Client holds real estate positions — portfolio impact of restructuring assessed",
      vessels: "Client charter arrangements reviewed for counterparty exposure",
      aegis: "Governance gap creates physical security risk — personal protection review flagged",
    },
  },
];

let meshSignalStore: MeshSignal[] = [];
let meshEventStore: MeshEvent[] = [];
let compoundValueStore: CompoundValueMetrics | null = null;
let lastGeneratedAt = 0;

interface MeshSignal {
  id: string;
  sourceVenture: string;
  sourceVentureName: string;
  signalType: string;
  severity: string;
  title: string;
  confidence: number;
  detectedAt: string;
  enrichedVentures: string[];
  status: "propagating" | "enriched" | "actioned" | "dismissed";
}

interface MeshEvent {
  id: string;
  signalId: string;
  sourceVenture: string;
  sourceVentureName: string;
  targetVenture: string;
  targetVentureName: string;
  signalType: string;
  severity: string;
  title: string;
  enrichmentContext: string;
  routingRule: string;
  confidence: number;
  detectedAt: string;
  enrichedAt: string;
  actionRecommendation: string;
  status: "active" | "reviewed" | "dismissed";
  compoundInsight: boolean;
}

interface CompoundValueMetrics {
  totalSignalsGenerated: number;
  totalCrossVentureRoutes: number;
  signalsEnrichedByMesh: number;
  signalsMissedInIsolation: number;
  enrichmentRate: number;
  missedInsightRate: number;
  ventureBreakdown: Array<{
    ventureId: string;
    ventureName: string;
    signalsSent: number;
    signalsReceived: number;
    enrichmentsProvided: number;
    compoundInsightsUnlocked: number;
  }>;
  topRoutingPairs: Array<{
    source: string;
    target: string;
    eventCount: number;
    avgConfidenceGain: number;
  }>;
  calculatedAt: string;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSignalId(): string {
  return `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function getApplicableRules(sourceVentureId: string, signalType: string): typeof ROUTING_RULES {
  return ROUTING_RULES.filter(
    r => r.enabled && r.sourceVenture === sourceVentureId && r.signalType === signalType
  );
}

function getVentureName(id: string): string {
  return VENTURES.find(v => v.id === id)?.name ?? id;
}

function buildActionRecommendation(signalType: string, targetVenture: string): string {
  const recs: Record<string, Record<string, string>> = {
    threat: {
      aegis: "Escalate to SOC Tier 2 — initiate threat hunt on correlated IOCs",
      prism: "Open pre-matter intake — assess sanctions compliance exposure within 24h",
      terra: "Flag beneficial ownership records for enhanced due diligence",
      vessels: "Initiate entity screening on fleet counterparties — suspend pending approvals",
      lyte: "Freeze affected approval workflows pending threat clearance",
    },
    distress: {
      vessels: "Review charter agreements — request updated counterparty KYC",
      prism: "Open matter for distressed asset legal review — check lien priority",
      aegis: "Initiate financial crime background check on beneficial owner",
      lyte: "Escalate stalled deal workflow to ownership resolution",
    },
    incident: {
      prism: "Activate breach notification runbook — statutory window starts at detection",
      lyte: "Assess approval workflow disruption — assign emergency ownership",
      vessels: "Isolate potentially affected endpoints — brief fleet operations",
      terra: "Audit tenant portal access logs — notify affected property managers",
    },
    compliance: {
      aegis: "Update compliance threat surface model — schedule penetration test",
      terra: "Pause transactions with flagged counterparties pending KYC refresh",
      vessels: "Hold charter payments until KYC compliance restored",
      lyte: "Escalate unassigned deadline items to compliance owner",
    },
    anomaly: {
      aegis: "Initiate behavioral threat analysis — review associated access logs",
      prism: "Assign regulatory approvals to backup owners immediately",
      vessels: "Assign fleet approval chain owner — set 4h SLA",
      terra: "Unblock deal pipeline — assign temporary approval authority",
    },
    risk: {
      prism: "Schedule conflict review within 48h — prepare disclosure documentation",
      terra: "Stress-test portfolio positions against restructuring scenarios",
      vessels: "Review charter counterparty arrangements — prepare contingency",
      aegis: "Brief physical security team — review client protection protocols",
    },
  };
  return recs[signalType]?.[targetVenture] ?? "Review and assess relevance — determine escalation path";
}

function generateMeshData(): { signals: MeshSignal[]; events: MeshEvent[] } {
  const signals: MeshSignal[] = [];
  const events: MeshEvent[] = [];
  const now = Date.now();

  const signalCount = 18 + Math.floor(Math.random() * 8);

  for (let i = 0; i < signalCount; i++) {
    const template = randomFrom(SIGNAL_TEMPLATES);
    const sourceVenture = randomFrom(template.sourceVentures);
    const severity = randomFrom(template.severities);
    const title = randomFrom(template.titles);
    const confidence = 0.6 + Math.random() * 0.38;
    const detectedAt = new Date(now - Math.random() * 86400000 * 3).toISOString();
    const signalId = generateSignalId();

    const applicableRules = getApplicableRules(sourceVenture, template.type);
    const enrichedVentureIds = applicableRules.map(r => r.targetVenture);

    signals.push({
      id: signalId,
      sourceVenture,
      sourceVentureName: getVentureName(sourceVenture),
      signalType: template.type,
      severity,
      title,
      confidence: Math.round(confidence * 100) / 100,
      detectedAt,
      enrichedVentures: enrichedVentureIds,
      status: randomFrom(["propagating", "enriched", "enriched", "actioned", "actioned"] as MeshSignal["status"][]),
    });

    for (const rule of applicableRules) {
      if (Math.random() > 0.15) {
        const enrichmentContext = template.enrichmentDescriptions[rule.targetVenture] ??
          `Signal from ${getVentureName(sourceVenture)} propagated via ${rule.description}`;
        const enrichedAt = new Date(new Date(detectedAt).getTime() + Math.random() * 180000 + 15000).toISOString();
        events.push({
          id: generateEventId(),
          signalId,
          sourceVenture,
          sourceVentureName: getVentureName(sourceVenture),
          targetVenture: rule.targetVenture,
          targetVentureName: getVentureName(rule.targetVenture),
          signalType: template.type,
          severity,
          title,
          enrichmentContext,
          routingRule: rule.id,
          confidence: Math.round(confidence * 100) / 100,
          detectedAt,
          enrichedAt,
          actionRecommendation: buildActionRecommendation(template.type, rule.targetVenture),
          status: randomFrom(["active", "active", "reviewed", "reviewed", "dismissed"] as MeshEvent["status"][]),
          compoundInsight: applicableRules.length > 1,
        });
      }
    }
  }

  events.sort((a, b) => new Date(b.enrichedAt).getTime() - new Date(a.enrichedAt).getTime());

  return { signals, events };
}

function computeCompoundValue(signals: MeshSignal[], events: MeshEvent[]): CompoundValueMetrics {
  const signalsMissedInIsolation = events.filter(e => e.compoundInsight).length;
  const enrichmentRate = signals.length > 0 ? events.length / signals.length : 0;
  const missedInsightRate = signals.length > 0 ? signalsMissedInIsolation / signals.length : 0;

  const ventureStats = new Map<string, { sent: number; received: number; provided: number; unlocked: number }>();
  for (const v of VENTURES) {
    ventureStats.set(v.id, { sent: 0, received: 0, provided: 0, unlocked: 0 });
  }
  for (const s of signals) {
    const stats = ventureStats.get(s.sourceVenture);
    if (stats) { stats.sent++; }
  }
  for (const e of events) {
    const srcStats = ventureStats.get(e.sourceVenture);
    if (srcStats) { srcStats.provided++; }
    const tgtStats = ventureStats.get(e.targetVenture);
    if (tgtStats) {
      tgtStats.received++;
      if (e.compoundInsight) tgtStats.unlocked++;
    }
  }

  const routingPairMap = new Map<string, { count: number; confSum: number }>();
  for (const e of events) {
    const key = `${e.sourceVenture}→${e.targetVenture}`;
    const existing = routingPairMap.get(key) ?? { count: 0, confSum: 0 };
    routingPairMap.set(key, { count: existing.count + 1, confSum: existing.confSum + e.confidence });
  }
  const topRoutingPairs = Array.from(routingPairMap.entries())
    .map(([key, val]) => {
      const [source, target] = key.split("→");
      return {
        source: getVentureName(source),
        target: getVentureName(target),
        eventCount: val.count,
        avgConfidenceGain: Math.round((val.confSum / val.count) * 100) / 100,
      };
    })
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, 6);

  return {
    totalSignalsGenerated: signals.length,
    totalCrossVentureRoutes: events.length,
    signalsEnrichedByMesh: events.filter(e => e.status !== "dismissed").length,
    signalsMissedInIsolation,
    enrichmentRate: Math.round(enrichmentRate * 100) / 100,
    missedInsightRate: Math.round(missedInsightRate * 100) / 100,
    ventureBreakdown: VENTURES.map(v => {
      const stats = ventureStats.get(v.id) ?? { sent: 0, received: 0, provided: 0, unlocked: 0 };
      return {
        ventureId: v.id,
        ventureName: v.name,
        signalsSent: stats.sent,
        signalsReceived: stats.received,
        enrichmentsProvided: stats.provided,
        compoundInsightsUnlocked: stats.unlocked,
      };
    }),
    topRoutingPairs,
    calculatedAt: new Date().toISOString(),
  };
}

function ensureMeshData() {
  const REFRESH_MS = 30000;
  if (Date.now() - lastGeneratedAt > REFRESH_MS || meshSignalStore.length === 0) {
    const { signals, events } = generateMeshData();
    meshSignalStore = signals;
    meshEventStore = events;
    compoundValueStore = computeCompoundValue(signals, events);
    lastGeneratedAt = Date.now();
  }
}

router.get("/signals", (_req: Request, res: Response) => {
  try {
    ensureMeshData();
    res.json({
      signals: meshSignalStore,
      count: meshSignalStore.length,
      generatedAt: new Date(lastGeneratedAt).toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to get mesh signals");
    res.status(500).json({ error: "Failed to get mesh signals" });
  }
});

router.get("/feed", (req: Request, res: Response) => {
  try {
    ensureMeshData();
    const limit = parseInt(req.query.limit as string) || 30;
    const signalType = req.query.signalType as string | undefined;
    const targetVenture = req.query.targetVenture as string | undefined;
    const severity = req.query.severity as string | undefined;
    const afterRaw = req.query.after as string | undefined;
    const beforeRaw = req.query.before as string | undefined;
    const entity = (req.query.entity as string | undefined)?.toLowerCase();

    let after: number | undefined;
    let before: number | undefined;
    if (afterRaw) {
      const ts = new Date(afterRaw).getTime();
      if (isNaN(ts)) { res.status(400).json({ error: "Invalid 'after' date — expected ISO 8601 string" }); return; }
      after = ts;
    }
    if (beforeRaw) {
      const ts = new Date(beforeRaw).getTime();
      if (isNaN(ts)) { res.status(400).json({ error: "Invalid 'before' date — expected ISO 8601 string" }); return; }
      before = ts;
    }

    let events = [...meshEventStore];
    if (signalType) events = events.filter(e => e.signalType === signalType);
    if (targetVenture) events = events.filter(e => e.targetVenture === targetVenture);
    if (severity) events = events.filter(e => e.severity === severity);
    if (after !== undefined) events = events.filter(e => new Date(e.enrichedAt).getTime() >= after);
    if (before !== undefined) events = events.filter(e => new Date(e.enrichedAt).getTime() <= before);
    if (entity) {
      events = events.filter(e => {
        const title = (e.title ?? "").toLowerCase();
        const ctx = (e.enrichmentContext ?? "").toLowerCase();
        return title.includes(entity) || ctx.includes(entity);
      });
    }

    res.json({
      events: events.slice(0, limit),
      total: events.length,
      generatedAt: new Date(lastGeneratedAt).toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to get mesh feed");
    res.status(500).json({ error: "Failed to get mesh feed" });
  }
});

router.get("/compound-value", (_req: Request, res: Response) => {
  try {
    ensureMeshData();
    res.json(compoundValueStore);
  } catch (err) {
    logger.error({ err }, "Failed to get compound value metrics");
    res.status(500).json({ error: "Failed to get compound value metrics" });
  }
});

router.get("/routing-rules", (_req: Request, res: Response) => {
  try {
    res.json({
      rules: ROUTING_RULES,
      count: ROUTING_RULES.length,
      ventures: VENTURES,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get routing rules" });
  }
});

router.patch("/routing-rules/:ruleId", (req: Request, res: Response) => {
  try {
    const ruleId = req.params.ruleId as string;
    const { enabled } = req.body;
    const rule = ROUTING_RULES.find(r => r.id === ruleId);
    if (!rule) {
      res.status(404).json({ error: "Routing rule not found" });
      return;
    }
    if (typeof enabled === "boolean") {
      rule.enabled = enabled;
      lastGeneratedAt = 0;
    }
    res.json({ rule, updated: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update routing rule" });
  }
});

router.get("/venture-inbox/:ventureId", (req: Request, res: Response) => {
  try {
    ensureMeshData();
    const ventureId = req.params.ventureId as string;
    const events = meshEventStore
      .filter(e => e.targetVenture === ventureId && e.status === "active")
      .slice(0, 10);
    res.json({
      ventureId,
      ventureName: getVentureName(ventureId),
      events,
      unreadCount: events.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get venture inbox" });
  }
});

router.get("/insights", (req: Request, res: Response) => {
  try {
    ensureMeshData();
    const domain = req.query.domain as string | undefined;
    const limit = parseInt(req.query.limit as string) || 5;

    let events = [...meshEventStore];
    if (domain) events = events.filter(e => e.targetVenture === domain);

    const insights = events.slice(0, limit).map(e => ({
      id: e.id,
      title: e.title,
      summary: e.enrichmentContext,
      confidence: e.confidence,
      severity: e.severity,
      domain: e.targetVenture,
      recommendedAction: e.actionRecommendation ?? undefined,
      entities: [],
      enrichedAt: e.enrichedAt,
      agentId: "intelligence-mesh",
      signalType: e.signalType,
      sourceVenture: e.sourceVenture,
    }));

    res.json({
      insights,
      total: events.length,
      domain: domain ?? "all",
      generatedAt: new Date(lastGeneratedAt).toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to get domain insights");
    res.status(500).json({ error: "Failed to get domain insights" });
  }
});

export default router;
