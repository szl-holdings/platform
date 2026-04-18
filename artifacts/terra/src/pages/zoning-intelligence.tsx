import { useState, useMemo } from "react";
import { motion as m, AnimatePresence } from "framer-motion";
import {
  Building2, Layers, MapPin, DollarSign, TrendingUp, ChevronRight,
  BarChart3, Eye, Grid3X3, Maximize2, ArrowUpRight, Scale, FileText, Box, ArrowLeft, Loader2
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ZoningParcel {
  id: string;
  address: string;
  currentZoning: string;
  zoningDescription: string;
  lotSizeSqft: number;
  currentFar: number;
  maxFar: number;
  currentUnits: number;
  maxUnits: number;
  scenarios: DevelopmentScenario[];
  varianceHistory: VarianceRecord[];
  overlayDistricts: string[];
  setbacks: { front: number; side: number; rear: number };
  maxHeight: number;
}

interface DevelopmentScenario {
  id: string;
  name: string;
  type: string;
  units: number;
  grossSqft: number;
  far: number;
  stories: number;
  parkingSpaces: number;
  estimatedRevenue: number;
  constructionCost: number;
  landValue: number;
  residualLandValue: number;
  requiresVariance: boolean;
  varianceProbability: number;
  timelineMonths: number;
}

interface VarianceRecord {
  year: number;
  type: string;
  requested: string;
  result: "approved" | "denied" | "withdrawn";
  conditions: string;
}

const PARCELS: ZoningParcel[] = [
  {
    id: "zp-1",
    address: "2400 Market St, Philadelphia, PA 19103",
    currentZoning: "CMX-3",
    zoningDescription: "Commercial Mixed-Use (Medium Intensity)",
    lotSizeSqft: 18500,
    currentFar: 1.2,
    maxFar: 5.0,
    currentUnits: 0,
    maxUnits: 92,
    setbacks: { front: 0, side: 0, rear: 10 },
    maxHeight: 85,
    overlayDistricts: ["Transit-Oriented Development", "Opportunity Zone"],
    scenarios: [
      { id: "s1", name: "As-of-Right Mixed Use", type: "Mixed Use", units: 62, grossSqft: 82000, far: 4.4, stories: 6, parkingSpaces: 31, estimatedRevenue: 24800000, constructionCost: 18500000, landValue: 3200000, residualLandValue: 3100000, requiresVariance: false, varianceProbability: 100, timelineMonths: 24 },
      { id: "s2", name: "Maximum Density Residential", type: "Multifamily", units: 92, grossSqft: 92500, far: 5.0, stories: 7, parkingSpaces: 46, estimatedRevenue: 31050000, constructionCost: 22800000, landValue: 3200000, residualLandValue: 5050000, requiresVariance: true, varianceProbability: 72, timelineMonths: 30 },
      { id: "s3", name: "Office + Retail", type: "Commercial", units: 0, grossSqft: 75000, far: 4.0, stories: 5, parkingSpaces: 50, estimatedRevenue: 22500000, constructionCost: 19200000, landValue: 3200000, residualLandValue: 100000, requiresVariance: false, varianceProbability: 100, timelineMonths: 22 },
      { id: "s4", name: "Boutique Hotel + Retail", type: "Hospitality", units: 85, grossSqft: 68000, far: 3.7, stories: 5, parkingSpaces: 20, estimatedRevenue: 28900000, constructionCost: 21600000, landValue: 3200000, residualLandValue: 4100000, requiresVariance: true, varianceProbability: 58, timelineMonths: 28 },
    ],
    varianceHistory: [
      { year: 2023, type: "Height", requested: "95 ft (vs 85 ft max)", result: "approved", conditions: "Design review panel approval, enhanced streetscape" },
      { year: 2022, type: "Parking", requested: "Reduce from 1:1 to 0.5:1 ratio", result: "approved", conditions: "Transit proximity, bike storage, TDM plan" },
      { year: 2021, type: "Use", requested: "Outdoor dining in setback", result: "approved", conditions: "Seasonal only, noise mitigation" },
      { year: 2020, type: "Density", requested: "110 units (vs 92 max)", result: "denied", conditions: "Exceeded community impact threshold" },
    ],
  },
  {
    id: "zp-2",
    address: "800 Fulton St, Brooklyn, NY 11238",
    currentZoning: "R7A/C2-4",
    zoningDescription: "Medium-Density Residential / Commercial Overlay",
    lotSizeSqft: 12000,
    currentFar: 0.8,
    maxFar: 4.0,
    currentUnits: 4,
    maxUnits: 48,
    setbacks: { front: 15, side: 8, rear: 30 },
    maxHeight: 75,
    overlayDistricts: ["Inclusionary Housing", "Arts & Cultural District"],
    scenarios: [
      { id: "s5", name: "As-of-Right Residential", type: "Multifamily", units: 36, grossSqft: 42000, far: 3.5, stories: 5, parkingSpaces: 18, estimatedRevenue: 19800000, constructionCost: 14200000, landValue: 4100000, residualLandValue: 1500000, requiresVariance: false, varianceProbability: 100, timelineMonths: 20 },
      { id: "s6", name: "Affordable Housing Bonus", type: "Multifamily", units: 48, grossSqft: 48000, far: 4.0, stories: 6, parkingSpaces: 12, estimatedRevenue: 18500000, constructionCost: 15800000, landValue: 4100000, residualLandValue: -1400000, requiresVariance: false, varianceProbability: 100, timelineMonths: 24 },
    ],
    varianceHistory: [
      { year: 2024, type: "Rear Yard", requested: "20 ft (vs 30 ft)", result: "approved", conditions: "Community garden access easement" },
      { year: 2022, type: "Height", requested: "85 ft (vs 75 ft)", result: "denied", conditions: "Contextual zoning district" },
    ],
  },
];

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
const fmtSqft = (n: number) => `${n.toLocaleString()} SF`;

export default function ZoningIntelligencePage() {
  const [, params] = useRoute<{ propertyId: string }>("/zoning-intelligence/:propertyId");
  const propertyId = params?.propertyId;

  const { data: propertyData, isLoading: propertyLoading } = useQuery({
    queryKey: ["terra-zoning", propertyId],
    queryFn: () => api.properties.zoning(propertyId!),
    enabled: !!propertyId,
    staleTime: 300_000,
  });

  const [selectedParcel, setSelectedParcel] = useState(PARCELS[0].id);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const parcel = PARCELS.find(p => p.id === selectedParcel)!;
  const scenario = parcel.scenarios.find(s => s.id === selectedScenario);

  const utilizationPct = Math.round((parcel.currentFar / parcel.maxFar) * 100);

  if (propertyId) {
    const d = propertyData?.data;
    return (
      <div className="min-h-screen" style={{ background: "#0a0c10" }}>
        <div className="mx-auto max-w-5xl px-6 py-8">
          <Link href={`/property/${propertyId}`}>
            <span className="inline-flex items-center gap-1 text-xs mb-5 cursor-pointer" style={{ color: "rgba(255,255,255,0.3)" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Property
            </span>
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Generative Zoning</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Zoning Intelligence &amp; Development Scenarios</h1>
          <p className="mt-1 text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>Property-specific zoning analysis for <code style={{ color: "#2d6a4f" }}>{propertyId}</code></p>

          {propertyLoading || !d ? (
            <div className="flex items-center gap-3 p-8 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#2d6a4f" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Fetching zoning data…</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {[
                  { label: "Current Zoning", value: d.currentZoning, sub: d.zoningDescription, color: "#2d6a4f" },
                  { label: "Max FAR", value: d.maxFar.toFixed(1), sub: `Current: ${d.currentFar.toFixed(1)}`, color: "#60a5fa" },
                  { label: "Max Units", value: d.maxUnits.toString(), sub: `Currently ${d.currentUnits} units`, color: "#a78bfa" },
                  { label: "Variance Probability", value: `${d.varianceProbability}%`, sub: "approval likelihood", color: d.varianceProbability >= 60 ? "#34d399" : "#fbbf24" },
                ].map(mm => (
                  <div key={mm.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-2">{mm.label}</div>
                    <div className="text-xl font-semibold text-white">{mm.value}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">{mm.sub}</div>
                  </div>
                ))}
              </div>

              {d.overlayDistricts?.length > 0 && (
                <div className="flex gap-2 mb-6">
                  {(d.overlayDistricts as string[]).map((od: string) => (
                    <span key={od} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#2d6a4f15", color: "#2d6a4f", border: "1px solid #2d6a4f25" }}>{od}</span>
                  ))}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">Development Scenarios</h3>
                  <div className="space-y-3">
                    {d.scenarios.map((s) => {
                      const profit = s.estimatedRevenue - s.constructionCost - s.landValue;
                      const margin = (profit / s.estimatedRevenue) * 100;
                      return (
                        <div key={s.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-white">{s.name}</div>
                            {!s.requiresVariance ? (
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#34d39915", color: "#34d399" }}>As-of-Right</span>
                            ) : (
                              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fbbf2415", color: "#fbbf24" }}>Variance ({s.varianceProbability}%)</span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {[
                              { l: "Revenue", v: fmt(s.estimatedRevenue) },
                              { l: "Cost", v: fmt(s.constructionCost) },
                              { l: "Profit", v: fmt(profit) },
                              { l: "Margin", v: `${margin.toFixed(1)}%` },
                            ].map(item => (
                              <div key={item.l} className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                                <div className="text-xs font-semibold text-white">{item.v}</div>
                                <div className="text-[9px] text-white/30">{item.l}</div>
                              </div>
                            ))}
                          </div>
                          <div className="text-[10px] text-white/30 mt-2">{s.units} units · FAR {s.far} · {s.stories} stories · {s.timelineMonths}mo timeline</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-white mb-4">AI Summary</h3>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-sm text-white/60 leading-relaxed">{d.aiSummary}</p>
                    <p className="text-[9px] mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>Source: {d.dataSource}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0a0c10" }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Generative Zoning</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Zoning Intelligence & Development Scenarios</h1>
          <p className="mt-1 text-sm text-white/40">Governed zoning code analysis, maximum-density development scenarios, revenue projections, and variance probability scoring.</p>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {PARCELS.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedParcel(p.id); setSelectedScenario(null); }}
              className={cn("flex-shrink-0 rounded-xl border px-4 py-3 text-left transition min-w-[240px]",
                p.id === selectedParcel ? "border-[#2d6a4f]/40 bg-[#2d6a4f]/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
              )}
            >
              <div className="text-sm font-medium text-white truncate">{p.address}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{p.currentZoning} · {fmtSqft(p.lotSizeSqft)} · Max {p.maxUnits} units</div>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {[
            { label: "Current Zoning", value: parcel.currentZoning, sub: parcel.zoningDescription, color: "#2d6a4f" },
            { label: "FAR Utilization", value: `${parcel.currentFar} / ${parcel.maxFar}`, sub: `${utilizationPct}% utilized`, color: utilizationPct < 50 ? "#34d399" : "#fbbf24" },
            { label: "Max Height", value: `${parcel.maxHeight} ft`, sub: `Setbacks: F${parcel.setbacks.front}' S${parcel.setbacks.side}' R${parcel.setbacks.rear}'`, color: "#60a5fa" },
            { label: "Max Density", value: `${parcel.maxUnits} units`, sub: `Currently ${parcel.currentUnits}`, color: "#a78bfa" },
            { label: "Scenarios", value: String(parcel.scenarios.length), sub: `${parcel.scenarios.filter(s => !s.requiresVariance).length} as-of-right`, color: "#fbbf24" },
          ].map(m => (
            <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-2">{m.label}</div>
              <div className="text-lg font-semibold text-white">{m.value}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>

        {parcel.overlayDistricts.length > 0 && (
          <div className="flex gap-2 mb-6">
            {parcel.overlayDistricts.map(d => (
              <span key={d} className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#2d6a4f15", color: "#2d6a4f", border: "1px solid #2d6a4f25" }}>{d}</span>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Development Scenarios</h3>
            <div className="space-y-3">
              {parcel.scenarios.map(s => {
                const profit = s.estimatedRevenue - s.constructionCost - s.landValue;
                const margin = (profit / s.estimatedRevenue) * 100;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScenario(s.id === selectedScenario ? null : s.id)}
                    className={cn("w-full text-left rounded-xl border p-4 transition",
                      s.id === selectedScenario ? "border-[#2d6a4f]/40 bg-[#2d6a4f]/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium text-white">{s.name}</div>
                        <div className="text-[10px] text-white/40">{s.type} · {s.stories} stories · {fmtSqft(s.grossSqft)}</div>
                      </div>
                      {!s.requiresVariance ? (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#34d39915", color: "#34d399" }}>As-of-Right</span>
                      ) : (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fbbf2415", color: "#fbbf24" }}>Variance ({s.varianceProbability}%)</span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { l: "Revenue", v: fmt(s.estimatedRevenue) },
                        { l: "Cost", v: fmt(s.constructionCost) },
                        { l: "Profit", v: fmt(profit) },
                        { l: "Margin", v: `${margin.toFixed(1)}%` },
                      ].map(item => (
                        <div key={item.l} className="rounded-lg bg-white/[0.03] px-2 py-1.5">
                          <div className="text-xs font-semibold text-white">{item.v}</div>
                          <div className="text-[9px] text-white/30">{item.l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-white/30">
                      <span>{s.units} units · {s.parkingSpaces} parking · FAR {s.far}</span>
                      <span>Timeline: {s.timelineMonths}mo</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Variance & Rezoning History</h3>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: "#34d399" }}>{Math.round((parcel.varianceHistory.filter(v => v.result === "approved").length / parcel.varianceHistory.length) * 100)}%</div>
                  <div className="text-[9px] text-white/30">Approval Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{parcel.varianceHistory.length}</div>
                  <div className="text-[9px] text-white/30">Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: "#60a5fa" }}>{parcel.varianceHistory.filter(v => v.result === "approved").length}</div>
                  <div className="text-[9px] text-white/30">Approved</div>
                </div>
              </div>

              <div className="space-y-2.5">
                {parcel.varianceHistory.map((v, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3">
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full" style={{
                      background: v.result === "approved" ? "#34d39915" : v.result === "denied" ? "#ef444415" : "#fbbf2415"
                    }}>
                      <span className="text-[10px] font-bold" style={{
                        color: v.result === "approved" ? "#34d399" : v.result === "denied" ? "#ef4444" : "#fbbf24"
                      }}>{v.year}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{v.type} Variance</span>
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full" style={{
                          background: v.result === "approved" ? "#34d39915" : v.result === "denied" ? "#ef444415" : "#fbbf2415",
                          color: v.result === "approved" ? "#34d399" : v.result === "denied" ? "#ef4444" : "#fbbf24"
                        }}>{v.result}</span>
                      </div>
                      <p className="text-[10px] text-white/40 mt-0.5">{v.requested}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{v.conditions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {scenario && (
                <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                  <div className="rounded-2xl border border-[#2d6a4f]/30 bg-[#2d6a4f]/[0.05] p-5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#2d6a4f" }}>Scenario Detail — {scenario.name}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { l: "Gross SF", v: fmtSqft(scenario.grossSqft) },
                        { l: "FAR", v: scenario.far.toFixed(1) },
                        { l: "Stories", v: String(scenario.stories) },
                        { l: "Units", v: String(scenario.units) },
                        { l: "Parking", v: String(scenario.parkingSpaces) },
                        { l: "Timeline", v: `${scenario.timelineMonths} months` },
                        { l: "Residual Land Value", v: fmt(scenario.residualLandValue) },
                        { l: "Yield on Cost", v: `${((scenario.estimatedRevenue - scenario.constructionCost) / scenario.constructionCost * 100).toFixed(1)}%` },
                      ].map(item => (
                        <div key={item.l} className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
                          <div className="text-[10px] text-white/30">{item.l}</div>
                          <div className="text-sm font-semibold text-white">{item.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
