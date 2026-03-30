import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Users, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, CreditCard, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { clients, revenueData } from "@/data/mock-data";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, Legend } from "recharts";

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-lg p-3 shadow-xl border border-border/50">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: ${(entry.value / 1000).toFixed(1)}K
        </p>
      ))}
    </div>
  );
};

const clientMetrics: Record<string, { profitMargin: number; utilization: number }> = {
  c1: { profitMargin: 42, utilization: 88 },
  c2: { profitMargin: 35, utilization: 79 },
  c3: { profitMargin: 44, utilization: 72 },
  c4: { profitMargin: 31, utilization: 92 },
  c5: { profitMargin: 37, utilization: 81 },
  c6: { profitMargin: 48, utilization: 68 },
  c7: { profitMargin: 40, utilization: 74 },
  c8: { profitMargin: 28, utilization: 65 },
  c9: { profitMargin: 45, utilization: 76 },
  c10: { profitMargin: 0, utilization: 0 },
};

function ClientRevenueRow({ client, index }: { client: typeof clients[0]; index: number }) {
  const metrics = clientMetrics[client.id] || { profitMargin: 0, utilization: 0 };
  const profitMargin = metrics.profitMargin;
  const utilization = metrics.utilization;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="grid grid-cols-6 gap-4 items-center px-5 py-3 border-b border-border/30 hover:bg-muted/20 transition-colors"
    >
      <div className="col-span-2 text-sm font-medium text-foreground">{client.name}</div>
      <div className="text-sm font-semibold text-foreground">${client.mrr.toLocaleString()}</div>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full", utilization >= 80 ? "bg-emerald-400" : utilization >= 60 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${utilization}%` }} />
        </div>
        <span className="text-xs text-muted-foreground">{utilization}%</span>
      </div>
      <div className={cn("text-sm font-semibold", profitMargin >= 35 ? "text-emerald-400" : profitMargin >= 20 ? "text-amber-400" : "text-red-400")}>
        {profitMargin}%
      </div>
      <div className="text-sm font-mono text-muted-foreground">{client.deviceCount} devices</div>
    </motion.div>
  );
}

export default function RevenuePage() {
  const totalMRR = clients.reduce((s, c) => s + c.mrr, 0);
  const totalARR = totalMRR * 12;
  const prevMRR = revenueData[revenueData.length - 2]?.mrr || 0;
  const currentMRR = revenueData[revenueData.length - 1]?.mrr || 0;
  const mrrGrowth = prevMRR > 0 ? ((currentMRR - prevMRR) / prevMRR * 100).toFixed(1) : "0";
  const avgProfit = Math.round(revenueData.reduce((s, d) => s + d.profit, 0) / revenueData.length);
  const profitMargin = Math.round(avgProfit / (revenueData.reduce((s, d) => s + d.mrr, 0) / revenueData.length) * 100);

  const sortedClients = [...clients].filter(c => c.mrr > 0).sort((a, b) => b.mrr - a.mrr);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Revenue & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Per-client MRR, gross margin, and profitability trends across service tiers</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Revenue", value: `$${(totalMRR / 1000).toFixed(1)}K`, change: `+${mrrGrowth}%`, positive: true, icon: DollarSign, color: "text-primary" },
          { label: "Annual Run Rate", value: `$${(totalARR / 1000000).toFixed(2)}M`, change: "+14.2% YoY", positive: true, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Profit Margin", value: `${profitMargin}%`, change: "+2.1%", positive: true, icon: BarChart3, color: "text-violet-400" },
          { label: "Active Clients", value: clients.filter(c => c.mrr > 0).length.toString(), change: "+1 this quarter", positive: true, icon: Users, color: "text-cyan-400" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <p className={cn("text-3xl font-display font-bold mt-2", stat.color)}>{stat.value}</p>
            <p className={cn("text-xs mt-1 flex items-center gap-1", stat.positive ? "text-emerald-400" : "text-red-400")}>
              {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {stat.change}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Revenue vs Expenses (6 Months)</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(250, 90%, 65%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(250, 90%, 65%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 12%)" />
                <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={(v) => `$${v / 1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mrr" name="Revenue" stroke="hsl(250, 90%, 65%)" fill="url(#colorMrr)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="hsl(160, 70%, 45%)" fill="url(#colorProfit)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="hsl(0, 72%, 51%)" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">MRR by Client</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedClients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 12%)" />
                <XAxis type="number" stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={(v) => `$${v / 1000}K`} />
                <YAxis type="category" dataKey="name" stroke="hsl(220, 10%, 50%)" fontSize={11} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mrr" name="MRR" radius={[0, 4, 4, 0]}>
                  {sortedClients.map((_, idx) => (
                    <Cell key={idx} fill={`hsl(${250 + idx * 15}, 70%, ${55 + idx * 3}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Client Profitability</h2>
           <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Analysis</span>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-4 px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/30">
          <div className="col-span-2">Client</div>
          <div>MRR</div>
          <div>Utilization</div>
          <div>Margin</div>
          <div>Devices</div>
        </div>
        {sortedClients.map((client, i) => (
          <ClientRevenueRow key={client.id} client={client} index={i} />
        ))}
      </div>
    </div>
  );
}
