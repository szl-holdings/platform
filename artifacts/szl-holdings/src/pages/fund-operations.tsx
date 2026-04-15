import { useState, useEffect } from "react";
import { m } from "framer-motion";
import {
  TrendingUp, DollarSign, Users, FileText, BarChart3, ShieldCheck,
  AlertCircle, CheckCircle2, Clock, Layers, ArrowUpRight, ArrowDownRight,
  PieChart, Activity, Building2, ChevronRight, RefreshCw,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PORTFOLIO_COMPANIES = [
  { slug: "vessels", name: "Vessels", color: "#4a90b8" },
  { slug: "aegis", name: "Aegis", color: "#c45a4a" },
  { slug: "terra", name: "Terra", color: "#c8953c" },
  { slug: "prism-counsel", name: "PRISM Counsel", color: "#d4a054" },
  { slug: "carlota-jo", name: "Carlota Jo", color: "#8b7ac8" },
  { slug: "lyte", name: "Lyte", color: "#6aaa72" },
];

function fmt(n: number, currency = true): string {
  if (n === 0) return currency ? "$0" : "0";
  if (n >= 1_000_000) return (currency ? "$" : "") + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (currency ? "$" : "") + (n / 1_000).toFixed(0) + "K";
  return (currency ? "$" : "") + n.toFixed(0);
}

function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n * 100).toFixed(1) + "%";
}

type SummaryData = {
  compliance: {
    totalInvestors: number;
    verifiedInvestors: number;
    pendingVerification: number;
    formDFilings: number;
    lpReports: number;
  };
  fundAdmin: {
    capitalCalls: number;
    distributions: number;
    latestNav: {
      navDate: string;
      totalNavCents: number;
      calledCapitalCents: number;
      netIrr: string | null;
      tvpi: string | null;
      dpi: string | null;
      rvpi: string | null;
    } | null;
    pendingCapitalCalls: Array<{
      id: number;
      callNumber: number;
      callDate: string;
      dueDate: string;
      totalAmountCents: number;
      fundedAmountCents: number;
      status: string;
      purpose: string;
    }>;
  };
};

type PortfolioFinancial = {
  id: number;
  companySlug: string;
  companyName: string;
  periodLabel: string;
  revenue: string | null;
  burnRate: string | null;
  cashAndEquivalents: string | null;
  runwayMonths: string | null;
  ebitda: string | null;
  netIncome: string | null;
  reportingStatus: string;
};

type CapTableRow = {
  holder: { id: number; name: string; holderType: string };
  sharesByClass: Record<string, number>;
  totalShares: number;
  ownershipPct: number;
};

type CapTableSummary = {
  holders: CapTableRow[];
  shareClasses: Array<{ id: number; name: string; classType: string; issuedShares: string | null }>;
  totalSharesByClass: Record<string, number>;
  fullyDilutedTotal: number;
};

function MetricCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20" style={{ color }}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && trend !== "neutral" && (
          trend === "up"
            ? <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            : <ArrowDownRight className="h-4 w-4 text-red-400" />
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-white/35">{sub}</div>}
    </div>
  );
}

function Section({ title, label, children }: { title: string; label: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-white/[0.07]">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">{label}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    verified: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    filed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    compliant: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    review_needed: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    final: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    draft: "bg-white/[0.06] text-white/50 border-white/10",
    notices_sent: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    fully_funded: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    overdue: "bg-red-500/15 text-red-400 border-red-500/20",
    distributed: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    approved: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  };
  const cls = colors[status] ?? "bg-white/[0.06] text-white/50 border-white/10";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function useApiFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [path]);
  return { data, loading, error, reload: load };
}

export default function FundOperationsPage() {
  usePageMeta({
    title: "Fund Operations — SZL Holdings",
    description: "Real financial data, SEC compliance, cap table, and fund administration command center.",
    canonical: "https://szlholdings.com/fund-operations",
  });

  const { data: summary, loading: summaryLoading, reload: reloadSummary } = useApiFetch<SummaryData>("/fund-ops/summary");
  const { data: financialsData, loading: finLoading } = useApiFetch<{ data: PortfolioFinancial[]; meta: { total: number } }>("/fund-ops/portfolio-financials?limit=50");
  const { data: capTable, loading: capLoading } = useApiFetch<CapTableSummary>("/fund-ops/cap-table-summary");
  const { data: lpReportsData } = useApiFetch<{ data: Array<{ id: number; reportType: string; reportingPeriod: string; status: string; netIrr: string | null; tvpi: string | null; dpi: string | null }> }>("/fund-ops/lp-reports?limit=10");
  const { data: capCallsData } = useApiFetch<{ data: Array<{ id: number; callNumber: number; dueDate: string; totalAmountCents: number; fundedAmountCents: number; status: string; purpose: string }> }>("/fund-ops/capital-calls?limit=10");

  const nav = summary?.fundAdmin.latestNav;
  const financials = financialsData?.data ?? [];
  const lpReports = lpReportsData?.data ?? [];
  const capCalls = capCallsData?.data ?? [];

  const totalRevenue = financials.reduce((s, f) => s + parseFloat(f.revenue ?? "0"), 0);
  const totalBurnRate = financials.reduce((s, f) => s + parseFloat(f.burnRate ?? "0"), 0);
  const avgRunway = financials.length > 0
    ? financials.reduce((s, f) => s + parseFloat(f.runwayMonths ?? "0"), 0) / financials.filter(f => parseFloat(f.runwayMonths ?? "0") > 0).length
    : 0;

  const isLoading = summaryLoading && finLoading && capLoading;

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="border-b border-white/[0.07]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a054]">
                <Activity className="h-3.5 w-3.5" />
                Fund Operations
              </div>
              <div className="mt-5 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    SZL Holdings — Fund Command
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">
                    Real financial data from portfolio companies, SEC compliance status, cap table engine, and fund administration in one unified view.
                  </p>
                </div>
                <button
                  onClick={reloadSummary}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/[0.06]"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </div>
            </m.div>
          </div>
        </section>

        {/* Fund NAV + Performance KPIs */}
        <Section label="Fund Performance" title="Net Asset Value & Return Metrics">
          {nav ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <MetricCard label="Fund NAV" value={fmt(nav.totalNavCents / 100)} icon={DollarSign} color="#d4a054" />
              <MetricCard label="Called Capital" value={fmt(nav.calledCapitalCents / 100)} icon={TrendingUp} color="#4a90b8" />
              <MetricCard label="Net IRR" value={nav.netIrr ? pct(parseFloat(nav.netIrr)) : "—"} icon={BarChart3} color="#6aaa72" />
              <MetricCard label="TVPI" value={nav.tvpi ? `${parseFloat(nav.tvpi).toFixed(2)}x` : "—"} sub="Total Value to Paid-In" icon={Activity} color="#8b7ac8" />
              <MetricCard label="DPI" value={nav.dpi ? `${parseFloat(nav.dpi).toFixed(2)}x` : "—"} sub="Distributions to Paid-In" icon={ArrowUpRight} color="#c45a4a" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              <MetricCard label="Portfolio Companies" value={PORTFOLIO_COMPANIES.length.toString()} icon={Building2} color="#d4a054" />
              <MetricCard label="Total Revenue" value={totalRevenue > 0 ? fmt(totalRevenue) : "No data"} icon={DollarSign} color="#4a90b8" />
              <MetricCard label="Combined Burn Rate" value={totalBurnRate > 0 ? fmt(totalBurnRate) + "/mo" : "No data"} icon={TrendingUp} color="#c45a4a" />
              <MetricCard label="Avg Runway" value={avgRunway > 0 ? `${avgRunway.toFixed(0)} mo` : "No data"} icon={Clock} color="#6aaa72" />
              <MetricCard label="LP Reports Filed" value={String(summary?.compliance.lpReports ?? 0)} icon={FileText} color="#8b7ac8" />
            </div>
          )}
        </Section>

        {/* Portfolio Company Financial Health */}
        <Section label="Portfolio Intelligence" title="Company Financial Health">
          {financials.length > 0 ? (
            <div className="space-y-3">
              {financials.slice(0, 10).map((f, i) => {
                const co = PORTFOLIO_COMPANIES.find(c => c.slug === f.companySlug);
                const color = co?.color ?? "#d4a054";
                const revenue = parseFloat(f.revenue ?? "0");
                const burn = parseFloat(f.burnRate ?? "0");
                const cash = parseFloat(f.cashAndEquivalents ?? "0");
                const runway = parseFloat(f.runwayMonths ?? "0");
                return (
                  <m.div
                    key={f.id}
                    initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                        <div>
                          <div className="text-sm font-semibold text-white">{f.companyName}</div>
                          <div className="text-xs text-white/40">{f.periodLabel}</div>
                        </div>
                      </div>
                      <StatusBadge status={f.reportingStatus} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Revenue</p>
                        <p className="mt-1 text-sm font-semibold text-white">{revenue > 0 ? fmt(revenue) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Burn Rate</p>
                        <p className="mt-1 text-sm font-semibold text-white">{burn > 0 ? fmt(burn) + "/mo" : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Cash</p>
                        <p className="mt-1 text-sm font-semibold text-white">{cash > 0 ? fmt(cash) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Runway</p>
                        <p className="mt-1 text-sm font-semibold text-white">{runway > 0 ? `${runway.toFixed(0)} mo` : "—"}</p>
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No financial data yet"
              description="Use the data ingestion API to submit portfolio company financials. Each company submits P&L, balance sheet, and cash flow data per reporting period."
              endpoint="POST /api/fund-ops/portfolio-financials"
            />
          )}
        </Section>

        {/* SEC Compliance */}
        <Section label="SEC Compliance" title="Regulatory Status & Accredited Investor Registry">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <MetricCard label="Registered LPs" value={String(summary?.compliance.totalInvestors ?? 0)} icon={Users} color="#4a90b8" />
            <MetricCard label="Verified Accredited" value={String(summary?.compliance.verifiedInvestors ?? 0)} icon={ShieldCheck} color="#6aaa72" />
            <MetricCard label="Pending Verification" value={String(summary?.compliance.pendingVerification ?? 0)} icon={AlertCircle} color="#c8953c" />
            <MetricCard label="Form D Filings" value={String(summary?.compliance.formDFilings ?? 0)} icon={FileText} color="#8b7ac8" />
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Reg D Compliance Checklist</h3>
              <StatusBadge status={summary?.compliance.formDFilings ? "filed" : "pending"} />
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Form D filing on file", done: (summary?.compliance.formDFilings ?? 0) > 0 },
                { label: "Accredited investor verification records", done: (summary?.compliance.verifiedInvestors ?? 0) > 0 },
                { label: "LP report — most recent period", done: (summary?.compliance.lpReports ?? 0) > 0 },
                { label: "Capital call notices documented", done: (summary?.fundAdmin.capitalCalls ?? 0) > 0 },
                { label: "Distribution waterfall calculations on file", done: (summary?.fundAdmin.distributions ?? 0) > 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                  {item.done
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    : <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  }
                  <span className="text-sm text-white/70">{item.label}</span>
                  <div className="ml-auto">
                    <StatusBadge status={item.done ? "compliant" : "review_needed"} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* LP Reports */}
        <Section label="LP Reporting" title="Investor Reports & Performance Attribution">
          {lpReports.length > 0 ? (
            <div className="space-y-3">
              {lpReports.map((r, i) => (
                <m.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <FileText className="h-4 w-4 text-white/40" />
                    <div>
                      <div className="text-sm font-semibold text-white capitalize">{r.reportType.replace(/_/g, " ")} — {r.reportingPeriod}</div>
                      <div className="text-xs text-white/40">
                        Net IRR: {r.netIrr ? pct(parseFloat(r.netIrr)) : "—"} ·
                        TVPI: {r.tvpi ? `${parseFloat(r.tvpi).toFixed(2)}x` : "—"} ·
                        DPI: {r.dpi ? `${parseFloat(r.dpi).toFixed(2)}x` : "—"}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </m.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No LP reports yet"
              description="Generate quarterly and annual LP reports with standardized private fund metrics (IRR, TVPI, DPI, RVPI). Reports are versioned, timestamped, and exportable."
              endpoint="POST /api/fund-ops/lp-reports"
            />
          )}
        </Section>

        {/* Cap Table */}
        <Section label="Cap Table Engine" title="Ownership & Equity Register">
          {capTable && capTable.holders.length > 0 ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs text-white/40">
                  {capTable.holders.length} holders · {capTable.fullyDilutedTotal.toLocaleString()} fully diluted shares
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Holder</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Type</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Shares</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Ownership %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {capTable.holders
                      .sort((a, b) => b.ownershipPct - a.ownershipPct)
                      .map((row, i) => (
                        <tr key={row.holder.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                          <td className="px-4 py-3 text-sm font-medium text-white">{row.holder.name}</td>
                          <td className="px-4 py-3 text-xs text-white/45 capitalize">{row.holder.holderType.replace(/_/g, " ")}</td>
                          <td className="px-4 py-3 text-right text-sm text-white">{row.totalShares.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-20 rounded-full bg-white/[0.06]">
                                <div className="h-1.5 rounded-full bg-[#d4a054]" style={{ width: `${Math.min(row.ownershipPct, 100)}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-white w-16 text-right">{row.ownershipPct.toFixed(2)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {capTable.shareClasses.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {capTable.shareClasses.map(sc => (
                    <span key={sc.id} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/55">
                      {sc.name} · {sc.issuedShares ? parseInt(sc.issuedShares).toLocaleString() : "0"} shares
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={PieChart}
              title="Cap table not yet populated"
              description="Add share classes, equity holders, and transactions to build a full transactional cap table with dilution modeling and vesting schedules."
              endpoint="POST /api/fund-ops/share-classes · /api/fund-ops/cap-table-holders · /api/fund-ops/cap-table-transactions"
            />
          )}
        </Section>

        {/* Fund Administration */}
        <Section label="Fund Administration" title="Capital Calls & Distributions">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Capital Calls */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Capital Calls</h3>
              {capCalls.length > 0 ? (
                <div className="space-y-3">
                  {capCalls.map((call) => {
                    const fundedPct = call.totalAmountCents > 0
                      ? (call.fundedAmountCents / call.totalAmountCents) * 100
                      : 0;
                    return (
                      <div key={call.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="text-sm font-semibold text-white">Capital Call #{call.callNumber}</div>
                            <div className="text-xs text-white/40">{call.purpose} · Due {call.dueDate}</div>
                          </div>
                          <StatusBadge status={call.status} />
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                            <div className="h-1.5 rounded-full bg-[#4a90b8]" style={{ width: `${fundedPct}%` }} />
                          </div>
                          <span className="text-xs text-white/50">{fmt(call.fundedAmountCents / 100)} / {fmt(call.totalAmountCents / 100)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-6 text-sm text-white/40 text-center">
                  No capital calls on record
                </div>
              )}
            </div>

            {/* Compliance Quick Status */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white">Administration Status</h3>
              <div className="space-y-3">
                {[
                  {
                    label: "LP Capital Accounts",
                    value: `${summary?.compliance.totalInvestors ?? 0} LPs`,
                    icon: Users,
                    color: "#4a90b8",
                  },
                  {
                    label: "Fund Distributions",
                    value: `${summary?.fundAdmin.distributions ?? 0} on record`,
                    icon: DollarSign,
                    color: "#6aaa72",
                  },
                  {
                    label: "Capital Calls",
                    value: `${summary?.fundAdmin.capitalCalls ?? 0} total`,
                    icon: TrendingUp,
                    color: "#d4a054",
                  },
                  {
                    label: "Latest NAV Date",
                    value: nav?.navDate ?? "Not recorded",
                    icon: Activity,
                    color: "#8b7ac8",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20" style={{ color: item.color }}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-white/40">{item.label}</div>
                        <div className="text-sm font-semibold text-white">{item.value}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/20" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* API Reference */}
        <Section label="Data Ingestion" title="Financial Reporting API Endpoints">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { group: "Portfolio Financials", endpoint: "/api/fund-ops/portfolio-financials", desc: "P&L, balance sheet, cash flow, burn rate per company per period" },
              { group: "Portfolio KPIs", endpoint: "/api/fund-ops/portfolio-kpis", desc: "MRR, ARR, CAC, LTV, churn, NRR, headcount" },
              { group: "Portfolio Aggregate", endpoint: "/api/fund-ops/portfolio-aggregate", desc: "Fund-level rollup with variance and concentration analysis" },
              { group: "SEC — Form D", endpoint: "/api/fund-ops/form-d-filings", desc: "Reg D filing tracking, exemption status, EDGAR links" },
              { group: "Accredited Investors", endpoint: "/api/fund-ops/accredited-investors", desc: "LP verification records, accreditation basis, status" },
              { group: "LP Reports", endpoint: "/api/fund-ops/lp-reports", desc: "Quarterly/annual reports with IRR, TVPI, DPI, RVPI, carry" },
              { group: "Share Classes", endpoint: "/api/fund-ops/share-classes", desc: "Common, Preferred, SAFEs, convertible notes, warrants, options" },
              { group: "Cap Table", endpoint: "/api/fund-ops/cap-table-transactions", desc: "Issuances, transfers, conversions, exercises — immutable audit" },
              { group: "Capital Calls", endpoint: "/api/fund-ops/capital-calls", desc: "Call management, LP line items, funding tracking" },
              { group: "Distributions", endpoint: "/api/fund-ops/distributions", desc: "Waterfall distributions with per-LP line items" },
              { group: "NAV Records", endpoint: "/api/fund-ops/nav-records", desc: "Fund-level NAV snapshots with performance metrics" },
              { group: "Audit Log", endpoint: "/api/fund-ops/audit-log", desc: "Immutable log of every cap table and fund admin mutation" },
            ].map((item) => (
              <div key={item.group} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a054]">{item.group}</span>
                  <Layers className="h-3.5 w-3.5 shrink-0 text-white/20" />
                </div>
                <code className="block text-[11px] text-[#4a90b8] font-mono mb-2">{item.endpoint}</code>
                <p className="text-xs leading-5 text-white/45">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-white/30">
            All endpoints require authentication. SEC disclaimers apply. This system supports audit-ready recordkeeping per Reg D requirements.
            Past performance data does not guarantee future results. IRR, TVPI, DPI, and RVPI calculations follow ILPA/GIPS standards.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, endpoint }: {
  icon: React.ElementType; title: string; description: string; endpoint: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <Icon className="h-6 w-6 text-white/30" />
      </div>
      <h3 className="text-sm font-semibold text-white/60">{title}</h3>
      <p className="mt-2 max-w-sm mx-auto text-xs leading-5 text-white/35">{description}</p>
      <code className="mt-3 inline-block rounded-lg bg-white/[0.04] px-3 py-1.5 text-[10px] font-mono text-[#4a90b8]">{endpoint}</code>
    </div>
  );
}
