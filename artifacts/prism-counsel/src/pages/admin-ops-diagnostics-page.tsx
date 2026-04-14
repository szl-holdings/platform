import { useState } from "react";
import { Server, Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw, Clock, Database, Zap, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.BASE_URL + "api";

function usePrismHealth() {
  return useQuery({ queryKey: ["prism-health-diag"], queryFn: async () => { const r = await fetch(`${API}/prism-counsel/health`); return r.json(); }, staleTime: 30000, retry: false });
}

const DEMO_SUBSYSTEMS = [
  { name: "API Server", status: "operational", latencyMs: 42, uptime: "99.98%", lastError: null, detail: "All PRISM Counsel API routes responding normally" },
  { name: "Job Queue (pc_background_jobs)", status: "operational", latencyMs: null, uptime: "99.9%", lastError: null, detail: "0 stuck jobs, queue depth nominal", extra: "12 completed in last hour" },
  { name: "Dead Letter Queue", status: "warn", latencyMs: null, uptime: null, lastError: "2026-04-02T11:00:00Z", detail: "2 unresolved DLQ events — manual review required", replayPath: "/prism-counsel/pilot-admin" },
  { name: "Azure Document Intelligence", status: "operational", latencyMs: 1240, uptime: "99.5%", lastError: null, detail: "Extraction pipeline healthy — 156 jobs completed today" },
  { name: "Microsoft Graph Connector", status: "operational", latencyMs: 145, uptime: "99.7%", lastError: null, detail: "Outlook, Teams, SharePoint syncing normally" },
  { name: "Purview Bridge", status: "warn", latencyMs: 320, uptime: null, lastError: null, detail: "Export quota at 78% — no action required yet", replayPath: "/prism-counsel/admin/purview" },
  { name: "Worldline Signal Refinery", status: "operational", latencyMs: 88, uptime: "99.9%", lastError: null, detail: "7 source classes active, 3,883 signals indexed" },
  { name: "PostgreSQL Database", status: "operational", latencyMs: 8, uptime: "100%", lastError: null, detail: "37 tables, all connections healthy, pool at 4/20" },
  { name: "Proof Chain Service", status: "operational", latencyMs: 15, uptime: "100%", lastError: null, detail: "SHA-256 hash integrity — 6 entries pending review" },
  { name: "Model Mesh (AI lanes)", status: "operational", latencyMs: 890, uptime: "99.3%", lastError: null, detail: "Anthropic + OpenAI lanes healthy, HF endpoints nominal" },
];

const DEMO_RECENT_INCIDENTS = [
  { id: 1, title: "Export job timeout — Matter 3", severity: "medium", status: "resolved", resolvedAt: "2026-04-03T07:45:00Z", duration: "15m", root: "Azure Blob connection pool exhausted during peak load" },
  { id: 2, title: "Graph subscription renewal failure — Connector 2", severity: "low", status: "resolved", resolvedAt: "2026-04-02T14:00:00Z", duration: "42m", root: "OAuth token near expiry, auto-renewed successfully" },
  { id: 3, title: "Dead letter event — deadline_evaluate job", severity: "medium", status: "open", resolvedAt: null, duration: "ongoing", root: "Matter ID not found in payload — requires manual triage" },
];

const STATUS_COLORS: Record<string, string> = { operational: "#4a90b8", warn: "#d4a054", degraded: "#c45a4a", down: "#c45a4a", open: "#c45a4a", resolved: "#4a90b8" };
const STATUS_ICONS: Record<string, any> = { operational: CheckCircle, warn: AlertTriangle, degraded: XCircle, down: XCircle };

export default function AdminOpsDiagnosticsPage() {
  const [tab, setTab] = useState<"subsystems" | "incidents" | "metrics">("subsystems");
  const { data: healthData, refetch, isFetching } = usePrismHealth();

  const opCount = DEMO_SUBSYSTEMS.filter(s => s.status === "operational").length;
  const warnCount = DEMO_SUBSYSTEMS.filter(s => s.status === "warn").length;
  const downCount = DEMO_SUBSYSTEMS.filter(s => s.status === "down" || s.status === "degraded").length;

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#4a90b8]" />
            <h1 className="text-lg font-semibold text-slate-100">Ops Diagnostics</h1>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">ADMIN</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Overall system health, subsystem diagnostics, incident log, and operational metrics for PRISM Counsel</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium bg-[#4a90b8]/10 text-[#4a90b8] hover:bg-[#4a90b8]/20 transition-colors">
          <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
          <div className="text-[10px] text-slate-500 mb-1">Operational</div>
          <div className="text-xl font-semibold text-[#4a90b8]">{opCount}/{DEMO_SUBSYSTEMS.length}</div>
        </div>
        <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
          <div className="text-[10px] text-slate-500 mb-1">Warnings</div>
          <div className="text-xl font-semibold" style={{ color: warnCount > 0 ? "#d4a054" : "#4a90b8" }}>{warnCount}</div>
        </div>
        <div className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
          <div className="text-[10px] text-slate-500 mb-1">Degraded/Down</div>
          <div className="text-xl font-semibold" style={{ color: downCount > 0 ? "#c45a4a" : "#4a90b8" }}>{downCount}</div>
        </div>
      </div>

      <div className="flex gap-1">
        {(["subsystems", "incidents", "metrics"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${tab === t ? "bg-[#4a90b8]/15 text-[#4a90b8]" : "text-slate-500 hover:text-slate-300"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "subsystems" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="space-y-2">
            {DEMO_SUBSYSTEMS.map((sub, i) => {
              const Icon = STATUS_ICONS[sub.status] ?? Activity;
              const color = STATUS_COLORS[sub.status] ?? "#64748b";
              return (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200">{sub.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: `${color}15`, color }}>{sub.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{sub.detail}</div>
                    {sub.replayPath && <a href={sub.replayPath} className="text-[9px] text-[#4a90b8] hover:underline">→ {sub.replayPath}</a>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {sub.latencyMs && <div className="text-[9px] font-mono text-slate-400">{sub.latencyMs}ms</div>}
                    {sub.uptime && <div className="text-[9px] text-slate-600">{sub.uptime} up</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "incidents" && (
        <div className="space-y-3">
          {DEMO_RECENT_INCIDENTS.map(inc => (
            <div key={inc.id} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200">{inc.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase" style={{ background: `${STATUS_COLORS[inc.status] ?? "#64748b"}15`, color: STATUS_COLORS[inc.status] ?? "#64748b" }}>{inc.status}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${inc.severity === "medium" ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-slate-500/10 text-slate-400"}`}>{inc.severity}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Root cause: {inc.root}</div>
                </div>
                <div className="text-right text-[9px] text-slate-500">
                  <div>Duration: {inc.duration}</div>
                  {inc.resolvedAt && <div>Resolved: {new Date(inc.resolvedAt).toLocaleString()}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "metrics" && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Operational Metrics (Last 24h)</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Background Jobs Processed", value: "847", sub: "12 pending, 0 stuck" },
              { label: "Document Extractions", value: "156", sub: "154 success, 2 manual review" },
              { label: "AI Model Requests", value: "2,341", sub: "avg 890ms latency, $0.47 cost" },
              { label: "API Requests", value: "18,422", sub: "P99: 312ms, 0 5xx errors" },
              { label: "Notifications Sent", value: "93", sub: "In-app: 81, Teams: 12" },
              { label: "Proof Chain Entries", value: "42", sub: "6 pending review, 36 approved" },
            ].map((m, i) => (
              <div key={i} className="p-3 rounded" style={{ background: "#080c14" }}>
                <div className="text-[10px] text-slate-500">{m.label}</div>
                <div className="text-lg font-semibold text-slate-100 mt-0.5">{m.value}</div>
                <div className="text-[9px] text-slate-600">{m.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
