import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp, Star, Filter, RefreshCw, Download, DollarSign, Target,
  Building2, AlertTriangle, Clock, Gavel, FileText, CheckCircle, X,
  BarChart3, Zap, Users, Bookmark
} from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = "/api";

function fetchJson(path: string) {
  return fetch(`${API}${path}`).then(r => r.json()).then(d => d.data ?? d);
}

async function postJson(path: string, body: unknown) {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

const DISTRESS_ICONS: Record<string, typeof TrendingUp> = {
  "pre-foreclosure": AlertTriangle,
  "foreclosure": TrendingUp,
  "auction": Gavel,
  "reo": Building2,
  "tax-lien": FileText,
  "expired-listing": Clock,
};

const DISTRESS_COLORS: Record<string, { color: string; bg: string }> = {
  "pre-foreclosure": { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
  "foreclosure": { color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
  "auction": { color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30" },
  "reo": { color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  "tax-lien": { color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  "expired-listing": { color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/30" },
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#a07848" : "#f59e0b";
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle cx="25" cy="25" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="text-xs font-bold font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

function OpportunityCard({ property, onSave, onConvert, saved }: {
  property: any;
  onSave: (id: string) => void;
  onConvert: (id: string) => void;
  saved: boolean;
}) {
  const Icon = DISTRESS_ICONS[property.distressType] ?? Building2;
  const cfg = DISTRESS_COLORS[property.distressType] ?? { color: "text-terra-text-muted", bg: "bg-terra-surface border-terra-border" };
  const today = new Date("2026-03-31");
  const auctionDays = property.auctionDate
    ? Math.ceil((new Date(property.auctionDate).getTime() - today.getTime()) / 86400000)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border bg-terra-surface/60 p-4 hover:border-terra-primary/30 transition-all",
        property.opportunityScore >= 85 ? "border-emerald-500/30" : "border-terra-border"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <ScoreRing score={property.opportunityScore} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-terra-text truncate">{property.address}</p>
          <p className="text-[11px] text-terra-text-muted">{property.borough} · {property.county} · {property.zipCode}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border", cfg.color, cfg.bg)}>
              <Icon className="w-2.5 h-2.5" />
              {property.distressType.replace(/-/g, " ")}
            </span>
            <span className="text-[10px] text-terra-text-muted capitalize">{property.confidenceLevel} conf.</span>
          </div>
        </div>
        <button
          onClick={() => onSave(property.id)}
          className={cn("p-1.5 rounded-lg transition-colors", saved ? "text-amber-400 bg-amber-400/10" : "text-terra-text-muted hover:text-terra-text hover:bg-terra-surface")}
        >
          <Star className={cn("w-4 h-4", saved && "fill-current")} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-[9px] text-terra-text-muted uppercase tracking-wider">Est. Value</p>
          <p className="text-sm font-bold font-mono text-terra-text">{formatCurrency(property.estimatedValue)}</p>
        </div>
        {property.debtAmount && (
          <div>
            <p className="text-[9px] text-terra-text-muted uppercase tracking-wider">Debt</p>
            <p className="text-sm font-bold font-mono text-red-400">{formatCurrency(property.debtAmount)}</p>
          </div>
        )}
        {property.equityPercent !== null && property.equityPercent !== undefined && (
          <div>
            <p className="text-[9px] text-terra-text-muted uppercase tracking-wider">Equity</p>
            <p className={cn("text-sm font-bold font-mono", property.equityPercent >= 25 ? "text-emerald-400" : property.equityPercent >= 10 ? "text-amber-400" : "text-red-400")}>
              {property.equityPercent}%
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-terra-text-muted mb-3">
        <span>{property.daysInDistress}d in distress</span>
        {property.sqft && <><span>·</span><span>{property.sqft.toLocaleString()} sqft</span></>}
        {auctionDays !== null && auctionDays <= 30 && (
          <span className={cn("font-bold", auctionDays <= 7 ? "text-red-400" : "text-purple-400")}>
            · {auctionDays}d to auction
          </span>
        )}
      </div>

      <p className="text-[11px] text-terra-text-secondary leading-relaxed mb-3 line-clamp-2">{property.scoreRationale}</p>

      <div className="flex items-center gap-1 mb-3">
        <p className="text-[10px] text-terra-text-muted font-semibold">Owner:</p>
        <p className="text-[10px] text-terra-text truncate">{property.ownerName}</p>
        <span className={cn("text-[9px] px-1 py-0.5 rounded ml-auto", property.ownerType === "llc" ? "bg-amber-400/10 text-amber-400" : "bg-terra-surface text-terra-text-muted")}>
          {property.ownerType.toUpperCase()}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onConvert(property.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-terra-primary/10 border border-terra-primary/30 text-terra-primary text-[11px] font-semibold hover:bg-terra-primary/20 transition-colors"
        >
          <TrendingUp className="w-3 h-3" /> Convert to Lead
        </button>
        <button
          onClick={() => onSave(property.id)}
          className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors",
            saved ? "bg-amber-400/10 border-amber-400/30 text-amber-400" : "bg-terra-surface border-terra-border text-terra-text-secondary hover:bg-terra-surface-hover"
          )}
        >
          {saved ? "Saved" : "Watchlist"}
        </button>
      </div>
    </motion.div>
  );
}

export default function InvestorModePage() {
  const qc = useQueryClient();
  const [minScore, setMinScore] = useState(70);
  const [borough, setBorough] = useState("all");
  const [distressType, setDistressType] = useState("all");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [converting, setConverting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const params = new URLSearchParams({ minScore: String(minScore), limit: "200" });
  if (borough !== "all") params.set("borough", borough);
  if (distressType !== "all") params.set("type", distressType);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["terra-investor-opportunities", minScore, borough, distressType],
    queryFn: () => fetchJson(`/terra/investor/opportunities?${params}`),
    staleTime: 30000,
  });

  const properties = data?.properties ?? [];
  const summary = data?.summary ?? {};

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleConvert(propertyId: string) {
    setConverting(propertyId);
    try {
      const res = await postJson("/terra/convert/distress-to-lead", { propertyId });
      if (res.error) showToast(res.error, false);
      else {
        showToast("Lead created successfully", true);
        qc.invalidateQueries({ queryKey: ["terra-leads"] });
      }
    } catch {
      showToast("Failed to convert", false);
    } finally {
      setConverting(null);
    }
  }

  async function handleSave(propertyId: string) {
    if (savedIds.has(propertyId)) return;
    try {
      await postJson("/terra/opportunities/save", { propertyId });
      setSavedIds(s => new Set([...s, propertyId]));
      showToast("Added to watchlist", true);
    } catch {
      showToast("Failed to save", false);
    }
  }

  function handleExport() {
    const csvParams = new URLSearchParams({ minScore: String(minScore) });
    if (borough !== "all") csvParams.set("borough", borough);
    if (distressType !== "all") csvParams.set("distressType", distressType);
    window.open(`${API}/terra/distress/export/csv?${csvParams}`, "_blank");
  }

  const topByBorough: Record<string, number> = {};
  for (const p of properties) {
    topByBorough[p.borough] = (topByBorough[p.borough] ?? 0) + 1;
  }

  return (
    <div className="p-6 space-y-6 overflow-auto">
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium",
          toast.ok ? "bg-emerald-900/90 border-emerald-500/50 text-emerald-200" : "bg-rose-900/90 border-rose-500/50 text-rose-200"
        )}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold text-terra-text">Investor Mode</h1>
            </div>
            <p className="text-sm text-terra-text-secondary">Investment-grade distress opportunities — score-filtered, watchlist-ready, bulk-export for investor packets</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="p-2 rounded-lg border border-terra-border bg-terra-surface text-terra-text-muted hover:text-terra-text transition-colors">
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text-secondary hover:bg-terra-surface-hover transition-colors">
              <Download className="w-4 h-4" /> Export Packet
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Opportunities", value: summary.totalCount ?? 0, icon: Target, color: "bg-terra-primary" },
          { label: "Total Value", value: summary.totalValue ? formatCurrency(summary.totalValue) : "—", icon: DollarSign, color: "bg-emerald-600" },
          { label: "Avg Score", value: summary.avgScore ?? 0, icon: BarChart3, color: "bg-amber-600" },
          { label: "Watchlisted", value: savedIds.size, icon: Star, color: "bg-blue-600" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-terra-border bg-terra-surface/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{m.label}</p>
              <div className={cn("p-1.5 rounded-lg", m.color)}>
                <m.icon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-terra-text">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-terra-border bg-terra-surface/30">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider whitespace-nowrap">Min Score</label>
          <select value={minScore} onChange={e => setMinScore(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
            <option value={60}>60+ (Broad)</option>
            <option value={70}>70+ (Standard)</option>
            <option value={80}>80+ (Premium)</option>
            <option value={85}>85+ (Elite)</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider whitespace-nowrap">Borough</label>
          <select value={borough} onChange={e => setBorough(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
            <option value="all">All Boroughs</option>
            <option value="Manhattan">Manhattan</option>
            <option value="Brooklyn">Brooklyn</option>
            <option value="Queens">Queens</option>
            <option value="Bronx">Bronx</option>
            <option value="Staten Island">Staten Island</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider whitespace-nowrap">Type</label>
          <select value={distressType} onChange={e => setDistressType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
            <option value="all">All Types</option>
            <option value="pre-foreclosure">Pre-Foreclosure</option>
            <option value="foreclosure">Foreclosure</option>
            <option value="auction">Auction</option>
            <option value="reo">REO</option>
            <option value="tax-lien">Tax Lien</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {Object.entries(topByBorough).slice(0, 5).map(([b, count]) => (
            <div key={b} className="flex items-center gap-1 text-[10px] text-terra-text-muted bg-terra-surface border border-terra-border px-2 py-1 rounded">
              <span className="font-semibold text-terra-text">{count}</span> {b}
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-terra-border bg-terra-surface/40 p-5 animate-pulse">
              <div className="h-3 bg-terra-border rounded w-2/3 mb-2" />
              <div className="h-2.5 bg-terra-border/60 rounded w-1/2 mb-4" />
              <div className="h-8 bg-terra-border/40 rounded w-16 mb-3" />
              <div className="flex gap-2">
                <div className="h-4 w-20 bg-terra-border/50 rounded-full" />
                <div className="h-4 w-16 bg-terra-border/40 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && properties.length === 0 && (
        <div className="rounded-xl border border-dashed border-terra-border bg-terra-surface/20 p-12 text-center">
          <Target className="w-10 h-10 text-terra-text-muted mx-auto mb-3" />
          <p className="text-sm font-semibold text-terra-text mb-1">No opportunities at this threshold</p>
          <p className="text-xs text-terra-text-muted">Try lowering the minimum score or expanding filters</p>
        </div>
      )}

      {!isLoading && properties.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-terra-text-muted">{properties.length} investment-grade {properties.length === 1 ? "property" : "properties"} · score ≥ {minScore}</p>
            <button onClick={() => {
              properties.forEach((p: any) => handleSave(p.id));
            }} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-terra-border text-terra-text-secondary hover:bg-terra-surface transition-colors">
              <Bookmark className="w-3.5 h-3.5" /> Save All to Watchlist
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((p: any) => (
              <OpportunityCard
                key={p.id}
                property={p}
                onSave={handleSave}
                onConvert={handleConvert}
                saved={savedIds.has(p.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
