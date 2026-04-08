import { useState } from "react";
import { Activity, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Shield, Building2, Gavel, FileText, MessageSquare, Cloud, Eye, DollarSign, MapPin, Stethoscope } from "lucide-react";
import { usePressureGraph, useDataProducts } from "../../hooks/use-prism-s31";

const DIM_META: Record<string, { icon: any; label: string; color: string }> = {
  deadline: { icon: Clock, label: "Deadline", color: "#c45a4a" },
  insurer: { icon: Building2, label: "Insurer", color: "#c8953c" },
  adjuster: { icon: Eye, label: "Adjuster", color: "#d4a054" },
  coverage: { icon: Shield, label: "Coverage", color: "#4a90b8" },
  venue: { icon: MapPin, label: "Venue", color: "#8b7ac8" },
  medical: { icon: Stethoscope, label: "Medical", color: "#c45a4a" },
  damages: { icon: DollarSign, label: "Damages", color: "#c8953c" },
  settlement: { icon: Gavel, label: "Settlement", color: "#d4a054" },
  weather_event: { icon: Cloud, label: "Weather", color: "#4a90b8" },
  evidence: { icon: FileText, label: "Evidence", color: "#8b7ac8" },
  communication: { icon: MessageSquare, label: "Comms", color: "#c45a4a" },
  governance: { icon: Shield, label: "Governance", color: "#4a90b8" },
};

const PRODUCT_META: Record<string, { label: string; description: string; color: string }> = {
  insurer_pressure_index: { label: "Insurer Pressure Index", description: "Composite: carrier behavior, adjuster dynamics, communication cadence", color: "#c8953c" },
  venue_velocity_index: { label: "Venue Velocity Index", description: "Court backlog, scheduling patterns, deadline convergence", color: "#8b7ac8" },
  incident_context_layer: { label: "Incident Context Layer", description: "Weather, geography, roadway conditions at incident", color: "#4a90b8" },
  nofault_friction_score: { label: "No-Fault Friction Score", description: "Verification delays, clock pressure, document completeness", color: "#c45a4a" },
  settlement_friction_map: { label: "Settlement Friction Map", description: "Lien drag, readiness gaps, insurer posture", color: "#d4a054" },
  ai_defensibility_index: { label: "AI Defensibility Index", description: "Source coverage, review state, export safety", color: "#4a90b8" },
};

const DEMO_PRESSURE: Record<string, any> = {
  deadline: { score: 0.65, movement: "rising", confidence: 0.8, topDrivers: ["SOL approaching", "Discovery cutoff in 30d"] },
  insurer: { score: 0.58, movement: "rising", confidence: 0.75, topDrivers: ["Carrier response lag > 21d", "Reserve increase detected"] },
  adjuster: { score: 0.42, movement: "stable", confidence: 0.7, topDrivers: ["Adjuster reassignment detected"] },
  coverage: { score: 0.35, movement: "stable", confidence: 0.85, topDrivers: ["Policy limits confirmed"] },
  venue: { score: 0.50, movement: "stable", confidence: 0.7, topDrivers: ["County backlog 14mo avg", "Judge pending"] },
  medical: { score: 0.55, movement: "falling", confidence: 0.75, topDrivers: ["Outstanding records (3)", "IME scheduled"] },
  damages: { score: 0.48, movement: "stable", confidence: 0.8, topDrivers: ["Damages 78% complete"] },
  settlement: { score: 0.62, movement: "rising", confidence: 0.72, topDrivers: ["Offer gap widening", "Mediation approaching"] },
  weather_event: { score: 0.20, movement: "stable", confidence: 0.6, topDrivers: ["No adverse weather context"] },
  evidence: { score: 0.52, movement: "falling", confidence: 0.78, topDrivers: ["Key docs awaiting extraction"] },
  communication: { score: 0.45, movement: "stable", confidence: 0.8, topDrivers: ["14d silence from carrier"] },
  governance: { score: 0.30, movement: "stable", confidence: 0.85, topDrivers: ["All approvals current"] },
};

const DEMO_PRODUCTS: Record<string, any> = {
  insurer_pressure_index: { score: 0.49, movement: "rising" },
  venue_velocity_index: { score: 0.55, movement: "stable" },
  incident_context_layer: { score: 0.39, movement: "stable" },
  nofault_friction_score: { score: 0.54, movement: "falling" },
  settlement_friction_map: { score: 0.53, movement: "rising" },
  ai_defensibility_index: { score: 0.41, movement: "stable" },
};

export default function PressureGraphPage() {
  const [matterId] = useState<number>(1);
  const { data: pressureData } = usePressureGraph(matterId);
  const { data: productsData } = useDataProducts(matterId);

  const dims = pressureData?.dimensions && Object.keys(pressureData.dimensions).length > 0 ? pressureData.dimensions : DEMO_PRESSURE;
  const products = productsData?.products && Object.keys(productsData.products).length > 0 ? productsData.products : DEMO_PRODUCTS;
  const isDemo = !pressureData?.dimensions || Object.keys(pressureData.dimensions).length === 0;

  const MovementIcon = ({ movement }: { movement: string }) => {
    if (movement === "rising") return <TrendingUp className="w-3 h-3 text-[#c45a4a]" />;
    if (movement === "falling") return <TrendingDown className="w-3 h-3 text-[#4a90b8]" />;
    return <Minus className="w-3 h-3 text-slate-500" />;
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#c8953c]" />
          <h1 className="text-lg font-semibold text-slate-100">Pressure Graph</h1>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDemo ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{isDemo ? "DEMO" : "LIVE"}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">12 pressure dimensions scored, tracked, and explained — per matter</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {Object.entries(dims).map(([key, dim]: [string, any]) => {
          const meta = DIM_META[key];
          if (!meta) return null;
          const Icon = meta.icon;
          const pct = Math.round((dim.score ?? 0) * 100);
          const barColor = pct > 60 ? "#c45a4a" : pct > 40 ? "#c8953c" : "#4a90b8";
          return (
            <div key={key} className="rounded-lg border border-white/[0.06] p-3" style={{ background: "#0c1220" }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                  <span className="text-[10px] font-medium text-slate-300">{meta.label}</span>
                </div>
                <MovementIcon movement={dim.movement ?? "stable"} />
              </div>
              <div className="text-xl font-bold text-slate-100 mb-1">{pct}%</div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] mb-2">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <div className="space-y-0.5">
                {(dim.topDrivers ?? []).slice(0, 2).map((d: string, i: number) => (
                  <div key={i} className="text-[9px] text-slate-500 truncate">• {d}</div>
                ))}
              </div>
              <div className="text-[8px] text-slate-600 mt-1 font-mono">conf: {((dim.confidence ?? 0) * 100).toFixed(0)}%</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[#d4a054]" />
          <h3 className="text-sm font-semibold text-slate-200">Data Products</h3>
          <span className="text-[9px] text-slate-500 font-mono">6 composite indices</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(products).map(([key, prod]: [string, any]) => {
            const meta = PRODUCT_META[key];
            if (!meta) return null;
            const pct = Math.round((prod.score ?? 0) * 100);
            return (
              <div key={key} className="rounded border border-white/[0.06] p-3 hover:border-white/[0.10] transition-colors" style={{ background: "#080c14" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-200">{meta.label}</span>
                  <MovementIcon movement={prod.movement ?? "stable"} />
                </div>
                <div className="text-lg font-bold mb-1" style={{ color: meta.color }}>{pct}%</div>
                <p className="text-[9px] text-slate-500 leading-relaxed">{meta.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
