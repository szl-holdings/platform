import {
  db,
  proofChainTable,
  type ProvenanceSourceClass,
} from "@szl-holdings/db";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";

export interface TagSpatialContentParams {
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
  parentProofId?: number | null;
  generatedByUserId?: number | null;
  correlationId?: string;
  serviceAttribution?: string;
  inputSources?: Array<{ type: string; id: string; label?: string }>;
  metadata?: Record<string, unknown>;
  parentSnapshotId?: number | null;
  derivedSimulationBranch?: string | null;
  renderedArtifactHash?: string | null;
  modelLaneUsed?: string | null;
  sourceEvidenceList?: Array<{ type: string; id: string; label?: string }>;
}

function computePromptHash(promptText: string): string {
  return createHash("sha256").update(promptText).digest("hex").slice(0, 16);
}

function computeArtifactHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 32);
}

function deriveExportSafetyState(
  sourceClass: ProvenanceSourceClass,
  confidenceScore: number,
): "safe" | "restricted" | "blocked" | "pending_review" {
  if (confidenceScore < 0.5) return "restricted";
  if (sourceClass === "llm_generated" || sourceClass === "llm_summarized") return "pending_review";
  if (sourceClass === "human_authored" || sourceClass === "system_computed") return "safe";
  return "pending_review";
}

export async function tagSpatialContent(
  params: TagSpatialContentParams,
): Promise<typeof proofChainTable.$inferSelect> {
  const confidence = params.confidenceScore ?? 0.5;
  const exportSafety = deriveExportSafetyState(params.sourceClass, confidence);

  const enrichedMetadata: Record<string, unknown> = {
    ...(params.metadata ?? {}),
    ...(params.parentSnapshotId != null ? { parentSnapshotId: params.parentSnapshotId } : {}),
    ...(params.derivedSimulationBranch ? { derivedSimulationBranch: params.derivedSimulationBranch } : {}),
    ...(params.renderedArtifactHash ? { renderedArtifactHash: params.renderedArtifactHash } : {}),
    ...(params.modelLaneUsed ? { modelLaneUsed: params.modelLaneUsed } : {}),
    ...(params.sourceEvidenceList?.length ? { sourceEvidenceList: params.sourceEvidenceList } : {}),
  };

  const combinedInputSources = [
    ...(params.inputSources ?? []),
    ...(params.sourceEvidenceList ?? []),
  ];

  const [proof] = await db.insert(proofChainTable).values({
    orgId: params.orgId ?? null,
    contentId: params.contentId,
    contentType: params.contentType,
    sourceClass: params.sourceClass,
    confidenceScore: confidence,
    modelLane: params.modelLaneUsed ?? params.modelLane ?? null,
    modelId: params.modelId ?? null,
    modelProvider: params.modelProvider ?? null,
    modelVersion: params.modelVersion ?? null,
    promptHash: params.promptText ? computePromptHash(params.promptText) : null,
    parentProofId: params.parentProofId ?? null,
    reviewState: "unreviewed",
    exportSafetyState: exportSafety,
    generatedByUserId: params.generatedByUserId ?? null,
    correlationId: params.correlationId ?? null,
    serviceAttribution: params.serviceAttribution ?? null,
    inputSources: combinedInputSources,
    metadata: enrichedMetadata,
  }).returning();

  return proof;
}

export async function getProofBundle(
  contentId: string,
  contentType: string,
): Promise<{
  proof: typeof proofChainTable.$inferSelect | null;
  parentProof: typeof proofChainTable.$inferSelect | null;
  lineage: {
    parentSnapshotId?: number;
    derivedSimulationBranch?: string;
    renderedArtifactHash?: string;
    modelLaneUsed?: string;
    sourceEvidenceList?: Array<{ type: string; id: string; label?: string }>;
  };
}> {
  const [proof] = await db
    .select()
    .from(proofChainTable)
    .where(and(eq(proofChainTable.contentId, contentId), eq(proofChainTable.contentType, contentType)))
    .limit(1);

  if (!proof) {
    return { proof: null, parentProof: null, lineage: {} };
  }

  const parentProof = proof.parentProofId
    ? await db
        .select()
        .from(proofChainTable)
        .where(eq(proofChainTable.id, proof.parentProofId))
        .then(r => r[0] ?? null)
    : null;

  const metadata = (proof.metadata as Record<string, unknown>) ?? {};

  const lineage = {
    parentSnapshotId: typeof metadata.parentSnapshotId === "number" ? metadata.parentSnapshotId : undefined,
    derivedSimulationBranch: typeof metadata.derivedSimulationBranch === "string" ? metadata.derivedSimulationBranch : undefined,
    renderedArtifactHash: typeof metadata.renderedArtifactHash === "string" ? metadata.renderedArtifactHash : undefined,
    modelLaneUsed: typeof metadata.modelLaneUsed === "string" ? metadata.modelLaneUsed : (proof.modelLane ?? undefined),
    sourceEvidenceList: Array.isArray(metadata.sourceEvidenceList)
      ? (metadata.sourceEvidenceList as Array<{ type: string; id: string; label?: string }>)
      : undefined,
  };

  return { proof, parentProof, lineage };
}

export function hashArtifactContent(content: string): string {
  return computeArtifactHash(content);
}
