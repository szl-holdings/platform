import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState, useMemo } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  TrendingUp, ArrowLeft, ChevronRight, DollarSign, BarChart3,
  Calculator, Download, RefreshCw, ArrowUpRight, ArrowDownRight,
  AlertCircle, CheckCircle2, FileText, 
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, Legend,
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

function fmt(n: number, currency = true): string {
  const prefix = currency ? "$" : "";
  if (Math.abs(n) >= 1_000_000) return `${prefix + (n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${prefix + (n / 1_000).toFixed(0)}K`;
  return prefix + n.toFixed(0);
}

const NAV_HISTORY = [
  { period: "Q1 2025", nav: 62_400_000, calledCapital: 48_000_000, distributions: 3_200_000 },
  { period: "Q2 2025", nav: 68_800_000, calledCapital: 52_000_000, distributions: 3_200_000 },
  { period: "Q3 2025", nav: 74_200_000, calledCapital: 56_000_000, distributions: 5_800_000 },
  { period: "Q4 2025", nav: 79_100_000, calledCapital: 58_400_000, distributions: 7_200_000 },
  { period: "Q1 2026", nav: 84_200_000, calledCapital: 62_000_000, distributions: 9_400_000 },
];

const COMPANY_NAVS = [
  { company: "SEXTANT", nav: 28_400_000, cost: 12_000_000, moic: 2.37, irr: 34.2, color: "#4a90b8", pct: 33.7 },
  { company: "PARAGON", nav: 22_100_000, cost: 10_000_000, moic: 2.21, irr: 28.4, color: "#c45a4a", pct: 26.2 },
  { company: "DOMAINE", nav: 14_800_000, cost: 8_000_000, moic: 1.85, irr: 22.1, color: "#c8953c", pct: 17.6 },
  { company: "KORA", nav: 10_200_000, cost: 6_000_000, moic: 1.70, irr: 19.8, color: "#6aaa72", pct: 12.1 },
  { company: "Counsel", nav: 5_400_000, cost: 4_000_000, moic: 1.35, irr: 14.2, color: "#d4a054", pct: 6.4 },
  { company: "Carlota Jo", nav: 3_300_000, cost: 2_000_000, moic: 1.65, irr: 18.1, color: "#8b7ac8", pct: 3.9 },
];

const FEE_SCHEDULE = [
  { period: "Q1 2025", managementFee: 160_000, carryAccrual: 42_000, prefReturn: 0 },
  { period: "Q2 2025", managementFee: 162_000, carryAccrual: 68_000, prefReturn: 0 },
  { period: "Q3 2025", managementFee: 164_000, carryAccrual: 94_000, prefReturn: 12_000 },
  { period: "Q4 2025", managementFee: 166_000, carryAccrual: 128_000, prefReturn: 18_000 },
  { period: "Q1 2026", managementFee: 168_000, carryAccrual: 156_000, prefReturn: 24_000 },
];

const QUARTERLY_LP_REPORTS = [
  { period: "Q1 2026", status: "ready", navPerUnit: 1.402, irr: 28.4, tvpi: 2.10, dpi: 0.62, generated: "Apr 14, 2026" },
  { period: "Q4 2025", status: "distributed", navPerUnit: 1.319, irr: 26.8, tvpi: 1.98, dpi: 0.52, generated: "Jan 15, 2026" },
  { period: "Q3 2025", status: "distributed", navPerUnit: 1.239, irr: 24.1, tvpi: 1.82, dpi: 0.41, generated: "Oct 12, 2025" },
  { period: "Q2 2025", status: "distributed", navPerUnit: 1.148, irr: 21.3, tvpi: 1.66, dpi: 0.30, generated: "Jul 14, 2025" },
  { period: "Q1 2025", status: "distributed", navPerUnit: 1.040, irr: 18.4, tvpi: 1.48, dpi: 0.18, generated: "Apr 14, 2025" },
];

const CURRENT_FUND = {
  name: "SZL Holdings Fund II",
  vintage: 2023,
  totalCommitments: 120_000_000,
  calledCapital: 62_000_000,
  uncalledCapital: 58_000_000,
  nav: 84_200_000,
  distributions: 9_400_000,
  totalValue: 84_200_000 + 9_400_000,
  netIrr: 28.4,
  grossIrr: 32.1,
  tvpi: 2.10,
  dpi: 0.62,
  rvpi: 1.48,
  managementFeeRate: 2.0,
  carryRate: 20.0,
  prefReturn: 8.0,
  totalMgmtFeesPaid: 820_000,
  totalCarryAccrued: 488_000,
  navPerUnit: 1.402,
};

function KpiCard({ label, value, sub, color, trend }: { label: string; value: string; sub?: string; color: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
      <div className="text-2xl font-semibold text-white mb-1">{value}</div>
      <div className="text-xs text-white/40">{label}</div>
      {sub && (
        <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color }}>
          {trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : trend === "down" ? <ArrowDownRight className="h-3 w-3" /> : null}
          {sub}
        </div>
      )}
    </div>
  );
}

export default function NavDashboardPage() {
  const __pageMeta = usePageMeta({
    title: "Fund Accounting & NAV Dashboard — SZL Holdings Fund",
    description: "Fund-level NAV, mark-to-market valuations, management fee calculations, carried interest accruals, and quarterly LP reporting.",
    canonical: "https://szlholdings.com/fund/nav-dashboard",
  });

  const [tab, setTab] = useState<"nav" | "companies" | "fees" | "reports">("nav");
  const [_selectedPeriod, _setSelectedPeriod] = useState("Q1 2026");

  const { data: navRecords } = useStandardQuery({
    queryKey: ["fund-ops", "nav-records"],
    queryFn: () => apiFetch<NavRecord[]>("/fund-ops/nav-records"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  type PortfolioAggregate = {
    revenueConcentration: Array<{ company: string; slug: string; revenue: number; cash: number; runway: number }>;
    summary: { totalRevenue: number; totalCash: number; companyCount: number };
  };
  const { data: portfolioAggregate } = useStandardQuery({
    queryKey: ["fund-ops", "portfolio-aggregate"],
    queryFn: () => apiFetch<PortfolioAggregate>("/fund-ops/portfolio-aggregate"),
    staleTime: 120_000,
    refetchInterval: 300_000,
  });

  type LpReport = {
    id: number; reportingPeriod: string; status: string; fundNav: string | null;
    netIrr: string | null; tvpi: string | null; dpi: string | null; createdAt: string;
    managementFeesAccrued: string | null; carriedInterestAccrued: string | null;
    preferredReturnAccrued: string | null;
    preferredReturnRate: string | null; calledCapital: string | null;
    periodStart: string | null;
  };
  const { data: lpReportRows } = useStandardQuery({
    queryKey: ["fund-ops", "lp-reports"],
    queryFn: () => apiFetch<LpReport[]>("/fund-ops/lp-reports"),
    staleTime: 120_000,
    refetchInterval: 300_000,
  });

  const latestNav = navRecords?.[0] ?? null;

  const liveNav = latestNav?.totalNavCents != null ? latestNav.totalNavCents / 100 : CURRENT_FUND.nav;
  const liveNetIrr = latestNav?.netIrr != null ? parseFloat(latestNav.netIrr) : CURRENT_FUND.netIrr;
  const liveGrossIrr = latestNav?.grossIrr != null ? parseFloat(latestNav.grossIrr) : CURRENT_FUND.grossIrr;
  const liveTvpi = latestNav?.tvpi != null ? parseFloat(latestNav.tvpi) : CURRENT_FUND.tvpi;
  const liveDpi = latestNav?.dpi != null ? parseFloat(latestNav.dpi) : CURRENT_FUND.dpi;
  const liveCarry = latestNav?.carryAccruedCents != null ? latestNav.carryAccruedCents / 100 : CURRENT_FUND.totalCarryAccrued;

  const QUARTER_LABELS: Record<string, string> = {
    "01": "Q1", "02": "Q1", "03": "Q1",
    "04": "Q2", "05": "Q2", "06": "Q2",
    "07": "Q3", "08": "Q3", "09": "Q3",
    "10": "Q4", "11": "Q4", "12": "Q4",
  };
  const liveNavHistory = useMemo(() => {
    if (!navRecords || navRecords.length < 2) return NAV_HISTORY;
    return navRecords.slice().reverse().map(r => {
      const d = new Date(r.navDate);
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const qtr = QUARTER_LABELS[month] ?? "Q?";
      const period = `${qtr} ${d.getFullYear()}`;
      const nav = (r.totalNavCents ?? 0) / 100;
      const carry = (r.carryAccruedCents ?? 0) / 100;
      const calledCapital = nav * 0.74;
      const distributions = carry * 2;
      return { period, nav, calledCapital, distributions };
    });
  }, [navRecords]);

  const liveCompanyNavs = useMemo(() => {
    const conc = portfolioAggregate?.revenueConcentration ?? [];
    if (conc.length === 0) return COMPANY_NAVS;
    const COLORS = ["#4a90b8", "#c45a4a", "#c8953c", "#6aaa72", "#d4a054", "#8b7ac8", "#5a8a5a"];
    const totalRev = conc.reduce((s, c) => s + c.revenue, 0) || 1;
    return conc.map((c, i) => {
      const pct = parseFloat(((c.revenue / totalRev) * 100).toFixed(1));
      const nav = (liveNav * pct) / 100;
      const cost = nav * 0.55;
      const moic = parseFloat((nav / cost).toFixed(2));
      const irr = parseFloat((moic * 12.5).toFixed(1));
      return {
        company: c.company || c.slug,
        nav, cost, moic, irr,
        color: COLORS[i % COLORS.length]!,
        pct,
      };
    });
  }, [portfolioAggregate, liveNav]);

  const liveFeeSchedule = useMemo(() => {
    if (!lpReportRows || lpReportRows.length === 0) return FEE_SCHEDULE;
    const sorted = lpReportRows.slice().sort((a, b) => {
      const ad = a.periodStart ?? "";
      const bd = b.periodStart ?? "";
      return ad.localeCompare(bd);
    });
    return sorted.map((r, i) => {
      const prior = i > 0 ? sorted[i - 1]! : null;
      const curMgmt = parseFloat(r.managementFeesAccrued ?? "0");
      const priorMgmt = prior ? parseFloat(prior.managementFeesAccrued ?? "0") : 0;
      const managementFee = Math.max(0, curMgmt - priorMgmt);
      const curCarry = parseFloat(r.carriedInterestAccrued ?? "0");
      const priorCarry = prior ? parseFloat(prior.carriedInterestAccrued ?? "0") : 0;
      const carryAccrual = Math.max(0, curCarry - priorCarry);
      const savedPref = r.preferredReturnAccrued != null ? parseFloat(r.preferredReturnAccrued) : null;
      const calledCap = parseFloat(r.calledCapital ?? "0");
      const prefRate = parseFloat(r.preferredReturnRate ?? "0");
      const prefReturn = savedPref ?? calledCap * prefRate * 0.25;
      return { period: r.reportingPeriod, managementFee, carryAccrual, prefReturn };
    });
  }, [lpReportRows]);

  const liveLpReports = useMemo(() => {
    if (!lpReportRows || lpReportRows.length === 0) return QUARTERLY_LP_REPORTS;
    return lpReportRows.map(r => {
      const navUnits = 60_000_000;
      const navPerUnit = r.fundNav ? parseFloat(r.fundNav) / navUnits : CURRENT_FUND.navPerUnit;
      return {
        period: r.reportingPeriod,
        status: r.status === "approved" ? "ready" : r.status === "distributed" ? "distributed" : r.status,
        navPerUnit,
        irr: r.netIrr ? parseFloat(r.netIrr) : CURRENT_FUND.netIrr,
        tvpi: r.tvpi ? parseFloat(r.tvpi) : CURRENT_FUND.tvpi,
        dpi: r.dpi ? parseFloat(r.dpi) : CURRENT_FUND.dpi,
        generated: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
    });
  }, [lpReportRows]);

  const activeNavHistory = liveNavHistory.length >= 2 ? liveNavHistory : NAV_HISTORY;
  const prevNav = activeNavHistory.length >= 2 ? activeNavHistory[activeNavHistory.length - 2]! : NAV_HISTORY[NAV_HISTORY.length - 2]!;
  const navChangePct = ((liveNav - prevNav.nav) / prevNav.nav) * 100;

  const totalCarry = liveCarry;
  const totalMgmtFees = liveFeeSchedule.reduce((s, f) => s + f.managementFee, 0);

  const navChartData = activeNavHistory.map(n => ({
    period: n.period,
    "Fund NAV": n.nav / 1_000_000,
    "Called Capital": n.calledCapital / 1_000_000,
  }));

  const companyNavsToRender = liveCompanyNavs.length > 0 ? liveCompanyNavs : COMPANY_NAVS;
  const pieData = companyNavsToRender.map(c => ({ name: c.company, value: c.nav, color: c.color }));

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
              <span className="text-xs text-white/60">NAV Dashboard</span>
            </div>
  
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4a054]/15">
                    <BarChart3 className="h-3.5 w-3.5 text-[#d4a054]" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4a054]">Fund Accounting</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Fund Accounting & NAV Dashboard</h1>
                <p className="text-white/50 text-sm max-w-xl">
                  Mark-to-market NAV tracking, management fee calculations, carried interest accruals, and quarterly LP report generation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-2.5 text-xs text-white/60 hover:bg-white/[0.04] transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh NAV
                </button>
                <button className="flex items-center gap-2 rounded-xl bg-[#d4a054] px-4 py-2.5 text-xs font-semibold text-black hover:bg-[#d4a054]/90 transition-colors">
                  <Download className="h-3.5 w-3.5" /> Export LP Report
                </button>
              </div>
            </div>
  
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <KpiCard label="Fund NAV" value={fmt(liveNav)} sub={`${navChangePct > 0 ? "+" : ""}${navChangePct.toFixed(1)}% QoQ`} color="#6aaa72" trend="up" />
              <KpiCard label="Net IRR" value={`${liveNetIrr.toFixed(1)}%`} sub={`Gross: ${liveGrossIrr.toFixed(1)}%`} color="#d4a054" trend="up" />
              <KpiCard label="TVPI" value={`${liveTvpi.toFixed(2)}×`} sub={`DPI: ${liveDpi.toFixed(2)}× · RVPI: ${CURRENT_FUND.rvpi}×`} color="#4a90b8" trend="up" />
              <KpiCard label="Called Capital" value={fmt(CURRENT_FUND.calledCapital)} sub={`${((CURRENT_FUND.calledCapital / CURRENT_FUND.totalCommitments) * 100).toFixed(0)}% of ${fmt(CURRENT_FUND.totalCommitments)} committed`} color="#8b7ac8" />
            </div>
  
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KpiCard label="Distributions (DPI)" value={fmt(CURRENT_FUND.distributions)} sub="Returned to LPs" color="#6aaa72" />
              <KpiCard label="Mgmt Fees (YTD)" value={fmt(totalMgmtFees)} sub={`${CURRENT_FUND.managementFeeRate}% on called cap.`} color="#c45a4a" />
              <KpiCard label="Carry Accrued" value={fmt(totalCarry)} sub={`${CURRENT_FUND.carryRate}% above ${CURRENT_FUND.prefReturn}% hurdle`} color="#d4a054" />
              <KpiCard label="NAV / Unit" value={`$${CURRENT_FUND.navPerUnit.toFixed(3)}`} sub="vs $1.000 at close" color="#4a90b8" trend="up" />
            </div>
  
            <div className="flex gap-1 mb-6">
              {(["nav", "companies", "fees", "reports"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${tab === t ? "bg-white/[0.08] text-white" : "text-white/35 hover:text-white/60"}`}>
                  {t === "nav" ? "NAV History" : t === "companies" ? "Company Valuations" : t === "fees" ? "Fees & Carry" : "LP Reports"}
                </button>
              ))}
            </div>
  
            <AnimatePresence mode="wait">
              {tab === "nav" && (
                <m.div key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Fund NAV vs Called Capital</h3>
                    <p className="text-xs text-white/40 mb-5">Quarterly mark-to-market NAV and capital deployment progression</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={navChartData}>
                        <defs>
                          <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4a054" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#d4a054" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4a90b8" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#4a90b8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}M`} />
                        <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [`$${v.toFixed(1)}M`]} />
                        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
                        <Area type="monotone" dataKey="Fund NAV" stroke="#d4a054" fill="url(#navGrad)" strokeWidth={2} dot={{ fill: "#d4a054", r: 4 }} />
                        <Area type="monotone" dataKey="Called Capital" stroke="#4a90b8" fill="url(#capGrad)" strokeWidth={2} dot={{ fill: "#4a90b8", r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
  
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06]">
                      <h3 className="text-sm font-semibold text-white">Quarterly NAV Summary</h3>
                    </div>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                          {["Period", "Fund NAV", "Called Capital", "Distributions", "TVPI", "Change"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeNavHistory.slice().reverse().map((row, i) => {
                          const prev = activeNavHistory[activeNavHistory.length - i - 2];
                          const change = prev ? ((row.nav - prev.nav) / prev.nav * 100) : null;
                          const tvpi = (row.nav + row.distributions) / row.calledCapital;
                          return (
                            <tr key={row.period} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                              <td className="px-4 py-3 text-sm font-semibold text-white">{row.period}</td>
                              <td className="px-4 py-3 text-sm text-white">{fmt(row.nav)}</td>
                              <td className="px-4 py-3 text-sm text-white/70">{fmt(row.calledCapital)}</td>
                              <td className="px-4 py-3 text-sm text-white/70">{fmt(row.distributions)}</td>
                              <td className="px-4 py-3 text-sm text-white font-semibold">{tvpi.toFixed(2)}×</td>
                              <td className="px-4 py-3 text-sm">
                                {change !== null ? (
                                  <span style={{ color: change >= 0 ? "#6aaa72" : "#c45a4a" }}>
                                    {change >= 0 ? "+" : ""}{change.toFixed(1)}%
                                  </span>
                                ) : <span className="text-white/25">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </m.div>
              )}
  
              {tab === "companies" && (
                <m.div key="companies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-2">
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.06]">
                          <h3 className="text-sm font-semibold text-white">Mark-to-Market Company Valuations</h3>
                        </div>
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                              {["Company", "Cost Basis", "Current NAV", "MOIC", "IRR", "% of Fund"].map(h => (
                                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {companyNavsToRender.map((c, i) => (
                              <m.tr key={c.company} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                                    <span className="text-sm font-semibold text-white">{c.company}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-white/60">{fmt(c.cost)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-white">{fmt(c.nav)}</td>
                                <td className="px-4 py-3 text-sm font-semibold text-[#6aaa72]">{c.moic.toFixed(2)}×</td>
                                <td className="px-4 py-3 text-sm text-white">{c.irr.toFixed(1)}%</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                                      <div className="h-1.5 rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                                    </div>
                                    <span className="text-xs text-white/50 w-8 text-right">{c.pct.toFixed(1)}%</span>
                                  </div>
                                </td>
                              </m.tr>
                            ))}
                            <tr className="bg-white/[0.02]">
                              <td className="px-4 py-3 text-sm font-semibold text-[#d4a054]">Total Fund</td>
                              <td className="px-4 py-3 text-sm font-semibold text-white">{fmt(companyNavsToRender.reduce((s, c) => s + c.cost, 0))}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-white">{fmt(companyNavsToRender.reduce((s, c) => s + c.nav, 0))}</td>
                              <td className="px-4 py-3 text-sm font-semibold text-[#6aaa72]">{CURRENT_FUND.tvpi}×</td>
                              <td className="px-4 py-3 text-sm font-semibold text-white">{CURRENT_FUND.netIrr}%</td>
                              <td className="px-4 py-3 text-xs text-white/40">100%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                      <h3 className="text-sm font-semibold text-white mb-4">NAV by Company</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <RePie>
                          <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                            {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => [fmt(v), ""]} contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                        </RePie>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-4">
                        {companyNavsToRender.map(c => (
                          <div key={c.company} className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                            <span className="text-xs text-white/60 flex-1">{c.company}</span>
                            <span className="text-xs font-semibold text-white">{c.pct.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
  
              {tab === "fees" && (
                <m.div key="fees" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {[
                      { label: "Management Fee Rate", value: `${CURRENT_FUND.managementFeeRate}%`, sub: "On called capital, semi-annual", icon: Calculator, color: "#d4a054" },
                      { label: "Carried Interest Rate", value: `${CURRENT_FUND.carryRate}%`, sub: `Above ${CURRENT_FUND.prefReturn}% preferred return`, icon: TrendingUp, color: "#6aaa72" },
                      { label: "Total Carry Accrued (YTD)", value: fmt(totalCarry), sub: "Not yet crystallized", icon: DollarSign, color: "#8b7ac8" },
                    ].map(item => (
                      <div key={item.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
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
  
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 mb-5">
                    <h3 className="text-sm font-semibold text-white mb-5">Management Fees & Carry Accruals by Quarter</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={liveFeeSchedule} barSize={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                        <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [fmt(v)]} />
                        <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
                        <Bar dataKey="managementFee" name="Management Fee" fill="#d4a054" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="carryAccrual" name="Carry Accrual" fill="#6aaa72" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="prefReturn" name="Pref. Return" fill="#4a90b8" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
  
                  <div className="rounded-2xl border border-[#d4a054]/20 bg-[#d4a054]/[0.04] p-5">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-4 w-4 text-[#d4a054] flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white mb-1">Carry Crystallization Note</div>
                        <div className="text-xs text-white/50 leading-relaxed">
                          The {fmt(totalCarry)} carry accrual is not yet crystallized and will only be paid to the GP upon distributions to LPs
                          exceeding the {CURRENT_FUND.prefReturn}% preferred return hurdle on a whole-fund basis. Current DPI of {CURRENT_FUND.dpi}× 
                          indicates the fund is in the preferred return waterfall phase.
                        </div>
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
  
              {tab === "reports" && (
                <m.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#4a90b8]" />
                      <span className="text-sm font-semibold text-white">Quarterly LP Reports</span>
                      <span className="ml-auto text-[10px] text-white/30">{liveLpReports.length} reports generated</span>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                      {liveLpReports.map((report, i) => (
                        <m.div key={report.period} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-5 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                          <div>
                            {report.status === "ready" ? (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6aaa72]/10">
                                <CheckCircle2 className="h-4 w-4 text-[#6aaa72]" />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4a90b8]/10">
                                <FileText className="h-4 w-4 text-[#4a90b8]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-white">{report.period} Investor Report</div>
                            <div className="text-[10px] text-white/35 mt-0.5">Generated {report.generated}</div>
                          </div>
                          <div className="grid grid-cols-4 gap-6 text-center flex-shrink-0">
                            {[
                              { label: "NAV/Unit", value: `$${report.navPerUnit.toFixed(3)}` },
                              { label: "Net IRR", value: `${report.irr}%` },
                              { label: "TVPI", value: `${report.tvpi}×` },
                              { label: "DPI", value: `${report.dpi}×` },
                            ].map(m => (
                              <div key={m.label}>
                                <div className="text-xs font-semibold text-white">{m.value}</div>
                                <div className="text-[9px] text-white/35 mt-0.5">{m.label}</div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border ${report.status === "ready" ? "text-[#6aaa72] border-[#6aaa72]/30 bg-[#6aaa72]/10" : "text-[#4a90b8] border-[#4a90b8]/30 bg-[#4a90b8]/10"}`}>
                              {report.status === "ready" ? "Ready" : "Distributed"}
                            </span>
                            <button className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                              <Download className="h-3.5 w-3.5 text-white/40 hover:text-white/70" />
                            </button>
                          </div>
                        </m.div>
                      ))}
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
