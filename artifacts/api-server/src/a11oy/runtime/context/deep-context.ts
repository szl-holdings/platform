import type { ContextPack, ContextSource, Citation } from '../types.js';
import { store_query } from '../memory/store.js';
import { randomUUID } from 'node:crypto';

const SENSITIVE_KEYS = ['ssn', 'password', 'secret', 'api_key', 'token', 'credential', 'bearer'];
const EVIDENCE_BUDGET = 10;
const STALE_FRESHNESS_THRESHOLD = 0.5;
const LOW_COVERAGE_THRESHOLD = 0.6;

function rankSources(sources: ContextSource[]): ContextSource[] {
  return sources
    .map((s, i) => ({ ...s, rank: i }))
    .sort((a, b) => {
      const freshScore = b.freshness - a.freshness;
      const kindWeight: Record<string, number> = { proof: 3, signal: 2, policy: 1, outcome: 1, memory: 0 };
      return freshScore !== 0 ? freshScore : (kindWeight[b.kind] ?? 0) - (kindWeight[a.kind] ?? 0);
    })
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

function buildCitation(source: ContextSource): Citation {
  const contentStr = JSON.stringify(source.content).slice(0, 200);
  return {
    citationId: `cit-${randomUUID().slice(0, 8)}`,
    sourceId: source.sourceId,
    excerpt: contentStr,
    confidence: source.freshness,
    freshness: source.freshness,
  };
}

function redactSensitive(content: Record<string, unknown>): { redacted: Record<string, unknown>; fields: string[] } {
  const result: Record<string, unknown> = {};
  const redactedFields: string[] = [];
  for (const [k, v] of Object.entries(content)) {
    if (SENSITIVE_KEYS.some((sk) => k.toLowerCase().includes(sk))) {
      result[k] = '[REDACTED]';
      redactedFields.push(k);
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      const child = redactSensitive(v as Record<string, unknown>);
      result[k] = child.redacted;
      redactedFields.push(...child.fields.map((f) => `${k}.${f}`));
    } else {
      result[k] = v;
    }
  }
  return { redacted: result, fields: redactedFields };
}

export interface ContextBuildInput {
  signalIds: string[];
  vertical?: string;
  entityId?: string;
  additionalSources?: ContextSource[];
  signals?: Record<string, unknown>[];
  outcomes?: Record<string, unknown>[];
  policies?: Record<string, unknown>[];
  proofPackets?: Record<string, unknown>[];
}

export function buildContextPack(input: ContextBuildInput): ContextPack {
  const sources: ContextSource[] = [];
  const allRedactedFields: string[] = [];

  const memoryEntries = store_query({
    vertical: input.vertical,
    entityId: input.entityId,
    minFreshness: 0.2,
    limit: 20,
  });

  for (const entry of memoryEntries) {
    const { redacted, fields } = redactSensitive(entry.content);
    allRedactedFields.push(...fields);
    sources.push({
      sourceId: `mem:${entry.memoryId}`,
      kind: 'memory',
      content: redacted,
      rank: 0,
      freshness: entry.freshnessScore,
      isSensitive: entry.isSensitive,
    });
  }

  if (input.signals) {
    for (const sig of input.signals) {
      sources.push({
        sourceId: `sig:${(sig as { id?: string }).id ?? randomUUID().slice(0, 8)}`,
        kind: 'signal',
        content: sig,
        rank: 0,
        freshness: 1,
        isSensitive: false,
      });
    }
  }

  if (input.outcomes) {
    for (const out of input.outcomes) {
      sources.push({
        sourceId: `outcome:${(out as { id?: string }).id ?? randomUUID().slice(0, 8)}`,
        kind: 'outcome',
        content: out,
        rank: 0,
        freshness: 0.9,
        isSensitive: false,
      });
    }
  }

  if (input.policies) {
    for (const pol of input.policies) {
      sources.push({
        sourceId: `pol:${(pol as { id?: string }).id ?? randomUUID().slice(0, 8)}`,
        kind: 'policy',
        content: pol,
        rank: 0,
        freshness: 1,
        isSensitive: false,
      });
    }
  }

  if (input.proofPackets) {
    for (const pkt of input.proofPackets) {
      sources.push({
        sourceId: `proof:${(pkt as { id?: string }).id ?? randomUUID().slice(0, 8)}`,
        kind: 'proof',
        content: pkt,
        rank: 0,
        freshness: 0.95,
        isSensitive: false,
      });
    }
  }

  if (input.additionalSources) {
    sources.push(...input.additionalSources);
  }

  const ranked = rankSources(sources);
  const budgeted = ranked.slice(0, EVIDENCE_BUDGET);

  const staleFields = budgeted
    .filter((s) => s.freshness < STALE_FRESHNESS_THRESHOLD)
    .map((s) => s.sourceId);

  const citations: Citation[] = budgeted.map(buildCitation);

  const evidenceCoverage = Math.min(1, budgeted.length / EVIDENCE_BUDGET);

  return {
    packId: `ctx-${randomUUID().slice(0, 8)}`,
    signalIds: input.signalIds,
    citations,
    sources: budgeted,
    evidenceBudget: EVIDENCE_BUDGET,
    evidenceUsed: budgeted.length,
    staleFields,
    redactedFields: allRedactedFields,
    builtAt: new Date().toISOString(),
  };
}

export function checkEvidenceRequirement(pack: ContextPack): {
  sufficient: boolean;
  coverage: number;
  reason?: string;
} {
  const coverage = pack.evidenceUsed / Math.max(pack.evidenceBudget, 1);
  if (coverage < LOW_COVERAGE_THRESHOLD) {
    return {
      sufficient: false,
      coverage,
      reason: `Evidence coverage ${Math.round(coverage * 100)}% is below the ${Math.round(LOW_COVERAGE_THRESHOLD * 100)}% threshold required for PCE.`,
    };
  }
  if (pack.staleFields.length > pack.evidenceUsed * 0.5) {
    return {
      sufficient: false,
      coverage,
      reason: `Majority of evidence sources are stale (${pack.staleFields.length}/${pack.evidenceUsed}). Refresh context before proceeding.`,
    };
  }
  return { sufficient: true, coverage };
}

export function computeCoverage(pack: ContextPack): number {
  return Math.min(1, pack.evidenceUsed / Math.max(pack.evidenceBudget, 1));
}
