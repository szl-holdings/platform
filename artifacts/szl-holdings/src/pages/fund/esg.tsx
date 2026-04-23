import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Leaf, ArrowLeft, ChevronRight, Users, TrendingUp,
  Download, Star, AlertCircle, CheckCircle2, Globe,
  Heart, ShieldCheck,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

type EsgScore = {
  company: string;
  color: string;
  environmental: number;
  social: number;
  governance: number;
  composite: number;
  trend: "improving" | "stable" | "declining";
  carbonTonnes: number;
  deiScore: number;
  boardDiversity: number;
  employeeSatisfaction: number;
  communityImpact: number;
  highlights: string[];
  risks: string[];
  sector: string;
};

const ESG_SCORES: EsgScore[] = [
  {
    company: "SEXTANT", color: "#4a90b8", sector: "Maritime Tech",
    environmental: 82, social: 74, governance: 88, composite: 81,
    trend: "improving",
    carbonTonnes: 142, deiScore: 72, boardDiversity: 40, employeeSatisfaction: 83, communityImpact: 68,
    highlights: ["ISO 14001 certified operations", "Fleet electrification roadmap published", "40% board gender diversity"],
    risks: ["Shipping route carbon exposure", "Supplier chain emissions not fully tracked"],
  },
  {
    company: "PARAGON", color: "#c45a4a", sector: "Defense Tech",
    environmental: 58, social: 71, governance: 90, composite: 73,
    trend: "stable",
    carbonTonnes: 218, deiScore: 65, boardDiversity: 33, employeeSatisfaction: 79, communityImpact: 72,
    highlights: ["SOC 2 Type II & ISO 27001", "US DoD ethics framework compliance", "Veteran hiring program (18%)"],
    risks: ["Dual-use technology governance", "Classified work limits ESG disclosure"],
  },
  {
    company: "DOMAINE", color: "#c8953c", sector: "PropTech",
    environmental: 76, social: 80, governance: 83, composite: 80,
    trend: "improving",
    carbonTonnes: 64, deiScore: 81, boardDiversity: 50, employeeSatisfaction: 87, communityImpact: 75,
    highlights: ["50/50 gender board parity", "Remote-first policy reduces commute emissions", "Housing affordability analytics published openly"],
    risks: ["Real estate market enables gentrification", "AVM bias in low-income neighborhoods"],
  },
  {
    company: "KORA", color: "#6aaa72", sector: "Media Tech",
    environmental: 88, social: 77, governance: 79, composite: 81,
    trend: "improving",
    carbonTonnes: 38, deiScore: 78, boardDiversity: 43, employeeSatisfaction: 91, communityImpact: 82,
    highlights: ["Carbon-neutral since Q4 2025", "Creator diversity program (42% non-white creators)", "Transparent algorithmic audit published"],
    risks: ["Content moderation gaps", "Data privacy concerns in audience genome"],
  },
  {
    company: "Counsel", color: "#d4a054", sector: "LegalTech",
    environmental: 72, social: 83, governance: 85, composite: 80,
    trend: "stable",
    carbonTonnes: 28, deiScore: 84, boardDiversity: 56, employeeSatisfaction: 88, communityImpact: 90,
    highlights: ["Pro bono legal AI access for nonprofits", "56% women in leadership", "Paperless-first operations"],
    risks: ["AI hallucination risk in legal advice", "Data residency compliance in EU"],
  },
  {
    company: "Carlota Jo", color: "#8b7ac8", sector: "Consulting",
    environmental: 80, social: 92, governance: 76, composite: 83,
    trend: "improving",
    carbonTonnes: 14, deiScore: 94, boardDiversity: 67, employeeSatisfaction: 94, communityImpact: 88,
    highlights: ["100% BIPOC-owned business", "B-Corp certification in progress", "Community reinvestment program"],
    risks: ["Small team limits formal governance", "Revenue concentration risk"],
  },
];

const PORTFOLIO_ESG_AVG = {
  environmental: Math.round(ESG_SCORES.reduce((s, c) => s + c.environmental, 0) / ESG_SCORES.length),
  social: Math.round(ESG_SCORES.reduce((s, c) => s + c.social, 0) / ESG_SCORES.length),
  governance: Math.round(ESG_SCORES.reduce((s, c) => s + c.governance, 0) / ESG_SCORES.length),
  composite: Math.round(ESG_SCORES.reduce((s, c) => s + c.composite, 0) / ESG_SCORES.length),
};

const TREND_COLORS = { improving: "#6aaa72", stable: "#d4a054", declining: "#c45a4a" };

const RADAR_DATA = (company: EsgScore) => [
  { axis: "Environmental", score: company.environmental },
  { axis: "Social", score: company.social },
  { axis: "Governance", score: company.governance },
  { axis: "DEI", score: company.deiScore },
  { axis: "Community", score: company.communityImpact },
];

const COMPARISON_DATA = ESG_SCORES.map(c => ({
  name: c.company,
  Environmental: c.environmental,
  Social: c.social,
  Governance: c.governance,
}));

function ScoreGauge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="relative mx-auto mb-2" style={{ width: 72, height: 72 }}>
        <svg viewBox="0 0 72 72" className="rotate-[-90deg]">
          <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="36" cy="36" r="28" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(value / 100) * 2 * Math.PI * 28} ${2 * Math.PI * 28}`}
            strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-white">{value}</span>
        </div>
      </div>
      <div className="text-[10px] text-white/40">{label}</div>
    </div>
  );
}

export default function EsgPage() {
  const __pageMeta = usePageMeta({
    title: "ESG & Impact Scoring — SZL Holdings Fund",
    description: "Per-company ESG scoring, DEI tracking, carbon metrics, and LP-ready ESG report generation across the portfolio.",
    canonical: "https://szlholdings.com/fund/esg",
  });

  const [tab, setTab] = useState<"overview" | "company" | "report">("overview");
  const [selected, setSelected] = useState<EsgScore>(ESG_SCORES[0]);

  const totalCarbon = ESG_SCORES.reduce((s, c) => s + c.carbonTonnes, 0);

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#080b10] text-white">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
  
            <div className="flex items-center gap-3 mb-6">
              <Link href="/fund">
                <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence
                </button>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-white/20" />
              <span className="text-xs text-white/60">ESG & Impact</span>
            </div>
  
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6aaa72]/15">
                    <Leaf className="h-3.5 w-3.5 text-[#6aaa72]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6aaa72]">Responsible Investing</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">ESG & Impact Scoring</h1>
                <p className="text-white/50 text-sm max-w-xl">
                  Environmental, social, and governance scoring across the portfolio with DEI metrics, carbon tracking, and LP-ready ESG reporting.
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-[#6aaa72] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#6aaa72]/90 transition-colors">
                <Download className="h-3.5 w-3.5" /> Export LP Report
              </button>
            </div>
  
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Portfolio ESG Score", value: `${String(PORTFOLIO_ESG_AVG.composite)}/100`, icon: Star, color: "#6aaa72", sub: "Weighted avg." },
                { label: "Avg. DEI Score", value: `${String(Math.round(ESG_SCORES.reduce((s, c) => s + c.deiScore, 0) / ESG_SCORES.length))}/100`, icon: Users, color: "#8b7ac8", sub: "Diversity & Inclusion" },
                { label: "Total Carbon Footprint", value: `${totalCarbon.toLocaleString()} t`, icon: Globe, color: "#4a90b8", sub: "CO₂e / year (portfolio)" },
                { label: "Companies Improving", value: `${ESG_SCORES.filter(c => c.trend === "improving").length}/${ESG_SCORES.length}`, icon: TrendingUp, color: "#d4a054", sub: "ESG trend YoY" },
              ].map(item => (
                <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20" style={{ color: item.color }}>
                      <item.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-white">{item.value}</div>
                  <div className="text-xs text-white/40 mt-1">{item.label}</div>
                  <div className="text-[10px] text-white/25 mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
  
            <div className="flex gap-1 mb-6">
              {(["overview", "company", "report"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${tab === t ? "bg-white/[0.08] text-white" : "text-white/35 hover:text-white/60"}`}>
                  {t === "overview" ? "Portfolio Overview" : t === "company" ? "Company Drill-Down" : "LP Report Preview"}
                </button>
              ))}
            </div>
  
            <AnimatePresence mode="wait">
              {tab === "overview" && (
                <m.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">ESG Score Comparison — Portfolio</h3>
                    <p className="text-xs text-white/40 mb-5">Environmental, Social & Governance scores by portfolio company</p>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={COMPARISON_DATA} barSize={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
                        <Bar dataKey="Environmental" fill="#6aaa72" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Social" fill="#8b7ac8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Governance" fill="#4a90b8" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
  
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {ESG_SCORES.map((company, i) => (
                      <m.div key={company.company} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <button onClick={() => { setSelected(company); setTab("company"); }} className="w-full text-left">
                          <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="text-sm font-semibold text-white">{company.company}</div>
                                <div className="text-[10px] text-white/35 mt-0.5">{company.sector}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xl font-semibold text-white">{company.composite}</div>
                                <div className="text-[10px]" style={{ color: TREND_COLORS[company.trend] }}>{company.trend}</div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: "E", value: company.environmental, color: "#6aaa72" },
                                { label: "S", value: company.social, color: "#8b7ac8" },
                                { label: "G", value: company.governance, color: "#4a90b8" },
                              ].map(p => (
                                <div key={p.label} className="text-center rounded-lg bg-white/[0.03] py-2">
                                  <div className="text-sm font-semibold text-white">{p.value}</div>
                                  <div className="text-[10px] font-semibold mt-0.5" style={{ color: p.color }}>{p.label}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-white/35 group-hover:text-white/60 transition-colors">
                              View Details <ChevronRight className="h-3 w-3" />
                            </div>
                          </div>
                        </button>
                      </m.div>
                    ))}
                  </div>
                </m.div>
              )}
  
              {tab === "company" && (
                <m.div key="company" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {ESG_SCORES.map(c => (
                      <button key={c.company} onClick={() => setSelected(c)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${selected.company === c.company ? "text-white" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.07]"}`}
                        style={selected.company === c.company ? { background: `${c.color}25`, color: c.color, border: `1px solid ${c.color}40` } : {}}>
                        {c.company}
                      </button>
                    ))}
                  </div>
  
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-5">
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                        <div className="flex items-center gap-3 mb-5">
                          <h2 className="text-lg font-semibold text-white">{selected.company} — ESG Profile</h2>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{ color: TREND_COLORS[selected.trend], background: `${TREND_COLORS[selected.trend]}15`, border: `1px solid ${TREND_COLORS[selected.trend]}30` }}>
                            {selected.trend}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-4 mb-6">
                          <ScoreGauge value={selected.environmental} label="Environmental" color="#6aaa72" />
                          <ScoreGauge value={selected.social} label="Social" color="#8b7ac8" />
                          <ScoreGauge value={selected.governance} label="Governance" color="#4a90b8" />
                          <ScoreGauge value={selected.deiScore} label="DEI" color="#d4a054" />
                          <ScoreGauge value={selected.communityImpact} label="Community" color="#c45a4a" />
                        </div>
                        <div className="h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={RADAR_DATA(selected)}>
                              <PolarGrid stroke="rgba(255,255,255,0.06)" />
                              <PolarAngleAxis dataKey="axis" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                              <Radar name={selected.company} dataKey="score" stroke={selected.color} fill={selected.color} fillOpacity={0.15} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
  
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-[#6aaa72]/20 bg-[#6aaa72]/[0.04] p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-4 w-4 text-[#6aaa72]" />
                            <span className="text-sm font-semibold text-white">ESG Highlights</span>
                          </div>
                          {selected.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                              <div className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-[#6aaa72]" />
                              <span className="text-xs text-white/60">{h}</span>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/[0.04] p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="h-4 w-4 text-[#d4a054]" />
                            <span className="text-sm font-semibold text-white">ESG Risks</span>
                          </div>
                          {selected.risks.map((r, i) => (
                            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                              <div className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-[#d4a054]" />
                              <span className="text-xs text-white/60">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
  
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-4">Key Metrics</div>
                        <div className="space-y-3">
                          {[
                            { label: "Carbon Footprint", value: `${selected.carbonTonnes.toLocaleString()} tCO₂e`, icon: Globe, color: "#4a90b8" },
                            { label: "DEI Score", value: `${selected.deiScore}/100`, icon: Users, color: "#8b7ac8" },
                            { label: "Board Diversity", value: `${selected.boardDiversity}%`, icon: ShieldCheck, color: "#6aaa72" },
                            { label: "Employee Satisfaction", value: `${selected.employeeSatisfaction}/100`, icon: Heart, color: "#d4a054" },
                            { label: "Community Impact", value: `${selected.communityImpact}/100`, icon: Star, color: "#c45a4a" },
                          ].map(m => (
                            <div key={m.label} className="flex items-center gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/20" style={{ color: m.color }}>
                                <m.icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-white/50">{m.label}</div>
                                <div className="text-sm font-semibold text-white">{m.value}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 mb-3">Composite Score</div>
                        <div className="text-4xl font-semibold text-white mb-1">{selected.composite}<span className="text-xl text-white/30">/100</span></div>
                        <div className="text-xs text-white/40 mb-4">{selected.sector}</div>
                        <div className="h-2 rounded-full bg-white/[0.06]">
                          <div className="h-2 rounded-full transition-all" style={{ width: `${selected.composite}%`, background: selected.color }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-white/30 mt-1.5">
                          <span>0</span><span>Portfolio avg: {PORTFOLIO_ESG_AVG.composite}</span><span>100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
  
              {tab === "report" && (
                <m.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30 mb-2">SZL Holdings Fund II</div>
                      <h2 className="text-2xl font-semibold text-white mb-1">ESG & Impact Annual Report</h2>
                      <div className="text-sm text-white/40">For the year ended December 31, 2025</div>
                    </div>
  
                    <div className="space-y-6">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6aaa72] mb-3">Portfolio ESG Summary</div>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { label: "Avg. Environmental", value: PORTFOLIO_ESG_AVG.environmental, color: "#6aaa72" },
                            { label: "Avg. Social", value: PORTFOLIO_ESG_AVG.social, color: "#8b7ac8" },
                            { label: "Avg. Governance", value: PORTFOLIO_ESG_AVG.governance, color: "#4a90b8" },
                          ].map(p => (
                            <div key={p.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                              <div className="text-2xl font-semibold text-white">{p.value}</div>
                              <div className="text-[10px] text-white/40 mt-1">{p.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
  
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6aaa72] mb-3">Climate & Carbon</div>
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-2xl font-semibold text-white">{totalCarbon.toLocaleString()} tCO₂e</div>
                              <div className="text-xs text-white/40 mt-0.5">Total portfolio carbon footprint</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-[#6aaa72]">1 company carbon-neutral</div>
                              <div className="text-xs text-white/40 mt-0.5">KORA — achieved Q4 2025</div>
                            </div>
                          </div>
                        </div>
                      </div>
  
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6aaa72] mb-3">Diversity, Equity & Inclusion</div>
                        <div className="space-y-2">
                          {ESG_SCORES.map(c => (
                            <div key={c.company} className="flex items-center gap-4">
                              <div className="w-24 text-xs text-white/60 text-right">{c.company}</div>
                              <div className="flex-1 h-2 rounded-full bg-white/[0.06]">
                                <div className="h-2 rounded-full" style={{ width: `${c.deiScore}%`, background: c.color }} />
                              </div>
                              <div className="w-10 text-right text-xs font-semibold text-white">{c.deiScore}</div>
                            </div>
                          ))}
                        </div>
                      </div>
  
                      <div className="border-t border-white/[0.06] pt-5">
                        <p className="text-[10px] text-white/25 leading-relaxed">
                          ESG scores are assessed by SZL Holdings using a proprietary framework aligned with GRI Standards and SASB. 
                          Data is collected from portfolio companies on a quarterly basis. This report is prepared for informational 
                          purposes only and is subject to revision.
                        </p>
                      </div>
                    </div>
  
                    <div className="mt-6 flex justify-center">
                      <button className="flex items-center gap-2 rounded-xl bg-[#6aaa72] px-6 py-2.5 text-xs font-semibold text-black hover:bg-[#6aaa72]/90 transition-colors">
                        <Download className="h-3.5 w-3.5" /> Download Full LP Report (PDF)
                      </button>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
  
          </m.div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
