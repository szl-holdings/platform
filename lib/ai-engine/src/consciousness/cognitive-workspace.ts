export interface WorkingMemoryItem {
  id: string;
  content: string;
  source: string;
  priority: number;
  addedAt: string;
  lastAccessedAt: string;
  accessCount: number;
  decayRate: number;
  tags: string[];
}

export interface AttentionFocus {
  primaryTopic: string;
  secondaryTopics: string[];
  activeDomains: string[];
  contextWindowUsage: number;
  attentionDistribution: Record<string, number>;
}

export interface GWTBroadcast {
  broadcastId: string;
  winners: Array<{ itemId: string; salienceScore: number; content: string }>;
  losers: Array<{ itemId: string; salienceScore: number; reason: string }>;
  broadcastedTo: string[];
  timestamp: string;
}

export interface AttentionSchemaReport {
  reportId: string;
  allocationSummary: Record<string, number>;
  driftDetected: boolean;
  driftDescription: string | null;
  rebalanceRecommendation: string | null;
  timestamp: string;
}

export interface CognitiveWorkspaceState {
  workingMemory: WorkingMemoryItem[];
  attentionFocus: AttentionFocus;
  contextBudget: { used: number; total: number; utilization: number };
  activeGoals: string[];
  recentQueries: string[];
  sessionDepth: number;
  recentBroadcasts: GWTBroadcast[];
  attentionSchema: AttentionSchemaReport | null;
}

const MAX_WORKING_MEMORY = 50;
const CONTEXT_BUDGET_TOKENS = 16000;
const QUERY_HISTORY_SIZE = 20;
const DECAY_INTERVAL_MS = 60 * 1000;

class CognitiveWorkspace {
  private items: WorkingMemoryItem[] = [];
  private queryHistory: string[] = [];
  private activeGoals: string[] = [];
  private sessionDepth = 0;
  private lastDecayAt = Date.now();
  private broadcasts: GWTBroadcast[] = [];
  private latestAttentionSchema: AttentionSchemaReport | null = null;
  private static readonly MAX_BROADCASTS = 20;

  addToWorkingMemory(content: string, source: string, priority: number, tags: string[] = []): WorkingMemoryItem {
    const now = new Date().toISOString();
    const item: WorkingMemoryItem = {
      id: `wm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      content: content.slice(0, 2000),
      source,
      priority: Math.max(0, Math.min(10, priority)),
      addedAt: now,
      lastAccessedAt: now,
      accessCount: 0,
      decayRate: 0.05,
      tags,
    };

    this.items.push(item);
    this.enforceCapacity();
    return item;
  }

  recall(tags: string[], limit = 5): WorkingMemoryItem[] {
    this.runDecay();

    const scored = this.items.map(item => {
      const tagOverlap = tags.filter(t => item.tags.includes(t)).length;
      const recency = 1 - Math.min(1, (Date.now() - new Date(item.lastAccessedAt).getTime()) / (30 * 60 * 1000));
      const score = item.priority * 0.4 + tagOverlap * 0.35 + recency * 0.25;
      return { item, score };
    });

    const results = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => {
        s.item.lastAccessedAt = new Date().toISOString();
        s.item.accessCount++;
        return s.item;
      });

    return results;
  }

  recordQuery(query: string): void {
    this.queryHistory.push(query);
    if (this.queryHistory.length > QUERY_HISTORY_SIZE) {
      this.queryHistory.shift();
    }
    this.sessionDepth++;
  }

  setActiveGoals(goals: string[]): void {
    this.activeGoals = goals.slice(0, 10);
  }

  gwtBroadcast(input: {
    activeDomains: string[];
    emotionalArousal: number;
    urgencySignals: string[];
  }): GWTBroadcast {
    this.runDecay();

    const scored = this.items.map(item => {
      const recency = 1 - Math.min(1, (Date.now() - new Date(item.addedAt).getTime()) / (15 * 60 * 1000));
      const domainRelevance = item.tags.some(t => input.activeDomains.includes(t)) ? 1 : 0;
      const novelty = item.accessCount === 0 ? 1 : Math.max(0, 1 - item.accessCount * 0.15);
      const emotionalWeight = input.emotionalArousal;
      const urgencyBoost = input.urgencySignals.some(u =>
        item.content.toLowerCase().includes(u.toLowerCase())
      ) ? 0.3 : 0;

      const salience =
        item.priority / 10 * 0.25 +
        recency * 0.2 +
        domainRelevance * 0.2 +
        novelty * 0.15 +
        emotionalWeight * 0.1 +
        urgencyBoost;

      return { item, salience };
    });

    scored.sort((a, b) => b.salience - a.salience);

    const threshold = 0.4;
    const winners = scored
      .filter(s => s.salience >= threshold)
      .slice(0, 7)
      .map(s => ({
        itemId: s.item.id,
        salienceScore: Math.round(s.salience * 1000) / 1000,
        content: s.item.content.slice(0, 300),
      }));

    const losers = scored
      .filter(s => s.salience < threshold)
      .slice(0, 5)
      .map(s => ({
        itemId: s.item.id,
        salienceScore: Math.round(s.salience * 1000) / 1000,
        reason: s.salience < 0.2 ? "Below minimum salience" : "Lost competition to higher-priority items",
      }));

    for (const w of winners) {
      const item = this.items.find(i => i.id === w.itemId);
      if (item) {
        item.lastAccessedAt = new Date().toISOString();
        item.accessCount++;
      }
    }

    const broadcast: GWTBroadcast = {
      broadcastId: `gwt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      winners,
      losers,
      broadcastedTo: input.activeDomains,
      timestamp: new Date().toISOString(),
    };

    this.broadcasts.push(broadcast);
    if (this.broadcasts.length > CognitiveWorkspace.MAX_BROADCASTS) {
      this.broadcasts.splice(0, this.broadcasts.length - CognitiveWorkspace.MAX_BROADCASTS);
    }

    return broadcast;
  }

  buildGWTContext(broadcast: GWTBroadcast): string {
    if (broadcast.winners.length === 0) return "";
    const lines = [
      `## Global Workspace Broadcast (${broadcast.winners.length} items reached conscious access)`,
      ...broadcast.winners.map((w, i) =>
        `${i + 1}. [salience ${w.salienceScore.toFixed(2)}] ${w.content.slice(0, 200)}`
      ),
    ];
    return lines.join("\n");
  }

  reportAttentionSchema(queryDomains: string[]): AttentionSchemaReport {
    const focus = this.computeAttentionFocus();
    const allocation = focus.attentionDistribution;

    let driftDetected = false;
    let driftDescription: string | null = null;
    let rebalanceRecommendation: string | null = null;

    const queryDomainAttention = queryDomains.reduce((s, d) => s + (allocation[d] ?? 0), 0);
    const nonQueryAttention = 1 - queryDomainAttention;

    if (queryDomains.length > 0 && queryDomainAttention < 0.3 && Object.keys(allocation).length > 0) {
      driftDetected = true;
      const topAttention = Object.entries(allocation).sort((a, b) => b[1] - a[1])[0];
      driftDescription = `Attention drift detected: ${(queryDomainAttention * 100).toFixed(0)}% on query domains (${queryDomains.join(", ")}), but ${(topAttention ? topAttention[1] * 100 : 0).toFixed(0)}% on ${topAttention?.[0] ?? "unknown"}`;
      rebalanceRecommendation = `Rebalance: increase focus on ${queryDomains.join(", ")} by prioritizing relevant working memory items`;
    }

    if (Object.keys(allocation).length > 0) {
      const values = Object.values(allocation);
      const max = Math.max(...values);
      const min = Math.min(...values);
      if (max - min > 0.6) {
        driftDetected = true;
        const dominant = Object.entries(allocation).sort((a, b) => b[1] - a[1])[0]!;
        driftDescription = `Attention heavily concentrated: ${(dominant[1] * 100).toFixed(0)}% on ${dominant[0]}`;
        rebalanceRecommendation = rebalanceRecommendation ?? `Consider broadening attention — ${dominant[0]} is consuming disproportionate focus`;
      }
    }

    const report: AttentionSchemaReport = {
      reportId: `attn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      allocationSummary: { ...allocation },
      driftDetected,
      driftDescription,
      rebalanceRecommendation,
      timestamp: new Date().toISOString(),
    };

    this.latestAttentionSchema = report;
    return report;
  }

  computeAttentionFocus(): AttentionFocus {
    const domainCounts: Record<string, number> = {};
    for (const item of this.items) {
      for (const tag of item.tags) {
        domainCounts[tag] = (domainCounts[tag] ?? 0) + item.priority;
      }
    }

    const sortedDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]);
    const totalWeight = sortedDomains.reduce((s, [, w]) => s + w, 0) || 1;
    const distribution: Record<string, number> = {};
    for (const [domain, weight] of sortedDomains) {
      distribution[domain] = weight / totalWeight;
    }

    const recentQueryText = this.queryHistory.slice(-3).join(" ").toLowerCase();
    const topWords = recentQueryText
      .split(/\s+/)
      .filter(w => w.length > 3)
      .reduce<Record<string, number>>((acc, w) => {
        acc[w] = (acc[w] ?? 0) + 1;
        return acc;
      }, {});
    const primaryTopic = Object.entries(topWords).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "general";

    return {
      primaryTopic,
      secondaryTopics: sortedDomains.slice(1, 4).map(([d]) => d),
      activeDomains: sortedDomains.slice(0, 5).map(([d]) => d),
      contextWindowUsage: this.estimateTokenUsage() / CONTEXT_BUDGET_TOKENS,
      attentionDistribution: distribution,
    };
  }

  getState(): CognitiveWorkspaceState {
    const used = this.estimateTokenUsage();
    return {
      workingMemory: [...this.items],
      attentionFocus: this.computeAttentionFocus(),
      contextBudget: { used, total: CONTEXT_BUDGET_TOKENS, utilization: used / CONTEXT_BUDGET_TOKENS },
      activeGoals: [...this.activeGoals],
      recentQueries: [...this.queryHistory],
      sessionDepth: this.sessionDepth,
      recentBroadcasts: this.broadcasts.slice(-5).reverse(),
      attentionSchema: this.latestAttentionSchema,
    };
  }

  buildWorkspaceContext(maxTokens = 2000): string {
    const focus = this.computeAttentionFocus();
    const topItems = this.items
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    const lines: string[] = [
      `## Cognitive Workspace`,
      `Session depth: ${this.sessionDepth} | Active goals: ${this.activeGoals.length}`,
      `Attention: ${focus.primaryTopic} (${focus.activeDomains.slice(0, 3).join(", ")})`,
      `Context utilization: ${(focus.contextWindowUsage * 100).toFixed(0)}%`,
    ];

    if (this.latestAttentionSchema?.driftDetected) {
      lines.push(`⚠ ${this.latestAttentionSchema.driftDescription}`);
    }

    if (topItems.length > 0) {
      lines.push(`Working memory (top ${topItems.length}):`);
      for (const item of topItems) {
        const tokenEstimate = Math.ceil(item.content.length / 4);
        if (lines.join("\n").length / 4 + tokenEstimate > maxTokens) break;
        lines.push(`  - [${item.source}] ${item.content.slice(0, 200)}`);
      }
    }

    return lines.join("\n");
  }

  buildFocusedContext(rawContext: string, agentDomain: string, tokenBudget = 3000): string {
    const focus = this.computeAttentionFocus();
    const domainWeight = focus.attentionDistribution[agentDomain] ?? 0.1;
    const adjustedBudget = Math.floor(tokenBudget * Math.max(0.5, Math.min(1.5, 0.7 + domainWeight)));

    const relevantMemory = this.recall([agentDomain], 5);
    const memorySection = relevantMemory.length > 0
      ? relevantMemory.map(m => `[${m.source}] ${m.content.slice(0, 150)}`).join("\n")
      : "";

    const rawTokens = Math.ceil(rawContext.length / 4);
    let contextPortion: string;
    if (rawTokens <= adjustedBudget) {
      contextPortion = rawContext;
    } else {
      const charBudget = adjustedBudget * 4;
      const paragraphs = rawContext.split(/\n\n+/);
      const scored = paragraphs.map(p => {
        const domainRelevance = p.toLowerCase().includes(agentDomain) ? 2 : 0;
        const focusRelevance = focus.activeDomains.some(d => p.toLowerCase().includes(d)) ? 1 : 0;
        const goalRelevance = this.activeGoals.some(g => p.toLowerCase().includes(g.toLowerCase())) ? 1.5 : 0;
        return { text: p, score: domainRelevance + focusRelevance + goalRelevance + 0.1 };
      });
      scored.sort((a, b) => b.score - a.score);

      const selected: string[] = [];
      let usedChars = 0;
      for (const s of scored) {
        if (usedChars + s.text.length > charBudget) break;
        selected.push(s.text);
        usedChars += s.text.length;
      }
      contextPortion = selected.join("\n\n");
    }

    const parts = [
      `## Focused Context (attention: ${focus.primaryTopic}, budget: ${adjustedBudget} tokens)`,
    ];
    if (memorySection) {
      parts.push(`### Working Memory\n${memorySection}`);
    }
    if (contextPortion) {
      parts.push(`### Shared Intelligence\n${contextPortion}`);
    }
    return parts.join("\n\n");
  }

  private estimateTokenUsage(): number {
    return this.items.reduce((s, item) => s + Math.ceil(item.content.length / 4), 0);
  }

  private enforceCapacity(): void {
    if (this.items.length <= MAX_WORKING_MEMORY) return;
    this.items.sort((a, b) => b.priority - a.priority);
    this.items = this.items.slice(0, MAX_WORKING_MEMORY);
  }

  private runDecay(): void {
    const now = Date.now();
    if (now - this.lastDecayAt < DECAY_INTERVAL_MS) return;
    this.lastDecayAt = now;

    for (const item of this.items) {
      const ageMinutes = (now - new Date(item.addedAt).getTime()) / 60000;
      const decay = item.decayRate * Math.floor(ageMinutes);
      item.priority = Math.max(0, item.priority - decay * 0.01);
    }

    this.items = this.items.filter(item => item.priority > 0.1);
  }

  clear(): void {
    this.items = [];
    this.queryHistory = [];
    this.activeGoals = [];
    this.sessionDepth = 0;
  }
}

export const cognitiveWorkspace = new CognitiveWorkspace();
