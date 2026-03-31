import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Home, Search, Filter, MapPin, Clock, TrendingDown, Eye, ChevronDown, X, Building2, ArrowRight, Radio } from "lucide-react";
import { listings, type Listing } from "@/data/brokerage";
import { RiskBadge, StageBadge, formatCurrency, AgentAvatar, PropertyDrawer } from "@/components/brokerage-ui";
import { cn } from "@workspace/shared-ui/utils";
import { useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = BASE.replace(/\/[^/]+$/, "/api");

type SortKey = "dom" | "price" | "showings" | "offerCount" | "riskScore";

const typeLabels: Record<string, string> = {
  "single-family": "SFR",
  "condo": "Condo",
  "multi-family": "Multi",
  "commercial": "Commercial",
  "land": "Land",
  "townhouse": "Townhouse",
};

function ListingRow({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr
        onClick={() => setOpen(true)}
        className="border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors cursor-pointer"
      >
        <td className="py-3 px-4">
          <div>
            <p className="text-sm font-semibold text-terra-text">{listing.address}</p>
            <div className="flex items-center gap-1 text-[10px] text-terra-text-muted mt-0.5">
              <MapPin className="w-3 h-3" />{listing.city}, {listing.state} {listing.zip}
            </div>
          </div>
        </td>
        <td className="py-3 px-4 text-xs text-terra-text-secondary">{typeLabels[listing.type]}</td>
        <td className="py-3 px-4 text-xs font-semibold text-terra-text">{formatCurrency(listing.price)}</td>
        <td className="py-3 px-4">
          <span className={cn("text-xs font-semibold", listing.dom >= 30 ? "text-rose-400" : listing.dom >= 21 ? "text-amber-400" : "text-terra-text")}>
            {listing.dom}d
          </span>
        </td>
        <td className="py-3 px-4"><StageBadge stage={listing.status} /></td>
        <td className="py-3 px-4 text-xs text-terra-text">{listing.agentName.split(" ")[0]}</td>
        <td className="py-3 px-4 text-xs text-terra-text">{listing.showings}</td>
        <td className="py-3 px-4 text-xs">
          {listing.offerCount > 0 ? (
            <span className="font-semibold text-[#40856a]">{listing.offerCount}</span>
          ) : (
            <span className="text-terra-text-muted">—</span>
          )}
        </td>
        <td className="py-3 px-4"><RiskBadge level={listing.riskLevel} /></td>
      </tr>
      {open && (
        <PropertyDrawer
          listing={listing}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setOpen(true)}
        className="rounded-xl border border-terra-border bg-terra-surface/50 hover:border-terra-border-hover hover:shadow-lg hover:shadow-terra-primary/5 transition-all cursor-pointer overflow-hidden group"
      >
        <div className={cn(
          "h-1 w-full",
          listing.riskLevel === "critical" ? "bg-red-500" :
          listing.riskLevel === "high" ? "bg-rose-500" :
          listing.riskLevel === "medium" ? "bg-amber-500" : "bg-emerald-500"
        )} />
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-terra-text group-hover:text-terra-primary transition-colors truncate">{listing.address}</p>
              <p className="text-[10px] text-terra-text-muted flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{listing.city}, {listing.state}
              </p>
            </div>
            <StageBadge stage={listing.status} className="ml-2 flex-shrink-0" />
          </div>

          <p className="text-lg font-display font-bold text-terra-primary">{formatCurrency(listing.price)}</p>
          <p className="text-[10px] text-terra-text-muted">${listing.pricePerSqft}/sqft · {listing.beds}bd / {listing.baths}ba · {listing.sqft.toLocaleString()} sqft</p>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <p className="text-[10px] text-terra-text-muted">DOM</p>
              <p className={cn("text-sm font-bold", listing.dom >= 30 ? "text-rose-400" : listing.dom >= 21 ? "text-amber-400" : "text-terra-text")}>{listing.dom}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-terra-text-muted">Showings</p>
              <p className="text-sm font-bold text-terra-text">{listing.showings}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-terra-text-muted">Offers</p>
              <p className={cn("text-sm font-bold", listing.offerCount > 0 ? "text-emerald-400" : "text-terra-text-muted")}>{listing.offerCount}</p>
            </div>
          </div>

          {listing.riskFlags.length > 0 && (
            <div className="mt-3 space-y-1">
              {listing.riskFlags.slice(0, 1).map((flag, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px] text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded px-2 py-1">
                  <TrendingDown className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{flag}</span>
                </div>
              ))}
              {listing.riskFlags.length > 1 && (
                <p className="text-[10px] text-terra-text-muted">+{listing.riskFlags.length - 1} more flags</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-terra-border">
            <div className="flex items-center gap-1.5">
              <AgentAvatar name={listing.agentName} avatar={listing.agentName.split(" ").map(n => n[0]).join("")} className="w-5 h-5 text-[8px]" />
              <span className="text-[10px] text-terra-text-muted">{listing.agentName}</span>
            </div>
            <RiskBadge level={listing.riskLevel} />
          </div>
        </div>
      </motion.div>
      {open && (
        <PropertyDrawer listing={listing} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

export default function ListingsPage() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"table" | "grid">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("dom");
  const [mlsCount, setMlsCount] = useState<number | null>(null);
  const [mlsDemoMode, setMlsDemoMode] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/terra/mls/listings?limit=1`, { headers: { Accept: "application/json" } })
      .then(r => r.json())
      .then(d => {
        if (d.count != null) setMlsCount(d.count);
        if (d.demoMode != null) setMlsDemoMode(d.demoMode);
      })
      .catch(() => {});
  }, []);

  const filtered = listings
    .filter(l => {
      if (search && !l.address.toLowerCase().includes(search.toLowerCase()) && !l.city.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (riskFilter !== "all" && l.riskLevel !== riskFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortKey === "dom") return b.dom - a.dom;
      if (sortKey === "price") return b.price - a.price;
      if (sortKey === "showings") return b.showings - a.showings;
      if (sortKey === "offerCount") return b.offerCount - a.offerCount;
      if (sortKey === "riskScore") {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.riskLevel] - order[b.riskLevel];
      }
      return 0;
    });

  const summary = {
    total: listings.length,
    active: listings.filter(l => l.status === "active").length,
    pending: listings.filter(l => l.status === "pending").length,
    underContract: listings.filter(l => l.status === "under-contract").length,
    highRisk: listings.filter(l => l.riskLevel === "high" || l.riskLevel === "critical").length,
    avgDOM: Math.round(listings.filter(l => l.status === "active").reduce((s, l) => s + l.dom, 0) / listings.filter(l => l.status === "active").length),
  };

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Listings + Inventory</h1>
            <p className="text-sm text-terra-text-secondary mt-1">Buyer activity, showings, offers, and risk flags across active listings</p>
          </div>
        </div>
      </motion.div>

      {mlsCount !== null && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-4 py-3 rounded-xl border border-terra-primary/30 bg-terra-primary/5 cursor-pointer hover:border-terra-primary/50 transition-colors"
          onClick={() => navigate("/commercial")}
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-terra-primary/15">
              <Radio className="w-4 h-4 text-terra-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-terra-text">
                MLS Live Feed Active
                {mlsDemoMode && <span className="ml-2 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">DEMO</span>}
              </p>
              <p className="text-xs text-terra-text-muted">
                {mlsCount} MLS listings synced via RESO Web API · CoStar & CompStak commercial intel available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-terra-primary">Commercial Intelligence</span>
            <ArrowRight className="w-4 h-4 text-terra-primary" />
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Listings", value: summary.total },
          { label: "Active", value: summary.active, color: "text-terra-primary" },
          { label: "Pending", value: summary.pending, color: "text-amber-400" },
          { label: "Under Contract", value: summary.underContract, color: "text-violet-400" },
          { label: "High Risk", value: summary.highRisk, color: "text-rose-400" },
          { label: "Avg DOM (active)", value: `${summary.avgDOM}d`, color: summary.avgDOM >= 21 ? "text-amber-400" : "text-terra-text" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-terra-border bg-terra-surface/50 p-4">
            <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">{s.label}</p>
            <p className={cn("text-2xl font-display font-bold mt-1", s.color || "text-terra-text")}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terra-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search address or city..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text placeholder:text-terra-text-muted focus:outline-none focus:border-terra-primary"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="under-contract">Under Contract</option>
          <option value="sold">Sold</option>
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
          <option value="all">All Risk Levels</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
          className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none">
          <option value="dom">Sort: Days on Market</option>
          <option value="price">Sort: Price</option>
          <option value="showings">Sort: Showings</option>
          <option value="offerCount">Sort: Offers</option>
          <option value="riskScore">Sort: Risk</option>
        </select>
        <div className="flex rounded-lg border border-terra-border overflow-hidden">
          <button onClick={() => setView("grid")} className={cn("px-3 py-2 text-xs font-medium transition-colors", view === "grid" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted hover:text-terra-text")}>Grid</button>
          <button onClick={() => setView("table")} className={cn("px-3 py-2 text-xs font-medium transition-colors", view === "table" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted hover:text-terra-text")}>Table</button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-terra-text-muted">{filtered.length} listings</p>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-terra-border">
                  {["Address", "Type", "Price", "DOM", "Status", "Agent", "Showings", "Offers", "Risk"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(listing => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
