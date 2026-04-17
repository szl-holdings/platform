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
