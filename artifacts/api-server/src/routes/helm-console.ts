import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { db } from "@szl-holdings/db";
import {
  agentUsageStats,
  atlasArtifactsTable,
  atlasExportJobsTable,
  outcomeGraphTable,
  outcomeGraphLearningJobsTable,
  worldlineSourceRegistryTable,
  proofChainTable,
} from "@szl-holdings/db";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { sendError } from "../lib/api-response";
import type { Request, Response } from "express";
import { sql, count, avg, desc, gte, eq, and } from "drizzle-orm";

const helmRouter: IRouter = Router();

helmRouter.use("/helm", authMiddleware({ required: true }));
helmRouter.use("/helm", requireRole("admin", "super_admin"));

helmRouter.get("/helm/overview", async (_req: Request, res: Response) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      agentRuns,
      artifactStats,
      exportJobStats,
      outcomeStats,
      worldlineHealth,
      proofChainStats,
    ] = await Promise.allSettled([
      db.select({ total: count(), avgLatency: avg(agentUsageStats.latencyMs), avgTokens: avg(agentUsageStats.tokensUsed) })
        .from(agentUsageStats)
        .where(gte(agentUsageStats.recordedAt, since24h)),

      db.select({ status: atlasArtifactsTable.status, total: count() })
        .from(atlasArtifactsTable)
        .where(gte(atlasArtifactsTable.createdAt, since7d))
        .groupBy(atlasArtifactsTable.status),

      db.select({ status: atlasExportJobsTable.status, total: count() })
        .from(atlasExportJobsTable)
        .where(gte(atlasExportJobsTable.createdAt, since7d))
        .groupBy(atlasExportJobsTable.status),

      db.select({ status: outcomeGraphTable.status, total: count(), avgConfidence: avg(outcomeGraphTable.confidence) })
        .from(outcomeGraphTable)
        .where(gte(outcomeGraphTable.createdAt, since7d))
        .groupBy(outcomeGraphTable.status),

      db.select({ status: worldlineSourceRegistryTable.status, total: count() })
        .from(worldlineSourceRegistryTable)
        .groupBy(worldlineSourceRegistryTable.status),

      db.select({ reviewState: proofChainTable.reviewState, total: count() })
        .from(proofChainTable)
        .where(gte(proofChainTable.createdAt, since7d))
        .groupBy(proofChainTable.reviewState),
    ]);

    return void res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        windows: { last24h: since24h.toISOString(), last7d: since7d.toISOString() },
        agentRuns: agentRuns.status === "fulfilled" ? agentRuns.value[0] : null,
        artifactStats: artifactStats.status === "fulfilled" ? artifactStats.value : [],
        exportJobStats: exportJobStats.status === "fulfilled" ? exportJobStats.value : [],
        outcomeStats: outcomeStats.status === "fulfilled" ? outcomeStats.value : [],
        worldlineHealth: worldlineHealth.status === "fulfilled" ? worldlineHealth.value : [],
        proofChainStats: proofChainStats.status === "fulfilled" ? proofChainStats.value : [],
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /helm/overview error:");
    return void sendError(res, "Failed to fetch HELM overview");
  }
});

helmRouter.get("/helm/agent-runs", async (req: Request, res: Response) => {
  try {
    const since = req.query.since
      ? new Date(req.query.since as string)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const rows = await db.select({
      agentId: agentUsageStats.agentId,
      agentName: agentUsageStats.agentName,
      domain: agentUsageStats.domain,
      totalRuns: count(),
      avgLatencyMs: avg(agentUsageStats.latencyMs),
      avgTokens: avg(agentUsageStats.tokensUsed),
    })
      .from(agentUsageStats)
      .where(gte(agentUsageStats.recordedAt, since))
      .groupBy(agentUsageStats.agentId, agentUsageStats.agentName, agentUsageStats.domain)
      .orderBy(desc(count()));

    return void res.json({ success: true, data: rows });
  } catch (err) {
    logger.error({ err }, "GET /helm/agent-runs error:");
    return void sendError(res, "Failed to fetch agent runs");
  }
});

helmRouter.get("/helm/outcome-graph", async (req: Request, res: Response) => {
  try {
    const since = req.query.since
      ? new Date(req.query.since as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [byDomain, overrides] = await Promise.all([
      db.select({
        domain: outcomeGraphTable.domain,
        total: count(),
        avgConfidence: avg(outcomeGraphTable.confidence),
      })
        .from(outcomeGraphTable)
        .where(gte(outcomeGraphTable.createdAt, since))
        .groupBy(outcomeGraphTable.domain),

      db.select({
        agentId: outcomeGraphTable.agentId,
        overrideCount: count(),
      })
        .from(outcomeGraphTable)
        .where(and(
          gte(outcomeGraphTable.createdAt, since),
          eq(outcomeGraphTable.userDecision, "overridden"),
        ))
        .groupBy(outcomeGraphTable.agentId)
        .orderBy(desc(count()))
        .limit(10),
    ]);

    return void res.json({ success: true, data: { byDomain, topOverrideAgents: overrides } });
  } catch (err) {
    logger.error({ err }, "GET /helm/outcome-graph error:");
    return void sendError(res, "Failed to fetch outcome graph stats");
  }
});

helmRouter.get("/helm/atlas-artifacts", async (req: Request, res: Response) => {
  try {
    const since = req.query.since
      ? new Date(req.query.since as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [byTemplate, exportsByFormat, recentJobs] = await Promise.all([
      db.select({
        templateType: atlasArtifactsTable.templateType,
        domain: atlasArtifactsTable.domain,
        total: count(),
      })
        .from(atlasArtifactsTable)
        .where(and(gte(atlasArtifactsTable.createdAt, since), eq(atlasArtifactsTable.isLatest, true)))
        .groupBy(atlasArtifactsTable.templateType, atlasArtifactsTable.domain),

      db.select({
        format: atlasExportJobsTable.format,
        total: count(),
      })
        .from(atlasExportJobsTable)
        .where(gte(atlasExportJobsTable.createdAt, since))
        .groupBy(atlasExportJobsTable.format),

      db.select()
        .from(atlasExportJobsTable)
        .where(eq(atlasExportJobsTable.status, "failed"))
        .orderBy(desc(atlasExportJobsTable.createdAt))
        .limit(5),
    ]);

    return void res.json({ success: true, data: { byTemplate, exportsByFormat, failedExports: recentJobs } });
  } catch (err) {
    logger.error({ err }, "GET /helm/atlas-artifacts error:");
    return void sendError(res, "Failed to fetch atlas artifact stats");
  }
});

helmRouter.get("/helm/worldline", async (_req: Request, res: Response) => {
  try {
    const sources = await db.select().from(worldlineSourceRegistryTable)
      .orderBy(desc(worldlineSourceRegistryTable.updatedAt))
      .limit(100);

    const degraded = sources.filter(s => s.status === "degraded");
    const inactive = sources.filter(s => s.status === "inactive" || s.status === "paused");
    const active = sources.filter(s => s.status === "active");

    return void res.json({
      success: true,
      data: {
        total: sources.length,
        active: active.length,
        degraded: degraded.length,
        inactive: inactive.length,
        degradedSources: degraded.slice(0, 10).map(s => ({
          slug: s.slug,
          name: s.name,
          domain: s.domain,
          consecutiveFailures: s.consecutiveFailures,
          lastErrorMessage: s.lastErrorMessage,
          lastFetchedAt: s.lastFetchedAt,
        })),
      },
    });
  } catch (err) {
    logger.error({ err }, "GET /helm/worldline error:");
    return void sendError(res, "Failed to fetch worldline health");
  }
});

helmRouter.get("/helm/proof-chain", async (req: Request, res: Response) => {
  try {
    const since = req.query.since
      ? new Date(req.query.since as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const anomalies = await db.select()
      .from(proofChainTable)
      .where(and(
        gte(proofChainTable.createdAt, since),
        eq(proofChainTable.reviewState, "flagged"),
      ))
      .orderBy(desc(proofChainTable.createdAt))
      .limit(20);

    const byState = await db.select({
      reviewState: proofChainTable.reviewState,
      exportSafetyState: proofChainTable.exportSafetyState,
      total: count(),
    })
      .from(proofChainTable)
      .where(gte(proofChainTable.createdAt, since))
      .groupBy(proofChainTable.reviewState, proofChainTable.exportSafetyState);

    return void res.json({ success: true, data: { anomalies, byState } });
  } catch (err) {
    logger.error({ err }, "GET /helm/proof-chain error:");
    return void sendError(res, "Failed to fetch proof chain stats");
  }
});

export default helmRouter;
