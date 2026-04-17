import { useEffect, useMemo, useState } from "react";
import { getSubmittedDeals, loadSubmittedDeals, subscribeSubmittedDeals, type SubmittedDeal, type DealAttachmentRef } from "@/lib/dealSubmissions";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Brain, ArrowLeft, Star,
  ChevronRight, Upload, AlertCircle, CheckCircle2,
  Zap, FileText, Target, Paperclip, Download, ExternalLink,
} from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

type Deal = {
  id: string;
  company: string;
  sector: string;
  stage: string;
  askSize: string;
  valuation: string;
  convictionScore: number;
  scores: { team: number; market: number; product: number; traction: number; competitive: number; financials: number };
  status: "screening" | "active" | "passed" | "invested";
  founder: string;
  summary: string;
  risks: string[];
  strengths: string[];
  date: string;
  deckUrl?: string | null;
  attachments?: DealAttachmentRef[];
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const DEALS: Deal[] = [
  {
    id: "d1", company: "NovaStar AI", sector: "Enterprise AI", stage: "Series A", askSize: "$8M", valuation: "$42M",
    convictionScore: 81, founder: "Priya Sharma (ex-Palantir)", date: "Apr 10, 2026",
    scores: { team: 88, market: 85, product: 79, traction: 76, competitive: 72, financials: 68 },
    status: "active",
    summary: "AI-native data infrastructure platform with proprietary embedding pipeline. $1.2M ARR growing 18% MoM. 6 enterprise pilots closing Q2.",
    strengths: ["Founder has 2 prior exits", "Category-defining timing", "Strong NPS (72)"],
    risks: ["Crowded infra market", "Low DPI for lead investors", "Key-man dependency"],
  },
  {
    id: "d2", company: "Meridian Health AI", sector: "HealthTech", stage: "Seed", askSize: "$3M", valuation: "$14M",
    convictionScore: 67, founder: "Dr. James Okon (Stanford MD/MBA)", date: "Apr 3, 2026",
    scores: { team: 82, market: 90, product: 65, traction: 52, competitive: 58, financials: 44 },
    status: "screening",
    summary: "AI-powered clinical decision support. Pre-revenue with 3 hospital LOIs. HIPAA-compliant architecture with FDA pathway scoped.",
    strengths: ["Massive TAM ($40B)", "Credentialed medical team", "Clear regulatory path"],
    risks: ["Pre-revenue risk", "Long sales cycles", "Regulatory uncertainty"],
  },
  {
    id: "d3", company: "PortLogix", sector: "Maritime Tech", stage: "Series A", askSize: "$12M", valuation: "$58M",
    convictionScore: 74, founder: "Andrei Petrov (ex-Maersk CTO)", date: "Mar 28, 2026",
    scores: { team: 80, market: 72, product: 78, traction: 74, competitive: 70, financials: 66 },
    status: "active",
    summary: "Port operations intelligence SaaS. $3.4M ARR, 11 port customers across 4 continents. Strategic overlap with Vessels portfolio.",
    strengths: ["Strong domain moat", "Global customer base", "High switching costs"],
    risks: ["Geopolitical exposure", "Concentrated customers", "Integration complexity"],
  },
  {
    id: "d4", company: "RegulaAI", sector: "LegalTech / RegTech", stage: "Seed+", askSize: "$4M", valuation: "$18M",
    convictionScore: 89, founder: "Sofia Mendez (ex-SEC, Georgetown Law)", date: "Mar 14, 2026",
    scores: { team: 92, market: 88, product: 86, traction: 82, competitive: 84, financials: 76 },
    status: "invested",
    summary: "AI-native regulatory compliance platform. $850K ARR, 22% MoM growth. Won SEC Innovation Lab grant. Complements PRISM Counsel vertical.",
    strengths: ["Regulatory network moat", "Gov't validation", "Cross-sell into PRISM"],
    risks: ["Niche market initially", "Gov't procurement cycles"],
  },
  {
    id: "d5", company: "SkyBridge Drone Logistics", sector: "Autonomous Logistics", stage: "Series A", askSize: "$15M", valuation: "$72M",
    convictionScore: 51, founder: "Marcus Chen (hardware background)", date: "Feb 20, 2026",
    scores: { team: 62, market: 75, product: 58, traction: 46, competitive: 44, financials: 40 },
    status: "passed",
    summary: "Autonomous drone delivery network targeting last-mile logistics. Regulatory still uncertain, $420K ARR from pilots.",
    strengths: ["Interesting category", "Large market potential"],
    risks: ["Regulatory risk is existential", "Capital intensive", "Low traction relative to ask"],
  },
];

const STATUS_COLORS: Record<string, string> = {
  screening: "#d4a054",
  active: "#4a90b8",
  invested: "#6aaa72",
  passed: "#c45a4a",
};

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "#6aaa72" : score >= 65 ? "#d4a054" : "#c45a4a";
  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <circle cx="26" cy="26" r="21" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${(score / 100) * 131.9} 131.9`}
            strokeLinecap="round" transform="rotate(-90 26 26)" />
        </svg>
        <span className="absolute text-[13px] font-bold text-white">{score}</span>
      </div>
      <div className="text-[9px] text-white/40 mt-1">{label}</div>
    </div>
  );
}

function DealCard({ deal, selected, onClick }: { deal: Deal; selected: boolean; onClick: () => void }) {
  const color = STATUS_COLORS[deal.status];
  const scoreColor = deal.convictionScore >= 80 ? "#6aaa72" : deal.convictionScore >= 65 ? "#d4a054" : "#c45a4a";
  return (
    <button onClick={onClick} className={`w-full text-left rounded-2xl border p-4 transition-all ${selected ? "border-[#d4a054]/40 bg-[#d4a054]/[0.05]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]"}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-white">{deal.company}</div>
          <div className="text-[10px] text-white/40">{deal.sector} · {deal.stage}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: scoreColor }}>{deal.convictionScore}</div>
          <div className="text-[9px] text-white/35">Conviction</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold" style={{ color }}>{deal.status.toUpperCase()}</div>
        <div className="text-[10px] text-white/30">{deal.askSize} @ {deal.valuation}</div>
      </div>
    </button>
  );
}

function toDeal(s: SubmittedDeal): Deal {
  return {
    id: s.id,
    company: s.company,
    sector: s.sector,
    stage: s.stage,
    askSize: s.askSize,
    valuation: s.valuation,
    convictionScore: s.convictionScore,
    scores: s.scores,
    status: s.status,
    founder: s.founder,
    summary: s.summary,
    risks: s.risks.length ? s.risks : ["Awaiting analyst review"],
    strengths: s.strengths.length ? s.strengths : ["Inbound submission via founder portal"],
    date: s.date,
    deckUrl: s.deckUrl,
    attachments: s.attachments,
  };
}

export default function DealScoringPage() {
  usePageMeta({ title: "AI Deal Scoring — SZL Fund Intelligence", description: "Autonomous deal screening and conviction scoring engine." });
  const [filter, setFilter] = useState<string>("all");
  const [submissions, setSubmissions] = useState<SubmittedDeal[]>(() => getSubmittedDeals());

  useEffect(() => {
    void loadSubmittedDeals().then(list => setSubmissions(list));
    return subscribeSubmittedDeals(() => setSubmissions(getSubmittedDeals()));
  }, []);

  const allDeals = useMemo<Deal[]>(() => [...submissions.map(toDeal), ...DEALS], [submissions]);
  const [selectedId, setSelectedId] = useState<string>(allDeals[0]?.id ?? "d1");

  const deal = allDeals.find(d => d.id === selectedId) ?? allDeals[0];
  const filtered = filter === "all" ? allDeals : allDeals.filter(d => d.status === filter);
  const radarData = [
    { subject: "Team", score: deal.scores.team },
    { subject: "Market", score: deal.scores.market },
    { subject: "Product", score: deal.scores.product },
    { subject: "Traction", score: deal.scores.traction },
    { subject: "Competitive", score: deal.scores.competitive },
    { subject: "Financials", score: deal.scores.financials },
  ];

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-6">
            <Link href="/fund"><button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"><ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence</button></Link>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span className="text-[11px] text-white/60">AI Deal Scoring</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a054]/15">
              <Brain className="h-4.5 w-4.5 text-[#d4a054]" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">AI Deal Flow Scoring Engine</h1>
              <p className="text-xs text-white/40">Autonomous screening · team evaluation · conviction memos</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-6 mb-8">
            {(() => {
              const baseScored = 47;
              const baseActive = 12;
              const baseInvested = 3;
              const totalScored = baseScored + allDeals.length - DEALS.length;
              const activeCount = baseActive + allDeals.filter(d => d.status === "active").length - DEALS.filter(d => d.status === "active").length;
              const avg = allDeals.length ? (allDeals.reduce((s, d) => s + d.convictionScore, 0) / allDeals.length).toFixed(1) : "0.0";
              const investedCount = baseInvested + allDeals.filter(d => d.status === "invested").length - DEALS.filter(d => d.status === "invested").length;
              return [
                { label: "Deals Scored", value: String(totalScored), icon: FileText, color: "#d4a054" },
                { label: "Active Pipeline", value: String(activeCount), icon: Target, color: "#4a90b8" },
                { label: "Avg Conviction", value: avg, icon: Star, color: "#6aaa72" },
                { label: "Invested", value: String(investedCount), icon: CheckCircle2, color: "#8b7ac8" },
              ];
            })().map(m => (
              <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className="h-4 w-4" style={{ color: m.color }} />
                  <span className="text-xs text-white/40">{m.label}</span>
                </div>
                <div className="text-2xl font-semibold text-white">{m.value}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {["all", "screening", "active", "invested", "passed"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all ${filter === f ? "bg-[#d4a054] text-black" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
                {f}
              </button>
            ))}
            <Link href="/fund/deal-scoring/submit">
              <button className="ml-auto flex items-center gap-1.5 rounded-full border border-[#d4a054]/30 bg-[#d4a054]/10 px-3 py-1 text-[10px] font-semibold text-[#d4a054] hover:bg-[#d4a054]/20">
                <Upload className="h-3 w-3" /> Inbound Submission Portal
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-4 space-y-2">
              {filtered.map(d => (
                <DealCard key={d.id} deal={d} selected={selectedId === d.id} onClick={() => setSelectedId(d.id)} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <m.div key={deal.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                className="col-span-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-semibold text-white">{deal.company}</h2>
                      <span className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase"
                        style={{ color: STATUS_COLORS[deal.status], borderColor: `${STATUS_COLORS[deal.status]}30`, background: `${STATUS_COLORS[deal.status]}12` }}>
                        {deal.status}
                      </span>
                    </div>
                    <div className="text-xs text-white/40">{deal.sector} · {deal.stage} · {deal.founder}</div>
                    <div className="text-xs text-white/30 mt-0.5">Received {deal.date} · {deal.askSize} ask @ {deal.valuation}</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${deal.convictionScore >= 80 ? "text-[#6aaa72]" : deal.convictionScore >= 65 ? "text-[#d4a054]" : "text-[#c45a4a]"}`}>
                      {deal.convictionScore}
                    </div>
                    <div className="text-[10px] text-white/40">Conviction Score</div>
                  </div>
                </div>

                <p className="text-sm text-white/60 mb-6 leading-relaxed border-l-2 border-[#d4a054]/30 pl-4">{deal.summary}</p>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.06)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                          <Radar name="Score" dataKey="score" stroke="#d4a054" fill="#d4a054" fillOpacity={0.15} strokeWidth={1.5} />
                          <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 content-start">
                    <ScoreGauge score={deal.scores.team} label="Team" />
                    <ScoreGauge score={deal.scores.market} label="Market" />
                    <ScoreGauge score={deal.scores.product} label="Product" />
                    <ScoreGauge score={deal.scores.traction} label="Traction" />
                    <ScoreGauge score={deal.scores.competitive} label="Moat" />
                    <ScoreGauge score={deal.scores.financials} label="Financials" />
                  </div>
                </div>

                {(deal.attachments && deal.attachments.length > 0) || deal.deckUrl ? (
                  <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Paperclip className="h-3.5 w-3.5 text-[#d4a054]" />
                      <span className="text-xs font-semibold text-white">Founder Materials</span>
                      <span className="text-[10px] text-white/35">
                        {(deal.attachments?.length ?? 0)} file{(deal.attachments?.length ?? 0) === 1 ? "" : "s"}
                        {deal.deckUrl ? " · 1 link" : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {deal.deckUrl ? (
                        <a
                          href={deal.deckUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] text-white/80 hover:bg-white/[0.05]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ExternalLink className="h-3 w-3 text-[#4a90b8] flex-shrink-0" />
                            <span className="truncate">Founder-supplied deck link</span>
                          </div>
                        </a>
                      ) : null}
                      {(deal.attachments ?? []).map((a, i) => (
                        <a
                          key={`${a.downloadUrl}-${i}`}
                          href={a.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[11px] text-white/80 hover:bg-white/[0.05]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className={`h-3 w-3 flex-shrink-0 ${a.kind === "deck" ? "text-[#d4a054]" : "text-[#4a90b8]"}`} />
                            <span className="truncate">{a.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-white/35">{formatBytes(a.size)}</span>
                            <Download className="h-3 w-3 text-white/40" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#6aaa72]/20 bg-[#6aaa72]/[0.04] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#6aaa72]" />
                      <span className="text-xs font-semibold text-white">Strengths</span>
                    </div>
                    {deal.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 text-xs text-white/60">
                        <div className="mt-1.5 h-1 w-1 rounded-full bg-[#6aaa72] flex-shrink-0" />
                        {s}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-[#c45a4a]/20 bg-[#c45a4a]/[0.04] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-3.5 w-3.5 text-[#c45a4a]" />
                      <span className="text-xs font-semibold text-white">Risk Factors</span>
                    </div>
                    {deal.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 text-xs text-white/60">
                        <div className="mt-1.5 h-1 w-1 rounded-full bg-[#c45a4a] flex-shrink-0" />
                        {r}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="rounded-xl bg-[#d4a054] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d4a054]/90 flex items-center gap-1.5">
                    <Zap className="h-3 w-3" /> Generate Full Memo
                  </button>
                  <button className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.04]">
                    Schedule Partner Call
                  </button>
                  <button className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.04]">
                    Pass Deal
                  </button>
                </div>
              </m.div>
            </AnimatePresence>
          </div>
        </m.div>
      </main>
      <SiteFooter />
    </div>
  );
}
