import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { BarChart3, ArrowLeft, ChevronRight, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line, Legend,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PEER_COMPARISON = [
  { metric: "Net IRR", szl: 28.4, median: 14.2, top25: 22.1 },
  { metric: "TVPI", szl: 2.10, median: 1.42, top25: 1.75 },
  { metric: "DPI", szl: 0.62, median: 0.38, top25: 0.55 },
  { metric: "RVPI", szl: 1.48, median: 1.04, top25: 1.20 },
];

const IRR_VS_PEERS = [
  { vintage: "2020", szl: null, median: 18.2, top25: 26.4 },
  { vintage: "2021", szl: null, median: 14.8, top25: 22.1 },
  { vintage: "2022", szl: null, median: 12.4, top25: 18.9 },
  { vintage: "2023 (SZL)", szl: 28.4, median: 11.2, top25: 17.8 },
];

const ATTRIBUTION = [
  { company: "KORA", contribution: 9.2, type: "IRR Attribution (pp)" },
  { company: "PARAGON", contribution: 5.8, type: "IRR Attribution (pp)" },
  { company: "DOMAINE", contribution: 4.1, type: "IRR Attribution (pp)" },
  { company: "Counsel", contribution: 4.8, type: "IRR Attribution (pp)" },
  { company: "SEXTANT", contribution: 3.2, type: "IRR Attribution (pp)" },
  { company: "Carlota Jo", contribution: 1.3, type: "IRR Attribution (pp)" },
];

const PME_DATA = [
  { period: "Q1 2025", pme: 1.12, sp500: 1.0 },
  { period: "Q2 2025", pme: 1.18, sp500: 1.04 },
  { period: "Q3 2025", pme: 1.24, sp500: 1.06 },
  { period: "Q4 2025", pme: 1.29, sp500: 1.08 },
  { period: "Q1 2026", pme: 1.34, sp500: 1.09 },
];

const RADAR_DATA = [
  { subject: "Net IRR", szl: 95, benchmark: 60 },
  { subject: "TVPI", szl: 90, benchmark: 55 },
  { subject: "DPI", szl: 80, benchmark: 58 },
  { subject: "Loss Ratio", szl: 92, benchmark: 65 },
  { subject: "RVPI", szl: 88, benchmark: 62 },
  { subject: "Time to DPI", szl: 78, benchmark: 55 },
];

export default function BenchmarkingPage() {
  const __pageMeta = usePageMeta({ title: "Fund Benchmarking — SZL Fund Intelligence", description: "Cambridge Associates, PitchBook, and peer cohort comparison with PME calculations." });
  const [tab, setTab] = useState<"peer" | "attribution" | "pme">("peer");

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
              <span className="text-[11px] text-white/60">Fund Benchmarking</span>
            </div>
  
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c8953c]/15">
                <BarChart3 className="h-4.5 w-4.5 text-[#c8953c]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Fund Benchmarking Engine</h1>
                <p className="text-xs text-white/40">Cambridge Associates · PitchBook peer groups · PME calculations · attribution analysis</p>
              </div>
            </div>
  
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { label: "vs. Vintage Median IRR", value: "+14.2pp", color: "#6aaa72" },
                { label: "Quartile Ranking", value: "Top 20%", color: "#d4a054" },
                { label: "Public Market Equivalent", value: "1.34×", color: "#4a90b8" },
                { label: "Cambridge Assoc. Rank", value: "Top Quartile", color: "#8b7ac8" },
              ].map(m => (
                <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Award className="h-3.5 w-3.5" style={{ color: m.color }} />
                    <div className="text-xl font-semibold" style={{ color: m.color }}>{m.value}</div>
                  </div>
                  <div className="text-xs text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
  
            <div className="flex gap-2 mb-5">
              {(["peer", "attribution", "pme"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all ${tab === t ? "bg-[#c8953c] text-black" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
                  {t === "peer" ? "Peer Comparison" : t === "attribution" ? "Attribution" : "PME Analysis"}
                </button>
              ))}
            </div>
  
            {tab === "peer" && (
              <div className="grid grid-cols-2 gap-5">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="text-xs font-semibold text-white/50 mb-4">Key Metrics vs. Vintage 2023 Cohort</div>
                  <div className="space-y-4">
                    {PEER_COMPARISON.map(p => (
                      <div key={p.metric}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/60">{p.metric}</span>
                          <div className="flex gap-4 text-[10px]">
                            <span className="text-white/30">Median: {p.median}</span>
                            <span className="text-white/30">Top 25%: {p.top25}</span>
                            <span className="font-bold text-[#6aaa72]">SZL: {p.szl}</span>
                          </div>
                        </div>
                        <div className="relative h-2 rounded-full bg-white/[0.06]">
                          <div className="absolute h-2 rounded-full bg-white/20" style={{ width: `${Math.min((p.top25 / (p.szl * 1.2)) * 100, 100)}%` }} />
                          <div className="absolute h-2 rounded-full bg-[#c8953c]/60" style={{ width: `${Math.min((p.median / (p.szl * 1.2)) * 100, 100)}%` }} />
                          <div className="absolute h-2 rounded-full bg-[#6aaa72]" style={{ width: `${Math.min((p.szl / (p.szl * 1.2)) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="text-xs font-semibold text-white/50 mb-4">Performance Radar vs. Peer Median</div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={RADAR_DATA}>
                        <PolarGrid stroke="rgba(255,255,255,0.06)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }} />
                        <Radar name="SZL Fund I" dataKey="szl" stroke="#6aaa72" fill="#6aaa72" fillOpacity={0.15} strokeWidth={1.5} />
                        <Radar name="Peer Median" dataKey="benchmark" stroke="#c8953c" fill="#c8953c" fillOpacity={0.08} strokeWidth={1} strokeDasharray="4 2" />
                        <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                        <Legend iconType="circle" formatter={(v) => <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>{v}</span>} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="text-xs font-semibold text-white/50 mb-4">Net IRR by Vintage — SZL vs. Cambridge Associates Benchmarks</div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={IRR_VS_PEERS} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="vintage" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} unit="%" />
                        <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number) => [`${v}%`, ""]} />
                        <Bar dataKey="median" name="CA Median IRR" fill="#4a90b8" fillOpacity={0.6} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="top25" name="CA Top Quartile" fill="#c8953c" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="szl" name="SZL Fund I" fill="#6aaa72" fillOpacity={0.9} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
  
            {tab === "attribution" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="text-xs font-semibold text-white/50 mb-4">IRR Attribution by Portfolio Company (pp contribution to fund IRR)</div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ATTRIBUTION} layout="vertical" barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} unit="pp" />
                        <YAxis dataKey="company" type="category" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} width={90} />
                        <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number) => [`+${v}pp`, "IRR contribution"]} />
                        <Bar dataKey="contribution" name="IRR contribution (pp)" fill="#c8953c" fillOpacity={0.8} radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-xl border border-[#c8953c]/20 bg-[#c8953c]/[0.04] p-4">
                  <div className="text-xs font-semibold text-white mb-2">Attribution Insight</div>
                  <p className="text-xs text-white/60">Lyte accounts for 32.4% of fund IRR contribution, driven by its Series B valuation mark at $148M. Counsel is the second-highest contributor despite being the newest investment — the RegulaAI strategic synergy is generating early outsized returns. Carlota Jo drag has been contained at 1.3pp through proactive intervention, compared to peer fund write-off average of 4.2pp at this stage.</p>
                </div>
              </div>
            )}
  
            {tab === "pme" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="text-xs font-semibold text-white/50 mb-1">Public Market Equivalent (Long-Nickels PME)</div>
                  <div className="text-[10px] text-white/30 mb-4">Fund I vs. S&P 500 — PME &gt; 1.0 means outperformance vs. public market</div>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={PME_DATA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                        <YAxis domain={[0.95, 1.45]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                        <Line type="monotone" dataKey="pme" name="SZL PME" stroke="#6aaa72" strokeWidth={2.5} dot={{ fill: "#6aaa72", r: 4 }} />
                        <Line type="monotone" dataKey="sp500" name="S&P 500 Base (1.0)" stroke="#4a90b8" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                        <Legend iconType="circle" formatter={(v) => <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>{v}</span>} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Current PME", value: "1.34×", desc: "vs. S&P 500 — consistent outperformance since inception" },
                    { label: "Direct Alpha", value: "+14.2%", desc: "Annualized excess return vs. public benchmark" },
                    { label: "vs. Nasdaq", value: "1.22×", desc: "PME relative to tech-heavy public index" },
                  ].map(f => (
                    <div key={f.label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                      <div className="text-xl font-semibold text-[#6aaa72] mb-1">{f.value}</div>
                      <div className="text-xs font-semibold text-white">{f.label}</div>
                      <div className="text-[10px] text-white/40 mt-1">{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </m.div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
