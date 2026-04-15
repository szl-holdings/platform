import { useState } from "react";
import { useLocation } from "wouter";
import { fireBriefSignal } from "../lib/briefSignal";
import { DARK_FLEET_VESSELS } from "../data/dark-fleet-vessels-data";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { cn } from "@szl-holdings/shared-ui/utils";
import {
  EyeOff, DollarSign, AlertTriangle, Shield, Ship, Clock,
  TrendingUp, Calculator, ChevronRight, Building, Scale,
  Activity, BarChart3, Zap
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";


const AGGREGATE_BAR = [
  { label: "Hull", value: 180, color: "#38bdf8" },
  { label: "Cargo", value: 302, color: "#f97316" },
  { label: "P&I Liability", value: 2000, color: "#ef4444" },
  { label: "Penalty Risk", value: 6.3, color: "#a855f7" },
];

const statusColors: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-400 border-red-500/20",
  High: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function fmtMoney(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function RiskMeter({ score }: { score: number }) {
  const color = score >= 85 ? "#ef4444" : score >= 70 ? "#f97316" : "#f59e0b";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#0a1628] rounded-full overflow-hidden border border-sky-500/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function VesselEconomicsCard({ vessel }: { vessel: typeof DARK_FLEET_VESSELS[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [, navigate] = useLocation();
  const totalExposure = vessel.insuranceExposure.totalExposure;
  const totalFine = vessel.sanctionsPenalty.totalPotentialFine;

  return (
    <div
      className={cn(
        "bg-[#0a1628]/80 border rounded-xl overflow-hidden transition-all cursor-pointer",
        expanded ? "border-orange-500/30" : "border-sky-500/10 hover:border-sky-500/20"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 border border-sky-500/10 flex items-center justify-center shrink-0">
            <EyeOff className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-bold text-sky-100">{vessel.name}</p>
              <Badge variant="outline" className={cn("text-[9px]", statusColors[vessel.status])}>{vessel.status}</Badge>
              {vessel.darkFleetFlag && (
                <Badge variant="outline" className="text-[9px] text-purple-400 border-purple-500/20 bg-purple-500/5">DARK FLEET</Badge>
              )}
            </div>
            <p className="text-[10px] text-sky-400/50 mb-2">{vessel.type} · {vessel.dwt.toLocaleString()} DWT · Flag: {vessel.flag}</p>
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div>
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Cargo Value</p>
                <p className="text-sm font-bold font-mono text-orange-400">{fmtMoney(vessel.cargoEstimate.totalValue)}</p>
              </div>
              <div>
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Insurance Exposure</p>
                <p className="text-sm font-bold font-mono text-red-400">{fmtMoney(totalExposure)}</p>
              </div>
              <div>
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">Sanctions Risk</p>
                <p className="text-sm font-bold font-mono text-purple-400">{fmtMoney(totalFine)}</p>
              </div>
            </div>
            <RiskMeter score={vessel.suspicionScore} />
          </div>
          <ChevronRight className={cn("w-4 h-4 text-sky-400/30 shrink-0 mt-1 transition-transform", expanded && "rotate-90")} />
        </div>
      </div>

      {expanded && (
        <>
        <div className="border-t border-sky-500/10 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-sky-500/10">
          {/* Cargo */}
          <div className="p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-sky-400/40 flex items-center gap-1"><Ship className="w-3 h-3" /> Cargo Assessment</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-sky-400/50">Commodity</span>
                <span className="text-sky-200 font-medium">{vessel.cargoEstimate.commodity}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-sky-400/50">Estimated Volume</span>
                <span className="text-sky-200 font-mono">{vessel.cargoEstimate.volumeMT.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-sky-400/50">Price / MT</span>
                <span className="text-sky-200 font-mono">${vessel.cargoEstimate.pricePerMT}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-sky-500/10 pt-1.5">
                <span className="text-orange-400 font-medium">Total Value</span>
                <span className="text-orange-400 font-bold font-mono">{fmtMoney(vessel.cargoEstimate.totalValue)}</span>
              </div>
            </div>
            {vessel.priorSanctionedPorts.length > 0 && (
              <div className="mt-2 p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                <p className="text-[9px] text-red-400/70 uppercase tracking-wider mb-1">Prior Sanctioned Port Calls</p>
                {vessel.priorSanctionedPorts.map(p => (
                  <p key={p} className="text-[10px] text-red-400/60">• {p}</p>
                ))}
              </div>
            )}
          </div>

          {/* Insurance */}
          <div className="p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-sky-400/40 flex items-center gap-1"><Building className="w-3 h-3" /> Insurance Exposure</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-sky-400/50">Hull & Machinery</span>
                <span className="text-sky-200 font-mono">{fmtMoney(vessel.insuranceExposure.hullValue)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-sky-400/50">Cargo Insurance</span>
                <span className="text-sky-200 font-mono">{fmtMoney(vessel.insuranceExposure.cargoInsurance)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-sky-400/50">P&I Liability Cap</span>
                <span className="text-sky-200 font-mono">{fmtMoney(vessel.insuranceExposure.liabilityP_I)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-sky-500/10 pt-1.5">
                <span className="text-red-400 font-medium">Total Exposure</span>
                <span className="text-red-400 font-bold font-mono">{fmtMoney(vessel.insuranceExposure.totalExposure)}</span>
              </div>
            </div>
            {vessel.insuranceExposure.sanctionsVoidRisk && (
              <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Policy may be void — sanctions exposure detected
                </p>
              </div>
            )}
          </div>

          {/* Sanctions */}
          <div className="p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-sky-400/40 flex items-center gap-1"><Scale className="w-3 h-3" /> Sanctions Penalties</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-sky-400/50">US Treasury (OFAC)</span>
                <span className="text-purple-300 font-mono">{fmtMoney(vessel.sanctionsPenalty.usTreasury)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-sky-400/50">EU Regulation</span>
                <span className="text-purple-300 font-mono">{fmtMoney(vessel.sanctionsPenalty.euRegulation)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-sky-400/50">UK OFSI</span>
                <span className="text-purple-300 font-mono">{fmtMoney(vessel.sanctionsPenalty.ukOfsi)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-sky-500/10 pt-1.5">
                <span className="text-purple-400 font-medium">Total Potential Fines</span>
                <span className="text-purple-400 font-bold font-mono">{fmtMoney(vessel.sanctionsPenalty.totalPotentialFine)}</span>
              </div>
            </div>
            {vessel.sanctionsPenalty.criminalExposure && (
              <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                <p className="text-[10px] text-red-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Criminal prosecution risk — refer to legal counsel immediately
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-sky-500/10 p-3">
          <button
            onClick={e => {
              e.stopPropagation();
              fireBriefSignal({
                query: `Generate a maritime intelligence brief on dark vessel economics for: ${vessel.name} (${vessel.type}, ${vessel.dwt.toLocaleString()} DWT, Flag: ${vessel.flag}). AIS gap duration: ${vessel.gapDuration}. Cargo value: $${(vessel.cargoEstimate.totalValue / 1e6).toFixed(1)}M. Total insurance exposure: $${(vessel.insuranceExposure.totalExposure / 1e6).toFixed(1)}M. Sanctions potential fines: $${(vessel.sanctionsPenalty.totalPotentialFine / 1e6).toFixed(1)}M. Prior sanctioned ports: ${vessel.priorSanctionedPorts.join(", ")}. Provide compliance risk assessment, insurance implications, and 3 recommended actions.`,
                context: `Dark Fleet Economics Calculator signal — AIS gap ${vessel.gapDuration}, suspicion score ${vessel.suspicionScore}/100`,
                source: `Dark Fleet Economics — ${vessel.status} status, ${vessel.dwt.toLocaleString()} DWT`,
              });
              navigate("/intelligence-briefs");
            }}
            className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-300 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg py-2 transition-colors"
          >
            <Zap className="w-3 h-3" /> Generate Intelligence Brief for this Vessel
          </button>
        </div>
        </>
      )}
    </div>
  );
}

export default function DarkFleetEconomics() {
  const totalCargo = DARK_FLEET_VESSELS.reduce((s, v) => s + v.cargoEstimate.totalValue, 0);
  const totalInsurance = DARK_FLEET_VESSELS.reduce((s, v) => s + v.insuranceExposure.totalExposure, 0);
  const totalFines = DARK_FLEET_VESSELS.reduce((s, v) => s + v.sanctionsPenalty.totalPotentialFine, 0);
  const darkFleetCount = DARK_FLEET_VESSELS.filter(v => v.darkFleetFlag).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-5 h-5 text-orange-400" />
          <h1 className="text-xl font-bold text-sky-50 font-display">Dark Fleet Economics Calculator</h1>
          <Badge variant="outline" className="text-[9px] text-orange-400 border-orange-500/20 bg-orange-500/5">
            {DARK_FLEET_VESSELS.length} ACTIVE DETECTIONS
          </Badge>
        </div>
        <p className="text-xs text-sky-400/50">Converts AIS blackout detections into dollar-denominated risk assessments for insurers and compliance teams</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Estimated Cargo Value", value: fmtMoney(totalCargo), sub: "at risk across dark vessels", icon: DollarSign, color: "text-orange-400" },
          { label: "Total Insurance Exposure", value: fmtMoney(totalInsurance), sub: "hull + cargo + P&I", icon: Building, color: "text-red-400" },
          { label: "Sanctions Penalty Pool", value: fmtMoney(totalFines), sub: "potential regulatory fines", icon: Scale, color: "text-purple-400" },
          { label: "Dark Fleet Vessels", value: darkFleetCount, sub: "confirmed fleet profile", icon: EyeOff, color: "text-amber-400" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-sky-400/40">{kpi.label}</p>
              <kpi.icon className={cn("w-4 h-4", kpi.color)} />
            </div>
            <p className={cn("text-xl font-bold font-mono", kpi.color)}>{kpi.value}</p>
            <p className="text-[10px] text-sky-400/40 mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Aggregate exposure bar chart */}
      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-sky-200 mb-1">Aggregate Exposure by Category (USD millions)</p>
        <p className="text-[10px] text-sky-400/40 mb-4">Combined across all detected dark vessels</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={AGGREGATE_BAR} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 9, fill: "#4a7fa5" }} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 9, fill: "#4a7fa5" }} width={80} />
            <Tooltip
              contentStyle={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => [`$${v}M`, "Exposure"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {AGGREGATE_BAR.map((entry) => (
                <Cell key={entry.label} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vessel cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-sky-200">Individual Vessel Assessments</p>
          <p className="text-[10px] text-sky-400/40">Click to expand financial breakdown</p>
        </div>
        {DARK_FLEET_VESSELS.map(v => (
          <VesselEconomicsCard key={v.id} vessel={v} />
        ))}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
        <p className="text-[10px] text-amber-400/70 uppercase tracking-wider mb-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Methodology Note
        </p>
        <p className="text-xs text-amber-300/50">
          Cargo values are estimated using vessel DWT utilisation (90% assumption), current spot commodity prices, and known trade routes.
          Insurance exposure includes maximum policy limits. Sanctions penalties reflect published US OFAC, EU, and UK OFSI civil penalty schedules.
          This analysis is indicative and does not constitute legal or insurance advice.
        </p>
      </div>
    </div>
  );
}
