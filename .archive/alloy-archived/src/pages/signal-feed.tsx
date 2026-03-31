import { useQuery } from "@tanstack/react-query";
import { apiFetch, DataStateBadge, isAuthError } from "@workspace/shared-ui";
import { Radio, AlertTriangle, Info, ChevronRight, Filter, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface Signal {
  id: number;
  source: string;
  sourceType: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  body: string | null;
  status: string;
  normalizedScore: string | null;
  metadata: Record<string, unknown> | null;
  receivedAt: string;
  processedAt: string | null;
}

interface SignalResp {
  data: Signal[];
  meta: { page: number; limit: number; total: number };
}

function useSignals(source: string | null, severity: string | null, page: number) {
  return useQuery({
    queryKey: ["alloySignals", source, severity, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50", page: String(page) });
      if (source) params.set("source", source);
      if (severity) params.set("severity", severity);
      const resp = await apiFetch<SignalResp>(`/alloy/signals?${params}`);
      if (resp && typeof resp === "object" && "data" in resp) return resp as SignalResp;
      return { data: (resp as Signal[]) ?? [], meta: { page: 1, limit: 50, total: 0 } };
    },
    refetchInterval: (query) => {
      if (isAuthError(query.state.error)) return false;
      return 8000;
    },
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return failureCount < 1;
    },
  });
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", label: "Critical" },
  high: { color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)", label: "High" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Medium" },
  low: { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.15)", label: "Low" },
  info: { color: "#6b7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.15)", label: "Info" },
};

const SOURCE_CONFIG: Record<string, { color: string; label: string }> = {
  terra: { color: "#10b981", label: "Terra" },
  aegis: { color: "#ef4444", label: "Aegis" },
  vessels: { color: "#0ea5e9", label: "Vessels" },
  lyte: { color: "#8b5cf6", label: "Lyte" },
  alloy: { color: "#00d4ff", label: "Alloy" },
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  new: { color: "#f59e0b", label: "New" },
  processing: { color: "#00d4ff", label: "Processing" },
  processed: { color: "#10b981", label: "Processed" },
  failed: { color: "#ef4444", label: "Failed" },
  ignored: { color: "#6b7280", label: "Ignored" },
};

function formatRelative(ts: string | null) {
  if (!ts) return "—";
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60000) return "just now";
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function SeverityDot({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.info;
  return (
    <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }} />
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const [expanded, setExpanded] = useState(false);
  const sevCfg = SEVERITY_CONFIG[signal.severity] ?? SEVERITY_CONFIG.info;
  const srcCfg = SOURCE_CONFIG[signal.source] ?? { color: "#00d4ff", label: signal.source };
  const stsCfg = STATUS_CONFIG[signal.status] ?? { color: "rgba(255,255,255,0.4)", label: signal.status };

  return (
    <div
      className="border rounded-lg transition-all cursor-pointer"
      style={{
        borderColor: expanded ? sevCfg.border : "rgba(255,255,255,0.06)",
        background: expanded ? sevCfg.bg : "rgba(12,18,30,0.6)",
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start gap-3 p-3">
        <SeverityDot severity={signal.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{
              color: srcCfg.color,
              background: `${srcCfg.color}15`,
            }}>
              {srcCfg.label}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border" style={{
              color: sevCfg.color,
              borderColor: sevCfg.border,
              background: sevCfg.bg,
            }}>
              {sevCfg.label}
            </span>
            <span className="text-[9px] uppercase tracking-widest" style={{ color: stsCfg.color }}>{stsCfg.label}</span>
            <span className="text-[9px] ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>{formatRelative(signal.receivedAt)}</span>
          </div>
          <div className="text-xs text-white leading-snug">{signal.title}</div>
          {expanded && signal.body && (
            <div className="mt-2 text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>{signal.body}</div>
          )}
          {expanded && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Source Type</div>
                <div className="text-[10px] text-white">{signal.sourceType}</div>
              </div>
              <div className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Score</div>
                <div className="text-[10px] text-white">{signal.normalizedScore ? parseFloat(signal.normalizedScore).toFixed(1) : "—"}</div>
              </div>
              <div className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Received</div>
                <div className="text-[10px] text-white">{new Date(signal.receivedAt).toLocaleString()}</div>
              </div>
              <div className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.3)" }}>
                <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Processed</div>
                <div className="text-[10px] text-white">{signal.processedAt ? new Date(signal.processedAt).toLocaleString() : "Not yet"}</div>
              </div>
            </div>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform mt-0.5" style={{
          color: "rgba(255,255,255,0.2)",
          transform: expanded ? "rotate(90deg)" : undefined,
        }} />
      </div>
    </div>
  );
}

export default function SignalFeed() {
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, error } = useSignals(sourceFilter, severityFilter, page);
  const signals = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  const SOURCES = ["terra", "aegis", "vessels", "lyte", "alloy"];
  const SEVERITIES = ["critical", "high", "medium", "low", "info"];

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4" style={{ color: "#00d4ff" }} />
              <h1 className="text-base font-bold text-white">Signal & Event Feed</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Live feed of cross-platform intelligence signals — Terra, Aegis, Vessels, Lyte, Alloy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DataStateBadge state="live" />
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ["alloySignals"] })}
              className="p-1.5 rounded-lg border transition-colors hover:border-cyan-400/30"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(12,18,30,0.8)" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <Filter className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Source</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setSourceFilter(null); setPage(1); }}
              className="px-2 py-1 rounded text-[10px] border transition-all font-medium"
              style={{
                borderColor: !sourceFilter ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)",
                background: !sourceFilter ? "rgba(0,212,255,0.08)" : "transparent",
                color: !sourceFilter ? "#00d4ff" : "rgba(255,255,255,0.35)",
              }}
            >
              All
            </button>
            {SOURCES.map(s => {
              const cfg = SOURCE_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { setSourceFilter(sourceFilter === s ? null : s); setPage(1); }}
                  className="px-2 py-1 rounded text-[10px] border transition-all font-medium"
                  style={{
                    borderColor: sourceFilter === s ? `${cfg.color}40` : "rgba(255,255,255,0.06)",
                    background: sourceFilter === s ? `${cfg.color}12` : "transparent",
                    color: sourceFilter === s ? cfg.color : "rgba(255,255,255,0.35)",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 mt-2 mb-1">
            <AlertTriangle className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
            <span className="text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Severity</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setSeverityFilter(null); setPage(1); }}
              className="px-2 py-1 rounded text-[10px] border transition-all font-medium"
              style={{
                borderColor: !severityFilter ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)",
                background: !severityFilter ? "rgba(0,212,255,0.08)" : "transparent",
                color: !severityFilter ? "#00d4ff" : "rgba(255,255,255,0.35)",
              }}
            >
              All
            </button>
            {SEVERITIES.map(s => {
              const cfg = SEVERITY_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => { setSeverityFilter(severityFilter === s ? null : s); setPage(1); }}
                  className="px-2 py-1 rounded text-[10px] border transition-all font-medium"
                  style={{
                    borderColor: severityFilter === s ? cfg.border : "rgba(255,255,255,0.06)",
                    background: severityFilter === s ? cfg.bg : "transparent",
                    color: severityFilter === s ? cfg.color : "rgba(255,255,255,0.35)",
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {total > 0 && (
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {total.toLocaleString()} signals {sourceFilter || severityFilter ? "matched" : "total"}
          </div>
        )}

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg border border-white/5 animate-pulse" style={{ background: "rgba(12,18,30,0.6)" }} />
            ))
          ) : signals.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              No signals match this filter.
            </div>
          ) : (
            signals.map(s => <SignalRow key={s.id} signal={s} />)
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              Prev
            </button>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40"
              style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
