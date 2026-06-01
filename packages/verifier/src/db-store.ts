import { and, desc, eq, type SQL, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { VerifierAccessScope, VerifierStore, VerifierStoreQuery } from './store.js';
import { type CheckOutcome, type CheckResult, type DecisionAction, type VerifierDecision, type VerifierTarget, VerifierResultNotFoundError } from './types.js';

type Drizzle = NodePgDatabase<Record<string, unknown>>;

/**
 * Structural shape of the columns this store reads/writes on the
 * `verifier_results` table. Callers supply the actual Drizzle table; the
 * store does not import the schema directly.
 */
export interface VerifierResultsTableLike extends PgTable {
  id: PgColumn;
  verifierId: PgColumn;
  targetType: PgColumn;
  targetId: PgColumn;
  traceId: PgColumn;
  planId: PgColumn;
  planStepId: PgColumn;
  skillRunId: PgColumn;
  outcome: PgColumn;
  checks: PgColumn;
  overallScore: PgColumn;
  blockerCount: PgColumn;
  warningCount: PgColumn;
  passCount: PgColumn;
  reasoning: PgColumn;
  confidence: PgColumn;
  metadata: PgColumn;
  createdAt: PgColumn;
}

interface VerifierRow {
  id: string;
  verifierId: string;
  targetType: string;
  targetId: string;
  traceId: string | null;
  planId: string | null;
  planStepId: string | null;
  skillRunId: string | null;
  outcome: string;
  checks: unknown;
  overallScore: number | null;
  blockerCount: number;
  warningCount: number;
  passCount: number;
  reasoning: string | null;
  confidence: number;
  metadata: unknown;
  createdAt: Date;
}

const TARGET_TYPES: VerifierTarget['targetType'][] = [
  'plan',
  'plan_step',
  'skill_run',
  'action',
  'output',
];

function asTargetType(s: string): VerifierTarget['targetType'] {
  return (TARGET_TYPES as string[]).includes(s) ? (s as VerifierTarget['targetType']) : 'output';
}

const OUTCOMES: CheckOutcome[] = ['pass', 'fail', 'warn', 'blocked'];

function asOutcome(s: string): CheckOutcome {
  return (OUTCOMES as string[]).includes(s) ? (s as CheckOutcome) : 'warn';
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function rowToDecision(row: VerifierRow): VerifierDecision {
  const meta = asRecord(row.metadata);
  const planner = asRecord(meta.__verifier);
  const userMeta: Record<string, unknown> = { ...meta };
  delete userMeta.__verifier;

  const action = (planner.action as DecisionAction) ?? 'approve';
  const failCount = typeof planner.failCount === 'number' ? (planner.failCount as number) : 0;
  const evaluatedAt =
    typeof planner.evaluatedAt === 'number'
      ? (planner.evaluatedAt as number)
      : row.createdAt.getTime();
  const orgId =
    typeof planner.orgId === 'number'
      ? (planner.orgId as number)
      : planner.orgId === null
        ? null
        : null;

  const checks = Array.isArray(row.checks)
    ? (row.checks as unknown[]).map((c): CheckResult => {
        const obj = asRecord(c);
        return {
          name: String(obj.name ?? 'unknown'),
          outcome: asOutcome(String(obj.outcome ?? 'warn')),
          score: typeof obj.score === 'number' ? (obj.score as number) : 0,
          message: obj.message === undefined ? undefined : String(obj.message),
          evidence: obj.evidence,
          recommendedAction: obj.recommendedAction as DecisionAction | undefined,
        };
      })
    : [];

  return {
    verifierId: row.verifierId,
    target: {
      targetType: asTargetType(row.targetType),
      targetId: row.targetId,
      traceId: row.traceId ?? undefined,
      planId: row.planId ?? undefined,
      planStepId: row.planStepId ?? undefined,
      skillRunId: row.skillRunId ?? undefined,
    },
    action,
    outcome: asOutcome(row.outcome),
    overallScore: row.overallScore ?? 0,
    reasoning: row.reasoning ?? '',
    checks,
    blockerCount: row.blockerCount,
    warningCount: row.warningCount,
    passCount: row.passCount,
    failCount,
    evaluatedAt,
    orgId,
    metadata: userMeta,
  };
}

function decisionToRow(d: VerifierDecision): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    ...d.metadata,
    __verifier: {
      action: d.action,
      failCount: d.failCount,
      evaluatedAt: d.evaluatedAt,
      orgId: d.orgId ?? null,
    },
  };
  return {
    verifierId: d.verifierId,
    targetType: d.target.targetType,
    targetId: d.target.targetId,
    traceId: d.target.traceId ?? null,
    planId: d.target.planId ?? null,
    planStepId: d.target.planStepId ?? null,
    skillRunId: d.target.skillRunId ?? null,
    outcome: d.outcome,
    checks: d.checks.map((c) => ({
      name: c.name,
      outcome: c.outcome,
      score: c.score,
      message: c.message,
      evidence: c.evidence,
      recommendedAction: c.recommendedAction,
    })),
    overallScore: d.overallScore,
    blockerCount: d.blockerCount,
    warningCount: d.warningCount,
    passCount: d.passCount,
    reasoning: d.reasoning,
    confidence: d.overallScore,
    metadata,
  };
}

/**
 * SQL fragment that filters rows by the orgId persisted under
 * `metadata.__verifier.orgId`. Returns undefined when no scoping is
 * requested (cross-org callers).
 */
function orgScopeSql(
  table: VerifierResultsTableLike,
  orgIds: number[] | undefined,
): SQL | undefined {
  if (orgIds === undefined) return undefined;
  if (orgIds.length === 0) {
    // Empty allow-list — match nothing.
    return sql`false`;
  }
  return sql`((${table.metadata}->'__verifier'->>'orgId')::bigint IN (${sql.join(
    orgIds.map((id) => sql`${id}`),
    sql`, `,
  )}))`;
}

export class DbVerifierStore implements VerifierStore {
  private readonly db: Drizzle;
  private readonly table: VerifierResultsTableLike;

  constructor(opts: { db: Drizzle; verifierResultsTable: VerifierResultsTableLike }) {
    this.db = opts.db;
    this.table = opts.verifierResultsTable;
  }

  async save(decision: VerifierDecision): Promise<VerifierDecision> {
    const row = decisionToRow(decision);
    await this.db.insert(this.table).values(row);
    return decision;
  }

  async get(
    verifierId: string,
    scope?: VerifierAccessScope,
  ): Promise<VerifierDecision | undefined> {
    const orgFilter = orgScopeSql(this.table, scope?.orgIds);
    const where = orgFilter
      ? and(eq(this.table.verifierId, verifierId), orgFilter)
      : eq(this.table.verifierId, verifierId);
    const rows = (await this.db
      .select()
      .from(this.table)
      .where(where)
      .limit(1)) as unknown as VerifierRow[];
    const row = rows[0];
    if (!row) return undefined;
    return rowToDecision(row);
  }

  async getOrThrow(verifierId: string, scope?: VerifierAccessScope): Promise<VerifierDecision> {
    const r = await this.get(verifierId, scope);
    if (!r) throw new VerifierResultNotFoundError(verifierId);
    return r;
  }

  async latestForTarget(
    targetType: VerifierTarget['targetType'],
    targetId: string,
    scope?: VerifierAccessScope,
  ): Promise<VerifierDecision | undefined> {
    const orgFilter = orgScopeSql(this.table, scope?.orgIds);
    const baseWhere = and(eq(this.table.targetType, targetType), eq(this.table.targetId, targetId));
    const where = orgFilter ? and(baseWhere, orgFilter) : baseWhere;
    const rows = (await this.db
      .select()
      .from(this.table)
      .where(where)
      .orderBy(desc(this.table.createdAt))
      .limit(1)) as unknown as VerifierRow[];
    const row = rows[0];
    if (!row) return undefined;
    return rowToDecision(row);
  }

  async list(
    query: VerifierStoreQuery = {},
  ): Promise<{ items: VerifierDecision[]; total: number }> {
    const filters: SQL[] = [];
    if (query.targetType) filters.push(eq(this.table.targetType, query.targetType));
    if (query.targetId) filters.push(eq(this.table.targetId, query.targetId));
    if (query.traceId) filters.push(eq(this.table.traceId, query.traceId));
    if (query.planId) filters.push(eq(this.table.planId, query.planId));
    if (query.outcome) filters.push(eq(this.table.outcome, query.outcome));
    const orgFilter = orgScopeSql(this.table, query.orgIds);
    if (orgFilter) filters.push(orgFilter);
    const where = filters.length > 0 ? and(...filters) : undefined;

    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const rows = (await this.db
      .select()
      .from(this.table)
      .where(where)
      .orderBy(desc(this.table.createdAt))
      .limit(limit)
      .offset(offset)) as unknown as VerifierRow[];

    const totalRows = (await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(this.table)
      .where(where)) as Array<{ count: number }>;
    const total = Number(totalRows[0]?.count ?? 0);

    return { items: rows.map(rowToDecision), total };
  }

  async delete(verifierId: string, scope?: VerifierAccessScope): Promise<boolean> {
    const orgFilter = orgScopeSql(this.table, scope?.orgIds);
    const where = orgFilter
      ? and(eq(this.table.verifierId, verifierId), orgFilter)
      : eq(this.table.verifierId, verifierId);
    const result = (await this.db.delete(this.table).where(where)) as unknown as {
      rowCount?: number | null;
    };
    return (result?.rowCount ?? 0) > 0;
  }
}
