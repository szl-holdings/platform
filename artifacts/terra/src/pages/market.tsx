import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MapPin, DollarSign, Building2, Clock, BarChart3, Percent, RefreshCw } from "lucide-react";
import { marketData } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LiveDataBadge } from "@/lib/live-badge";

function formatCurrency(n: number) {
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
          <span className="text-terra-text font-medium">{typeof item.value === "number" && item.name.includes("$") ? formatCurrency(item.value) : item.value}</span>
        </div>
      ))}
    </div>
  );
}

const comparableSales = [
  { address: "1800 Brickell Ave, Miami", price: 92000000, sqft: 245000, pricePerSqft: 376, type: "Multifamily", date: "Feb 2026" },
  { address: "300 Mission St, San Francisco", price: 145000000, sqft: 195000, pricePerSqft: 744, type: "Office", date: "Jan 2026" },
  { address: "2200 S Lamar Blvd, Austin", price: 38500000, sqft: 142000, pricePerSqft: 271, type: "Mixed-Use", date: "Mar 2026" },
  { address: "5500 Belt Line Rd, Dallas", price: 28900000, sqft: 320000, pricePerSqft: 90, type: "Industrial", date: "Feb 2026" },
  { address: "222 Broadway, Nashville", price: 16200000, sqft: 68000, pricePerSqft: 238, type: "Retail", date: "Jan 2026" },
  { address: "50 Milk St, Boston", price: 78000000, sqft: 165000, pricePerSqft: 473, type: "Office", date: "Mar 2026" },
];

const radarData = marketData.map(m => ({
  region: m.region.split(",")[0],
  "Price Growth": Math.max(0, m.yoyChange * 10),
  "Cap Rate": m.avgCapRate * 10,
  "Low Vacancy": (10 - m.vacancyRate) * 10,
  "Market Speed": Math.max(0, (60 - m.daysOnMarket)) * 2,
}));

export default function MarketPage() {
  const priceData = marketData.map(m => ({
    region: m.region.split(",")[0],
    "Price/SqFt": m.pricePerSqft,
    "YoY Change": m.yoyChange,
  }));

  const { data: mortgageData, isLoading: mortgageLoading, refetch: refetchMortgage } = useQuery({
    queryKey: ["terra-mortgage-rates"],
    queryFn: () => api.live.mortgageRates(),
    staleTime: 3600000 * 6,
    refetchInterval: 3600000 * 6,
  });

  const { data: blsData, isLoading: blsLoading } = useQuery({
    queryKey: ["terra-bls-construction"],
    queryFn: () => api.live.blsConstruction(),
    staleTime: 86400000,
  });

  const mortgageRates = mortgageData?.data;
  const blsConstruction = blsData?.data;
  const isAnyLive = mortgageData?.liveData || blsData?.liveData;

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Market Intelligence</h1>
            <p className="text-sm text-terra-text-secondary mt-1">Regional trends, comparables, and live market indicators</p>
          </div>
          <LiveDataBadge isLive={isAnyLive} isLoading={mortgageLoading || blsLoading} />
        </div>
      </motion.div>

      {/* Live Market Indicators */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-terra-border bg-terra-surface/50 p-4 relative">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-terra-text-muted uppercase tracking-wider">30-Yr Fixed Rate</p>
              <LiveDataBadge isLive={mortgageData?.liveData} isLoading={mortgageLoading} />
            </div>
            <p className="text-2xl font-display font-bold text-terra-text">
              {mortgageLoading ? "—" : mortgageRates?.rate30yr != null ? `${mortgageRates.rate30yr.toFixed(2)}%` : "—"}
            </p>
            {mortgageRates?.weeklyChange30yr != null && (
              <p className={cn("text-xs mt-1 flex items-center gap-1", mortgageRates.weeklyChange30yr <= 0 ? "text-terra-emerald" : "text-terra-rose")}>
                {mortgageRates.weeklyChange30yr <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {mortgageRates.weeklyChange30yr >= 0 ? "+" : ""}{mortgageRates.weeklyChange30yr}% WoW
              </p>
            )}
            {mortgageRates?.asOf && <p className="text-[10px] text-terra-text-muted mt-1">FRED · {mortgageRates.asOf}</p>}
          </div>

          <div className="rounded-xl border border-terra-border bg-terra-surface/50 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-terra-text-muted uppercase tracking-wider">15-Yr Fixed Rate</p>
            </div>
            <p className="text-2xl font-display font-bold text-terra-text">
              {mortgageLoading ? "—" : mortgageRates?.rate15yr != null ? `${mortgageRates.rate15yr.toFixed(2)}%` : "6.48%"}
            </p>
            <p className="text-xs mt-1 text-terra-text-muted">Primary Mortgage Survey</p>
          </div>

          <div className="rounded-xl border border-terra-border bg-terra-surface/50 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-terra-text-muted uppercase tracking-wider">Construction Jobs</p>
              <LiveDataBadge isLive={blsData?.liveData} isLoading={blsLoading} />
            </div>
            <p className="text-2xl font-display font-bold text-terra-text">
              {blsLoading ? "—" : blsConstruction?.constructionEmployment
                ? `${(blsConstruction.constructionEmployment / 1e6).toFixed(2)}M`
                : "8.14M"}
            </p>
            {blsConstruction?.monthlyChange && (
              <p className={cn("text-xs mt-1 flex items-center gap-1",
                +blsConstruction.monthlyChange > 0 ? "text-terra-emerald" : "text-terra-rose")}>
                {+blsConstruction.monthlyChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {+blsConstruction.monthlyChange > 0 ? "+" : ""}{(+blsConstruction.monthlyChange).toLocaleString()} MoM
              </p>
            )}
            {blsConstruction?.period && <p className="text-[10px] text-terra-text-muted mt-1">BLS · {blsConstruction.period}</p>}
          </div>

          <div className="rounded-xl border border-terra-border bg-terra-surface/50 p-4">
            <p className="text-xs text-terra-text-muted uppercase tracking-wider mb-1">Avg Cap Rate Range</p>
            <p className="text-2xl font-display font-bold text-terra-text">4.5–7.5%</p>
            <p className="text-xs mt-1 text-terra-amber">Office sector distressed</p>
            <p className="text-[10px] text-terra-text-muted mt-1">Terra Analytics</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-terra-primary" />
            <h3 className="font-display font-bold text-terra-text">Price Per Sq Ft by Region</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceData} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,100,160,0.08)" />
                <XAxis dataKey="region" tick={{ fill: "#4e5d80", fontSize: 10 }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={60} />
                <YAxis tick={{ fill: "#4e5d80", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Price/SqFt" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-terra-emerald" />
            <h3 className="font-display font-bold text-terra-text">Market Performance Radar</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData.slice(0, 4)}>
                <PolarGrid stroke="rgba(60,100,160,0.1)" />
                <PolarAngleAxis dataKey="region" tick={{ fill: "#8b9bc0", fontSize: 10 }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar name="Price Growth" dataKey="Price Growth" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                <Radar name="Cap Rate" dataKey="Cap Rate" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                <Radar name="Low Vacancy" dataKey="Low Vacancy" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#8b9bc0" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-terra-primary" />
          <h3 className="font-display font-bold text-terra-text">Regional Market Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-terra-border">
                <th className="text-left py-3 px-3 text-xs font-semibold text-terra-text-muted uppercase tracking-wider">Region</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-terra-text-muted uppercase tracking-wider">Median Price</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-terra-text-muted uppercase tracking-wider">$/SqFt</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-terra-text-muted uppercase tracking-wider">YoY Change</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-terra-text-muted uppercase tracking-wider">Avg Cap Rate</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-terra-text-muted uppercase tracking-wider">Vacancy</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-terra-text-muted uppercase tracking-wider">Days on Market</th>
                <th className="text-right py-3 px-3 text-xs font-semibold text-terra-text-muted uppercase tracking-wider">Inventory</th>
              </tr>
            </thead>
            <tbody>
              {marketData.map((m, i) => (
                <motion.tr key={m.region} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors">
                  <td className="py-3 px-3 font-medium text-terra-text">{m.region}</td>
                  <td className="py-3 px-3 text-right text-terra-text">{formatCurrency(m.medianPrice)}</td>
                  <td className="py-3 px-3 text-right text-terra-text">${m.pricePerSqft}</td>
                  <td className="py-3 px-3 text-right">
                    <span className={cn("inline-flex items-center gap-1", m.yoyChange >= 0 ? "text-terra-emerald" : "text-terra-rose")}>
                      {m.yoyChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {m.yoyChange >= 0 ? "+" : ""}{m.yoyChange}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-terra-text">{m.avgCapRate}%</td>
                  <td className="py-3 px-3 text-right">
                    <span className={cn(m.vacancyRate <= 5 ? "text-terra-emerald" : m.vacancyRate <= 7 ? "text-terra-amber" : "text-terra-rose")}>
                      {m.vacancyRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-terra-text">{m.daysOnMarket}</td>
                  <td className="py-3 px-3 text-right text-terra-text-secondary">{m.inventory.toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-terra-emerald" />
          <h3 className="font-display font-bold text-terra-text">Recent Comparable Sales</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparableSales.map((sale, i) => (
            <motion.div key={sale.address} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="p-4 rounded-lg border border-terra-border bg-terra-bg-secondary hover:border-terra-border-hover transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-terra-primary/10 text-terra-primary uppercase">{sale.type}</span>
                <span className="text-xs text-terra-text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{sale.date}</span>
              </div>
              <p className="text-sm font-semibold text-terra-text mb-1">{sale.address}</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <p className="text-[10px] text-terra-text-muted">Sale Price</p>
                  <p className="text-sm font-bold text-terra-text">{formatCurrency(sale.price)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-terra-text-muted">Price/SqFt</p>
                  <p className="text-sm font-bold text-terra-accent">${sale.pricePerSqft}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
