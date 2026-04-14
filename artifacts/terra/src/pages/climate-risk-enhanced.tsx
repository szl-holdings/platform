import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer, Droplets, Flame, Wind, Cloud, ShieldAlert, DollarSign,
  TrendingUp, AlertTriangle, X, ChevronRight, Building2, BarChart3,
  Calendar, MapPin, Info, Eye, RefreshCw, Activity
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

type RiskLevel = "Critical" | "High" | "Medium" | "Low" | "Negligible";
type HazardType = "flood" | "wildfire" | "heat" | "storm" | "sea-level" | "seismic";

interface HazardRisk {
  type: HazardType;
  current: RiskLevel;
  projected2030: RiskLevel;
  projected2050: RiskLevel;
  trend: "increasing" | "stable" | "decreasing";
  detail: string;
}

interface ClimateProperty {
  id: string;
  name: string;
  address: string;
  location: string;
  type: string;
  value: number;
  overallRiskScore: number;
  overallGrade: string;
  annualInsurance: number;
  insuranceAdjustment: number;
  valuationHaircut: number;
  hazards: HazardRisk[];
  regulatoryFlags: string[];
  adaptationCost: number;
  thirtyYearExpectedLoss: number;
}

const RISK_COLORS: Record<RiskLevel, { text: string; bg: string; border: string; dot: string }> = {
  Critical: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", dot: "#ef4444" },
  High: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "#f97316" },
  Medium: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", dot: "#f59e0b" },
  Low: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", dot: "#38bdf8" },
  Negligible: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "#34d399" },
};

const HAZARD_META: Record<HazardType, { label: string; icon: typeof Droplets }> = {
  flood: { label: "Flood", icon: Droplets },
  wildfire: { label: "Wildfire", icon: Flame },
  heat: { label: "Extreme Heat", icon: Thermometer },
  storm: { label: "Severe Storm", icon: Cloud },
  "sea-level": { label: "Sea Level Rise", icon: Wind },
  seismic: { label: "Seismic", icon: Activity },
};

const PROPERTIES: ClimateProperty[] = [
  {
    id: "cp-1", name: "One Market Plaza", address: "1 Market Plaza", location: "San Francisco, CA",
    type: "Commercial", value: 48_000_000, overallRiskScore: 62, overallGrade: "B",
    annualInsurance: 2_100_000, insuranceAdjustment: 34, valuationHaircut: 8,
    adaptationCost: 4_200_000, thirtyYearExpectedLoss: 6_100_000,
    regulatoryFlags: ["SB 54 — Climate Disclosure (CA)", "SEC Climate Risk Rule (Final)"],
    hazards: [
      { type: "seismic", current: "High", projected2030: "High", projected2050: "High", trend: "stable", detail: "Located 0.8mi from Hayward Fault. Site class D soils. Estimated PML: 18%." },
      { type: "flood", current: "Low", projected2030: "Low", projected2050: "Medium", trend: "increasing", detail: "Outside current SFHA. 2050 sea level rise projections push to marginal risk zone." },
      { type: "heat", current: "Low", projected2030: "Low", projected2050: "Low", trend: "stable", detail: "Bay microclimate modulates heat exposure. Minimal risk through 2050." },
      { type: "wildfire", current: "Medium", projected2030: "Medium", projected2050: "High", trend: "increasing", detail: "Wildland-urban interface risk via East Bay hills. Smoke exposure increasing." },
      { type: "storm", current: "Low", projected2030: "Medium", projected2050: "Medium", trend: "increasing", detail: "Atmospheric river intensification projected. 100-year storm frequency compressing." },
    ],
  },
  {
    id: "cp-2", name: "South Beach Retail", address: "100 Ocean Dr", location: "Miami, FL",
    type: "Retail", value: 12_000_000, overallRiskScore: 89, overallGrade: "D",
    annualInsurance: 1_400_000, insuranceAdjustment: 87, valuationHaircut: 22,
    adaptationCost: 3_800_000, thirtyYearExpectedLoss: 8_900_000,
    regulatoryFlags: ["HB 1557 — Mandatory Flood Disclosure (FL)", "FEMA SFHA Zone AE", "Miami-Dade Sea Level Rise Ordinance"],
    hazards: [
      { type: "flood", current: "Critical", projected2030: "Critical", projected2050: "Critical", trend: "increasing", detail: "FEMA Zone AE. Street-level flooding now occurring during king tides. Annual flood probability >40% by 2035." },
      { type: "sea-level", current: "High", projected2030: "Critical", projected2050: "Critical", trend: "increasing", detail: "2.1ft SLR projected by 2060. Property currently 3.4ft above mean sea level." },
      { type: "storm", current: "High", projected2030: "High", projected2050: "Critical", trend: "increasing", detail: "Direct hurricane path exposure. Category 4+ wind zone. Insurance withdrawals accelerating." },
      { type: "heat", current: "High", projected2030: "High", projected2050: "Critical", trend: "increasing", detail: "28+ days >95°F by 2040. Outdoor retail occupancy increasingly constrained." },
      { type: "wildfire", current: "Negligible", projected2030: "Negligible", projected2050: "Negligible", trend: "stable", detail: "No significant wildfire exposure." },
      { type: "seismic", current: "Negligible", projected2030: "Negligible", projected2050: "Negligible", trend: "stable", detail: "No significant seismic exposure." },
    ],
  },
  {
    id: "cp-3", name: "Austin Mixed-Use Tower", address: "400 Congress Ave", location: "Austin, TX",
    type: "Mixed-Use", value: 31_000_000, overallRiskScore: 76, overallGrade: "C+",
    annualInsurance: 1_200_000, insuranceAdjustment: 52, valuationHaircut: 12,
    adaptationCost: 2_100_000, thirtyYearExpectedLoss: 5_200_000,
    regulatoryFlags: ["SEC Climate Risk Rule (Final)", "Texas Grid Resilience Requirements"],
    hazards: [
      { type: "heat", current: "Critical", projected2030: "Critical", projected2050: "Critical", trend: "increasing", detail: "47+ days >100°F projected by 2045. Grid stress risk during peak demand. HVAC costs +68% by 2040." },
      { type: "flood", current: "Medium", projected2030: "High", projected2050: "High", trend: "increasing", detail: "Shoal Creek 100-yr floodplain adjacent. 2021 freeze event highlighted infrastructure fragility." },
      { type: "storm", current: "Medium", projected2030: "High", projected2050: "High", trend: "increasing", detail: "Severe convective storm frequency increasing. Hail, tornado risk elevated." },
      { type: "wildfire", current: "Medium", projected2030: "High", projected2050: "High", trend: "increasing", detail: "Central Texas wildland-urban interface expanding rapidly." },
      { type: "sea-level", current: "Negligible", projected2030: "Negligible", projected2050: "Negligible", trend: "stable", detail: "Inland location. No sea level exposure." },
      { type: "seismic", current: "Low", projected2030: "Low", projected2050: "Low", trend: "stable", detail: "Low natural seismic risk. Induced seismicity from wastewater injection negligible at this location." },
    ],
  },
  {
    id: "cp-4", name: "Silicon Valley Industrial", address: "880 N McCarthy Blvd", location: "San Jose, CA",
    type: "Industrial", value: 22_000_000, overallRiskScore: 71, overallGrade: "B-",
    annualInsurance: 1_800_000, insuranceAdjustment: 41, valuationHaircut: 9,
    adaptationCost: 1_600_000, thirtyYearExpectedLoss: 4_100_000,
    regulatoryFlags: ["SB 54 — Climate Disclosure (CA)", "Santa Clara Valley Water District Flood Rules"],
    hazards: [
      { type: "seismic", current: "High", projected2030: "High", projected2050: "High", trend: "stable", detail: "0.3mi from Calaveras Fault. Soil liquefaction zone class C. PML: 22%." },
      { type: "wildfire", current: "Medium", projected2030: "High", projected2050: "High", trend: "increasing", detail: "Diablo Range wildfire exposure increasing. 2020 fires directly impacted air quality significantly." },
      { type: "flood", current: "Low", projected2030: "Medium", projected2050: "Medium", trend: "increasing", detail: "Guadalupe River 500-year flood zone. Climate amplification could increase frequency." },
      { type: "heat", current: "Medium", projected2030: "Medium", projected2050: "High", trend: "increasing", detail: "Inland heat amplification. Data center cooling costs projected up 44%." },
      { type: "storm", current: "Low", projected2030: "Low", projected2050: "Medium", trend: "increasing", detail: "Atmospheric river events increasing in intensity and frequency." },
      { type: "sea-level", current: "Negligible", projected2030: "Low", projected2050: "Low", trend: "increasing", detail: "South Bay exposure marginal through 2050." },
    ],
  },
  {
    id: "cp-5", name: "Pacific Heights Apts", address: "2850 Broadway", location: "San Francisco, CA",
    type: "Residential", value: 14_000_000, overallRiskScore: 58, overallGrade: "B+",
    annualInsurance: 890_000, insuranceAdjustment: 28, valuationHaircut: 6,
    adaptationCost: 980_000, thirtyYearExpectedLoss: 2_800_000,
    regulatoryFlags: ["SB 54 — Climate Disclosure (CA)", "SF Mandatory Seismic Retrofit Ordinance"],
    hazards: [
      { type: "seismic", current: "High", projected2030: "High", projected2050: "High", trend: "stable", detail: "Pre-1978 wood-frame construction. Mandatory retrofit complete. Residual risk moderate." },
      { type: "wildfire", current: "Medium", projected2030: "Medium", projected2050: "High", trend: "increasing", detail: "Smoke exposure risk increasing. Structure itself in low fire hazard zone." },
      { type: "flood", current: "Low", projected2030: "Low", projected2050: "Low", trend: "stable", detail: "Elevated hilltop site. Minimal flood exposure through 2060." },
      { type: "heat", current: "Low", projected2030: "Low", projected2050: "Low", trend: "stable", detail: "Bay fog belt location moderates heat. AC penetration <30% building stock." },
      { type: "storm", current: "Low", projected2030: "Medium", projected2050: "Medium", trend: "increasing", detail: "Atmospheric river exposure. Ridge site has wind exposure." },
      { type: "sea-level", current: "Negligible", projected2030: "Negligible", projected2050: "Negligible", trend: "stable", detail: "Hillside site. No direct sea level exposure." },
    ],
  },
];

const GRADE_COLOR: Record<string, string> = {
  "D": "text-red-400", "C": "text-orange-400", "C+": "text-orange-400",
  "B-": "text-amber-400", "B": "text-sky-400", "B+": "text-emerald-400", "A-": "text-emerald-400", "A": "text-emerald-400",
};

function formatCurrency(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

function RiskBadge({ level, small }: { level: RiskLevel; small?: boolean }) {
  const c = RISK_COLORS[level];
  return (
    <span className={cn("px-1.5 py-0.5 rounded border text-[9px] font-semibold", c.bg, c.border, c.text, small ? "py-0" : "")}>
      {level}
    </span>
  );
}

function TimelineArrow({ current, y2030, y2050 }: { current: RiskLevel; y2030: RiskLevel; y2050: RiskLevel }) {
  const levels: RiskLevel[] = ["Negligible", "Low", "Medium", "High", "Critical"];
  const toNum = (l: RiskLevel) => levels.indexOf(l);
  const trend = toNum(y2050) > toNum(current) ? "▲" : toNum(y2050) < toNum(current) ? "▼" : "—";
  const trendColor = toNum(y2050) > toNum(current) ? "text-red-400" : toNum(y2050) < toNum(current) ? "text-emerald-400" : "text-white/30";
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <RiskBadge level={current} small />
      <span className="text-white/20">→30</span>
      <RiskBadge level={y2030} small />
      <span className="text-white/20">→50</span>
      <RiskBadge level={y2050} small />
      <span className={cn("font-bold", trendColor)}>{trend}</span>
    </div>
  );
}

function PropertyCard({ property, selected, onClick }: { property: ClimateProperty; selected: boolean; onClick: () => void }) {
  const riskColor = property.overallRiskScore >= 80 ? "text-red-400" : property.overallRiskScore >= 65 ? "text-orange-400" : property.overallRiskScore >= 50 ? "text-amber-400" : "text-sky-400";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border cursor-pointer transition-all",
        selected ? "bg-white/4 border-white/15" : "bg-[#0f1115] border-white/5 hover:border-white/10"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/4 border border-white/6 flex flex-col items-center justify-center flex-shrink-0">
          <span className={cn("text-lg font-black", GRADE_COLOR[property.overallGrade] ?? "text-white")}>{property.overallGrade}</span>
          <span className="text-[8px] text-white/20">grade</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white">{property.name}</p>
              <p className="text-xs text-white/40 mt-0.5">{property.location}</p>
            </div>
            <span className={cn("text-sm font-bold", riskColor)}>{property.overallRiskScore}</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-white/30">Insurance: <span className="text-amber-400">{formatCurrency(property.annualInsurance)}/yr (+{property.insuranceAdjustment}%)</span></span>
            <span className="text-[10px] text-white/30">Haircut: <span className="text-red-400">−{property.valuationHaircut}%</span></span>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {property.hazards.filter(h => ["Critical", "High"].includes(h.current)).map(h => {
              const meta = HAZARD_META[h.type];
              const Icon = meta.icon;
              return (
                <div key={h.type} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/8 border border-red-500/15 text-red-400 text-[9px]">
                  <Icon className="w-2.5 h-2.5" />{meta.label}
                </div>
              );
            })}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/20 flex-shrink-0" />
      </div>
    </motion.div>
  );
}

function DetailPanel({ property, onClose }: { property: ClimateProperty; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      className="flex flex-col bg-[#0a0c10] border-l border-white/6 overflow-hidden"
      style={{ width: 440, flexShrink: 0 }}
    >
      <div className="p-5 border-b border-white/6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">{property.name}</h3>
            <p className="text-xs text-white/40">{property.address} · {property.location}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/5 text-white/30 hover:text-white/60">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Risk Score", value: property.overallRiskScore.toString(), color: property.overallRiskScore >= 80 ? "text-red-400" : property.overallRiskScore >= 65 ? "text-orange-400" : "text-amber-400" },
            { label: "Climate Grade", value: property.overallGrade, color: GRADE_COLOR[property.overallGrade] ?? "text-white" },
            { label: "Value Haircut", value: `−${property.valuationHaircut}%`, color: "text-red-400" },
            { label: "30yr Exp. Loss", value: formatCurrency(property.thirtyYearExpectedLoss), color: "text-orange-400" },
          ].map(m => (
            <div key={m.label} className="bg-white/3 border border-white/5 rounded-lg p-2">
              <p className="text-[8px] text-white/30">{m.label}</p>
              <p className={cn("text-sm font-bold mt-0.5", m.color)}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 border-b border-white/6">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">30-Year Hazard Timeline</p>
        <div className="space-y-3">
          {property.hazards.map(h => {
            const meta = HAZARD_META[h.type];
            const Icon = meta.icon;
            return (
              <div key={h.type} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                  <span className="text-xs text-white/60 font-medium">{meta.label}</span>
                </div>
                <TimelineArrow current={h.current} y2030={h.projected2030} y2050={h.projected2050} />
                <p className="text-[10px] text-white/30 pl-5">{h.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-5 border-b border-white/6">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Insurance & Financial Impact</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Annual Insurance", value: `${formatCurrency(property.annualInsurance)}/yr` },
            { label: "Premium vs Market", value: `+${property.insuranceAdjustment}%` },
            { label: "Adaptation Capex", value: formatCurrency(property.adaptationCost) },
            { label: "30yr Expected Loss", value: formatCurrency(property.thirtyYearExpectedLoss) },
          ].map(m => (
            <div key={m.label} className="bg-white/3 border border-white/5 rounded-lg p-2.5">
              <p className="text-[9px] text-white/30">{m.label}</p>
              <p className="text-sm font-bold text-white/80 mt-0.5">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-3">Regulatory Watch</p>
        <div className="space-y-2">
          {property.regulatoryFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/80">{flag}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function ClimateRiskEnhanced() {
  const [selected, setSelected] = useState<ClimateProperty | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const filtered = PROPERTIES
    .filter(p => gradeFilter === "all" || p.overallGrade.startsWith(gradeFilter))
    .sort((a, b) => b.overallRiskScore - a.overallRiskScore);

  const portfolio = {
    critical: PROPERTIES.filter(p => p.overallRiskScore >= 80).length,
    high: PROPERTIES.filter(p => p.overallRiskScore >= 65 && p.overallRiskScore < 80).length,
    totalInsurance: PROPERTIES.reduce((s, p) => s + p.annualInsurance, 0),
    totalExpectedLoss: PROPERTIES.reduce((s, p) => s + p.thirtyYearExpectedLoss, 0),
    totalAdaptationCost: PROPERTIES.reduce((s, p) => s + p.adaptationCost, 0),
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 p-6 border-b border-white/6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-orange-400" />
                Climate Risk Overlay
              </h1>
              <p className="text-xs text-white/40 mt-1">30-year physical climate risk assessment — flood, fire, heat, storm, sea-level per property with insurance and valuation impact</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 mt-4">
            {[
              { label: "Critical Risk Assets", value: portfolio.critical.toString(), color: "text-red-400" },
              { label: "High Risk Assets", value: portfolio.high.toString(), color: "text-orange-400" },
              { label: "Total Insurance Cost", value: formatCurrency(portfolio.totalInsurance), color: "text-amber-400", sub: "annual" },
              { label: "30yr Expected Loss", value: formatCurrency(portfolio.totalExpectedLoss), color: "text-red-400", sub: "portfolio" },
              { label: "Adaptation Capex Needed", value: formatCurrency(portfolio.totalAdaptationCost), color: "text-sky-400", sub: "total" },
            ].map(m => (
              <div key={m.label} className="bg-white/2 border border-white/5 rounded-xl p-3">
                <p className="text-[9px] text-white/30 uppercase tracking-wider">{m.label}</p>
                <p className={cn("text-lg font-bold mt-1", m.color)}>{m.value}</p>
                {m.sub && <p className="text-[9px] text-white/20 mt-0.5">{m.sub}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-3 border-b border-white/6 flex items-center gap-2">
          {["all", "A", "B", "C", "D"].map(g => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs border transition-colors",
                gradeFilter === g ? "bg-white/8 text-white border-white/20" : "text-white/30 border-white/8 hover:border-white/15"
              )}
            >
              {g === "all" ? "All Grades" : `Grade ${g}`}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3 text-[10px] text-white/30">
            <span className="flex items-center gap-1"><span className="text-emerald-400">Negligible / Low</span></span>
            <span className="flex items-center gap-1"><span className="text-amber-400">Medium</span></span>
            <span className="flex items-center gap-1"><span className="text-red-400">High / Critical</span></span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {filtered.map(p => (
            <PropertyCard key={p.id} property={p} selected={selected?.id === p.id} onClick={() => setSelected(p)} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <DetailPanel key={selected.id} property={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
