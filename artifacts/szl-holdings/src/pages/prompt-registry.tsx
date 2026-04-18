import { useState, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Wand2, ChevronRight, ChevronDown, GitBranch, BarChart3,
  ArrowUpCircle, Play, CheckCircle2, XCircle, Clock, Layers,
  TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle,
  Filter, Search,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvalMeta {
  score?: number;
  passRate?: number;
  avgLatencyMs?: number;
  sampleCount?: number;
  passedCases?: number;
  failedCases?: number;
  lastEvalAt?: string;
  evalSuite?: string;
  improvement?: number;
}

interface PromptVersion {
  versionId: string;
  version: number;
  template: string;
  systemPrompt?: string;
  status: string;
  changelog?: string;
  createdBy?: string;
  createdAt: string;
  evalMetadata?: EvalMeta;
  modelHints: {
    preferredModel?: string;
    temperature?: number;
  };
}

interface PromptSummary {
  id: string;
  name: string;
  description: string;
  domain: string;
  routeClass: string;
  activeVersionId: string | null;
  activeVersion: number | null;
  versionCount: number;
  status: string;
  lastEvalScore: number | null;
  lastEvalPassRate: number | null;
  lastEvalAt: string | null;
  tags: string[];
  updatedAt: string;
}

interface PromptDetail extends PromptSummary {
  versions: PromptVersion[];
  comparison?: {
    baseVersionId: string;
    baseVersion: number;
    candidateVersionId: string;
    candidateVersion: number;
    scoreDiff: number;
    latencyDiffMs: number;
    recommendation: "promote" | "hold" | "reject";
  } | null;
}

// ─── Palette helpers ──────────────────────────────────────────────────────────

const DOMAIN_COLOR: Record<string, string> = {
  legal: "#8b5cf6",
  maritime: "#06b6d4",
  security: "#3b82f6",
  advisory: "#c4a265",
  "real-estate": "#d4a054",
  fund: "#10b981",
};

function domainColor(d: string) {
  return DOMAIN_COLOR[d] ?? "#6b7280";
}

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  active:     { bg: "rgba(16,185,129,0.12)",  text: "#10b981", label: "Active" },
  draft:      { bg: "rgba(255,255,255,0.04)",  text: "rgba(255,255,255,0.3)", label: "Draft" },
  review:     { bg: "rgba(245,158,11,0.1)",   text: "#f59e0b", label: "In Review" },
  deprecated: { bg: "rgba(239,68,68,0.08)",   text: "#ef4444", label: "Deprecated" },
  archived:   { bg: "rgba(107,114,128,0.1)",  text: "#6b7280", label: "Archived" },
};

function statusStyle(s: string) {
  return STATUS_COLOR[s] ?? STATUS_COLOR.draft;
}

function fmtScore(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toFixed(1)}`;
}

function fmtPct(n: number | null | undefined) {
  if (n == null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function fmtMs(n: number | null | undefined) {
  if (n == null) return "—";
  return `${n.toLocaleString()} ms`;
}

function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── API hooks ────────────────────────────────────────────────────────────────

function usePrompts(domain?: string) {
  const params = domain ? `?domain=${domain}` : "";
  return useQuery<PromptSummary[]>({
    queryKey: ["prompt-registry", domain],
    queryFn: async () => {
      const r = await fetch(`/api/ai/prompts${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch prompts");
      const j = await r.json();
      return j.data ?? j;
    },
    staleTime: 30_000,
  });
}

function usePromptDetail(id: string | null) {
  return useQuery<PromptDetail>({
    queryKey: ["prompt-registry", "detail", id],
    queryFn: async () => {
      const r = await fetch(`/api/ai/prompts/${id}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch prompt");
      const j = await r.json();
      return j.data ?? j;
    },
    enabled: id != null,
    staleTime: 10_000,
  });
}

function usePromote(promptId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      const r = await fetch(`/api/ai/prompts/${promptId}/promote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.message ?? "Promote failed");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prompt-registry"] });
    },
  });
}

function useRunEval(promptId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      const r = await fetch(`/api/ai/prompts/${promptId}/versions/${versionId}/eval`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error("Eval failed");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prompt-registry", "detail", promptId] });
    },
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.05)" }}>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 9999 }}
        />
      </div>
      <span className="text-[11px] tabular-nums font-semibold w-8 text-right" style={{ color }}>
        {score.toFixed(0)}
      </span>
    </div>
  );
}

function EvalMetaGrid({ meta, color }: { meta: EvalMeta; color: string }) {
  const items = [
    { label: "Score",     value: fmtScore(meta.score),            icon: BarChart3 },
    { label: "Pass rate", value: fmtPct(meta.passRate),           icon: CheckCircle2 },
    { label: "Latency",   value: fmtMs(meta.avgLatencyMs),        icon: Clock },
    { label: "Samples",   value: meta.sampleCount?.toString() ?? "—", icon: Layers },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map(item => (
        <div key={item.label} className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <item.icon className="w-3 h-3 mb-1" style={{ color: "rgba(255,255,255,0.25)" }} />
          <div className="text-[13px] font-semibold tabular-nums" style={{ color }}>{item.value}</div>
          <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function PassFailBar({ passed, failed }: { passed?: number; failed?: number }) {
  const total = (passed ?? 0) + (failed ?? 0);
  if (total === 0) return null;
  const passPct = (passed ?? 0) / total * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>
        <span>{passed} passed</span>
        <span>{failed} failed</span>
      </div>
      <div className="flex rounded-full overflow-hidden" style={{ height: 6, background: "rgba(239,68,68,0.2)" }}>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${passPct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ background: "#10b981", height: "100%" }}
        />
      </div>
    </div>
  );
}

function ComparisonPanel({ comparison, color }: {
  comparison: NonNullable<PromptDetail["comparison"]>;
  color: string;
}) {
  const { scoreDiff, latencyDiffMs, recommendation } = comparison;
  const rec = {
    promote: { icon: TrendingUp,   label: "Recommend Promote", color: "#10b981" },
    hold:    { icon: Minus,        label: "Hold — Insufficient Gain",  color: "#f59e0b" },
    reject:  { icon: TrendingDown, label: "Reject — Regression",       color: "#ef4444" },
  }[recommendation];

  return (
    <div className="rounded-lg p-4" style={{ background: `${color}06`, border: `1px solid ${color}18` }}>
      <div className="text-[10px] font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
        Version comparison v{comparison.baseVersion} → v{comparison.candidateVersion}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="rounded-md p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Score Δ</div>
          <div className="text-[15px] font-bold tabular-nums" style={{ color: scoreDiff > 0 ? "#10b981" : scoreDiff < 0 ? "#ef4444" : "#f59e0b" }}>
            {scoreDiff > 0 ? "+" : ""}{scoreDiff.toFixed(1)}
          </div>
        </div>
        <div className="rounded-md p-2.5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>Latency Δ</div>
          <div className="text-[15px] font-bold tabular-nums" style={{ color: latencyDiffMs > 500 ? "#ef4444" : latencyDiffMs < 0 ? "#10b981" : "rgba(255,255,255,0.5)" }}>
            {latencyDiffMs > 0 ? "+" : ""}{latencyDiffMs.toLocaleString()} ms
          </div>
        </div>
        <div className="rounded-md p-2.5 flex flex-col justify-between" style={{ background: `${rec.color}10`, border: `1px solid ${rec.color}20` }}>
          <rec.icon className="w-3.5 h-3.5" style={{ color: rec.color }} />
          <div className="text-[9px] font-semibold mt-1" style={{ color: rec.color }}>{rec.label}</div>
        </div>
      </div>
    </div>
  );
}

function VersionRow({
  version,
  isActive,
  promptId,
  color,
}: {
  version: PromptVersion;
  isActive: boolean;
  promptId: string;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const promoteMutation = usePromote(promptId);
  const evalMutation = useRunEval(promptId);
  const st = statusStyle(version.status);

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${isActive ? `${color}25` : "rgba(255,255,255,0.05)"}`, background: isActive ? `${color}04` : "rgba(255,255,255,0.01)" }}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer group"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-bold"
          style={{ background: isActive ? `${color}15` : "rgba(255,255,255,0.04)", color: isActive ? color : "rgba(255,255,255,0.3)" }}>
          v{version.version}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.75)" }}>
              {version.versionId}
            </span>
            {isActive && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${color}18`, color }}>ACTIVE</span>
            )}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full capitalize" style={{ background: st.bg, color: st.text }}>{st.label}</span>
          </div>
          {version.changelog && (
            <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{version.changelog}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {version.evalMetadata?.score != null && (
            <div className="text-right">
              <div className="text-[11px] font-semibold tabular-nums" style={{ color }}>{version.evalMetadata.score.toFixed(1)}</div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>score</div>
            </div>
          )}
          {version.evalMetadata?.passRate != null && (
            <div className="text-right">
              <div className="text-[11px] font-semibold tabular-nums" style={{ color: "#10b981" }}>{(version.evalMetadata.passRate * 100).toFixed(0)}%</div>
              <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>pass</div>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); evalMutation.mutate(version.versionId); }}
              disabled={evalMutation.isPending}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium transition-opacity"
              style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
              title="Run eval"
            >
              {evalMutation.isPending ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />}
              Eval
            </button>
            {!isActive && version.status !== "archived" && (
              <button
                onClick={e => { e.stopPropagation(); promoteMutation.mutate(version.versionId); }}
                disabled={promoteMutation.isPending}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold transition-all"
                style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
                title="Promote to active"
              >
                {promoteMutation.isPending ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <ArrowUpCircle className="w-2.5 h-2.5" />}
                Promote
              </button>
            )}
          </div>
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
            : <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.15)" }} />}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <m.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              {version.evalMetadata && (
                <div className="mt-3 space-y-3">
                  <EvalMetaGrid meta={version.evalMetadata} color={color} />
                  <PassFailBar passed={version.evalMetadata.passedCases} failed={version.evalMetadata.failedCases} />
                </div>
              )}
              {version.modelHints.preferredModel && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>Model</span>
                  <code className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}>
                    {version.modelHints.preferredModel}
                    {version.modelHints.temperature != null && ` (temp ${version.modelHints.temperature})`}
                  </code>
                </div>
              )}
              <div className="rounded-md p-3 font-mono text-[10px] leading-relaxed whitespace-pre-wrap"
                style={{ background: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.04)", maxHeight: 200, overflowY: "auto" }}>
                {version.template}
              </div>
              <div className="flex items-center gap-3 text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                {version.createdBy && <span>by {version.createdBy}</span>}
                <span>{fmtDate(version.createdAt)}</span>
                {version.evalMetadata?.lastEvalAt && <span>Eval: {fmtDate(version.evalMetadata.lastEvalAt)}</span>}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PromptDetailPanel({ id }: { id: string }) {
  const { data: prompt, isLoading, error } = usePromptDetail(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} />
      </div>
    );
  }
  if (error || !prompt) {
    return (
      <div className="flex items-center justify-center h-48 gap-2" style={{ color: "rgba(255,255,255,0.3)" }}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-[12px]">Failed to load prompt</span>
      </div>
    );
  }

  const color = domainColor(prompt.domain);
  const sortedVersions = [...prompt.versions].sort((a, b) => b.version - a.version);

  return (
    <m.div
      key={id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>{prompt.name}</h2>
            <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{prompt.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] px-2 py-1 rounded-full capitalize font-medium" style={{ background: `${color}15`, color }}>
              {prompt.domain}
            </span>
            <span className="text-[9px] px-2 py-1 rounded-full capitalize" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}>
              {prompt.routeClass}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          <span><GitBranch className="w-3 h-3 inline mr-1" />{prompt.versionCount} versions</span>
          {prompt.activeVersion != null && <span>Active: v{prompt.activeVersion}</span>}
          <span>Updated {fmtDate(prompt.updatedAt)}</span>
        </div>
      </div>

      {prompt.comparison && (
        <ComparisonPanel comparison={prompt.comparison} color={color} />
      )}

      <div>
        <div className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
          Version History
        </div>
        <div className="space-y-2">
          {sortedVersions.map(v => (
            <VersionRow
              key={v.versionId}
              version={v}
              isActive={v.versionId === prompt.activeVersionId}
              promptId={prompt.id}
              color={color}
            />
          ))}
        </div>
      </div>
    </m.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PromptRegistryPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: prompts, isLoading, error, refetch } = usePrompts(domainFilter || undefined);

  const filtered = prompts?.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.domain.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const domains = [...new Set(prompts?.map(p => p.domain) ?? [])].sort();

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#070a10" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Header */}
        <m.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(212,160,84,0.12)", border: "1px solid rgba(212,160,84,0.2)" }}>
              <Wand2 className="w-4 h-4" style={{ color: "#d4a054" }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Prompt Registry</h1>
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                Manage, evaluate, and promote AI prompt versions without code changes
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-opacity"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </m.div>

        {/* Filters */}
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-1 max-w-xs"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Search className="w-3 h-3 shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prompts…"
              className="bg-transparent outline-none text-[11px] w-full"
              style={{ color: "rgba(255,255,255,0.7)" }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />
            <div className="flex gap-1">
              <button
                onClick={() => setDomainFilter("")}
                className="px-2.5 py-1 rounded-md text-[10px]"
                style={{
                  background: !domainFilter ? "rgba(212,160,84,0.12)" : "rgba(255,255,255,0.02)",
                  color: !domainFilter ? "#d4a054" : "rgba(255,255,255,0.3)",
                  border: `1px solid ${!domainFilter ? "rgba(212,160,84,0.2)" : "rgba(255,255,255,0.04)"}`,
                }}
              >
                All
              </button>
              {domains.map(d => (
                <button
                  key={d}
                  onClick={() => setDomainFilter(d === domainFilter ? "" : d)}
                  className="px-2.5 py-1 rounded-md text-[10px] capitalize"
                  style={{
                    background: domainFilter === d ? `${domainColor(d)}12` : "rgba(255,255,255,0.02)",
                    color: domainFilter === d ? domainColor(d) : "rgba(255,255,255,0.3)",
                    border: `1px solid ${domainFilter === d ? `${domainColor(d)}25` : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </m.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 gap-3" style={{ color: "rgba(255,255,255,0.2)" }}>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-[13px]">Loading prompt registry…</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 gap-2" style={{ color: "#ef4444" }}>
            <AlertCircle className="w-4 h-4" />
            <span className="text-[13px]">Failed to load registry. Is the API server running?</span>
          </div>
        ) : (
          <div className="flex gap-4">
            {/* Left: prompt table */}
            <div className={`${selectedId ? "w-[440px] shrink-0" : "flex-1"} transition-all duration-200`}>
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  No prompts found
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Table header */}
                  {!selectedId && (
                    <div className="grid grid-cols-12 px-4 py-1.5 mb-1 text-[9px] uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.2)" }}>
                      <span className="col-span-3">Name</span>
                      <span className="col-span-2">Domain</span>
                      <span className="col-span-2">Route class</span>
                      <span className="col-span-1 text-center">Ver.</span>
                      <span className="col-span-2 text-right">Score</span>
                      <span className="col-span-2 text-right">Status</span>
                    </div>
                  )}

                  {filtered.map((p, i) => {
                    const color = domainColor(p.domain);
                    const st = statusStyle(p.status);
                    const isSelected = selectedId === p.id;
                    return (
                      <m.div
                        key={p.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleSelect(p.id)}
                        className="rounded-lg cursor-pointer transition-colors group"
                        style={{
                          background: isSelected ? `${color}06` : "rgba(255,255,255,0.015)",
                          border: `1px solid ${isSelected ? `${color}20` : "rgba(255,255,255,0.04)"}`,
                        }}
                      >
                        {selectedId ? (
                          // Compact view when detail panel open
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <div className="flex-1 min-w-0">
                              <div className="text-[11px] font-medium truncate" style={{ color: isSelected ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)" }}>{p.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] capitalize" style={{ color }}>{p.domain}</span>
                                {p.activeVersion != null && (
                                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>v{p.activeVersion}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {p.lastEvalScore != null ? (
                                <div className="text-[11px] font-semibold tabular-nums" style={{ color }}>{p.lastEvalScore.toFixed(1)}</div>
                              ) : (
                                <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>—</div>
                              )}
                            </div>
                            <ChevronRight className="w-3 h-3 shrink-0" style={{ color: isSelected ? color : "rgba(255,255,255,0.15)" }} />
                          </div>
                        ) : (
                          // Full table row
                          <div className="grid grid-cols-12 items-center px-4 py-3">
                            <div className="col-span-3 min-w-0 pr-2">
                              <div className="text-[12px] font-medium truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{p.name}</div>
                              {p.activeVersion != null && (
                                <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>Active v{p.activeVersion}</div>
                              )}
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ background: `${color}10`, color }}>
                                {p.domain}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-[9px] px-1.5 py-0.5 rounded capitalize" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }}>
                                {p.routeClass}
                              </span>
                            </div>
                            <div className="col-span-1 text-center">
                              <span className="text-[11px] tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>{p.versionCount}</span>
                            </div>
                            <div className="col-span-2 pr-2">
                              {p.lastEvalScore != null ? (
                                <ScoreBar score={p.lastEvalScore} color={color} />
                              ) : (
                                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>No evals</span>
                              )}
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full capitalize" style={{ background: st.bg, color: st.text }}>
                                {st.label}
                              </span>
                            </div>
                          </div>
                        )}
                      </m.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: detail panel */}
            <AnimatePresence>
              {selectedId && (
                <m.div
                  key="detail"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <div className="rounded-xl p-5 h-full overflow-y-auto"
                    style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", maxHeight: "calc(100vh - 180px)" }}>
                    <PromptDetailPanel id={selectedId} />
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Stats footer */}
        {prompts && prompts.length > 0 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 grid grid-cols-4 gap-3"
          >
            {[
              { label: "Total prompts",    value: prompts.length,                                  icon: Layers },
              { label: "Active versions",  value: prompts.filter(p => p.status === "active").length, icon: CheckCircle2 },
              { label: "Drafts",           value: prompts.filter(p => p.status === "draft").length,  icon: GitBranch },
              { label: "Avg eval score",
                value: (() => {
                  const scored = prompts.filter(p => p.lastEvalScore != null);
                  if (scored.length === 0) return "—";
                  return (scored.reduce((s, p) => s + p.lastEvalScore!, 0) / scored.length).toFixed(1);
                })(),
                icon: BarChart3 },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <item.icon className="w-3.5 h-3.5 mb-2" style={{ color: "rgba(255,255,255,0.2)" }} />
                <div className="text-[18px] font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.75)" }}>{item.value}</div>
                <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{item.label}</div>
              </div>
            ))}
          </m.div>
        )}
      </div>
    </div>
  );
}
