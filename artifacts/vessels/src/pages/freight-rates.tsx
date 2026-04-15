import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Activity, DollarSign, Globe } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type VesselClass = "capesize" | "panamax" | "supramax" | "handysize";

const CLASS_CONFIG: Record<VesselClass, { label: string; dwt: string; color: string; routes: string[]; currentRate: number; change: number; changePct: number; forward: number[] }> = {
  capesize: {
    label: "Capesize", dwt: "100,000–180,000 DWT", color: "#38bdf8",
    routes: ["C5 (WA→CHN)", "C3 (BRA→CHN)", "Transatlantic"],
    currentRate: 28450, change: +1820, changePct: +6.84, forward: [28000, 29200, 31000, 30100, 28800, 27500],
  },
  panamax: {
    label: "Panamax", dwt: "60,000–100,000 DWT", color: "#818cf8",
    routes: ["P1A (Transatlantic)", "P2A (Fronthaul)", "P3A (Backhaul)"],
    currentRate: 16280, change: -340, changePct: -2.05, forward: [16500, 17100, 17800, 17400, 16900, 16600],
  },
  supramax: {
    label: "Supramax", dwt: "45,000–65,000 DWT", color: "#34d399",
    routes: ["S1C (US Gulf/Far East)", "S5 (USG/Cont)", "S4B (USG/SKorea)"],
    currentRate: 13840, change: +220, changePct: +1.61, forward: [14000, 14500, 15200, 14800, 14200, 13900],
  },
  handysize: {
    label: "Handysize", dwt: "25,000–45,000 DWT", color: "#fb923c",
    routes: ["HS1 (Cont-FEast)", "HS2 (FEast-Cont)", "HS3 (USG-FEast)"],
    currentRate: 12150, change: +480, changePct: +4.11, forward: [12400, 12800, 13200, 13000, 12700, 12400],
  },
};

const months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];

const deterministicNoise = (i: number, seed: number) =>
  (Math.sin(i * 7.3 + seed * 3.1) * 0.5 + 0.5) * 0.05;

const generateHistory = (base: number, seed: number) =>
  Array.from({ length: 24 }, (_, i) => ({
    month: i < 12
      ? `${["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"][i]} '25`
      : `${["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i - 12] ?? months[i - 12]} '26`,
    rate: Math.round(base * (0.75 + Math.sin(i * 0.4 + seed) * 0.15 + (i / 24) * 0.1 + deterministicNoise(i, seed))),
  }));

const ROUTE_RATES = [
  { route: "C5 — W. Australia → China (Iron Ore)", class: "capesize", rate: 11.2, change: +0.4, unit: "$/MT" },
  { route: "C3 — Tubarão → Qingdao (Iron Ore)", class: "capesize", rate: 28.1, change: +1.8, unit: "$/MT" },
  { route: "P1A — Transatlantic Round", class: "panamax", rate: 16280, change: -340, unit: "$/day" },
  { route: "P2A — Fronthaul (AMS → FEast)", class: "panamax", rate: 22400, change: +820, unit: "$/day" },
  { route: "S1C — USG → Far East", class: "supramax", rate: 24800, change: +620, unit: "$/day" },
  { route: "S5 — USG → Cont/Med", class: "supramax", rate: 18200, change: -280, unit: "$/day" },
  { route: "HS1 — Cont → Far East (MV)", class: "handysize", rate: 13800, change: +540, unit: "$/day" },
  { route: "HS3 — USG → Far East", class: "handysize", rate: 14900, change: +720, unit: "$/day" },
];

const classColors: Record<string, string> = {
  capesize: "text-sky-400",
  panamax: "text-indigo-400",
  supramax: "text-emerald-400",
  handysize: "text-orange-400",
};

export default function FreightRatesPage() {
  const [selectedClass, setSelectedClass] = useState<VesselClass>("capesize");
  const cls = CLASS_CONFIG[selectedClass];
  const history = generateHistory(cls.currentRate, selectedClass === "capesize" ? 0 : selectedClass === "panamax" ? 1 : selectedClass === "supramax" ? 2 : 3);
  const forwardData = months.map((m, i) => ({ month: `${m} '26`, rate: cls.forward[i] }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-sky-400" />
          Freight Rate Benchmarking
        </h1>
        <p className="text-xs text-sky-400/50 mt-0.5">Live market rate panels with historical trends and forward curve estimation — Baltic Exchange methodology</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.entries(CLASS_CONFIG) as [VesselClass, typeof CLASS_CONFIG[VesselClass]][]).map(([key, c]) => (
          <button
            key={key}
            onClick={() => setSelectedClass(key)}
            className={cn("text-left bg-[#0a1628]/80 border rounded-xl p-4 transition-all",
              selectedClass === key ? "border-sky-500/30 ring-1 ring-sky-500/20" : "border-sky-500/10 hover:border-sky-500/20")}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{c.label}</p>
              <Badge variant="outline" className={cn("text-[9px]",
                c.changePct > 0 ? "text-emerald-400 border-emerald-500/20" : "text-red-400 border-red-500/20")}>
                {c.changePct > 0 ? "+" : ""}{c.changePct.toFixed(2)}%
              </Badge>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: c.color }}>
              ${c.currentRate.toLocaleString()}
            </p>
            <p className="text-[9px] text-sky-400/40 mt-0.5">USD/day TCE</p>
            <p className="text-[9px] text-sky-400/30 mt-1">{c.dwt}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-sky-200">{cls.label} — 24-Month Historical TCE</p>
              <p className="text-[10px] text-sky-400/40">{cls.dwt} · Baltic Exchange spot rates</p>
            </div>
            <div className={cn("flex items-center gap-1", cls.changePct > 0 ? "text-emerald-400" : "text-red-400")}>
              {cls.changePct > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span className="text-xs font-mono font-bold">{cls.changePct > 0 ? "+" : ""}{cls.change.toLocaleString()} $/day</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748b" }} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: "#0a1628", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 8, fontSize: 11 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, "TCE/day"]}
              />
              <Area type="monotone" dataKey="rate" stroke={cls.color} fill={cls.color} fillOpacity={0.08} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mb-3">Forward Curve (6M)</p>
            <div className="space-y-2">
              {forwardData.map((d, i) => {
                const maxRate = Math.max(...forwardData.map(x => x.rate));
                const pct = (d.rate / maxRate) * 100;
                const isUp = i === 0 ? d.rate > cls.currentRate : d.rate > forwardData[i - 1].rate;
                return (
                  <div key={d.month} className="flex items-center gap-2">
                    <span className="text-[10px] text-sky-400/40 w-12 shrink-0">{d.month}</span>
                    <div className="flex-1 h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-sky-400/50" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-sky-300 w-14 text-right">${(d.rate / 1000).toFixed(1)}K</span>
                    {isUp ? <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" /> : <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mb-2">Key Routes — {cls.label}</p>
            <div className="space-y-2">
              {cls.routes.map(r => (
                <div key={r} className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-sky-400/30 shrink-0" />
                  <span className="text-[11px] text-sky-300">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-sky-500/10 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[11px] font-mono text-sky-300 uppercase tracking-wider">Live Route Rates</span>
        </div>
        <div className="divide-y divide-sky-500/5">
          {ROUTE_RATES.map(r => (
            <div key={r.route} className="px-4 py-3 flex items-center gap-4 hover:bg-sky-500/5 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sky-200">{r.route}</p>
                <p className={cn("text-[9px] mt-0.5", classColors[r.class])}>{CLASS_CONFIG[r.class as VesselClass].label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono text-sky-100">{typeof r.rate === "number" && r.unit === "$/day" ? `$${r.rate.toLocaleString()}` : r.rate} <span className="text-[9px] text-sky-400/40 font-normal">{r.unit}</span></p>
                <p className={cn("text-[10px] font-mono", r.change > 0 ? "text-emerald-400" : "text-red-400")}>
                  {r.change > 0 ? "+" : ""}{r.change} {r.unit}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
