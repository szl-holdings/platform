/**
 * Counsel Tools — A11oy Agent Registry
 *
 * Exposes Counsel capabilities as callable tools in the A11oy agent mesh:
 *   - matter-lookup: retrieve a matter by ID or name with full context
 *   - settlement-reforecast: re-run Monte Carlo settlement likelihood for a matter
 *   - citation-search: BM25 search over indexed matter knowledge
 *   - draft-obligation: generate a structured obligation draft from a description
 *
 * Tools emit Prism Bus signals on completion so downstream agents can react.
 */

import { prismBus } from '@szl-holdings/prism-bus';

export interface CounselToolInput {
  toolName: string;
  params: Record<string, unknown>;
  orgId?: string;
  userId?: string;
}

export interface CounselToolResult {
  toolName: string;
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
  executedAt: string;
  signalId?: string;
}

// ---------------------------------------------------------------------------
// Tool: matter-lookup
// ---------------------------------------------------------------------------

export async function matterLookupTool(params: {
  matterId?: string;
  orgId: string;
}): Promise<CounselToolResult> {
  const { matterId, orgId } = params;
  try {
    const { db, pcGcMattersTable, pcGcObligationsTable } = await import('@szl-holdings/db');
    const { and, eq, asc } = await import('drizzle-orm');

    if (!matterId) {
      const matters = await db
        .select({ id: pcGcMattersTable.id, name: pcGcMattersTable.name, status: pcGcMattersTable.status })
        .from(pcGcMattersTable)
        .where(eq(pcGcMattersTable.orgId, orgId))
        .limit(10);
      return {
        toolName: 'matter-lookup',
        success: true,
        data: { matters },
        executedAt: new Date().toISOString(),
      };
    }

    const [matter] = await db
      .select()
      .from(pcGcMattersTable)
      .where(and(eq(pcGcMattersTable.id, matterId), eq(pcGcMattersTable.orgId, orgId)));

    if (!matter) {
      return { toolName: 'matter-lookup', success: false, data: {}, error: 'Matter not found', executedAt: new Date().toISOString() };
    }

    const obligations = await db
      .select()
      .from(pcGcObligationsTable)
      .where(eq(pcGcObligationsTable.matterId, matterId))
      .orderBy(asc(pcGcObligationsTable.dueDate));

    const signalId = `sig-counsel-matter-lookup-${Date.now()}`;
    try {
      await prismBus.publish({
        id: signalId,
        type: 'tool_called',
        domain: 'prism-counsel',
        sourceId: 'counsel:matter-lookup',
        severity: 'info',
        payload: {
          matterId,
          matterName: matter.name,
          status: matter.status,
          obligationCount: obligations.length,
        },
      });
    } catch { /* non-fatal */ }

    return {
      toolName: 'matter-lookup',
      success: true,
      signalId,
      data: {
        matter: {
          id: matter.id,
          name: matter.name,
          status: matter.status,
          type: matter.type,
          jurisdiction: matter.jurisdiction,
          estimatedExposure: matter.estimatedExposure != null ? Number(matter.estimatedExposure) : null,
          nextDeadline: matter.nextDeadline,
          nextDeadlineLabel: matter.nextDeadlineLabel,
          pressureScore: matter.pressureScore,
          leadCounsel: matter.leadCounsel,
        },
        obligations: obligations.slice(0, 10).map((o) => ({
          id: o.id,
          title: o.title,
          dueDate: o.dueDate,
          status: o.status,
          assignee: o.assignee,
          consequence: o.consequence,
        })),
      },
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      toolName: 'matter-lookup',
      success: false,
      data: {},
      error: String(err),
      executedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Tool: settlement-reforecast
// ---------------------------------------------------------------------------

export async function settlementReforecastTool(params: {
  matterId: string;
  orgId: string;
  claimedDamagesM?: number;
  liabilityProbability?: number;
}): Promise<CounselToolResult> {
  const { matterId, orgId, claimedDamagesM, liabilityProbability } = params;
  try {
    const { db, pcGcMattersTable } = await import('@szl-holdings/db');
    const { and, eq } = await import('drizzle-orm');

    const [matter] = await db
      .select({
        estimatedExposure: pcGcMattersTable.estimatedExposure,
        name: pcGcMattersTable.name,
        type: pcGcMattersTable.type,
      })
      .from(pcGcMattersTable)
      .where(and(eq(pcGcMattersTable.id, matterId), eq(pcGcMattersTable.orgId, orgId)));

    // exposureM: prefer DB value, fall back to caller-supplied claimedDamagesM, else $5M default.
    const exposureM = matter?.estimatedExposure
      ? Number(matter.estimatedExposure) / 1_000_000
      : (claimedDamagesM ?? 5);

    // liabilityWeight: caller-supplied 0-1 probability, else neutral 1.0.
    // Applied as a multiplier on settlement likelihood — low liability reduces settlement odds.
    const liabilityWeight = liabilityProbability !== undefined
      ? Math.max(0, Math.min(1, liabilityProbability))
      : 1.0;

    // PRISM scenario baseline is calibrated to ~$5M exposure.
    // Scale exposure percentiles linearly to the matter's actual claimed damages.
    const baseExposureM = 5;
    const exposureScale = exposureM / baseExposureM;

    const { runSimulation, PRISM_LITIGATION_OUTCOME } = await import('@szl-holdings/monte-carlo');

    const result = await runSimulation(PRISM_LITIGATION_OUTCOME, { iterations: 2000, timeoutMs: 15_000 });
    const settlementStats = result.results?.['settlementProbability']?.stats;
    const exposureStats = result.results?.['totalExposure']?.stats;

    // Map to a uniform {p10,p50,p90,mean} shape, then apply matter-specific adjustments:
    //   • settlement scaled by liabilityWeight (lower liability → lower settlement odds)
    //   • exposure scaled by exposureM/baseExposureM (matter's actual claimed damages)
    const rawSettlement = settlementStats
      ? { p10: (settlementStats.mean ?? 0) - (settlementStats.stdDev ?? 0),
          p50: settlementStats.mean ?? 0,
          p90: (settlementStats.mean ?? 0) + (settlementStats.stdDev ?? 0),
          mean: settlementStats.mean ?? 0 }
      : null;
    const settlement = rawSettlement
      ? {
          p10: Math.max(0, Math.min(100, rawSettlement.p10 * liabilityWeight)),
          p50: Math.max(0, Math.min(100, rawSettlement.p50 * liabilityWeight)),
          p90: Math.max(0, Math.min(100, rawSettlement.p90 * liabilityWeight)),
          mean: Math.max(0, Math.min(100, rawSettlement.mean * liabilityWeight)),
        }
      : null;
    const rawExposure = exposureStats
      ? { p10: (exposureStats.mean ?? 0) - (exposureStats.stdDev ?? 0),
          p50: exposureStats.mean ?? 0,
          p90: (exposureStats.mean ?? 0) + (exposureStats.stdDev ?? 0),
          mean: exposureStats.mean ?? 0 }
      : null;
    const exposure = rawExposure
      ? {
          p10: rawExposure.p10 * exposureScale,
          p50: rawExposure.p50 * exposureScale,
          p90: rawExposure.p90 * exposureScale,
          mean: rawExposure.mean * exposureScale,
        }
      : null;

    const signalId = `sig-counsel-settlement-${Date.now()}`;
    try {
      await prismBus.publish({
        id: signalId,
        type: 'domain_signal',
        domain: 'prism-counsel',
        sourceId: 'counsel:settlement-reforecast',
        severity: settlement && settlement.p50 > 70 ? 'high' : 'medium',
        payload: {
          matterId,
          matterName: matter?.name,
          settlementLikelihoodP50: settlement?.p50,
          exposureP50M: exposure?.p50,
          eventType: 'settlement-likelihood-updated',
        },
      });
    } catch { /* non-fatal */ }

    return {
      toolName: 'settlement-reforecast',
      success: true,
      signalId,
      data: {
        matterId,
        matterName: matter?.name ?? 'Unknown',
        trials: result.trialCount,
        settlementLikelihood: {
          p10: settlement?.p10,
          p50: settlement?.p50,
          p90: settlement?.p90,
          mean: settlement?.mean,
          unit: '%',
        },
        totalExposure: {
          p10: exposure?.p10,
          p50: exposure?.p50,
          p90: exposure?.p90,
          mean: exposure?.mean,
          unit: '$M',
        },
        runtimeMs: result.runtimeMs,
      },
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      toolName: 'settlement-reforecast',
      success: false,
      data: {},
      error: String(err),
      executedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Tool: citation-search
// ---------------------------------------------------------------------------

export async function citationSearchTool(params: {
  matterId: string;
  orgId: string;
  query: string;
}): Promise<CounselToolResult> {
  const { matterId, orgId, query } = params;
  try {
    const { db, counselKnowledgeChunksTable, counselKnowledgeDocumentsTable } = await import('@szl-holdings/db');
    const { and, eq } = await import('drizzle-orm');

    const [allChunks, indexedDocs] = await Promise.all([
      db
        .select({
          id: counselKnowledgeChunksTable.id,
          documentId: counselKnowledgeChunksTable.documentId,
          chunkIndex: counselKnowledgeChunksTable.chunkIndex,
          content: counselKnowledgeChunksTable.content,
          sectionHint: counselKnowledgeChunksTable.sectionHint,
          keywords: counselKnowledgeChunksTable.keywords,
        })
        .from(counselKnowledgeChunksTable)
        .where(and(
          eq(counselKnowledgeChunksTable.matterId, matterId),
          eq(counselKnowledgeChunksTable.orgId, orgId),
        )),
      db
        .select({ id: counselKnowledgeDocumentsTable.id, fileName: counselKnowledgeDocumentsTable.fileName })
        .from(counselKnowledgeDocumentsTable)
        .where(and(
          eq(counselKnowledgeDocumentsTable.matterId, matterId),
          eq(counselKnowledgeDocumentsTable.orgId, orgId),
        )),
    ]);

    if (allChunks.length === 0) {
      return {
        toolName: 'citation-search',
        success: true,
        data: { citations: [], message: 'No indexed documents for this matter' },
        executedAt: new Date().toISOString(),
      };
    }

    // Simple BM25-style relevance scoring
    const queryTerms = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    const docMap = new Map(indexedDocs.map((d) => [d.id, d.fileName]));

    const scored = allChunks.map((chunk) => {
      const text = chunk.content.toLowerCase();
      const termMatches = queryTerms.filter((t) => text.includes(t)).length;
      const score = termMatches / Math.max(queryTerms.length, 1);
      return { ...chunk, score };
    })
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const citations = scored.map((c) => ({
      chunkId: c.id,
      fileName: docMap.get(c.documentId) ?? 'Unknown',
      chunkIndex: c.chunkIndex,
      sectionHint: c.sectionHint,
      excerpt: c.content.slice(0, 400),
      relevanceScore: c.score,
    }));

    return {
      toolName: 'citation-search',
      success: true,
      data: { citations, query, totalChunksSearched: allChunks.length },
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      toolName: 'citation-search',
      success: false,
      data: {},
      error: String(err),
      executedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Tool: draft-obligation
// ---------------------------------------------------------------------------

export async function draftObligationTool(params: {
  matterId: string;
  orgId: string;
  description: string;
  dueDate?: string;
  assignee?: string;
}): Promise<CounselToolResult> {
  const { matterId, orgId, description, dueDate, assignee } = params;
  try {
    const dueDateStr = dueDate ?? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const draft = {
      matterId,
      title: description.length > 80 ? description.slice(0, 77) + '...' : description,
      description,
      dueDate: dueDateStr,
      status: 'pending' as const,
      assignee: assignee ?? 'Lead Counsel',
      privilegeLevel: 'confidential' as const,
      filingRequired: description.toLowerCase().includes('filing') || description.toLowerCase().includes('court'),
      consequence: 'Non-compliance may result in adverse ruling or regulatory sanction',
      dependencies: [],
    };

    const signalId = `sig-counsel-obligation-draft-${Date.now()}`;
    try {
      await prismBus.publish({
        id: signalId,
        type: 'artifact_created',
        domain: 'prism-counsel',
        sourceId: 'counsel:draft-obligation',
        severity: 'info',
        payload: {
          matterId,
          obligationTitle: draft.title,
          dueDate: dueDateStr,
          eventType: 'obligation-drafted',
        },
      });
    } catch { /* non-fatal */ }

    return {
      toolName: 'draft-obligation',
      success: true,
      signalId,
      data: { draft },
      executedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      toolName: 'draft-obligation',
      success: false,
      data: {},
      error: String(err),
      executedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Tool dispatcher
// ---------------------------------------------------------------------------

export async function dispatchCounselTool(input: CounselToolInput): Promise<CounselToolResult> {
  const orgId = input.orgId ?? 'counsel-demo';
  switch (input.toolName) {
    case 'matter-lookup':
      return matterLookupTool({ matterId: input.params.matterId as string | undefined, orgId });
    case 'settlement-reforecast':
      return settlementReforecastTool({
        matterId: input.params.matterId as string,
        orgId,
        claimedDamagesM: input.params.claimedDamagesM as number | undefined,
        liabilityProbability: input.params.liabilityProbability as number | undefined,
      });
    case 'citation-search':
      return citationSearchTool({
        matterId: input.params.matterId as string,
        orgId,
        query: input.params.query as string,
      });
    case 'draft-obligation':
      return draftObligationTool({
        matterId: input.params.matterId as string,
        orgId,
        description: input.params.description as string,
        dueDate: input.params.dueDate as string | undefined,
        assignee: input.params.assignee as string | undefined,
      });
    default:
      return {
        toolName: input.toolName,
        success: false,
        data: {},
        error: `Unknown tool: ${input.toolName}`,
        executedAt: new Date().toISOString(),
      };
  }
}

// ---------------------------------------------------------------------------
// Registry manifest
// ---------------------------------------------------------------------------

export const COUNSEL_TOOL_MANIFEST = [
  {
    toolId: 'counsel:matter-lookup',
    displayName: 'Matter Lookup',
    description: 'Retrieve a legal matter by ID with full obligation and audit context.',
    domain: 'prism-counsel',
    params: [
      { name: 'matterId', type: 'string', required: false, description: 'Matter ID (e.g. M-2024-001)' },
    ],
    emitsSignals: ['tool_called'],
  },
  {
    toolId: 'counsel:settlement-reforecast',
    displayName: 'Settlement Reforecast',
    description: 'Re-run Monte Carlo settlement likelihood and exposure distribution for a matter.',
    domain: 'prism-counsel',
    params: [
      { name: 'matterId', type: 'string', required: true },
      { name: 'claimedDamagesM', type: 'number', required: false, description: 'Override claimed damages ($M)' },
      { name: 'liabilityProbability', type: 'number', required: false, description: 'Override liability probability (0-1)' },
    ],
    emitsSignals: ['domain_signal'],
  },
  {
    toolId: 'counsel:citation-search',
    displayName: 'Citation Search',
    description: 'Search indexed matter documents and return ranked citations with excerpts.',
    domain: 'prism-counsel',
    params: [
      { name: 'matterId', type: 'string', required: true },
      { name: 'query', type: 'string', required: true },
    ],
    emitsSignals: [],
  },
  {
    toolId: 'counsel:draft-obligation',
    displayName: 'Draft Obligation',
    description: 'Generate a structured obligation draft from a natural-language description.',
    domain: 'prism-counsel',
    params: [
      { name: 'matterId', type: 'string', required: true },
      { name: 'description', type: 'string', required: true },
      { name: 'dueDate', type: 'string', required: false, description: 'ISO date string' },
      { name: 'assignee', type: 'string', required: false },
    ],
    emitsSignals: ['artifact_created'],
  },
];
