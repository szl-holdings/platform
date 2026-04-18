export type MatterStatus = "active" | "completed" | "on_hold" | "escalated" | "at_risk";
export type ObligationStatus = "pending" | "in_progress" | "completed" | "overdue" | "blocked";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface MatterTwin {
  id: string;
  name: string;
  status: MatterStatus;
  type: string;
  deadline: string;
  leadCounsel: string;
  exposureUsd: number;
  description: string;
}

export interface ObligationTwin {
  id: string;
  matterId: string;
  title: string;
  status: ObligationStatus;
  deadline: string;
  assignedTo: string;
  dependencies: string[]; // IDs of other obligations
  riskLevel: RiskLevel;
  exposureUsd: number;
}

export interface CounselFirm {
  id: string;
  name: string;
  onTimePercentage: number;
  responseTimeHours: number;
  activeMatters: number;
  overdueDeliverables: number;
  budgetUsd: number;
  actualSpendUsd: number;
}

export interface DependencyLink {
  from: string;
  to: string;
  status: "active" | "blocked";
}

const now = new Date();
const daysFromNow = (n: number) => new Date(now.getTime() + n * 86400000).toISOString();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

export const matterTwins: MatterTwin[] = [
  {
    id: "matter-001",
    name: "Meridian Compliance v.3",
    status: "at_risk",
    type: "Regulatory Filing",
    deadline: daysFromNow(11),
    leadCounsel: "Morrison & Vance",
    exposureUsd: 4100000,
    description: "Annual multi-jurisdictional compliance filing for Meridian holdings.",
  },
  {
    id: "matter-002",
    name: "Hargreave IP Settlement",
    status: "active",
    type: "Litigation/Settlement",
    deadline: daysFromNow(45),
    leadCounsel: "Sterling & Ross",
    exposureUsd: 1200000,
    description: "Intellectual property settlement negotiations regarding the Hargreave patent portfolio.",
  },
  {
    id: "matter-003",
    name: "Project Sentinel M&A",
    status: "active",
    type: "M&A",
    deadline: daysFromNow(60),
    leadCounsel: "Internal Legal",
    exposureUsd: 15000000,
    description: "Acquisition of Sentinel Tech assets.",
  },
  {
    id: "matter-004",
    name: "Global Data Privacy Audit",
    status: "active",
    type: "Compliance",
    deadline: daysFromNow(20),
    leadCounsel: "Fenwick LLP",
    exposureUsd: 2500000,
    description: "Multi-region data privacy audit and remediation.",
  }
];

export const obligationTwins: ObligationTwin[] = [
  {
    id: "obl-001",
    matterId: "matter-001",
    title: "Discovery Request Response",
    status: "overdue",
    deadline: daysAgo(18),
    assignedTo: "Morrison & Vance",
    dependencies: [],
    riskLevel: "critical",
    exposureUsd: 2000000,
  },
  {
    id: "obl-002",
    matterId: "matter-001",
    title: "Draft Regulatory Report",
    status: "blocked",
    deadline: daysFromNow(5),
    assignedTo: "Internal Legal",
    dependencies: ["obl-001"],
    riskLevel: "high",
    exposureUsd: 1000000,
  },
  {
    id: "obl-003",
    matterId: "matter-001",
    title: "Final Filing Submission",
    status: "pending",
    deadline: daysFromNow(11),
    assignedTo: "Morrison & Vance",
    dependencies: ["obl-002"],
    riskLevel: "critical",
    exposureUsd: 4100000,
  },
  {
    id: "obl-004",
    matterId: "matter-002",
    title: "Settlement Term Sheet",
    status: "in_progress",
    deadline: daysFromNow(15),
    assignedTo: "Sterling & Ross",
    dependencies: [],
    riskLevel: "medium",
    exposureUsd: 500000,
  },
  {
    id: "obl-005",
    matterId: "matter-002",
    title: "Counterparty Review",
    status: "pending",
    deadline: daysFromNow(30),
    assignedTo: "Internal Legal",
    dependencies: ["obl-004"],
    riskLevel: "low",
    exposureUsd: 200000,
  },
  {
    id: "obl-006",
    matterId: "matter-004",
    title: "Data Map Compilation",
    status: "in_progress",
    deadline: daysFromNow(5),
    assignedTo: "Fenwick LLP",
    dependencies: [],
    riskLevel: "medium",
    exposureUsd: 500000,
  },
  {
    id: "obl-007",
    matterId: "matter-004",
    title: "Risk Assessment Report",
    status: "pending",
    deadline: daysFromNow(15),
    assignedTo: "Fenwick LLP",
    dependencies: ["obl-006"],
    riskLevel: "medium",
    exposureUsd: 500000,
  },
  {
    id: "obl-008",
    matterId: "matter-003",
    title: "Due Diligence Review",
    status: "in_progress",
    deadline: daysFromNow(20),
    assignedTo: "Internal Legal",
    dependencies: [],
    riskLevel: "high",
    exposureUsd: 1000000,
  }
];

export const counselFirms: CounselFirm[] = [
  {
    id: "firm-001",
    name: "Morrison & Vance",
    onTimePercentage: 68,
    responseTimeHours: 36,
    activeMatters: 3,
    overdueDeliverables: 3,
    budgetUsd: 500000,
    actualSpendUsd: 420000,
  },
  {
    id: "firm-002",
    name: "Sterling & Ross",
    onTimePercentage: 92,
    responseTimeHours: 4,
    activeMatters: 1,
    overdueDeliverables: 0,
    budgetUsd: 250000,
    actualSpendUsd: 180000,
  },
  {
    id: "firm-003",
    name: "Fenwick LLP",
    onTimePercentage: 85,
    responseTimeHours: 12,
    activeMatters: 2,
    overdueDeliverables: 0,
    budgetUsd: 300000,
    actualSpendUsd: 150000,
  }
];
