import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Users, ArrowLeft, ChevronRight, MessageSquare, Zap, Phone, Mail } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

type LP = {
  id: string; name: string; type: string; commitment: string; called: string;
  sentiment: number; reUpProb: number; lastContact: string;
  nextMeeting?: string; tags: string[];
  interactions: Array<{ date: string; type: string; notes: string }>;
  talkingPoints: string[];
};

const LPS: LP[] = [
  {
    id: "meridian", name: "Meridian Capital Partners", type: "Family Office", commitment: "$8M", called: "$6.5M",
    sentiment: 9.2, reUpProb: 88, lastContact: "Apr 2, 2026", nextMeeting: "Apr 20, 2026",
    tags: ["re-up likely", "strategic value", "co-invest interest"],
    interactions: [
      { date: "Apr 2, 2026", type: "Call", notes: "Reviewed Q1 performance. Strong positive reaction to KORA valuation mark. Interested in co-invest on NovaStar AI." },
      { date: "Mar 15, 2026", type: "Email", notes: "Sent Q4 2025 annual report. Acknowledged next day." },
      { date: "Jan 22, 2026", type: "Meeting", notes: "Annual LP meeting. Meridian rep expressed interest in Fund II at $12M." },
    ],
    talkingPoints: [
      "KORA's $148M Series B mark — 3.4× unrealized on their investment",
      "NovaStar AI co-invest opportunity — $500K–$1M ticket available",
      "Fund II strategy: larger checks, growth stage focus",
      "Portfolio aggregate ARR up 42% since last year-end",
    ],
  },
  {
    id: "astor", name: "Astor Family Office", type: "Family Office", commitment: "$5M", called: "$4.1M",
    sentiment: 7.8, reUpProb: 71, lastContact: "Mar 10, 2026", nextMeeting: undefined,
    tags: ["active", "risk-conscious", "income-focused"],
    interactions: [
      { date: "Mar 10, 2026", type: "Email", notes: "Sent Q1 interim update. No reply yet — follow up needed." },
      { date: "Feb 5, 2026", type: "Call", notes: "Discussed Carlota Jo situation. Requested more frequent updates on watch-list companies." },
    ],
    talkingPoints: [
      "Proactively address Carlota Jo — show intervention plan",
      "Fund-level TVPI at 2.1× vs. 1.6× last year",
      "Emphasis on downside protection — preferred stack shows discipline",
      "DPI of 0.62× — income from distributions ahead of peer funds",
    ],
  },
  {
    id: "blackrock-endow", name: "Blackrock University Endowment", type: "Endowment", commitment: "$15M", called: "$12.2M",
    sentiment: 9.0, reUpProb: 92, lastContact: "Apr 8, 2026", nextMeeting: "May 5, 2026",
    tags: ["anchor LP", "re-up likely", "ESG focus"],
    interactions: [
      { date: "Apr 8, 2026", type: "Meeting", notes: "Quarterly check-in. Highly positive. CIO mentioned allocating $20M for Fund II." },
      { date: "Mar 1, 2026", type: "Email", notes: "Sent ESG annual report. Strong acknowledgment." },
    ],
    talkingPoints: [
      "ESG metrics: portfolio companies avg 8.2/10 on governance score",
      "Fund II discussions — CIO has budget clarity for Sept close",
      "Governance improvement at PARAGON — new board charter ratified",
      "TVPI of 2.1× placing fund in top 20% of vintage 2023 cohort",
    ],
  },
  {
    id: "greenway", name: "Greenway Ventures LP", type: "Institutional VC", commitment: "$4M", called: "$3.2M",
    sentiment: 6.4, reUpProb: 52, lastContact: "Feb 20, 2026", nextMeeting: undefined,
    tags: ["passive", "co-invest passed", "monitor"],
    interactions: [
      { date: "Feb 20, 2026", type: "Email", notes: "Routine Q4 report sent. No response." },
      { date: "Dec 5, 2025", type: "Call", notes: "Passed on NovaStar AI co-invest opportunity. Cited sector concentration concerns." },
    ],
    talkingPoints: [
      "Re-establish contact — 45 days without engagement",
      "Offer SPV access for upcoming SEXTANT bridge round",
      "Net IRR of 28.4% ahead of their 20% threshold",
      "Fund II deck available if they want to review",
    ],
  },
];

function SentimentBar({ score }: { score: number }) {
  const color = score >= 8.5 ? "#6aaa72" : score >= 7 ? "#d4a054" : "#c45a4a";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/[0.06]">
        <div className="h-1 rounded-full" style={{ width: `${score * 10}%`, background: color }} />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

export default function LpCrmPage() {
  const __pageMeta = usePageMeta({ title: "LP Communication Intelligence — SZL Fund Intelligence", description: "Investor CRM with sentiment analysis, re-up scoring, and automated meeting prep." });
  const [selectedId, setSelectedId] = useState("meridian");
  const lp = LPS.find(l => l.id === selectedId) ?? LPS[0];
  const avgSentiment = (LPS.reduce((s, l) => s + l.sentiment, 0) / LPS.length).toFixed(1);
  const avgReUp = Math.round(LPS.reduce((s, l) => s + l.reUpProb, 0) / LPS.length);

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
              <span className="text-[11px] text-white/60">LP Communication Intelligence</span>
            </div>
  
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6aaa72]/15">
                <Users className="h-4.5 w-4.5 text-[#6aaa72]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">LP Communication Intelligence</h1>
                <p className="text-xs text-white/40">Investor CRM · AI sentiment analysis · re-up probability · automated meeting prep</p>
              </div>
            </div>
  
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { label: "Total LPs", value: "23", color: "#4a90b8" },
                { label: "Avg Sentiment Score", value: avgSentiment, color: "#6aaa72" },
                { label: "Avg Re-Up Probability", value: `${avgReUp}%`, color: "#d4a054" },
                { label: "Meetings This Month", value: "6", color: "#8b7ac8" },
              ].map(m => (
                <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-2xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
  
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-4 space-y-2">
                {LPS.map(l => (
                  <button key={l.id} onClick={() => setSelectedId(l.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${selectedId === l.id ? "border-[#6aaa72]/40 bg-[#6aaa72]/[0.05]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white truncate pr-2">{l.name}</span>
                      <span className={`text-xs font-bold flex-shrink-0 ${l.reUpProb >= 80 ? "text-[#6aaa72]" : l.reUpProb >= 60 ? "text-[#d4a054]" : "text-[#c45a4a]"}`}>
                        {l.reUpProb}%
                      </span>
                    </div>
                    <div className="text-[10px] text-white/40 mb-2">{l.type} · {l.commitment} committed</div>
                    <SentimentBar score={l.sentiment} />
                    <div className="text-[9px] text-white/30 mt-1.5">Last contact: {l.lastContact}</div>
                  </button>
                ))}
              </div>
  
              <AnimatePresence mode="wait">
                <m.div key={lp.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="col-span-8 space-y-4">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white">{lp.name}</h2>
                        <div className="text-xs text-white/40">{lp.type} · {lp.commitment} commitment · {lp.called} called</div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/50 hover:bg-white/[0.04]">
                          <Mail className="h-3.5 w-3.5" /> Email
                        </button>
                        <button className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/50 hover:bg-white/[0.04]">
                          <Phone className="h-3.5 w-3.5" /> Schedule Call
                        </button>
                      </div>
                    </div>
  
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="text-xs text-white/40 mb-1">Sentiment Score</div>
                        <div className={`text-xl font-bold ${lp.sentiment >= 8.5 ? "text-[#6aaa72]" : lp.sentiment >= 7 ? "text-[#d4a054]" : "text-[#c45a4a]"}`}>{lp.sentiment}/10</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="text-xs text-white/40 mb-1">Re-Up Probability</div>
                        <div className={`text-xl font-bold ${lp.reUpProb >= 80 ? "text-[#6aaa72]" : lp.reUpProb >= 60 ? "text-[#d4a054]" : "text-[#c45a4a]"}`}>{lp.reUpProb}%</div>
                      </div>
                      <div className="rounded-xl bg-white/[0.03] p-3">
                        <div className="text-xs text-white/40 mb-1">Next Meeting</div>
                        <div className="text-sm font-semibold text-white">{lp.nextMeeting ?? "Not scheduled"}</div>
                      </div>
                    </div>
  
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {lp.tags.map(t => (
                        <span key={t} className="rounded-full bg-white/[0.05] border border-white/[0.08] px-2.5 py-0.5 text-[10px] text-white/50">{t}</span>
                      ))}
                    </div>
                  </div>
  
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-3.5 w-3.5 text-[#d4a054]" />
                      <span className="text-xs font-semibold text-white">AI-Generated Meeting Prep — Talking Points</span>
                    </div>
                    {lp.talkingPoints.map((tp, i) => (
                      <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                        <div className="mt-1.5 h-1 w-1 rounded-full bg-[#d4a054] flex-shrink-0" />
                        <span className="text-xs text-white/70">{tp}</span>
                      </div>
                    ))}
                  </div>
  
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="h-3.5 w-3.5 text-[#4a90b8]" />
                      <span className="text-xs font-semibold text-white">Interaction History</span>
                    </div>
                    {lp.interactions.map((interaction, i) => (
                      <div key={i} className="py-2.5 border-b border-white/[0.04] last:border-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold text-[#4a90b8] uppercase">{interaction.type}</span>
                          <span className="text-[10px] text-white/30">{interaction.date}</span>
                        </div>
                        <p className="text-xs text-white/60">{interaction.notes}</p>
                      </div>
                    ))}
                  </div>
                </m.div>
              </AnimatePresence>
            </div>
          </m.div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
