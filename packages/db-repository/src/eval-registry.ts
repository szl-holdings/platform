/**
 * Eval Registry Repository
 *
 * Typed access to the Open Evaluation Layer tables:
 *   eval_benchmarks, eval_results, eval_verification_tokens,
 *   eval_community_submissions
 */

import {
  db,
  evalBenchmarksTable,
  evalCommunitySubmissionsTable,
  evalResultsTable,
  evalVerificationTokensTable,
  type EvalBenchmarkRow,
  type EvalCommunitySubmissionRow,
  type EvalResultRow,
  type EvalVerificationTokenRow,
  type InsertEvalBenchmark,
  type InsertEvalCommunitySubmission,
  type InsertEvalResult,
  type InsertEvalVerificationToken,
} from '@szl-holdings/db';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

export type {
  EvalBenchmarkRow,
  EvalCommunitySubmissionRow,
  EvalResultRow,
  EvalVerificationTokenRow,
};

// ─── Leaderboard Query Result ─────────────────────────────────────────────────

export interface LeaderboardRow {
  rank: number;
  resultId: string;
  entityId: string;
  entityLabel: string;
  entityType: string;
  domain: string;
  taskId: string;
  metric: string;
  value: string;
  numericValue: string | null;
  unit: string | null;
  badgeState: string;
  evaluationFramework: string | null;
  evalDate: string | null;
  sourceUrl: string | null;
}

export class EvalRegistryRepository {
  // ─── Benchmarks ─────────────────────────────────────────────────────────

  async listBenchmarks(opts: {
    domain?: string;
    isCrossCutting?: boolean;
    orgId?: number | null;
    limit?: number;
    includeArchived?: boolean;
  } = {}): Promise<EvalBenchmarkRow[]> {
    const { domain, isCrossCutting, orgId, limit = 100, includeArchived = false } = opts;
    const conditions = [];

    if (!includeArchived) conditions.push(isNull(evalBenchmarksTable.archivedAt));
    if (domain) conditions.push(eq(evalBenchmarksTable.domain, domain));
    if (isCrossCutting !== undefined) {
      conditions.push(eq(evalBenchmarksTable.isCrossCutting, isCrossCutting));
    }
    if (orgId !== undefined) {
      // Show platform seeds (orgId IS NULL) and tenant-owned
      conditions.push(
        sql`(${evalBenchmarksTable.orgId} IS NULL OR ${evalBenchmarksTable.orgId} = ${orgId})`,
      );
    }

    return db
      .select()
      .from(evalBenchmarksTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(evalBenchmarksTable.name))
      .limit(limit);
  }

  async findBenchmarkByBenchmarkId(
    benchmarkId: string,
    orgId?: number | null,
  ): Promise<EvalBenchmarkRow | null> {
    const conditions = [eq(evalBenchmarksTable.benchmarkId, benchmarkId)];
    if (orgId !== undefined) {
      conditions.push(
        sql`(${evalBenchmarksTable.orgId} IS NULL OR ${evalBenchmarksTable.orgId} = ${orgId})`,
      );
    }
    const rows = await db
      .select()
      .from(evalBenchmarksTable)
      .where(and(...conditions))
      .limit(1);
    return rows[0] ?? null;
  }

  async upsertBenchmark(data: InsertEvalBenchmark): Promise<EvalBenchmarkRow> {
    // For null orgId (platform seeds), PostgreSQL's unique index doesn't enforce
    // uniqueness on NULLs. We handle this with a select-first strategy.
    if (data.orgId === null || data.orgId === undefined) {
      const existing = await db
        .select()
        .from(evalBenchmarksTable)
        .where(
          and(
            eq(evalBenchmarksTable.benchmarkId, data.benchmarkId),
            isNull(evalBenchmarksTable.orgId),
          ),
        )
        .limit(1);

      if (existing[0]) {
        const updated = await db
          .update(evalBenchmarksTable)
          .set({
            name: data.name,
            description: data.description,
            domain: data.domain,
            evaluationFramework: data.evaluationFramework,
            tasks: data.tasks,
            tags: data.tags,
            paperUrl: data.paperUrl,
            isCrossCutting: data.isCrossCutting,
            updatedAt: new Date(),
          })
          .where(eq(evalBenchmarksTable.id, existing[0].id))
          .returning();
        return updated[0];
      }

      const inserted = await db.insert(evalBenchmarksTable).values(data).returning();
      return inserted[0];
    }

    // For tenant-owned benchmarks, use standard conflict resolution
    const rows = await db
      .insert(evalBenchmarksTable)
      .values(data)
      .onConflictDoUpdate({
        target: [evalBenchmarksTable.benchmarkId, evalBenchmarksTable.orgId],
        set: {
          name: data.name,
          description: data.description,
          domain: data.domain,
          evaluationFramework: data.evaluationFramework,
          tasks: data.tasks,
          tags: data.tags,
          paperUrl: data.paperUrl,
          isCrossCutting: data.isCrossCutting,
          updatedAt: new Date(),
        },
      })
      .returning();
    return rows[0];
  }

  async archiveBenchmark(benchmarkId: string, orgId?: number | null): Promise<void> {
    const conditions = [eq(evalBenchmarksTable.benchmarkId, benchmarkId)];
    if (orgId !== undefined) {
      conditions.push(
        sql`(${evalBenchmarksTable.orgId} IS NULL OR ${evalBenchmarksTable.orgId} = ${orgId})`,
      );
    }
    await db
      .update(evalBenchmarksTable)
      .set({ archivedAt: new Date() })
      .where(and(...conditions));
  }

  // ─── Results ─────────────────────────────────────────────────────────────

  async listResultsForEntity(opts: {
    entityId: string;
    orgId?: number | null;
    badgeState?: string;
    limit?: number;
  }): Promise<EvalResultRow[]> {
    const { entityId, orgId, badgeState, limit = 200 } = opts;
    const conditions = [eq(evalResultsTable.entityId, entityId)];
    if (orgId !== undefined) {
      conditions.push(
        sql`(${evalResultsTable.orgId} IS NULL OR ${evalResultsTable.orgId} = ${orgId})`,
      );
    }
    if (badgeState) conditions.push(eq(evalResultsTable.badgeState, badgeState));
    return db
      .select()
      .from(evalResultsTable)
      .where(and(...conditions))
      .orderBy(desc(evalResultsTable.createdAt))
      .limit(limit);
  }

  async listResultsForBenchmark(opts: {
    benchmarkId: string;
    taskId?: string;
    orgId?: number | null;
    badgeState?: string;
    limit?: number;
  }): Promise<EvalResultRow[]> {
    const { benchmarkId, taskId, orgId, badgeState, limit = 200 } = opts;
    const conditions = [eq(evalResultsTable.benchmarkId, benchmarkId)];
    if (taskId) conditions.push(eq(evalResultsTable.taskId, taskId));
    if (orgId !== undefined) {
      conditions.push(
        sql`(${evalResultsTable.orgId} IS NULL OR ${evalResultsTable.orgId} = ${orgId})`,
      );
    }
    if (badgeState) conditions.push(eq(evalResultsTable.badgeState, badgeState));
    return db
      .select()
      .from(evalResultsTable)
      .where(and(...conditions))
      .orderBy(desc(evalResultsTable.createdAt))
      .limit(limit);
  }

  async findResultById(resultId: string): Promise<EvalResultRow | null> {
    const rows = await db
      .select()
      .from(evalResultsTable)
      .where(eq(evalResultsTable.id, resultId))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * Fetch a result by UUID with tenant isolation.
   * Returns the result only if it belongs to the caller's org or is a
   * platform result (orgId = null). Callers with admin roles should use
   * findResultById directly (no org restriction).
   */
  async findResultByIdForOrg(
    resultId: string,
    orgId: number | null,
  ): Promise<EvalResultRow | null> {
    const orgCondition =
      orgId !== null
        ? sql`(${evalResultsTable.orgId} IS NULL OR ${evalResultsTable.orgId} = ${orgId})`
        : isNull(evalResultsTable.orgId);
    const rows = await db
      .select()
      .from(evalResultsTable)
      .where(and(eq(evalResultsTable.id, resultId), orgCondition))
      .limit(1);
    return rows[0] ?? null;
  }

  async insertResult(data: InsertEvalResult): Promise<EvalResultRow> {
    const rows = await db.insert(evalResultsTable).values(data).returning();
    return rows[0];
  }

  async insertResults(data: InsertEvalResult[]): Promise<EvalResultRow[]> {
    if (data.length === 0) return [];
    return db.insert(evalResultsTable).values(data).returning();
  }

  async updateResultBadgeState(
    resultId: string,
    badgeState: string,
    verificationTokenId?: string,
  ): Promise<void> {
    await db
      .update(evalResultsTable)
      .set({
        badgeState,
        verificationTokenId: verificationTokenId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(evalResultsTable.id, resultId));
  }

  // ─── Leaderboard ─────────────────────────────────────────────────────────

  /**
   * Returns ranked leaderboard entries for a benchmark + task.
   * Ranking uses numeric_value descending by default (higherIsBetter=true).
   * For lower-is-better tasks (latency, cost), pass higherIsBetter=false.
   */
  async leaderboard(opts: {
    benchmarkId: string;
    taskId: string;
    orgId?: number | null;
    higherIsBetter?: boolean;
    limit?: number;
    badgeStates?: string[];
  }): Promise<LeaderboardRow[]> {
    const {
      benchmarkId,
      taskId,
      orgId,
      higherIsBetter = true,
      limit = 50,
      badgeStates = ['verified', 'community', 'leaderboard', 'source'],
    } = opts;

    const conditions = [
      eq(evalResultsTable.benchmarkId, benchmarkId),
      eq(evalResultsTable.taskId, taskId),
      sql`${evalResultsTable.numericValue} IS NOT NULL`,
      inArray(evalResultsTable.badgeState, badgeStates),
    ];

    if (orgId !== undefined) {
      conditions.push(
        sql`(${evalResultsTable.orgId} IS NULL OR ${evalResultsTable.orgId} = ${orgId})`,
      );
    }

    const orderCol = higherIsBetter
      ? desc(evalResultsTable.numericValue)
      : asc(evalResultsTable.numericValue);

    const rows = await db
      .select({
        resultId: evalResultsTable.id,
        entityId: evalResultsTable.entityId,
        entityLabel: evalResultsTable.entityLabel,
        entityType: evalResultsTable.entityType,
        domain: evalResultsTable.domain,
        taskId: evalResultsTable.taskId,
        metric: evalResultsTable.metric,
        value: evalResultsTable.value,
        numericValue: evalResultsTable.numericValue,
        unit: evalResultsTable.unit,
        badgeState: evalResultsTable.badgeState,
        evaluationFramework: evalResultsTable.evaluationFramework,
        evalDate: evalResultsTable.evalDate,
        sourceUrl: evalResultsTable.sourceUrl,
      })
      .from(evalResultsTable)
      .where(and(...conditions))
      .orderBy(orderCol)
      .limit(limit);

    return rows.map((row, idx) => ({ rank: idx + 1, ...row }));
  }

  // ─── Verification Tokens ─────────────────────────────────────────────────

  async insertVerificationToken(
    data: InsertEvalVerificationToken,
  ): Promise<EvalVerificationTokenRow> {
    const rows = await db.insert(evalVerificationTokensTable).values(data).returning();
    return rows[0];
  }

  async findVerificationToken(resultId: string): Promise<EvalVerificationTokenRow | null> {
    const rows = await db
      .select()
      .from(evalVerificationTokensTable)
      .where(eq(evalVerificationTokensTable.resultId, resultId))
      .orderBy(desc(evalVerificationTokensTable.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateVerificationToken(
    id: string,
    updates: Partial<InsertEvalVerificationToken>,
  ): Promise<void> {
    await db
      .update(evalVerificationTokensTable)
      .set(updates)
      .where(eq(evalVerificationTokensTable.id, id));
  }

  // ─── Community Submissions ────────────────────────────────────────────────

  async insertSubmission(data: InsertEvalCommunitySubmission): Promise<EvalCommunitySubmissionRow> {
    const rows = await db.insert(evalCommunitySubmissionsTable).values(data).returning();
    return rows[0];
  }

  async listSubmissions(opts: {
    status?: string;
    orgId?: number | null;
    submittedBy?: string;
    limit?: number;
  } = {}): Promise<EvalCommunitySubmissionRow[]> {
    const { status, orgId, submittedBy, limit = 50 } = opts;
    const conditions = [];
    if (status) conditions.push(eq(evalCommunitySubmissionsTable.status, status));
    if (orgId !== undefined) {
      conditions.push(
        sql`(${evalCommunitySubmissionsTable.orgId} IS NULL OR ${evalCommunitySubmissionsTable.orgId} = ${orgId})`,
      );
    }
    if (submittedBy) {
      conditions.push(eq(evalCommunitySubmissionsTable.submittedBy, submittedBy));
    }
    return db
      .select()
      .from(evalCommunitySubmissionsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(evalCommunitySubmissionsTable.createdAt))
      .limit(limit);
  }

  async findSubmissionById(id: string): Promise<EvalCommunitySubmissionRow | null> {
    const rows = await db
      .select()
      .from(evalCommunitySubmissionsTable)
      .where(eq(evalCommunitySubmissionsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * Fetch a submission by UUID with tenant isolation.
   * Returns the submission only if it belongs to the caller's org or is a
   * platform submission (orgId = null). Admin routes should use findSubmissionById.
   */
  async findSubmissionByIdForOrg(
    id: string,
    orgId: number | null,
  ): Promise<EvalCommunitySubmissionRow | null> {
    const orgCondition =
      orgId !== null
        ? sql`(${evalCommunitySubmissionsTable.orgId} IS NULL OR ${evalCommunitySubmissionsTable.orgId} = ${orgId})`
        : isNull(evalCommunitySubmissionsTable.orgId);
    const rows = await db
      .select()
      .from(evalCommunitySubmissionsTable)
      .where(and(eq(evalCommunitySubmissionsTable.id, id), orgCondition))
      .limit(1);
    return rows[0] ?? null;
  }

  async updateSubmission(
    id: string,
    updates: Partial<InsertEvalCommunitySubmission>,
  ): Promise<void> {
    await db
      .update(evalCommunitySubmissionsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(evalCommunitySubmissionsTable.id, id));
  }
}

export const evalRegistryRepository = new EvalRegistryRepository();
