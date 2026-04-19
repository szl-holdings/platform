import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useState } from "react";
import { BarChart3, Activity, CheckCircle2, AlertOctagon, Clock, TrendingUp, AlertTriangle, Loader2, Info } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { PowerBiEmbed, type PowerBiEmbedConfig } from "@szl-holdings/shared-ui/powerbi-embed";

const OPS_METRICS = [
  { label: "SLA Compliance", value: "97.8%", delta: "+0.3%", up: true, color: "text-[#d4a054]", icon: CheckCircle2 },
  { label: "Open Escalations", value: "4", delta: "-2 this week", up: false, color: "text-[#6b8f71]", icon: AlertOctagon },
  { label: "MTTR (hrs)", value: "2.4", delta: "-0.6", up: false, color: "text-[#6b8f71]", icon: Clock },
  { label: "Signal Volume", value: "1,243", delta: "+18%", up: true, color: "text-[#d4a054]", icon: Activity },
  { label: "PRISM Health Score", value: "82", delta: "+4 pts", up: true, color: "text-[#6b8f71]", icon: BarChart3 },
  { label: "Workflow Success Rate", value: "96.1%", delta: "+1.2%", up: true, color: "text-[#6b8f71]", icon: TrendingUp },
];

const PRISM_LENSES = [
  { name: "Financial Health", score: 84, color: "#6b8f71" },
  { name: "Operational Risk", score: 71, color: "#d4a054" },
  { name: "Growth Velocity", score: 88, color: "#4a90b8" },
  { name: "Customer Retention", score: 91, color: "#6b8f71" },
  { name: "Team Effectiveness", score: 76, color: "#d4a054" },
  { name: "Infrastructure Stability", score: 93, color: "#6b8f71" },
  { name: "Compliance Readiness", score: 79, color: "#d4a054" },
];

const ESCALATION_TREND = [
  { week: "W1", critical: 3, high: 7, resolved: 9 },
  { week: "W2", critical: 2, high: 5, resolved: 7 },
  { week: "W3", critical: 1, high: 6, resolved: 8 },
  { week: "W4", critical: 2, high: 4, resolved: 5 },
  { week: "W5", critical: 0, high: 3, resolved: 4 },
  { week: "W6", critical: 1, high: 2, resolved: 4 },
];

interface EmbedTokenResponse {
  embedToken: string;
  embedUrl: string;
  reportId: string;
  groupId: string;
  expiration: string;
}

export default function LytePowerBiReport() {
  const [embedConfig, setEmbedConfig] = useState<PowerBiEmbedConfig | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const maxEscalation = Math.max(...ESCALATION_TREND.map(d => d.critical + d.high));

  const fetchEmbedToken = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const data = await apiFetch<{ data: EmbedTokenResponse }>("/admin/powerbi-config/embed-token", {
        method: "POST",
        body: JSON.stringify({ reportKey: "operational_kpis" }),
      });
      const token = data.data;
      if (token) {
        setEmbedConfig({
          reportId: token.reportId,
          groupId: token.groupId,
          embedUrl: token.embedUrl,
          embedToken: token.embedToken,
          expiration: token.expiration,
        });
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch embed token");
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-[#d4a054]" />
            Operational KPIs
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Power BI embedded report — SLA performance, escalation trends, PRISM health scores, and workflow analytics.
          </p>
        </div>
        <button
          onClick={fetchEmbedToken}
          disabled={fetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d4a054]/10 text-[#d4a054] text-xs font-semibold hover:bg-[#d4a054]/20 transition-colors border border-[#d4a054]/20 flex-shrink-0"
        >
          {fetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
          {embedConfig ? "Refresh Token" : "Load Live Report"}
        </button>
      </div>

      {fetchError && (
        <div className="rounded-xl border border-[#c45a4a]/20 bg-[#c45a4a]/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#c45a4a] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-400">
            <strong className="text-[#c45a4a]">Embed error:</strong> {fetchError}
          </div>
        </div>
      )}

      <PowerBiEmbed
        config={embedConfig}
        title="Operational KPIs Report"
        description="SLA compliance, escalation trends, and PRISM intelligence scores"
        height={520}
        accentColor="#d4a054"
        onConfigureClick={fetchEmbedToken}
      />

      {!embedConfig && (
        <>
          <div className="rounded-xl border border-[#d4a054]/20 bg-[#d4a054]/5 p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#d4a054] mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-white">Sample data shown below.</strong> Click "Load Live Report" to fetch a server-minted embed token. Configure Power BI credentials in SZL Admin → Power BI.
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {OPS_METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-slate-900 border border-slate-700/60 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span className={cn("text-xs font-semibold", m.up ? "text-[#6b8f71]" : "text-[#c45a4a]/80")}>{m.delta}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{m.label}</div>
                  <div className={cn("text-xl font-bold font-mono", m.color)}>{m.value}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#d4a054]" /> Escalation Volume (6-week)
              </h3>
              <div className="space-y-2">
                {ESCALATION_TREND.map(d => {
                  const total = d.critical + d.high;
                  return (
                    <div key={d.week} className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 w-5">{d.week}</span>
                      <div className="flex-1 h-5 bg-slate-800 rounded-sm overflow-hidden flex">
                        {d.critical > 0 && <div className="bg-[#c45a4a]/70 h-full" style={{ width: `${(d.critical / (maxEscalation || 1)) * 100}%` }} />}
                        {d.high > 0 && <div className="bg-[#d4a054]/60 h-full" style={{ width: `${(d.high / (maxEscalation || 1)) * 100}%` }} />}
                      </div>
                      <span className="text-[10px] text-slate-400 w-14 text-right">{total} open</span>
                      <span className="text-[10px] text-[#6b8f71] w-16 text-right">{d.resolved} resolved</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#d4a054]" /> PRISM Intelligence Scores
              </h3>
              <div className="space-y-3">
                {PRISM_LENSES.map(l => (
                  <div key={l.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-300">{l.name}</span>
                      <span className="text-xs font-bold" style={{ color: l.color }}>{l.score}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${l.score}%`, background: l.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
