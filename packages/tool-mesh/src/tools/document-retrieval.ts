import { randomUUID } from 'node:crypto';
import type { SearchHit } from '@workspace/aef-contracts';
import { AefClient } from '@workspace/aef-sdk/client';
import { AefAuthError, AefPolicyError, AefUnavailableError } from '@workspace/aef-sdk/errors';
import { z } from 'zod';
import type { ToolHandler } from '../gateway.js';
import type { ToolManifest } from '../manifest.js';

export const DocumentRetrievalInputSchema = z.object({
  query: z.string().min(1),
  domain: z.string().optional(),
  profileId: z.string().optional(),
  topK: z.number().int().positive().default(5),
  minScore: z.number().min(0).max(1).default(0.35),
  rerankEnabled: z.boolean().default(true),
  denseWeight: z.number().min(0).max(1).default(0.6),
  keywordWeight: z.number().min(0).max(1).default(0.4),
  filters: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
  tenantId: z.string().optional(),
  includeEvidence: z.boolean().default(true),
});

export type DocumentRetrievalInput = z.infer<typeof DocumentRetrievalInputSchema>;

export interface EvidenceBreakdown {
  denseScore?: number | undefined;
  keywordScore?: number | undefined;
  fusedScore: number;
  rerankerScore?: number | undefined;
  finalScore: number;
  boostApplied: boolean;
  pathway: string;
}

export interface DocumentRetrievalHit {
  chunkId: string;
  sourceId: string;
  sourceUri?: string | undefined;
  title?: string | undefined;
  page?: number | undefined;
  section?: string | undefined;
  text: string;
  evidence: EvidenceBreakdown;
  rationale?: string | undefined;
  profileVersion?: string | undefined;
  traceId?: string | undefined;
  evidenceId?: string | undefined;
}

export interface DocumentRetrievalOutput {
  requestId: string;
  traceId: string;
  query: string;
  profileId?: string | undefined;
  retrievalPath: string[];
  hits: DocumentRetrievalHit[];
  totalCandidates: number;
  processingMs?: number | undefined;
  policyDecision?:
    | {
        allow: boolean;
        redactions: string[];
        appliedRuleIds: string[];
      }
    | undefined;
}

export const DOCUMENT_RETRIEVAL_TOOL_MANIFEST: ToolManifest = {
  id: 'document-retrieval',
  name: 'Document Retrieval',
  version: '2.0.0',
  description:
    'Retrieve relevant documents from the AEF knowledge base using hybrid dense+keyword search with optional reranking. Returns results with full evidence breakdown: source, dense/keyword/fusion/rerank scores, retrieval pathway, and rationale. All results carry a traceId and evidenceId for audit. Fails explicitly if AEF is unreachable — no silent fallbacks.',
  domainTags: ['documents', 'data', 'custom'],
  policyTier: 'internal-workflow',
  allowedEnvironments: ['development', 'staging', 'production'],
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Semantic search query' },
      domain: { type: 'string', description: 'Domain scope (e.g. lyte, vessels, terra)' },
      profileId: { type: 'string', description: 'AEF domain profile ID override' },
      topK: { type: 'integer', minimum: 1, description: 'Maximum number of documents to return' },
      minScore: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Minimum final score threshold',
      },
      rerankEnabled: { type: 'boolean', description: 'Enable cross-encoder reranking' },
      denseWeight: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'Dense vector weight in fusion (0–1)',
      },
      keywordWeight: {
        type: 'number',
        minimum: 0,
        maximum: 1,
        description: 'BM25 keyword weight in fusion (0–1)',
      },
      filters: { type: 'object', description: 'Optional key-value metadata filters' },
      includeEvidence: { type: 'boolean', description: 'Include full evidence breakdown per hit' },
    },
    required: ['query'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      requestId: { type: 'string' },
      traceId: { type: 'string' },
      retrievalPath: { type: 'array', items: { type: 'string' } },
      hits: { type: 'array' },
      totalCandidates: { type: 'integer' },
    },
    required: ['requestId', 'traceId', 'retrievalPath', 'hits', 'totalCandidates'],
  },
  rateLimits: { requestsPerMinute: 120 },
  timeoutMs: 15000,
  failureModes: [
    { type: 'timeout', retryable: true, maxRetries: 3 },
    { type: 'unavailable', retryable: false, maxRetries: 0 },
    { type: 'policy-block', retryable: false, maxRetries: 0 },
  ],
  approvalRequired: false,
  observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: ['filters'] },
  enabled: true,
};

function mapHit(hit: SearchHit): DocumentRetrievalHit {
  const rerankerScore = hit.rerankerScore ?? hit.rerankScore;
  const pathway =
    rerankerScore !== undefined
      ? 'dense+keyword→fusion→rerank'
      : hit.keywordScore !== undefined
        ? 'dense+keyword→fusion'
        : 'dense';

  return {
    chunkId: hit.chunkId,
    sourceId: hit.sourceId,
    sourceUri: hit.sourceUri,
    title: hit.title ?? hit.documentTitle,
    page: hit.page,
    section: hit.section,
    text: hit.text,
    evidence: {
      denseScore: hit.denseScore,
      keywordScore: hit.keywordScore,
      fusedScore: hit.fusedScore,
      rerankerScore: hit.rerankerScore ?? hit.rerankScore,
      finalScore: hit.finalScore,
      boostApplied: hit.boostApplied,
      pathway,
    },
    rationale: hit.rationale ?? hit.selectedRationale,
    profileVersion: hit.profileVersion,
    traceId: hit.traceId,
    evidenceId: hit.evidenceId,
  };
}

function resolveProfileId(input: DocumentRetrievalInput): string | undefined {
  if (input.profileId) return input.profileId;
  const domainMap: Record<string, string> = {
    lyte: 'lyte_governance_ops',
    vessels: 'vessels_maritime_risk',
    terra: 'terra_real_estate_intel',
    aegis: 'aegis_security_incident',
    prism: 'prism_legal_matter',
    'prism-counsel': 'prism_legal_matter',
    carlota: 'carlota_private_advisory',
    'carlota-jo': 'carlota_private_advisory',
  };
  if (input.domain && domainMap[input.domain]) return domainMap[input.domain];
  return undefined;
}

export const documentRetrievalHandler: ToolHandler = async (input) => {
  const parsed = DocumentRetrievalInputSchema.parse(input);

  const gatewayUrl = process.env.AEF_GATEWAY_URL;
  const apiKey = process.env.AEF_API_KEY;

  if (!gatewayUrl || !apiKey) {
    throw new Error(
      'Document retrieval is not configured: AEF_GATEWAY_URL and AEF_API_KEY must be set. ' +
        'See docs/aef/RUNBOOK.md for setup instructions.',
    );
  }

  const client = new AefClient({
    gatewayUrl,
    apiKey,
    tenantId: parsed.tenantId ?? process.env.AEF_TENANT_ID ?? 'szl-holdings',
  });

  const requestId = randomUUID();
  const profileId = resolveProfileId(parsed);

  try {
    const response = await client.hybridSearch({
      requestId,
      query: parsed.query,
      profileId,
      topK: parsed.topK,
      rerankEnabled: parsed.rerankEnabled,
      denseWeight: parsed.denseWeight,
      keywordWeight: parsed.keywordWeight,
      candidatePool: parsed.topK * 10,
      metadataFilter: parsed.filters,
      includeProvenance: parsed.includeEvidence,
    });

    const hits = response.hits
      .filter((h: SearchHit) => h.finalScore >= parsed.minScore)
      .map(mapHit);

    const result: DocumentRetrievalOutput = {
      requestId: response.requestId,
      traceId: response.traceId,
      query: parsed.query,
      profileId: response.profileId,
      retrievalPath: response.retrievalPath,
      hits,
      totalCandidates: response.totalCandidates,
      processingMs: response.processingMs,
      policyDecision: response.policyDecision,
    };

    return result;
  } catch (err: unknown) {
    if (err instanceof AefUnavailableError) {
      const e = err as AefUnavailableError;
      throw new Error(
        `[document-retrieval] AEF gateway unreachable. ${e.message} ` +
          'Verify AEF_GATEWAY_URL is correct and the AEF API service is running.',
      );
    }
    if (err instanceof AefAuthError) {
      throw new Error('[document-retrieval] AEF authentication failed. Check AEF_API_KEY.');
    }
    if (err instanceof AefPolicyError) {
      const e = err as AefPolicyError;
      throw new Error(
        `[document-retrieval] AEF policy guard rejected this retrieval request: ${e.message}`,
      );
    }
    throw err;
  }
};
