import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Flame, MapPin, List, Filter, Search, AlertTriangle, Clock, DollarSign,
  ChevronRight, X, Building2, TrendingDown, Gavel, FileText, ShieldAlert,
  Calendar, User, Tag, ArrowRight, Bell, BarChart3, Eye, Zap, Target,
  CheckCircle, ArrowUpRight, LinkIcon, Layers, Loader2, RefreshCw, Download
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = "/api";

function fetchJson(path: string) {
  return fetch(`${API_BASE}${path}`).then(r => r.json()).then(d => d.data ?? d);
}

async function postJson(path: string, body: unknown) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

export type DistressType = "pre-foreclosure" | "foreclosure" | "auction" | "reo" | "tax-lien" | "expired-listing";
export type Borough = "Manhattan" | "Brooklyn" | "Queens" | "Bronx" | "Staten Island";

export interface ApiDistressProperty {
  id: string;
  address: string;
  borough: Borough;
  county: string;
  zipCode: string | null;
  propertyType: string;
  distressType: DistressType;
  stage: string;
  estimatedValue: number;
  debtAmount: number | null;
  lienAmount: number | null;
  auctionDate: string | null;
  filingDate: string;
  ownerName: string;
  ownerType: string;
  opportunityScore: number;
  confidenceLevel: string;
  scoreRationale: string;
  daysInDistress: number;
  sqft: number | null;
  yearBuilt: number | null;
  beds: number | null;
  baths: number | null;
  tags: string[];
  timeline: Array<{ date: string; type: string; description: string }>;
  connectorSource: string;
}

const DISTRESS_TYPE_CONFIG: Record<DistressType, { label: string; color: string; bg: string; icon: typeof Flame; pinColor: string }> = {
  "pre-foreclosure": { label: "Pre-Foreclosure", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30", icon: AlertTriangle, pinColor: "#f59e0b" },
  "foreclosure": { label: "Foreclosure", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30", icon: TrendingDown, pinColor: "#ef4444" },
  "auction": { label: "Auction", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30", icon: Gavel, pinColor: "#a855f7" },
  "reo": { label: "REO / Bank-Owned", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30", icon: Building2, pinColor: "#3b82f6" },
  "tax-lien": { label: "Tax Lien", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30", icon: FileText, pinColor: "#f97316" },
  "expired-listing": { label: "Expired Listing", color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/30", icon: Clock, pinColor: "#94a3b8" },
};

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const color = score >= 85 ? "text-[#40856a] bg-[#40856a]/10 border-[#40856a]/30"
    : score >= 70 ? "text-[#2d6a4f] bg-[#2d6a4f]/10 border-[#2d6a4f]/30"
    : score >= 55 ? "text-amber-400 bg-amber-400/10 border-amber-400/30"
    : "text-slate-400 bg-slate-400/10 border-slate-400/30";
  return (
    <div className={cn("rounded-lg border font-bold font-mono", color, size === "lg" ? "px-3 py-1.5 text-xl" : "px-2 py-0.5 text-xs")}>
      {score}
    </div>
  );
}

function DistressTypePill({ type, compact = false }: { type: DistressType; compact?: boolean }) {
  const cfg = DISTRESS_TYPE_CONFIG[type];
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border", cfg.color, cfg.bg)}>
      <cfg.icon className="w-2.5 h-2.5" />
      {compact ? cfg.label.split("/")[0].trim() : cfg.label}
    </span>
  );
}

function PropertyListCard({ property, isSelected, onClick }: { property: ApiDistressProperty; isSelected: boolean; onClick: () => void }) {
  const cfg = DISTRESS_TYPE_CONFIG[property.distressType];
  const isAuctionSoon = property.distressType === "auction" && property.auctionDate;
  const today = new Date("2026-03-31");
  const auctionDays = isAuctionSoon
    ? Math.ceil((new Date(property.auctionDate!).getTime() - today.getTime()) / 86400000)
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 border-b border-terra-border cursor-pointer hover:bg-terra-surface-hover transition-colors",
        isSelected && "bg-terra-primary/5 border-l-2 border-l-terra-primary"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold truncate", isSelected ? "text-terra-primary" : "text-terra-text")}>{property.address}</p>
          <p className="text-[11px] text-terra-text-muted">{property.borough} · {property.zipCode ?? property.county}</p>
        </div>
        <ScoreBadge score={property.opportunityScore} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <DistressTypePill type={property.distressType} compact />
        <span className="text-[10px] text-terra-text-muted font-mono">{formatCurrency(property.estimatedValue)}</span>
        {auctionDays !== null && auctionDays <= 14 && (
          <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded border border-purple-400/30">
            {auctionDays}d to auction
          </span>
        )}
      </div>
    </motion.div>
  );
}

function MapPlaceholder({ properties, selectedId, onSelectPin }: {
  properties: ApiDistressProperty[];
  selectedId: string | null;
  onSelectPin: (id: string) => void;
}) {
  const boroughCenters: Record<Borough, { x: number; y: number }> = {
    Manhattan: { x: 48, y: 20 },
    Brooklyn: { x: 50, y: 65 },
    Queens: { x: 72, y: 42 },
    Bronx: { x: 57, y: 8 },
    "Staten Island": { x: 22, y: 82 },
  };

  const displayProps = properties.slice(0, 200);

  const getPin = (p: ApiDistressProperty, idx: number) => {
    const center = boroughCenters[p.borough] ?? { x: 50, y: 50 };
    const hash = (p.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + idx * 7919) % 10000;
    const jitter = (hash % 100) / 100;
    const jitter2 = ((hash * 73) % 100) / 100;
    const x = center.x + (jitter - 0.5) * 18;
    const y = center.y + (jitter2 - 0.5) * 14;
    const cfg = DISTRESS_TYPE_CONFIG[p.distressType];
    const isSelected = p.id === selectedId;
    return { x, y, cfg, isSelected };
  };

  return (
    <div className="relative w-full h-full bg-[#0a0f1e] overflow-hidden rounded-b-xl">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: "linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <ellipse cx="52" cy="35" rx="14" ry="32" fill="#1e2d4a" opacity="0.8" />
          <ellipse cx="50" cy="68" rx="18" ry="14" fill="#1a2640" opacity="0.8" />
          <ellipse cx="74" cy="45" rx="14" ry="16" fill="#1c2845" opacity="0.8" />
          <ellipse cx="56" cy="10" rx="10" ry="9" fill="#1d2a42" opacity="0.7" />
          <ellipse cx="23" cy="84" rx="12" ry="8" fill="#182035" opacity="0.7" />
          <text x="52" y="37" textAnchor="middle" fontSize="3.5" fill="#4e6a9a" fontFamily="monospace">Manhattan</text>
          <text x="50" y="70" textAnchor="middle" fontSize="3.5" fill="#4e6a9a" fontFamily="monospace">Brooklyn</text>
          <text x="74" y="47" textAnchor="middle" fontSize="3.5" fill="#4e6a9a" fontFamily="monospace">Queens</text>
          <text x="56" y="12" textAnchor="middle" fontSize="3.5" fill="#4e6a9a" fontFamily="monospace">Bronx</text>
          <text x="23" y="86" textAnchor="middle" fontSize="3" fill="#4e6a9a" fontFamily="monospace">S.I.</text>
          {displayProps.map((p, i) => {
            const { x, y, cfg, isSelected } = getPin(p, i);
            return (
              <g key={p.id} onClick={() => onSelectPin(p.id)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={isSelected ? 3.5 : 2.2} fill={cfg.pinColor} opacity={isSelected ? 1 : 0.85} stroke={isSelected ? "white" : "none"} strokeWidth={0.6} />
                {isSelected && <circle cx={x} cy={y} r={5.5} fill="none" stroke={cfg.pinColor} strokeWidth={0.5} opacity={0.5} />}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="absolute bottom-3 left-3 flex flex-col gap-1">
        {(Object.entries(DISTRESS_TYPE_CONFIG) as [DistressType, typeof DISTRESS_TYPE_CONFIG[DistressType]][]).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.pinColor }} />
            <span className="text-[9px] text-slate-400">{cfg.label}</span>
          </div>
        ))}
      </div>
      <div className="absolute top-2 right-2 text-[9px] text-slate-500 font-mono">NYC DISTRESS MAP · {displayProps.length} pins</div>
    </div>
  );
}

function PropertyDetailPanel({ property, onClose, onConvertToLead }: { property: ApiDistressProperty; onClose: () => void; onConvertToLead: (p: ApiDistressProperty) => void }) {
  const cfg = DISTRESS_TYPE_CONFIG[property.distressType];
  const equityPercent = property.debtAmount
    ? Math.round(((property.estimatedValue - property.debtAmount) / property.estimatedValue) * 100)
    : null;
  const today = new Date("2026-03-31");
  const auctionDays = property.auctionDate
    ? Math.ceil((new Date(property.auctionDate).getTime() - today.getTime()) / 86400000)
    : null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-terra-border flex items-start justify-between gap-2 sticky top-0 bg-terra-bg-secondary z-10">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-terra-text leading-tight">{property.address}</p>
          <p className="text-xs text-terra-text-muted mt-0.5">{property.borough} · {property.county} County · {property.zipCode}</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-terra-surface rounded transition-colors flex-shrink-0">
          <X className="w-4 h-4 text-terra-text-muted" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <DistressTypePill type={property.distressType} />
          <span className="text-xs text-terra-text-muted capitalize">{property.stage.replace(/-/g, " ")}</span>
          {auctionDays !== null && auctionDays <= 30 && (
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded border", auctionDays <= 7 ? "text-red-400 bg-red-400/10 border-red-400/30" : "text-purple-400 bg-purple-400/10 border-purple-400/30")}>
              {auctionDays <= 0 ? "TODAY" : `${auctionDays}d`} to auction
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-terra-surface rounded-lg p-3 border border-terra-border">
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider mb-1">Est. Value</p>
            <p className="text-lg font-bold text-terra-text font-mono">{formatCurrency(property.estimatedValue)}</p>
          </div>
          <div className="bg-terra-surface rounded-lg p-3 border border-terra-border">
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider mb-1">Opportunity Score</p>
            <div className="flex items-center gap-2">
              <span className={cn("text-lg font-bold font-mono", property.opportunityScore >= 85 ? "text-[#40856a]" : property.opportunityScore >= 70 ? "text-[#2d6a4f]" : "text-amber-400")}>
                {property.opportunityScore}
              </span>
              <span className="text-[10px] text-terra-text-muted capitalize">{property.confidenceLevel} confidence</span>
            </div>
          </div>
          {property.debtAmount != null && (
            <div className="bg-terra-surface rounded-lg p-3 border border-terra-border">
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider mb-1">Debt Amount</p>
              <p className="text-lg font-bold text-red-400 font-mono">{formatCurrency(property.debtAmount)}</p>
            </div>
          )}
          {property.lienAmount != null && (
            <div className="bg-terra-surface rounded-lg p-3 border border-terra-border">
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider mb-1">Lien Amount</p>
              <p className="text-lg font-bold text-orange-400 font-mono">{formatCurrency(property.lienAmount)}</p>
            </div>
          )}
          {equityPercent !== null && (
            <div className="bg-terra-surface rounded-lg p-3 border border-terra-border">
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider mb-1">Equity</p>
              <p className={cn("text-lg font-bold font-mono", equityPercent >= 30 ? "text-[#40856a]" : equityPercent >= 10 ? "text-amber-400" : "text-red-400")}>{equityPercent}%</p>
            </div>
          )}
          <div className="bg-terra-surface rounded-lg p-3 border border-terra-border">
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider mb-1">Days in Distress</p>
            <p className={cn("text-lg font-bold font-mono", property.daysInDistress > 200 ? "text-red-400" : property.daysInDistress > 90 ? "text-amber-400" : "text-terra-text")}>{property.daysInDistress}d</p>
          </div>
        </div>

        {(property.sqft || property.yearBuilt || property.beds) && (
          <div className="flex items-center gap-4 text-xs text-terra-text-muted">
            {property.sqft && <span>{property.sqft.toLocaleString()} sqft</span>}
            {property.yearBuilt && <span>Built {property.yearBuilt}</span>}
            {property.beds && <span>{property.beds} bd / {property.baths} ba</span>}
            <span className="capitalize">{property.propertyType.replace(/-/g, " ")}</span>
          </div>
        )}

        <div className="bg-terra-surface border border-terra-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-3.5 h-3.5 text-terra-primary" />
            <span className="text-xs font-semibold text-terra-text">Ownership</span>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded ml-auto", property.ownerType === "llc" ? "bg-amber-400/10 text-amber-400" : property.ownerType === "corporate" ? "bg-blue-400/10 text-blue-400" : "bg-terra-surface text-terra-text-muted")}>
              {property.ownerType.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-terra-text">{property.ownerName}</p>
          <p className="text-[11px] text-terra-text-muted mt-0.5">Filed {property.filingDate} · {property.county} County</p>
        </div>

        <div className="bg-terra-surface border border-terra-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-terra-text">AI Insight</span>
            <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 ml-auto">DISTRESS ENGINE</span>
          </div>
          <div className="h-1.5 bg-terra-border rounded-full overflow-hidden mb-2">
            <div className={cn("h-full rounded-full", property.opportunityScore >= 85 ? "bg-[#40856a]" : property.opportunityScore >= 70 ? "bg-[#2d6a4f]" : "bg-amber-400")} style={{ width: `${property.opportunityScore}%` }} />
          </div>
          <p className="text-xs text-terra-text-secondary leading-relaxed">{property.scoreRationale}</p>
          <div className="mt-2 pt-2 border-t border-terra-border">
            <p className="text-[10px] text-terra-text-muted">Likelihood of Sale: <span className={cn("font-semibold", property.opportunityScore >= 80 ? "text-[#40856a]" : "text-amber-400")}>{property.opportunityScore >= 80 ? "High (70–85%)" : property.opportunityScore >= 65 ? "Medium (40–70%)" : "Low (10–40%)"}</span></p>
          </div>
        </div>

        {property.timeline.length > 0 && (
          <div className="bg-terra-surface border border-terra-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-3.5 h-3.5 text-terra-text-muted" />
              <span className="text-xs font-semibold text-terra-text">Distress Timeline</span>
            </div>
            <div className="space-y-2">
              {property.timeline.map((event, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex flex-col items-center">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-0.5", i === property.timeline.length - 1 ? "bg-terra-primary" : "bg-terra-border")} />
                    {i < property.timeline.length - 1 && <div className="w-0.5 h-full bg-terra-border flex-1 mt-0.5" />}
                  </div>
                  <div className="pb-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold text-terra-text">{event.type}</span>
                      <span className="text-[10px] text-terra-text-muted font-mono">{event.date}</span>
                    </div>
                    <p className="text-[11px] text-terra-text-secondary mt-0.5">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {property.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.tags.map(t => (
              <span key={t} className="text-[10px] text-terra-text-muted bg-terra-surface border border-terra-border px-2 py-0.5 rounded">{t}</span>
            ))}
          </div>
        )}

        <div className="text-[10px] text-terra-text-muted border-t border-terra-border pt-2">
          Source: {property.connectorSource}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] text-terra-text-muted uppercase tracking-wider font-semibold">Actions</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { onConvertToLead(property); onClose(); }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-terra-primary/10 border border-terra-primary/30 text-terra-primary text-xs font-semibold hover:bg-terra-primary/20 transition-colors">
              <LinkIcon className="w-3 h-3" /> Convert to Lead
            </button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#40856a]/10 border border-[#40856a]/30 text-[#40856a] text-xs font-semibold hover:bg-[#40856a]/20 transition-colors">
              <Eye className="w-3 h-3" /> Add to Watchlist
            </button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-semibold hover:bg-amber-400/20 transition-colors">
              <Bell className="w-3 h-3" /> Set Alert
            </button>
            <button className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-terra-surface border border-terra-border text-terra-text-secondary text-xs font-semibold hover:bg-terra-surface-hover transition-colors">
              <Target className="w-3 h-3" /> Open Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "score", label: "Highest Score" },
  { value: "newest", label: "Newest" },
  { value: "highest-value", label: "Highest Value" },
  { value: "closest-auction", label: "Closest Auction" },
];

const DISTRESS_FILTERS: Array<{ value: DistressType | "all"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "pre-foreclosure", label: "Pre-Foreclosure" },
  { value: "foreclosure", label: "Foreclosure" },
  { value: "auction", label: "Auction" },
  { value: "reo", label: "REO" },
  { value: "tax-lien", label: "Tax Lien" },
  { value: "expired-listing", label: "Expired" },
];

const BOROUGH_FILTERS: Array<{ value: Borough | "all"; label: string }> = [
  { value: "all", label: "All Boroughs" },
  { value: "Manhattan", label: "Manhattan" },
  { value: "Brooklyn", label: "Brooklyn" },
  { value: "Queens", label: "Queens" },
  { value: "Bronx", label: "Bronx" },
  { value: "Staten Island", label: "Staten Island" },
];

function useDistressProperties(params: { borough?: string; distressType?: string; q?: string; limit: number }) {
  const searchParams = new URLSearchParams();
  if (params.borough && params.borough !== "all") searchParams.set("borough", params.borough);
  if (params.distressType && params.distressType !== "all") searchParams.set("distressType", params.distressType);
  if (params.q) searchParams.set("q", params.q);
  searchParams.set("limit", String(params.limit));
  searchParams.set("sort", "score");

  return useQuery({
    queryKey: ["terra-distress-properties", params],
    queryFn: () => fetchJson(`/terra/distress/search?${searchParams}`),
    staleTime: 30000,
  });
}

function useDistressAlerts() {
  return useQuery({
    queryKey: ["terra-distress-alerts"],
    queryFn: () => fetchJson("/terra/distress/alerts?limit=20"),
    staleTime: 60000,
  });
}

export default function DistressEnginePage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "list" | "map">("split");
  const [distressFilter, setDistressFilter] = useState<DistressType | "all">("all");
  const [boroughFilter, setBoroughFilter] = useState<Borough | "all">("all");
  const [sortBy, setSortBy] = useState("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAlerts, setShowAlerts] = useState(false);
  const [conversionState, setConversionState] = useState<{ status: "idle" | "loading" | "success" | "error"; message?: string }>({ status: "idle" });

  const { data, isLoading, isError, refetch } = useDistressProperties({
    borough: boroughFilter,
    distressType: distressFilter,
    q: searchQuery || undefined,
    limit: 500,
  });

  const { data: alertData } = useDistressAlerts();
  const alerts = alertData?.alerts ?? [];

  const allProperties: ApiDistressProperty[] = (data?.properties ?? []).map((p: any) => ({
    id: p.externalId ?? String(p.id),
    address: p.address,
    borough: p.borough,
    county: p.county,
    zipCode: p.zipCode,
    propertyType: p.propertyType,
    distressType: p.distressType,
    stage: p.stage,
    estimatedValue: Number(p.estimatedValue),
    debtAmount: p.debtAmount != null ? Number(p.debtAmount) : null,
    lienAmount: p.lienAmount != null ? Number(p.lienAmount) : null,
    auctionDate: p.auctionDate,
    filingDate: p.filingDate,
    ownerName: p.ownerName,
    ownerType: p.ownerType,
    opportunityScore: Number(p.opportunityScore),
    confidenceLevel: p.confidenceLevel,
    scoreRationale: p.scoreRationale,
    daysInDistress: Number(p.daysInDistress),
    sqft: p.sqft,
    yearBuilt: p.yearBuilt,
    beds: p.beds,
    baths: p.baths,
    tags: p.tags ?? [],
    timeline: p.timeline ?? [],
    connectorSource: p.connectorSource,
  }));

  const sorted = useMemo(() => {
    const results = [...allProperties];
    if (sortBy === "newest") results.sort((a, b) => b.filingDate.localeCompare(a.filingDate));
    else if (sortBy === "highest-value") results.sort((a, b) => b.estimatedValue - a.estimatedValue);
    else if (sortBy === "closest-auction") {
      results.sort((a, b) => {
        if (!a.auctionDate && !b.auctionDate) return 0;
        if (!a.auctionDate) return 1;
        if (!b.auctionDate) return -1;
        return a.auctionDate.localeCompare(b.auctionDate);
      });
    } else {
      results.sort((a, b) => b.opportunityScore - a.opportunityScore);
    }
    return results;
  }, [allProperties, sortBy]);

  const selectedProperty = selectedId ? sorted.find(p => p.id === selectedId) ?? null : null;

  const byType = useMemo(() => {
    const counts: Partial<Record<DistressType, number>> = {};
    for (const p of sorted) counts[p.distressType] = (counts[p.distressType] ?? 0) + 1;
    return counts;
  }, [sorted]);

  const auctionImminent = sorted.filter(p => p.auctionDate && Math.ceil((new Date(p.auctionDate).getTime() - Date.now()) / 86400000) <= 30).length;

  async function handleConvertToLead(property: ApiDistressProperty) {
    setConversionState({ status: "loading" });
    try {
      const res = await postJson("/terra/convert/distress-to-lead", {
        propertyId: property.id,
        notes: `Converted from Distress Engine — ${property.distressType} at ${property.address}`,
      });
      if (res.error) {
        setConversionState({ status: "error", message: res.error });
      } else {
        setConversionState({ status: "success", message: `Lead created for ${property.address}` });
        qc.invalidateQueries({ queryKey: ["terra-leads"] });
        setTimeout(() => setConversionState({ status: "idle" }), 4000);
      }
    } catch {
      setConversionState({ status: "error", message: "Failed to convert — check connection" });
      setTimeout(() => setConversionState({ status: "idle" }), 4000);
    }
  }

  function handleExportCsv() {
    const params = new URLSearchParams();
    if (boroughFilter !== "all") params.set("borough", boroughFilter);
    if (distressFilter !== "all") params.set("distressType", distressFilter);
    if (searchQuery) params.set("q", searchQuery);
    window.open(`${API_BASE}/terra/distress/export/csv?${params}`, "_blank");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {conversionState.status !== "idle" && (
        <div className={cn(
          "fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-sm font-medium transition-all",
          conversionState.status === "loading" ? "bg-terra-bg-secondary border-terra-border text-terra-text-muted" :
          conversionState.status === "success" ? "bg-[#0f2a1e] border-[#2d6a4f]/50 text-[#40856a]" :
          "bg-rose-900/90 border-rose-500/50 text-rose-200"
        )}>
          {conversionState.status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          {conversionState.status === "success" && <CheckCircle className="w-4 h-4" />}
          {conversionState.status === "error" && <AlertTriangle className="w-4 h-4" />}
          <span>
            {conversionState.status === "loading" && "Converting to lead..."}
            {conversionState.status === "success" && (conversionState.message ?? "Lead created")}
            {conversionState.status === "error" && (conversionState.message ?? "Conversion failed")}
          </span>
          {conversionState.status !== "loading" && (
            <button onClick={() => setConversionState({ status: "idle" })} className="ml-2 hover:opacity-70">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex-shrink-0 px-4 pt-4 pb-2 space-y-3 border-b border-terra-border bg-terra-bg-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-display font-bold text-terra-text">Distress Intelligence Engine</h1>
                <p className="text-[10px] text-terra-text-muted">
                  {isLoading ? "Loading..." : `${sorted.length} properties · ${auctionImminent} auctions within 30 days`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-terra-surface border border-terra-border rounded-lg p-0.5">
              {[
                { mode: "split" as const, icon: Layers },
                { mode: "list" as const, icon: List },
                { mode: "map" as const, icon: MapPin },
              ].map(({ mode, icon: Icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={cn("p-1.5 rounded transition-colors", viewMode === mode ? "bg-terra-primary/20 text-terra-primary" : "text-terra-text-muted hover:text-terra-text")}>
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCsv}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-terra-border text-terra-text-secondary hover:bg-terra-surface transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={() => refetch()} className="p-1.5 rounded-lg border border-terra-border text-terra-text-muted hover:text-terra-text transition-colors">
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            </button>
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors", showAlerts ? "bg-red-500/10 border-red-500/30 text-red-400" : "border-terra-border text-terra-text-secondary hover:bg-terra-surface")}
            >
              <Bell className="w-3.5 h-3.5" />
              Alerts
              {alerts.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{alerts.length}</span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-terra-text-muted" />
            <input
              type="text"
              placeholder="Search address, owner, zip..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-terra-surface border border-terra-border rounded-lg text-xs text-terra-text placeholder:text-terra-text-muted focus:outline-none focus:border-terra-primary"
            />
          </div>
          <select value={boroughFilter} onChange={e => setBoroughFilter(e.target.value as Borough | "all")}
            className="px-2 py-1.5 bg-terra-surface border border-terra-border rounded-lg text-xs text-terra-text focus:outline-none focus:border-terra-primary">
            {BOROUGH_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select value={distressFilter} onChange={e => setDistressFilter(e.target.value as DistressType | "all")}
            className="px-2 py-1.5 bg-terra-surface border border-terra-border rounded-lg text-xs text-terra-text focus:outline-none focus:border-terra-primary">
            {DISTRESS_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-2 py-1.5 bg-terra-surface border border-terra-border rounded-lg text-xs text-terra-text focus:outline-none focus:border-terra-primary">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {!isLoading && <span className="text-[11px] text-terra-text-muted ml-auto">{sorted.length} results</span>}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(DISTRESS_FILTERS.slice(1) as Array<{ value: DistressType; label: string }>).map(({ value: type }) => {
            const cfg = DISTRESS_TYPE_CONFIG[type];
            const count = byType[type] ?? 0;
            return (
              <button key={type} onClick={() => setDistressFilter(distressFilter === type ? "all" : type)}
                className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold whitespace-nowrap transition-colors flex-shrink-0", distressFilter === type ? cn(cfg.color, cfg.bg) : "border-terra-border text-terra-text-muted hover:bg-terra-surface")}>
                <cfg.icon className="w-2.5 h-2.5" />
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showAlerts && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="flex-shrink-0 border-b border-terra-border bg-terra-surface overflow-hidden">
            <div className="p-3 space-y-1.5 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-terra-text flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-red-400" /> Active Distress Alerts
                </p>
                <button onClick={() => setShowAlerts(false)}>
                  <X className="w-3.5 h-3.5 text-terra-text-muted" />
                </button>
              </div>
              {alerts.length === 0 ? (
                <p className="text-xs text-terra-text-muted">No active alerts</p>
              ) : alerts.map((a: any) => (
                <div key={a.id} className={cn("flex items-start gap-2 px-3 py-2 rounded-lg border text-xs",
                  a.severity === "critical" ? "bg-red-500/5 border-red-500/20" : a.severity === "high" ? "bg-amber-500/5 border-amber-500/20" : "bg-terra-surface border-terra-border"
                )}>
                  <AlertTriangle className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", a.severity === "critical" ? "text-red-400" : a.severity === "high" ? "text-amber-400" : "text-terra-text-muted")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-terra-text">{a.message}</p>
                    <p className="text-terra-text-muted text-[10px] mt-0.5 font-mono">{a.triggeredAt?.slice(0, 10)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-hidden">
        {isLoading && (
          <div className="p-4 space-y-2 overflow-auto">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-terra-border bg-terra-surface/40 p-4 flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-terra-border shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-3 bg-terra-border rounded w-2/3" />
                  <div className="h-2.5 bg-terra-border/60 rounded w-1/3" />
                  <div className="flex gap-2 mt-1">
                    <div className="h-4 w-20 bg-terra-border/50 rounded-full" />
                    <div className="h-4 w-16 bg-terra-border/40 rounded-full" />
                  </div>
                </div>
                <div className="shrink-0 text-right space-y-1.5">
                  <div className="h-6 w-10 bg-terra-border rounded" />
                  <div className="h-2.5 w-14 bg-terra-border/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-terra-text-muted">
            <AlertTriangle className="w-8 h-8 mb-2 text-rose-400" />
            <p className="text-sm">Failed to load distress properties</p>
            <button onClick={() => refetch()} className="mt-3 px-4 py-2 rounded-lg border border-terra-border text-xs hover:bg-terra-surface transition-colors">Retry</button>
          </div>
        )}

        {!isLoading && !isError && viewMode === "split" && (
          <div className="flex h-full">
            <div className="w-72 flex-shrink-0 border-r border-terra-border overflow-y-auto">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-terra-text-muted text-sm">
                  <Search className="w-6 h-6 mb-2" />
                  No properties found
                </div>
              ) : sorted.map(p => (
                <PropertyListCard key={p.id} property={p} isSelected={selectedId === p.id} onClick={() => setSelectedId(p.id)} />
              ))}
            </div>
            <div className={cn("flex-1 overflow-hidden", selectedProperty ? "grid grid-cols-2" : "")}>
              <div className="h-full">
                <MapPlaceholder properties={sorted} selectedId={selectedId} onSelectPin={setSelectedId} />
              </div>
              {selectedProperty && (
                <div className="border-l border-terra-border overflow-y-auto bg-terra-bg-secondary">
                  <PropertyDetailPanel property={selectedProperty} onClose={() => setSelectedId(null)} onConvertToLead={handleConvertToLead} />
                </div>
              )}
            </div>
          </div>
        )}

        {!isLoading && !isError && viewMode === "list" && (
          <div className="overflow-auto h-full p-4">
            <div className="rounded-xl border border-terra-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-terra-surface border-b border-terra-border">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Address</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Borough</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Type</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Owner</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Est. Value</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Score</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Days</th>
                    <th className="text-right px-3 py-3 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">Filed</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.01, 0.3) }}
                      className={cn("border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors cursor-pointer", selectedId === p.id && "bg-terra-primary/5")}
                      onClick={() => { setSelectedId(p.id); setViewMode("split"); }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-terra-text text-xs">{p.address}</p>
                        <p className="text-[10px] text-terra-text-muted">{p.zipCode ?? p.county}</p>
                      </td>
                      <td className="px-3 py-3 text-xs text-terra-text-secondary">{p.borough}</td>
                      <td className="px-3 py-3"><DistressTypePill type={p.distressType} compact /></td>
                      <td className="px-3 py-3 text-xs text-terra-text-muted truncate max-w-[120px]">{p.ownerName}</td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-terra-text">{formatCurrency(p.estimatedValue)}</td>
                      <td className="px-3 py-3 text-right"><ScoreBadge score={p.opportunityScore} /></td>
                      <td className="px-3 py-3 text-right text-[10px] text-terra-text-muted">{p.daysInDistress}d</td>
                      <td className="px-3 py-3 text-right text-[10px] text-terra-text-muted font-mono">{p.filingDate}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && !isError && viewMode === "map" && (
          <div className="h-full flex">
            <div className="flex-1">
              <MapPlaceholder properties={sorted} selectedId={selectedId} onSelectPin={id => { setSelectedId(id); }} />
            </div>
            {selectedProperty && (
              <div className="w-80 border-l border-terra-border overflow-y-auto bg-terra-bg-secondary">
                <PropertyDetailPanel property={selectedProperty} onClose={() => setSelectedId(null)} onConvertToLead={handleConvertToLead} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
