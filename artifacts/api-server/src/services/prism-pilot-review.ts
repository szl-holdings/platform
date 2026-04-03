import { db } from "@szl-holdings/db";
import { logger } from "../lib/logger";
import { eq, and, desc } from "drizzle-orm";
import {
  pcReviewItemsTable,
  pcSignoffQueueTable,
  pcChangeEventsTable,
  pcAuditEventsTable,
} from "@szl-holdings/db/schema";

export class PilotReviewService {
  async createReview(orgId: number, data: {
    matterId: number;
    reviewType: string;
    title: string;
    draftContent?: string;
    sourceSupport?: any;
    unsupportedStatements?: any;
    contradictionWarnings?: any;
    privilegeWarnings?: any;
  }) {
    const result = await db.insert(pcReviewItemsTable).values({
      orgId,
      ...data,
      reviewState: "pending",
      approvalState: "none",
      safeToSend: false,
    }).returning();

    await db.insert(pcAuditEventsTable).values({
      orgId,
      matterId: data.matterId,
      actorId: 1,
      action: "review_created",
      entityType: "review_item",
      details: { reviewId: result[0].id, reviewType: data.reviewType },
    } as any);

    logger.info({ reviewId: result[0].id }, "Review item created");
    return result[0];
  }

  async getReviews(orgId: number, opts?: { matterId?: number; state?: string }) {
    const conditions = [eq(pcReviewItemsTable.orgId, orgId)];
    if (opts?.matterId) conditions.push(eq(pcReviewItemsTable.matterId, opts.matterId));
    if (opts?.state) conditions.push(eq(pcReviewItemsTable.reviewState, opts.state));
    return db.select().from(pcReviewItemsTable)
      .where(and(...conditions))
      .orderBy(desc(pcReviewItemsTable.createdAt));
  }

  async getReview(orgId: number, reviewId: number) {
    const rows = await db.select().from(pcReviewItemsTable)
      .where(and(eq(pcReviewItemsTable.id, reviewId), eq(pcReviewItemsTable.orgId, orgId)));
    return rows[0] ?? null;
  }

  async updateReviewState(orgId: number, reviewId: number, state: string, userId: number) {
    const result = await db.update(pcReviewItemsTable)
      .set({
        reviewState: state,
        reviewedBy: userId,
        safeToSend: state === "approved",
        updatedAt: new Date(),
      })
      .where(and(eq(pcReviewItemsTable.id, reviewId), eq(pcReviewItemsTable.orgId, orgId)))
      .returning();

    if (state === "approved" || state === "needs_revision") {
      await db.insert(pcAuditEventsTable).values({
        orgId,
        matterId: result[0]?.matterId,
        actorId: userId,
        action: `review_${state}`,
        entityType: "review_item",
        details: { reviewId },
      } as any);
    }

    return result[0];
  }

  async submitForSignoff(orgId: number, reviewId: number, userId: number) {
    const review = await this.getReview(orgId, reviewId);
    if (!review) throw new Error("Review not found");

    const signoff = await db.insert(pcSignoffQueueTable).values({
      orgId,
      matterId: review.matterId,
      requestType: review.reviewType,
      title: review.title,
      reason: `Review of "${review.title}" is ready for sign-off approval`,
      supportSummary: review.sourceSupport ? `${(review.sourceSupport as any[]).length} sources supporting this output` : "No source support attached",
      riskSummary: review.contradictionWarnings ? `${(review.contradictionWarnings as any[]).length} contradiction warning(s) detected` : "No contradictions detected",
      ifApproved: "Output will be marked safe to send. Word export can be generated.",
      ifRejected: "Output will be returned for revision. Author will be notified.",
      requestedBy: userId,
      reviewItemId: reviewId,
    }).returning();

    await db.update(pcReviewItemsTable)
      .set({ approvalState: "pending_signoff", updatedAt: new Date() })
      .where(eq(pcReviewItemsTable.id, reviewId));

    await db.insert(pcAuditEventsTable).values({
      orgId,
      matterId: review.matterId,
      actorId: userId,
      action: "signoff_requested",
      entityType: "signoff_queue",
      details: { signoffId: signoff[0].id, reviewId },
    } as any);

    return signoff[0];
  }
}

export class PilotSignoffService {
  async getPending(orgId: number) {
    return db.select().from(pcSignoffQueueTable)
      .where(and(eq(pcSignoffQueueTable.orgId, orgId), eq(pcSignoffQueueTable.status, "pending")))
      .orderBy(desc(pcSignoffQueueTable.createdAt));
  }

  async getAll(orgId: number, opts?: { status?: string; limit?: number }) {
    const conditions = [eq(pcSignoffQueueTable.orgId, orgId)];
    if (opts?.status) conditions.push(eq(pcSignoffQueueTable.status, opts.status));
    return db.select().from(pcSignoffQueueTable)
      .where(and(...conditions))
      .orderBy(desc(pcSignoffQueueTable.createdAt))
      .limit(opts?.limit ?? 50);
  }

  async resolve(orgId: number, signoffId: number, decision: "approved" | "rejected", userId: number) {
    const result = await db.update(pcSignoffQueueTable)
      .set({
        status: decision,
        resolvedBy: userId,
        resolvedAt: new Date(),
      })
      .where(and(eq(pcSignoffQueueTable.id, signoffId), eq(pcSignoffQueueTable.orgId, orgId)))
      .returning();

    const item = result[0];
    if (!item) throw new Error("Signoff item not found");

    if (item.reviewItemId) {
      await db.update(pcReviewItemsTable)
        .set({
          approvalState: decision,
          approvedBy: decision === "approved" ? userId : undefined,
          safeToSend: decision === "approved",
          updatedAt: new Date(),
        })
        .where(eq(pcReviewItemsTable.id, item.reviewItemId));
    }

    await db.insert(pcChangeEventsTable).values({
      orgId,
      matterId: item.matterId,
      changeType: `signoff_${decision}`,
      sourceType: "signoff_queue",
      title: `Sign-off ${decision}: ${item.title}`,
      summary: `${item.title} was ${decision} by reviewer`,
      severity: decision === "rejected" ? "warning" : "info",
      actorId: userId,
    });

    await db.insert(pcAuditEventsTable).values({
      orgId,
      matterId: item.matterId,
      actorId: userId,
      action: `signoff_${decision}`,
      entityType: "signoff_queue",
      details: { signoffId, decision },
    } as any);

    logger.info({ signoffId, decision }, "Signoff resolved");
    return item;
  }
}

export const pilotReview = new PilotReviewService();
export const pilotSignoff = new PilotSignoffService();
