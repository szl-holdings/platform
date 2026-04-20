export type TeamMember = {
  id: string;
  name: string;
  title: string;
  skills: string[];
  allocations: { engagement: string; client: string; pct: number; weeks: string; color: string }[];
  utilisation: number;
  capacity: number;
  status: "optimal" | "over" | "under" | "bench";
  dayRate: number;
};

export type CapacityAlert = {
  type: "warning" | "critical" | "info";
  message: string;
  member?: string;
};

export const TEAM: TeamMember[] = [
  {
    id: "m1", name: "Carlota Jo", title: "Lead Advisor", dayRate: 2200,
    skills: ["Strategy", "Brand", "M&A", "Exec Advisory", "Healthcare"],
    allocations: [
      { engagement: "Growth Strategy", client: "Luminary Brands", pct: 30, weeks: "Apr–Jun", color: "#B8960C" },
      { engagement: "M&A Advisory", client: "Vertex Capital", pct: 40, weeks: "Apr–May", color: "#7C3AED" },
      { engagement: "Business Development", client: "Internal", pct: 20, weeks: "Ongoing", color: "#94A3B8" },
    ],
    utilisation: 90, capacity: 100, status: "optimal",
  },
  {
    id: "m2", name: "Dr. Priya Rajan", title: "Healthcare Transformation", dayRate: 1800,
    skills: ["Digital Transformation", "EHR", "Clinical Ops", "Change Mgmt"],
    allocations: [
      { engagement: "Digital Health Strategy", client: "Solaris Health", pct: 60, weeks: "Jun–Aug", color: "#059669" },
      { engagement: "Proposal Support", client: "Internal", pct: 10, weeks: "Apr", color: "#94A3B8" },
    ],
    utilisation: 70, capacity: 100, status: "under",
  },
  {
    id: "m3", name: "James Whitmore", title: "Brand & Marketing", dayRate: 1400,
    skills: ["Brand Strategy", "DTC", "Positioning", "Consumer Insights"],
    allocations: [
      { engagement: "Brand Repositioning", client: "Kestrel Brands", pct: 50, weeks: "May–Jun", color: "#DC2626" },
      { engagement: "Brand Positioning Sprint", client: "Kestrel Brands", pct: 20, weeks: "May", color: "#F87171" },
    ],
    utilisation: 70, capacity: 100, status: "under",
  },
  {
    id: "m4", name: "Sofia Andersson", title: "Financial Services & M&A", dayRate: 2200,
    skills: ["M&A Advisory", "Financial Modelling", "Market Entry", "PE"],
    allocations: [
      { engagement: "M&A Advisory", client: "Vertex Capital", pct: 80, weeks: "Apr–May", color: "#7C3AED" },
      { engagement: "Portfolio Strategy", client: "Aurelius PE", pct: 20, weeks: "Apr", color: "#0284C7" },
    ],
    utilisation: 100, capacity: 100, status: "over",
  },
  {
    id: "m5", name: "Kai Okonkwo", title: "Organisational Design", dayRate: 1600,
    skills: ["Org Design", "Culture", "Leadership Dev", "HRBP"],
    allocations: [
      { engagement: "Org Design Phase 2", client: "Clearfield Manufacturing", pct: 50, weeks: "Apr–May", color: "#D97706" },
    ],
    utilisation: 50, capacity: 100, status: "bench",
  },
];

export const CAPACITY_ALERTS: CapacityAlert[] = [
  { type: "critical", message: "Sofia Andersson is at 100% capacity through May — no buffer for Solaris Health scope should it advance.", member: "Sofia Andersson" },
  { type: "warning", message: "Dr. Priya Rajan has 30% bench capacity in April. Consider assigning to Solaris Health pre-engagement work.", member: "Priya Rajan" },
  { type: "warning", message: "Kai Okonkwo available for Solaris Health or Nimbus Logistics from mid-May onward. Strong fit for org design scope.", member: "Kai Okonkwo" },
  { type: "info", message: "Team capacity increases by ~40% in Q3 as Vertex and Aurelius engagements close. Begin pipeline development now." },
];

export const SKILL_GAPS = [
  { skill: "Data Analytics / AI Implementation", demand: "High", gap: "Critical", suggestion: "Source specialist from external network — target: Nimbus Logistics and Solaris Health" },
  { skill: "Regulatory Strategy (FCA)", demand: "Medium", gap: "Moderate", suggestion: "Sofia partially covers. Consider dedicated specialist for Financial Services pipeline growth" },
  { skill: "Supply Chain Optimisation", demand: "Medium", gap: "High", suggestion: "No current capacity. Required for Nimbus Logistics scope. Source now." },
];

export const FORWARD_CAPACITY = [
  { month: "Apr", available: 52, committed: 148, total: 200 },
  { month: "May", available: 80, committed: 120, total: 200 },
  { month: "Jun", available: 110, committed: 90, total: 200 },
  { month: "Jul", available: 160, committed: 40, total: 200 },
  { month: "Aug", available: 140, committed: 60, total: 200 },
];

export type EngagementPnL = {
  id: string;
  client: string;
  engagement: string;
  status: "active" | "complete" | "at-risk";
  feeType: "fixed" | "time-and-materials" | "retainer";
  contractedValue: number;
  invoiced: number;
  collected: number;
  costToDate: number;
  forecastedCost: number;
  marginTarget: number;
  phase: string;
  rateRealisationPct: number;
  writeOffs: number;
  scopeCreepHours: number;
  startDate: string;
  endDate: string;
  alerts: string[];
};

export const ENGAGEMENTS: EngagementPnL[] = [
  {
    id: "e1", client: "Luminary Brands", engagement: "Growth Strategy Phase 2",
    status: "active", feeType: "fixed", contractedValue: 84000, invoiced: 42000,
    collected: 42000, costToDate: 28400, forecastedCost: 58000, marginTarget: 38,
    phase: "Strategy Development", rateRealisationPct: 96, writeOffs: 1200,
    scopeCreepHours: 8, startDate: "Jan 2026", endDate: "Jun 2026",
    alerts: ["Scope creep detected: 8 uncompensated hours in brand workshop session"],
  },
  {
    id: "e2", client: "Vertex Capital Partners", engagement: "M&A Advisory",
    status: "active", feeType: "time-and-materials", contractedValue: 120000, invoiced: 28000,
    collected: 28000, costToDate: 19800, forecastedCost: 92000, marginTarget: 42,
    phase: "Discovery & Due Diligence", rateRealisationPct: 100, writeOffs: 0,
    scopeCreepHours: 0, startDate: "Apr 2026", endDate: "Aug 2026",
    alerts: [],
  },
  {
    id: "e3", client: "Aurelius Private Equity", engagement: "Portfolio Strategy Masterclass",
    status: "complete", feeType: "fixed", contractedValue: 16800, invoiced: 16800,
    collected: 16800, costToDate: 8200, forecastedCost: 8200, marginTarget: 45,
    phase: "Completed", rateRealisationPct: 100, writeOffs: 0,
    scopeCreepHours: 0, startDate: "Mar 2026", endDate: "Mar 2026",
    alerts: [],
  },
  {
    id: "e4", client: "Oasis Wellness", engagement: "Digital Strategy & DTC Build",
    status: "at-risk", feeType: "fixed", contractedValue: 62000, invoiced: 46500,
    collected: 40300, costToDate: 44200, forecastedCost: 68000, marginTarget: 35,
    phase: "Phase 3 — Implementation", rateRealisationPct: 81, writeOffs: 4800,
    scopeCreepHours: 22, startDate: "Oct 2025", endDate: "Apr 2026",
    alerts: [
      "Budget overrun: forecasted cost £6,000 above contracted value",
      "Rate realisation at 81% — £4,800 written off year-to-date",
      "22 uncompensated hours from scope changes — consider amendment",
    ],
  },
];

export const MARGIN_HISTORY = [
  { month: "Oct", margin: 44 },
  { month: "Nov", margin: 41 },
  { month: "Dec", margin: 38 },
  { month: "Jan", margin: 46 },
  { month: "Feb", margin: 42 },
  { month: "Mar", margin: 51 },
  { month: "Apr", margin: 48 },
];

export type TimeEntry = {
  id: string;
  date: string;
  engagement: string;
  phase: string;
  deliverable: string;
  hours: number;
  rateType: "standard" | "premium" | "fixed" | "non-billable";
  rate: number;
  description: string;
  billable: boolean;
  approved: boolean;
};

export type Invoice = {
  id: string;
  client: string;
  engagement: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  issuedDate: string;
  items: number;
};

export const TIME_ENTRIES: TimeEntry[] = [
  { id: "t1", date: "Apr 15, 2026", engagement: "Luminary Brands", phase: "Strategy Development", deliverable: "Competitive positioning report", hours: 3.5, rateType: "premium", rate: 350, description: "Deep competitor analysis across 8 market players", billable: true, approved: true },
  { id: "t2", date: "Apr 15, 2026", engagement: "Vertex Capital", phase: "Discovery", deliverable: "Stakeholder interviews", hours: 2.0, rateType: "standard", rate: 275, description: "CTO and CFO interview sessions", billable: true, approved: true },
  { id: "t3", date: "Apr 14, 2026", engagement: "Luminary Brands", phase: "Strategy Development", deliverable: "Executive presentation", hours: 4.0, rateType: "premium", rate: 350, description: "Deck build for board-level strategy review", billable: true, approved: false },
  { id: "t4", date: "Apr 14, 2026", engagement: "Internal", phase: "Business Development", deliverable: "Proposal — Solaris Health", hours: 2.5, rateType: "non-billable", rate: 0, description: "Proposal development and pricing review", billable: false, approved: true },
  { id: "t5", date: "Apr 13, 2026", engagement: "Aurelius PE", phase: "Masterclass Series", deliverable: "Session 4 facilitation", hours: 6.0, rateType: "fixed", rate: 4200, description: "Full-day portfolio value creation masterclass", billable: true, approved: true },
  { id: "t6", date: "Apr 12, 2026", engagement: "Vertex Capital", phase: "Discovery", deliverable: "Data room review", hours: 3.0, rateType: "standard", rate: 275, description: "Financial and operational data analysis", billable: true, approved: true },
  { id: "t7", date: "Apr 11, 2026", engagement: "Luminary Brands", phase: "Roadmap", deliverable: "90-day action plan", hours: 2.5, rateType: "premium", rate: 350, description: "KPI framework and implementation timeline", billable: true, approved: true },
];

export const INVOICES: Invoice[] = [
  { id: "INV-2026-009", client: "Aurelius Private Equity", engagement: "Portfolio Strategy Masterclass", amount: 16800, status: "paid", dueDate: "Apr 7, 2026", issuedDate: "Mar 24, 2026", items: 4 },
  { id: "INV-2026-010", client: "Luminary Brands", engagement: "Growth Strategy Phase 2", amount: 14875, status: "sent", dueDate: "Apr 22, 2026", issuedDate: "Apr 8, 2026", items: 12 },
  { id: "INV-2026-011", client: "Vertex Capital Partners", engagement: "M&A Advisory Discovery", amount: 8250, status: "draft", dueDate: "Apr 30, 2026", issuedDate: "Apr 15, 2026", items: 6 },
  { id: "INV-2026-008", client: "Oasis Wellness", engagement: "Digital Strategy Q1", amount: 6200, status: "overdue", dueDate: "Mar 31, 2026", issuedDate: "Mar 15, 2026", items: 8 },
];

export const BILLING_DATA = [
  { week: "W10", billable: 32, nonBillable: 8 },
  { week: "W11", billable: 38, nonBillable: 6 },
  { week: "W12", billable: 29, nonBillable: 11 },
  { week: "W13", billable: 41, nonBillable: 5 },
  { week: "W14", billable: 35, nonBillable: 7 },
];

export const RATE_CARDS = [
  { engagement: "Luminary Brands", standard: "£275/hr", premium: "£350/hr", fixed: "Milestone-based", blendedTarget: "£310/hr" },
  { engagement: "Vertex Capital Partners", standard: "£275/hr", premium: "£350/hr", fixed: "—", blendedTarget: "£290/hr" },
  { engagement: "Aurelius Private Equity", standard: "—", premium: "—", fixed: "£4,200/session", blendedTarget: "£525/hr equiv." },
];

// ----------------------------------------------------------------------------
// Client Health (shared across client-health page & dashboard metrics)
// ----------------------------------------------------------------------------

export type ClientHealthSignal = {
  dimension: string;
  score: number;
  trend: "up" | "down" | "stable";
  note: string;
};

export type ClientHealthAlert = {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  action: string;
  timestamp: string;
};

export type ClientHealthRecord = {
  id: string;
  client: string;
  industry: string;
  engagementStart: string;
  healthScore: number;
  trend: "up" | "down" | "stable";
  status: "healthy" | "at-risk" | "critical" | "excellent";
  signals: ClientHealthSignal[];
  alerts: ClientHealthAlert[];
  trajectory: { month: string; score: number }[];
};

export const CLIENT_HEALTH: ClientHealthRecord[] = [
  {
    id: "c1",
    client: "Luminary Brands",
    industry: "Consumer Goods",
    engagementStart: "Jan 2026",
    healthScore: 82,
    trend: "up",
    status: "excellent",
    signals: [
      { dimension: "Engagement Momentum", score: 88, trend: "up", note: "Strong implementation pace — 4 of 5 workstreams on track" },
      { dimension: "Outcome Progress", score: 85, trend: "up", note: "Revenue uplift tracking 12% ahead of target at month 3" },
      { dimension: "Relationship Strength", score: 90, trend: "stable", note: "Executive sponsor highly engaged, weekly check-ins maintained" },
      { dimension: "Strategic Alignment", score: 78, trend: "up", note: "Board aligned on priorities — minor Q2 pivot required" },
      { dimension: "Team Adoption", score: 72, trend: "up", note: "Middle management adoption accelerating after Feb training" },
      { dimension: "Payment Timeliness", score: 95, trend: "stable", note: "All invoices paid within 7 days — no exceptions" },
    ],
    alerts: [
      { id: "a1", severity: "info", message: "Q2 strategy review due in 3 weeks", action: "Schedule review session", timestamp: "Apr 14, 2026" },
    ],
    trajectory: [
      { month: "Oct", score: 58 }, { month: "Nov", score: 64 }, { month: "Dec", score: 68 },
      { month: "Jan", score: 72 }, { month: "Feb", score: 76 }, { month: "Mar", score: 80 }, { month: "Apr", score: 82 },
    ],
  },
  {
    id: "c2",
    client: "Oasis Wellness",
    industry: "Consumer Health",
    engagementStart: "Oct 2025",
    healthScore: 61,
    trend: "down",
    status: "at-risk",
    signals: [
      { dimension: "Engagement Momentum", score: 55, trend: "down", note: "Implementation pace slowed — resource constraints cited" },
      { dimension: "Outcome Progress", score: 68, trend: "stable", note: "DTC channel on track but retention KPIs lagging" },
      { dimension: "Relationship Strength", score: 72, trend: "down", note: "Executive sponsor travel disrupting weekly cadence" },
      { dimension: "Strategic Alignment", score: 58, trend: "down", note: "Board priorities shifted following new CFO appointment" },
      { dimension: "Team Adoption", score: 44, trend: "down", note: "Internal change resistance emerging in marketing team" },
      { dimension: "Payment Timeliness", score: 78, trend: "stable", note: "March invoice 14 days late — first occurrence" },
    ],
    alerts: [
      { id: "a2", severity: "critical", message: "Engagement momentum declining for 2nd consecutive month", action: "Escalate to senior advisor — schedule executive alignment session", timestamp: "Apr 12, 2026" },
      { id: "a3", severity: "warning", message: "Change resistance risk in marketing org — adoption stalling", action: "Design targeted change management intervention", timestamp: "Apr 10, 2026" },
      { id: "a4", severity: "warning", message: "CFO alignment gap — strategy may lose internal champion", action: "Request CFO briefing within 2 weeks", timestamp: "Apr 8, 2026" },
    ],
    trajectory: [
      { month: "Oct", score: 74 }, { month: "Nov", score: 78 }, { month: "Dec", score: 75 },
      { month: "Jan", score: 72 }, { month: "Feb", score: 68 }, { month: "Mar", score: 64 }, { month: "Apr", score: 61 },
    ],
  },
  {
    id: "c3",
    client: "Velas Agency",
    industry: "Professional Services",
    engagementStart: "Aug 2025",
    healthScore: 74,
    trend: "stable",
    status: "healthy",
    signals: [
      { dimension: "Engagement Momentum", score: 76, trend: "stable", note: "Solid execution pace, no blockers identified" },
      { dimension: "Outcome Progress", score: 78, trend: "up", note: "Referral pipeline initiative exceeding 90-day target" },
      { dimension: "Relationship Strength", score: 82, trend: "stable", note: "Strong working relationship with founder and COO" },
      { dimension: "Strategic Alignment", score: 70, trend: "stable", note: "Priorities stable — annual planning cycle approaching" },
      { dimension: "Team Adoption", score: 65, trend: "up", note: "Junior team adoption improving with new playbook format" },
      { dimension: "Payment Timeliness", score: 88, trend: "stable", note: "Consistent 10-day payment cycle" },
    ],
    alerts: [
      { id: "a5", severity: "info", message: "Annual planning cycle begins next month — renewal opportunity", action: "Prepare renewal proposal with expanded scope", timestamp: "Apr 14, 2026" },
    ],
    trajectory: [
      { month: "Oct", score: 70 }, { month: "Nov", score: 72 }, { month: "Dec", score: 73 },
      { month: "Jan", score: 75 }, { month: "Feb", score: 74 }, { month: "Mar", score: 73 }, { month: "Apr", score: 74 },
    ],
  },
];

// ----------------------------------------------------------------------------
// Knowledge Graph nodes (shared across knowledge-graph page & dashboard)
// ----------------------------------------------------------------------------

export type KnowledgeGraphNode = {
  id: string;
  type: "framework" | "engagement" | "insight" | "deliverable" | "client" | "methodology";
  title: string;
  description: string;
  tags: string[];
  industries: string[];
  connections: string[];
  lastUsed: string;
  useCount: number;
  impact?: string;
};

export const KNOWLEDGE_GRAPH_NODES: KnowledgeGraphNode[] = [
  {
    id: "k1", type: "framework", title: "The Clarity Cascade Framework",
    description: "A three-stage model for organisational transformation: Diagnostic Immersion → Strategic Crystallisation → Implementation Architecture. Consistently produces 40%+ faster decision velocity.",
    tags: ["transformation", "org-design", "decision-making"],
    industries: ["Healthcare", "Financial Services", "Consumer Goods"],
    connections: ["k5", "k8", "k12"],
    lastUsed: "Apr 2026", useCount: 14, impact: "Avg 42% improvement in decision velocity",
  },
  {
    id: "k2", type: "framework", title: "Market Permeability Index",
    description: "Proprietary scoring model that assesses market entry attractiveness across 11 dimensions: competitive density, regulatory friction, distribution access, and 8 more. Cited in 3 published case studies.",
    tags: ["market-entry", "competitive-analysis", "scoring"],
    industries: ["Retail", "Healthcare", "Technology", "Consumer Goods"],
    connections: ["k6", "k9"],
    lastUsed: "Mar 2026", useCount: 9, impact: "Used in 9 successful market entry strategies",
  },
  {
    id: "k3", type: "engagement", title: "Luminary Brands — Growth Strategy 2026",
    description: "Full brand repositioning and DTC channel strategy for a £200M consumer goods company. 3 phases over 6 months. Delivered 18% revenue uplift in first 90 days.",
    tags: ["brand-positioning", "DTC", "growth"],
    industries: ["Consumer Goods"],
    connections: ["k1", "k7", "k11"],
    lastUsed: "Apr 2026", useCount: 0, impact: "£36M incremental revenue identified",
  },
  {
    id: "k4", type: "insight", title: "Healthcare Digital Transformation Patterns",
    description: "Synthesised learning from 4 healthcare digital transformation engagements. Key finding: implementation failure is 3× more likely when clinical leadership is not co-opted in design phase.",
    tags: ["healthcare", "digital-transformation", "change-management"],
    industries: ["Healthcare"],
    connections: ["k1", "k8"],
    lastUsed: "Feb 2026", useCount: 6, impact: "Cited in 2 published articles",
  },
  {
    id: "k5", type: "methodology", title: "Rapid Diagnostic Immersion Protocol",
    description: "A 2-week intensive methodology for rapid organisational assessment: stakeholder mapping, data gathering sprint, hypothesis formation, and prioritisation matrix. Replaces 8-week traditional discovery.",
    tags: ["diagnostic", "discovery", "stakeholder-mapping"],
    industries: ["All"],
    connections: ["k1", "k3"],
    lastUsed: "Apr 2026", useCount: 21, impact: "75% reduction in discovery phase duration",
  },
  {
    id: "k6", type: "deliverable", title: "Competitive Battlecard Template v3.2",
    description: "Structured one-page format covering: competitor profile, key offerings, pricing signals, strengths, vulnerabilities, and our positioning response. Used in all competitive strategy engagements.",
    tags: ["competitive", "battlecard", "positioning"],
    industries: ["All"],
    connections: ["k2", "k9"],
    lastUsed: "Mar 2026", useCount: 18,
  },
  {
    id: "k7", type: "insight", title: "Premium Brand Repositioning Conditions",
    description: "From 6 brand repositioning engagements: successful repositioning requires executive mandate, 18+ month time horizon, and 15-20% marketing investment uplift. Failure patterns documented.",
    tags: ["brand", "repositioning", "conditions-for-success"],
    industries: ["Consumer Goods", "Luxury", "Retail"],
    connections: ["k3", "k11"],
    lastUsed: "Apr 2026", useCount: 8, impact: "6/6 repositionings succeeded using these conditions",
  },
  {
    id: "k8", type: "framework", title: "Stakeholder Influence Mapping Matrix",
    description: "A 2×2 model mapping stakeholder influence vs. alignment, with specific engagement strategies for each quadrant. Essential for change management in complex organisations.",
    tags: ["stakeholders", "change-management", "influence"],
    industries: ["Healthcare", "Financial Services", "Public Sector"],
    connections: ["k4", "k5"],
    lastUsed: "Jan 2026", useCount: 17,
  },
  {
    id: "k9", type: "engagement", title: "Meridian Capital — Market Entry Advisory",
    description: "Strategic advisory for entry into private credit market. Applied Market Permeability Index across 6 geographies. Recommended 2-market phased entry with regulatory partnership strategy.",
    tags: ["financial-services", "market-entry", "regulatory"],
    industries: ["Financial Services"],
    connections: ["k2", "k6"],
    lastUsed: "Dec 2025", useCount: 0, impact: "£150M market opportunity validated",
  },
];

// ----------------------------------------------------------------------------
// Knowledge Vault items (shared across knowledge-vault page & dashboard)
// ----------------------------------------------------------------------------

export type KnowledgeVaultItem = {
  id: string;
  type: "framework" | "playbook" | "template" | "case-study" | "research";
  title: string;
  description: string;
  tags: string[];
  industries: string[];
  engagements: string[];
  uses: number;
  rating: number;
  lastUpdated: string;
  author: string;
};

export const KNOWLEDGE_VAULT_ITEMS: KnowledgeVaultItem[] = [
  {
    id: "k1", type: "framework", title: "7-Dimension Brand Positioning Matrix",
    description: "Comprehensive brand positioning analysis covering customer value proposition, competitive differentiation, emotional resonance, price-value perception, channel strategy, and cultural fit. Generates an actionable positioning brief.",
    tags: ["Brand Strategy", "Positioning", "Consumer Research", "Competitive Analysis"],
    industries: ["Consumer Goods", "Retail", "Luxury", "FMCG"],
    engagements: ["Luminary Brands", "Kestrel Brands", "4 others"],
    uses: 14, rating: 4.8, lastUpdated: "Apr 2026", author: "Carlota Jo",
  },
  {
    id: "k2", type: "playbook", title: "PE Portfolio Value Creation — 100-Day Playbook",
    description: "Post-acquisition integration playbook covering leadership assessment, quick-win identification, KPI baseline, customer retention strategy, and organisational design. Developed across 4 PE-backed engagements.",
    tags: ["Private Equity", "M&A", "Integration", "Value Creation", "100-Day"],
    industries: ["Financial Services", "Private Equity", "Industrial"],
    engagements: ["Aurelius Private Equity", "Vertex Capital"],
    uses: 6, rating: 4.9, lastUpdated: "Mar 2026", author: "Sofia Andersson",
  },
  {
    id: "k3", type: "framework", title: "Digital Maturity Assessment Model (DMAM-5)",
    description: "5-dimension digital maturity scoring across Data & Analytics, Customer Experience, Operations, Culture & Talent, and Technology Infrastructure. Produces benchmarked maturity scores with prioritised improvement roadmap.",
    tags: ["Digital Transformation", "Maturity Model", "Assessment", "Roadmap"],
    industries: ["Healthcare", "Financial Services", "Industrial", "Consumer Goods"],
    engagements: ["Solaris Health Systems", "Luminary Brands", "3 others"],
    uses: 9, rating: 4.7, lastUpdated: "Feb 2026", author: "Carlota Jo",
  },
  {
    id: "k4", type: "case-study", title: "Healthcare DTC Strategy — Oasis Wellness",
    description: "End-to-end DTC channel build for a £30M wellness brand entering direct-to-consumer. Covers market entry strategy, digital acquisition, retention architecture, and first-year financial model. IP-protected client version available.",
    tags: ["DTC", "Healthcare", "Channel Strategy", "Digital Marketing", "Wellness"],
    industries: ["Consumer Health", "Healthcare"],
    engagements: ["Oasis Wellness"],
    uses: 4, rating: 4.6, lastUpdated: "Mar 2026", author: "Carlota Jo",
  },
  {
    id: "k5", type: "template", title: "Executive Strategy Presentation — Master Template",
    description: "Board-ready strategy presentation template with customisable sections for situation assessment, strategic options, recommended path, implementation roadmap, and financial projections. Includes design guidelines and copy prompts.",
    tags: ["Presentation", "Executive", "Board", "Strategy", "Template"],
    industries: ["All"],
    engagements: ["Multiple"],
    uses: 28, rating: 4.9, lastUpdated: "Apr 2026", author: "Carlota Jo",
  },
  {
    id: "k6", type: "framework", title: "Stakeholder Influence Mapping — 4-Quadrant Model",
    description: "Rigorous stakeholder analysis framework mapping power vs. interest to drive engagement strategy. Includes influence pathway analysis, change resistance scoring, and coalition-building tactics. Proven in complex multi-stakeholder environments.",
    tags: ["Stakeholder Management", "Change Management", "Influence", "Coalition"],
    industries: ["Healthcare", "Industrial", "Financial Services"],
    engagements: ["Solaris Health Systems", "Clearfield Manufacturing", "2 others"],
    uses: 11, rating: 4.8, lastUpdated: "Jan 2026", author: "Kai Okonkwo",
  },
  {
    id: "k7", type: "research", title: "AI in Consulting — Market Intelligence Report 2026",
    description: "Comprehensive analysis of AI adoption in consulting services: client expectations, competitor positioning, capability gaps, and strategic recommendations for boutique firms. Includes 14 competitor profiles and pricing benchmarks.",
    tags: ["AI", "Market Research", "Consulting Industry", "Competitive Intelligence"],
    industries: ["Professional Services", "Consulting"],
    engagements: ["Internal"],
    uses: 8, rating: 4.5, lastUpdated: "Mar 2026", author: "Carlota Jo",
  },
  {
    id: "k8", type: "playbook", title: "Change Management Acceleration — Healthcare Settings",
    description: "Clinical change management methodology designed for healthcare transformation programmes. Covers readiness assessment, clinical champion identification, training cascade, resistance management, and sustainability planning.",
    tags: ["Change Management", "Healthcare", "Clinical", "EHR", "Acceleration"],
    industries: ["Healthcare", "Life Sciences", "Public Sector"],
    engagements: ["Solaris Health Systems"],
    uses: 3, rating: 4.7, lastUpdated: "Apr 2026", author: "Dr. Priya Rajan",
  },
];
