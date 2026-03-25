import { Router, type IRouter } from "express";
import { db, billingPlansTable, subscriptionsTable, invoicesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSuccess, sendNotFound, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole, parseIdParam } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/billing/plans", authMiddleware(), async (_req, res) => {
  try {
    const plans = await db.select().from(billingPlansTable).orderBy(billingPlansTable.name);
    sendSuccess(res, plans);
  } catch (err) {
    handleRouteError(res, err, "Failed to list billing plans");
  }
});

router.get("/billing/plans/:id", authMiddleware(), async (req, res) => {
  try {
    const id = parseIdParam(req.params.id);
    const [plan] = await db.select().from(billingPlansTable).where(eq(billingPlansTable.id, id));
    if (!plan) {
      sendNotFound(res, "Billing plan");
      return;
    }
    sendSuccess(res, plan);
  } catch (err) {
    handleRouteError(res, err, "Failed to get billing plan");
  }
});

router.get("/billing/subscriptions", authMiddleware(), requireRole("operator", "analyst"), async (_req, res) => {
  try {
    const subs = await db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt));
    sendSuccess(res, subs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list subscriptions");
  }
});

router.get("/billing/invoices", authMiddleware(), requireRole("operator", "analyst"), async (_req, res) => {
  try {
    const invs = await db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt));
    sendSuccess(res, invs);
  } catch (err) {
    handleRouteError(res, err, "Failed to list invoices");
  }
});

export default router;
