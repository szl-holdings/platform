import { logger } from "./logger";
import { inferenceTelemetry } from "./inference-telemetry";
import type { InferenceProvider } from "./inference-telemetry";

export type TaskCategory = "writing" | "research" | "analysis" | "coding" | "speed" | "image_gen" | "multimodal";

export interface BenchmarkScore {
  name: string;
  score: number;
  unit: string;
  asOf: string;
}

export interface ChampionCard {
  id: string;
  name: string;
  provider: InferenceProvider | "midjourney" | "ideogram" | "reve" | "firefly" | "nano-banana";
  providerLabel: string;
  model: string;
  categoryRankings: Record<TaskCategory, number>;
  categoryChampion: TaskCategory[];
  benchmarks: BenchmarkScore[];
  costPerRun: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  latencyP50Ms: number;
  contextWindow: number;
  strengths: string[];
  bestFor: string[];
  livePerformance: {
    avgLatencyMs: number;
    errorRate: number;
    qualityScore: number;
    requestCount: number;
  };
  championBadge: boolean;
  rank: number;
  tier: "S" | "A" | "B" | "C";
}

export interface CategoryChampions {
  category: TaskCategory;
  label: string;
  description: string;
  champion: ChampionCard;
  contenders: ChampionCard[];
}

export interface RoutingDecision {
  category: TaskCategory;
  champion: ChampionCard;
  confidence: number;
  signals: string[];
  costMode: "quality" | "balanced" | "budget";
  estimatedCostUsd: number;
}

const STATIC_CHAMPIONS: Omit<ChampionCard, "livePerformance" | "rank" | "tier">[] = [
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "anthropic",
    providerLabel: "Anthropic",
    model: "claude-opus-4-6",
    categoryRankings: { writing: 1, research: 3, analysis: 1, coding: 3, speed: 5, image_gen: 0, multimodal: 2 },
    categoryChampion: ["writing", "analysis"],
    benchmarks: [
      { name: "MMLU", score: 96.4, unit: "%", asOf: "2026-03" },
      { name: "Real-World Tasks", score: 100, unit: "%", asOf: "2026-03" },
      { name: "HumanEval", score: 89.2, unit: "%", asOf: "2026-03" },
    ],
    costPerRun: 0.042,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
    latencyP50Ms: 2800,
    contextWindow: 200000,
    strengths: ["Long-form writing", "Complex reasoning", "Nuanced analysis", "Multi-step logic"],
    bestFor: ["Reports", "Strategy documents", "Legal analysis", "Research synthesis"],
    championBadge: true,
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    providerLabel: "Anthropic",
    model: "claude-sonnet-4-20250514",
    categoryRankings: { writing: 3, research: 4, analysis: 2, coding: 2, speed: 3, image_gen: 0, multimodal: 3 },
    categoryChampion: ["coding"],
    benchmarks: [
      { name: "SWE-bench", score: 73.7, unit: "%", asOf: "2026-03" },
      { name: "MMLU", score: 93.1, unit: "%", asOf: "2026-03" },
      { name: "Real-World Tasks", score: 100, unit: "%", asOf: "2026-03" },
    ],
    costPerRun: 0.018,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    latencyP50Ms: 1400,
    contextWindow: 200000,
    strengths: ["Agentic coding", "Tool use", "Instruction following", "Safety"],
    bestFor: ["Code generation", "Debugging", "APIs", "Automated pipelines"],
    championBadge: true,
  },
  {
    id: "gpt-5-4",
    name: "GPT-5.4",
    provider: "openai",
    providerLabel: "OpenAI",
    model: "gpt-5.4",
    categoryRankings: { writing: 2, research: 2, analysis: 3, coding: 4, speed: 2, image_gen: 0, multimodal: 1 },
    categoryChampion: ["multimodal"],
    benchmarks: [
      { name: "MMLU", score: 94.8, unit: "%", asOf: "2026-03" },
      { name: "GPQA Diamond", score: 84.2, unit: "%", asOf: "2026-03" },
      { name: "HumanEval", score: 91.3, unit: "%", asOf: "2026-03" },
    ],
    costPerRun: 0.025,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.02,
    latencyP50Ms: 1600,
    contextWindow: 128000,
    strengths: ["Conversational writing", "Vision", "Code", "All-around performance"],
    bestFor: ["Short-form content", "Marketing copy", "Multimodal tasks", "APIs"],
    championBadge: true,
  },
  {
    id: "gemini-3-1-pro",
    name: "Gemini 3.1 Pro",
    provider: "gemini",
    providerLabel: "Google",
    model: "gemini-3.1-pro",
    categoryRankings: { writing: 4, research: 1, analysis: 4, coding: 3, speed: 4, image_gen: 0, multimodal: 2 },
    categoryChampion: ["research"],
    benchmarks: [
      { name: "MMLU", score: 92.7, unit: "%", asOf: "2026-03" },
      { name: "Multilingual MMLU", score: 89.4, unit: "%", asOf: "2026-03" },
      { name: "Real-time Sourcing", score: 97, unit: "%", asOf: "2026-03" },
    ],
    costPerRun: 0.032,
    costPer1kInput: 0.007,
    costPer1kOutput: 0.028,
    latencyP50Ms: 2200,
    contextWindow: 2000000,
    strengths: ["Real-time data access", "Multilingual", "Huge context window", "Research synthesis"],
    bestFor: ["Market research", "News synthesis", "Multilingual content", "Long document analysis"],
    championBadge: true,
  },
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro Preview",
    provider: "gemini",
    providerLabel: "Google",
    model: "gemini-3-pro-preview",
    categoryRankings: { writing: 5, research: 3, analysis: 5, coding: 1, speed: 3, image_gen: 0, multimodal: 3 },
    categoryChampion: [],
    benchmarks: [
      { name: "LiveCodeBench", score: 91.7, unit: "%", asOf: "2026-03" },
      { name: "HumanEval", score: 95.4, unit: "%", asOf: "2026-03" },
      { name: "MBPP+", score: 92.1, unit: "%", asOf: "2026-03" },
    ],
    costPerRun: 0.028,
    costPer1kInput: 0.0045,
    costPer1kOutput: 0.018,
    latencyP50Ms: 1800,
    contextWindow: 1000000,
    strengths: ["Code generation", "Algorithm design", "Competitive programming", "Multi-language code"],
    bestFor: ["Complex algorithms", "Data science", "System design", "Code review"],
    championBadge: false,
  },
  {
    id: "gemini-flash-2-5",
    name: "Gemini Flash 2.5",
    provider: "gemini",
    providerLabel: "Google",
    model: "gemini-2.5-flash",
    categoryRankings: { writing: 6, research: 5, analysis: 6, coding: 5, speed: 1, image_gen: 0, multimodal: 4 },
    categoryChampion: ["speed"],
    benchmarks: [
      { name: "MMLU (relative)", score: 97, unit: "% of GPT-5.4", asOf: "2026-03" },
      { name: "Latency P50", score: 1.1, unit: "seconds", asOf: "2026-03" },
      { name: "Cost per Run", score: 0.003, unit: "USD", asOf: "2026-03" },
    ],
    costPerRun: 0.003,
    costPer1kInput: 0.000075,
    costPer1kOutput: 0.0003,
    latencyP50Ms: 1100,
    contextWindow: 1000000,
    strengths: ["Ultra-fast", "Extremely cheap", "High quality for cost", "Large context"],
    bestFor: ["Classification", "Summarization", "Batch processing", "Cost-sensitive workloads"],
    championBadge: true,
  },
  {
    id: "chatgpt-deep-research",
    name: "ChatGPT Deep Research",
    provider: "openai",
    providerLabel: "OpenAI",
    model: "chatgpt-deep-research",
    categoryRankings: { writing: 3, research: 2, analysis: 3, coding: 5, speed: 6, image_gen: 0, multimodal: 3 },
    categoryChampion: [],
    benchmarks: [
      { name: "Deep Research Accuracy", score: 94.2, unit: "%", asOf: "2026-03" },
      { name: "Source Citation Quality", score: 98.1, unit: "%", asOf: "2026-03" },
    ],
    costPerRun: 0.15,
    costPer1kInput: 0.012,
    costPer1kOutput: 0.048,
    latencyP50Ms: 18000,
    contextWindow: 128000,
    strengths: ["Structured research reports", "Multi-source synthesis", "Citation accuracy"],
    bestFor: ["Research reports", "Due diligence", "Market analysis", "Literature review"],
    championBadge: false,
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    provider: "nano-banana",
    providerLabel: "Nano Banana",
    model: "nano-banana-pro",
    categoryRankings: { writing: 0, research: 0, analysis: 0, coding: 0, speed: 0, image_gen: 1, multimodal: 0 },
    categoryChampion: ["image_gen"],
    benchmarks: [
      { name: "Photorealism Score", score: 98.2, unit: "%", asOf: "2026-03" },
      { name: "Text Accuracy", score: 97.4, unit: "%", asOf: "2026-03" },
      { name: "FID Score", score: 4.2, unit: "FID", asOf: "2026-03" },
    ],
    costPerRun: 0.04,
    costPer1kInput: 0,
    costPer1kOutput: 0,
    latencyP50Ms: 3200,
    contextWindow: 0,
    strengths: ["Photorealism", "Text rendering", "Prompt accuracy", "Ultra-high resolution"],
    bestFor: ["Product photography", "Advertising", "Brand imagery", "Precision prompting"],
    championBadge: true,
  },
  {
    id: "midjourney-v7",
    name: "Midjourney v7",
    provider: "midjourney",
    providerLabel: "Midjourney",
    model: "midjourney-v7",
    categoryRankings: { writing: 0, research: 0, analysis: 0, coding: 0, speed: 0, image_gen: 2, multimodal: 0 },
    categoryChampion: [],
    benchmarks: [
      { name: "Aesthetic Score", score: 96.8, unit: "%", asOf: "2026-03" },
      { name: "Cinematic Quality", score: 98.5, unit: "%", asOf: "2026-03" },
    ],
    costPerRun: 0.05,
    costPer1kInput: 0,
    costPer1kOutput: 0,
    latencyP50Ms: 12000,
    contextWindow: 0,
    strengths: ["Cinematic quality", "Artistic style", "Mood & atmosphere", "Conceptual imagery"],
    bestFor: ["Film stills", "Album artwork", "Concept art", "Mood boards"],
    championBadge: false,
  },
  {
    id: "ideogram-3",
    name: "Ideogram 3",
    provider: "ideogram",
    providerLabel: "Ideogram",
    model: "ideogram-3",
    categoryRankings: { writing: 0, research: 0, analysis: 0, coding: 0, speed: 0, image_gen: 3, multimodal: 0 },
    categoryChampion: [],
    benchmarks: [
      { name: "Text in Image Accuracy", score: 99.1, unit: "%", asOf: "2026-03" },
      { name: "Typography Quality", score: 97.3, unit: "%", asOf: "2026-03" },
    ],
    costPerRun: 0.035,
    costPer1kInput: 0,
    costPer1kOutput: 0,
    latencyP50Ms: 4500,
    contextWindow: 0,
    strengths: ["Text accuracy", "Typography", "Logo design", "Infographics"],
    bestFor: ["Logos", "Banners", "Text-heavy images", "Infographics"],
    championBadge: false,
  },
];

const CATEGORY_META: Record<TaskCategory, { label: string; description: string }> = {
  writing: { label: "Writing", description: "Long-form, copywriting, creative & conversational content" },
  research: { label: "Research", description: "Real-time sourcing, synthesis, multilingual research reports" },
  analysis: { label: "Analysis & Reasoning", description: "Complex multi-step reasoning, evaluation, benchmarking" },
  coding: { label: "Coding", description: "Code generation, debugging, agentic software engineering" },
  speed: { label: "Speed & Budget", description: "Ultra-fast, cost-efficient classification and processing" },
  image_gen: { label: "Image Generation", description: "Photorealism, artistic, text-in-image, product imagery" },
  multimodal: { label: "Multimodal", description: "Vision, mixed-media understanding, cross-modal tasks" },
};

class ChampionRegistry {
  private telemetryWindow = 60 * 60 * 1000;

  private getLivePerformance(model: string): ChampionCard["livePerformance"] {
    const records = inferenceTelemetry.getRecords({ model, windowMs: this.telemetryWindow });
    const successful = records.filter(r => r.success);
    const avgLatency = successful.length > 0
      ? successful.reduce((s, r) => s + r.latencyMs, 0) / successful.length
      : 0;
    const errorRate = records.length > 0 ? records.filter(r => !r.success).length / records.length : 0;
    const qualityScore = Math.max(0, 100 - errorRate * 100 - (avgLatency > 5000 ? 10 : 0));
    return {
      avgLatencyMs: Math.round(avgLatency),
      errorRate: parseFloat(errorRate.toFixed(4)),
      qualityScore: parseFloat(qualityScore.toFixed(1)),
      requestCount: records.length,
    };
  }

  private computeTier(card: Omit<ChampionCard, "livePerformance" | "rank" | "tier">): ChampionCard["tier"] {
    const isChampion = card.categoryChampion.length > 0;
    const topRanks = Object.values(card.categoryRankings).filter(r => r > 0 && r <= 2).length;
    if (isChampion && topRanks >= 2) return "S";
    if (isChampion || topRanks >= 2) return "A";
    if (topRanks >= 1) return "B";
    return "C";
  }

  getAllChampions(): ChampionCard[] {
    return STATIC_CHAMPIONS.map((c, idx) => ({
      ...c,
      livePerformance: this.getLivePerformance(c.model),
      rank: idx + 1,
      tier: this.computeTier(c),
    }));
  }

  getChampionForCategory(category: TaskCategory): ChampionCard | null {
    const all = this.getAllChampions();
    const champion = all.find(c => c.categoryChampion.includes(category));
    if (champion) return champion;
    const ranked = all
      .filter(c => c.categoryRankings[category] > 0)
      .sort((a, b) => a.categoryRankings[category] - b.categoryRankings[category]);
    return ranked[0] ?? null;
  }

  getTop3ForCategory(category: TaskCategory): ChampionCard[] {
    const all = this.getAllChampions();
    return all
      .filter(c => c.categoryRankings[category] > 0)
      .sort((a, b) => a.categoryRankings[category] - b.categoryRankings[category])
      .slice(0, 3);
  }

  getCategoryChampions(): CategoryChampions[] {
    const categories: TaskCategory[] = ["writing", "research", "analysis", "coding", "speed", "image_gen", "multimodal"];
    return categories.map(cat => {
      const top3 = this.getTop3ForCategory(cat);
      const champion = top3[0]!;
      const contenders = top3.slice(1);
      const meta = CATEGORY_META[cat];
      return {
        category: cat,
        label: meta.label,
        description: meta.description,
        champion,
        contenders,
      };
    });
  }

  getChampionById(id: string): ChampionCard | null {
    const all = this.getAllChampions();
    return all.find(c => c.id === id) ?? null;
  }

  getSummary(): {
    totalChampions: number;
    categoryChampions: Record<TaskCategory, string>;
    sTierCount: number;
    aTierCount: number;
    avgCostPerRun: number;
  } {
    const all = this.getAllChampions();
    const categoryChampions = {} as Record<TaskCategory, string>;
    const categories: TaskCategory[] = ["writing", "research", "analysis", "coding", "speed", "image_gen", "multimodal"];
    for (const cat of categories) {
      const c = this.getChampionForCategory(cat);
      categoryChampions[cat] = c?.name ?? "TBD";
    }
    return {
      totalChampions: all.length,
      categoryChampions,
      sTierCount: all.filter(c => c.tier === "S").length,
      aTierCount: all.filter(c => c.tier === "A").length,
      avgCostPerRun: all.length > 0
        ? parseFloat((all.reduce((s, c) => s + c.costPerRun, 0) / all.length).toFixed(4))
        : 0,
    };
  }
}

export const championRegistry = new ChampionRegistry();

logger.info("Champion Registry initialized with multi-model champion map");
