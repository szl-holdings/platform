import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw, FileText, Database, Clock, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL + "api";

function usePrismOpsHealth() {
  return useQuery({ queryKey: ["prism-ops-health"], queryFn: async () => { const r = await fetch(`${API}/prism-counsel/health`); return r.json(); }, staleTime: 30000 });
}

const DEMO_SOURCE_FRESHNESS = [
  { source: "Microsoft Outlook (Insurer threads)", lastSync: "2026-04-03T09:45:00Z", status: "fresh", ageMinutes: 18, recordCount: 342 },
  { source: "SharePoint — Matter Documents", lastSync: "2026-04-03T08:00:00Z", status: "fresh", ageMinutes: 105, recordCount: 1847 },
  { source: "Worldline — Crash Signals", lastSync: "2026-04-03T10:10:00Z", status: "fresh", ageMinutes: 3, recordCount: 2341 },
  { source: "Worldline — DFS Complaints", lastSync: "2026-04-03T10:00:00Z", status: "fresh", ageMinutes: 13, recordCount: 847 },
  { source: "Azure Document Intelligence", lastSync: "2026-04-03T09:55:00Z", status: "fresh", ageMinutes: 18, recordCount: 156 },
  { source: "NY Courts eCourts", lastSync: "2026-04-03T08:00:00Z", status: "stale", ageMinutes: 125, recordCount: 423 },
  { source: "CMS MSP Recovery", lastSync: "2026-04-02T12:00:00Z", status: "stale", ageMinutes: 1330, recordCount: 89 },
];

const DEMO_EXPORT_FAILURES = [
  { id: 1, exportType: "review_packet", matterId: 3, errorMessage: "Azure Blob connection timeout during PDF generation", failedAt: "2026-04-03T07:30:00Z", retryCount: 2, replayPath: "/admin/replays?jobType=export_generate" },
  { id: 2, exportType: "demand_packet", matterId: 7, errorMessage: "Missing medical chronology section — document not yet extracted", failedAt: "2026-04-02T16:45:00Z", retryCount: 0, replayPath: "/admin/replays?jobType=document_extract" },
];

const DEMO_BACKLOGS = [
  { category: "Contradiction Flags (Low Confidence)", count: 4, oldest: "2026-04-01T10:00:00Z", color: "#c45a4a" },
  { category: "Forecasts Requiring Attorney Review", count: 7, oldest: "2026-04-02T09:00:00Z", color: "#d4a054" },
  { category: "Review Packets Awaiting Sign-Off", count: 12, oldest: "2026-03-31T14:00:00Z", color: "#d4a054" },
  { category: "Extraction Jobs Pending Manual Review", count: 3, oldest: "2026-04-03T08:00:00Z", color: "#8b7ac8" },
  { category: "Dead Letter Events Unresolved", count: 2, oldest: "2026-04-02T11:00:00Z", color: "#c45a4a" },
];

const REVIEW_PACKET_FAILURES = [
  { id: 1, matterTitle: "Rodriguez v. National General", packetType: "chronology_packet", error: "Missing provider records for Q4 2025", failedAt: "2026-04-03T09:00:00Z", replayAvailable: true },
  { id: 2, matterTitle: "Vasquez v. GEICO", packetType: "settlement_blocker_memo", error: "Lien status unresolved — cannot compute net settlement", failedAt: "2026-04-02T15:00:00Z", replayAvailable: true },
];

function StatusDot({ status }: { status: "fresh" | "stale" | "error" }) {
  const colors: Record<string, string> = { fresh: "bg-[#4a90b8]", stale: "bg-[#d4a054]", error: "bg-[#c45a4a]" };
  return <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] ?? "bg-slate-600"}`} />;
}

export default function AdminQualityPage() {
  const [tab, setTab] = useState<"freshness" | "export-failures" | "review-failures" | "backlog">("freshness");
  const { data: healthData } = usePrismOpsHealth();

  const TABS = [
    { key: "freshness" as const, label: "Source Freshness", icon: Database },
    { key: "export-failures" as const, label: "Export Failures", icon: FileText },
    { key: "review-failures" as const, label: "Review Packet Failures", icon: AlertTriangle },
    { key: "backlog" as const, label: "Contradiction & Low-Confidence Backlog", icon: BarChart3 },
  ];

  const staleCount = DEMO_SOURCE_FRESHNESS.filter(s => s.status === "stale").length;
  const exportFailCount = DEMO_EXPORT_FAILURES.length;
  const reviewFailCount = REVIEW_PACKET_FAILURES.length;
  const backlogTotal = DEMO_BACKLOGS.reduce((acc, b) => acc + b.count, 0);

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
          <div className="space-y-2">
            {DEMO_SOURCE_FRESHNESS.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <StatusDot status={s.status as "fresh" | "stale" | "error"} />
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
        </div>
      )}

      {tab === "export-failures" && (
        <div className="space-y-3">
          {DEMO_EXPORT_FAILURES.length === 0 && <div className="text-center text-slate-500 py-8 text-sm">No export failures — all clear</div>}
          {DEMO_EXPORT_FAILURES.map(f => (
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
          {REVIEW_PACKET_FAILURES.map(f => (
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
          <div className="space-y-3">
            {DEMO_BACKLOGS.map((b, i) => (
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
        </div>
      )}
    </div>
  );
}
