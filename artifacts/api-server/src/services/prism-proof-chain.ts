import { db } from "@szl-holdings/db";
import { pcProofChainEntriesTable } from "@szl-holdings/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createHash } from "crypto";
import { logger } from "../lib/logger";

interface ProofChainInput {
  orgId: number;
  matterId?: number;
  outputType: string;
  outputContent: string;
  sourceReferences: any[];
  sourceClass?: string;
  extractionConfidence?: number;
  modelLane?: string;
  modelProvider?: string;
  modelVersion?: string;
  actorType?: "system" | "user" | "service";
  actorId?: number;
  privilegeState?: string;
}

class ProofChainService {
  async record(input: ProofChainInput): Promise<number> {
    const outputHash = createHash("sha256").update(input.outputContent).digest("hex");

    const [entry] = await db.insert(pcProofChainEntriesTable).values({
      orgId: input.orgId,
      matterId: input.matterId,
      outputType: input.outputType as any,
      outputContent: input.outputContent,
      outputHash,
      sourceReferences: input.sourceReferences,
      sourceClass: input.sourceClass,
      extractionConfidence: input.extractionConfidence,
      modelLane: input.modelLane,
      modelProvider: input.modelProvider,
      modelVersion: input.modelVersion,
      actorType: (input.actorType ?? "system") as any,
      actorId: input.actorId,
      privilegeState: (input.privilegeState ?? "none") as any,
    }).returning();

    logger.info({ proofChainId: entry.id, outputType: input.outputType, matterId: input.matterId }, "Proof Chain entry recorded");
    return entry.id;
  }

  async getTrace(proofChainId: number) {
    const [entry] = await db.select().from(pcProofChainEntriesTable)
      .where(eq(pcProofChainEntriesTable.id, proofChainId));
    if (!entry) return null;

    return {
      id: entry.id,
      outputType: entry.outputType,
      outputHash: entry.outputHash,
      sourceReferences: entry.sourceReferences,
      sourceClass: entry.sourceClass,
      extractionConfidence: entry.extractionConfidence,
      modelLane: entry.modelLane,
      modelProvider: entry.modelProvider,
      modelVersion: entry.modelVersion,
      generationTimestamp: entry.generationTimestamp,
      actorType: entry.actorType,
      reviewState: entry.reviewState,
      approvalState: entry.approvalState,
      privilegeState: entry.privilegeState,
      exportSafe: entry.exportSafe,
    };
  }

  async setReviewState(proofChainId: number, state: string, reviewerId: number) {
    await db.update(pcProofChainEntriesTable).set({
      reviewState: state as any,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    }).where(eq(pcProofChainEntriesTable.id, proofChainId));
  }

  async setApprovalState(proofChainId: number, state: string, approverId: number) {
    await db.update(pcProofChainEntriesTable).set({
      approvalState: state as any,
      approvedBy: approverId,
      approvedAt: new Date(),
      exportSafe: state === "approved",
    }).where(eq(pcProofChainEntriesTable.id, proofChainId));
  }

  async getMatterChain(orgId: number, matterId: number) {
    return db.select().from(pcProofChainEntriesTable)
      .where(and(eq(pcProofChainEntriesTable.orgId, orgId), eq(pcProofChainEntriesTable.matterId, matterId)))
      .orderBy(desc(pcProofChainEntriesTable.createdAt));
  }

  async getPendingReviews(orgId: number) {
    return db.select().from(pcProofChainEntriesTable)
      .where(and(eq(pcProofChainEntriesTable.orgId, orgId), eq(pcProofChainEntriesTable.reviewState, "pending_review")))
      .orderBy(desc(pcProofChainEntriesTable.createdAt));
  }

  async verifyIntegrity(proofChainId: number): Promise<{ valid: boolean; details: any }> {
    const [entry] = await db.select().from(pcProofChainEntriesTable)
      .where(eq(pcProofChainEntriesTable.id, proofChainId));
    if (!entry) return { valid: false, details: { error: "Entry not found" } };

    const currentHash = createHash("sha256").update(entry.outputContent ?? "").digest("hex");
    const hashValid = currentHash === entry.outputHash;

    return {
      valid: hashValid,
      details: {
        hashMatch: hashValid,
        hasSourceReferences: Array.isArray(entry.sourceReferences) && (entry.sourceReferences as any[]).length > 0,
        reviewState: entry.reviewState,
        approvalState: entry.approvalState,
        exportSafe: entry.exportSafe,
        privilegeState: entry.privilegeState,
      },
    };
  }

  async generateAuditPacket(orgId: number, matterId: number) {
    const chain = await this.getMatterChain(orgId, matterId);
    return {
      matterId,
      totalEntries: chain.length,
      byType: chain.reduce((acc: any, e) => { acc[e.outputType] = (acc[e.outputType] ?? 0) + 1; return acc; }, {}),
      reviewStates: chain.reduce((acc: any, e) => { acc[e.reviewState] = (acc[e.reviewState] ?? 0) + 1; return acc; }, {}),
      approvalStates: chain.reduce((acc: any, e) => { acc[e.approvalState] = (acc[e.approvalState] ?? 0) + 1; return acc; }, {}),
      exportSafeCount: chain.filter(e => e.exportSafe).length,
      modelLanes: [...new Set(chain.map(e => e.modelLane).filter(Boolean))],
      providers: [...new Set(chain.map(e => e.modelProvider).filter(Boolean))],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const proofChain = new ProofChainService();
