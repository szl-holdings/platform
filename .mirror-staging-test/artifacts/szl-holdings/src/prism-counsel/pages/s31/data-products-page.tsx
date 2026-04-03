import { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus, Shield, Building2, MapPin, AlertTriangle, DollarSign, Gavel } from "lucide-react";
import { useDataProducts } from "../../hooks/use-prism-s31";

const PRODUCTS = [
  { key: "insurer_pressure_index", label: "Insurer Pressure Index", icon: Building2, color: "#c8953c", description: "Composite score: carrier behavior patterns, adjuster dynamics, communication cadence, reserve movement, offer trajectory", components: ["Insurer pressure", "Adjuster behavior", "Communication cadence"] },
  { key: "venue_velocity_index", label: "Venue Velocity Index", icon: MapPin, color: "#8b7ac8", description: "Court-specific scheduling velocity, backlog depth, judicial assignment patterns, calendar congestion", components: ["Venue pressure", "Deadline convergence"] },
  { key: "incident_context_layer", label: "Incident Context Layer", icon: AlertTriangle, color: "#4a90b8", description: "Incident geography, weather conditions at time of event, roadway data, environmental factors", components: ["Weather signals", "Evidence strength"] },
  { key: "nofault_friction_score", label: "No-Fault Friction Score", icon: Shield, color: "#c45a4a", description: "PIP/no-fault specific friction: verification delays, IME patterns, clock pressure, document completeness", components: ["Medical pressure", "Evidence completeness", "Deadline urgency"] },
  { key: "settlement_friction_map", label: "Settlement Friction Map", icon: DollarSign, color: "#d4a054", description: "Settlement readiness blockers: lien drag, documentation gaps, insurer posture, damages verification", components: ["Settlement pressure", "Damages readiness", "Coverage status"] },
  { key: "ai_defensibility_index", label: "AI Defensibility Index", icon: Gavel, color: "#4a90b8", description: "AI output defensibility: source coverage, review state completion, export safety, privilege protection", components: ["Governance score", "Evidence traceability"] },
];

const DEMO_DATA: Record<string, any> = {
  insurer_pressure_index: { score: 0.49, movement: "rising", components: { insurer: 0.58, adjuster: 0.42, communication: 0.45 }, topDrivers: ["Response lag", "Offer movement", "Reserve behavior"] },
  venue_velocity_index: { score: 0.55, movement: "stable", components: { venue: 0.50, deadline: 0.65 }, topDrivers: ["County backlog", "Court scheduling"] },
  incident_context_layer: { score: 0.39, movement: "stable", components: { weather: 0.20, evidence: 0.52 }, topDrivers: ["Incident geography", "Weather context"] },
  nofault_friction_score: { score: 0.54, movement: "falling", components: { medical: 0.55, evidence: 0.52, deadline: 0.65 }, topDrivers: ["Verification patterns", "Clock pressure"] },
  settlement_friction_map: { score: 0.53, movement: "rising", components: { settlement: 0.62, damages: 0.48, coverage: 0.35 }, topDrivers: ["Lien drag", "Readiness gaps"] },
  ai_defensibility_index: { score: 0.41, movement: "stable", components: { governance: 0.30, evidence: 0.52 }, topDrivers: ["Source coverage", "Review state"] },
};

export default function DataProductsPage() {
  const [matterId] = useState(1);
  const { data: productsData } = useDataProducts(matterId);

  const products = productsData?.products && Object.keys(productsData.products).length > 0 ? productsData.products : DEMO_DATA;
  const isDemo = !productsData?.products || Object.keys(productsData.products).length === 0;

  const MovementIcon = ({ m }: { m: string }) => {
    if (m === "rising") return <TrendingUp className="w-3 h-3 text-[#c45a4a]" />;
    if (m === "falling") return <TrendingDown className="w-3 h-3 text-[#4a90b8]" />;
    return <Minus className="w-3 h-3 text-slate-500" />;
  };

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Data Products</h1>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isDemo ? "bg-[#d4a054]/10 text-[#d4a054]" : "bg-[#4a90b8]/10 text-[#4a90b8]"}`}>{isDemo ? "DEMO" : "LIVE"}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">6 original composite indices — blended from Pressure Graph dimensions and Worldline features</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRODUCTS.map(prod => {
          const data = products[prod.key] ?? {};
          const Icon = prod.icon;
          const pct = Math.round((data.score ?? 0) * 100);
          const barColor = pct > 60 ? "#c45a4a" : pct > 40 ? "#c8953c" : "#4a90b8";
          const components = data.components ?? {};

          return (
            <div key={prod.key} className="rounded-lg border border-white/[0.06] p-4 hover:border-white/[0.10] transition-colors" style={{ background: "#0c1220" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: prod.color }} />
                  <span className="text-sm font-medium text-slate-200">{prod.label}</span>
                </div>
                <MovementIcon m={data.movement ?? "stable"} />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl font-bold" style={{ color: prod.color }}>{pct}%</div>
                <div className="flex-1">
                  <div className="w-full h-2 rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">{prod.description}</p>

              <div className="space-y-1.5 mb-2">
                {Object.entries(components).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">{key.replace(/_/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-[60px] h-1 rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-slate-500/50" style={{ width: `${((val as number) ?? 0) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono w-[30px] text-right">{(((val as number) ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-1 flex-wrap">
                {(data.topDrivers ?? prod.components).slice(0, 3).map((d: string, i: number) => (
                  <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 font-mono">{d}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
