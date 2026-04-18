import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Target, Users, Award, RefreshCw, BarChart3 } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useQuery } from "@tanstack/react-query";
import { ExportButton } from "@szl-holdings/shared-ui/data-export";
import { Skeleton } from "@szl-holdings/shared-ui/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";

interface RevenueData {
  summary: {
    mrr: number;
    arr: number;
    growth: number;
    churn: number;
    avgContractValue: number;
    totalClients: number;
    activeClients: number;
    ltv: number;
    nrr: number;
    grossMargin: number;
  };
  monthly: {
    month: string;
    mrr: number;
    newBusiness: number;
    churned: number;
    expansion: number;
  }[];
  byClient: {
    clientName: string;
    mrr: number;
    tier: string;
    churnRisk: "low" | "medium" | "high";
    contractValue: number;
    daysToRenewal: number;
  }[];
  forecast: {
    month: string;
    projected: number;
    optimistic: number;
    conservative: number;
  }[];
}

const churnRiskColors: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  high: "text-red-400 bg-red-500/10",
};

const tierColors: Record<string, string> = {
  platinum: "text-violet-400 bg-violet-500/10",
  gold: "text-amber-400 bg-amber-500/10",
  silver: "text-zinc-400 bg-zinc-500/10",
  bronze: "text-orange-400 bg-orange-500/10",
};

export default function RevenuePage() {
  const { data, isLoading, refetch } = useQuery<RevenueData>({
    queryKey: ["msp-revenue"],
    queryFn: () => apiFetch<RevenueData>("/msp/revenue"),
    staleTime: 120_000,
  });

  const summary = data?.summary;
  const monthly = data?.monthly ?? [];
  const byClient = data?.byClient ?? [];
  const forecast = data?.forecast ?? [];

  const exportData = byClient.map(c => ({
    Client: c.clientName,
    MRR: c.mrr,
    Tier: c.tier,
    "Churn Risk": c.churnRisk,
    "Contract Value": c.contractValue,
    "Days to Renewal": c.daysToRenewal,
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Revenue Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">MRR, ARR, client revenue breakdown, churn risk analysis, and 6-month forecast</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={exportData}
            options={{ filename: "msp-revenue", title: "MSP Revenue Analytics", accentColor: "#8b5cf6" }}
          />
          <button onClick={() => refetch()} className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : summary ? (
          [
            { label: "MRR", value: `$${(summary.mrr / 1000).toFixed(1)}K`, sub: `ARR: $${(summary.arr / 1000).toFixed(0)}K`, color: "text-primary", icon: DollarSign },
            { label: "MoM Growth", value: `${summary.growth >= 0 ? "+" : ""}${summary.growth}%`, sub: `NRR: ${summary.nrr}%`, color: summary.growth >= 0 ? "text-emerald-400" : "text-red-400", icon: summary.growth >= 0 ? TrendingUp : TrendingDown },
            { label: "Avg Contract", value: `$${(summary.avgContractValue / 1000).toFixed(1)}K`, sub: `${summary.activeClients}/${summary.totalClients} clients active`, color: "text-violet-400", icon: Target },
            { label: "Gross Margin", value: `${summary.grossMargin}%`, sub: `LTV: $${(summary.ltv / 1000).toFixed(0)}K`, color: "text-amber-400", icon: Award },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
              </div>
              <p className={cn("text-2xl font-display font-bold mt-2", stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
            </motion.div>
          ))
        ) : null}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Monthly Recurring Revenue
          </h2>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="mrr" name="MRR" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="newBusiness" name="New" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="churned" name="Churned" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue Forecast (6 months)
          </h2>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={forecast} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#888" }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10, fill: "#888" }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} contentStyle={{ background: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} />
                <Line dataKey="projected" name="Projected" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line dataKey="optimistic" name="Optimistic" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Line dataKey="conservative" name="Conservative" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" /> Revenue by Client
          </h2>
          <span className="text-xs text-muted-foreground">{byClient.length} clients</span>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <div className="divide-y divide-border/30">
            {byClient.map((client, i) => {
              const pct = summary ? Math.round((client.mrr / summary.mrr) * 100) : 0;
              return (
                <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {client.clientName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{client.clientName}</span>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", tierColors[client.tier] || "text-muted-foreground bg-muted")}>{client.tier}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{pct}% of MRR</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">${client.mrr.toLocaleString()}/mo</p>
                    <p className="text-[10px] text-muted-foreground">Contract: ${client.contractValue.toLocaleString()}</p>
                  </div>
                  <div className="shrink-0">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", churnRiskColors[client.churnRisk])}>
                      {client.churnRisk} risk
                    </span>
                    <p className="text-[10px] text-muted-foreground text-center mt-0.5">{client.daysToRenewal}d renewal</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
