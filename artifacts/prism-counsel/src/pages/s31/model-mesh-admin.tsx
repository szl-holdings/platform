import { Brain, Zap, Activity, Server, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useModelMeshLanes, useModelMeshStats, useAdminOverview } from "../../hooks/use-prism-s31";

const DEMO_LANES = [
  { lane: "embedding", provider: "openai", model: "text-embedding-3-large", status: "active", priority: 1, costPer1kTokens: "0.0001" },
  { lane: "retrieval", provider: "anthropic", model: "claude-3-haiku", status: "active", priority: 1, costPer1kTokens: "0.0003" },
  { lane: "classification", provider: "openai", model: "gpt-4o-mini", status: "active", priority: 1, costPer1kTokens: "0.00015" },
  { lane: "extraction", provider: "openai", model: "gpt-4o", status: "active", priority: 1, costPer1kTokens: "0.005" },
  { lane: "reasoning", provider: "anthropic", model: "claude-3.5-sonnet", status: "active", priority: 1, costPer1kTokens: "0.003" },
  { lane: "forecast", provider: "anthropic", model: "claude-3.5-sonnet", status: "active", priority: 2, costPer1kTokens: "0.003" },
  { lane: "policy_guardrail", provider: "openai", model: "gpt-4o-mini", status: "active", priority: 1, costPer1kTokens: "0.00015" },
];

const DEMO_SUBSYSTEMS = [
  { name: "Model Mesh", status: "operational", detail: "7 lanes active" },
  { name: "HF Gateway", status: "operational", detail: "8 task types" },
  { name: "Worldline Engine", status: "operational", detail: "7 source classes" },
  { name: "Pressure Graph", status: "operational", detail: "12 dimensions" },
  { name: "Proof Chain", status: "operational", detail: "SHA-256 verified" },
  { name: "Matter Twin", status: "operational", detail: "14 domains" },
  { name: "Copilot Workbench", status: "operational", detail: "5 modes" },
  { name: "Forecast Diff", status: "operational", detail: "Change tracking" },
  { name: "M365 Integration", status: "pending_config", detail: "Awaiting tenant" },
  { name: "Cost Tracking", status: "operational", detail: "Per-workflow" },
];

export default function ModelMeshAdminPage() {
  const { data: lanesData } = useModelMeshLanes();
  const { data: statsData } = useModelMeshStats(24);
  const { data: overviewData } = useAdminOverview();

  const lanes = lanesData?.lanes?.length > 0 ? lanesData.lanes : DEMO_LANES;
  const subsystems = overviewData?.subsystems ?? DEMO_SUBSYSTEMS;
  const isDemo = !lanesData?.lanes?.length;

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-[#8b7ac8]" />
          <h1 className="text-lg font-semibold text-slate-100">Model Mesh Admin</h1>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDemo ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{isDemo ? "DEMO" : "LIVE"}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Multi-model AI mesh — 7 lanes, circuit breaker, failover routing, cost telemetry</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Lanes", value: "7", icon: Zap, color: "#8b7ac8" },
          { label: "Requests (24h)", value: statsData?.stats?.total ?? "1,247", icon: Activity, color: "#4a90b8" },
          { label: "Avg Latency", value: statsData?.stats?.avgLatency ?? "340ms", icon: Clock, color: "#d4a054" },
          { label: "Error Rate", value: statsData?.stats?.errorRate ?? "0.3%", icon: AlertTriangle, color: "#c45a4a" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center gap-2 mb-1"><Icon className="w-3.5 h-3.5" style={{ color: s.color }} /><span className="text-[10px] text-slate-500">{s.label}</span></div>
              <div className="text-xl font-bold text-slate-100">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-[#8b7ac8]" />Model Lanes</h3>
        <div className="space-y-2">
          {lanes.map((lane: any, i: number) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <div className={`w-2 h-2 rounded-full ${lane.status === "active" ? "bg-[#4a90b8]" : lane.status === "degraded" ? "bg-[#d4a054]" : "bg-[#c45a4a]"}`} />
              <div className="w-[120px]">
                <div className="text-xs font-medium text-slate-200">{lane.lane ?? lane.laneName}</div>
                <div className="text-[9px] text-slate-500">Priority {lane.priority}</div>
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-slate-400">{lane.provider} / {lane.model ?? lane.primaryModel}</div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">${lane.costPer1kTokens}/1K tok</div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${lane.status === "active" ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>{lane.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2"><Server className="w-4 h-4 text-[#4a90b8]" />Section 31 Subsystems</h3>
        <div className="grid grid-cols-2 gap-2">
          {subsystems.map((sys: any, i: number) => (
            <div key={i} className="flex items-center gap-2 py-2 px-3 rounded bg-white/[0.02]">
              {sys.status === "operational" ? <CheckCircle className="w-3.5 h-3.5 text-[#4a90b8]" /> : <Clock className="w-3.5 h-3.5 text-[#d4a054]" />}
              <div className="flex-1">
                <div className="text-[11px] font-medium text-slate-200">{sys.name}</div>
                <div className="text-[9px] text-slate-500">{sys.detail ?? sys.status}</div>
              </div>
              <span className={`text-[8px] px-1 py-0.5 rounded font-mono ${sys.status === "operational" ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>{sys.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
