export interface CostRateModel {
  stalledRevenuePerHour: number;
  idleTeamCostPerHour: number;
  opportunityDecayPerHour: number;
  downstreamDependencyPerHour: number;
}

export interface PendingDecision {
  id: string;
  title: string;
  pack: string;
  category: "pricing" | "contract" | "vendor" | "staffing" | "compliance" | "budget" | "strategic";
  approver: string;
  approverTeam: string;
  requestedBy: string;
  ageHours: number;
  stalledDealCount: number;
  blockedHeadcount: number;
  revenueAtStake: number;
  timeToDeadline?: number;
  hasDependencies: boolean;
  dependencyCount: number;
  urgency: "critical" | "high" | "medium" | "low";
  costThreshold: number;
  thresholdBreached: boolean;
  pressureAlertSent: boolean;
}

export interface CostBreakdown {
  stalledRevenue: number;
  idleTeamTime: number;
  opportunityDecay: number;
  downstreamDependency: number;
  total: number;
}

export interface DecisionWithCost extends PendingDecision {
  costBreakdown: CostBreakdown;
  totalCostOfDelay: number;
  costPerHour: number;
  urgencyGradient: number;
}

export interface HistoricalDecision {
  id: string;
  title: string;
  pack: string;
  approver: string;
  approverTeam: string;
  category: string;
  ageHoursWhenResolved: number;
  totalCostAccrued: number;
  resolvedAt: string;
  outcome: "approved" | "rejected" | "deferred";
  wasEscalated: boolean;
}

export interface TeamEconomics {
  team: string;
  pack: string;
  totalDecisions: number;
  avgResolutionHours: number;
  totalCostAccrued: number;
  avgCostPerDecision: number;
  escalationRate: number;
}

export interface DecisionTypeEconomics {
  category: string;
  totalDecisions: number;
  avgResolutionHours: number;
  totalCostAccrued: number;
  worstCase: number;
}

const BASE_RATES: CostRateModel = {
  stalledRevenuePerHour: 3200,
  idleTeamCostPerHour: 850,
  opportunityDecayPerHour: 420,
  downstreamDependencyPerHour: 560,
};

export const DEFAULT_RATES: CostRateModel = BASE_RATES;

export function computeCostOfDelay(
  decision: PendingDecision,
  rates: CostRateModel = BASE_RATES
): CostBreakdown {
  const h = decision.ageHours;

  const revenueMultiplier = decision.stalledDealCount > 0
    ? Math.min(decision.stalledDealCount * 0.4, 3.2)
    : 0.3;

  const stalledRevenue = decision.revenueAtStake > 0
    ? decision.revenueAtStake * (1 - Math.pow(0.995, h)) * revenueMultiplier
    : rates.stalledRevenuePerHour * h * revenueMultiplier;

  const idleTeamTime = rates.idleTeamCostPerHour * h * Math.max(decision.blockedHeadcount, 1);

  const decayAccelerator = h > 72 ? 1.8 : h > 48 ? 1.4 : h > 24 ? 1.1 : 1.0;
  const opportunityDecay = rates.opportunityDecayPerHour * h * decayAccelerator;

  const downstreamDependency = decision.hasDependencies
    ? rates.downstreamDependencyPerHour * h * Math.max(decision.dependencyCount, 1) * 1.2
    : 0;

  const total = stalledRevenue + idleTeamTime + opportunityDecay + downstreamDependency;

  return { stalledRevenue, idleTeamTime, opportunityDecay, downstreamDependency, total };
}

export function enrichWithCost(
  decision: PendingDecision,
  rates: CostRateModel = BASE_RATES
): DecisionWithCost {
  const costBreakdown = computeCostOfDelay(decision, rates);
  const totalCostOfDelay = costBreakdown.total;
  const costPerHour = decision.ageHours > 0 ? totalCostOfDelay / decision.ageHours : 0;
  const urgencyGradient = Math.min(totalCostOfDelay / 100000, 1);

  return {
    ...decision,
    costBreakdown,
    totalCostOfDelay,
    costPerHour,
    urgencyGradient,
    thresholdBreached: totalCostOfDelay >= decision.costThreshold,
  };
}

export const PENDING_DECISIONS: PendingDecision[] = [
  {
    id: "DEC-1041",
    title: "Q2 pricing revision — PRISM portfolio",
    pack: "PRISM",
    category: "pricing",
    approver: "Marcus Webb",
    approverTeam: "Revenue Operations",
    requestedBy: "Operations",
    ageHours: 31,
    stalledDealCount: 8,
    blockedHeadcount: 12,
    revenueAtStake: 1200000,
    hasDependencies: true,
    dependencyCount: 3,
    urgency: "high",
    costThreshold: 50000,
    thresholdBreached: false,
    pressureAlertSent: false,
  },
  {
    id: "DEC-1038",
    title: "Fuel surcharge rate increase — Vessels fleet",
    pack: "Vessels",
    category: "pricing",
    approver: "Linh Tran",
    approverTeam: "Fleet Operations",
    requestedBy: "Fleet Ops",
    ageHours: 22,
    stalledDealCount: 0,
    blockedHeadcount: 28,
    revenueAtStake: 450000,
    hasDependencies: true,
    dependencyCount: 4,
    urgency: "high",
    costThreshold: 50000,
    thresholdBreached: false,
    pressureAlertSent: false,
  },
  {
    id: "DEC-1033",
    title: "Terra asset refinancing — Building 7A",
    pack: "Terra",
    category: "budget",
    approver: "Sarah Donovan",
    approverTeam: "Finance",
    requestedBy: "Finance",
    ageHours: 96,
    stalledDealCount: 1,
    blockedHeadcount: 5,
    revenueAtStake: 320000,
    hasDependencies: false,
    dependencyCount: 0,
    urgency: "medium",
    costThreshold: 75000,
    thresholdBreached: false,
    pressureAlertSent: false,
  },
  {
    id: "DEC-1029",
    title: "New vendor onboarding — security services",
    pack: "Aegis",
    category: "vendor",
    approver: "Anika Mehta",
    approverTeam: "Procurement",
    requestedBy: "Aegis",
    ageHours: 144,
    stalledDealCount: 0,
    blockedHeadcount: 3,
    revenueAtStake: 0,
    hasDependencies: false,
    dependencyCount: 0,
    urgency: "low",
    costThreshold: 100000,
    thresholdBreached: false,
    pressureAlertSent: false,
  },
  {
    id: "DEC-1027",
    title: "Enterprise contract renewal — Veritas Corp",
    pack: "PRISM",
    category: "contract",
    approver: "Kenji Watanabe",
    approverTeam: "Legal",
    requestedBy: "Enterprise Sales",
    ageHours: 67,
    stalledDealCount: 1,
    blockedHeadcount: 6,
    revenueAtStake: 890000,
    hasDependencies: true,
    dependencyCount: 2,
    urgency: "critical",
    costThreshold: 50000,
    thresholdBreached: false,
    pressureAlertSent: false,
  },
  {
    id: "DEC-1025",
    title: "Q1 headcount expansion — mid-market sales team",
    pack: "PRISM",
    category: "staffing",
    approver: "Rosa Kim",
    approverTeam: "HR",
    requestedBy: "Sales",
    ageHours: 118,
    stalledDealCount: 0,
    blockedHeadcount: 1,
    revenueAtStake: 2100000,
    timeToDeadline: 5,
    hasDependencies: true,
    dependencyCount: 5,
    urgency: "high",
    costThreshold: 75000,
    thresholdBreached: false,
    pressureAlertSent: false,
  },
  {
    id: "DEC-1022",
    title: "Fleet insurance renewal — dual-flag coverage",
    pack: "Vessels",
    category: "compliance",
    approver: "James Okafor",
    approverTeam: "Risk & Compliance",
    requestedBy: "Fleet Ops",
    ageHours: 53,
    stalledDealCount: 0,
    blockedHeadcount: 8,
    revenueAtStake: 540000,
    hasDependencies: false,
    dependencyCount: 0,
    urgency: "high",
    costThreshold: 50000,
    thresholdBreached: false,
    pressureAlertSent: false,
  },
];

export function getEnrichedDecisions(rates: CostRateModel = BASE_RATES): DecisionWithCost[] {
  return PENDING_DECISIONS
    .map(d => enrichWithCost(d, rates))
    .sort((a, b) => b.totalCostOfDelay - a.totalCostOfDelay);
}

export const HISTORICAL_DECISIONS: HistoricalDecision[] = [
  { id: "H-988", title: "Q4 pricing adjustment — enterprise tier", pack: "PRISM", approver: "Marcus Webb", approverTeam: "Revenue Operations", category: "pricing", ageHoursWhenResolved: 18, totalCostAccrued: 38400, resolvedAt: "2026-03-28", outcome: "approved", wasEscalated: false },
  { id: "H-971", title: "Fleet maintenance contract — 3 vessels", pack: "Vessels", approver: "Linh Tran", approverTeam: "Fleet Operations", category: "contract", ageHoursWhenResolved: 72, totalCostAccrued: 187300, resolvedAt: "2026-03-22", outcome: "approved", wasEscalated: true },
  { id: "H-962", title: "SOC 2 certification vendor selection", pack: "Aegis", approver: "Anika Mehta", approverTeam: "Procurement", category: "vendor", ageHoursWhenResolved: 96, totalCostAccrued: 224100, resolvedAt: "2026-03-18", outcome: "approved", wasEscalated: false },
  { id: "H-944", title: "Building 4C lease renewal terms", pack: "Terra", approver: "Sarah Donovan", approverTeam: "Finance", category: "contract", ageHoursWhenResolved: 48, totalCostAccrued: 91200, resolvedAt: "2026-03-15", outcome: "approved", wasEscalated: false },
  { id: "H-931", title: "Marketing budget reallocation — Q1", pack: "PRISM", approver: "Rosa Kim", approverTeam: "HR", category: "budget", ageHoursWhenResolved: 34, totalCostAccrued: 57800, resolvedAt: "2026-03-11", outcome: "approved", wasEscalated: false },
  { id: "H-921", title: "Fuel hedging strategy — Q2 lock-in", pack: "Vessels", approver: "James Okafor", approverTeam: "Risk & Compliance", category: "strategic", ageHoursWhenResolved: 160, totalCostAccrued: 412600, resolvedAt: "2026-03-05", outcome: "deferred", wasEscalated: true },
  { id: "H-909", title: "New CSM hiring — 4 headcount", pack: "PRISM", approver: "Rosa Kim", approverTeam: "HR", category: "staffing", ageHoursWhenResolved: 52, totalCostAccrued: 126400, resolvedAt: "2026-02-28", outcome: "approved", wasEscalated: false },
  { id: "H-891", title: "Commercial property appraisal — Lot 12", pack: "Terra", approver: "Sarah Donovan", approverTeam: "Finance", category: "budget", ageHoursWhenResolved: 28, totalCostAccrued: 44300, resolvedAt: "2026-02-21", outcome: "approved", wasEscalated: false },
  { id: "H-876", title: "Anti-piracy equipment procurement", pack: "Aegis", approver: "Anika Mehta", approverTeam: "Procurement", category: "vendor", ageHoursWhenResolved: 116, totalCostAccrued: 278900, resolvedAt: "2026-02-14", outcome: "approved", wasEscalated: true },
  { id: "H-855", title: "Q1 enterprise deal desk discount override", pack: "PRISM", approver: "Kenji Watanabe", approverTeam: "Legal", category: "pricing", ageHoursWhenResolved: 22, totalCostAccrued: 46700, resolvedAt: "2026-02-08", outcome: "approved", wasEscalated: false },
  { id: "H-834", title: "Emergency crew repatriation — MV Pacific Star", pack: "Vessels", approver: "Linh Tran", approverTeam: "Fleet Operations", category: "compliance", ageHoursWhenResolved: 8, totalCostAccrued: 15200, resolvedAt: "2026-02-02", outcome: "approved", wasEscalated: false },
  { id: "H-812", title: "Lease exit clause negotiation — Office B", pack: "Terra", approver: "Sarah Donovan", approverTeam: "Finance", category: "contract", ageHoursWhenResolved: 144, totalCostAccrued: 336500, resolvedAt: "2026-01-25", outcome: "rejected", wasEscalated: true },
];

export function getTeamEconomics(): TeamEconomics[] {
  const teamsMap = new Map<string, { decisions: HistoricalDecision[]; pack: string }>();

  for (const d of HISTORICAL_DECISIONS) {
    const key = d.approverTeam;
    if (!teamsMap.has(key)) {
      teamsMap.set(key, { decisions: [], pack: d.pack });
    }
    teamsMap.get(key)!.decisions.push(d);
  }

  const result: TeamEconomics[] = [];
  for (const [team, { decisions, pack }] of teamsMap.entries()) {
    const totalDecisions = decisions.length;
    const avgResolutionHours = decisions.reduce((s, d) => s + d.ageHoursWhenResolved, 0) / totalDecisions;
    const totalCostAccrued = decisions.reduce((s, d) => s + d.totalCostAccrued, 0);
    const avgCostPerDecision = totalCostAccrued / totalDecisions;
    const escalationRate = decisions.filter(d => d.wasEscalated).length / totalDecisions;

    result.push({ team, pack, totalDecisions, avgResolutionHours, totalCostAccrued, avgCostPerDecision, escalationRate });
  }

  return result.sort((a, b) => b.totalCostAccrued - a.totalCostAccrued);
}

export function getDecisionTypeEconomics(): DecisionTypeEconomics[] {
  const catMap = new Map<string, HistoricalDecision[]>();

  for (const d of HISTORICAL_DECISIONS) {
    if (!catMap.has(d.category)) catMap.set(d.category, []);
    catMap.get(d.category)!.push(d);
  }

  const result: DecisionTypeEconomics[] = [];
  for (const [category, decisions] of catMap.entries()) {
    const totalDecisions = decisions.length;
    const avgResolutionHours = decisions.reduce((s, d) => s + d.ageHoursWhenResolved, 0) / totalDecisions;
    const totalCostAccrued = decisions.reduce((s, d) => s + d.totalCostAccrued, 0);
    const worstCase = Math.max(...decisions.map(d => d.totalCostAccrued));

    result.push({ category, totalDecisions, avgResolutionHours, totalCostAccrued, worstCase });
  }

  return result.sort((a, b) => b.totalCostAccrued - a.totalCostAccrued);
}

export const PRESSURE_ALERT_THRESHOLDS = [
  { value: 25000, label: "$25K", color: "#d4a054" },
  { value: 50000, label: "$50K", color: "#c8953c" },
  { value: 100000, label: "$100K", color: "#c45a4a" },
  { value: 250000, label: "$250K", color: "#ec4899" },
];

export function getPressureAlerts(decisions: DecisionWithCost[]): { decision: DecisionWithCost; threshold: typeof PRESSURE_ALERT_THRESHOLDS[0]; crossedAt: string }[] {
  const alerts: { decision: DecisionWithCost; threshold: typeof PRESSURE_ALERT_THRESHOLDS[0]; crossedAt: string }[] = [];

  for (const d of decisions) {
    const crossedThresholds = PRESSURE_ALERT_THRESHOLDS.filter(t => d.totalCostOfDelay >= t.value);
    if (crossedThresholds.length > 0) {
      const highest = crossedThresholds[crossedThresholds.length - 1];
      const hoursToThreshold = d.costPerHour > 0 ? highest.value / d.costPerHour : 0;
      const crossedAt = `${Math.round(d.ageHours - hoursToThreshold)}h ago`;
      alerts.push({ decision: d, threshold: highest, crossedAt });
    }
  }

  return alerts.sort((a, b) => b.decision.totalCostOfDelay - a.decision.totalCostOfDelay);
}

export function formatCostCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${Math.round(value)}`;
}

export function formatCostFull(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export const PACK_COLORS: Record<string, string> = {
  PRISM: "#d4a054",
  Vessels: "#38bdf8",
  Terra: "#a07848",
  Aegis: "#4f6ef7",
};
