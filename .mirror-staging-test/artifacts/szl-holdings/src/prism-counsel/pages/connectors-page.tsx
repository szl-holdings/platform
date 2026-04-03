import { useState } from "react";
import { Plug, RefreshCw, CheckCircle, XCircle, Clock, Wifi, WifiOff, Loader2, Activity, AlertTriangle } from "lucide-react";
import { usePrismConnectors, usePrismTriggerSync, usePrismJobs, usePrismPipelineStats, usePrismHealth } from "../hooks/use-prism-api";

const CONNECTOR_ICONS: Record<string, string> = {
  graph: "Microsoft Graph",
  clio: "Clio",
  needles: "Needles",
  litify: "Litify",
  docusign: "DocuSign",
  box: "Box",
};

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  active: { color: "#4a90b8", bg: "#4a90b8" },
  healthy: { color: "#4a90b8", bg: "#4a90b8" },
  connected: { color: "#4a90b8", bg: "#4a90b8" },
  warning: { color: "#d4a054", bg: "#d4a054" },
  degraded: { color: "#d4a054", bg: "#d4a054" },
  error: { color: "#c45a4a", bg: "#c45a4a" },
  disconnected: { color: "#c45a4a", bg: "#c45a4a" },
  syncing: { color: "#8b7ac8", bg: "#8b7ac8" },
};

const DEMO_CONNECTORS = [
  { accountId: 1, connectorType: "graph", status: "active", lastSyncAt: new Date(Date.now() - 1800000).toISOString(), lastSyncStatus: "success", syncFrequencyMinutes: 15, errorCount: 0 },
  { accountId: 2, connectorType: "clio", status: "active", lastSyncAt: new Date(Date.now() - 3600000).toISOString(), lastSyncStatus: "success", syncFrequencyMinutes: 30, errorCount: 0 },
  { accountId: 3, connectorType: "docusign", status: "warning", lastSyncAt: new Date(Date.now() - 7200000).toISOString(), lastSyncStatus: "partial", syncFrequencyMinutes: 60, errorCount: 2 },
  { accountId: 4, connectorType: "box", status: "disconnected", lastSyncAt: null, lastSyncStatus: null, syncFrequencyMinutes: null, errorCount: 5 },
];

export default function ConnectorsPage() {
  const connectorsQ = usePrismConnectors();
  const jobsQ = usePrismJobs();
  const pipelineQ = usePrismPipelineStats();
  const healthQ = usePrismHealth();
  const syncMut = usePrismTriggerSync();
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const isLive = !!connectorsQ.data?.connectors;
  const connectors = isLive ? connectorsQ.data!.connectors : DEMO_CONNECTORS;

  const healthStatus = healthQ.data?.status ?? "unknown";
  const jobStats = jobsQ.data?.stats ?? {};
  const dlqCount = jobsQ.data?.deadLetterCount ?? 0;
  const pipeline = pipelineQ.data;

  function handleSync(accountId: number) {
    if (!isLive) return;
    setSyncingId(accountId);
    syncMut.mutate(accountId, {
      onSettled: () => setSyncingId(null),
    });
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Plug className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">Connectors & Infrastructure</h1>
          </div>
          <p className="text-xs text-slate-500">System health, connector status, job queues, and document pipeline</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
          isLive ? "bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20" : "bg-slate-500/10 text-slate-500 border border-white/[0.06]"
        }`}>
          {connectorsQ.isLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : isLive ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
          {connectorsQ.isLoading ? "LOADING" : isLive ? "LIVE" : "DEMO"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-3.5 h-3.5 text-[#4a90b8]" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">API Status</span>
          </div>
          <div className="text-lg font-semibold" style={{ color: healthStatus === "operational" ? "#4a90b8" : "#d4a054" }}>
            {healthStatus === "operational" ? "Operational" : healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
          </div>
        </div>
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-2">
            <Plug className="w-3.5 h-3.5 text-[#d4a054]" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Connectors</span>
          </div>
          <div className="text-lg font-semibold text-slate-100">{connectors.length}</div>
          <div className="text-[10px] text-slate-500">{connectors.filter(c => c.status === "active" || c.status === "healthy" || c.status === "connected").length} active</div>
        </div>
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-[#8b7ac8]" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Job Queue</span>
          </div>
          <div className="text-lg font-semibold text-slate-100">{Object.values(jobStats).reduce((a: number, b: any) => a + (Number(b) || 0), 0)}</div>
          <div className="text-[10px] text-slate-500">total jobs tracked</div>
        </div>
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: dlqCount > 0 ? "#c45a4a" : "#4a90b8" }} />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Dead Letter</span>
          </div>
          <div className="text-lg font-semibold" style={{ color: dlqCount > 0 ? "#c45a4a" : "#4a90b8" }}>{dlqCount}</div>
          <div className="text-[10px] text-slate-500">unresolved failures</div>
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Connector Status</h2>
        <div className="space-y-2">
          {connectors.map(c => {
            const style = STATUS_STYLES[c.status] || STATUS_STYLES.warning;
            const isSyncing = syncingId === c.accountId;
            return (
              <div key={c.accountId} className="rounded border border-white/[0.06] p-4 flex items-center gap-4" style={{ background: "#080c14" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: style.bg + "15" }}>
                  <Plug className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">
                      {CONNECTOR_ICONS[c.connectorType] || c.connectorType}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium" style={{ background: style.bg + "15", color: style.color }}>
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                    {c.lastSyncAt && (
                      <span>Last sync: {new Date(c.lastSyncAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    )}
                    {c.syncFrequencyMinutes && <span>Every {c.syncFrequencyMinutes}m</span>}
                    {c.errorCount > 0 && <span className="text-[#c45a4a]">{c.errorCount} errors</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleSync(c.accountId)}
                  disabled={isSyncing || !isLive}
                  className="px-3 py-1.5 rounded text-[10px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-40 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {pipeline && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Document Pipeline</h2>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Total Documents", value: pipeline.totalDocuments, color: "#4a90b8" },
              { label: "Pending Extraction", value: pipeline.pendingExtraction, color: "#d4a054" },
              { label: "Completed", value: pipeline.completedExtraction, color: "#4a90b8" },
              { label: "Failed", value: pipeline.failedExtraction, color: "#c45a4a" },
              { label: "Manual Review", value: pipeline.manualReviewQueue, color: "#8b7ac8" },
            ].map((item) => (
              <div key={item.label} className="rounded border border-white/[0.06] p-3" style={{ background: "#080c14" }}>
                <div className="text-[10px] text-slate-500 uppercase mb-1">{item.label}</div>
                <div className="text-lg font-mono font-semibold" style={{ color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(jobStats).length > 0 && (
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Job Queue Breakdown</h2>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(jobStats).map(([type, count]) => (
              <div key={type} className="rounded border border-white/[0.06] p-3 flex items-center justify-between" style={{ background: "#080c14" }}>
                <span className="text-[10px] text-slate-400">{type.replace(/_/g, " ")}</span>
                <span className="text-xs font-mono text-slate-200">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
