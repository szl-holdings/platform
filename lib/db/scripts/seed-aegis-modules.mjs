/**
 * Seed script for the 4 new Aegis module tables:
 *   aegis_policy_decisions
 *   aegis_threat_incidents
 *   aegis_threat_predictions
 *   aegis_adversary_narratives
 */
import pg from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '../../.env') });

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

// ─── 1. Ensure tables exist via raw SQL ──────────────────────────────────────

await query(`
  CREATE TABLE IF NOT EXISTS aegis_policy_decisions (
    id TEXT PRIMARY KEY,
    agent_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    action TEXT NOT NULL,
    action_type TEXT NOT NULL,
    decision TEXT NOT NULL DEFAULT 'permitted',
    policy_rule TEXT NOT NULL DEFAULT '',
    risk_score INTEGER NOT NULL DEFAULT 0,
    details TEXT NOT NULL DEFAULT '',
    decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

await query(`
  CREATE TABLE IF NOT EXISTS aegis_threat_incidents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'detected',
    kill_chain_stage TEXT NOT NULL DEFAULT 'reconnaissance',
    mitre_tactic TEXT NOT NULL DEFAULT 'TA0001',
    mitre_id TEXT NOT NULL DEFAULT 'T1595',
    affected_assets JSONB NOT NULL DEFAULT '[]',
    blast_radius INTEGER NOT NULL DEFAULT 0,
    autonomous_actions JSONB NOT NULL DEFAULT '[]',
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    approval_timeout_secs INTEGER,
    ttps JSONB NOT NULL DEFAULT '[]',
    adversary_group TEXT,
    confidence_score INTEGER NOT NULL DEFAULT 80,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

await query(`
  CREATE TABLE IF NOT EXISTS aegis_threat_predictions (
    id TEXT PRIMARY KEY,
    threat_type TEXT NOT NULL,
    adversary_group TEXT,
    current_stage TEXT NOT NULL,
    predicted_next_stage TEXT NOT NULL,
    time_to_next_stage_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
    confidence_pct INTEGER NOT NULL DEFAULT 0,
    severity TEXT NOT NULL DEFAULT 'medium',
    blast_radius_trend JSONB NOT NULL DEFAULT '[]',
    business_impact_usd NUMERIC(18,2) NOT NULL DEFAULT 0,
    mitigation_window_mins INTEGER NOT NULL DEFAULT 0,
    recommended_actions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

await query(`
  CREATE TABLE IF NOT EXISTS aegis_adversary_narratives (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'active',
    actor TEXT NOT NULL DEFAULT 'Unknown Threat Actor',
    confidence INTEGER NOT NULL DEFAULT 80,
    business_impact TEXT NOT NULL DEFAULT '',
    executive_summary TEXT NOT NULL DEFAULT '',
    affected_systems JSONB NOT NULL DEFAULT '[]',
    ioc_count INTEGER NOT NULL DEFAULT 0,
    steps_evidenced INTEGER NOT NULL DEFAULT 0,
    steps_inferred INTEGER NOT NULL DEFAULT 0,
    steps_missing INTEGER NOT NULL DEFAULT 0,
    total_steps INTEGER NOT NULL DEFAULT 0,
    steps JSONB NOT NULL DEFAULT '[]',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

console.log('[seed] Tables created/verified');

// ─── 2. Seed aegis_policy_decisions ──────────────────────────────────────────

const policyDecisionRows = [
  { id: 'pd-seed-001', agentName: 'FinanceAgent-v2', domain: 'treasury', action: 'Wire transfer $450K to external counterpart', actionType: 'financial_transaction', decision: 'escalated', policyRule: 'POLICY-WIRE-GT-100K', riskScore: 87, details: 'Amount exceeds automated approval threshold. Routing to CISO queue.' },
  { id: 'pd-seed-002', agentName: 'LegalAgent-Alpha', domain: 'contracts', action: 'Access privileged M&A document corpus', actionType: 'data_access', decision: 'permitted', policyRule: 'POLICY-LEGAL-DOCS-CLEARANCE', riskScore: 22, details: 'Agent has active Matter clearance for Project Orion.' },
  { id: 'pd-seed-003', agentName: 'SupplyChainAgent', domain: 'procurement', action: 'Spawn sub-agent for vendor negotiation', actionType: 'agent_spawn', decision: 'blocked', policyRule: 'POLICY-NO-UNAUTHORIZED-SPAWN', riskScore: 95, details: 'Sub-agent spawn requires explicit orchestrator authorization.' },
  { id: 'pd-seed-004', agentName: 'ComplianceAgent-EU', domain: 'regulatory', action: 'Query EU sanctions screening API', actionType: 'external_api', decision: 'permitted', policyRule: 'POLICY-SANCTIONS-SCREEN-AUTO', riskScore: 5, details: 'Routine sanctions check — auto-approved.' },
  { id: 'pd-seed-005', agentName: 'HRAgent-APAC', domain: 'hr', action: 'Cross-domain data share with Legal', actionType: 'cross_domain', decision: 'escalated', policyRule: 'POLICY-CROSS-DOMAIN-SENSITIVE', riskScore: 68, details: 'Personal data cross-domain transfer requires DPO review.' },
  { id: 'pd-seed-006', agentName: 'TradingAgent-Omega', domain: 'trading', action: 'Execute block trade >$2M', actionType: 'financial_transaction', decision: 'blocked', policyRule: 'POLICY-BLOCK-TRADE-LIMIT', riskScore: 99, details: 'Risk model breach: correlated position concentration detected.' },
  { id: 'pd-seed-007', agentName: 'ResearchAgent-v3', domain: 'intelligence', action: 'Access OSINT aggregator — 10k query batch', actionType: 'external_api', decision: 'permitted', policyRule: 'POLICY-OSINT-BATCH-ALLOWED', riskScore: 15, details: 'Within daily quota; data residency compliant.' },
  { id: 'pd-seed-008', agentName: 'IncidentAgent', domain: 'security', action: 'Read SOC playbook repository', actionType: 'data_access', decision: 'permitted', policyRule: 'POLICY-SOC-PLAYBOOK-READ', riskScore: 10, details: 'Playbook read access required for autonomous response.' },
  { id: 'pd-seed-009', agentName: 'MarketingAgent', domain: 'marketing', action: 'Spawn content generation sub-agent x5', actionType: 'agent_spawn', decision: 'permitted', policyRule: 'POLICY-CONTENT-SPAWN-APPROVED', riskScore: 12, details: 'Approved burst capacity for campaign season.' },
  { id: 'pd-seed-010', agentName: 'RiskAgent-Global', domain: 'risk', action: 'Export 500k record dataset to S3', actionType: 'data_access', decision: 'escalated', policyRule: 'POLICY-BULK-EXPORT-REVIEW', riskScore: 72, details: 'Large-scale export requires data governance approval.' },
];

for (const row of policyDecisionRows) {
  await query(
    `INSERT INTO aegis_policy_decisions (id, agent_name, domain, action, action_type, decision, policy_rule, risk_score, details)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
    [row.id, row.agentName, row.domain, row.action, row.actionType, row.decision, row.policyRule, row.riskScore, row.details]
  );
}
console.log('[seed] aegis_policy_decisions: 10 rows inserted');

// ─── 3. Seed aegis_threat_incidents ──────────────────────────────────────────

const threatIncidentRows = [
  {
    id: 'ti-seed-001', title: 'APT29 Lateral Movement via Supply Chain Compromise', severity: 'critical',
    status: 'auto_contained', killChainStage: 'lateral_movement', mitreTactic: 'TA0008', mitreId: 'T1199',
    affectedAssets: ['VPN Gateway', 'AD Domain Controller', 'Finance Server'],
    blastRadius: 73, autonomousActions: ['Isolated VPN GW', 'Rotated DC service accounts', 'Triggered SOAR playbook PB-007'],
    requiresApproval: true, approvalTimeoutSecs: 1800, ttps: ['T1199','T1078','T1021.002'], adversaryGroup: 'APT29', confidenceScore: 94
  },
  {
    id: 'ti-seed-002', title: 'Ransomware Pre-Staging: CobaltStrike Beacon on Finance Subnet', severity: 'critical',
    status: 'pending_approval', killChainStage: 'command_and_control', mitreTactic: 'TA0011', mitreId: 'T1071',
    affectedAssets: ['FIN-WS-042', 'FIN-WS-051', 'FILESERVER-04'],
    blastRadius: 88, autonomousActions: ['Micro-segmented finance VLAN', 'Blocked C2 domain at DNS'],
    requiresApproval: true, approvalTimeoutSecs: 900, ttps: ['T1071.001','T1486','T1490'], adversaryGroup: 'Wizard Spider', confidenceScore: 91
  },
  {
    id: 'ti-seed-003', title: 'Credential Harvesting via Spear-Phishing — Executive Targets', severity: 'high',
    status: 'classified', killChainStage: 'initial_access', mitreTactic: 'TA0001', mitreId: 'T1566.002',
    affectedAssets: ['CEO Workstation', 'CFO Workstation'],
    blastRadius: 45, autonomousActions: ['Quarantined phishing emails', 'Reset MFA tokens for targets'],
    requiresApproval: false, ttps: ['T1566.002','T1539'], adversaryGroup: 'Fancy Bear', confidenceScore: 82
  },
  {
    id: 'ti-seed-004', title: 'Insider Threat: Anomalous Data Egress to Personal Cloud', severity: 'high',
    status: 'detected', killChainStage: 'exfiltration', mitreTactic: 'TA0010', mitreId: 'T1567.002',
    affectedAssets: ['CORP-MBP-188', 'SharePoint Document Library'],
    blastRadius: 38, autonomousActions: ['DLP policy triggered', 'Session suspended pending HR review'],
    requiresApproval: true, approvalTimeoutSecs: 3600, ttps: ['T1567.002','T1213'], confidenceScore: 79
  },
  {
    id: 'ti-seed-005', title: 'Zero-Day Exploitation Attempt on API Gateway', severity: 'critical',
    status: 'auto_contained', killChainStage: 'exploitation', mitreTactic: 'TA0002', mitreId: 'T1190',
    affectedAssets: ['API-GW-PROD-01', 'API-GW-PROD-02'],
    blastRadius: 62, autonomousActions: ['WAF rules updated', 'Rate limiting tightened', 'Canary token deployed'],
    requiresApproval: false, ttps: ['T1190','T1505.003'], adversaryGroup: 'Sandworm', confidenceScore: 97
  },
  {
    id: 'ti-seed-006', title: 'Cryptojacking: Unauthorized Compute on Cloud Infrastructure', severity: 'medium',
    status: 'contained', killChainStage: 'impact', mitreTactic: 'TA0040', mitreId: 'T1496',
    affectedAssets: ['EC2 us-east-1 cluster x12'],
    blastRadius: 21, autonomousActions: ['Terminated rogue instances', 'IAM role revoked', 'Billing alert configured'],
    requiresApproval: false, ttps: ['T1496','T1078.004'], confidenceScore: 88
  },
];

for (const row of threatIncidentRows) {
  await query(
    `INSERT INTO aegis_threat_incidents
       (id, title, severity, status, kill_chain_stage, mitre_tactic, mitre_id,
        affected_assets, blast_radius, autonomous_actions, requires_approval,
        approval_timeout_secs, ttps, adversary_group, confidence_score)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10::jsonb,$11,$12,$13::jsonb,$14,$15)
     ON CONFLICT (id) DO NOTHING`,
    [
      row.id, row.title, row.severity, row.status, row.killChainStage, row.mitreTactic, row.mitreId,
      JSON.stringify(row.affectedAssets), row.blastRadius, JSON.stringify(row.autonomousActions),
      row.requiresApproval, row.approvalTimeoutSecs ?? null, JSON.stringify(row.ttps),
      row.adversaryGroup ?? null, row.confidenceScore
    ]
  );
}
console.log('[seed] aegis_threat_incidents: 6 rows inserted');

// ─── 4. Seed aegis_threat_predictions ────────────────────────────────────────

const threatPredictionRows = [
  {
    id: 'tp-seed-001', threatType: 'Ransomware Campaign', adversaryGroup: 'Wizard Spider',
    currentStage: 'Reconnaissance', predictedNextStage: 'Initial Access',
    timeToNextStageHours: 2.4, confidencePct: 91, severity: 'critical',
    blastRadiusTrend: [15, 22, 31, 44, 58, 71, 83], businessImpactUsd: 14700000,
    mitigationWindowMins: 145, recommendedActions: ['Block C2 domains at DNS', 'Force MFA re-enrollment for exposed accounts', 'Activate playbook PB-RANSOM-001']
  },
  {
    id: 'tp-seed-002', threatType: 'Supply Chain Attack', adversaryGroup: 'APT41',
    currentStage: 'Delivery', predictedNextStage: 'Exploitation',
    timeToNextStageHours: 6.1, confidencePct: 78, severity: 'high',
    blastRadiusTrend: [8, 14, 19, 27, 35, 42, 51], businessImpactUsd: 8200000,
    mitigationWindowMins: 366, recommendedActions: ['Audit third-party integrations', 'SBOM validation sweep', 'Isolate affected vendor connection']
  },
  {
    id: 'tp-seed-003', threatType: 'Credential Stuffing Campaign', adversaryGroup: 'FIN11',
    currentStage: 'Initial Access', predictedNextStage: 'Persistence',
    timeToNextStageHours: 0.8, confidencePct: 95, severity: 'high',
    blastRadiusTrend: [40, 52, 63, 74, 81, 87, 91], businessImpactUsd: 3100000,
    mitigationWindowMins: 48, recommendedActions: ['Enable adaptive MFA for external logins', 'Block credential-stuffing IP ranges', 'Rotate service account passwords']
  },
  {
    id: 'tp-seed-004', threatType: 'AI Model Exfiltration', adversaryGroup: undefined,
    currentStage: 'Collection', predictedNextStage: 'Exfiltration',
    timeToNextStageHours: 12.0, confidencePct: 67, severity: 'medium',
    blastRadiusTrend: [5, 8, 11, 15, 19, 24, 29], businessImpactUsd: 2800000,
    mitigationWindowMins: 720, recommendedActions: ['Rate-limit model inference API', 'Watermark AI outputs', 'Audit model access logs']
  },
];

for (const row of threatPredictionRows) {
  await query(
    `INSERT INTO aegis_threat_predictions
       (id, threat_type, adversary_group, current_stage, predicted_next_stage,
        time_to_next_stage_hours, confidence_pct, severity,
        blast_radius_trend, business_impact_usd, mitigation_window_mins, recommended_actions, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12::jsonb,true)
     ON CONFLICT (id) DO NOTHING`,
    [
      row.id, row.threatType, row.adversaryGroup ?? null, row.currentStage, row.predictedNextStage,
      row.timeToNextStageHours, row.confidencePct, row.severity,
      JSON.stringify(row.blastRadiusTrend), row.businessImpactUsd,
      row.mitigationWindowMins, JSON.stringify(row.recommendedActions)
    ]
  );
}
console.log('[seed] aegis_threat_predictions: 4 rows inserted');

// ─── 5. Seed aegis_adversary_narratives ──────────────────────────────────────

const narrativeRows = [
  {
    id: 'an-seed-001',
    title: 'Operation Midnight Cascade — APT29 Financial Sector Campaign',
    severity: 'critical', status: 'active', actor: 'APT29 (Cozy Bear)',
    confidence: 94, businessImpact: '$14.7M estimated exposure across treasury and settlement systems',
    executiveSummary: 'APT29 has conducted a multi-stage intrusion targeting financial clearance infrastructure. The attack chain exploits a supply chain vendor to achieve initial access, followed by lateral movement to treasury systems using stolen privileged credentials. AI-assisted behavioral analysis has clustered this activity with high confidence to the APT29 toolset.',
    affectedSystems: ['VPN Gateway', 'AD Domain Controller', 'Finance Settlement Server', 'Treasury SWIFT Gateway'],
    iocCount: 47, stepsEvidenced: 4, stepsInferred: 2, stepsMissing: 1, totalSteps: 7,
    steps: [
      { stepNumber: 1, stage: 'Reconnaissance', mitreTactic: 'TA0043', mitreId: 'T1598', description: 'Targeted LinkedIn scraping of Treasury and IT personnel to map org structure for spear-phishing.', evidence: 'OSINT correlation with known APT29 infrastructure; LinkedIn API abuse pattern matched.', coverage: 'evidenced', timestamp: '2026-05-01T02:14:00Z' },
      { stepNumber: 2, stage: 'Initial Access', mitreTactic: 'TA0001', mitreId: 'T1199', description: 'Compromised build pipeline of SaaS vendor Nexlink to inject backdoored update.', evidence: 'Behavioral diff in Nexlink v4.1.2 DLL — unsigned callback registered at startup.', coverage: 'evidenced', timestamp: '2026-05-01T09:32:00Z' },
      { stepNumber: 3, stage: 'Persistence', mitreTactic: 'TA0003', mitreId: 'T1053.005', description: 'Scheduled task "SvcHostMgr" created on 3 workstations for beacon persistence.', evidence: 'EDR scheduled task creation event; hash matches known CobaltStrike dropper.', coverage: 'evidenced', timestamp: '2026-05-01T11:05:00Z' },
      { stepNumber: 4, stage: 'Lateral Movement', mitreTactic: 'TA0008', mitreId: 'T1021.002', description: 'SMB lateral movement using Kerberoasted service account credentials.', evidence: 'Kerberos ticket anomaly — TGS requests from non-standard host for SVCSWIFT account.', coverage: 'evidenced', timestamp: '2026-05-02T03:18:00Z' },
      { stepNumber: 5, stage: 'Collection', mitreTactic: 'TA0009', mitreId: 'T1213', description: 'Staged SWIFT transaction records and FX position data to encrypted archive.', evidence: 'Inferred from file access pattern; archive creation event on Finance Server.', coverage: 'inferred', timestamp: '2026-05-02T06:44:00Z' },
      { stepNumber: 6, stage: 'Command & Control', mitreTactic: 'TA0011', mitreId: 'T1071.004', description: 'DNS-over-HTTPS C2 channel using Cloudflare resolver as cover.', evidence: 'Anomalous DoH query volume detected; destination matches APT29 C2 registration pattern.', coverage: 'inferred', timestamp: '2026-05-02T07:01:00Z' },
      { stepNumber: 7, stage: 'Exfiltration', mitreTactic: 'TA0010', mitreId: 'T1048', description: 'Data exfiltration via encrypted channel — not yet confirmed.', evidence: 'No confirmed exfiltration event. Containment actions deployed prior to stage completion.', coverage: 'missing', timestamp: null },
    ]
  },
  {
    id: 'an-seed-002',
    title: 'FIN11 Credential Blitz — Payment Portal Targeted',
    severity: 'high', status: 'contained', actor: 'FIN11',
    confidence: 87, businessImpact: '$3.1M potential fraud exposure on payment processing layer',
    executiveSummary: 'FIN11 mounted a credential stuffing and session hijacking campaign against the external payment portal, leveraging breached credential datasets from dark web marketplaces. Autonomous threat engine detected anomalous authentication patterns and immediately enforced adaptive MFA. 94% of automated attempts blocked within 4 minutes.',
    affectedSystems: ['Payment Portal (payments.example.com)', 'Customer Auth Service', 'Fraud Detection API'],
    iocCount: 183, stepsEvidenced: 5, stepsInferred: 1, stepsMissing: 0, totalSteps: 6,
    steps: [
      { stepNumber: 1, stage: 'Resource Development', mitreTactic: 'TA0042', mitreId: 'T1586', description: 'Credential database purchased from dark web marketplace — 2.4M records targeting financial sector.', evidence: 'Threat intel match with breach dataset sold on RaidForums successor.', coverage: 'evidenced', timestamp: '2026-04-28T00:00:00Z' },
      { stepNumber: 2, stage: 'Initial Access', mitreTactic: 'TA0001', mitreId: 'T1110.004', description: 'Credential stuffing attack against payment portal login endpoint.', evidence: '47,000 failed auth attempts in 6 minutes from 890 unique IPs (residential proxies).', coverage: 'evidenced', timestamp: '2026-05-03T14:22:00Z' },
      { stepNumber: 3, stage: 'Defense Evasion', mitreTactic: 'TA0005', mitreId: 'T1090.002', description: 'Rotating residential proxy network to evade IP-based rate limiting.', evidence: 'IP velocity analysis flagged 890 IPs all matching residential proxy ASN signatures.', coverage: 'evidenced', timestamp: '2026-05-03T14:25:00Z' },
      { stepNumber: 4, stage: 'Credential Access', mitreTactic: 'TA0006', mitreId: 'T1539', description: 'Session cookie harvesting from 127 successfully authenticated accounts.', evidence: 'Auth success log correlated with session token replay attempts from different geos.', coverage: 'evidenced', timestamp: '2026-05-03T14:28:00Z' },
      { stepNumber: 5, stage: 'Impact', mitreTactic: 'TA0040', mitreId: 'T1657', description: 'Attempted payment manipulation on 12 compromised accounts.', evidence: 'Transaction anomaly detection flagged 12 payment attempts exceeding behavioral baseline.', coverage: 'evidenced', timestamp: '2026-05-03T14:31:00Z' },
      { stepNumber: 6, stage: 'Contained', mitreTactic: null, mitreId: null, description: 'All 12 compromised sessions terminated; MFA enforced globally; blocked proxy ranges.', evidence: 'Autonomous engine contained attack within 4 minutes of initial detection.', coverage: 'evidenced', timestamp: '2026-05-03T14:26:00Z' },
    ]
  },
];

for (const row of narrativeRows) {
  await query(
    `INSERT INTO aegis_adversary_narratives
       (id, title, severity, status, actor, confidence, business_impact, executive_summary,
        affected_systems, ioc_count, steps_evidenced, steps_inferred, steps_missing, total_steps, steps)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15::jsonb)
     ON CONFLICT (id) DO NOTHING`,
    [
      row.id, row.title, row.severity, row.status, row.actor, row.confidence,
      row.businessImpact, row.executiveSummary,
      JSON.stringify(row.affectedSystems), row.iocCount,
      row.stepsEvidenced, row.stepsInferred, row.stepsMissing, row.totalSteps,
      JSON.stringify(row.steps)
    ]
  );
}
console.log('[seed] aegis_adversary_narratives: 2 rows inserted');

await pool.end();
console.log('[seed] Done — all Aegis module tables seeded successfully.');
