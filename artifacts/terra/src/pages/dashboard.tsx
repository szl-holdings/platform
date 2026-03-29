import { motion } from "framer-motion";
import { Building2, DollarSign, TrendingUp, Users, Percent, BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { PropertyCard } from "@/components/property-card";
import { AlertFeed } from "@/components/alert-feed";
import { properties, portfolioSummary, revenueHistory } from "@/data/portfolio";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-terra-bg-tertiary border border-terra-border rounded-lg p-3 shadow-xl">
      <p className="text-xs font-semibold text-terra-text mb-2">{label}</p>
      {payload.map((item: any) => (
        <div key={item.name} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-terra-text-secondary">{item.name}:</span>
          <span className="text-terra-text font-medium">{formatCurrency(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const performingCount = properties.filter(p => p.status === "performing").length;
  const watchCount = properties.filter(p => p.status !== "performing").length;

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-terra-text">Portfolio Dashboard</h1>
        <p className="text-sm text-terra-text-secondary mt-1">Real-time overview of your real estate portfolio performance</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Portfolio Value" value={formatCurrency(portfolioSummary.totalValue)} change="+12.4%" changeType="positive" icon={Building2} gradient="from-terra-primary to-terra-accent" subtitle={`${portfolioSummary.totalProperties} properties`} />
        <MetricCard title="Monthly Revenue" value={formatCurrency(portfolioSummary.totalMonthlyRevenue)} change="+5.2%" changeType="positive" icon={DollarSign} gradient="from-terra-emerald to-green-400" subtitle="Across all assets" />
        <MetricCard title="Avg Occupancy" value={`${portfolioSummary.avgOccupancy.toFixed(1)}%`} change="-0.3%" changeType="negative" icon={Users} gradient="from-terra-amber to-yellow-400" subtitle={`${watchCount} need attention`} />
        <MetricCard title="Avg Cap Rate" value={`${portfolioSummary.avgCapRate.toFixed(1)}%`} change="+0.1%" changeType="positive" icon={Percent} gradient="from-terra-violet to-purple-400" subtitle="Portfolio weighted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-terra-primary" />
                <h3 className="font-display font-bold text-terra-text">Revenue & NOI Trend</h3>
              </div>
              <span className="text-xs text-terra-text-muted">Last 12 months</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueHistory} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="noiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,100,160,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="url(#revenueGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="noi" name="NOI" stroke="#10b981" fill="url(#noiGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5 max-h-[420px] overflow-y-auto">
          <AlertFeed limit={5} />
        </motion.div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-terra-primary" />
            <h3 className="font-display font-bold text-terra-text">Properties</h3>
            <span className="text-xs text-terra-text-muted">({properties.length} total · {performingCount} performing)</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {properties.map((property, i) => (
            <PropertyCard key={property.id} property={property} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
