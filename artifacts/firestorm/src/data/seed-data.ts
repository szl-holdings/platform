export interface Client {
  id: number;
  name: string;
  industry?: string | null;
  status: "active" | "inactive" | "at-risk" | "churned";
  healthScore?: number | null;
  mrr?: number | null;
  deviceCount?: number | null;
  openTickets?: number | null;
  criticalAlerts?: number | null;
  contractStatus?: "active" | "expiring" | "expired" | "pending" | null;
  slaCompliance?: number | null;
  sites?: number | null;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  subject: string;
  description?: string | null;
  clientId?: number | null;
  clientName?: string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  assignedToId?: number | null;
  assignedToName?: string | null;
  category?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Technician {
  id: number;
  name: string;
  email?: string | null;
  role?: string | null;
  status?: "active" | "inactive" | null;
  specializations?: string[] | null;
  openTickets?: number | null;
  resolvedThisWeek?: number | null;
  avgResolutionHours?: number | null;
  satisfactionScore?: number | null;
}

export interface Device {
  id: number;
  name: string;
  clientId?: number | null;
  type?: string | null;
  status?: string | null;
}

export interface Contract {
  id: number;
  clientId?: number | null;
  type?: string | null;
  status?: string | null;
  value?: number | null;
}

export interface Alert {
  id: number;
  clientId?: number | null;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  createdAt?: string | null;
}

export interface Project {
  id: string;
  name: string;
  status: "active" | "completed" | "paused" | "planning";
  description?: string;
  startDate?: string;
  endDate?: string;
  team?: string[];
}

export interface Experiment {
  id: string;
  name: string;
  projectId?: string;
  status: "running" | "completed" | "failed" | "queued";
  accuracy?: number;
  loss?: number;
  startedAt?: string;
  completedAt?: string;
  metrics?: Record<string, number>;
}

export interface Model {
  id: string;
  name: string;
  projectId?: string;
  status: "production" | "staging" | "training" | "archived";
  accuracy?: number;
  version?: string;
  deployedAt?: string;
  parameters?: number;
}

export interface InsightCategory {
  id: string;
  category: string;
  title: string;
  summary: string;
  confidence?: number;
  createdAt?: string;
}

export const clients: Client[] = [];
export const tickets: Ticket[] = [];
export const technicians: Technician[] = [];
export const devices: Device[] = [];
export const contracts: Contract[] = [];
export const alerts: Alert[] = [];
export const revenueData: unknown[] = [];
export const uptimeData: unknown[] = [];
export const incidentTimeline: unknown[] = [];
export const projects: Project[] = [];
export const experiments: Experiment[] = [];
export const models: Model[] = [];
export const insights: InsightCategory[] = [];

export function getResearchHealthScore(): number {
  return 0;
}
