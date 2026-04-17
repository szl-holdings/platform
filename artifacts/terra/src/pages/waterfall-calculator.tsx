import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Layers, DollarSign, TrendingUp, Users, BarChart3, Calculator, ChevronDown, ArrowRight, Save, FolderOpen
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@szl-holdings/shared-ui/utils";

interface TooltipPayloadEntry { name: string; value: number; color?: string; fill?: string; }
interface ChartTooltipProps { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string; }

const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.05)",
  accent: { gold: "#b8943c", blue: "#3a7ad4", green: "#40856a", red: "#c0503a", purple: "#7c5cbf" },
  text: { primary: "rgba(255,255,255,0.85)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.3)", muted: "rgba(255,255,255,0.18)" },
};

const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${Math.round(n).toLocaleString()}`;
const pct = (n: number) => `${n.toFixed(2)}%`;

interface WaterfallInputs {
  totalEquity: number;
  gpContributionPct: number;
  preferredReturn: number;
  catchUpPct: number;
  promotePct: number;
  exitProceeds: number;
  holdMonths: number;
}

interface TierResult {
  tier: string;
  description: string;
  gpAmount: number;
  lpAmount: number;
  total: number;
  gpPct: number;
  lpPct: number;
  cumGp: number;
  cumLp: number;
}

function useWaterfall(inputs: WaterfallInputs) {
  return useMemo(() => {
    const gpEquity = inputs.totalEquity * (inputs.gpContributionPct / 100);
    const lpEquity = inputs.totalEquity - gpEquity;

    const prefReturnAmount = inputs.totalEquity * (inputs.preferredReturn / 100) * (inputs.holdMonths / 12);
    const returnOfCapital = inputs.totalEquity;
    const remainingAfterPref = Math.max(0, inputs.exitProceeds - returnOfCapital - prefReturnAmount);

    const catchUpTarget = remainingAfterPref > 0
      ? (inputs.catchUpPct / 100) * (prefReturnAmount / (1 - inputs.catchUpPct / 100))
      : 0;
    const catchUpAmount = Math.min(catchUpTarget, remainingAfterPref);
    const afterCatchUp = remainingAfterPref - catchUpAmount;
    const gpPromote = afterCatchUp * (inputs.promotePct / 100);
    const lpResidual = afterCatchUp * (1 - inputs.promotePct / 100);

    const gpTotal = gpEquity + catchUpAmount + gpPromote;
    const lpTotal = lpEquity + prefReturnAmount + lpResidual;
    const gpEM = gpEquity > 0 ? gpTotal / gpEquity : 0;
    const lpEM = lpEquity > 0 ? lpTotal / lpEquity : 0;
    const totalMonths = inputs.holdMonths;
    const gpIRR = gpEquity > 0 ? (Math.pow(gpEM, 12 / totalMonths) - 1) * 100 : 0;
    const lpIRR = lpEquity > 0 ? (Math.pow(lpEM, 12 / totalMonths) - 1) * 100 : 0;

    let cumGp = 0, cumLp = 0;

    const tiers: TierResult[] = [
      (() => {
        const gp = gpEquity, lp = lpEquity;
        cumGp += gp; cumLp += lp;
        return { tier: "Tier 1", description: "Return of Capital", gpAmount: gp, lpAmount: lp, total: gp + lp, gpPct: (gp / (gp + lp)) * 100, lpPct: (lp / (gp + lp)) * 100, cumGp, cumLp };
      })(),
      (() => {
        const gp = 0, lp = prefReturnAmount;
        cumGp += gp; cumLp += lp;
        return { tier: "Tier 2", description: `Preferred Return (${inputs.preferredReturn}% p.a.)`, gpAmount: gp, lpAmount: lp, total: gp + lp, gpPct: 0, lpPct: 100, cumGp, cumLp };
      })(),
      (() => {
        const gp = catchUpAmount, lp = 0;
        cumGp += gp; cumLp += lp;
        return { tier: "Tier 3", description: `GP Catch-Up (${inputs.catchUpPct}%)`, gpAmount: gp, lpAmount: lp, total: gp + lp, gpPct: gp > 0 ? 100 : 0, lpPct: 0, cumGp, cumLp };
      })(),
      (() => {
        const gp = gpPromote, lp = lpResidual;
        cumGp += gp; cumLp += lp;
        return { tier: "Tier 4", description: `Residual (GP ${inputs.promotePct}% promote)`, gpAmount: gp, lpAmount: lp, total: gp + lp, gpPct: gp + lp > 0 ? (gp / (gp + lp)) * 100 : 0, lpPct: gp + lp > 0 ? (lp / (gp + lp)) * 100 : 0, cumGp, cumLp };
      })(),
    ];

    return { gpEquity, lpEquity, gpTotal, lpTotal, gpEM, lpEM, gpIRR, lpIRR, tiers, prefReturnAmount, catchUpAmount, gpPromote, lpResidual };
  }, [inputs]);
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
      {payload.map((p) => <div key={p.name} className="flex gap-2"><span style={{ color: p.fill ?? p.color }}>{p.name}:</span><span className="text-white/70">{fmt(p.value)}</span></div>)}
    </div>
  );
};

const TIER_COLORS = [DS.accent.blue, DS.accent.green, DS.accent.purple, DS.accent.gold];

const DEFAULT_WATERFALL_INPUTS: WaterfallInputs = {
  totalEquity: 15_000_000,
  gpContributionPct: 10,
  preferredReturn: 8,
  catchUpPct: 50,
  promotePct: 20,
  exitProceeds: 28_500_000,
  holdMonths: 48,
};

export default function WaterfallCalculatorPage() {
  const queryClient = useQueryClient();

  const { data: savedStructures } = useQuery({
    queryKey: ["terra-waterfall-structures"],
    queryFn: () => api.waterfall.list(),
    staleTime: 30_000,
  });

  const saveStructureMutation = useMutation({
    mutationFn: (data: { name: string; inputs: Record<string, unknown>; results: Record<string, unknown> }) =>
      api.waterfall.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["terra-waterfall-structures"] }); },
  });

  const [inputs, setInputs] = useState<WaterfallInputs>(DEFAULT_WATERFALL_INPUTS);
  const [showStructures, setShowStructures] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [structureName, setStructureName] = useState("Waterfall Structure");

  const set = (k: keyof WaterfallInputs) => (v: number) => setInputs(prev => ({ ...prev, [k]: v }));
  const r = useWaterfall(inputs);

  const barData = r.tiers.map((t) => ({ name: t.description.split(" (")[0], GP: t.gpAmount, LP: t.lpAmount }));
  const pieData = [
    { name: "GP Total", value: r.gpTotal, color: DS.accent.gold },
    { name: "LP Total", value: r.lpTotal, color: DS.accent.blue },
  ];

  function saveStructure() {
    saveStructureMutation.mutate({
      name: structureName,
      inputs: inputs as unknown as Record<string, unknown>,
      results: { gpEM: r.gpEM, lpEM: r.lpEM, gpIRR: r.gpIRR, lpIRR: r.lpIRR, gpTotal: r.gpTotal, lpTotal: r.lpTotal },
    }, {
      onSuccess: () => { setSavedMsg("Saved!"); setTimeout(() => setSavedMsg(null), 2000); },
    });
  }

  function loadStructure(s: { inputs: Record<string, unknown>; name: string }) {
    setInputs(s.inputs as unknown as WaterfallInputs);
    setStructureName(s.name);
    setShowStructures(false);
  }

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-base font-bold text-white tracking-tight font-display">Investor Waterfall Calculator</h1>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold" style={{ color: DS.accent.purple, background: `${DS.accent.purple}15`, border: `1px solid ${DS.accent.purple}25` }}>GP / LP</span>
          </div>
          <p className="text-[10px] font-mono" style={{ color: DS.text.muted }}>Preferred return · catch-up · promote splits · multi-tier GP/LP distribution waterfall modeling</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={structureName} onChange={e => setStructureName(e.target.value)}
            className="bg-transparent border rounded-lg px-2 py-1.5 text-[10px] w-40"
            style={{ borderColor: DS.border, color: DS.text.secondary }} />
          <button onClick={saveStructure} disabled={saveStructureMutation.isPending}
            className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
            style={{ background: `${DS.accent.purple}15`, border: `1px solid ${DS.accent.purple}30`, color: DS.accent.purple }}>
            <Save className="w-3 h-3" />
            {savedMsg ?? (saveStructureMutation.isPending ? "Saving…" : "Save")}
          </button>
          <div className="relative">
            <button onClick={() => setShowStructures(v => !v)}
              className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg"
              style={{ background: DS.surface, border: `1px solid ${DS.border}`, color: DS.text.secondary }}>
              <FolderOpen className="w-3 h-3" />
              Load ({savedStructures?.structures.length ?? 0})
            </button>
            {showStructures && (savedStructures?.structures.length ?? 0) > 0 && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-xl border shadow-2xl z-50 overflow-hidden" style={{ background: "#0d0f15", borderColor: DS.border }}>
                {savedStructures!.structures.map(s => (
                  <button key={s.id} onClick={() => loadStructure(s)}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: `1px solid ${DS.border}` }}>
                    <p className="text-[11px] font-medium" style={{ color: DS.text.primary }}>{s.name}</p>
                    <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>{new Date(s.updatedAt).toLocaleDateString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: DS.text.muted }}>Deal Structure Inputs</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumInput label="Total Equity" value={inputs.totalEquity} onChange={set("totalEquity")} prefix="$" step={500000} />
          <NumInput label="GP Contribution %" value={inputs.gpContributionPct} onChange={set("gpContributionPct")} suffix="%" step={1} />
          <NumInput label="Preferred Return" value={inputs.preferredReturn} onChange={set("preferredReturn")} suffix="% p.a." step={0.5} />
          <NumInput label="GP Catch-Up %" value={inputs.catchUpPct} onChange={set("catchUpPct")} suffix="%" step={5} />
          <NumInput label="GP Promote" value={inputs.promotePct} onChange={set("promotePct")} suffix="%" step={5} />
          <NumInput label="Exit Proceeds" value={inputs.exitProceeds} onChange={set("exitProceeds")} prefix="$" step={500000} />
          <NumInput label="Hold Period" value={inputs.holdMonths} onChange={set("holdMonths")} suffix="months" step={3} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "GP Equity Invested", value: fmt(r.gpEquity), sub: `${inputs.gpContributionPct}% of total`, color: DS.accent.gold },
          { label: "LP Equity Invested", value: fmt(r.lpEquity), sub: `${100 - inputs.gpContributionPct}% of total`, color: DS.accent.blue },
          { label: "GP Returns", value: fmt(r.gpTotal), sub: `${r.gpEM.toFixed(2)}× · ${pct(r.gpIRR)} IRR`, color: DS.accent.gold },
          { label: "LP Returns", value: fmt(r.lpTotal), sub: `${r.lpEM.toFixed(2)}× · ${pct(r.lpIRR)} IRR`, color: DS.accent.blue },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: DS.text.muted }}>{m.label}</p>
            <p className="text-2xl font-bold font-mono mt-1" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: DS.border }}>
          <Layers className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${DS.accent.gold}99` }}>Distribution Waterfall</span>
        </div>

        <div className="grid grid-cols-7 gap-2 px-4 py-2 border-b text-[9px] font-semibold uppercase tracking-wider" style={{ borderColor: DS.border, color: DS.text.muted }}>
          {["Tier", "Description", "GP Amount", "LP Amount", "Total", "GP Split", "LP Split"].map(h => <div key={h}>{h}</div>)}
        </div>

        <div className="divide-y" style={{ borderColor: DS.border }}>
          {r.tiers.map((tier, i) => (
            <motion.div key={tier.tier} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
              className="grid grid-cols-7 gap-2 px-4 py-3 items-center hover:bg-white/[0.015] transition-colors">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: TIER_COLORS[i] }} />
                <span className="text-[10px] font-bold font-mono" style={{ color: DS.text.primary }}>{tier.tier}</span>
              </div>
              <div className="text-[10px]" style={{ color: DS.text.secondary }}>{tier.description}</div>
              <div className="text-[10px] font-mono font-bold" style={{ color: DS.accent.gold }}>{tier.gpAmount > 0 ? fmt(tier.gpAmount) : "—"}</div>
              <div className="text-[10px] font-mono font-bold" style={{ color: DS.accent.blue }}>{tier.lpAmount > 0 ? fmt(tier.lpAmount) : "—"}</div>
              <div className="text-[10px] font-mono" style={{ color: DS.text.secondary }}>{fmt(tier.total)}</div>
              <div className="text-[10px] font-mono" style={{ color: DS.accent.gold }}>{tier.gpPct > 0 ? `${tier.gpPct.toFixed(0)}%` : "—"}</div>
              <div className="text-[10px] font-mono" style={{ color: DS.accent.blue }}>{tier.lpPct > 0 ? `${tier.lpPct.toFixed(0)}%` : "—"}</div>
            </motion.div>
          ))}
          <div className="grid grid-cols-7 gap-2 px-4 py-3 items-center" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.muted }}>Total Distributions</div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.accent.gold }}>{fmt(r.gpTotal)}</div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.accent.blue }}>{fmt(r.lpTotal)}</div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.text.primary }}>{fmt(inputs.exitProceeds)}</div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.accent.gold }}>{pct((r.gpTotal / inputs.exitProceeds) * 100)}</div>
            <div className="text-[11px] font-bold font-mono" style={{ color: DS.accent.blue }}>{pct((r.lpTotal / inputs.exitProceeds) * 100)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: DS.text.muted }}>Distributions by Tier</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8 }} />
              <YAxis tickFormatter={v => `$${(v / 1e6).toFixed(0)}M`} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="GP" fill={DS.accent.gold} fillOpacity={0.85} radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="LP" fill={DS.accent.blue} fillOpacity={0.85} radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: DS.text.muted }}>GP vs. LP Total Returns</p>
          <div className="flex items-center justify-center h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(value, entry) => <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
