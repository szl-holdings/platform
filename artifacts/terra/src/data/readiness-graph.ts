export type BlockerStatus = "resolved" | "open" | "in_progress" | "waived";
export type BlockerSeverity = "critical" | "high" | "medium" | "low";

export interface ReadinessBlocker {
  id: string;
  label: string;
  description?: string;
  status: BlockerStatus;
  severity: BlockerSeverity;
  dependsOn: string[];
  assignedTo?: string;
  estimatedDays?: number;
  estimatedCost?: number;
  vendorId?: string;
  resolvedAt?: string;
  isCriticalPath?: boolean;
}

export interface ReadinessGoal {
  id: "buy" | "sell" | "lease" | "occupy" | "service";
  label: string;
  description: string;
  icon: string;
  requiredBlockerIds: string[];
  score: number;
  actionPlan: string[];
}

export interface PropertyReadinessGraph {
  propertyId: string;
  propertyName: string;
  blockers: ReadinessBlocker[];
  goals: ReadinessGoal[];
  targetDate?: string;
  countdownEvent?: {
    label: string;
    date: string;
    type: "closing" | "move_in" | "occupancy" | "lease_start";
  };
}

export interface VendorRecord {
  id: string;
  name: string;
  specialty: string[];
  jobsCompleted: number;
  jobsOnTime: number;
  jobsOnBudget: number;
  avgDaysToComplete: number;
  avgCostVariancePct: number;
  lastUsed?: string;
  notes?: string;
}

export interface CountdownMilestone {
  id: string;
  label: string;
  targetDate: string;
  status: "on_track" | "slipping" | "escalate" | "complete";
  riskNote?: string;
  dependsOn: string[];
  owner?: string;
  isCriticalPath?: boolean;
}

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const readinessGraphs: PropertyReadinessGraph[] = [
  {
    propertyId: "prop-001",
    propertyName: "Meridian Tower",
    targetDate: daysFromNow(45),
    countdownEvent: {
      label: "Acquisition Closing",
      date: daysFromNow(45),
      type: "closing",
    },
    blockers: [
      {
        id: "b-001",
        label: "Legal entity review",
        description: "LLC structure must be verified with counsel before IC approval can proceed.",
        status: "in_progress",
        severity: "high",
        dependsOn: [],
        assignedTo: "R. Adams",
        estimatedDays: 5,
        estimatedCost: 8000,
        vendorId: "v-001",
        isCriticalPath: true,
      },
      {
        id: "b-002",
        label: "Final IC approval packet",
        description: "Investment Committee sign-off packet must be assembled and submitted.",
        status: "open",
        severity: "critical",
        dependsOn: ["b-001"],
        assignedTo: "M. Park",
        estimatedDays: 3,
        isCriticalPath: true,
      },
      {
        id: "b-003",
        label: "Lender estoppel",
        description: "Existing lender must certify loan terms and current balance.",
        status: "open",
        severity: "high",
        dependsOn: ["b-001"],
        assignedTo: "R. Adams",
        estimatedDays: 7,
        estimatedCost: 2500,
        vendorId: "v-002",
        isCriticalPath: true,
      },
      {
        id: "b-004",
        label: "HVAC/MEP assessment",
        description: "HVAC replacement flagged — may require $500K capex. Engineering sign-off needed.",
        status: "open",
        severity: "high",
        dependsOn: [],
        assignedTo: "B. Park",
        estimatedDays: 10,
        estimatedCost: 500000,
        vendorId: "v-003",
        isCriticalPath: false,
      },
      {
        id: "b-005",
        label: "Title report final review",
        description: "Title review is complete but must be signed off for closing.",
        status: "resolved",
        severity: "medium",
        dependsOn: [],
        assignedTo: "J. Torres",
        resolvedAt: daysAgo(20),
        isCriticalPath: false,
      },
      {
        id: "b-006",
        label: "Miami-Dade permit history pull",
        description: "Open permits or violations must be cleared before closing.",
        status: "open",
        severity: "medium",
        dependsOn: [],
        estimatedDays: 4,
        isCriticalPath: false,
      },
    ],
    goals: [
      {
        id: "buy",
        label: "Acquire",
        description: "Ready to close acquisition",
        icon: "🏢",
        requiredBlockerIds: ["b-001", "b-002", "b-003", "b-006"],
        score: 71,
        actionPlan: [
          "Complete legal entity review (R. Adams — 5 days)",
          "Submit Final IC approval packet",
          "Secure lender estoppel",
          "Clear open permit history",
          "Schedule closing date with counsel",
        ],
      },
      {
        id: "sell",
        label: "Sell",
        description: "Ready for disposition",
        icon: "💰",
        requiredBlockerIds: ["b-004", "b-005"],
        score: 88,
        actionPlan: [
          "Commission updated appraisal",
          "Complete HVAC assessment and price into offering",
          "Prepare offering memorandum",
          "Engage disposition broker",
        ],
      },
      {
        id: "lease",
        label: "Lease",
        description: "Ready to market for new tenants",
        icon: "📋",
        requiredBlockerIds: ["b-004", "b-006"],
        score: 79,
        actionPlan: [
          "Clear open permits before marketing",
          "Address HVAC before tenant occupancy",
          "Prepare leasing brochure",
          "Engage leasing broker",
        ],
      },
      {
        id: "occupy",
        label: "Occupy",
        description: "Ready for owner or tenant occupancy",
        icon: "🏠",
        requiredBlockerIds: ["b-004"],
        score: 82,
        actionPlan: [
          "Complete HVAC assessment and schedule repair",
          "Confirm CO and occupancy permits current",
          "Coordinate move-in schedule",
        ],
      },
      {
        id: "service",
        label: "Service",
        description: "Ready for ongoing property management",
        icon: "🔧",
        requiredBlockerIds: [],
        score: 95,
        actionPlan: [
          "Confirm vendor contracts in place",
          "Schedule HVAC maintenance",
          "Review service SLAs",
        ],
      },
    ],
  },
  {
    propertyId: "prop-005",
    propertyName: "The Atrium",
    targetDate: daysFromNow(120),
    countdownEvent: {
      label: "Debt Maturity",
      date: daysFromNow(120),
      type: "closing",
    },
    blockers: [
      {
        id: "b-010",
        label: "Current appraisal required",
        description: "2024 appraisal is stale. Current value must be established before any action.",
        status: "open",
        severity: "critical",
        dependsOn: [],
        estimatedDays: 21,
        estimatedCost: 12000,
        vendorId: "v-004",
        isCriticalPath: true,
      },
      {
        id: "b-011",
        label: "Title search",
        description: "No title search on file. Required for disposition or refinance.",
        status: "open",
        severity: "high",
        dependsOn: [],
        estimatedDays: 7,
        estimatedCost: 3500,
        vendorId: "v-001",
        isCriticalPath: true,
      },
      {
        id: "b-012",
        label: "Lien & encumbrance review",
        description: "Unknown liens may exist. Must clear before any transfer.",
        status: "open",
        severity: "high",
        dependsOn: ["b-011"],
        estimatedDays: 5,
        vendorId: "v-001",
        isCriticalPath: true,
      },
      {
        id: "b-013",
        label: "Debt maturity refinance plan",
        description: "Q3 2026 maturity. Lender must be engaged now for extension or refi.",
        status: "open",
        severity: "critical",
        dependsOn: ["b-010"],
        estimatedDays: 45,
        isCriticalPath: true,
      },
      {
        id: "b-014",
        label: "Occupancy recovery plan",
        description: "78.1% occupancy must improve before refinance approval likely.",
        status: "open",
        severity: "high",
        dependsOn: [],
        estimatedDays: 60,
        isCriticalPath: false,
      },
      {
        id: "b-015",
        label: "Environmental review",
        description: "Phase I ESA not on file.",
        status: "open",
        severity: "medium",
        dependsOn: [],
        estimatedDays: 14,
        estimatedCost: 4500,
        vendorId: "v-005",
        isCriticalPath: false,
      },
    ],
    goals: [
      {
        id: "sell",
        label: "Sell",
        description: "Ready for disposition",
        icon: "💰",
        requiredBlockerIds: ["b-010", "b-011", "b-012"],
        score: 14,
        actionPlan: [
          "Order current appraisal immediately (21 days)",
          "Complete title search",
          "Clear liens and encumbrances",
          "Determine ask price and engage broker",
        ],
      },
      {
        id: "buy",
        label: "Refinance",
        description: "Refi to clear maturity",
        icon: "🏦",
        requiredBlockerIds: ["b-010", "b-013", "b-014"],
        score: 8,
        actionPlan: [
          "Order appraisal to establish current LTV",
          "Engage lender for maturity extension discussion",
          "Launch leasing incentive program to recover occupancy",
          "Submit refi application",
        ],
      },
      {
        id: "lease",
        label: "Lease",
        description: "Stabilize with new tenants",
        icon: "📋",
        requiredBlockerIds: ["b-014"],
        score: 52,
        actionPlan: [
          "Launch 3-month free rent incentive for 5yr leases",
          "Engage commercial leasing broker",
          "Improve common area condition",
        ],
      },
      {
        id: "occupy",
        label: "Occupy",
        description: "Owner or anchor tenant move-in readiness",
        icon: "🏢",
        requiredBlockerIds: ["b-010"],
        score: 22,
        actionPlan: [
          "Resolve appraisal before any capital commitment",
          "Confirm lien-free status for occupancy eligibility",
        ],
      },
      {
        id: "service",
        label: "Service",
        description: "Property management and maintenance readiness",
        icon: "🔧",
        requiredBlockerIds: ["b-015"],
        score: 40,
        actionPlan: [
          "Conduct environmental review",
          "Commission property condition assessment",
          "Engage property manager",
        ],
      },
    ],
  },
  {
    propertyId: "prop-003",
    propertyName: "Riverside Commons",
    targetDate: daysFromNow(60),
    countdownEvent: {
      label: "Refi Application Deadline",
      date: daysFromNow(60),
      type: "closing",
    },
    blockers: [
      {
        id: "b-020",
        label: "T12 financial audit — overdue",
        description: "M. Park's audit is 3 days past due. Critical for refi application.",
        status: "in_progress",
        severity: "critical",
        dependsOn: [],
        assignedTo: "M. Park",
        estimatedDays: 5,
        isCriticalPath: true,
      },
      {
        id: "b-021",
        label: "Legal review",
        description: "Legal review not yet started. Required for any disposition or refi.",
        status: "open",
        severity: "high",
        dependsOn: ["b-020"],
        estimatedDays: 10,
        vendorId: "v-001",
        isCriticalPath: true,
      },
      {
        id: "b-022",
        label: "T12 financial document delivery",
        description: "T12 financials must be formally submitted to lender.",
        status: "open",
        severity: "high",
        dependsOn: ["b-020"],
        assignedTo: "M. Park",
        estimatedDays: 2,
        isCriticalPath: true,
      },
      {
        id: "b-023",
        label: "Occupancy decline root cause",
        description: "2% 90-day decline needs explanation for lender underwriting.",
        status: "open",
        severity: "medium",
        dependsOn: [],
        estimatedDays: 7,
        isCriticalPath: false,
      },
    ],
    goals: [
      {
        id: "buy",
        label: "Refinance",
        description: "Secure refi before maturity",
        icon: "🏦",
        requiredBlockerIds: ["b-020", "b-021", "b-022"],
        score: 48,
        actionPlan: [
          "Complete T12 audit immediately (M. Park)",
          "Submit financials to lender",
          "Begin legal review",
          "Address occupancy decline question for underwriting",
        ],
      },
      {
        id: "sell",
        label: "Sell",
        description: "Disposition ready",
        icon: "💰",
        requiredBlockerIds: ["b-020", "b-021"],
        score: 55,
        actionPlan: [
          "Finish T12 audit and legal review",
          "Commission broker opinion of value",
          "Engage disposition broker",
        ],
      },
      {
        id: "lease",
        label: "Stabilize",
        description: "Recover occupancy",
        icon: "📋",
        requiredBlockerIds: ["b-023"],
        score: 78,
        actionPlan: [
          "Investigate occupancy decline root cause",
          "Launch retention program for existing tenants",
          "Fill vacancies with targeted outreach",
        ],
      },
      {
        id: "occupy",
        label: "Occupy",
        description: "Owner-occupy or anchor move-in readiness",
        icon: "🏢",
        requiredBlockerIds: [],
        score: 88,
        actionPlan: [
          "Confirm no pending legal holds on occupancy",
          "Coordinate building access and utilities",
        ],
      },
      {
        id: "service",
        label: "Service",
        description: "Property management continuity",
        icon: "🔧",
        requiredBlockerIds: [],
        score: 92,
        actionPlan: [
          "Renew property management contract",
          "Schedule Q3 preventive maintenance",
        ],
      },
    ],
  },
];

export const vendors: VendorRecord[] = [
  {
    id: "v-001",
    name: "Morrison Foerster LLP",
    specialty: ["legal", "title", "lien_review"],
    jobsCompleted: 34,
    jobsOnTime: 29,
    jobsOnBudget: 31,
    avgDaysToComplete: 8.2,
    avgCostVariancePct: 4.1,
    lastUsed: daysAgo(20),
    notes: "Primary outside counsel. Strong on complex LLC structures.",
  },
  {
    id: "v-002",
    name: "Wells Fargo Real Estate Capital",
    specialty: ["lender", "estoppel", "refinance"],
    jobsCompleted: 12,
    jobsOnTime: 10,
    jobsOnBudget: 12,
    avgDaysToComplete: 6.5,
    avgCostVariancePct: 0,
    lastUsed: daysAgo(45),
    notes: "Primary lender for stabilized assets. Fast estoppel turnaround.",
  },
  {
    id: "v-003",
    name: "Pacific Engineering Group",
    specialty: ["hvac", "mechanical", "structural"],
    jobsCompleted: 18,
    jobsOnTime: 14,
    jobsOnBudget: 13,
    avgDaysToComplete: 12.3,
    avgCostVariancePct: 14.2,
    lastUsed: daysAgo(60),
    notes: "Reliable but tends to run over budget on large HVAC scopes.",
  },
  {
    id: "v-004",
    name: "Colliers Valuation & Advisory",
    specialty: ["appraisal", "valuation"],
    jobsCompleted: 22,
    jobsOnTime: 21,
    jobsOnBudget: 22,
    avgDaysToComplete: 18.5,
    avgCostVariancePct: 1.3,
    lastUsed: daysAgo(30),
    notes: "Consistently on time and on budget. Preferred for CMBS-targeted appraisals.",
  },
  {
    id: "v-005",
    name: "ERM Environmental",
    specialty: ["environmental", "phase1", "phase2"],
    jobsCompleted: 15,
    jobsOnTime: 13,
    jobsOnBudget: 15,
    avgDaysToComplete: 14.2,
    avgCostVariancePct: 2.8,
    lastUsed: daysAgo(55),
    notes: "Strong Phase I delivery. Recommended for FEMA adjacency review.",
  },
  {
    id: "v-006",
    name: "Cushman & Wakefield Leasing",
    specialty: ["leasing", "tenant_rep", "market_analysis"],
    jobsCompleted: 9,
    jobsOnTime: 7,
    jobsOnBudget: 9,
    avgDaysToComplete: 45.0,
    avgCostVariancePct: 0,
    lastUsed: daysAgo(90),
    notes: "Best for retail leasing in secondary markets. Commission-based only.",
  },
];

export function getVendorById(id: string): VendorRecord | undefined {
  return vendors.find(v => v.id === id);
}

export function getVendorReliabilityScore(vendor: VendorRecord): number {
  const onTimeRate = vendor.jobsCompleted > 0 ? vendor.jobsOnTime / vendor.jobsCompleted : 0;
  const onBudgetRate = vendor.jobsCompleted > 0 ? vendor.jobsOnBudget / vendor.jobsCompleted : 0;
  const speedScore = Math.max(0, 1 - vendor.avgDaysToComplete / 30);
  const budgetAccuracy = Math.max(0, 1 - vendor.avgCostVariancePct / 20);
  return Math.round((onTimeRate * 0.4 + onBudgetRate * 0.35 + speedScore * 0.1 + budgetAccuracy * 0.15) * 100);
}

export const countdownMilestones: Record<string, CountdownMilestone[]> = {
  "prop-001": [
    { id: "cm-001", label: "Legal entity review complete", targetDate: daysFromNow(5), status: "on_track", owner: "R. Adams", dependsOn: [], isCriticalPath: true },
    { id: "cm-002", label: "IC approval packet submitted", targetDate: daysFromNow(10), status: "on_track", owner: "M. Park", dependsOn: ["cm-001"], isCriticalPath: true },
    { id: "cm-003", label: "Lender estoppel received", targetDate: daysFromNow(14), status: "slipping", riskNote: "Lender response time averaging 9 days — buffer thinning", owner: "R. Adams", dependsOn: ["cm-001"], isCriticalPath: true },
    { id: "cm-004", label: "HVAC scope finalized", targetDate: daysFromNow(12), status: "slipping", riskNote: "Engineering vendor not yet engaged", owner: "B. Park", dependsOn: [], isCriticalPath: false },
    { id: "cm-005", label: "Permit history cleared", targetDate: daysFromNow(20), status: "on_track", dependsOn: [], isCriticalPath: false },
    { id: "cm-006", label: "Closing docs prepared", targetDate: daysFromNow(35), status: "on_track", owner: "J. Torres", dependsOn: ["cm-002", "cm-003"], isCriticalPath: true },
    { id: "cm-007", label: "Wire and closing", targetDate: daysFromNow(45), status: "on_track", dependsOn: ["cm-006"], isCriticalPath: true },
  ],
  "prop-005": [
    { id: "cm-010", label: "Appraisal ordered", targetDate: daysFromNow(3), status: "escalate", riskNote: "Not yet ordered — every day costs ~2 days at end", dependsOn: [], isCriticalPath: true },
    { id: "cm-011", label: "Appraisal received", targetDate: daysFromNow(24), status: "slipping", riskNote: "Depends on ordering — currently behind", dependsOn: ["cm-010"], isCriticalPath: true },
    { id: "cm-012", label: "Title search complete", targetDate: daysFromNow(10), status: "escalate", riskNote: "Not started — required before lender submission", dependsOn: [], isCriticalPath: true },
    { id: "cm-013", label: "Liens cleared", targetDate: daysFromNow(18), status: "slipping", dependsOn: ["cm-012"], isCriticalPath: true },
    { id: "cm-014", label: "Lender extension request submitted", targetDate: daysFromNow(30), status: "slipping", riskNote: "Needs appraisal to calculate new LTV", dependsOn: ["cm-011"], isCriticalPath: true },
    { id: "cm-015", label: "Occupancy recovery to 82%", targetDate: daysFromNow(90), status: "slipping", riskNote: "Currently 78.1% — target requires 4 new leases", dependsOn: [], isCriticalPath: false },
    { id: "cm-016", label: "Debt maturity", targetDate: daysFromNow(120), status: "escalate", riskNote: "Refinance must close before this date", dependsOn: ["cm-014"], isCriticalPath: true },
  ],
  "prop-003": [
    { id: "cm-020", label: "T12 audit complete", targetDate: daysFromNow(5), status: "slipping", riskNote: "3 days past original due — M. Park flagged delay", owner: "M. Park", dependsOn: [], isCriticalPath: true },
    { id: "cm-021", label: "Financials submitted to lender", targetDate: daysFromNow(8), status: "slipping", dependsOn: ["cm-020"], isCriticalPath: true },
    { id: "cm-022", label: "Legal review complete", targetDate: daysFromNow(20), status: "on_track", dependsOn: ["cm-020"], isCriticalPath: true },
    { id: "cm-023", label: "Lender underwriting complete", targetDate: daysFromNow(45), status: "on_track", dependsOn: ["cm-021", "cm-022"], isCriticalPath: true },
    { id: "cm-024", label: "Refi application deadline", targetDate: daysFromNow(60), status: "on_track", dependsOn: ["cm-023"], isCriticalPath: true },
  ],
};
