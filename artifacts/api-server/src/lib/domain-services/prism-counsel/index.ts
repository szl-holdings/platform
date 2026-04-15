import { domainEventBus } from "../../domain-events/index.js";

// ─── Port Interfaces ───────────────────────────────────────────────────────────

export interface PrismCounselStoragePort {
  listMatters(orgId: number): Promise<unknown[]>;
  getMatter(id: number): Promise<unknown | null>;
  getDashboardSummary(orgId: number): Promise<DashboardSummaryResult>;
  listDeadlines(matterId: number): Promise<unknown[]>;
  listUpcomingDeadlines(orgId: number, days: number): Promise<unknown[]>;
  listForecasts(matterId: number): Promise<unknown[]>;
  listForecastDiffs(matterId: number): Promise<unknown[]>;
  listPressureDimensions(matterId: number): Promise<unknown[]>;
  listProofChainEntries(matterId: number): Promise<unknown[]>;
  listApprovalRequests(orgId: number, status?: string): Promise<unknown[]>;
  listMatterApprovals(matterId: number): Promise<unknown[]>;
  listCommunications(matterId: number): Promise<unknown[]>;
  listConnectorAccounts(orgId: number): Promise<unknown[]>;
  listDataProductScores(orgId: number, matterId?: number): Promise<unknown[]>;
  listServiceMetrics(orgId: number, service?: string): Promise<unknown[]>;
  getMatterDeadlines(matterId: number): Promise<unknown[]>;
  getMatterForecasts(matterId: number): Promise<unknown[]>;
  getMatterCommunications(matterId: number): Promise<unknown[]>;
  getMatterReadinessScores(matterId: number): Promise<unknown[]>;
  getMatterApprovalRequests(matterId: number): Promise<unknown[]>;
  getMatterRecommendations(matterId: number): Promise<unknown[]>;
  approveRequest(requestId: number, actorId: number): Promise<unknown>;
  rejectRequest(requestId: number, actorId: number): Promise<unknown>;
  acceptRecommendation(recommendationId: number, actorId: number): Promise<unknown>;
  dismissRecommendation(recommendationId: number, actorId: number): Promise<unknown>;
}

export interface DashboardSummaryResult {
  totalMatters: number;
  activeMatters: number;
  pendingApprovals: number;
  upcomingDeadlines14d: number;
  criticalDeadlines: number;
  totalExposure: string | null;
  connectorHealthSummary: unknown | null;
  pressureAlerts: number;
}

// ─── Settlement Forecasting ───────────────────────────────────────────────────

export interface SettlementForecast {
  low: number;
  mid: number;
  high: number;
  confidence: "high" | "medium" | "low";
  drivers: string[];
}

export function forecastSettlement(matter: {
  totalDamages?: string | null;
  stage?: string | null;
  healthScore?: number | null;
  matterType?: string | null;
}): SettlementForecast {
  const damages = parseFloat(matter.totalDamages ?? "0") || 0;
  const drivers: string[] = [];

  let lowMultiplier = 0.3;
  let highMultiplier = 0.8;
  let confidence: SettlementForecast["confidence"] = "medium";

  if (matter.healthScore && matter.healthScore >= 80) {
    lowMultiplier = 0.2;
    highMultiplier = 0.5;
    drivers.push("Strong case health score");
    confidence = "high";
  } else if (matter.healthScore && matter.healthScore < 50) {
    lowMultiplier = 0.4;
    highMultiplier = 0.9;
    drivers.push("Weak case health — higher settlement pressure");
    confidence = "low";
  }

  if (matter.stage === "trial") {
    lowMultiplier *= 1.1;
    highMultiplier *= 1.1;
    drivers.push("Trial stage increases settlement range");
  }

  if (matter.matterType === "class_action") {
    lowMultiplier *= 1.2;
    highMultiplier *= 1.3;
    drivers.push("Class action dynamics expand range");
  }

  return {
    low: Math.round(damages * lowMultiplier),
    mid: Math.round(damages * (lowMultiplier + highMultiplier) / 2),
    high: Math.round(damages * highMultiplier),
    confidence,
    drivers,
  };
}

export function calculateDefensibilityScore(matter: {
  healthScore?: number | null;
  stage?: string | null;
  matterType?: string | null;
}): number {
  let score = matter.healthScore ?? 50;

  if (matter.stage === "discovery") score -= 5;
  if (matter.stage === "trial") score -= 10;
  if (matter.stage === "appeal") score += 5;
  if (matter.matterType === "class_action") score -= 10;

  return Math.min(Math.max(score, 0), 100);
}

// ─── Deadline Pressure Calculation ───────────────────────────────────────────

export function calculateDeadlinePressure(deadlines: Array<{
  dueDate?: string | null;
  priority?: string | null;
  status?: string | null;
}>): number {
  const now = Date.now();
  let pressure = 0;

  for (const deadline of deadlines) {
    if (deadline.status === "completed" || deadline.status === "dismissed") continue;
    if (!deadline.dueDate) continue;

    const daysUntil = (new Date(deadline.dueDate).getTime() - now) / (1000 * 60 * 60 * 24);
    const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }[deadline.priority ?? "medium"] ?? 2;

    if (daysUntil < 0) pressure += priorityWeight * 10;
    else if (daysUntil < 7) pressure += priorityWeight * 8;
    else if (daysUntil < 14) pressure += priorityWeight * 5;
    else if (daysUntil < 30) pressure += priorityWeight * 2;
  }

  return Math.min(pressure, 100);
}

// ─── Domain Service Functions ─────────────────────────────────────────────────

export async function getPcMatters(storage: PrismCounselStoragePort, orgId: number) {
  return storage.listMatters(orgId);
}

export async function getPcMatter(storage: PrismCounselStoragePort, id: number) {
  return storage.getMatter(id);
}

export async function getPcDashboardSummary(storage: PrismCounselStoragePort, orgId: number) {
  return storage.getDashboardSummary(orgId);
}

export async function getPcDeadlines(storage: PrismCounselStoragePort, matterId: number) {
  return storage.listDeadlines(matterId);
}

export async function getPcUpcomingDeadlines(storage: PrismCounselStoragePort, orgId: number, days: number) {
  return storage.listUpcomingDeadlines(orgId, days);
}

export async function getPcForecasts(storage: PrismCounselStoragePort, matterId: number) {
  return storage.listForecasts(matterId);
}

export async function getPcForecastDiffs(storage: PrismCounselStoragePort, matterId: number) {
  return storage.listForecastDiffs(matterId);
}

export async function getPcPressureDimensions(storage: PrismCounselStoragePort, matterId: number) {
  return storage.listPressureDimensions(matterId);
}

export async function getPcProofChainEntries(storage: PrismCounselStoragePort, matterId: number) {
  return storage.listProofChainEntries(matterId);
}

export async function getPcApprovalRequests(storage: PrismCounselStoragePort, orgId: number, status?: string) {
  return storage.listApprovalRequests(orgId, status);
}

export async function getPcMatterApprovals(storage: PrismCounselStoragePort, matterId: number) {
  return storage.listMatterApprovals(matterId);
}

export async function getPcCommunications(storage: PrismCounselStoragePort, matterId: number) {
  return storage.listCommunications(matterId);
}

export async function getPcConnectorAccounts(storage: PrismCounselStoragePort, orgId: number) {
  return storage.listConnectorAccounts(orgId);
}

export async function getPcDataProductScores(storage: PrismCounselStoragePort, orgId: number, matterId?: number) {
  return storage.listDataProductScores(orgId, matterId);
}

export async function getPcServiceMetrics(storage: PrismCounselStoragePort, orgId: number, service?: string) {
  return storage.listServiceMetrics(orgId, service);
}

export async function approvePcRequest(storage: PrismCounselStoragePort, requestId: number, actorId: number) {
  const result = await storage.approveRequest(requestId, actorId) as Record<string, unknown>;
  domainEventBus.publish("prism-counsel.approval-resolved", {
    requestId,
    matterId: result.matterId as number,
    decision: "approved",
    actorId,
  });
  return result;
}

export async function rejectPcRequest(storage: PrismCounselStoragePort, requestId: number, actorId: number) {
  const result = await storage.rejectRequest(requestId, actorId) as Record<string, unknown>;
  domainEventBus.publish("prism-counsel.approval-resolved", {
    requestId,
    matterId: result.matterId as number,
    decision: "rejected",
    actorId,
  });
  return result;
}

export async function acceptPcRecommendation(storage: PrismCounselStoragePort, recommendationId: number, actorId: number) {
  const result = await storage.acceptRecommendation(recommendationId, actorId) as Record<string, unknown>;
  domainEventBus.publish("prism-counsel.recommendation-acted", {
    recommendationId,
    matterId: result.matterId as number,
    action: "accepted",
    actorId,
  });
  return result;
}

export async function dismissPcRecommendation(storage: PrismCounselStoragePort, recommendationId: number, actorId: number) {
  const result = await storage.dismissRecommendation(recommendationId, actorId) as Record<string, unknown>;
  domainEventBus.publish("prism-counsel.recommendation-acted", {
    recommendationId,
    matterId: result.matterId as number,
    action: "dismissed",
    actorId,
  });
  return result;
}
