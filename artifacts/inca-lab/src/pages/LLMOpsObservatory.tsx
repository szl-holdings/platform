import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type TokenUsage, type CostTrend, type GovernanceAudit } from "../lib/api";
import { cn, formatNumber } from "../lib/utils";
import { Shield, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  anthropic: "#f97316",
  gemini: "#60a5fa",
  huggingface: "#a78bfa",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
  if (status === "blocked") return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
}

export function LLMOpsObservatory() {
  const [costView, setCostView] = useState<"stacked" | "total">("stacked");
  const [auditFilter, setAuditFilter] = useState<string | null>(null);

  const tokenQuery = useQuery({
    queryKey: ["inca-tokens"],
    queryFn: () => api.getTokenUsage(),
    staleTime: 120000,
  });
  const costQuery = useQuery({
    queryKey: ["inca-costs"],
    queryFn: () => api.getCostTrends(),
    staleTime: 120000,
  });
  const governanceQuery = useQuery({
    queryKey: ["inca-governance"],
    queryFn: () => api.getGovernanceAudit(),
    staleTime: 60000,
  });

  const tokenUsage: TokenUsage[] = tokenQuery.data?.data ?? [];
  const costTrends: CostTrend[] = costQuery.data?.data ?? [];
  const governanceAudit: GovernanceAudit[] = governanceQuery.data?.data ?? [];

  const costByDate = costTrends.map(d => ({
    date: d.date.slice(5),
    openai: d.openai,
    anthropic: d.anthropic,
    gemini: d.gemini,
    huggingface: d.huggingface,
    total: parseFloat((d.openai + d.anthropic + d.gemini + d.huggingface).toFixed(2)),
  }));

  const tokenByProvider = tokenUsage.reduce((acc, t) => {
    acc[t.provider] = (acc[t.provider] || 0) + t.tokens;
    return acc;
  }, {} as Record<string, number>);

  const totalCost30d = costTrends.reduce((s, d) => s + d.openai + d.anthropic + d.gemini + d.huggingface, 0);
  const totalTokens30d = Object.values(tokenByProvider).reduce((s, v) => s + v, 0);

  const filteredAudit = governanceAudit.filter(a => !auditFilter || a.status === auditFilter);

  const loading = tokenQuery.isLoading || costQuery.isLoading;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">LLMOps Observatory</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Token usage analytics, provider cost trends, and governance audit trail across the entire Nuro Mesh.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Loading observatory data...
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">30-Day Cost</div>
          <div className="text-xl font-display font-bold text-foreground">{totalCost30d > 0 ? `$${totalCost30d.toFixed(2)}` : "—"}</div>
          <div className="text-xs text-muted-foreground">all providers</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Total Tokens</div>
          <div className="text-xl font-display font-bold text-foreground">{totalTokens30d > 0 ? formatNumber(totalTokens30d) : "—"}</div>
          <div className="text-xs text-muted-foreground">30-day window</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Governance Events</div>
          <div className="text-xl font-display font-bold text-foreground">{governanceAudit.length > 0 ? governanceAudit.length : "—"}</div>
          <div className="text-xs text-muted-foreground">{governanceAudit.filter(a => a.sensitiveData).length} with sensitive data</div>
        </div>
        <div className="kpi-tile p-3">
          <div className="text-xs text-muted-foreground mb-1">Policy Blocks</div>
          <div className={cn("text-xl font-display font-bold", governanceAudit.filter(a => a.status === "blocked").length > 0 ? "text-red-400" : "text-foreground")}>
            {governanceAudit.length > 0 ? governanceAudit.filter(a => a.status === "blocked").length : "—"}
          </div>
          <div className="text-xs text-muted-foreground">last 30 days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Cost trend chart */}
        <div className="lg:col-span-2 inca-panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-foreground">Provider Cost Trends (30d)</div>
            <div className="flex gap-1 p-1 bg-secondary rounded-lg">
              <button
                onClick={() => setCostView("stacked")}
                className={cn("px-2.5 py-1 rounded text-xs font-medium transition-all", costView === "stacked" ? "bg-card text-foreground" : "text-muted-foreground")}
              >
                Stacked
              </button>
              <button
                onClick={() => setCostView("total")}
                className={cn("px-2.5 py-1 rounded text-xs font-medium transition-all", costView === "total" ? "bg-card text-foreground" : "text-muted-foreground")}
              >
                Total
              </button>
            </div>
          </div>
          {costQuery.isError && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Could not load cost data
            </div>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={costByDate.slice(-14)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {Object.entries(PROVIDER_COLORS).map(([p, c]) => (
                  <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(240,14%,15%,1)" />
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: "hsl(240 16% 8%)", border: "1px solid hsl(240 14% 10%)", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "#e2e8f0" }}
                formatter={(v: number) => [`$${v.toFixed(3)}`, ""]}
              />
              {costView === "stacked" ? (
                Object.entries(PROVIDER_COLORS).map(([p, c]) => (
                  <Area key={p} type="monotone" dataKey={p} stackId="1" stroke={c} fill={`url(#grad-${p})`} strokeWidth={1.5} />
                ))
              ) : (
                <Area type="monotone" dataKey="total" stroke="#7c3aed" fill="url(#grad-openai)" strokeWidth={2} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Token distribution */}
        <div className="inca-panel p-4">
          <div className="text-sm font-medium text-foreground mb-3">Token Usage by Provider</div>
          {tokenQuery.isError && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Could not load token data
            </div>
          )}
          <div className="space-y-3">
            {Object.entries(tokenByProvider).map(([provider, tokens]) => (
              <div key={provider}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[provider] || "#888" }} />
                    <div className="text-xs text-muted-foreground capitalize">{provider}</div>
                  </div>
                  <div className="text-xs text-foreground font-mono">{formatNumber(tokens)}</div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: totalTokens30d > 0 ? `${(tokens / totalTokens30d) * 100}%` : "0%", backgroundColor: PROVIDER_COLORS[provider] || "#888" }}
                  />
                </div>
              </div>
            ))}
          </div>
          {Object.keys(tokenByProvider).length === 0 && !tokenQuery.isLoading && (
            <div className="text-xs text-muted-foreground text-center py-4">No token data available</div>
          )}
          {costTrends.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2">Cost per provider</div>
              <div className="space-y-1.5">
                {Object.keys(PROVIDER_COLORS).map((p) => {
                  const total = costTrends.reduce((s, d) => s + (d[p as keyof CostTrend] as number || 0), 0);
                  return (
                    <div key={p} className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground capitalize">{p}</div>
                      <div className="text-xs font-mono text-foreground">${total.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Governance Audit Trail */}
      <div className="inca-panel overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <div className="text-sm font-medium text-foreground">Governance Audit Trail</div>
          </div>
          <div className="flex gap-1.5">
            {[null, "approved", "requires_approval", "blocked"].map((f) => (
              <button
                key={f ?? "all"}
                onClick={() => setAuditFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  auditFilter === f
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                {f === null ? "All" : f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
        {governanceQuery.isLoading && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Loading audit trail...
          </div>
        )}
        {governanceQuery.isError && (
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Could not load governance audit data
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Timestamp</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Agent</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Model</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Action</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-medium">Sensitive</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Flag</th>
                <th className="px-4 py-2 text-center text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudit.map((entry, idx) => (
                <tr key={idx} className="border-b border-border/30 hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{entry.timestamp.replace("T", " ").slice(0, 19)}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground capitalize">{entry.agent}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{entry.model}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{entry.action.replace("_", " ")}</td>
                  <td className="px-4 py-2.5 text-center">
                    {entry.sensitiveData
                      ? <span className="badge-error px-1.5 py-0.5 rounded">yes</span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    {entry.flag
                      ? <span className="badge-warning px-1.5 py-0.5 rounded font-mono">{entry.flag}</span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <StatusIcon status={entry.status} />
                      <span className={cn(
                        "text-xs",
                        entry.status === "approved" ? "text-green-400" : entry.status === "blocked" ? "text-red-400" : "text-amber-400"
                      )}>
                        {entry.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAudit.length === 0 && !governanceQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground text-xs">No governance events found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
