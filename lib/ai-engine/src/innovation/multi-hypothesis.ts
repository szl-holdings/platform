/**
 * Multi-Hypothesis Reasoning Engine
 *
 * For ambiguous or high-stakes queries, each agent generates 2-3 competing
 * hypotheses instead of a single answer. The orchestrator clusters hypotheses
 * by similarity, ranks by evidence strength and cross-agent agreement, and
 * presents the top hypotheses with supporting and contradicting evidence.
 */
import { openai } from '../providers/openai/index.js';
import type { AgentCallResult } from '../types.js';

export interface Hypothesis {
  id: string;
  agentId: string;
  agentName: string;
  domain: string;
  statement: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
  confidence: number;
  likelihood: 'high' | 'medium' | 'low';
}

export interface HypothesisCluster {
  clusterId: string;
  theme: string;
  hypotheses: Hypothesis[];
  aggregateConfidence: number;
  agentConsensusCount: number;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  rank: number;
}

export interface MultiHypothesisResult {
  query: string;
  clusters: HypothesisCluster[];
  recommendation: string;
  isAmbiguous: boolean;
  hypothesisCount: number;
}

const AMBIGUITY_SIGNALS = [
  /\bcould\b|\bpossibly\b|\bperhaps\b|\buncertain\b|\bunknown\b/i,
  /\bor\b.*\bor\b/i,
  /what.*if|how.*would|should.*we/i,
  /risk|threat|scenario|impact/i,
  /vs\b|versus|compare|alternative/i,
];

const HIGH_STAKES_SIGNALS = [
  /breach|incident|crisis|emergency|critical/i,
  /litigation|regulatory|violation|penalty/i,
  /portfolio risk|liquidity|capital/i,
  /sanctions|embargo/i,
  /title defect|zoning|deal risk/i,
];

export function isAmbiguousOrHighStakes(query: string): boolean {
  const lower = query.toLowerCase();
  const ambiguityScore = AMBIGUITY_SIGNALS.filter((p) => p.test(lower)).length;
  const highStakesScore = HIGH_STAKES_SIGNALS.filter((p) => p.test(lower)).length;
  return ambiguityScore >= 2 || highStakesScore >= 1;
}

export async function extractHypothesesFromAgent(
  agentId: string,
  agentName: string,
  domain: string,
  agentResponse: string,
  query: string,
): Promise<Hypothesis[]> {
  try {
    const extractionPrompt = `You are analyzing an agent response to extract distinct hypotheses.

## Agent: ${agentName} (${domain})
## Original Query: ${query}
## Agent Response:
${agentResponse.slice(0, 2000)}

Extract 2-3 competing hypotheses or interpretations from this response. For each hypothesis:
1. State it clearly and concisely (1-2 sentences)
2. List 1-3 pieces of supporting evidence from the response
3. List 1-2 pieces of contradicting evidence or caveats
4. Assign confidence (0-100) and likelihood (high/medium/low)

Respond ONLY with valid JSON array:
[
  {
    "statement": "...",
    "evidenceFor": ["...", "..."],
    "evidenceAgainst": ["..."],
    "confidence": 80,
    "likelihood": "high"
  }
]`;

    const result = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 1024,
      messages: [{ role: 'user', content: extractionPrompt }],
      response_format: { type: 'json_object' },
    });

    const raw = result.choices[0]?.message?.content ?? '{}';
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }

    const arr = Array.isArray(parsed)
      ? parsed
      : ((parsed as Record<string, unknown>).hypotheses ?? []);
    if (!Array.isArray(arr)) return [];

    return arr
      .slice(0, 3)
      .map((h: Record<string, unknown>, idx: number) => ({
        id: `hyp-${agentId}-${Date.now()}-${idx}`,
        agentId,
        agentName,
        domain,
        statement: String(h.statement ?? ''),
        evidenceFor: Array.isArray(h.evidenceFor) ? h.evidenceFor.map(String) : [],
        evidenceAgainst: Array.isArray(h.evidenceAgainst) ? h.evidenceAgainst.map(String) : [],
        confidence: Number(h.confidence ?? 70),
        likelihood: (['high', 'medium', 'low'].includes(String(h.likelihood))
          ? h.likelihood
          : 'medium') as Hypothesis['likelihood'],
      }))
      .filter((h) => h.statement.length > 10);
  } catch {
    return [];
  }
}

function computeSemanticSimilarity(a: string, b: string): number {
  const aWords = new Set(
    a
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 4),
  );
  const bWords = new Set(
    b
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 4),
  );
  const intersection = [...aWords].filter((w) => bWords.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;
  return union > 0 ? intersection / union : 0;
}

function clusterHypotheses(hypotheses: Hypothesis[]): HypothesisCluster[] {
  const clusters: HypothesisCluster[] = [];
  const assigned = new Set<string>();

  for (const hyp of hypotheses) {
    if (assigned.has(hyp.id)) continue;

    const cluster: Hypothesis[] = [hyp];
    assigned.add(hyp.id);

    for (const other of hypotheses) {
      if (assigned.has(other.id)) continue;
      const similarity = computeSemanticSimilarity(hyp.statement, other.statement);
      if (similarity >= 0.25) {
        cluster.push(other);
        assigned.add(other.id);
      }
    }

    const allEvFor = cluster.flatMap((h) => h.evidenceFor);
    const allEvAgainst = cluster.flatMap((h) => h.evidenceAgainst);
    const uniqueDomains = new Set(cluster.map((h) => h.domain));
    const avgConfidence = cluster.reduce((sum, h) => sum + h.confidence, 0) / cluster.length;

    const themeWords = cluster[0]?.statement
      .split(/\W+/)
      .filter((w) => w.length > 5)
      .slice(0, 3)
      .join(' ');

    clusters.push({
      clusterId: `cluster-${clusters.length + 1}`,
      theme: themeWords || cluster[0]?.statement.slice(0, 60),
      hypotheses: cluster.sort((a, b) => b.confidence - a.confidence),
      aggregateConfidence: Math.round(avgConfidence),
      agentConsensusCount: uniqueDomains.size,
      supportingEvidence: [...new Set(allEvFor)].slice(0, 4),
      contradictingEvidence: [...new Set(allEvAgainst)].slice(0, 3),
      rank: 0,
    });
  }

  clusters.sort((a, b) => {
    const scoreA =
      a.aggregateConfidence * 0.5 +
      a.agentConsensusCount * 10 * 0.3 +
      a.hypotheses.length * 5 * 0.2;
    const scoreB =
      b.aggregateConfidence * 0.5 +
      b.agentConsensusCount * 10 * 0.3 +
      b.hypotheses.length * 5 * 0.2;
    return scoreB - scoreA;
  });

  clusters.forEach((c, i) => {
    c.rank = i + 1;
  });

  return clusters.slice(0, 3);
}

export async function runMultiHypothesisReasoning(
  query: string,
  agentResponses: AgentCallResult[],
): Promise<MultiHypothesisResult | null> {
  if (!isAmbiguousOrHighStakes(query) || agentResponses.length < 2) return null;

  try {
    const allHypotheses: Hypothesis[] = [];

    await Promise.all(
      agentResponses.slice(0, 4).map(async (r) => {
        const hyps = await extractHypothesesFromAgent(
          r.agentId,
          r.agentName,
          r.domain,
          r.response,
          query,
        );
        allHypotheses.push(...hyps);
      }),
    );

    if (allHypotheses.length < 2) return null;

    const clusters = clusterHypotheses(allHypotheses);
    if (clusters.length === 0) return null;

    const topCluster = clusters[0]!;
    const recommendation = `Primary hypothesis (${topCluster.aggregateConfidence}% confidence, ${topCluster.agentConsensusCount} domain${topCluster.agentConsensusCount !== 1 ? 's' : ''} agree): ${topCluster.hypotheses[0]?.statement ?? topCluster.theme}`;

    try {
      const { db, multiHypothesisSessionsTable } = await import('@szl-holdings/db');
      await db.insert(multiHypothesisSessionsTable).values({
        query: query.slice(0, 500),
        hypothesisCount: allHypotheses.length,
        clusterCount: clusters.length,
        topCluster: clusters[0] as unknown as Record<string, unknown>,
        allClusters: clusters as unknown as Record<string, unknown>,
        recommendation,
      });
    } catch {}

    return {
      query,
      clusters,
      recommendation,
      isAmbiguous: true,
      hypothesisCount: allHypotheses.length,
    };
  } catch (_err) {
    return null;
  }
}
