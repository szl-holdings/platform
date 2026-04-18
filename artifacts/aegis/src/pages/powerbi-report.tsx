import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { useState } from "react";
import { BarChart3, Shield, AlertTriangle, CheckCircle2, Activity, Loader2, Info } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { PowerBiEmbed, type PowerBiEmbedConfig } from "@szl-holdings/shared-ui";

const SAMPLE_METRICS = [
  { label: "Overall Risk Score", value: "34", unit: "/ 100", delta: "-8 pts", up: false, color: "text-emerald-400" },
  { label: "Open Incidents", value: "12", unit: "", delta: "-3 this week", up: false, color: "text-blue-400" },
  { label: "Controls Passing", value: "94.2%", unit: "", delta: "+1.4%", up: true, color: "text-emerald-400" },
  { label: "Threat Intel Hits", value: "7", unit: "", delta: "+2 today", up: false, color: "text-amber-400" },
  { label: "MTTR (hrs)", value: "4.2", unit: "hrs", delta: "-0.8", up: false, color: "text-emerald-400" },
  { label: "Compliance Score", value: "88.5%", unit: "", delta: "+3.1%", up: true, color: "text-emerald-400" },
];

const FRAMEWORK_SCORES = [
  { name: "NIST CSF", score: 82, color: "#3b82f6" },
  { name: "ISO 27001", score: 76, color: "#8b5cf6" },
  { name: "SOC 2", score: 91, color: "#10b981" },
  { name: "CIS Controls", score: 79, color: "#f59e0b" },
  { name: "MITRE ATT&CK", score: 65, color: "#f43f5e" },
];

const INCIDENT_TREND = [
  { month: "Oct", critical: 3, high: 8, medium: 14 },
  { month: "Nov", critical: 2, high: 6, medium: 11 },
  { month: "Dec", critical: 1, high: 5, medium: 9 },
  { month: "Jan", critical: 2, high: 7, medium: 12 },
  { month: "Feb", critical: 1, high: 4, medium: 8 },
  { month: "Mar", critical: 0, high: 3, medium: 7 },
];

interface EmbedTokenResponse {
  embedToken: string;
  embedUrl: string;
  reportId: string;
  groupId: string;
  expiration: string;
}

export default function AegisPowerBiReport() {
  const [embedConfig, setEmbedConfig] = useState<PowerBiEmbedConfig | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const maxBar = Math.max(...INCIDENT_TREND.map(d => d.critical + d.high + d.medium));

  const fetchEmbedToken = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const data = await apiFetch<{ data: EmbedTokenResponse }>("/admin/powerbi-config/embed-token", {
        method: "POST",
        body: JSON.stringify({ reportKey: "security_posture" }),
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
    <div className="p-6 space-y-6 overflow-auto">
      <div className="flex items-start justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            Security Posture Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Power BI embedded report — real-time security posture, incident trends, and compliance scoring.
          </p>
        </div>
        <button
          onClick={fetchEmbedToken}
          disabled={fetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors border border-primary/20 flex-shrink-0"
        >
          {fetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
          {embedConfig ? "Refresh Token" : "Load Live Report"}
        </button>
      </div>

      {fetchError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3 animate-fade-in-up">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground">
            <strong className="text-red-400">Embed error:</strong> {fetchError}
          </div>
        </div>
      )}

      <PowerBiEmbed
        config={embedConfig}
        title="Security Posture Report"
        description="Real-time risk posture, incident trends, and compliance scoring"
        height={520}
        accentColor="#3b82f6"
        onConfigureClick={fetchEmbedToken}
      />

      {!embedConfig && (
        <>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3 animate-fade-in-up">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Sample data shown below.</strong> Click "Load Live Report" to fetch a server-minted embed token and load live Power BI data. Configure credentials in SZL Admin → Power BI.
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in-up">
            {SAMPLE_METRICS.map(m => (
              <div key={m.label} className="bg-card border border-border rounded-xl p-4">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{m.label}</div>
                <div className="flex items-end gap-1">
                  <span className={cn("text-2xl font-bold font-display", m.color)}>{m.value}</span>
                  {m.unit && <span className="text-xs text-muted-foreground mb-0.5">{m.unit}</span>}
                </div>
                <div className={cn("text-[10px] font-medium mt-1", m.up ? "text-emerald-400" : "text-red-400/80")}>{m.delta}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Incident Volume Trend
              </h3>
              <div className="space-y-1">
                {INCIDENT_TREND.map(d => {
                  const total = d.critical + d.high + d.medium;
                  return (
                    <div key={d.month} className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground w-6">{d.month}</span>
                      <div className="flex-1 h-5 bg-muted/30 rounded-sm overflow-hidden flex">
                        <div className="bg-red-500/70 h-full" style={{ width: `${(d.critical / maxBar) * 100}%` }} />
                        <div className="bg-orange-400/70 h-full" style={{ width: `${(d.high / maxBar) * 100}%` }} />
                        <div className="bg-amber-400/40 h-full" style={{ width: `${(d.medium / maxBar) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-5 text-right">{total}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Framework Compliance Scores
              </h3>
              <div className="space-y-3">
                {FRAMEWORK_SCORES.map(f => (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground">{f.name}</span>
                      <span className="text-xs font-bold" style={{ color: f.color }}>{f.score}%</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: f.color }} />
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
