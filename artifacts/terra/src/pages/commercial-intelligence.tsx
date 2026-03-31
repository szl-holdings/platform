import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, MapPin, Search, TrendingUp, DollarSign, Users, Filter, BarChart3, RefreshCw, ChevronRight, Layers, ArrowRight, Badge } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { DataStateBadge } from "@workspace/shared-ui";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API_BASE = BASE.replace(/\/[^/]+$/, "/api");

async function apiFetch(path: string) {
  const r = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function formatRent(n: number | null) {
  if (n == null) return "—";
  return `$${n.toFixed(2)}/sf`;
}

type PropertyType = "Office" | "Retail" | "Industrial" | "Multifamily" | "Hotel" | "Land" | "Mixed-Use" | "Other";

const PROPERTY_TYPE_COLORS: Record<PropertyType, string> = {
  Office: "text-blue-400",
  Retail: "text-emerald-400",
  Industrial: "text-amber-400",
  Multifamily: "text-violet-400",
  Hotel: "text-rose-400",
  Land: "text-slate-400",
  "Mixed-Use": "text-cyan-400",
  Other: "text-slate-400",
};

const BUILDING_CLASS_COLORS: Record<string, string> = {
  "Class A": "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  "Class B": "text-amber-400 bg-amber-400/10 border-amber-400/30",
  "Class C": "text-rose-400 bg-rose-400/10 border-rose-400/30",
};

interface CommercialProperty {
  id: string;
  source: string;
  propertyName: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string | null;
  propertyType: PropertyType;
  buildingClass: string | null;
  rentableArea: number | null;
  yearBuilt: number | null;
  stories: number | null;
  occupancyRate: number | null;
  marketVacancyRate: number | null;
  askingRentPerSqft: number | null;
  effectiveRentPerSqft: number | null;
  capRate: number | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  tenants: Array<{ tenantName: string; leaseExpiration: string; leasedSqft: number; floorOccupied: string }>;
  submarketName: string | null;
  ownerName: string | null;
  ownerType: string | null;
}

interface CommercialComp {
  id: string;
  source: string;
  compType: "lease" | "sale";
  address: string;
  city: string;
  state: string;
  zipCode: string | null;
  propertyType: string;
  tenantName: string | null;
  tenantIndustry: string | null;
  transactionType: string | null;
  leasedSqft: number | null;
  rentableArea: number | null;
  startingRentPerSqft: number | null;
  effectiveRentPerSqft: number | null;
  salePrice: number | null;
  pricePerSqft: number | null;
  capRate: number | null;
  freeRentMonths: number | null;
  leaseTermMonths: number | null;
  transactionDate: string;
  leaseExpirationDate: string | null;
  floorOccupied: string | null;
  buildingClass: string | null;
  landlordName: string | null;
  buyerName: string | null;
  sellerName: string | null;
  submarketName: string | null;
}

function PropertyCard({ property, onSelect }: { property: CommercialProperty; onSelect: () => void }) {
  const typeColor = PROPERTY_TYPE_COLORS[property.propertyType] ?? "text-slate-400";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className="rounded-xl border border-terra-border bg-terra-surface/50 p-4 hover:border-terra-border-hover hover:shadow-lg hover:shadow-terra-primary/5 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-terra-text group-hover:text-terra-primary transition-colors truncate">
            {property.propertyName ?? property.address}
          </p>
          <p className="text-[10px] text-terra-text-muted flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />{property.city}, {property.state} {property.zipCode ?? ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn("text-[10px] font-bold", typeColor)}>{property.propertyType}</span>
          {property.buildingClass && (
            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", BUILDING_CLASS_COLORS[property.buildingClass] ?? "text-slate-400")}>
              {property.buildingClass}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {property.rentableArea && (
          <div>
            <p className="text-[9px] text-terra-text-muted uppercase tracking-wider">Size</p>
            <p className="text-xs font-semibold text-terra-text">{property.rentableArea.toLocaleString()} sf</p>
          </div>
        )}
        {property.occupancyRate != null && (
          <div>
            <p className="text-[9px] text-terra-text-muted uppercase tracking-wider">Occupancy</p>
            <p className={cn("text-xs font-semibold", property.occupancyRate >= 90 ? "text-emerald-400" : property.occupancyRate >= 75 ? "text-amber-400" : "text-rose-400")}>{property.occupancyRate}%</p>
          </div>
        )}
        {property.askingRentPerSqft != null && (
          <div>
            <p className="text-[9px] text-terra-text-muted uppercase tracking-wider">Asking Rent</p>
            <p className="text-xs font-semibold text-terra-text">{formatRent(property.askingRentPerSqft)}</p>
          </div>
        )}
        {property.capRate != null && (
          <div>
            <p className="text-[9px] text-terra-text-muted uppercase tracking-wider">Cap Rate</p>
            <p className="text-xs font-semibold text-terra-primary">{property.capRate}%</p>
          </div>
        )}
      </div>

      {property.tenants.length > 0 && (
        <div className="mt-3 pt-2 border-t border-terra-border">
          <p className="text-[9px] text-terra-text-muted uppercase tracking-wider mb-1">Key Tenants</p>
          {property.tenants.slice(0, 2).map((t, i) => (
            <p key={i} className="text-[10px] text-terra-text-secondary truncate">{t.tenantName} · exp {t.leaseExpiration.slice(0, 7)}</p>
          ))}
          {property.tenants.length > 2 && (
            <p className="text-[9px] text-terra-text-muted">+{property.tenants.length - 2} more tenants</p>
          )}
        </div>
      )}

      {property.submarketName && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[9px] text-terra-text-muted bg-terra-surface border border-terra-border px-1.5 py-0.5 rounded">{property.submarketName}</span>
          <span className="text-[9px] text-terra-text-muted">{property.source === "demo" ? "Demo" : property.source.toUpperCase()}</span>
        </div>
      )}
    </motion.div>
  );
}

function CompRow({ comp }: { comp: CommercialComp }) {
  return (
    <tr className="border-b border-terra-border/50 hover:bg-terra-surface-hover transition-colors">
      <td className="py-2.5 px-3">
        <p className="text-xs font-semibold text-terra-text">{comp.address}</p>
        <p className="text-[10px] text-terra-text-muted">{comp.city}, {comp.state}</p>
      </td>
      <td className="py-2.5 px-3">
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border",
          comp.compType === "lease"
            ? "text-blue-400 bg-blue-400/10 border-blue-400/30"
            : "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
        )}>
          {comp.compType}
        </span>
      </td>
      <td className="py-2.5 px-3 text-[10px] text-terra-text-secondary">{comp.propertyType}</td>
      <td className="py-2.5 px-3">
        {comp.compType === "lease" ? (
          <div>
            <p className="text-xs font-semibold text-terra-text">{comp.tenantName ?? "—"}</p>
            <p className="text-[9px] text-terra-text-muted">{comp.leasedSqft?.toLocaleString()} sf</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-terra-text">{comp.salePrice ? formatCurrency(comp.salePrice) : "—"}</p>
            <p className="text-[9px] text-terra-text-muted">{comp.pricePerSqft ? `$${comp.pricePerSqft}/sf` : ""}</p>
          </div>
        )}
      </td>
      <td className="py-2.5 px-3 text-[10px] text-terra-text-secondary">
        {comp.compType === "lease"
          ? formatRent(comp.startingRentPerSqft)
          : comp.capRate ? `${comp.capRate}% cap` : "—"
        }
      </td>
      <td className="py-2.5 px-3 text-[10px] text-terra-text-muted">{comp.transactionDate.slice(0, 7)}</td>
      <td className="py-2.5 px-3">
        <span className="text-[9px] text-terra-text-muted bg-terra-surface border border-terra-border px-1.5 py-0.5 rounded">
          {comp.source === "demo" ? "Demo" : comp.source.toUpperCase()}
        </span>
      </td>
    </tr>
  );
}

export default function CommercialIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"properties" | "comps">("properties");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [compTypeFilter, setCompTypeFilter] = useState<"all" | "lease" | "sale">("all");
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState<CommercialProperty[]>([]);
  const [comps, setComps] = useState<CommercialComp[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<CommercialProperty | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [propRes, compsRes] = await Promise.all([
          apiFetch("/terra/commercial/properties?limit=100"),
          apiFetch("/terra/commercial/comps?limit=100"),
        ]);
        setProperties(propRes.properties ?? []);
        setComps(compsRes.comps ?? []);
        setDemoMode(propRes.demoMode !== false);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredProperties = properties.filter(p => {
    if (propertyTypeFilter !== "all" && p.propertyType !== propertyTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.address.toLowerCase().includes(q) ||
        (p.propertyName?.toLowerCase().includes(q) ?? false) ||
        (p.submarketName?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const filteredComps = comps.filter(c => {
    if (compTypeFilter !== "all" && c.compType !== compTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.address.toLowerCase().includes(q) ||
        (c.tenantName?.toLowerCase().includes(q) ?? false) ||
        c.propertyType.toLowerCase().includes(q);
    }
    return true;
  });

  const summary = {
    totalProperties: properties.length,
    officeCount: properties.filter(p => p.propertyType === "Office").length,
    industrialCount: properties.filter(p => p.propertyType === "Industrial").length,
    retailCount: properties.filter(p => p.propertyType === "Retail").length,
    totalComps: comps.length,
    leaseComps: comps.filter(c => c.compType === "lease").length,
    saleComps: comps.filter(c => c.compType === "sale").length,
  };

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-terra-primary" />
              <h1 className="text-2xl font-display font-bold text-terra-text">Commercial Intelligence</h1>
              {demoMode && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  DEMO MODE
                </span>
              )}
            </div>
            <p className="text-sm text-terra-text-secondary">
              CoStar property data, CompStak lease & sale comps — NYC commercial real estate intelligence
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Properties", value: summary.totalProperties, color: "text-terra-primary" },
          { label: "Office", value: summary.officeCount, color: "text-blue-400" },
          { label: "Industrial", value: summary.industrialCount, color: "text-amber-400" },
          { label: "Retail", value: summary.retailCount, color: "text-emerald-400" },
          { label: "Total Comps", value: summary.totalComps, color: "text-terra-text" },
          { label: "Lease Comps", value: summary.leaseComps, color: "text-blue-400" },
          { label: "Sale Comps", value: summary.saleComps, color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-terra-border bg-terra-surface/50 p-3">
            <p className="text-[9px] text-terra-text-muted uppercase tracking-wider">{s.label}</p>
            <p className={cn("text-xl font-display font-bold mt-0.5", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terra-text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === "properties" ? "Search property, address, submarket..." : "Search address, tenant..."}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text placeholder:text-terra-text-muted focus:outline-none focus:border-terra-primary"
          />
        </div>

        <div className="flex rounded-lg border border-terra-border overflow-hidden">
          <button
            onClick={() => setActiveTab("properties")}
            className={cn("px-3 py-2 text-xs font-medium transition-colors", activeTab === "properties" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted hover:text-terra-text")}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab("comps")}
            className={cn("px-3 py-2 text-xs font-medium transition-colors", activeTab === "comps" ? "bg-terra-primary text-white" : "bg-terra-surface text-terra-text-muted hover:text-terra-text")}
          >
            Comps
          </button>
        </div>

        {activeTab === "properties" ? (
          <select
            value={propertyTypeFilter}
            onChange={e => setPropertyTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="Office">Office</option>
            <option value="Retail">Retail</option>
            <option value="Industrial">Industrial</option>
            <option value="Multifamily">Multifamily</option>
            <option value="Mixed-Use">Mixed-Use</option>
          </select>
        ) : (
          <select
            value={compTypeFilter}
            onChange={e => setCompTypeFilter(e.target.value as "all" | "lease" | "sale")}
            className="px-3 py-2 rounded-lg border border-terra-border bg-terra-surface text-sm text-terra-text focus:outline-none"
          >
            <option value="all">All Comps</option>
            <option value="lease">Lease Comps</option>
            <option value="sale">Sale Comps</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-terra-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "properties" ? (
        <div>
          <p className="text-xs text-terra-text-muted mb-4">{filteredProperties.length} commercial properties</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProperties.map(p => (
              <PropertyCard key={p.id} property={p} onSelect={() => setSelectedProperty(p)} />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-terra-text-muted mb-4">{filteredComps.length} transaction comps</p>
          <div className="rounded-xl border border-terra-border bg-terra-surface/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-terra-border">
                    {["Address", "Type", "Property", "Transaction", "Rate / Cap", "Date", "Source"].map(h => (
                      <th key={h} className="text-left py-2.5 px-3 text-[9px] font-semibold text-terra-text-muted uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredComps.map(c => (
                    <CompRow key={c.id} comp={c} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedProperty(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 bg-terra-bg-secondary border border-terra-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-terra-text">{selectedProperty.propertyName ?? selectedProperty.address}</h2>
                  <p className="text-sm text-terra-text-muted">{selectedProperty.address} · {selectedProperty.city}</p>
                </div>
                <button onClick={() => setSelectedProperty(null)} className="p-1 hover:bg-terra-surface rounded transition-colors">
                  <span className="text-terra-text-muted text-xs">✕</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Property Type", value: selectedProperty.propertyType },
                  { label: "Building Class", value: selectedProperty.buildingClass ?? "—" },
                  { label: "Size", value: selectedProperty.rentableArea ? `${selectedProperty.rentableArea.toLocaleString()} sf` : "—" },
                  { label: "Year Built", value: selectedProperty.yearBuilt ?? "—" },
                  { label: "Floors", value: selectedProperty.stories ?? "—" },
                  { label: "Occupancy", value: selectedProperty.occupancyRate != null ? `${selectedProperty.occupancyRate}%` : "—" },
                  { label: "Asking Rent", value: formatRent(selectedProperty.askingRentPerSqft) },
                  { label: "Cap Rate", value: selectedProperty.capRate ? `${selectedProperty.capRate}%` : "—" },
                  { label: "Last Sale", value: selectedProperty.lastSalePrice ? formatCurrency(selectedProperty.lastSalePrice) : "—" },
                  { label: "Sale Date", value: selectedProperty.lastSaleDate ?? "—" },
                ].map(item => (
                  <div key={item.label} className="bg-terra-surface border border-terra-border rounded-lg p-3">
                    <p className="text-[9px] text-terra-text-muted uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-terra-text mt-0.5">{String(item.value)}</p>
                  </div>
                ))}
              </div>

              {selectedProperty.tenants.length > 0 && (
                <div className="bg-terra-surface border border-terra-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-terra-primary" />
                    <span className="text-sm font-semibold text-terra-text">Tenant Roster</span>
                  </div>
                  <div className="space-y-2">
                    {selectedProperty.tenants.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-terra-text font-medium">{t.tenantName}</span>
                        <div className="flex items-center gap-3 text-terra-text-muted">
                          <span>{t.leasedSqft.toLocaleString()} sf</span>
                          <span>Fl {t.floorOccupied}</span>
                          <span>Exp {t.leaseExpiration.slice(0, 7)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[10px] text-terra-text-muted border-t border-terra-border pt-3">
                <span>Submarket: {selectedProperty.submarketName ?? "—"}</span>
                <span>Source: {selectedProperty.source === "demo" ? "Demo Data" : selectedProperty.source.toUpperCase()}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
