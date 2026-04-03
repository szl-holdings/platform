import { useState } from "react";
import { Network, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock, Zap } from "lucide-react";
import { demoIntegrations } from "@/lib/demo-seed";

const BG = { surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };

const INT_STATUS: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  connected: { label: "Connected", color: "#6b8f71", bg: "rgba(107,143,113,0.08)", border: "rgba(107,143,113,0.2)", icon: CheckCircle },
  degraded: { label: "Degraded", color: "#c8953c", bg: "rgba(200,149,60,0.08)", border: "rgba(200,149,60,0.2)", icon: AlertTriangle },
  disconnected: { label: "Disconnected", color: "#c45a4a", bg: "rgba(196,90,74,0.08)", border: "rgba(196,90,74,0.2)", icon: XCircle },
  configuring: { label: "Configuring", color: "#d4a054", bg: "rgba(212,160,84,0.08)", border: "rgba(212,160,84,0.2)", icon: Clock },
};

const TYPE_LABELS: Record<string, string> = {
  crm: "CRM", ticketing: "Ticketing", communication: "Communication", monitoring: "Monitoring",
  erp: "ERP", hr: "HR", identity: "Identity", analytics: "Analytics", billing: "Billing", cs_platform: "CS Platform",
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) {
    const absDiff = -diff;
    const mins = Math.floor(absDiff / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `in ${hrs}h`;
    return `in ${Math.floor(hrs / 24)}d`;
  }
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DemoIntegrationsPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = statusFilter === "all" ? demoIntegrations : demoIntegrations.filter(i => i.status === statusFilter);
  const connected = demoIntegrations.filter(i => i.status === "connected").length;
  const degraded = demoIntegrations.filter(i => i.status === "degraded").length;
  const disconnected = demoIntegrations.filter(i => i.status === "disconnected").length;
  const totalRecords = demoIntegrations.reduce((a, i) => a + i.recordsIngested, 0);
  const totalSignalSources = demoIntegrations.reduce((a, i) => a + i.signalSources, 0);

  return (
    <div className="p-4 max-w-[1100px] space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Network className="w-3.5 h-3.5" style={{ color: "#d4a054" }} />
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#d4a054" }}>Lyte · Integrations</span>
          </div>
          <h1 className="text-lg font-bold" style={{ color: TEXT.primary }}>Integration Status Panel</h1>
          <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>All connected data sources with sync health and signal generation status</p>
        </div>
        <button className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded border" style={{ color: TEXT.secondary, borderColor: "rgba(255,255,255,0.08)" }}>
          <RefreshCw className="w-3 h-3" /> Sync All
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Connected", value: connected, color: "#6b8f71" },
          { label: "Degraded", value: degraded, color: "#c8953c" },
          { label: "Disconnected", value: disconnected, color: "#c45a4a" },
          { label: "Records Ingested", value: fmt(totalRecords), color: TEXT.secondary },
          { label: "Signal Sources", value: totalSignalSources, color: "#d4a054" },
        ].map(c => (
          <div key={c.label} className="rounded-md p-3" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <div className="text-[8px] uppercase tracking-wider mb-1" style={{ color: TEXT.muted }}>{c.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: c.color as string }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        {["all", "connected", "degraded", "disconnected"].map(f => {
          const st = INT_STATUS[f as keyof typeof INT_STATUS];
          return (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="text-[9px] px-2.5 py-1 rounded border capitalize"
              style={{ color: statusFilter === f ? (st?.color ?? "#d4a054") : TEXT.muted, background: statusFilter === f ? (st?.bg ?? "rgba(212,160,84,0.08)") : "transparent", borderColor: statusFilter === f ? (st?.border ?? "rgba(212,160,84,0.2)") : BORDER.subtle }}>
              {f}
            </button>
          );
        })}
        <span className="ml-auto text-[9px] font-mono" style={{ color: TEXT.muted }}>{filtered.length} integrations</span>
      </div>

      <div className="space-y-2">
        {filtered.map(intg => {
          const st = INT_STATUS[intg.status];
          const Icon = st.icon;
          const hasErrors = intg.errorsLast24h > 0;
          return (
            <div key={intg.id} className="rounded-md px-4 py-3 flex items-center gap-4" style={{ background: BG.surface, border: `1px solid ${intg.status === "disconnected" ? "rgba(196,90,74,0.12)" : intg.status === "degraded" ? "rgba(200,149,60,0.12)" : BORDER.subtle}` }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color: st.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>{intg.name}</span>
                  <span className="text-[8px] px-1.5 py-px rounded font-mono uppercase" style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>{st.label}</span>
                  <span className="text-[8px] px-1.5 py-px rounded" style={{ color: TEXT.muted, background: "rgba(255,255,255,0.04)" }}>{TYPE_LABELS[intg.type]}</span>
                </div>
                <p className="text-[9px] leading-snug" style={{ color: TEXT.muted }}>{intg.description}</p>
              </div>
              <div className="grid grid-cols-4 gap-4 shrink-0">
                <div className="text-center">
                  <div className="text-[10px] font-mono font-medium" style={{ color: intg.status === "connected" ? TEXT.primary : TEXT.muted }}>{fmt(intg.recordsIngested)}</div>
                  <div className="text-[7px] uppercase tracking-wider" style={{ color: TEXT.muted }}>Records</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>{timeAgo(intg.lastSyncAt)}</div>
                  <div className="text-[7px] uppercase tracking-wider" style={{ color: TEXT.muted }}>Last Sync</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-mono" style={{ color: hasErrors ? "#c45a4a" : "#6b8f71" }}>{hasErrors ? `${intg.errorsLast24h} errors` : "Clean"}</div>
                  <div className="text-[7px] uppercase tracking-wider" style={{ color: TEXT.muted }}>24h Health</div>
                </div>
                <div className="text-center">
                  {intg.signalSources > 0 ? (
                    <>
                      <div className="text-[10px] font-mono flex items-center justify-center gap-0.5" style={{ color: "#d4a054" }}>
                        <Zap className="w-2.5 h-2.5" />{intg.signalSources}
                      </div>
                      <div className="text-[7px] uppercase tracking-wider" style={{ color: TEXT.muted }}>Signal Src</div>
                    </>
                  ) : (
                    <>
                      <div className="text-[10px] font-mono" style={{ color: TEXT.muted }}>—</div>
                      <div className="text-[7px] uppercase tracking-wider" style={{ color: TEXT.muted }}>Signal Src</div>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <div className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{intg.syncFrequency}</div>
                <div className="text-[7px]" style={{ color: TEXT.muted }}>Owner: {intg.owner}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
