import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import {
  Activity, ArrowLeft, ChevronRight, AlertTriangle, CheckCircle2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

type Company = {
  id: string; name: string; color: string;
  healthScore: number; arr: string; burnRate: string; runway: number;
  growth: number; burnAccel: number; status: "healthy" | "watch" | "critical";
  nrr: string; employees: number; stage: string;
  signals: Array<{ type: "positive" | "warning" | "critical"; message: string }>;
  trend: Array<{ month: string; arr: number; burn: number; cash: number }>;
  cohortBenchmark: { medianGrowth: number; medianBurn: number; medianRunway: number };
};

const COMPANIES: Company[] = [
  {
    id: "lyte", name: "Lyte", color: "#6aaa72", healthScore: 91, arr: "$12.4M", burnRate: "$380K/mo",
    runway: 38, growth: 18, burnAccel: -3, status: "healthy", nrr: "124%", employees: 41, stage: "Series B",
    signals: [
      { type: "positive", message: "NRR held at 124% for 3rd consecutive quarter" },
      { type: "positive", message: "Gross margin expanded 200bps to 81%" },
      { type: "warning", message: "Sales cycle elongating — enterprise deals at 48 day avg" },
    ],
    trend: [
      { month: "Oct", arr: 8200, burn: 310, cash: 18400 },
      { month: "Nov", arr: 9100, burn: 320, cash: 18100 },
      { month: "Dec", arr: 10200, burn: 335, cash: 17700 },
      { month: "Jan", arr: 11100, burn: 360, cash: 17300 },
      { month: "Feb", arr: 11800, burn: 375, cash: 16900 },
      { month: "Mar", arr: 12400, burn: 380, cash: 14400 },
    ],
    cohortBenchmark: { medianGrowth: 12, medianBurn: 420, medianRunway: 28 },
  },
  {
    id: "aegis", name: "Aegis", color: "#4a90b8", healthScore: 84, arr: "$8.2M", burnRate: "$290K/mo",
    runway: 26, growth: 14, burnAccel: 5, status: "healthy", nrr: "118%", employees: 28, stage: "Series A",
    signals: [
      { type: "positive", message: "DoD contract renewal secured — $2.1M TCV" },
      { type: "warning", message: "Burn rate ticked up 5% MoM on hiring acceleration" },
      { type: "positive", message: "Pipeline coverage ratio at 4.2× — healthy signal" },
    ],
    trend: [
      { month: "Oct", arr: 5100, burn: 240, cash: 9200 },
      { month: "Nov", arr: 5800, burn: 250, cash: 8900 },
      { month: "Dec", arr: 6400, burn: 265, cash: 8600 },
      { month: "Jan", arr: 7100, burn: 275, cash: 8300 },
      { month: "Feb", arr: 7700, burn: 280, cash: 7900 },
      { month: "Mar", arr: 8200, burn: 290, cash: 7600 },
    ],
    cohortBenchmark: { medianGrowth: 11, medianBurn: 320, medianRunway: 24 },
  },
  {
    id: "carlota-jo", name: "Carlota Jo", color: "#c45a4a", healthScore: 62, arr: "$1.8M", burnRate: "$220K/mo",
    runway: 9, growth: 8, burnAccel: 28, status: "critical", nrr: "96%", employees: 14, stage: "Seed",
    signals: [
      { type: "critical", message: "Runway compressed to 9 months — immediate action required" },
      { type: "critical", message: "Burn rate accelerated 28% MoM — root cause: hiring spike" },
      { type: "warning", message: "NRR below 100% indicates net churn — customer success review needed" },
    ],
    trend: [
      { month: "Oct", arr: 1400, burn: 140, cash: 3100 },
      { month: "Nov", arr: 1500, burn: 155, cash: 2900 },
      { month: "Dec", arr: 1600, burn: 165, cash: 2700 },
      { month: "Jan", arr: 1700, burn: 185, cash: 2500 },
      { month: "Feb", arr: 1750, burn: 200, cash: 2200 },
      { month: "Mar", arr: 1800, burn: 220, cash: 2000 },
    ],
    cohortBenchmark: { medianGrowth: 12, medianBurn: 160, medianRunway: 18 },
  },
  {
    id: "vessels", name: "Vessels", color: "#d4a054", healthScore: 78, arr: "$4.2M", burnRate: "$195K/mo",
    runway: 22, growth: 11, burnAccel: 8, status: "watch", nrr: "108%", employees: 22, stage: "Series A",
    signals: [
      { type: "warning", message: "Revenue growth decelerated from 18% to 11% MoM" },
      { type: "positive", message: "Gross margin strong at 74% — above cohort median" },
      { type: "warning", message: "Two key enterprise accounts up for renewal in Q2" },
    ],
    trend: [
      { month: "Oct", arr: 2800, burn: 160, cash: 5400 },
      { month: "Nov", arr: 3100, burn: 168, cash: 5200 },
      { month: "Dec", arr: 3400, burn: 175, cash: 5000 },
      { month: "Jan", arr: 3700, burn: 182, cash: 4800 },
      { month: "Feb", arr: 3950, burn: 188, cash: 4500 },
      { month: "Mar", arr: 4200, burn: 195, cash: 4300 },
    ],
    cohortBenchmark: { medianGrowth: 13, medianBurn: 210, medianRunway: 20 },
  },
];

function HealthBar({ score, status }: { score: number; status: string }) {
  const color = status === "healthy" ? "#6aaa72" : status === "watch" ? "#d4a054" : "#c45a4a";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
        <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function PortfolioIntelligencePage() {
  const __pageMeta = usePageMeta({ title: "Portfolio Intelligence — SZL Fund Intelligence", description: "Real-time portfolio company health monitoring and early warning system." });
  const [selectedId, setSelectedId] = useState("carlota-jo");
  const company = COMPANIES.find(c => c.id === selectedId) ?? COMPANIES[0];
  const criticals = COMPANIES.filter(c => c.status === "critical").length;
  const watches = COMPANIES.filter(c => c.status === "watch").length;

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#080b10] text-white">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-6">
              <Link href="/fund"><button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70"><ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence</button></Link>
              <ChevronRight className="h-3 w-3 text-white/20" />
              <span className="text-[11px] text-white/60">Portfolio Intelligence</span>
            </div>
  
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6aaa72]/15">
                <Activity className="h-4.5 w-4.5 text-[#6aaa72]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Portfolio Company Financial Intelligence</h1>
                <p className="text-xs text-white/40">Real-time health monitoring · early warning signals · cohort benchmarking</p>
              </div>
            </div>
  
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { label: "Portfolio Companies", value: "6", color: "#4a90b8" },
                { label: "Critical Alerts", value: String(criticals), color: "#c45a4a" },
                { label: "Watch List", value: String(watches), color: "#d4a054" },
                { label: "Avg Health Score", value: "78/100", color: "#6aaa72" },
              ].map(m => (
                <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-2xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
  
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-4 space-y-2">
                {COMPANIES.map(c => (
                  <button key={c.id} onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${selectedId === c.id ? "border-[#6aaa72]/40 bg-[#6aaa72]/[0.04]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{c.name}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${
                        c.status === "healthy" ? "text-[#6aaa72] border-[#6aaa72]/20 bg-[#6aaa72]/10" :
                        c.status === "watch" ? "text-[#d4a054] border-[#d4a054]/20 bg-[#d4a054]/10" :
                        "text-[#c45a4a] border-[#c45a4a]/20 bg-[#c45a4a]/10"
                      }`}>{c.status}</span>
                    </div>
                    <div className="text-[10px] text-white/40 mb-2">{c.stage} · {c.arr} ARR</div>
                    <HealthBar score={c.healthScore} status={c.status} />
                  </button>
                ))}
              </div>
  
              <div className="col-span-8 space-y-4">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{company.name}</h2>
                      <div className="text-xs text-white/40">{company.stage} · {company.employees} employees</div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "ARR", value: company.arr },
                        { label: "Burn", value: company.burnRate },
                        { label: "Runway", value: `${company.runway}mo` },
                        { label: "NRR", value: company.nrr },
                      ].map(s => (
                        <div key={s.label} className="text-center rounded-xl bg-white/[0.03] px-3 py-2">
                          <div className="text-sm font-semibold text-white">{s.value}</div>
                          <div className="text-[9px] text-white/35">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  <div className="h-44 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={company.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                        <Line type="monotone" dataKey="arr" name="ARR ($K)" stroke={company.color} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="burn" name="Burn ($K)" stroke="#c45a4a" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
  
                  <div className="space-y-2">
                    {company.signals.map((s, i) => (
                      <div key={i} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${
                        s.type === "critical" ? "border-[#c45a4a]/20 bg-[#c45a4a]/[0.04]" :
                        s.type === "warning" ? "border-[#d4a054]/20 bg-[#d4a054]/[0.04]" :
                        "border-[#6aaa72]/20 bg-[#6aaa72]/[0.04]"
                      }`}>
                        {s.type === "positive" ? <CheckCircle2 className="h-3.5 w-3.5 text-[#6aaa72] flex-shrink-0 mt-0.5" /> :
                         s.type === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-[#d4a054] flex-shrink-0 mt-0.5" /> :
                         <AlertTriangle className="h-3.5 w-3.5 text-[#c45a4a] flex-shrink-0 mt-0.5" />}
                        <span className="text-xs text-white/70">{s.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
  
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="text-xs font-semibold text-white/50 mb-4">vs. Cohort Benchmark ({company.stage})</div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "MoM Growth", company: `${company.growth}%`, benchmark: `${company.cohortBenchmark.medianGrowth}%`, better: company.growth >= company.cohortBenchmark.medianGrowth },
                      { label: "Monthly Burn", company: `$${(parseInt(company.burnRate.replace(/\D/g, ""), 10)).toLocaleString()}K`, benchmark: `$${company.cohortBenchmark.medianBurn}K`, better: parseInt(company.burnRate.replace(/\D/g, ""), 10) <= company.cohortBenchmark.medianBurn },
                      { label: "Runway", company: `${company.runway}mo`, benchmark: `${company.cohortBenchmark.medianRunway}mo`, better: company.runway >= company.cohortBenchmark.medianRunway },
                    ].map(b => (
                      <div key={b.label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                        <div className="text-[10px] text-white/40 mb-2">{b.label}</div>
                        <div className="flex items-end justify-between">
                          <div>
                            <div className={`text-sm font-bold ${b.better ? "text-[#6aaa72]" : "text-[#c45a4a]"}`}>{b.company}</div>
                            <div className="text-[9px] text-white/30">This company</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-white/50">{b.benchmark}</div>
                            <div className="text-[9px] text-white/30">Cohort median</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </m.div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
