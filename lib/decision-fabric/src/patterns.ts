/**
 * Historical pattern retrieval and playbook suggestion.
 *
 * Looks at the recent decision history for clusters of similar
 * (domain, entityType, recommendationId-prefix) shapes. When a cluster is
 * dense and successful, propose it as a playbook the operator can promote
 * into a workflow.
 */

import {
  type DecisionRecord,
  db,
  decisionRecordsTable,
  type PlaybookSuggestion,
  playbookSuggestionsTable,
} from '@szl-holdings/db';
import { and, desc, eq, gte, sql } from 'drizzle-orm';

export interface PatternRetrievalOptions {
  orgId?: number | null;
  domain?: DecisionRecord['domain'];
  entityType?: string;
  windowDays?: number;
  limit?: number;
}

export interface SimilarDecision {
  decision: DecisionRecord;
  similarityScore: number;
}

/** Naive similarity: same domain, same entity type, overlapping context keys. */
export async function findSimilarDecisions(
  context: Record<string, unknown>,
  options: PatternRetrievalOptions = {},
): Promise<SimilarDecision[]> {
  const since = new Date(Date.now() - (options.windowDays ?? 90) * 86400_000);
  const conditions: any[] = [gte(decisionRecordsTable.decidedAt, since)];
  if (options.orgId != null) conditions.push(eq(decisionRecordsTable.orgId, options.orgId));
  if (options.domain) conditions.push(eq(decisionRecordsTable.domain, options.domain));
  if (options.entityType) conditions.push(eq(decisionRecordsTable.entityType, options.entityType));

  const rows = await db
    .select()
    .from(decisionRecordsTable)
    .where(and(...conditions))
    .orderBy(desc(decisionRecordsTable.decidedAt))
    .limit(options.limit ?? 200);

  const ctxKeys = new Set(Object.keys(context));
  const ctxKeyCount = Math.max(ctxKeys.size, 1);
  return rows
    .map((decision) => {
      const candidate = (decision.context as Record<string, unknown> | null) ?? {};
      const overlap = Object.keys(candidate).filter((k) => ctxKeys.has(k)).length;
      return { decision, similarityScore: overlap / ctxKeyCount };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);
}

export interface PlaybookGenerationOptions {
  orgId?: number | null;
  domain?: DecisionRecord['domain'];
  windowDays?: number;
  minSampleSize?: number;
  minSuccessRate?: number;
}

/**
 * Scan recent decisions, cluster by (domain, entityType), and emit a
 * playbook suggestion for any cluster that meets sample-size and success
 * thresholds. Returns the inserted suggestions.
 */
export async function generatePlaybookSuggestions(
  options: PlaybookGenerationOptions = {},
): Promise<PlaybookSuggestion[]> {
  const since = new Date(Date.now() - (options.windowDays ?? 60) * 86400_000);
  const minSample = options.minSampleSize ?? 5;
  const minSuccess = options.minSuccessRate ?? 0.6;

  const conditions: any[] = [gte(decisionRecordsTable.decidedAt, since)];
  if (options.orgId != null) conditions.push(eq(decisionRecordsTable.orgId, options.orgId));
  if (options.domain) conditions.push(eq(decisionRecordsTable.domain, options.domain));

  const rows = await db
    .select()
    .from(decisionRecordsTable)
    .where(and(...conditions))
    .limit(2000);

  // Cluster
  const clusters = new Map<string, DecisionRecord[]>();
  for (const r of rows) {
    const key = `${r.domain}::${r.entityType}`;
    const arr = clusters.get(key) ?? [];
    arr.push(r);
    clusters.set(key, arr);
  }

  const inserted: PlaybookSuggestion[] = [];
  for (const [key, members] of clusters) {
    if (members.length < minSample) continue;
    const successes = members.filter(
      (m) =>
        m.status === 'executed' &&
        (m.predictionError == null || Math.abs(m.predictionError) <= 0.25),
    ).length;
    const successRate = successes / members.length;
    if (successRate < minSuccess) continue;

    const [domain, entityType] = key.split('::') as [DecisionRecord['domain'], string];
    const triggerSignature = {
      domain,
      entityType,
      contextKeys: Array.from(
        new Set(members.flatMap((m) => Object.keys((m.context as Record<string, unknown>) ?? {}))),
      ),
    };
    const recommendedActions = Array.from(
      new Set(members.map((m) => m.title).filter((t): t is string => Boolean(t))),
    ).slice(0, 5);

    const [row] = await db
      .insert(playbookSuggestionsTable)
      .values({
        orgId: options.orgId ?? null,
        domain,
        title: `Playbook: ${entityType} (${domain})`,
        description: `Auto-generated from ${members.length} successful decisions in the last ${options.windowDays ?? 60}d.`,
        triggerSignature,
        recommendedActions,
        supportingDecisionIds: members.map((m) => m.id),
        sampleSize: members.length,
        successRate,
        confidence: Math.min(1, successRate * Math.min(members.length / 20, 1)),
        status: 'proposed',
      })
      .returning();
    inserted.push(row);
  }

  return inserted;
}

export interface ListPlaybookOptions {
  orgId?: number | null;
  status?: PlaybookSuggestion['status'];
  limit?: number;
}

export async function listPlaybookSuggestions(
  options: ListPlaybookOptions = {},
): Promise<PlaybookSuggestion[]> {
  const conditions: any[] = [];
  if (options.orgId != null) conditions.push(eq(playbookSuggestionsTable.orgId, options.orgId));
  if (options.status) conditions.push(eq(playbookSuggestionsTable.status, options.status));

  const q = db
    .select()
    .from(playbookSuggestionsTable)
    .orderBy(desc(playbookSuggestionsTable.createdAt))
    .limit(options.limit ?? 50);
  return conditions.length > 0 ? await q.where(and(...conditions)) : await q;
}

export async function reviewPlaybookSuggestion(
  id: number,
  status: PlaybookSuggestion['status'],
  reviewedByUserId: number,
  orgId: number | null,
  promotedWorkflowId?: string,
): Promise<PlaybookSuggestion | null> {
  const conditions: any[] = [eq(playbookSuggestionsTable.id, id)];
  if (orgId != null) conditions.push(eq(playbookSuggestionsTable.orgId, orgId));
  const [row] = await db
    .update(playbookSuggestionsTable)
    .set({
      status,
      reviewedByUserId,
      reviewedAt: new Date(),
      promotedWorkflowId: promotedWorkflowId ?? null,
    })
    .where(and(...conditions))
    .returning();
  return row ?? null;
}

/** Aggregate cluster statistics, regardless of whether a suggestion was minted. */
export async function getDomainClusterStats(options: PatternRetrievalOptions = {}) {
  const since = new Date(Date.now() - (options.windowDays ?? 30) * 86400_000);
  const conditions: any[] = [gte(decisionRecordsTable.decidedAt, since)];
  if (options.orgId != null) conditions.push(eq(decisionRecordsTable.orgId, options.orgId));

  return db
    .select({
      domain: decisionRecordsTable.domain,
      entityType: decisionRecordsTable.entityType,
      total: sql<number>`count(*)::int`,
      executed: sql<number>`count(*) filter (where ${decisionRecordsTable.status} = 'executed')::int`,
      rolledBack: sql<number>`count(*) filter (where ${decisionRecordsTable.status} = 'rolled_back')::int`,
      avgPredictionError: sql<number | null>`avg(${decisionRecordsTable.predictionError})::float`,
    })
    .from(decisionRecordsTable)
    .where(and(...conditions))
    .groupBy(decisionRecordsTable.domain, decisionRecordsTable.entityType)
    .orderBy(desc(sql`count(*)`))
    .limit(options.limit ?? 50);
}
