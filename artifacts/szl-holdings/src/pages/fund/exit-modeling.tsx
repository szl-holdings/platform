import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState, useMemo } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { TrendingUp, ArrowLeft, ChevronRight, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "x-requested-with": "XMLHttpRequest" },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  const body = await res.json();
  return body.data as T;
}

type PortfolioFinancial = {
  id: number;
  companyName: string;
  companySlug: string;
  revenue: string | null;
  burnRate: string | null;
  cashAndEquivalents: string | null;
  runwayMonths: string | null;
  periodLabel: string | null;
};

type NavRecord = {
  id: number;
  navDate: string;
  totalNavCents: number;
  carryAccruedCents: number;
  grossIrr: string | null;
  netIrr: string | null;
  tvpi: string | null;
  dpi: string | null;
};

const PORTFOLIO = [
  { id: "lyte", name: "Lyte", color: "#6aaa72", costBasis: 12.4, currentFMV: 42.0, arrGrowth: 18, stage: "Series B", scenarios: { bear: 280, base: 440, bull: 680 }, timing: "18–30 mo", exitType: "Strategic Acquisition" },
  { id: "aegis", name: "Aegis", color: "#4a90b8", costBasis: 6.2, currentFMV: 18.0, arrGrowth: 14, stage: "Series A", scenarios: { bear: 85, base: 145, bull: 240 }, timing: "24–36 mo", exitType: "Strategic / Growth Round" },
  { id: "vessels", name: "Vessels", color: "#d4a054", costBasis: 3.8, currentFMV: 11.5, arrGrowth: 11, stage: "Series A", scenarios: { bear: 45, base: 78, bull: 130 }, timing: "30–42 mo", exitType: "Strategic Acquisition" },
  { id: "terra", name: "Terra", color: "#c8953c", costBasis: 5.1, currentFMV: 14.2, arrGrowth: 13, stage: "Series A", scenarios: { bear: 52, base: 96, bull: 165 }, timing: "24–36 mo", exitType: "IPO / Strategic" },
  { id: "prism-counsel", name: "PRISM Counsel", color: "#8b7ac8", costBasis: 2.4, currentFMV: 8.8, arrGrowth: 19, stage: "Seed+", scenarios: { bear: 28, base: 55, bull: 105 }, timing: "36–48 mo", exitType: "Strategic Acquisition" },
  { id: "carlota-jo", name: "Carlota Jo", color: "#c45a4a", costBasis: 1.8, currentFMV: 3.6, arrGrowth: 8, stage: "Seed", scenarios: { bear: 8, base: 15, bull: 28 }, timing: "48–60 mo", exitType: "Strategic / Write-off risk" },
];

function runMonteCarlo(costBasis: number, baseReturn: number, simCount = 1000): number[] {
  const results: number[] = [];
  const volatility = 0.35;
  for (let i = 0; i < simCount; i++) {
    const u1 = Math.random(), u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const randomReturn = baseReturn * Math.exp((volatility * z) - (0.5 * volatility * volatility));
    results.push(costBasis * randomReturn);
  }
  return results.sort((a, b) => a - b);
}

export default function ExitModelingPage() {
  const __pageMeta = usePageMeta({ title: "Exit Modeling — SZL Fund Intelligence", description: "Monte Carlo exit simulation across the portfolio." });
  const [selected, setSelected] = useState("lyte");
  const [simCount] = useState(2000);
  const [running, setRunning] = useState(false);
  const [simSeed, setSimSeed] = useState(0);

  const { data: portfolioFinancials } = useStandardQuery({
    queryKey: ["fund-ops", "portfolio-financials"],
    queryFn: () => apiFetch<PortfolioFinancial[]>("/fund-ops/portfolio-financials"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: navRecords } = useStandardQuery({
    queryKey: ["fund-ops", "nav-records"],
    queryFn: () => apiFetch<NavRecord[]>("/fund-ops/nav-records"),
    staleTime: 60_000,
  });

  const liveCompanyCount = portfolioFinancials && portfolioFinancials.length > 0
    ? new Set(portfolioFinancials.map(f => f.companySlug)).size
    : PORTFOLIO.length;

  const latestNav = navRecords && navRecords.length > 0
    ? navRecords[0]
    : null;

  const company = PORTFOLIO.find(p => p.id === selected) ?? PORTFOLIO[0];
  const baseReturn = company.scenarios.base / company.costBasis;

  const mcResults = useMemo(() => runMonteCarlo(company.costBasis, baseReturn, simCount), [company, simCount, simSeed]);
  const p10 = mcResults[Math.floor(simCount * 0.1)];
  const p50 = mcResults[Math.floor(simCount * 0.5)];
  const p90 = mcResults[Math.floor(simCount * 0.9)];

  const histData: Array<{ range: string; count: number }> = [];
  const buckets = 20;
  const min = mcResults[0], max = mcResults[mcResults.length - 1];
  const step = (max - min) / buckets;
  for (let i = 0; i < buckets; i++) {
    const lo = min + i * step, hi = lo + step;
    const label = lo >= 1000 ? `$${(lo / 1000).toFixed(0)}B` : `$${lo.toFixed(0)}M`;
    histData.push({ range: label, count: mcResults.filter(v => v >= lo && v < hi).length });
  }

  const portfolioSummary = PORTFOLIO.map(p => ({
    name: p.name, color: p.color,
    bear: p.scenarios.bear, base: p.scenarios.base, bull: p.scenarios.bull,
    moic: (p.scenarios.base / p.costBasis).toFixed(1),
  }));

  const totalBase = PORTFOLIO.reduce((s, p) => s + p.scenarios.base, 0);
  const totalBear = PORTFOLIO.reduce((s, p) => s + p.scenarios.bear, 0);
  const totalBull = PORTFOLIO.reduce((s, p) => s + p.scenarios.bull, 0);

  const handleRun = () => { setRunning(true); setSimSeed(s => s + 1); setTimeout(() => setRunning(false), 1500); };

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}B` : `$${n.toFixed(0)}M`;

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
              <span className="text-[11px] text-white/60">Exit Modeling</span>
            </div>
  
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c45a4a]/15">
                <TrendingUp className="h-4.5 w-4.5 text-[#c45a4a]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Exit Modeling & Scenario Analysis</h1>
                <p className="text-xs text-white/40">Monte Carlo simulation · {simCount.toLocaleString()} scenarios · {liveCompanyCount} portfolio companies · optimal window identification</p>
              </div>
              <button onClick={handleRun} className="ml-auto flex items-center gap-1.5 rounded-xl bg-[#c45a4a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#c45a4a]/80">
                {running ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Running…</> : <><RefreshCw className="h-3.5 w-3.5" /> Re-run Simulation</>}
              </button>
            </div>
  
            <div className="grid grid-cols-4 gap-3 mb-6">
              {(latestNav ? [
                { label: "Portfolio NAV", value: `$${(latestNav.totalNavCents / 100_000_000).toFixed(1)}M`, color: "#d4a054" },
                { label: "Net IRR", value: latestNav.netIrr ? `${parseFloat(latestNav.netIrr).toFixed(1)}%` : "—", color: "#6aaa72" },
                { label: "TVPI", value: latestNav.tvpi ? `${parseFloat(latestNav.tvpi).toFixed(2)}×` : `${(totalBase / PORTFOLIO.reduce((s, p) => s + p.costBasis, 0)).toFixed(1)}×`, color: "#8b7ac8" },
                { label: "DPI", value: latestNav.dpi ? `${parseFloat(latestNav.dpi).toFixed(2)}×` : "—", color: "#4a90b8" },
              ] : [
                { label: "Portfolio Bear Case", value: fmt(totalBear), color: "#c45a4a" },
                { label: "Portfolio Base Case", value: fmt(totalBase), color: "#d4a054" },
                { label: "Portfolio Bull Case", value: fmt(totalBull), color: "#6aaa72" },
                { label: "Avg Portfolio MOIC", value: `${(totalBase / PORTFOLIO.reduce((s, p) => s + p.costBasis, 0)).toFixed(1)}×`, color: "#8b7ac8" },
              ]).map(m => (
                <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
  
            <div className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
              <div className="text-xs font-semibold text-white/50 mb-4">Portfolio Exit Scenarios — Bear / Base / Bull</div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={portfolioSummary} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickFormatter={v => `$${v}M`} />
                    <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number) => [`$${v}M`, ""]} />
                    <Bar dataKey="bear" name="Bear" fill="#c45a4a" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="base" name="Base" fill="#d4a054" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="bull" name="Bull" fill="#6aaa72" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
  
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-4 space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-2">Select Company</div>
                {PORTFOLIO.map(p => (
                  <button key={p.id} onClick={() => setSelected(p.id)}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${selected === p.id ? "border-[#c45a4a]/40 bg-[#c45a4a]/[0.05]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{p.name}</span>
                      <span className="text-xs font-bold text-[#d4a054]">{((p.scenarios.base / p.costBasis)).toFixed(1)}× MOIC</span>
                    </div>
                    <div className="text-[10px] text-white/40">{p.stage} · {p.exitType}</div>
                    <div className="text-[10px] text-white/30">{p.timing}</div>
                  </button>
                ))}
              </div>
  
              <div className="col-span-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{company.name} — Monte Carlo Distribution</h3>
                    <div className="text-xs text-white/40">{simCount.toLocaleString()} simulations · {company.exitType}</div>
                  </div>
                </div>
  
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "P10 (Bear)", value: fmt(p10), color: "#c45a4a" },
                    { label: "P50 (Median)", value: fmt(p50), color: "#d4a054" },
                    { label: "P90 (Bull)", value: fmt(p90), color: "#6aaa72" },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl bg-white/[0.03] p-3 text-center">
                      <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[10px] text-white/40">{s.label}</div>
                    </div>
                  ))}
                </div>
  
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histData} barSize={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="range" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8 }} interval={3} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="count" name="Simulations" fill={company.color} fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
  
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Cost Basis", value: `$${company.costBasis}M` },
                    { label: "Current FMV", value: `$${company.currentFMV}M` },
                    { label: "Optimal Exit", value: company.timing },
                  ].map(f => (
                    <div key={f.label} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
                      <div className="text-sm font-semibold text-white">{f.value}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{f.label}</div>
                    </div>
                  ))}
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
