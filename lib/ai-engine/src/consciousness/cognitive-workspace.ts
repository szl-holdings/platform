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

export interface CognitiveWorkspaceState {
  workingMemory: WorkingMemoryItem[];
  attentionFocus: AttentionFocus;
  contextBudget: { used: number; total: number; utilization: number };
  activeGoals: string[];
  recentQueries: string[];
  sessionDepth: number;
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
