import { useState } from "react";
import {
  AlertTriangle, Clock, DollarSign,
  GitBranch, Wrench, CheckCircle2, ChevronRight,
  Zap, Shield
} from "lucide-react";
import { fleetExceptions } from "@/data/fleet-twin";

const ACCENT = "hsl(205 70% 50%)";

type InterventionType = "reroute" | "defer" | "service" | "escalate";

interface InterventionOption {
  id: InterventionType;
  label: string;
  icon: React.ElementType;
  description: string;
  costDelta: number;
  timeDelta: number;
  riskDelta: number;
  confidence: number;
  tradeoff: string;
}

interface ExceptionScenario {
  exceptionId: string;
  vesselName: string;
  exceptionType: string;
  description: string;
  currentImpact: number;
  currentRisk: "low" | "moderate" | "elevated" | "critical";
  options: InterventionOption[];
}

const REROUTE_COLOR = "#3b82f6";
const DEFER_COLOR = "#f59e0b";
const SERVICE_COLOR = "#22c55e";
const ESCALATE_COLOR = "#ef4444";

function buildScenarios(): ExceptionScenario[] {
  const exceptions = fleetExceptions.filter(e => e.status !== "resolved");
  const scenarios: ExceptionScenario[] = exceptions.map((exc, idx) => {
    const baseImpact = 85000 + idx * 42000;
    return {
      exceptionId: exc.id,
      vesselName: exc.entityName,
      exceptionType: exc.type.replace(/_/g, " "),
      description: exc.description,
      currentImpact: baseImpact,
      currentRisk: idx === 0 ? "critical" : idx === 1 ? "elevated" : "moderate",
      options: [
        {
          id: "reroute",
          label: "Reroute",
          icon: GitBranch,
          description: "Alter the planned route to avoid the exception trigger — weather corridor, congested port, or restricted zone.",
          costDelta: 18000 + idx * 3200,
          timeDelta: 8 + idx * 2,
          riskDelta: -62 + idx * 4,
          confidence: 84,
          tradeoff: "Extra fuel + steaming hours. Eliminates route risk but doesn't address vessel-side issue.",
        },
        {
          id: "defer",
          label: "Defer",
          icon: Clock,
          description: "Acknowledge the exception and monitor without immediate intervention. Acceptable only where risk does not compound rapidly.",
          costDelta: 0,
          timeDelta: 0,
          riskDelta: 8 + idx * 5,
          confidence: 61,
          tradeoff: "Zero cost now, but risk accumulates. Suitable only for low-cascade exceptions with clear expiry.",
        },
        {
          id: "service",
          label: "Service",
          icon: Wrench,
          description: "Divert vessel to nearest service port for maintenance, inspection, or crew change to resolve underlying issue.",
          costDelta: 52000 + idx * 8000,
          timeDelta: 36 + idx * 6,
          riskDelta: -85 + idx * 3,
          confidence: 92,
          tradeoff: "Highest cost + delay. Most complete resolution. Charter party impact likely — notify charterer.",
        },
        {
          id: "escalate",
          label: "Escalate",
          icon: Shield,
          description: "Escalate to fleet superintendent, port authority, or flag state. Required for sanctions exposure or distress signals.",
          costDelta: 4500 + idx * 1200,
          timeDelta: 2 + idx,
          riskDelta: -40 + idx * 6,
          confidence: 75,
          tradeoff: "Initiates formal process. Reduces liability but may trigger regulatory inspection. Low direct cost.",
        },
      ],
    };
  });
  return scenarios;
}

const SCENARIOS = buildScenarios();

const RISK_STYLE = {
  low: { color: "#22c55e", bg: "#22c55e15", label: "Low" },
  moderate: { color: "#f59e0b", bg: "#f59e0b15", label: "Moderate" },
  elevated: { color: "#f97316", bg: "#f9731615", label: "Elevated" },
  critical: { color: "#ef4444", bg: "#ef444415", label: "Critical" },
};

function DeltaBadge({ value, unit, inverse = false }: { value: number; unit: string; inverse?: boolean }) {
  const positive = inverse ? value < 0 : value > 0;
  const color = value === 0 ? "#64748b" : positive ? "#22c55e" : "#ef4444";
  const sign = value > 0 ? "+" : "";
  return (
    <span className="text-[11px] font-mono font-bold" style={{ color }}>
      {sign}{value}{unit}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? "#22c55e" : value >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

const OPTION_COLOR: Record<InterventionType, string> = {
  reroute: REROUTE_COLOR,
  defer: DEFER_COLOR,
  service: SERVICE_COLOR,
  escalate: ESCALATE_COLOR,
};

function InterventionOptionCard({
  option, selected, onSelect,
}: {
  option: InterventionOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;
  const color = OPTION_COLOR[option.id];

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-xl border p-4 transition-all"
      style={{
        background: selected ? `${color}08` : "rgba(255,255,255,0.02)",
        borderColor: selected ? `${color}40` : "rgba(255,255,255,0.06)",
        boxShadow: selected ? `0 0 0 1px ${color}20` : "none",
      }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold" style={{ color: selected ? color : "rgba(255,255,255,0.85)" }}>{option.label}</span>
            {selected && <CheckCircle2 size={13} style={{ color }} />}
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{option.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Cost impact</div>
          <DeltaBadge value={option.costDelta === 0 ? 0 : Math.round(option.costDelta / 1000)} unit="K" inverse />
        </div>
        <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Time delta</div>
          <DeltaBadge value={option.timeDelta} unit="h" inverse />
        </div>
        <div className="rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Risk Δ</div>
          <DeltaBadge value={option.riskDelta} unit="%" inverse />
        </div>
      </div>

      <div className="mb-2">
        <div className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>Model confidence</div>
        <ConfidenceBar value={option.confidence} />
      </div>

      <div className="rounded p-2 text-[10px] leading-relaxed" style={{ background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <span className="font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Tradeoff: </span>{option.tradeoff}
      </div>
    </button>
  );
}

function ScenarioCard({ scenario, active, onClick }: { scenario: ExceptionScenario; active: boolean; onClick: () => void }) {
  const rs = RISK_STYLE[scenario.currentRisk];
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border p-4 transition-all"
      style={{
        background: active ? "hsl(205 70% 38% / 0.08)" : "rgba(255,255,255,0.02)",
        borderColor: active ? "hsl(205 70% 38% / 0.35)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>{scenario.vesselName}</div>
          <div className="text-[10px] mt-0.5 capitalize" style={{ color: "rgba(255,255,255,0.35)" }}>{scenario.exceptionType}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold font-mono" style={{ color: rs.color }}>${(scenario.currentImpact / 1000).toFixed(0)}K</div>
          <div className="text-[10px] mt-0.5" style={{ color: rs.color }}>{rs.label} risk</div>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{scenario.description}</p>
    </button>
  );
}

function ComparisonTable({ scenario, selectedOption }: { scenario: ExceptionScenario; selectedOption: InterventionType | null }) {
  const best = scenario.options.reduce((a, b) => a.riskDelta < b.riskDelta ? a : b);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="px-4 py-3 border-b" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>
          Side-by-side comparison · {scenario.vesselName}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <th className="text-left px-4 py-2.5" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Option</th>
              <th className="text-right px-4 py-2.5" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Cost Impact</th>
              <th className="text-right px-4 py-2.5" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Time Added</th>
              <th className="text-right px-4 py-2.5" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Risk Change</th>
              <th className="text-right px-4 py-2.5" style={{ color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {scenario.options.map((opt) => {
              const Icon = opt.icon;
              const color = OPTION_COLOR[opt.id];
              const isBest = opt.id === best.id;
              const isSelected = opt.id === selectedOption;
              return (
                <tr
                  key={opt.id}
                  style={{
                    background: isSelected ? `${color}08` : isBest ? "rgba(34,197,94,0.03)" : "transparent",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon size={12} style={{ color }} />
                      <span style={{ color: isSelected ? color : "rgba(255,255,255,0.7)" }}>{opt.label}</span>
                      {isBest && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "#22c55e15", color: "#22c55e", border: "1px solid #22c55e25" }}>Best risk</span>}
                    </div>
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className="font-mono" style={{ color: opt.costDelta === 0 ? "rgba(255,255,255,0.4)" : "#ef4444" }}>
                      {opt.costDelta === 0 ? "—" : `+$${(opt.costDelta / 1000).toFixed(0)}K`}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className="font-mono" style={{ color: opt.timeDelta === 0 ? "rgba(255,255,255,0.4)" : "#f59e0b" }}>
                      {opt.timeDelta === 0 ? "—" : `+${opt.timeDelta}h`}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className="font-mono font-bold" style={{ color: opt.riskDelta < 0 ? "#22c55e" : opt.riskDelta > 0 ? "#ef4444" : "rgba(255,255,255,0.4)" }}>
                      {opt.riskDelta > 0 ? "+" : ""}{opt.riskDelta}%
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    <span className="font-mono" style={{ color: opt.confidence >= 85 ? "#22c55e" : opt.confidence >= 70 ? "#f59e0b" : "#ef4444" }}>
                      {opt.confidence}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VoyageInterventionSimulator() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0] ?? null);
  const [selectedOption, setSelectedOption] = useState<InterventionType | null>(null);
  const [committed, setCommitted] = useState<Record<string, InterventionType>>({});

  if (SCENARIOS.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center" style={{ background: "hsl(210 15% 7%)", minHeight: "100%" }}>
        <CheckCircle2 size={40} style={{ color: "#22c55e", marginBottom: 16 }} />
        <div className="text-lg font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>No active exceptions</div>
        <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>All fleet exceptions have been resolved. No intervention required at this time.</div>
      </div>
    );
  }

  const handleCommit = () => {
    if (!selectedOption) return;
    setCommitted(prev => ({ ...prev, [selectedScenario.exceptionId]: selectedOption }));
    setSelectedOption(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" style={{ background: "hsl(210 15% 7%)", minHeight: "100%" }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch size={16} style={{ color: ACCENT }} />
            <h1 className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Voyage Intervention Simulator</h1>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Compare reroute, defer, service, and escalate options for active exceptions — with projected cost, time, and risk impact
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono px-3 py-1.5 rounded-full" style={{ background: "rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.12)", color: "rgba(14,165,233,0.6)" }}>
          <Zap size={10} />
          {SCENARIOS.length} active exception{SCENARIOS.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-2">
        {[
          { label: "Exceptions in scope", value: SCENARIOS.length, color: "#f59e0b", icon: AlertTriangle },
          { label: "Total exposure", value: `$${(SCENARIOS.reduce((a, s) => a + s.currentImpact, 0) / 1000).toFixed(0)}K`, color: "#ef4444", icon: DollarSign },
          { label: "Decisions committed", value: Object.keys(committed).length, color: "#22c55e", icon: CheckCircle2 },
        ].map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <Icon size={18} style={{ color: m.color, flexShrink: 0 }} />
              <div>
                <div className="text-xl font-bold" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4 space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Exception Queue</div>
          {SCENARIOS.map(s => (
            <div key={s.exceptionId} className="relative">
              <ScenarioCard
                scenario={s}
                active={selectedScenario.exceptionId === s.exceptionId}
                onClick={() => { setSelectedScenario(s); setSelectedOption(null); }}
              />
              {committed[s.exceptionId] && (
                <div className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full capitalize" style={{ background: `${OPTION_COLOR[committed[s.exceptionId]]}20`, color: OPTION_COLOR[committed[s.exceptionId]], border: `1px solid ${OPTION_COLOR[committed[s.exceptionId]]}30` }}>
                  {committed[s.exceptionId]} committed
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="col-span-8 space-y-5">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
              Intervention options — {selectedScenario.vesselName}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {selectedScenario.options.map(opt => (
                <InterventionOptionCard
                  key={opt.id}
                  option={opt}
                  selected={selectedOption === opt.id}
                  onSelect={() => setSelectedOption(prev => prev === opt.id ? null : opt.id)}
                />
              ))}
            </div>
          </div>

          <ComparisonTable scenario={selectedScenario} selectedOption={selectedOption} />

          {selectedOption && !committed[selectedScenario.exceptionId] && (
            <div className="rounded-xl border p-4 flex items-center gap-4" style={{ background: `${OPTION_COLOR[selectedOption]}06`, borderColor: `${OPTION_COLOR[selectedOption]}30` }}>
              <div className="flex-1">
                <div className="text-sm font-semibold mb-0.5" style={{ color: OPTION_COLOR[selectedOption] }}>
                  Ready to commit: {selectedOption.charAt(0).toUpperCase() + selectedOption.slice(1)}
                </div>
                <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {selectedScenario.options.find(o => o.id === selectedOption)?.tradeoff}
                </div>
              </div>
              <button
                onClick={handleCommit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: OPTION_COLOR[selectedOption] }}
              >
                <CheckCircle2 size={14} />
                Commit Decision
              </button>
            </div>
          )}

          {committed[selectedScenario.exceptionId] && (
            <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: "#22c55e08", borderColor: "#22c55e30" }}>
              <CheckCircle2 size={16} style={{ color: "#22c55e" }} />
              <div>
                <div className="text-sm font-semibold" style={{ color: "#22c55e" }}>Decision committed — {committed[selectedScenario.exceptionId]}</div>
                <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>Decision committed. Notify relevant teams to proceed.</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
