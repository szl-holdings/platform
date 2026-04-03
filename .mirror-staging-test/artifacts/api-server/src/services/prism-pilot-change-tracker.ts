import { db } from "@workspace/db";
import { logger } from "../lib/logger";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import {
  pcChangeEventsTable,
  pcQuietRisksTable,
  pcNextActionsTable,
  pcMorningBriefsTable,
  pcMattersTable,
  pcDeadlinesTable,
  pcCommunicationsTable,
  pcReviewItemsTable,
  pcSignoffQueueTable,
} from "@workspace/db/schema";

export class PilotChangeTracker {
  async getChanges(orgId: number, matterId?: number, opts?: { since?: Date; limit?: number }) {
    const conditions = [eq(pcChangeEventsTable.orgId, orgId)];
    if (matterId) conditions.push(eq(pcChangeEventsTable.matterId, matterId));
    if (opts?.since) conditions.push(gte(pcChangeEventsTable.createdAt, opts.since));
    return db.select().from(pcChangeEventsTable)
      .where(and(...conditions))
      .orderBy(desc(pcChangeEventsTable.createdAt))
      .limit(opts?.limit ?? 100);
  }

  async markRead(orgId: number, ids: number[]) {
    for (const id of ids) {
      await db.update(pcChangeEventsTable)
        .set({ isRead: true })
        .where(and(eq(pcChangeEventsTable.id, id), eq(pcChangeEventsTable.orgId, orgId)));
    }
  }

  async recordChange(orgId: number, matterId: number, data: {
    changeType: string;
    sourceType: string;
    sourceRef?: string;
    title: string;
    summary: string;
    details?: any;
    severity?: string;
    actorId?: number;
  }) {
    return db.insert(pcChangeEventsTable).values({
      orgId,
      matterId,
      ...data,
      severity: data.severity ?? "info",
    }).returning();
  }

  async generateMorningBrief(orgId: number, userId: number) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const tenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    const recentChanges = await db.select().from(pcChangeEventsTable)
      .where(and(eq(pcChangeEventsTable.orgId, orgId), gte(pcChangeEventsTable.createdAt, yesterday)))
      .orderBy(desc(pcChangeEventsTable.createdAt));

    const matterIds = [...new Set(recentChanges.map(c => c.matterId))];
    const mattersChanged = matterIds.map(mid => {
      const changes = recentChanges.filter(c => c.matterId === mid);
      return { matterId: mid, changeCount: changes.length, types: [...new Set(changes.map(c => c.changeType))] };
    });

    const upcomingDeadlines = await db.select().from(pcDeadlinesTable)
      .where(and(
        eq(pcDeadlinesTable.orgId as any, orgId),
        sql`${pcDeadlinesTable.dueDate} <= ${tenDays}`,
        sql`${pcDeadlinesTable.dueDate} >= NOW()`,
        eq(pcDeadlinesTable.status, "active" as any)
      ))
      .orderBy(pcDeadlinesTable.dueDate)
      .limit(20);

    const pendingReviews = await db.select().from(pcReviewItemsTable)
      .where(and(eq(pcReviewItemsTable.orgId, orgId), eq(pcReviewItemsTable.reviewState, "pending")));

    const pendingSignoffs = await db.select().from(pcSignoffQueueTable)
      .where(and(eq(pcSignoffQueueTable.orgId, orgId), eq(pcSignoffQueueTable.status, "pending")));

    const quietRisks = await db.select().from(pcQuietRisksTable)
      .where(and(eq(pcQuietRisksTable.orgId, orgId), eq(pcQuietRisksTable.isResolved, false)));

    const nextActions = await db.select().from(pcNextActionsTable)
      .where(and(eq(pcNextActionsTable.orgId, orgId), eq(pcNextActionsTable.status, "suggested")))
      .orderBy(desc(pcNextActionsTable.impactScore))
      .limit(5);

    const brief = await db.insert(pcMorningBriefsTable).values({
      orgId,
      userId,
      briefDate: new Date(),
      mattersChanged,
      deadlinesApproaching: upcomingDeadlines.map(d => ({
        matterId: d.matterId,
        title: d.title,
        dueDate: d.dueDate,
        priority: d.priority,
        daysRemaining: Math.ceil((new Date(d.dueDate!).getTime() - Date.now()) / 86400000),
      })),
      silenceWindows: quietRisks.filter(r => r.riskType === "no_carrier_response").map(r => ({
        matterId: r.matterId,
        daysSilent: r.daysSilent,
        explanation: r.explanation,
      })),
      newFilesReceived: recentChanges.filter(c => c.changeType === "new_file").map(c => ({
        matterId: c.matterId,
        title: c.title,
        sourceType: c.sourceType,
      })),
      draftsWaiting: pendingReviews.map(r => ({
        matterId: r.matterId,
        title: r.title,
        reviewType: r.reviewType,
      })),
      bestActions: nextActions.map(a => ({
        matterId: a.matterId,
        title: a.title,
        description: a.description,
        impactScore: a.impactScore,
        estimatedMinutes: a.estimatedMinutes,
      })),
      quietRisks: quietRisks.map(r => ({
        matterId: r.matterId,
        riskType: r.riskType,
        title: r.title,
        severity: r.severity,
      })),
    }).returning();

    logger.info({ briefId: brief[0].id, userId }, "Morning brief generated");
    return brief[0];
  }

  async getLatestBrief(orgId: number, userId: number) {
    const briefs = await db.select().from(pcMorningBriefsTable)
      .where(and(eq(pcMorningBriefsTable.orgId, orgId), eq(pcMorningBriefsTable.userId, userId)))
      .orderBy(desc(pcMorningBriefsTable.createdAt))
      .limit(1);
    return briefs[0] ?? null;
  }

  async detectQuietRisks(orgId: number) {
    const matters = await db.select().from(pcMattersTable).where(
      and(eq(pcMattersTable.orgId, orgId), eq(pcMattersTable.status, "active" as any))
    );

    const risks: any[] = [];
    for (const matter of matters) {
      const recentComms = await db.select().from(pcCommunicationsTable)
        .where(and(eq(pcCommunicationsTable.matterId, matter.id), gte(pcCommunicationsTable.sentAt, new Date(Date.now() - 14 * 86400000))))
        .limit(1);

      if (recentComms.length === 0) {
        const lastComm = await db.select().from(pcCommunicationsTable)
          .where(eq(pcCommunicationsTable.matterId, matter.id))
          .orderBy(desc(pcCommunicationsTable.sentAt))
          .limit(1);

        const daysSilent = lastComm.length > 0
          ? Math.floor((Date.now() - new Date(lastComm[0].sentAt!).getTime()) / 86400000)
          : 30;

        if (daysSilent >= 14) {
          const existing = await db.select().from(pcQuietRisksTable)
            .where(and(
              eq(pcQuietRisksTable.orgId, orgId),
              eq(pcQuietRisksTable.matterId, matter.id),
              eq(pcQuietRisksTable.riskType, "no_carrier_response"),
              eq(pcQuietRisksTable.isResolved, false)
            )).limit(1);

          if (existing.length === 0) {
            const r = await db.insert(pcQuietRisksTable).values({
              orgId,
              matterId: matter.id,
              riskType: "no_carrier_response",
              title: `${matter.title}: No communication in ${daysSilent} days`,
              explanation: `No carrier response or communication activity detected for ${daysSilent} days. This silence may indicate stalling tactics or administrative oversight.`,
              severity: daysSilent > 21 ? "high" : "medium",
              daysSilent,
            }).returning();
            risks.push(r[0]);
          }
        }
      }

      const upcomingDeadlines = await db.select().from(pcDeadlinesTable)
        .where(and(
          eq(pcDeadlinesTable.matterId, matter.id),
          sql`${pcDeadlinesTable.dueDate} <= ${new Date(Date.now() + 5 * 86400000)}`,
          sql`${pcDeadlinesTable.dueDate} >= NOW()`,
          eq(pcDeadlinesTable.status, "active" as any)
        )).limit(1);

      if (upcomingDeadlines.length > 0) {
        const dl = upcomingDeadlines[0];
        const daysRemaining = Math.ceil((new Date(dl.dueDate!).getTime() - Date.now()) / 86400000);
        const existing = await db.select().from(pcQuietRisksTable)
          .where(and(
            eq(pcQuietRisksTable.orgId, orgId),
            eq(pcQuietRisksTable.matterId, matter.id),
            eq(pcQuietRisksTable.riskType, "deadline_approaching"),
            eq(pcQuietRisksTable.isResolved, false)
          )).limit(1);

        if (existing.length === 0) {
          const r = await db.insert(pcQuietRisksTable).values({
            orgId,
            matterId: matter.id,
            riskType: "deadline_approaching",
            title: `${matter.title}: Deadline in ${daysRemaining} days — ${dl.title}`,
            explanation: `"${dl.title}" is due in ${daysRemaining} business days. Review readiness and ensure all support is in place.`,
            severity: daysRemaining <= 3 ? "critical" : "high",
            deadlineDaysRemaining: daysRemaining,
          }).returning();
          risks.push(r[0]);
        }
      }
    }

    logger.info({ orgId, newRisks: risks.length }, "Quiet risk detection complete");
    return risks;
  }

  async getQuietRisks(orgId: number) {
    return db.select().from(pcQuietRisksTable)
      .where(and(eq(pcQuietRisksTable.orgId, orgId), eq(pcQuietRisksTable.isResolved, false)))
      .orderBy(desc(pcQuietRisksTable.createdAt));
  }

  async getNextActions(orgId: number, matterId?: number) {
    const conditions = [eq(pcNextActionsTable.orgId, orgId), eq(pcNextActionsTable.status, "suggested")];
    if (matterId) conditions.push(eq(pcNextActionsTable.matterId, matterId));
    return db.select().from(pcNextActionsTable)
      .where(and(...conditions))
      .orderBy(desc(pcNextActionsTable.impactScore))
      .limit(10);
  }

  async completeAction(orgId: number, actionId: number) {
    return db.update(pcNextActionsTable)
      .set({ status: "completed", completedAt: new Date() })
      .where(and(eq(pcNextActionsTable.id, actionId), eq(pcNextActionsTable.orgId, orgId)))
      .returning();
  }
}

export const pilotChangeTracker = new PilotChangeTracker();
