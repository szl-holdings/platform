export type SignalSeverity = "critical" | "high" | "medium" | "low" | "stable";
export type SignalType = "approval_latency" | "stalled_workflow" | "ownership_gap" | "forecast_drift" | "handoff_failure" | "pipeline_hygiene" | "revenue_leakage";
export type RoleView = "executive" | "operations" | "delivery";

export interface BusinessSignal {
  id: string;
  type: SignalType;
  severity: SignalSeverity;
  title: string;
  summary: string;
  whyItMatters: string;
  affectedFunction: string;
  owner: string;
  ownerTeam: string;
  recommendedAction: string;
  valueAtRisk: number;
  detectedAt: string;
  status: "active" | "acknowledged" | "resolved";
  relatedSignals?: string[];
  anomaly?: string;
  sourceData?: string;
  timeline?: { time: string; event: string }[];
}

export interface NarrativeInsight {
  id: string;
  title: string;
  body: string;
  signalIds: string[];
  severity: SignalSeverity;
  function: string;
  trend: "worsening" | "stable" | "improving";
  valueAtRisk: number;
  detectedAt: string;
}

export interface ActionItem {
  id: string;
  title: string;
  owner: string;
  ownerTeam: string;
  urgency: "immediate" | "today" | "this_week" | "next_week";
  valueProtected: number;
  dueBy: string;
  status: "open" | "in_progress" | "blocked" | "done";
  dependencies: string[];
  signalIds: string[];
  roleRelevance: RoleView[];
}

export interface WorkflowStage {
  name: string;
  avgDwellDays: number;
  expectedDays: number;
  stagnatCount: number;
  owner: string;
}

export interface WorkflowLatency {
  id: string;
  name: string;
  function: string;
  totalDwellDays: number;
  expectedDays: number;
  stages: WorkflowStage[];
  valueAtRisk: number;
  severity: SignalSeverity;
}

export interface OwnershipRecord {
  id: string;
  area: string;
  team: string;
  owner: string | null;
  status: "clear" | "ambiguous" | "missing";
  openItems: number;
  stalledItems: number;
  valueAtRisk: number;
}

export interface ValueAtRiskRecord {
  category: string;
  amount: number;
  trend: number;
  signalType: SignalType;
  workflows: string[];
}

export interface KPICard {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend: number;
  trendLabel: string;
  severity: SignalSeverity;
  roleRelevance: RoleView[];
  sublabel?: string;
}

const now = Date.now();
const minsAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

export const signals: BusinessSignal[] = [
  {
    id: "SIG-001",
    type: "approval_latency",
    severity: "critical",
    title: "Enterprise deal approvals averaging 14.2 business days — 340% above target",
    summary: "Eight enterprise deals ($4.2M combined ARR) have been pending legal/finance approval for 10–18 business days. Historical average is 3.2 days.",
    whyItMatters: "At current close probability decay rate, 3 of these deals are projected to slip from Q1 to Q2. Forecast impact estimated at $2.1M.",
    affectedFunction: "Enterprise Sales",
    owner: "Marcus Webb",
    ownerTeam: "Revenue Operations",
    recommendedAction: "Escalate to CFO approval track; flag deals >10 days for executive sponsor outreach. Remove blockers in legal review queue.",
    valueAtRisk: 2100000,
    detectedAt: minsAgo(18),
    status: "active",
    relatedSignals: ["SIG-004", "SIG-009"],
    anomaly: "Approval latency increased 21% over the past 10 business days. Highest outlier: Veritas Corp deal at 18 days with no owner activity in 7 days.",
    sourceData: "CRM pipeline + approval workflow logs",
    timeline: [
      { time: daysAgo(18), event: "Veritas Corp deal submitted for approval" },
      { time: daysAgo(14), event: "Legal review assigned — no activity since" },
      { time: daysAgo(10), event: "Anomaly threshold breached (10-day dwell)" },
      { time: daysAgo(7), event: "Finance approval requested but not opened" },
      { time: minsAgo(18), event: "Signal detected by Lyte" },
    ],
  },
  {
    id: "SIG-002",
    type: "stalled_workflow",
    severity: "critical",
    title: "14 implementation projects in 'pending handoff' for 8+ days with no assignee",
    summary: "Post-sale implementation queue has 14 projects stalled at the delivery handoff stage. No CSM or implementation engineer assigned. Mean days stalled: 11.4.",
    whyItMatters: "Customer onboarding SLA is 5 business days to first contact. All 14 are in breach. Churn risk on 4 accounts exceeds $890K ARR.",
    affectedFunction: "Customer Success",
    owner: "Diana Reyes",
    ownerTeam: "Delivery Operations",
    recommendedAction: "Assign capacity from bench pool immediately. Escalate top 4 accounts to VP CS. Activate overflow staffing protocol.",
    valueAtRisk: 890000,
    detectedAt: minsAgo(35),
    status: "active",
    relatedSignals: ["SIG-007"],
    anomaly: "Handoff queue volume up 67% vs. prior 30-day average. Capacity bottleneck traced to 2 senior IMs on leave simultaneously.",
    sourceData: "Project management system + CS platform",
    timeline: [
      { time: daysAgo(11), event: "Oldest stalled project: Nexus Group implementation" },
      { time: daysAgo(8), event: "Handoff queue SLA breach threshold crossed" },
      { time: daysAgo(5), event: "Auto-escalation attempted — no owner resolved" },
      { time: minsAgo(35), event: "Signal detected by Lyte" },
    ],
  },
  {
    id: "SIG-003",
    type: "forecast_drift",
    severity: "critical",
    title: "Q1 forecast dropped $3.8M in 10 days — commit probability collapsing across mid-market segment",
    summary: "Mid-market segment commit has fallen from $12.4M to $8.6M over 10 business days. 22 deals reclassified from 'commit' to 'best case'.",
    whyItMatters: "Q1 board commitment is $11.2M. Current trajectory implies a $2.6M miss. No corrective actions have been filed by segment leadership.",
    affectedFunction: "Revenue",
    owner: "Priya Nair",
    ownerTeam: "Mid-Market Sales",
    recommendedAction: "Convene forecast review with VP Sales. Identify 5–7 deals for acceleration. Assess whether pipeline coverage compensates.",
    valueAtRisk: 3800000,
    detectedAt: minsAgo(8),
    status: "active",
    relatedSignals: ["SIG-001", "SIG-011"],
    anomaly: "Steepest 10-day forecast decline in 6 quarters. Rate of reclassification (22 deals) is 3.1x historical norm.",
    sourceData: "CRM forecast + revenue intelligence platform",
    timeline: [
      { time: daysAgo(10), event: "First 4 deals reclassified commit → best case" },
      { time: daysAgo(7), event: "12 additional deals downgraded" },
      { time: daysAgo(4), event: "Total forecast drop crosses $2M threshold" },
      { time: minsAgo(8), event: "Signal detected: $3.8M total drift" },
    ],
  },
  {
    id: "SIG-004",
    type: "ownership_gap",
    severity: "high",
    title: "7 enterprise renewals ($2.3M) have no named owner — 60+ days to expiry",
    summary: "Seven enterprise accounts with combined ARR of $2.3M are approaching renewal with no assigned account executive or CSM in the system.",
    whyItMatters: "Unowned renewals churn at 4.2x the rate of owned accounts. At 60 days, win rate drops precipitously without early outreach.",
    affectedFunction: "Account Management",
    owner: "Unassigned",
    ownerTeam: "Enterprise Sales",
    recommendedAction: "Assign AE/CSM pairs within 24 hours. Initiate health checks on all 7 accounts. Prioritize by ARR and health score.",
    valueAtRisk: 2300000,
    detectedAt: minsAgo(52),
    status: "active",
    relatedSignals: ["SIG-001"],
    anomaly: "Ownership gap is 2.1x larger than same period last quarter. Root cause: 2 AEs departed without territory reassignment.",
    sourceData: "CRM ownership records + renewal calendar",
  },
  {
    id: "SIG-005",
    type: "handoff_failure",
    severity: "high",
    title: "Sales → Solutions Engineering handoff queue at 31 deals — 9-day median wait",
    summary: "SE team is receiving pre-sales technical requests 9 days after initial qualification. Standard SLA is 2 days. Queue has grown 47% in 3 weeks.",
    whyItMatters: "Late SE engagement correlates with 28% lower win rate. 6 deals in queue are >$500K TCV with discovery calls scheduled.",
    affectedFunction: "Pre-Sales",
    owner: "James Okafor",
    ownerTeam: "Solutions Engineering",
    recommendedAction: "Triage queue by deal size. Fast-track >$300K TCV. Evaluate capacity expansion or priority matrix revision.",
    valueAtRisk: 1400000,
    detectedAt: minsAgo(74),
    status: "acknowledged",
    relatedSignals: ["SIG-009"],
    anomaly: "Queue growth rate outpaced hiring plan. SE capacity model was last updated 4 months ago.",
    sourceData: "SE queue management + CRM opportunity data",
  },
  {
    id: "SIG-006",
    type: "pipeline_hygiene",
    severity: "high",
    title: "41% of pipeline opportunities have no next step or activity in 14+ days",
    summary: "Of 284 active pipeline opportunities, 116 show no logged activity (call, email, meeting) in the past 14 days and no next step date.",
    whyItMatters: "Stale pipeline corrupts forecast accuracy and wastes capacity. These 116 deals represent $8.4M in reported pipeline but have minimal actual probability.",
    affectedFunction: "Sales Operations",
    owner: "Rosa Kim",
    ownerTeam: "Revenue Operations",
    recommendedAction: "Mandatory pipeline review by reps this week. Auto-age to lower stage after 21 days no activity. Manager review of >$200K stale deals.",
    valueAtRisk: 840000,
    detectedAt: minsAgo(110),
    status: "active",
    anomaly: "Stale deal percentage increased from 28% to 41% over the past 3 weeks. Correlates with new sales methodology rollout.",
    sourceData: "CRM activity logs + pipeline analytics",
  },
  {
    id: "SIG-007",
    type: "stalled_workflow",
    severity: "high",
    title: "Professional services SOWs awaiting client signature — average 19 days",
    summary: "12 professional services statements of work have been sent to clients and are awaiting signature. Average days outstanding is 19; oldest is 34 days.",
    whyItMatters: "Revenue cannot be recognized until SOW is signed. $1.1M in delivery revenue is blocked. Project start dates are slipping.",
    affectedFunction: "Professional Services",
    owner: "Anika Mehta",
    ownerTeam: "Delivery",
    recommendedAction: "Client outreach on all 12. Engage executive sponsors for deals >34 days. Review client-side blockers and offer e-signature acceleration.",
    valueAtRisk: 1100000,
    detectedAt: minsAgo(130),
    status: "active",
    relatedSignals: ["SIG-002"],
    anomaly: "Signing latency up 38% vs Q4. Client-side legal review is primary bottleneck per rep notes.",
    sourceData: "Contract management system + project delivery tracker",
  },
  {
    id: "SIG-008",
    type: "revenue_leakage",
    severity: "medium",
    title: "Usage-based billing discrepancy: 23 accounts under-billed by estimated $340K",
    summary: "Usage telemetry shows 23 accounts consuming beyond contracted tier limits for 2+ billing cycles without upgrade or overage charge applied.",
    whyItMatters: "Under-billing represents direct revenue leakage. Also creates adoption risk — uncapped usage patterns may reset when billing is corrected.",
    affectedFunction: "Finance / Billing",
    owner: "Tom Farrell",
    ownerTeam: "Finance Operations",
    recommendedAction: "Finance audit of billing rules against usage data. CSM outreach to affected accounts before corrective billing. Consider expansion offer framing.",
    valueAtRisk: 340000,
    detectedAt: minsAgo(195),
    status: "acknowledged",
    anomaly: "New usage-based pricing tier launched 6 weeks ago. Billing system rule propagation appears to have failed for accounts migrated before cutover.",
    sourceData: "Usage telemetry + billing system reconciliation",
  },
  {
    id: "SIG-009",
    type: "approval_latency",
    severity: "medium",
    title: "Discount approval chain averaging 5.8 days — 3 deals at risk of close-date slip",
    summary: "Non-standard discount requests (>25%) require VP and CFO sign-off. 11 active requests averaging 5.8 business days to approval. Standard is 2 days.",
    whyItMatters: "3 deals with customer-committed close dates in the next 7 days are blocked on discount approval. Combined TCV: $870K.",
    affectedFunction: "Deal Desk",
    owner: "Kenji Watanabe",
    ownerTeam: "Deal Desk",
    recommendedAction: "Escalate 3 expiring deals to CFO today. Review approval chain for bottlenecks. Consider pre-approved discount bands to reduce approval load.",
    valueAtRisk: 870000,
    detectedAt: minsAgo(220),
    status: "active",
    relatedSignals: ["SIG-001", "SIG-005"],
    anomaly: "VP-level approvers on travel has added 2.1 days average to approval cycle.",
    sourceData: "Deal desk system + approval workflow logs",
  },
  {
    id: "SIG-010",
    type: "pipeline_hygiene",
    severity: "medium",
    title: "18 opportunities stuck in 'Proposal Sent' for 30+ days with no response logged",
    summary: "Eighteen deals have been in 'Proposal Sent' stage for 30+ days without a follow-up logged. Proposal acceptance rate at this stage drops 60% after 3 weeks.",
    whyItMatters: "Pipeline stage accuracy is distorted. These 18 deals inflate pipeline by $2.1M but have negligible realistic probability.",
    affectedFunction: "Sales",
    owner: "Various",
    ownerTeam: "Mid-Market Sales",
    recommendedAction: "Rep outreach required this week. If no client engagement by day 35, auto-move to Nurture stage and remove from commit forecast.",
    valueAtRisk: 420000,
    detectedAt: minsAgo(280),
    status: "active",
    anomaly: "Proposal acceptance rate declined from 52% to 31% over the past quarter. Pricing competitiveness review may be warranted.",
    sourceData: "CRM stage data + email engagement tracking",
  },
  {
    id: "SIG-011",
    type: "forecast_drift",
    severity: "medium",
    title: "Enterprise segment Q1 commit coverage below 1.0x for first time in 5 quarters",
    summary: "Enterprise pipeline coverage against Q1 commit has dropped to 0.94x. Historical target is 1.3x at this stage in the quarter.",
    whyItMatters: "Coverage below 1.0x means there is not enough pipeline to cover the committed number even at 100% close rate. Requires either pull-forward deals or expectation management.",
    affectedFunction: "Revenue",
    owner: "Sarah Donovan",
    ownerTeam: "Enterprise Sales",
    recommendedAction: "Source 3–5 accelerated deals from late-stage partners. Review if any Q2 pipeline can be pulled forward. Revise Q1 commit expectation with board.",
    valueAtRisk: 1800000,
    detectedAt: minsAgo(340),
    status: "active",
    relatedSignals: ["SIG-003"],
    anomaly: "Coverage ratio declining at 0.04x per week. At this rate, will reach 0.80x before quarter-end.",
    sourceData: "Revenue intelligence platform + CRM data",
  },
  {
    id: "SIG-012",
    type: "handoff_failure",
    severity: "low",
    title: "Customer success QBR completion rate at 61% — 39% of enterprise accounts unreviewed this quarter",
    summary: "Of 74 enterprise accounts due for quarterly business reviews, 29 have not had a QBR completed or scheduled. Quarter ends in 22 business days.",
    whyItMatters: "Accounts without QBRs have 2.3x higher churn rate at renewal. 29 unreviewed accounts represent $4.1M ARR at elevated risk.",
    affectedFunction: "Customer Success",
    owner: "Maria Vasquez",
    ownerTeam: "Enterprise Customer Success",
    recommendedAction: "CSM outreach this week to all 29 accounts. Prioritize by health score and ARR. Compress QBR format to 30-min virtual if needed.",
    valueAtRisk: 820000,
    detectedAt: minsAgo(390),
    status: "acknowledged",
    anomaly: "QBR completion rate lowest in 3 years. Correlation with CS team expansion — new CSMs not yet at full book capacity.",
    sourceData: "CS platform + meeting activity logs",
  },
];

export const narrativeInsights: NarrativeInsight[] = [
  {
    id: "INS-001",
    title: "Approval latency is compounding across enterprise segment — $2.1M Q1 impact imminent",
    body: "Approval latency in enterprise deals has increased 21% over the past 10 business days and is now 340% above target. Eight deals totaling $4.2M ARR have been pending legal and finance approval for 10–18 days each. At historical close-probability decay rates, three of these deals are projected to slip from Q1 to Q2, representing $2.1M in forecast impact. The bottleneck appears concentrated in the legal review queue, where one approver handles 70% of enterprise contract volume.",
    signalIds: ["SIG-001", "SIG-009"],
    severity: "critical",
    function: "Enterprise Sales",
    trend: "worsening",
    valueAtRisk: 2100000,
    detectedAt: minsAgo(18),
  },
  {
    id: "INS-002",
    title: "Q1 mid-market forecast has lost $3.8M in credibility over 10 days — board commit at risk",
    body: "The mid-market segment has reclassified 22 deals from 'commit' to 'best case' over the past 10 business days, dropping the commit total from $12.4M to $8.6M. This is the steepest 10-day forecast decline in six quarters, running at 3.1 times the historical reclassification rate. Q1 board commitment stands at $11.2M, implying a $2.6M gap if the current trajectory holds. No corrective acceleration plan has been filed by segment leadership, and enterprise pipeline coverage has simultaneously dropped below 1.0x for the first time in five quarters.",
    signalIds: ["SIG-003", "SIG-011"],
    severity: "critical",
    function: "Revenue",
    trend: "worsening",
    valueAtRisk: 3800000,
    detectedAt: minsAgo(8),
  },
  {
    id: "INS-003",
    title: "Delivery handoff failures are compressing customer onboarding performance — churn signal emerging",
    body: "Two concurrent breakdowns in delivery operations are compounding each other. The implementation handoff queue has 14 projects stalled with no assignee, breaching the 5-day first-contact SLA for all 14. Simultaneously, 12 professional services SOWs have been awaiting client signature for an average of 19 days. Together, these create a customer experience gap that puts $1.99M in ARR at elevated churn risk. The root cause traces to two senior implementation managers on unplanned leave without coverage assignment.",
    signalIds: ["SIG-002", "SIG-007"],
    severity: "high",
    function: "Delivery Operations",
    trend: "worsening",
    valueAtRisk: 1990000,
    detectedAt: minsAgo(35),
  },
  {
    id: "INS-004",
    title: "Pipeline hygiene has deteriorated — $8.4M in forecast may be overstated",
    body: "Pipeline quality indicators have degraded significantly over the past three weeks. Forty-one percent of active opportunities show no activity in 14 or more days, up from 28% three weeks ago. Additionally, 18 deals in 'Proposal Sent' stage have sat without client response for over 30 days, a stage at which acceptance rates drop 60%. These data quality issues inflate reported pipeline by an estimated $8.4M and undermine forecast model accuracy at a critical point in Q1.",
    signalIds: ["SIG-006", "SIG-010"],
    severity: "high",
    function: "Sales Operations",
    trend: "worsening",
    valueAtRisk: 840000,
    detectedAt: minsAgo(110),
  },
  {
    id: "INS-005",
    title: "Ownership gaps in renewals and accounts are creating compounding risk",
    body: "Seven enterprise accounts with $2.3M in combined ARR are approaching renewal dates without a named account executive or CSM assigned. Concurrently, 29 enterprise accounts have not received their quarterly business review this quarter, representing $4.1M in ARR at elevated churn risk. Accounts without consistent ownership churn at 4.2x the rate of owned accounts. Both gaps appear linked to recent AE departures and new CSM ramp times not yet reflected in account assignments.",
    signalIds: ["SIG-004", "SIG-012"],
    severity: "high",
    function: "Account Management",
    trend: "stable",
    valueAtRisk: 1120000,
    detectedAt: minsAgo(52),
  },
];

export const actionItems: ActionItem[] = [
  {
    id: "ACT-001",
    title: "Escalate 3 enterprise deals to CFO approval track — close dates in 7 days",
    owner: "Marcus Webb",
    ownerTeam: "Revenue Operations",
    urgency: "immediate",
    valueProtected: 2100000,
    dueBy: "Today",
    status: "open",
    dependencies: [],
    signalIds: ["SIG-001"],
    roleRelevance: ["executive", "operations"],
  },
  {
    id: "ACT-002",
    title: "Assign implementation engineers to 14 stalled onboarding projects",
    owner: "Diana Reyes",
    ownerTeam: "Delivery Operations",
    urgency: "immediate",
    valueProtected: 890000,
    dueBy: "Today",
    status: "in_progress",
    dependencies: [],
    signalIds: ["SIG-002"],
    roleRelevance: ["operations", "delivery"],
  },
  {
    id: "ACT-003",
    title: "Convene Q1 forecast recovery session with VP Sales and segment leads",
    owner: "Priya Nair",
    ownerTeam: "Mid-Market Sales",
    urgency: "today",
    valueProtected: 3800000,
    dueBy: "Today",
    status: "open",
    dependencies: ["ACT-001"],
    signalIds: ["SIG-003", "SIG-011"],
    roleRelevance: ["executive"],
  },
  {
    id: "ACT-004",
    title: "Assign AE/CSM pairs to 7 unowned enterprise renewals",
    owner: "Sarah Donovan",
    ownerTeam: "Enterprise Sales",
    urgency: "today",
    valueProtected: 2300000,
    dueBy: "Today",
    status: "open",
    dependencies: [],
    signalIds: ["SIG-004"],
    roleRelevance: ["operations", "delivery"],
  },
  {
    id: "ACT-005",
    title: "Triage SE queue — fast-track 6 deals >$500K TCV for immediate engagement",
    owner: "James Okafor",
    ownerTeam: "Solutions Engineering",
    urgency: "today",
    valueProtected: 1400000,
    dueBy: "Today",
    status: "open",
    dependencies: [],
    signalIds: ["SIG-005"],
    roleRelevance: ["delivery", "operations"],
  },
  {
    id: "ACT-006",
    title: "Mandatory pipeline review: all reps clear stale deals or log next steps",
    owner: "Rosa Kim",
    ownerTeam: "Revenue Operations",
    urgency: "this_week",
    valueProtected: 840000,
    dueBy: "Fri",
    status: "open",
    dependencies: [],
    signalIds: ["SIG-006", "SIG-010"],
    roleRelevance: ["operations", "delivery"],
  },
  {
    id: "ACT-007",
    title: "Finance audit: reconcile usage billing discrepancy for 23 accounts",
    owner: "Tom Farrell",
    ownerTeam: "Finance Operations",
    urgency: "this_week",
    valueProtected: 340000,
    dueBy: "Thu",
    status: "open",
    dependencies: [],
    signalIds: ["SIG-008"],
    roleRelevance: ["executive", "operations"],
  },
  {
    id: "ACT-008",
    title: "CS outreach to 29 enterprise accounts — QBR scheduling before quarter-end",
    owner: "Maria Vasquez",
    ownerTeam: "Enterprise Customer Success",
    urgency: "this_week",
    valueProtected: 820000,
    dueBy: "Fri",
    status: "in_progress",
    dependencies: ["ACT-004"],
    signalIds: ["SIG-012"],
    roleRelevance: ["delivery", "operations"],
  },
];

export const workflowLatencies: WorkflowLatency[] = [
  {
    id: "WF-001",
    name: "Enterprise Deal Approval",
    function: "Revenue / Legal",
    totalDwellDays: 14.2,
    expectedDays: 3.2,
    stages: [
      { name: "Deal Desk Review", avgDwellDays: 1.8, expectedDays: 1.0, stagnatCount: 2, owner: "Deal Desk" },
      { name: "Legal Review", avgDwellDays: 7.1, expectedDays: 1.5, stagnatCount: 5, owner: "Legal" },
      { name: "Finance Approval", avgDwellDays: 3.9, expectedDays: 0.5, stagnatCount: 4, owner: "CFO Office" },
      { name: "Executive Sign-off", avgDwellDays: 1.4, expectedDays: 0.2, stagnatCount: 1, owner: "VP Sales" },
    ],
    valueAtRisk: 2100000,
    severity: "critical",
  },
  {
    id: "WF-002",
    name: "Implementation Handoff",
    function: "Customer Success / Delivery",
    totalDwellDays: 11.4,
    expectedDays: 2.0,
    stages: [
      { name: "Sales Close → CS Handoff", avgDwellDays: 4.2, expectedDays: 0.5, stagnatCount: 8, owner: "Sales Ops" },
      { name: "CSM Assignment", avgDwellDays: 3.1, expectedDays: 0.5, stagnatCount: 5, owner: "CS Leadership" },
      { name: "IM Assignment", avgDwellDays: 4.1, expectedDays: 1.0, stagnatCount: 9, owner: "Delivery Ops" },
    ],
    valueAtRisk: 890000,
    severity: "critical",
  },
  {
    id: "WF-003",
    name: "Professional Services SOW",
    function: "Delivery / Finance",
    totalDwellDays: 19.0,
    expectedDays: 7.0,
    stages: [
      { name: "Scoping Complete", avgDwellDays: 2.0, expectedDays: 2.0, stagnatCount: 0, owner: "PS Team" },
      { name: "Internal SOW Draft", avgDwellDays: 3.5, expectedDays: 2.0, stagnatCount: 2, owner: "Legal" },
      { name: "Client Review", avgDwellDays: 10.5, expectedDays: 3.0, stagnatCount: 9, owner: "Client" },
      { name: "Signature", avgDwellDays: 3.0, expectedDays: 0, stagnatCount: 3, owner: "Docusign/Client" },
    ],
    valueAtRisk: 1100000,
    severity: "high",
  },
  {
    id: "WF-004",
    name: "SE Engagement Queue",
    function: "Pre-Sales",
    totalDwellDays: 9.0,
    expectedDays: 2.0,
    stages: [
      { name: "Qualification Logged", avgDwellDays: 1.0, expectedDays: 0.5, stagnatCount: 3, owner: "Sales" },
      { name: "SE Queue", avgDwellDays: 5.8, expectedDays: 0.5, stagnatCount: 18, owner: "SE Ops" },
      { name: "SE Assignment", avgDwellDays: 2.2, expectedDays: 1.0, stagnatCount: 7, owner: "SE Leadership" },
    ],
    valueAtRisk: 1400000,
    severity: "high",
  },
  {
    id: "WF-005",
    name: "Renewal Cycle",
    function: "Account Management",
    totalDwellDays: 22.0,
    expectedDays: 14.0,
    stages: [
      { name: "Renewal Flag (90d out)", avgDwellDays: 5.0, expectedDays: 1.0, stagnatCount: 4, owner: "RevOps" },
      { name: "Owner Assignment", avgDwellDays: 9.0, expectedDays: 2.0, stagnatCount: 7, owner: "Enterprise Sales" },
      { name: "Health Check", avgDwellDays: 4.0, expectedDays: 3.0, stagnatCount: 3, owner: "CSM" },
      { name: "Commercial Negotiation", avgDwellDays: 4.0, expectedDays: 8.0, stagnatCount: 0, owner: "AE" },
    ],
    valueAtRisk: 2300000,
    severity: "high",
  },
];

export const ownershipMap: OwnershipRecord[] = [
  { id: "OWN-001", area: "Enterprise Renewals (60d)", team: "Enterprise Sales", owner: null, status: "missing", openItems: 7, stalledItems: 7, valueAtRisk: 2300000 },
  { id: "OWN-002", area: "Implementation Queue", team: "Delivery Ops", owner: null, status: "missing", openItems: 14, stalledItems: 14, valueAtRisk: 890000 },
  { id: "OWN-003", area: "Discount Approvals", team: "Deal Desk", owner: "Kenji Watanabe", status: "ambiguous", openItems: 11, stalledItems: 4, valueAtRisk: 870000 },
  { id: "OWN-004", area: "Mid-Market Forecast Recovery", team: "Mid-Market Sales", owner: "Priya Nair", status: "ambiguous", openItems: 22, stalledItems: 8, valueAtRisk: 3800000 },
  { id: "OWN-005", area: "Enterprise QBR Completion", team: "Enterprise CS", owner: "Maria Vasquez", status: "ambiguous", openItems: 29, stalledItems: 12, valueAtRisk: 820000 },
  { id: "OWN-006", area: "SE Engagement Queue", team: "Solutions Engineering", owner: "James Okafor", status: "clear", openItems: 31, stalledItems: 6, valueAtRisk: 1400000 },
  { id: "OWN-007", area: "Revenue Billing Reconciliation", team: "Finance Operations", owner: "Tom Farrell", status: "clear", openItems: 23, stalledItems: 0, valueAtRisk: 340000 },
  { id: "OWN-008", area: "Pipeline Hygiene", team: "Revenue Operations", owner: "Rosa Kim", status: "clear", openItems: 134, stalledItems: 28, valueAtRisk: 840000 },
];

export const valueAtRiskBreakdown: ValueAtRiskRecord[] = [
  { category: "Forecast Drift", amount: 5600000, trend: 18.4, signalType: "forecast_drift", workflows: ["Q1 Mid-Market", "Enterprise Coverage"] },
  { category: "Approval Latency", amount: 2970000, trend: 21.0, signalType: "approval_latency", workflows: ["Enterprise Approval", "Discount Approval"] },
  { category: "Ownership Gaps", amount: 3190000, trend: 7.2, signalType: "ownership_gap", workflows: ["Renewals", "Onboarding"] },
  { category: "Stalled Workflows", amount: 1990000, trend: 38.0, signalType: "stalled_workflow", workflows: ["Implementation", "SOW Signing"] },
  { category: "Handoff Failures", amount: 2290000, trend: 12.5, signalType: "handoff_failure", workflows: ["SE Queue", "QBR Cycle"] },
  { category: "Pipeline Hygiene", amount: 1260000, trend: -5.2, signalType: "pipeline_hygiene", workflows: ["Stale Opportunities"] },
  { category: "Revenue Leakage", amount: 340000, trend: 0, signalType: "revenue_leakage", workflows: ["Usage Billing"] },
];

export const totalValueAtRisk = valueAtRiskBreakdown.reduce((sum, r) => sum + r.amount, 0);

export const kpiCards: KPICard[] = [
  {
    id: "kpi-var",
    label: "Total Value at Risk",
    value: "$17.6M",
    trend: 12.4,
    trendLabel: "vs. 30-day avg",
    severity: "critical",
    roleRelevance: ["executive"],
    sublabel: "Across active signals",
  },
  {
    id: "kpi-approval-latency",
    label: "Avg Approval Latency",
    value: "14.2 days",
    trend: 21.0,
    trendLabel: "vs. 10-day prior",
    severity: "critical",
    roleRelevance: ["executive", "operations"],
    sublabel: "Target: 3.2 days",
  },
  {
    id: "kpi-stalled-workflows",
    label: "Stalled Workflows",
    value: 28,
    trend: 40.0,
    trendLabel: "vs. prior month",
    severity: "critical",
    roleRelevance: ["operations", "delivery"],
    sublabel: "Requiring immediate action",
  },
  {
    id: "kpi-forecast-drift",
    label: "Q1 Forecast Drift",
    value: "-$3.8M",
    trend: -30.6,
    trendLabel: "10-day change",
    severity: "critical",
    roleRelevance: ["executive"],
    sublabel: "Mid-market segment",
  },
  {
    id: "kpi-ownership-gaps",
    label: "Ownership Gaps",
    value: 21,
    trend: 16.7,
    trendLabel: "vs. prior quarter",
    severity: "high",
    roleRelevance: ["operations", "executive"],
    sublabel: "High-value items unassigned",
  },
  {
    id: "kpi-pipeline-hygiene",
    label: "Pipeline Staleness",
    value: "41%",
    trend: 13.0,
    trendLabel: "vs. 3 weeks ago",
    severity: "high",
    roleRelevance: ["operations", "delivery"],
    sublabel: "No activity in 14+ days",
  },
  {
    id: "kpi-handoff-failures",
    label: "Handoff SLA Breach",
    value: "14",
    trend: 67.0,
    trendLabel: "vs. prior 30 days",
    severity: "high",
    roleRelevance: ["delivery", "operations"],
    sublabel: "Implementation projects",
  },
  {
    id: "kpi-active-signals",
    label: "Active Signals",
    value: 12,
    trend: 8.3,
    trendLabel: "vs. 7-day avg",
    severity: "medium",
    roleRelevance: ["executive", "operations", "delivery"],
    sublabel: "3 critical, 5 high",
  },
];

export const varTrend = [
  { date: "Mar 1", amount: 8.2 },
  { date: "Mar 5", amount: 9.4 },
  { date: "Mar 10", amount: 11.1 },
  { date: "Mar 15", amount: 13.8 },
  { date: "Mar 20", amount: 15.2 },
  { date: "Mar 25", amount: 16.4 },
  { date: "Today", amount: 17.6 },
];

export const signalTrend = [
  { date: "Mar 1", critical: 1, high: 2, medium: 3 },
  { date: "Mar 5", critical: 1, high: 3, medium: 3 },
  { date: "Mar 10", critical: 2, high: 3, medium: 4 },
  { date: "Mar 15", critical: 2, high: 4, medium: 4 },
  { date: "Mar 20", critical: 2, high: 5, medium: 3 },
  { date: "Mar 25", critical: 3, high: 5, medium: 4 },
  { date: "Today", critical: 3, high: 5, medium: 4 },
];

export const roleLabels: Record<RoleView, string> = {
  executive: "Executive",
  operations: "Operations",
  delivery: "Delivery & Sales",
};

export function getKPIsForRole(role: RoleView): KPICard[] {
  return kpiCards.filter(k => k.roleRelevance.includes(role));
}

export function getActionsForRole(role: RoleView): ActionItem[] {
  return actionItems.filter(a => a.roleRelevance.includes(role));
}

export function getSignalsByType(type: SignalType): BusinessSignal[] {
  return signals.filter(s => s.type === type);
}

export const severityColors: Record<SignalSeverity, { text: string; bg: string; border: string; dot: string }> = {
  critical: { text: "text-[#c45a4a]", bg: "bg-[#c45a4a]/10", border: "border-[#c45a4a]/20", dot: "bg-[#c45a4a]" },
  high: { text: "text-[#c8953c]", bg: "bg-[#c8953c]/10", border: "border-[#c8953c]/20", dot: "bg-[#c8953c]" },
  medium: { text: "text-[#d4a054]", bg: "bg-[#d4a054]/10", border: "border-[#d4a054]/20", dot: "bg-[#d4a054]" },
  low: { text: "text-[#4a90b8]", bg: "bg-[#4a90b8]/10", border: "border-[#4a90b8]/20", dot: "bg-[#4a90b8]" },
  stable: { text: "text-[#6b8f71]", bg: "bg-[#6b8f71]/10", border: "border-[#6b8f71]/20", dot: "bg-[#6b8f71]" },
};

export const signalTypeLabels: Record<SignalType, string> = {
  approval_latency: "Approval Latency",
  stalled_workflow: "Stalled Workflow",
  ownership_gap: "Ownership Gap",
  forecast_drift: "Forecast Drift",
  handoff_failure: "Handoff Failure",
  pipeline_hygiene: "Pipeline Hygiene",
  revenue_leakage: "Revenue Leakage",
};
