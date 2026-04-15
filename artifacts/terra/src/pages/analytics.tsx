import { motion } from "framer-motion";
import { TrendingUp, Users, DollarSign, Building2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { properties, revenueHistory, portfolioSummary } from "@/data/portfolio";
import { cn } from "@szl-holdings/shared-ui/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

interface TooltipItem { name: string; value: number | string; color: string; }
interface ChartTooltipProps { active?: boolean; payload?: TooltipItem[]; label?: string; }
function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-terra-bg-tertiary border border-terra-border rounded-lg p-3 shadow-xl">
      <p className="text-xs font-semibold text-terra-text mb-2">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-terra-text-secondary">{item.name}:</span>
          <span className="text-terra-text font-medium">{typeof item.value === "number" && item.value > 100 ? formatCurrency(item.value) : `${item.value}%`}</span>
        </div>
      ))}
    </div>
  );
}

const typeDistribution = (() => {
  const counts: Record<string, number> = {};
  properties.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name: name.replace("-", " "), value }));
})();

const valueByType = (() => {
  const vals: Record<string, number> = {};
  properties.forEach(p => { vals[p.type] = (vals[p.type] || 0) + p.value; });
  return Object.entries(vals).map(([name, value]) => ({ name: name.replace("-", " "), value }));
})();

const occupancyByProperty = properties.map(p => ({
  name: p.name.split(" ").slice(0, 2).join(" "),
  occupancy: p.occupancy,
  target: 95,
}));

const revenueByProperty = properties.map(p => ({
  name: p.name.split(" ").slice(0, 2).join(" "),
  revenue: p.monthlyRevenue,
  noi: p.annualNOI / 12,
})).sort((a, b) => b.revenue - a.revenue);

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4"];

const kpiCards = [
  { label: "Annual Revenue", value: formatCurrency(portfolioSummary.totalMonthlyRevenue * 12), change: "+8.4%", up: true, icon: DollarSign, accent: "#3b82f6" },
  { label: "Annual NOI", value: formatCurrency(portfolioSummary.totalAnnualNOI), change: "+6.1%", up: true, icon: TrendingUp, accent: "#10b981" },
  { label: "Total Sq Ft", value: `${(portfolioSummary.totalSqft / 1e6).toFixed(2)}M`, change: "+0%", up: true, icon: Building2, accent: "#f59e0b" },
  { label: "Total Units", value: portfolioSummary.totalUnits.toString(), change: "+0%", up: true, icon: Users, accent: "#8b5cf6" },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-terra-text">Occupancy & Revenue Analytics</h1>
        <p className="text-sm text-terra-text-secondary mt-1">Deep-dive time-series analysis of portfolio performance metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative rounded-xl overflow-hidden"
            style={{ background: `radial-gradient(ellipse at top left, ${item.accent}10 0%, rgba(255,255,255,0.015) 60%)`, border: `1px solid ${item.accent}25`, padding: "1.125rem" }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${item.accent}70, transparent)` }} />
            <div className="flex items-center justify-between mb-3">
              <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: `${item.accent}18`, border: `1px solid ${item.accent}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <item.icon className="w-3.5 h-3.5" style={{ color: item.accent }} />
              </div>
              <span className={cn("text-xs font-semibold flex items-center gap-0.5", item.up ? "text-terra-emerald" : "text-terra-rose")}>
                {item.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {item.change}
              </span>
            </div>
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider mb-1">{item.label}</p>
            <p className="text-xl font-display font-bold" style={{ color: item.accent }}>{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5 relative overflow-hidden">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #3b82f660, transparent)" }} />
          <h3 className="font-display font-bold text-terra-text mb-4">Occupancy Trend (12 mo)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueHistory}>
                <defs>
                  <linearGradient id="occupancyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,100,160,0.08)" />
                <XAxis dataKey="month" tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[88, 96]} tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="occupancy" name="Occupancy" stroke="#3b82f6" strokeWidth={2.5} fill="url(#occupancyGrad)" dot={{ r: 3, fill: "#3b82f6" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5 relative overflow-hidden">
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #10b98160, transparent)" }} />
          <h3 className="font-display font-bold text-terra-text mb-4">Revenue vs. Expenses (12 mo)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,100,160,0.08)" />
                <XAxis dataKey="month" tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[3, 3, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <h3 className="font-display font-bold text-terra-text mb-4">Portfolio by Type</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: "#4e5d80" }}>
                  {typeDistribution.map((_, idx) => (<Cell key={idx} fill={COLORS[idx % COLORS.length]} />))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11, color: "#8b9bc0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <h3 className="font-display font-bold text-terra-text mb-4">Value by Type</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={valueByType} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" label={({ name }) => name} labelLine={{ stroke: "#4e5d80" }}>
                  {valueByType.map((_, idx) => (<Cell key={idx} fill={COLORS[idx % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8b9bc0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5">
          <h3 className="font-display font-bold text-terra-text mb-4">Occupancy by Property</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyByProperty} layout="vertical" margin={{ left: 10 }}>
                <defs>
                  <linearGradient id="occupancyBarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.9} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,100,160,0.08)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#4e5d80", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#8b9bc0", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="occupancy" name="Occupancy" fill="url(#occupancyBarGrad)" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border border-terra-border bg-terra-surface/50 p-5 relative overflow-hidden">
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #8b5cf660, #3b82f640, transparent)" }} />
        <h3 className="font-display font-bold text-terra-text mb-4">Revenue by Property</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByProperty} margin={{ bottom: 40 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="noiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,100,160,0.08)" />
              <XAxis dataKey="name" tick={{ fill: "#4e5d80", fontSize: 10 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e3).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="url(#revGrad)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="noi" name="NOI" fill="url(#noiGrad)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
