/**
 * AI Recommendation Review Queue
 *
 * Surfaces low-confidence and high-risk recommendations for human review.
 * Reviewers can approve, reject, flag, or escalate each item.
 * Decisions feed back into quality metrics via the Outcome Graph.
 */

import type { AITrace } from './trace-capture.js';

export type ReviewVerdict = 'approved' | 'rejected' | 'flagged' | 'escalated' | 'deferred';

export type ReviewPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ReviewQueueItem {
  reviewId: string;
  traceId: string;
  orgId?: number | null;
  domain: string;
  recommendationType: string;
  model: string;
  confidence: number;
  riskLevel?: string;
  reviewReason: string;
  priority: ReviewPriority;
  inputSummary?: string;
  outputSummary?: string;
  costEstimateUsd: number;
  latencyMs: number;
  evalScore?: number;
  evalPassed?: boolean;
  verdict?: ReviewVerdict;
  reviewedBy?: number;
  reviewNotes?: string;
  escalatedTo?: string;
  status: 'pending' | 'in_review' | 'resolved' | 'escalated';
  enqueuedAt: string;
  reviewedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface EnqueueReviewInput {
  trace: AITrace;
  priority?: ReviewPriority;
  overrideReason?: string;
}

export interface ReviewDecisionInput {
  reviewId: string;
  verdict: ReviewVerdict;
  reviewedBy: number;
  reviewNotes?: string;
  escalatedTo?: string;
}

const queue: ReviewQueueItem[] = [];
const MAX_QUEUE_SIZE = 10000;

type ReviewQueueWriteSink = {
  onEnqueue?: (item: ReviewQueueItem) => Promise<void>;
  onDecision?: (item: ReviewQueueItem) => Promise<void>;
  onClaim?: (reviewId: string) => Promise<void>;
};

let reviewQueueSink: ReviewQueueWriteSink | null = null;

export function registerReviewQueueSink(sink: ReviewQueueWriteSink): void {
  reviewQueueSink = sink;
}

function computePriority(trace: AITrace): ReviewPriority {
  if (trace.riskLevel === 'critical') return 'critical';
  if (trace.riskLevel === 'high') return 'high';
  if (trace.confidence < 0.4) return 'high';
  if (trace.confidence < 0.55) return 'medium';
  if (trace.costEstimateUsd > 0.5) return 'medium';
  return 'low';
}

export function enqueueForReview(input: EnqueueReviewInput): ReviewQueueItem {
  const { trace } = input;
  const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const item: ReviewQueueItem = {
    reviewId,
    traceId: trace.traceId,
    domain: trace.domain,
    recommendationType: trace.recommendationType,
    model: trace.model,
    confidence: trace.confidence,
    reviewReason: input.overrideReason ?? trace.reviewReason ?? 'Flagged for review',
    priority: input.priority ?? computePriority(trace),
    costEstimateUsd: trace.costEstimateUsd,
    latencyMs: trace.latencyMs,
    status: 'pending',
    enqueuedAt: new Date().toISOString(),
    ...(trace.orgId !== undefined ? { orgId: trace.orgId } : {}),
    ...(trace.riskLevel !== undefined ? { riskLevel: trace.riskLevel } : {}),
    ...(trace.inputSummary !== undefined ? { inputSummary: trace.inputSummary } : {}),
    ...(trace.outputSummary !== undefined ? { outputSummary: trace.outputSummary } : {}),
    ...(trace.evalScore !== undefined ? { evalScore: trace.evalScore } : {}),
    ...(trace.evalPassed !== undefined ? { evalPassed: trace.evalPassed } : {}),
    ...(trace.metadata !== undefined ? { metadata: trace.metadata } : {}),
  };

  queue.unshift(item);
  if (queue.length > MAX_QUEUE_SIZE) queue.length = MAX_QUEUE_SIZE;

  if (reviewQueueSink?.onEnqueue) {
    reviewQueueSink.onEnqueue(item).catch((_err) => {
    });
  }

  return item;
}

export function getReviewItem(reviewId: string): ReviewQueueItem | undefined {
  return queue.find((i) => i.reviewId === reviewId);
}

export function listReviewQueue(
  options: {
    orgId?: number;
    domain?: string;
    status?: ReviewQueueItem['status'];
    priority?: ReviewPriority;
    verdict?: ReviewVerdict;
    since?: Date;
    until?: Date;
    limit?: number;
    offset?: number;
  } = {},
): ReviewQueueItem[] {
  let results = queue;

  if (options.orgId != null) results = results.filter((i) => i.orgId === options.orgId);
  if (options.domain) results = results.filter((i) => i.domain === options.domain);
  if (options.status) results = results.filter((i) => i.status === options.status);
  if (options.priority) results = results.filter((i) => i.priority === options.priority);
  if (options.verdict) results = results.filter((i) => i.verdict === options.verdict);
  if (options.since) results = results.filter((i) => new Date(i.enqueuedAt) >= options.since!);
  if (options.until) results = results.filter((i) => new Date(i.enqueuedAt) <= options.until!);

  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  return results.slice(offset, offset + limit);
}

export function recordReviewDecision(input: ReviewDecisionInput): ReviewQueueItem | null {
  const item = queue.find((i) => i.reviewId === input.reviewId);
  if (!item) return null;

  item.verdict = input.verdict;
  item.reviewedBy = input.reviewedBy;
  if (input.reviewNotes !== undefined) item.reviewNotes = input.reviewNotes;
  if (input.escalatedTo !== undefined) item.escalatedTo = input.escalatedTo;
  item.reviewedAt = new Date().toISOString();
  item.status = input.verdict === 'escalated' ? 'escalated' : 'resolved';

  if (reviewQueueSink?.onDecision) {
    reviewQueueSink.onDecision(item).catch((_err) => {
    });
  }

  return item;
}

export function markInReview(reviewId: string): boolean {
  const item = queue.find((i) => i.reviewId === reviewId);
  if (!item || item.status !== 'pending') return false;
  item.status = 'in_review';

  if (reviewQueueSink?.onClaim) {
    reviewQueueSink.onClaim(reviewId).catch((_err) => {
    });
  }

  return true;
}

export function hydrateReviewQueue(items: ReviewQueueItem[]): void {
  for (const item of items) {
    if (!queue.find((q) => q.reviewId === item.reviewId)) {
      queue.push(item);
    }
  }
  queue.sort((a, b) => new Date(b.enqueuedAt).getTime() - new Date(a.enqueuedAt).getTime());
  if (queue.length > MAX_QUEUE_SIZE) queue.length = MAX_QUEUE_SIZE;
}

export interface ReviewQueueStats {
  total: number;
  pending: number;
  inReview: number;
  resolved: number;
  escalated: number;
  byPriority: Record<ReviewPriority, number>;
  byDomain: Record<string, number>;
  avgConfidence: number;
  verdictBreakdown: Partial<Record<ReviewVerdict, number>>;
}

export function getReviewQueueStats(orgId?: number): ReviewQueueStats {
  const items = orgId != null ? queue.filter((i) => i.orgId === orgId) : queue;

  const byPriority: Record<ReviewPriority, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const byDomain: Record<string, number> = {};
  const verdictBreakdown: Partial<Record<ReviewVerdict, number>> = {};

  for (const item of items) {
    byPriority[item.priority] = (byPriority[item.priority] ?? 0) + 1;
    byDomain[item.domain] = (byDomain[item.domain] ?? 0) + 1;
    if (item.verdict) {
      verdictBreakdown[item.verdict] = (verdictBreakdown[item.verdict] ?? 0) + 1;
    }
  }

  return {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    inReview: items.filter((i) => i.status === 'in_review').length,
    resolved: items.filter((i) => i.status === 'resolved').length,
    escalated: items.filter((i) => i.status === 'escalated').length,
    byPriority,
    byDomain,
    avgConfidence:
      items.length > 0 ? items.reduce((s, i) => s + i.confidence, 0) / items.length : 0,
    verdictBreakdown,
  };
}

export function autoEnqueueTrace(trace: AITrace): ReviewQueueItem | null {
  if (!trace.requiresReview) return null;
  return enqueueForReview({ trace });
}
