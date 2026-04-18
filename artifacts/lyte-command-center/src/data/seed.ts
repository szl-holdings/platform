export interface DriftItem {
  id: string;
  title: string;
  program: string;
  team: string;
  staleDays: number;
  owners: string[];
  evidence: string[];
  status: "critical" | "warn" | "info";
  lastActivity: string;
  impact: string;
  proofRef: string;
}

export interface PressureCell {
  team: string;
  workflow: string;
  account: string;
  program: string;
  sponsor: string;
  open: number;
  overdue: number;
  blocked: number;
  escalated: number;
  score: number; // 0–100
}

export interface DebtItem {
  id: string;
  title: string;
  team: string;
  owner: string;
  type: "overdue" | "blocked" | "looping" | "escalated";
  score: number; // 0–100
  ageDays: number;
  escalations: number;
  program: string;
  evidence: string[];
  proofRef: string;
  status: "critical" | "warn" | "info";
}

export interface ReplayEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  signal?: string;
  detail: string;
  evidenceType: "system" | "human" | "alloy" | "escalation";
  proofRef: string;
}

export interface ReplayScenario {
  id: string;
  title: string;
  decision: string;
  outcome: string;
  dateRange: string;
  events: ReplayEvent[];
}

export interface BoardRisk {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium";
  domain: string;
  signal: string;
  recommendation: string;
  proofRef: string;
  interventionOwner: string;
  deadline: string;
}

export interface BoardMetric {
  label: string;
  value: string | number;
  delta?: string;
  trend: "up" | "down" | "flat";
  context: string;
  good: "up" | "down";
}

// ─── Ownership Drift ────────────────────────────────────────────────────────

export const driftItems: DriftItem[] = [
  {
    id: "drift-001",
    title: "Q2 Revenue Forecast Revision",
    program: "Finance Planning",
    team: "Finance + Strategy",
    staleDays: 11,
    owners: ["Sarah Lim (Finance)", "David Osei (Strategy)"],
    evidence: [
      "Last edit: Apr 7 by Sarah Lim — marked 'awaiting Strategy sign-off'",
      "David Osei opened doc Apr 8 — no changes made",
      "Alloy workflow paused at 'strategy-review' node for 9 days",
      "Board deck assembly blocked on this output since Apr 12",
    ],
    status: "critical",
    lastActivity: "Apr 7, 2026",
    impact: "Board deck assembly blocked — Q2 presentation at risk",
    proofRef: "ALLOY-W-0491",
  },
  {
    id: "drift-002",
    title: "CloudPlatform Vendor Contract Renewal",
    program: "Procurement",
    team: "Legal + IT + Procurement",
    staleDays: 14,
    owners: ["Mark Chen (Legal)", "Priya Anand (IT)", "Tom Reyes (Procurement)"],
    evidence: [
      "Legal: 'contract terms need IT approval before we can proceed'",
      "IT: 'this is a procurement decision, not an IT technical approval'",
      "Procurement: 'waiting on legal sign-off before vendor negotiation'",
      "Contract expiry date: May 3, 2026 — 15 days away",
      "Alloy signal: circular dependency detected Apr 5",
    ],
    status: "critical",
    lastActivity: "Apr 4, 2026",
    impact: "Service disruption risk if contract lapses. $340K annual spend.",
    proofRef: "ALLOY-W-0388",
  },
  {
    id: "drift-003",
    title: "Meridian Corp — Product Decision Escalation",
    program: "Customer Success",
    team: "CS + Product",
    staleDays: 7,
    owners: ["Aaliya Torres (CS Lead)", "James Park (Product)"],
    evidence: [
      "CS opened Meridian escalation ticket Apr 11 — assigned to Product for feature decision",
      "James Park auto-tagged Apr 12 — no response logged",
      "Meridian renewal conversation paused pending resolution",
      "NPS: Meridian score dropped from 72 to 51 in last 30 days",
    ],
    status: "warn",
    lastActivity: "Apr 11, 2026",
    impact: "Renewal at risk — $180K ARR account. CS cannot proceed without product direction.",
    proofRef: "ALLOY-W-0514",
  },
  {
    id: "drift-004",
    title: "Infrastructure Migration Sign-Off",
    program: "Platform Engineering",
    team: "Engineering + Security + Finance",
    staleDays: 5,
    owners: ["Lena Vasquez (Eng)", "Omar Khalil (Security)", "Tina Barrow (Finance)"],
    evidence: [
      "Engineering completed migration plan Apr 13 — sent for multi-party approval",
      "Security: 'pending Finance budget confirmation'",
      "Finance: 'pending Security threat assessment first'",
      "Alloy workflow shows 3-way approval deadlock since Apr 13",
    ],
    status: "warn",
    lastActivity: "Apr 13, 2026",
    impact: "Q2 infrastructure work blocked. Engineering team idle on this thread.",
    proofRef: "ALLOY-W-0527",
  },
  {
    id: "drift-005",
    title: "EMEA Launch Localisation Review",
    program: "International Expansion",
    team: "Marketing + Legal + Product",
    staleDays: 3,
    owners: ["Carla Mendez (Marketing)", "Sophie Durand (Legal-EMEA)"],
    evidence: [
      "Localisation copy submitted Apr 15 — needs legal GDPR review",
      "Sophie Durand on leave until Apr 22 — no backup named",
      "Product blocked on go/no-go for EMEA soft launch May 1",
    ],
    status: "info",
    lastActivity: "Apr 15, 2026",
    impact: "EMEA May 1 launch date in jeopardy if review not completed by Apr 24.",
    proofRef: "ALLOY-W-0541",
  },
  {
    id: "drift-006",
    title: "Series B Data Room — Alloy Metrics Pack",
    program: "Corporate Finance",
    team: "Data + Finance",
    staleDays: 6,
    owners: ["Ryan Chow (Data)", "Nalini Rao (CFO Office)"],
    evidence: [
      "CFO Office requested updated Alloy connector metrics Apr 12",
      "Data team acknowledged Apr 12 — no deliverable produced",
      "Investor follow-up call scheduled Apr 20 — deck not ready",
      "Four prior requests for this data pack unanswered since Feb",
    ],
    status: "warn",
    lastActivity: "Apr 12, 2026",
    impact: "Series B due diligence window at risk. Investor relationship sensitive.",
    proofRef: "ALLOY-W-0503",
  },
];

export const driftHistory = [
  { date: "Mar 22", count: 2 },
  { date: "Mar 29", count: 3 },
  { date: "Apr 5", count: 4 },
  { date: "Apr 7", count: 4 },
  { date: "Apr 9", count: 5 },
  { date: "Apr 11", count: 6 },
  { date: "Apr 13", count: 6 },
  { date: "Apr 15", count: 6 },
  { date: "Apr 18", count: 6 },
];

// ─── Pressure Map ───────────────────────────────────────────────────────────

export const pressureCells: PressureCell[] = [
  { team: "Engineering",   workflow: "Feature Delivery",    account: "Platform Scale",     program: "Q2 Product Launch",      sponsor: "CTO",  open: 54, overdue: 14, blocked: 8,  escalated: 3, score: 72 },
  { team: "Engineering",   workflow: "Infra & Reliability", account: "Platform Scale",     program: "Cloud Migration",        sponsor: "CTO",  open: 28, overdue: 9,  blocked: 5,  escalated: 2, score: 61 },
  { team: "Engineering",   workflow: "Security Reviews",    account: "Meridian Corp",      program: "SOC 2 Certification",    sponsor: "CISO", open: 18, overdue: 7,  blocked: 3,  escalated: 1, score: 55 },
  { team: "Revenue",       workflow: "Pipeline Mgmt",       account: "Enterprise Growth",  program: "Q2 Revenue Target",      sponsor: "CRO",  open: 32, overdue: 8,  blocked: 4,  escalated: 4, score: 68 },
  { team: "Revenue",       workflow: "Deal Structuring",    account: "Nexus Industries",   program: "Q2 Revenue Target",      sponsor: "CRO",  open: 14, overdue: 5,  blocked: 2,  escalated: 2, score: 57 },
  { team: "Revenue",       workflow: "Renewal Ops",         account: "Meridian Corp",      program: "ARR Protection",         sponsor: "CRO",  open: 21, overdue: 6,  blocked: 3,  escalated: 5, score: 74 },
  { team: "Legal",         workflow: "Contract Review",     account: "CloudPlatform",      program: "Vendor Management",      sponsor: "COO",  open: 18, overdue: 8,  blocked: 6,  escalated: 3, score: 80 },
  { team: "Legal",         workflow: "Compliance",          account: "Platform Scale",     program: "Regulatory Affairs",     sponsor: "COO",  open: 9,  overdue: 4,  blocked: 2,  escalated: 1, score: 62 },
  { team: "Customer Suc.", workflow: "Onboarding",          account: "Nexus Industries",   program: "Customer Lifecycle",     sponsor: "CRO",  open: 27, overdue: 5,  blocked: 3,  escalated: 2, score: 50 },
  { team: "Customer Suc.", workflow: "Escalation Mgmt",     account: "Meridian Corp",      program: "ARR Protection",         sponsor: "COO",  open: 31, overdue: 12, blocked: 7,  escalated: 8, score: 88 },
  { team: "Customer Suc.", workflow: "QBR Preparation",     account: "Enterprise Growth",  program: "Customer Lifecycle",     sponsor: "CRO",  open: 15, overdue: 4,  blocked: 2,  escalated: 1, score: 44 },
  { team: "Finance",       workflow: "Budgeting",           account: "Internal",           program: "Annual Planning",        sponsor: "CFO",  open: 12, overdue: 3,  blocked: 1,  escalated: 1, score: 38 },
  { team: "Finance",       workflow: "Forecast Reviews",    account: "Internal",           program: "Q2 Revenue Target",      sponsor: "CFO",  open: 18, overdue: 7,  blocked: 4,  escalated: 3, score: 69 },
  { team: "Finance",       workflow: "Procurement",         account: "CloudPlatform",      program: "Vendor Management",      sponsor: "CFO",  open: 11, overdue: 4,  blocked: 5,  escalated: 4, score: 77 },
  { team: "Operations",    workflow: "Process Change Mgmt", account: "Internal",           program: "Operational Excellence", sponsor: "COO",  open: 22, overdue: 7,  blocked: 4,  escalated: 2, score: 59 },
  { team: "Operations",    workflow: "Vendor Mgmt",         account: "CloudPlatform",      program: "Vendor Management",      sponsor: "COO",  open: 18, overdue: 8,  blocked: 6,  escalated: 5, score: 76 },
  { team: "Product",       workflow: "Roadmap Decisions",   account: "Platform Scale",     program: "Q2 Product Launch",      sponsor: "CPO",  open: 19, overdue: 4,  blocked: 6,  escalated: 4, score: 66 },
  { team: "Product",       workflow: "Spec Reviews",        account: "Enterprise Growth",  program: "Q2 Product Launch",      sponsor: "CPO",  open: 23, overdue: 6,  blocked: 4,  escalated: 2, score: 55 },
  { team: "Product",       workflow: "Stakeholder Signoff", account: "Meridian Corp",      program: "ARR Protection",         sponsor: "CPO",  open: 14, overdue: 8,  blocked: 7,  escalated: 6, score: 85 },
  { team: "Marketing",     workflow: "Campaign Approvals",  account: "EMEA Expansion",     program: "EMEA Go-to-Market",      sponsor: "CMO",  open: 16, overdue: 3,  blocked: 2,  escalated: 1, score: 40 },
  { team: "Marketing",     workflow: "Launch Reviews",      account: "EMEA Expansion",     program: "EMEA Go-to-Market",      sponsor: "CMO",  open: 11, overdue: 4,  blocked: 4,  escalated: 2, score: 58 },
];

// ─── Action Debt Index ───────────────────────────────────────────────────────

export const debtItems: DebtItem[] = [
  {
    id: "debt-001",
    title: "CloudPlatform Vendor Contract Renewal",
    team: "Legal + Procurement",
    owner: "Mark Chen / Tom Reyes",
    type: "looping",
    score: 96,
    ageDays: 14,
    escalations: 3,
    program: "Vendor Management",
    evidence: [
      "3-way circular dependency detected by Alloy Apr 5",
      "Contract expires May 3 — 15 days remaining",
      "No forward motion in 14 days despite 3 escalations",
    ],
    proofRef: "ALLOY-W-0388",
    status: "critical",
  },
  {
    id: "debt-002",
    title: "Q2 Revenue Forecast Revision",
    team: "Finance + Strategy",
    owner: "Sarah Lim / David Osei",
    type: "blocked",
    score: 91,
    ageDays: 11,
    escalations: 2,
    program: "Finance Planning",
    evidence: [
      "Board deck blocked since Apr 12",
      "Workflow paused at strategy-review node 9 days",
      "CFO escalated to COO Apr 14 — no resolution",
    ],
    proofRef: "ALLOY-W-0491",
    status: "critical",
  },
  {
    id: "debt-003",
    title: "Customer Escalation — Meridian Corp",
    team: "Customer Success + Product",
    owner: "Aaliya Torres / James Park",
    type: "escalated",
    score: 83,
    ageDays: 7,
    escalations: 2,
    program: "Customer Success",
    evidence: [
      "Renewal conversation paused 7 days",
      "$180K ARR renewal at risk",
      "NPS dropped 21 points in 30 days",
    ],
    proofRef: "ALLOY-W-0514",
    status: "critical",
  },
  {
    id: "debt-004",
    title: "Series B Data Room — Alloy Metrics",
    team: "Data + CFO Office",
    owner: "Ryan Chow / Nalini Rao",
    type: "overdue",
    score: 79,
    ageDays: 6,
    escalations: 1,
    program: "Corporate Finance",
    evidence: [
      "4th request for same deliverable",
      "Investor call Apr 20 — deck not ready",
    ],
    proofRef: "ALLOY-W-0503",
    status: "critical",
  },
  {
    id: "debt-005",
    title: "Infra Migration Sign-Off",
    team: "Engineering + Security + Finance",
    owner: "Lena Vasquez",
    type: "looping",
    score: 71,
    ageDays: 5,
    escalations: 1,
    program: "Platform Engineering",
    evidence: [
      "3-way approval deadlock since Apr 13",
      "Engineering idle on thread",
    ],
    proofRef: "ALLOY-W-0527",
    status: "warn",
  },
  {
    id: "debt-006",
    title: "EMEA Launch Localisation GDPR Review",
    team: "Legal + Marketing",
    owner: "Sophie Durand (on leave)",
    type: "blocked",
    score: 64,
    ageDays: 3,
    escalations: 0,
    program: "International Expansion",
    evidence: [
      "Named reviewer on leave — no backup assigned",
      "Review required before May 1 launch",
    ],
    proofRef: "ALLOY-W-0541",
    status: "warn",
  },
  {
    id: "debt-007",
    title: "Renewals Dashboard — Data Model Update",
    team: "Engineering",
    owner: "Ben Kowalski",
    type: "overdue",
    score: 58,
    ageDays: 9,
    escalations: 1,
    program: "Revenue Operations",
    evidence: [
      "Sprint ticket overdue 4 days",
      "Revenue Ops blocked on analytics",
    ],
    proofRef: "ALLOY-W-0499",
    status: "warn",
  },
  {
    id: "debt-008",
    title: "Security Access Review — Q1 Cycle",
    team: "Security + IT",
    owner: "Omar Khalil",
    type: "overdue",
    score: 54,
    ageDays: 12,
    escalations: 0,
    program: "Security & Compliance",
    evidence: [
      "Q1 cycle due Apr 1 — 17 days overdue",
      "SOC 2 evidence window affected",
    ],
    proofRef: "ALLOY-W-0411",
    status: "warn",
  },
  {
    id: "debt-009",
    title: "Customer NPS Triage — March Cohort",
    team: "Customer Success",
    owner: "Aaliya Torres",
    type: "overdue",
    score: 48,
    ageDays: 8,
    escalations: 0,
    program: "Customer Success",
    evidence: [
      "NPS triage workflow started Mar 31 — 19 accounts untouched",
      "2 detractor accounts escalated to at-risk",
    ],
    proofRef: "ALLOY-W-0477",
    status: "warn",
  },
  {
    id: "debt-010",
    title: "Pricing Page Copy Refresh",
    team: "Marketing",
    owner: "Carla Mendez",
    type: "overdue",
    score: 31,
    ageDays: 4,
    escalations: 0,
    program: "Go-to-Market",
    evidence: ["Revision requested Apr 14 — not started"],
    proofRef: "ALLOY-W-0533",
    status: "info",
  },
];

export const debtScoreHistory = [
  { date: "Mar 1",  critical: 2, high: 6,  medium: 14, total: 28 },
  { date: "Mar 8",  critical: 2, high: 7,  medium: 15, total: 30 },
  { date: "Mar 15", critical: 3, high: 8,  medium: 16, total: 32 },
  { date: "Mar 22", critical: 2, high: 8,  medium: 17, total: 32 },
  { date: "Mar 29", critical: 3, high: 9,  medium: 19, total: 36 },
  { date: "Apr 5",  critical: 4, high: 11, medium: 21, total: 40 },
  { date: "Apr 12", critical: 4, high: 12, medium: 23, total: 43 },
  { date: "Apr 18", critical: 4, high: 12, medium: 23, total: 43 },
];

// ─── Decision Replay ─────────────────────────────────────────────────────────

export const replayScenarios: ReplayScenario[] = [
  {
    id: "replay-001",
    title: "Q1 Enterprise Launch Pause",
    decision: "Decision to delay enterprise launch from Mar 28 → May 15",
    outcome: "Launch postponed. 3 pilot customers notified. $420K ARR delayed.",
    dateRange: "Mar 14 – Mar 25, 2026",
    events: [
      {
        id: "e-001",
        timestamp: "Mar 14, 09:12",
        actor: "Alloy Sensor",
        role: "System",
        action: "Signal detected",
        signal: "INFRA_STABILITY_DROP",
        detail: "p99 latency spiked to 1,840ms on enterprise data pipeline. Baseline: 220ms. Threshold: 400ms.",
        evidenceType: "alloy",
        proofRef: "ALLOY-S-8821",
      },
      {
        id: "e-002",
        timestamp: "Mar 14, 09:15",
        actor: "Alloy Workflow",
        role: "System",
        action: "Alert routed",
        detail: "Escalation rule fired: INFRA_STABILITY → Engineering On-Call + VP Engineering.",
        evidenceType: "alloy",
        proofRef: "ALLOY-S-8821",
      },
      {
        id: "e-003",
        timestamp: "Mar 14, 10:44",
        actor: "Lena Vasquez",
        role: "VP Engineering",
        action: "Acknowledged alert",
        detail: "Confirmed latency degradation. Opened war room. Root cause investigation started.",
        evidenceType: "human",
        proofRef: "ALLOY-A-4102",
      },
      {
        id: "e-004",
        timestamp: "Mar 16, 14:30",
        actor: "Ben Kowalski",
        role: "Staff Engineer",
        action: "Root cause identified",
        detail: "Database index fragmentation on enterprise_events table. Requires 48h rebuild window. Live rebuild unsafe during launch.",
        evidenceType: "human",
        proofRef: "ALLOY-A-4118",
      },
      {
        id: "e-005",
        timestamp: "Mar 16, 15:00",
        actor: "Lena Vasquez",
        role: "VP Engineering",
        action: "Risk memo sent to leadership",
        detail: "Memo: 'Index rebuild cannot complete safely before Mar 28. Recommend launch delay of 6 weeks.'",
        evidenceType: "human",
        proofRef: "ALLOY-A-4119",
      },
      {
        id: "e-006",
        timestamp: "Mar 17, 09:00",
        actor: "Alloy Sensor",
        role: "System",
        action: "Signal detected",
        signal: "CUSTOMER_SENTIMENT_DIP",
        detail: "Pilot customer Meridian Corp — support ticket volume +340% in 7 days. NPS proxy signal: at-risk.",
        evidenceType: "alloy",
        proofRef: "ALLOY-S-8849",
      },
      {
        id: "e-007",
        timestamp: "Mar 18, 11:30",
        actor: "Aaliya Torres",
        role: "CS Lead",
        action: "Reported to COO",
        detail: "3 of 5 pilot customers flagged reliability concerns. Meridian: 'Not ready to go live on this.'",
        evidenceType: "human",
        proofRef: "ALLOY-A-4134",
      },
      {
        id: "e-008",
        timestamp: "Mar 19, 09:00",
        actor: "David Osei",
        role: "COO",
        action: "Decision meeting called",
        detail: "All signals reviewed: infra risk, pilot sentiment, ARR exposure. Go/no-go for Mar 28 launch.",
        evidenceType: "human",
        proofRef: "ALLOY-A-4141",
      },
      {
        id: "e-009",
        timestamp: "Mar 19, 14:00",
        actor: "David Osei",
        role: "COO",
        action: "Decision made",
        signal: "LAUNCH_DELAYED",
        detail: "Launch moved to May 15. Engineering to complete index rebuild + pilot stabilization by May 1. CS to notify pilots.",
        evidenceType: "human",
        proofRef: "ALLOY-D-0201",
      },
      {
        id: "e-010",
        timestamp: "Mar 19, 14:45",
        actor: "Alloy Workflow",
        role: "System",
        action: "Decision recorded to ledger",
        detail: "ALLOY-D-0201 sealed. All contributing signals, memos, and actor confirmations anchored to decision record.",
        evidenceType: "alloy",
        proofRef: "ALLOY-D-0201",
      },
      {
        id: "e-011",
        timestamp: "Mar 19, 16:00",
        actor: "Aaliya Torres",
        role: "CS Lead",
        action: "Pilot customers notified",
        detail: "Meridian, Westfield Capital, and Halloway Group notified of delay with revised onboarding timeline.",
        evidenceType: "human",
        proofRef: "ALLOY-A-4148",
      },
    ],
  },
  {
    id: "replay-002",
    title: "Series A Follow-On Tranche Release",
    decision: "Approval to release $3.2M Series A follow-on tranche for infra scaling",
    outcome: "Tranche released Mar 5. Infrastructure procurement initiated.",
    dateRange: "Feb 20 – Mar 5, 2026",
    events: [
      {
        id: "r2-e001",
        timestamp: "Feb 20, 10:00",
        actor: "Alloy Sensor",
        role: "System",
        action: "Signal detected",
        signal: "INFRA_CAPACITY_FORECAST",
        detail: "Runway projection: current infra reaches capacity ceiling at 94% utilization by Apr 10 at current growth rate.",
        evidenceType: "alloy",
        proofRef: "ALLOY-S-8700",
      },
      {
        id: "r2-e002",
        timestamp: "Feb 21, 09:30",
        actor: "Lena Vasquez",
        role: "VP Engineering",
        action: "Capacity brief prepared",
        detail: "Options memo: (A) scale now at $3.2M, 6-week lead time. (B) defer 8 weeks, risk 20% uptime degradation.",
        evidenceType: "human",
        proofRef: "ALLOY-A-4050",
      },
      {
        id: "r2-e003",
        timestamp: "Feb 24, 14:00",
        actor: "Nalini Rao",
        role: "CFO",
        action: "Tranche approval requested",
        detail: "Formal request filed with Series A investors for $3.2M follow-on per agreement clause 8.4.",
        evidenceType: "human",
        proofRef: "ALLOY-A-4061",
      },
      {
        id: "r2-e004",
        timestamp: "Mar 3, 09:00",
        actor: "Investor Consortium",
        role: "Board",
        action: "Tranche approved",
        detail: "All 4 lead investors approved. Wire initiated. Funds expected Mar 5.",
        evidenceType: "human",
        proofRef: "ALLOY-D-0195",
      },
      {
        id: "r2-e005",
        timestamp: "Mar 5, 11:00",
        actor: "Alloy Workflow",
        role: "System",
        action: "Decision recorded to ledger",
        detail: "ALLOY-D-0195 sealed. Procurement workflow initiated automatically.",
        evidenceType: "alloy",
        proofRef: "ALLOY-D-0195",
      },
    ],
  },
];

// ─── Board View ──────────────────────────────────────────────────────────────

export const boardMetrics: BoardMetric[] = [
  { label: "Ownership Drift Items", value: 6, delta: "+2 vs last week", trend: "up", context: "6 work items stalled with unclear or contested ownership", good: "down" },
  { label: "Action Debt Score", value: 43, delta: "+11 in 30 days", trend: "up", context: "Weighted index of overdue, blocked, looping, and escalated work", good: "down" },
  { label: "Pressure Index (max)", value: "88/100", delta: "CS Escalation Mgmt", trend: "up", context: "Highest single workflow pressure in the organisation", good: "down" },
  { label: "Decisions Replayed (30d)", value: 2, delta: "fully anchored", trend: "flat", context: "All decisions carry full proof chains in the Alloy ledger", good: "up" },
  { label: "At-Risk Revenue", value: "$600K", delta: "ARR in drift path", trend: "up", context: "Meridian renewal ($180K) + Q1 Enterprise delay ($420K)", good: "down" },
  { label: "Critical Debt Items", value: 4, delta: "Immediate action required", trend: "up", context: "Score ≥ 80 on the Action Debt Index", good: "down" },
];

export const boardRisks: BoardRisk[] = [
  {
    id: "risk-001",
    title: "Vendor Contract Lapse — CloudPlatform",
    severity: "critical",
    domain: "Operations / Legal",
    signal: "Contract expires May 3. 3-way ownership deadlock. 14 days no movement.",
    recommendation: "COO to name single decision authority within 24h. Legal to prepare emergency renewal terms as fallback.",
    proofRef: "ALLOY-W-0388",
    interventionOwner: "COO",
    deadline: "Apr 19, 2026",
  },
  {
    id: "risk-002",
    title: "Q2 Board Deck Blocked — Forecast Drift",
    severity: "critical",
    domain: "Finance / Strategy",
    signal: "Revenue forecast revision stalled 11 days. Board deck assembly blocked. Investor meeting at risk.",
    recommendation: "CFO to close forecast with best-available data by Apr 19. Strategy to provide single-line comment only.",
    proofRef: "ALLOY-W-0491",
    interventionOwner: "CFO",
    deadline: "Apr 19, 2026",
  },
  {
    id: "risk-003",
    title: "Meridian Renewal at Risk — $180K ARR",
    severity: "critical",
    domain: "Customer Success / Product",
    signal: "7-day ownership drift on product decision. NPS proxy down 21 points. Renewal conversation paused.",
    recommendation: "Product to issue go/no-go on requested feature by Apr 19. If no, CS to offer compensating roadmap commitment.",
    proofRef: "ALLOY-W-0514",
    interventionOwner: "CPO",
    deadline: "Apr 19, 2026",
  },
  {
    id: "risk-004",
    title: "Series B Data Room Gap",
    severity: "high",
    domain: "Corporate Finance / Data",
    signal: "4th repeat request for Alloy metrics pack. Investor call Apr 20. Deck incomplete.",
    recommendation: "Data team to produce read-only Alloy connector report by Apr 19 EOD. CFO to review Apr 20 morning.",
    proofRef: "ALLOY-W-0503",
    interventionOwner: "CTO / CFO",
    deadline: "Apr 19, 2026",
  },
  {
    id: "risk-005",
    title: "CS Escalation Pressure — Score 88/100",
    severity: "high",
    domain: "Customer Success",
    signal: "Highest pressure workflow in the company. 8 escalated items, 12 overdue. Team is approaching capacity.",
    recommendation: "COO to review CS staffing model. Implement tiered escalation triage to redirect Tier 1 items.",
    proofRef: "ALLOY-P-CS-001",
    interventionOwner: "COO / VP CS",
    deadline: "Apr 25, 2026",
  },
  {
    id: "risk-006",
    title: "EMEA May 1 Launch at Risk",
    severity: "medium",
    domain: "Legal / Marketing",
    signal: "GDPR review blocked — named reviewer on leave, no backup. Review needed before Apr 24.",
    recommendation: "Assign backup GDPR reviewer from Legal team immediately. Consider external counsel if no internal resource.",
    proofRef: "ALLOY-W-0541",
    interventionOwner: "General Counsel",
    deadline: "Apr 21, 2026",
  },
];
