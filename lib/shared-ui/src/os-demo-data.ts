/**
 * OS Layer Demo Data — believable cross-variant seed data
 * Used by every app until live API data is available.
 * Evidence-backed, policy-cleared, run-linked — no placeholder copy.
 */
import type { Recommendation, Run, SourceHealthRecord, EvidenceRecord, PolicyVerdictDetail } from "./os-layer";
import type { EvalResult } from "./RunConsole";

function ev(id: string, sourceName: string, sourceType: EvidenceRecord["sourceType"], content: string, freshnessSeconds: number, confidence: number, lineage?: string[]): EvidenceRecord {
  return { id, sourceId: id, sourceName, sourceType, content, timestamp: new Date(Date.now() - freshnessSeconds * 1000).toISOString(), freshnessSeconds, confidence, ...(lineage !== undefined ? { lineage } : {}) };
}

function pv(verdict: PolicyVerdictDetail["verdict"], policyPack: string, ruleId: string, ruleLabel: string, reason: string, requiresJustification = false): PolicyVerdictDetail {
  return { verdict, policyPack, ruleId, ruleLabel, reason, approvalThreshold: "Single operator approval", requiresJustification, evaluatedAt: new Date().toISOString() };
}

// ─── SZL Holdings (Lyte) ─────────────────────────────────────────────────────

export const SZL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "szl-001", variant: "szl-holdings", priority: "P0",
    title: "Pipeline drift exceeding 22% — Q2 close at risk",
    summary: "Current pipeline velocity is 22% below the Q2 target run rate. Three anchor deals have slipped two weeks with no updated close dates. Capital readiness model signals 14-day liquidity crunch if deals do not close by May 3.",
    rationale: "Capital flow model (Monte Carlo) projects $8.4M shortfall if pipeline velocity does not recover to target by EOQ. Three deals represent 67% of total Q2 committed pipeline.",
    proposedAction: "Schedule a 72-hour deal-close sprint for the three anchor deals. Assign dedicated deal desk resources. Flag to CFO for contingency credit-line activation.",
    confidence: 0.87, valueAtRisk: 8400000, opportunityValue: 12200000,
    autonomyMode: "approve_each",
    policyVerdict: pv("yellow", "lyte-capital-policy-v2", "cap-002", "Capital Risk Threshold", "Deal slippage exceeds 20% pipeline drift threshold. CFO notification required before any credit-line action.", true),
    evidenceCount: 4,
    evidence: [
      ev("e-szl-1", "Pipeline CRM", "database", "Three anchor deals (Nexus Group, Mira Ventures, Atlas Capital) have slipped 14 days each with no updated close probability. Combined ARR impact: $4.1M.", 180, 0.93, ["CRM sync", "delta-extract", "pipeline-model"]),
      ev("e-szl-2", "Capital Readiness Model", "model_inference", "Monte Carlo simulation (10k runs) projects $8.4M liquidity shortfall at Q2 close under current velocity trajectory. Confidence interval: ±$1.1M.", 720, 0.81, ["pipeline-velocity", "monte-carlo", "liquidity-model"]),
      ev("e-szl-3", "Deal Desk Activity Log", "database", "No inbound deal-desk activity logged for Nexus Group in 9 days. Last contact: April 9, status: term-sheet review.", 300, 0.95, ["deal-desk-log"]),
      ev("e-szl-4", "Historical Close Rate", "derived", "Historical Q2 close rate for anchor deals at this stage: 68%. Current trajectory: 41%. Gap: 27 percentage points.", 3600, 0.77, ["historical-model", "regression"]),
    ],
    runId: "run-szl-cap-001", createdAt: new Date(Date.now() - 2700000).toISOString(), status: "pending", category: "capital", tags: ["pipeline", "Q2", "liquidity"],
  },
  {
    id: "szl-002", variant: "szl-holdings", priority: "P1",
    title: "Opportunity approval delay: Nexus Group (18 days open)",
    summary: "The Nexus Group opportunity has been in internal approval for 18 days — 12 days past the 6-day SLA. No blocking conditions detected in compliance or legal reviews.",
    rationale: "Approval SLA breach increases deal loss probability by 23% per 7-day increment (internal benchmark). Competitor activity detected in Nexus Group's domain from AIS signal cluster.",
    proposedAction: "Escalate to deal committee chair. Auto-assign to next available approver. Set 48-hour hard deadline with CFO visibility.",
    confidence: 0.91, valueAtRisk: 2800000,
    autonomyMode: "approve_each",
    policyVerdict: pv("green", "lyte-ops-policy-v1", "ops-007", "Approval SLA Enforcement", "SLA breach detected. Escalation is permitted under ops policy. No blocking conditions."),
    evidenceCount: 3,
    evidence: [
      ev("e-szl-5", "Approval Workflow Engine", "database", "Nexus Group opportunity entered approval queue on April 1. SLA: 6 days. Days elapsed: 18. No approver action logged since April 4.", 60, 0.99, ["workflow-engine"]),
      ev("e-szl-6", "Competitive Intelligence Feed", "external_api", "3 competitor RFP signals detected in Nexus Group's domain over past 10 days. Two signals correlate with known competitor onboarding patterns.", 1800, 0.74, ["competitive-feed", "signal-correlation"]),
      ev("e-szl-7", "Legal & Compliance Review", "database", "Legal review completed April 3. Compliance review completed April 5. No blocking flags. Deal cleared for commercial approval.", 86400, 0.98),
    ],
    runId: "run-szl-opp-002", createdAt: new Date(Date.now() - 7200000).toISOString(), status: "pending", category: "ops", tags: ["approvals", "SLA", "escalation"],
  },
  {
    id: "szl-003", variant: "szl-holdings", priority: "P2",
    title: "Fund-ops staffing risk: 2 open roles exceed 45-day vacancy",
    summary: "Two senior fund operations roles have been open for 47 and 52 days respectively. Combined workload gap is being absorbed by current staff at 134% utilization.",
    rationale: "Sustained utilization above 120% correlates with 3.2x burnout-driven attrition risk. Loss of either current analyst would cause reportable delay in Q2 fund close.",
    proposedAction: "Activate contingent staffing contract. Initiate emergency search. Interim: redistribute non-critical workload to fund admin team.",
    confidence: 0.78, valueAtRisk: 1500000,
    autonomyMode: "suggest",
    policyVerdict: pv("green", "lyte-hr-policy-v1", "hr-003", "Staffing Risk Threshold", "Staffing risk within approval authority. No policy blocks."),
    evidenceCount: 2,
    evidence: [
      ev("e-szl-8", "HRIS", "database", "Role #FO-112 (Senior Fund Analyst) open 52 days. Role #FO-118 (Fund Operations Manager) open 47 days. Combined workload gap: 1.8 FTE.", 3600, 0.97),
      ev("e-szl-9", "Workload Analytics", "derived", "Current team utilization: 134% average over trailing 21 days. Historical correlation: utilization >120% for >30 days → 3.2x attrition probability.", 7200, 0.72, ["workload-model", "attrition-regression"]),
    ],
    runId: "run-szl-hr-003", createdAt: new Date(Date.now() - 18000000).toISOString(), status: "pending", category: "hr", tags: ["staffing", "fund-ops", "risk"],
  },
];

export const SZL_SOURCE_HEALTH: SourceHealthRecord[] = [
  { sourceId: "szl-crm", sourceName: "Pipeline CRM", connector: "salesforce", status: "healthy", lastSeenAt: new Date(Date.now() - 180000).toISOString(), freshnessSeconds: 180, latencyMs: 142 },
  { sourceId: "szl-hris", sourceName: "HRIS", connector: "workday", status: "healthy", lastSeenAt: new Date(Date.now() - 3600000).toISOString(), freshnessSeconds: 3600, latencyMs: 210 },
  { sourceId: "szl-capital", sourceName: "Capital Model", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 720000).toISOString(), freshnessSeconds: 720, latencyMs: 88 },
  { sourceId: "szl-competitive", sourceName: "Competitive Intel", connector: "external-api", status: "degraded", lastSeenAt: new Date(Date.now() - 1800000).toISOString(), freshnessSeconds: 1800, latencyMs: 4200, errorMessage: "API rate limit approaching. Signal freshness reduced.", affectedWidgets: ["Competitive Intelligence Feed"] },
];

// ─── Vessels ─────────────────────────────────────────────────────────────────

export const VESSELS_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "ves-001", variant: "vessels", priority: "P0",
    title: "Route deviation: MV Meridian Star — sanctions proximity alert",
    summary: "MV Meridian Star deviated 48nm from declared route. Current position places vessel within 12nm of OFAC-listed port (Bandar Abbas inner anchorage). Last AIS ping 7 minutes ago.",
    rationale: "OFAC proximity threshold is 25nm. Current deviation triggers mandatory sanctions screening review under maritime compliance policy VES-SANC-001.",
    proposedAction: "Halt cargo release authorization. Notify compliance officer. Initiate OFAC screening for current port call. Require master declaration within 2 hours.",
    confidence: 0.94, valueAtRisk: 14200000,
    autonomyMode: "approve_each",
    policyVerdict: pv("red", "vessels-sanctions-policy-v3", "sanc-001", "OFAC Proximity Gate", "Vessel within 12nm of OFAC-listed port. Automatic compliance hold triggered. Human review mandatory.", true),
    evidenceCount: 4,
    evidence: [
      ev("e-ves-1", "AIS Live Feed", "live_feed", "MV Meridian Star (IMO 9432187) position: 27.1°N, 56.2°E. Last update: 7 minutes ago. Speed: 4.2kn (drifting). Declared destination: Khor Fakkan.", 420, 0.99, ["AIS-transponder", "position-interpolation"]),
      ev("e-ves-2", "OFAC Sanctions List", "external_api", "Bandar Abbas inner anchorage (27.2°N, 56.4°E) listed under OFAC SDN entry IRN-PORT-0034. Proximity: 12nm. Threshold: 25nm.", 86400, 0.99),
      ev("e-ves-3", "Route Deviation Model", "model_inference", "Declared route (Singapore → Khor Fakkan) does not pass within 200nm of current position. Deviation classification: unexplained. Confidence: 94%.", 600, 0.94, ["route-model", "deviation-classifier"]),
      ev("e-ves-4", "Cargo Manifest", "database", "Cargo: 22,400MT crude oil. Charter party: Meridian Shipping Ltd. Consignee: not disclosed. Flag: Marshall Islands.", 3600, 0.97),
    ],
    runId: "run-ves-sanc-001", createdAt: new Date(Date.now() - 900000).toISOString(), status: "pending", category: "compliance", tags: ["sanctions", "OFAC", "deviation"],
  },
  {
    id: "ves-002", variant: "vessels", priority: "P1",
    title: "Port disruption: Busan congestion — 14 vessels at risk",
    summary: "Busan port is experiencing 72-hour average berth wait due to dockworker industrial action. 14 fleet vessels have ETA within the next 5 days. Estimated aggregate demurrage exposure: $2.1M.",
    rationale: "Industrial action entered day 3. Historical Busan strikes average 5.4 days. Rerouting to Incheon or Ulsan available with 18-hour delay penalty.",
    proposedAction: "Reroute 6 highest-exposure vessels to Incheon. Activate demurrage insurance claims for vessels already at berth. Notify charterers of force majeure potential.",
    confidence: 0.82, valueAtRisk: 2100000,
    autonomyMode: "approve_batch",
    policyVerdict: pv("green", "vessels-ops-policy-v2", "ops-012", "Port Disruption Protocol", "Rerouting authority granted under maritime ops policy for disruptions exceeding 48 hours."),
    evidenceCount: 3,
    evidence: [
      ev("e-ves-5", "Port Intelligence Feed", "external_api", "Busan port: average berth wait 72h (up from 8h baseline). Cause: KCTU dockworker industrial action, day 3. Port authority advisory: TBD.", 1200, 0.91, ["port-intel", "signal-normalization"]),
      ev("e-ves-6", "Fleet Position Monitor", "live_feed", "14 vessels with ETA Busan within 120 hours. Highest exposure: MV Pacific Titan ($340K demurrage/day), MV Coral Sun ($280K/day).", 60, 0.99, ["AIS-fleet-monitor"]),
      ev("e-ves-7", "Demurrage Model", "model_inference", "Expected aggregate demurrage at current strike duration (5.4 days historical): $2.1M ± $0.4M. Rerouting to Incheon: saves $1.6M, costs $180K additional fuel.", 900, 0.81, ["demurrage-model", "routing-optimizer"]),
    ],
    runId: "run-ves-ops-002", createdAt: new Date(Date.now() - 3600000).toISOString(), status: "pending", category: "ops", tags: ["port", "demurrage", "rerouting"],
  },
];

export const VESSELS_SOURCE_HEALTH: SourceHealthRecord[] = [
  { sourceId: "ves-ais", sourceName: "AIS Live Feed", connector: "spire-maritime", status: "healthy", lastSeenAt: new Date(Date.now() - 60000).toISOString(), freshnessSeconds: 60, latencyMs: 55 },
  { sourceId: "ves-ofac", sourceName: "OFAC Sanctions", connector: "compliance-api", status: "healthy", lastSeenAt: new Date(Date.now() - 86400000).toISOString(), freshnessSeconds: 86400, latencyMs: 120 },
  { sourceId: "ves-port", sourceName: "Port Intelligence", connector: "windward-api", status: "degraded", lastSeenAt: new Date(Date.now() - 1200000).toISOString(), freshnessSeconds: 1200, latencyMs: 3800, errorMessage: "Upstream API responding slowly. Data may be 10-20 minutes behind.", affectedWidgets: ["Port Disruption Monitor"] },
];

// ─── Carlota Jo ───────────────────────────────────────────────────────────────

export const CARLOTA_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "cjo-001", variant: "carlota-jo", priority: "P1",
    title: "Vendor SLA breach: Meridian Legal (document delivery 6 days late)",
    summary: "Meridian Legal has failed to deliver final estate transfer documents for the Hargrove Estate engagement. Delivery was due April 12 — 6 days ago. Client deadline: May 1.",
    rationale: "With 13 days remaining to client deadline and 6-day breach, any further delay puts the engagement at risk. Contractual penalty clause activates at 10 days.",
    proposedAction: "Issue formal SLA breach notice. Activate backup counsel (Sterling & Associates, pre-approved). Notify client relationship manager.",
    confidence: 0.95, valueAtRisk: 320000,
    autonomyMode: "approve_each",
    policyVerdict: pv("green", "carlota-vendor-policy-v1", "vnd-004", "SLA Breach Escalation", "SLA breach exceeds 5 days. Escalation and backup activation are policy-authorized."),
    evidenceCount: 2,
    evidence: [
      ev("e-cjo-1", "Engagement Workflow", "database", "Hargrove Estate engagement #CJO-2024-0441. Document delivery due: April 12. Vendor: Meridian Legal. Days late: 6. Client deadline: May 1.", 600, 0.99),
      ev("e-cjo-2", "Vendor SLA Registry", "database", "Meridian Legal contract clause 4.3: delivery SLA 7 days. Penalty clause activates at 10 days breach: $15,000/day. Current exposure: $0 (day 6).", 3600, 0.98),
    ],
    runId: "run-cjo-vnd-001", createdAt: new Date(Date.now() - 5400000).toISOString(), status: "pending", category: "vendor", tags: ["SLA", "legal", "estate"],
  },
  {
    id: "cjo-002", variant: "carlota-jo", priority: "P2",
    title: "Billing anomaly: Whitmore Advisory — 3 unbilled hours over 45 days",
    summary: "Time tracking shows 14.5 unbilled hours across 3 consultants on the Whitmore Advisory engagement over 45 days. Estimated revenue leakage: $14,500 at blended rate.",
    rationale: "Billing reconciliation identified time entries marked as 'internal' that reference client deliverables. Pattern consistent with under-billing rather than administrative time.",
    proposedAction: "Review flagged time entries with each consultant. Issue corrected invoice. Implement real-time billing alerts for entries >$500 marked as internal.",
    confidence: 0.74, opportunityValue: 14500,
    autonomyMode: "suggest",
    policyVerdict: pv("green", "carlota-billing-policy-v1", "bil-001", "Billing Anomaly Review", "Anomaly within review authority. No policy blocks."),
    evidenceCount: 2,
    evidence: [
      ev("e-cjo-3", "Time Tracking System", "database", "14.5 hours across 3 consultants on Whitmore Advisory (engagement #CJO-2024-0389) coded as 'Internal — Admin' but description references client deliverables.", 7200, 0.88, ["time-tracking", "billing-classifier"]),
      ev("e-cjo-4", "Billing Analytics Model", "model_inference", "Pattern matches known under-billing signature in 73% of similar entries reviewed in Q1 2024 billing audit.", 86400, 0.74, ["billing-classifier", "anomaly-detection"]),
    ],
    runId: "run-cjo-bil-002", createdAt: new Date(Date.now() - 21600000).toISOString(), status: "pending", category: "billing", tags: ["billing", "revenue", "time-tracking"],
  },
];

export const CARLOTA_SOURCE_HEALTH: SourceHealthRecord[] = [
  { sourceId: "cjo-engagements", sourceName: "Engagement Workflow", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 600000).toISOString(), freshnessSeconds: 600, latencyMs: 95 },
  { sourceId: "cjo-billing", sourceName: "Billing System", connector: "quickbooks", status: "healthy", lastSeenAt: new Date(Date.now() - 7200000).toISOString(), freshnessSeconds: 7200, latencyMs: 310 },
];

// ─── Aegis ────────────────────────────────────────────────────────────────────

export const AEGIS_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "aeg-001", variant: "aegis", priority: "P0",
    title: "Control coverage gap: 14 endpoints without EDR — active threat lateral movement",
    summary: "14 production endpoints lack EDR coverage. Threat hunting scan detected lateral movement indicators consistent with APT-29 TTPs on 3 of these endpoints. Time since first detection: 4.2 hours.",
    rationale: "Uncovered endpoints represent 8% of the production estate. Lateral movement pattern matches MITRE ATT&CK T1021.001 (Remote Services). Containment window: narrowing.",
    proposedAction: "Isolate the 3 flagged endpoints immediately. Deploy EDR agents to remaining 11 unprotected endpoints. Activate SOC war room protocol.",
    confidence: 0.89, valueAtRisk: 28000000,
    autonomyMode: "approve_each",
    policyVerdict: pv("red", "aegis-incident-policy-v4", "inc-001", "Active Threat Containment Gate", "Active lateral movement detected. Containment action requires SOC lead approval within 30 minutes. Policy mandates escalation to CISO.", true),
    evidenceCount: 4,
    evidence: [
      ev("e-aeg-1", "EDR Telemetry", "live_feed", "3 endpoints (WIN-PROD-047, WIN-PROD-052, WIN-PROD-063) show process injection attempts, unusual LSASS access, and lateral movement via SMB. First detected: 04:12 UTC.", 240, 0.96, ["EDR-agent", "threat-classifier"]),
      ev("e-aeg-2", "Asset Inventory", "database", "14 endpoints in production estate lack EDR coverage. Risk classification: critical. Last inventory scan: 2025-04-17.", 3600, 0.99),
      ev("e-aeg-3", "Threat Intelligence Feed", "external_api", "IOCs on affected endpoints match APT-29 campaign (Midnight Blizzard) documented in CISA advisory AA24-038A. Confidence: 87%.", 1800, 0.87, ["threat-intel", "IOC-matcher"]),
      ev("e-aeg-4", "Network Flow Analysis", "live_feed", "Lateral movement detected: 3 internal SMB connections from WIN-PROD-047 to file servers FS-PROD-01 and FS-PROD-02 in past 90 minutes. Data exfil volume: monitoring.", 120, 0.92, ["network-monitor", "flow-analyzer"]),
    ],
    runId: "run-aeg-inc-001", createdAt: new Date(Date.now() - 1500000).toISOString(), status: "pending", category: "incident", tags: ["EDR", "lateral-movement", "APT", "critical"],
  },
  {
    id: "aeg-002", variant: "aegis", priority: "P1",
    title: "Asset exposure: 7 critical servers with CVE-2024-21412 unpatched",
    summary: "7 critical production servers remain unpatched against CVE-2024-21412 (CVSS 8.1 — Windows Defender SmartScreen bypass). Patch available since February 13, 2024. Exploit PoC publicly available.",
    rationale: "Public exploit availability combined with active threat actor interest (3 scanning IPs detected targeting this CVE in the past 72 hours) creates high exploitation probability.",
    proposedAction: "Schedule emergency patch window for all 7 servers within 24 hours. Enable compensating controls (application allowlisting, enhanced monitoring) immediately.",
    confidence: 0.84, valueAtRisk: 5500000,
    autonomyMode: "approve_each",
    policyVerdict: pv("yellow", "aegis-patch-policy-v2", "pat-007", "Critical CVE Remediation", "CVSS >= 8.0 with public exploit requires change-advisory-board approval for emergency patching.", true),
    evidenceCount: 3,
    evidence: [
      ev("e-aeg-5", "Vulnerability Scanner", "live_feed", "7 servers (CVE-2024-21412): WINSVR-PROD-01 through -07. CVSS: 8.1. Patch available: 2024-02-13. Days unpatched: 65.", 3600, 0.99),
      ev("e-aeg-6", "Threat Intelligence", "external_api", "3 scanning IPs targeting CVE-2024-21412 in environment perimeter over past 72h. Attribution: Threat cluster TA-0034 (opportunistic). Public PoC available on GitHub.", 1800, 0.82),
      ev("e-aeg-7", "Exploit Database", "external_api", "CVE-2024-21412 PoC published February 20, 2024. Active exploitation reported in the wild by Microsoft MSRC on March 1.", 86400, 0.99),
    ],
    runId: "run-aeg-pat-002", createdAt: new Date(Date.now() - 7200000).toISOString(), status: "pending", category: "vulnerability", tags: ["CVE", "patching", "SmartScreen"],
  },
];

export const AEGIS_SOURCE_HEALTH: SourceHealthRecord[] = [
  { sourceId: "aeg-edr", sourceName: "EDR Telemetry", connector: "crowdstrike", status: "healthy", lastSeenAt: new Date(Date.now() - 30000).toISOString(), freshnessSeconds: 30, latencyMs: 22 },
  { sourceId: "aeg-vuln", sourceName: "Vuln Scanner", connector: "tenable", status: "healthy", lastSeenAt: new Date(Date.now() - 3600000).toISOString(), freshnessSeconds: 3600, latencyMs: 180 },
  { sourceId: "aeg-threat", sourceName: "Threat Intel", connector: "misp", status: "healthy", lastSeenAt: new Date(Date.now() - 1800000).toISOString(), freshnessSeconds: 1800, latencyMs: 340 },
  { sourceId: "aeg-network", sourceName: "Network Monitor", connector: "darktrace", status: "degraded", lastSeenAt: new Date(Date.now() - 120000).toISOString(), freshnessSeconds: 120, latencyMs: 8200, errorMessage: "High packet loss on sensor cluster 3. Flow data incomplete.", affectedWidgets: ["Network Flow Analysis"] },
];

// ─── Terra ────────────────────────────────────────────────────────────────────

export const TERRA_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "ter-001", variant: "terra", priority: "P1",
    title: "Deal recommendation: 1247 Oak St — underwriting deviation signals mispricing",
    summary: "AVM model prices 1247 Oak St at $2.14M. Current ask: $2.48M (+$340K / +15.9% above model). Comparable sales in 90-day window support AVM within 3%. Market momentum index declining.",
    rationale: "Deviation from underwriting model at this magnitude is in the top 8% of observed mispricings. Deal should be passed unless seller negotiates below $2.2M or model inputs updated.",
    proposedAction: "Counter at $2.05M with 21-day close. If seller declines, pass the deal. Update comparables with April 2025 closings.",
    confidence: 0.81, valueAtRisk: 340000, opportunityValue: 90000,
    autonomyMode: "suggest",
    policyVerdict: pv("green", "terra-underwriting-policy-v1", "uw-003", "AVM Deviation Threshold", "AVM deviation within review authority. Recommendation is advisory."),
    evidenceCount: 3,
    evidence: [
      ev("e-ter-1", "AVM Engine", "model_inference", "1247 Oak St AVM estimate: $2.14M (±$62K). Model confidence: 81%. Inputs: 18 comparables, March-April 2025. Last run: 2 hours ago.", 7200, 0.81, ["AVM-model", "comp-selection", "hedonic-regression"]),
      ev("e-ter-2", "Comparable Sales", "database", "18 comps within 0.5mi, 800-1100sqft, sold March-April 2025. Median: $2.11M. Range: $1.97M-$2.28M. Subject: 1,020sqft, no garage.", 3600, 0.94),
      ev("e-ter-3", "Market Momentum Index", "derived", "Neighborhood momentum index: 42 (declining, was 71 three months ago). Days-on-market trend: +8 days YTD. List-to-sale ratio: 97.2% (down from 101%).", 86400, 0.78, ["market-index", "trend-model"]),
    ],
    runId: "run-ter-uw-001", createdAt: new Date(Date.now() - 9000000).toISOString(), status: "pending", category: "underwriting", tags: ["AVM", "pricing", "deviation"],
  },
];

export const TERRA_SOURCE_HEALTH: SourceHealthRecord[] = [
  { sourceId: "ter-avm", sourceName: "AVM Engine", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 7200000).toISOString(), freshnessSeconds: 7200, latencyMs: 2100 },
  { sourceId: "ter-mls", sourceName: "MLS Feed", connector: "mls-api", status: "stale", lastSeenAt: new Date(Date.now() - 172800000).toISOString(), freshnessSeconds: 172800, errorMessage: "MLS API credentials require renewal. Contact data vendor.", affectedWidgets: ["Comparable Sales", "Market Intelligence"] },
  { sourceId: "ter-market", sourceName: "Market Data", connector: "attom-data", status: "healthy", lastSeenAt: new Date(Date.now() - 86400000).toISOString(), freshnessSeconds: 86400, latencyMs: 450 },
];

// ─── Pulse ────────────────────────────────────────────────────────────────────

export const PULSE_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "pls-001", variant: "pulse", priority: "P0",
    title: "Cross-variant alert: 3 P0 recommendations require executive attention",
    summary: "Three P0 recommendations are open across the platform: Aegis (active threat containment), Vessels (OFAC sanctions proximity), and SZL Holdings (Q2 pipeline at risk). Combined value at risk: $50.6M.",
    rationale: "No P0 recommendation has been actioned in the past 90 minutes. Escalation policy requires executive awareness when P0s remain open beyond 60 minutes without assigned approver.",
    proposedAction: "Review each P0 and assign approver or escalate to the appropriate decision owner. Aegis requires SOC lead action within the next 30 minutes.",
    confidence: 0.98, valueAtRisk: 50600000,
    autonomyMode: "approve_each",
    policyVerdict: pv("red", "pulse-escalation-policy-v1", "esc-001", "Executive Escalation Gate", "Multiple cross-variant P0s open beyond 60-minute threshold. Executive notification mandated.", true),
    evidenceCount: 3,
    evidence: [
      ev("e-pls-1", "Decision Center — Aegis", "derived", "aeg-001: Active threat lateral movement, 14 endpoints without EDR. Open 25 minutes. Approver: unassigned.", 1500, 0.99),
      ev("e-pls-2", "Decision Center — Vessels", "derived", "ves-001: OFAC sanctions proximity alert, MV Meridian Star. Open 15 minutes. Approver: unassigned.", 900, 0.99),
      ev("e-pls-3", "Decision Center — SZL Holdings", "derived", "szl-001: Q2 pipeline drift 22% below target. Open 45 minutes. Approver: unassigned.", 2700, 0.99),
    ],
    runId: "run-pls-esc-001", createdAt: new Date(Date.now() - 5400000).toISOString(), status: "pending", category: "escalation", tags: ["cross-variant", "executive", "P0"],
  },
];

export const PULSE_SOURCE_HEALTH: SourceHealthRecord[] = [
  { sourceId: "pls-decision-center", sourceName: "Decision Center", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 60000).toISOString(), freshnessSeconds: 60, latencyMs: 28 },
  { sourceId: "pls-aegis", sourceName: "Aegis Feed", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 30000).toISOString(), freshnessSeconds: 30, latencyMs: 18 },
  { sourceId: "pls-vessels", sourceName: "Vessels Feed", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 60000).toISOString(), freshnessSeconds: 60, latencyMs: 22 },
];

// ─── Command ──────────────────────────────────────────────────────────────────

export const COMMAND_RECOMMENDATIONS: Recommendation[] = [
  ...SZL_RECOMMENDATIONS.slice(0, 1).map(r => ({ ...r, id: `cmd-${r.id}`, variant: "command" })),
  ...VESSELS_RECOMMENDATIONS.slice(0, 1).map(r => ({ ...r, id: `cmd-${r.id}`, variant: "command" })),
  ...AEGIS_RECOMMENDATIONS.slice(0, 1).map(r => ({ ...r, id: `cmd-${r.id}`, variant: "command" })),
];

export const COMMAND_SOURCE_HEALTH: SourceHealthRecord[] = [
  { sourceId: "cmd-szl", sourceName: "SZL Holdings", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 60000).toISOString(), freshnessSeconds: 60, latencyMs: 15 },
  { sourceId: "cmd-vessels", sourceName: "Vessels", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 60000).toISOString(), freshnessSeconds: 60, latencyMs: 18 },
  { sourceId: "cmd-aegis", sourceName: "Aegis", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 30000).toISOString(), freshnessSeconds: 30, latencyMs: 12 },
  { sourceId: "cmd-terra", sourceName: "Terra", connector: "internal", status: "healthy", lastSeenAt: new Date(Date.now() - 120000).toISOString(), freshnessSeconds: 120, latencyMs: 21 },
];

// ─── Shared Run History ───────────────────────────────────────────────────────

function baseRuns(variant: string): Run[] {
  return [
    {
      id: `run-${variant}-001`, variant, planId: `plan-${variant}-001`, skillName: "signal-ranker",
      status: "completed", effort: "medium", label: "Signal evaluation — ranked recommendations",
      toolCalls: [
        { toolName: "fetch-signals", inputSummary: "domain="+variant, outputSummary: "12 signals retrieved", latencyMs: 280, success: true },
        { toolName: "rank-signals", inputSummary: "12 signals, context=portfolio", outputSummary: "8 ranked, 4 filtered", latencyMs: 640, success: true },
        { toolName: "policy-check", inputSummary: "8 recommendations", outputSummary: "6 cleared, 1 yellow, 1 red", latencyMs: 190, success: true },
        { toolName: "persist-recommendations", inputSummary: "8 recommendations", outputSummary: "stored", latencyMs: 55, success: true },
      ],
      latencyMs: 1165, tokenUsage: { input: 4820, output: 1240, total: 6060 },
      evalScore: 0.91, startedAt: new Date(Date.now() - 1800000).toISOString(), completedAt: new Date(Date.now() - 1798835).toISOString(),
      replayable: true,
    },
    {
      id: `run-${variant}-002`, variant, planId: `plan-${variant}-002`, skillName: "evidence-builder",
      status: "completed", effort: "high", label: "Evidence enrichment — P0 recommendations",
      toolCalls: [
        { toolName: "fetch-evidence-sources", inputSummary: "rec_ids=[p0-recs]", outputSummary: "4 sources fetched", latencyMs: 410, success: true },
        { toolName: "verify-provenance", inputSummary: "4 evidence records", outputSummary: "all verified", latencyMs: 220, success: true },
        { toolName: "compute-lineage", inputSummary: "raw signals → enriched", outputSummary: "lineage graph built", latencyMs: 380, success: true },
      ],
      latencyMs: 1010, tokenUsage: { input: 6200, output: 1800, total: 8000 },
      evalScore: 0.88, startedAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3598990).toISOString(),
      replayable: true,
    },
    {
      id: `run-${variant}-003`, variant, planId: `plan-${variant}-003`, skillName: "policy-evaluator",
      status: "completed", effort: "low", label: "Policy evaluation — all pending recommendations",
      toolCalls: [
        { toolName: "load-policy-pack", inputSummary: `variant=${variant}`, outputSummary: "12 policies loaded", latencyMs: 85, success: true },
        { toolName: "evaluate-policies", inputSummary: "8 recommendations", outputSummary: "verdicts computed", latencyMs: 320, success: true },
      ],
      latencyMs: 405, tokenUsage: { input: 2100, output: 640, total: 2740 },
      evalScore: 0.95, startedAt: new Date(Date.now() - 7200000).toISOString(), completedAt: new Date(Date.now() - 7199595).toISOString(),
      replayable: true,
    },
  ];
}

export const VARIANT_RUNS: Record<string, Run[]> = {
  "szl-holdings": baseRuns("szl-holdings"),
  "vessels": baseRuns("vessels"),
  "carlota-jo": baseRuns("carlota-jo"),
  "aegis": baseRuns("aegis"),
  "terra": baseRuns("terra"),
  "pulse": baseRuns("pulse"),
  "command": baseRuns("command"),
};

// ─── Eval Results ─────────────────────────────────────────────────────────────

export const SHARED_EVAL_RESULTS: EvalResult[] = [
  { skillName: "signal-ranker", passRate: 0.91, total: 120, passed: 109, regressions: 2, trend: "up", lastRunAt: new Date(Date.now() - 86400000).toISOString() },
  { skillName: "evidence-builder", passRate: 0.88, total: 80, passed: 70, regressions: 1, trend: "stable", lastRunAt: new Date(Date.now() - 86400000).toISOString() },
  { skillName: "policy-evaluator", passRate: 0.95, total: 200, passed: 190, regressions: 0, trend: "up", lastRunAt: new Date(Date.now() - 86400000).toISOString() },
  { skillName: "action-executor", passRate: 0.83, total: 60, passed: 50, regressions: 3, trend: "down", lastRunAt: new Date(Date.now() - 86400000).toISOString() },
];

// ─── Recommendations by variant ───────────────────────────────────────────────

export const VARIANT_RECOMMENDATIONS: Record<string, Recommendation[]> = {
  "szl-holdings": SZL_RECOMMENDATIONS,
  "vessels": VESSELS_RECOMMENDATIONS,
  "carlota-jo": CARLOTA_RECOMMENDATIONS,
  "aegis": AEGIS_RECOMMENDATIONS,
  "terra": TERRA_RECOMMENDATIONS,
  "pulse": PULSE_RECOMMENDATIONS,
  "command": COMMAND_RECOMMENDATIONS,
};

export const VARIANT_SOURCE_HEALTH: Record<string, SourceHealthRecord[]> = {
  "szl-holdings": SZL_SOURCE_HEALTH,
  "vessels": VESSELS_SOURCE_HEALTH,
  "carlota-jo": CARLOTA_SOURCE_HEALTH,
  "aegis": AEGIS_SOURCE_HEALTH,
  "terra": TERRA_SOURCE_HEALTH,
  "pulse": PULSE_SOURCE_HEALTH,
  "command": COMMAND_SOURCE_HEALTH,
};
