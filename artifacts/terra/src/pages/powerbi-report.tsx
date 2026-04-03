import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Building2, TrendingUp, DollarSign, Home, AlertTriangle, Activity, Info, Loader2 } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { PowerBiEmbed, type PowerBiEmbedConfig, apiFetch } from "@szl-holdings/shared-ui";

const PORTFOLIO_METRICS = [
  { label: "Portfolio Value", value: "$48.3M", delta: "+4.1%", up: true, icon: DollarSign, color: "#10b981" },
  { label: "Avg Occupancy", value: "91.4%", delta: "+2.1%", up: true, icon: Building2, color: "#3b82f6" },
  { label: "NOI (YTD)", value: "$3.2M", delta: "+6.8%", up: true, icon: TrendingUp, color: "#10b981" },
  { label: "Active Listings", value: "23", delta: "+4", up: true, icon: Home, color: "#8b5cf6" },
  { label: "Distress Signals", value: "7", delta: "-3", up: false, icon: AlertTriangle, color: "#f59e0b" },
  { label: "Avg IRR", value: "18.4%", delta: "+0.9%", up: true, icon: BarChart3, color: "#10b981" },
];

const OCCUPANCY_DATA = [
  { name: "Industrial", occupancy: 96, target: 95 },
  { name: "Multi-Family", occupancy: 94, target: 95 },
  { name: "Office", occupancy: 78, target: 90 },
  { name: "Retail", occupancy: 88, target: 90 },
  { name: "Mixed-Use", occupancy: 91, target: 92 },
];

const REVENUE_TREND = [
  { month: "Oct", revenue: 820, noi: 490 },
  { month: "Nov", revenue: 855, noi: 512 },
  { month: "Dec", revenue: 870, noi: 530 },
  { month: "Jan", revenue: 840, noi: 498 },
  { month: "Feb", revenue: 895, noi: 548 },
  { month: "Mar", revenue: 932, noi: 576 },
];

interface EmbedTokenResponse {
  embedToken: string;
  embedUrl: string;
  reportId: string;
  groupId: string;
  expiration: string;
}

export default function TerraPowerBiReport() {
  const [embedConfig, setEmbedConfig] = useState<PowerBiEmbedConfig | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const maxRevenue = Math.max(...REVENUE_TREND.map(d => d.revenue));

  const fetchEmbedToken = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const data = await apiFetch<{ data: EmbedTokenResponse }>("/admin/powerbi-config/embed-token", {
        method: "POST",
        body: JSON.stringify({ reportKey: "portfolio_analytics" }),
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-terra-text flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-terra-emerald" />
            Portfolio Analytics
          </h1>
          <p className="text-sm text-terra-text-secondary mt-1">
            Power BI embedded report — portfolio-wide analytics, occupancy trends, NOI performance, and distress signals.
          </p>
        </div>
        <button
          onClick={fetchEmbedToken}
          disabled={fetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-terra-emerald/10 text-terra-emerald text-xs font-semibold hover:bg-terra-emerald/20 transition-colors border border-terra-emerald/20 flex-shrink-0"
        >
          {fetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
          {embedConfig ? "Refresh Token" : "Load Live Report"}
        </button>
      </motion.div>

      {fetchError && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-terra-text-secondary">
            <strong className="text-red-400">Embed error:</strong> {fetchError}
          </div>
        </motion.div>
      )}

      <PowerBiEmbed
        config={embedConfig}
        title="Portfolio Analytics Report"
        description="Portfolio-wide occupancy, NOI performance, and distress signals"
        height={520}
        accentColor="#10b981"
        onConfigureClick={fetchEmbedToken}
      />

      {!embedConfig && (
        <>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-terra-border bg-terra-emerald/5 p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-terra-emerald mt-0.5 flex-shrink-0" />
            <div className="text-xs text-terra-text-secondary leading-relaxed">
              <strong className="text-terra-text">Sample data shown below.</strong> Click "Load Live Report" to fetch a server-minted embed token. Configure Power BI credentials in SZL Admin → Power BI.
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PORTFOLIO_METRICS.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 rounded-xl border border-terra-border bg-terra-surface/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-4 h-4 text-terra-text-muted" />
                    <span className={cn("text-xs font-semibold", m.up ? "text-terra-emerald" : "text-terra-rose")}>
                      {m.delta}
                    </span>
                  </div>
                  <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
                  <p className="text-xl font-display font-bold text-terra-text">{m.value}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-terra-border bg-terra-surface p-5">
              <h3 className="text-sm font-semibold text-terra-text mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-terra-primary" /> Occupancy by Asset Type
              </h3>
              <div className="space-y-3">
                {OCCUPANCY_DATA.map(d => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-terra-text">{d.name}</span>
                      <span className={cn("text-xs font-bold", d.occupancy >= d.target ? "text-terra-emerald" : "text-terra-amber")}>{d.occupancy}%</span>
                    </div>
                    <div className="relative h-2 bg-terra-bg-tertiary rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ width: `${d.occupancy}%`, background: d.occupancy >= d.target ? "#10b981" : "#f59e0b" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-2xl border border-terra-border bg-terra-surface p-5">
              <h3 className="text-sm font-semibold text-terra-text mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-terra-emerald" /> Revenue vs NOI Trend (K)
              </h3>
              <div className="flex items-end gap-2 h-40">
                {REVENUE_TREND.map(d => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col justify-end" style={{ height: "120px" }}>
                      <div className="w-full rounded-t-sm bg-terra-emerald/30" style={{ height: `${(d.noi / maxRevenue) * 100}%` }} />
                      <div className="w-full rounded-t-sm bg-terra-primary/60 -mt-0.5" style={{ height: `${((d.revenue - d.noi) / maxRevenue) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-terra-text-muted">{d.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-terra-primary/60" /><span className="text-[10px] text-terra-text-muted">Revenue</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-terra-emerald/30" /><span className="text-[10px] text-terra-text-muted">NOI</span></div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
