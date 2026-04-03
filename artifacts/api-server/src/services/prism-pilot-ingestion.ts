import { db } from "@workspace/db";
import { logger } from "../lib/logger";
import { eq, and, desc } from "drizzle-orm";
import {
  pcChangeEventsTable,
  pcIngestionJobsTable,
  pcMatterDeskSnapshotsTable,
} from "@workspace/db/schema";

export class PilotIngestionService {
  async ingestEmail(orgId: number, payload: {
    matterId: number;
    subject: string;
    from: string;
    body: string;
    receivedAt: string;
    attachments?: { name: string; type: string; size: number }[];
  }) {
    const job = await db.insert(pcIngestionJobsTable).values({
      orgId,
      sourceType: "email",
      sourceRef: payload.subject,
      matterId: payload.matterId,
      status: "processing",
      itemCount: 1 + (payload.attachments?.length ?? 0),
      startedAt: new Date(),
    }).returning();

    await db.insert(pcChangeEventsTable).values({
      orgId,
      matterId: payload.matterId,
      changeType: "new_communication",
      sourceType: "email",
      sourceRef: payload.from,
      title: `New email: ${payload.subject}`,
      summary: `Email from ${payload.from} — ${payload.body.slice(0, 200)}`,
      details: { subject: payload.subject, from: payload.from, attachmentCount: payload.attachments?.length ?? 0 },
      severity: "info",
    });

    if (payload.attachments?.length) {
      for (const att of payload.attachments) {
        await db.insert(pcChangeEventsTable).values({
          orgId,
          matterId: payload.matterId,
          changeType: "new_file",
          sourceType: "email_attachment",
          sourceRef: att.name,
          title: `New attachment: ${att.name}`,
          summary: `File ${att.name} (${att.type}, ${Math.round(att.size / 1024)}KB) received via email`,
          details: att,
          severity: "info",
        });
      }
    }

    await db.update(pcIngestionJobsTable)
      .set({ status: "completed", processedCount: 1 + (payload.attachments?.length ?? 0), completedAt: new Date() })
      .where(eq(pcIngestionJobsTable.id, job[0].id));

    logger.info({ jobId: job[0].id, matterId: payload.matterId }, "Email ingestion complete");
    return job[0];
  }

  async ingestFile(orgId: number, payload: {
    matterId: number;
    fileName: string;
    fileType: string;
    filePath: string;
    source: string;
  }) {
    const job = await db.insert(pcIngestionJobsTable).values({
      orgId,
      sourceType: "file",
      sourceRef: payload.fileName,
      matterId: payload.matterId,
      status: "processing",
      itemCount: 1,
      startedAt: new Date(),
    }).returning();

    await db.insert(pcChangeEventsTable).values({
      orgId,
      matterId: payload.matterId,
      changeType: "new_file",
      sourceType: payload.source,
      sourceRef: payload.fileName,
      title: `New file: ${payload.fileName}`,
      summary: `${payload.fileType} file received from ${payload.source}`,
      details: payload,
      severity: "info",
    });

    await db.update(pcIngestionJobsTable)
      .set({ status: "completed", processedCount: 1, completedAt: new Date() })
      .where(eq(pcIngestionJobsTable.id, job[0].id));

    logger.info({ jobId: job[0].id, matterId: payload.matterId }, "File ingestion complete");
    return job[0];
  }

  async getJobs(orgId: number, opts?: { status?: string; limit?: number }) {
    const conditions = [eq(pcIngestionJobsTable.orgId, orgId)];
    if (opts?.status) conditions.push(eq(pcIngestionJobsTable.status, opts.status as any));
    return db.select().from(pcIngestionJobsTable)
      .where(and(...conditions))
      .orderBy(desc(pcIngestionJobsTable.createdAt))
      .limit(opts?.limit ?? 50);
  }

  async getJobStats(orgId: number) {
    const jobs = await db.select().from(pcIngestionJobsTable).where(eq(pcIngestionJobsTable.orgId, orgId));
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === "completed").length;
    const failed = jobs.filter(j => j.status === "failed").length;
    const pending = jobs.filter(j => j.status === "pending").length;
    const processing = jobs.filter(j => j.status === "processing").length;
    return { total, completed, failed, pending, processing };
  }
}

export const pilotIngestion = new PilotIngestionService();
