import { motion } from "framer-motion";
import { Building2, DollarSign, TrendingUp, Users, Percent, AlertTriangle, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { ActivityFeed } from "@workspace/shared-ui/collaboration";
import { AlertFeed } from "@/components/alert-feed";
import { properties, portfolioSummary, revenueHistory } from "@/data/portfolio";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-terra-bg-tertiary border border-terra-border rounded-xl p-3 shadow-xl">
      <p className="text-xs font-semibold text-terra-text mb-2">{label}</p>
      {payload.map((item: any) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-terra-text-secondary">{item.name}:</span>
          <span className="text-terra-text font-semibold">{formatCurrency(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

const statusConfig: Record<string, { label: string; dot: string; text: string }> = {
  performing: { label: "Performing", dot: "bg-terra-emerald", text: "text-terra-emerald" },
  watch: { label: "Watch", dot: "bg-terra-amber", text: "text-terra-amber" },
  critical: { label: "Critical", dot: "bg-terra-rose", text: "text-terra-rose" },
};

export default function DashboardPage() {
  const performingCount = properties.filter(p => p.status === "performing").length;

  const summaryStats = [
    { label: "Portfolio Value", value: formatCurrency(portfolioSummary.totalValue), change: "+12.4%", up: true, sub: `${portfolioSummary.totalProperties} properties`, icon: Building2 },
    { label: "Avg Occupancy", value: `${portfolioSummary.avgOccupancy.toFixed(1)}%`, change: "-0.3%", up: false, sub: "Portfolio avg", icon: Users },
    { label: "Avg Cap Rate", value: `${portfolioSummary.avgCapRate.toFixed(1)}%`, change: "+0.1%", up: true, sub: "Weighted avg", icon: Percent },
    { label: "Performing", value: `${performingCount}/${portfolioSummary.totalProperties}`, change: `${properties.filter(p => p.status !== "performing").length} need attention`, up: true, sub: "Assets", icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6 overflow-auto max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Portfolio Dashboard</h1>
            <p className="text-sm text-terra-text-secondary mt-1">Unified view of portfolio value, occupancy, cap rates, and asset-level performance signals</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-terra-text-muted uppercase tracking-wider mb-1">Monthly Revenue</p>
            <p className="text-3xl font-display font-bold text-terra-text">{formatCurrency(portfolioSummary.totalMonthlyRevenue)}</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <ArrowUp className="w-3 h-3 text-terra-emerald" />
              <span className="text-sm font-semibold text-terra-emerald">+5.2%</span>
              <span className="text-xs text-terra-text-muted">vs last month</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <s.icon className="w-4 h-4 text-terra-text-muted" />
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.up ? "text-terra-emerald" : "text-terra-rose"}`}>
                {s.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {s.change}
              </span>
            </div>
            <div className="text-2xl font-display font-bold text-terra-text">{s.value}</div>
            <div className="text-xs text-terra-text-muted mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* HERO: Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-terra-text text-lg">Revenue & NOI Trend</h3>
            <p className="text-sm text-terra-text-muted mt-0.5">12-month portfolio performance</p>
          </div>
          <div className="flex items-center gap-5 text-xs text-terra-text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-terra-primary inline-block" /> Revenue</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-terra-emerald inline-block" /> NOI</span>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueHistory} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="noiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,100,160,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revenueGradient)" strokeWidth={2.5} dot={false} />
              <Area type="monotone" dataKey="noi" name="NOI" stroke="#10b981" fill="url(#noiGradient)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Properties + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert Feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5 max-h-[500px] overflow-y-auto">
          <AlertFeed limit={5} />
        </motion.div>

        {/* Property Summary Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="lg:col-span-2 rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm">
          <div className="p-4 border-b border-terra-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-terra-primary" />
              <h3 className="font-display font-bold text-terra-text">Properties</h3>
              <span className="text-xs text-terra-text-muted">({properties.length} total)</span>
            </div>
            <Link href="/property">
              <span className="text-xs text-terra-primary hover:underline cursor-pointer flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
          <div className="divide-y divide-terra-border">
            {properties.slice(0, 8).map((property) => {
              const status = statusConfig[property.status];
              return (
                <Link key={property.id} href={`/property/${property.id}`}>
                  <div className="px-4 py-3 flex items-center gap-4 hover:bg-terra-surface-hover transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-terra-text truncate">{property.name}</p>
                        <span className={`flex items-center gap-1 text-[10px] font-semibold ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-terra-text-muted">{property.city}, {property.state} · {property.type}</p>
                    </div>
                    <div className="flex items-center gap-6 shrink-0 text-right">
                      <div>
                        <p className="text-[10px] text-terra-text-muted">Occupancy</p>
                        <p className={`text-sm font-semibold ${property.occupancy >= 90 ? "text-terra-emerald" : property.occupancy >= 80 ? "text-terra-amber" : "text-terra-rose"}`}>
                          {property.occupancy}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-terra-text-muted">Rev/mo</p>
                        <p className="text-sm font-semibold text-terra-text">{formatCurrency(property.monthlyRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-terra-text-muted">Cap Rate</p>
                        <p className="text-sm font-semibold text-terra-text">{property.capRate}%</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <ActivityFeed entityType="property" title="Portfolio Team Activity" limit={8} compact />
        </motion.div>
      </div>
    </div>
  );
}
