import { db } from "@szl-holdings/db";
import { logger } from "../lib/logger";
import { eq, and, desc } from "drizzle-orm";
import {
  pcWordExportsTable,
  pcReviewItemsTable,
  pcAuditEventsTable,
  pcChangeEventsTable,
  pcMattersTable,
  pcPrivilegeFlagsTable,
  pcDocumentChunksTable,
} from "@szl-holdings/db/schema";

export class PilotExportService {
  async generateExport(orgId: number, data: {
    matterId: number;
    exportType: string;
    title: string;
    generatedBy: number;
    reviewItemId?: number;
  }) {
    const matter = await db.select().from(pcMattersTable)
      .where(and(eq(pcMattersTable.id, data.matterId), eq(pcMattersTable.orgId, orgId)))
      .limit(1);

    if (!matter.length) throw new Error("Matter not found");

    const m = matter[0];
    if (m.privilegeFlag && !m.exportSafe) {
      throw Object.assign(
        new Error("Export blocked: this matter has unresolved privilege flags. Resolve all pending privilege reviews before exporting."),
        { statusCode: 403 }
      );
    }

    const unreviewedPrivilegedDocs = await db
      .select({ id: pcDocumentChunksTable.id })
      .from(pcDocumentChunksTable)
      .where(
        and(
          eq(pcDocumentChunksTable.matterId, data.matterId),
          eq(pcDocumentChunksTable.privilegeFlag, true),
          eq(pcDocumentChunksTable.reviewState, "unreviewed"),
        ),
      )
      .limit(1);
    if (unreviewedPrivilegedDocs.length > 0) {
      throw Object.assign(
        new Error("Export blocked: matter contains privileged documents with unreviewed status. Complete privilege review for all flagged documents before exporting."),
        { statusCode: 403 }
      );
    }

    const pendingPrivilegeFlags = await db
      .select({ id: pcPrivilegeFlagsTable.id })
      .from(pcPrivilegeFlagsTable)
      .where(eq(pcPrivilegeFlagsTable.matterId, data.matterId))
      .limit(1);
    if (pendingPrivilegeFlags.length > 0 && !m.exportSafe) {
      throw Object.assign(
        new Error("Export blocked: matter has outstanding privilege flags that require review. Resolve all privilege assertions before exporting."),
        { statusCode: 403 }
      );
    }

    if (data.reviewItemId) {
      const review = await db.select().from(pcReviewItemsTable)
        .where(and(eq(pcReviewItemsTable.id, data.reviewItemId), eq(pcReviewItemsTable.orgId, orgId)))
        .limit(1);
      if (review.length && !review[0].safeToSend) {
        throw new Error("Review item is not approved for export. Complete sign-off first.");
      }
    }

    const proofChainRef = `PC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const filePath = `/exports/${orgId}/${data.matterId}/${data.exportType}_${Date.now()}.docx`;

    const result = await db.insert(pcWordExportsTable).values({
      orgId,
      matterId: data.matterId,
      exportType: data.exportType,
      title: data.title,
      filePath,
      fileSize: 0,
      proofChainRef,
      generatedBy: data.generatedBy,
      accessLog: [{ action: "created", userId: data.generatedBy, timestamp: new Date().toISOString() }],
    }).returning();

    await db.insert(pcAuditEventsTable).values({
      orgId,
      matterId: data.matterId,
      actorId: data.generatedBy,
      action: "export_generated",
      entityType: "word_export",
      details: {
        exportId: result[0].id,
        exportType: data.exportType,
        proofChainRef,
        filePath,
      },
    });

    await db.insert(pcChangeEventsTable).values({
      orgId,
      matterId: data.matterId,
      changeType: "export_created",
      sourceType: "word_export",
      sourceRef: proofChainRef,
      title: `Export generated: ${data.title}`,
      summary: `${data.exportType} export created with proof chain reference ${proofChainRef}`,
      severity: "info",
      actorId: data.generatedBy,
    });

    logger.info({ exportId: result[0].id, proofChainRef }, "Word export generated");
    return result[0];
  }

  async getExports(orgId: number, opts?: { matterId?: number; limit?: number }) {
    const conditions = [eq(pcWordExportsTable.orgId, orgId)];
    if (opts?.matterId) conditions.push(eq(pcWordExportsTable.matterId, opts.matterId));
    return db.select().from(pcWordExportsTable)
      .where(and(...conditions))
      .orderBy(desc(pcWordExportsTable.createdAt))
      .limit(opts?.limit ?? 50);
  }

  async getExport(orgId: number, exportId: number) {
    const rows = await db.select().from(pcWordExportsTable)
      .where(and(eq(pcWordExportsTable.id, exportId), eq(pcWordExportsTable.orgId, orgId)));
    return rows[0] ?? null;
  }

  async logAccess(orgId: number, exportId: number, userId: number) {
    const exp = await this.getExport(orgId, exportId);
    if (!exp) throw new Error("Export not found");

    const accessLog = (exp.accessLog as Array<Record<string, unknown>>) || [];
    accessLog.push({ action: "accessed", userId, timestamp: new Date().toISOString() });

    await db.update(pcWordExportsTable)
      .set({ accessLog })
      .where(eq(pcWordExportsTable.id, exportId));

    await db.insert(pcAuditEventsTable).values({
      orgId,
      matterId: exp.matterId,
      actorId: userId,
      action: "export_accessed",
      entityType: "word_export",
      details: { exportId, proofChainRef: exp.proofChainRef },
    });
  }

  async buildDocxContent(orgId: number, exportId: number) {
    const exp = await this.getExport(orgId, exportId);
    if (!exp) throw new Error("Export not found");

    const matter = await db.select().from(pcMattersTable)
      .where(eq(pcMattersTable.id, exp.matterId))
      .limit(1);

    const matterTitle = matter[0]?.title ?? "Unknown Matter";
    const now = new Date().toISOString().split("T")[0];

    let content = "";
    switch (exp.exportType) {
      case "chronology":
        content = `REVIEWED CHRONOLOGY\n\n${matterTitle}\nGenerated: ${now}\nProof Chain: ${exp.proofChainRef}\n\nThis chronology has been reviewed and approved through PRISM Counsel's governed review process. All source materials are traceable through the proof chain reference above.\n\n[Chronology entries would be populated from matter data]`;
        break;
      case "partner_update":
        content = `PARTNER UPDATE MEMO\n\n${matterTitle}\nGenerated: ${now}\nProof Chain: ${exp.proofChainRef}\n\nThis update memo has been reviewed and approved. All statements are source-grounded.\n\n[Partner update content would be populated from matter data and review items]`;
        break;
      case "demand_section":
        content = `DEMAND SECTION\n\n${matterTitle}\nGenerated: ${now}\nProof Chain: ${exp.proofChainRef}\n\nThis demand section has been reviewed for accuracy and completeness. All claims are supported by documented evidence.\n\n[Demand content would be populated from matter data]`;
        break;
      default:
        content = `PRISM COUNSEL EXPORT\n\n${matterTitle}\nType: ${exp.exportType}\nGenerated: ${now}\nProof Chain: ${exp.proofChainRef}\n\n[Export content]`;
    }

    return { content, matterTitle, proofChainRef: exp.proofChainRef, exportType: exp.exportType, generatedAt: now };
  }
}

export const pilotExport = new PilotExportService();
