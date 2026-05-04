/**
 * Command — AI Quality Dashboard
 *
 * Per-model inference quality breakdown including HuggingFace models.
 * Shows latency percentiles, pass-rate, eval scores, and token throughput
 * broken down by provider and model, with HF models highlighted.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Cpu,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  BarChart3,
  Zap,
  ChevronRight,
  Eye,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────

interface ModelMetrics {
  modelId: string;
  provider: "huggingface" | "openai" | "anthropic" | "replit" | "internal";
  displayName: string;
  totalInferences: number;
  passRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  avgScore: number;
  tokensPerSecond: number;
  errorRate: number;
  trend: "up" | "down" | "stable";
  hfModelId?: string;
  lastEvalAt?: string;
}

interface HFHubStatus {
  tokenPresent: boolean;
  tokenValid: boolean;
  inferenceReachable: boolean;
  username?: string;
  pinnedModels: number;
  pinnedDatasets: number;
  pinnedSpaces: number;
  lastChecked: string;
  status: "healthy" | "degraded" | "auth_error" | "unconfigured";
}

// ─── seeded metrics data ──────────────────────────────────────────────────────

const SEEDED_METRICS: ModelMetrics[] = [
  {
    modelId: "qwen3-8b",
    provider: "huggingface",
    displayName: "Qwen3-8B",
    hfModelId: "Qwen/Qwen3-8B",
    totalInferences: 2841,
    passRate: 0.91,
    avgLatencyMs: 1240,
    p95LatencyMs: 2800,
    avgScore: 87.4,
    tokensPerSecond: 38.2,
    errorRate: 0.02,
    trend: "up",
    lastEvalAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    modelId: "mistral-7b-instruct",
    provider: "huggingface",
    displayName: "Mistral-7B-Instruct",
    hfModelId: "mistralai/Mistral-7B-Instruct-v0.3",
    totalInferences: 1203,
    passRate: 0.88,
    avgLatencyMs: 980,
    p95LatencyMs: 2100,
    avgScore: 84.1,
    tokensPerSecond: 42.6,
    errorRate: 0.04,
    trend: "stable",
    lastEvalAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    modelId: "llama-3-8b",
    provider: "huggingface",
    displayName: "Llama-3-8B-Instruct",
    hfModelId: "meta-llama/Meta-Llama-3-8B-Instruct",
    totalInferences: 876,
    passRate: 0.86,
    avgLatencyMs: 1050,
    p95LatencyMs: 2400,
    avgScore: 82.9,
    tokensPerSecond: 35.1,
    errorRate: 0.06,
    trend: "down",
    lastEvalAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    modelId: "gpt-4o",
    provider: "openai",
    displayName: "GPT-4o",
    totalInferences: 5612,
    passRate: 0.96,
    avgLatencyMs: 1820,
    p95LatencyMs: 3600,
    avgScore: 94.2,
    tokensPerSecond: 28.4,
    errorRate: 0.01,
    trend: "stable",
    lastEvalAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    modelId: "claude-3-5-sonnet",
    provider: "anthropic",
    displayName: "Claude 3.5 Sonnet",
    totalInferences: 3247,
    passRate: 0.95,
    avgLatencyMs: 1640,
    p95LatencyMs: 3200,
    avgScore: 93.1,
    tokensPerSecond: 31.8,
    errorRate: 0.01,
    trend: "up",
    lastEvalAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    modelId: "replit-code-v2",
    provider: "replit",
    displayName: "Replit Code v2",
    totalInferences: 412,
    passRate: 0.78,
    avgLatencyMs: 720,
    p95LatencyMs: 1600,
    avgScore: 74.6,
    tokensPerSecond: 55.3,
    errorRate: 0.09,
    trend: "up",
    lastEvalAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── api helpers ──────────────────────────────────────────────────────────────

async function fetchHFStatus(): Promise<HFHubStatus | null> {
  try {
    const res = await apiRequest("GET", "/api/hf/hub/status");
    if (!res.ok) return null;
    return (await res.json()) as HFHubStatus;
  } catch {
    return null;
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  huggingface: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  openai: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  anthropic: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  replit: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  internal: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

const PROVIDER_LABEL: Record<string, string> = {
  huggingface: "🤗 HF",
  openai: "OpenAI",
  anthropic: "Anthropic",
  replit: "Replit",
  internal: "Internal",
};

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up")
    return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
  if (trend === "down")
    return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-slate-500" />;
}

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((value / max) * 100);
  const color =
    pct >= 90
      ? "bg-emerald-500"
      : pct >= 75
      ? "bg-yellow-500"
      : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function ModelRow({
  model,
  isSelected,
  onClick,
}: {
  model: ModelMetrics;
  isSelected: boolean;
  onClick: () => void;
}) {
  const providerClass =
    PROVIDER_COLORS[model.provider] ??
    "text-slate-400 bg-slate-500/10 border-slate-500/20";
  const isHF = model.provider === "huggingface";

  return (
    <tr
      onClick={onClick}
      className={`border-b border-slate-700/30 cursor-pointer transition-colors ${
        isSelected ? "bg-slate-700/40" : "hover:bg-slate-800/40"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${providerClass}`}
          >
            {PROVIDER_LABEL[model.provider] ?? model.provider}
          </span>
          <span className="text-sm font-medium text-slate-200">
            {model.displayName}
          </span>
          {isHF && model.hfModelId && (
            <a
              href={`https://huggingface.co/${model.hfModelId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-slate-600 hover:text-yellow-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-slate-400">
          {model.totalInferences.toLocaleString()}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              model.passRate >= 0.9
                ? "bg-emerald-400"
                : model.passRate >= 0.8
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
          />
          <span className="text-sm text-slate-400">
            {(model.passRate * 100).toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-slate-400">{model.avgLatencyMs}ms</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm text-slate-400">{model.p95LatencyMs}ms</span>
      </td>
      <td className="px-4 py-3 w-36">
        <ScoreBar value={model.avgScore} />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <TrendIcon trend={model.trend} />
          <span className="text-sm text-slate-400">
            {model.tokensPerSecond} t/s
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`text-sm ${
            model.errorRate > 0.05 ? "text-red-400" : "text-slate-500"
          }`}
        >
          {(model.errorRate * 100).toFixed(1)}%
        </span>
      </td>
    </tr>
  );
}

function ModelDetailPanel({ model }: { model: ModelMetrics }) {
  const isHF = model.provider === "huggingface";
  const lastEvalMinutes = model.lastEvalAt
    ? Math.round((Date.now() - new Date(model.lastEvalAt).getTime()) / 60000)
    : null;

  return (
    <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isHF && <span className="text-lg">🤗</span>}
            <h3 className="text-base font-semibold text-slate-100">
              {model.displayName}
            </h3>
          </div>
          {isHF && model.hfModelId && (
            <a
              href={`https://huggingface.co/${model.hfModelId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
            >
              {model.hfModelId}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
        {lastEvalMinutes !== null && (
          <div className="text-xs text-slate-600">
            Last eval {lastEvalMinutes}m ago
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Avg Quality Score</div>
          <div className="text-2xl font-semibold text-slate-100">
            {model.avgScore.toFixed(1)}
          </div>
          <ScoreBar value={model.avgScore} />
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Pass Rate</div>
          <div className="text-2xl font-semibold text-slate-100">
            {(model.passRate * 100).toFixed(1)}%
          </div>
          <div className="mt-1 flex items-center gap-1">
            {model.passRate >= 0.9 ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3 h-3 text-yellow-400" />
            )}
            <span className="text-xs text-slate-600">
              {model.passRate >= 0.9 ? "Healthy" : "Below target (90%)"}
            </span>
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Avg Latency</div>
          <div className="text-2xl font-semibold text-slate-100">
            {model.avgLatencyMs}
            <span className="text-sm font-normal text-slate-500">ms</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            P95: {model.p95LatencyMs}ms
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-3">
          <div className="text-xs text-slate-500 mb-1">Throughput</div>
          <div className="text-2xl font-semibold text-slate-100">
            {model.tokensPerSecond}
            <span className="text-sm font-normal text-slate-500"> t/s</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendIcon trend={model.trend} />
            <span className="text-xs text-slate-600 capitalize">
              {model.trend}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Activity className="w-3 h-3" />
          <span>
            {model.totalInferences.toLocaleString()} total inferences
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <AlertCircle className="w-3 h-3" />
          <span>{(model.errorRate * 100).toFixed(1)}% error rate</span>
        </div>
      </div>

      {isHF && (
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <div className="flex items-center gap-2">
            <a
              href="/nuro-forge/hub"
              className="flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
            >
              <span>🤗</span> View in NuroForge Hub
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

type FilterProvider = "all" | "huggingface" | "openai" | "anthropic" | "replit";

export default function CoreCommandPage() {
  const [filterProvider, setFilterProvider] = useState<FilterProvider>("all");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    SEEDED_METRICS[0]?.modelId ?? null
  );
  const [sortKey, setSortKey] = useState<keyof ModelMetrics>("avgScore");

  const { data: hfStatus, isLoading: hfStatusLoading } = useQuery({
    queryKey: ["hf-hub-status"],
    queryFn: fetchHFStatus,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const filtered = SEEDED_METRICS.filter(
    (m) => filterProvider === "all" || m.provider === filterProvider
  ).sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return bv - av;
  });

  const selectedModel = SEEDED_METRICS.find((m) => m.modelId === selectedModelId) ?? null;
  const hfModels = SEEDED_METRICS.filter((m) => m.provider === "huggingface");
  const hfAvgScore =
    hfModels.reduce((sum, m) => sum + m.avgScore, 0) / (hfModels.length || 1);
  const hfAvgPassRate =
    hfModels.reduce((sum, m) => sum + m.passRate, 0) / (hfModels.length || 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-800 border border-slate-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-slate-300" />
              </div>
              <h1 className="text-xl font-semibold text-slate-100">
                Command — AI Quality Dashboard
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              Per-model inference quality, latency, and eval scores across all providers including
              Hugging Face.
            </p>
          </div>
        </div>

        {/* HF summary strip */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🤗</span>
              <div className="text-xs text-slate-500">HF Inference</div>
              {hfStatusLoading ? (
                <RefreshCw className="w-3 h-3 text-slate-600 animate-spin ml-auto" />
              ) : hfStatus?.inferenceReachable ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-400 ml-auto" />
              )}
            </div>
            <div className="text-lg font-semibold text-yellow-300">
              {hfStatus?.inferenceReachable
                ? "Online"
                : hfStatusLoading
                ? "—"
                : "Down"}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">API latency</div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-3.5 h-3.5 text-yellow-500" />
              <div className="text-xs text-slate-500">HF Models Active</div>
            </div>
            <div className="text-lg font-semibold text-slate-100">
              {hfModels.length}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {hfModels.reduce((s, m) => s + m.totalInferences, 0).toLocaleString()} inferences
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <div className="text-xs text-slate-500">HF Avg Quality</div>
            </div>
            <div className="text-lg font-semibold text-slate-100">
              {hfAvgScore.toFixed(1)}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              vs {((SEEDED_METRICS.reduce((s, m) => s + m.avgScore, 0) / SEEDED_METRICS.length)).toFixed(1)} platform avg
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <div className="text-xs text-slate-500">HF Pass Rate</div>
            </div>
            <div className="text-lg font-semibold text-slate-100">
              {(hfAvgPassRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              avg across {hfModels.length} HF models
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Table */}
          <div className="flex-1 min-w-0">
            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-4">
              {(["all", "huggingface", "openai", "anthropic", "replit"] as FilterProvider[]).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setFilterProvider(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      filterProvider === p
                        ? "bg-slate-700 text-slate-200"
                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    {p === "all"
                      ? "All providers"
                      : p === "huggingface"
                      ? "🤗 Hugging Face"
                      : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                )
              )}
            </div>

            <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-700/40 bg-slate-800/40">
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-300"
                      onClick={() => setSortKey("totalInferences")}
                    >
                      Inferences
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300"
                      onClick={() => setSortKey("passRate")}
                    >
                      Pass Rate
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-300"
                      onClick={() => setSortKey("avgLatencyMs")}
                    >
                      Avg Lat
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">
                      P95
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-300 w-36"
                      onClick={() => setSortKey("avgScore")}
                    >
                      Quality ▾
                    </th>
                    <th
                      className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-300"
                      onClick={() => setSortKey("tokensPerSecond")}
                    >
                      Throughput
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">
                      Errors
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((model) => (
                    <ModelRow
                      key={model.modelId}
                      model={model}
                      isSelected={selectedModelId === model.modelId}
                      onClick={() =>
                        setSelectedModelId(
                          selectedModelId === model.modelId ? null : model.modelId
                        )
                      }
                    />
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-sm text-slate-600"
                      >
                        No models for this filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
              <Eye className="w-3 h-3" />
              <span>Click a row to inspect model details</span>
              <span>·</span>
              <span>Click column headers to re-sort</span>
            </div>
          </div>

          {/* Detail panel */}
          {selectedModel && (
            <div className="w-64 shrink-0">
              <ModelDetailPanel model={selectedModel} />
            </div>
          )}
        </div>

        {/* HF Hub link */}
        <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
          <div className="w-7 h-7 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-sm">🤗</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-slate-300 font-medium">
              Discover & Pin HF Models
            </div>
            <div className="text-xs text-slate-600">
              Browse Hugging Face Hub, compare model cards, and pin models for inference in NuroForge
            </div>
          </div>
          <a
            href="/nuro-forge/hub"
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors shrink-0"
          >
            Open Hub <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
