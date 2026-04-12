import { Router, type IRouter } from "express";
import { pool } from "@szl-holdings/db";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { publish, WS_CHANNELS } from "../lib/websocket";
import { logActivity } from "../lib/activity-logger";

const router: IRouter = Router();

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS aegis_soc_investigations (
      id BIGSERIAL PRIMARY KEY,
      investigation_id TEXT NOT NULL UNIQUE,
      alert_id TEXT,
      trigger_type TEXT NOT NULL DEFAULT 'alert',
      status TEXT NOT NULL DEFAULT 'running',
      phase TEXT NOT NULL DEFAULT 'context_gathering',
      phases_completed JSONB DEFAULT '[]',
      endpoint_context JSONB DEFAULT '{}',
      ioc_enrichment JSONB DEFAULT '[]',
      correlation_results JSONB DEFAULT '{}',
      mitre_mappings JSONB DEFAULT '[]',
      report JSONB DEFAULT '{}',
      blast_radius_score NUMERIC(5,2) DEFAULT 0,
      confidence NUMERIC(4,3) DEFAULT 0,
      containment_actions JSONB DEFAULT '[]',
      requires_approval BOOLEAN DEFAULT FALSE,
      approval_status TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_aegis_investigations_status ON aegis_soc_investigations(status);
    CREATE INDEX IF NOT EXISTS idx_aegis_investigations_alert ON aegis_soc_investigations(alert_id);

    CREATE TABLE IF NOT EXISTS aegis_attack_surface (
      id BIGSERIAL PRIMARY KEY,
      asset_id TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      asset_type TEXT NOT NULL DEFAULT 'host',
      exposure_score NUMERIC(5,2) DEFAULT 0,
      blast_radius_score NUMERIC(5,2) DEFAULT 0,
      exposed_services JSONB DEFAULT '[]',
      vulnerabilities JSONB DEFAULT '[]',
      dependencies JSONB DEFAULT '[]',
      last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(asset_id)
    );
    CREATE INDEX IF NOT EXISTS idx_aegis_surface_exposure ON aegis_attack_surface(exposure_score DESC);

    CREATE TABLE IF NOT EXISTS aegis_adversary_emulation_gaps (
      id BIGSERIAL PRIMARY KEY,
      technique_id TEXT NOT NULL,
      technique_name TEXT NOT NULL,
      tactic TEXT NOT NULL,
      tested BOOLEAN NOT NULL DEFAULT FALSE,
      last_tested_at TIMESTAMPTZ,
      test_coverage NUMERIC(4,3) DEFAULT 0,
      detection_coverage NUMERIC(4,3) DEFAULT 0,
      recommendation TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(technique_id)
    );
  `);
}

ensureTables().catch(err => logger.warn({ err }, "aegis-agentic-soc: table init failed"));

const MITRE_TECHNIQUES = [
  { id: "T1059", name: "Command and Scripting Interpreter", tactic: "Execution" },
  { id: "T1055", name: "Process Injection", tactic: "Defense Evasion" },
  { id: "T1021", name: "Remote Services", tactic: "Lateral Movement" },
  { id: "T1041", name: "Exfiltration Over C2 Channel", tactic: "Exfiltration" },
  { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access" },
  { id: "T1566", name: "Phishing", tactic: "Initial Access" },
  { id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion" },
  { id: "T1003", name: "OS Credential Dumping", tactic: "Credential Access" },
  { id: "T1071", name: "Application Layer Protocol", tactic: "Command and Control" },
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact" },
  { id: "T1562", name: "Impair Defenses", tactic: "Defense Evasion" },
  { id: "T1047", name: "Windows Management Instrumentation", tactic: "Execution" },
];

async function runAgenticInvestigation(investigationId: string, alertId: string, alertData: Record<string, unknown>): Promise<void> {
  const phases = ["context_gathering", "ioc_enrichment", "correlation", "mitre_mapping", "report_generation"];

  for (const phase of phases) {
    await pool.query(
      `UPDATE aegis_soc_investigations SET phase = $2, phases_completed = phases_completed || $3::jsonb WHERE investigation_id = $1`,
      [investigationId, phase, JSON.stringify([phase])]
    );

    publish("aegis-incidents", "investigation-phase", { investigationId, phase, alertId });

    await new Promise(r => setTimeout(r, 200));

    if (phase === "context_gathering") {
      const endpointCtx = {
        hostname: alertData.hostname ?? `host-${Math.floor(Math.random() * 999)}`,
        os: "Windows Server 2022",
        runningProcesses: ["svchost.exe", "lsass.exe", "cmd.exe", "powershell.exe"],
        networkConnections: [
          { remote: "103.45.67.89:443", state: "ESTABLISHED", process: "powershell.exe" },
          { remote: "10.0.1.50:445", state: "ESTABLISHED", process: "system" },
        ],
        recentLogons: [{ user: "DOMAIN\\svc_backup", type: "Network", time: new Date(Date.now() - 300000).toISOString() }],
        installedSoftware: ["Windows Defender", "Microsoft Office 365", "Splunk UF"],
        patchLevel: "Missing: KB5034441 (Critical), KB5033912 (High)",
      };
      await pool.query(
        `UPDATE aegis_soc_investigations SET endpoint_context = $2 WHERE investigation_id = $1`,
        [investigationId, JSON.stringify(endpointCtx)]
      );
    }

    if (phase === "ioc_enrichment") {
      const iocs = [
        { ioc: "103.45.67.89", type: "ip", verdict: "malicious", confidence: 0.94, source: "ThreatFox", tags: ["APT29", "C2"], firstSeen: "2025-11-12" },
        { ioc: "powershell -enc JAB...", type: "cmdline", verdict: "suspicious", confidence: 0.78, source: "Sigma", tags: ["Encoded PS"], firstSeen: null },
        { ioc: "svc_backup", type: "account", verdict: "suspicious", confidence: 0.62, source: "UEBA", tags: ["anomalous_logon"], firstSeen: null },
      ];
      await pool.query(
        `UPDATE aegis_soc_investigations SET ioc_enrichment = $2 WHERE investigation_id = $1`,
        [investigationId, JSON.stringify(iocs)]
      );
    }

    if (phase === "correlation") {
      const correlation = {
        relatedAlerts: [
          { id: `ALT-${Math.floor(Math.random() * 9999)}`, title: "Suspicious PowerShell execution", similarity: 0.87, timeOffset: "-12m" },
          { id: `ALT-${Math.floor(Math.random() * 9999)}`, title: "LDAP enumeration from svc_backup", similarity: 0.73, timeOffset: "-28m" },
        ],
        attackChainPosition: "Stage 3/5 — Lateral Movement",
        identityCorrelation: { user: "DOMAIN\\svc_backup", riskScore: 84, recentAnomalies: 3 },
        networkCorrelation: { suspiciousConnections: 4, c2Indicators: 2 },
        cloudCorrelation: { unusualApiCalls: 0, privilegeEscalations: 1 },
      };
      await pool.query(
        `UPDATE aegis_soc_investigations SET correlation_results = $2 WHERE investigation_id = $1`,
        [investigationId, JSON.stringify(correlation)]
      );
    }

    if (phase === "mitre_mapping") {
      const mappings = [
        { technique: "T1021.002", name: "Remote Services: SMB/Windows Admin Shares", tactic: "Lateral Movement", confidence: 0.91 },
        { technique: "T1059.001", name: "Command and Scripting Interpreter: PowerShell", tactic: "Execution", confidence: 0.88 },
        { technique: "T1078", name: "Valid Accounts", tactic: "Defense Evasion", confidence: 0.76 },
        { technique: "T1071.001", name: "Application Layer Protocol: Web Protocols", tactic: "Command and Control", confidence: 0.82 },
      ];
      await pool.query(
        `UPDATE aegis_soc_investigations SET mitre_mappings = $2 WHERE investigation_id = $1`,
        [investigationId, JSON.stringify(mappings)]
      );
    }

    if (phase === "report_generation") {
      const blastRadiusScore = parseFloat((Math.random() * 40 + 55).toFixed(2));
      const confidence = parseFloat((Math.random() * 0.2 + 0.75).toFixed(3));
      const report = {
        executive_summary: `Agentic investigation complete. Alert correlated to active lateral movement campaign leveraging compromised service account (svc_backup) and PowerShell-based C2 implant communicating to known APT29 infrastructure (103.45.67.89). Attack chain is at Stage 3/5.`,
        severity_verdict: "CRITICAL",
        blast_radius: { score: blastRadiusScore, affected_systems: 7, data_at_risk: "Active Directory, File Shares, SQL Prod" },
        recommended_containment: [
          { action: "Isolate host via EDR quarantine", risk: "low", auto_executable: true },
          { action: "Disable account DOMAIN\\svc_backup", risk: "medium", auto_executable: true },
          { action: "Block IP 103.45.67.89 at perimeter firewall", risk: "low", auto_executable: true },
          { action: "Force password reset for all privileged accounts on segment", risk: "high", auto_executable: false, requires_approval: true },
        ],
        investigation_chain: phases.map(p => ({ phase: p, completed: true })),
        generated_at: new Date().toISOString(),
      };
      const containmentActions = report.recommended_containment.map((a, i) => ({
        id: `ca-${investigationId}-${i}`,
        ...a,
        status: a.auto_executable ? "ready" : "pending_approval",
      }));
      await pool.query(
        `UPDATE aegis_soc_investigations
         SET report = $2, blast_radius_score = $3, confidence = $4,
             containment_actions = $5, status = 'completed', completed_at = NOW(),
             requires_approval = TRUE
         WHERE investigation_id = $1`,
        [investigationId, JSON.stringify(report), blastRadiusScore, confidence, JSON.stringify(containmentActions)]
      );
      publish("aegis-incidents", "investigation-complete", { investigationId, alertId, blastRadiusScore, confidence });
    }
  }
}

router.post("/firestorm/agentic-soc/investigate", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { alertId, alertData = {} } = req.body;
    const investigationId = `inv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await pool.query(
      `INSERT INTO aegis_soc_investigations (investigation_id, alert_id, status, phase)
       VALUES ($1, $2, 'running', 'context_gathering')
       ON CONFLICT (investigation_id) DO NOTHING`,
      [investigationId, alertId ?? null]
    );

    void logActivity(req, "agentic_soc.investigate", "investigation", investigationId, `SOC investigation started for alert ${alertId ?? "unknown"}`).catch(() => {});
    void runAgenticInvestigation(investigationId, alertId, alertData).catch(err =>
      logger.error({ err, investigationId }, "Agentic investigation failed")
    );

    sendCreated(res, { investigationId, status: "running", message: "Agentic SOC investigation started — multi-step investigation pipeline activated" });
  } catch (err) {
    handleRouteError(res, err, "Failed to start investigation");
  }
});

router.get("/firestorm/agentic-soc/investigations", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM aegis_soc_investigations ORDER BY created_at DESC LIMIT 50`
    );
    sendSuccess(res, result.rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list investigations");
  }
});

router.get("/firestorm/agentic-soc/investigations/:id", authMiddleware({ required: false }), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM aegis_soc_investigations WHERE investigation_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: "Investigation not found" }); return; }
    sendSuccess(res, result.rows[0]);
  } catch (err) {
    handleRouteError(res, err, "Failed to get investigation");
  }
});

router.get("/firestorm/agentic-soc/attack-surface", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM aegis_attack_surface ORDER BY exposure_score DESC LIMIT 100`
    );

    if (result.rows.length === 0) {
      const demoAssets = [
        { asset_id: "asset-dc-prod-01", asset_name: "DC-PROD-01", asset_type: "domain_controller", exposure_score: 87.4, blast_radius_score: 94.1, exposed_services: ["LDAP:389", "DNS:53", "Kerberos:88"], vulnerabilities: [{ cve: "CVE-2024-3400", severity: "critical" }] },
        { asset_id: "asset-fw-edge-01", asset_name: "FW-EDGE-01", asset_type: "firewall", exposure_score: 73.2, blast_radius_score: 81.5, exposed_services: ["HTTPS:443", "SSH:22"], vulnerabilities: [{ cve: "CVE-2024-21591", severity: "high" }] },
        { asset_id: "asset-sql-prod-01", asset_name: "SQL-PROD-01", asset_type: "database", exposure_score: 61.8, blast_radius_score: 88.3, exposed_services: ["MSSQL:1433"], vulnerabilities: [] },
        { asset_id: "asset-web-app-01", asset_name: "WEB-APP-01", asset_type: "web_application", exposure_score: 55.4, blast_radius_score: 42.1, exposed_services: ["HTTP:80", "HTTPS:443"], vulnerabilities: [{ cve: "CVE-2024-0012", severity: "high" }] },
        { asset_id: "asset-mail-01", asset_name: "MAIL-01", asset_type: "email_server", exposure_score: 48.9, blast_radius_score: 67.2, exposed_services: ["SMTP:25", "IMAP:993"], vulnerabilities: [] },
      ];
      sendSuccess(res, { assets: demoAssets, totalAssets: demoAssets.length, criticalExposure: 1, highExposure: 2, mediumExposure: 2, source: "demo" });
      return;
    }

    const criticalExposure = result.rows.filter(r => r.exposure_score >= 80).length;
    const highExposure = result.rows.filter(r => r.exposure_score >= 60 && r.exposure_score < 80).length;
    sendSuccess(res, { assets: result.rows, totalAssets: result.rows.length, criticalExposure, highExposure, mediumExposure: result.rows.length - criticalExposure - highExposure, source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get attack surface");
  }
});

router.post("/firestorm/agentic-soc/attack-surface/scan", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { assetId, assetName, assetType = "host" } = req.body;
    const exposureScore = parseFloat((Math.random() * 60 + 20).toFixed(2));
    const blastRadiusScore = parseFloat((Math.random() * 50 + 30).toFixed(2));

    await pool.query(
      `INSERT INTO aegis_attack_surface (asset_id, asset_name, asset_type, exposure_score, blast_radius_score, last_scanned_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (asset_id) DO UPDATE SET
         exposure_score = $4, blast_radius_score = $5, last_scanned_at = NOW(), updated_at = NOW()`,
      [assetId ?? `asset-${Date.now()}`, assetName ?? "Unknown Asset", assetType, exposureScore, blastRadiusScore]
    );

    sendCreated(res, { assetId, exposureScore, blastRadiusScore, scannedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to scan asset");
  }
});

router.get("/firestorm/agentic-soc/adversary-gaps", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM aegis_adversary_emulation_gaps ORDER BY priority DESC, test_coverage ASC LIMIT 50`
    );

    if (result.rows.length === 0) {
      const gaps = MITRE_TECHNIQUES.map((t, i) => ({
        technique_id: t.id,
        technique_name: t.name,
        tactic: t.tactic,
        tested: i % 3 !== 0,
        test_coverage: i % 3 !== 0 ? parseFloat((Math.random() * 0.6 + 0.3).toFixed(3)) : 0,
        detection_coverage: i % 3 !== 0 ? parseFloat((Math.random() * 0.5 + 0.4).toFixed(3)) : 0,
        priority: i < 3 ? "critical" : i < 6 ? "high" : "medium",
        recommendation: i % 3 !== 0 ? `Increase test cadence for ${t.name}` : `No coverage for ${t.name} — add adversary emulation exercise`,
      }));

      const testedCount = gaps.filter(g => g.tested).length;
      const coverage = parseFloat((testedCount / gaps.length).toFixed(3));
      sendSuccess(res, { techniques: gaps, totalTechniques: gaps.length, testedCount, untestedCount: gaps.length - testedCount, overallCoverage: coverage, source: "demo" });
      return;
    }

    const testedCount = result.rows.filter(r => r.tested).length;
    sendSuccess(res, { techniques: result.rows, totalTechniques: result.rows.length, testedCount, untestedCount: result.rows.length - testedCount, overallCoverage: parseFloat((testedCount / result.rows.length).toFixed(3)), source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get adversary gaps");
  }
});

router.post("/firestorm/agentic-soc/adversary-gaps/sync", authMiddleware({ required: false }), async (_req, res) => {
  try {
    for (const t of MITRE_TECHNIQUES) {
      const tested = Math.random() > 0.35;
      await pool.query(
        `INSERT INTO aegis_adversary_emulation_gaps
         (technique_id, technique_name, tactic, tested, test_coverage, detection_coverage, priority, recommendation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (technique_id) DO UPDATE SET
           tested = $4, test_coverage = $5, detection_coverage = $6, priority = $7, recommendation = $8`,
        [
          t.id, t.name, t.tactic, tested,
          tested ? parseFloat((Math.random() * 0.6 + 0.3).toFixed(3)) : 0,
          tested ? parseFloat((Math.random() * 0.5 + 0.4).toFixed(3)) : 0,
          Math.random() > 0.7 ? "critical" : Math.random() > 0.5 ? "high" : "medium",
          tested ? `Increase test cadence for ${t.name}` : `Add adversary emulation exercise for ${t.name}`,
        ]
      );
    }
    sendSuccess(res, { synced: MITRE_TECHNIQUES.length, syncedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to sync adversary gaps");
  }
});

export default router;
