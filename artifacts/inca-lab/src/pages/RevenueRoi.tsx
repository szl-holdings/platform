import { cn } from "../lib/utils";
import { DollarSign, TrendingUp, TrendingDown, BarChart2, PieChart, Zap, Users, ArrowUpRight } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend
} from "recharts";

const REVENUE_TREND = [
  { month: "Oct", revenue: 12400, cost: 8200, margin: 4200 },
  { month: "Nov", revenue: 15800, cost: 9100, margin: 6700 },
  { month: "Dec", revenue: 18200, cost: 10400, margin: 7800 },
  { month: "Jan", revenue: 22100, cost: 11800, margin: 10300 },
  { month: "Feb", revenue: 26400, cost: 13200, margin: 13200 },
  { month: "Mar", revenue: 31700, cost: 14900, margin: 16800 },
  { month: "Apr", revenue: 36200, cost: 15800, margin: 20400 },
];

const COST_BY_PROVIDER = [
  { name: "OpenAI", value: 6420, color: "#22c55e" },
  { name: "Anthropic", value: 5180, color: "#f97316" },
  { name: "Gemini", value: 2840, color: "#60a5fa" },
  { name: "HuggingFace", value: 1360, color: "#a78bfa" },
];

const COST_BY_DOMAIN = [
  { domain: "Maritime", cost: 4820, revenue: 12400, roi: 157 },
  { domain: "Security", cost: 3210, revenue: 9800, roi: 205 },
  { domain: "Legal", cost: 2140, revenue: 7200, roi: 236 },
  { domain: "Real Estate", cost: 1840, revenue: 4100, roi: 123 },
  { domain: "Analytics", cost: 1920, revenue: 5600, roi: 192 },
  { domain: "Commerce", cost: 1670, revenue: 2900, roi: 74 },
];

const AGENT_ROI = [
  { agent: "Sentinel v4", cost: 3210, revenue: 9800, roi: 205, runs: 8240 },
  { agent: "Helmsman v3", cost: 4820, revenue: 12400, roi: 157, runs: 6180 },
  { agent: "DocMiner v2", cost: 2140, revenue: 7200, roi: 236, runs: 11420 },
  { agent: "Beacon v3", cost: 1920, revenue: 5600, roi: 192, runs: 14800 },
  { agent: "Prospector v2", cost: 1840, revenue: 4100, roi: 123, runs: 3920 },
  { agent: "Muse v2", cost: 1670, revenue: 2900, roi: 74, runs: 2840 },
];

const SUBSCRIPTION_REVENUE = [
  { tier: "Intelligence Feeds", clients: 12, mrr: 14400, churn: 0 },
  { tier: "Agent Access", clients: 8, mrr: 9600, churn: 1 },
  { tier: "White-Label", clients: 3, mrr: 8100, churn: 0 },
  { tier: "API Access", clients: 22, mrr: 4400, churn: 2 },
];

const COST_INSIGHT_TREND = [
  { week: "W1", costPerInsight: 0.42 },
  { week: "W2", costPerInsight: 0.38 },
  { week: "W3", costPerInsight: 0.35 },
  { week: "W4", costPerInsight: 0.31 },
  { week: "W5", costPerInsight: 0.29 },
  { week: "W6", costPerInsight: 0.27 },
];

const COLORS_DOMAINS = ["#7c3aed", "#3b82f6", "#f59e0b", "#22d3ee", "#10b981", "#ec4899"];

export function RevenueRoi() {
  const totalRevenue = REVENUE_TREND[REVENUE_TREND.length - 1]?.revenue ?? 0;
  const totalCost = REVENUE_TREND[REVENUE_TREND.length - 1]?.cost ?? 0;
  const margin = REVENUE_TREND[REVENUE_TREND.length - 1]?.margin ?? 0;
  const marginPct = Math.round((margin / totalRevenue) * 100);
  const totalMrr = SUBSCRIPTION_REVENUE.reduce((s, r) => s + r.mrr, 0);
  const totalClients = SUBSCRIPTION_REVENUE.reduce((s, r) => s + r.clients, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Revenue & ROI Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          AI operational cost breakdown, revenue attribution, subscription metrics, and per-agent ROI analysis.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-tile p-4">
          <div className="text-xs text-muted-foreground mb-1">Monthly Revenue</div>
          <div className="text-2xl font-display font-bold text-emerald-400">${(totalRevenue / 1000).toFixed(1)}K</div>
          <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1"><TrendingUp className="w-3 h-3" /> +14.2% MoM</div>
        </div>
        <div className="kpi-tile p-4">
          <div className="text-xs text-muted-foreground mb-1">AI Operational Cost</div>
          <div className="text-2xl font-display font-bold text-foreground">${(totalCost / 1000).toFixed(1)}K</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><TrendingUp className="w-3 h-3" /> +6.0% MoM</div>
        </div>
        <div className="kpi-tile p-4">
          <div className="text-xs text-muted-foreground mb-1">Gross Margin</div>
          <div className="text-2xl font-display font-bold text-primary">{marginPct}%</div>
          <div className="text-xs text-muted-foreground mt-1">${(margin / 1000).toFixed(1)}K gross profit</div>
        </div>
        <div className="kpi-tile p-4">
          <div className="text-xs text-muted-foreground mb-1">Subscription MRR</div>
          <div className="text-2xl font-display font-bold text-foreground">${(totalMrr / 1000).toFixed(1)}K</div>
          <div className="text-xs text-muted-foreground mt-1">{totalClients} active clients</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue vs Cost trend */}
        <div className="lg:col-span-2 inca-panel p-4">
          <div className="text-sm font-medium text-foreground mb-4">Revenue vs Cost Trend (7 months)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={REVENUE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(238,10%,48%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(238,10%,48%)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip formatter={(v: number) => [`$${(v / 1000).toFixed(1)}K`, ""]} contentStyle={{ background: "hsl(228 25% 8%)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="hsla(142,76%,36%,0.15)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="cost" stroke="#f97316" fill="hsla(24,95%,53%,0.1)" strokeWidth={2} name="Cost" />
              <Area type="monotone" dataKey="margin" stroke="#7c3aed" fill="hsla(262,83%,58%,0.1)" strokeWidth={2} name="Margin" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {[{ label: "Revenue", color: "#22c55e" }, { label: "Cost", color: "#f97316" }, { label: "Margin", color: "#7c3aed" }].map(l => (
              <div key={l.label} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />{l.label}</div>
            ))}
          </div>
        </div>

        {/* Cost by provider */}
        <div className="inca-panel p-4">
          <div className="text-sm font-medium text-foreground mb-4">Cost by Provider</div>
          <ResponsiveContainer width="100%" height={140}>
            <RechartsPie>
              <Pie data={COST_BY_PROVIDER} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                {COST_BY_PROVIDER.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} contentStyle={{ background: "hsl(228 25% 8%)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: 8 }} />
            </RechartsPie>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {COST_BY_PROVIDER.map(p => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-muted-foreground">{p.name}</span>
                </div>
                <span className="font-mono text-foreground">${p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Domain ROI */}
        <div className="inca-panel p-4">
          <div className="text-sm font-medium text-foreground mb-4">ROI by Domain</div>
          <div className="space-y-3">
            {COST_BY_DOMAIN.sort((a, b) => b.roi - a.roi).map((d, i) => (
              <div key={d.domain}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{d.domain}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">Cost: ${(d.cost / 1000).toFixed(1)}K</span>
                    <span className="text-muted-foreground">Rev: ${(d.revenue / 1000).toFixed(1)}K</span>
                    <span className={cn("font-mono font-bold", d.roi >= 150 ? "text-emerald-400" : d.roi >= 100 ? "text-primary" : "text-amber-400")}>
                      {d.roi}% ROI
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(d.roi / 3, 100)}%`, backgroundColor: COLORS_DOMAINS[i] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agent ROI table */}
        <div className="inca-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="text-sm font-medium text-foreground">Agent-Level ROI</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {["Agent", "Cost", "Revenue", "ROI", "Runs"].map(h => (
                    <th key={h} className="py-2 px-3 text-left text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AGENT_ROI.sort((a, b) => b.roi - a.roi).map(agent => (
                  <tr key={agent.agent} className="border-b border-border/30 hover:bg-secondary/20">
                    <td className="py-2.5 px-3 font-medium text-foreground">{agent.agent}</td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">${(agent.cost / 1000).toFixed(1)}K</td>
                    <td className="py-2.5 px-3 font-mono text-foreground">${(agent.revenue / 1000).toFixed(1)}K</td>
                    <td className="py-2.5 px-3">
                      <span className={cn("font-mono font-bold", agent.roi >= 150 ? "text-emerald-400" : agent.roi >= 100 ? "text-primary" : "text-amber-400")}>
                        {agent.roi}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">{agent.runs.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Subscriptions */}
        <div className="inca-panel p-4">
          <div className="text-sm font-medium text-foreground mb-4">Subscription Revenue Breakdown</div>
          <div className="space-y-3">
            {SUBSCRIPTION_REVENUE.map(s => (
              <div key={s.tier} className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground font-medium">{s.tier}</div>
                  <div className="text-xs text-muted-foreground">{s.clients} clients · {s.churn > 0 ? `${s.churn} churned` : "0 churns"}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-emerald-400">${s.mrr.toLocaleString()}/mo</div>
                  <div className="text-xs text-muted-foreground">${Math.round(s.mrr / s.clients).toLocaleString()} ARPU</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost per insight trend */}
        <div className="inca-panel p-4">
          <div className="text-sm font-medium text-foreground mb-4">Cost-per-Insight Trend (6 weeks)</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={COST_INSIGHT_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(0,0%,100%,0.04)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(238,10%,48%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(238,10%,48%)" }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(2)}`} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Cost/Insight"]} contentStyle={{ background: "hsl(228 25% 8%)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: 8 }} />
              <Area type="monotone" dataKey="costPerInsight" stroke="#7c3aed" fill="hsla(262,83%,58%,0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-muted-foreground">Cost/insight trending down</span>
            <span className="text-emerald-400 font-mono font-bold">-35.7% in 6 weeks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
