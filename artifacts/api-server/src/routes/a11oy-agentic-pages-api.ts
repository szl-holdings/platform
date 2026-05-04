import { Router, type Response } from 'express';

const router = Router();
const now = () => new Date().toISOString();

function ok<T>(res: Response, data: T) {
  res.json({
    ok: true,
    data,
    meta: { timestamp: now(), mode: 'seed' },
  });
}

router.get('/pages/a2a', (_req, res) => {
  ok(res, {
    agentCards: [
      { id: 'ac-cascade', name: 'Cascade Navigator', description: 'Maritime domain specialist — ETA monitoring, port cost analysis, route optimization, demurrage calculation.', vertical: 'vessels-maritime', version: '2.4.1', capabilities: ['eta-monitoring', 'port-cost-analysis', 'route-optimization', 'demurrage-calc'], inputModes: ['application/json', 'text/plain'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS', 'DPoP'], endpoint: 'a11oy://agents/cascade-navigator', status: 'registered', trustScore: 970, origin: 'internal' },
      { id: 'ac-counsel', name: 'Counsel Sentinel', description: 'Legal domain specialist — deadline tracking, document status, matter monitoring, risk scoring.', vertical: 'prism-counsel', version: '2.3.0', capabilities: ['deadline-tracking', 'doc-review', 'matter-monitoring', 'risk-scoring'], inputModes: ['application/json', 'text/plain'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS', 'DPoP'], endpoint: 'a11oy://agents/counsel-sentinel', status: 'registered', trustScore: 990, origin: 'internal' },
      { id: 'ac-guardian', name: 'Guardian', description: 'Defense domain specialist — threat intelligence, posture assessment, incident triage, perimeter hardening.', vertical: 'aegis-defense', version: '3.1.0', capabilities: ['threat-intel', 'posture-assessment', 'incident-triage', 'perimeter-hardening'], inputModes: ['application/json', 'application/stix+json'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS', 'DPoP', 'SPIFFE'], endpoint: 'a11oy://agents/guardian', status: 'registered', trustScore: 990, origin: 'internal' },
      { id: 'ac-pipeline', name: 'Pipeline Oracle', description: 'Revenue domain specialist — pipeline analysis, deal scoring, forecast modeling, CRM monitoring.', vertical: 'lyte-revenue', version: '2.1.0', capabilities: ['pipeline-analysis', 'deal-scoring', 'forecast-modeling', 'churn-prediction'], inputModes: ['application/json'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS', 'DPoP'], endpoint: 'a11oy://agents/pipeline-oracle', status: 'registered', trustScore: 910, origin: 'internal' },
      { id: 'ac-terra', name: 'DOMAINE Analyst', description: 'Real estate domain specialist — cap rate tracking, portfolio analysis, valuation modeling.', vertical: 'terra-real-estate', version: '1.8.2', capabilities: ['cap-rate-tracking', 'portfolio-analysis', 'valuation-modeling', 'comp-analysis'], inputModes: ['application/json'], outputModes: ['application/json', 'application/a11oy-proof+json'], authSchemes: ['mTLS'], endpoint: 'a11oy://agents/terra-analyst', status: 'registered', trustScore: 880, origin: 'internal' },
      { id: 'ac-ext-visa', name: 'Visa Risk Agent', description: 'External financial risk assessment agent — transaction scoring, fraud pattern detection.', vertical: 'finance', version: '1.0.0', capabilities: ['txn-risk-scoring', 'fraud-detection', 'merchant-risk'], inputModes: ['application/json'], outputModes: ['application/json'], authSchemes: ['OAuth2', 'mTLS'], endpoint: 'https://agents.visa.com/risk-agent/v1', status: 'discovered', trustScore: 720, origin: 'external' },
      { id: 'ac-ext-mandiant', name: 'Mandiant Threat Intel', description: 'External threat intelligence agent — IOC enrichment, threat actor profiling, campaign attribution.', vertical: 'security', version: '2.1.0', capabilities: ['ioc-enrichment', 'threat-profiling', 'campaign-attribution'], inputModes: ['application/stix+json', 'application/json'], outputModes: ['application/stix+json'], authSchemes: ['OAuth2', 'API-Key'], endpoint: 'https://api.mandiant.com/a2a/v1', status: 'negotiating', trustScore: 810, origin: 'external' },
    ],
    tasks: [
      { id: 'task-001', from: 'Cascade Navigator', to: 'Guardian', action: 'Verify vessel sanctions clearance for MV Cascade', status: 'completed', submittedAt: '2026-04-25T04:00:00Z', completedAt: '2026-04-25T04:02:12Z', proofHash: 'sha256:a1b2c3' },
      { id: 'task-002', from: 'Pipeline Oracle', to: 'Counsel Sentinel', action: 'Review contract terms for Meridian renewal', status: 'working', submittedAt: '2026-04-25T09:30:00Z', completedAt: null, proofHash: null },
      { id: 'task-003', from: 'Guardian', to: 'Mandiant Threat Intel', action: 'Enrich IOC set for TG-Ember campaign', status: 'input-required', submittedAt: '2026-04-25T18:45:00Z', completedAt: null, proofHash: null },
      { id: 'task-004', from: 'DOMAINE Analyst', to: 'Pipeline Oracle', action: 'Cross-reference port-adjacent asset impact on Q2 pipeline', status: 'completed', submittedAt: '2026-04-24T14:00:00Z', completedAt: '2026-04-24T14:18:30Z', proofHash: 'sha256:d4e5f6' },
      { id: 'task-005', from: 'Counsel Sentinel', to: 'Cascade Navigator', action: 'Provide demurrage clause interpretation for Talbot matter', status: 'completed', submittedAt: '2026-04-24T08:10:00Z', completedAt: '2026-04-24T08:14:55Z', proofHash: 'sha256:e5f6a7' },
      { id: 'task-006', from: 'Visa Risk Agent', to: 'Guardian', action: 'Correlate merchant risk scores with TG-Ember TTPs', status: 'submitted', submittedAt: '2026-04-25T20:00:00Z', completedAt: null, proofHash: null },
    ],
  });
});

router.get('/pages/identity', (_req, res) => {
  ok(res, {
    agents: [
      {
        id: 'aid-cascade', name: 'Cascade Navigator', spiffeUri: 'spiffe://a11oy.szl/agents/cascade-navigator', certFingerprint: 'SHA256:9f:3a:b2:c1:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6', certIssued: '2026-03-01T00:00:00Z', certExpires: '2027-03-01T00:00:00Z', trustScore: 970, trustTier: 'sovereign', behaviorBaseline: 94.2, currentBehavior: 96.8, driftPct: 0.4, driftStatus: 'stable',
        capabilities: ['eta-monitoring', 'port-cost-analysis', 'route-optimization', 'demurrage-calc'],
        permissions: [
          { action: 'read:vessel-data', scope: 'all-vessels', granted: true },
          { action: 'write:voyage-plan', scope: 'assigned-vessels', granted: true },
          { action: 'execute:port-standby', scope: 'with-approval', granted: true },
          { action: 'read:financial-data', scope: 'maritime-only', granted: true },
          { action: 'execute:trade', scope: 'any', granted: false },
        ],
        vertical: 'vessels-maritime', riskClassification: 'High', lastActivity: '2026-04-25T10:34:00Z',
      },
      {
        id: 'aid-counsel', name: 'Counsel Sentinel', spiffeUri: 'spiffe://a11oy.szl/agents/counsel-sentinel', certFingerprint: 'SHA256:a1:b2:c3:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7', certIssued: '2026-02-15T00:00:00Z', certExpires: '2027-02-15T00:00:00Z', trustScore: 990, trustTier: 'sovereign', behaviorBaseline: 97.4, currentBehavior: 98.1, driftPct: 0.2, driftStatus: 'stable',
        capabilities: ['deadline-tracking', 'doc-review', 'matter-monitoring', 'risk-scoring'],
        permissions: [
          { action: 'read:matter-records', scope: 'all-matters', granted: true },
          { action: 'write:matter-status', scope: 'assigned-matters', granted: true },
          { action: 'execute:escalation', scope: 'with-approval', granted: true },
          { action: 'read:privileged-docs', scope: 'with-privilege-gate', granted: true },
          { action: 'execute:filing', scope: 'any', granted: false },
        ],
        vertical: 'prism-counsel', riskClassification: 'Critical', lastActivity: '2026-04-25T08:10:00Z',
      },
      {
        id: 'aid-guardian', name: 'Guardian', spiffeUri: 'spiffe://a11oy.szl/agents/guardian', certFingerprint: 'SHA256:b2:c3:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8', certIssued: '2026-01-01T00:00:00Z', certExpires: '2027-01-01T00:00:00Z', trustScore: 990, trustTier: 'sovereign', behaviorBaseline: 98.1, currentBehavior: 99.0, driftPct: 0.1, driftStatus: 'stable',
        capabilities: ['threat-intel', 'posture-assessment', 'incident-triage', 'perimeter-hardening'],
        permissions: [
          { action: 'read:threat-feeds', scope: 'all-sources', granted: true },
          { action: 'write:firewall-rules', scope: 'perimeter-only', granted: true },
          { action: 'execute:auto-escalate', scope: 'up-to-HIGH', granted: true },
          { action: 'execute:isolate-host', scope: 'with-ciso-approval', granted: true },
          { action: 'read:classified', scope: 'any', granted: false },
        ],
        vertical: 'aegis-defense', riskClassification: 'Critical', lastActivity: '2026-04-25T18:56:00Z',
      },
      {
        id: 'aid-pipeline', name: 'Pipeline Oracle', spiffeUri: 'spiffe://a11oy.szl/agents/pipeline-oracle', certFingerprint: 'SHA256:c3:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8:f9', certIssued: '2026-03-15T00:00:00Z', certExpires: '2027-03-15T00:00:00Z', trustScore: 910, trustTier: 'sovereign', behaviorBaseline: 88.6, currentBehavior: 91.2, driftPct: 1.8, driftStatus: 'watch',
        capabilities: ['pipeline-analysis', 'deal-scoring', 'forecast-modeling', 'churn-prediction'],
        permissions: [
          { action: 'read:crm-data', scope: 'all-accounts', granted: true },
          { action: 'write:crm-activity', scope: 'assigned-accounts', granted: true },
          { action: 'execute:outreach', scope: 'with-approval', granted: true },
          { action: 'execute:deal-close', scope: 'any', granted: false },
          { action: 'write:bulk-email', scope: 'any', granted: false },
        ],
        vertical: 'lyte-revenue', riskClassification: 'Medium', lastActivity: '2026-04-25T09:25:00Z',
      },
      {
        id: 'aid-terra', name: 'DOMAINE Analyst', spiffeUri: 'spiffe://a11oy.szl/agents/terra-analyst', certFingerprint: 'SHA256:d4:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8:f9:a1', certIssued: '2026-04-01T00:00:00Z', certExpires: '2027-04-01T00:00:00Z', trustScore: 880, trustTier: 'trusted', behaviorBaseline: 85.0, currentBehavior: 88.4, driftPct: 2.8, driftStatus: 'watch',
        capabilities: ['cap-rate-tracking', 'portfolio-analysis', 'valuation-modeling', 'comp-analysis'],
        permissions: [
          { action: 'read:property-data', scope: 'portfolio-only', granted: true },
          { action: 'write:valuation-model', scope: 'assigned-portfolios', granted: true },
          { action: 'execute:loi-draft', scope: 'with-approval', granted: true },
          { action: 'execute:acquisition', scope: 'any', granted: false },
        ],
        vertical: 'terra-real-estate', riskClassification: 'Medium', lastActivity: '2026-04-25T16:45:00Z',
      },
      {
        id: 'aid-watchdog', name: 'Fabric Watchdog', spiffeUri: 'spiffe://a11oy.szl/agents/fabric-watchdog', certFingerprint: 'SHA256:e5:f6:a7:b8:c9:d1:e2:f3:a4:b5:c6:d7:e8:f9:a1:b2', certIssued: '2026-01-01T00:00:00Z', certExpires: '2027-01-01T00:00:00Z', trustScore: 1000, trustTier: 'sovereign', behaviorBaseline: 100.0, currentBehavior: 100.0, driftPct: 0.0, driftStatus: 'stable',
        capabilities: ['health-probe', 'proof-verification', 'layer-monitoring', 'latency-tracking'],
        permissions: [
          { action: 'read:all-metrics', scope: 'fabric-layers', granted: true },
          { action: 'execute:health-check', scope: 'all-layers', granted: true },
          { action: 'write:any', scope: 'any', granted: false },
        ],
        vertical: 'alloy-core', riskClassification: 'Low', lastActivity: '2026-04-26T10:00:00Z',
      },
    ],
    trustEdges: [
      { from: 'aid-cascade', to: 'aid-guardian', relation: 'sanctions-verification', strength: 0.95 },
      { from: 'aid-cascade', to: 'aid-counsel', relation: 'demurrage-clause-interp', strength: 0.88 },
      { from: 'aid-counsel', to: 'aid-guardian', relation: 'privilege-gate-review', strength: 0.82 },
      { from: 'aid-pipeline', to: 'aid-counsel', relation: 'contract-review', strength: 0.78 },
      { from: 'aid-pipeline', to: 'aid-terra', relation: 'cross-vertical-pipeline', strength: 0.72 },
      { from: 'aid-terra', to: 'aid-cascade', relation: 'port-adjacent-asset-impact', strength: 0.65 },
      { from: 'aid-watchdog', to: 'aid-cascade', relation: 'health-monitoring', strength: 0.99 },
      { from: 'aid-watchdog', to: 'aid-guardian', relation: 'health-monitoring', strength: 0.99 },
      { from: 'aid-watchdog', to: 'aid-counsel', relation: 'health-monitoring', strength: 0.99 },
      { from: 'aid-watchdog', to: 'aid-pipeline', relation: 'health-monitoring', strength: 0.97 },
      { from: 'aid-watchdog', to: 'aid-terra', relation: 'health-monitoring', strength: 0.97 },
      { from: 'aid-guardian', to: 'aid-cascade', relation: 'threat-intel-feed', strength: 0.91 },
    ],
  });
});

router.get('/pages/optimization', (_req, res) => {
  ok(res, {
    targets: [
      { id: 'opt-routing', name: 'Routing Accuracy', category: 'Performance', currentValue: 94.2, baselineValue: 88.0, targetValue: 97.0, unit: '%', delta: 6.2, locked: false, history: [88.0, 89.1, 90.3, 91.2, 92.0, 93.1, 94.2] },
      { id: 'opt-governance', name: 'Governance Precision', category: 'Safety', currentValue: 97.8, baselineValue: 94.0, targetValue: 99.0, unit: '%', delta: 3.8, locked: false, history: [94.0, 94.8, 95.5, 96.2, 96.9, 97.4, 97.8] },
      { id: 'opt-latency', name: 'End-to-End Latency', category: 'Performance', currentValue: 840, baselineValue: 1200, targetValue: 600, unit: 'ms', delta: -360, locked: false, history: [1200, 1120, 1040, 960, 900, 860, 840] },
      { id: 'opt-false-pos', name: 'False Positive Rate', category: 'Accuracy', currentValue: 2.1, baselineValue: 8.4, targetValue: 1.0, unit: '%', delta: -6.3, locked: true, history: [8.4, 6.8, 5.2, 4.1, 3.2, 2.6, 2.1] },
      { id: 'opt-proof-time', name: 'Proof Chain Time', category: 'Performance', currentValue: 4.2, baselineValue: 12.0, targetValue: 2.0, unit: 's', delta: -7.8, locked: false, history: [12.0, 10.2, 8.4, 7.0, 5.8, 4.8, 4.2] },
      { id: 'opt-resource', name: 'Resource Efficiency', category: 'Cost', currentValue: 89.4, baselineValue: 72.0, targetValue: 95.0, unit: '%', delta: 17.4, locked: false, history: [72.0, 75.8, 79.2, 82.6, 85.4, 87.8, 89.4] },
    ],
    rewardSignals: [
      { week: 'W1', predicted: 0.82, actual: 0.84, reward: 0.02 },
      { week: 'W2', predicted: 0.84, actual: 0.83, reward: -0.01 },
      { week: 'W3', predicted: 0.85, actual: 0.87, reward: 0.02 },
      { week: 'W4', predicted: 0.87, actual: 0.89, reward: 0.02 },
      { week: 'W5', predicted: 0.88, actual: 0.90, reward: 0.02 },
      { week: 'W6', predicted: 0.90, actual: 0.91, reward: 0.01 },
      { week: 'W7', predicted: 0.91, actual: 0.92, reward: 0.01 },
      { week: 'W8', predicted: 0.92, actual: 0.94, reward: 0.02 },
    ],
    policyGradients: [
      { parameter: 'Maritime delay threshold', from: '24h', to: '18h', gradient: +0.08, status: 'applied' },
      { parameter: 'Threat escalation confidence', from: '0.95', to: '0.90', gradient: +0.12, status: 'applied' },
      { parameter: 'Pipeline churn alert sensitivity', from: '15%', to: '12%', gradient: +0.05, status: 'pending' },
      { parameter: 'Legal deadline early warning', from: 'T-48h', to: 'T-72h', gradient: +0.03, status: 'applied' },
      { parameter: 'Cap rate compression threshold', from: '20bps', to: '15bps', gradient: +0.06, status: 'pending' },
      { parameter: 'MirrorEval pass threshold', from: '0.80', to: '0.82', gradient: +0.02, status: 'locked' },
    ],
  });
});

router.get('/pages/security-agents', (_req, res) => {
  ok(res, {
    agents: [
      {
        id: 'sec-triage', name: 'Alert Triage Agent', role: 'Autonomous alert investigation — prioritizes, investigates, and renders verdicts on security alerts with full evidence trail.',
        status: 'investigating', model: 'claude-3.5-sonnet (air-gapped)', trustScore: 985, actionsToday: 47, proofChainEntries: 47, humanGateRequired: true,
        capabilities: ['alert-prioritization', 'ioc-correlation', 'false-positive-detection', 'evidence-assembly', 'verdict-rendering'],
        recentActions: [
          { time: '20:14', action: 'Investigating SIEM alert #4892 — anomalous DNS query pattern from host srv-db-04', verdict: 'IN PROGRESS' },
          { time: '19:45', action: 'Alert #4891 — brute force attempt on VPN gateway', verdict: 'TRUE POSITIVE', proofHash: 'sha256:f1a2b3' },
          { time: '18:30', action: 'Alert #4890 — port scan from 203.0.113.42', verdict: 'FALSE POSITIVE', proofHash: 'sha256:c4d5e6' },
          { time: '17:12', action: 'Alert #4889 — malware signature match on endpoint ws-eng-12', verdict: 'TRUE POSITIVE', proofHash: 'sha256:a7b8c9' },
          { time: '15:40', action: 'Alert #4888 — lateral movement indicator from compromised credential', verdict: 'TRUE POSITIVE', proofHash: 'sha256:d1e2f3' },
        ],
      },
      {
        id: 'sec-detection', name: 'Detection Engineering Agent', role: 'Auto-generates detection rules from threat intelligence, validates with synthetic data, and deploys to SIEM/EDR.',
        status: 'active', model: 'gpt-4o', trustScore: 960, actionsToday: 12, proofChainEntries: 12, humanGateRequired: true,
        capabilities: ['rule-generation', 'synthetic-validation', 'sigma-rule-authoring', 'yara-rule-authoring', 'coverage-gap-analysis'],
        recentActions: [
          { time: '20:00', action: 'Generated 3 Sigma rules for TG-Ember DNS-over-HTTPS exfiltration pattern', verdict: 'VALIDATED', proofHash: 'sha256:g1h2i3' },
          { time: '16:30', action: 'Coverage gap analysis — 2 MITRE ATT&CK techniques without detection rules', verdict: 'GAP IDENTIFIED', proofHash: 'sha256:j4k5l6' },
          { time: '14:00', action: 'Synthetic data test: 847 samples against new YARA rules — 0 false positives', verdict: 'VALIDATED', proofHash: 'sha256:m7n8o9' },
          { time: '10:15', action: 'Auto-updated 14 firewall signatures based on latest IOC feed', verdict: 'DEPLOYED', proofHash: 'sha256:p1q2r3' },
        ],
      },
      {
        id: 'sec-threat', name: 'Threat Analysis Agent', role: 'Deobfuscation, malware analysis, and threat verdicts — analyzes suspicious files, URLs, and behaviors with evidence-backed conclusions.',
        status: 'active', model: 'claude-3.5-sonnet (sandboxed)', trustScore: 975, actionsToday: 8, proofChainEntries: 8, humanGateRequired: true,
        capabilities: ['deobfuscation', 'static-analysis', 'behavioral-analysis', 'malware-classification', 'ioc-extraction'],
        recentActions: [
          { time: '19:30', action: 'Analyzed suspicious PowerShell payload from alert #4889 — multi-stage dropper identified', verdict: 'MALICIOUS', proofHash: 'sha256:s4t5u6' },
          { time: '17:45', action: 'Deobfuscated Base64-encoded C2 beacon — extracted 3 new IOCs', verdict: 'IOCS EXTRACTED', proofHash: 'sha256:v7w8x9' },
          { time: '14:20', action: 'URL reputation analysis: 12 suspicious URLs from phishing campaign — 8 confirmed malicious', verdict: 'MALICIOUS', proofHash: 'sha256:y1z2a3' },
          { time: '11:00', action: 'Binary analysis of ws-eng-12 sample — TG-Ember variant confirmed', verdict: 'CONFIRMED APT', proofHash: 'sha256:b4c5d6' },
        ],
      },
    ],
  });
});

router.get('/pages/gateway', (_req, res) => {
  ok(res, {
    connectors: [
      { id: 'ais-live-api', name: 'AIS Live API', vendor: 'MarineTraffic', domain: 'Maritime', category: 'Operational Data', riskScore: 18, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['vessel_position', 'eta', 'cargo_manifest'], allowedTools: ['vessel_track', 'eta_lookup', 'port_congestion'], blockedTools: ['cargo_manifest_write', 'flag_state_modify'], lastCall: '2026-04-26T14:28:00Z', callsToday: 847, firewallEvents: 3, outputSanitized: true, promptInjectionScans: 847, promptInjectionBlocked: 0, trustScore: 92, consentGranted: true, schemaValidated: true, tenant: 'SZL Holdings / SEXTANT', note: 'High-trust operational connector.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/ais-live', certExpiry: '2027-03-01' },
      { id: 'bloomberg-feed', name: 'Bloomberg Data Feed', vendor: 'Bloomberg LP', domain: 'Finance', category: 'Market Data', riskScore: 22, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['market_prices', 'company_financials', 'macro_indicators'], allowedTools: ['price_lookup', 'financial_analysis', 'news_search'], blockedTools: ['trade_execute', 'order_submit'], lastCall: '2026-04-26T14:15:00Z', callsToday: 312, firewallEvents: 1, outputSanitized: true, promptInjectionScans: 312, promptInjectionBlocked: 0, trustScore: 88, consentGranted: true, schemaValidated: true, tenant: 'CrossBridge Capital', note: 'Read-only financial connector.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/bloomberg', certExpiry: '2027-02-15' },
      { id: 'court-docket-api', name: 'Court Docket API', vendor: 'PACER / CourtLink', domain: 'Legal', category: 'Legal Intelligence', riskScore: 15, riskLevel: 'low', status: 'approved', approvalRequired: false, dataClasses: ['docket_entries', 'case_status', 'filing_deadlines'], allowedTools: ['docket_search', 'deadline_monitor', 'document_retrieve'], blockedTools: ['filing_submit', 'document_modify'], lastCall: '2026-04-26T13:45:00Z', callsToday: 94, firewallEvents: 0, outputSanitized: true, promptInjectionScans: 94, promptInjectionBlocked: 0, trustScore: 94, consentGranted: true, schemaValidated: true, tenant: 'SZL Holdings / Counsel', note: 'Legal docket connector with privilege gate.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/court-docket', certExpiry: '2027-04-01' },
      { id: 'defense-intel-feed', name: 'Defense Intelligence Feed', vendor: 'Palantir / Gov API', domain: 'Defense', category: 'Intelligence Data', riskScore: 12, riskLevel: 'low', status: 'approved', approvalRequired: true, dataClasses: ['threat_indicators', 'threat_actor_profiles', 'vulnerability_data'], allowedTools: ['threat_lookup', 'indicator_enrich', 'cve_query'], blockedTools: ['classified_retrieve', 'cisa_report_submit'], lastCall: '2026-04-26T14:00:00Z', callsToday: 156, firewallEvents: 8, outputSanitized: true, promptInjectionScans: 156, promptInjectionBlocked: 2, trustScore: 96, consentGranted: true, schemaValidated: true, tenant: 'Northwind Labs', note: 'Classified — Tier 3 approval required.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/defense-intel', certExpiry: '2027-01-01' },
      { id: 'crm-platform', name: 'CRM Platform', vendor: 'Salesforce', domain: 'Revenue', category: 'Customer Data', riskScore: 35, riskLevel: 'medium', status: 'approved', approvalRequired: false, dataClasses: ['account_data', 'opportunity_data', 'contact_data'], allowedTools: ['account_lookup', 'pipeline_analyze', 'churn_score'], blockedTools: ['account_delete', 'contact_email_bulk', 'deal_close'], lastCall: '2026-04-26T14:10:00Z', callsToday: 203, firewallEvents: 4, outputSanitized: true, promptInjectionScans: 203, promptInjectionBlocked: 1, trustScore: 87, consentGranted: true, schemaValidated: true, tenant: 'KORA Revenue', note: 'PII redaction enforced.', mtlsStatus: 'active', spiffeId: 'spiffe://a11oy.szl/connectors/salesforce', certExpiry: '2027-03-15' },
      { id: 'social-sentiment-api', name: 'Social Sentiment API', vendor: 'Brandwatch', domain: 'Marketing', category: 'Social Data', riskScore: 58, riskLevel: 'high', status: 'pending_review', approvalRequired: true, dataClasses: ['social_posts', 'sentiment_scores'], allowedTools: [], blockedTools: ['post_create', 'account_reply'], lastCall: null, callsToday: 0, firewallEvents: 12, outputSanitized: false, promptInjectionScans: 0, promptInjectionBlocked: 0, trustScore: 51, consentGranted: false, schemaValidated: false, tenant: null, note: 'Pending review — schema not validated.', mtlsStatus: 'pending', spiffeId: 'spiffe://a11oy.szl/connectors/brandwatch', certExpiry: 'N/A' },
      { id: 'third-party-llm-api', name: 'Third-Party LLM API', vendor: 'Unknown', domain: 'AI', category: 'Model Inference', riskScore: 94, riskLevel: 'critical', status: 'blocked', approvalRequired: true, dataClasses: ['prompts', 'model_outputs'], allowedTools: [], blockedTools: ['inference_run', 'context_upload', 'model_fine_tune'], lastCall: null, callsToday: 0, firewallEvents: 156, outputSanitized: false, promptInjectionScans: 0, promptInjectionBlocked: 44, trustScore: 12, consentGranted: false, schemaValidated: false, tenant: null, note: 'BLOCKED — 44 injection attempts.', mtlsStatus: 'revoked', spiffeId: 'N/A', certExpiry: 'REVOKED' },
    ],
    modelArmorEvents: [
      { id: 'ma-001', pattern: 'System prompt extraction via role-play', severity: 'critical', blocked: 18, lastSeen: '2026-04-26T14:20:00Z', technique: 'T1059.001 — Prompt Injection' },
      { id: 'ma-002', pattern: 'Base64-encoded instruction override', severity: 'critical', blocked: 12, lastSeen: '2026-04-26T13:45:00Z', technique: 'T1027 — Obfuscated Payload' },
      { id: 'ma-003', pattern: 'Indirect injection via document embedding', severity: 'high', blocked: 8, lastSeen: '2026-04-26T12:30:00Z', technique: 'T1204 — User Execution' },
      { id: 'ma-004', pattern: 'Jailbreak via multi-turn context window', severity: 'high', blocked: 5, lastSeen: '2026-04-25T22:00:00Z', technique: 'T1190 — Context Overflow' },
      { id: 'ma-005', pattern: 'DAN/developer mode bypass attempt', severity: 'medium', blocked: 4, lastSeen: '2026-04-25T18:00:00Z', technique: 'T1078 — Role Impersonation' },
    ],
    agentFlows: [
      { from: 'Cascade Navigator', to: 'Guardian', protocol: 'mTLS + A2A', status: 'active', messagesPerMin: 2.4, lastMessage: 'Sanctions clearance check' },
      { from: 'Pipeline Oracle', to: 'Counsel Sentinel', protocol: 'mTLS + A2A', status: 'active', messagesPerMin: 0.8, lastMessage: 'Contract review request' },
      { from: 'Guardian', to: 'Fabric Watchdog', protocol: 'mTLS + internal', status: 'active', messagesPerMin: 4.2, lastMessage: 'Perimeter verification' },
      { from: 'DOMAINE Analyst', to: 'Pipeline Oracle', protocol: 'mTLS + A2A', status: 'idle', messagesPerMin: 0, lastMessage: 'Asset impact analysis' },
      { from: 'Counsel Sentinel', to: 'Cascade Navigator', protocol: 'mTLS + A2A', status: 'active', messagesPerMin: 0.3, lastMessage: 'Demurrage clause query' },
    ],
  });
});

router.get('/pages/proof-ledger', (_req, res) => {
  ok(res, {
    chains: [
      {
        id: 'chain-001', title: 'MV Cascade Port Standby — Full Proof Chain', domain: 'Maritime', hash: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2', completedAt: '2026-04-25T04:34:58Z',
        attestation: { algorithm: 'Ed25519', signer: 'spiffe://a11oy.szl/verifier', timestamp: '2026-04-25T04:34:58Z', nonce: 'a8f3c2b1' },
        nodes: [
          { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-25T03:48:00Z', hash: 'sha256:a1b2c3d4e5', detail: 'MV Cascade 18h delay detected from AIS stream — Tanjung Pelepas congestion', evidenceRefs: ['ais-feed-cascade', 'port-api-tpp'], status: 'verified' },
          { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-25T03:49:12Z', hash: 'sha256:b2c3d4e5f6', detail: 'Context pack assembled: voyage plan, demurrage contract, port cost schedule, historical standby data', evidenceRefs: ['ctx-pack-4421'], status: 'verified' },
          { id: 'n3', kind: 'REASONING', label: 'Reasoning Trace', actor: 'Cascade Navigator', ts: '2026-04-25T03:52:30Z', hash: 'sha256:c3d4e5f6a7', detail: 'Full reasoning trace: 3 premises, 2 inference steps, 1 conclusion.', evidenceRefs: ['action-brief-cascade'], status: 'verified', reasoningTrace: [
            { id: 'r1', type: 'premise', content: 'MV Cascade ETA delayed 18h due to Tanjung Pelepas port congestion (AIS feed confirmed)', confidence: 0.98, evidenceRefs: ['ais-feed-cascade'] },
            { id: 'r2', type: 'premise', content: 'Demurrage contract clause 4.2: $14,200/day rate applies after 24h delay', confidence: 0.99, evidenceRefs: ['demurrage-contract-4421'] },
            { id: 'r3', type: 'premise', content: 'Historical standby at alternative anchorage saves avg $42,000 per event (12 prior cases)', confidence: 0.94, evidenceRefs: ['historical-standby-data'] },
            { id: 'r4', type: 'inference', content: 'Port standby at anchorage 1.28N 103.67E reduces demurrage exposure by ~$42K vs. waiting at berth', confidence: 0.96, evidenceRefs: ['cost-model-cascade'] },
            { id: 'r5', type: 'inference', content: 'No alternative port within 6h offers lower total cost when factoring fuel + port charges', confidence: 0.92, evidenceRefs: ['route-optimizer-output'] },
            { id: 'r6', type: 'conclusion', content: 'Recommend port standby at anchorage 1.28N 103.67E. Expected savings: $42,000. MirrorEval: 94%.', confidence: 0.945, evidenceRefs: ['action-brief-cascade'] },
          ] },
          { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-25T03:52:38Z', hash: 'sha256:d4e5f6a7b8', detail: 'Policy pol-maritime-002 triggered. Enforcement: block_until_approved. Required: VP Operations.', evidenceRefs: ['pol-maritime-002'], status: 'verified' },
          { id: 'n5', kind: 'APPROVAL', label: 'Approval Requested', actor: 'Approval Gateway', ts: '2026-04-25T03:52:45Z', hash: 'sha256:e5f6a7b8c9', detail: 'Approval request dispatched to VP Operations Sarah Chen. Deadline: T+4h.', evidenceRefs: ['approval-req-001'], status: 'verified' },
          { id: 'n6', kind: 'APPROVAL', label: 'Approval Granted', actor: 'vp-operations:sarah.chen', ts: '2026-04-25T04:30:22Z', hash: 'sha256:f6a7b8c9d1', detail: 'VP Operations approved port standby. Notes: "Agreed — minimize demurrage exposure."', evidenceRefs: ['approval-grant-001'], status: 'verified' },
          { id: 'n7', kind: 'EXECUTION', label: 'Action Executed', actor: 'Cascade Navigator', ts: '2026-04-25T04:32:11Z', hash: 'sha256:a7b8c9d1e2', detail: 'Port standby authorized. Vessel repositioned to anchorage 1.28N 103.67E.', evidenceRefs: ['exec-001'], status: 'verified' },
          { id: 'n8', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-25T04:34:58Z', hash: 'sha256:c9f2e5b8a1d3e6f9b2c5a8d3e1f6b9c2', detail: 'AIS position confirmed. Port authority standby registered. Cost rate locked at $14,200/day. Verification: PASSED.', evidenceRefs: ['vr-001'], status: 'verified' },
        ],
      },
      {
        id: 'chain-002', title: 'TG-Ember Threat Escalation — Full Proof Chain', domain: 'Defense', hash: 'sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6', completedAt: '2026-04-24T18:56:12Z',
        attestation: { algorithm: 'Ed25519', signer: 'spiffe://a11oy.szl/verifier', timestamp: '2026-04-24T18:56:12Z', nonce: 'b7e2d1c0' },
        nodes: [
          { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-24T18:42:00Z', hash: 'sha256:aa1b2c3', detail: 'TG-Ember threat actor activity detected — YELLOW threshold breached', evidenceRefs: ['siem-alert-4431'], status: 'verified' },
          { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-24T18:43:00Z', hash: 'sha256:bb2c3d4', detail: 'Threat intelligence context: TG-Ember history, TTPs, current attack surface', evidenceRefs: ['threat-ctx-4431'], status: 'verified' },
          { id: 'n3', kind: 'REASONING', label: 'Reasoning Trace', actor: 'Guardian', ts: '2026-04-24T18:44:30Z', hash: 'sha256:cc3d4e5', detail: 'Full reasoning trace for threat escalation decision.', evidenceRefs: ['guardian-brief-01'], status: 'verified', reasoningTrace: [
            { id: 'r1', type: 'premise', content: 'TG-Ember C2 beacons detected on ports 443 and 8080 from 3 internal hosts', confidence: 0.97, evidenceRefs: ['siem-alert-4431'] },
            { id: 'r2', type: 'premise', content: 'TG-Ember TTPs match known APT campaign (MITRE ATT&CK T1071, T1041)', confidence: 0.95, evidenceRefs: ['threat-intel-db'] },
            { id: 'r3', type: 'inference', content: 'Confidence-weighted threat score exceeds ORANGE threshold (0.92 > 0.90)', confidence: 0.96, evidenceRefs: ['threat-scoring-model'] },
            { id: 'r4', type: 'conclusion', content: 'Escalate to ORANGE. Apply 14 perimeter hardening rules. Notify CISO.', confidence: 0.96, evidenceRefs: ['guardian-brief-01'] },
          ] },
          { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-24T18:44:38Z', hash: 'sha256:dd4e5f6', detail: 'Policy pol-security-007: auto_escalate for ORANGE+ threats.', evidenceRefs: ['pol-security-007'], status: 'verified' },
          { id: 'n5', kind: 'EXECUTION', label: 'Action Executed', actor: 'Guardian (auto)', ts: '2026-04-24T18:55:00Z', hash: 'sha256:ee5f6a7', detail: '14 firewall block rules applied. CISO notified. Threat tier set to ORANGE.', evidenceRefs: ['exec-defense-001'], status: 'verified' },
          { id: 'n6', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-24T18:56:12Z', hash: 'sha256:b8c3f9e2a4d1e7f3b6c2a9e4d1f7b3c6', detail: 'SIEM confirmed ORANGE status. Perimeter surface reduced 22%. PASSED.', evidenceRefs: ['vr-003'], status: 'verified' },
        ],
      },
      {
        id: 'chain-003', title: 'Talbot Discovery Escalation — Full Proof Chain', domain: 'Legal', hash: 'sha256:a2d7e1f4b9c3e6a8d2f5b1c7e3a6d9f2', completedAt: '2026-04-24T14:23:45Z',
        attestation: { algorithm: 'Ed25519', signer: 'spiffe://a11oy.szl/verifier', timestamp: '2026-04-24T14:23:45Z', nonce: 'c6d3e2f1' },
        nodes: [
          { id: 'n1', kind: 'SIGNAL', label: 'Signal Detected', actor: 'Signal Mesh', ts: '2026-04-24T08:00:00Z', hash: 'sha256:la1b2c3', detail: 'Talbot matter: 340 documents outstanding, T-48h discovery deadline', evidenceRefs: ['clio-matter-4421'], status: 'verified' },
          { id: 'n2', kind: 'CONTEXT', label: 'Context Assembled', actor: 'Context Engine', ts: '2026-04-24T08:01:30Z', hash: 'sha256:lb2c3d4', detail: 'Matter context: case timeline, outstanding documents, discovery scope, risk assessment', evidenceRefs: ['legal-ctx-4421'], status: 'verified' },
          { id: 'n3', kind: 'REASONING', label: 'Reasoning Trace', actor: 'Counsel Sentinel', ts: '2026-04-24T08:05:00Z', hash: 'sha256:lc3d4e5', detail: 'Full reasoning trace for legal escalation decision.', evidenceRefs: ['counsel-brief-001'], status: 'verified', reasoningTrace: [
            { id: 'r1', type: 'premise', content: '340 documents remain outstanding with T-48h discovery deadline', confidence: 0.99, evidenceRefs: ['clio-matter-4421'] },
            { id: 'r2', type: 'premise', content: 'Opposing counsel has filed late in 3 of 5 prior cases — adverse inference motion risk is HIGH', confidence: 0.94, evidenceRefs: ['opposing-counsel-history'] },
            { id: 'r3', type: 'inference', content: 'Production rate of 15 docs/hour requires 22.7h — exceeds available time by 4.7h', confidence: 0.97, evidenceRefs: ['production-rate-model'] },
            { id: 'r4', type: 'conclusion', content: 'Immediate escalation to lead counsel + co-counsel required. Risk: adverse inference motion.', confidence: 0.97, evidenceRefs: ['counsel-brief-001'] },
          ] },
          { id: 'n4', kind: 'POLICY_EVAL', label: 'Policy Evaluated', actor: 'Covenant Layer', ts: '2026-04-24T08:05:08Z', hash: 'sha256:ld4e5f6', detail: 'Policy pol-legal-003: block_until_approved. General Counsel approval required.', evidenceRefs: ['pol-legal-003'], status: 'verified' },
          { id: 'n5', kind: 'APPROVAL', label: 'Approval Granted', actor: 'general-counsel:patricia.mwangi', ts: '2026-04-24T14:20:33Z', hash: 'sha256:le5f6a7', detail: 'General Counsel approved escalation. Notes: "Priority. Engage outside co-counsel immediately."', evidenceRefs: ['approval-legal-001'], status: 'verified' },
          { id: 'n6', kind: 'EXECUTION', label: 'Action Executed', actor: 'Counsel Sentinel', ts: '2026-04-24T14:22:10Z', hash: 'sha256:lf6a7b8', detail: 'Escalation email sent to lead counsel + co-counsel. Clio matter updated.', evidenceRefs: ['exec-legal-001'], status: 'verified' },
          { id: 'n7', kind: 'VERIFICATION', label: 'Result Verified', actor: 'Verifier Agent', ts: '2026-04-24T14:23:45Z', hash: 'sha256:a2d7e1f4b9c3e6a8d2f5b1c7e3a6d9f2', detail: 'Email delivery confirmed. Clio status updated. PASSED.', evidenceRefs: ['vr-002'], status: 'verified' },
        ],
      },
    ],
  });
});

router.get('/pages/memory', (_req, res) => {
  ok(res, {
    sessionMemories: [
      { id: 'sm-001', key: 'mv_cascade_active_context', value: 'Active voyage: ETA deviation 18h, port standby recommended, demurrage exposure $42K', operator: 'Cascade Navigator', workcell: 'WC-0041', ts: '2026-04-25T04:00:00Z', ttl: '4h', accessCount: 12, provenanceHash: 'sha256:sm01a1', decayScore: 0.92, reinforcementScore: 0.88 },
      { id: 'sm-002', key: 'talbot_active_deadline', value: 'Discovery deadline T-48h, 340 docs outstanding, escalation pending GC approval', operator: 'Counsel Sentinel', workcell: 'WC-0042', ts: '2026-04-25T02:30:00Z', ttl: '4h', accessCount: 8, provenanceHash: 'sha256:sm02b2', decayScore: 0.85, reinforcementScore: 0.76 },
      { id: 'sm-003', key: 'tg_ember_active_iocs', value: 'Current IOC set: 3 C2 beacons, 2 lateral movement indicators, 1 exfil pattern', operator: 'Guardian', workcell: 'WC-0043', ts: '2026-04-25T18:42:00Z', ttl: '2h', accessCount: 24, provenanceHash: 'sha256:sm03c3', decayScore: 0.98, reinforcementScore: 0.95 },
      { id: 'sm-004', key: 'q2_pipeline_snapshot', value: 'Pipeline velocity: 14.1 deals/week (22.5% below baseline), 3 at-risk deals flagged', operator: 'Pipeline Oracle', workcell: 'WC-0044', ts: '2026-04-25T01:00:00Z', ttl: '4h', accessCount: 6, provenanceHash: 'sha256:sm04d4', decayScore: 0.72, reinforcementScore: 0.65 },
    ],
    bankMemories: [
      { id: 'bm-001', key: 'cascade_delay_pattern', value: 'ETA deviation >30h triggers port standby recommendation. Historical success rate: 88%. 12 prior cases.', operator: 'Cascade Navigator', consolidatedFrom: ['sm-prev-001', 'sm-prev-012', 'sm-prev-023'], consolidatedAt: '2026-04-20T00:00:00Z', proofHash: 'sha256:bm01a1', accessCount: 47, version: 3, decayScore: 0.94, reinforcementScore: 0.91 },
      { id: 'bm-002', key: 'talbot_opposing_counsel_pattern', value: 'Opposing counsel has filed late 3 of last 5 cases. Early escalation pattern yields 40% better outcomes.', operator: 'Counsel Sentinel', consolidatedFrom: ['sm-prev-002', 'sm-prev-014'], consolidatedAt: '2026-04-18T00:00:00Z', proofHash: 'sha256:bm02b2', accessCount: 23, version: 2, decayScore: 0.88, reinforcementScore: 0.82 },
      { id: 'bm-003', key: 'tg_ember_fingerprint', value: 'TG-Ember APT: C2 on 443/8080, exfil via DNS-over-HTTPS. YARA rules v4.2 active. 24 prior incidents.', operator: 'Guardian', consolidatedFrom: ['sm-prev-003', 'sm-prev-015', 'sm-prev-027', 'sm-prev-038'], consolidatedAt: '2026-04-22T00:00:00Z', proofHash: 'sha256:bm03c3', accessCount: 92, version: 4, decayScore: 0.97, reinforcementScore: 0.96 },
      { id: 'bm-004', key: 'plano_cap_rate_model', value: 'Cap rate +18bps over 30d (6.2%). Historical reversal threshold: 6.5%. Comparable: 5.8-6.4% in DFW metro.', operator: 'DOMAINE Analyst', consolidatedFrom: ['sm-prev-006'], consolidatedAt: '2026-04-19T00:00:00Z', proofHash: 'sha256:bm04d4', accessCount: 15, version: 1, decayScore: 0.78, reinforcementScore: 0.68 },
      { id: 'bm-005', key: 'mirror_eval_baseline', value: 'Global MirrorEval pass rate: 94.2%. Maritime: 96.1%, Legal: 97.4%, Defense: 91.8%, Revenue: 88.4%.', operator: 'Fabric Watchdog', consolidatedFrom: ['sm-prev-007', 'sm-prev-019'], consolidatedAt: '2026-04-21T00:00:00Z', proofHash: 'sha256:bm05e5', accessCount: 34, version: 5, decayScore: 0.95, reinforcementScore: 0.93 },
    ],
    consolidationEvents: [
      { id: 'ce-001', from: 'Session Memory (WC-0038)', to: 'Memory Bank', key: 'cascade_delay_pattern', action: 'Merged 3 session observations into bank entry', proofHash: 'sha256:ce01a1', ts: '2026-04-20T00:00:00Z', delta: '+2 cases added to historical record' },
      { id: 'ce-002', from: 'Session Memory (WC-0039)', to: 'Memory Bank', key: 'tg_ember_fingerprint', action: 'Updated TG-Ember IOC set with 4 new indicators', proofHash: 'sha256:ce02b2', ts: '2026-04-22T00:00:00Z', delta: '+4 IOCs, YARA rules updated to v4.2' },
      { id: 'ce-003', from: 'Session Memory (WC-0040)', to: 'Memory Bank', key: 'mirror_eval_baseline', action: 'Refreshed baseline metrics from latest eval run', proofHash: 'sha256:ce03c3', ts: '2026-04-21T00:00:00Z', delta: 'Pass rate updated: 94.2% → 94.2% (stable)' },
      { id: 'ce-004', from: 'Session Memory (WC-0037)', to: 'Memory Bank', key: 'talbot_opposing_counsel_pattern', action: 'Added new late-filing data point', proofHash: 'sha256:ce04d4', ts: '2026-04-18T00:00:00Z', delta: 'Filing pattern updated: 2/4 → 3/5 late' },
    ],
    retrievalTraces: {
      'WC-0041': [
        { step: 'Query Session Memory', source: 'Session Layer', size: '12 KB', content: 'Active context: Horizon Star charter party terms, last 4 AIS pings, voyage plan', latency: '3ms' },
        { step: 'Query Memory Bank', source: 'Bank Layer', size: '48 KB', content: 'Historical ETA deviations for Cascade Navigator (88 records), Port Klang capacity data', latency: '28ms' },
        { step: 'Retrieve domain schema', source: 'Context Engine', size: '8 KB', content: 'Maritime domain schema v2.3 — vessel entity types, port codes, sanctions lists', latency: '5ms' },
        { step: 'Inject operator instructions', source: 'Operator Profile', size: '2 KB', content: 'Cascade Navigator: "Always include fuel cost delta in port recommendations"', latency: '1ms' },
        { step: 'Fetch proof cache', source: 'Proof Cache', size: '4 KB', content: 'OFAC/EU/UN screens cached for Horizon Star — last verified 2h ago', latency: '4ms' },
        { step: 'Assemble context pack', source: 'Context Engine', size: '74 KB', content: 'Final context pack: 6 sources merged, deduped, ranked by recency × relevance', latency: '12ms' },
        { step: 'Pack delivered to workcell', source: 'Workcell Engine', size: '74 KB', content: 'Context pack bound to WC-0041 — ready for Cascade Navigator invocation', latency: '2ms' },
      ],
      'WC-0042': [
        { step: 'Query Session Memory', source: 'Session Layer', size: '8 KB', content: 'Active context: Talbot matter metadata, upcoming deadline, assigned attorney', latency: '2ms' },
        { step: 'Query Memory Bank', source: 'Bank Layer', size: '64 KB', content: 'Talbot full case history: 18 docket entries, 5 filings, opposing counsel track record', latency: '31ms' },
        { step: 'Retrieve domain schema', source: 'Context Engine', size: '6 KB', content: 'Legal domain schema v1.8 — matter types, deadline rules, motion templates', latency: '4ms' },
        { step: 'Inject operator instructions', source: 'Operator Profile', size: '3 KB', content: 'Counsel Sentinel: "Flag opposing late pattern, cite minimum 3 precedents"', latency: '1ms' },
        { step: 'Load docket feed cache', source: 'Proof Cache', size: '2 KB', content: 'Court calendar sync cached — Talbot deadlines confirmed current as of 4h ago', latency: '3ms' },
        { step: 'Assemble context pack', source: 'Context Engine', size: '83 KB', content: 'Final context pack: 5 sources merged, deadline proximity boost applied', latency: '14ms' },
        { step: 'Pack delivered to workcell', source: 'Workcell Engine', size: '83 KB', content: 'Context pack bound to WC-0042 — ready for Counsel Sentinel invocation', latency: '2ms' },
      ],
      'WC-0043': [
        { step: 'Query Session Memory', source: 'Session Layer', size: '6 KB', content: 'Active context: SIEM alert #4821, initial IOC match, affected host list', latency: '2ms' },
        { step: 'Query Memory Bank', source: 'Bank Layer', size: '92 KB', content: 'TG-Ember threat intel: 24 prior incidents, TTPs, C2 infrastructure, YARA rules', latency: '38ms' },
        { step: 'Retrieve domain schema', source: 'Context Engine', size: '10 KB', content: 'Cyber domain schema v3.1 — STIX/TAXII entity types, MITRE ATT&CK mappings', latency: '6ms' },
        { step: 'Inject operator instructions', source: 'Operator Profile', size: '2 KB', content: 'Guardian: "Auto-isolate at IOC confidence >0.90 for known APTs"', latency: '1ms' },
        { step: 'Fetch threat intel cache', source: 'Proof Cache', size: '18 KB', content: 'IOC hashes cached from ISAC feed — TG-Ember C2 list updated 6h ago', latency: '5ms' },
        { step: 'Assemble context pack', source: 'Context Engine', size: '128 KB', content: 'Final context pack: 5 sources merged — threat intel ranked highest', latency: '18ms' },
        { step: 'Pack delivered to workcell', source: 'Workcell Engine', size: '128 KB', content: 'Context pack bound to WC-0043 — ready for Guardian invocation', latency: '2ms' },
      ],
    },
  });
});

router.get('/pages/signal-mesh', (_req, res) => {
  ok(res, {
    layers: [
      { label: 'Ingestion', status: 'ok', latency: '12ms avg', throughput: '2,400/hr' },
      { label: 'Normalization', status: 'ok', latency: '8ms avg', throughput: '2,400/hr' },
      { label: 'Deduplication', status: 'ok', latency: '4ms avg', throughput: '2,200/hr' },
      { label: 'Routing', status: 'ok', latency: '3ms avg', throughput: '2,200/hr' },
      { label: 'Correlation', status: 'ok', latency: '22ms avg', throughput: '840 graphs/hr' },
      { label: 'Knowledge Graph', status: 'ok', latency: '18ms avg', throughput: '840 entities/hr' },
    ],
    sources: [
      { name: 'AIS Vessel Feed', domain: 'Maritime', status: 'demo', rate: '24/hr' },
      { name: 'Port Authority API', domain: 'Maritime', status: 'demo', rate: '8/hr' },
      { name: 'CRM Webhook', domain: 'Revenue', status: 'demo', rate: '36/hr' },
      { name: 'Matter Tracker', domain: 'Legal', status: 'demo', rate: '12/hr' },
      { name: 'OSINT Aggregator', domain: 'Defense', status: 'demo', rate: '48/hr' },
      { name: 'Cap Rate Feed', domain: 'Real Estate', status: 'demo', rate: '4/hr' },
    ],
    kgEntities: [
      {
        id: 'kg-cascade', label: 'MV Cascade', type: 'Vessel', vertical: 'vessels-maritime',
        properties: { IMO: '9876543', Flag: 'Singapore', DWT: '82,000', Status: 'En Route' },
        connections: [
          { target: 'Tanjung Pelepas Port', relation: 'SCHEDULED_AT', strength: 0.95 },
          { target: 'Demurrage Contract #4421', relation: 'GOVERNED_BY', strength: 0.99 },
          { target: 'SZL Holdings', relation: 'OWNED_BY', strength: 1.0 },
          { target: 'TG-Ember Campaign', relation: 'SANCTIONS_CHECKED', strength: 0.88 },
        ],
      },
      {
        id: 'kg-talbot', label: 'Talbot v. Meridian', type: 'Legal Matter', vertical: 'prism-counsel',
        properties: { Case: 'CV-2026-1847', Court: 'S.D.N.Y.', Status: 'Active Discovery', Risk: 'HIGH' },
        connections: [
          { target: 'Patricia Mwangi (GC)', relation: 'ASSIGNED_TO', strength: 1.0 },
          { target: 'Meridian Holdings', relation: 'OPPOSING_PARTY', strength: 1.0 },
          { target: 'MV Cascade', relation: 'DEMURRAGE_RELATED', strength: 0.72 },
        ],
      },
      {
        id: 'kg-tgember', label: 'TG-Ember Campaign', type: 'Threat Actor', vertical: 'aegis-defense',
        properties: { ATT_CK: 'T1071, T1041', Tier: 'ORANGE', Origin: 'Eastern Europe', Active: 'Yes' },
        connections: [
          { target: 'SZL Holdings Network', relation: 'TARGETING', strength: 0.92 },
          { target: 'Mandiant Threat Intel', relation: 'PROFILED_BY', strength: 0.88 },
          { target: 'Guardian Agent', relation: 'MONITORED_BY', strength: 0.99 },
        ],
      },
      {
        id: 'kg-meridian', label: 'Meridian Holdings', type: 'Account', vertical: 'lyte-revenue',
        properties: { Pipeline: '$2.4M', Stage: 'Negotiation', Churn_Risk: '18%', Industry: 'Logistics' },
        connections: [
          { target: 'Pipeline Oracle', relation: 'MONITORED_BY', strength: 0.95 },
          { target: 'Talbot v. Meridian', relation: 'PARTY_TO', strength: 1.0 },
          { target: 'Counsel Sentinel', relation: 'CONTRACT_REVIEWED', strength: 0.85 },
        ],
      },
      {
        id: 'kg-plano', label: 'Plano Office Portfolio', type: 'Property', vertical: 'terra-real-estate',
        properties: { Cap_Rate: '6.2%', Trend: '+18bps/30d', Market: 'DFW Metro', Class: 'A' },
        connections: [
          { target: 'DOMAINE Analyst', relation: 'MONITORED_BY', strength: 0.95 },
          { target: 'SZL Holdings', relation: 'OWNED_BY', strength: 1.0 },
        ],
      },
    ],
    semanticResults: [
      { query: 'What entities are connected to MV Cascade?', results: ['Tanjung Pelepas Port', 'Demurrage Contract #4421', 'SZL Holdings', 'TG-Ember Campaign'] },
      { query: 'Cross-domain connections involving legal and maritime?', results: ['Talbot v. Meridian ↔ MV Cascade (demurrage-related)', 'Meridian Holdings ↔ Counsel Sentinel (contract reviewed)'] },
      { query: 'Threat actors targeting SZL infrastructure?', results: ['TG-Ember Campaign → SZL Holdings Network (targeting, strength: 0.92)'] },
    ],
  });
});

router.get('/pages/mirror-eval', (_req, res) => {
  ok(res, {
    summary: { total: 48, passed: 32, warned: 9, needsEvidence: 4, humanReview: 2, blocked: 1 },
    topFailureReasons: [
      { reason: 'insufficient_evidence', count: 4 },
      { reason: 'stale_context', count: 3 },
      { reason: 'hallucination_risk_high', count: 2 },
      { reason: 'scope_violation', count: 1 },
      { reason: 'policy_gate_triggered', count: 1 },
    ],
    evals: [
      { id: 'eval-001', version: '2.1.0', targetId: 'wc-maritime-001', targetType: 'action_brief', tenantId: 'vessels', runAt: new Date(Date.now() - 7200000).toISOString(), durationMs: 840, modelUsed: 'gpt-4o', scores: { groundedness: 0.96, evidence_coverage: 0.94, action_safety: 0.98, hallucination_risk: 0.97, policy_compliance: 0.99, tool_risk: 0.92, stale_context: 0.95, verification_readiness: 0.93, counterfactual_strength: 0.88, causal_validity: 0.90, approval_alignment: 0.96, scope_adherence: 0.97, output_fidelity: 0.94, proof_completeness: 0.95 }, composite: 0.945, disposition: 'pass', flags: [], gatingBlocked: false, regressionMatch: true, evidenceCoverage: 0.94, hallucinationRisk: 0.03, proofComplete: true, reasoningVerification: { verdict: 'PROVEN', premisesValidated: 3, premisesTotal: 3, inferenceChainValid: true, conclusionGrounded: true, covenantCompliance: [{ rule: 'pol-maritime-002', status: 'pass' }, { rule: 'pol-financial-001', status: 'pass' }, { rule: 'pol-safety-001', status: 'pass' }], proofHash: 'sha256:rv01a1' } },
      { id: 'eval-002', version: '2.1.0', targetId: 'wc-counsel-002', targetType: 'action_brief', tenantId: 'counsel', runAt: new Date(Date.now() - 3600000).toISOString(), durationMs: 640, modelUsed: 'claude-3.5-sonnet', scores: { groundedness: 0.99, evidence_coverage: 0.98, action_safety: 0.99, hallucination_risk: 0.99, policy_compliance: 0.99, tool_risk: 0.97, stale_context: 0.98, verification_readiness: 0.97, counterfactual_strength: 0.95, causal_validity: 0.96, approval_alignment: 0.99, scope_adherence: 0.98, output_fidelity: 0.99, proof_completeness: 0.98 }, composite: 0.981, disposition: 'pass', flags: [], gatingBlocked: false, regressionMatch: true, evidenceCoverage: 0.98, hallucinationRisk: 0.01, proofComplete: true, reasoningVerification: { verdict: 'PROVEN', premisesValidated: 4, premisesTotal: 4, inferenceChainValid: true, conclusionGrounded: true, covenantCompliance: [{ rule: 'pol-legal-003', status: 'pass' }, { rule: 'pol-privilege-001', status: 'pass' }], proofHash: 'sha256:rv02b2' } },
      { id: 'eval-003', version: '2.1.0', targetId: 'wc-revenue-003', targetType: 'action_brief', tenantId: 'lyte', runAt: new Date(Date.now() - 10800000).toISOString(), durationMs: 820, modelUsed: 'gpt-4o', scores: { groundedness: 0.90, evidence_coverage: 0.85, action_safety: 0.92, hallucination_risk: 0.88, policy_compliance: 0.94, tool_risk: 0.88, stale_context: 0.82, verification_readiness: 0.86, counterfactual_strength: 0.78, causal_validity: 0.80, approval_alignment: 0.88, scope_adherence: 0.91, output_fidelity: 0.87, proof_completeness: 0.89 }, composite: 0.873, disposition: 'pass_with_warning', flags: ['stale_context', 'insufficient_evidence'], gatingBlocked: false, regressionMatch: true, evidenceCoverage: 0.85, hallucinationRisk: 0.12, proofComplete: false, reasoningVerification: { verdict: 'UNPROVEN', premisesValidated: 2, premisesTotal: 3, inferenceChainValid: true, conclusionGrounded: false, covenantCompliance: [{ rule: 'pol-revenue-001', status: 'pass' }, { rule: 'pol-data-freshness', status: 'warn' }], proofHash: 'sha256:rv03c3' } },
      { id: 'eval-004', version: '2.1.0', targetId: 'wc-defense-001', targetType: 'action_brief', tenantId: 'aegis', runAt: new Date(Date.now() - 21600000).toISOString(), durationMs: 980, modelUsed: 'claude-3.5-sonnet', scores: { groundedness: 0.99, evidence_coverage: 0.98, action_safety: 0.99, hallucination_risk: 0.99, policy_compliance: 0.99, tool_risk: 0.98, stale_context: 0.99, verification_readiness: 0.97, counterfactual_strength: 0.96, causal_validity: 0.97, approval_alignment: 0.99, scope_adherence: 0.99, output_fidelity: 0.99, proof_completeness: 0.98 }, composite: 0.985, disposition: 'pass', flags: [], gatingBlocked: false, regressionMatch: true, evidenceCoverage: 0.98, hallucinationRisk: 0.01, proofComplete: true, reasoningVerification: { verdict: 'PROVEN', premisesValidated: 3, premisesTotal: 3, inferenceChainValid: true, conclusionGrounded: true, covenantCompliance: [{ rule: 'pol-security-007', status: 'pass' }, { rule: 'pol-escalation-001', status: 'pass' }, { rule: 'pol-ciso-notify', status: 'pass' }], proofHash: 'sha256:rv04d4' } },
      { id: 'eval-005', version: '2.1.0', targetId: 'wc-terra-005', targetType: 'action_brief', tenantId: 'terra', runAt: new Date(Date.now() - 43200000).toISOString(), durationMs: 760, modelUsed: 'gpt-4o', scores: { groundedness: 0.88, evidence_coverage: 0.82, action_safety: 0.90, hallucination_risk: 0.87, policy_compliance: 0.89, tool_risk: 0.85, stale_context: 0.80, verification_readiness: 0.84, counterfactual_strength: 0.75, causal_validity: 0.78, approval_alignment: 0.86, scope_adherence: 0.88, output_fidelity: 0.85, proof_completeness: 0.82 }, composite: 0.842, disposition: 'needs_more_evidence', flags: ['stale_context', 'insufficient_evidence'], gatingBlocked: false, regressionMatch: false, evidenceCoverage: 0.82, hallucinationRisk: 0.13, proofComplete: false, reasoningVerification: { verdict: 'UNPROVEN', premisesValidated: 1, premisesTotal: 3, inferenceChainValid: false, conclusionGrounded: false, covenantCompliance: [{ rule: 'pol-real-estate-001', status: 'warn' }, { rule: 'pol-data-freshness', status: 'fail' }], proofHash: 'sha256:rv05e5' } },
      { id: 'eval-006', version: '2.1.0', targetId: 'wc-finance-001', targetType: 'policy_eval', tenantId: 'alloy', runAt: new Date(Date.now() - 1800000).toISOString(), durationMs: 120, modelUsed: 'internal', scores: { groundedness: 0.55, evidence_coverage: 0.50, action_safety: 0.60, hallucination_risk: 0.70, policy_compliance: 0.42, tool_risk: 0.65, stale_context: 0.75, verification_readiness: 0.55, counterfactual_strength: 0.45, causal_validity: 0.48, approval_alignment: 0.50, scope_adherence: 0.55, output_fidelity: 0.60, proof_completeness: 0.45 }, composite: 0.552, disposition: 'blocked', flags: ['policy_gate_triggered', 'scope_violation'], gatingBlocked: true, regressionMatch: false, evidenceCoverage: 0.50, hallucinationRisk: 0.30, proofComplete: false, reasoningVerification: { verdict: 'VIOLATED', premisesValidated: 0, premisesTotal: 2, inferenceChainValid: false, conclusionGrounded: false, covenantCompliance: [{ rule: 'pol-scope-001', status: 'fail' }, { rule: 'pol-authorization-001', status: 'fail' }], proofHash: 'sha256:rv06f6' } },
    ],
    regressionSuite: { total: 124, passing: 119, failing: 5, lastRun: new Date(Date.now() - 3600000).toISOString() },
    policyComplianceTrend: [0.92, 0.94, 0.93, 0.95, 0.96, 0.94, 0.95].map((score, i) => ({ date: `D-${6 - i}`, score })),
    modelComparison: [
      { model: 'gpt-4o', provider: 'openai', evalsRun: 28, avgComposite: 0.88 },
      { model: 'claude-3.5', provider: 'anthropic', evalsRun: 16, avgComposite: 0.95 },
      { model: 'gpt-4o-mini', provider: 'openai', evalsRun: 3, avgComposite: 0.81 },
      { model: 'o3-mini', provider: 'openai', evalsRun: 1, avgComposite: 0.79 },
    ],
    version: '2.1.0',
  });
});

export default router;
