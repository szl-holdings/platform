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
import { tagAIContentWithIdentity } from './identity-signing.js';
import { emitVspProofSpan } from './vsp-emitter.js';

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
  agentName?: string;
  enablePqcSigning?: boolean;
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

  let mergedMetadata: Record<string, unknown> = params.metadata ?? {};

  const agentName = params.agentName ?? 'system';
  if (params.enablePqcSigning !== false) {
    let previousEntryHash: string | undefined;
    try {
      const [lastEntry] = await db
        .select({ metadata: proofChainTable.metadata })
        .from(proofChainTable)
        .orderBy(desc(proofChainTable.id))
        .limit(1);
      if (lastEntry?.metadata) {
        const lastSig = (lastEntry.metadata as Record<string, unknown>).pqcSignature as
          | { contentHash?: string }
          | undefined;
        if (lastSig?.contentHash) {
          previousEntryHash = lastSig.contentHash;
        }
      }
    } catch {
    }

    const identityResult = await tagAIContentWithIdentity({
      contentId: params.contentId,
      contentType: params.contentType,
      sourceClass: params.sourceClass,
      agentName,
      previousEntryHash,
      metadata: params.metadata,
    });
    mergedMetadata = {
      ...mergedMetadata,
      pqcSignature: identityResult,
    };

    // ── VSP (Verifiable Span Protocol) emission ───────────────────────────────
    // Fire-and-forget OTel GenAI span keyed on the receipt's hybrid content
    // hash. Errors are swallowed inside `emitVspProofSpan` so the receipt
    // build path never regresses past its 11.5 µs p50 budget.
    const contentHash = identityResult?.contentHash;
    if (typeof contentHash === 'string' && contentHash.length >= 32) {
      // Pull 9-axis Λ-vector from metadata when callers (Λ-gate evaluators,
      // orchestration-store) provide it. Missing axes are simply not stamped.
      const md = (params.metadata ?? {}) as Record<string, unknown>;
      const rawAxes =
        (md['lambdaAxes'] as Record<string, unknown> | undefined) ??
        (md['lambda'] as Record<string, unknown> | undefined);
      let lambdaAxes: Record<string, number | undefined> | undefined;
      if (rawAxes && typeof rawAxes === 'object') {
        lambdaAxes = {};
        for (const [k, v] of Object.entries(rawAxes)) {
          if (typeof v === 'number' && Number.isFinite(v)) lambdaAxes[k] = v;
        }
      }
      // ρ-closure: receipt is byte-identical to a prior replay when
      // metadata sets `replay.byteIdentical=true`. chain_root is the prior
      // entry hash (or genesis when first entry).
      const replay = md['replay'] as { byteIdentical?: unknown } | undefined;
      const byteIdentical = replay?.byteIdentical === true;
      const chainRoot = previousEntryHash ?? '0'.repeat(64);
      emitVspProofSpan({
        hash: contentHash,
        license: 'Apache-2.0',
        name: `lambda_gate.${params.contentType}`,
        endpoint: `lambda_gate.${params.contentType}`,
        ingestionPolicy: params.sourceClass,
        ts: new Date().toISOString(),
        ...(lambdaAxes && Object.keys(lambdaAxes).length > 0 ? { lambdaAxes } : {}),
        rhoClosure: { byteIdentical, chainRoot },
      });
    }
  }

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
      metadata: mergedMetadata,
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

export {
  tagAIContentWithIdentity,
  verifyProofEntry,
  canonicalStringify,
} from './identity-signing.js';

export {
  ATTESTATION_SCHEME_VERSION,
  buildAttestationPayload,
  getAttestationCoverage,
  getAttestationForEvent,
  runAttestationBackfill,
  runAttestationCatchUp,
  runIntegrityGuard,
} from './attestation-backfill.js';
export type {
  AttestationLookupResult,
  AttestationSigner,
  AttestationSignerResult,
  BackfillOptions,
  BackfillSummary,
  CoverageStats,
} from './attestation-backfill.js';
export {
  setVspProofEmitter,
  getVspProofEmitter,
  emitVspProofSpan,
} from './vsp-emitter.js';
export type { VspProofEmitter, VspProofEmitterInput } from './vsp-emitter.js';
