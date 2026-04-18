import { randomUUID } from "crypto";
import type {
  RecommendationResult,
  Evidence,
  PolicyDecision,
  AutonomyMode,
  PolicyState,
  ApprovalMode,
} from "./types.js";
import { createEvidence, listEvidence, computeEvidenceFreshnessScore } from "./evidence.js";
import { computeConfidence } from "./confidence.js";
import { openSession, attachEvidence, closeSession } from "./session.js";

export interface RecommendParams {
  title: string;
  summary: string;
  reasoning: string;
  domain: string;
  value?: unknown;
  urgency?: "routine" | "moderate" | "urgent" | "critical";
  autonomyMode?: AutonomyMode;
  baseConfidence?: number;
  evidenceIds?: string[];
  supportingEvidenceIds?: string[];
  contradictingEvidenceIds?: string[];
  inlineEvidence?: Array<{
    kind: Evidence["kind"];
    label: string;
    value: string;
    source: string;
    confidence?: number;
  }>;
  policyDecision?: PolicyDecision;
  suggestedAction?: string;
  validForMs?: number;
  metadata?: Record<string, unknown>;
  tenantOrgId?: string | number | null;
  /**
   * If provided, recommend() will NOT open a new session. It will stamp the
   * result with the existing runId/traceId and attach evidence to that run.
   * The caller is responsible for closing the session.
   */
  runId?: string;
  traceId?: string;
}

export async function recommend(params: RecommendParams): Promise<RecommendationResult> {
  const now = new Date().toISOString();
  const id = randomUUID();
  const autonomyMode: AutonomyMode = params.autonomyMode ?? "recommend";
  const rawTenant = params.tenantOrgId;
  const tenantOrgId: number | null =
    typeof rawTenant === "number" && Number.isFinite(rawTenant) ? rawTenant
    : typeof rawTenant === "string" && /^\d+$/.test(rawTenant) ? parseInt(rawTenant, 10)
    : null;

  const ownedSession = !params.runId;
  let runId: string;
  let traceId: string;

  if (params.runId && params.traceId) {
    runId = params.runId;
    traceId = params.traceId;
  } else {
    const session = openSession({
      autonomyMode,
      objective: params.title,
      tenantOrgId: typeof tenantOrgId === "number" ? tenantOrgId : null,
    });
    runId = session.runId;
    traceId = session.traceId;
  }

  const hasEvidenceOps =
    (params.inlineEvidence && params.inlineEvidence.length > 0) ||
    (params.evidenceIds && params.evidenceIds.length > 0) ||
    (params.supportingEvidenceIds && params.supportingEvidenceIds.length > 0) ||
    (params.contradictingEvidenceIds && params.contradictingEvidenceIds.length > 0);

  if (hasEvidenceOps && tenantOrgId === null) {
    throw new Error(
      "[alloy/recommend] tenantOrgId is required when using evidence operations. Provide a numeric tenantOrgId.",
    );
  }

  const inlineEvidenceIds: string[] = [];
  if (params.inlineEvidence && tenantOrgId !== null) {
    for (const ie of params.inlineEvidence) {
      const ev = createEvidence({
        kind: ie.kind,
        label: ie.label,
        value: ie.value,
        source: ie.source,
        confidence: ie.confidence,
        tenantOrgId,
      });
      inlineEvidenceIds.push(ev.id);
      attachEvidence(runId, ev.id);
    }
  }

  const supportingIds = [...(params.supportingEvidenceIds ?? []), ...inlineEvidenceIds];
  const contradictingIds = params.contradictingEvidenceIds ?? [];
  const allEvidenceIds = [
    ...(params.evidenceIds ?? []),
    ...supportingIds,
    ...contradictingIds,
  ];

  const supportingEvidence = tenantOrgId !== null ? listEvidence(supportingIds, tenantOrgId) : [];
  const contradictingEvidence = tenantOrgId !== null ? listEvidence(contradictingIds, tenantOrgId) : [];
  const allEvidence = tenantOrgId !== null
    ? (allEvidenceIds.length > 0
        ? listEvidence(allEvidenceIds, tenantOrgId)
        : listEvidence(undefined, tenantOrgId).filter(e => inlineEvidenceIds.includes(e.id)))
    : [];

  const freshnessScore = computeEvidenceFreshnessScore(allEvidence);

  const policyPenalty =
    params.policyDecision?.policyState === "blocked"
      ? 1
      : params.policyDecision?.policyState === "requires_approval"
        ? 0.5
        : 0;

  const confidenceResult = computeConfidence({
    baseConfidence: params.baseConfidence ?? 0.75,
    supportingEvidence,
    contradictingEvidence,
    freshnessScore,
    policyPenalty,
  });

  const policyState: PolicyState =
    params.policyDecision?.policyState ?? "unchecked";

  const approvalMode: ApprovalMode =
    policyState === "requires_approval"
      ? "pending"
      : policyState === "blocked"
        ? "rejected"
        : "none";

  const validUntil = params.validForMs
    ? new Date(Date.now() + params.validForMs).toISOString()
    : undefined;

  const result: RecommendationResult = {
    id,
    runId,
    traceId,
    value: params.value,
    title: params.title,
    summary: params.summary,
    reasoning: params.reasoning,
    domain: params.domain,
    confidence: confidenceResult.score,
    supportingEvidenceIds: supportingIds,
    contradictingEvidenceIds: contradictingIds,
    evidence: allEvidence,
    freshness: {
      generatedAt: now,
      isStale: false,
      validUntil,
    },
    policyState,
    policyDecision: params.policyDecision,
    approvalMode,
    autonomyMode,
    urgency: params.urgency ?? "routine",
    suggestedAction: params.suggestedAction,
    metadata: {
      ...(params.metadata ?? {}),
      confidenceBreakdown: confidenceResult.breakdown,
    },
  };

  if (ownedSession) {
    closeSession(runId, result);
  }
  return result;
}
