import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {

  BarChart3, DollarSign, TrendingUp, Calculator, Building2, Calendar,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle, RefreshCw, Download,
  Save, FolderOpen, Plus, Trash2, Copy, BarChart2, GitCompare, Grid3X3
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";

interface TooltipPayloadEntry { name: string; value: number; color?: string; fill?: string; }
interface ChartTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; }

const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.05)",
  accent: { gold: "#b8943c", blue: "#3a7ad4", green: "#40856a", red: "#c0503a", purple: "#8b5cf6", orange: "#d97706" },
  text: { primary: "rgba(255,255,255,0.85)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.3)", muted: "rgba(255,255,255,0.18)" },
};

const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${Math.round(n)}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

interface ProFormaInputs {
  projectName: string;
  propertyType: string;
  totalUnits: number;
  avgUnitSF: number;
  landCost: number;
  hardCostPerSF: number;
  softCostPct: number;
  contingencyPct: number;
  financingRate: number;
  loanToCost: number;
  constructionMonths: number;
  absorptionMonths: number;
  stabilizedOccupancy: number;
  marketRentPerSF: number;
  opexPerSF: number;
  exitCapRate: number;
  equityMultipleTarget: number;
}

interface Scenario {
  id: string;
  name: string;
  color: string;
  inputs: ProFormaInputs;
}

const SCENARIO_COLORS = [DS.accent.gold, DS.accent.blue, DS.accent.green, DS.accent.purple, DS.accent.orange];
const DEFAULT_INPUTS: ProFormaInputs = {
  projectName: "The Arbor — Mixed-Use Tower",
  propertyType: "Mixed-Use",
  totalUnits: 120,
  avgUnitSF: 950,
  landCost: 8_500_000,
  hardCostPerSF: 285,
  softCostPct: 18,
  contingencyPct: 8,
  financingRate: 7.25,
  loanToCost: 65,
  constructionMonths: 24,
  absorptionMonths: 12,
  stabilizedOccupancy: 94,
  marketRentPerSF: 3.40,
  opexPerSF: 1.05,
  exitCapRate: 5.25,
  equityMultipleTarget: 1.85,
};

const BEAR_INPUTS: ProFormaInputs = {
  ...DEFAULT_INPUTS,
  hardCostPerSF: 310,
  financingRate: 8.0,
  marketRentPerSF: 3.10,
  exitCapRate: 5.75,
  stabilizedOccupancy: 90,
};

const BULL_INPUTS: ProFormaInputs = {
  ...DEFAULT_INPUTS,
  hardCostPerSF: 265,
  financingRate: 6.75,
  marketRentPerSF: 3.65,
  exitCapRate: 4.75,
  stabilizedOccupancy: 96,
};

function calcProForma(inputs: ProFormaInputs) {
  const totalSF = inputs.totalUnits * inputs.avgUnitSF;
  const hardCosts = totalSF * inputs.hardCostPerSF;
  const softCosts = hardCosts * (inputs.softCostPct / 100);
  const contingency = (hardCosts + softCosts) * (inputs.contingencyPct / 100);
  const totalDevelopmentCost = inputs.landCost + hardCosts + softCosts + contingency;
  const totalDebt = totalDevelopmentCost * (inputs.loanToCost / 100);
  const totalEquity = totalDevelopmentCost - totalDebt;
  const constructionInterest = totalDebt * (inputs.financingRate / 100) * (inputs.constructionMonths / 12) * 0.6;
  const totalProjectCost = totalDevelopmentCost + constructionInterest;

  const grossPotentialRent = inputs.totalUnits * (inputs.avgUnitSF * inputs.marketRentPerSF) * 12;
  const effectiveGrossIncome = grossPotentialRent * (inputs.stabilizedOccupancy / 100);
  const opex = totalSF * inputs.opexPerSF * 12;
  const noi = effectiveGrossIncome - opex;
  const stabilizedValue = noi / (inputs.exitCapRate / 100);
  const developerProfit = stabilizedValue - totalProjectCost;
  const profitOnCost = (developerProfit / totalProjectCost) * 100;
  const yieldOnCost = (noi / totalProjectCost) * 100;
  const spreadToCapRate = yieldOnCost - inputs.exitCapRate;

  const equityProceeds = stabilizedValue - totalDebt;
  const equityMultiple = equityProceeds / totalEquity;
  const projectMonths = inputs.constructionMonths + inputs.absorptionMonths;
  const irr = (Math.pow(Math.max(equityMultiple, 0.001), 12 / projectMonths) - 1) * 100;

  const costPerUnit = totalProjectCost / inputs.totalUnits;
  const valuePerUnit = stabilizedValue / inputs.totalUnits;

  const schedule: { phase: string; cost: number; cumulative: number }[] = [];
  let cum = 0;
  const phases = [
    { phase: "Land", cost: inputs.landCost },
    { phase: "Hard Costs", cost: hardCosts },
    { phase: "Soft Costs", cost: softCosts },
    { phase: "Contingency", cost: contingency },
    { phase: "Const. Interest", cost: constructionInterest },
  ];
  phases.forEach(p => { cum += p.cost; schedule.push({ ...p, cumulative: cum }); });

  const sensRows: { capRate: number; value: number; profit: number; em: number }[] = [];
  for (let cr = inputs.exitCapRate - 1; cr <= inputs.exitCapRate + 1; cr += 0.25) {
    const v = noi / (cr / 100);
    const pr = v - totalProjectCost;
    const eq = (v - totalDebt) / totalEquity;
    sensRows.push({ capRate: cr, value: v, profit: pr, em: eq });
  }

  return {
    totalSF, hardCosts, softCosts, contingency, totalDevelopmentCost,
    totalDebt, totalEquity, constructionInterest, totalProjectCost,
    grossPotentialRent, effectiveGrossIncome, opex, noi, stabilizedValue,
    developerProfit, profitOnCost, yieldOnCost, spreadToCapRate,
    equityMultiple, irr, costPerUnit, valuePerUnit, schedule, sensRows,
  };
}

function useProForma(inputs: ProFormaInputs) {
  return useMemo(() => calcProForma(inputs), [inputs]);
}

function NumInput({ label, value, onChange, prefix, suffix, step }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string; step?: number }) {
  return (
    <div>
      <label className="block text-[9px] font-semibold uppercase tracking-wider mb-1" style={{ color: DS.text.muted }}>{label}</label>
      <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: DS.border, background: "rgba(255,255,255,0.03)" }}>
        {prefix && <span className="px-2 text-[10px]" style={{ color: DS.text.muted }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          step={step ?? 1}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 bg-transparent px-2 py-1.5 text-xs text-white focus:outline-none w-full"
        />
        {suffix && <span className="px-2 text-[10px]" style={{ color: DS.text.muted }}>{suffix}</span>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-2 text-xs shadow-xl" style={{ background: "rgba(10,12,16,0.97)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="font-semibold text-white/80 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex gap-2"><span style={{ color: p.color ?? p.fill }}>{p.name}:</span><span className="text-white/70">{fmt(p.value)}</span></div>
      ))}
    </div>
  );
};

function irrColor(irr: number) {
  if (irr >= 22) return DS.accent.green;
  if (irr >= 18) return "#7db89e";
  if (irr >= 14) return DS.accent.gold;
  if (irr >= 10) return "#c88a3c";
  return DS.accent.red;
}

function irrBg(irr: number) {
  if (irr >= 22) return "rgba(64,133,106,0.35)";
  if (irr >= 18) return "rgba(64,133,106,0.20)";
  if (irr >= 14) return "rgba(184,148,60,0.25)";
  if (irr >= 10) return "rgba(200,138,60,0.18)";
  return "rgba(192,80,58,0.30)";
}

function SensHeatMap({ inputs }: { inputs: ProFormaInputs }) {
  const hardCostSteps = [-30, -20, -10, 0, 10, 20, 30];
  const capRateSteps = [-0.75, -0.50, -0.25, 0, 0.25, 0.50, 0.75];

  const rows = capRateSteps.map(capDelta => ({
    capRate: inputs.exitCapRate + capDelta,
    cells: hardCostSteps.map(hcDelta => {
      const r = calcProForma({
        ...inputs,
        hardCostPerSF: inputs.hardCostPerSF + hcDelta,
        exitCapRate: inputs.exitCapRate + capDelta,
      });
      return { irr: r.irr, isBase: hcDelta === 0 && capDelta === 0 };
    }),
  }));

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
      <div className="flex items-center gap-2 mb-3">
        <Grid3X3 className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.muted }}>
          2D Sensitivity: Hard Cost/SF Δ × Exit Cap Rate → Levered IRR
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="text-[9px] font-mono border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="text-left pr-3 pb-1 whitespace-nowrap font-semibold uppercase tracking-wider" style={{ color: DS.text.muted }}>
                Cap Rate ↓ / HC/SF Δ →
              </th>
              {hardCostSteps.map(hc => (
                <th key={hc} className="text-center px-2 pb-1 font-semibold whitespace-nowrap" style={{ color: hc < 0 ? DS.accent.green : hc > 0 ? DS.accent.red : DS.accent.gold }}>
                  {hc >= 0 ? `+$${hc}` : `-$${Math.abs(hc)}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.capRate}>
                <td className="pr-3 py-0.5 font-semibold whitespace-nowrap" style={{ color: row.capRate < inputs.exitCapRate ? DS.accent.green : row.capRate > inputs.exitCapRate ? DS.accent.red : DS.accent.gold }}>
                  {pct(row.capRate)}{Math.abs(row.capRate - inputs.exitCapRate) < 0.001 ? " ◀ base" : ""}
                </td>
                {row.cells.map((cell, ci) => (
                  <td
                    key={ci}
                    className="text-center px-2 py-1 rounded-md font-bold"
                    style={{
                      background: irrBg(cell.irr),
                      color: irrColor(cell.irr),
                      outline: cell.isBase ? `1.5px solid ${DS.accent.gold}` : undefined,
                      minWidth: 52,
                    }}
                  >
                    {pct(cell.irr)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {[
          { label: "≥22% IRR", bg: "rgba(64,133,106,0.35)", color: DS.accent.green },
          { label: "≥18% IRR", bg: "rgba(64,133,106,0.20)", color: "#7db89e" },
          { label: "≥14% IRR", bg: "rgba(184,148,60,0.25)", color: DS.accent.gold },
          { label: "<14% IRR", bg: "rgba(192,80,58,0.30)", color: DS.accent.red },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.bg, border: `1px solid ${l.color}40` }} />
            <span className="text-[9px]" style={{ color: DS.text.muted }}>{l.label}</span>
          </div>
        ))}
        <span className="text-[9px]" style={{ color: DS.text.muted }}>◀ = base case</span>
      </div>
    </div>
  );
}

function ScenarioComparisonPanel({ scenarios }: { scenarios: Scenario[] }) {
  if (scenarios.length < 2) return null;

  const metrics = [
    { key: "irr", label: "Levered IRR", format: (v: number) => pct(v), good: (v: number) => v >= 18 },
    { key: "equityMultiple", label: "Equity Multiple", format: (v: number) => `${v.toFixed(2)}×`, good: (v: number) => v >= 1.85 },
    { key: "profitOnCost", label: "Profit on Cost", format: (v: number) => pct(v), good: (v: number) => v >= 15 },
    { key: "totalProjectCost", label: "Total Project Cost", format: (v: number) => fmt(v), good: () => true },
    { key: "stabilizedValue", label: "Stabilized Value", format: (v: number) => fmt(v), good: () => true },
    { key: "developerProfit", label: "Developer Profit", format: (v: number) => fmt(v), good: (v: number) => v > 0 },
    { key: "noi", label: "NOI", format: (v: number) => fmt(v), good: () => true },
    { key: "yieldOnCost", label: "Yield on Cost", format: (v: number) => pct(v), good: (v: number) => v >= 5 },
  ];

  const results = scenarios.map(s => ({ ...s, r: calcProForma(s.inputs) }));

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
      <div className="flex items-center gap-2 mb-4">
        <GitCompare className="w-3.5 h-3.5" style={{ color: DS.accent.blue }} />
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.muted }}>Scenario Comparison</p>
        <div className="flex items-center gap-2 ml-2">
          {results.map(s => (
            <span key={s.id} className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${s.color}18`, border: `1px solid ${s.color}40`, color: s.color }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr>
              <th className="text-left pb-2 font-semibold uppercase tracking-wider pr-4" style={{ color: DS.text.muted }}>Metric</th>
              {results.map(s => (
                <th key={s.id} className="text-right pb-2 font-semibold px-3" style={{ color: s.color }}>{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => {
              const values = results.map(s => (s.r as unknown as Record<string, number>)[m.key]);
              const best = m.key === "totalProjectCost" ? Math.min(...values) : Math.max(...values);
              return (
                <tr key={m.key} className="border-t" style={{ borderColor: DS.border }}>
                  <td className="py-1.5 pr-4 font-medium" style={{ color: DS.text.secondary }}>{m.label}</td>
                  {results.map((s, i) => {
                    const v = values[i];
                    const isOk = m.good(v);
                    const isBest = Math.abs(v - best) < 0.001;
                    return (
                      <td key={s.id} className="py-1.5 px-3 text-right font-mono font-bold" style={{ color: isOk ? (isBest ? s.color : DS.text.secondary) : DS.accent.red }}>
                        {m.format(v)}
                        {isBest && <span className="ml-1 text-[8px]" style={{ color: s.color }}>▲</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

const INITIAL_SCENARIOS: Scenario[] = [
  { id: "base", name: "Base Case", color: SCENARIO_COLORS[0], inputs: { ...DEFAULT_INPUTS } },
  { id: "bear", name: "Bear Case", color: SCENARIO_COLORS[2], inputs: { ...BEAR_INPUTS } },
  { id: "bull", name: "Bull Case", color: SCENARIO_COLORS[1], inputs: { ...BULL_INPUTS } },
];

export default function ProFormaPage() {
  const queryClient = useQueryClient();

  const { data: savedProjects } = useStandardQuery({
    queryKey: ["terra-pro-forma-projects"],
    queryFn: () => api.proForma.list(),
    staleTime: 30_000,
  });

  const saveProjectMutation = useStandardMutation({
    mutationFn: (data: { projectName: string; inputs: Record<string, unknown>; results: Record<string, unknown> }) =>
      api.proForma.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["terra-pro-forma-projects"] }); },
  });

  const [scenarios, setScenarios] = useState<Scenario[]>(INITIAL_SCENARIOS);
  const [activeId, setActiveId] = useState("base");
  const [showInputs, setShowInputs] = useState(true);
  const [showProjects, setShowProjects] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"builder" | "sensitivity" | "compare">("builder");
  const [newScenarioName, setNewScenarioName] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const activeScenario = scenarios.find(s => s.id === activeId) ?? scenarios[0];
  const inputs = activeScenario.inputs;
  const r = useProForma(inputs);

  const setInput = (k: keyof ProFormaInputs) => (v: number | string) =>
    setScenarios(prev => prev.map(s =>
      s.id === activeId ? { ...s, inputs: { ...s.inputs, [k]: v } } : s
    ));

  const saveScenario = (name: string) => {
    const colorIdx = scenarios.length % SCENARIO_COLORS.length;
    setScenarios(prev => [...prev, { id: genId(), name, color: SCENARIO_COLORS[colorIdx], inputs: { ...inputs } }]);
    setShowAddModal(false);
    setNewScenarioName("");
  };

  const cloneScenario = (id: string) => {
    const src = scenarios.find(s => s.id === id);
    if (!src) return;
    const colorIdx = scenarios.length % SCENARIO_COLORS.length;
    const newS: Scenario = { id: genId(), name: `${src.name} (Copy)`, color: SCENARIO_COLORS[colorIdx], inputs: { ...src.inputs } };
    setScenarios(prev => [...prev, newS]);
    setActiveId(newS.id);
  };

  const deleteScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios(prev => prev.filter(s => s.id !== id));
    if (activeId === id) setActiveId(scenarios.find(s => s.id !== id)?.id ?? "");
  };

  const irr_ok = r.irr >= 18;
  const em_ok = r.equityMultiple >= inputs.equityMultipleTarget;
  const poc_ok = r.profitOnCost >= 15;

  function saveProject() {
    saveProjectMutation.mutate({
      projectName: inputs.projectName,
      inputs: inputs as unknown as Record<string, unknown>,
      results: {
        irr: r.irr, equityMultiple: r.equityMultiple, profitOnCost: r.profitOnCost,
        totalProjectCost: r.totalProjectCost, stabilizedValue: r.stabilizedValue,
        developerProfit: r.developerProfit,
      },
    }, {
      onSuccess: () => { setSavedMsg("Saved!"); setTimeout(() => setSavedMsg(null), 2000); },
    });
  }

  function loadProject(project: { inputs: Record<string, unknown>; projectName?: string }) {
    const colorIdx = scenarios.length % SCENARIO_COLORS.length;
    const loaded: Scenario = {
      id: genId(),
      name: (project.projectName as string | undefined) ?? "Loaded Project",
      color: SCENARIO_COLORS[colorIdx],
      inputs: project.inputs as unknown as ProFormaInputs,
    };
    setScenarios(prev => [...prev, loaded]);
    setActiveId(loaded.id);
    setShowProjects(false);
  }

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-base font-bold text-white tracking-tight font-display">Development Pro Forma Builder</h1>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold" style={{ color: DS.accent.blue, background: `${DS.accent.blue}10`, border: `1px solid ${DS.accent.blue}20` }}>Feasibility</span>
          </div>
          <p className="text-[10px] font-mono" style={{ color: DS.text.muted }}>Ground-up development analysis · IRR · Equity Multiple · Sensitivity · Multi-Scenario Comparison</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={saveProject} disabled={saveProjectMutation.isPending}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
            style={{ background: saveProjectMutation.isPending ? DS.surface : `${DS.accent.gold}15`, border: `1px solid ${saveProjectMutation.isPending ? DS.border : DS.accent.gold}`, color: DS.accent.gold }}>
            <Save className="w-3 h-3" />
            {savedMsg ?? (saveProjectMutation.isPending ? "Saving…" : "Save")}
          </button>
          <div className="relative">
            <button onClick={() => setShowProjects(v => !v)}
              className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
              style={{ background: DS.surface, border: `1px solid ${DS.border}`, color: DS.text.secondary }}>
              <FolderOpen className="w-3 h-3" />
              Load ({savedProjects?.projects.length ?? 0})
            </button>
            {showProjects && (savedProjects?.projects.length ?? 0) > 0 && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden" style={{ background: "#0d0f15", borderColor: DS.border }}>
                {savedProjects!.projects.map(p => (
                  <button key={p.id} onClick={() => loadProject(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: `1px solid ${DS.border}` }}>
                    <p className="text-[11px] font-medium" style={{ color: DS.text.primary }}>{p.projectName}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>{new Date(p.updatedAt).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setShowInputs(v => !v)} className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg" style={{ background: DS.surface, border: `1px solid ${DS.border}`, color: DS.text.secondary }}>
            <Calculator className="w-3 h-3" />
            {showInputs ? "Hide" : "Show"} Inputs
          </button>
        </div>
      </div>

      {/* Scenario tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {scenarios.map(s => (
            <div key={s.id} className="flex items-center gap-0.5 group">
              <button
                onClick={() => setActiveId(s.id)}
                className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  background: activeId === s.id ? `${s.color}18` : DS.surface,
                  border: `1px solid ${activeId === s.id ? `${s.color}50` : DS.border}`,
                  color: activeId === s.id ? s.color : DS.text.secondary,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                {s.name}
              </button>
              {scenarios.length > 1 && (
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => cloneScenario(s.id)} title="Duplicate" className="p-1 rounded" style={{ color: DS.text.muted }}>
                    <Copy className="w-3 h-3" />
                  </button>
                  {scenarios.length > 1 && (
                    <button onClick={() => deleteScenario(s.id)} title="Delete" className="p-1 rounded" style={{ color: DS.accent.red + "99" }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg"
          style={{ background: DS.surface, border: `1px dashed ${DS.border}`, color: DS.text.muted }}
        >
          <Plus className="w-3 h-3" /> Save Current as Scenario
        </button>
      </div>

      {/* Add scenario modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: DS.accent.gold + "40", background: `${DS.accent.gold}08` }}>
            <p className="text-[10px] font-semibold" style={{ color: DS.text.secondary }}>Scenario name:</p>
            <input
              type="text"
              value={newScenarioName}
              onChange={e => setNewScenarioName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newScenarioName.trim()) saveScenario(newScenarioName.trim()); }}
              placeholder="e.g. Stress Test, Upside, Conservative…"
              className="flex-1 bg-transparent px-2 py-1 text-xs text-white focus:outline-none rounded border"
              style={{ borderColor: DS.border }}
              autoFocus
            />
            <button
              onClick={() => { if (newScenarioName.trim()) saveScenario(newScenarioName.trim()); }}
              className="px-3 py-1 rounded text-[10px] font-semibold"
              style={{ background: DS.accent.gold, color: "#000" }}
            >Save</button>
            <button onClick={() => { setShowAddModal(false); setNewScenarioName(""); }}
              className="px-3 py-1 rounded text-[10px]" style={{ color: DS.text.muted }}>Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab navigation */}
      <div className="flex items-center gap-1">
        {[
          { id: "builder", label: "Pro Forma", icon: <BarChart3 className="w-3 h-3" /> },
          { id: "sensitivity", label: "2D Sensitivity", icon: <Grid3X3 className="w-3 h-3" /> },
          { id: "compare", label: "Scenario Compare", icon: <GitCompare className="w-3 h-3" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? `${DS.accent.blue}18` : DS.surface,
              border: `1px solid ${activeTab === tab.id ? `${DS.accent.blue}50` : DS.border}`,
              color: activeTab === tab.id ? DS.accent.blue : DS.text.secondary,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "builder" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Project Cost", value: fmt(r.totalProjectCost), sub: `${fmt(r.costPerUnit)}/unit`, color: DS.accent.gold },
              { label: "Stabilized Value", value: fmt(r.stabilizedValue), sub: `${fmt(r.valuePerUnit)}/unit`, color: DS.accent.green },
              { label: "Developer Profit", value: fmt(r.developerProfit), sub: `${pct(r.profitOnCost)} on cost`, color: poc_ok ? DS.accent.green : DS.accent.red },
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
                <p className="text-[9px] uppercase tracking-wider" style={{ color: DS.text.muted }}>{m.label}</p>
                <p className="text-2xl font-bold font-mono mt-1" style={{ color: m.color }}>{m.value}</p>
                <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>{m.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Levered IRR", value: `${pct(r.irr)}`, ok: irr_ok, threshold: "≥18% target" },
              { label: "Equity Multiple", value: `${r.equityMultiple.toFixed(2)}×`, ok: em_ok, threshold: `≥${inputs.equityMultipleTarget}× target` },
              { label: "Yield on Cost", value: `${pct(r.yieldOnCost)}`, ok: r.yieldOnCost > inputs.exitCapRate, threshold: `vs. ${pct(inputs.exitCapRate)} cap rate` },
            ].map(m => (
              <div key={m.label} className="rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: m.ok ? `${DS.accent.green}30` : `${DS.accent.red}30`, background: m.ok ? `${DS.accent.green}06` : `${DS.accent.red}06` }}>
                {m.ok ? <CheckCircle className="w-5 h-5 shrink-0" style={{ color: DS.accent.green }} /> : <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: DS.accent.red }} />}
                <div>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: DS.text.muted }}>{m.label}</p>
                  <p className="text-xl font-bold font-mono" style={{ color: m.ok ? DS.accent.green : DS.accent.red }}>{m.value}</p>
                  <p className="text-[9px]" style={{ color: DS.text.muted }}>{m.threshold}</p>
                </div>
              </div>
            ))}
          </div>

          {showInputs && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: DS.text.muted }}>Project Inputs — <span style={{ color: activeScenario.color }}>{activeScenario.name}</span></p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <NumInput label="Total Units" value={inputs.totalUnits} onChange={setInput("totalUnits")} />
                <NumInput label="Avg Unit SF" value={inputs.avgUnitSF} onChange={setInput("avgUnitSF")} suffix="SF" />
                <NumInput label="Land Cost" value={inputs.landCost} onChange={setInput("landCost")} prefix="$" step={100000} />
                <NumInput label="Hard Cost/SF" value={inputs.hardCostPerSF} onChange={setInput("hardCostPerSF")} prefix="$" suffix="/SF" step={5} />
                <NumInput label="Soft Cost %" value={inputs.softCostPct} onChange={setInput("softCostPct")} suffix="%" step={0.5} />
                <NumInput label="Contingency %" value={inputs.contingencyPct} onChange={setInput("contingencyPct")} suffix="%" step={0.5} />
                <NumInput label="Financing Rate" value={inputs.financingRate} onChange={setInput("financingRate")} suffix="%" step={0.25} />
                <NumInput label="Loan-to-Cost" value={inputs.loanToCost} onChange={setInput("loanToCost")} suffix="%" step={1} />
                <NumInput label="Construction Mo." value={inputs.constructionMonths} onChange={setInput("constructionMonths")} suffix="mo" />
                <NumInput label="Absorption Mo." value={inputs.absorptionMonths} onChange={setInput("absorptionMonths")} suffix="mo" />
                <NumInput label="Market Rent/SF/Mo" value={inputs.marketRentPerSF} onChange={setInput("marketRentPerSF")} prefix="$" step={0.05} />
                <NumInput label="Exit Cap Rate" value={inputs.exitCapRate} onChange={setInput("exitCapRate")} suffix="%" step={0.25} />
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: DS.text.muted }}>Cost Waterfall</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={r.schedule} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="phase" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} />
                  <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cost" name="Cost" fill={activeScenario.color} fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: DS.text.muted }}>Exit Cap Rate Sensitivity</p>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr>
                      {["Cap Rate", "Stabilized Value", "Developer Profit", "Equity Multiple"].map(h => (
                        <th key={h} className="text-left pb-2 font-semibold uppercase tracking-wider" style={{ color: DS.text.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.sensRows.map(row => {
                      const isBase = Math.abs(row.capRate - inputs.exitCapRate) < 0.01;
                      return (
                        <tr key={row.capRate} className={cn("border-t", isBase ? "bg-white/[0.02]" : "")} style={{ borderColor: DS.border }}>
                          <td className="py-1.5 font-mono font-bold" style={{ color: isBase ? DS.accent.gold : DS.text.secondary }}>{pct(row.capRate)}{isBase ? " ← base" : ""}</td>
                          <td className="py-1.5 font-mono" style={{ color: DS.text.secondary }}>{fmt(row.value)}</td>
                          <td className="py-1.5 font-mono" style={{ color: row.profit > 0 ? DS.accent.green : DS.accent.red }}>{fmt(row.profit)}</td>
                          <td className="py-1.5 font-mono" style={{ color: row.em >= inputs.equityMultipleTarget ? DS.accent.green : DS.accent.red }}>{row.em.toFixed(2)}×</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: DS.text.muted }}>Income & Expense Summary</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Gross Potential Rent", value: fmt(r.grossPotentialRent), sub: "annualized" },
                { label: "Effective Gross Income", value: fmt(r.effectiveGrossIncome), sub: `at ${inputs.stabilizedOccupancy}% occ.` },
                { label: "Operating Expenses", value: fmt(r.opex), sub: `$${inputs.opexPerSF}/SF/yr` },
                { label: "Net Operating Income", value: fmt(r.noi), sub: `${pct(r.yieldOnCost)} yield on cost` },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}` }}>
                  <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>{m.label}</p>
                  <p className="text-base font-bold font-mono mt-1" style={{ color: DS.accent.gold }}>{m.value}</p>
                  <p className="text-[8px] mt-0.5" style={{ color: DS.text.muted }}>{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "sensitivity" && (
        <div className="space-y-4">
          <div className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: `${DS.accent.blue}30`, background: `${DS.accent.blue}06` }}>
            <BarChart2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: DS.accent.blue }} />
            <div>
              <p className="text-[10px] font-semibold" style={{ color: DS.text.secondary }}>Analyzing <span style={{ color: activeScenario.color }}>{activeScenario.name}</span></p>
              <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                The heat map below shows Levered IRR across a grid of Hard Cost/SF adjustments (columns) vs. Exit Cap Rate adjustments (rows).
                The outlined cell is your current base assumption. Green = strong returns, red = challenged deal.
              </p>
            </div>
          </div>
          <SensHeatMap inputs={inputs} />
        </div>
      )}

      {activeTab === "compare" && (
        <div className="space-y-4">
          {scenarios.length < 2 ? (
            <div className="rounded-xl border p-6 text-center" style={{ borderColor: DS.border, background: DS.surface }}>
              <GitCompare className="w-8 h-8 mx-auto mb-2" style={{ color: DS.text.muted }} />
              <p className="text-sm font-semibold text-white/60">Save at least 2 scenarios to compare</p>
              <p className="text-[10px] mt-1" style={{ color: DS.text.muted }}>Use the "Save Current as Scenario" button above, or switch tabs to adjust inputs.</p>
            </div>
          ) : (
            <ScenarioComparisonPanel scenarios={scenarios} />
          )}
        </div>
      )}
    </div>
  );
}
