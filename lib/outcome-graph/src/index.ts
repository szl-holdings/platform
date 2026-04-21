import {
  db,
  outcomeGraphTable,
  outcomeGraphLearningJobsTable,
  type InsertOutcomeGraph,
  type OutcomeGraph,
  type OutcomeGraphLearningJob,
  type OutcomeDecisionStatus,
  type OutcomeResult,
  type OutcomeDomain,
} from "@szl-holdings/db";
import { eq, and, desc, sql, gte, count, avg } from "drizzle-orm";

export type {
  OutcomeGraph,
  OutcomeGraphLearningJob,
  OutcomeDecisionStatus,
  OutcomeResult,
  OutcomeDomain,
};

export interface RecordRecommendationParams {
  orgId?: number | null;
  domain: OutcomeDomain;
  entityType: string;
  entityId?: string;
  recommendationId?: string;
  recommendationText: string;
  recommendationAction?: string;
  agentId?: string;
  modelId?: string;
  modelProvider?: string;
  confidence?: number;
  proofChainId?: number;
  correlationId?: string;
  domainConditions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RecordDecisionParams {
  outcomeId: number;
  userDecision: "accepted" | "rejected" | "overridden" | "deferred";
  decidedByUserId?: number;
  overrideReason?: string;
  correctionReason?: string;
  actionExecuted?: string;
}

export interface RecordOutcomeParams {
  outcomeId: number;
  outcomeResult: OutcomeResult;
  outcomeNotes?: string;
  laterImpact?: Record<string, unknown>;
}

export interface OutcomeStats {
  domain: string;
  totalRecommendations: number;
  acceptanceRate: number;
  rejectionRate: number;
  overrideRate: number;
  outcomeAchievedRate: number;
  averageConfidence: number;
  averageTimeToOutcomeMs: number | null;
}

export async function recordRecommendation(
  params: RecordRecommendationParams,
): Promise<OutcomeGraph> {
  const [row] = await db.insert(outcomeGraphTable).values({
    orgId: params.orgId ?? null,
    domain: params.domain,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    recommendationId: params.recommendationId ?? null,
    recommendationText: params.recommendationText,
    recommendationAction: params.recommendationAction ?? null,
    agentId: params.agentId ?? null,
    modelId: params.modelId ?? null,
    modelProvider: params.modelProvider ?? null,
    confidence: params.confidence ?? 0.5,
    status: "pending",
    proofChainId: params.proofChainId ?? null,
    correlationId: params.correlationId ?? null,
    domainConditions: params.domainConditions ?? {},
    metadata: params.metadata ?? {},
  }).returning();
  return row!;
}

export async function recordDecision(params: RecordDecisionParams): Promise<OutcomeGraph> {
  const now = new Date();

  const statusMap: Record<string, OutcomeDecisionStatus> = {
    accepted: "accepted",
    rejected: "rejected",
    overridden: "overridden",
    deferred: "deferred",
  };

  const [row] = await db
    .update(outcomeGraphTable)
    .set({
      userDecision: params.userDecision,
      decidedByUserId: params.decidedByUserId ?? null,
      decidedAt: now,
      status: statusMap[params.userDecision] ?? "accepted",
      overrideReason: params.overrideReason ?? null,
      correctionReason: params.correctionReason ?? null,
      actionExecuted: params.actionExecuted ?? null,
      actionExecutedAt: params.actionExecuted ? now : null,
      updatedAt: now,
    })
    .where(eq(outcomeGraphTable.id, params.outcomeId))
    .returning();

  if (!row) {
    throw Object.assign(new Error(`OutcomeGraph record ${params.outcomeId} not found`), { code: "NOT_FOUND" });
  }
  return row;
}

export async function recordOutcome(params: RecordOutcomeParams): Promise<OutcomeGraph> {
  const [existing] = await db
    .select()
    .from(outcomeGraphTable)
    .where(eq(outcomeGraphTable.id, params.outcomeId));

  if (!existing) {
    throw Object.assign(new Error(`OutcomeGraph record ${params.outcomeId} not found`), { code: "NOT_FOUND" });
  }

  const now = new Date();
  const timeToOutcomeMs = existing.decidedAt
    ? now.getTime() - existing.decidedAt.getTime()
    : null;

  const [row] = await db
    .update(outcomeGraphTable)
    .set({
      outcomeResult: params.outcomeResult,
      outcomeNotes: params.outcomeNotes ?? null,
      outcomeRecordedAt: now,
      timeToOutcomeMs,
      laterImpact: params.laterImpact ?? {},
      status: "executed",
      updatedAt: now,
    })
    .where(eq(outcomeGraphTable.id, params.outcomeId))
    .returning();

  return row!;
}

export async function getOutcomeStats(options: {
  orgId?: number;
  domain?: OutcomeDomain;
  since?: Date;
}): Promise<OutcomeStats[]> {
  const conditions = [];
  if (options.orgId != null) conditions.push(eq(outcomeGraphTable.orgId, options.orgId));
  if (options.domain) conditions.push(eq(outcomeGraphTable.domain, options.domain));
  if (options.since) conditions.push(gte(outcomeGraphTable.createdAt, options.since));

  const rows = await db
    .select({
      domain: outcomeGraphTable.domain,
      total: count(),
      avgConfidence: avg(outcomeGraphTable.confidence),
    })
    .from(outcomeGraphTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(outcomeGraphTable.domain);

  return rows.map(r => ({
    domain: r.domain,
    totalRecommendations: Number(r.total),
    acceptanceRate: 0,
    rejectionRate: 0,
    overrideRate: 0,
    outcomeAchievedRate: 0,
    averageConfidence: Number(r.avgConfidence ?? 0.5),
    averageTimeToOutcomeMs: null,
  }));
}

export async function listOutcomes(options: {
  orgId?: number;
  domain?: OutcomeDomain;
  entityType?: string;
  entityId?: string;
  status?: OutcomeDecisionStatus;
  limit?: number;
  offset?: number;
}): Promise<OutcomeGraph[]> {
  const conditions = [];
  if (options.orgId != null) conditions.push(eq(outcomeGraphTable.orgId, options.orgId));
  if (options.domain) conditions.push(eq(outcomeGraphTable.domain, options.domain));
  if (options.entityType) conditions.push(eq(outcomeGraphTable.entityType, options.entityType));
  if (options.entityId) conditions.push(eq(outcomeGraphTable.entityId, options.entityId));
  if (options.status) conditions.push(eq(outcomeGraphTable.status, options.status));

  const q = db
    .select()
    .from(outcomeGraphTable)
    .orderBy(desc(outcomeGraphTable.createdAt))
    .limit(options.limit ?? 100)
    .offset(options.offset ?? 0);

  if (conditions.length > 0) return q.where(and(...conditions));
  return q;
}

export async function getOutcomeById(id: number): Promise<OutcomeGraph | undefined> {
  const [row] = await db.select().from(outcomeGraphTable).where(eq(outcomeGraphTable.id, id));
  return row;
}

export async function triggerLearningJob(params: {
  orgId?: number;
  domain: OutcomeDomain;
  jobType: "ranking_calibration" | "confidence_calibration" | "escalation_threshold" | "workflow_template" | "owner_suggestion" | "artifact_defaults";
  triggeredBy?: string;
}): Promise<OutcomeGraphLearningJob> {
  const [job] = await db.insert(outcomeGraphLearningJobsTable).values({
    orgId: params.orgId ?? null,
    domain: params.domain,
    jobType: params.jobType,
    status: "pending",
    triggeredBy: params.triggeredBy ?? "system",
  }).returning();
  return job!;
}

export async function runLearningCalibration(jobId: number): Promise<OutcomeGraphLearningJob> {
  const [job] = await db
    .select()
    .from(outcomeGraphLearningJobsTable)
    .where(eq(outcomeGraphLearningJobsTable.id, jobId));

  if (!job) {
    throw Object.assign(new Error(`Learning job ${jobId} not found`), { code: "NOT_FOUND" });
  }

  await db.update(outcomeGraphLearningJobsTable)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(outcomeGraphLearningJobsTable.id, jobId));

  try {
    const recentOutcomes = await db
      .select()
      .from(outcomeGraphTable)
      .where(
        and(
          job.orgId != null ? eq(outcomeGraphTable.orgId, job.orgId) : undefined,
          eq(outcomeGraphTable.domain, job.domain as OutcomeDomain),
          gte(outcomeGraphTable.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        ),
      )
      .limit(500);

    const total = recentOutcomes.length;
    const accepted = recentOutcomes.filter(o => o.userDecision === "accepted").length;
    const rejected = recentOutcomes.filter(o => o.userDecision === "rejected").length;
    const overridden = recentOutcomes.filter(o => o.userDecision === "overridden").length;
    const achieved = recentOutcomes.filter(o => o.outcomeResult === "achieved").length;

    const outputSummary = {
      totalSamples: total,
      acceptanceRate: total > 0 ? accepted / total : 0,
      rejectionRate: total > 0 ? rejected / total : 0,
      overrideRate: total > 0 ? overridden / total : 0,
      achievementRate: total > 0 ? achieved / total : 0,
      calibrationSuggestion: accepted / Math.max(total, 1) > 0.7 ? "increase_confidence" : "maintain",
    };

    const [updated] = await db.update(outcomeGraphLearningJobsTable)
      .set({
        status: "completed",
        completedAt: new Date(),
        inputSampleSize: total,
        outputSummary,
        changesApplied: [],
      })
      .where(eq(outcomeGraphLearningJobsTable.id, jobId))
      .returning();

    return updated!;
  } catch (err) {
    const [failed] = await db.update(outcomeGraphLearningJobsTable)
      .set({ status: "failed", errorMessage: String(err), completedAt: new Date() })
      .where(eq(outcomeGraphLearningJobsTable.id, jobId))
      .returning();
    return failed!;
  }
}

export async function listLearningJobs(options: {
  orgId?: number;
  domain?: OutcomeDomain;
  status?: "pending" | "running" | "completed" | "failed";
  limit?: number;
}): Promise<OutcomeGraphLearningJob[]> {
  const conditions = [];
  if (options.orgId != null) conditions.push(eq(outcomeGraphLearningJobsTable.orgId, options.orgId));
  if (options.domain) conditions.push(eq(outcomeGraphLearningJobsTable.domain, options.domain));
  if (options.status) conditions.push(eq(outcomeGraphLearningJobsTable.status, options.status));

  const q = db
    .select()
    .from(outcomeGraphLearningJobsTable)
    .orderBy(desc(outcomeGraphLearningJobsTable.createdAt))
    .limit(options.limit ?? 50);

  if (conditions.length > 0) return q.where(and(...conditions));
  return q;
}
