import { Router, type IRouter } from "express";
import { bodyShape } from "@szl-holdings/contracts/common";
import { z } from "zod";
import {
  db,
  fundPortfolioFinancialsTable,
  fundPortfolioKpisTable,
  fundFormDFilingsTable,
  fundAccreditedInvestorsTable,
  fundLpReportsTable,
  fundShareClassesTable,
  fundCapTableHoldersTable,
  fundCapTableTransactionsTable,
  fundVestingSchedulesTable,
  fundCapitalCallsTable,
  fundLpCapitalAccountsTable,
  fundCapitalCallLinesTable,
  fundDistributionsTable,
  fundDistributionLinesTable,
  fundNavRecordsTable,
  fundCapTableAuditLogTable,
  auditLogsTable,
} from "@szl-holdings/db";
import { eq, desc, sql, and, asc } from "drizzle-orm";
import { sendSuccess, sendNotFound, handleRouteError, parsePagination } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";
import { listQuerySchema, validateBody, validateQuery } from "../lib/validation";

const router: IRouter = Router();
const auth = [authMiddleware(), requireRole("ops", "exec", "admin")];

async function auditFundOp(action: string, entity: string, entityId: string | number, payload?: unknown) {
  try {
    await db.insert(auditLogsTable).values({
      actionType: action,
      entityType: entity,
      entityId: String(entityId),
      payloadJson: payload as Record<string, unknown> ?? null,
    });
    await db.insert(fundCapTableAuditLogTable).values({
      entityType: entity,
      entityId: String(entityId),
      actionType: action as "create" | "update" | "delete" | "convert" | "vest" | "exercise",
      summary: `${action} on ${entity} #${entityId}`,
      newState: payload as Record<string, unknown> ?? null,
    });
  } catch {
    // non-fatal audit failure
  }
}

// ─── PORTFOLIO FINANCIALS ─────────────────────────────────────────────────────

router.get("/fund-ops/portfolio-financials", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const companySlug = req.query.companySlug as string | undefined;
    const periodLabel = req.query.periodLabel as string | undefined;

    let query = db.select().from(fundPortfolioFinancialsTable);
    if (companySlug) query = query.where(eq(fundPortfolioFinancialsTable.companySlug, companySlug)) as typeof query;

    const rows = await query.orderBy(desc(fundPortfolioFinancialsTable.periodStart)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(fundPortfolioFinancialsTable);
    sendSuccess(res, rows, 200, { page, limit, total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list portfolio financials");
  }
});

router.get("/fund-ops/portfolio-financials/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(fundPortfolioFinancialsTable).where(eq(fundPortfolioFinancialsTable.id, id));
    if (!row) { sendNotFound(res, "Portfolio financial record"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get portfolio financial record");
  }
});

router.post("/fund-ops/portfolio-financials", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundPortfolioFinancialsTable).values(req.body).returning();
    await auditFundOp("create", "fund_portfolio_financial", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create portfolio financial record");
  }
});

router.patch("/fund-ops/portfolio-financials/:id", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(fundPortfolioFinancialsTable)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(fundPortfolioFinancialsTable.id, id))
      .returning();
    if (!row) { sendNotFound(res, "Portfolio financial record"); return; }
    await auditFundOp("update", "fund_portfolio_financial", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update portfolio financial record");
  }
});

router.delete("/fund-ops/portfolio-financials/:id", validateBody(bodyShape({})), ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(fundPortfolioFinancialsTable).where(eq(fundPortfolioFinancialsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Portfolio financial record"); return; }
    await auditFundOp("delete", "fund_portfolio_financial", id, {});
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete portfolio financial record");
  }
});

// ─── PORTFOLIO KPIs ───────────────────────────────────────────────────────────

router.get("/fund-ops/portfolio-kpis", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const companySlug = req.query.companySlug as string | undefined;
    let query = db.select().from(fundPortfolioKpisTable);
    if (companySlug) query = query.where(eq(fundPortfolioKpisTable.companySlug, companySlug)) as typeof query;
    const rows = await query.orderBy(desc(fundPortfolioKpisTable.periodStart)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(fundPortfolioKpisTable);
    sendSuccess(res, rows, 200, { page, limit, total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list portfolio KPIs");
  }
});

router.post("/fund-ops/portfolio-kpis", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundPortfolioKpisTable).values(req.body).returning();
    await auditFundOp("create", "fund_portfolio_kpi", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create portfolio KPI record");
  }
});

router.patch("/fund-ops/portfolio-kpis/:id", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(fundPortfolioKpisTable).set({ ...req.body, updatedAt: new Date() }).where(eq(fundPortfolioKpisTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Portfolio KPI record"); return; }
    await auditFundOp("update", "fund_portfolio_kpi", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update portfolio KPI record");
  }
});

router.delete("/fund-ops/portfolio-kpis/:id", validateBody(bodyShape({})), ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(fundPortfolioKpisTable).where(eq(fundPortfolioKpisTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Portfolio KPI record"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete portfolio KPI record");
  }
});

// ─── PORTFOLIO AGGREGATE VIEW ─────────────────────────────────────────────────

router.get("/fund-ops/portfolio-aggregate", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const periodLabel = req.query.periodLabel as string | undefined;

    const financials = await db
      .select()
      .from(fundPortfolioFinancialsTable)
      .where(periodLabel ? eq(fundPortfolioFinancialsTable.periodLabel, periodLabel) : undefined)
      .orderBy(desc(fundPortfolioFinancialsTable.periodStart));

    const kpis = await db
      .select()
      .from(fundPortfolioKpisTable)
      .where(periodLabel ? eq(fundPortfolioKpisTable.periodLabel, periodLabel) : undefined);

    const totalRevenue = financials.reduce((s, f) => s + parseFloat(f.revenue ?? "0"), 0);
    const totalBurnRate = financials.reduce((s, f) => s + parseFloat(f.burnRate ?? "0"), 0);
    const totalCash = financials.reduce((s, f) => s + parseFloat(f.cashAndEquivalents ?? "0"), 0);
    const avgRunway = financials.length
      ? financials.reduce((s, f) => s + parseFloat(f.runwayMonths ?? "0"), 0) / financials.length
      : 0;
    const totalMrr = kpis.reduce((s, k) => s + parseFloat(k.mrr ?? "0"), 0);
    const totalCustomers = kpis.reduce((s, k) => s + (k.totalCustomers ?? 0), 0);

    const revenueByCompany = financials.map(f => ({
      company: f.companyName,
      slug: f.companySlug,
      revenue: parseFloat(f.revenue ?? "0"),
      burnRate: parseFloat(f.burnRate ?? "0"),
      cash: parseFloat(f.cashAndEquivalents ?? "0"),
      runway: parseFloat(f.runwayMonths ?? "0"),
      period: f.periodLabel,
    }));

    sendSuccess(res, {
      period: periodLabel ?? "latest",
      summary: {
        totalRevenue,
        totalBurnRate,
        totalCash,
        avgRunwayMonths: parseFloat(avgRunway.toFixed(1)),
        totalMrr,
        totalCustomers,
        companyCount: financials.length,
      },
      revenueConcentration: revenueByCompany,
      financials,
      kpis,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute portfolio aggregate");
  }
});

// ─── SEC COMPLIANCE — FORM D ──────────────────────────────────────────────────

router.get("/fund-ops/form-d-filings", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(fundFormDFilingsTable).orderBy(desc(fundFormDFilingsTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(fundFormDFilingsTable);
    sendSuccess(res, rows, 200, { page, limit, total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list Form D filings");
  }
});

router.post("/fund-ops/form-d-filings", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundFormDFilingsTable).values(req.body).returning();
    await auditFundOp("create", "fund_form_d_filing", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create Form D filing");
  }
});

router.patch("/fund-ops/form-d-filings/:id", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(fundFormDFilingsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(fundFormDFilingsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Form D filing"); return; }
    await auditFundOp("update", "fund_form_d_filing", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update Form D filing");
  }
});

router.delete("/fund-ops/form-d-filings/:id", validateBody(bodyShape({})), ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.delete(fundFormDFilingsTable).where(eq(fundFormDFilingsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Form D filing"); return; }
    sendSuccess(res, { deleted: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to delete Form D filing");
  }
});

// ─── ACCREDITED INVESTORS ─────────────────────────────────────────────────────

router.get("/fund-ops/accredited-investors", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(fundAccreditedInvestorsTable).orderBy(desc(fundAccreditedInvestorsTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(fundAccreditedInvestorsTable);
    sendSuccess(res, rows, 200, { page, limit, total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list accredited investors");
  }
});

router.get("/fund-ops/accredited-investors/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(fundAccreditedInvestorsTable).where(eq(fundAccreditedInvestorsTable.id, id));
    if (!row) { sendNotFound(res, "Accredited investor"); return; }
    const account = await db.select().from(fundLpCapitalAccountsTable).where(eq(fundLpCapitalAccountsTable.lpId, id));
    sendSuccess(res, { ...row, capitalAccount: account[0] ?? null });
  } catch (err) {
    handleRouteError(res, err, "Failed to get accredited investor");
  }
});

router.post("/fund-ops/accredited-investors", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundAccreditedInvestorsTable).values(req.body).returning();
    await auditFundOp("create", "fund_accredited_investor", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create accredited investor");
  }
});

router.patch("/fund-ops/accredited-investors/:id", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(fundAccreditedInvestorsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(fundAccreditedInvestorsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Accredited investor"); return; }
    await auditFundOp("update", "fund_accredited_investor", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update accredited investor");
  }
});

// ─── LP REPORTS ───────────────────────────────────────────────────────────────

router.get("/fund-ops/lp-reports", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(fundLpReportsTable).orderBy(desc(fundLpReportsTable.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(fundLpReportsTable);
    sendSuccess(res, rows, 200, { page, limit, total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list LP reports");
  }
});

router.get("/fund-ops/lp-reports/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.select().from(fundLpReportsTable).where(eq(fundLpReportsTable.id, id));
    if (!row) { sendNotFound(res, "LP report"); return; }
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to get LP report");
  }
});

router.post("/fund-ops/lp-reports", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundLpReportsTable).values(req.body).returning();
    await auditFundOp("create", "fund_lp_report", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create LP report");
  }
});

router.patch("/fund-ops/lp-reports/:id", ...auth, validateBody(bodyShape({
      "approvedAt": z.unknown().optional(),
      "distributedAt": z.unknown().optional(),
      "status": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const update: Record<string, unknown> = { ...req.body, updatedAt: new Date() };
    if (req.body.status === "approved" && !req.body.approvedAt) update.approvedAt = new Date();
    if (req.body.status === "distributed" && !req.body.distributedAt) update.distributedAt = new Date();
    const [row] = await db.update(fundLpReportsTable).set(update).where(eq(fundLpReportsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "LP report"); return; }
    await auditFundOp("update", "fund_lp_report", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update LP report");
  }
});

// ─── CAP TABLE — SHARE CLASSES ────────────────────────────────────────────────

router.get("/fund-ops/share-classes", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(fundShareClassesTable).orderBy(asc(fundShareClassesTable.seniority));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list share classes");
  }
});

router.post("/fund-ops/share-classes", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundShareClassesTable).values(req.body).returning();
    await auditFundOp("create", "fund_share_class", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create share class");
  }
});

router.patch("/fund-ops/share-classes/:id", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(fundShareClassesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(fundShareClassesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Share class"); return; }
    await auditFundOp("update", "fund_share_class", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update share class");
  }
});

// ─── CAP TABLE — HOLDERS ──────────────────────────────────────────────────────

router.get("/fund-ops/cap-table-holders", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(fundCapTableHoldersTable).orderBy(asc(fundCapTableHoldersTable.name));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list cap table holders");
  }
});

router.post("/fund-ops/cap-table-holders", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundCapTableHoldersTable).values(req.body).returning();
    await auditFundOp("create", "fund_cap_table_holder", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create cap table holder");
  }
});

router.patch("/fund-ops/cap-table-holders/:id", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(fundCapTableHoldersTable).set({ ...req.body, updatedAt: new Date() }).where(eq(fundCapTableHoldersTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Cap table holder"); return; }
    await auditFundOp("update", "fund_cap_table_holder", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update cap table holder");
  }
});

// ─── CAP TABLE — TRANSACTIONS ─────────────────────────────────────────────────

router.get("/fund-ops/cap-table-transactions", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const holderId = req.query.holderId ? parseInt(String(req.query.holderId), 10) : undefined;
    let query = db.select().from(fundCapTableTransactionsTable);
    if (holderId) query = query.where(eq(fundCapTableTransactionsTable.holderId, holderId)) as typeof query;
    const rows = await query.orderBy(desc(fundCapTableTransactionsTable.transactionDate)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(fundCapTableTransactionsTable);
    sendSuccess(res, rows, 200, { page, limit, total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list cap table transactions");
  }
});

router.post("/fund-ops/cap-table-transactions", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const body = { ...req.body, isAuditLocked: false };
    const [row] = await db.insert(fundCapTableTransactionsTable).values(body).returning();
    await auditFundOp("create", "fund_cap_table_transaction", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create cap table transaction");
  }
});

// ─── CAP TABLE SUMMARY (dilution model) ──────────────────────────────────────

router.get("/fund-ops/cap-table-summary", ...auth, async (req, res) => {
  try {
    const holders = await db.select().from(fundCapTableHoldersTable).where(eq(fundCapTableHoldersTable.isActive, true));
    const shareClasses = await db.select().from(fundShareClassesTable).where(eq(fundShareClassesTable.isActive, true));
    const transactions = await db.select().from(fundCapTableTransactionsTable).orderBy(asc(fundCapTableTransactionsTable.transactionDate));

    const holderShareMap: Record<number, Record<number, number>> = {};
    for (const txn of transactions) {
      if (!holderShareMap[txn.holderId]) holderShareMap[txn.holderId] = {};
      const shares = parseFloat(txn.shares ?? "0");
      const isDecrease = ["cancellation", "repurchase", "transfer"].includes(txn.transactionType);
      const fromId = txn.fromHolderId;
      if (fromId && isDecrease) {
        holderShareMap[fromId][txn.shareClassId] = (holderShareMap[fromId][txn.shareClassId] ?? 0) - shares;
      } else {
        holderShareMap[txn.holderId][txn.shareClassId] = (holderShareMap[txn.holderId][txn.shareClassId] ?? 0) + shares;
      }
    }

    const totalSharesByClass: Record<number, number> = {};
    for (const holder of holders) {
      for (const [classId, shares] of Object.entries(holderShareMap[holder.id] ?? {})) {
        totalSharesByClass[Number(classId)] = (totalSharesByClass[Number(classId)] ?? 0) + shares;
      }
    }
    const fullyDilutedTotal = Object.values(totalSharesByClass).reduce((s, v) => s + v, 0);

    const rows = holders.map(holder => {
      const sharesByClass = holderShareMap[holder.id] ?? {};
      const totalShares = Object.values(sharesByClass).reduce((s, v) => s + v, 0);
      const ownershipPct = fullyDilutedTotal > 0 ? (totalShares / fullyDilutedTotal) * 100 : 0;
      return {
        holder,
        sharesByClass,
        totalShares,
        ownershipPct: parseFloat(ownershipPct.toFixed(4)),
      };
    });

    sendSuccess(res, {
      holders: rows,
      shareClasses,
      totalSharesByClass,
      fullyDilutedTotal,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute cap table summary");
  }
});

// ─── VESTING SCHEDULES ────────────────────────────────────────────────────────

router.get("/fund-ops/vesting-schedules", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(fundVestingSchedulesTable).orderBy(desc(fundVestingSchedulesTable.grantDate));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list vesting schedules");
  }
});

router.post("/fund-ops/vesting-schedules", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundVestingSchedulesTable).values(req.body).returning();
    await auditFundOp("create", "fund_vesting_schedule", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create vesting schedule");
  }
});

router.patch("/fund-ops/vesting-schedules/:id", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(fundVestingSchedulesTable).set({ ...req.body, updatedAt: new Date() }).where(eq(fundVestingSchedulesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Vesting schedule"); return; }
    await auditFundOp("vest", "fund_vesting_schedule", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update vesting schedule");
  }
});

// ─── CAPITAL CALLS ────────────────────────────────────────────────────────────

router.get("/fund-ops/capital-calls", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(fundCapitalCallsTable).orderBy(desc(fundCapitalCallsTable.callDate)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(fundCapitalCallsTable);
    sendSuccess(res, rows, 200, { page, limit, total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list capital calls");
  }
});

router.get("/fund-ops/capital-calls/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [call] = await db.select().from(fundCapitalCallsTable).where(eq(fundCapitalCallsTable.id, id));
    if (!call) { sendNotFound(res, "Capital call"); return; }
    const lines = await db.select().from(fundCapitalCallLinesTable).where(eq(fundCapitalCallLinesTable.capitalCallId, id));
    sendSuccess(res, { ...call, lines });
  } catch (err) {
    handleRouteError(res, err, "Failed to get capital call");
  }
});

router.post("/fund-ops/capital-calls", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundCapitalCallsTable).values(req.body).returning();
    await auditFundOp("create", "fund_capital_call", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create capital call");
  }
});

router.patch("/fund-ops/capital-calls/:id", ...auth, validateBody(bodyShape({
      "noticesSentAt": z.unknown().optional(),
      "status": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const update = { ...req.body, updatedAt: new Date() };
    if (req.body.status === "notices_sent" && !req.body.noticesSentAt) update.noticesSentAt = new Date();
    const [row] = await db.update(fundCapitalCallsTable).set(update).where(eq(fundCapitalCallsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Capital call"); return; }
    await auditFundOp("update", "fund_capital_call", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update capital call");
  }
});

router.post("/fund-ops/capital-call-lines", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundCapitalCallLinesTable).values(req.body).returning();
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create capital call line");
  }
});

router.patch("/fund-ops/capital-call-lines/:id", ...auth, validateBody(bodyShape({
      "receivedAt": z.unknown().optional(),
      "status": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const update = { ...req.body, updatedAt: new Date() };
    if (req.body.status === "received" && !req.body.receivedAt) update.receivedAt = new Date();
    const [row] = await db.update(fundCapitalCallLinesTable).set(update).where(eq(fundCapitalCallLinesTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Capital call line"); return; }

    const allLines = await db.select().from(fundCapitalCallLinesTable).where(eq(fundCapitalCallLinesTable.capitalCallId, row.capitalCallId));
    const funded = allLines.reduce((s, l) => s + (l.receivedCents ?? 0), 0);
    await db.update(fundCapitalCallsTable).set({ fundedAmountCents: funded, updatedAt: new Date() }).where(eq(fundCapitalCallsTable.id, row.capitalCallId));

    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update capital call line");
  }
});

// ─── LP CAPITAL ACCOUNTS ──────────────────────────────────────────────────────

router.get("/fund-ops/lp-capital-accounts", ...auth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: fundLpCapitalAccountsTable.id,
        lpId: fundLpCapitalAccountsTable.lpId,
        lpName: fundAccreditedInvestorsTable.lpName,
        lpType: fundAccreditedInvestorsTable.lpType,
        commitmentCents: fundLpCapitalAccountsTable.commitmentCents,
        calledCents: fundLpCapitalAccountsTable.calledCents,
        uncalledCents: fundLpCapitalAccountsTable.uncalledCents,
        distributionsCents: fundLpCapitalAccountsTable.distributionsCents,
        currentNavCents: fundLpCapitalAccountsTable.currentNavCents,
        ownershipPct: fundLpCapitalAccountsTable.ownershipPct,
        managementFeesPaidCents: fundLpCapitalAccountsTable.managementFeesPaidCents,
        carriedInterestPaidCents: fundLpCapitalAccountsTable.carriedInterestPaidCents,
        vintage: fundLpCapitalAccountsTable.vintage,
        notes: fundLpCapitalAccountsTable.notes,
      })
      .from(fundLpCapitalAccountsTable)
      .leftJoin(fundAccreditedInvestorsTable, eq(fundLpCapitalAccountsTable.lpId, fundAccreditedInvestorsTable.id))
      .orderBy(desc(fundLpCapitalAccountsTable.commitmentCents));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list LP capital accounts");
  }
});

router.post("/fund-ops/lp-capital-accounts", ...auth, validateBody(bodyShape({
      "calledCents": z.unknown().optional(),
      "commitmentCents": z.unknown().optional(),
    })), async (req, res) => {
  try {
    const body = {
      ...req.body,
      uncalledCents: (req.body.commitmentCents ?? 0) - (req.body.calledCents ?? 0),
    };
    const [row] = await db.insert(fundLpCapitalAccountsTable).values(body).returning();
    await auditFundOp("create", "fund_lp_capital_account", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create LP capital account");
  }
});

router.patch("/fund-ops/lp-capital-accounts/:id", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(fundLpCapitalAccountsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(fundLpCapitalAccountsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "LP capital account"); return; }
    await auditFundOp("update", "fund_lp_capital_account", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update LP capital account");
  }
});

// ─── DISTRIBUTIONS ────────────────────────────────────────────────────────────

router.get("/fund-ops/distributions", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(fundDistributionsTable).orderBy(desc(fundDistributionsTable.distributionDate)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(fundDistributionsTable);
    sendSuccess(res, rows, 200, { page, limit, total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list distributions");
  }
});

router.get("/fund-ops/distributions/:id", ...auth, async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [dist] = await db.select().from(fundDistributionsTable).where(eq(fundDistributionsTable.id, id));
    if (!dist) { sendNotFound(res, "Distribution"); return; }
    const lines = await db.select().from(fundDistributionLinesTable).where(eq(fundDistributionLinesTable.distributionId, id));
    sendSuccess(res, { ...dist, lines });
  } catch (err) {
    handleRouteError(res, err, "Failed to get distribution");
  }
});

router.post("/fund-ops/distributions", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundDistributionsTable).values(req.body).returning();
    await auditFundOp("create", "fund_distribution", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create distribution");
  }
});

router.patch("/fund-ops/distributions/:id", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [row] = await db.update(fundDistributionsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(fundDistributionsTable.id, id)).returning();
    if (!row) { sendNotFound(res, "Distribution"); return; }
    await auditFundOp("update", "fund_distribution", id, req.body);
    sendSuccess(res, row);
  } catch (err) {
    handleRouteError(res, err, "Failed to update distribution");
  }
});

// ─── NAV RECORDS ──────────────────────────────────────────────────────────────

router.get("/fund-ops/nav-records", ...auth, async (req, res) => {
  try {
    const rows = await db.select().from(fundNavRecordsTable).orderBy(desc(fundNavRecordsTable.navDate));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, "Failed to list NAV records");
  }
});

router.post("/fund-ops/nav-records", ...auth, validateBody(bodyShape({})), async (req, res) => {
  try {
    const [row] = await db.insert(fundNavRecordsTable).values(req.body).returning();
    await auditFundOp("create", "fund_nav_record", row.id, req.body);
    sendSuccess(res, row, 201);
  } catch (err) {
    handleRouteError(res, err, "Failed to create NAV record");
  }
});

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

router.get("/fund-ops/audit-log", ...auth, validateQuery(listQuerySchema), async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await db.select().from(fundCapTableAuditLogTable).orderBy(desc(fundCapTableAuditLogTable.occurredAt)).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(fundCapTableAuditLogTable);
    sendSuccess(res, rows, 200, { page, limit, total });
  } catch (err) {
    handleRouteError(res, err, "Failed to list audit log");
  }
});

// ─── FUND OPS SUMMARY DASHBOARD ───────────────────────────────────────────────

router.get("/fund-ops/summary", ...auth, async (req, res) => {
  try {
    const [
      [{ investorCount }],
      [{ verifiedCount }],
      [{ formDCount }],
      [{ reportCount }],
      [{ capCallCount }],
      [{ distCount }],
      latestNav,
      pendingCalls,
    ] = await Promise.all([
      db.select({ investorCount: sql<number>`count(*)::int` }).from(fundAccreditedInvestorsTable),
      db.select({ verifiedCount: sql<number>`count(*)::int` }).from(fundAccreditedInvestorsTable).where(eq(fundAccreditedInvestorsTable.verificationStatus, "verified")),
      db.select({ formDCount: sql<number>`count(*)::int` }).from(fundFormDFilingsTable),
      db.select({ reportCount: sql<number>`count(*)::int` }).from(fundLpReportsTable),
      db.select({ capCallCount: sql<number>`count(*)::int` }).from(fundCapitalCallsTable),
      db.select({ distCount: sql<number>`count(*)::int` }).from(fundDistributionsTable),
      db.select().from(fundNavRecordsTable).orderBy(desc(fundNavRecordsTable.navDate)).limit(1),
      db.select().from(fundCapitalCallsTable).where(eq(fundCapitalCallsTable.status, "notices_sent")).orderBy(asc(fundCapitalCallsTable.dueDate)).limit(5),
    ]);

    sendSuccess(res, {
      compliance: {
        totalInvestors: investorCount,
        verifiedInvestors: verifiedCount,
        pendingVerification: investorCount - verifiedCount,
        formDFilings: formDCount,
        lpReports: reportCount,
      },
      fundAdmin: {
        capitalCalls: capCallCount,
        distributions: distCount,
        latestNav: latestNav[0] ?? null,
        pendingCapitalCalls: pendingCalls,
      },
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get fund ops summary");
  }
});

// ─── SEED DEMO DATA — REMOVED ─────────────────────────────────────────────────
export default router;
