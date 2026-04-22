/**
 * Predictive Pre-Computation Engine
 *
 * After each orchestration run, predicts the 2-3 most likely follow-up queries
 * based on query pattern + domain context + conversation history.
 * Triggers lightweight agent pre-computation for those queries in the background.
 * Caches results with a short TTL. When a matching query arrives,
 * serves the pre-computed result instantly and marks it as "pre-computed".
 */
import { openai } from '../providers/openai/index.js';
import type { AgentCallResult } from '../types.js';

const CACHE_TTL_MS = 15 * 60 * 1000;

interface PredictedFollowUp {
  query: string;
  likelihood: number;
  domains: string[];
  rationale: string;
}

interface PrecomputeEntry {
  cacheKey: string;
  originalQuery: string;
  predictedQuery: string;
  synthesis: string;
  agentResponses: AgentCallResult[];
  computedAt: number;
  expiresAt: number;
  hitCount: number;
}

const precomputeMemoryCache = new Map<string, PrecomputeEntry>();

function normalizeCacheKey(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .sort()
    .join('_')
    .slice(0, 80);
}

export async function predictFollowUpQueries(
  originalQuery: string,
  agentResponses: AgentCallResult[],
  synthesis: string,
): Promise<PredictedFollowUp[]> {
  try {
    const domainsSeen = [...new Set(agentResponses.map((r) => r.domain))].join(', ');
    const synthesisSlice = synthesis.slice(0, 800);

    const predictionPrompt = `You are predicting follow-up queries an operator would ask after receiving this intelligence briefing.

## Original Query
${originalQuery.slice(0, 300)}

## Domains Covered
${domainsSeen}

## Intelligence Synthesis (excerpt)
${synthesisSlice}

Based on the query pattern and synthesis content, predict the 2-3 most likely follow-up questions the operator would ask next.

Respond with JSON:
{
  "predictions": [
    {
      "query": "The exact follow-up question",
      "likelihood": 0.85,
      "domains": ["maritime", "legal"],
      "rationale": "Why this follow-up is likely"
    }
  ]
}`;

    const result = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 512,
      messages: [{ role: 'user', content: predictionPrompt }],
      response_format: { type: 'json_object' },
    });

    const raw = result.choices[0]?.message?.content ?? '{}';
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return [];
    }

    const preds = Array.isArray(parsed.predictions) ? parsed.predictions : [];
    return preds
      .slice(0, 3)
      .map((p: Record<string, unknown>) => ({
        query: String(p.query ?? ''),
        likelihood: Math.min(1, Math.max(0, Number(p.likelihood ?? 0.5))),
        domains: Array.isArray(p.domains) ? p.domains.map(String) : [],
        rationale: String(p.rationale ?? ''),
      }))
      .filter((p) => p.query.length > 10);
  } catch {
    return [];
  }
}

export async function triggerBackgroundPrecompute(
  originalQuery: string,
  predictions: PredictedFollowUp[],
  orgId?: number | null,
): Promise<void> {
  const { nuroMeshOrchestrator } = await import('../nuro-mesh.js');

  for (const prediction of predictions.slice(0, 2)) {
    const cacheKey = normalizeCacheKey(prediction.query);

    if (precomputeMemoryCache.has(cacheKey)) continue;

    void (async () => {
      try {
        const result = await nuroMeshOrchestrator.orchestrate(prediction.query, {
          orgId: orgId ?? null,
          enableConsultations: false,
        });

        const entry: PrecomputeEntry = {
          cacheKey,
          originalQuery,
          predictedQuery: prediction.query,
          synthesis: result.synthesis,
          agentResponses: result.agentResponses,
          computedAt: Date.now(),
          expiresAt: Date.now() + CACHE_TTL_MS,
          hitCount: 0,
        };

        precomputeMemoryCache.set(cacheKey, entry);

        try {
          const { db, predictivePrecomputeCacheTable } = await import('@szl-holdings/db');
          await db.insert(predictivePrecomputeCacheTable).values({
            cacheKey,
            originalQuery: originalQuery.slice(0, 500),
            predictedQuery: prediction.query.slice(0, 500),
            likelihood: Math.round(prediction.likelihood * 100),
            domains: prediction.domains,
            synthesis: result.synthesis.slice(0, 4000),
            agentCount: result.agentResponses.length,
            avgConfidence: result.averageConfidence,
            expiresAt: new Date(entry.expiresAt),
          });
        } catch {}
      } catch (_err) {
      }
    })();
  }
}

export function checkPrecomputeCache(query: string): PrecomputeEntry | null {
  const cacheKey = normalizeCacheKey(query);
  const now = Date.now();

  const entry = precomputeMemoryCache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt < now) {
    precomputeMemoryCache.delete(cacheKey);
    return null;
  }

  entry.hitCount++;
  return entry;
}

export function evictExpiredPrecompute(): void {
  const now = Date.now();
  for (const [key, entry] of precomputeMemoryCache) {
    if (entry.expiresAt < now) precomputeMemoryCache.delete(key);
  }
}

export function getPrecomputeCacheStats() {
  evictExpiredPrecompute();
  const entries = [...precomputeMemoryCache.values()];
  return {
    cacheSize: entries.length,
    totalHits: entries.reduce((sum, e) => sum + e.hitCount, 0),
    entries: entries.map((e) => ({
      predictedQuery: e.predictedQuery.slice(0, 100),
      computedAt: new Date(e.computedAt).toISOString(),
      expiresAt: new Date(e.expiresAt).toISOString(),
      hitCount: e.hitCount,
    })),
  };
}
