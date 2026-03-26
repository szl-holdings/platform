// Mock Data for Readiness Report
import { addDays, subDays } from "date-fns";

const today = new Date();

export type Program = {
  id: string;
  name: string;
  description: string;
  overallScore: number;
  targetScore: number;
  status: 'active' | 'paused' | 'completed' | 'archived';
  owner: string;
  createdAt: string;
};

export type Dimension = {
  id: string;
  programId: string;
  name: string;
  category: 'operational' | 'security' | 'compliance' | 'financial' | 'technical' | 'strategic' | 'people' | 'process';
  currentScore: number;
  targetScore: number;
  maxScore: number;
  assessorName: string;
  lastAssessedAt: string;
};

export type Milestone = {
  id: string;
  programId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'canceled';
  dueDate: string;
  owner: string;
};

export type Risk = {
  id: string;
  programId: string;
  dimensionId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelihood: 'very_likely' | 'likely' | 'possible' | 'unlikely';
  status: 'open' | 'mitigating' | 'resolved' | 'accepted';
  mitigation: string;
  owner: string;
  createdAt: string;
};

export type Alert = {
  id: string;
  programId: string;
  type: 'score_drop' | 'milestone_overdue' | 'risk_escalation' | 'target_missed' | 'improvement' | 'general';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  isRead: boolean;
  createdAt: string;
};

export type ScoreHistory = {
  id: string;
  dimensionId: string;
  score: number;
  recordedAt: string;
};

// --- Seed Data ---

export const mockPrograms: Program[] = [
  {
    id: "p_1",
    name: "Project Apollo",
    description: "Enterprise digital transformation and cloud migration initiative.",
    overallScore: 82.5,
    targetScore: 90,
    status: "active",
    owner: "Sarah Jenkins",
    createdAt: subDays(today, 120).toISOString(),
  },
  {
    id: "p_2",
    name: "Phoenix Data Platform",
    description: "Next-generation analytics data lake and reporting suite.",
    overallScore: 65.0,
    targetScore: 85,
    status: "active",
    owner: "Michael Chen",
    createdAt: subDays(today, 45).toISOString(),
  }
];

export const mockDimensions: Dimension[] = [
  { id: "d_1", programId: "p_1", name: "Security Architecture", category: "security", currentScore: 88, targetScore: 95, maxScore: 100, assessorName: "Alex Mercer", lastAssessedAt: subDays(today, 2).toISOString() },
  { id: "d_2", programId: "p_1", name: "Operational Readiness", category: "operational", currentScore: 76, targetScore: 85, maxScore: 100, assessorName: "Sarah Jenkins", lastAssessedAt: subDays(today, 5).toISOString() },
  { id: "d_3", programId: "p_1", name: "Financial Controls", category: "financial", currentScore: 92, targetScore: 90, maxScore: 100, assessorName: "David Roth", lastAssessedAt: subDays(today, 10).toISOString() },
  { id: "d_4", programId: "p_1", name: "Technical Infrastructure", category: "technical", currentScore: 81, targetScore: 90, maxScore: 100, assessorName: "Alex Mercer", lastAssessedAt: subDays(today, 1).toISOString() },
  { id: "d_5", programId: "p_1", name: "Compliance & Legal", category: "compliance", currentScore: 95, targetScore: 95, maxScore: 100, assessorName: "Elena Rostova", lastAssessedAt: subDays(today, 15).toISOString() },
  { id: "d_6", programId: "p_1", name: "Team Competency", category: "people", currentScore: 70, targetScore: 80, maxScore: 100, assessorName: "Marcus Thorne", lastAssessedAt: subDays(today, 20).toISOString() },
];

export const mockMilestones: Milestone[] = [
  { id: "m_1", programId: "p_1", title: "Phase 1 Security Audit", description: "Complete external pen-testing and vulnerability assessment.", status: "completed", dueDate: subDays(today, 10).toISOString(), owner: "Alex Mercer" },
  { id: "m_2", programId: "p_1", title: "Infrastructure Provisioning", description: "Deploy core AWS VPCs and networking components.", status: "completed", dueDate: subDays(today, 2).toISOString(), owner: "DevOps Team" },
  { id: "m_3", programId: "p_1", title: "Data Migration Rehearsal", description: "Test sync of legacy on-prem databases to S3.", status: "in_progress", dueDate: addDays(today, 5).toISOString(), owner: "Michael Chen" },
  { id: "m_4", programId: "p_1", title: "Compliance Sign-off", description: "Final review of data handling practices by Legal.", status: "pending", dueDate: addDays(today, 15).toISOString(), owner: "Elena Rostova" },
  { id: "m_5", programId: "p_1", title: "User Training Seminars", description: "Onboard internal staff to the new systems.", status: "overdue", dueDate: subDays(today, 3).toISOString(), owner: "Marcus Thorne" },
];

export const mockRisks: Risk[] = [
  { id: "r_1", programId: "p_1", dimensionId: "d_6", title: "Key Staff Attrition", description: "Two senior cloud architects are leaving the firm next month, endangering the migration timeline.", severity: "critical", likelihood: "very_likely", status: "open", mitigation: "Engaging external contractors to bridge the gap; expediting hiring process.", owner: "Sarah Jenkins", createdAt: subDays(today, 4).toISOString() },
  { id: "r_2", programId: "p_1", dimensionId: "d_4", title: "API Rate Limiting", description: "Legacy CRM APIs may bottleneck during the initial sync phase.", severity: "medium", likelihood: "possible", status: "mitigating", mitigation: "Implementing backoff strategies and running syncs during off-hours.", owner: "DevOps Team", createdAt: subDays(today, 10).toISOString() },
  { id: "r_3", programId: "p_1", dimensionId: "d_2", title: "Vendor SLA Delay", description: "Third-party monitoring tool deployment is behind schedule.", severity: "high", likelihood: "likely", status: "open", mitigation: "Escalating to vendor account manager.", owner: "Alex Mercer", createdAt: subDays(today, 1).toISOString() },
];

export const mockAlerts: Alert[] = [
  { id: "a_1", programId: "p_1", type: "score_drop", title: "Readiness Score Dropped", message: "Team Competency score dropped from 75 to 70 following recent personnel changes.", severity: "warning", isRead: false, createdAt: subDays(today, 0).toISOString() },
  { id: "a_2", programId: "p_1", type: "milestone_overdue", title: "Milestone Overdue", message: "'User Training Seminars' is 3 days past its due date.", severity: "critical", isRead: false, createdAt: subDays(today, 1).toISOString() },
  { id: "a_3", programId: "p_1", type: "improvement", title: "Security Target Met", message: "Security Architecture has reached its target score of 95.", severity: "info", isRead: true, createdAt: subDays(today, 2).toISOString() },
];

export const mockScoreHistory: ScoreHistory[] = [];
// Generate some realistic trend data for the last 6 months
const dimensions = ["d_1", "d_2", "d_3", "d_4", "d_5", "d_6"];
const baseScores = { d_1: 60, d_2: 50, d_3: 80, d_4: 40, d_5: 70, d_6: 65 };

dimensions.forEach(dimId => {
  let currentScore = baseScores[dimId as keyof typeof baseScores];
  for (let i = 6; i >= 0; i--) {
    mockScoreHistory.push({
      id: `sh_${dimId}_${i}`,
      dimensionId: dimId,
      score: currentScore,
      recordedAt: subDays(today, i * 30).toISOString(),
    });
    // Randomly increase or sometimes slightly decrease
    currentScore += Math.floor(Math.random() * 8) - 1; 
    if (currentScore > 100) currentScore = 100;
  }
});
