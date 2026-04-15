import { domainEventBus } from "../../domain-events/index.js";

// ─── Port Interfaces ───────────────────────────────────────────────────────────

export interface TerraStoragePort {
  listProperties(args: { limit: number; offset: number }): Promise<unknown[]>;
  listListings(args: { status?: string; limit: number; offset: number }): Promise<unknown[]>;
  listDistressProperties(args: { borough?: string; distressType?: string; limit: number; offset: number }): Promise<unknown[]>;
  listDeals(args: { stage?: string; limit: number; offset: number }): Promise<unknown[]>;
  getDeal(id: number): Promise<unknown | null>;
  updateDeal(id: number, data: { stage?: string; probability?: number }): Promise<unknown>;
  listLeads(args: { stage?: string; limit: number; offset: number }): Promise<unknown[]>;
  createLead(data: { firstName: string; lastName: string; type: string; stage: string }): Promise<unknown>;
  listActionItems(args: { propertyId?: string; status?: string; limit: number; offset: number }): Promise<unknown[]>;
  updateActionItem(id: number, data: Record<string, unknown>): Promise<unknown>;
  getActionItem(id: number): Promise<{ status: string } | null>;
  seedActionItems(propertyId: string, items: SeedActionItem[]): Promise<unknown[]>;
  getExistingActionItemExternalIds(propertyId: string): Promise<Set<string>>;
  writeAuditLog(entry: TerraAuditEntry): Promise<void>;
}

export interface TerraAuditEntry {
  entityType: string;
  entityId: number;
  action: string;
  actorType: string;
  previousState: Record<string, unknown>;
  newState: Record<string, unknown>;
  notes: string;
}

export interface SeedActionItem {
  externalId: string;
  issue: string;
  severity: "critical" | "high" | "medium" | "low";
  ownerName: string;
  ownerRole: string;
  dueDate: string;
  status: "open" | "in_progress" | "resolved";
  recommendedAction: string;
}

// ─── Distress Detection Logic ──────────────────────────────────────────────────

export interface DistressSignal {
  level: "critical" | "high" | "medium" | "low";
  indicators: string[];
  opportunityScore: number;
}

export function detectDistressSignals(property: {
  daysOnMarket?: number | null;
  priceReductions?: number | null;
  occupancyRate?: number | null;
  loanMaturityMonths?: number | null;
  dscr?: number | null;
}): DistressSignal {
  const indicators: string[] = [];
  let score = 0;

  if ((property.daysOnMarket ?? 0) > 180) {
    indicators.push(`Extended time on market: ${property.daysOnMarket} days`);
    score += 25;
  }

  if ((property.priceReductions ?? 0) >= 2) {
    indicators.push(`Multiple price reductions: ${property.priceReductions}`);
    score += 20;
  }

  if ((property.occupancyRate ?? 1) < 0.75) {
    indicators.push(`Low occupancy: ${Math.round((property.occupancyRate ?? 0) * 100)}%`);
    score += 30;
  }

  if ((property.loanMaturityMonths ?? 99) <= 6) {
    indicators.push("Loan maturity within 6 months");
    score += 25;
  }

  if ((property.dscr ?? 1.5) < 1.0) {
    indicators.push(`DSCR below 1.0: ${property.dscr?.toFixed(2)}`);
    score += 35;
  }

  const level =
    score >= 70 ? "critical" :
    score >= 45 ? "high" :
    score >= 25 ? "medium" : "low";

  return { level, indicators, opportunityScore: Math.min(score, 100) };
}

export function scoreInvestmentOpportunity(property: {
  distressScore: number;
  locationGrade?: string | null;
  propertyType?: string | null;
  priceVsMarket?: number | null;
}): number {
  let score = property.distressScore;

  const gradeBonus: Record<string, number> = { A: 10, B: 5, C: 0, D: -5 };
  score += gradeBonus[property.locationGrade ?? "C"] ?? 0;

  if (property.propertyType === "multifamily") score += 5;
  if (property.propertyType === "office") score -= 5;

  if ((property.priceVsMarket ?? 0) < -0.15) score += 10;

  return Math.min(Math.max(score, 0), 100);
}

// ─── Terra Action Item Seed Data ──────────────────────────────────────────────

export const TERRA_ACTION_ITEM_SEEDS: Record<string, SeedActionItem[]> = {
  "prop-007": [
    { externalId: "act-001", issue: "Occupancy at 68.4% — 30 units vacant", severity: "critical", ownerName: "D. Kim", ownerRole: "Asset Mgmt", dueDate: "2026-04-15", status: "in_progress", recommendedAction: "Activate leasing incentive program; engage Compass multifamily team" },
    { externalId: "act-002", issue: "Sterling Design Studio — 45 days past due, $6,400", severity: "critical", ownerName: "T. Allen", ownerRole: "Risk & Collections", dueDate: "2026-04-07", status: "open", recommendedAction: "Demand letter sent; escalate to eviction counsel if unpaid by Apr 7" },
    { externalId: "act-003", issue: "Loan maturity Sept 2026 — DSCR at 0.94x", severity: "critical", ownerName: "R. Torres", ownerRole: "Capital Markets", dueDate: "2026-05-01", status: "open", recommendedAction: "Engage lender for maturity extension; simultaneously market for refi" },
    { externalId: "act-004", issue: "Deferred maintenance estimate $2.1M", severity: "high", ownerName: "B. Park", ownerRole: "Engineering", dueDate: "2026-04-30", status: "open", recommendedAction: "Complete scope + bid by Apr 30; include in lender remediation plan" },
  ],
  "prop-005": [
    { externalId: "act-005", issue: "Retail occupancy 78.1% — 7 units vacant", severity: "high", ownerName: "D. Kim", ownerRole: "Asset Mgmt", dueDate: "2026-04-20", status: "open", recommendedAction: "Tenant incentive program — 3 months free rent for 5+ year leases" },
    { externalId: "act-006", issue: "Luna Boutique lease expiring Jun 2026", severity: "medium", ownerName: "M. Osei", ownerRole: "Legal", dueDate: "2026-05-01", status: "open", recommendedAction: "Send renewal proposal with updated market terms" },
  ],
  "prop-001": [
    { externalId: "act-007", issue: "HVAC Building B overdue maintenance", severity: "medium", ownerName: "R. Torres", ownerRole: "Facilities", dueDate: "2026-04-05", status: "in_progress", recommendedAction: "Vendor contracted; work order #WO-2026-0847 active" },
    { externalId: "act-008", issue: "Horizon Tech Labs lease expires May 2026", severity: "medium", ownerName: "M. Osei", ownerRole: "Legal", dueDate: "2026-04-15", status: "open", recommendedAction: "Schedule renewal conversation; assess market rate delta" },
  ],
};

// ─── Domain Service Functions ─────────────────────────────────────────────────

export async function listTerraProperties(storage: TerraStoragePort, args: { limit?: number; offset?: number }) {
  return storage.listProperties({ limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function listTerraListings(storage: TerraStoragePort, args: { status?: string; limit?: number; offset?: number }) {
  return storage.listListings({ status: args.status, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function listTerraDistressProperties(storage: TerraStoragePort, args: { borough?: string; distressType?: string; limit?: number; offset?: number }) {
  return storage.listDistressProperties({ borough: args.borough, distressType: args.distressType, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function listTerraDeals(storage: TerraStoragePort, args: { stage?: string; limit?: number; offset?: number }) {
  return storage.listDeals({ stage: args.stage, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function getTerraDeal(storage: TerraStoragePort, id: number) {
  return storage.getDeal(id);
}

export async function updateTerraDeal(
  storage: TerraStoragePort,
  id: number,
  data: { stage?: string; probability?: number },
) {
  const deal = await storage.updateDeal(id, data) as Record<string, unknown>;
  domainEventBus.publish("terra.deal-updated", {
    dealId: id,
    stage: deal.stage as string | null,
    probability: deal.probability as number | null,
  });
  return deal;
}

export async function listTerraLeads(storage: TerraStoragePort, args: { stage?: string; limit?: number; offset?: number }) {
  return storage.listLeads({ stage: args.stage, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function createTerraLead(storage: TerraStoragePort, data: { firstName: string; lastName: string; type?: string }) {
  const lead = await storage.createLead({
    firstName: data.firstName,
    lastName: data.lastName,
    type: data.type ?? "buyer",
    stage: "new",
  }) as Record<string, unknown>;
  domainEventBus.publish("terra.lead-created", {
    leadId: lead.id as number,
    firstName: data.firstName,
    lastName: data.lastName,
    type: data.type ?? "buyer",
  });
  return lead;
}

export async function listTerraActionItems(storage: TerraStoragePort, args: { propertyId?: string; status?: string; limit?: number; offset?: number }) {
  return storage.listActionItems({ propertyId: args.propertyId, status: args.status, limit: args.limit ?? 50, offset: args.offset ?? 0 });
}

export async function updateTerraActionItem(
  storage: TerraStoragePort,
  id: number,
  args: { status?: string; recommendedAction?: string },
) {
  const existing = await storage.getActionItem(id);
  if (!existing) throw new Error(`Action item not found: ${id}`);

  const previousStatus = existing.status;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (args.status) {
    updateData.status = args.status;
    if (args.status === "resolved") updateData.resolvedAt = new Date();
  }
  if (args.recommendedAction !== undefined) updateData.recommendedAction = args.recommendedAction;

  const item = await storage.updateActionItem(id, updateData) as Record<string, unknown>;
  if (!item) throw new Error(`Action item update returned no rows for id: ${id}`);

  await storage.writeAuditLog({
    entityType: "action",
    entityId: item.id as number,
    action: args.status ? `status_changed_to_${args.status}` : "updated",
    actorType: "system",
    previousState: { status: previousStatus },
    newState: { status: item.status, propertyId: item.propertyId },
    notes: `Terra action item updated — property ${item.propertyId}`,
  });

  domainEventBus.publish("terra.action-item-updated", {
    itemId: id,
    propertyId: item.propertyId as string,
    status: item.status as string,
    previousStatus,
  });

  return item;
}

export async function seedTerraActionItems(storage: TerraStoragePort, propertyId: string) {
  const items = TERRA_ACTION_ITEM_SEEDS[propertyId] ?? [];
  if (items.length === 0) return [];

  const existingIds = await storage.getExistingActionItemExternalIds(propertyId);
  const toInsert = items.filter(item => !existingIds.has(item.externalId));

  return storage.seedActionItems(propertyId, toInsert);
}
