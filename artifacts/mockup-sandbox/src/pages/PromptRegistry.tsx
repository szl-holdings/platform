import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  ArrowUp,
  Loader,
  AlertCircle,
  Tag,
  BarChart2,
  Clock,
} from "lucide-react";

const API = "/api";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!r.ok) throw new Error(`${r.status}`);
  const json = await r.json() as { data?: T } & T;
  return (json as { data?: T }).data ?? json as T;
}

interface PromptVersion {
  versionId: string;
  version: number;
  template: string;
  changelog?: string;
  createdBy: string;
  createdAt: string;
  tags?: string[];
  evalMetadata?: {
    score?: number;
    passRate?: number;
    avgLatencyMs?: number;
    sampleCount?: number;
    passedCases?: number;
    failedCases?: number;
    improvement?: number;
    lastEvalAt?: string;
  };
}

interface PromptEntry {
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
  createdAt: string;
}

interface PromptDetail extends PromptEntry {
  versions: PromptVersion[];
  comparison?: {
    baseVersion: number;
    candidateVersion: number;
    scoreDiff: number;
    latencyDiffMs: number;
    recommendation: "promote" | "reject" | "hold";
  } | null;
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground/40 text-[10px]">no eval</span>;
  const color = score >= 90 ? "text-nexus-green" : score >= 75 ? "text-nexus-amber" : "text-nexus-red";
  return <span className={`font-mono text-xs font-bold ${color}`}>{score.toFixed(1)}</span>;
}

function StatusChip({ status }: { status: string }) {
  const cfg = {
    active: "border-nexus-green/30 bg-nexus-green/10 text-nexus-green",
    draft: "border-nexus/60 bg-nexus-bg text-muted-foreground",
    deprecated: "border-red-500/30 bg-red-500/10 text-nexus-red",
  }[status] ?? "border-nexus/60 bg-nexus-bg text-muted-foreground";
  return (
    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase ${cfg}`}>{status}</span>
  );
}

function VersionCard({
  version,
  isActive,
  onPromote,
  onEval,
  promoting,
  evaling,
}: {
  version: PromptVersion;
  isActive: boolean;
  onPromote: (versionId: string) => void;
  onEval: (versionId: string) => void;
  promoting: boolean;
  evaling: boolean;
}) {
  const [open, setOpen] = useState(false);
  const em = version.evalMetadata;

  return (
    <div className={`rounded border ${isActive ? "border-nexus-cyan/30 bg-nexus-cyan/5" : "border-nexus bg-nexus-bg"}`}>
      <button
        className="w-full flex items-center gap-3 px-3 py-2 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold">
              v{version.version}
            </span>
            {isActive && (
              <span className="text-[9px] font-mono px-1 py-0.5 rounded border border-nexus-cyan/30 bg-nexus-cyan/10 text-nexus-cyan">
                ACTIVE
              </span>
            )}
            {em?.improvement != null && em.improvement > 0 && (
              <span className="text-[9px] font-mono text-nexus-green">+{em.improvement.toFixed(1)}%</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground/60">
            {em?.score != null && <span>score {em.score.toFixed(1)}</span>}
            {em?.passRate != null && <span>pass {(em.passRate * 100).toFixed(0)}%</span>}
            {em?.avgLatencyMs != null && <span>{em.avgLatencyMs}ms</span>}
            {em?.sampleCount != null && <span>{em.sampleCount} cases</span>}
            <span className="ml-auto">{version.createdBy}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!isActive && (
            <button
              onClick={e => { e.stopPropagation(); onPromote(version.versionId); }}
              disabled={promoting}
              className="flex items-center gap-1 px-2 py-1 rounded border border-nexus-cyan/30 bg-nexus-cyan/10 text-nexus-cyan text-[10px] hover:bg-nexus-cyan/20 transition-colors disabled:opacity-50"
            >
              {promoting ? <Loader className="w-3 h-3 animate-spin" /> : <ArrowUp className="w-3 h-3" />}
              Promote
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onEval(version.versionId); }}
            disabled={evaling}
            className="flex items-center gap-1 px-2 py-1 rounded border border-nexus/60 text-muted-foreground text-[10px] hover:text-foreground transition-colors disabled:opacity-50"
          >
            {evaling ? <Loader className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
            Eval
          </button>
          {open ? <ChevronDown className="w-3 h-3 text-muted-foreground/40" /> : <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-nexus/50">
          {version.changelog && (
            <p className="text-xs text-muted-foreground/70 pt-2">{version.changelog}</p>
          )}
          <pre className="text-[10px] font-mono text-muted-foreground/60 bg-nexus-bg rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-32">
            {version.template.slice(0, 400)}{version.template.length > 400 ? "…" : ""}
          </pre>
        </div>
      )}
    </div>
  );
}

function PromptCard({ prompt, onRefresh }: { prompt: PromptEntry; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<PromptDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [evaling, setEvaling] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function loadDetail() {
    if (detail) return;
    setLoadingDetail(true);
    try {
      const d = await apiFetch<PromptDetail>(`/ai/prompts/${prompt.id}`);
      setDetail(d);
    } catch {
    } finally {
      setLoadingDetail(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function promote(versionId: string) {
    setPromoting(versionId);
    try {
      await apiFetch(`/ai/prompts/${prompt.id}/promote`, {
        method: "POST",
        body: JSON.stringify({ versionId }),
      });
      setDetail(null);
      showToast(`v${versionId.split("@v").pop()} promoted to active`);
      onRefresh();
    } catch (e) {
      showToast(`Promote failed: ${String(e)}`);
    } finally {
      setPromoting(null);
    }
  }

  async function runEval(versionId: string) {
    setEvaling(versionId);
    try {
      const result = await apiFetch<{ score: number; passRate: number; sampleCount: number }>(
        `/ai/prompts/${prompt.id}/versions/${versionId}/eval`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setDetail(null);
      showToast(`Eval complete — score ${result.score.toFixed(1)}, pass rate ${(result.passRate * 100).toFixed(0)}%`);
      await loadDetail();
    } catch (e) {
      showToast(`Eval failed: ${String(e)}`);
    } finally {
      setEvaling(null);
    }
  }

  return (
    <div className="rounded-lg bg-nexus-surface border border-nexus">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => {
          setOpen(o => !o);
          if (!open) loadDetail();
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{prompt.name}</span>
            <StatusChip status={prompt.status} />
            <span className="text-[10px] font-mono text-muted-foreground/50 ml-1">{prompt.domain}</span>
          </div>
          <div className="text-xs text-muted-foreground/60 mt-0.5 truncate">{prompt.description}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <ScoreBadge score={prompt.lastEvalScore} />
            <div className="text-[9px] text-muted-foreground/40 mt-0.5">
              {prompt.versionCount}v · {prompt.routeClass}
            </div>
          </div>
          {open ? <ChevronDown className="w-4 h-4 text-muted-foreground/40" /> : <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-nexus px-4 pb-4 pt-3 space-y-3">
          {toast && (
            <div className="rounded border border-nexus-cyan/30 bg-nexus-cyan/10 text-nexus-cyan text-xs px-3 py-1.5">
              {toast}
            </div>
          )}
          {detail?.comparison && (
            <div className="rounded border border-nexus bg-nexus-bg p-3 text-xs space-y-1">
              <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-mono">Version Comparison</div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground/70">v{detail.comparison.baseVersion} → v{detail.comparison.candidateVersion}</span>
                <span className={detail.comparison.scoreDiff > 0 ? "text-nexus-green" : "text-nexus-red"}>
                  {detail.comparison.scoreDiff > 0 ? "+" : ""}{detail.comparison.scoreDiff.toFixed(1)} score
                </span>
                <span className="text-muted-foreground/60">{detail.comparison.latencyDiffMs > 0 ? "+" : ""}{detail.comparison.latencyDiffMs}ms latency</span>
                <span className={`font-mono font-semibold ${
                  detail.comparison.recommendation === "promote" ? "text-nexus-green" :
                  detail.comparison.recommendation === "reject" ? "text-nexus-red" : "text-nexus-amber"
                }`}>
                  → {detail.comparison.recommendation.toUpperCase()}
                </span>
              </div>
            </div>
          )}
          {loadingDetail ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader className="w-3 h-3 animate-spin" /> Loading versions…
            </div>
          ) : detail ? (
            <div className="space-y-2">
              {[...detail.versions].reverse().map(v => (
                <VersionCard
                  key={v.versionId}
                  version={v}
                  isActive={v.versionId === detail.activeVersionId}
                  onPromote={promote}
                  onEval={runEval}
                  promoting={promoting === v.versionId}
                  evaling={evaling === v.versionId}
                />
              ))}
            </div>
          ) : null}
          {prompt.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <Tag className="w-3 h-3 text-muted-foreground/40" />
              {prompt.tags.map(t => (
                <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-nexus bg-nexus-bg text-muted-foreground/60">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PromptRegistry() {
  const [prompts, setPrompts] = useState<PromptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiFetch<PromptEntry[]>("/ai/prompts");
      setPrompts(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const domains = ["all", ...Array.from(new Set(prompts.map(p => p.domain)))];
  const filtered = prompts.filter(p => {
    const matchesDomain = domainFilter === "all" || p.domain === domainFilter;
    const matchesFilter = !filter || p.name.toLowerCase().includes(filter.toLowerCase()) || p.description.toLowerCase().includes(filter.toLowerCase());
    return matchesDomain && matchesFilter;
  });

  const avgScore = prompts.filter(p => p.lastEvalScore != null).reduce((s, p) => s + (p.lastEvalScore ?? 0), 0) / Math.max(1, prompts.filter(p => p.lastEvalScore != null).length);
  const activeCount = prompts.filter(p => p.status === "active").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-nexus-cyan font-mono tracking-wide">
            PROMPT REGISTRY
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Versioned prompt management · promote · compare · eval
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-nexus-surface border border-nexus text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-nexus-surface border border-nexus p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><BookOpen className="w-3 h-3" /> Prompts</div>
          <div className="text-2xl font-mono font-bold text-nexus-cyan">{prompts.length}</div>
          <div className="text-[10px] text-muted-foreground/60">{activeCount} active</div>
        </div>
        <div className="rounded-lg bg-nexus-surface border border-nexus p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><BarChart2 className="w-3 h-3" /> Avg Eval Score</div>
          <div className={`text-2xl font-mono font-bold ${avgScore >= 85 ? "text-nexus-green" : avgScore >= 70 ? "text-nexus-amber" : "text-nexus-red"}`}>
            {prompts.some(p => p.lastEvalScore != null) ? avgScore.toFixed(1) : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground/60">across evalled versions</div>
        </div>
        <div className="rounded-lg bg-nexus-surface border border-nexus p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs"><Clock className="w-3 h-3" /> Total Versions</div>
          <div className="text-2xl font-mono font-bold text-foreground">
            {prompts.reduce((s, p) => s + p.versionCount, 0)}
          </div>
          <div className="text-[10px] text-muted-foreground/60">across all prompts</div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-nexus-red flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error} — promote/eval requires admin role
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search prompts…"
          className="flex-1 bg-nexus-surface border border-nexus rounded px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-nexus-cyan/40"
        />
        <div className="flex gap-1">
          {domains.map(d => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                domainFilter === d
                  ? "border-nexus-cyan/40 bg-nexus-cyan/10 text-nexus-cyan"
                  : "border-nexus bg-nexus-bg text-muted-foreground/60 hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading && prompts.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm py-12">
          <Loader className="w-4 h-4 animate-spin" /> Loading prompt registry…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground/60 text-sm py-12">
          {filter || domainFilter !== "all" ? "No prompts match filters" : "No prompts found"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <PromptCard key={p.id} prompt={p} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}
