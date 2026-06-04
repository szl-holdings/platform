import { randomUUID } from 'node:crypto';

export interface KnowledgeEntry {
  entryId: string;
  source: 'monologue' | 'dialectical' | 'socratic' | 'case_memory' | 'realization' | 'correction';
  content: string;
  domain: string;
  confidence: number;
  accessCount: number;
  createdAt: string;
  lastAccessedAt: string;
  supersededBy: string | null;
  mergedFrom: string[];
  tags: string[];
  version: number;
}

export interface ConsolidationResult {
  consolidationId: string;
  entriesBefore: number;
  entriesAfter: number;
  mergedCount: number;
  prunedCount: number;
  supersededCount: number;
  compressionRatio: number;
  knowledgeDensity: number;
  duration: string;
  timestamp: string;
}

export interface KnowledgeDensityMetric {
  totalEntries: number;
  activeEntries: number;
  supersededEntries: number;
  avgConfidence: number;
  avgVersion: number;
  insightsPerEntry: number;
  compressionHistory: Array<{ timestamp: string; ratio: number; entriesAfter: number }>;
  domainDistribution: Record<string, number>;
  healthScore: number;
}

const MAX_ENTRIES = 2000;
const SIMILARITY_THRESHOLD = 0.6;
const MIN_CONFIDENCE_TO_KEEP = 0.2;
const MAX_CONSOLIDATION_HISTORY = 50;

class SelfDistillingKnowledgeBase {
  private entries: KnowledgeEntry[] = [];
  private consolidationHistory: ConsolidationResult[] = [];

  addEntry(
    source: KnowledgeEntry['source'],
    content: string,
    domain: string,
    confidence: number,
    tags: string[] = [],
  ): KnowledgeEntry {
    const now = new Date().toISOString();
    const entry: KnowledgeEntry = {
      entryId: `ke_${randomUUID().slice(0, 12)}`,
      source,
      content: content.slice(0, 2000),
      domain,
      confidence: Math.max(0, Math.min(1, confidence)),
      accessCount: 0,
      createdAt: now,
      lastAccessedAt: now,
      supersededBy: null,
      mergedFrom: [],
      tags,
      version: 1,
    };

    this.entries.push(entry);
    this.enforceCapacity();
    return entry;
  }

  query(domain: string, tags: string[] = [], limit = 10): KnowledgeEntry[] {
    const active = this.entries.filter(e => !e.supersededBy);
    const scored = active.map(entry => {
      let score = entry.confidence * 0.3;
      if (entry.domain === domain) score += 0.3;
      const tagOverlap = tags.filter(t => entry.tags.includes(t)).length;
      score += tagOverlap * 0.15;
      const recency = 1 - Math.min(1, (Date.now() - new Date(entry.lastAccessedAt).getTime()) / (24 * 60 * 60 * 1000));
      score += recency * 0.1;
      score += Math.min(0.15, entry.version * 0.03);
      return { entry, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => {
        s.entry.accessCount++;
        s.entry.lastAccessedAt = new Date().toISOString();
        return s.entry;
      });
  }

  runConsolidationPass(): ConsolidationResult {
    const startMs = Date.now();
    const before = this.entries.length;
    let mergedCount = 0;
    let prunedCount = 0;
    let supersededCount = 0;

    prunedCount += this.pruneByConfidence();
    mergedCount += this.mergeSimilarEntries();
    supersededCount += this.markSuperseded();

    const after = this.entries.filter(e => !e.supersededBy).length;
    const compressionRatio = before > 0 ? after / before : 1;
    const density = this.computeDensity();

    const result: ConsolidationResult = {
      consolidationId: `con_${randomUUID().slice(0, 8)}`,
      entriesBefore: before,
      entriesAfter: after,
      mergedCount,
      prunedCount,
      supersededCount,
      compressionRatio,
      knowledgeDensity: density,
      duration: `${Date.now() - startMs}ms`,
      timestamp: new Date().toISOString(),
    };

    this.consolidationHistory.push(result);
    if (this.consolidationHistory.length > MAX_CONSOLIDATION_HISTORY) {
      this.consolidationHistory.splice(0, this.consolidationHistory.length - MAX_CONSOLIDATION_HISTORY);
    }

    return result;
  }

  getKnowledgeDensity(): KnowledgeDensityMetric {
    const active = this.entries.filter(e => !e.supersededBy);
    const superseded = this.entries.filter(e => e.supersededBy);

    const domainDist: Record<string, number> = {};
    for (const e of active) {
      domainDist[e.domain] = (domainDist[e.domain] ?? 0) + 1;
    }

    const avgConfidence = active.length > 0
      ? active.reduce((s, e) => s + e.confidence, 0) / active.length
      : 0;

    const avgVersion = active.length > 0
      ? active.reduce((s, e) => s + e.version, 0) / active.length
      : 1;

    const totalTags = active.reduce((s, e) => s + e.tags.length, 0);
    const insightsPerEntry = active.length > 0 ? totalTags / active.length : 0;

    const compressionHistory = this.consolidationHistory.map(c => ({
      timestamp: c.timestamp,
      ratio: c.compressionRatio,
      entriesAfter: c.entriesAfter,
    }));

    const healthScore = Math.min(1,
      avgConfidence * 0.3 +
      Math.min(1, avgVersion / 3) * 0.2 +
      Math.min(1, insightsPerEntry / 3) * 0.2 +
      (superseded.length > 0 ? 0.15 : 0) +
      (this.consolidationHistory.length > 0 ? 0.15 : 0)
    );

    return {
      totalEntries: this.entries.length,
      activeEntries: active.length,
      supersededEntries: superseded.length,
      avgConfidence,
      avgVersion,
      insightsPerEntry,
      compressionHistory,
      domainDistribution: domainDist,
      healthScore,
    };
  }

  getConsolidationHistory(): ConsolidationResult[] {
    return [...this.consolidationHistory];
  }

  getActiveEntries(limit = 50): KnowledgeEntry[] {
    return this.entries
      .filter(e => !e.supersededBy)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  private pruneByConfidence(): number {
    const before = this.entries.length;
    this.entries = this.entries.filter(e => {
      if (e.supersededBy) return true;
      if (e.confidence < MIN_CONFIDENCE_TO_KEEP && e.accessCount === 0) return false;
      return true;
    });
    return before - this.entries.length;
  }

  private mergeSimilarEntries(): number {
    let mergeCount = 0;
    const active = this.entries.filter(e => !e.supersededBy);

    for (let i = 0; i < active.length; i++) {
      const a = active[i]!;
      if (a.supersededBy) continue;

      for (let j = i + 1; j < active.length; j++) {
        const b = active[j]!;
        if (b.supersededBy) continue;
        if (a.domain !== b.domain) continue;

        const similarity = computeJaccardSimilarity(a.content, b.content);
        if (similarity >= SIMILARITY_THRESHOLD) {
          const merged = this.mergeEntries(a, b);
          if (merged) mergeCount++;
        }
      }
    }

    return mergeCount;
  }

  private mergeEntries(a: KnowledgeEntry, b: KnowledgeEntry): boolean {
    const winner = a.confidence >= b.confidence ? a : b;
    const loser = winner === a ? b : a;

    winner.content = winner.content.length >= loser.content.length
      ? winner.content
      : loser.content;
    winner.confidence = Math.max(a.confidence, b.confidence);
    winner.tags = [...new Set([...a.tags, ...b.tags])];
    winner.mergedFrom = [...winner.mergedFrom, loser.entryId, ...loser.mergedFrom];
    winner.version++;
    winner.lastAccessedAt = new Date().toISOString();
    winner.accessCount += loser.accessCount;

    loser.supersededBy = winner.entryId;
    return true;
  }

  private markSuperseded(): number {
    let count = 0;
    const byDomain = new Map<string, KnowledgeEntry[]>();

    for (const e of this.entries.filter(e => !e.supersededBy)) {
      const key = `${e.domain}:${e.source}`;
      if (!byDomain.has(key)) byDomain.set(key, []);
      byDomain.get(key)!.push(e);
    }

    for (const entries of byDomain.values()) {
      if (entries.length <= 5) continue;

      const sorted = entries.sort((a, b) => b.confidence - a.confidence);
      for (let i = 5; i < sorted.length; i++) {
        const entry = sorted[i]!;
        if (entry.accessCount > 3 || entry.version > 2) continue;
        if (entry.confidence < sorted[0]!.confidence * 0.5) {
          entry.supersededBy = sorted[0]!.entryId;
          count++;
        }
      }
    }

    return count;
  }

  private computeDensity(): number {
    const active = this.entries.filter(e => !e.supersededBy);
    if (active.length === 0) return 0;

    const totalInsightSignals = active.reduce((s, e) => {
      return s + e.tags.length + (e.version - 1) + e.mergedFrom.length;
    }, 0);

    return totalInsightSignals / active.length;
  }

  private enforceCapacity(): void {
    if (this.entries.length <= MAX_ENTRIES) return;
    this.entries = this.entries
      .filter(e => !e.supersededBy)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_ENTRIES);
  }
}

function computeJaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export const selfDistillingKB = new SelfDistillingKnowledgeBase();
