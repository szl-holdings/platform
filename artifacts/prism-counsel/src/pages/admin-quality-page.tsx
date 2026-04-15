import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw, FileText, Database, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL + "api";

function usePrismOpsHealth() {
  return useQuery({ queryKey: ["prism-ops-health"], queryFn: async () => { const r = await fetch(`${API}/prism-counsel/health`); return r.json(); }, staleTime: 30000 });
}

function usePrismQualityFreshness() {
  return useQuery({
    queryKey: ["prism-quality-freshness"],
    queryFn: async () => {
      const r = await fetch(`${API}/prism-counsel/quality/freshness`, { credentials: "include" });
      if (!r.ok) return { sources: [] };
      return r.json();
    },
    staleTime: 60000,
  });
}

function usePrismExportFailures() {
  return useQuery({
    queryKey: ["prism-export-failures"],
    queryFn: async () => {
      const r = await fetch(`${API}/prism-counsel/quality/export-failures`, { credentials: "include" });
      if (!r.ok) return { failures: [] };
      return r.json();
    },
    staleTime: 60000,
  });
}

function usePrismReviewFailures() {
  return useQuery({
    queryKey: ["prism-review-failures"],
    queryFn: async () => {
      const r = await fetch(`${API}/prism-counsel/quality/review-failures`, { credentials: "include" });
      if (!r.ok) return { failures: [] };
      return r.json();
    },
    staleTime: 60000,
  });
}

function usePrismBacklog() {
  return useQuery({
    queryKey: ["prism-backlog"],
    queryFn: async () => {
      const r = await fetch(`${API}/prism-counsel/quality/backlog`, { credentials: "include" });
      if (!r.ok) return { items: [] };
      return r.json();
    },
    staleTime: 60000,
  });
}

type SourceFreshness = { source: string; lastSync: string; status: "fresh" | "stale" | "error"; ageMinutes: number; recordCount: number };
type ExportFailure = { id: number; exportType: string; matterId: number; errorMessage: string; failedAt: string; retryCount: number; replayPath: string };
type BacklogItem = { category: string; count: number; oldest: string; color: string };
type ReviewPacketFailure = { id: number; matterTitle: string; packetType: string; error: string; failedAt: string; replayAvailable: boolean };

function StatusDot({ status }: { status: "fresh" | "stale" | "error" }) {
  const colors: Record<string, string> = { fresh: "bg-[#4a90b8]", stale: "bg-[#d4a054]", error: "bg-[#c45a4a]" };
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] ?? "bg-slate-600"}`} />;
}

export default function AdminQualityPage() {
  const [tab, setTab] = useState<"freshness" | "export-failures" | "review-failures" | "backlog">("freshness");
  const { data: healthData } = usePrismOpsHealth();
  const { data: freshnessData } = usePrismQualityFreshness();
  const { data: exportData } = usePrismExportFailures();
  const { data: reviewData } = usePrismReviewFailures();
  const { data: backlogData } = usePrismBacklog();

  const sourceFreshness: SourceFreshness[] = Array.isArray(freshnessData?.sources) ? freshnessData.sources : [];
  const exportFailures: ExportFailure[] = Array.isArray(exportData?.failures) ? exportData.failures : [];
  const reviewFailures: ReviewPacketFailure[] = Array.isArray(reviewData?.failures) ? reviewData.failures : [];
  const backlogItems: BacklogItem[] = Array.isArray(backlogData?.items) ? backlogData.items : [];

  const TABS = [
    { key: "freshness" as const, label: "Source Freshness", icon: Database },
    { key: "export-failures" as const, label: "Export Failures", icon: FileText },
    { key: "review-failures" as const, label: "Review Packet Failures", icon: AlertTriangle },
    { key: "backlog" as const, label: "Contradiction & Low-Confidence Backlog", icon: BarChart3 },
  ];

  const staleCount = sourceFreshness.filter(s => s.status === "stale").length;
  const exportFailCount = exportFailures.length;
  const reviewFailCount = reviewFailures.length;
  const backlogTotal = backlogItems.reduce((acc, b) => acc + b.count, 0);

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Quality Gates</h1>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">ADMIN</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Source freshness monitoring, export failures, review packet failures, and contradiction/low-confidence backlog management</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Stale Sources", value: staleCount, color: staleCount > 0 ? "#d4a054" : "#4a90b8" },
          { label: "Export Failures", value: exportFailCount, color: exportFailCount > 0 ? "#c45a4a" : "#4a90b8" },
          { label: "Review Packet Failures", value: reviewFailCount, color: reviewFailCount > 0 ? "#c45a4a" : "#4a90b8" },
          { label: "Backlog Items", value: backlogTotal, color: backlogTotal > 10 ? "#c45a4a" : backlogTotal > 0 ? "#d4a054" : "#4a90b8" },
        ].map((stat, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
            <div className="text-[10px] text-slate-500 mb-1">{stat.label}</div>
            <div className="text-xl font-semibold" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${tab === t.key ? "bg-[#d4a054]/15 text-[#d4a054]" : "text-slate-500 hover:text-slate-300"}`}>
              <Icon className="w-3 h-3" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === "freshness" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Data Source Freshness</h3>
          {sourceFreshness.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-[#4a90b8]/40" />
              <p className="text-xs text-slate-500">No source freshness data — all systems nominal or no sources configured.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sourceFreshness.map((s, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <StatusDot status={s.status} />
                  <div className="flex-1">
                    <div className="text-xs text-slate-200">{s.source}</div>
                    <div className="text-[9px] text-slate-500">{s.recordCount.toLocaleString()} records · Last sync: {new Date(s.lastSync).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-mono ${s.status === "fresh" ? "text-[#4a90b8]" : "text-[#d4a054]"}`}>{s.ageMinutes < 60 ? `${s.ageMinutes}m ago` : `${Math.round(s.ageMinutes / 60)}h ago`}</div>
                    <div className={`text-[9px] ${s.status === "fresh" ? "text-[#4a90b8]" : "text-[#d4a054]"}`}>{s.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "export-failures" && (
        <div className="space-y-3">
          {exportFailures.length === 0 && <div className="text-center text-slate-500 py-8 text-sm">No export failures — all clear</div>}
          {exportFailures.map(f => (
            <div key={f.id} className="rounded-lg border border-[#c45a4a]/20 p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-[#c45a4a]" />
                    <span className="text-xs font-medium text-slate-200">{f.exportType.replace("_", " ").toUpperCase()} — Matter {f.matterId}</span>
                  </div>
                  <div className="text-[10px] text-[#c45a4a] mt-1">{f.errorMessage}</div>
                </div>
                <span className="text-[9px] text-slate-500">{new Date(f.failedAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[9px] text-slate-500">Retries: {f.retryCount}</span>
                <a href={f.replayPath} className="text-[9px] text-[#4a90b8] hover:underline font-mono">{f.replayPath}</a>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "review-failures" && (
        <div className="space-y-3">
          {reviewFailures.length === 0 && <div className="text-center text-slate-500 py-8 text-sm">No review packet failures — all clear</div>}
          {reviewFailures.map(f => (
            <div key={f.id} className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs font-medium text-slate-200">{f.matterTitle}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{f.packetType.replace(/_/g, " ")}</div>
                  <div className="text-[10px] text-[#d4a054] mt-1">{f.error}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-500">{new Date(f.failedAt).toLocaleString()}</div>
                  {f.replayAvailable && <span className="text-[9px] text-[#4a90b8]">Replay available</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "backlog" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Contradiction & Low-Confidence Backlog</h3>
          {backlogItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-[#4a90b8]/40" />
              <p className="text-xs text-slate-500">No backlog items — all contradictions resolved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backlogItems.map((b, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                  <div className="flex-1">
                    <div className="text-xs text-slate-200">{b.category}</div>
                    <div className="text-[9px] text-slate-500">Oldest: {new Date(b.oldest).toLocaleDateString()}</div>
                  </div>
                  <div className="text-xl font-semibold" style={{ color: b.color }}>{b.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
