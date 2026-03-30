import { CONNECTORS_UI } from "@workspace/shared-ui/core-observability-data";
import { Network, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const HEALTH_ICONS: Record<string, React.ReactNode> = {
  healthy: <CheckCircle className="w-3.5 h-3.5" style={{ color: "#10b981" }} />,
  degraded: <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />,
  error: <XCircle className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />,
};

const HEALTH_COLORS: Record<string, string> = {
  healthy: "#10b981",
  degraded: "#f59e0b",
  error: "#ef4444",
};

export default function ConnectorMesh() {
  const healthy = CONNECTORS_UI.filter(c => c.health === "healthy");
  const degraded = CONNECTORS_UI.filter(c => c.health === "degraded");
  const error = CONNECTORS_UI.filter(c => c.health === "error");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Network className="w-4 h-4" style={{ color: "#00d4ff" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#00d4ff" }}>AlloyScape · Connector Mesh</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Connector Mesh</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>All integrations, data connectors, health status, and API credentials powering AlloyScape automation.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Healthy", value: healthy.length, color: "#10b981" },
          { label: "Degraded", value: degraded.length, color: "#f59e0b" },
          { label: "Error / Down", value: error.length, color: "#ef4444" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CONNECTORS_UI.map(c => (
          <div key={c.id} className="rounded-xl border p-4" style={{
            borderColor: c.health === "error" ? "rgba(239,68,68,0.2)" : c.health === "degraded" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.07)",
            background: c.health === "error" ? "rgba(239,68,68,0.02)" : "rgba(255,255,255,0.01)",
          }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {HEALTH_ICONS[c.health]}
                  <span className="text-sm font-medium text-white">{c.name}</span>
                </div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{c.type} · {c.category}</div>
              </div>
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0" style={{ color: HEALTH_COLORS[c.health], background: `${HEALTH_COLORS[c.health]}12`, border: `1px solid ${HEALTH_COLORS[c.health]}25` }}>{c.health}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div>
                <div className="text-sm font-bold" style={{ color: "#00d4ff" }}>{c.requests_today.toLocaleString()}</div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>req today</div>
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: c.error_rate > 5 ? "#ef4444" : "#10b981" }}>{c.error_rate}%</div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>error rate</div>
              </div>
              <div>
                <div className="text-sm font-bold" style={{ color: c.latency_ms > 500 ? "#f59e0b" : "#10b981" }}>{c.latency_ms}ms</div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>latency</div>
              </div>
            </div>

            {c.last_error && (
              <div className="rounded-md p-2 mb-3 text-[9px]" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444" }}>
                {c.last_error}
              </div>
            )}

            <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>Last sync: {c.last_sync}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
