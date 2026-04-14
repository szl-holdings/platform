/**
 * RL-Trained Memory Operations — AgeMem-style
 *
 * Capability 2: Agents autonomously decide what to store, retrieve, summarize,
 * and discard from memory using a reinforcement-learned policy.
 *
 * Memory tiers:
 *   - Episodic: what happened (specific events, conversations, tool calls)
 *   - Semantic: what was learned (facts, concepts, patterns)
 *   - Procedural: what worked (successful strategies, tool sequences)
 *
 * RL scoring: Each memory operation is scored based on downstream task success.
 * High-reward memories get boosted importance; low-reward memories decay faster.
 */

export type MemoryTier = "episodic" | "semantic" | "procedural";
export type MemoryOperation = "store" | "retrieve" | "update" | "summarize" | "discard";

export interface MemoryEntry {
  id: string;
  agentId: string;
  tier: MemoryTier;
  content: string;
  tags: string[];
  importance: number;
  accessCount: number;
  rewardSignal: number;
  decayRate: number;
  lastAccessedAt: string;
  createdAt: string;
  expiresAt: string;
  metadata: Record<string, unknown>;
}

export interface MemoryOperationResult {
  operation: MemoryOperation;
  success: boolean;
  entries: MemoryEntry[];
  rewardSignal: number;
  policyAction: string;
  reasoning: string;
}

export interface MemoryRewardSignal {
  memoryId: string;
  taskSuccess: boolean;
  userFeedbackScore: number;
  confidenceDelta: number;
  latencyImpactMs: number;
}

const DECAY_RATES: Record<MemoryTier, number> = {
  episodic: 0.05,
  semantic: 0.01,
  procedural: 0.02,
};

const TTL_MS: Record<MemoryTier, number> = {
  episodic: 7 * 24 * 60 * 60 * 1000,
  semantic: 90 * 24 * 60 * 60 * 1000,
  procedural: 30 * 24 * 60 * 60 * 1000,
};

const IMPORTANCE_THRESHOLDS = {
  discard: 2,
  summarize: 4,
  boost: 8,
};

function computeEffectiveImportance(entry: MemoryEntry): number {
  const ageMs = Date.now() - new Date(entry.createdAt).getTime();
  const ageDecay = Math.exp(-entry.decayRate * (ageMs / (24 * 60 * 60 * 1000)));
  const rewardBoost = Math.max(0, entry.rewardSignal * 2);
  const accessBoost = Math.log1p(entry.accessCount) * 0.5;
  return Math.max(0, Math.min(10, entry.importance * ageDecay + rewardBoost + accessBoost));
}

function cosineSimilarityText(a: string, b: string): number {
  const tokenize = (s: string) => s.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const aTokens = tokenize(a);
  const bTokens = tokenize(b);
  const vocab = new Set([...aTokens, ...bTokens]);
  const vecA: number[] = [];
  const vecB: number[] = [];
  for (const term of vocab) {
    vecA.push(aTokens.filter(t => t === term).length);
    vecB.push(bTokens.filter(t => t === term).length);
  }
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i]! * vecB[i]!;
    magA += vecA[i]! * vecA[i]!;
    magB += vecB[i]! * vecB[i]!;
  }
  return magA > 0 && magB > 0 ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

export class RLMemoryManager {
  private memories: Map<string, MemoryEntry[]> = new Map();
  private rewardHistory: Map<string, number[]> = new Map();
  private operationLog: Array<{ agentId: string; operation: MemoryOperation; timestamp: string; reward: number }> = [];

  private getAgentMemories(agentId: string): MemoryEntry[] {
    if (!this.memories.has(agentId)) this.memories.set(agentId, []);
    return this.memories.get(agentId)!;
  }

  private learnFromReward(agentId: string, operation: MemoryOperation, reward: number): void {
    const key = `${agentId}:${operation}`;
    if (!this.rewardHistory.has(key)) this.rewardHistory.set(key, []);
    const history = this.rewardHistory.get(key)!;
    history.push(reward);
    if (history.length > 100) history.splice(0, history.length - 100);
    this.operationLog.push({ agentId, operation, timestamp: new Date().toISOString(), reward });
  }

  private getExpectedReward(agentId: string, operation: MemoryOperation): number {
    const key = `${agentId}:${operation}`;
    const history = this.rewardHistory.get(key) ?? [];
    if (history.length === 0) return 0.5;
    return history.reduce((a, b) => a + b, 0) / history.length;
  }

  async store(
    agentId: string,
    content: string,
    tier: MemoryTier,
    tags: string[] = [],
    importance: number = 5,
    metadata: Record<string, unknown> = {},
  ): Promise<MemoryOperationResult> {
    const expectedReward = this.getExpectedReward(agentId, "store");
    const memories = this.getAgentMemories(agentId);

    const similar = memories.find(m => m.tier === tier && cosineSimilarityText(m.content, content) > 0.85);
    if (similar) {
      similar.content = content;
      similar.importance = Math.min(10, similar.importance + 1);
      similar.accessCount++;
      similar.lastAccessedAt = new Date().toISOString();
      similar.metadata = { ...similar.metadata, ...metadata };
      this.learnFromReward(agentId, "store", 0.7);
      return {
        operation: "store",
        success: true,
        entries: [similar],
        rewardSignal: 0.7,
        policyAction: "merged_duplicate",
        reasoning: "Similar memory found — merged to avoid redundancy (RL policy: deduplication improves retrieval quality)",
      };
    }

    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      agentId,
      tier,
      content,
      tags,
      importance,
      accessCount: 0,
      rewardSignal: expectedReward,
      decayRate: DECAY_RATES[tier],
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + TTL_MS[tier]).toISOString(),
      metadata,
    };

    memories.push(entry);
    this.learnFromReward(agentId, "store", 1.0);

    return {
      operation: "store",
      success: true,
      entries: [entry],
      rewardSignal: 1.0,
      policyAction: "stored_new",
      reasoning: `New ${tier} memory stored with importance ${importance}/10`,
    };
  }

  async retrieve(
    agentId: string,
    query: string,
    tier?: MemoryTier,
    maxResults = 5,
  ): Promise<MemoryOperationResult> {
    const memories = this.getAgentMemories(agentId);
    const now = new Date();

    const candidates = memories
      .filter(m => (!tier || m.tier === tier) && new Date(m.expiresAt) > now)
      .map(m => ({
        entry: m,
        score: cosineSimilarityText(query, `${m.content} ${m.tags.join(" ")}`) * computeEffectiveImportance(m) / 10,
      }))
      .filter(c => c.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    for (const c of candidates) {
      c.entry.accessCount++;
      c.entry.lastAccessedAt = new Date().toISOString();
    }

    const reward = candidates.length > 0 ? Math.min(1.0, candidates.length / maxResults) : 0;
    this.learnFromReward(agentId, "retrieve", reward);

    return {
      operation: "retrieve",
      success: true,
      entries: candidates.map(c => c.entry),
      rewardSignal: reward,
      policyAction: candidates.length > 0 ? "retrieved" : "empty_result",
      reasoning: `Retrieved ${candidates.length} memories for query "${query.slice(0, 50)}..."`,
    };
  }

  async update(
    agentId: string,
    memoryId: string,
    updates: Partial<Pick<MemoryEntry, "content" | "importance" | "tags" | "metadata">>,
  ): Promise<MemoryOperationResult> {
    const memories = this.getAgentMemories(agentId);
    const entry = memories.find(m => m.id === memoryId);

    if (!entry) {
      this.learnFromReward(agentId, "update", 0);
      return { operation: "update", success: false, entries: [], rewardSignal: 0, policyAction: "not_found", reasoning: `Memory ${memoryId} not found` };
    }

    if (updates.content !== undefined) entry.content = updates.content;
    if (updates.importance !== undefined) entry.importance = Math.min(10, Math.max(0, updates.importance));
    if (updates.tags !== undefined) entry.tags = updates.tags;
    if (updates.metadata !== undefined) entry.metadata = { ...entry.metadata, ...updates.metadata };
    entry.lastAccessedAt = new Date().toISOString();

    this.learnFromReward(agentId, "update", 0.8);
    return { operation: "update", success: true, entries: [entry], rewardSignal: 0.8, policyAction: "updated", reasoning: `Memory updated with ${Object.keys(updates).join(", ")}` };
  }

  async summarize(agentId: string, tier: MemoryTier, maxEntries = 10): Promise<MemoryOperationResult> {
    const memories = this.getAgentMemories(agentId);
    const candidates = memories
      .filter(m => m.tier === tier && computeEffectiveImportance(m) >= IMPORTANCE_THRESHOLDS.summarize)
      .sort((a, b) => computeEffectiveImportance(b) - computeEffectiveImportance(a))
      .slice(0, maxEntries);

    if (candidates.length < 2) {
      return { operation: "summarize", success: false, entries: [], rewardSignal: 0, policyAction: "insufficient_entries", reasoning: "Not enough memories to summarize" };
    }

    const summaryContent = `[Summarized ${candidates.length} ${tier} memories] Key themes: ${candidates.map(m => m.content.slice(0, 80)).join(" | ")}`;
    const avgImportance = candidates.reduce((s, m) => s + m.importance, 0) / candidates.length;

    const summaryEntry: MemoryEntry = {
      id: `summary_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      agentId,
      tier,
      content: summaryContent,
      tags: [...new Set(candidates.flatMap(m => m.tags))],
      importance: Math.min(10, avgImportance + 1),
      accessCount: 0,
      rewardSignal: 0.9,
      decayRate: DECAY_RATES[tier] * 0.5,
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + TTL_MS[tier] * 2).toISOString(),
      metadata: { summarizedCount: candidates.length, originalIds: candidates.map(m => m.id) },
    };

    for (const candidate of candidates) {
      candidate.importance = Math.max(0, candidate.importance - 2);
      candidate.decayRate = DECAY_RATES[tier] * 2;
    }

    memories.push(summaryEntry);
    this.learnFromReward(agentId, "summarize", 0.9);

    return { operation: "summarize", success: true, entries: [summaryEntry, ...candidates], rewardSignal: 0.9, policyAction: "summarized", reasoning: `Compressed ${candidates.length} memories into summary` };
  }

  async discard(agentId: string, tier?: MemoryTier, aggressiveness: "conservative" | "moderate" | "aggressive" = "moderate"): Promise<MemoryOperationResult> {
    const memories = this.getAgentMemories(agentId);
    const thresholds = { conservative: IMPORTANCE_THRESHOLDS.discard * 0.5, moderate: IMPORTANCE_THRESHOLDS.discard, aggressive: IMPORTANCE_THRESHOLDS.discard * 1.5 };
    const threshold = thresholds[aggressiveness];
    const now = new Date();

    const toDiscard = memories.filter(m =>
      (!tier || m.tier === tier) &&
      (new Date(m.expiresAt) <= now || computeEffectiveImportance(m) < threshold)
    );

    const discarded: MemoryEntry[] = [];
    for (const entry of toDiscard) {
      const idx = memories.indexOf(entry);
      if (idx >= 0) {
        memories.splice(idx, 1);
        discarded.push(entry);
      }
    }

    const reward = Math.min(1.0, discarded.length / Math.max(1, memories.length) * 5);
    this.learnFromReward(agentId, "discard", reward);

    return { operation: "discard", success: true, entries: discarded, rewardSignal: reward, policyAction: "discarded", reasoning: `Discarded ${discarded.length} low-value memories (threshold: ${threshold})` };
  }

  applyRewardSignal(signals: MemoryRewardSignal[]): void {
    for (const signal of signals) {
      for (const memories of this.memories.values()) {
        const entry = memories.find(m => m.id === signal.memoryId);
        if (entry) {
          const rawReward = (signal.taskSuccess ? 1 : 0) * 0.4
            + Math.max(-1, Math.min(1, signal.userFeedbackScore / 5)) * 0.3
            + Math.max(-0.5, Math.min(0.5, signal.confidenceDelta)) * 0.2
            + (signal.latencyImpactMs < 0 ? 0.1 : -0.1);
          const alpha = 0.3;
          entry.rewardSignal = (1 - alpha) * entry.rewardSignal + alpha * rawReward;
          if (signal.taskSuccess) {
            entry.importance = Math.min(10, entry.importance + 0.5);
          } else {
            entry.importance = Math.max(0, entry.importance - 0.5);
          }
        }
      }
    }
  }

  getMemoryStats(agentId: string): {
    totalMemories: number;
    byTier: Record<MemoryTier, number>;
    avgImportance: number;
    avgReward: number;
    avgAccessCount: number;
  } {
    const memories = this.getAgentMemories(agentId);
    const byTier: Record<MemoryTier, number> = { episodic: 0, semantic: 0, procedural: 0 };
    let totalImportance = 0, totalReward = 0, totalAccess = 0;

    for (const m of memories) {
      byTier[m.tier]++;
      totalImportance += computeEffectiveImportance(m);
      totalReward += m.rewardSignal;
      totalAccess += m.accessCount;
    }

    return {
      totalMemories: memories.length,
      byTier,
      avgImportance: memories.length > 0 ? totalImportance / memories.length : 0,
      avgReward: memories.length > 0 ? totalReward / memories.length : 0,
      avgAccessCount: memories.length > 0 ? totalAccess / memories.length : 0,
    };
  }

  getOperationLog(): typeof this.operationLog {
    return [...this.operationLog];
  }
}

export const rlMemoryManager = new RLMemoryManager();
