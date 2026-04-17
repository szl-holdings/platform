import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowLeft, ChevronRight, User, TrendingUp, Download,
  FileText, FolderOpen, Eye, Clock, Activity, Send, Lock, Shield,
  CheckCircle2, MessageSquare, Filter, BarChart3, ImageIcon,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

type Permission = "gp_only" | "qualified_lp" | "all_lp" | "co_investor" | "public";
type LpTier = "all_lp" | "qualified_lp";

type Lp = {
  id: string;
  name: string;
  contact: string;
  tier: LpTier;
  commitment: number;
  called: number;
  distributions: number;
  navShare: number;
  unitsHeld: number;
  joinDate: string;
};

const LPS: Lp[] = [
  {
    id: "lp1", name: "Meridian Capital", contact: "j.harrow@meridiancap.com",
    tier: "qualified_lp", commitment: 12_000_000, called: 7_440_000,
    distributions: 1_128_000, navShare: 10_104_000, unitsHeld: 7_205,
    joinDate: "Jan 2024",
  },
  {
    id: "lp2", name: "Astor Family Office", contact: "office@astorfamily.com",
    tier: "all_lp", commitment: 5_000_000, called: 3_100_000,
    distributions: 470_000, navShare: 4_210_000, unitsHeld: 3_002,
    joinDate: "Mar 2024",
  },
  {
    id: "lp3", name: "Blackrock Endowment", contact: "endowment@brk.org",
    tier: "qualified_lp", commitment: 25_000_000, called: 15_500_000,
    distributions: 2_350_000, navShare: 21_050_000, unitsHeld: 15_010,
    joinDate: "Jan 2024",
  },
];

const NAV_HISTORY = [
  { period: "Q1 '25", navPerUnit: 1.040, distributions: 0.00 },
  { period: "Q2 '25", navPerUnit: 1.148, distributions: 0.04 },
  { period: "Q3 '25", navPerUnit: 1.239, distributions: 0.06 },
  { period: "Q4 '25", navPerUnit: 1.319, distributions: 0.07 },
  { period: "Q1 '26", navPerUnit: 1.402, distributions: 0.09 },
];

type DocItem = {
  id: string;
  name: string;
  folder: string;
  type: "pdf" | "xlsx" | "pptx";
  size: string;
  uploaded: string;
  permission: Permission;
  watermarked: boolean;
};

const ALL_DOCS: DocItem[] = [
  { id: "d1", name: "SZL Fund II — Investment Memorandum.pdf", folder: "Fund Overview", type: "pdf", size: "4.2 MB", uploaded: "Apr 12, 2026", permission: "all_lp", watermarked: true },
  { id: "d2", name: "Fund II Pitch Deck — LP Edition.pptx", folder: "Fund Overview", type: "pptx", size: "12.8 MB", uploaded: "Apr 10, 2026", permission: "all_lp", watermarked: true },
  { id: "d3", name: "Team Biographies & Track Record.pdf", folder: "Fund Overview", type: "pdf", size: "2.1 MB", uploaded: "Mar 28, 2026", permission: "all_lp", watermarked: false },
  { id: "d4", name: "Investment Committee Charter.pdf", folder: "Fund Overview", type: "pdf", size: "0.8 MB", uploaded: "Mar 1, 2026", permission: "qualified_lp", watermarked: false },
  { id: "d5", name: "Fund II — Q1 2026 Financial Statements.pdf", folder: "Financial Statements", type: "pdf", size: "3.6 MB", uploaded: "Apr 14, 2026", permission: "qualified_lp", watermarked: true },
  { id: "d6", name: "2025 Audited Financial Statements.pdf", folder: "Financial Statements", type: "pdf", size: "5.1 MB", uploaded: "Mar 15, 2026", permission: "qualified_lp", watermarked: true },
  { id: "d7", name: "NAV Methodology & Valuation Policy.pdf", folder: "Financial Statements", type: "pdf", size: "1.2 MB", uploaded: "Jan 10, 2026", permission: "qualified_lp", watermarked: false },
  { id: "d8", name: "Vessels — Q1 2026 Board Update.pdf", folder: "Portfolio Updates", type: "pdf", size: "2.8 MB", uploaded: "Apr 13, 2026", permission: "all_lp", watermarked: true },
  { id: "d9", name: "Aegis — Q1 2026 Operational Report.pdf", folder: "Portfolio Updates", type: "pdf", size: "3.2 MB", uploaded: "Apr 11, 2026", permission: "all_lp", watermarked: true },
  { id: "d10", name: "Terra — Q1 2026 KPI Dashboard.xlsx", folder: "Portfolio Updates", type: "xlsx", size: "1.4 MB", uploaded: "Apr 10, 2026", permission: "all_lp", watermarked: true },
  { id: "d11", name: "Lyte — Q1 2026 Product Roadmap Update.pptx", folder: "Portfolio Updates", type: "pptx", size: "6.4 MB", uploaded: "Apr 9, 2026", permission: "all_lp", watermarked: false },
  { id: "d12", name: "SZL Fund II — 2025 ESG Annual Report.pdf", folder: "ESG & Impact", type: "pdf", size: "4.1 MB", uploaded: "Apr 1, 2026", permission: "all_lp", watermarked: false },
  { id: "d13", name: "Portfolio DEI Metrics — 2025.xlsx", folder: "ESG & Impact", type: "xlsx", size: "1.6 MB", uploaded: "Mar 28, 2026", permission: "all_lp", watermarked: false },
  { id: "d14", name: "Limited Partnership Agreement — Fund II.pdf", folder: "Legal & Compliance", type: "pdf", size: "8.2 MB", uploaded: "Jan 15, 2026", permission: "gp_only", watermarked: false },
];

type ReportItem = {
  id: string;
  period: string;
  generated: string;
  navPerUnit: number;
  irr: number;
  tvpi: number;
  dpi: number;
  size: string;
};

const REPORTS: ReportItem[] = [
  { id: "r1", period: "Q1 2026", generated: "Apr 14, 2026", navPerUnit: 1.402, irr: 28.4, tvpi: 2.10, dpi: 0.62, size: "3.6 MB" },
  { id: "r2", period: "Q4 2025", generated: "Jan 15, 2026", navPerUnit: 1.319, irr: 26.8, tvpi: 1.98, dpi: 0.52, size: "3.4 MB" },
  { id: "r3", period: "Q3 2025", generated: "Oct 12, 2025", navPerUnit: 1.239, irr: 24.1, tvpi: 1.82, dpi: 0.41, size: "3.2 MB" },
  { id: "r4", period: "Q2 2025", generated: "Jul 14, 2025", navPerUnit: 1.148, irr: 21.3, tvpi: 1.66, dpi: 0.30, size: "3.0 MB" },
  { id: "r5", period: "Q1 2025", generated: "Apr 14, 2025", navPerUnit: 1.040, irr: 18.4, tvpi: 1.48, dpi: 0.18, size: "2.9 MB" },
];

type ActivityEntry = {
  id: string;
  action: "Viewed" | "Downloaded" | "Messaged GP";
  target: string;
  time: string;
};

const SEED_ACTIVITY: ActivityEntry[] = [
  { id: "e1", action: "Downloaded", target: "Fund II — Q1 2026 Financial Statements.pdf", time: "2 hours ago" },
  { id: "e2", action: "Viewed", target: "SZL Fund II — Investment Memorandum.pdf", time: "Yesterday 4:18 PM" },
  { id: "e3", action: "Downloaded", target: "Q1 2026 LP Report.pdf", time: "Apr 14, 10:02 AM" },
  { id: "e4", action: "Viewed", target: "Vessels — Q1 2026 Board Update.pdf", time: "Apr 13, 9:41 AM" },
  { id: "e5", action: "Messaged GP", target: "Question on Aegis cyber bundle traction", time: "Apr 11, 2:33 PM" },
];

const FILE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  xlsx: BarChart3,
  pptx: ImageIcon,
};

const FILE_COLORS: Record<string, string> = {
  pdf: "#c45a4a", xlsx: "#6aaa72", pptx: "#d4a054",
};

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function canSee(lp: Lp, permission: Permission): boolean {
  if (permission === "all_lp" || permission === "public") return true;
  if (permission === "qualified_lp") return lp.tier === "qualified_lp";
  return false;
}

function KpiTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</span>
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      </div>
      <div className="text-2xl font-semibold text-white" style={{ fontFamily: "'Space Grotesk','Inter',system-ui,sans-serif" }}>{value}</div>
      {sub && <div className="text-[11px] text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

type Tab = "overview" | "documents" | "reports" | "activity" | "messages";

export default function FundLpPortalPage() {
  usePageMeta({
    title: "LP Portal — SZL Holdings Fund",
    description: "Self-service LP portal: capital account, permissioned data room access, quarterly reports, activity log, and GP messaging.",
    canonical: "https://szlholdings.com/fund/lp-portal",
  });

  const [lpId, setLpId] = useState<string>(LPS[0].id);
  const [tab, setTab] = useState<Tab>("overview");
  const [folderFilter, setFolderFilter] = useState<string>("All");
  const [activity, setActivity] = useState<ActivityEntry[]>(SEED_ACTIVITY);
  const [messageDraft, setMessageDraft] = useState<string>("");
  const [messages, setMessages] = useState<Array<{ id: string; from: "lp" | "gp"; body: string; time: string }>>([
    { id: "m1", from: "lp", body: "Could you share more color on the Aegis-Vessels maritime cyber bundle pipeline for Q2?", time: "Apr 11, 2:33 PM" },
    { id: "m2", from: "gp", body: "Absolutely — pipeline currently sits at $15.6M with 4 enterprise opportunities in late-stage diligence. We'll include a deep-dive in the Q1 letter shipping next week.", time: "Apr 11, 5:08 PM" },
  ]);

  const lp = LPS.find(l => l.id === lpId)!;
  const visibleDocs = useMemo(() => ALL_DOCS.filter(d => canSee(lp, d.permission)), [lp]);
  const folders = useMemo(() => {
    const set = new Set(visibleDocs.map(d => d.folder));
    return ["All", ...Array.from(set)];
  }, [visibleDocs]);
  const filteredDocs = folderFilter === "All" ? visibleDocs : visibleDocs.filter(d => d.folder === folderFilter);

  const calledPct = (lp.called / lp.commitment) * 100;
  const moic = lp.called > 0 ? (lp.navShare + lp.distributions) / lp.called : 0;
  const dpi = lp.called > 0 ? lp.distributions / lp.called : 0;
  const tvpi = lp.called > 0 ? (lp.navShare + lp.distributions) / lp.called : 0;
  const totalValue = lp.navShare + lp.distributions;

  const navChartData = NAV_HISTORY.map(n => ({
    period: n.period,
    "Position Value": Math.round(lp.unitsHeld * n.navPerUnit),
    "Cumulative Distributions": Math.round(lp.unitsHeld * (NAV_HISTORY
      .slice(0, NAV_HISTORY.findIndex(x => x.period === n.period) + 1)
      .reduce((s, x) => s + x.distributions, 0))),
  }));

  const trackEvent = (action: ActivityEntry["action"], target: string) => {
    setActivity(prev => [{
      id: `live-${Date.now()}`, action, target, time: "Just now",
    }, ...prev]);
  };

  const handleDownloadDoc = (doc: DocItem) => trackEvent("Downloaded", doc.name);
  const handleViewDoc = (doc: DocItem) => trackEvent("Viewed", doc.name);
  const handleDownloadReport = (r: ReportItem) => trackEvent("Downloaded", `${r.period} LP Report.pdf`);

  const handleSendMessage = () => {
    const body = messageDraft.trim();
    if (!body) return;
    setMessages(prev => [...prev, { id: `m-${Date.now()}`, from: "lp", body, time: "Just now" }]);
    trackEvent("Messaged GP", body.length > 60 ? body.slice(0, 57) + "..." : body);
    setMessageDraft("");
  };

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

          <div className="flex items-center gap-3 mb-6">
            <Link href="/fund">
              <button className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence
              </button>
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-white/20" />
            <span className="text-xs text-white/60">LP Portal</span>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a90b8]/15">
                  <User className="h-3.5 w-3.5 text-[#4a90b8]" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4a90b8]">Limited Partner Portal</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Welcome back, {lp.name}</h1>
              <p className="text-white/50 text-sm max-w-2xl">
                Self-service access to your capital account, permissioned data room documents, quarterly reports, activity history, and direct messaging with the GP team.
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 min-w-[260px]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 mb-1.5">Signed in as</div>
              <select
                value={lpId}
                onChange={e => { setLpId(e.target.value); setFolderFilter("All"); }}
                className="w-full rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4a90b8]/50"
                data-testid="select-lp"
              >
                {LPS.map(l => (
                  <option key={l.id} value={l.id} style={{ background: "#0d1117" }}>
                    {l.name} — {l.tier === "qualified_lp" ? "Qualified LP" : "All-LP tier"}
                  </option>
                ))}
              </select>
              <div className="text-[10px] text-white/35 mt-1.5">{lp.contact} · LP since {lp.joinDate}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <KpiTile label="Commitment" value={fmtMoney(lp.commitment)} sub={`${calledPct.toFixed(0)}% called`} color="#4a90b8" />
            <KpiTile label="Called Capital" value={fmtMoney(lp.called)} sub={`${fmtMoney(lp.commitment - lp.called)} uncalled`} color="#d4a054" />
            <KpiTile label="Current NAV" value={fmtMoney(lp.navShare)} sub={`${lp.unitsHeld.toLocaleString()} units · NAV/unit $${NAV_HISTORY[NAV_HISTORY.length - 1].navPerUnit.toFixed(3)}`} color="#6aaa72" />
            <KpiTile label="Distributions" value={fmtMoney(lp.distributions)} sub={`DPI ${dpi.toFixed(2)}×`} color="#8b7ac8" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <KpiTile label="Total Value" value={fmtMoney(totalValue)} sub="NAV + cumulative distributions" color="#6aaa72" />
            <KpiTile label="MOIC" value={`${moic.toFixed(2)}×`} sub="Multiple on invested capital" color="#d4a054" />
            <KpiTile label="TVPI" value={`${tvpi.toFixed(2)}×`} sub="Total value to paid-in" color="#4a90b8" />
            <KpiTile label="Documents Available" value={String(visibleDocs.length)} sub={`${REPORTS.length} quarterly reports`} color="#8b7ac8" />
          </div>

          <div className="flex flex-wrap gap-1 mb-6 border-b border-white/[0.06]">
            {([
              { key: "overview", label: "Overview" },
              { key: "documents", label: "Data Room" },
              { key: "reports", label: "Quarterly Reports" },
              { key: "activity", label: "Activity Log" },
              { key: "messages", label: "Messages" },
            ] as Array<{ key: Tab; label: string }>).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                data-testid={`tab-${t.key}`}
                className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 ${tab === t.key ? "text-white border-[#4a90b8]" : "text-white/40 border-transparent hover:text-white/70"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "overview" && (
              <m.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-[#6aaa72]" />
                    <span className="text-sm font-semibold text-white">Your Position Value Over Time</span>
                    <span className="ml-auto text-[10px] text-white/35">USD, by quarter</span>
                  </div>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={navChartData} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
                        <defs>
                          <linearGradient id="lpNavGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#4a90b8" stopOpacity={0.55} />
                            <stop offset="100%" stopColor="#4a90b8" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="lpDistGrad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#6aaa72" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#6aaa72" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="2 4" stroke="hsla(0,0%,100%,0.05)" />
                        <XAxis dataKey="period" tick={{ fontSize: 10, fill: "hsl(210,5%,48%)" }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 9, fill: "hsl(210,5%,38%)" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#0d1117", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: 6, fontSize: 11 }}
                          formatter={(v: number) => fmtMoney(v)}
                        />
                        <Area type="monotone" dataKey="Position Value" stroke="#4a90b8" strokeWidth={2} fill="url(#lpNavGrad)" />
                        <Area type="monotone" dataKey="Cumulative Distributions" stroke="#6aaa72" strokeWidth={2} fill="url(#lpDistGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FolderOpen className="h-4 w-4 text-[#d4a054]" />
                      <span className="text-sm font-semibold text-white">Latest Documents</span>
                    </div>
                    <div className="space-y-2">
                      {visibleDocs.slice(0, 4).map(d => {
                        const Icon = FILE_ICONS[d.type] ?? FileText;
                        return (
                          <button
                            key={d.id}
                            onClick={() => { setTab("documents"); handleViewDoc(d); }}
                            className="w-full flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2 hover:bg-white/[0.04] transition-colors text-left"
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" style={{ color: FILE_COLORS[d.type] }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-white truncate">{d.name}</div>
                              <div className="text-[10px] text-white/40">{d.uploaded}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-[#4a90b8]" />
                      <span className="text-sm font-semibold text-white">Most Recent Report</span>
                    </div>
                    <div className="text-xs text-white/40 mb-1">{REPORTS[0].period} · Generated {REPORTS[0].generated}</div>
                    <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
                      <div className="rounded-lg bg-white/[0.03] p-2">
                        <div className="text-[10px] uppercase tracking-wider text-white/40">Net IRR</div>
                        <div className="text-base font-semibold text-white">{REPORTS[0].irr}%</div>
                      </div>
                      <div className="rounded-lg bg-white/[0.03] p-2">
                        <div className="text-[10px] uppercase tracking-wider text-white/40">TVPI</div>
                        <div className="text-base font-semibold text-white">{REPORTS[0].tvpi}×</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadReport(REPORTS[0])}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#4a90b8] px-3 py-2 text-xs font-semibold text-black hover:bg-[#4a90b8]/90 transition-colors"
                      data-testid="button-download-latest-report"
                    >
                      <Download className="h-3.5 w-3.5" /> Download {REPORTS[0].period} Report
                    </button>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-4 w-4 text-[#8b7ac8]" />
                      <span className="text-sm font-semibold text-white">Recent Activity</span>
                    </div>
                    <div className="space-y-2.5">
                      {activity.slice(0, 5).map(e => (
                        <div key={e.id} className="flex items-start gap-2">
                          <div className="h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: e.action === "Downloaded" ? "#c45a4a" : e.action === "Viewed" ? "#4a90b8" : "#6aaa72" }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-white">{e.action}: <span className="text-white/60">{e.target}</span></div>
                            <div className="text-[10px] text-white/35">{e.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </m.div>
            )}

            {tab === "documents" && (
              <m.div key="documents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <Filter className="h-3.5 w-3.5 text-white/40" />
                  {folders.map(f => (
                    <button
                      key={f}
                      onClick={() => setFolderFilter(f)}
                      data-testid={`filter-folder-${f}`}
                      className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${folderFilter === f ? "bg-[#4a90b8] text-black" : "bg-white/[0.04] text-white/45 hover:bg-white/[0.07]"}`}
                    >
                      {f}
                    </button>
                  ))}
                  <span className="ml-auto text-[10px] text-white/35">
                    Showing {filteredDocs.length} of {visibleDocs.length} permissioned · {ALL_DOCS.length - visibleDocs.length} restricted
                  </span>
                </div>

                <div className="rounded-2xl border border-[#4a90b8]/20 bg-[#4a90b8]/[0.04] p-4 mb-5 flex items-start gap-3">
                  <Shield className="h-4 w-4 text-[#4a90b8] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-white/65">
                    Your access tier is <strong className="text-white">{lp.tier === "qualified_lp" ? "Qualified LP" : "All-LP"}</strong>. You can see all documents tagged <em>All LPs</em>{lp.tier === "qualified_lp" ? " and Qualified LP" : ""}. GP-only and co-investor materials are filtered out.
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredDocs.map((doc, i) => {
                    const Icon = FILE_ICONS[doc.type] ?? FileText;
                    return (
                      <m.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025 }}
                        className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition-colors"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" style={{ color: FILE_COLORS[doc.type] }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{doc.name}</div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] text-white/35">{doc.folder}</span>
                            <span className="text-[10px] text-white/35">{doc.size}</span>
                            <span className="text-[10px] text-white/35">{doc.uploaded}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {doc.watermarked && (
                            <span className="text-[9px] text-[#d4a054] border border-[#d4a054]/30 rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider">Watermarked</span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
                            style={{ color: doc.permission === "qualified_lp" ? "#d4a054" : "#6aaa72", borderColor: `${doc.permission === "qualified_lp" ? "#d4a054" : "#6aaa72"}30`, background: `${doc.permission === "qualified_lp" ? "#d4a054" : "#6aaa72"}12` }}>
                            <Lock className="h-2.5 w-2.5" />
                            {doc.permission === "qualified_lp" ? "Qualified LP" : "All LPs"}
                          </span>
                          <button
                            onClick={() => handleViewDoc(doc)}
                            data-testid={`button-view-${doc.id}`}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 bg-white/[0.04] text-xs text-white/60 hover:bg-white/[0.08] hover:text-white transition-colors"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            onClick={() => handleDownloadDoc(doc)}
                            data-testid={`button-download-${doc.id}`}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 bg-[#4a90b8]/15 text-xs text-[#4a90b8] hover:bg-[#4a90b8]/25 transition-colors"
                          >
                            <Download className="h-3 w-3" /> Download
                          </button>
                        </div>
                      </m.div>
                    );
                  })}
                  {filteredDocs.length === 0 && (
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm text-white/40">
                      No documents in this folder for your access tier.
                    </div>
                  )}
                </div>
              </m.div>
            )}

            {tab === "reports" && (
              <m.div key="reports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_1fr_0.8fr] gap-3 px-5 py-3 border-b border-white/[0.06] bg-black/20 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">
                    <div>Period</div>
                    <div>Generated</div>
                    <div>Net IRR</div>
                    <div>TVPI</div>
                    <div>DPI</div>
                    <div>NAV / Unit</div>
                    <div className="text-right">Action</div>
                  </div>
                  {REPORTS.map((r, i) => (
                    <m.div
                      key={r.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr_1fr_0.8fr] gap-3 px-5 py-3.5 border-b border-white/[0.04] items-center hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a90b8]/15">
                          <FileText className="h-3.5 w-3.5 text-[#4a90b8]" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{r.period}</div>
                          <div className="text-[10px] text-white/35">{r.size}</div>
                        </div>
                      </div>
                      <div className="text-xs text-white/55">{r.generated}</div>
                      <div className="text-sm text-white font-semibold">{r.irr}%</div>
                      <div className="text-sm text-white font-semibold">{r.tvpi}×</div>
                      <div className="text-sm text-white font-semibold">{r.dpi}×</div>
                      <div className="text-sm text-white">${r.navPerUnit.toFixed(3)}</div>
                      <div className="text-right">
                        <button
                          onClick={() => handleDownloadReport(r)}
                          data-testid={`button-download-report-${r.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#4a90b8]/15 px-3 py-1.5 text-xs text-[#4a90b8] hover:bg-[#4a90b8]/25 transition-colors"
                        >
                          <Download className="h-3 w-3" /> PDF
                        </button>
                      </div>
                    </m.div>
                  ))}
                </div>
              </m.div>
            )}

            {tab === "activity" && (
              <m.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                    <Activity className="h-4 w-4 text-[#8b7ac8]" />
                    <span className="text-sm font-semibold text-white">Your Activity</span>
                    <span className="ml-auto text-[10px] text-white/35">{activity.length} events</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {activity.map(e => (
                      <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                        <div className="flex-shrink-0">
                          {e.action === "Downloaded" ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c45a4a]/10">
                              <Download className="h-3.5 w-3.5 text-[#c45a4a]" />
                            </div>
                          ) : e.action === "Viewed" ? (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#4a90b8]/10">
                              <Eye className="h-3.5 w-3.5 text-[#4a90b8]" />
                            </div>
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#6aaa72]/10">
                              <MessageSquare className="h-3.5 w-3.5 text-[#6aaa72]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white"><span className="font-medium">{e.action}</span>: <span className="text-white/60">{e.target}</span></div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3 text-white/30" />
                            <span className="text-[10px] text-white/40">{e.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-[#6aaa72]/20 bg-[#6aaa72]/[0.04] p-4 flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#6aaa72] flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-white/65">
                    Your activity log is private to you and the GP team. Events are immutably recorded for 7 years to satisfy ILPA reporting and audit requirements.
                  </div>
                </div>
              </m.div>
            )}

            {tab === "messages" && (
              <m.div key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#6aaa72]" />
                    <span className="text-sm font-semibold text-white">Direct Line to GP Team</span>
                    <span className="ml-auto text-[10px] text-white/35">Typical reply within 1 business day</span>
                  </div>
                  <div className="px-5 py-5 space-y-3 max-h-[420px] overflow-y-auto">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.from === "lp" ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[75%] rounded-2xl px-4 py-2.5"
                          style={{
                            background: m.from === "lp" ? "#4a90b8" : "rgba(255,255,255,0.04)",
                            color: m.from === "lp" ? "#000" : "rgba(255,255,255,0.85)",
                            border: m.from === "lp" ? "none" : "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-70">
                            {m.from === "lp" ? lp.name : "SZL GP Team"}
                          </div>
                          <div className="text-sm leading-relaxed">{m.body}</div>
                          <div className="text-[10px] mt-1.5 opacity-60">{m.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/[0.06] p-4 flex gap-2">
                    <input
                      value={messageDraft}
                      onChange={e => setMessageDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleSendMessage(); }}
                      placeholder="Send a message to the GP team..."
                      data-testid="input-message"
                      className="flex-1 rounded-xl border border-white/[0.08] bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6aaa72]/50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageDraft.trim()}
                      data-testid="button-send-message"
                      className="flex items-center gap-2 rounded-xl bg-[#6aaa72] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#6aaa72]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3.5 w-3.5" /> Send
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
  );
}
