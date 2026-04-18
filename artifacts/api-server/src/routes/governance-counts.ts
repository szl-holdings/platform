import { Router, type Request, type Response } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { requireAnyAuth } from "../middlewares/auth";
import { db, approvalRequestsTable } from "@szl-holdings/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

/**
 * GET /api/governance/pending
 *
 * Lightweight count of pending governance approval requests scoped to
 * policy resources. Used by the Command Ops nav badge.
 */
router.get("/pending", requireAnyAuth(), async (_req: Request, res: Response) => {
  try {
    const [row] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(approvalRequestsTable)
      .where(eq(approvalRequestsTable.status, "pending"));
    const count = Number(row?.count ?? 0);
    sendSuccess(res, { count, generatedAt: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "governance/pending error");
    handleRouteError(res, err, "Failed to load governance pending count");
  }
});

export default router;
