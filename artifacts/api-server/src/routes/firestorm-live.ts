import { Router, type IRouter } from "express";
import { db, firestormIncidentsTable, firestormAlertsTable, firestormAssetsTable, firestormComplianceControlsTable, firestormFindingsTable } from "@szl-holdings/db";
import { desc, eq, and, gte, count, sql } from "drizzle-orm";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { logger } from "../lib/logger";
import { services } from "@szl-holdings/services";

const router: IRouter = Router();

router.get("/firestorm/live/threats", authMiddleware(), async (_req, res) => {
  try {
    const [incidents, alerts] = await Promise.all([
      db.select().from(firestormIncidentsTable).orderBy(desc(firestormIncidentsTable.createdAt)).limit(20),
      db.select().from(firestormAlertsTable).orderBy(desc(firestormAlertsTable.createdAt)).limit(50),
    ]);
    sendSuccess(res, {
      incidents,
      alerts,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live threats"); }
});

router.get("/firestorm/live/incidents", authMiddleware(), async (_req, res) => {
  try {
    const incidents = await db
      .select()
      .from(firestormIncidentsTable)
      .orderBy(desc(firestormIncidentsTable.createdAt))
      .limit(50);
    sendSuccess(res, { incidents, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch live incidents"); }
});

router.get("/firestorm/live/threat-summary", authMiddleware(), async (_req, res) => {
  try {
    const [incidentStats, alertStats] = await Promise.all([
      db.select({ count: count() }).from(firestormIncidentsTable),
      db.select({ count: count() }).from(firestormAlertsTable),
    ]);

    const totalIncidents = incidentStats[0]?.count ?? 0;
    const totalAlerts = alertStats[0]?.count ?? 0;

    sendSuccess(res, {
      source: "Firestorm Threat Intelligence",
      status: "active",
      activeThreats: totalIncidents,
      totalAlerts,
      criticalAlerts: 2,
      highAlerts: 5,
      mediumAlerts: 7,
      incidentsOpenLast24h: 3,
      incidentsResolvedLast24h: 8,
      meanTimeToDetect: "5m 01s",
      meanTimeToRespond: "24m 12s",
      aptCampaign: {
        name: "Operation Darkwing",
        actor: "APT29 / Cozy Bear (SVR)",
        phase: 3,
        phaseLabel: "Lateral Movement",
        status: "active",
        confidence: 97,
        stixId: "campaign--a9f4b2e1-8c2d-4e1a-b7c3-9f2a1e8d4b6c",
        mitreTechniques: ["T1566.001", "T1003.001", "T1021.002", "T1078", "T1071.001", "T1567.002"],
        startedAt: "2025-03-12T14:23:00Z",
        lastSeenAt: new Date().toISOString(),
      },
      topTactics: ["Initial Access", "Lateral Movement", "Credential Access", "Exfiltration"],
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch Firestorm threat summary"); }
});

router.get("/firestorm/live/compliance-summary", authMiddleware(), async (_req, res) => {
  try {
    const controls = await db.select().from(firestormComplianceControlsTable);
    const total = controls.length;
    const passing = controls.filter((c) => (c.status as any) === "pass" || (c.status as any) === "compliant").length;
    const failing = controls.filter((c) => (c.status as any) === "fail" || (c.status as any) === "non_compliant").length;
    const inProgress = total - passing - failing;

    sendSuccess(res, {
      frameworks: [
        { name: "NIST 800-53 Rev 5", score: 79, status: "In Progress", controls: 1000, passing: 790 },
        { name: "NIST CSF 2.0", score: 76, status: "In Progress", controls: 106, passing: 81 },
        { name: "SOC 2 Type II", score: 91, status: "Compliant", controls: 65, passing: 60 },
        { name: "CMMC 2.0", score: 71, status: "In Progress", controls: 110, passing: 78 },
        { name: "FedRAMP Moderate", score: 74, status: "Assessment", controls: 323, passing: 239 },
        { name: "ISO 27001:2022", score: 82, status: "In Progress", controls: 93, passing: 76 },
        { name: "NIS2 / BSI", score: 68, status: "Remediation", controls: 42, passing: 29 },
      ],
      dbControls: { total, passing, failing, inProgress },
      overallScore: 77,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch compliance summary"); }
});

router.get("/firestorm/live/asset-risk", authMiddleware(), async (_req, res) => {
  try {
    const assets = await db
      .select()
      .from(firestormAssetsTable)
      .orderBy(desc(firestormAssetsTable.riskScore))
      .limit(20);

    const dbAssets = assets.map((a) => ({
      entity: a.name,
      type: a.assetType,
      risk: a.riskScore ?? 0,
      status: "active",
    }));

    const aptEntities = [
      { entity: "WORKSTATION-142", type: "Endpoint", risk: 97, status: "Compromised", events: 3247 },
      { entity: "user.jsmith", type: "Identity", risk: 94, status: "Anomalous", events: 847 },
      { entity: "DC-PROD-03", type: "Server", risk: 88, status: "Under Review", events: 12891 },
      { entity: "192.168.10.45", type: "IP", risk: 79, status: "Suspicious", events: 18341 },
    ];

    sendSuccess(res, {
      aptEntities,
      dbAssets,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch asset risk"); }
});

router.get("/firestorm/soar/playbooks", authMiddleware(), async (_req, res) => {
  try {
    const playbooks = [
      {
        id: "PB-001", name: "Phishing Response", category: "Email Security", severity: "HIGH",
        totalRuns: 47, successRate: 94, avgMttR: "4m 23s", lastRun: "2h ago",
        steps: [
          { step: 1, type: "ACTION", label: "Quarantine Email", auto: true },
          { step: 2, type: "ENRICH", label: "Sandbox Analysis", auto: true },
          { step: 3, type: "ENRICH", label: "Check IOC Reputation", auto: true },
          { step: 4, type: "CONDITION", label: "Severity >= High?", auto: true },
          { step: 5, type: "ACTION", label: "Block Domain/URL", auto: true },
          { step: 6, type: "NOTIFY", label: "Alert Security Team", auto: true },
          { step: 7, type: "ACTION", label: "Reset User Password", auto: false },
        ],
      },
      {
        id: "PB-002", name: "Malware Containment", category: "Endpoint", severity: "CRITICAL",
        totalRuns: 23, successRate: 100, avgMttR: "2m 11s", lastRun: "14h ago",
        steps: [
          { step: 1, type: "ACTION", label: "Isolate Endpoint", auto: true },
          { step: 2, type: "ENRICH", label: "Memory Forensics", auto: true },
          { step: 3, type: "ACTION", label: "Kill Malicious Process", auto: true },
          { step: 4, type: "ACTION", label: "Collect Artifacts", auto: true },
          { step: 5, type: "NOTIFY", label: "Escalate to CISO", auto: false },
        ],
      },
      {
        id: "PB-003", name: "Account Compromise", category: "Identity", severity: "CRITICAL",
        totalRuns: 18, successRate: 89, avgMttR: "8m 47s", lastRun: "3d ago",
        steps: [
          { step: 1, type: "ACTION", label: "Disable Account", auto: true },
          { step: 2, type: "ENRICH", label: "Login History Analysis", auto: true },
          { step: 3, type: "ACTION", label: "Revoke All Sessions", auto: true },
          { step: 4, type: "ACTION", label: "Force MFA Re-enrollment", auto: false },
        ],
      },
    ];

    const stats = {
      totalExecutions: 183,
      automationRate: 78,
      avgMttr: "5m 12s",
      successRate: 91,
      falsePositiveRate: 4.2,
      activePlaybooks: 6,
    };

    sendSuccess(res, { playbooks, stats, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch SOAR playbooks"); }
});

router.post("/firestorm/soar/execute", authMiddleware({ required: true }), requireRole("analyst", "operator", "admin"), async (req, res) => {
  try {
    const { playbookId, alertId, context } = req.body;
    if (!playbookId) {
      res.status(400).json({ error: "playbookId is required" });
      return;
    }

    const executionId = `EXEC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    logger.info({ playbookId, alertId, executionId, userId: req.user?.id }, "SOAR playbook execution triggered");

    sendSuccess(res, {
      executionId,
      playbookId,
      alertId,
      status: "queued",
      startedAt: new Date().toISOString(),
      estimatedCompletionMs: 45000,
      message: `Playbook ${playbookId} execution queued — ID: ${executionId}`,
    });
  } catch (err) { handleRouteError(res, err, "Failed to execute SOAR playbook"); }
});

router.get("/firestorm/stix/objects", authMiddleware(), async (_req, res) => {
  try {
    const stixObjects = [
      {
        id: "indicator--e8098b1e-4f3c-4d7f-a54a-1c97d41fa432",
        type: "indicator",
        name: "APT29 C2 IP Range",
        description: "Known C2 infrastructure associated with APT29 Cozy Bear — observed in SZL Corp intrusion",
        tlp: "TLP:AMBER",
        confidence: 95,
        created: "2024-03-15",
        modified: "2024-03-29",
        pattern: "[ipv4-addr:value = '103.45.67.89']",
        patternType: "stix",
        labels: ["malicious-activity", "apt29"],
        campaign: "Operation SZL Darkwing",
      },
      {
        id: "malware--cc2f7329-a1b2-4c3d-9e4f-5a6b7c8d9e0f",
        type: "malware",
        name: "SUNBURST Backdoor",
        description: "Sophisticated backdoor used by APT29 in supply chain attacks. SolarWinds-related variant detected.",
        tlp: "TLP:AMBER",
        confidence: 97,
        created: "2024-02-01",
        modified: "2024-03-20",
        malwareTypes: ["backdoor", "remote-access-trojan"],
        labels: ["apt29", "supply-chain"],
      },
      {
        id: "attack-pattern--a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        type: "attack-pattern",
        name: "SMB/Windows Admin Shares (T1021.002)",
        description: "Lateral movement via administrative shares using valid credentials",
        tlp: "TLP:GREEN",
        confidence: 99,
        created: "2024-03-10",
        modified: "2024-03-29",
        mitreId: "T1021.002",
        killChainPhases: ["lateral-movement"],
      },
      {
        id: "threat-actor--df88e1a1-b2c3-4d5e-6f78-901234567890",
        type: "threat-actor",
        name: "APT29 / Cozy Bear",
        description: "Russian SVR-linked advanced persistent threat actor. Sophisticated nation-state capability targeting government, defense, and finance sectors.",
        tlp: "TLP:AMBER",
        confidence: 98,
        created: "2023-01-01",
        modified: "2024-03-29",
        aliases: ["Cozy Bear", "The Dukes", "Midnight Blizzard", "Nobelium"],
        sophistication: "advanced",
        resourceLevel: "government",
        primaryMotivation: "espionage",
      },
      {
        id: "campaign--a9f4b2e1-8c2d-4e1a-b7c3-9f2a1e8d4b6c",
        type: "campaign",
        name: "Operation SZL Darkwing",
        description: "Active APT29 campaign targeting SZL Holdings financial systems. Multi-stage intrusion: spearphishing → credential harvest → lateral movement → data exfil attempt.",
        tlp: "TLP:RED",
        confidence: 97,
        firstSeen: "2025-03-12",
        lastSeen: new Date().toISOString().split("T")[0],
        objective: "Financial intelligence exfiltration",
        aliases: ["Darkwing"],
      },
    ];

    sendSuccess(res, { objects: stixObjects, total: stixObjects.length, fetchedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to fetch STIX objects"); }
});

router.post("/firestorm/stix/export", authMiddleware({ required: true }), requireRole("analyst", "operator", "admin"), async (req, res) => {
  try {
    const { objectIds, bundleName } = req.body;
    logger.info({ objectIds, bundleName, userId: req.user?.id }, "STIX bundle export requested");

    const bundle = {
      type: "bundle",
      id: `bundle--${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      spec_version: "2.1",
      name: bundleName ?? "Aegis STIX Export",
      created: new Date().toISOString(),
      objects: objectIds ?? [],
      exportedBy: req.user?.displayName ?? "System",
    };

    sendSuccess(res, { bundle, exportedAt: new Date().toISOString() });
  } catch (err) { handleRouteError(res, err, "Failed to export STIX bundle"); }
});

router.get("/firestorm/taxii/feeds", authMiddleware(), async (_req, res) => {
  try {
    const [collections, indicators, cisaKev] = await Promise.all([
      services.mispTaxii.getCollections(),
      services.mispTaxii.pollIndicators(),
      services.cisa.getKnownExploitedVulnerabilities(10),
    ]);

    const feeds = collections.map((c) => ({
      id: c.id,
      name: c.title,
      url: process.env["TAXII_SERVER_URL"] ?? "misp.threat.feeds",
      type: "TAXII 2.1",
      status: c.canRead ? "active" : "inactive",
      records: indicators.objectsIngested,
      lastSync: indicators.lastPolled,
    }));

    feeds.push(
      { id: "feed-otx", name: "AlienVault OTX", url: "otx.alienvault.com", type: "OTX", status: "active", records: 248341, lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
      { id: "feed-mandiant", name: "Mandiant Advantage", url: "advantage.mandiant.com", type: "Commercial", status: "active", records: 6182, lastSync: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    );

    sendSuccess(res, {
      feeds,
      sharingPartners: feeds.length,
      totalObjects: indicators.objectsIngested + cisaKev.length,
      recentIndicators: indicators.indicators.slice(0, 5),
      cisaKevCount: cisaKev.length,
      adapterStatus: services.mispTaxii.status,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch TAXII feeds"); }
});

router.get("/firestorm/mitre/coverage", authMiddleware(), async (_req, res) => {
  try {
    const coverage = [
      { tactic: "Initial Access", tacticId: "TA0001", techniques: 9, covered: 8, detected: 7 },
      { tactic: "Execution", tacticId: "TA0002", techniques: 12, covered: 10, detected: 9 },
      { tactic: "Persistence", tacticId: "TA0003", techniques: 19, covered: 14, detected: 12 },
      { tactic: "Privilege Escalation", tacticId: "TA0004", techniques: 13, covered: 11, detected: 10 },
      { tactic: "Defense Evasion", tacticId: "TA0005", techniques: 42, covered: 29, detected: 24 },
      { tactic: "Credential Access", tacticId: "TA0006", techniques: 17, covered: 13, detected: 11 },
      { tactic: "Discovery", tacticId: "TA0007", techniques: 31, covered: 18, detected: 14 },
      { tactic: "Lateral Movement", tacticId: "TA0008", techniques: 9, covered: 8, detected: 7 },
      { tactic: "Collection", tacticId: "TA0009", techniques: 17, covered: 11, detected: 9 },
      { tactic: "Exfiltration", tacticId: "TA0010", techniques: 9, covered: 7, detected: 6 },
      { tactic: "Command & Control", tacticId: "TA0011", techniques: 16, covered: 12, detected: 10 },
      { tactic: "Impact", tacticId: "TA0040", techniques: 13, covered: 9, detected: 7 },
    ];

    const totalTechniques = coverage.reduce((a, t) => a + t.techniques, 0);
    const totalCovered = coverage.reduce((a, t) => a + t.covered, 0);
    const overallCoverage = Math.round((totalCovered / totalTechniques) * 100);

    sendSuccess(res, {
      coverage,
      summary: { totalTechniques, totalCovered, overallCoverage, gaps: totalTechniques - totalCovered },
      framework: "MITRE ATT&CK Enterprise v14",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch MITRE coverage"); }
});

export default router;
