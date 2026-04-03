import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, MapPin, DollarSign, Clock, BarChart3, RefreshCw, AlertCircle, Map } from "lucide-react";
import { marketData, properties } from "@/data/portfolio";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LiveDataBadge } from "@/lib/live-badge";
import { toast } from "sonner";
import { Skeleton } from "@szl-holdings/shared-ui/ui/skeleton";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { Link } from "wouter";

const PropertyMap = lazy(() => import("@/components/property-map"));

const API_BASE = "/api";
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatCurrency(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

interface TooltipPayloadItem { name: string; value: number | string; color: string; }
interface ChartTooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string; }

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-terra-bg-tertiary border border-terra-border rounded-lg p-3 shadow-xl">
      <p className="text-xs font-semibold text-terra-text mb-2">{label}</p>
      {payload.map((item) => (
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

interface MarketIntelligence {
  source: string;
  fetchedAt: string;
  regions: Array<{
    region: string;
    medianPrice: number;
    pricePerSqft: number;
    yoyChange: number;
    avgCapRate: number;
    vacancyRate: number;
    daysOnMarket: number;
    inventory: number;
  }>;
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-terra-border/50">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="py-3 px-3">
          <Skeleton className="h-4 w-16" />
        </td>
      ))}
    </tr>
  );
}

export default function MarketPage() {
  const { token } = useMapboxToken();
  const { data: liveData, isLoading, isError, refetch, isFetching } = useQuery<{ data: MarketIntelligence }>({
    queryKey: ["terra-market-intelligence"],
    queryFn: () => apiFetch<{ data: MarketIntelligence }>("/terra/market-intelligence"),
    staleTime: 5 * 60_000,
    retry: 2,
  });

  const displayMarketData = liveData?.data?.regions ?? marketData;
  const source = liveData?.data?.source;

  type MarketRow = { region?: string; city?: string; pricePerSqft?: number; medianPricePerSqft?: number; yoyChange?: number; yoyChangePercent?: number; avgCapRate?: number; capRate?: number; vacancyRate?: number; daysOnMarket?: number; };
  const displayRows = displayMarketData as MarketRow[];
  const priceData = displayRows.map((m) => ({
    region: (m.region ?? m.city ?? "").split(",")[0],
    "Price/SqFt": m.pricePerSqft ?? m.medianPricePerSqft ?? 0,
    "YoY Change": m.yoyChange ?? m.yoyChangePercent ?? 0,
  }));

  const radarData = displayRows.slice(0, 4).map((m) => ({
    region: (m.region ?? m.city ?? "").split(",")[0],
    "Price Growth": Math.max(0, (m.yoyChange ?? 0) * 10),
    "Cap Rate": (m.avgCapRate ?? m.capRate ?? 0) * 10,
    "Low Vacancy": (10 - (m.vacancyRate ?? 5)) * 10,
    "Market Speed": Math.max(0, (60 - (m.daysOnMarket ?? 30))) * 2,
  }));

  const { data: mortgageData, isLoading: mortgageLoading } = useQuery({
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-terra-text">Market Intelligence</h1>
          <p className="text-sm text-terra-text-secondary mt-1">
            {source ? (
              <span>Live data from {source}</span>
            ) : (
              "Regional trends, comparables, and live market indicators"
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveDataBadge isLive={isAnyLive} isLoading={mortgageLoading || blsLoading} />
          {isError && (
            <div className="flex items-center gap-2 text-xs text-terra-rose bg-terra-rose/10 px-3 py-2 rounded-lg border border-terra-rose/20">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Using cached data
            </div>
          )}
          <button
            onClick={() => { refetch(); if (!isFetching) toast.info("Refreshing market data…"); }}
            disabled={isFetching}
            className="flex items-center gap-2 text-xs text-terra-text-secondary hover:text-terra-text transition-colors border border-terra-border rounded-lg px-3 py-2 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} aria-hidden="true" />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
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
                {mortgageRates.weeklyChange30yr <= 0 ? <TrendingDown className="w-3 h-3" aria-hidden="true" /> : <TrendingUp className="w-3 h-3" aria-hidden="true" />}
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
                {+blsConstruction.monthlyChange > 0 ? <TrendingUp className="w-3 h-3" aria-hidden="true" /> : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
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
            <BarChart3 className="w-4 h-4 text-terra-primary" aria-hidden="true" />
            <h3 className="font-display font-bold text-terra-text">Price Per Sq Ft by Region</h3>
          </div>
          {isLoading ? (
            <div className="h-72 flex flex-col gap-2 justify-end pb-2 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="bg-terra-border/60 rounded-t" style={{ height: `${30 + Math.round(i * 8)}px`, width: "100%" }} />
                </div>
              ))}
              <div className="flex gap-2 mt-1">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-2 bg-terra-border/40 rounded flex-1" />)}
              </div>
            </div>
          ) : (
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
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-terra-emerald" aria-hidden="true" />
            <h3 className="font-display font-bold text-terra-text">Market Performance Radar</h3>
          </div>
          {isLoading ? (
            <div className="h-72 flex items-center justify-center animate-pulse">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 rounded-full border-2 border-terra-border/40" />
                <div className="absolute inset-6 rounded-full border border-terra-border/30" />
                <div className="absolute inset-12 rounded-full border border-terra-border/20" />
                {[0,60,120,180,240,300].map((deg, i) => (
                  <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-terra-border/60" style={{ top: `${50 + 44 * Math.sin(deg * Math.PI / 180)}%`, left: `${50 + 44 * Math.cos(deg * Math.PI / 180)}%`, transform: "translate(-50%,-50%)" }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
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
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-terra-primary" aria-hidden="true" />
          <h3 className="font-display font-bold text-terra-text">Regional Market Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
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
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                : displayMarketData.map((m: any, i: number) => {
                  const region = m.region ?? m.city ?? "Unknown";
                  const medianPrice = m.medianPrice ?? m.medianListPrice ?? 0;
                  const pricePerSqft = m.pricePerSqft ?? m.medianPricePerSqft ?? 0;
                  const yoyChange = m.yoyChange ?? m.yoyChangePercent ?? 0;
                  const capRate = m.avgCapRate ?? m.capRate ?? 0;
                  const vacancyRate = m.vacancyRate ?? 0;
                  const daysOnMarket = m.daysOnMarket ?? 0;
                  const inventory = m.inventory ?? m.activeListings ?? 0;
                  return (
                    <motion.tr key={region} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors">
                      <td className="py-3 px-3 font-medium text-terra-text">{region}</td>
                      <td className="py-3 px-3 text-right text-terra-text">{formatCurrency(medianPrice)}</td>
                      <td className="py-3 px-3 text-right text-terra-text">${pricePerSqft}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={cn("inline-flex items-center gap-1", yoyChange >= 0 ? "text-terra-emerald" : "text-terra-rose")}>
                          {yoyChange >= 0 ? <TrendingUp className="w-3 h-3" aria-hidden="true" /> : <TrendingDown className="w-3 h-3" aria-hidden="true" />}
                          {yoyChange >= 0 ? "+" : ""}{yoyChange}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-terra-text">{capRate}%</td>
                      <td className="py-3 px-3 text-right">
                        <span className={cn(vacancyRate <= 5 ? "text-terra-emerald" : vacancyRate <= 7 ? "text-terra-amber" : "text-terra-rose")}>
                          {vacancyRate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-terra-text">{daysOnMarket}</td>
                      <td className="py-3 px-3 text-right text-terra-text-secondary">{inventory.toLocaleString()}</td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
          {!isLoading && displayMarketData.length === 0 && (
            <div className="text-center py-12 text-terra-text-muted text-sm">No market data available</div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-4 h-4 text-terra-emerald" aria-hidden="true" />
          <h3 className="font-display font-bold text-terra-text">Recent Comparable Sales</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparableSales.map((sale, i) => (
            <motion.div key={sale.address} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="p-4 rounded-lg border border-terra-border bg-terra-bg-secondary hover:border-terra-border-hover transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-terra-primary/10 text-terra-primary uppercase">{sale.type}</span>
                <span className="text-xs text-terra-text-muted flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" />{sale.date}</span>
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-terra-border bg-terra-surface/50 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-terra-border">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-terra-primary" aria-hidden="true" />
            <h3 className="font-display font-bold text-terra-text">Portfolio Map</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-terra-primary/10 text-terra-primary font-mono">{properties.length} assets</span>
          </div>
          <Link href="/property-map" className="text-xs text-terra-text-secondary hover:text-terra-text transition-colors flex items-center gap-1">
            Full map view <MapPin className="w-3 h-3 inline" />
          </Link>
        </div>
        <div className="h-[360px] relative">
          {token ? (
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-[#08101e]">
                <div className="w-6 h-6 border-2 border-terra-primary/30 border-t-terra-primary rounded-full animate-spin" />
              </div>
            }>
              <PropertyMap properties={properties} token={token} height="360px" showPanel={false} />
            </Suspense>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#08101e]">
              <p className="text-xs text-terra-text-muted">Map token loading…</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
