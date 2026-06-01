import {
  db,
  type ProofChain,
  type ProofExportSafetyState,
  type ProofReviewState,
  type ProvenanceSourceClass,
  proofChainTable,
} from '@szl-holdings/db';
import { createHash } from 'node:crypto';
import { and, desc, eq, } from 'drizzle-orm';

export type { ProofChain, ProofExportSafetyState, ProofReviewState, ProvenanceSourceClass };

export interface TagAIContentParams {
  orgId?: number | null;
  contentId: string;
  contentType: string;
  sourceClass: ProvenanceSourceClass;
  confidenceScore?: number;
  modelLane?: string;
  modelId?: string;
  modelProvider?: string;
  modelVersion?: string;
  promptText?: string;
  parentProofId?: number;
  generatedByUserId?: number | null;
  correlationId?: string;
  serviceAttribution?: string;
  inputSources?: Array<{ type: string; id: string; label?: string }>;
  metadata?: Record<string, unknown>;
}

export interface ReviewProofParams {
  proofId: number;
  reviewedBy: number;
  reviewState: ProofReviewState;
  reviewNote?: string;
  exportSafetyState?: ProofExportSafetyState;
}

function computePromptHash(promptText: string): string {
  return createHash('sha256').update(promptText).digest('hex').slice(0, 16);
}

function deriveExportSafetyState(
  sourceClass: ProvenanceSourceClass,
  confidenceScore: number,
  reviewState: ProofReviewState,
): ProofExportSafetyState {
  if (reviewState === 'retracted' || reviewState === 'flagged') return 'blocked';
  if (reviewState === 'approved') return 'safe';
  if (confidenceScore < 0.5) return 'restricted';
  if (sourceClass === 'llm_generated' || sourceClass === 'llm_summarized') return 'pending_review';
  if (sourceClass === 'human_authored' || sourceClass === 'system_computed') return 'safe';
  return 'pending_review';
}

export async function tagAIContent(params: TagAIContentParams): Promise<ProofChain> {
  const confidence = params.confidenceScore ?? 0.5;
  const initialReviewState: ProofReviewState = 'unreviewed';
  const exportSafety = deriveExportSafetyState(params.sourceClass, confidence, initialReviewState);

  const [proof] = await db
    .insert(proofChainTable)
    .values({
      orgId: params.orgId ?? null,
      contentId: params.contentId,
      contentType: params.contentType,
      sourceClass: params.sourceClass,
      confidenceScore: confidence,
      modelLane: params.modelLane ?? null,
      modelId: params.modelId ?? null,
      modelProvider: params.modelProvider ?? null,
      modelVersion: params.modelVersion ?? null,
      promptHash: params.promptText ? computePromptHash(params.promptText) : null,
      parentProofId: params.parentProofId ?? null,
      reviewState: initialReviewState,
      exportSafetyState: exportSafety,
      generatedByUserId: params.generatedByUserId ?? null,
      correlationId: params.correlationId ?? null,
      serviceAttribution: params.serviceAttribution ?? null,
      inputSources: params.inputSources ?? [],
      metadata: params.metadata ?? {},
    })
    .returning();

  return proof!;
}

export async function reviewProof(params: ReviewProofParams): Promise<ProofChain> {
  const [existing] = await db
    .select()
    .from(proofChainTable)
    .where(eq(proofChainTable.id, params.proofId));

  if (!existing) {
    throw Object.assign(new Error(`Proof ${params.proofId} not found`), { code: 'NOT_FOUND' });
  }

  const exportSafety =
    params.exportSafetyState ??
    deriveExportSafetyState(
      existing.sourceClass as ProvenanceSourceClass,
      existing.confidenceScore ?? 0.5,
      params.reviewState,
    );

  const [updated] = await db
    .update(proofChainTable)
    .set({
      reviewState: params.reviewState,
      reviewedBy: params.reviewedBy,
      reviewedAt: new Date(),
      reviewNote: params.reviewNote ?? null,
      exportSafetyState: exportSafety,
      updatedAt: new Date(),
    })
    .where(eq(proofChainTable.id, params.proofId))
    .returning();

  return updated!;
}

export async function getProofByContent(
  contentId: string,
  contentType: string,
): Promise<ProofChain | undefined> {
  const [row] = await db
    .select()
    .from(proofChainTable)
    .where(
      and(eq(proofChainTable.contentId, contentId), eq(proofChainTable.contentType, contentType)),
    )
    .orderBy(desc(proofChainTable.createdAt))
    .limit(1);
  return row;
}

export async function listProofChain(
  options: {
    orgId?: number;
    contentType?: string;
    reviewState?: ProofReviewState;
    sourceClass?: ProvenanceSourceClass;
    limit?: number;
  } = {},
): Promise<ProofChain[]> {
  const conditions = [];
  if (options.orgId != null) conditions.push(eq(proofChainTable.orgId, options.orgId));
  if (options.contentType) conditions.push(eq(proofChainTable.contentType, options.contentType));
  if (options.reviewState) conditions.push(eq(proofChainTable.reviewState, options.reviewState));
  if (options.sourceClass) conditions.push(eq(proofChainTable.sourceClass, options.sourceClass));

  const q = db
    .select()
    .from(proofChainTable)
    .orderBy(desc(proofChainTable.createdAt))
    .limit(options.limit ?? 100);

  if (conditions.length > 0) {
    return q.where(and(...conditions));
  }
  return q;
}

export async function isExportSafe(contentId: string, contentType: string): Promise<boolean> {
  const proof = await getProofByContent(contentId, contentType);
  if (!proof) return true;
  return proof.exportSafetyState === 'safe';
}

export async function assertExportSafe(contentId: string, contentType: string): Promise<void> {
  const proof = await getProofByContent(contentId, contentType);
  if (!proof) return;
  if (proof.exportSafetyState === 'blocked') {
    throw Object.assign(
      new Error(
        `Content ${contentType}:${contentId} is blocked from export — retracted or flagged`,
      ),
      { code: 'EXPORT_BLOCKED' },
    );
  }
  if (proof.exportSafetyState === 'restricted') {
    throw Object.assign(
      new Error(`Content ${contentType}:${contentId} export is restricted — low confidence`),
      { code: 'EXPORT_RESTRICTED' },
    );
  }
}

export interface ProofSummary {
  contentId: string;
  contentType: string;
  sourceClass: ProvenanceSourceClass;
  confidenceScore: number;
  modelId?: string | null;
  modelProvider?: string | null;
  modelLane?: string | null;
  reviewState: ProofReviewState;
  exportSafetyState: ProofExportSafetyState;
  generatedAt: Date;
}

export function summarizeProof(proof: ProofChain): ProofSummary {
  return {
    contentId: proof.contentId,
    contentType: proof.contentType,
    sourceClass: proof.sourceClass as ProvenanceSourceClass,
    confidenceScore: proof.confidenceScore ?? 0.5,
    modelId: proof.modelId,
    modelProvider: proof.modelProvider,
    modelLane: proof.modelLane,
    reviewState: proof.reviewState as ProofReviewState,
    exportSafetyState: proof.exportSafetyState as ProofExportSafetyState,
    generatedAt: proof.generatedAt,
  };
}

export type { TagSpatialContentParams } from './spatial-lineage.js';
export {
  getProofBundle,
  hashArtifactContent,
  tagSpatialContent,
} from './spatial-lineage.js';
