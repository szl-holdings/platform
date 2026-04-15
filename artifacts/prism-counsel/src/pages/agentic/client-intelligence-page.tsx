import { useState } from "react";
import { Users, Building2, TrendingUp, AlertTriangle, BarChart3, Clock, DollarSign, Star, FileText, ChevronRight, Link2, MessageSquare, Shield, ArrowUpRight } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface ClientProfile {
  id: string;
  name: string;
  industry: string;
  relationship: string;
  riskScore: number;
  totalBilled: number;
  activMatters: number;
  closedMatters: number;
  avgMatterValue: number;
  nps: number;
  billingPattern: string;
  keyContacts: { name: string; title: string; relationship: "champion" | "decision-maker" | "influencer" }[];
  crossMatterPatterns: string[];
  satisfaction: { category: string; score: number }[];
  recentActivity: string[];
}

const CLIENTS: ClientProfile[] = [
  {
    id: "CLI-001",
    name: "Pinnacle Technologies Inc.",
    industry: "Technology",
    relationship: "5 years",
    riskScore: 32,
    totalBilled: 2_840_000,
    activMatters: 4,
    closedMatters: 18,
    avgMatterValue: 128_000,
    nps: 72,
    billingPattern: "Net-30, consistent payer",
    keyContacts: [
      { name: "Jennifer Walsh", title: "General Counsel", relationship: "champion" },
      { name: "Robert Chen", title: "CEO", relationship: "decision-maker" },
      { name: "Samantha Lee", title: "VP Operations", relationship: "influencer" },
    ],
    crossMatterPatterns: [
      "Recurring IP disputes with competitors (3 in 24 months)",
      "Employment litigation increasing — may indicate HR policy gaps",
      "Contract disputes cluster around vendor relationships — suggest playbook review",
    ],
    satisfaction: [
      { category: "Responsiveness", score: 92 },
      { category: "Legal Expertise", score: 88 },
      { category: "Cost Control", score: 75 },
      { category: "Communication", score: 85 },
      { category: "Strategic Value", score: 90 },
    ],
    recentActivity: [
      "New matter opened: Patent infringement (Mar 12)",
      "Invoice #INV-0412 submitted ($48.7K) — pending approval",
      "Quarterly review meeting scheduled (Mar 22)",
      "NDA executed with Meridian Capital (counterparty) (Mar 8)",
    ],
  },
  {
    id: "CLI-002",
    name: "Harbor Point Insurance Co.",
    industry: "Insurance",
    relationship: "3 years",
    riskScore: 58,
    totalBilled: 1_640_000,
    activMatters: 3,
    closedMatters: 12,
    avgMatterValue: 109_000,
    nps: 54,
    billingPattern: "Net-45, occasional delays",
    keyContacts: [
      { name: "Michael Torres", title: "VP Claims", relationship: "champion" },
      { name: "Diana Blackstone", title: "CLO", relationship: "decision-maker" },
    ],
    crossMatterPatterns: [
      "Bad faith claims increasing — 3 new matters in 6 months",
      "Coverage denial disputes concentrated in commercial auto line",
      "Regulatory complaints trending upward in NY/NJ jurisdictions",
    ],
    satisfaction: [
      { category: "Responsiveness", score: 80 },
      { category: "Legal Expertise", score: 92 },
      { category: "Cost Control", score: 68 },
      { category: "Communication", score: 72 },
      { category: "Strategic Value", score: 78 },
    ],
    recentActivity: [
      "Bad faith claim filed: Chen v. Harbor Point (active)",
      "Rate increase request submitted — pending discussion",
      "Coverage denial audit recommended by AI",
    ],
  },
  {
    id: "CLI-003",
    name: "Metropolitan Transit Authority",
    industry: "Government / Transit",
    relationship: "8 years",
    riskScore: 24,
    totalBilled: 4_120_000,
    activMatters: 6,
    closedMatters: 34,
    avgMatterValue: 103_000,
    nps: 81,
    billingPattern: "Net-60, government billing cycle",
    keyContacts: [
      { name: "Patricia Okonkwo", title: "Deputy General Counsel", relationship: "champion" },
      { name: "James Wright", title: "Risk Manager", relationship: "influencer" },
    ],
    crossMatterPatterns: [
      "Slip-and-fall claims cluster at 3 specific stations — infrastructure issue",
      "ADA compliance matters increasing post-renovation",
      "Workers' compensation claims down 15% after safety program implementation",
    ],
    satisfaction: [
      { category: "Responsiveness", score: 85 },
      { category: "Legal Expertise", score: 94 },
      { category: "Cost Control", score: 82 },
      { category: "Communication", score: 88 },
      { category: "Strategic Value", score: 86 },
    ],
    recentActivity: [
      "Quarterly safety audit report delivered",
      "New ADA compliance review initiated",
      "Workers' comp claim #WC-2024-018 resolved favorably",
    ],
  },
];

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;
const relColor = (r: string) => r === "champion" ? "#22c55e" : r === "decision-maker" ? PRISM_GOLD : PRISM_BLUE;

export default function ClientIntelligencePage() {
  const [selected, setSelected] = useState(CLIENTS[0]);

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white tracking-tight">Client & Matter Intelligence</h1>
          <p className="text-[11px] text-white/30 mt-1">360-degree client profiles with cross-matter pattern detection, risk scoring, and satisfaction tracking</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {CLIENTS.map(c => (
            <button key={c.id} onClick={() => setSelected(c)} aria-label={`Select client ${c.name}`}
              className={`text-left rounded-xl border p-4 transition ${selected.id === c.id ? "border-white/[0.12] bg-white/[0.04]" : "border-white/[0.05] bg-white/[0.015] hover:bg-white/[0.03]"}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-white/20">{c.industry}</span>
                <span className="text-[9px] font-semibold" style={{ color: c.riskScore < 35 ? "#22c55e" : c.riskScore < 60 ? "#f59e0b" : "#ef4444" }}>Risk: {c.riskScore}</span>
              </div>
              <p className="text-sm font-medium text-white">{c.name}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] text-white/25">
                <span>{c.activMatters} active</span>
                <span>{fmt(c.totalBilled)} billed</span>
                <span>NPS: {c.nps}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">{selected.name}</h3>
                  <p className="text-[10px] text-white/30">{selected.industry} · {selected.relationship} relationship · {selected.billingPattern}</p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className="h-3.5 w-3.5" style={{ color: i < Math.round(selected.nps / 20) ? PRISM_GOLD : "rgba(255,255,255,0.1)" }} fill={i < Math.round(selected.nps / 20) ? PRISM_GOLD : "none"} />
                  ))}
                  <span className="text-[10px] text-white/30 ml-1">NPS {selected.nps}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 mb-6">
                {[
                  { label: "Total Billed", value: fmt(selected.totalBilled) },
                  { label: "Active Matters", value: selected.activMatters.toString() },
                  { label: "Closed Matters", value: selected.closedMatters.toString() },
                  { label: "Avg Matter Value", value: fmt(selected.avgMatterValue) },
                  { label: "Risk Score", value: selected.riskScore.toString() },
                ].map(s => (
                  <div key={s.label} className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5 text-center">
                    <p className="text-[8px] uppercase tracking-wider text-white/20 mb-0.5">{s.label}</p>
                    <p className="text-sm font-semibold text-white">{s.value}</p>
                  </div>
                ))}
              </div>

              <h4 className="text-[9px] uppercase tracking-wider text-white/25 font-semibold mb-2">Satisfaction Scores</h4>
              <div className="space-y-2 mb-6">
                {selected.satisfaction.map(s => (
                  <div key={s.category} className="flex items-center gap-3">
                    <span className="text-[10px] text-white/40 w-28">{s.category}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full" style={{ width: `${s.score}%`, background: s.score >= 85 ? "#22c55e" : s.score >= 70 ? PRISM_GOLD : "#ef4444" }} />
                    </div>
                    <span className="text-[10px] font-semibold text-white w-8 text-right">{s.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} />
                <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">Cross-Matter Pattern Detection</h3>
              </div>
              <div className="space-y-2">
                {selected.crossMatterPatterns.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-500/[0.03] border border-amber-500/[0.08] p-3">
                    <Link2 className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
                    <p className="text-[10px] text-white/50 leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-4 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Key Contacts</h3>
              {selected.keyContacts.map(c => (
                <div key={c.name} className="flex items-center gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] p-3 mb-2 last:mb-0">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: relColor(c.relationship) + "15", color: relColor(c.relationship) }}>
                    {c.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-white">{c.name}</p>
                    <p className="text-[9px] text-white/30">{c.title}</p>
                  </div>
                  <span className="text-[8px] uppercase tracking-wider font-bold rounded px-1.5 py-0.5" style={{ background: relColor(c.relationship) + "15", color: relColor(c.relationship) }}>
                    {c.relationship}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-3">Recent Activity</h3>
              <div className="space-y-1.5">
                {selected.recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.015] border border-white/[0.04] px-3 py-2">
                    <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: PRISM_GOLD }} />
                    <p className="text-[9px] text-white/40 leading-relaxed">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
