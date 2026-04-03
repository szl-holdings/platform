import { logger } from "./logger";

const DEMO_MODE = process.env["DEMO_MODE"] === "true" || process.env["DEMO_MODE"] === "1";

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

export interface DemoSignal {
  id: number;
  source: string;
  sourceType: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  status: "new" | "acknowledged" | "resolved" | "dismissed";
  receivedAt: string;
  domain: string;
  workflowId?: string;
}

export interface DemoAction {
  id: number;
  title: string;
  description: string;
  assignee: string;
  dueAt: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "pending_approval" | "completed";
  sourceSignalId?: number;
  domain: string;
}

export interface DemoWorkflowRun {
  id: string;
  name: string;
  trigger: string;
  status: "running" | "completed" | "failed" | "awaiting_approval";
  startedAt: string;
  completedAt?: string;
  steps: { name: string; status: "completed" | "running" | "pending" | "failed"; durationMs?: number }[];
  domain: string;
}

export interface DemoVesselEvent {
  id: string;
  vesselId: number;
  vesselName: string;
  type: "eta_change" | "exception" | "route_deviation" | "maintenance_alert" | "position_update";
  severity: "critical" | "high" | "watch" | "info";
  title: string;
  description: string;
  timestamp: string;
  voyage?: string;
  impactUSD?: number;
}

export interface DemoTerraInquiry {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyType: string;
  city: string;
  state: string;
  inquiryType: "acquisition" | "disposition" | "financing" | "general";
  leadName: string;
  leadOrg: string;
  email: string;
  budget?: number;
  status: "new" | "qualified" | "nurture" | "active" | "closed";
  receivedAt: string;
  score: number;
}

export interface DemoAgent {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  market: string;
  activeListings: number;
  closedYTD: number;
  avgDaysOnMarket: number;
  totalVolume: number;
  brokerageId: string;
}

export interface DemoBrokerage {
  id: string;
  name: string;
  market: string;
  agentCount: number;
  tier: "premier" | "preferred" | "standard";
}

const now = Date.now();
const ago = (ms: number) => new Date(now - ms).toISOString();
const from = (ms: number) => new Date(now + ms).toISOString();

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export const demoLyteSignals: DemoSignal[] = [
  { id: 1001, source: "AWS CloudWatch", sourceType: "monitoring", severity: "critical", title: "RDS Primary (prod-db-01) replication lag 142s — payment pipeline at risk", status: "new", receivedAt: ago(3 * MIN), domain: "lyte", workflowId: "WF-LYT-001" },
  { id: 1002, source: "PagerDuty", sourceType: "alerting", severity: "critical", title: "P1 Escalation: Stripe webhook queue depth 14.2k — checkout returning 500", status: "acknowledged", receivedAt: ago(8 * MIN), domain: "lyte", workflowId: "WF-LYT-001" },
  { id: 1003, source: "Datadog APM", sourceType: "monitoring", severity: "high", title: "API Gateway p99 latency 7.8s (SLO: 500ms) — 3 upstream services degraded", status: "acknowledged", receivedAt: ago(15 * MIN), domain: "lyte" },
  { id: 1004, source: "Sentry", sourceType: "error_tracking", severity: "high", title: "TypeError at auth-service v3.14.2 — 2.8k events/hr, SSO impacted", status: "new", receivedAt: ago(22 * MIN), domain: "lyte" },
  { id: 1005, source: "AWS GuardDuty", sourceType: "security", severity: "high", title: "IAM credential exfiltration — prod-worker-node-role accessed from 198.51.100.42", status: "acknowledged", receivedAt: ago(35 * MIN), domain: "lyte" },
  { id: 1006, source: "Grafana", sourceType: "monitoring", severity: "high", title: "Redis cluster memory 93% — eviction active, session loss reports increasing", status: "new", receivedAt: ago(42 * MIN), domain: "lyte" },
  { id: 1007, source: "Datadog", sourceType: "monitoring", severity: "medium", title: "Lambda cold starts +380% after deploy — order-processor throughput degraded", status: "new", receivedAt: ago(58 * MIN), domain: "lyte" },
  { id: 1008, source: "CloudFlare", sourceType: "cdn", severity: "medium", title: "Cache hit ratio dropped 94% → 61% — origin load 4x baseline, scaling in progress", status: "new", receivedAt: ago(75 * MIN), domain: "lyte" },
  { id: 1009, source: "GitHub Actions", sourceType: "ci_cd", severity: "medium", title: "Deploy pipeline timed out — Docker OOM at 45m, hotfix deploy blocked", status: "new", receivedAt: ago(88 * MIN), domain: "lyte" },
  { id: 1010, source: "Stripe", sourceType: "webhook", severity: "high", title: "Payment decline rate 11.8% (baseline 2.1%) — issuer_decline spike", status: "acknowledged", receivedAt: ago(2 * HOUR), domain: "lyte" },
];

export const demoLyteActions: DemoAction[] = [
  { id: 2001, title: "Approve RDS failover to standby — prod-db-01", description: "Replication lag at 142s and rising. DBA recommends manual failover to standby. Expected connection drop: 30-60s. Estimated impact if deferred: $47K/hr checkout loss.", assignee: "Jordan Kim", dueAt: from(15 * MIN), priority: "critical", status: "pending_approval", sourceSignalId: 1001, domain: "lyte" },
  { id: 2002, title: "Rollback auth-service to v3.14.1", description: "v3.14.2 is crash-looping on token validation. Rollback to v3.14.1 is staged. DB migration dependency verified as non-blocking.", assignee: "Sarah Martinez", dueAt: from(20 * MIN), priority: "high", status: "in_progress", sourceSignalId: 1004, domain: "lyte" },
  { id: 2003, title: "Scale ElastiCache cluster — prevent session data loss", description: "Redis at 93% memory with active eviction. Upsize from cache.r6g.2xlarge to cache.r6g.4xlarge or add read replica. Estimated 20-minute window before session loss becomes customer-visible.", assignee: "Marcus Thompson", dueAt: from(30 * MIN), priority: "high", status: "open", sourceSignalId: 1006, domain: "lyte" },
  { id: 2004, title: "Investigate IAM credential exfiltration — rotate prod-worker-node-role", description: "GuardDuty flagged external IP usage of instance role. Credential rotation initiated automatically. Forensic analysis required. P&I and legal loop-in per security policy.", assignee: "Lisa Wang", dueAt: from(45 * MIN), priority: "high", status: "in_progress", sourceSignalId: 1005, domain: "lyte" },
  { id: 2005, title: "Notify Stripe — webhook ingestion degraded, ETA to resolution", description: "Stripe webhook queue at 14.2k. Send status update to Stripe TAM. Provide ETA. Prevent automatic partner escalation.", assignee: "Alex Chen", dueAt: from(10 * MIN), priority: "critical", status: "open", sourceSignalId: 1002, domain: "lyte" },
];

export const demoLyteWorkflows: DemoWorkflowRun[] = [
  {
    id: "WF-LYT-001",
    name: "Payment Pipeline SEV-1 Response",
    trigger: "Signals 1001 + 1002 correlated — auto-escalated by Lyte AIOps",
    status: "running",
    startedAt: ago(8 * MIN),
    domain: "lyte",
    steps: [
      { name: "Signal correlation", status: "completed", durationMs: 340 },
      { name: "Incident creation", status: "completed", durationMs: 180 },
      { name: "On-call notification", status: "completed", durationMs: 920 },
      { name: "Approval request — RDS failover", status: "running" },
      { name: "Runbook execution", status: "pending" },
      { name: "Status page update", status: "pending" },
    ],
  },
  {
    id: "WF-LYT-002",
    name: "IAM Security Escalation",
    trigger: "GuardDuty alert 1005 — security tier auto-escalation",
    status: "running",
    startedAt: ago(35 * MIN),
    domain: "lyte",
    steps: [
      { name: "Alert triage", status: "completed", durationMs: 210 },
      { name: "Credential rotation", status: "completed", durationMs: 4200 },
      { name: "Security team loop-in", status: "completed", durationMs: 1100 },
      { name: "Forensic evidence capture", status: "running" },
      { name: "Legal notification gate", status: "pending" },
    ],
  },
  {
    id: "WF-LYT-003",
    name: "Daily SLO Burn Rate Report",
    trigger: "Scheduled — 08:00 UTC",
    status: "completed",
    startedAt: ago(6 * HOUR),
    completedAt: ago(6 * HOUR - 12000),
    domain: "lyte",
    steps: [
      { name: "Collect SLO metrics", status: "completed", durationMs: 3200 },
      { name: "Compute burn rates", status: "completed", durationMs: 1400 },
      { name: "Generate report", status: "completed", durationMs: 2800 },
      { name: "Distribute to stakeholders", status: "completed", durationMs: 600 },
    ],
  },
];

export const demoVesselEvents: DemoVesselEvent[] = [
  { id: "VEV-001", vesselId: 3, vesselName: "Crimson Voyager", type: "exception", severity: "critical", title: "AIS-dark vessel approach — Persian Gulf security alert", description: "Unidentified vessel approached within 800m with no AIS transponder. Security protocol activated. Coast Guard notified.", timestamp: ago(45 * MIN), voyage: "VOY-003", impactUSD: 12400000 },
  { id: "VEV-002", vesselId: 7, vesselName: "Mediterranean Dawn", type: "eta_change", severity: "high", title: "ETA revised +31h — Force 8 weather, Ionian Sea", description: "Speed reduced to 9.1kt due to Force 8 conditions. Charter party notification window closing. Port slot at risk.", timestamp: ago(90 * MIN), voyage: "VOY-007", impactUSD: 620000 },
  { id: "VEV-003", vesselId: 2, vesselName: "Atlantic Pioneer", type: "maintenance_alert", severity: "high", title: "Port rudder hydraulic pressure drop — failure probability 84% in 13 days", description: "Predictive model flagged hydraulic seal degradation. Port call maintenance recommended at Hamburg.", timestamp: ago(2 * HOUR), voyage: "VOY-002", impactUSD: 316000 },
  { id: "VEV-004", vesselId: 8, vesselName: "Arctic Falcon", type: "route_deviation", severity: "high", title: "Ice field delay — Murmansk slot at risk", description: "Unexpected ice expansion forcing 6.2kt transit. ETA +22h. Icebreaker convoy unavailable until 0800 local.", timestamp: ago(3 * HOUR), voyage: "VOY-008", impactUSD: 420000 },
  { id: "VEV-005", vesselId: 1, vesselName: "Pacific Meridian", type: "position_update", severity: "info", title: "ETA confirmed — Yokohama arrival on schedule", description: "Anchorage congestion watch: 12 bulk carriers waiting at Yokohama. Pre-arrival berth confirmation in progress.", timestamp: ago(4 * HOUR), voyage: "VOY-001" },
  { id: "VEV-006", vesselId: 9, vesselName: "Gulf Titan", type: "position_update", severity: "info", title: "Loading commenced — Ras Tanura, 280K bbls crude", description: "Loading operations underway. Estimated departure in 18 hours. Voyage VOY-009 to Ningbo now active.", timestamp: ago(5 * HOUR), voyage: "VOY-009" },
];

export const demoBrokerages: DemoBrokerage[] = [
  { id: "brk-001", name: "Meridian Capital Partners", market: "Miami, FL", agentCount: 24, tier: "premier" },
  { id: "brk-002", name: "Pacific Heights Advisory", market: "San Francisco, CA", agentCount: 18, tier: "premier" },
  { id: "brk-003", name: "River Walk Commercial Group", market: "Austin, TX", agentCount: 12, tier: "preferred" },
  { id: "brk-004", name: "Northstar Industrial Advisors", market: "Dallas, TX", agentCount: 8, tier: "preferred" },
  { id: "brk-005", name: "Harbor & South Capital", market: "Boston, MA", agentCount: 15, tier: "premier" },
];

export const demoAgents: DemoAgent[] = [
  { id: "agt-001", name: "Marcus Chen", title: "Senior Acquisitions Director", email: "marcus.chen@meridiancap.com", phone: "+1 305 555 0142", market: "Miami, FL", activeListings: 4, closedYTD: 8, avgDaysOnMarket: 28, totalVolume: 142000000, brokerageId: "brk-001" },
  { id: "agt-002", name: "Sarah Mitchell", title: "Principal, Office Investments", email: "sarah.m@pacifichts.com", phone: "+1 415 555 0287", market: "San Francisco, CA", activeListings: 3, closedYTD: 5, avgDaysOnMarket: 38, totalVolume: 310000000, brokerageId: "brk-002" },
  { id: "agt-003", name: "Elena Rodriguez", title: "Vice President, Multifamily", email: "elena.r@meridian.cap", phone: "+1 305 555 0391", market: "Miami, FL", activeListings: 6, closedYTD: 11, avgDaysOnMarket: 22, totalVolume: 98000000, brokerageId: "brk-001" },
  { id: "agt-004", name: "David Park", title: "Director, Industrial & Logistics", email: "d.park@northstar-ind.com", phone: "+1 214 555 0448", market: "Dallas-Fort Worth, TX", activeListings: 5, closedYTD: 9, avgDaysOnMarket: 19, totalVolume: 215000000, brokerageId: "brk-004" },
  { id: "agt-005", name: "James Wheeler", title: "Managing Director, Retail", email: "j.wheeler@riverwalk.cg", phone: "+1 512 555 0512", market: "Austin, TX", activeListings: 3, closedYTD: 6, avgDaysOnMarket: 44, totalVolume: 67000000, brokerageId: "brk-003" },
];

export const demoTerraInquiries: DemoTerraInquiry[] = [
  { id: "inq-001", propertyId: "prop-001", propertyName: "Meridian Tower", propertyType: "multifamily", city: "Miami", state: "FL", inquiryType: "acquisition", leadName: "Robert Tanaka", leadOrg: "Tanaka Capital Management", email: "r.tanaka@tanakacap.com", budget: 85000000, status: "active", receivedAt: ago(2 * HOUR), score: 92 },
  { id: "inq-002", propertyId: "prop-002", propertyName: "Pacific Heights Plaza", propertyType: "office", city: "San Francisco", state: "CA", inquiryType: "acquisition", leadName: "Victoria Lane", leadOrg: "Lane Investment Partners", email: "v.lane@lane-inv.com", budget: 120000000, status: "qualified", receivedAt: ago(5 * HOUR), score: 78 },
  { id: "inq-003", propertyId: "prop-006", propertyName: "Harborview Residences", propertyType: "multifamily", city: "Boston", state: "MA", inquiryType: "financing", leadName: "Chen Wei", leadOrg: "Harbour Bridge Capital", email: "cwei@harbourbridge.com", status: "new", receivedAt: ago(90 * MIN), score: 65 },
  { id: "inq-004", propertyId: "prop-004", propertyName: "Beacon Industrial Park", propertyType: "industrial", city: "Dallas", state: "TX", inquiryType: "acquisition", leadName: "Atlas Logistics Holdings", leadOrg: "Atlas Logistics", email: "acquisitions@atlas-logistics.com", budget: 45000000, status: "active", receivedAt: ago(8 * HOUR), score: 88 },
  { id: "inq-005", propertyId: "prop-003", propertyName: "Riverside Commons", propertyType: "mixed-use", city: "Austin", state: "TX", inquiryType: "general", leadName: "Priya Sharma", leadOrg: "Apex Real Estate Fund", email: "p.sharma@apexref.com", status: "nurture", receivedAt: ago(DAY), score: 41 },
  { id: "inq-006", propertyId: "prop-008", propertyName: "Greenfield Office Campus", propertyType: "office", city: "Denver", state: "CO", inquiryType: "acquisition", leadName: "Colorado Tech Partners", leadOrg: "CTP Holdings", email: "deals@ctpholdings.co", budget: 58000000, status: "qualified", receivedAt: ago(12 * HOUR), score: 71 },
];

if (DEMO_MODE) {
  logger.info({ signalCount: demoLyteSignals.length, actionCount: demoLyteActions.length, workflowCount: demoLyteWorkflows.length, vesselEventCount: demoVesselEvents.length, inquiryCount: demoTerraInquiries.length }, "Demo mode: seed data loaded");
}
