import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale, AlertTriangle, CheckCircle, DollarSign, TrendingDown, Building2,
  FileText, Download, Search, ChevronRight, Target, BarChart3, X
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { cn } from "@szl-holdings/shared-ui/utils";

interface TooltipPayloadEntry { name: string; value: number; color?: string; fill?: string; }
interface ChartTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; }

const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.05)",
  accent: { gold: "#b8943c", blue: "#3a7ad4", green: "#40856a", red: "#c0503a" },
  text: { primary: "rgba(255,255,255,0.85)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.3)", muted: "rgba(255,255,255,0.18)" },
};

const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toLocaleString()}`;

interface Comp {
  address: string;
  saleDate: string;
  salePrice: number;
  sqft: number;
  pricePerSqft: number;
  distance: string;
}

interface AppealProperty {
  id: string;
  name: string;
  address: string;
  propertyType: string;
  sqft: number;
  assessedValue: number;
  avmValue: number;
  taxRate: number;
  overAssessedPct: number;
  annualTax: number;
  potentialSavings: number;
  appealDeadline: string;
  appealStatus: "eligible" | "filed" | "hearing" | "won" | "lost" | "not-eligible";
  juris: string;
  comparables: Comp[];
  appealStrength: "strong" | "moderate" | "weak";
  notes: string;
}

const PROPERTIES: AppealProperty[] = [
  {
    id: "ta-001",
    name: "Meridian Commerce Tower",
    address: "1200 Gateway Blvd, Dallas, TX 75201",
    propertyType: "Class A Office",
    sqft: 86000,
    assessedValue: 28_400_000,
    avmValue: 21_800_000,
    taxRate: 2.38,
    overAssessedPct: 30.3,
    annualTax: 675_920,
    potentialSavings: 157_080,
    appealDeadline: "2026-05-01",
    appealStatus: "eligible",
    juris: "Dallas County Appraisal District",
    appealStrength: "strong",
    notes: "Assessor used income capitalization at 5.5% cap — market cap rate is 7.0%+. Strong comparable evidence. Recommend immediate filing.",
    comparables: [
      { address: "900 Commerce St, Dallas", saleDate: "2025-11-15", salePrice: 20_200_000, sqft: 82000, pricePerSqft: 246, distance: "0.4 mi" },
      { address: "1400 Preston Rd, Dallas", saleDate: "2025-08-22", salePrice: 18_900_000, sqft: 78500, pricePerSqft: 241, distance: "0.8 mi" },
      { address: "750 N St Paul, Dallas", saleDate: "2025-06-10", salePrice: 22_400_000, sqft: 91000, pricePerSqft: 246, distance: "1.1 mi" },
      { address: "1801 N Lamar, Dallas", saleDate: "2025-04-05", salePrice: 16_800_000, sqft: 72000, pricePerSqft: 233, distance: "1.4 mi" },
    ],
  },
  {
    id: "ta-002",
    name: "South Beach Retail Strip",
    address: "100 Ocean Dr, Miami, FL 33139",
    propertyType: "Retail",
    sqft: 14200,
    assessedValue: 11_800_000,
    avmValue: 9_900_000,
    taxRate: 1.62,
    overAssessedPct: 19.2,
    annualTax: 191_160,
    potentialSavings: 30_780,
    appealDeadline: "2026-06-15",
    appealStatus: "filed",
    juris: "Miami-Dade County Property Appraiser",
    appealStrength: "moderate",
    notes: "Petition filed 3/15/26. Hearing scheduled Q2 2026. Vacancy rates elevated — income approach supports lower value.",
    comparables: [
      { address: "200 Collins Ave, Miami Beach", saleDate: "2025-10-01", salePrice: 8_800_000, sqft: 13200, pricePerSqft: 667, distance: "0.2 mi" },
      { address: "400 Lincoln Rd, Miami Beach", saleDate: "2025-07-18", salePrice: 11_200_000, sqft: 16800, pricePerSqft: 667, distance: "0.5 mi" },
      { address: "1120 Washington Ave, Miami Beach", saleDate: "2025-05-20", salePrice: 7_400_000, sqft: 11500, pricePerSqft: 643, distance: "0.8 mi" },
    ],
  },
  {
    id: "ta-003",
    name: "Pacific Heights Apartments",
    address: "2850 Broadway, San Francisco, CA 94115",
    propertyType: "Residential Multifamily",
    sqft: 18400,
    assessedValue: 15_200_000,
    avmValue: 16_100_000,
    taxRate: 1.18,
    overAssessedPct: -5.6,
    annualTax: 179_360,
    potentialSavings: 0,
    appealDeadline: "2026-09-15",
    appealStatus: "not-eligible",
    juris: "San Francisco Office of the Assessor-Recorder",
    appealStrength: "weak",
    notes: "AVM suggests property is slightly under-assessed. No appeal warranted. Prop 13 basis lock provides protection — no action needed.",
    comparables: [
      { address: "2600 Pacific Ave, San Francisco", saleDate: "2025-09-14", salePrice: 14_800_000, sqft: 17200, pricePerSqft: 860, distance: "0.3 mi" },
    ],
  },
  {
    id: "ta-004",
    name: "Austin Mixed-Use Tower",
    address: "400 Congress Ave, Austin, TX 78701",
    propertyType: "Mixed-Use",
    sqft: 62000,
    assessedValue: 34_600_000,
    avmValue: 27_200_000,
    taxRate: 2.12,
    overAssessedPct: 27.2,
    annualTax: 733_520,
    potentialSavings: 156_928,
    appealDeadline: "2026-05-31",
    appealStatus: "eligible",
    juris: "Travis County Appraisal District",
    appealStrength: "strong",
    notes: "Office vacancy rate at 25% negatively impacts income. Assessor appears to use pre-COVID income projections. Strong case.",
    comparables: [
      { address: "200 W 6th St, Austin", saleDate: "2025-12-01", salePrice: 25_600_000, sqft: 58000, pricePerSqft: 441, distance: "0.3 mi" },
      { address: "700 Lavaca St, Austin", saleDate: "2025-09-30", salePrice: 29_100_000, sqft: 66000, pricePerSqft: 441, distance: "0.5 mi" },
      { address: "301 Congress Ave, Austin", saleDate: "2025-07-22", salePrice: 22_400_000, sqft: 52000, pricePerSqft: 431, distance: "0.6 mi" },
    ],
  },
];

const STATUS_CONFIG = {
  eligible: { color: DS.accent.gold, label: "Appeal Eligible" },
  filed: { color: DS.accent.blue, label: "Filed" },
  hearing: { color: DS.accent.blue, label: "Hearing Scheduled" },
  won: { color: DS.accent.green, label: "Won" },
  lost: { color: DS.accent.red, label: "Lost" },
  "not-eligible": { color: DS.text.muted, label: "Not Eligible" },
};

const STRENGTH_CONFIG = {
  strong: { color: DS.accent.green, label: "Strong Case" },
  moderate: { color: DS.accent.gold, label: "Moderate" },
  weak: { color: DS.accent.red, label: "Weak" },
};

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-2 text-xs shadow-xl" style={{ background: "rgba(10,12,16,0.97)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="font-semibold text-white/80 mb-1">{label}</p>
      {payload.map((p) => <div key={p.name} className="flex gap-2"><span style={{ color: p.color ?? p.fill }}>{p.name}:</span><span className="text-white/70">{fmt(p.value)}</span></div>)}
    </div>
  );
};

export default function TaxAppealPage() {
  const [selectedId, setSelectedId] = useState<string | null>(PROPERTIES[0].id);
  const [filter, setFilter] = useState<"all" | "eligible" | "filed">("all");
  const [showPacket, setShowPacket] = useState(false);

  const filtered = PROPERTIES.filter(p => filter === "all" || p.appealStatus === filter || (filter === "eligible" && p.appealStatus === "eligible"));

  const selected = PROPERTIES.find(p => p.id === selectedId);
  const totalSavings = PROPERTIES.filter(p => ["eligible", "filed"].includes(p.appealStatus)).reduce((s, p) => s + p.potentialSavings, 0);
  const eligible = PROPERTIES.filter(p => p.appealStatus === "eligible").length;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <div className="flex items-center gap-2.5 mb-0.5">
          <h1 className="text-base font-bold text-white tracking-tight font-display">Tax Appeal Automation</h1>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold" style={{ color: DS.accent.red, background: `${DS.accent.red}10`, border: `1px solid ${DS.accent.red}20` }}>Property Tax</span>
        </div>
        <p className="text-[10px] font-mono" style={{ color: DS.text.muted }}>Assessed value vs. AVM comparison · over-assessment flagging · comp evidence builder · appeal packet generator</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Properties Analyzed", value: PROPERTIES.length.toString(), color: DS.accent.gold },
          { label: "Appeal Eligible", value: eligible.toString(), color: DS.accent.gold },
          { label: "Potential Annual Savings", value: fmt(totalSavings), color: DS.accent.green },
          { label: "Avg Over-Assessment", value: `${(PROPERTIES.filter(p => p.overAssessedPct > 0).reduce((s, p) => s + p.overAssessedPct, 0) / PROPERTIES.filter(p => p.overAssessedPct > 0).length).toFixed(1)}%`, color: DS.accent.red },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-3" style={{ borderColor: DS.border, background: DS.surface }}>
            <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>{m.label}</p>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {(["all", "eligible", "filed"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: filter === f ? DS.accent.gold : DS.surface, color: filter === f ? "#000" : DS.text.secondary, border: `1px solid ${filter === f ? DS.accent.gold : DS.border}` }}>
            {f === "all" ? "All Properties" : f === "eligible" ? "Appeal Eligible" : "Filed"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map(p => {
            const statusCfg = STATUS_CONFIG[p.appealStatus];
            const strengthCfg = STRENGTH_CONFIG[p.appealStrength];
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedId(p.id)}
                className="rounded-xl border p-4 cursor-pointer transition-all"
                style={{ borderColor: selectedId === p.id ? DS.accent.gold : DS.border, background: selectedId === p.id ? "rgba(184,148,60,0.04)" : DS.surface }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: DS.text.primary }}>{p.name}</p>
                    <p className="text-[9px] mt-0.5 truncate" style={{ color: DS.text.tertiary }}>{p.juris}</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ color: statusCfg.color, background: `${statusCfg.color}12` }}>{statusCfg.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>Assessed</p>
                    <p className="text-[10px] font-bold font-mono" style={{ color: DS.text.secondary }}>{fmt(p.assessedValue)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>AVM Est.</p>
                    <p className="text-[10px] font-bold font-mono" style={{ color: DS.accent.blue }}>{fmt(p.avmValue)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>Over-Assess.</p>
                    <p className="text-[10px] font-bold font-mono" style={{ color: p.overAssessedPct > 10 ? DS.accent.red : p.overAssessedPct > 0 ? DS.accent.gold : DS.accent.green }}>
                      {p.overAssessedPct > 0 ? "+" : ""}{p.overAssessedPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {p.potentialSavings > 0 && (
                  <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: `1px solid ${DS.border}` }}>
                    <span className="text-[9px]" style={{ color: DS.text.muted }}>Potential savings</span>
                    <span className="text-[10px] font-bold font-mono" style={{ color: DS.accent.green }}>{fmt(p.potentialSavings)}/yr</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <>
              <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: DS.text.primary }}>{selected.name}</h3>
                    <p className="text-[10px] mt-0.5" style={{ color: DS.text.tertiary }}>{selected.address} · {selected.juris}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold px-2 py-1 rounded" style={{ color: STRENGTH_CONFIG[selected.appealStrength].color, background: `${STRENGTH_CONFIG[selected.appealStrength].color}12` }}>
                      {STRENGTH_CONFIG[selected.appealStrength].label}
                    </span>
                    {["eligible", "filed"].includes(selected.appealStatus) && (
                      <button onClick={() => setShowPacket(true)}
                        className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-lg font-semibold"
                        style={{ background: "rgba(64,133,106,0.1)", border: "1px solid rgba(64,133,106,0.2)", color: DS.accent.green }}>
                        <FileText className="w-3 h-3" />
                        Appeal Packet
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: "Assessed Value", value: selected.assessedValue, fill: DS.accent.red },
                      { name: "AVM Estimate", value: selected.avmValue, fill: DS.accent.blue },
                      { name: "Comp Avg", value: selected.comparables.reduce((s, c) => s + c.salePrice, 0) / selected.comparables.length, fill: DS.accent.green },
                    ]} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
                      <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} width={42} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
                        {[DS.accent.red, DS.accent.blue, DS.accent.green].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${DS.border}` }}>
                  <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>Appeal Notes</p>
                  <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>{selected.notes}</p>
                </div>
              </div>

              <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
                <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: DS.border }}>
                  <BarChart3 className="w-3.5 h-3.5" style={{ color: DS.accent.blue }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${DS.accent.blue}99` }}>Comparable Sales Evidence</span>
                </div>
                <div className="divide-y" style={{ borderColor: DS.border }}>
                  {selected.comparables.map((comp, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2 px-4 py-2.5 items-center">
                      <div className="col-span-2">
                        <p className="text-[10px] font-medium" style={{ color: DS.text.secondary }}>{comp.address}</p>
                        <p className="text-[9px]" style={{ color: DS.text.muted }}>{comp.distance} · {new Date(comp.saleDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                      </div>
                      <div className="text-[10px] font-mono" style={{ color: DS.text.secondary }}>{fmt(comp.salePrice)}</div>
                      <div className="text-[10px] font-mono" style={{ color: DS.text.muted }}>{comp.sqft.toLocaleString()} SF</div>
                      <div className="text-[10px] font-bold font-mono" style={{ color: DS.accent.blue }}>${comp.pricePerSqft}/SF</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border p-12 text-center" style={{ borderColor: DS.border, background: DS.surface }}>
              <Scale className="w-8 h-8 mx-auto mb-3" style={{ color: DS.text.muted }} />
              <p style={{ color: DS.text.tertiary }}>Select a property to view appeal analysis</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPacket && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="w-full max-w-lg rounded-2xl border shadow-2xl p-6" style={{ background: "#0a0c10", borderColor: "rgba(255,255,255,0.1)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Appeal Packet — {selected.name}</h3>
                <button onClick={() => setShowPacket(false)}><X className="w-5 h-5" style={{ color: DS.text.muted }} /></button>
              </div>
              <div className="space-y-2 mb-5">
                {[
                  "Cover Letter — Property Tax Appeal (PDF)",
                  `Assessed vs. Market Value Analysis — ${selected.name}`,
                  `${selected.comparables.length} Comparable Sales Report`,
                  "Income Approach Supporting Schedule",
                  `${selected.juris} Appeal Form (pre-filled)`,
                  "Signed Authorization & Representation Letter",
                ].map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: DS.surface, border: `1px solid ${DS.border}` }}>
                    <FileText className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
                    <span className="text-xs" style={{ color: DS.text.secondary }}>{doc}</span>
                    <CheckCircle className="w-3.5 h-3.5 ml-auto" style={{ color: DS.accent.green }} />
                  </div>
                ))}
              </div>
              <button onClick={() => setShowPacket(false)} className="w-full py-2.5 rounded-lg text-sm font-semibold" style={{ background: DS.accent.green, color: "#fff" }}>
                Download Appeal Packet
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
