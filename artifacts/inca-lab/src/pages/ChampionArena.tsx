import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "../lib/utils";
import {
  Trophy, Star, Zap, Brain, Code2, BookOpen, PenLine, Image, Layers,
  TrendingUp, TrendingDown, DollarSign, CheckCircle, AlertTriangle,
  Play, RefreshCw, BarChart3, Cpu, Crown, Loader2
} from "lucide-react";
import { championApi } from "../lib/api";
import type { ChampionCard, CategoryChampions, EvolutionInsight, CostQualityPoint } from "../lib/api";

type TaskCategory = "writing" | "research" | "analysis" | "coding" | "speed" | "image_gen" | "multimodal";
type Tier = "S" | "A" | "B" | "C";

const CATEGORY_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  writing: PenLine,
  research: BookOpen,
  analysis: Brain,
  coding: Code2,
  speed: Zap,
  image_gen: Image,
  multimodal: Layers,
};

const CATEGORY_COLORS: Record<string, string> = {
  writing: "#7c3aed",
  research: "#0ea5e9",
  analysis: "#f97316",
  coding: "#10b981",
  speed: "#f59e0b",
  image_gen: "#ec4899",
  multimodal: "#6366f1",
};

const TIER_COLORS: Record<Tier, string> = {
  S: "#f59e0b",
  A: "#7c3aed",
  B: "#3b82f6",
  C: "#6b7280",
};

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#f97316",
  openai: "#22c55e",
  gemini: "#60a5fa",
  "nano-banana": "#fbbf24",
  midjourney: "#a78bfa",
  ideogram: "#ec4899",
};

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <div
      className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-display font-bold"
      style={{ backgroundColor: `${TIER_COLORS[tier]}20`, border: `1px solid ${TIER_COLORS[tier]}40`, color: TIER_COLORS[tier] }}
    >
      {tier}
    </div>
  );
}

function ChampionBadge() {
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40" }}>
      <Crown className="w-2.5 h-2.5" /> Champion
    </div>
  );
}

function CategoryCard({ cat, onSelect, selected }: { cat: CategoryChampions; onSelect: (c: CategoryChampions) => void; selected: boolean }) {
  const Icon = CATEGORY_ICONS[cat.category] ?? Trophy;
  const color = CATEGORY_COLORS[cat.category] ?? "#888";
  const champion = cat.champion;

  return (
    <button
      onClick={() => onSelect(cat)}
      className={cn("inca-panel p-4 text-left transition-all duration-200 hover:border-opacity-60 w-full")}
      style={{ borderColor: selected ? `${color}60` : undefined, boxShadow: selected ? `0 0 0 1px ${color}40` : undefined }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div>
          <div className="text-xs font-medium text-foreground">{cat.label}</div>
          <div className="text-xs text-muted-foreground" style={{ color }}>{champion.name}</div>
        </div>
        <div className="ml-auto">
          <TierBadge tier={champion.tier} />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Live Quality</span>
          <span className="text-xs font-mono text-foreground">{champion.livePerformance.qualityScore.toFixed(0)}%</span>
        </div>
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${champion.livePerformance.qualityScore}%`, backgroundColor: color }} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>${champion.costPerRun.toFixed(3)}/run</span>
          <span>{(champion.latencyP50Ms / 1000).toFixed(1)}s P50</span>
        </div>
      </div>
    </button>
  );
}

function ChampionDetail({ cat }: { cat: CategoryChampions }) {
  const Icon = CATEGORY_ICONS[cat.category] ?? Trophy;
  const color = CATEGORY_COLORS[cat.category] ?? "#888";
  const c = cat.champion;

  return (
    <div className="inca-panel p-5">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-base font-display font-semibold text-foreground">{c.name}</h2>
            <TierBadge tier={c.tier} />
            {c.championBadge && <ChampionBadge />}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span>{c.providerLabel}</span>
            <span>·</span>
            <span className="font-mono">{c.model}</span>
            <span>·</span>
            <span>{c.contextWindow > 0 ? `${(c.contextWindow / 1000).toFixed(0)}K ctx` : "Image gen"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Live Quality", value: `${c.livePerformance.qualityScore.toFixed(0)}%` },
          { label: "Cost/Run", value: `$${c.costPerRun.toFixed(3)}` },
          { label: "P50 Latency", value: `${(c.latencyP50Ms / 1000).toFixed(1)}s` },
          { label: "Error Rate", value: `${(c.livePerformance.errorRate * 100).toFixed(1)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-secondary rounded-lg p-2.5 text-center">
            <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
            <div className="text-lg font-display font-bold text-foreground">{value}</div>
          </div>
        ))}
      </div>

      {c.benchmarks.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Benchmark Scores</div>
          <div className="space-y-2">
            {c.benchmarks.map((b, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground w-36 flex-shrink-0">{b.name}</div>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, b.unit === "%" ? b.score : Math.min(100, b.score))}%`, backgroundColor: color }}
                  />
                </div>
                <div className="text-xs font-mono text-foreground w-20 text-right flex-shrink-0">
                  {b.unit === "%" ? `${b.score}%` : b.unit === "USD" ? `$${b.score}` : `${b.score} ${b.unit}`}
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">{b.asOf}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Strengths</div>
          <div className="space-y-1">
            {c.strengths.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color }} />
                {s}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Best For</div>
          <div className="space-y-1">
            {c.bestFor.slice(0, 4).map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-foreground">
                <Star className="w-3 h-3 flex-shrink-0 text-amber-400" />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {cat.contenders.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Contenders</div>
          <div className="space-y-2">
            {cat.contenders.map(contender => (
              <div key={contender.id} className="flex items-center gap-3 p-2 bg-secondary/40 rounded-lg">
                <TierBadge tier={contender.tier} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground">{contender.name}</div>
                  <div className="text-xs text-muted-foreground">{contender.providerLabel}</div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {contender.livePerformance.qualityScore.toFixed(0)}% quality
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: EvolutionInsight }) {
  const colors = { critical: "#ef4444", warning: "#f59e0b", info: "#60a5fa" };
  const color = colors[insight.severity] ?? "#888";
  const icons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    promotion: TrendingUp, demotion: TrendingDown, alert: AlertTriangle, review: RefreshCw, cost_saving: DollarSign,
  };
  const Icon = icons[insight.type] ?? AlertTriangle;

  return (
    <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg border" style={{ borderColor: `${color}25` }}>
      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground mb-0.5">{insight.title}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{insight.description}</div>
        <div className="text-xs text-muted-foreground mt-1 opacity-60">
          {new Date(insight.timestamp).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

function CostQualityChart({ points }: { points: CostQualityPoint[] }) {
  const maxCost = Math.max(...points.map(p => p.costPerRun), 0.001);
  const maxQ = Math.max(...points.map(p => p.qualityScore), 1);

  const TIER_COLOR: Record<string, string> = { budget: "#10b981", balanced: "#7c3aed", premium: "#f97316" };

  return (
    <div className="relative h-48 bg-secondary/20 rounded-lg p-4">
      <div className="absolute inset-4">
        <div className="relative w-full h-full">
          {points.map(p => {
            const x = (p.costPerRun / maxCost) * 90;
            const y = 100 - (p.qualityScore / maxQ) * 90;
            const color = TIER_COLOR[p.tier] ?? "#888";
            return (
              <div
                key={p.modelId}
                className="absolute"
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
                title={`${p.modelName}: ${p.qualityScore}% quality, $${p.costPerRun}/run`}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 border-background"
                  style={{ backgroundColor: color, boxShadow: p.recommended ? `0 0 8px ${color}80` : undefined }}
                />
                <div className="text-muted-foreground whitespace-nowrap mt-0.5 text-center" style={{ fontSize: "9px" }}>
                  {p.modelName.split(" ").slice(-1)[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">Cost/Run →</div>
      <div
        className="absolute left-1 top-1/2 text-xs text-muted-foreground"
        style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
      >
        Quality →
      </div>
    </div>
  );
}

const BENCHMARK_SUITES = [
  { id: "writing-eval", name: "Writing Quality Suite", category: "writing", testCases: 400, description: "Tone accuracy, coherence, factual grounding, and SEO on 400 annotated samples.", lastRun: "2026-04-07 08:00", status: "completed" as const },
  { id: "research-eval", name: "Research Accuracy Suite", category: "research", testCases: 250, description: "Source citation accuracy, multilingual coverage, synthesis depth on curated research datasets.", lastRun: "2026-04-08 09:00", status: "completed" as const },
  { id: "reasoning-eval", name: "Reasoning & Logic Suite", category: "analysis", testCases: 500, description: "Multi-step reasoning, logical inference, and domain-specific problem solving.", lastRun: "2026-04-06 10:00", status: "completed" as const },
  { id: "coding-eval", name: "Code Generation Suite", category: "coding", testCases: 600, description: "LiveCodeBench tasks, debugging accuracy, agentic tool use, and multi-language code generation.", lastRun: "2026-04-09 07:00", status: "running" as const },
  { id: "latency-eval", name: "Latency & Budget Suite", category: "speed", testCases: 1000, description: "Classification speed, batch processing throughput, cost-per-token benchmarks at scale.", lastRun: "2026-04-13 06:00", status: "completed" as const },
  { id: "image-eval", name: "Image Fidelity Suite", category: "image_gen", testCases: 150, description: "FID score, photorealism, text accuracy, and prompt adherence on structured visual prompts.", lastRun: "2026-04-01 09:00", status: "pending" as const },
];

export function ChampionArena() {
  const [activeTab, setActiveTab] = useState<"champion-map" | "arena" | "evolution" | "cost-intel">("champion-map");
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);
  const [runningBenchmark, setRunningBenchmark] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["champion-categories"],
    queryFn: () => championApi.getCategories(),
    staleTime: 60000,
    retry: 1,
  });

  const registryQuery = useQuery({
    queryKey: ["champion-registry"],
    queryFn: () => championApi.getRegistry(),
    staleTime: 60000,
    retry: 1,
  });

  const evolutionQuery = useQuery({
    queryKey: ["champion-evolution"],
    queryFn: () => championApi.getEvolutionData(),
    staleTime: 30000,
    retry: 1,
  });

  const categories: CategoryChampions[] = categoriesQuery.data?.data ?? [];
  const registry = registryQuery.data?.data;
  const evolutionData = evolutionQuery.data?.data;
  const selectedCategory = categories[selectedCategoryIdx];

  const insights: EvolutionInsight[] = evolutionData?.insights ?? [];
  const reviewStatus = evolutionData?.reviewStatus;
  const costQualityPoints: CostQualityPoint[] = evolutionData?.costQualityMap ?? [];

  const isLoading = categoriesQuery.isLoading || registryQuery.isLoading;

  function triggerBenchmark(suiteId: string) {
    setRunningBenchmark(suiteId);
    setTimeout(() => setRunningBenchmark(null), 4000);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Champion Arena</h1>
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: "#f59e0b15", border: "1px solid #f59e0b40", color: "#f59e0b" }}>
            <Crown className="w-3.5 h-3.5" /> Fusion Intelligence Active
          </div>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Live champion map — which model handles which category, with real-time benchmark scores, cost-quality tradeoffs, and adaptive evolution signals.
        </p>
      </div>

      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit">
        {[
          { id: "champion-map" as const, label: "Champion Map", icon: Trophy },
          { id: "arena" as const, label: "Benchmark Arena", icon: BarChart3 },
          { id: "evolution" as const, label: "Evolution Radar", icon: TrendingUp },
          { id: "cost-intel" as const, label: "Cost Intelligence", icon: DollarSign },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {activeTab === "champion-map" && (
        <div className="space-y-4">
          {registry && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
              <div className="kpi-tile p-3">
                <div className="text-xs text-muted-foreground mb-1">S-Tier Champions</div>
                <div className="text-xl font-display font-bold" style={{ color: "#f59e0b" }}>{registry.summary.sTierCount}</div>
                <div className="text-xs text-muted-foreground">Highest performance tier</div>
              </div>
              <div className="kpi-tile p-3">
                <div className="text-xs text-muted-foreground mb-1">Active Categories</div>
                <div className="text-xl font-display font-bold text-foreground">{categories.length}</div>
                <div className="text-xs text-muted-foreground">All categories mapped</div>
              </div>
              <div className="kpi-tile p-3">
                <div className="text-xs text-muted-foreground mb-1">Total Models</div>
                <div className="text-xl font-display font-bold text-foreground">{registry.summary.totalChampions}</div>
                <div className="text-xs text-muted-foreground">In champion registry</div>
              </div>
              <div className="kpi-tile p-3">
                <div className="text-xs text-muted-foreground mb-1">Avg Cost/Run</div>
                <div className="text-xl font-display font-bold text-foreground">${registry.summary.avgCostPerRun.toFixed(3)}</div>
                <div className="text-xs text-muted-foreground">Across all champions</div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading champion registry…
            </div>
          ) : categories.length === 0 ? (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Champion registry unavailable. Check API server connection.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Task Categories</div>
                <div className="space-y-2">
                  {categories.map((cat, idx) => (
                    <CategoryCard key={cat.category} cat={cat} onSelect={() => setSelectedCategoryIdx(idx)} selected={selectedCategoryIdx === idx} />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Champion Detail</div>
                {selectedCategory ? <ChampionDetail cat={selectedCategory} /> : (
                  <div className="inca-panel p-8 text-center text-muted-foreground text-sm">Select a category to view champion details</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "arena" && (
        <div className="space-y-4">
          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Standardized Benchmark Suites</div>
              <div className="ml-auto text-xs text-muted-foreground">Results feed champion rankings</div>
            </div>
            <div className="space-y-3">
              {BENCHMARK_SUITES.map(suite => {
                const Icon = CATEGORY_ICONS[suite.category] ?? Trophy;
                const color = CATEGORY_COLORS[suite.category] ?? "#888";
                const isRunning = runningBenchmark === suite.id;
                return (
                  <div key={suite.id} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg border border-border/40">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-xs font-medium text-foreground">{suite.name}</div>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", isRunning || suite.status === "running" ? "badge-running" : suite.status === "completed" ? "badge-idle" : "badge-warning")}>
                          {isRunning ? "running" : suite.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{suite.description}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>{suite.testCases.toLocaleString()} test cases</span>
                        <span>Last: {suite.lastRun}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => triggerBenchmark(suite.id)}
                      disabled={isRunning || suite.status === "running"}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0"
                      style={{ backgroundColor: "#7c3aed15", border: "1px solid #7c3aed30", color: "#7c3aed", opacity: isRunning ? 0.7 : 1 }}
                    >
                      {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {isRunning ? "Running…" : "Run"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Champion Leaderboard</div>
              {registryQuery.isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-auto" />}
            </div>
            {registry ? (
              <div className="space-y-2">
                {registry.champions.slice(0, 8).map((c, i) => {
                  const providerColor = PROVIDER_COLORS[c.provider] ?? "#888";
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-3 py-2 bg-secondary/20 rounded-lg">
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0", i < 3 ? "text-amber-400 bg-amber-400/10" : "text-muted-foreground bg-secondary")}>
                        {i + 1}
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: providerColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.providerLabel} · {c.categoryChampion.join(", ") || "contender"}</div>
                      </div>
                      <TierBadge tier={c.tier} />
                      <div className="text-xs font-mono text-foreground w-12 text-right flex-shrink-0">{c.livePerformance.qualityScore.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-xs">Registry data unavailable</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "evolution" && (
        <div className="space-y-4">
          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Championship Review Status</div>
              {evolutionQuery.isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground ml-auto" />}
            </div>
            <div className="text-xs text-muted-foreground mb-4">Monthly reviews validate champion rankings, trigger promotions/demotions, and surface cost-saving opportunities.</div>
            {reviewStatus ? (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-secondary/40 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Last Review</div>
                  <div className="text-sm font-medium text-foreground">{reviewStatus.lastReview}</div>
                </div>
                <div className="bg-secondary/40 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Next Review</div>
                  <div className="text-sm font-medium text-foreground">{reviewStatus.nextReview}</div>
                </div>
                <div className="bg-secondary/40 rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground mb-0.5">Reviews Done</div>
                  <div className="text-sm font-medium text-foreground">{reviewStatus.reviewsCompleted}</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {["Last Review", "Next Review", "Reviews Done"].map(l => (
                  <div key={l} className="bg-secondary/40 rounded-lg p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-0.5">{l}</div>
                    <div className="h-4 bg-secondary rounded animate-pulse" />
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Evolution Signals from Telemetry</div>
            {evolutionQuery.isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading evolution signals…
              </div>
            ) : insights.length > 0 ? (
              <div className="space-y-2">
                {insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
              </div>
            ) : (
              <div className="p-3 bg-secondary/20 rounded-lg text-xs text-muted-foreground">
                No evolution signals — all champions nominal.
              </div>
            )}
          </div>

          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Live Champion Health</div>
            </div>
            {registry ? (
              <div className="space-y-2">
                {registry.champions.filter(c => c.livePerformance.requestCount > 0 || c.categoryChampion.length > 0).slice(0, 6).map(m => {
                  const errorRate = m.livePerformance.errorRate;
                  const latencyOk = m.livePerformance.avgLatencyMs < m.latencyP50Ms * 1.5;
                  const status = errorRate > 0.15 ? "at-risk" : m.categoryChampion.length > 0 ? "champion" : "contender";
                  const statusColors: Record<string, string> = { champion: "#10b981", contender: "#7c3aed", "at-risk": "#f59e0b" };
                  const color = statusColors[status] ?? "#888";
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2 bg-secondary/20 rounded-lg">
                      <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Quality: {m.livePerformance.qualityScore.toFixed(0)}% · Latency: {latencyOk ? "stable" : "elevated"} · {m.livePerformance.requestCount} req/h
                        </div>
                      </div>
                      <div className="text-xs" style={{ color }}>{status}</div>
                      <div className={cn("text-xs font-mono", errorRate > 0.1 ? "text-red-400" : errorRate > 0.03 ? "text-amber-400" : "text-emerald-400")}>
                        {(errorRate * 100).toFixed(1)}% err
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs">Registry data unavailable</div>
            )}
          </div>
        </div>
      )}

      {activeTab === "cost-intel" && (
        <div className="space-y-4">
          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Cost vs Quality Map</div>
              <div className="ml-auto text-xs text-muted-foreground">Glow = recommended · Telemetry-adjusted</div>
              {evolutionQuery.isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>
            {costQualityPoints.length > 0 ? (
              <>
                <CostQualityChart points={costQualityPoints} />
                <div className="flex items-center gap-4 mt-3">
                  {[{ tier: "budget", label: "Budget Tier", color: "#10b981" }, { tier: "balanced", label: "Balanced Tier", color: "#7c3aed" }, { tier: "premium", label: "Premium Tier", color: "#f97316" }].map(t => (
                    <div key={t.tier} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-xs text-muted-foreground">{t.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading cost/quality data…
              </div>
            )}
          </div>

          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Cost-Aware Routing Modes</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { mode: "Budget", color: "#10b981", description: "Routes to Gemini Flash 2.5 for classification, summarization, and batch tasks. 97% of GPT-5.4 quality at $0.003/run.", savings: "~88% cost reduction", useCases: ["Classification", "Summarization", "Batch processing"] },
                { mode: "Balanced", color: "#7c3aed", description: "Routes to Claude Sonnet 4.6 or GPT-5.4 depending on category. Best cost/quality ratio for everyday workloads.", savings: "~58% vs Premium", useCases: ["Standard analysis", "Code generation", "Writing"] },
                { mode: "Quality", color: "#f97316", description: "Routes to Claude Opus 4.6 for critical analysis and top-tier writing. Spends for the best output regardless of cost.", savings: "Maximum output quality", useCases: ["Legal analysis", "Strategy docs", "High-stakes decisions"] },
              ].map(m => (
                <div key={m.mode} className="p-3 rounded-lg border border-border/40" style={{ backgroundColor: `${m.color}08` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-md" style={{ backgroundColor: `${m.color}25`, border: `1px solid ${m.color}40` }} />
                    <div className="text-xs font-medium text-foreground">{m.mode}</div>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed mb-2">{m.description}</div>
                  <div className="text-xs font-medium mb-1" style={{ color: m.color }}>{m.savings}</div>
                  <div className="space-y-0.5">
                    {m.useCases.map((uc, i) => <div key={i} className="text-xs text-muted-foreground">· {uc}</div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Per-Model Cost Breakdown</div>
            </div>
            {costQualityPoints.length > 0 ? (
              <div className="space-y-2">
                {[...costQualityPoints].sort((a, b) => a.costPerRun - b.costPerRun).map(m => {
                  const tierColors: Record<string, string> = { budget: "#10b981", balanced: "#7c3aed", premium: "#f97316" };
                  const color = tierColors[m.tier] ?? "#888";
                  const maxCost = Math.max(...costQualityPoints.map(p => p.costPerRun));
                  return (
                    <div key={m.modelId} className="flex items-center gap-3">
                      <div className="text-xs text-foreground w-40 flex-shrink-0 truncate">{m.modelName}</div>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(m.costPerRun / maxCost) * 100}%`, backgroundColor: color }} />
                      </div>
                      <div className="text-xs font-mono text-foreground w-16 text-right flex-shrink-0">${m.costPerRun.toFixed(3)}</div>
                      <div className="text-xs text-muted-foreground w-14 text-right flex-shrink-0">{m.qualityScore.toFixed(0)}% Q</div>
                      {m.recommended && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-xs">Loading cost breakdown…</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
