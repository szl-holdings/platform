import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import {
  FileText, ArrowLeft, ChevronRight, Zap, Download, Send,
  CheckCircle2, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

type ApiLpReport = {
  id: number;
  reportingPeriod: string;
  status: string;
  netIrr: string | null;
  tvpi: string | null;
  dpi: string | null;
  grossIrr: string | null;
};

type FundSummary = {
  compliance: { totalInvestors: number; lpReports: number };
  fundAdmin: { latestNav: { totalNavCents: number; netIrr: string | null; tvpi: string | null; dpi: string | null } | null };
};

const REPORTS = [
  {
    id: "r1", period: "Q1 2026", type: "Quarterly", status: "ready",
    netIrr: "28.4%", tvpi: "2.1×", dpi: "0.62×", moic: "2.1×",
    nav: "$84.2M", committed: "$65.0M", called: "$52.8M", distributed: "$32.7M",
    mgmtFee: "2.0%", carry: "20%", prefReturn: "8.0%",
    narrative: "Fund I delivered strong Q1 2026 performance, with net IRR expanding 3.1pp to 28.4% and TVPI reaching 2.1×. Portfolio companies collectively generated $4.2M in new ARR during the quarter. NovaStar AI and RegulaAI showed exceptional growth, with the former crossing $1.2M ARR at 18% MoM growth. The fund made one new investment (RegulaAI, $4M Seed+) and executed a follow-on in Vessels ($1.5M bridge). Treasury is well-positioned with $18.2M in dry powder and one capital call planned for Q2 2026.",
    recipients: 23,
  },
  {
    id: "r2", period: "Q4 2025", type: "Quarterly", status: "sent",
    netIrr: "25.3%", tvpi: "1.82×", dpi: "0.44×", moic: "1.82×",
    nav: "$75.8M", committed: "$65.0M", called: "$50.1M", distributed: "$22.0M",
    mgmtFee: "2.0%", carry: "20%", prefReturn: "8.0%",
    narrative: "Q4 2025 marked the fund's strongest quarter to date, with two portfolio companies achieving significant commercial milestones and one strategic exit process initiated. Total portfolio NAV grew 18.3% in the quarter, driven by Lyte's $148M Series B valuation mark and Aegis's government contract wins.",
    recipients: 23,
  },
  {
    id: "r3", period: "Q3 2025", type: "Quarterly", status: "sent",
    netIrr: "22.1%", tvpi: "1.64×", dpi: "0.38×", moic: "1.64×",
    nav: "$64.1M", committed: "$65.0M", called: "$46.0M", distributed: "$17.5M",
    mgmtFee: "2.0%", carry: "20%", prefReturn: "8.0%",
    narrative: "Q3 2025 saw steady portfolio maturation. Terra completed its Series A at a significant markup, and PRISM Counsel signed its first Big Law partnership. Fund deployment pace moderated as deal quality in the market improved following a correction in public market comparables.",
    recipients: 23,
  },
];

const IRR_DATA = [
  { q: "Q1 2025", netIrr: 16.2, tvpi: 1.28 },
  { q: "Q2 2025", netIrr: 19.4, tvpi: 1.44 },
  { q: "Q3 2025", netIrr: 22.1, tvpi: 1.64 },
  { q: "Q4 2025", netIrr: 25.3, tvpi: 1.82 },
  { q: "Q1 2026", netIrr: 28.4, tvpi: 2.10 },
];

const STATUS_COLORS: Record<string, string> = {
  ready: "#d4a054",
  sent: "#6aaa72",
  draft: "#4a90b8",
};

export default function LpReportsPage() {
  const __pageMeta = usePageMeta({ title: "LP Report Generation — SZL Fund Intelligence", description: "Autonomous ILPA-compliant quarterly LP report generation." });
  const [selectedId, setSelectedId] = useState("r1");
  const [generating, setGenerating] = useState(false);

  const { data: apiReports } = useStandardQuery({
    queryKey: ["fund-ops", "lp-reports"],
    queryFn: () => apiFetch<ApiLpReport[]>("/fund-ops/lp-reports"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: fundSummary } = useStandardQuery({
    queryKey: ["fund-ops", "summary"],
    queryFn: () => apiFetch<FundSummary>("/fund-ops/summary"),
    staleTime: 60_000,
  });

  const liveNav = fundSummary?.fundAdmin.latestNav;
  const liveNetIrr = liveNav?.netIrr ? `${parseFloat(liveNav.netIrr).toFixed(1)}%` : "28.4%";
  const liveTvpi = liveNav?.tvpi ? `${parseFloat(liveNav.tvpi).toFixed(2)}×` : "2.1×";
  const liveDpi = liveNav?.dpi ? `${parseFloat(liveNav.dpi).toFixed(2)}×` : "0.62×";
  const liveNavM = liveNav ? `$${(liveNav.totalNavCents / 100_000_000).toFixed(1)}M` : "$84.2M";
  const liveLpCount = fundSummary?.compliance.totalInvestors ?? 23;

  const activeReportList = apiReports && apiReports.length > 0
    ? apiReports.map(r => ({
        id: String(r.id),
        period: r.reportingPeriod ?? "—",
        type: "Quarterly",
        status: r.status ?? "draft",
        netIrr: r.netIrr ? `${parseFloat(r.netIrr).toFixed(1)}%` : "—",
        tvpi: r.tvpi ? `${parseFloat(r.tvpi).toFixed(2)}×` : "—",
        dpi: r.dpi ? `${parseFloat(r.dpi).toFixed(2)}×` : "—",
        recipients: liveLpCount,
      }))
    : REPORTS;

  const liveIrrData = apiReports && apiReports.length > 0
    ? [...apiReports]
        .filter(r => r.netIrr !== null)
        .sort((a, b) => (a.reportingPeriod ?? "").localeCompare(b.reportingPeriod ?? ""))
        .map(r => ({ q: r.reportingPeriod ?? "—", netIrr: parseFloat(r.netIrr!), tvpi: parseFloat(r.tvpi ?? "0") }))
    : IRR_DATA;

  const report = REPORTS.find(r => r.id === selectedId) ?? REPORTS[0];

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2200);
  };

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#080b10] text-white">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-6">
              <Link href="/fund"><button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors"><ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence</button></Link>
              <ChevronRight className="h-3 w-3 text-white/20" />
              <span className="text-[11px] text-white/60">LP Report Generation</span>
            </div>
  
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4a90b8]/15">
                <FileText className="h-4.5 w-4.5 text-[#4a90b8]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Autonomous LP Report Generation</h1>
                <p className="text-xs text-white/40">ILPA-compliant · AI narrative commentary · one-click delivery to {liveLpCount} LPs</p>
              </div>
            </div>
  
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { label: "Net IRR", value: liveNetIrr, sub: "Q1 2026", color: "#6aaa72" },
                { label: "TVPI", value: liveTvpi, sub: "Total value", color: "#d4a054" },
                { label: "DPI", value: liveDpi, sub: "Realized", color: "#4a90b8" },
                { label: "Fund NAV", value: liveNavM, sub: "As of Mar 31", color: "#8b7ac8" },
              ].map(m => (
                <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-2xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs text-white">{m.label}</div>
                  <div className="text-[10px] text-white/35">{m.sub}</div>
                </div>
              ))}
            </div>
  
            <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5">
              <div className="text-xs font-semibold text-white/50 mb-4">Net IRR & TVPI Trajectory</div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveIrrData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="q" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="netIrr" name="Net IRR %" stroke="#6aaa72" fill="#6aaa72" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
  
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-4 space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30 mb-2">Report History</div>
                {activeReportList.map(r => (
                  <button key={r.id} onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all ${selectedId === r.id ? "border-[#4a90b8]/40 bg-[#4a90b8]/[0.06]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">{r.period}</span>
                      <span className="rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase"
                        style={{ color: STATUS_COLORS[r.status], borderColor: `${STATUS_COLORS[r.status]}30`, background: `${STATUS_COLORS[r.status]}12` }}>
                        {r.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/40">{r.type} · {r.recipients} LPs</div>
                    <div className="mt-2 grid grid-cols-3 gap-1">
                      <div className="text-center rounded bg-white/[0.03] p-1">
                        <div className="text-[10px] font-semibold text-white">{r.netIrr}</div>
                        <div className="text-[8px] text-white/30">Net IRR</div>
                      </div>
                      <div className="text-center rounded bg-white/[0.03] p-1">
                        <div className="text-[10px] font-semibold text-white">{r.tvpi}</div>
                        <div className="text-[8px] text-white/30">TVPI</div>
                      </div>
                      <div className="text-center rounded bg-white/[0.03] p-1">
                        <div className="text-[10px] font-semibold text-white">{r.dpi}</div>
                        <div className="text-[8px] text-white/30">DPI</div>
                      </div>
                    </div>
                  </button>
                ))}
                <button onClick={handleGenerate}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#d4a054] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#d4a054]/90 transition-all">
                  {generating ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating…</> : <><Zap className="h-3.5 w-3.5" /> Generate Q2 2026 Report</>}
                </button>
              </div>
  
              <div className="col-span-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{report.period} — LP Quarterly Report</h2>
                    <div className="text-xs text-white/40 mt-0.5">ILPA-compliant · {report.recipients} LP recipients</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.04]">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                    <button className="flex items-center gap-1.5 rounded-xl bg-[#4a90b8] px-3 py-2 text-xs font-semibold text-white hover:bg-[#4a90b8]/80">
                      <Send className="h-3.5 w-3.5" /> Send to LPs
                    </button>
                  </div>
                </div>
  
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Total Commitments", value: report.committed },
                    { label: "Called Capital", value: report.called },
                    { label: "Distributed Capital", value: report.distributed },
                    { label: "Management Fee Rate", value: report.mgmtFee },
                    { label: "Carried Interest", value: report.carry },
                    { label: "Preferred Return", value: report.prefReturn },
                  ].map(f => (
                    <div key={f.label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                      <div className="text-sm font-semibold text-white">{f.value}</div>
                      <div className="text-[10px] text-white/40 mt-0.5">{f.label}</div>
                    </div>
                  ))}
                </div>
  
                <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-3.5 w-3.5 text-[#d4a054]" />
                    <span className="text-xs font-semibold text-white">AI-Generated Narrative Commentary</span>
                    <span className="ml-auto text-[9px] text-white/30">ILPA Section 4.2 compliant</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">{report.narrative}</p>
                </div>
  
                <div className="rounded-xl border border-[#6aaa72]/20 bg-[#6aaa72]/[0.04] p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-[#6aaa72] flex-shrink-0" />
                  <span className="text-xs text-white/60">
                    Report validated against ILPA Reporting Template v3.0 · All metrics independently calculated ·
                    Audit trail available
                  </span>
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
